import * as THREE from 'three';

export function spawnShips(scene, state, templates, SHIP_COUNT, rand) {
  clearShips(scene, state);
  if (!state._beachZone || !templates.length) return;
  const bz   = state._beachZone;
  const side = bz.side;

  for (let i = 0; i < SHIP_COUNT; i++) {
    if (!templates.length) break;
    const picked    = templates[Math.floor(Math.random() * templates.length)];
    const inner     = picked.scene.clone(true);
    const corrector = new THREE.Group();
    corrector.rotation.y = picked.rotY;
    corrector.add(inner);
    const mesh = new THREE.Group();
    mesh.add(corrector);
    mesh.scale.multiplyScalar(rand(0.5, 0.7));
    mesh.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });

    const along   = rand(bz.shipMinAlong, bz.shipMaxAlong);
    const depth   = rand(bz.shipDepthMin, bz.shipDepthMax);
    const wx      = bz.onZ ? along : depth;
    const wz      = bz.onZ ? depth : along;
    const moveDir = Math.random() < 0.5 ? 1 : -1;
    const facingY = bz.onZ
      ? (moveDir > 0 ? 0 : Math.PI)
      : (moveDir > 0 ? Math.PI / 2 : -Math.PI / 2);

    mesh.position.set(wx, 0, wz);
    mesh.rotation.y = facingY;
    scene.add(mesh);

    state.ships.push({
      mesh, wx, wz,
      speed:      rand(2.0, 4.0),
      moveDir, side,
      onZ:        bz.onZ,
      patrolMin:  bz.shipMinAlong,
      patrolMax:  bz.shipMaxAlong,
      depthFixed: depth,
      bobTimer:   rand(0, Math.PI * 2),
    });
  }
  console.log(`[ship] spawned ${state.ships.length} on side ${side}`);
}

export function clearShips(scene, state) {
  if (!state.ships) return;
  for (const s of state.ships) {
    scene.remove(s.mesh);
    s.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
  state.ships = [];
}

export function updateShips(state, dt, camTarget) {
  if (!state.ships?.length) return;
  for (const s of state.ships) {
    if (!s.mesh) continue;
    s.bobTimer += dt * 0.9;
    s.mesh.position.y = 0.05 + Math.sin(s.bobTimer) * 0.08 + Math.sin(s.bobTimer * 1.7) * 0.04;
    s.mesh.rotation.z = Math.sin(s.bobTimer * 0.7)  * 0.045;
    s.mesh.rotation.x = Math.sin(s.bobTimer * 0.55) * 0.030;

    if (s.onZ) {
      s.wx += s.moveDir * s.speed * dt;
      if (s.wx > s.patrolMax)      { s.wx = s.patrolMax; s.moveDir = -1; s.mesh.rotation.y = Math.PI; }
      else if (s.wx < s.patrolMin) { s.wx = s.patrolMin; s.moveDir =  1; s.mesh.rotation.y = 0; }
      s.mesh.position.x = s.wx;
      s.mesh.position.z = s.depthFixed;
    } else {
      s.wz += s.moveDir * s.speed * dt;
      if (s.wz > s.patrolMax)      { s.wz = s.patrolMax; s.moveDir = -1; s.mesh.rotation.y = -Math.PI / 2; }
      else if (s.wz < s.patrolMin) { s.wz = s.patrolMin; s.moveDir =  1; s.mesh.rotation.y =  Math.PI / 2; }
      s.mesh.position.x = s.depthFixed;
      s.mesh.position.z = s.wz;
    }

    // Distance culling
    if (camTarget) {
      const dx = s.mesh.position.x - camTarget.x;
      const dz = s.mesh.position.z - camTarget.z;
      s.mesh.visible = (dx * dx + dz * dz) <= 200 * 200;
    }
  }
}


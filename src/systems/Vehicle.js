import * as THREE from 'three';
export function spawnVehicle(scene, state, api) {
  const { choice, inBounds, gridToWorld, laneOffset, dirToYaw, makeCar, rand } = api;
  const roads = state.buildings.filter(b => b.type === 'road');
  if (roads.length < 2) return null;
  const start = choice(roads);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const valid = dirs.filter(([dx,dz]) => inBounds(start.x + dx, start.z + dz) && state.grid[start.x + dx][start.z + dz].type === 'road');
  if (!valid.length) return null;
  const [dx, dz] = choice(valid); const wp = gridToWorld(start.x, start.z); const off = laneOffset(dx, dz); const mesh = makeCar();
  mesh.position.set(wp.x + off.ox, 0, wp.z + off.oz); mesh.rotation.y = dirToYaw(dx, dz); const hl = new THREE.PointLight(0xffffaa, 0, 10, 1.5); hl.name = 'headlight'; hl.position.set(0.4, 0.35, 0); mesh.add(hl); scene.add(mesh);
  const nextWP = gridToWorld(start.x + dx, start.z + dz); const nextOff = laneOffset(dx, dz);
  const vehicle = { mesh, gx:start.x, gz:start.z, dx, dz, tx:nextWP.x + nextOff.ox, tz:nextWP.z + nextOff.oz, ngx:start.x + dx, ngz:start.z + dz, speed:rand(2.5, 4), life:rand(20, 40), targetYaw:dirToYaw(dx, dz) };
  state.vehicles.push(vehicle); return vehicle;
}
export function updateVehicles(scene, state, dt, api) {
  const { DN, gridToWorld, laneOffset, dirToYaw, pickNextDirection } = api;
  for (let i = state.vehicles.length - 1; i >= 0; i -= 1) {
    const v = state.vehicles[i]; v.life -= dt; const dxw = v.tx - v.mesh.position.x; const dzw = v.tz - v.mesh.position.z; const dist = Math.hypot(dxw, dzw); const step = v.speed * dt * (DN.weather === 'rain' ? 0.65 : 1);
    if (dist <= step + 0.01) { v.mesh.position.x = v.tx; v.mesh.position.z = v.tz; v.gx = v.ngx; v.gz = v.ngz; const next = pickNextDirection(v); if (!next) { v.life = 0; } else { [v.dx, v.dz] = next; v.ngx = v.gx + v.dx; v.ngz = v.gz + v.dz; const wp = gridToWorld(v.ngx, v.ngz); const off = laneOffset(v.dx, v.dz); v.tx = wp.x + off.ox; v.tz = wp.z + off.oz; v.targetYaw = dirToYaw(v.dx, v.dz); } } else { v.mesh.position.x += (dxw / dist) * step; v.mesh.position.z += (dzw / dist) * step; }
    let dy = v.targetYaw - v.mesh.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; v.mesh.rotation.y += dy * Math.min(1, dt * 10); if (v.life <= 0) { scene.remove(v.mesh); state.vehicles.splice(i, 1); }
  }
}

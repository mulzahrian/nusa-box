import * as THREE from 'three';
let ghostMesh = null, ghostActive = false, ghostTimer = 0;
export function spawnGhostEasterEgg(scene, position) {
  if (ghostActive || ghostMesh) return null;
  ghostMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color:0x88ffcc, transparent:true, opacity:0.4 }));
  ghostMesh.position.copy(position || new THREE.Vector3()); ghostMesh.position.y = 1.5; ghostMesh.add(new THREE.PointLight(0x88ffcc, 0.8, 5)); scene.add(ghostMesh); ghostActive = true; ghostTimer = 0; return ghostMesh;
}
export function despawnGhostEasterEgg(scene) { if (ghostMesh) { scene.remove(ghostMesh); ghostMesh.geometry.dispose(); ghostMesh.material.dispose(); ghostMesh = null; } ghostActive = false; }
export function updateGhostEasterEgg(scene, dayNight, dt) {
  if (!ghostActive || !ghostMesh) return; ghostTimer += dt; ghostMesh.position.y = 1.5 + Math.sin(ghostTimer * 2) * 0.3; ghostMesh.material.opacity = 0.2 + Math.sin(ghostTimer * 3) * 0.2; ghostMesh.rotation.y += dt * 0.5;
  const hour = Number.parseInt(dayNight.clockStr.split(':')[0], 10); const isGhostHour = (hour >= 23 || hour <= 3) && dayNight.isNight; if (ghostTimer > 30 || !isGhostHour) despawnGhostEasterEgg(scene);
}

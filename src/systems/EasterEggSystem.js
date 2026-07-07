/**
 * Easter Egg System - UFO, Ghost, and custom easter eggs
 * Easy to add new easter eggs: just add a new class extending EasterEgg
 */
import { THREE } from '@core/Engine';
import engine from '@core/Engine';
import { rand } from '@utils/helpers';

class EasterEgg {
  constructor(id) {
    this.id = id;
    this.active = false;
    this.mesh = null;
  }
  shouldActivate(hour, gameState) { return false; }
  spawn() {}
  update(dt) {}
  despawn() {
    if (this.mesh) {
      engine.scene.remove(this.mesh);
      this.mesh = null;
    }
    this.active = false;
  }
}

/**
 * UFO - appears at 1 AM over desert/mountain area
 */
class UFOEasterEgg extends EasterEgg {
  constructor() {
    super('ufo');
    this._angle = 0;
    this._centerX = 0;
    this._centerZ = 0;
  }
  
  shouldActivate(hour) {
    return hour === 1;
  }
  
  spawn(desertCenter) {
    if (this.active) return;
    this._centerX = desertCenter?.x || 30;
    this._centerZ = desertCenter?.z || 30;
    
    // UFO mesh - simple saucer
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2, 0.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x888899, emissive: 0x222233 })
    );
    group.add(body);
    
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhongMaterial({ color: 0x88ffaa, emissive: 0x00ff44, transparent: true, opacity: 0.7 })
    );
    dome.position.y = 0.2;
    group.add(dome);
    
    // Light beam
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 8, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    beam.position.y = -4;
    beam.rotation.x = Math.PI;
    group.add(beam);
    
    group.position.set(this._centerX, 15, this._centerZ);
    engine.scene.add(group);
    this.mesh = group;
    this.active = true;
    this._angle = 0;
  }
  
  update(dt) {
    if (!this.active || !this.mesh) return;
    this._angle += dt * 0.3;
    const radius = 12;
    this.mesh.position.x = this._centerX + Math.cos(this._angle) * radius;
    this.mesh.position.z = this._centerZ + Math.sin(this._angle) * radius;
    this.mesh.position.y = 15 + Math.sin(this._angle * 2) * 2;
    this.mesh.rotation.y += dt * 2;
  }
}

/**
 * Ghost - appears in forest at night (23:00 - 03:00)
 */
class GhostEasterEgg extends EasterEgg {
  constructor() {
    super('ghost');
    this._drift = 0;
  }
  
  shouldActivate(hour) {
    return hour >= 23 || hour <= 3;
  }
  
  spawn(forestCenter) {
    if (this.active) return;
    const cx = forestCenter?.x || -20;
    const cz = forestCenter?.z || -20;
    
    const group = new THREE.Group();
    // Ghost body
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 1.2, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.4,
        side: THREE.DoubleSide
      })
    );
    group.add(body);
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.15, 0.3, 0.4);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.15, 0.3, 0.4);
    group.add(eyeR);
    
    group.position.set(cx + rand(-5, 5), 2, cz + rand(-5, 5));
    engine.scene.add(group);
    this.mesh = group;
    this.active = true;
    this._drift = 0;
  }
  
  update(dt) {
    if (!this.active || !this.mesh) return;
    this._drift += dt;
    this.mesh.position.y = 2 + Math.sin(this._drift) * 0.5;
    // Fade in/out
    const opacity = 0.2 + Math.abs(Math.sin(this._drift * 0.5)) * 0.3;
    this.mesh.children[0].material.opacity = opacity;
  }
}

class EasterEggSystem {
  constructor() {
    this.eggs = [
      new UFOEasterEgg(),
      new GhostEasterEgg(),
    ];
  }
  
  /**
   * Add a custom easter egg
   */
  register(egg) {
    this.eggs.push(egg);
  }
  
  update(dt, hour, gameState) {
    for (const egg of this.eggs) {
      const should = egg.shouldActivate(hour, gameState);
      if (should && !egg.active) {
        if (egg.id === 'ufo') egg.spawn(gameState.desertCenter);
        else if (egg.id === 'ghost') egg.spawn(gameState.forestCenter);
        else egg.spawn();
      } else if (!should && egg.active) {
        egg.despawn();
      }
      if (egg.active) egg.update(dt);
    }
  }
  
  clear() {
    for (const egg of this.eggs) {
      egg.despawn();
    }
  }
}

const easterEggSystem = new EasterEggSystem();
export default easterEggSystem;
export { EasterEgg, UFOEasterEgg, GhostEasterEgg };

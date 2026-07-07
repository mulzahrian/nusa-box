/**
 * Vehicle System - cars, taxis, buses, trucks on roads
 */
import { THREE } from '@core/Engine';
import engine from '@core/Engine';
import { rand, randInt, choice } from '@utils/helpers';
import { TILE } from '@core/constants';

// Vehicle types that can be configured
const VEHICLE_TYPES = {
  car:   { speed: 4, color: null, scale: 0.4 },    // random color
  taxi:  { speed: 3.5, color: 0xffdd00, scale: 0.4 },
  bus:   { speed: 2.5, color: 0x2255cc, scale: 0.6 },
  truck: { speed: 2, color: 0x885522, scale: 0.55 },
};

const CAR_COLORS = [
  0xff4444, 0x44ff44, 0x4444ff, 0xffff44,
  0xff44ff, 0x44ffff, 0xffffff, 0x222222,
  0xff8800, 0x8800ff, 0x00ff88, 0x888888,
];

class VehicleSystem {
  constructor() {
    this.vehicles = [];
    this.maxVehicles = 30;
    this._templates = {};
    this._glbModels = {};
  }
  
  setMaxVehicles(max) {
    this.maxVehicles = max;
  }
  
  /**
   * Register a GLB model for a vehicle type
   */
  registerModel(type, model) {
    this._glbModels[type] = model;
  }
  
  /**
   * Create a simple box vehicle (fallback if no GLB)
   */
  _createBoxVehicle(type) {
    const cfg = VEHICLE_TYPES[type] || VEHICLE_TYPES.car;
    const color = cfg.color || choice(CAR_COLORS);
    
    const group = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8 * cfg.scale * 2, 0.4 * cfg.scale * 2, 0.5 * cfg.scale * 2),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = 0.2;
    group.add(body);
    
    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 * cfg.scale * 2, 0.25 * cfg.scale * 2, 0.45 * cfg.scale * 2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    roof.position.y = 0.5;
    group.add(roof);
    
    return group;
  }
  
  spawnVehicle(startPos, path, type = 'car') {
    if (this.vehicles.length >= this.maxVehicles) return null;
    
    const mesh = this._glbModels[type]
      ? this._glbModels[type].clone()
      : this._createBoxVehicle(type);
    
    mesh.position.copy(startPos);
    engine.scene.add(mesh);
    
    const vehicle = {
      mesh,
      type,
      path,
      pathIndex: 0,
      speed: (VEHICLE_TYPES[type]?.speed || 3) * TILE,
      life: 60 + rand(0, 30),
      targetYaw: 0,
    };
    
    this.vehicles.push(vehicle);
    return vehicle;
  }
  
  update(dt) {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.life -= dt;
      
      if (v.life <= 0) {
        engine.scene.remove(v.mesh);
        this.vehicles.splice(i, 1);
        continue;
      }
      
      // Move towards next path point
      if (v.path && v.pathIndex < v.path.length) {
        const target = v.path[v.pathIndex];
        const dx = target.x - v.mesh.position.x;
        const dz = target.z - v.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 0.3) {
          v.pathIndex++;
        } else {
          const step = v.speed * dt;
          v.mesh.position.x += (dx / dist) * Math.min(step, dist);
          v.mesh.position.z += (dz / dist) * Math.min(step, dist);
          v.targetYaw = Math.atan2(dx, dz);
        }
      }
      
      // Smooth rotation
      let dy = v.targetYaw - v.mesh.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      v.mesh.rotation.y += dy * Math.min(1, dt * 10);
    }
  }
  
  clear() {
    for (const v of this.vehicles) {
      engine.scene.remove(v.mesh);
    }
    this.vehicles = [];
  }
}

const vehicleSystem = new VehicleSystem();
export default vehicleSystem;
export { VEHICLE_TYPES, CAR_COLORS };

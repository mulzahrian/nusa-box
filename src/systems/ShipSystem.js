/**
 * Ship System - boats/ships patrolling ocean areas
 */
import { THREE } from '@core/Engine';
import engine from '@core/Engine';
import { rand } from '@utils/helpers';

class ShipSystem {
  constructor() {
    this.ships = [];
    this.maxShips = 5;
    this._bounds = null;
  }
  
  setBounds(minX, maxX, minZ, maxZ) {
    this._bounds = { minX, maxX, minZ, maxZ };
  }
  
  spawnShip(position) {
    if (this.ships.length >= this.maxShips) return null;
    
    const group = new THREE.Group();
    // Hull
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x664422 })
    );
    group.add(hull);
    
    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    cabin.position.set(-0.2, 0.4, 0);
    group.add(cabin);
    
    group.position.copy(position || new THREE.Vector3(0, 0.1, 0));
    engine.scene.add(group);
    
    const ship = {
      mesh: group,
      speed: rand(1, 2.5),
      direction: new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1)).normalize(),
      bobPhase: rand(0, Math.PI * 2),
    };
    this.ships.push(ship);
    return ship;
  }
  
  update(dt) {
    for (const ship of this.ships) {
      // Move
      ship.mesh.position.x += ship.direction.x * ship.speed * dt;
      ship.mesh.position.z += ship.direction.z * ship.speed * dt;
      
      // Bob
      ship.bobPhase += dt * 2;
      ship.mesh.position.y = 0.1 + Math.sin(ship.bobPhase) * 0.05;
      ship.mesh.rotation.z = Math.sin(ship.bobPhase * 0.7) * 0.05;
      
      // Face direction
      ship.mesh.rotation.y = Math.atan2(ship.direction.x, ship.direction.z);
      
      // Bounce off bounds
      if (this._bounds) {
        const p = ship.mesh.position;
        if (p.x < this._bounds.minX || p.x > this._bounds.maxX) {
          ship.direction.x *= -1;
        }
        if (p.z < this._bounds.minZ || p.z > this._bounds.maxZ) {
          ship.direction.z *= -1;
        }
      }
    }
  }
  
  clear() {
    for (const ship of this.ships) {
      engine.scene.remove(ship.mesh);
    }
    this.ships = [];
  }
}

const shipSystem = new ShipSystem();
export default shipSystem;

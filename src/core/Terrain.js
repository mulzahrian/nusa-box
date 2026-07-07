/**
 * Terrain System - procedural terrain mesh generation
 */
import { THREE } from './Engine';
import { fbm } from './Noise';
import { GRID, TILE, HALF } from './constants';
import MAP_BIOME_PROFILES from '@data/biomes';

class TerrainSystem {
  constructor() {
    this.enabled = true;
    this.intensity = 1.0;
    this.maxHeight = 3.5;
    this.mesh = null;
    this.size = 100;
    this._noiseSeed = 100;
    this._groundTint = { r: 0.36, g: 0.72, b: 0.36 };
    this._hasSnow = false;
    this._biomeCfg = null;
  }
  
  applyBiome(mapId) {
    const profile = MAP_BIOME_PROFILES[mapId] || MAP_BIOME_PROFILES.sumatra;
    this.intensity = profile.terrainIntensity;
    this.maxHeight = profile.maxHeight;
    this._noiseSeed = profile.noiseSeed;
    this._groundTint = profile.groundTint;
    this._hasSnow = profile.hasSnow;
    this._biomeCfg = profile;
    return profile;
  }
  
  getHeightAt(wx, wz) {
    if (!this.enabled) return 0;
    const seed = this._noiseSeed || 100;
    const nx = wx / HALF;
    const nz = wz / HALF;
    const distFromCenter = Math.sqrt(nx * nx + nz * nz);
    
    // Falloff near edges
    const falloff = Math.max(0, 1 - distFromCenter * 1.2);
    const noiseVal = fbm(
      nx * 3 + seed * 0.01,
      nz * 3 + seed * 0.01,
      4, 2.0, 0.5
    );
    return noiseVal * this.maxHeight * this.intensity * falloff;
  }
  
  generateMesh(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    
    if (!this.enabled) return null;
    
    const seg = this.size;
    const geo = new THREE.PlaneGeometry(GRID * TILE, GRID * TILE, seg, seg);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const seed = this._noiseSeed || 100;
    const tint = this._groundTint;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.getHeightAt(x, z);
      pos.setY(i, h);
      
      // Vertex colors based on height
      const t = Math.max(0, h / this.maxHeight);
      if (this._hasSnow && h > this.maxHeight * 0.7) {
        // Snow on high peaks
        const snowBlend = (h - this.maxHeight * 0.7) / (this.maxHeight * 0.3);
        colors[i * 3] = tint.r + (1 - tint.r) * snowBlend;
        colors[i * 3 + 1] = tint.g + (1 - tint.g) * snowBlend;
        colors[i * 3 + 2] = tint.b + (1 - tint.b) * snowBlend;
      } else {
        colors[i * 3] = tint.r * (1 - t * 0.3);
        colors[i * 3 + 1] = tint.g * (1 - t * 0.15);
        colors[i * 3 + 2] = tint.b * (1 - t * 0.3);
      }
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.position.y = 0.01;
    scene.add(this.mesh);
    
    return this.mesh;
  }
  
  dispose(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
  }
}

const terrain = new TerrainSystem();
export default terrain;

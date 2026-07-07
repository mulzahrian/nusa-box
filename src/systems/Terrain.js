import * as THREE from 'three';
import { fbm } from './Noise.js';
import { MAP_BIOME_PROFILES } from '../data/biomes.js';

// Module-level scene reference — set via initTerrain()
let _scene = null;
let _HALF  = 50;
let _GRID  = 20;
let _TILE  = 5;

/** Call once after Three.js scene is created */
export function initTerrain(scene, { HALF = 50, GRID = 20, TILE = 5 } = {}) {
  _scene = scene;
  _HALF  = HALF;
  _GRID  = GRID;
  _TILE  = TILE;
}

export const TERRAIN = {
  enabled:     true,
  intensity:   1.0,
  maxHeight:   3.5,
  mesh:        null,
  size:        100,
  _noiseSeed:  100,
  _groundTint: { r: 0.36, g: 0.72, b: 0.36 },
  _hasSnow:    false,

  getHeightAt(wx, wz) {
    if (!this.enabled) return 0;
    const seed = this._noiseSeed || 100;
    const nx = wx / _HALF;
    const nz = wz / _HALF;
    const dist = Math.sqrt(nx * nx + nz * nz);
    const edge = Math.pow(Math.max(0, dist - 0.35) / 0.65, 1.8);
    const large = fbm(wx * 0.012 + seed, wz * 0.012 + seed, 4, 2.0, 0.5);
    const med   = fbm(wx * 0.04  + seed * 0.5, wz * 0.04  + seed * 0.5, 3, 2.0, 0.5) * 0.3;
    const small = fbm(wx * 0.15  + seed * 0.3, wz * 0.15  + seed * 0.3, 2, 2.0, 0.5) * 0.08;
    const base  = edge * 2.5;
    const noise = (large + med + small) * 1.2;
    const h     = (base + noise * (0.3 + edge * 0.7)) * this.intensity * this.maxHeight / 3.5;
    return Math.max(0, Math.min(this.maxHeight * this.intensity, h));
  },

  rebuild() {
    if (!_scene) { console.warn('[Terrain] initTerrain() not called'); return; }
    if (this.mesh) { _scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    if (!this.enabled) return;

    const size = _GRID * _TILE;
    const segs = this.size;
    const geo  = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos    = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const tint   = this._groundTint || { r: 0.36, g: 0.72, b: 0.36 };
    const hasSnow = this._hasSnow || false;
    const snowThreshold = this.maxHeight * this.intensity * 0.6;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.getHeightAt(x, z);
      pos.setY(i, h);

      let r, g, b;
      if (hasSnow && h > snowThreshold) {
        const t = Math.min(1, (h - snowThreshold) / (this.maxHeight * this.intensity * 0.4));
        r = 0.66 + t * 0.30; g = 0.60 + t * 0.35; b = 0.60 + t * 0.38;
      } else if (h < 0.3) {
        r = tint.r; g = tint.g; b = tint.b;
      } else if (h < 1.2) {
        const t = (h - 0.3) / 0.9;
        r = tint.r + t * 0.15; g = tint.g - t * 0.15; b = tint.b - t * 0.1;
      } else if (h < 2.2) {
        const t = (h - 1.2) / 1.0;
        r = tint.r + 0.15 + t * 0.15; g = tint.g - 0.15 - t * 0.15; b = tint.b - 0.1 - t * 0.05;
      } else {
        const t = Math.min(1, (h - 2.2) / 1.3);
        r = 0.66 + t * 0.25; g = 0.42 + t * 0.45; b = 0.21 + t * 0.65;
      }

      const cn = fbm(x * 0.3, z * 0.3, 2, 2.0, 0.5) * 0.08;
      colors[i * 3]     = Math.max(0, Math.min(1, r + cn));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g + cn));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b + cn));
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    this.mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      vertexColors: true,
      polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,
    }));
    this.mesh.receiveShadow = true;
    _scene.add(this.mesh);
    console.log(`[terrain] rebuilt ${segs}×${segs}`);
  },
};

export function applyBiomeToTerrain(mapId) {
  const p = MAP_BIOME_PROFILES[mapId] || MAP_BIOME_PROFILES.sumatra;
  TERRAIN.intensity    = p.terrainIntensity;
  TERRAIN.maxHeight    = p.maxHeight;
  TERRAIN._noiseSeed   = p.noiseSeed;
  TERRAIN._groundTint  = p.groundTint;
  TERRAIN._hasSnow     = p.hasSnow;
  return p;
}

export function makeGrassTexture(biomeId) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const palettes = {
    sumatra:    { base:'#5cb85c', greens:['#4cae4c','#5cb85c','#6ec96e','#3d9a3d','#72c272','#449944','#7dd87d','#3a8a3a'], dirt:true  },
    jawa:       { base:'#3d8a3d', greens:['#2d7a2d','#3d8a3d','#4d9a4d','#1d6a1d','#55a855','#2d7a2d','#4d9a3d','#1d6a2d'], dirt:false },
    kalimantan: { base:'#2d7a2d', greens:['#1d6a1d','#2d7a2d','#3d8a2d','#0d5a0d','#4d9a3d','#1d6a0d','#3d8a1d','#0d5a1d'], dirt:false },
    sulawesi:   { base:'#5cc85c', greens:['#5cb85c','#6cd86c','#7ce87c','#4ca84c','#8cf88c','#5cb86c','#6cd85c','#4ca85c'], dirt:true  },
    papua:      { base:'#4ca84c', greens:['#3d9a3d','#4ca84c','#5cb85c','#2d8a2d','#6cc86c','#3d9a2d','#4ca83d','#2d8a3d'], dirt:true  },
  };
  const pal = palettes[biomeId] || palettes.sumatra;
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = pal.greens[Math.floor(Math.random() * pal.greens.length)];
    ctx.globalAlpha = 0.55 + Math.random() * 0.45;
    ctx.fillRect(Math.random() * S, Math.random() * S, Math.random() * 3 + 1, Math.random() * 4 + 2);
  }
  if (pal.dirt) {
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 30 | 0},${90 + Math.random() * 20 | 0},${50 + Math.random() * 20 | 0},0.18)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * S, Math.random() * S, Math.random() * 5 + 2, Math.random() * 4 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}

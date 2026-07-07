/**
 * Core Three.js Engine - Scene, Camera, Renderer, Lights
 * This is a singleton module that manages the 3D scene
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PIXEL_SCALE } from './constants';

class Engine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
    this.gltfLoader = new GLTFLoader();
    
    // Lights
    this.ambient = null;
    this.sun = null;
    this.moon = null;
    this.hemi = null;
    
    // Camera control
    this.camTarget = new THREE.Vector3(0, 0, 0);
    this.camDist = 60;
    this.camAngle = Math.PI / 4;
    this.camPitch = Math.PI / 4;
    
    // Animation
    this._animId = null;
    this._clock = new THREE.Clock();
    this._updateCallbacks = [];
  }
  
  init(canvasElement) {
    this.canvas = canvasElement;
    
    // Renderer - pixelated style
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(
      window.innerWidth * PIXEL_SCALE,
      window.innerHeight * PIXEL_SCALE,
      false
    );
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.imageRendering = 'pixelated';
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 240);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.updateCamera();
    
    // Lights
    this.ambient = new THREE.AmbientLight(0xffffff, 1.05);
    this.scene.add(this.ambient);
    
    this.sun = new THREE.DirectionalLight(0xfff5cc, 1.6);
    this.sun.position.set(50, 90, 40);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(512, 512);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 600;
    this.scene.add(this.sun);
    
    this.hemi = new THREE.HemisphereLight(0xd4eeff, 0x88cc66, 0.6);
    this.scene.add(this.hemi);
    
    this.moon = new THREE.DirectionalLight(0x6688cc, 0);
    this.moon.position.set(-50, 60, -30);
    this.scene.add(this.moon);
    
    // Resize handler
    window.addEventListener('resize', () => this.onResize());
    
    return this;
  }
  
  updateCamera() {
    this.camera.position.x = this.camTarget.x + Math.cos(this.camAngle) * Math.cos(this.camPitch) * this.camDist;
    this.camera.position.z = this.camTarget.z + Math.sin(this.camAngle) * Math.cos(this.camPitch) * this.camDist;
    this.camera.position.y = this.camTarget.y + Math.sin(this.camPitch) * this.camDist;
    this.camera.lookAt(this.camTarget);
  }
  
  updateShadowFrustum(landSize, tileSize) {
    const half = (landSize * tileSize) / 2 + 15;
    this.sun.shadow.camera.left = -half;
    this.sun.shadow.camera.right = half;
    this.sun.shadow.camera.top = half;
    this.sun.shadow.camera.bottom = -half;
    this.sun.shadow.camera.updateProjectionMatrix();
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      window.innerWidth * PIXEL_SCALE,
      window.innerHeight * PIXEL_SCALE,
      false
    );
  }
  
  onUpdate(callback) {
    this._updateCallbacks.push(callback);
    return () => {
      this._updateCallbacks = this._updateCallbacks.filter(c => c !== callback);
    };
  }
  
  startLoop() {
    if (this._animId) return;
    const loop = () => {
      this._animId = requestAnimationFrame(loop);
      const dt = this._clock.getDelta();
      for (const cb of this._updateCallbacks) {
        cb(dt);
      }
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
  
  stopLoop() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }
  
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }
  
  dispose() {
    this.stopLoop();
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onResize);
  }
}

// Singleton
const engine = new Engine();
export default engine;
export { THREE, GLTFLoader, SkeletonUtils };

/**
 * Day/Night & Weather System
 */
import { THREE } from '@core/Engine';
import engine from '@core/Engine';
import { DAY_CYCLE } from '@core/constants';

// Keyframes: [timeNorm, skyColor, fogColor, fogNear, fogFar, ambColor, ambI, sunI, moonI]
const DN_KEYS = [
  [0.00, 0x0a0a1a, 0x060610, 20, 70,  0x111133, 0.15, 0,    0.5],  // midnight
  [0.15, 0x0f0f2a, 0x0a0a20, 25, 80,  0x1a1a44, 0.20, 0,    0.4],  // 03:00
  [0.25, 0x6688aa, 0x445566, 40, 120,  0x668899, 0.50, 0.3,  0.1],  // dawn
  [0.33, 0xffcc88, 0xddaa66, 60, 160,  0xffddaa, 0.85, 1.0,  0],    // sunrise
  [0.42, 0x87ceeb, 0x87ceeb, 100, 240, 0xffffff, 1.05, 1.6,  0],    // morning
  [0.58, 0x87ceeb, 0x87ceeb, 100, 240, 0xffffff, 1.05, 1.6,  0],    // noon
  [0.67, 0xffbb77, 0xddaa66, 80, 180,  0xffddaa, 0.90, 1.2,  0],    // sunset
  [0.75, 0x443355, 0x221133, 40, 100,  0x554466, 0.40, 0.1,  0.2],  // dusk
  [0.83, 0x151525, 0x0a0a18, 25, 80,   0x222244, 0.20, 0,    0.5],  // night
  [1.00, 0x0a0a1a, 0x060610, 20, 70,   0x111133, 0.15, 0,    0.5],  // midnight wrap
];

class DayNightSystem {
  constructor() {
    this.CYCLE = DAY_CYCLE;
    this.elapsed = this.CYCLE * 0.42; // start at morning
    this.dayT = 0.42;
    this.weather = 'clear';
    this.isNight = false;
    this.hour = 8;
    this.biomeTint = null; // { skyColor, fogColor }
  }
  
  setBiomeTint(skyColor, fogColor) {
    this.biomeTint = { skyColor, fogColor };
  }
  
  update(dt, speed = 1) {
    this.elapsed = (this.elapsed + dt * speed) % this.CYCLE;
    const t = this.elapsed / this.CYCLE;
    this.dayT = t;
    this.hour = Math.floor(t * 24);
    this.isNight = t < 0.25 || t > 0.75;
    
    // Find keyframe bracket
    let kA = DN_KEYS[0], kB = DN_KEYS[1];
    for (let i = 0; i < DN_KEYS.length - 1; i++) {
      if (t >= DN_KEYS[i][0] && t <= DN_KEYS[i + 1][0]) {
        kA = DN_KEYS[i]; kB = DN_KEYS[i + 1]; break;
      }
    }
    const span = kB[0] - kA[0];
    const f = span < 0.00001 ? 0 : Math.min(1, (t - kA[0]) / span);
    
    // Interpolate
    const skyC = new THREE.Color(kA[1]).lerp(new THREE.Color(kB[1]), f);
    const fogC = new THREE.Color(kA[2]).lerp(new THREE.Color(kB[2]), f);
    const fogN = kA[3] + (kB[3] - kA[3]) * f;
    const fogF = kA[4] + (kB[4] - kA[4]) * f;
    const ambC = new THREE.Color(kA[5]).lerp(new THREE.Color(kB[5]), f);
    const ambI = kA[6] + (kB[6] - kA[6]) * f;
    let sunI = kA[7] + (kB[7] - kA[7]) * f;
    const moonI = kA[8] + (kB[8] - kA[8]) * f;
    
    // Apply biome tint during day
    if (this.biomeTint && !this.isNight) {
      skyC.lerp(new THREE.Color(this.biomeTint.skyColor), 0.25);
      fogC.lerp(new THREE.Color(this.biomeTint.fogColor), 0.25);
    }
    
    // Weather modifiers
    if (this.weather === 'rain') {
      skyC.lerp(new THREE.Color(this.isNight ? 0x08070a : 0x4a4a5a), 0.55);
      fogC.lerp(new THREE.Color(this.isNight ? 0x060608 : 0x3d3d4a), 0.60);
    }
    
    // Apply to scene
    const { scene } = engine;
    if (scene) {
      scene.background.copy(skyC);
      scene.fog.color.copy(fogC);
      scene.fog.near = this.weather === 'rain' ? fogN * 0.6 : fogN;
      scene.fog.far = this.weather === 'rain' ? Math.min(fogF, this.isNight ? 80 : 110) : fogF;
    }
    
    // Apply to lights
    if (engine.ambient) {
      engine.ambient.color.copy(ambC);
      engine.ambient.intensity = this.weather === 'rain' ? ambI * 0.6 : ambI;
    }
    if (engine.sun) {
      engine.sun.intensity = this.weather === 'rain' ? sunI * 0.2 : sunI;
      if (sunI > 0) {
        const angle = (t - 0.5) * Math.PI;
        engine.sun.position.set(
          Math.cos(angle) * 80,
          Math.max(5, Math.sin(angle + Math.PI * 0.5) * 90),
          -20
        );
      }
    }
    if (engine.moon) {
      engine.moon.intensity = moonI;
    }
  }
  
  getTimeString() {
    const totalMinutes = Math.floor(this.dayT * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  
  getTimePeriod() {
    const h = this.hour;
    if (h >= 5 && h < 10) return 'pagi';
    if (h >= 10 && h < 15) return 'siang';
    if (h >= 15 && h < 18) return 'sore';
    if (h >= 18 && h < 24) return 'malam';
    return 'tengah malam';
  }
}

const dayNight = new DayNightSystem();
export default dayNight;

import * as THREE from 'three';
export const DayNight = {
  elapsed: 0,
  CYCLE: 10800,
  DAY_END: 7200,
  weather: 'clear',
  rainRemaining: 0,
  nextWeather: 300,
  rainMesh: null,
  rainVerts: null,
  rainGeo: null,
  get t() { return this.elapsed / this.CYCLE; },
  get isNight() { return this.elapsed >= this.DAY_END; },
  get dayT() { return this.isNight ? 1 : this.elapsed / this.DAY_END; },
  get nightT() { return this.isNight ? (this.elapsed - this.DAY_END) / (this.CYCLE - this.DAY_END) : 0; },
  get clockStr() {
    if (!this.isNight) {
      const m = Math.floor(this.dayT * 840);
      return `${String(6 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    }
    const m = Math.floor(this.nightT * 600);
    const h = (20 + Math.floor(m / 60)) % 24;
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  },
};
export const DAY_NIGHT_KEYS = [[0,0xff9966,0xffaa80,70,200,0xff8855,0.35,0.4,0],[0.037,0xffd0a0,0xffdcbb,75,230,0xffcc88,0.65,0.9,0],[0.083,0x87ceeb,0xa0d8f0,85,250,0xffffff,0.88,1.3,0],[0.167,0x4db8e8,0x87ceeb,95,265,0xffffff,1.1,1.6,0],[0.5,0x44aae0,0x87ceeb,95,265,0xffffff,1.1,1.6,0],[0.58,0x88bbdd,0xaaccee,85,240,0xffffff,0.95,1.3,0],[0.62,0xffaa55,0xffbb88,75,220,0xffcc88,0.75,0.9,0],[0.65,0xff6633,0xff8855,60,190,0xff9966,0.45,0.55,0],[0.667,0x220a14,0x100510,50,160,0x334477,0.18,0,0.1],[0.7,0x0a0820,0x06050c,70,200,0x1a2288,0.13,0,0.28],[0.833,0x080618,0x06040f,80,225,0x121a66,0.11,0,0.32],[0.95,0x080618,0x060410,80,220,0x121a66,0.11,0,0.28],[1,0xff9966,0xffaa80,70,200,0xff8855,0.35,0.4,0]];
export { THREE };

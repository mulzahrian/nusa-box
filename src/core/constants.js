/**
 * Game configuration constants
 */

export const GRID = 100;          // grid size NxN
export const TILE = 2;            // world units per tile
export const HALF = (GRID * TILE) / 2;
export const PIXEL_SCALE = 0.4;   // pixelated render scale
export const CONSTRUCTION_TIME = 25; // seconds per building
export const DAY_CYCLE = 10800;   // real-seconds for full day cycle

export const DEFAULT_SETTINGS = { lang: 'id', sound: true };

export const MAP_IDS = ['sumatra', 'jawa', 'kalimantan', 'sulawesi', 'papua'];

export const MAP_NAMES = {
  sumatra: 'Sumatra',
  jawa: 'Jawa',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  papua: 'Papua',
};

// =============================================================
// City Empire: Modern Metropolis
// Single-file Three.js city builder
// =============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { MAP_BIOME_PROFILES } from './src/data/biomes.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createBuildingCatalog } from './src/data/buildings.js';
import { DISASTER_TYPES } from './src/data/events.js';
import { getLevelsForMap } from './src/systems/Mission.js';
import { fbm } from './src/systems/Noise.js';
import { DayNight, DAY_NIGHT_KEYS } from './src/systems/DayNight.js';
import { TERRAIN, makeGrassTexture, initTerrain, applyBiomeToTerrain } from './src/systems/Terrain.js';
import { spawnShips as _spawnShipsModule, clearShips as _clearShipsModule, updateShips as _updateShipsModule } from './src/systems/Ship.js';
import {
  mergeBuildings, getExtraVehiclesByType,
  getAvailableSideMissions, getBuildingEvent,
  getCheatEasterEgg, getDateEasterEgg, getMinigamesForBuilding,
  REGISTRY_MINIGAMES, SEQUENCE_EASTER_EGGS, getTimeEasterEggs,
  REGISTRY_ANIMALS, getAnimalsForZone, getAnimalById, CLICK_EASTER_EGGS,
} from './src/systems/Registry.js';
import { launchMinigame } from './src/minigames/index.js';

// ==================== SETTINGS & LANGUAGE ====================
const _DEF_SETTINGS = { lang: 'id', sound: true };
const _SET = (() => {
  try { return Object.assign({}, _DEF_SETTINGS, JSON.parse(localStorage.getItem('city-settings') || '{}')); }
  catch(e){ return Object.assign({}, _DEF_SETTINGS); }
})();
function saveSET(){ localStorage.setItem('city-settings', JSON.stringify(_SET)); }

// Language strings -- add more keys here as needed
const LANG = {
  en: {
    new_game: 'New Game',       continue: 'Continue',
    sandbox:  'Sandbox Mode',   scenario: 'Scenario Mode',
    multi:    'Multiplayer',    settings: 'Settings',
    settings_title: 'Settings',
    lang_label: 'Language',     lang_en: 'English', lang_id: 'Indonesian',
    sound_label: 'Sound',       sound_on: 'On',     sound_off: 'Off',
    close: 'Close',
    version: 'v1.0 -- Alpha',
    subtitle: 'Sandbox City Builder',
  },
  id: {
    new_game: 'Game Baru',      continue: 'Lanjutkan',
    sandbox:  'Mode Bebas',     scenario: 'Mode Skenario',
    multi:    'Multipemain',    settings: 'Pengaturan',
    settings_title: 'Pengaturan',
    lang_label: 'Bahasa',       lang_en: 'Inggris',  lang_id: 'Indonesia',
    sound_label: 'Suara',       sound_on: 'Aktif',   sound_off: 'Nonaktif',
    close: 'Tutup',
    version: 'v1.0 -- Alfa',
    subtitle: 'Pembangun Kota Sandbox',
  },
};
// Shorthand: LT('key') returns string in current language
function LT(key){ return (LANG[_SET.lang] || LANG.id)[key] || key; }

// -------------------- CONFIG --------------------
const GRID = 100;          // grid size NxN (max purchasable map area)
const TILE = 2;           // world units per tile
const HALF = (GRID * TILE) / 2;

// ===== PIXEL ART ICON SYSTEM =====
const _P={'_':null,'0':'#000','1':'#111','D':'#444','d':'#555','G':'#888','g':'#aaa','W':'#fff','w':'#ddd','Y':'#ffe600','y':'#aa9900','R':'#ff4444','r':'#882222','B':'#44aaff','b':'#2244bb','C':'#00e5ff','c':'#006688','P':'#cc44ff','p':'#660099','O':'#ff8800','o':'#884400','N':'#00dd66','n':'#006633','T':'#cc9966','t':'#886633','K':'#553311','k':'#221100','S':'#88ccff','s':'#3366aa','M':'#ff44cc','m':'#880066','L':'#88ff00','l':'#448800','E':'#ffff44','e':'#888800','A':'#ff9944','a':'#cc6600','Q':'#00ffff','q':'#008888','V':'#55ee88','v':'#227744','F':'#ff6644','f':'#882200','H':'#6699ff','h':'#334488','Z':'#ffccaa','z':'#cc8866','X':'#ff88ff','x':'#660066','I':'#ffddbb','i':'#aa7744'};
const _IC={
  road:       ['DDDDDDDD','GGGGGGGG','G__YY__G','G______G','G______G','G__YY__G','GGGGGGGG','DDDDDDDD'],
  railway:    ['DtDGGDtD','DtDGGDtD','TTTTTTTT','DtDGGDtD','DtDGGDtD','TTTTTTTT','DtDGGDtD','DtDGGDtD'],
  res_low:    ['___RR___','__RrRR__','_RrRRRR_','WWWBBWWW','WWWBBWWW','WWWDDWWW','TTTTTTTT','________'],
  res_med:    ['_HHHHHH_','HswwswwH','HswwswwH','HssssssH','HswwswwH','HHHDDHhH','TTTTTTTT','________'],
  res_high:   ['SSSSSSSS','SbWbWbWS','SbbbbbbS','SbWbWbWS','SbbbbbbS','SbWbWbWS','SSDDDDSS','TTTTTTTT'],
  com_shop:   ['_OOOOO__','OOOOOOOO','YYYYYYYY','WwBBwwWW','WwBBwwWW','WWWDDWWW','TTTTTTTT','________'],
  com_mall:   ['RRRRRRRR','RoooooOR','RWWBBWWR','RWWBBWWR','RWWBBWWR','RWWDDWWR','TTTTTTTT','________'],
  ind_office: ['_HHHHHH_','HswwswwH','HswwswwH','HswwswwH','HswwswwH','HHHDDHHH','TTTTTTTT','________'],
  bank:       ['YYYYYYYY','YtIIIItY','YtIIIItY','Yt_BB_tY','Yt_BB_tY','YtDDDDtY','YYYYYYYY','TTTTTTTT'],
  gas_station:['_RRRRRR_','_RaAaAR_','GGGGGGGG','G_OO__GG','G_OO__GG','GGGGGGGG','YAAAAAAY','TTTTTTTT'],
  skyscraper: ['__BBBB__','_BSwwSB_','_BSwwSB_','_BSwwSB_','_BSwwSB_','_BBDDBB_','BBBBBBBB','TTTTTTTT'],
  skyscraper2:['_CCCCCC_','CQwwwwQC','CQwwwwQC','CQwwwwQC','CQwwwwQC','CCDDDDCC','CCCCCCCC','TTTTTTTT'],
  skyscraper3:['_XXXXXX_','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPDDDDPX','TTTTTTTT'],
  ind_factory:['_1___1__','_1___1__','_111111_','G1DDD1GG','GGDDDGGG','RRRRRRGG','RwwwwRRR','TTTTTTTT'],
  park:       ['_N___N__','NNN_NNN_','_N___N__','________','__N_____','_NNN____','__N_____','VVVVVVVV'],
  school:     ['_RRRRRR_','RYYYYYY_','R_R__R_R','R_B__B_R','R_B__B_R','RRDDDRRR','TTTTTTTT','________'],
  hospital:   ['_WWWWWW_','WW_RR_WW','W_RRRR_W','WW_RR_WW','WW____WW','W_B__B_W','WWDDDDWW','TTTTTTTT'],
  police:     ['__BBBB__','_BbSSbB_','BbS__SbB','B_SSSS_B','BBbSSbBB','_BB__BB_','BBDDDDBB','TTTTTTTT'],
  fire:       ['_FFFFFF_','RRRRRRRR','RWWWWWWR','RWWWWWWR','RAAAAAWR','RRRRRRRR','AAAAAAAA','TTTTTTTT'],
  power_coal: ['_1___1__','_1___1__','_111111_','GGGGGGGG','GGGDdDGG','GGGDdDGG','GGGGGGGG','TTTTTTTT'],
  power_solar:['YyYyYyYy','yYyYyYyY','YyYyYyYy','yYyYyYyY','YyYyYyYy','yYyYyYyY','_DDDDDD_','TTTTTTTT'],
  power_wind: ['____W___','__gWW___','__W__gW_','gWWWW___','__W__gW_','__gWW___','____DDDD','TTTTTTTT'],
  water_tile: ['BBbBBbBB','bBBBbBBb','BBbBBBbB','bBBcbBBb','BBBBBBcB','bBBBbBBb','BBcBBBBB','bBBBbBBb'],
  water_pump: ['___BB___','__BBBBB_','_BBBBBBB','_B_BBB_B','_BDDDB_B','__DDDBB_','BBBBBBB_','TTTTTTTT'],
  bus_stop:   ['__OOOO__','_OwwwwO_','OOwwwwOO','OOwwwwOO','_OOooOO_','____OO__','____DD__','TTTTTTTT'],
  metro:      ['PPPPPPPP','PwwwwwwP','P______P','PPPPPPPP','________','_PPPPPP_','_P_DD_P_','TTTTTTTT'],
  airport:    ['___gWg__','_gWWWWg_','gWWWWWWg','_gWWWWg_','GGGGGGGG','GGDDDDGG','GGGGGGGG','TTTTTTTT'],
  bulldoze:   ['__YY____','_YYYYOY_','YYYYYYYY','OYYYYYO_','OOYYYOO_','_OOOOO__','__OOOO__','___OO___'],
  axe:        ['____NNN_','___NnNN_','__NnnNN_','_NnnNNN_','NnnNNN__','NNNN____','NNN_____','NN______'],
  hunt:       ['R_______','RR______','_RRR____','__RRRR__','___RRRR_','____RRRR','_____RRR','______RR'],
  // stats/UI
  ic_money:   ['__YYYY__','_YyYYYY_','YYyyyyyY','YYyYyyyY','YYyYyyyY','YYyyyyyY','_YyYYYY_','__YYYY__'],
  ic_net:     ['___NN___','__NNNN__','_NNNNNN_','NNNNNNNN','___NN___','___NN___','___NN___','___NN___'],
  ic_pop:     ['_ZZ__ZZ_','ZZZZZZZZ','_ZZ__ZZ_','_ZZZZZZ_','ZZZZZZZZ','Z_ZZZZ_Z','__Z__Z__','__Z__Z__'],
  ic_happy:   ['__YYYY__','_YYYYYY_','YYyYyYYY','YYYYYYYY','YY_YY_YY','YYyYYyYY','_YYYYYY_','__YYYY__'],
  ic_traffic: ['________','_RRRRRR_','RRWWWWRR','RRRRRRRR','_o_RR_o_','________','________','________'],
  ic_level:   ['___EE___','_EEEEEE_','EEEEEEEE','EEEEEEEE','_EEEEEE_','__EEEE__','__E__E__','__E__E__'],
  ic_day:     ['_E_EEE_E','__EEEEE_','E_EEE_E_','EEEEEEE_','E_EEE_E_','__EEEEE_','_E_EEE_E','________'],
  ic_sunny:   ['_E_E_E_E','_EEEEE__','E_EEEEE_','EEEEEEE_','E_EEEEE_','_EEEEE__','_E_E_E_E','________'],
  ic_rainy:   ['__GGG___','_GGGGG__','GGGGGGG_','_GGGGG__','B_B_B_B_','_B_B_B_B','B_B_B_B_','________'],
  ic_save:    ['BBBBBBBB','BBYYYY_B','BBYYYY_B','BBYYYY_B','BBBBBBBB','BwwwwwwB','BwwwwwwB','BBBBBBBB'],
  ic_music:   ['__EEE___','__E_EE__','__E__EE_','__E___E_','EEEEE_E_','EEEEEEE_','___EEEE_','___EEE__'],
  ic_moon:    ['__WWWW__','_WW____W','WW_____W','WW_____W','WW_____W','_WW___WW','__WWWWW_','________'],
  ic_clock:   ['__GGGG__','_GGGGGG_','GGWG__GG','GG_W__GG','GG__WWGG','GG____GG','_GGGGGG_','__GGGG__'],
  ic_help:    ['__CCCC__','_CC__CC_','_C___CC_','_C__CC__','_C_CC___','_C______','_C_CC___','__CCCC__'],
  ic_dash:    ['_N______','_N__N___','_N__NN__','_N_NNN__','_N_NNNN_','_NNNNNNN','________','YYYYYYYY'],
  ic_menu:    ['________','WWWWWWWW','WWWWWWWW','________','WWWWWWWW','WWWWWWWW','________','________'],
  ic_pause:   ['WW__WW__','WW__WW__','WW__WW__','WW__WW__','WW__WW__','WW__WW__','WW__WW__','WW__WW__'],
  ic_play:    ['W_______','WWW_____','WWWWW___','WWWWWWW_','WWWWWWW_','WWWWW___','WWW_____','W_______'],
  ic_fast:    ['WW__WW__','WWW_WWW_','WWWWWWWW','WWWWWWWW','WWWWWWWW','WWW_WWW_','WW__WW__','________'],
  ic_faster:  ['WW_WW___','WWWWWW__','WWWWWWWW','WWWWWWWW','WWWWWWWW','WWWWWW__','WW_WW___','________'],
  // categories
  cat_road:   ['DDDDDDDD','GGGGGGGG','G__YY__G','G______G','G______G','G__YY__G','GGGGGGGG','DDDDDDDD'],
  cat_res:    ['___RR___','__RrRR__','_RrRRRR_','WWWBBWWW','WWWBBWWW','WWWDDWWW','TTTTTTTT','________'],
  cat_com:    ['_OOOOO__','OOOOOOOO','YYYYYYYY','WwBBwwWW','WwBBwwWW','WWWDDWWW','TTTTTTTT','________'],
  cat_ind:    ['_1___1__','_1___1__','_111111_','G1DDD1GG','GGDDDGGG','RRRRRRGG','TTTTTTTT','________'],
  cat_util:   ['___EE___','__EEEE__','_EEEEEE_','EEEEEEE_','__EEE___','___EEE__','____EE__','_____E__'],
  cat_pub:    ['___WW___','___WW___','WWWWWWWW','WWWWWWWW','___WW___','___WW___','_TTTTTT_','________'],
  cat_transit:['________','_OOOOOO_','OOwwwwOO','OOwwwwOO','_OOOOOO_','____OO__','_oo__oo_','________'],
  cat_tool:   ['_GGG____','_GGGg___','GGGGg___','GGGGg___','__GGg___','__GGg___','__GGg___','__GGg___'],
  // main menu icons
  mn_new:     ['____TT__','___TTT__','__TTTT__','TTTTTTTT','_TTTTTT_','__TTTT__','___TTT__','____TT__'],
  mn_continue:['________','_N______','_NNN____','_NNNNN__','_NNNNNNNN','_NNNNN__','_NNN____','_N______'],
  mn_sandbox: ['_QqQqQq_','QqQqQqQq','qQqQqQqQ','QqQqQqQq','qQqQqQqQ','QqQqQqQq','qQqQqQqQ','_QqQqQq_'],
  mn_scenario:['___YY___','__YYYY__','_YYYYYY_','YY_YY_YY','YYYYYYYY','_YYYYYY_','__Y__Y__','__Y__Y__'],
  mn_multi:   ['_BB__BB_','BBBBBBBB','BBBBBBB_','__BBBBB_','__BBBBB_','BBBBBBB_','BBBBBBBB','_BB__BB_'],
  mn_settings:['__gGg___','_gGGGg__','gGGGGGg_','GGG__GGG','GGG__GGG','gGGGGGg_','_gGGGg__','__gGg___'],
};
function _pxSVG(rows,size){const h=rows.length,w=rows[0].length,ps=size/w;let r='';for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=rows[y][x];if(c==='_'||c==='.')continue;r+=`<rect x="${(x*ps).toFixed(1)}" y="${(y*ps).toFixed(1)}" width="${ps.toFixed(1)}" height="${ps.toFixed(1)}" fill="${_P[c]??'#f0f'}"/>`;}return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" shape-rendering="crispEdges">${r}</svg>`;}
function pxImg(key,size=24){const rows=_IC[key];if(!rows)return'â“';const uri='data:image/svg+xml;base64,'+btoa(_pxSVG(rows,size));return `<img src="${uri}" width="${size}" height="${size}" style="image-rendering:pixelated;vertical-align:middle;display:inline-block">`;}

// Merge registry buildings (dari config/registry/buildings.json) ke catalog
const { BUILDINGS, CATEGORIES } = createBuildingCatalog(pxImg, mergeBuildings);

const FIRST_NAMES = ['Agus','Budi','Citra','Dewi','Eko','Fitri','Gita','Hadi','Indra','Joko','Kartika','Lina','Made','Nia','Oka','Putri','Rina','Sari','Tono','Udin','Vina','Wahyu','Yuli','Zaki'];
const LAST_NAMES = ['Pratama','Wijaya','Sari','Susanto','Rahman','Hidayat','Saputra','Putra','Lestari','Anggraini'];
const JOBS = ['Programmer','Teacher','Doctor','Engineer','Designer','Manager','Worker','Driver','Chef','Artist'];
const EDUS = ['SD','SMP','SMA','Sarjana','Master'];

// -------------------- MISSION SYSTEM --------------------
const MISSION_LEVELS = new Proxy([], {
  get(_target, prop) {
    const levels = getLevelsForMap(state.mapId);
    const active = levels.length ? levels : getLevelsForMap('sumatra');
    const value = active[prop];
    return typeof value === 'function' ? value.bind(active) : value;
  }
});

// -------------------- STATE --------------------// -------------------- STATE --------------------
const state = {
  running: false,
  paused: false,
  speed: 1,             // 0=pause, 1, 2, 3
  day: 1,
  month: 1,
  year: 2024,
  money: 320000,
  population: 0,
  happiness: 70,
  pollution: 0,
  traffic: 0,
  weather: 'sunny',
  season: 'dry',
  income: 0,
  expense: 0,
  level: 1,
  missionLevel: 1,
  freeMode: false,
  _missionChecked: false,
  _missionShowing: false,
  landSize: 20,
  _landBorderMesh: null,
  _forestZone: null,
  _desertZone: null,
  _desertMesh: null,
  _desertObjects: [],
  _beachZone: null,
  _beachMesh: null,
  _beachTrees: [],
  grid: [],
  buildings: [],
  citizens: [],
  vehicles: [],
  pedestrians: [],
  selected: null,
  placeRotation: 0,
  pending: null,
  selectedBuilding: null,
  minimapMode: 'normal',
  notifications: [],
  power: { gen:0, demand:0 },
  water: { gen:0, demand:0 },
  jobs: { offered:0, taken:0 },
  homes: 0,
  treeCount: 0,
  taxiPassengers: [],
  tickSinceLastDay: 0,
  constructions: [],
  destructions: [],
  // === MAP SYSTEM ===
  mapId: 'sumatra',
  mapName: 'Sumatra',
  unlockedMaps: ['sumatra'],
  // === PERSONAL SYSTEM ===
  personal: {
    corruption: 0,        // 0-100 index korupsi
    health: 100,          // 0-100 kesehatan pribadi
    personalMoney: 50000, // keuangan pribadi (terpisah dari kas kota)
    business: [],         // [{id, name, income, type}]
  },
  // === CHARACTER RELATIONSHIPS ===
  relationships: {
    the_president: 50,
    pak_wiwi: 30,
    acel: 20,
    amil: 40,
    ica: 40,
    adin: 40,
  },
  // === PHONE/EMAIL SYSTEM ===
  phone: {
    emails: [],           // [{id, from, subject, body, read, day, sideMissionId?}]
    socialMedia: [],      // [{id, author, content, image?, day, sentiment}]
  },
  // === SIDE MISSIONS STATE ===
  activeSideMissions: [],
  completedSideMissions: [],
  // === CALENDAR EVENTS ===
  calendarEvents: [],     // [{day, month, title, type, missionId?}]
};

for (let i=0;i<GRID;i++){
  state.grid[i] = [];
  for (let j=0;j<GRID;j++) state.grid[i][j] = { type:null, mesh:null, rotation:0 };
}

// -------------------- UTILS --------------------
const rand = (a,b)=>a+Math.random()*(b-a);
const randInt = (a,b)=>Math.floor(rand(a,b+1));
const choice = arr=>arr[Math.floor(Math.random()*arr.length)];
const fmtMoney = n => (n>=1000?(n/1000).toFixed(n>=10000?0:1)+'k':n.toFixed(0));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

// Noise utilities are now imported from ./src/systems/Noise.js

// Apply biome profile to current map
function applyMapBiome(){
  const profile = applyBiomeToTerrain(state.mapId); // sets TERRAIN intensity/seed/tint/snow
  scene.background = new THREE.Color(profile.skyColor);
  scene.fog = new THREE.Fog(profile.fogColor, 100, 240);
  state._biomeCfg = profile;
}

// ==================== TERRAIN SYSTEM ====================
// TERRAIN & makeGrassTexture imported from src/systems/Terrain.js

// Helper: get terrain height at grid position
function getTerrainHeightAtGrid(gx, gz) {
  const wp = gridToWorld(gx, gz);
  return TERRAIN.getHeightAt(wp.x, wp.z);
}

// -------------------- THREE.JS SETUP --------------------
// ==================== THREE.JS SETUP ====================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); // Matikan antialias agar pixel tajam

// Trik Pixelated: Set resolusi internal menjadi 50% atau 33% dari ukuran asli
const pixelScale = 0.75; // Naik dari 0.4: lebih jelas, object terlihat
renderer.setPixelRatio(1); // Cukup gunakan rasio 1
renderer.setSize(window.innerWidth * pixelScale, window.innerHeight * pixelScale, false);

// Paksa CSS agar menarik canvas ke ukuran penuh layar tanpa blur
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.imageRendering = 'pixelated';
canvas.style.imageRendering = 'crisp-edges';

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap; // Ubah dari PCFSoftShadowMap ke Basic
renderer.outputColorSpace = THREE.SRGBColorSpace;

// (no post-processing needed -- TheoTown style uses direct render)

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 240);
// Initialize Terrain module with scene reference and grid constants
initTerrain(scene, { HALF, GRID, TILE });

// Camera - isometric-ish perspective
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 500);
const camTarget = new THREE.Vector3(0, 0, 0);
let camDist = 60;
let camAngle = Math.PI / 4;
let camPitch = Math.PI / 4;

function updateCamera(){
  camera.position.x = camTarget.x + Math.cos(camAngle) * Math.cos(camPitch) * camDist;
  camera.position.z = camTarget.z + Math.sin(camAngle) * Math.cos(camPitch) * camDist;
  camera.position.y = camTarget.y + Math.sin(camPitch) * camDist;
  camera.lookAt(camTarget);
}
updateCamera();

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 1.05);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff5cc, 1.6);
sun.position.set(50, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(512, 512); // Ganti dari 2048 ke 512
function updateShadowFrustum(){
  const half = (state.landSize * TILE) / 2 + 15;
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half;
  sun.shadow.camera.bottom = -half;
  sun.shadow.camera.updateProjectionMatrix();
}
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 600;
scene.add(sun);

const hemi = new THREE.HemisphereLight(0xd4eeff, 0x88cc66, 0.6);
scene.add(hemi);

// Moon directional light (blue-white, only active at night)
const moon = new THREE.DirectionalLight(0x6688cc, 0);
moon.position.set(-50, 60, -30);
scene.add(moon);

// ==================== DAY / NIGHT / WEATHER SYSTEM ====================
const DN = DayNight;
const _DN_KEYS = DAY_NIGHT_KEYS;

function initRainParticles(){
  const N = 2500, SPREAD = 90, H = 55;
  const pos = new Float32Array(N * 6);
  for(let i=0; i<N; i++){
    const x = rand(-SPREAD, SPREAD), y = rand(0, H), z = rand(-SPREAD, SPREAD);
    const len = rand(0.2, 0.65);
    const b = i*6;
    pos[b]=x;     pos[b+1]=y;     pos[b+2]=z;
    pos[b+3]=x-0.1; pos[b+4]=y-len; pos[b+5]=z+0.05;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xaabbdd, transparent: true, opacity: 0.45, depthWrite: false });
  const mesh = new THREE.LineSegments(geo, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  DN.rainMesh = mesh; DN.rainVerts = pos; DN.rainGeo = geo;
}

// makeGrassTexture imported from src/systems/Terrain.js

// 2. Full-size green ground (always) — playable boundary shown by border mesh only
let groundMat = new THREE.MeshLambertMaterial({ map: makeGrassTexture('sumatra'), polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4 });
let ground = null;
let gridHelper = null;
function updateGroundAndGrid(){
  if (ground){ scene.remove(ground); ground.geometry.dispose(); }
  if (gridHelper){ scene.remove(gridHelper); }
  if (TERRAIN.mesh){ scene.remove(TERRAIN.mesh); TERRAIN.mesh = null; }
  
  // Regenerate grass texture for current map biome
  if(groundMat.map) groundMat.map.dispose();
  groundMat.map = makeGrassTexture(state.mapId);
  groundMat.needsUpdate = true;
  
  // Build terrain if enabled, otherwise flat grass ground
  if (TERRAIN.enabled) {
    TERRAIN.rebuild();
    // Use terrain mesh as the "ground" for raycasting
    ground = TERRAIN.mesh;
  } else {
    const fullSz = GRID * TILE;
    const groundGeo = new THREE.PlaneGeometry(fullSz, fullSz, 1, 1);
    groundMat.map.repeat.set(20, 20);
    groundMat.map.needsUpdate = true;
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }
  
  // Grid lines only over playable land area
  const playSz = state.landSize * TILE;
  gridHelper = new THREE.GridHelper(playSz, state.landSize, 0x000000, 0x000000);
  gridHelper.material.opacity = 0.10;
  gridHelper.material.transparent = true;
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);
}
// Initial ground
updateGroundAndGrid();

// 3. Instanced grass blades -- 2000 tiny quads using InstancedMesh (1 draw call)
(function spawnGrassBlades(){
  const BLADE_COUNT = 2000;
  const bladeGeo = new THREE.PlaneGeometry(0.06, 0.18);
  // Tilt blades upward from ground
  bladeGeo.rotateX(-Math.PI/2);
  // Shift pivot to base of blade
  bladeGeo.translate(0, 0.09, 0);
  // Two crossed quads per blade for volume (merge into one buffer)
  const bladeGeo2 = bladeGeo.clone();
  bladeGeo2.rotateY(Math.PI/2);
  const merged = mergeGeometries([bladeGeo, bladeGeo2]);

  const bladeMat = new THREE.MeshLambertMaterial({
    color: 0x4cae4c, side: THREE.DoubleSide,
    alphaTest: 0.1
  });
  const iMesh = new THREE.InstancedMesh(merged || bladeGeo, bladeMat, BLADE_COUNT);
  iMesh.receiveShadow = false;
  iMesh.castShadow = false;

  const dummy = new THREE.Object3D();
  const TOTAL = GRID * TILE;
  for (let i = 0; i < BLADE_COUNT; i++){
    const tx = (Math.random()-0.5)*TOTAL;
    const tz = (Math.random()-0.5)*TOTAL;
    // Skip center (city area) -- thin density near 0,0
    const dist = Math.sqrt(tx*tx+tz*tz);
    if (dist < 4) { iMesh.setMatrixAt(i, new THREE.Matrix4()); continue; }
    dummy.position.set(tx, 0, tz);
    dummy.rotation.y = Math.random()*Math.PI*2;
    const s = 0.7 + Math.random()*0.7;
    dummy.scale.set(s, s + Math.random()*0.5, s);
    dummy.updateMatrix();
    iMesh.setMatrixAt(i, dummy.matrix);
  }
  iMesh.instanceMatrix.needsUpdate = true;
  iMesh.position.y = 0.001;
  scene.add(iMesh);
})();

// Grid lines handled by updateGroundAndGrid()

// Decorative trees -- loaded from model/tree/*.glb, placed randomly
const gltfLoader = new GLTFLoader();
const TREE_PATHS = [
  { path: './model/tree/small_pine.glb',        targetH: 1.8 },
  { path: './model/tree/trees_low_polly.glb',   targetH: 2.2 },
  { path: './model/tree/low_poly_palm_tree.glb',targetH: 2.0 },
  { path: './model/tree/free_tree_1.glb',       targetH: 1.6 },
];
const TREE_TEMPLATES = [];
let treesLoaded = false;

function loadTreeModels(){
  let pending = TREE_PATHS.length;
  for (const entry of TREE_PATHS){
    const { path, targetH } = entry;
    gltfLoader.load(path, (gltf) => {
      const root = gltf.scene;
      for (let pass = 0; pass < 2; pass++){
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        if (size.y < 0.001) break;
        root.scale.multiplyScalar(targetH / size.y);
      }
      const box2 = new THREE.Box3().setFromObject(root);
      const center = box2.getCenter(new THREE.Vector3());
      const tsx = root.scale.x || 1, tsy = root.scale.y || 1, tsz = root.scale.z || 1;
      root.children.forEach(child => {
        child.position.x -= center.x / tsx;
        child.position.z -= center.z / tsz;
        child.position.y -= box2.min.y / tsy;
      });
      root.position.set(0, 0, 0);
      root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
      const finalH = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
      console.log(`[tree] loaded ${path} -- final height ${finalH.toFixed(2)}`);
      TREE_TEMPLATES.push(root);
      if (--pending === 0){
        treesLoaded = true;
        // Respawn world trees with GLB models now that they're ready
        if (state.running) respawnWorldTrees();
      }
    }, undefined, (err) => {
      console.warn(`[tree] failed: ${path}`, err);
      if (--pending === 0){ treesLoaded = true; }
    });
  }
}

function makeTreeMesh(){
  if (TREE_TEMPLATES.length === 0){
    // procedural fallback
    const g = new THREE.Group();
    const scale = rand(0.5, 0.9);
    const leafMat = mat(choice([0x27ae60,0x2ecc71,0x16a085,0x3aaa5a,0x145a32]));
    const trunkMat = mat(0x7a4a20);
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.42*scale, 0.9*scale, 7), leafMat);
    cone1.position.y = 0.75*scale; cone1.castShadow = true;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.3*scale, 0.7*scale, 7), leafMat);
    cone2.position.y = 1.1*scale; cone2.castShadow = true;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07*scale, 0.1*scale, 0.55*scale, 5), trunkMat);
    trunk.position.y = 0.27*scale;
    g.add(cone1); g.add(cone2); g.add(trunk);
    return g;
  }
  const tpl = choice(TREE_TEMPLATES);
  const clone = tpl.clone(true);
  // Random Y rotation
  clone.rotation.y = rand(0, Math.PI * 2);
  return clone;
}

// Make a smaller tree for in-grid placement (fits within 1 tile)
function makeSmallTreeMesh(){
  const clone = makeTreeMesh();
  const s = rand(0.28, 0.44);
  clone.scale.setScalar(s);
  return clone;
}

// Make a larger tree for outside-grid / forest placement
function makeLargeTreeMesh(){
  const clone = makeTreeMesh();
  const s = rand(0.55, 0.90);
  clone.scale.setScalar(s);
  return clone;
}

// ---- World tree system ----
// 1. In-grid trees: small trees on empty land tiles (can be cut)
// 2. Out-of-grid trees: medium trees scattered outside the land boundary (decoration)
// 3. Forest zone: one dense forest cluster somewhere outside the playable area

const WORLD_TREE_DENSITY   = 0.07;  // default ~7%, overridden by biome config
const WORLD_TREE_MIN_DIST  = 3.5;
const FOREST_ZONE_SIZE     = 20;    // default, overridden by biome config
let   _forestCenter        = null;

function _treesTooClose(wx, wz, existingPositions, minDist){
  for (const p of existingPositions){
    const dx = wx - p.x, dz = wz - p.z;
    if (dx*dx + dz*dz < minDist*minDist) return true;
  }
  return false;
}

function spawnWorldTrees(){
  if (!state.running) return;
  if (!state._worldTrees) state._worldTrees = {};
  if (!state._outerTrees) state._outerTrees = []; // meshes outside grid (no grid key)

  // Collect all existing positions for min-distance check
  const usedPos = [];
  for (const key of Object.keys(state._worldTrees)){
    const m = state._worldTrees[key];
    if (m) usedPos.push({ x: m.position.x, z: m.position.z });
  }
  for (const m of state._outerTrees) usedPos.push({ x: m.position.x, z: m.position.z });

  // --- 1. In-grid trees (small, inside land bounds) ---
  const { min, max } = getLandBounds();
  const biomeDensity = (state._biomeCfg && state._biomeCfg.treeDensity) || WORLD_TREE_DENSITY;
  for (let gx = min; gx < max; gx++){
    for (let gz = min; gz < max; gz++){
      const key = `${gx}_${gz}`;
      if (state._worldTrees[key]) continue;
      if (state.grid[gx][gz].type !== null) continue;
      if (Math.random() > biomeDensity) continue;

      const wp = gridToWorld(gx, gz);
      const wx = wp.x + rand(-TILE * 0.25, TILE * 0.25);
      const wz = wp.z + rand(-TILE * 0.25, TILE * 0.25);
      if (_treesTooClose(wx, wz, usedPos, WORLD_TREE_MIN_DIST)) continue;

      const mesh = makeSmallTreeMesh();
      const terrainH = TERRAIN.getHeightAt(wx, wz);
      mesh.position.set(wx, terrainH, wz);
      mesh.userData.worldTree = true;
      mesh.userData.gridKey  = key;
      scene.add(mesh);
      state._worldTrees[key] = mesh;
      usedPos.push({ x: wx, z: wz });
    }
  }

  // --- 2. Out-of-grid trees (medium, outside land bounds but inside GRID world) ---
  const outerMax = (state._biomeCfg && state._biomeCfg.outerTreeCount) || 60;
  if (state._outerTrees.length < outerMax){
    const worldHalf = HALF - 2;
    let attempts = 0;
    while (state._outerTrees.length < outerMax && attempts < 800){
      attempts++;
      const wx = rand(-worldHalf, worldHalf);
      const wz = rand(-worldHalf, worldHalf);

      // Skip if inside the playable land bounds
      const gx = Math.floor((wx + HALF) / TILE);
      const gz = Math.floor((wz + HALF) / TILE);
      if (gx >= min && gx < max && gz >= min && gz < max) continue;

      if (_treesTooClose(wx, wz, usedPos, WORLD_TREE_MIN_DIST + 1.5)) continue;

      const mesh = makeLargeTreeMesh();
      const terrainH = TERRAIN.getHeightAt(wx, wz);
mesh.position.set(wx, terrainH, wz);
      mesh.userData.outerTree = true;
      scene.add(mesh);
      state._outerTrees.push(mesh);
      usedPos.push({ x: wx, z: wz });
    }
  }

  // --- 3. Forest zone (dense cluster outside playable area, created once) ---
  if (!_forestCenter){
    const biomeForestSize = (state._biomeCfg && state._biomeCfg.forestSize) || FOREST_ZONE_SIZE;
    // Pick a spot at the outer edge of the world, away from land
    const lBoundsMin = min * TILE - HALF;
    const lBoundsMax = max * TILE - HALF;
    const forestCorners = [
      { x: -HALF + biomeForestSize,         z: -HALF + biomeForestSize },
      { x:  HALF - biomeForestSize,         z: -HALF + biomeForestSize },
      { x: -HALF + biomeForestSize,         z:  HALF - biomeForestSize },
      { x:  HALF - biomeForestSize,         z:  HALF - biomeForestSize },
    ].filter(c =>
      c.x < lBoundsMin - 5 || c.x > lBoundsMax + 5 ||
      c.z < lBoundsMin - 5 || c.z > lBoundsMax + 5
    );
    _forestCenter = forestCorners.length ? choice(forestCorners)
                                         : { x: -HALF + biomeForestSize, z: -HALF + biomeForestSize };

    const FOREST_COUNT = Math.round(40 * (biomeForestSize / 20));
    for (let i = 0; i < FOREST_COUNT; i++){
      const angle = rand(0, Math.PI * 2);
      const r     = rand(0, biomeForestSize) * Math.sqrt(Math.random());
      const wx    = _forestCenter.x + Math.cos(angle) * r;
      const wz    = _forestCenter.z + Math.sin(angle) * r;

      // Clamp to world
      if (Math.abs(wx) > HALF - 1 || Math.abs(wz) > HALF - 1) continue;
      if (_treesTooClose(wx, wz, usedPos, 1.5)) continue;

      const mesh = makeLargeTreeMesh();
      // Forest trees slightly larger for density feel
      mesh.scale.multiplyScalar(rand(1.0, 1.5));
      const terrainH = TERRAIN.getHeightAt(wx, wz);
      mesh.position.set(wx, terrainH, wz);
      mesh.userData.forestTree = true;
      scene.add(mesh);
      state._outerTrees.push(mesh);
      usedPos.push({ x: wx, z: wz });
    }
    console.log(`[forest] spawned at (${_forestCenter.x.toFixed(1)}, ${_forestCenter.z.toFixed(1)})`);
  }
  if (_forestCenter){
    state._forestZone = { cx: _forestCenter.x, cz: _forestCenter.z, radius: FOREST_ZONE_SIZE };
  }
  renderMinimap();
}

function clearDesertZone(){
  if (state._desertMesh){
    scene.remove(state._desertMesh);
    state._desertMesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    state._desertMesh = null;
  }
  // Remove individually tracked destroyable objects
  if (state._desertObjects){
    for (const obj of state._desertObjects){
      scene.remove(obj.mesh);
      obj.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    }
  }
  state._desertObjects = [];
}

function makeDesertGroundTexture(radius){
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  // Radial gradient: sandy center â†’ transparent edges (creates natural blending with grass)
  const grad = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  grad.addColorStop(0,    'rgba(214,175,95,0.96)');
  grad.addColorStop(0.35, 'rgba(202,162,82,0.92)');
  grad.addColorStop(0.60, 'rgba(188,146,70,0.80)');
  grad.addColorStop(0.78, 'rgba(174,132,60,0.55)');
  grad.addColorStop(0.90, 'rgba(160,118,50,0.28)');
  grad.addColorStop(1.0,  'rgba(148,106,42,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  // Sandy noise flecks
  const sands = [
    'rgba(240,205,120,0.35)', 'rgba(196,155,75,0.28)',
    'rgba(220,185,105,0.22)', 'rgba(170,128,58,0.30)',
    'rgba(250,215,130,0.18)',
  ];
  for (let i = 0; i < 1800; i++){
    const x = Math.random()*S, y = Math.random()*S;
    const w = Math.random()*4+1, h = Math.random()*3+1;
    ctx.fillStyle = sands[Math.floor(Math.random()*sands.length)];
    // fade near edges
    const dx = x/S - 0.5, dy = y/S - 0.5;
    const edgeDist = Math.max(0, 1 - Math.sqrt(dx*dx+dy*dy)*2.1);
    ctx.globalAlpha = edgeDist * (0.4 + Math.random()*0.4);
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

function spawnDesertZone(){
  clearDesertZone();
  state._desertZone = null;
  if (!_forestCenter) return;
  // Skip desert if biome doesn't have it
  if (state._biomeCfg && !state._biomeCfg.hasDesert) return;

  const radius = 30;
  // Place desert at corner OPPOSITE to forest
  // Place desert at the very edge corner OPPOSITE to forest
  // Center at ~HALF-15 so the zone sits right at the map boundary
  const edgeOffset = 28;
  const cx = _forestCenter.x < 0 ? HALF - edgeOffset : -(HALF - edgeOffset);
  const cz = _forestCenter.z < 0 ? HALF - edgeOffset : -(HALF - edgeOffset);

  const desert = new THREE.Group();

  // --- Sandy ground plane with gradient texture ---
  const groundSize = radius * 2.4;
  const sandTex = makeDesertGroundTexture(radius);
  const sandMat = new THREE.MeshLambertMaterial({
    map: sandTex, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const sandPlane = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), sandMat);
  sandPlane.rotation.x = -Math.PI / 2;
  const sandY = TERRAIN.getHeightAt(cx, cz) + 0.04;
  sandPlane.position.set(cx, sandY, cz);
  sandPlane.receiveShadow = true;
  desert.add(sandPlane);

  // --- Desert mountain (1 GLB, centered in zone, slightly offset) ---
  const mountX = cx + rand(-6, 6), mountZ = cz + rand(-6, 6);
  const mountY = TERRAIN.getHeightAt(mountX, mountZ);
  if (_desertMountTemplate){
    const mount = _desertMountTemplate.clone(true);
    mount.rotation.y = rand(0, Math.PI * 2);
    mount.position.set(mountX, mountY, mountZ);
    desert.add(mount);
  } else {
    // Procedural fallback mesa
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4, 8, 10, 8), new THREE.MeshLambertMaterial({color:0x8B6914}));
    base.position.y = 5;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.1, 1.4, 8), new THREE.MeshLambertMaterial({color:0xC2955A}));
    cap.position.y = 10.7;
    g.add(base, cap);
    g.position.set(mountX, mountY, mountZ);
    desert.add(g);
  }

  // --- Desert rocks (destroyable, tracked individually) ---
  const rockCount = randInt(12, 18);
  for (let i = 0; i < rockCount; i++){
    const angle = rand(0, Math.PI * 2);
    const dist  = rand(5, radius - 4) * Math.sqrt(Math.random() * 0.8 + 0.2);
    const rx = cx + Math.cos(angle) * dist;
    const rz = cz + Math.sin(angle) * dist;
    let mesh;
    if (_desertRockTemplate){
      mesh = _desertRockTemplate.clone(true);
      const s = rand(0.5, 2.2);
      mesh.scale.set(s * rand(0.7,1.3), s * rand(0.5,1.0), s * rand(0.7,1.3));
    } else {
      mesh = new THREE.Mesh(
        Math.random()>0.5 ? new THREE.BoxGeometry(1,1,1) : new THREE.SphereGeometry(0.6,8,6),
        new THREE.MeshLambertMaterial({color:choice([0x7a5c32,0x6b4a22,0x8b6430])})
      );
      const s = rand(0.4, 1.5);
      mesh.scale.set(s*rand(0.7,1.3), s*rand(0.5,1.0), s*rand(0.7,1.3));
    }
    mesh.rotation.y = rand(0, Math.PI*2);
    mesh.rotation.z = rand(-0.2, 0.2);
    mesh.position.set(rx, TERRAIN.getHeightAt(rx, rz) + 0.05, rz);
    mesh.castShadow = true;
    scene.add(mesh);
    state._desertObjects.push({ mesh, wx: rx, wz: rz, type: 'rock' });
  }

  // --- Desert trees (destroyable, tracked individually) ---
  const dtreeCount = randInt(6, 10);
  for (let i = 0; i < dtreeCount; i++){
    const angle = rand(0, Math.PI * 2);
    const dist  = rand(8, radius - 2) * Math.sqrt(Math.random() * 0.7 + 0.3);
    const tx = cx + Math.cos(angle) * dist;
    const tz = cz + Math.sin(angle) * dist;
    let mesh;
    if (_desertTreeTemplate){
      mesh = _desertTreeTemplate.clone(true);
      const s = rand(0.6, 1.3);
      mesh.scale.setScalar(s);
    } else {
      // Cactus fallback
      const g = new THREE.Group();
      const m = new THREE.MeshLambertMaterial({color:0x4a7c59});
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,2.2,8), m);
      trunk.position.y = 1.1;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,1.0,8), m);
      arm.position.set(0.5,1.5,0); arm.rotation.z = -Math.PI/4;
      g.add(trunk, arm);
      mesh = g;
    }
    mesh.rotation.y = rand(0, Math.PI*2);
    mesh.position.set(tx, TERRAIN.getHeightAt(tx, tz) + 0.05, tz);
    scene.add(mesh);
    state._desertObjects.push({ mesh, wx: tx, wz: tz, type: 'desert_tree' });
  }

  scene.add(desert);
  state._desertMesh = desert;
  state._desertZone  = { cx, cz, radius };
  renderMinimap();
  console.log(`[desert] zone spawned at (${cx.toFixed(1)}, ${cz.toFixed(1)})`);
}

// ===================== BEACH ZONE =====================
// Beach is a strip along one edge of the map (at HALF boundary).
// UV mapping after rotation.x=-PI/2: local Y â†’ world -Z.
// Therefore canvas-top(V=1)â†’inland, canvas-bottom(V=0)â†’ocean for 'pz'.
// Gradient stops are set accordingly per side.

let _beachOceanMesh = null;
let _beachWaveTime  = 0;

function makeBeachSandTexture(side){
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  // Determine gradient direction and which end is inland vs ocean.
  // After rotation.x=-PI/2 on a PlaneGeometry:
  //   local Y=-h/2 â†’ world +depth_axis  (ocean outer)
  //   local Y=+h/2 â†’ world -depth_axis  (inland)
  // Canvas: y=0(top)â†’UV V=1â†’local Y=+h/2 = INLAND
  //         y=S(bot)â†’UV V=0â†’local Y=-h/2 = OCEAN
  // So for pz/nz (depth along Z): topâ†’bottom = inlandâ†’ocean.
  // For px/nx (depth along X): UV U direction: u=0â†’local X=-w/2, u=1â†’local X=+w/2
  //   canvas x=0â†’U=0â†’local X=-w/2â†’world X = center-w/2 = inland(px) or ocean(nx)
  //   canvas x=Sâ†’U=1â†’local X=+w/2â†’world X = center+w/2 = ocean(px) or inland(nx)

  let grad;
  let fromInland; // is stop-0 the inland end?
  if (side === 'pz' || side === 'nz'){
    grad = ctx.createLinearGradient(0, 0, 0, S); // topâ†’bottom
    fromInland = (side === 'pz'); // pz: top=inland; nz: top=ocean
  } else {
    grad = ctx.createLinearGradient(0, 0, S, 0); // leftâ†’right
    fromInland = (side === 'px'); // px: left=inland; nx: left=ocean
  }

  const stopsInland = [
    [0.00, 'rgba(178,172,122,0)'],      // transparent inland edge
    [0.12, 'rgba(198,192,140,0.32)'],   // sand/grass blend
    [0.28, 'rgba(220,200,140,0.75)'],   // dry sand
    [0.46, 'rgba(230,210,150,0.90)'],   // dry sand peak
    [0.60, 'rgba(210,190,130,0.85)'],   // wet sand
    [0.72, 'rgba(160,200,190,0.70)'],   // shallow water edge
    [0.86, 'rgba(60,150,190,0.60)'],    // shallow blue
    [0.96, 'rgba(30,120,170,0.40)'],    // deeper water
    [1.00, 'rgba(14,100,160,0)'],       // transparent ocean outer
  ];

  const stops = fromInland ? stopsInland : [...stopsInland].reverse().map(([t,c]) => [1-t, c]).sort((a,b)=>a[0]-b[0]);
  for (const [t, c] of stops) grad.addColorStop(t, c);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Sand speckle noise
  const sands = ['rgba(255,248,205,0.22)', 'rgba(220,208,152,0.18)', 'rgba(248,238,188,0.14)'];
  for (let i = 0; i < 1800; i++){
    const x = Math.random() * S, y = Math.random() * S;
    ctx.fillStyle = sands[i % sands.length];
    ctx.globalAlpha = 0.10 + Math.random() * 0.22;
    ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 2.5 + 0.8);
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(cv);
}

function clearBeachZone(){
  if (state._beachMesh){
    scene.remove(state._beachMesh);
    state._beachMesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    state._beachMesh = null;
  }
  _beachOceanMesh = null;
  if (state._beachTrees){
    for (const t of state._beachTrees){
      scene.remove(t.mesh);
      t.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    }
    state._beachTrees = [];
  }
  state._beachZone = null;
}

function spawnBeachZone(){
  clearBeachZone();
  const fc = _forestCenter;
  const dz = state._desertZone;

  const sides = ['pz', 'nz', 'px', 'nx'];
  let bestSide = null;
  for (const s of sides){
    let conflict = false;
    if (fc){
      if (s === 'pz' && fc.z > 0) conflict = true;
      if (s === 'nz' && fc.z < 0) conflict = true;
      if (s === 'px' && fc.x > 0) conflict = true;
      if (s === 'nx' && fc.x < 0) conflict = true;
    }
    if (dz){
      if (s === 'pz' && dz.cz > 0) conflict = true;
      if (s === 'nz' && dz.cz < 0) conflict = true;
      if (s === 'px' && dz.cx > 0) conflict = true;
      if (s === 'nx' && dz.cx < 0) conflict = true;
    }
    if (!conflict){ bestSide = s; break; }
  }
  if (!bestSide) bestSide = 'pz';

  const sign  = (bestSide === 'pz' || bestSide === 'px') ? 1 : -1;
  const onZ   = (bestSide === 'pz' || bestSide === 'nz');

  const SHORE_LEN   = HALF * 2 + 20;
  const SAND_DEPTH  = 14;
  const OCEAN_DEPTH = 28;
  const OVERLAP     = 4;

  const sandC  = sign * (HALF - OVERLAP + SAND_DEPTH / 2);
  const oceanC = sign * (HALF - OVERLAP + SAND_DEPTH + OCEAN_DEPTH / 2);
  const clampEdge = v => Math.max(-HALF, Math.min(HALF, v));
  const sampleTerrainHeight = (wx, wz) => TERRAIN.getHeightAt(clampEdge(wx), clampEdge(wz));

  const beachGroup = new THREE.Group();

  // --- SAND PLANE ---
  const sandTex = makeBeachSandTexture(bestSide);
  const sandMat = new THREE.MeshLambertMaterial({
    map: sandTex, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const sandGeo = onZ
    ? new THREE.PlaneGeometry(SHORE_LEN, SAND_DEPTH, 24, 8)
    : new THREE.PlaneGeometry(SAND_DEPTH, SHORE_LEN, 8, 24);
  {
    const pos = sandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const wx = onZ ? lx : sandC + lx;
      const wz = onZ ? sandC + ly : ly;
      pos.setZ(i, sampleTerrainHeight(wx, wz) + 0.04);
    }
    pos.needsUpdate = true;
    sandGeo.computeVertexNormals();
  }
  const sandPlane = new THREE.Mesh(sandGeo, sandMat);
  sandPlane.rotation.x = -Math.PI / 2;
  sandPlane.position.set(onZ ? 0 : sandC, 0, onZ ? sandC : 0);
  sandPlane.receiveShadow = true;
  beachGroup.add(sandPlane);

  // --- OCEAN PLANE (animated, subdivided for waves) ---
  const oceanGeo = onZ
    ? new THREE.PlaneGeometry(SHORE_LEN, OCEAN_DEPTH, 16, 10)
    : new THREE.PlaneGeometry(OCEAN_DEPTH, SHORE_LEN, 10, 16);
  const _oceanCol = (state._biomeCfg && state._biomeCfg.oceanColor) ? state._biomeCfg.oceanColor : 0x1890c8;
  const oceanMat = new THREE.MeshPhongMaterial({
    color: _oceanCol, emissive: 0x062a45, emissiveIntensity: 0.08,
    shininess: 90, specular: 0x55bbdd,
    transparent: true, opacity: 0.85, depthWrite: false,
    side: THREE.DoubleSide,
  });
  const oceanPlane = new THREE.Mesh(oceanGeo, oceanMat);
  oceanPlane.rotation.x = -Math.PI / 2;
  oceanPlane.position.set(onZ ? 0 : oceanC, 0.02, onZ ? oceanC : 0);
  beachGroup.add(oceanPlane);
  _beachOceanMesh = oceanPlane;

  scene.add(beachGroup);
  state._beachMesh = beachGroup;

  // Ship patrol bounds -- tetap dekat garis pantai, tapi masih di area laut yang solid
  const depthMin = sign * (HALF - OVERLAP + SAND_DEPTH + 3);
  const depthMax = sign * (HALF - OVERLAP + SAND_DEPTH + OCEAN_DEPTH - 3);
  state._beachZone = {
    side: bestSide, sign, onZ,
    sandC, oceanC, OCEAN_DEPTH,
    shipMinAlong: -HALF + 8,
    shipMaxAlong:  HALF - 8,
    shipDepthMin: Math.min(depthMin, depthMax),
    shipDepthMax: Math.max(depthMin, depthMax),
  };

  // --- PALM TREES ---
  const palmCount = randInt(8, 14);
  for (let i = 0; i < palmCount; i++){
    const along  = rand(-HALF + 3, HALF - 3);
    const inland = rand(0, OVERLAP + 2);
    let tx, tz;
    if (bestSide === 'pz')      { tx = along; tz = HALF - inland; }
    else if (bestSide === 'nz') { tx = along; tz = -(HALF - inland); }
    else if (bestSide === 'px') { tx = HALF - inland; tz = along; }
    else                         { tx = -(HALF - inland); tz = along; }
    let mesh;
    if (_beachTreeTemplate){
      mesh = _beachTreeTemplate.clone(true);
      mesh.scale.multiplyScalar(rand(0.8, 1.2));
    } else {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: 0x7a5c32 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.5, 7), mat);
      trunk.position.y = 1.75; trunk.rotation.z = rand(-0.18, 0.18);
      const lm = new THREE.MeshLambertMaterial({ color: 0x3a8a2a });
      for (let j = 0; j < 6; j++){
        const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.0), lm);
        lf.position.set(Math.cos(j/6*Math.PI*2)*0.6, 3.8, Math.sin(j/6*Math.PI*2)*0.6);
        lf.rotation.y = j/6*Math.PI*2; lf.rotation.z = Math.PI/5; g.add(lf);
      }
      g.add(trunk); mesh = g;
    }
    mesh.rotation.y = rand(0, Math.PI * 2);
    mesh.position.set(tx, TERRAIN.getHeightAt(tx, tz), tz);
    mesh.castShadow = true;
    scene.add(mesh);
    state._beachTrees.push({ mesh, wx: tx, wz: tz });
  }

  renderMinimap();
  console.log(`[beach] side=${bestSide} sandC=${sandC.toFixed(1)} oceanC=${oceanC.toFixed(1)}`);

  // Spawn ships now that _beachZone is ready
  if (_shipGlbLoaded >= SHIP_MODELS.length) spawnShips();
}

function updateBeachWaves(dt) {
  if (!_beachOceanMesh) return;
  _beachWaveTime += dt;
  const zone = state._beachZone;
  const sway = Math.sin(_beachWaveTime * 0.7) * 0.35;

  if (zone){
    if (zone.onZ) _beachOceanMesh.position.x = sway;
    else _beachOceanMesh.position.z = sway;
  }
  _beachOceanMesh.position.y = 0.02 + Math.sin(_beachWaveTime * 1.2) * 0.06;
  _beachOceanMesh.material.emissiveIntensity = 0.06 + Math.abs(Math.sin(_beachWaveTime * 0.4)) * 0.08;
}

function clearWorldTreeAt(gx, gz){
  const key = `${gx}_${gz}`;
  const mesh = state._worldTrees[key];
  if (mesh){
    scene.remove(mesh);
    mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    delete state._worldTrees[key];
  }
}

function respawnWorldTrees(){
  // Remove all existing world trees then re-spawn with GLB models
  if (state._worldTrees){
    for (const m of Object.values(state._worldTrees)){
      scene.remove(m);
      m.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    }
    state._worldTrees = {};
  }
  if (state._outerTrees){
    for (const m of state._outerTrees){
      scene.remove(m);
      m.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    }
    state._outerTrees = [];
  }
  clearDesertZone();
  clearBeachZone();
  clearShips();
  despawnUFO();
  state._desertZone = null;
  state._forestZone = null;
  _forestCenter = null;
  spawnWorldTrees();
  spawnDesertZone();
  spawnBeachZone();
  setTimeout(() => spawnShips(), 200);
}

// Legacy decorative trees (floating, outside grid) kept for park buildings
function spawnDecorativeTrees(){
  const treeGroup = new THREE.Group();
  for (let i = 0; i < 90; i++){
    const tx = rand(-HALF+1, HALF-1);
    const tz = rand(-HALF+1, HALF-1);
    if (Math.abs(tx) < 6 && Math.abs(tz) < 6) continue;
    const g = makeTreeMesh();
    g.position.set(tx, 0, tz);
    g.userData.tree = true;
    treeGroup.add(g);
  }
  scene.add(treeGroup);
  state.treeGroup = treeGroup;
}

function respawnDecorativeTrees(){
  if (state.treeGroup){
    scene.remove(state.treeGroup);
    state.treeGroup.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
  spawnDecorativeTrees();
}

// Cloud particles -- procedural spheres
const cloudGroup = new THREE.Group();
const cloudGeo = new THREE.SphereGeometry(2, 8, 6);
const cloudMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.82 });
for (let i=0;i<14;i++){
  const c = new THREE.Mesh(cloudGeo, cloudMat);
  c.position.set(rand(-HALF, HALF), rand(22, 40), rand(-HALF, HALF));
  c.scale.set(rand(1,2.5), rand(0.5,1), rand(1,2.5));
  cloudGroup.add(c);
}

scene.add(cloudGroup);

// Highlight cursor
const cursorGeo = new THREE.BoxGeometry(TILE, 0.05, TILE);
const cursorMat = new THREE.MeshBasicMaterial({ color:0xffdd00, transparent:true, opacity:0.45 });
const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
cursorMesh.position.y = 0.05;
cursorMesh.visible = false;
scene.add(cursorMesh);

// Ghost preview for pending placement (semi-transparent real mesh)
let ghostMesh = null;
function clearGhost(){
  if (ghostMesh){
    scene.remove(ghostMesh);
    ghostMesh.traverse(o=>{ if (o.isMesh && o.geometry) o.geometry.dispose(); });
    ghostMesh = null;
  }
}
function spawnGhost(key, gx, gz){
  clearGhost();
  ghostMesh = makeBuildingMesh(key);
  if (!ghostMesh) return;
  const size = getSize(key);
  if (size > 1 && !ghostMesh.userData.glb) ghostMesh.scale.set(size, 1, size);
  const wp = footprintCenterWorld(gx, gz, size);
  ghostMesh.position.set(wp.x, 0, wp.z);
  ghostMesh.rotation.y = state.placeRotation * Math.PI / 2;
  // make all materials transparent + red tint
  ghostMesh.traverse(o=>{
    if (o.isMesh && o.material){
      const m = o.material.clone();
      m.transparent = true;
      m.opacity = 0.6;
      if (m.color) m.color = new THREE.Color(0xff4444);
      o.material = m;
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  scene.add(ghostMesh);
}

// -------------------- COORD HELPERS --------------------
function gridToWorld(gx, gz){
  return { x: gx*TILE - HALF + TILE/2, z: gz*TILE - HALF + TILE/2 };
}
function worldToGrid(wx, wz){
  return {
    x: Math.floor((wx + HALF) / TILE),
    z: Math.floor((wz + HALF) / TILE)
  };
}
function getLandBounds(){
  const half = Math.floor(state.landSize / 2);
  const mid  = Math.floor(GRID / 2);
  return { min: mid - half, max: mid - half + state.landSize };
}
function inBounds(gx,gz){
  const { min, max } = getLandBounds();
  return gx >= min && gx < max && gz >= min && gz < max;
}

// ===================== AUDIO SYSTEM =====================
// Audio system with external music files for menu and gameplay
const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain  = null;
  let sfxGain    = null;
  let ambGain    = null;
  let musicPlaying = false;
  let ambientNodes = [];
  let currentMusic = null; // Current HTMLAudioElement
  let currentMusicType = null; // 'menu' or 'gameplay'

  // Preload music
  const menuMusic = new window.Audio();
  menuMusic.src = 'music/main-menu.mp3';
  menuMusic.loop = true;
  menuMusic.volume = 0.35;
  
  const gameplayMusic = new window.Audio();
  gameplayMusic.src = 'music/gameplay.mp3';
  gameplayMusic.loop = true;
  gameplayMusic.volume = 0.20;  // lowered so sfx ambience is audible

  // --- SFX Ambience tracks ---
  const _sfxTracks = {
    morning: new window.Audio('music/sfx/morning.mp3'),
    evening: new window.Audio('music/sfx/evening.mp3'),
    night:   new window.Audio('music/sfx/night.mp3'),
    rain:    new window.Audio('music/sfx/rain.mp3'),
  };
  for (const tr of Object.values(_sfxTracks)){
    tr.loop = true;
    tr.volume = 0;
  }
  let _currentSfxKey = null;
  let _sfxFadeTimer = null;

  // Determine which sfx track should be playing now
  function _sfxDesired(){
    if (typeof DN === 'undefined' || !DN) return null;
    if (DN.weather === 'rain') return 'rain';
    if (DN.isNight) return 'night';
    // dayT: 0=06:00, 1=20:00
    if (DN.dayT < 0.43) return 'morning';   // 06:00-12:00
    return 'evening';                        // 12:00-20:00
  }

  function _sfxCrossfade(){
    const desired = _sfxDesired();
    if (!_SET.sound){ // mute all if sound off
      for (const [k, tr] of Object.entries(_sfxTracks)) tr.volume = 0;
      _currentSfxKey = null;
      return;
    }
    if (desired === _currentSfxKey) return;

    // Fade out old
    if (_currentSfxKey && _sfxTracks[_currentSfxKey]){
      const old = _sfxTracks[_currentSfxKey];
      const fadeOut = setInterval(() => {
        old.volume = Math.max(0, old.volume - 0.02);
        if (old.volume <= 0){ old.pause(); old.currentTime = 0; clearInterval(fadeOut); }
      }, 60);
    }

    _currentSfxKey = desired;

    // Fade in new
    if (desired && _sfxTracks[desired]){
      const tr = _sfxTracks[desired];
      tr.volume = 0;
      const target = desired === 'rain' ? 0.55 : 0.35;
      tr.play().catch(()=>{});
      const fadeIn = setInterval(() => {
        tr.volume = Math.min(target, tr.volume + 0.015);
        if (tr.volume >= target) clearInterval(fadeIn);
      }, 60);
    }
  }

  // Call every ~5 game seconds from updateDayNight
  function tickSfxAmbience(){
    _sfxCrossfade();
  }

  function stopAllSfxAmbience(){
    for (const tr of Object.values(_sfxTracks)){
      tr.pause(); tr.currentTime = 0; tr.volume = 0;
    }
    _currentSfxKey = null;
  }

  function getCtx(){
    if (!ctx){
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain(); masterGain.gain.value = 0.6;
      musicGain  = ctx.createGain(); musicGain.gain.value  = 0.35;
      sfxGain    = ctx.createGain(); sfxGain.gain.value    = 0.7;
      ambGain    = ctx.createGain(); ambGain.gain.value    = 0.15;
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      ambGain.connect(masterGain);
      masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  // --- Helpers ---
  function osc(freq, type, dur, gainVal, dest, startTime, detune=0){
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    o.connect(g); g.connect(dest);
    o.start(startTime); o.stop(startTime + dur + 0.05);
  }

  function noise(dur, gainVal, dest, startTime, filterFreq=800){
    const c = getCtx();
    const bufSize = c.sampleRate * Math.min(dur, 1);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<bufSize;i++) data[i] = Math.random()*2-1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type='lowpass'; filt.frequency.value=filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime+dur);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(startTime); src.stop(startTime+dur+0.05);
  }

  // --- Music playback from external files ---
  function playMenuMusic(){
    stopAllMusic();
    stopAllSfxAmbience(); // no sfx in main menu
    currentMusic = menuMusic;
    currentMusicType = 'menu';
    const promise = menuMusic.play();
    if (promise !== undefined) {
      promise.catch(err => console.log('Menu music autoplay blocked'));
    }
    musicPlaying = true;
  }

  function playGameplayMusic(){
    stopAllMusic();
    currentMusic = gameplayMusic;
    currentMusicType = 'gameplay';
    const promise = gameplayMusic.play();
    if (promise !== undefined) {
      promise.catch(err => console.log('Gameplay music autoplay blocked'));
    }
    musicPlaying = true;
    // Start sfx ambience on gameplay
    setTimeout(() => _sfxCrossfade(), 1000);
  }

  function stopAllMusic(){
    menuMusic.pause();
    menuMusic.currentTime = 0;
    gameplayMusic.pause();
    gameplayMusic.currentTime = 0;
    currentMusic = null;
    musicPlaying = false;
  }

  function stopAllMusicAndSfx(){
    stopAllMusic();
    stopAllSfxAmbience();
  }

  function startMusic(){
    if (musicPlaying) return;
    // Default to menu music
    playMenuMusic();
  }

  function stopMusic(){ 
    stopAllMusic();
  }

  // --- Ambient city sounds (traffic hum, wind) ---
  function startAmbient(){
    const c = getCtx();
    // Low traffic hum
    const hum = c.createOscillator();
    hum.type = 'sawtooth'; hum.frequency.value = 55;
    const humGain = c.createGain(); humGain.gain.value = 0.04;
    const humFilt = c.createBiquadFilter(); humFilt.type='lowpass'; humFilt.frequency.value=120;
    hum.connect(humFilt); humFilt.connect(humGain); humGain.connect(ambGain);
    hum.start();
    ambientNodes.push(hum);

    // Wind noise
    const windBuf = c.createBuffer(1, c.sampleRate*2, c.sampleRate);
    const wd = windBuf.getChannelData(0);
    for(let i=0;i<wd.length;i++) wd[i]=Math.random()*2-1;
    const wind = c.createBufferSource(); wind.buffer=windBuf; wind.loop=true;
    const wFilt = c.createBiquadFilter(); wFilt.type='bandpass'; wFilt.frequency.value=400; wFilt.Q.value=0.5;
    const wGain = c.createGain(); wGain.gain.value=0.06;
    wind.connect(wFilt); wFilt.connect(wGain); wGain.connect(ambGain);
    wind.start();
    ambientNodes.push(wind);
  }

  // --- SFX ---
  function playPlace(){
    const c = getCtx(); const t = c.currentTime;
    osc(520, 'sine', 0.08, 0.4, sfxGain, t);
    osc(780, 'sine', 0.06, 0.3, sfxGain, t+0.05);
    osc(1040,'sine', 0.05, 0.2, sfxGain, t+0.10);
  }
  function playBulldoze(){
    const c = getCtx(); const t = c.currentTime;
    noise(0.18, 0.5, sfxGain, t, 300);
    osc(80, 'sawtooth', 0.2, 0.3, sfxGain, t);
  }
  function playError(){
    const c = getCtx(); const t = c.currentTime;
    osc(220, 'square', 0.1, 0.3, sfxGain, t);
    osc(180, 'square', 0.1, 0.3, sfxGain, t+0.12);
  }
  function playNotify(type='info'){
    const c = getCtx(); const t = c.currentTime;
    if (type==='danger'){
      osc(440,'square',0.08,0.3,sfxGain,t);
      osc(330,'square',0.08,0.3,sfxGain,t+0.1);
    } else if (type==='success'){
      osc(523,'sine',0.07,0.25,sfxGain,t);
      osc(659,'sine',0.07,0.25,sfxGain,t+0.08);
      osc(784,'sine',0.07,0.25,sfxGain,t+0.16);
    } else {
      osc(660,'sine',0.06,0.2,sfxGain,t);
      osc(880,'sine',0.05,0.15,sfxGain,t+0.07);
    }
  }
  function playClick(){
    const c = getCtx(); const t = c.currentTime;
    noise(0.04, 0.3, sfxGain, t, 2000);
  }
  function playLevelUp(){
    const c = getCtx(); const t = c.currentTime;
    [523,659,784,1047].forEach((f,i)=>osc(f,'sine',0.25,0.3,sfxGain,t+i*0.12));
  }
  function playRotate(){
    const c = getCtx(); const t = c.currentTime;
    osc(880,'sine',0.05,0.15,sfxGain,t);
  }

  // Volume controls
  function setMusicVol(v){ 
    if (currentMusic) currentMusic.volume = v;
  }
  function setSfxVol(v)  { getCtx(); sfxGain.gain.value   = v; }
  function setMasterVol(v){ getCtx(); masterGain.gain.value = v; }

  // Sound enabled/disabled toggle
  function setEnabled(on){
    if(on){
      menuMusic.volume = 0.35;
      gameplayMusic.volume = 0.20;
      if(masterGain) masterGain.gain.value = 0.6;
      if(currentMusicType === 'menu' && !musicPlaying) playMenuMusic();
      if(currentMusicType === 'gameplay' && !musicPlaying) playGameplayMusic();
      _sfxCrossfade(); // restore sfx ambience
    } else {
      menuMusic.volume = 0;
      gameplayMusic.volume = 0;
      if(masterGain) masterGain.gain.value = 0;
      stopAllSfxAmbience();
    }
  }

  // Boot: start on first user interaction
  function init(){
    playMenuMusic();
    startAmbient();
    setEnabled(_SET.sound);
  }

  return { init, startMusic, stopMusic, playMenuMusic, playGameplayMusic, stopAllMusic,
           playPlace, playBulldoze, playError,
           playNotify, playClick, playLevelUp, playRotate,
           setMusicVol, setSfxVol, setMasterVol, setEnabled,
           tickSfxAmbience, stopAllSfxAmbience, stopAllMusicAndSfx };
})();

// -------------------- BUILDING MESH FACTORY --------------------
// TheoTown style: MeshLambertMaterial -- lightweight, flat-diffuse, bright
const MAT_CACHE = new Map();

// -------------------- GLB MODEL LOADER --------------------
// Map building key -> { path, targetTiles (so we can scale to fit the footprint) }
const GLB_MODELS = {
  res_low:      { path: './model/low_density.glb' },
  res_med:      { path: './model/med_density.glb' },
  res_high:     { path: './model/high_density.glb' },
  road:         { path: './model/road/road.glb' },
  com_shop:     { path: './model/commerce/shop.glb' },
  com_mall:     { path: './model/commerce/mall.glb',        scaleBoost: 1.5 },
  ind_office:   { path: './model/commerce/office.glb',      scaleBoost: 1.6 },
  skyscraper:   { path: './model/commerce/skyscrapper.glb', scaleBoost: 2.0 },
  skyscraper2:  { path: './model/commerce/skyscrapper.glb', scaleBoost: 2.5 },
  skyscraper3:  { path: './model/commerce/skyscrapper.glb', scaleBoost: 3.2 },
  bank:         { path: './model/commerce/mall.glb',        scaleBoost: 1.8 },
  gas_station:  { path: './model/commerce/shop.glb',        scaleBoost: 0.9 },
  ind_factory:  { path: './model/industry/factory.glb',     scaleBoost: 1.4 },
  school:       { path: './model/public/school.glb',        scaleBoost: 2.6 },
  hospital:     { path: './model/public/hospital.glb',      scaleBoost: 2.2 },
  police:       { path: './model/public/police.glb',        scaleBoost: 3.8 },
  fire:         { path: './model/public/fire_station.glb',  scaleBoost: 3.8 },
  power_coal:   { path: './model/utilities/coal_plant.glb', scaleBoost: 1.1 },
  power_solar:  { path: './model/utilities/solar_plant.glb',scaleBoost: 1.8 },
  water_pump:   { path: './model/utilities/water_pump.glb', scaleBoost: 0.6 },
  water_tile:   { path: './model/utilities/water_animation.glb', scaleBoost: 1.0 },
  bus_stop:     { path: './model/transit/bus_station.glb',  scaleBoost: 1.4 },
  metro:        { path: './model/transit/metro_station.glb',scaleBoost: 1.6 },
  airport:      { path: './model/transit/airport.glb',      scaleBoost: 2.2 },
};
// -------------------- CAR GLB LOADER --------------------
const CAR_PATHS = [
  { path: './model/car/car1.glb', rotY: Math.PI / 2 },
  { path: './model/car/car2.glb', rotY: Math.PI / 2 },
  { path: './model/car/car3.glb', rotY: Math.PI / 2 },
  { path: './model/car/car4.glb', rotY: -Math.PI / 2 },
];
const CAR_TEMPLATES = [];

// -------------------- TAXI MODEL LOADER --------------------
const TAXI_PATHS = [
  { path: './model/car/taxi1.glb', rotY: Math.PI / 2 },
  { path: './model/car/taxi2.glb', rotY: Math.PI / 2 },
];
const TAXI_TEMPLATES = [];

function loadCarModels(){
  let pending = CAR_PATHS.length;
  for (const entry of CAR_PATHS){
    const { path, rotY } = entry;
    gltfLoader.load(path, (gltf) => {
      const root = gltf.scene;
      // Normalize size: longest XZ dimension -> 0.88 world units
      for (let pass = 0; pass < 2; pass++){
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxXZ = Math.max(size.x, size.z);
        if (maxXZ < 0.001) break;
        root.scale.multiplyScalar(0.88 / maxXZ);
      }
      const box2 = new THREE.Box3().setFromObject(root);
      const center = box2.getCenter(new THREE.Vector3());
      const csx = root.scale.x || 1, csy = root.scale.y || 1, csz = root.scale.z || 1;
      root.children.forEach(child => {
        child.position.x -= center.x / csx;
        child.position.z -= center.z / csz;
        child.position.y -= box2.min.y / csy;
      });
      root.position.set(0, 0, 0);
      root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

      // Orientation corrector: most GLB cars face +Z, but dirToYaw() expects front=+X.
      // Inner corrector rotates -PI/2 so a +Z model aligns to +X.
      const corrector = new THREE.Group();
      corrector.rotation.y = rotY;
      corrector.add(root);
      // Outer wrapper is what receives mesh.rotation.y = dirToYaw(...)
      const wrapper = new THREE.Group();
      wrapper.add(corrector);

      const sz = new THREE.Box3().setFromObject(wrapper).getSize(new THREE.Vector3());
      console.log(`[car] loaded ${path} -- ${sz.x.toFixed(2)}x${sz.z.toFixed(2)}x${sz.y.toFixed(2)}`);
      CAR_TEMPLATES.push(wrapper);
      pending--;
    }, undefined, (err) => {
      console.warn(`[car] failed: ${path}`, err);
      pending--;
    });
  }
}

const _registryVehicleLoads = new Set();

// Load extra vehicles from JSON registry
function loadRegistryVehicles() {
  const extraCars = getExtraVehiclesByType('car');
  const extraTaxis = getExtraVehiclesByType('taxi');
  [...extraCars, ...extraTaxis].forEach(cfg => {
    if (_registryVehicleLoads.has(cfg.id)) return;
    if (cfg.requiresBuilding && !state.buildings.some(b => b.type === cfg.requiresBuilding)) return;
    _registryVehicleLoads.add(cfg.id);
    gltfLoader.load(cfg.path, (gltf) => {
      const root = gltf.scene;
      for (let pass = 0; pass < 2; pass++){
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxXZ = Math.max(size.x, size.z);
        if (maxXZ < 0.001) break;
        root.scale.multiplyScalar(0.88 / maxXZ);
      }
      const box2 = new THREE.Box3().setFromObject(root);
      const center = box2.getCenter(new THREE.Vector3());
      const rsx = root.scale.x || 1, rsy = root.scale.y || 1, rsz = root.scale.z || 1;
      root.children.forEach(child => {
        child.position.x -= center.x / rsx;
        child.position.z -= center.z / rsz;
        child.position.y -= box2.min.y / rsy;
      });
      root.position.set(0, 0, 0);
      root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
      const corrector = new THREE.Group();
      corrector.rotation.y = cfg.rotY || 0;
      corrector.add(root);
      const wrapper = new THREE.Group();
      wrapper.add(corrector);
      if (cfg.scale) wrapper.scale.setScalar(cfg.scale);
      if (cfg.type === 'taxi') TAXI_TEMPLATES.push(wrapper);
      else CAR_TEMPLATES.push(wrapper);
      console.log(`[registry vehicle] loaded ${cfg.id}`);
    }, undefined, err => {
      _registryVehicleLoads.delete(cfg.id);
      console.warn('[registry vehicle] failed', cfg.id, err);
    });
  });
}

function loadTaxiModels(){
  for (const entry of TAXI_PATHS){
    const { path, rotY } = entry;
    gltfLoader.load(path, (gltf) => {
      const root = gltf.scene;
      for (let pass = 0; pass < 2; pass++){
        const box = new THREE.Box3().setFromObject(root);
        const sz  = box.getSize(new THREE.Vector3());
        const maxXZ = Math.max(sz.x, sz.z);
        if (maxXZ < 0.001) break;
        root.scale.multiplyScalar(0.88 / maxXZ);
      }
      const box2 = new THREE.Box3().setFromObject(root);
      const center = box2.getCenter(new THREE.Vector3());
      const txsx = root.scale.x || 1, txsy = root.scale.y || 1, txsz = root.scale.z || 1;
      root.children.forEach(child => {
        child.position.x -= center.x / txsx;
        child.position.z -= center.z / txsz;
        child.position.y -= box2.min.y / txsy;
      });
      root.position.set(0, 0, 0);
      root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
      const corrector = new THREE.Group();
      corrector.rotation.y = rotY;
      corrector.add(root);
      const wrapper = new THREE.Group();
      wrapper.add(corrector);
      TAXI_TEMPLATES.push(wrapper);
      console.log(`[taxi] loaded ${path}`);
    }, undefined, (err) => {
      console.warn(`[taxi] failed ${path}`, err);
    });
  }
}

function makeTaxi(){
  if (TAXI_TEMPLATES.length > 0){
    return choice(TAXI_TEMPLATES).clone(true);
  }
  // Fallback: yellow car
  const g = makeCar();
  g.traverse(o => { if (o.isMesh && o.material && o.material.color) o.material = o.material.clone(); });
  g.traverse(o => { if (o.isMesh && o.material) o.material.color.setHex(0xffcc00); });
  return g;
}

const GLB_CACHE = new Map();
const GLB_PENDING = new Map();
// Now safe to call -- gltfLoader and MAT_CACHE are both initialized
loadTreeModels();
loadCarModels();
loadTaxiModels();
loadRegistryVehicles();
// Preload water animation model
loadGLBTemplate('water_tile').catch(err => console.warn('Water animation model not loaded:', err));
// decorative trees disabled -- trees placed manually in-game

function loadGLBTemplate(key){
  if (GLB_CACHE.has(key)) return Promise.resolve(GLB_CACHE.get(key));
  if (GLB_PENDING.has(key)) return GLB_PENDING.get(key);
  const cfg = GLB_MODELS[key];
  if (!cfg) return Promise.reject(new Error('no model for '+key));
  const p = new Promise((resolve, reject) => {
    gltfLoader.load(cfg.path, (gltf)=>{
      const tpl = gltf.scene;
      const def = BUILDINGS[key];
      const size = (def && def.size) || 1;
      const targetFootprint = TILE * size;

      // Store animation clips if available
      if (gltf.animations && gltf.animations.length > 0) {
        tpl.userData.animations = gltf.animations;
      }

      const box = new THREE.Box3().setFromObject(tpl);
      const dims = box.getSize(new THREE.Vector3());

      if (key === 'road'){
        // Roads must fill TILExTILE exactly (no gaps) -- scale each axis independently
        const sx = dims.x > 0.001 ? targetFootprint / dims.x : 1;
        const sz = dims.z > 0.001 ? targetFootprint / dims.z : 1;
        const sy = Math.max(sx, sz); // keep Y proportional to largest XZ scale
        tpl.scale.set(sx, sy, sz);
      } else {
        // Buildings: uniform scale to fit the larger XZ dimension, with optional boost
        const maxXZ = Math.max(dims.x, dims.z) || 1;
        const boost = cfg.scaleBoost || 1;
        tpl.scale.setScalar((targetFootprint / maxXZ) * boost);
      }

      const box2 = new THREE.Box3().setFromObject(tpl);
      const center = box2.getCenter(new THREE.Vector3());
      const bsx = tpl.scale.x || 1, bsy = tpl.scale.y || 1, bsz = tpl.scale.z || 1;
      tpl.children.forEach(child => {
        child.position.x -= center.x / bsx;
        child.position.z -= center.z / bsz;
        child.position.y -= box2.min.y / bsy;
      });
      tpl.position.set(0, 0, 0);
      tpl.traverse(o=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; }});
      GLB_CACHE.set(key, tpl);
      resolve(tpl);
    }, undefined, (err)=>{
      console.warn('Failed to load GLB', cfg.path, err);
      reject(err);
    });
  });
  GLB_PENDING.set(key, p);
  return p;
}

// Build a group for a GLB-backed building. Returns a Group immediately;
// the actual model is added asynchronously when the GLB finishes loading.
// The GLB is baked to TILE*size dimensions, so we mark the group so placeBuilding
// SKIPS its usual non-uniform scale.set(size,1,size).
function makeGLBBuilding(key, b){
  const g = new THREE.Group();
  g.userData.glb = true;
  const def = BUILDINGS[key];
  const sz = (def && def.size) || 1;
  const isRoad = key === 'road';

  // Placeholder -- skip for roads (they're flat, placeholder pokes through ground)
  if (!isRoad){
    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(TILE*sz*0.6, (b.h||1), TILE*sz*0.6),
      mat(b.color || 0x888888)
    );
    placeholder.position.y = (b.h||1)/2;
    placeholder.castShadow = true;
    placeholder.receiveShadow = true;
    placeholder.userData.isPlaceholder = true;
    g.add(placeholder);
  }

  loadGLBTemplate(key).then(tpl=>{
    const clone = tpl.clone(true);
    // Roads: lift slightly to avoid z-fighting with grass ground
    if (isRoad) clone.position.y = 0.003;
    clone.traverse(o=>{
      if (o.isMesh){
        o.castShadow = true;
        o.receiveShadow = true;
        // Roads sit on ground -- push them forward in depth to avoid z-fight
        if (isRoad){
          o.material = o.material.clone();
          o.material.polygonOffset = true;
          o.material.polygonOffsetFactor = -2;
          o.material.polygonOffsetUnits  = -2;
        }
      }
    });
    g.add(clone);
    // Remove placeholder
    const ph = g.children.find(c => c.userData.isPlaceholder);
    if (ph){ g.remove(ph); ph.geometry.dispose(); }
  }).catch(()=>{ /* keep placeholder on failure */ });
  return g;
}

function mat(color, opts={}){
  const key = color + '_' + (opts.side||0);
  if (MAT_CACHE.has(key)) return MAT_CACHE.get(key);
  const m = new THREE.MeshLambertMaterial({
    color,
    side: opts.side===2 ? THREE.DoubleSide : THREE.FrontSide
  });
  MAT_CACHE.set(key, m);
  return m;
}
function emissiveMat(color, intensity=0.6){
  const m = new THREE.MeshLambertMaterial({ color });
  m.emissive = new THREE.Color(color);
  m.emissiveIntensity = Math.min(intensity, 1);
  return m;
}
function glassMat(color=0xaaddff, opacity=0.55){
  return new THREE.MeshLambertMaterial({
    color, transparent:true, opacity, side:THREE.DoubleSide
  });
}
// No outlines needed in TheoTown style
function applyOutlines(){ /* no-op */ }

function addMesh(group, geo, mat_, x, y, z, rx=0, ry=0, rz=0){
  const m = new THREE.Mesh(geo, mat_);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
function addBox(group, w, h, d, x, y, z, material){ return addMesh(group, new THREE.BoxGeometry(w,h,d), material, x,y,z); }
function addCyl(group, rt, rb, h, segs, material, x, y, z, rx=0, ry=0, rz=0){ return addMesh(group, new THREE.CylinderGeometry(rt,rb,h,segs), material, x,y,z,rx,ry,rz); }
function addSphere(group, r, segs, material, x, y, z){ return addMesh(group, new THREE.SphereGeometry(r,segs,segs), material, x,y,z); }
function addCone(group, r, h, segs, material, x, y, z){ return addMesh(group, new THREE.ConeGeometry(r,h,segs), material, x,y,z); }

// Extruded triangle (gable roof) along Z
function gableRoof(group, width, height, depth, x, y, z, material){
  const shape = new THREE.Shape();
  const hw = width/2;
  shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(0, height); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:false });
  geo.translate(0, 0, -depth/2);
  addMesh(group, geo, material, x, y, z);
}

// Sloped hip roof (4 sided pyramid-ish using CylinderGeometry with 4 sides)
function hipRoof(group, w, d, h, x, y, z, material){
  const geo = new THREE.CylinderGeometry(0, Math.hypot(w,d)/2, h, 4, 1);
  geo.rotateY(Math.atan2(d,w)-Math.PI/4);
  addMesh(group, geo, material, x, y, z);
}

// Window helper (glass pane + frame + sill)
function addWindow(group, x, y, z, ww, wh, thick, facing='front'){
  const pane = new THREE.Mesh(new THREE.BoxGeometry(
    facing==='front'||facing==='back' ? ww : thick,
    wh,
    facing==='left'||facing==='right' ? ww : thick
  ), glassMat(0xbae6fd, 0.65));
  pane.position.set(x, y, z);
  group.add(pane);
  // frame
  const fw = 0.02, fmat = mat(0x52525b, {r:0.6});
  if (facing==='front'||facing==='back'){
    addBox(group, ww+fw*2, fw, thick*2, x, y+wh/2, z, fmat);
    addBox(group, ww+fw*2, fw, thick*2, x, y-wh/2, z, fmat);
    addBox(group, fw, wh+fw*2, thick*2, x-ww/2, y, z, fmat);
    addBox(group, fw, wh+fw*2, thick*2, x+ww/2, y, z, fmat);
    // sill
    addBox(group, ww+0.08, 0.03, 0.07, x, y-wh/2-0.02, z+0.04, mat(0xd4d4d8));
  } else {
    addBox(group, thick*2, fw, ww+fw*2, x, y+wh/2, z, fmat);
    addBox(group, thick*2, fw, ww+fw*2, x, y-wh/2, z, fmat);
    addBox(group, thick*2, wh+fw*2, fw, x, y, z-ww/2, fmat);
    addBox(group, thick*2, wh+fw*2, fw, x, y, z+ww/2, fmat);
  }
}

// ===================== ROAD =====================
function makeRoad(){
  const g = new THREE.Group();
  // asphalt base
  addBox(g, TILE, 0.05, TILE, 0, 0.025, 0, mat(0x1c1f25, {r:0.95}));
  // colored sidewalk tiles each side (warm tan)
  addBox(g, TILE, 0.06, 0.2, 0, 0.03,  TILE/2-0.1, mat(0xe8c97a, {r:0.7}));
  addBox(g, TILE, 0.06, 0.2, 0, 0.03, -TILE/2+0.1, mat(0xe8c97a, {r:0.7}));
  // curb stone edge
  addBox(g, TILE, 0.08, 0.07, 0, 0.04,  TILE/2-0.035, mat(0xc0c0a0));
  addBox(g, TILE, 0.08, 0.07, 0, 0.04, -TILE/2+0.035, mat(0xc0c0a0));
  // lane lines (white dashes)
  for (const z of [-0.45, -0.15, 0.15, 0.45]){
    addBox(g, 0.05, 0.01, 0.22, 0, 0.056, z, mat(0xffffff, {r:0.4}));
  }
  // center double yellow
  addBox(g, 0.05, 0.01, TILE, -0.1, 0.056, 0, mat(0xfde047, {r:0.4}));
  addBox(g, 0.05, 0.01, TILE,  0.1, 0.056, 0, mat(0xfde047, {r:0.4}));
  g.userData.line = g.children[1];
  return g;
}

// ===================== HOUSE (Low Density) =====================
function makeHouse(b){
  const g = new THREE.Group();
  const W = 1.3, D = 1.3, BODY = 1.1, EAVE = 0.12;
  // ground / base
  addBox(g, W+0.2, 0.12, D+0.2, 0, 0.06, 0, mat(0x6b7280, {r:0.9}));
  // body with 2 colours (render front wall darker for contrast)
  addBox(g, W, BODY, D, 0, 0.12+BODY/2, 0, mat(b.color, {r:0.85}));
  // exterior plaster lines (horizontal band)
  addBox(g, W+0.02, 0.06, D+0.02, 0, 0.12+BODY*0.45, 0, mat(b.accent, {r:0.8}));
  // GABLE ROOF via ExtrudeGeometry -- triangle extruded along D axis
  const roofH = 0.65, roofBase = 0.12+BODY;
  gableRoof(g, W+EAVE*2, roofH, D+EAVE*2, 0, roofBase, 0, mat(b.accent, {r:0.65}));
  // gable end walls (fill triangle above body)
  gableRoof(g, W, roofH*(W/(W+EAVE*2)), 0.04, 0, roofBase,  D/2+0.02, mat(b.color, {r:0.9, side:2}));
  gableRoof(g, W, roofH*(W/(W+EAVE*2)), 0.04, 0, roofBase, -D/2-0.02, mat(b.color, {r:0.9, side:2}));
  // ridge cap
  addBox(g, 0.1, 0.05, D+EAVE*2+0.05, 0, roofBase+roofH+0.025, 0, mat(b.accent, {r:0.6}));
  // chimney
  addBox(g, 0.18, 0.7, 0.18, W*0.28, roofBase+roofH*0.35, -D*0.15, mat(0x92400e, {r:0.9}));
  addBox(g, 0.24, 0.05, 0.24, W*0.28, roofBase+roofH*0.35+0.38, -D*0.15, mat(0x52525b));
  // front door
  addBox(g, 0.3, 0.65, 0.05, 0.1, 0.12+0.325, D/2+0.025, mat(b.accent));
  addCyl(g, 0.025, 0.025, 0.04, 8, mat(0xfde047), 0.22, 0.12+0.34, D/2+0.05, 0,0,Math.PI/2);
  // door trim arch
  const archGeo = new THREE.TorusGeometry(0.155, 0.025, 6, 16, Math.PI);
  addMesh(g, archGeo, mat(b.accent), 0.1, 0.12+0.66, D/2+0.025, 0, 0, 0);
  // step
  addBox(g, 0.55, 0.06, 0.2, 0.1, 0.09, D/2+0.12, mat(0xa8a29e));
  // windows front
  addWindow(g, -0.42, 0.12+BODY*0.65, D/2+0.026, 0.32, 0.34, 0.025, 'front');
  addWindow(g, 0.52+0.05, 0.12+BODY*0.65, D/2+0.026, 0.28, 0.32, 0.025, 'front');
  // windows back
  addWindow(g, -0.3, 0.12+BODY*0.65, -D/2-0.026, 0.3, 0.3, 0.025, 'back');
  addWindow(g,  0.3, 0.12+BODY*0.65, -D/2-0.026, 0.3, 0.3, 0.025, 'back');
  // side window
  addWindow(g, W/2+0.026, 0.12+BODY*0.65, 0, 0.28, 0.3, 0.025, 'right');
  addWindow(g, -W/2-0.026, 0.12+BODY*0.65, 0, 0.28, 0.3, 0.025, 'left');
  // garden path
  addBox(g, 0.25, 0.02, 0.55, 0.1, 0.13, D/2+0.28, mat(0xd4d4d8, {r:0.85}));
  // hedge
  for (const x of [-W*0.4, W*0.4]){
    addBox(g, 0.25, 0.22, 0.22, x, 0.18, D/2+0.2, mat(0x16a34a, {r:0.9}));
  }
  // corner flowers
  addSphere(g, 0.08, 6, emissiveMat(0xf9a8d4, 0.3), -W*0.4, 0.38, D/2+0.2);
  addSphere(g, 0.08, 6, emissiveMat(0xfef08a, 0.3), W*0.4, 0.38, D/2+0.2);
  return g;
}

// ===================== APARTMENT (Med Density) =====================
function makeApartment(b){
  const g = new THREE.Group();
  const W = 1.6, D = 1.6, H = b.h;
  const floors = Math.max(3, Math.round(H/0.75));
  const fh = H / floors;
  // base
  addBox(g, W+0.15, 0.12, D+0.15, 0, 0.06, 0, mat(0x52525b));
  // main body
  addBox(g, W, H, D, 0, 0.12+H/2, 0, mat(b.color, {r:0.72}));
  // floor band + balconies per floor
  for (let f=1; f<floors; f++){
    const fy = 0.12 + f*fh;
    addBox(g, W+0.04, 0.05, D+0.04, 0, fy+0.025, 0, mat(b.accent, {r:0.7}));
    // balcony on front face
    const bw = W*0.65;
    addBox(g, bw, 0.05, 0.22, 0, fy+0.06, D/2+0.11, mat(0xfafafa, {r:0.5}));
    // balcony rail (thin bars)
    for (let i=-1; i<=1; i++){
      addBox(g, 0.025, 0.2, 0.025, i*(bw*0.42), fy+0.17, D/2+0.21, mat(0x9ca3af));
    }
    addBox(g, bw+0.04, 0.025, 0.025, 0, fy+0.27, D/2+0.21, mat(0x9ca3af));
    // windows back
    addWindow(g, -W*0.28, fy+fh*0.55, -D/2-0.026, 0.3, fh*0.45, 0.025, 'back');
    addWindow(g,  W*0.28, fy+fh*0.55, -D/2-0.026, 0.3, fh*0.45, 0.025, 'back');
    // windows sides
    addWindow(g,  W/2+0.026, fy+fh*0.55, 0, 0.3, fh*0.45, 0.025, 'right');
    addWindow(g, -W/2-0.026, fy+fh*0.55, 0, 0.3, fh*0.45, 0.025, 'left');
  }
  // top floor windows (front)
  addWindow(g, -W*0.28, 0.12+H-fh*0.45, D/2+0.026, 0.3, fh*0.45, 0.025, 'front');
  addWindow(g,  W*0.28, 0.12+H-fh*0.45, D/2+0.026, 0.3, fh*0.45, 0.025, 'front');
  // entrance canopy
  addBox(g, W*0.7, 0.06, 0.35, 0, 0.12+fh*0.9, D/2+0.175, mat(b.accent));
  addBox(g, 0.05, fh*0.9, 0.05, -W*0.3, 0.12+fh*0.45, D/2+0.33, mat(b.accent));
  addBox(g, 0.05, fh*0.9, 0.05,  W*0.3, 0.12+fh*0.45, D/2+0.33, mat(b.accent));
  // door
  addBox(g, 0.4, fh*0.75, 0.05, 0, 0.12+fh*0.375, D/2+0.026, glassMat(0x111827, 0.85));
  // roof parapet
  addBox(g, W+0.1, 0.18, D+0.1, 0, 0.12+H+0.09, 0, mat(b.accent, {r:0.6}));
  // rooftop tank
  addCyl(g, 0.22, 0.22, 0.4, 12, mat(0x9ca3af), -W*0.3, 0.12+H+0.38, D*0.3);
  addCyl(g, 0.24, 0.24, 0.04, 12, mat(0x71717a), -W*0.3, 0.12+H+0.6, D*0.3);
  return g;
}

// ===================== TOWER BLOCK (High Density) =====================
function makeTowerBlock(b){
  const g = new THREE.Group();
  const W = 1.75, D = 1.75, H = b.h;
  const floors = Math.round(H/0.65);
  const fh = H/floors;
  // podium
  addBox(g, W+0.3, 1.0, D+0.3, 0, 0.5, 0, mat(b.accent, {r:0.6, m:0.1}));
  addBox(g, W, H, D, 0, 1.0+H/2, 0, mat(b.color, {r:0.45, m:0.2}));
  // continuous glass facade
  for (let f=0; f<floors; f++){
    const fy = 1.0 + f*fh + fh*0.15;
    const gh = fh*0.7;
    // front / back glass strips
    const glm = glassMat(0x7dd3fc, 0.55);
    addBox(g, W-0.04, gh, 0.04, 0, fy+gh/2, D/2, glm);
    addBox(g, W-0.04, gh, 0.04, 0, fy+gh/2, -D/2, glm);
    addBox(g, 0.04, gh, D-0.04, W/2, fy+gh/2, 0, glm);
    addBox(g, 0.04, gh, D-0.04, -W/2, fy+gh/2, 0, glm);
  }
  // vertical pilasters
  const pm = mat(b.accent, {r:0.5, m:0.15});
  for (const [px, pz] of [[-W/2,0],[W/2,0],[0,-D/2],[0,D/2]]){
    addBox(g, px===0?W*0.08:0.08, H, px===0?0.08:D*0.08, px*(1+0.04/W), 1.0+H/2, pz*(1+0.04/D), pm);
  }
  // roof crown
  addBox(g, W+0.1, 0.25, D+0.1, 0, 1.0+H+0.125, 0, mat(0x1f2937));
  addBox(g, W*0.55, 0.4, D*0.55, 0, 1.0+H+0.45, 0, mat(b.accent, {r:0.4, m:0.2}));
  // mechanical penthouse
  addBox(g, W*0.4, 0.5, D*0.4, 0, 1.0+H+0.9, 0, mat(0x374151));
  // water tanks
  addCyl(g, 0.18, 0.18, 0.45, 10, mat(0x9ca3af), W*0.4, 1.0+H+0.48, D*0.3);
  addCyl(g, 0.18, 0.18, 0.45, 10, mat(0x9ca3af), -W*0.4, 1.0+H+0.48, -D*0.3);
  return g;
}

// ===================== SHOP =====================
function makeShop(b){
  const g = new THREE.Group();
  const W = 1.7, D = 1.7, H = b.h;
  addBox(g, W+0.1, 0.1, D+0.1, 0, 0.05, 0, mat(0x44403c));
  addBox(g, W, H, D, 0, 0.1+H/2, 0, mat(b.color, {r:0.6}));
  // storefront glass lower half
  addBox(g, W*0.88, H*0.45, 0.04, 0, 0.1+H*0.25, D/2, glassMat(0xbae6fd, 0.7));
  // awning (extruded slope)
  const aw = new THREE.Shape();
  aw.moveTo(-W*0.48,0); aw.lineTo(W*0.48,0); aw.lineTo(W*0.48,-0.25); aw.lineTo(-W*0.48,0.02); aw.closePath();
  const awGeo = new THREE.ExtrudeGeometry(aw, { depth:0.35, bevelEnabled:false });
  awGeo.translate(0,0,-0.35/2);
  const awMesh = new THREE.Mesh(awGeo, mat(b.accent, {r:0.7}));
  awMesh.position.set(0, 0.1+H*0.6, D/2+0.01);
  awMesh.castShadow = true;
  g.add(awMesh);
  // awning stripes
  for (let i=-2;i<=2;i++) addBox(g, 0.04, 0.22, 0.04, i*W*0.16, 0.1+H*0.7, D/2+0.22, mat(0xffffff, {r:0.6}));
  // sign panel
  addBox(g, W*0.75, 0.2, 0.06, 0, 0.1+H*0.82, D/2+0.03, emissiveMat(0xfef08a, 0.6));
  // door
  addBox(g, 0.38, H*0.65, 0.04, 0.4, 0.1+H*0.325, D/2+0.01, glassMat(0x111827, 0.9));
  // flat roof + AC
  addBox(g, W+0.06, 0.08, D+0.06, 0, 0.1+H+0.04, 0, mat(0x292524));
  addBox(g, 0.55, 0.22, 0.38, -0.3, 0.1+H+0.19, 0.2, mat(0xa8a29e));
  addCyl(g, 0.06, 0.07, 0.22, 8, mat(0x78716c), -0.3, 0.1+H+0.41, 0.2, Math.PI/2, 0, 0);
  return g;
}

// ===================== MALL =====================
function makeMall(b){
  const g = new THREE.Group();
  const W = 1.85, D = 1.85, H = b.h;
  addBox(g, W, H, D, 0, H/2, 0, mat(b.color, {r:0.5, m:0.1}));
  // full-height glass curtain wall front & back
  const gm = glassMat(0x7dd3fc, 0.55);
  addBox(g, W-0.05, H*0.85, 0.04, 0, H*0.5, D/2, gm);
  addBox(g, W-0.05, H*0.85, 0.04, 0, H*0.5, -D/2, gm);
  // horizontal mullions
  for (let i=1;i<4;i++) addBox(g, W, 0.04, D+0.04, 0, H*i/4, 0, mat(b.accent, {m:0.2}));
  // vertical mullions front
  for (const x of [-0.7,-0.35,0,0.35,0.7]) addBox(g, 0.04, H*0.85, 0.06, x, H*0.5, D/2, mat(b.accent));
  // entrance canopy
  const cw = W*0.6;
  addBox(g, cw, 0.06, 0.5, 0, H*0.4, D/2+0.25, mat(0xf8fafc));
  addBox(g, 0.05, H*0.4, 0.05, -cw/2+0.05, H*0.2, D/2+0.48, mat(b.accent));
  addBox(g, 0.05, H*0.4, 0.05,  cw/2-0.05, H*0.2, D/2+0.48, mat(b.accent));
  // logo
  addBox(g, W*0.5, 0.22, 0.07, 0, H*0.9, D/2+0.03, emissiveMat(0xffffff, 0.8));
  // curved roof
  addBox(g, W+0.1, 0.18, D+0.1, 0, H+0.09, 0, mat(b.accent));
  // hvac units
  for (const [xo,zo] of [[0.5,0.4],[-0.5,-0.4]]){
    addBox(g, 0.45, 0.28, 0.32, xo, H+0.32, zo, mat(0x9ca3af));
    addCyl(g, 0.07, 0.08, 0.25, 8, mat(0x78716c), xo, H+0.6, zo, Math.PI/2, 0, 0);
  }
  return g;
}

// ===================== OFFICE =====================
function makeOffice(b){
  const g = new THREE.Group();
  const W = 1.6, D = 1.6, H = b.h;
  const floors = Math.round(H/0.65);
  const fh = H/floors;
  // base plaza
  addBox(g, W+0.5, 0.08, D+0.5, 0, 0.04, 0, mat(0x374151, {r:0.7}));
  // column arcade around base
  for (const [cx,cz] of [[-W*0.45,-D*0.45],[-W*0.45,D*0.45],[W*0.45,-D*0.45],[W*0.45,D*0.45]]){
    addCyl(g, 0.06, 0.07, fh*1.5, 10, mat(0xd4d4d8, {r:0.4, m:0.15}), cx, fh*0.75, cz);
  }
  // tower
  addBox(g, W, H, D, 0, 0.08+H/2, 0, mat(b.color, {r:0.3, m:0.35}));
  // continuous glass bands per floor
  for (let f=0; f<floors; f++){
    const fy = 0.08 + f*fh + fh*0.1;
    const gh = fh*0.72;
    const gm = glassMat(0x93c5fd, 0.6);
    addBox(g, W+0.02, gh, 0.04, 0, fy+gh/2, D/2, gm);
    addBox(g, W+0.02, gh, 0.04, 0, fy+gh/2, -D/2, gm);
    addBox(g, 0.04, gh, D+0.02, W/2, fy+gh/2, 0, gm);
    addBox(g, 0.04, gh, D+0.02, -W/2, fy+gh/2, 0, gm);
  }
  // crown
  addBox(g, W*0.8, 0.35, D*0.8, 0, 0.08+H+0.175, 0, mat(b.accent, {r:0.3, m:0.3}));
  // logo band
  addBox(g, W*0.9, 0.18, 0.06, 0, 0.08+H+0.02, D/2, emissiveMat(0x60a5fa, 0.6));
  // antenna
  addCyl(g, 0.025, 0.04, 1.4, 8, mat(0xd4d4d8, {m:0.5}), 0, 0.08+H+0.7, 0);
  addSphere(g, 0.045, 6, emissiveMat(0xef4444, 1.2), 0, 0.08+H+1.42, 0);
  return g;
}

// ===================== SKYSCRAPER =====================
function makeSkyscraper(b){
  const g = new THREE.Group();
  const H = b.h;
  const baseW = 1.8;
  // base podium (3 levels)
  addBox(g, baseW+0.4, 1.2, baseW+0.4, 0, 0.6, 0, mat(b.accent, {r:0.5, m:0.2}));
  addBox(g, baseW+0.1, 0.5, baseW+0.1, 0, 1.45, 0, mat(b.accent, {r:0.5}));
  // columns on podium corners
  for (const [cx,cz] of [[-0.8,-0.8],[-0.8,0.8],[0.8,-0.8],[0.8,0.8]]){
    addCyl(g, 0.07, 0.09, 1.5, 12, mat(0xd4d4d8, {r:0.3, m:0.4}), cx, 0.75, cz);
  }
  // main shaft
  const M1 = baseW, M2 = baseW*0.82, M3 = baseW*0.62;
  const H1 = H*0.45, H2 = H*0.35, H3 = H*0.2;
  addBox(g, M1, H1, M1, 0, 1.7+H1/2, 0, mat(b.color, {r:0.25, m:0.45}));
  addBox(g, M1+0.05, 0.1, M1+0.05, 0, 1.7+H1, 0, mat(b.accent));
  addBox(g, M2, H2, M2, 0, 1.7+H1+H2/2, 0, mat(b.color, {r:0.25, m:0.45}));
  addBox(g, M2+0.05, 0.08, M2+0.05, 0, 1.7+H1+H2, 0, mat(b.accent));
  addBox(g, M3, H3, M3, 0, 1.7+H1+H2+H3/2, 0, mat(b.color, {r:0.25, m:0.45}));
  // glass on all 3 shafts - curtain walls
  const shafts = [[M1,H1,1.7],[M2,H2,1.7+H1],[M3,H3,1.7+H1+H2]];
  const floorsPerShaft = [Math.round(H1/0.6), Math.round(H2/0.55), Math.round(H3/0.5)];
  shafts.forEach(([sw, sh, sy], si)=>{
    const floors = floorsPerShaft[si];
    for (let f=0; f<floors; f++){
      const fy = sy + f*(sh/floors) + sh/floors*0.1;
      const gh = sh/floors*0.72;
      const gm = glassMat(0x60a5fa, 0.55);
      addBox(g, sw-0.04, gh, 0.04, 0, fy+gh/2, sw/2, gm);
      addBox(g, sw-0.04, gh, 0.04, 0, fy+gh/2, -sw/2, gm);
      addBox(g, 0.04, gh, sw-0.04, sw/2, fy+gh/2, 0, gm);
      addBox(g, 0.04, gh, sw-0.04, -sw/2, fy+gh/2, 0, gm);
    }
  });
  // crown pyramid
  const crownY = 1.7+H+0.04;
  const pyGeo = new THREE.ConeGeometry(M3*0.45, 1.8, 4);
  pyGeo.rotateY(Math.PI/4);
  addMesh(g, pyGeo, mat(b.accent, {r:0.3, m:0.5}), 0, crownY+0.9, 0);
  // spire
  addCyl(g, 0.03, 0.06, 2.5, 6, mat(0xd4d4d8, {m:0.6}), 0, crownY+1.8+1.25, 0);
  // beacon
  addSphere(g, 0.06, 6, emissiveMat(0xef4444, 1.5), 0, crownY+1.8+2.55, 0);
  return g;
}

// ===================== FACTORY =====================
function makeFactory(b){
  const g = new THREE.Group();
  const W = 1.85, D = 1.85, H = b.h;
  // ground slab
  addBox(g, W+0.3, 0.08, D+0.3, 0, 0.04, 0, mat(0x374151));
  // main shed
  addBox(g, W, H*0.65, D, 0, H*0.325, 0, mat(b.color, {r:0.8}));
  // sawtooth roof (3 x north-light sections)
  const sm = mat(b.accent, {r:0.65});
  const glm2 = glassMat(0xbae6fd, 0.5);
  for (let i=-1; i<=1; i++){
    const ox = i*(W/3.3);
    const sw = W/3.2, sd = D+0.04;
    gableRoof(g, sw, H*0.3, sd, ox, H*0.65, 0, sm);
    // glazed north light
    addBox(g, sw*0.4, H*0.25, 0.04, ox+sw*0.25, H*0.65+H*0.12, sd/2, glm2);
  }
  // wall detail - horizontal rib
  addBox(g, W+0.02, 0.06, D+0.02, 0, H*0.35, 0, mat(b.accent));
  // loading dock
  addBox(g, 0.65, H*0.6, 0.06, 0, H*0.3, D/2, mat(0x27272a));
  addBox(g, 0.65+0.1, 0.05, 0.3, 0, H*0.6+0.025, D/2+0.15, mat(b.accent)); // dock canopy
  // chimney stacks
  const sm2 = mat(0x52525b);
  addCyl(g, 0.1, 0.13, 1.8, 10, sm2, W*0.32, H*0.65+0.9, -D*0.3);
  addCyl(g, 0.09, 0.11, 1.5, 10, sm2, W*0.15, H*0.65+0.75, -D*0.15);
  // chimney caps
  addCyl(g, 0.13, 0.13, 0.08, 10, mat(0x374151), W*0.32, H*0.65+1.84, -D*0.3);
  addCyl(g, 0.12, 0.12, 0.08, 10, mat(0x374151), W*0.15, H*0.65+1.59, -D*0.15);
  // warning light on stacks
  addSphere(g, 0.05, 6, emissiveMat(0xef4444, 1.2), W*0.32, H*0.65+1.95, -D*0.3);
  // ventilation fans on roof
  for (const [rx,rz] of [[W*0.35, D*0.3],[-W*0.35,-D*0.25]]){
    addCyl(g, 0.14, 0.14, 0.08, 8, mat(0x78716c), rx, H*0.65+0.05, rz);
    addCyl(g, 0.12, 0.12, 0.2, 8, mat(0x9ca3af), rx, H*0.65+0.18, rz);
  }
  return g;
}

// ===================== COAL PLANT =====================
function makeCoalPlant(b){
  const g = new THREE.Group();
  const W = 1.85, D = 1.85, H = b.h;
  // boiler house
  addBox(g, W*0.8, H, D*0.6, -W*0.1, H/2, -D*0.15, mat(b.color, {r:0.8}));
  // large cooling towers (hyperboloid-ish: wide base, narrow waist, wider top)
  const twrMat = mat(0xd4d4d8, {r:0.85});
  function coolingTower(x, z, rBot=0.42, rMid=0.28, rTop=0.36, h=1.8){
    const pts = [];
    const segs = 10;
    for (let i=0;i<=segs;i++){
      const t = i/segs;
      // hyperboloid radius
      const r = rBot + (rMid-rBot)*Math.sin(t*Math.PI)*2.2 + (rTop-rBot)*t;
      pts.push(new THREE.Vector2(Math.max(0.05, r), t*h - h/2));
    }
    const geo = new THREE.LatheGeometry(pts, 20);
    addMesh(g, geo, twrMat, x, H*0.5+h/2, z);
    // rim
    addCyl(g, rTop+0.02, rTop+0.02, 0.08, 20, mat(0x9ca3af), x, H*0.5+h+0.04, z);
  }
  coolingTower(-W*0.25, D*0.3, 0.42, 0.27, 0.36, H*1.2);
  coolingTower( W*0.25, D*0.3, 0.42, 0.27, 0.36, H*1.2);
  // tall smokestack
  addCyl(g, 0.1, 0.14, H*1.4, 12, mat(0x27272a), W*0.38, H*0.7, -D*0.3);
  addCyl(g, 0.13, 0.13, 0.1, 12, mat(0xdc2626), W*0.38, H*1.4+0.05, -D*0.3);
  addSphere(g, 0.05, 6, emissiveMat(0xef4444, 1.5), W*0.38, H*1.4+0.14, -D*0.3);
  // coal yard (dark ground)
  addBox(g, W*0.6, 0.04, D*0.5, W*0.28, 0.02, D*0.1, mat(0x18181b, {r:0.95}));
  return g;
}

// ===================== SOLAR FARM =====================
function makeSolar(b){
  const g = new THREE.Group();
  addBox(g, TILE*0.96, 0.04, TILE*0.96, 0, 0.02, 0, mat(0x1c1917, {r:0.95}));
  const pm = mat(0x1e3a8a, {r:0.2, m:0.6});
  const frameMat = mat(0x71717a, {r:0.5, m:0.3});
  for (let r=-1; r<=1; r++){
    for (let c=-1; c<=1; c++){
      const ox = c*0.6, oz = r*0.6;
      // tilt mount
      addBox(g, 0.05, 0.28, 0.05, ox-0.12, 0.14, oz+0.15, mat(0x52525b));
      addBox(g, 0.05, 0.22, 0.05, ox+0.12, 0.11, oz+0.15, mat(0x52525b));
      // panel cross-beam
      addBox(g, 0.45, 0.025, 0.025, ox, 0.27, oz, frameMat);
      addBox(g, 0.025, 0.025, 0.62, ox, 0.27, oz, frameMat);
      // panel face
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.025, 0.58), pm);
      panel.position.set(ox, 0.3, oz);
      panel.rotation.x = -0.42;
      panel.castShadow = true;
      g.add(panel);
      // cell grid (just faint blue lines)
      for (let ci=-1;ci<=1;ci++){
        addBox(g, 0.44, 0.026, 0.008, ox, 0.3+ci*0.001, oz+ci*0.14, mat(0x1d4ed8));
      }
    }
  }
  // junction box
  addBox(g, 0.2, 0.1, 0.14, 0.5, 0.08, -0.5, mat(0x374151));
  return g;
}

// ===================== WIND TURBINE =====================
function makeWind(b){
  const g = new THREE.Group();
  const tH = b.h;
  // base foundation
  addCyl(g, 0.28, 0.32, 0.2, 10, mat(0x9ca3af), 0, 0.1, 0);
  // tower (tapered cylinder)
  addCyl(g, 0.065, 0.12, tH, 14, mat(0xf3f4f6, {r:0.35, m:0.45}), 0, tH/2, 0);
  // nacelle
  const nacBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.55), mat(0xe5e7eb, {r:0.3, m:0.3}));
  nacBox.position.set(0, tH+0.1, 0.08);
  nacBox.castShadow = true;
  g.add(nacBox);
  // nacelle dome (front)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI), mat(0xd4d4d8, {r:0.3, m:0.4}));
  dome.rotation.y = Math.PI/2;
  dome.position.set(0, tH+0.1, 0.36);
  g.add(dome);
  // hub
  const hubG = new THREE.Group();
  addCyl(hubG, 0.07, 0.07, 0.12, 10, mat(0xfafafa), 0, 0, 0, Math.PI/2, 0, 0);
  // 3 blades -- each is a tapered box with slight twist feel
  for (let i=0; i<3; i++){
    const bladeGroup = new THREE.Group();
    // blade body - tapered from root to tip
    const bGeo = new THREE.BoxGeometry(0.05, 1.7, 0.12);
    // taper via position trick: use different scales
    const blade = new THREE.Mesh(bGeo, mat(0xfafafa, {r:0.25}));
    blade.position.y = 0.85;
    blade.castShadow = true;
    bladeGroup.add(blade);
    // narrower tip cap
    addBox(bladeGroup, 0.03, 0.15, 0.06, 0, 1.75, 0, mat(0xe5e7eb));
    bladeGroup.rotation.z = (i * Math.PI*2)/3;
    hubG.add(bladeGroup);
  }
  hubG.position.set(0, tH+0.1, 0.38);
  g.add(hubG);
  g.userData.blades = hubG;
  return g;
}

// ===================== WATER PUMP =====================
function makeWaterPump(b){
  const g = new THREE.Group();
  const W = 1.6, D = 1.6;
  // pad
  addBox(g, W+0.2, 0.08, D+0.2, 0, 0.04, 0, mat(0x374151));
  // pump house
  addBox(g, W*0.55, 0.8, D*0.55, -W*0.2, 0.48, -D*0.2, mat(b.color, {r:0.7}));
  // pitched roof on pump house
  gableRoof(g, W*0.58, 0.3, D*0.58, -W*0.2, 0.88, -D*0.2, mat(b.accent, {r:0.65}));
  // main water tank (large cylinder)
  addCyl(g, 0.52, 0.52, 1.1, 18, mat(0x3b82f6, {r:0.35, m:0.4}), W*0.22, 0.63, D*0.22);
  // tank dome top
  addSphere(g, 0.53, 14, mat(0x2563eb, {r:0.3, m:0.45}), W*0.22, 1.22, D*0.22);
  // tank band
  addCyl(g, 0.54, 0.54, 0.05, 18, mat(b.accent), W*0.22, 0.6, D*0.22);
  // pipes
  addCyl(g, 0.045, 0.045, 0.7, 8, mat(0x9ca3af), -W*0.1, 0.35, D*0.22, 0, 0, Math.PI/6);
  addCyl(g, 0.045, 0.045, 0.5, 8, mat(0x9ca3af), W*0.22, 0.25, -D*0.1, Math.PI/2, 0, 0);
  // valve wheels
  addCyl(g, 0.1, 0.1, 0.015, 8, mat(0x374151), 0, 0.42, D*0.3, Math.PI/2, 0, 0);
  return g;
}

// ===================== WATER TILES & ANIMATION =====================
const waterMaterials = [];
let waterTime = 0;

function makeWaterTile(){
  const g = new THREE.Group();
  
  // Try to load GLB model for water
  const waterModel = GLB_CACHE.get('water_tile');
  if (waterModel) {
    const model = waterModel.clone();
    model.position.y = 0; // Ensure it sits on ground
    g.add(model);
    
    // Store reference to the model for merging
    g.userData.waterModel = model;
    
    // Play GLB animations if available
    if (waterModel.userData.animations && waterModel.userData.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      waterModel.userData.animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.play();
      });
      // Store mixer for updates in game loop
      g.userData.mixer = mixer;
    }
    
    // Optionally mark meshes for additional shader animation (disabled for now since we use GLB animation)
    // model.traverse(obj => {
    //   if (obj.isMesh) {
    //     obj.userData.waterAnim = true;
    //     obj.userData.waterPhase = Math.random() * 6;
    //     obj.userData.waterBaseY = obj.position.y;
    //   }
    // });
  } else {
    // Fallback to procedural water if model not loaded yet
    const baseBox = addBox(g, TILE*0.98, 0.04, TILE*0.98, 0, 0.02, 0, mat(0x0d4a8a));
    const surfBox = addBox(g, TILE*0.98, 0.04, TILE*0.98, 0, 0.06, 0, mat(0x1a7acc));
    const surfaceMesh = g.children[g.children.length - 1];
    if (surfaceMesh && surfaceMesh.material){
      surfaceMesh.userData.waterAnim = true;
      surfaceMesh.userData.waterPhase = Math.random() * 6;
      surfaceMesh.userData.waterBaseY = 0.06;
      surfaceMesh.material = surfaceMesh.material.clone();
      surfaceMesh.material.transparent = true;
      surfaceMesh.material.opacity = 0.88;
    }
  }
  
  // NO SHORE FRAMES - just the model
  g.userData.isWater = true;
  return g;
}

function updateWaterMerge(gx, gz){
  // Water merging DISABLED for GLB model water tiles (keep normal size)
  const isWaterAt = (x, z) => inBounds(x, z) && (state.grid[x][z].type === 'water_tile');
  
  const updateTile = (x, z) => {
    if (!inBounds(x, z)) return;
    const cell = state.grid[x][z];
    if (!cell.mesh) return;
  };
  
  updateTile(gx, gz);
  updateTile(gx-1, gz); updateTile(gx+1, gz);
  updateTile(gx, gz-1); updateTile(gx, gz+1);
}

function updateWaterAnimation(dt){
  waterTime += dt;
  const t = waterTime;
  scene.traverse(function(obj){
    if (obj.isMesh && obj.userData.waterAnim){
      const ph = obj.userData.waterPhase || 0;
      const by = obj.userData.waterBaseY || 0.04;
      obj.position.y = by + Math.sin(t * 1.1 + ph) * 0.008;
      if (obj.material && obj.material.color){
        const hue = 0.58 + Math.sin(t * 0.5 + ph) * 0.02;
        obj.material.color.setHSL(hue, 0.65, 0.42 + Math.sin(t * 0.8 + ph) * 0.05);
      }
    }
  });
}

// Update animation mixers for GLB water tiles
function updateWaterMixers(dt){
  state.grid.forEach(col => {
    col.forEach(cell => {
      if (cell && cell.mesh && cell.mesh.userData.mixer) {
        cell.mesh.userData.mixer.update(dt);
      }
    });
  });
}


// ===================== BANK =====================
function makeBank(b){
  const g = new THREE.Group();
  const W = TILE*1.85, D = TILE*1.85, H = b.h||3.5;
  const glassMat_ = new THREE.MeshLambertMaterial({ color:0xaaddff, transparent:true, opacity:0.55 });
  // Base podium
  addBox(g, W, 0.3, D, 0, 0.15, 0, mat(0xd4af37));
  // Main tower
  addBox(g, W*0.72, H, W*0.72, 0, H/2, 0, mat(0xffd700));
  // Glass curtain walls
  addBox(g, W*0.73, H*0.9, 0.04, 0, H*0.5, W*0.36, glassMat_);
  addBox(g, W*0.73, H*0.9, 0.04, 0, H*0.5,-W*0.36, glassMat_);
  addBox(g, 0.04, H*0.9, W*0.73, W*0.36, H*0.5, 0, glassMat_);
  addBox(g, 0.04, H*0.9, W*0.73,-W*0.36, H*0.5, 0, glassMat_);
  // Columns at entrance
  for (const cx of [-W*0.22, 0, W*0.22]){
    addCyl(g, 0.07, 0.07, H*0.45, 8, mat(0xf0d060), cx, H*0.225, D*0.36);
  }
  // Roof ornament
  addBox(g, W*0.18, H*0.15, W*0.18, 0, H+H*0.075, 0, mat(0xd4af37));
  addCyl(g, 0.04, 0, H*0.2, 4, mat(0xd4af37), 0, H+H*0.22, 0);
  // ðŸ¦ sign slab
  addBox(g, W*0.3, 0.12, 0.04, 0, H*0.3, D*0.365, mat(0x222222));
  return g;
}

// ===================== GAS STATION =====================
function makeGasStation(b){
  const g = new THREE.Group();
  const W = TILE * 0.9;
  addBox(g, W, 0.05, W, 0, 0.025, 0, mat(0xddccaa));
  addBox(g, W * 0.95, 0.10, W * 0.6, 0, 1.10, -W * 0.1, mat(0xee3333));
  addBox(g, W * 0.95, 0.06, W * 0.6, 0, 1.16, -W * 0.1, mat(0xffffff));
  for (const cx of [-W * 0.3, W * 0.3]){
    addCyl(g, 0.04, 0.04, 1.1, 6, mat(0xaaaaaa), cx, 0.55, W * 0.05);
  }
  addBox(g, W * 0.42, 0.70, W * 0.48, W * 0.22, 0.35, W * 0.22, mat(0xffffff));
  addBox(g, W * 0.42, 0.08, W * 0.48, W * 0.22, 0.74, W * 0.22, mat(0xee3333));
  for (const px of [-W * 0.15, W * 0.15]){
    addBox(g, 0.12, 0.50, 0.18, px, 0.25, -W * 0.05, mat(0x22aa44));
    addBox(g, 0.14, 0.08, 0.20, px, 0.52, -W * 0.05, mat(0x111111));
    addCyl(g, 0.015, 0.015, 0.3, 5, mat(0x333333), px + 0.07, 0.38, -W * 0.05, 0, 0, Math.PI / 2);
  }
  addCyl(g, 0.03, 0.03, 1.4, 6, mat(0x888888), -W * 0.34, 0.70, W * 0.28);
  addBox(g, 0.28, 0.20, 0.04, -W * 0.34, 1.50, W * 0.28 + 0.02, mat(0xffdd00));
  return g;
}

// ===================== SKYSCRAPER B =====================
function makeSkyscraper2(b){
  const g = new THREE.Group();
  const W = TILE*1.85, H = b.h||13;
  const gMat = new THREE.MeshLambertMaterial({ color:0x00ccff, transparent:true, opacity:0.55 });
  // Stepped tower
  addBox(g, W*0.9, H*0.45, W*0.9, 0, H*0.225, 0, mat(0x0088bb));
  addBox(g, W*0.7, H*0.3,  W*0.7, 0, H*0.6, 0,   mat(0x00aadd));
  addBox(g, W*0.5, H*0.2,  W*0.5, 0, H*0.8, 0,   mat(0x00ccff));
  addBox(g, W*0.25,H*0.08, W*0.25, 0,H*0.94, 0,  mat(0x00eeff));
  // Glass facade panels (6 vertical strips)
  for (let fi=0;fi<4;fi++){
    const fy = H*(0.05 + fi*0.22);
    addBox(g, W*0.88, H*0.18, 0.05, 0, fy, W*0.45, gMat);
    addBox(g, W*0.88, H*0.18, 0.05, 0, fy,-W*0.45, gMat);
    addBox(g, 0.05, H*0.18, W*0.88, W*0.45, fy, 0, gMat);
    addBox(g, 0.05, H*0.18, W*0.88,-W*0.45, fy, 0, gMat);
  }
  // Antenna
  addCyl(g, 0.03, 0, H*0.15, 6, mat(0xffffff), 0, H+H*0.075, 0);
  // Helipad circle on top
  addCyl(g, W*0.15, W*0.15, 0.06, 16, mat(0x334455), 0, H, 0);
  addCyl(g, W*0.08, W*0.08, 0.08, 16, mat(0xffaa00), 0, H+0.04, 0);
  return g;
}

// ===================== SKYSCRAPER C =====================
function makeSkyscraper3(b){
  const g = new THREE.Group();
  const W = TILE*2.8, H = b.h||16;
  const gMat = new THREE.MeshLambertMaterial({ color:0xff8844, transparent:true, opacity:0.5 });
  // Twisted look -- 3 rotated blocks
  for (let i=0;i<8;i++){
    const rot = i*0.08;
    const w = W*(0.85 - i*0.05);
    const yBot = H*(i/8);
    const yH   = H*(1.2/8);
    const seg = new THREE.Group();
    addBox(seg, w, yH, w, 0, yH/2, 0, mat(0xcc5500 - i*0x100500));
    seg.position.y = yBot;
    seg.rotation.y = rot;
    g.add(seg);
  }
  // Outer glass skin
  addBox(g, W*0.88, H, 0.05,  0,H/2,  W*0.44, gMat);
  addBox(g, W*0.88, H, 0.05,  0,H/2, -W*0.44, gMat);
  addBox(g, 0.05, H, W*0.88,  W*0.44,H/2, 0, gMat);
  addBox(g, 0.05, H, W*0.88, -W*0.44,H/2, 0, gMat);
  // Spire
  addCyl(g, 0.05, 0, H*0.18, 6, mat(0xffaa44), 0, H+H*0.09, 0);
  addCyl(g, 0.12, 0.12, 0.15, 8, mat(0xff6600), 0, H, 0);
  return g;
}

// ===================== RAILWAY =====================
function makeRailway(){
  const g = new THREE.Group();
  const S = TILE * 0.98;
  const trackW = S * 0.35; // narrower track width
  // Ballast (gravel bed) -- thinner, narrower
  addBox(g, trackW, 0.04, S, 0, 0.02, 0, mat(0x888880));
  // Sleepers (cross ties) -- thinner and shorter
  const sleeperMat_ = mat(0x5a3a1a);
  const nSleepers = 6;
  for (let i=0; i<nSleepers; i++){
    const zPos = -S*0.44 + (i/(nSleepers-1))*S*0.88;
    addBox(g, trackW * 1.1, 0.04, 0.09, 0, 0.055, zPos, sleeperMat_);
  }
  // Rails -- thin and close together
  const railMat_ = mat(0xc0c0c0, {r:0.3, m:0.6});
  const railGap = trackW * 0.38;
  addBox(g, 0.04, 0.04, S*0.96, -railGap, 0.075, 0, railMat_);
  addBox(g, 0.04, 0.04, S*0.96,  railGap, 0.075, 0, railMat_);
  g.userData.isRailway = true;
  return g;
}

// ===================== PARK =====================
function makePark(b){
  const g = new THREE.Group();
  // base
  addBox(g, TILE*0.96, 0.06, TILE*0.96, 0, 0.03, 0, mat(0x4d7c3f, {r:0.95}));
  // paved paths
  addBox(g, TILE*0.96, 0.07, 0.22, 0, 0.065, 0, mat(0xd6d3d1, {r:0.7}));
  addBox(g, 0.22, 0.07, TILE*0.96, 0, 0.065, 0, mat(0xd6d3d1, {r:0.7}));
  // fountain in center
  addCyl(g, 0.32, 0.35, 0.12, 16, mat(0x94a3b8, {r:0.4}), 0, 0.09, 0);
  addCyl(g, 0.1, 0.1, 0.28, 10, mat(0x94a3b8, {r:0.5}), 0, 0.27, 0);
  addSphere(g, 0.07, 8, emissiveMat(0xbae6fd, 0.6), 0, 0.57, 0);
  // water in fountain
  addCyl(g, 0.3, 0.3, 0.02, 16, glassMat(0x60a5fa, 0.8), 0, 0.07, 0);
  // trees -- use GLB if loaded, else procedural
  function parkTree(x, z){
    const t = makeTreeMesh();
    t.scale.multiplyScalar(rand(0.55, 0.75)); // fit inside park tile
    t.position.set(x, 0, z);
    g.add(t);
  }
  parkTree(-0.7, -0.7);
  parkTree( 0.7,  0.7);
  parkTree(-0.7,  0.7);
  parkTree( 0.7, -0.7);
  // benches
  function bench(x, z, ry=0){
    const bm = mat(0x92400e, {r:0.7});
    const sm = mat(0x52525b);
    const bg = new THREE.Group();
    addBox(bg, 0.5, 0.04, 0.14, 0, 0.22, 0, bm);     // seat
    addBox(bg, 0.5, 0.08, 0.04, 0, 0.3, 0.09, bm);   // backrest
    addBox(bg, 0.04, 0.22, 0.04, -0.2, 0.11, 0, sm);  // left leg
    addBox(bg, 0.04, 0.22, 0.04,  0.2, 0.11, 0, sm);  // right leg
    bg.position.set(x, 0.06, z);
    bg.rotation.y = ry;
    g.add(bg);
  }
  bench( 0.55, 0,  Math.PI/2);
  bench(-0.55, 0,  Math.PI/2);
  bench(0,  0.55, 0);
  bench(0, -0.55, 0);
  // lamp posts
  function lamp(x, z){
    addCyl(g, 0.025, 0.03, 1.0, 6, mat(0x404040), x, 0.56, z);
    addBox(g, 0.04, 0.04, 0.2, x, 1.09, z+0.08, mat(0x404040));
    addSphere(g, 0.07, 6, emissiveMat(0xfef9c3, 1.0), x, 1.12, z+0.18);
  }
  lamp( 0.7, -0.1); lamp(-0.7, 0.1);
  return g;
}

// ===================== SCHOOL =====================
function makeSchool(b){
  const g = new THREE.Group();
  const W = 1.75, D = 1.65, H = b.h;
  const floors = Math.max(2, Math.round(H/0.9));
  const fh = H/floors;
  // base
  addBox(g, W+0.15, 0.1, D+0.15, 0, 0.05, 0, mat(0x9ca3af, {r:0.8}));
  // main building
  addBox(g, W, H, D, 0, 0.1+H/2, 0, mat(b.color, {r:0.75}));
  // hip roof
  hipRoof(g, W, D, 0.55, 0, 0.1+H+0.275, 0, mat(b.accent, {r:0.6}));
  // eaves
  addBox(g, W+0.15, 0.06, D+0.15, 0, 0.1+H+0.03, 0, mat(b.accent));
  // floor separator bands
  for (let f=1; f<floors; f++) addBox(g, W+0.02, 0.06, D+0.02, 0, 0.1+f*fh, 0, mat(0x9ca3af));
  // columns + entrance
  addBox(g, 0.08, H*0.55, 0.08, -0.35, 0.1+H*0.275, D/2+0.08, mat(0xd4d4d8, {m:0.15}));
  addBox(g, 0.08, H*0.55, 0.08,  0.35, 0.1+H*0.275, D/2+0.08, mat(0xd4d4d8, {m:0.15}));
  addBox(g, 0.9, 0.07, 0.3, 0, 0.1+H*0.55+0.035, D/2+0.15, mat(0xd4d4d8));
  // door
  addBox(g, 0.38, H*0.55, 0.05, 0, 0.1+H*0.275, D/2+0.025, glassMat(0x111827, 0.9));
  // steps
  for (let s=0;s<3;s++) addBox(g, 0.9, 0.06, 0.18, 0, s*0.06+0.09, D/2+0.18+s*0.18, mat(0xd4d4d8));
  // windows per floor
  for (let f=0; f<floors; f++){
    const wy = 0.1 + f*fh + fh*0.55;
    for (const wx of [-W*0.38,-W*0.15,W*0.15,W*0.38]){
      addWindow(g, wx, wy, D/2+0.026, 0.28, fh*0.5, 0.025, 'front');
      addWindow(g, wx, wy, -D/2-0.026, 0.28, fh*0.5, 0.025, 'back');
    }
  }
  // flag pole
  addCyl(g, 0.015, 0.02, 1.6, 6, mat(0x9ca3af, {m:0.5}), W/2-0.1, 0.1+H+0.35+0.55, -D/2+0.1);
  addBox(g, 0.35, 0.2, 0.015, W/2-0.1+0.18, 0.1+H+0.35+1.15, -D/2+0.1, mat(0xef4444));
  return g;
}

// ===================== HOSPITAL =====================
function makeHospital(b){
  const g = new THREE.Group();
  const W = 1.8, D = 1.8, H = b.h;
  const floors = Math.round(H/0.75);
  const fh = H/floors;
  // base
  addBox(g, W+0.2, 0.1, D+0.2, 0, 0.05, 0, mat(0x9ca3af));
  // main tower
  addBox(g, W, H, D, 0, 0.1+H/2, 0, mat(b.color, {r:0.6}));
  // floor separators
  for (let f=1;f<floors;f++) addBox(g, W+0.02, 0.05, D+0.02, 0, 0.1+f*fh, 0, mat(0xd4d4d8));
  // windows
  for (let f=0;f<floors;f++){
    const wy = 0.1 + f*fh + fh*0.55;
    for (const wx of [-W*0.35, 0, W*0.35]){
      addWindow(g, wx, wy, D/2+0.026, 0.28, fh*0.55, 0.025, 'front');
      addWindow(g, wx, wy, -D/2-0.026, 0.28, fh*0.55, 0.025, 'back');
    }
    addWindow(g, 0, wy, W/2+0.026, 0.28, fh*0.55, 0.025, 'right');
    addWindow(g, 0, wy, -W/2-0.026, 0.28, fh*0.55, 0.025, 'left');
  }
  // entrance wing (lower)
  addBox(g, W*0.55, H*0.3, D*0.22, 0, 0.1+H*0.15, D/2+D*0.11, mat(b.color, {r:0.6}));
  addBox(g, W*0.55, 0.05, D*0.22+0.04, 0, 0.1+H*0.3+0.025, D/2+D*0.11, mat(0xd4d4d8));
  // big red cross on top (emissive)
  const crossMat = emissiveMat(0xef4444, 0.8);
  addBox(g, 0.65, 0.12, 0.06, 0, 0.1+H*0.82, D/2+0.031, crossMat);
  addBox(g, 0.12, 0.65, 0.06, 0, 0.1+H*0.82, D/2+0.031, crossMat);
  // helipad roof
  addBox(g, W+0.1, 0.1, D+0.1, 0, 0.1+H+0.05, 0, mat(0x374151));
  addCyl(g, 0.55, 0.55, 0.04, 20, mat(0xfafafa, {r:0.5}), 0, 0.1+H+0.12, 0);
  addBox(g, 0.1, 0.05, 0.7, 0, 0.1+H+0.15, 0, crossMat);
  addBox(g, 0.7, 0.05, 0.1, 0, 0.1+H+0.15, 0, crossMat);
  return g;
}

// ===================== POLICE =====================
function makePolice(b){
  const g = new THREE.Group();
  const W = 1.65, D = 1.5, H = b.h;
  addBox(g, W+0.15, 0.1, D+0.15, 0, 0.05, 0, mat(0x374151));
  addBox(g, W, H, D, 0, 0.1+H/2, 0, mat(b.color, {r:0.65}));
  // facade pilasters
  addBox(g, 0.1, H, 0.12, -W/2+0.07, 0.1+H/2, D/2, mat(0xd4d4d8));
  addBox(g, 0.1, H, 0.12,  W/2-0.07, 0.1+H/2, D/2, mat(0xd4d4d8));
  addBox(g, W+0.02, 0.08, D+0.02, 0, 0.1+H*0.4, 0, mat(0xd4d4d8));
  // roof parapet
  addBox(g, W+0.06, 0.18, D+0.06, 0, 0.1+H+0.09, 0, mat(b.accent));
  // entrance columns
  addCyl(g, 0.055, 0.065, H*0.55, 12, mat(0xd4d4d8, {m:0.15}), -0.3, 0.1+H*0.275, D/2+0.06);
  addCyl(g, 0.055, 0.065, H*0.55, 12, mat(0xd4d4d8, {m:0.15}),  0.3, 0.1+H*0.275, D/2+0.06);
  addBox(g, 0.8, 0.07, 0.25, 0, 0.1+H*0.56, D/2+0.12, mat(0xd4d4d8));
  // door
  addBox(g, 0.38, H*0.52, 0.05, 0, 0.1+H*0.26, D/2+0.025, glassMat(0x1e40af, 0.85));
  // badge sign
  addBox(g, 0.6, 0.2, 0.06, 0, 0.1+H*0.82, D/2+0.031, emissiveMat(b.accent, 0.7));
  // windows
  const floors = 2;
  for (const wx of [-W*0.35, W*0.35]){
    addWindow(g, wx, 0.1+H*0.7, D/2+0.026, 0.28, H*0.25, 0.025, 'front');
    addWindow(g, wx, 0.1+H*0.25, D/2+0.026, 0.28, H*0.28, 0.025, 'front');
  }
  // rooftop beacon
  addCyl(g, 0.04, 0.04, 0.3, 8, mat(0x374151), 0, 0.1+H+0.33, 0);
  addSphere(g, 0.07, 8, emissiveMat(0x3b82f6, 1.5), 0, 0.1+H+0.52, 0);
  return g;
}

// ===================== FIRE STATION =====================
function makeFire(b){
  const g = new THREE.Group();
  const W = 1.8, D = 1.6, H = b.h;
  addBox(g, W+0.15, 0.1, D+0.15, 0, 0.05, 0, mat(0x374151));
  addBox(g, W, H, D, 0, 0.1+H/2, 0, mat(b.color, {r:0.65}));
  // large garage bay doors (front face, lower half)
  const dh = H*0.7, dw = W*0.75;
  addBox(g, dw, dh, 0.05, -W*0.05, 0.1+dh/2, D/2, mat(0xfafafa, {r:0.5}));
  // horizontal door panels
  for (let p=0; p<5; p++) addBox(g, dw, 0.03, 0.055, -W*0.05, 0.1+dh/5*(p+0.5), D/2+0.005, mat(0xd4d4d8));
  // red stripe on door
  addBox(g, dw+0.02, 0.08, 0.06, -W*0.05, 0.1+dh*0.35, D/2, mat(b.accent));
  // roof parapet
  addBox(g, W+0.08, 0.2, D+0.08, 0, 0.1+H+0.1, 0, mat(b.accent));
  // bell tower
  const btX = W*0.38, btZ = -D*0.35;
  addBox(g, 0.4, H*0.55, 0.4, btX, 0.1+H+H*0.275, btZ, mat(b.color));
  addBox(g, 0.45, 0.06, 0.45, btX, 0.1+H+H*0.55+0.03, btZ, mat(b.accent));
  // bell
  addSphere(g, 0.08, 8, mat(0xfde047, {m:0.7}), btX, 0.1+H+H*0.5, btZ);
  // windows
  addWindow(g, W*0.38, 0.1+H*0.8, D/2+0.026, 0.25, H*0.22, 0.025, 'front');
  addWindow(g, -W*0.4, 0.1+H*0.8, D/2+0.026, 0.2, H*0.22, 0.025, 'front');
  // hose reel side
  addCyl(g, 0.1, 0.1, 0.06, 10, mat(0xd4d4d8), -W/2-0.05, 0.38, D*0.1, 0,0,Math.PI/2);
  return g;
}

// ===================== BUS STOP =====================
function makeBusStop(b){
  const g = new THREE.Group();
  // pad
  addBox(g, 1.1, 0.04, 0.55, 0, 0.02, 0, mat(0xa8a29e, {r:0.85}));
  // 4 pillars
  const pm = mat(0x374151, {r:0.4, m:0.2});
  for (const [px,pz] of [[-0.48,0.22],[-0.48,-0.22],[0.48,0.22],[0.48,-0.22]]){
    addCyl(g, 0.025, 0.028, 0.7, 8, pm, px, 0.39, pz);
  }
  // back wall (glass)
  addBox(g, 1.0, 0.6, 0.04, 0, 0.38, -0.22, glassMat(0xbae6fd, 0.45));
  // bench inside
  addBox(g, 0.7, 0.05, 0.16, 0, 0.32, 0, mat(0x92400e, {r:0.6}));
  addBox(g, 0.05, 0.24, 0.04, -0.3, 0.22, -0.05, mat(0x52525b));
  addBox(g, 0.05, 0.24, 0.04,  0.3, 0.22, -0.05, mat(0x52525b));
  // roof panel
  addBox(g, 1.1, 0.04, 0.58, 0, 0.72, 0, mat(b.color, {r:0.4}));
  // roof border
  addBox(g, 1.14, 0.03, 0.62, 0, 0.72+0.035, 0, mat(b.accent));
  // sign board on pillar
  addBox(g, 0.22, 0.18, 0.04, 0.5, 0.55, 0.23, emissiveMat(b.color, 0.55));
  addBox(g, 0.2, 0.04, 0.05, 0.5, 0.42, 0.23, mat(b.accent));
  return g;
}

// ===================== METRO STATION =====================
function makeMetro(b){
  const g = new THREE.Group();
  const W = 1.8, D = 1.8, H = b.h;
  // platform base
  addBox(g, W+0.2, 0.12, D+0.2, 0, 0.06, 0, mat(0x374151));
  addBox(g, W, H*0.45, D, 0, 0.12+H*0.225, 0, mat(b.color, {r:0.5, m:0.1}));
  // glazed barrel vault roof
  const vaultMat = glassMat(0x93c5fd, 0.45);
  const vaultFrame = mat(b.accent, {r:0.4, m:0.3});
  // vault arch ribs (8 arches)
  for (let i=0; i<8; i++){
    const archGeo = new THREE.TorusGeometry(H*0.42, 0.025, 6, 24, Math.PI);
    const rib = new THREE.Mesh(archGeo, vaultFrame);
    rib.position.set(0, 0.12+H*0.45, -D/2+i*D/7);
    rib.rotation.y = Math.PI/2;
    g.add(rib);
  }
  addBox(g, W*0.95, H*0.42*2, 0.04, 0, 0.12+H*0.45+H*0.42, -D/2, vaultMat);
  addBox(g, W*0.95, H*0.42*2, 0.04, 0, 0.12+H*0.45+H*0.42,  D/2, vaultMat);
  addBox(g, 0.04, H*0.42*2, D, W/2, 0.12+H*0.45+H*0.42, 0, vaultMat);
  addBox(g, 0.04, H*0.42*2, D, -W/2, 0.12+H*0.45+H*0.42, 0, vaultMat);
  // entrance canopy
  addBox(g, W*0.5, 0.07, 0.45, 0, 0.12+H*0.4, D/2+0.225, mat(b.accent));
  addCyl(g, 0.04, 0.05, H*0.45, 10, mat(b.accent), -W*0.22, 0.12+H*0.225, D/2+0.42);
  addCyl(g, 0.04, 0.05, H*0.45, 10, mat(b.accent),  W*0.22, 0.12+H*0.225, D/2+0.42);
  // M sign (emissive)
  addBox(g, 0.45, 0.38, 0.06, 0, 0.12+H*0.28, D/2+0.43, emissiveMat(0xa78bfa, 0.9));
  addBox(g, 0.5, 0.42, 0.04, 0, 0.12+H*0.28, D/2+0.44, mat(0x2e1065));
  // floor windows
  addWindow(g, -W*0.3, 0.12+H*0.25, D/2+0.01, 0.3, H*0.3, 0.025, 'front');
  addWindow(g,  W*0.3, 0.12+H*0.25, D/2+0.01, 0.3, H*0.3, 0.025, 'front');
  return g;
}

// ===================== AIRPORT =====================
function makeAirport(b){
  const g = new THREE.Group();
  const TW = TILE*0.97, TD = TILE*0.97;
  // tarmac
  addBox(g, TW, 0.04, TD, 0, 0.02, 0, mat(0x27272a, {r:0.9}));
  // runway
  addBox(g, 0.22, 0.045, TD*0.95, 0, 0.042, 0, mat(0x3f3f46, {r:0.8}));
  for (let i=-3;i<=3;i++) addBox(g, 0.08, 0.046, 0.2, 0, 0.043, i*0.35, mat(0xfafafa));
  // terminal building
  addBox(g, TW*0.78, 0.7, TD*0.32, -TW*0.04, 0.04+0.35, -TD*0.3, mat(b.color, {r:0.5, m:0.1}));
  // terminal glass front
  addBox(g, TW*0.76, 0.58, 0.04, -TW*0.04, 0.04+0.33, -TD*0.3+TD*0.16+0.02, glassMat(0xbae6fd, 0.55));
  // terminal roof
  addBox(g, TW*0.82, 0.06, TD*0.36, -TW*0.04, 0.04+0.73, -TD*0.3, mat(b.accent));
  // boarding bridges
  for (const bx of [-TW*0.28, TW*0.2]){
    addBox(g, 0.12, 0.22, 0.55, bx, 0.04+0.22, -TD*0.1, mat(0x9ca3af));
    addBox(g, 0.22, 0.22, 0.04, bx, 0.04+0.22, -TD*0.07, mat(0x71717a));
  }
  // control tower
  addCyl(g, 0.09, 0.12, 1.3, 10, mat(b.accent), TW*0.38, 0.04+0.65, -TD*0.3);
  addCyl(g, 0.22, 0.2, 0.18, 14, glassMat(0x60a5fa, 0.65), TW*0.38, 0.04+1.39, -TD*0.3);
  addCyl(g, 0.23, 0.23, 0.04, 14, mat(0x374151), TW*0.38, 0.04+1.5, -TD*0.3);
  // parked plane
  const plane = new THREE.Group();
  addBox(plane, 1.05, 0.1, 0.2, 0, 0.05, 0, mat(0xfafafa, {r:0.3, m:0.3})); // fuselage
  addBox(plane, 0.18, 0.06, 0.8, 0, 0.05, 0, mat(0xfafafa, {r:0.3}));         // wings
  addBox(plane, 0.14, 0.12, 0.08, -0.48, 0.1, 0, mat(0xef4444));              // tail fin
  // engine nacelles
  addCyl(plane, 0.055, 0.05, 0.2, 8, mat(0xa8a29e), 0.18, 0.03, 0.25, Math.PI/2,0,0);
  addCyl(plane, 0.055, 0.05, 0.2, 8, mat(0xa8a29e), -0.18, 0.03, 0.25, Math.PI/2,0,0);
  // windows row
  for (let wi=-2;wi<=2;wi++) addSphere(plane, 0.025, 4, glassMat(0xbae6fd, 0.7), wi*0.15, 0.1, 0.1);
  plane.position.set(0.1, 0.04, TD*0.2);
  plane.rotation.y = 0.4;
  g.add(plane);
  return g;
}

function makeBuildingMesh(key){
  const b = BUILDINGS[key];
  if (!b) return null;
  let g;
  switch(key){
    case 'road':        g = makeGLBBuilding('road', b); break;
    case 'railway':     g = makeRailway(); break;
    case 'water_tile':  g = makeWaterTile(); break;
    case 'res_low':     g = makeGLBBuilding('res_low', b); break;
    case 'res_med':     g = makeGLBBuilding('res_med', b); break;
    case 'res_high':    g = makeGLBBuilding('res_high', b); break;
    case 'com_shop':    g = makeGLBBuilding('com_shop', b); break;
    case 'com_mall':    g = makeGLBBuilding('com_mall', b); break;
    case 'ind_office':  g = makeGLBBuilding('ind_office', b); break;
    case 'skyscraper':  g = makeGLBBuilding('skyscraper', b); break;
    case 'skyscraper2': g = makeGLBBuilding('skyscraper2', b); break;
    case 'skyscraper3': g = makeGLBBuilding('skyscraper3', b); break;
    case 'bank':        g = makeGLBBuilding('bank', b); break;
    case 'gas_station': g = makeGLBBuilding('gas_station', b); break;
    case 'ind_factory': g = makeGLBBuilding('ind_factory', b); break;
    case 'power_coal':  g = makeGLBBuilding('power_coal', b); break;
    case 'power_solar': g = makeGLBBuilding('power_solar', b); break;
    case 'power_wind':  g = makeWind(b); break;
    case 'water_pump':  g = makeGLBBuilding('water_pump', b); break;
    case 'park':        g = makePark(b); break;
    case 'school':      g = makeGLBBuilding('school', b); break;
    case 'hospital':    g = makeGLBBuilding('hospital', b); break;
    case 'police':      g = makeGLBBuilding('police', b); break;
    case 'fire':        g = makeGLBBuilding('fire', b); break;
    case 'bus_stop':    g = makeGLBBuilding('bus_stop', b); break;
    case 'metro':       g = makeGLBBuilding('metro', b); break;
    case 'airport':     g = makeGLBBuilding('airport', b); break;
    default: {
      g = new THREE.Group();
      addBox(g, TILE*0.8, b.h, TILE*0.8, 0, b.h/2, 0, mat(b.color));
    }
  }
  if (key !== 'road') applyOutlines(g, 0.055);
  return g;
}

// -------------------- PLACEMENT --------------------
function getSize(key){ return (BUILDINGS[key] && BUILDINGS[key].size) || 1; }

// Per-type light config: [color, intensity at full night, height offset]
// Night light config: [color, maxIntensity, worldY, distWorld, decay]
// worldY = absolute world-space Y (above the building roof).
// Lights are added to SCENE (not mesh children) so geometry never blocks them.
// TILE=2, building h values from BUILDINGS const.
// Emissive window color and PointLight halo per building type
// [emissiveHex, pointLightHex, midHeight, radius]
const _NIGHT_LIGHT_CFG = {
  res_low:     { em: 0xffcc66, lc: 0xffdd88, h: 0.7,  r: 6  },
  res_med:     { em: 0xffdd99, lc: 0xffeebb, h: 1.4,  r: 8  },
  res_high:    { em: 0xffeebb, lc: 0xfff0cc, h: 2.5,  r: 10 },
  com_shop:    { em: 0xffbb33, lc: 0xffcc44, h: 0.8,  r: 8  },
  com_mall:    { em: 0xff8822, lc: 0xff9933, h: 1.2,  r: 14 },
  ind_office:  { em: 0xaaccff, lc: 0xccddff, h: 2.0,  r: 11 },
  bank:        { em: 0xffdd66, lc: 0xffee88, h: 1.8,  r: 10 },
  gas_station: { em: 0xeeffee, lc: 0xffffff, h: 0.8,  r: 10 },
  skyscraper:  { em: 0x8899ff, lc: 0xaaccff, h: 5.0,  r: 14 },
  skyscraper2: { em: 0x22eecc, lc: 0x44ffee, h: 6.5,  r: 14 },
  skyscraper3: { em: 0xff44ff, lc: 0xff88ff, h: 8.0,  r: 16 },
  ind_factory: { em: 0xff6600, lc: 0xff7700, h: 1.0,  r: 10 },
  power_coal:  { em: 0xff7722, lc: 0xff8833, h: 1.2,  r: 12 },
  power_solar: { em: 0xffff88, lc: 0xffffaa, h: 0.3,  r: 12 },
  power_wind:  { em: 0x88bbff, lc: 0xaaddff, h: 2.5,  r: 9  },
  water_pump:  { em: 0x22aaff, lc: 0x44ccff, h: 0.8,  r: 7  },
  park:        { em: 0x66ee66, lc: 0x88ff88, h: 0.5,  r: 7  },
  school:      { em: 0xffff88, lc: 0xffffaa, h: 1.0,  r: 10 },
  hospital:    { em: 0xeeffff, lc: 0xffffff, h: 1.5,  r: 13 },
  police:      { em: 0x2255ff, lc: 0x3366ff, h: 0.9,  r: 9  },
  fire:        { em: 0xff3311, lc: 0xff4422, h: 0.9,  r: 9  },
  bus_stop:    { em: 0xffdd33, lc: 0xffee44, h: 0.5,  r: 6  },
  metro:       { em: 0x2299ff, lc: 0x44aaff, h: 1.2,  r: 10 },
  airport:     { em: 0xeeeeff, lc: 0xffffff, h: 1.2,  r: 20 },
};

function addBuildingNightLight(bEntry){
  const key = bEntry.type;
  const noLight = ['road','railway','water_tile','bulldoze','axe','hunt'];
  if(noLight.includes(key) || !bEntry.mesh) return;
  const cfg = _NIGHT_LIGHT_CFG[key];

  // Collect emissive-capable materials for window-glow effect
  const emMats = [];
  bEntry.mesh.traverse(o => {
    if(!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for(const m of mats){
      if(m && m.emissive !== undefined && !emMats.includes(m)){
        emMats.push(m);
      }
    }
  });
  bEntry.emMats = emMats;
  bEntry.emColor = cfg ? cfg.em : 0xffeecc;

  if(!cfg) return;

  // PointLight halo: 4 side lights at mid-wall height for cross-illumination
  const wx = bEntry.mesh.position.x;
  const wz = bEntry.mesh.position.z;
  const size = getSize(key);
  const halfSpan = size * TILE * 0.5;
  // Intensity high enough to be visible without physical units
  const intensity = 0;  // start at 0; ramped by updateDayNight
  const maxInt = 1.5;

  const offsets = [
    [halfSpan + 0.5, cfg.h, 0],
    [-halfSpan - 0.5, cfg.h, 0],
    [0, cfg.h,  halfSpan + 0.5],
    [0, cfg.h, -halfSpan - 0.5],
  ];
  const lights = [];
  for(let i = 0; i < offsets.length; i++){
    const [ox, oy, oz] = offsets[i];
    const light = new THREE.PointLight(cfg.lc, intensity, cfg.r, 1);
    light.castShadow = false;
    light.position.set(wx + ox, oy, wz + oz);
    scene.add(light);
    lights.push({ light, maxInt });
  }
  bEntry.nightLights = lights;
}

// Centre-of-footprint world position for a building anchored at top-left (gx, gz) of size N
function footprintCenterWorld(gx, gz, size){
  return {
    x: gx*TILE - HALF + (TILE*size)/2,
    z: gz*TILE - HALF + (TILE*size)/2
  };
}

function canPlaceAt(key, gx, gz){
  if (!inBounds(gx,gz)) return false;
  if (key === 'bulldoze') return state.grid[gx][gz].type != null;
  if (key === 'hunt'){
    // Allow click anywhere ground is hittable; actual range check in huntDeer()
    return true;
  }
  if (key === 'axe'){
    // In-grid tree
    if (inBounds(gx, gz)){
      const gridKey = `${gx}_${gz}`;
      if (state._worldTrees && state._worldTrees[gridKey]) return true;
    }
    // Outer tree or desert object nearby
    const wp = gridToWorld(gx, gz);
    const rangeSq = (TILE * 2.5) * (TILE * 2.5);
    if (state._outerTrees){
      for (const m of state._outerTrees){
        const dx = m.position.x - wp.x, dz = m.position.z - wp.z;
        if (dx*dx + dz*dz < rangeSq) return true;
      }
    }
    if (state._desertObjects){
      for (const obj of state._desertObjects){
        const dx = obj.wx - wp.x, dz = obj.wz - wp.z;
        if (dx*dx + dz*dz < rangeSq) return true;
      }
    }
    return false;
  }
  const size = getSize(key);
  // all tiles in footprint must be in-bounds and empty
  for (let dx=0; dx<size; dx++){
    for (let dz=0; dz<size; dz++){
      const nx = gx+dx, nz = gz+dz;
      if (!inBounds(nx, nz)) return false;
      if (state.grid[nx][nz].type != null) return false;
    }
  }
  // Water pump must be adjacent to water tile
  if (key === 'water_pump' && !nearWater(gx, gz, size)){
    return false;
  }
  return true;
}

// -------------------- CONSTRUCTION & DESTRUCTION ANIMATIONS --------------------

// Build duration in real seconds: size1=60s, size2=120s, size3=180s, size4=300s
function buildDuration(size){ return [0, 60, 120, 180, 300][Math.min(size, 4)]; }

function makeScaffoldMesh(key){
  const b = BUILDINGS[key];
  const size = getSize(key);
  const w = size * TILE * 0.9;
  const h = Math.max(0.4, (b.h || 1) * 0.5);
  const g = new THREE.Group();

  // Wooden frame -- orange/yellow scaffold poles
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffaa33 });
  const planMat = new THREE.MeshLambertMaterial({ color: 0xccaa66, transparent: true, opacity: 0.7 });

  // Vertical poles at corners
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, h, 5);
  const offsets = [[-w/2,-w/2],[w/2,-w/2],[-w/2,w/2],[w/2,w/2]];
  offsets.forEach(([ox,oz])=>{
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(ox, h/2, oz);
    g.add(pole);
  });

  // Horizontal planks at intervals
  const levels = Math.max(1, Math.floor(h/0.5));
  for (let i=1; i<=levels; i++){
    const y = (i/levels)*h;
    const plankGeo = new THREE.BoxGeometry(w, 0.05, 0.08);
    [-w/2, w/2].forEach(oz=>{
      const plank = new THREE.Mesh(plankGeo, planMat);
      plank.position.set(0, y, oz);
      g.add(plank);
    });
    const plankGeo2 = new THREE.BoxGeometry(0.08, 0.05, w);
    [-w/2, w/2].forEach(ox=>{
      const plank = new THREE.Mesh(plankGeo2, planMat);
      plank.position.set(ox, y, 0);
      g.add(plank);
    });
  }

  // Tarp / wrap -- semi-transparent blue-green panel
  const tarpGeo = new THREE.BoxGeometry(w, h, w);
  const tarpMat = new THREE.MeshLambertMaterial({ color: 0x44aacc, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  const tarp = new THREE.Mesh(tarpGeo, tarpMat);
  tarp.position.y = h/2;
  g.add(tarp);

  // ðŸš§ sign sprite
  const signGeo = new THREE.PlaneGeometry(0.5, 0.3);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, h * 0.3, w/2 + 0.05);
  g.add(sign);

  g.userData.scaff = true;
  return g;
}

// Spawn debris particles for destruction
function spawnDestruction(mesh, onDone){
  if (!mesh) { if(onDone) onDone(); return; }
  const pos = new THREE.Vector3();
  mesh.getWorldPosition(pos);

  const count = 24;
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const mats = [0xaa7744, 0x887766, 0xcc9933, 0x665544].map(c =>
    new THREE.MeshLambertMaterial({ color: c })
  );

  const particles = [];
  for (let i=0; i<count; i++){
    const m = new THREE.Mesh(geo, mats[i % mats.length]);
    m.position.copy(pos);
    m.position.x += rand(-1.5, 1.5);
    m.position.y += rand(0.2, 2.0);
    m.position.z += rand(-1.5, 1.5);
    m.userData.vel = new THREE.Vector3(rand(-3,3), rand(3,7), rand(-3,3));
    m.userData.rot = new THREE.Vector3(rand(-4,4), rand(-4,4), rand(-4,4));
    scene.add(m);
    particles.push(m);
  }

  // Shake + shrink the original mesh before removing
  let t = 0;
  const entry = { mesh, particles, t, onDone };
  state.destructions.push(entry);

  // Remove original mesh immediately (hidden under particles)
  scene.remove(mesh);
}

function updateDestructions(dt){
  for (let i = state.destructions.length-1; i >= 0; i--){
    const d = state.destructions[i];
    d.t += dt;
    const gravity = 9.8;
    for (const p of d.particles){
      p.userData.vel.y -= gravity * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.rotation.x += p.userData.rot.x * dt;
      p.rotation.y += p.userData.rot.y * dt;
      p.rotation.z += p.userData.rot.z * dt;
      // fade out scale
      const s = Math.max(0, 1 - d.t/1.8);
      p.scale.setScalar(s);
    }
    if (d.t > 1.8){
      for (const p of d.particles){ scene.remove(p); p.geometry.dispose(); }
      if (d.onDone) d.onDone();
      state.destructions.splice(i, 1);
    }
  }
}

function updateConstructions(dt){
  const mult = state.speed || 1;
  for (let i = state.constructions.length-1; i >= 0; i--){
    const c = state.constructions[i];
    c.progress += dt * mult;
    const pct = Math.min(1, c.progress / c.duration);

    // Rise-up effect: building mesh scales from 0 -> 1 on Y as progress goes 0.6->1.0
    if (c.mesh && pct > 0.6){
      const riseT = (pct - 0.6) / 0.4;
      c.mesh.scale.y = riseT;
      c.mesh.position.y = (c.scaffY || 0) - c.meshBaseH * (1 - riseT) * 0.5;
    }

    if (pct >= 1){
      // Construction complete -- remove scaffold, finalize building
      if (c.scaffMesh){ scene.remove(c.scaffMesh); }
      if (c.mesh){
        c.mesh.scale.y = 1;
        c.mesh.position.y = c.scaffY || 0;
      }

      // Register in buildings & grid
      const b = BUILDINGS[c.key];
      const size = getSize(c.key);
      const bEntry = { x: c.gx, z: c.gz, type: c.key, mesh: c.mesh };
      state.buildings.push(bEntry);
      addBuildingNightLight(bEntry);
      for (let dx=0; dx<size; dx++){
        for (let dz=0; dz<size; dz++){
          const nx = c.gx+dx, nz = c.gz+dz;
          if (inBounds(nx,nz)) state.grid[nx][nz] = {
            type: c.key, mesh: (dx===0&&dz===0) ? c.mesh : null,
            rotation: c.rotation, origin: { gx:c.gx, gz:c.gz }
          };
        }
      }
      if (c.key === 'road') updateRoadOrientations(c.gx, c.gz);
      recalcStats();
      CitizenSim.onBuildingChanged();
      notify(`${b.name} complete!`, `Construction finished at (${c.gx},${c.gz}).`, 'success');
      state.constructions.splice(i, 1);
    }
  }
}

function placeBuilding(key, gx, gz){
  if (!canPlaceAt(key, gx, gz)){
    if (key === 'water_pump'){
      notify('Water Pump needs water!', 'Place a Lake/River or Irrigation tile adjacent first.', 'warn');
      Audio.playError();
    }
    return false;
  }
  const b = BUILDINGS[key];
  if (state.money < b.cost) {
    notify('Insufficient funds', `Need $${b.cost.toLocaleString()} to build ${b.name}.`, 'danger');
    Audio.playError();
    return false;
  }
  const size = getSize(key);
  const wp = footprintCenterWorld(gx, gz, size);
  const rotation = state.placeRotation;

  // Instant-place types: road, railway, water tiles
  const instantKeys = ['road','railway','water_tile'];
  if (instantKeys.includes(key)){
    const mesh = makeBuildingMesh(key);
    if (!mesh) return false;
    const terrainY = TERRAIN.getHeightAt(wp.x, wp.z);
    mesh.position.set(wp.x, terrainY, wp.z);
    mesh.rotation.y = rotation * Math.PI / 2;
    scene.add(mesh);
    for (let dx=0; dx<size; dx++){
      for (let dz=0; dz<size; dz++){
        const nx=gx+dx, nz=gz+dz;
        clearWorldTreeAt(nx, nz); // remove any tree on this tile
        state.grid[nx][nz] = { type:key, mesh:(dx===0&&dz===0)?mesh:null, rotation, origin:{gx,gz} };
      }
    }
    state.money -= b.cost;
    const bEntry = { x:gx, z:gz, type:key, mesh };
    state.buildings.push(bEntry);
    addBuildingNightLight(bEntry);
    if (key === 'road') updateRoadOrientations(gx, gz);
    if (key === 'railway') updateRailwayOrientations(gx, gz);
    if (key === 'water_tile') updateWaterMerge(gx, gz);
    Audio.playPlace();
    recalcStats();
    CitizenSim.onBuildingChanged();
    return true;
  }

  // Mark tiles as under construction immediately (prevent double-placement)
  for (let dx=0; dx<size; dx++){
    for (let dz=0; dz<size; dz++){
      const nx=gx+dx, nz=gz+dz;
      if (inBounds(nx,nz)){
        clearWorldTreeAt(nx, nz); // remove any tree on this tile
        state.grid[nx][nz] = { type:key, mesh:null, rotation, origin:{gx,gz}, underConstruction:true };
      }
    }
  }

  state.money -= b.cost;
  Audio.playPlace();

  // Scaffold mesh shown immediately
  const scaffMesh = makeScaffoldMesh(key);
  const scaffY = TERRAIN.getHeightAt(wp.x, wp.z);
  scaffMesh.position.set(wp.x, scaffY, wp.z);
  scaffMesh.rotation.y = rotation * Math.PI / 2;
  scene.add(scaffMesh);

  // Real building mesh -- hidden (scale.y=0) until construction progresses
  const mesh = makeBuildingMesh(key);
  let meshBaseH = 1;
  if (mesh){
    if (size > 1 && !mesh.userData.glb) mesh.scale.set(size, 1, size);
    mesh.scale.y = 0;
    mesh.position.set(wp.x, scaffY, wp.z);
    mesh.rotation.y = rotation * Math.PI / 2;
    scene.add(mesh);
    // estimate base height for rise effect
    meshBaseH = b.h || 1;
  }

  state.constructions.push({
    gx, gz, key, mesh, scaffMesh,
    progress: 0,
    duration: buildDuration(size),
    rotation,
    meshBaseH,
    scaffY,
  });

  recalcStats();
  notify(`${b.name} under construction`, `Will be ready in ~${Math.round(buildDuration(size)/60)} min${size>1?' (large building)':''}.`, 'info');
  return true;
}

function bulldoze(gx, gz){
  if (!inBounds(gx,gz)) return false;
  const cell = state.grid[gx][gz];
  if (!cell.type) return false;

  // Slum interception â€” show Acel cutscene instead of direct demolish
  if (cell.type === '__slum__' || cell.isSlum){
    showAcelCutscene(gx, gz, (resolved) => {
      if (resolved) renderMinimap();
    });
    return false; // Don't proceed with normal bulldoze
  }

  // Cancel any in-progress construction first
  const cIdx = state.constructions.findIndex(c => c.gx===gx && c.gz===gz);
  if (cIdx !== -1){
    const c = state.constructions[cIdx];
    if (c.scaffMesh) scene.remove(c.scaffMesh);
    if (c.mesh) scene.remove(c.mesh);
    state.constructions.splice(cIdx, 1);
  }

  // find origin tile (multi-tile buildings)
  const og = cell.origin || { gx, gz };
  const originCell = state.grid[og.gx][og.gz];
  const key = originCell.type;
  const size = getSize(key);

  // Destruction animation
  // GANTI bulldoze() â€” bagian penghapusan mesh non-destruction:
if (originCell.mesh && key !== 'road'){
  spawnDestruction(originCell.mesh);
} else if (originCell.mesh){
  scene.remove(originCell.mesh);
  // JANGAN dispose geometry di sini kalau bangunan pakai GLB (hampir semua sekarang).
  // GLB geometry di-cache & di-share (GLB_CACHE), dispose di sini merusak instance lain.
  // Kalau mau tetap dispose untuk bangunan PROSEDURAL murni (bukan GLB), cek dulu:
  if (originCell.mesh.userData.glb !== true) {
    originCell.mesh.traverse(o=>{ if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
}

  // Remove night lights from bulldozed building
  const bEntry = state.buildings.find(b=>b.x===og.gx && b.z===og.gz);
  if(bEntry && bEntry.nightLights){
    for(const {light} of bEntry.nightLights) scene.remove(light);
    bEntry.nightLights = null;
  }
  if(bEntry) bEntry.emMats = null;

  state.buildings = state.buildings.filter(b=>!(b.x===og.gx && b.z===og.gz));
  // clear all occupied tiles
  for (let dx=0; dx<size; dx++){
    for (let dz=0; dz<size; dz++){
      const nx = og.gx+dx, nz = og.gz+dz;
      if (inBounds(nx,nz)) state.grid[nx][nz] = { type:null, mesh:null, rotation:0 };
    }
  }
  // Restore water shores for neighbors when water is bulldozed
  if (key === 'water_tile'){
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([ddx,ddz]) => {
      const nx = og.gx+ddx, nz = og.gz+ddz;
      if (inBounds(nx,nz)) updateWaterMerge(nx, nz);
    });
  }
  recalcStats();
  Audio.playBulldoze();
  CitizenSim.onBuildingChanged();
  return true;
}

function updateRoadOrientations(gx, gz){
  const neighbors = (x,z)=>({
    n: inBounds(x,z-1) && state.grid[x][z-1].type==='road',
    s: inBounds(x,z+1) && state.grid[x][z+1].type==='road',
    e: inBounds(x+1,z) && state.grid[x+1][z].type==='road',
    w: inBounds(x-1,z) && state.grid[x-1][z].type==='road'
  });
  const orient = (x,z)=>{
    const c = state.grid[x][z];
    if (c.type!=='road' || !c.mesh) return;
    const n = neighbors(x,z);
    const horizontal = (n.e||n.w) && !(n.n||n.s);
    // GLB road: rotate 90 deg for horizontal orientation
    c.mesh.rotation.y = horizontal ? Math.PI/2 : 0;
    // Legacy line support (procedural fallback)
    if (c.mesh.userData.line){
      c.mesh.userData.line.rotation.z = horizontal ? Math.PI/2 : 0;
    }
  };
  orient(gx,gz);
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dz])=>orient(gx+dx, gz+dz));
}

function updateRailwayOrientations(gx, gz){
  const isRail = (x,z) => inBounds(x,z) && state.grid[x][z].type==='railway';
  const orient = (x,z)=>{
    const c = state.grid[x][z];
    if (c.type!=='railway' || !c.mesh) return;
    const n = isRail(x,z-1), s = isRail(x,z+1), e = isRail(x+1,z), w = isRail(x-1,z);
    const horizontal = (e||w) && !(n||s);
    c.mesh.rotation.y = horizontal ? Math.PI/2 : 0;
  };
  orient(gx,gz);
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dz])=>orient(gx+dx, gz+dz));
}

// Check if any tile adjacent to footprint has water (water_tile)
function nearWater(gx, gz, size=1){
  for (let i=0; i<size; i++){
    const checks = [
      [gx-1,gz+i],[gx+size,gz+i],[gx+i,gz-1],[gx+i,gz+size]
    ];
    for (const [nx,nz] of checks){
      if (inBounds(nx,nz)){
        const t = state.grid[nx][nz].type;
        if (t==='water_tile') return true;
      }
    }
  }
  return false;
}

// Connection check: is tile adjacent to a road?
function nearRoad(gx, gz, size=1){
  // check all tiles bordering the footprint
  for (let i=0; i<size; i++){
    const checks = [
      [gx-1, gz+i], [gx+size, gz+i],   // left/right edges
      [gx+i, gz-1], [gx+i, gz+size],   // top/bottom edges
    ];
    for (const [nx,nz] of checks){
      if (inBounds(nx,nz) && state.grid[nx][nz].type==='road') return true;
    }
  }
  return false;
}

// -------------------- CITIZENS --------------------
function createCitizen(homeBuilding){
  const c = {
    id: Math.random().toString(36).slice(2,9),
    name: `${choice(FIRST_NAMES)} ${choice(LAST_NAMES)}`,
    age: randInt(18, 65),
    job: choice(JOBS),
    edu: choice(EDUS),
    happy: randInt(60, 90),
    health: randInt(70, 100),
    home: homeBuilding
  };
  return c;
}

// ==================== CITIZEN LIFE SIMULATION ====================
// Job roles -- maps to building types + animation activities + schedule
const CITIZEN_ROLES = {
  office_worker: {
    buildings: ['ind_office','bank'],
    activities: ['businessman','briefcase','coffee','phone','walk'],
    speed: 1.0,
    schedule: 'office',       // morningâ†’workâ†’evening
  },
  factory_worker: {
    buildings: ['ind_factory'],
    activities: ['walk','phone','coffee'],
    speed: 1.0,
    schedule: 'office',
  },
  shopkeeper: {
    buildings: ['com_shop','com_mall'],
    activities: ['shopping','shoulder_bag','walk','phone'],
    speed: 0.9,
    schedule: 'retail',       // all day
  },
  student: {
    buildings: ['school'],
    activities: ['backpack','child','headphones','walk'],
    speed: 1.15,
    schedule: 'school',       // morningâ†’schoolâ†’afternoon off
    isChild: true,
  },
  doctor: {
    buildings: ['hospital'],
    activities: ['walk','phone','briefcase'],
    speed: 1.0,
    schedule: 'office',
  },
  police: {
    buildings: ['police'],
    activities: ['walk','phone'],
    speed: 1.05,
    schedule: 'office',
  },
  firefighter: {
    buildings: ['fire'],
    activities: ['walk','jog'],
    speed: 1.1,
    schedule: 'office',
  },
  teacher: {
    buildings: ['school'],
    activities: ['briefcase','walk','phone'],
    speed: 0.9,
    schedule: 'school',
  },
  elderly: {
    buildings: null,
    activities: ['elderly','dog_walker'],
    speed: 0.5,
    schedule: 'leisure',      // always wandering during day
  },
  jogger: {
    buildings: null,
    activities: ['jog','jog_headphones'],
    speed: 1.9,
    schedule: 'leisure',
  },
  tourist: {
    buildings: null,
    activities: ['tourist','photographer','ice_cream'],
    speed: 0.7,
    schedule: 'leisure',
  },
};

// Schedule time windows using DN.dayT (0=06:00, 1=20:00) and DN.nightT (0=20:00, 1=06:00)
// Returns the desired citizen state string for this moment
function getCitizenDesiredState(role, schedule){
  const dayT = DN.dayT;
  const nightT = DN.nightT;
  const isNight = DN.isNight;

  if(schedule === 'leisure'){
    return (isNight && nightT > 0.15) ? 'at_home' : 'leisure';
  }

  if(isNight){
    if(nightT > 0.15) return 'at_home';   // after ~22:30 -- sleep
    return 'leisure';                       // early evening
  }

  // Daytime schedule
  if(schedule === 'office'){
    if(dayT < 0.12)         return 'commuting_out';   // 06:00-07:40
    if(dayT < 0.70)         return 'at_work';          // 07:40-15:50
    if(dayT < 0.57 && dayT >= 0.43) return 'leisure'; // 12:00-13:00 lunch break
    if(dayT < 0.83)         return 'commuting_back';   // 15:50-17:37
    return 'leisure';                                   // evening
  }
  if(schedule === 'school'){
    if(dayT < 0.09)         return 'commuting_out';   // 06:00-07:15
    if(dayT < 0.57)         return 'at_work';          // 07:15-14:00 (school hours)
    if(dayT < 0.70)         return 'commuting_back';   // 14:00-15:50
    return 'leisure';
  }
  if(schedule === 'retail'){
    if(dayT < 0.18)         return 'commuting_out';   // 06:00-08:30
    if(dayT < 0.92)         return 'at_work';          // 08:30-18:55
    return 'commuting_back';
  }
  return 'at_home';
}

const CitizenSim = (() => {
  // Tracked citizens with full life data -- separate from state.citizens (economy model)
  let liveCitizens = [];
  let _genTimer = 0;
  const MAX_ACTIVE_PEDS = 8;  // max citizen-driven pedestrians visible at once

  // Indonesian family names pool (some unique to distinguish from generic citizens)
  const FAMILY_NAMES = LAST_NAMES;

  // Assign a role to a citizen based on what workplaces exist
  function assignRole(){
    const allRoleKeys = Object.keys(CITIZEN_ROLES);
    const workRoles = allRoleKeys.filter(k => CITIZEN_ROLES[k].buildings !== null);
    const leisureRoles = allRoleKeys.filter(k => CITIZEN_ROLES[k].buildings === null);

    // 70% chance of a work role (if matching buildings exist), else leisure
    if(Math.random() < 0.70){
      // Shuffle work roles and find one with an available building
      const shuffled = [...workRoles].sort(() => Math.random() - 0.5);
      for(const rk of shuffled){
        const r = CITIZEN_ROLES[rk];
        const blds = state.buildings.filter(b => r.buildings.includes(b.type));
        if(blds.length > 0){
          return { roleKey: rk, workplace: choice(blds) };
        }
      }
    }
    return { roleKey: choice(leisureRoles), workplace: null };
  }

  // Generate/refresh live citizen pool from residential buildings
  function generate(){
    // Clear peds for citizens whose homes were removed
    for(const lc of liveCitizens){
      if(lc.pedRef && lc.pedRef.life > 0){
        lc.pedRef.life = 0;
        lc.pedRef = null;
      }
    }
    liveCitizens = [];

    const homes = state.buildings.filter(b => ['res_low','res_med','res_high'].includes(b.type));
    if(homes.length === 0) return;

    let familyId = 0;
    for(const home of homes){
      const cap = home.type === 'res_high' ? 4 : home.type === 'res_med' ? 3 : 2;
      const adults = randInt(1, Math.min(2, cap));
      const childCount = cap > adults ? randInt(0, Math.min(2, cap - adults)) : 0;
      familyId++;

      for(let a = 0; a < adults; a++){
        const { roleKey, workplace } = assignRole();
        const role = CITIZEN_ROLES[roleKey];
        liveCitizens.push({
          name: `${choice(FIRST_NAMES)} ${choice(FAMILY_NAMES)}`,
          age: randInt(22, 55),
          roleKey, role,
          familyId,
          home,
          workplace,
          state: 'at_home',
          pedRef: null,         // active pedestrian entry ref
          nextSpawnTimer: rand(0, 8), // stagger initial spawns
        });
      }

      for(let c = 0; c < childCount; c++){
        // Child role -- prefer school if available, else student-leisure
        const schools = state.buildings.filter(b => b.type === 'school');
        liveCitizens.push({
          name: `${choice(FIRST_NAMES)} ${choice(FAMILY_NAMES)}`,
          age: randInt(6, 16),
          roleKey: 'student',
          role: CITIZEN_ROLES.student,
          familyId,
          home,
          workplace: schools.length > 0 ? choice(schools) : null,
          state: 'at_home',
          pedRef: null,
          nextSpawnTimer: rand(0, 8),
        });
      }
    }
  }

  // Spawn a pedestrian for a live citizen
  function spawnCitizenPed(lc){
    const activeCitizenPeds = liveCitizens.filter(c => c.pedRef && c.pedRef.life > 0).length;
    if(activeCitizenPeds >= MAX_ACTIVE_PEDS) return null;

    // Anchor: if commuting back, start near workplace; else near home
    const anchor = (lc.state === 'commuting_back' && lc.workplace) ? lc.workplace : lc.home;
    if(!anchor) return null;

    const wp = gridToWorld(anchor.x, anchor.z);
    const px = wp.x + rand(-TILE * 0.6, TILE * 0.6);
    const pz = wp.z + rand(-TILE * 0.6, TILE * 0.6);

    const mesh = makePedestrian(lc.role.activities);
    mesh.position.set(px, 0, pz);
    mesh.rotation.y = rand(0, Math.PI * 2);
    scene.add(mesh);

    const baseSpeed = rand(0.5, 0.85) * (mesh.userData.speedMul || 1);

    // Set destination target
    let targetX = null, targetZ = null;
    if(lc.state === 'commuting_out' && lc.workplace){
      const tw = gridToWorld(lc.workplace.x, lc.workplace.z);
      targetX = tw.x + rand(-0.4, 0.4);
      targetZ = tw.z + rand(-0.4, 0.4);
    } else if(lc.state === 'commuting_back'){
      const hw = gridToWorld(lc.home.x, lc.home.z);
      targetX = hw.x + rand(-0.4, 0.4);
      targetZ = hw.z + rand(-0.4, 0.4);
    }

    const pedEntry = {
      mesh,
      speed: baseSpeed,
      life: (lc.state === 'leisure') ? rand(20, 40) : rand(30, 60),
      dir: rand(0, Math.PI * 2),
      changeDirTimer: rand(2, 5),
      bobTimer: rand(0, Math.PI * 2),
      activity: mesh.userData.activity,
      // Citizen link fields
      citizen: lc,
      targetX,
      targetZ,
    };

    state.pedestrians.push(pedEntry);
    return pedEntry;
  }

  // Per-tick steering: bias commuter direction toward target
  function steerToward(pe){
    if(!pe.targetX) return;
    const dx = pe.targetX - pe.mesh.position.x;
    const dz = pe.targetZ - pe.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    if(dist < 0.6){
      pe.life = 0;  // arrived
      return;
    }
    const targetAngle = Math.atan2(dz, dx);
    let diff = targetAngle - pe.dir;
    while(diff >  Math.PI) diff -= Math.PI * 2;
    while(diff < -Math.PI) diff += Math.PI * 2;
    // 65% steer toward target, 35% free wander
    pe.dir += diff * 0.08 + rand(-0.05, 0.05);
    pe.changeDirTimer = rand(2, 5);  // override random wander timer
  }

  // Main update
  function update(dt, crowdF){
    if(liveCitizens.length === 0) return;

    _genTimer -= dt;

    for(const lc of liveCitizens){
      const desired = getCitizenDesiredState(lc.roleKey, lc.role.schedule);

      // State transition
      if(desired !== lc.state){
        lc.state = desired;
        // Expire current ped when state changes to at_home or at_work (go indoors)
        if((desired === 'at_home' || desired === 'at_work') && lc.pedRef){
          lc.pedRef.life = 0;
          lc.pedRef = null;
        }
        lc.nextSpawnTimer = rand(1, 6); // short delay before appearing
      }

      // Invisible states: do nothing
      if(lc.state === 'at_home' || lc.state === 'at_work') continue;

      // Check if ped still alive
      if(lc.pedRef && lc.pedRef.life <= 0) lc.pedRef = null;

      // Spawn if needed (with stagger timer and crowd factor gate)
      if(!lc.pedRef){
        lc.nextSpawnTimer -= dt;
        if(lc.nextSpawnTimer <= 0 && Math.random() < crowdF){
          lc.pedRef = spawnCitizenPed(lc);
          lc.nextSpawnTimer = rand(8, 20); // respawn delay if ped expires naturally
        }
      } else {
        // Steer commuters toward destination
        if(lc.state === 'commuting_out' || lc.state === 'commuting_back'){
          steerToward(lc.pedRef);
        }
      }
    }
  }

  // Call when a building is placed or demolished to refresh matching citizens
  function onBuildingChanged(){
    // Incremental update: remove citizens whose home/workplace was removed
    const buildingSet = new Set(state.buildings);
    liveCitizens = liveCitizens.filter(lc => {
      const homeOk = lc.home && buildingSet.has(lc.home);
      if(!homeOk && lc.pedRef){ lc.pedRef.life = 0; lc.pedRef = null; }
      return homeOk;
    });
    // Invalidate workplaces that no longer exist
    for(const lc of liveCitizens){
      if(lc.workplace && !buildingSet.has(lc.workplace)){
        lc.workplace = null;
        lc.state = 'at_home';
        if(lc.pedRef){ lc.pedRef.life = 0; lc.pedRef = null; }
      }
    }
    // Add new citizens for newly built residences
    const homes = state.buildings.filter(b => ['res_low','res_med','res_high'].includes(b.type));
    const knownHomes = new Set(liveCitizens.map(lc => lc.home));
    for(const home of homes){
      if(!knownHomes.has(home)){
        const cap = home.type === 'res_high' ? 4 : home.type === 'res_med' ? 3 : 2;
        const adults = randInt(1, Math.min(2, cap));
        for(let a = 0; a < adults; a++){
          const { roleKey, workplace } = assignRole();
          liveCitizens.push({
            name: `${choice(FIRST_NAMES)} ${choice(FAMILY_NAMES)}`,
            age: randInt(22, 55),
            roleKey, role: CITIZEN_ROLES[roleKey],
            familyId: Math.floor(Math.random() * 9999),
            home, workplace,
            state: 'at_home',
            pedRef: null,
            nextSpawnTimer: rand(2, 10),
          });
        }
      }
    }
  }

  function getLiveCitizens(){ return liveCitizens; }

  return { generate, update, onBuildingChanged, getLiveCitizens };
})();

// -------------------- VEHICLES --------------------

// ===================== TRAIN SYSTEM =====================
let TRAIN_GLB_TEMPLATE = null;
let _trainGlbPending = true;

// Load kereta-api.glb
gltfLoader.load('./model/car/kereta-api.glb', (gltf) => {
  const root = gltf.scene;
  // Normalize: longest XZ dimension -> ~3.5 world units (one train body spanning ~1.75 tiles)
  for (let pass = 0; pass < 2; pass++){
    const box = new THREE.Box3().setFromObject(root);
    const sz  = box.getSize(new THREE.Vector3());
    const maxXZ = Math.max(sz.x, sz.z);
    if (maxXZ < 0.001) break;
    root.scale.multiplyScalar(12.0 / maxXZ);
  }
  // Sit on y=0, center XZ
  const box2 = new THREE.Box3().setFromObject(root);
  const center = box2.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box2.min.y;
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

  // Corrector so the long axis aligns with +X (movement direction)
  const corrector = new THREE.Group();
  corrector.rotation.y = Math.PI / 2;
  corrector.add(root);
  const wrapper = new THREE.Group();
  wrapper.add(corrector);
  TRAIN_GLB_TEMPLATE = wrapper;
  _trainGlbPending = false;
  console.log('[train] kereta-api.glb loaded');
}, undefined, (err) => {
  console.warn('[train] kereta-api.glb failed, using procedural fallback', err);
  _trainGlbPending = false;
});

// ===================== DESERT ENV GLB MODELS =====================
let _desertMountTemplate = null;
let _desertRockTemplate  = null;
let _desertTreeTemplate  = null;
let _desertGlbPending    = 3;

function _normalizeEnvGlb(root, targetH){
  for (let pass = 0; pass < 2; pass++){
    const box = new THREE.Box3().setFromObject(root);
    const sz = box.getSize(new THREE.Vector3());
    if (sz.y < 0.001) break;
    root.scale.multiplyScalar(targetH / sz.y);
  }
  const box2 = new THREE.Box3().setFromObject(root);
  const center = box2.getCenter(new THREE.Vector3());
  // Bake offset into children so root.position stays (0,0,0).
  // This means clone.position.set(wx, terrainY, wz) places bottom exactly at terrainY.
  const sx = root.scale.x || 1, sy = root.scale.y || 1, sz2 = root.scale.z || 1;
  root.children.forEach(child => {
    child.position.x -= center.x / sx;
    child.position.z -= center.z / sz2;
    child.position.y -= box2.min.y / sy;
  });
  root.position.set(0, 0, 0);
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
}

gltfLoader.load('./model/env/desert_mount.glb', (gltf) => {
  _normalizeEnvGlb(gltf.scene, 16);
  _desertMountTemplate = gltf.scene;
  if (--_desertGlbPending === 0 && state.running) spawnDesertZone();
  console.log('[desert] mount loaded');
}, undefined, err => { console.warn('[desert] mount failed', err); if(--_desertGlbPending===0 && state.running) spawnDesertZone(); });

gltfLoader.load('./model/env/desert_rock.glb', (gltf) => {
  _normalizeEnvGlb(gltf.scene, 1.4);
  _desertRockTemplate = gltf.scene;
  if (--_desertGlbPending === 0 && state.running) spawnDesertZone();
  console.log('[desert] rock loaded');
}, undefined, err => { console.warn('[desert] rock failed', err); if(--_desertGlbPending===0 && state.running) spawnDesertZone(); });

gltfLoader.load('./model/env/desert_tree.glb', (gltf) => {
  _normalizeEnvGlb(gltf.scene, 2.2);
  _desertTreeTemplate = gltf.scene;
  if (--_desertGlbPending === 0 && state.running) spawnDesertZone();
  console.log('[desert] tree loaded');
}, undefined, err => { console.warn('[desert] tree failed', err); if(--_desertGlbPending===0 && state.running) spawnDesertZone(); });

// ===================== BEACH ENV GLB MODELS =====================
let _beachTreeTemplate = null;
let _beachGlbReady     = false;

gltfLoader.load('./model/env/beach_tree.glb', (gltf) => {
  _normalizeEnvGlb(gltf.scene, 3.5);
  _beachTreeTemplate = gltf.scene;
  _beachGlbReady = true;
  console.log('[beach] palm tree loaded');
  if (state.running) spawnBeachZone();
}, undefined, err => {
  console.warn('[beach] palm tree failed', err);
  _beachGlbReady = true;
  if (state.running) spawnBeachZone();
});

// ===================== UFO SYSTEM =====================
let _ufoTemplate = null;
let _ufoGlbReady = false;

gltfLoader.load('./model/egg/ufo.glb', (gltf) => {
  const root = gltf.scene;
  _normalizeEnvGlb(root, 0.5); // tinggi ~1.4 unit, sesuaikan kalau kegedean/kekecilan
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = false; }});
  _ufoTemplate = root;
  _ufoGlbReady = true;
  console.log('[ufo] loaded');
}, undefined, err => {
  console.warn('[ufo] failed to load, pakai fallback prosedural', err);
  _ufoGlbReady = true;
});

if (!state.ufo) state.ufo = null;
if (typeof state._ufoPrevNightT === 'undefined') state._ufoPrevNightT = 0;

const UFO_SPAWN_CHANCE  = 0.5;   // peluang muncul tiap tengah malam (50%)
const UFO_MIN_DURATION  = 180;   // 3 menit (detik real, mengikuti speed game)
const UFO_MAX_DURATION  = 600;   // 10 menit

function makeUfoMesh(){
  if (_ufoTemplate) return _ufoTemplate.clone(true);
  // Fallback kalau GLB gagal load
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), mat(0x88ccdd));
  body.scale.set(1, 0.3, 1);
  g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI*2, 0, Math.PI/2), glassMat(0x224444, 0.7));
  dome.position.y = 0.15;
  g.add(dome);
  for (let i=0; i<8; i++){
    const a = (i/8)*Math.PI*2;
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6), emissiveMat(0xffee66, 1.2));
    light.position.set(Math.cos(a)*0.9, -0.1, Math.sin(a)*0.9);
    g.add(light);
  }
  return g;
}

function spawnUFO(forceDuration){
  if (state.ufo) return; // sudah ada UFO aktif

  const dz = state._desertZone;
  const baseX = dz ? dz.cx : (HALF - 30);
  const baseZ = dz ? dz.cz : (HALF - 30);

  const mesh = makeUfoMesh();
  const hoverHeight = rand(12, 18);
  mesh.position.set(baseX + rand(-15,15), hoverHeight, baseZ + rand(-15,15));
  mesh.rotation.y = rand(0, Math.PI*2);
  scene.add(mesh);

  // Beam visual -- cone transparan dengan additive blending biar menyatu dengan cahaya di tanah
  const beamGeo = new THREE.ConeGeometry(1.4, hoverHeight*0.9, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x88ffcc, transparent: true, opacity: 0.18,
    side: THREE.DoubleSide, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -hoverHeight*0.45;
  beam.rotation.x = Math.PI;
  mesh.add(beam);

  // Lampu kecil berkedip (di badan UFO)
  const blinkLight = new THREE.PointLight(0x66ffcc, 1.2, 20, 2);
  blinkLight.position.y = -0.2;
  mesh.add(blinkLight);

  // SpotLight -- cahaya sorot BENERAN yang menerangi tanah/gedung di bawah UFO
  const spot = new THREE.SpotLight(0x88ffcc, 3.5, hoverHeight * 2.2, Math.PI/9, 0.4, 1.2);
  spot.position.set(0, 0, 0); // relatif ke mesh (di badan UFO)
  scene.add(spot);

  const spotTarget = new THREE.Object3D();
  scene.add(spotTarget);
  spot.target = spotTarget;

  // Posisi awal target tepat di bawah UFO
  spotTarget.position.set(mesh.position.x, 0, mesh.position.z);
  spot.position.copy(mesh.position);

  const duration = forceDuration || rand(UFO_MIN_DURATION, UFO_MAX_DURATION);

  state.ufo = {
    mesh, beam, blinkLight, spot, spotTarget,
    baseX, baseZ, hoverHeight,
    life: duration,
    bobTimer: rand(0, Math.PI*2),
    driftAngle: rand(0, Math.PI*2),
    driftRadius: rand(10, 25),
    driftSpeed: rand(0.05, 0.15),
  };

  notify('ðŸ‘½ UFO Terlihat!', `Sesuatu yang aneh melayang dekat gunung gurun... (~${Math.round(duration/60)} menit)`, 'warn');
  console.log(`[ufo] spawned, durasi ${Math.round(duration)}s`);
}

function despawnUFO(){
  if (!state.ufo) return;
  scene.remove(state.ufo.mesh);
  state.ufo.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  if (state.ufo.spot) scene.remove(state.ufo.spot);
  if (state.ufo.spotTarget) scene.remove(state.ufo.spotTarget);
  state.ufo = null;
  console.log('[ufo] despawned');
}

function updateUFO(dt){
  if (!state.ufo) return;
  const u = state.ufo;
  u.life -= dt;
  if (u.life <= 0){ despawnUFO(); return; }

  u.bobTimer += dt * 1.2;
  u.driftAngle += dt * u.driftSpeed;
  u.mesh.position.x = u.baseX + Math.cos(u.driftAngle) * u.driftRadius;
  u.mesh.position.z = u.baseZ + Math.sin(u.driftAngle) * u.driftRadius;
  u.mesh.position.y = u.hoverHeight + Math.sin(u.bobTimer) * 1.2;
  u.mesh.rotation.y += dt * 0.4;
  u.blinkLight.intensity = 0.8 + Math.sin(u.bobTimer * 6) * 0.6;

  // SpotLight ikut posisi UFO, target selalu tepat di tanah di bawahnya
  if (u.spot && u.spotTarget){
    u.spot.position.copy(u.mesh.position);
    u.spotTarget.position.set(u.mesh.position.x, 0, u.mesh.position.z);
    // Sedikit flicker biar terasa "hidup"
    u.spot.intensity = 3.0 + Math.sin(u.bobTimer * 4) * 0.8;
  }

  const dx = u.mesh.position.x - camTarget.x, dz = u.mesh.position.z - camTarget.z;
  const visible = (dx*dx + dz*dz) <= 220*220;
  u.mesh.visible = visible;
  if (u.spot) u.spot.visible = visible;
}

// Cek "tengah malam" tiap tick -- pakai DN.nightT biar akurat, deteksi saat melewati 0.4 (=00:00)
function tickUFOMidnight(){
  if (!state.running) return;
  if (DN.isNight){
    const cur = DN.nightT;
    if (state._ufoPrevNightT < 0.4 && cur >= 0.4){
      if (!state.ufo && Math.random() < UFO_SPAWN_CHANCE){
        spawnUFO();
      }
    }
    state._ufoPrevNightT = cur;
  } else {
    state._ufoPrevNightT = 0;
  }
}

// ===================== GHOST EASTER EGG =====================
// Ghost appears in forest at night (between 23:00 - 03:00)
let _ghostMeshEE = null;
let _ghostActive = false;
let _ghostTimer = 0;

function spawnGhostEasterEgg(){
  if(_ghostActive || _ghostMeshEE) return;
  // Find a spot in the forest zone
  const forestKeys = Object.keys(state._worldTrees || {});
  if(forestKeys.length === 0) return;
  const treeKey = choice(forestKeys);
  const [tx, tz] = treeKey.split(',').map(Number);
  const wp = gridToWorld(tx, tz);
  
  // Create ghost mesh (simple transparent glowing sphere)
  const ghostGeo = new THREE.SphereGeometry(0.4, 8, 6);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.4 });
  _ghostMeshEE = new THREE.Mesh(ghostGeo, ghostMat);
  _ghostMeshEE.position.set(wp.x, 1.5, wp.z);
  // Add eerie point light
  const ghostLight = new THREE.PointLight(0x88ffcc, 0.8, 5);
  _ghostMeshEE.add(ghostLight);
  scene.add(_ghostMeshEE);
  _ghostActive = true;
  _ghostTimer = 0;
}

function despawnGhost(){
  if(_ghostMeshEE){
    scene.remove(_ghostMeshEE);
    _ghostMeshEE.geometry.dispose();
    _ghostMeshEE.material.dispose();
    _ghostMeshEE = null;
  }
  _ghostActive = false;
}

function updateGhostEasterEgg(dt){
  // Only active at night between ~23:00 and ~03:00
  const clock = DN.clockStr;
  const hour = parseInt(clock.split(':')[0]);
  const isGhostHour = (hour >= 23 || hour <= 3) && DN.isNight;
  
  if(isGhostHour && !_ghostActive && Math.random() < 0.002){
    spawnGhostEasterEgg();
  }
  
  if(_ghostActive && _ghostMeshEE){
    _ghostTimer += dt;
    // Ghost floats and fades
    _ghostMeshEE.position.y = 1.5 + Math.sin(_ghostTimer * 2) * 0.3;
    _ghostMeshEE.material.opacity = 0.2 + Math.sin(_ghostTimer * 3) * 0.2;
    _ghostMeshEE.rotation.y += dt * 0.5;
    // Despawn after 30 seconds or when it's no longer ghost hour
    if(_ghostTimer > 30 || !isGhostHour){
      despawnGhost();
    }
  }
}

// ===================== SHIP SYSTEM =====================
// Ships patrol the ocean area near the beach zone, slowly back and forth

const SHIP_MODELS = [
  { path: './model/ship/boat.glb',           h: 0.8, rotY: Math.PI / 2 },
  { path: './model/ship/penangkap-ikan.glb', h: 1.0, rotY: 0 },
  { path: './model/ship/sampan.glb',         h: 0.5, rotY: 0 },
];
const SHIP_COUNT    = 3;
const SHIP_SPEED    = rand(1.5, 3.0); // world units per second

let _shipTemplates  = [];  // [{ scene, rotY }]
let _shipGlbLoaded  = 0;

for (const sm of SHIP_MODELS){
  gltfLoader.load(sm.path, (gltf) => {
    _normalizeEnvGlb(gltf.scene, sm.h);
    _shipTemplates.push({ scene: gltf.scene, rotY: sm.rotY || 0 });
    _shipGlbLoaded++;
    console.log(`[ship] loaded ${sm.path}`);
    if (_shipGlbLoaded >= SHIP_MODELS.length && state.running) spawnShips();
  }, undefined, err => {
    console.warn(`[ship] failed ${sm.path}`, err);
    _shipGlbLoaded++;
    if (_shipGlbLoaded >= SHIP_MODELS.length && state.running) spawnShips();
  });
}

function spawnShips(){
  _spawnShipsModule(scene, state, _shipTemplates, SHIP_COUNT, rand);
}

function clearShips(){
  _clearShipsModule(scene, state);
}

function updateShips(dt){
  _updateShipsModule(state, dt, camTarget);
}


// Each deer is tracked; hunt tool removes them with a small money reward

const _deerAnimalCfg = getAnimalById('deer');
const DEER_COUNT_MAX  = _deerAnimalCfg ? _deerAnimalCfg.countMax : 6;
const DEER_MONEY_REWARD = _deerAnimalCfg ? (_deerAnimalCfg.moneyReward || 200) : 200;  // Rp reward per deer hunted
let _deerGLB         = null;    // loaded template gltf (not added to scene)
let _deerAnimations  = [];      // AnimationClip[] from GLB
let _deerReady       = false;
let _deerGLTF        = null;    // raw gltf reference for SkeletonUtils.clone

gltfLoader.load('./model/animal/deer.glb', (gltf) => {
  const root = gltf.scene;
  // Normalize height to ~0.35 world unit (visible at city scale, ~half building height)
  const box0 = new THREE.Box3().setFromObject(root);
  const sz0  = box0.getSize(new THREE.Vector3());
  const _deerScale = _deerAnimalCfg ? _deerAnimalCfg.scale : 0.35;
  if (sz0.y > 0.001) root.scale.multiplyScalar(_deerScale / sz0.y);

  const box2 = new THREE.Box3().setFromObject(root);
  const c = box2.getCenter(new THREE.Vector3());
  const dsx = root.scale.x || 1, dsy = root.scale.y || 1, dsz = root.scale.z || 1;
  root.children.forEach(child => {
    child.position.x -= c.x / dsx;
    child.position.z -= c.z / dsz;
    child.position.y -= box2.min.y / dsy;
  });
  root.position.set(0, 0, 0);
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
  _deerGLB = root;
  _deerGLTF = gltf;
  _deerAnimations = gltf.animations || [];
  _deerReady = true;
  console.log('[deer] loaded, animations:', _deerAnimations.map(a=>a.name).join(', '));
  // Spawn deer now if game is running
  if (state.running && _forestCenter) spawnDeer();
}, undefined, err => { console.warn('[deer] failed', err); _deerReady = true; });

// state.deers = [{ mesh, mixer, walkAction, eatAction, state:'walk'|'eat', stateTimer, wx, wz, dir, speed }]
if (!state.deers) state.deers = [];

function makeDeerMesh(){
  if (!_deerGLB || !_deerGLTF) return null;
  // SkeletonUtils.clone properly rebinds skeleton bones for skinned meshes
  const clone = SkeletonUtils.clone(_deerGLB);
  const s = rand(0.85, 1.15);
  clone.scale.multiplyScalar(s); // multiply, not set â€” preserve normalization scale
  clone.rotation.y = rand(0, Math.PI * 2);
  clone.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

  // Mixer must target the clone root
  const mixer = new THREE.AnimationMixer(clone);
  let walkAction = null, eatAction = null;

  for (const clip of _deerAnimations){
    const lc = clip.name.toLowerCase();
    if (lc.includes('walk')){
      walkAction = mixer.clipAction(clip);
      walkAction.loop = THREE.LoopRepeat;
    } else if (lc.includes('eat')){
      eatAction = mixer.clipAction(clip);
      eatAction.loop = THREE.LoopRepeat;
    }
  }
  // Fallback: if no named anims, just use first two clips
  if (!walkAction && _deerAnimations.length > 0){
    walkAction = mixer.clipAction(_deerAnimations[0]);
    walkAction.loop = THREE.LoopRepeat;
  }
  if (!eatAction && _deerAnimations.length > 1){
    eatAction = mixer.clipAction(_deerAnimations[1]);
    eatAction.loop = THREE.LoopRepeat;
  }

  return { clone, mixer, walkAction, eatAction };
}

function spawnDeer(){
  if (!_deerReady || !_forestCenter) return;
  if (state.deers.length >= DEER_COUNT_MAX) return;

  const toSpawn = Math.min(DEER_COUNT_MAX - state.deers.length, randInt(6, 10));
  const fc      = _forestCenter;
  const spread  = FOREST_ZONE_SIZE * 1.6;

  for (let i = 0; i < toSpawn; i++){
    const result = makeDeerMesh();
    if (!result) break;
    const { clone, mixer, walkAction, eatAction } = result;

    // 70% inside/near forest, 30% wandering a bit further
    const close = Math.random() < 0.7;
    const angle = rand(0, Math.PI * 2);
    const dist  = close ? rand(1, spread * 0.7) : rand(spread * 0.7, spread);
    const wx = clamp(fc.x + Math.cos(angle) * dist, -HALF + 2, HALF - 2);
    const wz = clamp(fc.z + Math.sin(angle) * dist, -HALF + 2, HALF - 2);
    clone.position.set(wx, TERRAIN.getHeightAt(wx, wz), wz);
    scene.add(clone);

    // Start animation
    const startState = Math.random() < 0.5 ? 'eat' : 'walk';
    if (startState === 'eat' && eatAction)  { eatAction.reset().play(); }
    else if (walkAction)                     { walkAction.reset().play(); }

    state.deers.push({
      mesh: clone, mixer, walkAction, eatAction,
      state: startState,
      stateTimer: rand(3, 10),
      wx, wz,
      dirAngle: rand(0, Math.PI * 2),
      speed: rand(1.8, 3.0),
    });
  }
  console.log(`[deer] spawned ${toSpawn}, total ${state.deers.length}`);
}

function updateDeers(dt){
  if (!state.deers || !state.deers.length) return;
  const fc = _forestCenter;

  for (let i = state.deers.length - 1; i >= 0; i--){
    const d = state.deers[i];
    if (!d.mesh) continue;

    // Update animation mixer
    d.mixer.update(dt);

    // State timer countdown
    d.stateTimer -= dt;
    if (d.stateTimer <= 0){
      // Switch state
      d.state = d.state === 'walk' ? 'eat' : 'walk';
      d.stateTimer = d.state === 'eat' ? rand(4, 12) : rand(3, 8);
      d.dirAngle = rand(0, Math.PI * 2); // new walk direction

      // Crossfade animations
      if (d.state === 'eat'){
        if (d.walkAction) d.walkAction.fadeOut(0.4);
        if (d.eatAction)  d.eatAction.reset().fadeIn(0.4).play();
      } else {
        if (d.eatAction)  d.eatAction.fadeOut(0.4);
        if (d.walkAction) d.walkAction.reset().fadeIn(0.4).play();
      }
    }

    // Move if walking
    if (d.state === 'walk'){
      // Wander within forest zone (return to forest if too far)
      const homeX = fc ? fc.x : 0, homeZ = fc ? fc.z : 0;
      const distFromHome = Math.sqrt((d.wx-homeX)**2 + (d.wz-homeZ)**2);
      if (distFromHome > FOREST_ZONE_SIZE * 1.6){
        // Steer back toward forest
        d.dirAngle = Math.atan2(homeZ - d.wz, homeX - d.wx) + rand(-0.3, 0.3);
      } else {
        // Slight random drift
        d.dirAngle += rand(-0.15, 0.15);
      }

      const moveX = Math.cos(d.dirAngle) * d.speed * dt;
      const moveZ = Math.sin(d.dirAngle) * d.speed * dt;
      d.wx = clamp(d.wx + moveX, -HALF + 1, HALF - 1);
      d.wz = clamp(d.wz + moveZ, -HALF + 1, HALF - 1);
      d.mesh.position.set(d.wx, TERRAIN.getHeightAt(d.wx, d.wz), d.wz);
      d.mesh.rotation.y = -d.dirAngle + Math.PI / 2;
    }

    // Distance culling
    const camDx = d.wx - camTarget.x, camDz = d.wz - camTarget.z;
    d.mesh.visible = (camDx*camDx + camDz*camDz) <= 110*110;
  }
}

// ── Registry Animal System ──────────────────────────────────────
// Spawns non-deer animals defined in config/registry/animals.json
const _registryAnimalInstances = {}; // { animalId: [{ mesh, mixer, wx, wz, dirAngle, speed, state, timer }] }

function spawnRegistryAnimals() {
  const forestAnimals  = getAnimalsForZone('forest').filter(a => a.id !== 'deer');
  const desertAnimals  = getAnimalsForZone('desert');
  const oceanAnimals   = getAnimalsForZone('ocean');
  const cityAnimals    = getAnimalsForZone('city');

  const spawnGroup = (animals, centerX, centerZ, spread) => {
    for (const cfg of animals) {
      if (!_registryAnimalInstances[cfg.id]) _registryAnimalInstances[cfg.id] = [];
      const instances = _registryAnimalInstances[cfg.id];
      const toSpawn = Math.max(0, (cfg.countMax || 3) - instances.length);
      for (let i = 0; i < toSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * spread;
        const wx = Math.max(-HALF + 2, Math.min(HALF - 2, centerX + Math.cos(angle) * dist));
        const wz = Math.max(-HALF + 2, Math.min(HALF - 2, centerZ + Math.sin(angle) * dist));
        const wy = TERRAIN.getHeightAt(wx, wz);
        const g = new THREE.Group();
        const scale = cfg.scale || 0.3;
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(scale * 1.2, scale, scale * 0.7),
          new THREE.MeshLambertMaterial({ color: 0x8B6914 })
        );
        body.position.y = scale * 0.5;
        body.castShadow = true;
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(scale * 0.5, scale * 0.5, scale * 0.5),
          new THREE.MeshLambertMaterial({ color: 0x7a5500 })
        );
        head.position.set(scale * 0.6, scale * 0.9, 0);
        head.castShadow = true;
        g.add(body, head);
        g.position.set(wx, wy, wz);
        g.rotation.y = Math.random() * Math.PI * 2;
        scene.add(g);
        instances.push({
          mesh: g, cfg,
          wx, wz,
          dirAngle: Math.random() * Math.PI * 2,
          speed: 1.0 + Math.random() * 1.5,
          state: 'idle',
          timer: 2 + Math.random() * 5,
        });
      }
    }
  };

  if (_forestCenter && forestAnimals.length) {
    spawnGroup(forestAnimals, _forestCenter.x, _forestCenter.z, FOREST_ZONE_SIZE);
  }
  if (state._desertZone && desertAnimals.length) {
    spawnGroup(desertAnimals, state._desertZone.cx, state._desertZone.cz, state._desertZone.radius * 0.8);
  }
  if (oceanAnimals.length) {
    spawnGroup(oceanAnimals, 0, HALF * 0.78, HALF * 0.22);
  }
  if (cityAnimals.length) {
    spawnGroup(cityAnimals, 0, 0, HALF * 0.4);
  }
}

function updateRegistryAnimals(dt) {
  for (const instances of Object.values(_registryAnimalInstances)) {
    for (let i = instances.length - 1; i >= 0; i--) {
      const a = instances[i];
      a.timer -= dt;
      if (a.timer <= 0) {
        a.state = a.state === 'walk' ? 'idle' : 'walk';
        a.timer = a.state === 'idle' ? (2 + Math.random() * 5) : (3 + Math.random() * 6);
        a.dirAngle = Math.random() * Math.PI * 2;
      }
      if (a.state === 'walk') {
        a.wx = Math.max(-HALF + 1, Math.min(HALF - 1, a.wx + Math.cos(a.dirAngle) * a.speed * dt));
        a.wz = Math.max(-HALF + 1, Math.min(HALF - 1, a.wz + Math.sin(a.dirAngle) * a.speed * dt));
        a.mesh.position.set(a.wx, TERRAIN.getHeightAt(a.wx, a.wz), a.wz);
        a.mesh.rotation.y = -a.dirAngle + Math.PI / 2;
      }
      const camDx = a.wx - camTarget.x, camDz = a.wz - camTarget.z;
      a.mesh.visible = (camDx * camDx + camDz * camDz) <= 110 * 110;
    }
  }
}

function huntDeer(wx, wz){
  if (!state.deers || !state.deers.length) return false;
  const rangeSq = 8 * 8; // hunt range: 8 world units
  let closest = null, closestDist = rangeSq;
  for (const d of state.deers){
    const dx = d.wx - wx, dz = d.wz - wz;
    const dist = dx*dx + dz*dz;
    if (dist < closestDist){ closestDist = dist; closest = d; }
  }
  if (!closest) return false;

  // Remove deer
  scene.remove(closest.mesh);
  closest.mixer.stopAllAction();
  closest.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  state.deers = state.deers.filter(d => d !== closest);

  // Reward
  state.money += DEER_MONEY_REWARD;
  renderTopBar();
  notify('ðŸ¦Œ Rusa Ditangkap!', `+Rp${DEER_MONEY_REWARD.toLocaleString('id-ID')} dari berburu rusa!`, 'success');
  Audio.playNotify && Audio.playNotify('success');
  return true;
}

// Slum buildings appear after mission level 10, every 2 in-game hours
// They raise pollution, drain money, and can only be cleared via Acel cutscene

const SLUM_TEMPLATES = [];  // [{scene, size}]  loaded GLBs
let _slumGlbLoaded = 0;
const SLUM_PATHS = [
  './model/slum/slum1.glb',
  './model/slum/slum2.glb',
];
// Load slum models
SLUM_PATHS.forEach((path, idx) => {
  gltfLoader.load(path, (gltf) => {
    const root = gltf.scene;
    // Normalize to ~1.5 world units tall (compact shack)
    for (let pass = 0; pass < 2; pass++){
      const box = new THREE.Box3().setFromObject(root);
      const sz  = box.getSize(new THREE.Vector3());
      if (sz.y < 0.001) break;
      root.scale.multiplyScalar(1.5 / sz.y);
    }
    const box2 = new THREE.Box3().setFromObject(root);
    const center = box2.getCenter(new THREE.Vector3());
    const slsx = root.scale.x || 1, slsy = root.scale.y || 1, slsz = root.scale.z || 1;
    root.children.forEach(child => {
      child.position.x -= center.x / slsx;
      child.position.z -= center.z / slsz;
      child.position.y -= box2.min.y / slsy;
    });
    root.position.set(0, 0, 0);
    root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});
    SLUM_TEMPLATES.push(root);
    _slumGlbLoaded++;
    console.log(`[slum] loaded ${path}`);
  }, undefined, (err) => {
    console.warn(`[slum] failed ${path}`, err);
    _slumGlbLoaded++;
  });
});

// State tracking for slums
// Each slum: { gx, gz, mesh, pollutionDrain, moneydrain }
if (!state.slums) state.slums = [];
if (typeof state._slumTimer === 'undefined') state._slumTimer = 0;
if (typeof state._slumDrainAcc === 'undefined') state._slumDrainAcc = 0;
// 2 in-game hours = 2/24 * DN.CYCLE seconds real
const SLUM_SPAWN_INTERVAL = () => (2 / 24) * DN.CYCLE;  // ~900 real seconds at 1x
const SLUM_POLLUTION   = 8;  // pollution added per slum (per recalc)
const SLUM_MONEY_DRAIN = 150; // Rp per game-day per slum
const SLUM_BRIBE_BASE  = 2000; // cost to bribe Acel and demolish
const SLUM_RELOCATE_BASE = 4500; // cost to relocate residents

function makeSlumMesh(){
  if (SLUM_TEMPLATES.length > 0){
    const tmpl = SLUM_TEMPLATES[Math.floor(Math.random() * SLUM_TEMPLATES.length)];
    const clone = tmpl.clone(true);
    // Random rotation
    clone.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
    return clone;
  }
  // Procedural fallback: ramshackle box
  const g = new THREE.Group();
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x7a1a1a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), wallMat);
  body.position.y = 0.5;
  body.castShadow = true;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), roofMat);
  roof.position.y = 1.3;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(body, roof);
  return g;
}

function spawnSlum(){
  if (!state.running || state.paused) return;
  const count = 2 + (Math.random() < 0.4 ? 1 : 0); // 2 or 3
  const { min, max } = getLandBounds();
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 120){
    attempts++;
    const gx = min + Math.floor(Math.random() * (max - min));
    const gz = min + Math.floor(Math.random() * (max - min));
    if (!inBounds(gx, gz)) continue;
    if (state.grid[gx][gz].type !== null) continue;
    // Prefer edge-ish tiles (slums appear on outskirts)
    const mid = Math.floor((min + max) / 2);
    const dist = Math.max(Math.abs(gx - mid), Math.abs(gz - mid));
    if (dist < Math.floor((max - min) * 0.3) && Math.random() < 0.6) continue; // bias toward edges

    const mesh = makeSlumMesh();
    const wp = gridToWorld(gx, gz);
    mesh.position.set(wp.x, TERRAIN.getHeightAt(wp.x, wp.z), wp.z);
    mesh.userData.isSlum = true;
    scene.add(mesh);
    state.grid[gx][gz] = { type: '__slum__', mesh, rotation: 0, isSlum: true };
    state.slums.push({ gx, gz, mesh });
    placed++;
  }
  if (placed > 0){
    recalcStats();
    notify('ðŸšï¸ Pemukiman Kumuh!',
      `${placed} rumah kumuh muncul di pinggiran kota! Segera tangani!`, 'danger');
    Audio.playError && Audio.playError();
  }
}

// Called every game tick â€” checks timer and drains money
function tickSlums(dt, mult){
  if (!state.running) return;
  const missionOk = state.missionLevel >= 10 || state.freeMode || state.sandbox;
  if (!missionOk) return;
  if (!Array.isArray(state.slums)) state.slums = [];

  // Timer for spawning
  state._slumTimer = (state._slumTimer || 0) + dt * mult;
  if (state._slumTimer >= SLUM_SPAWN_INTERVAL()){
    state._slumTimer = 0;
    if (state.slums.length < 12) spawnSlum(); // cap at 12 slum tiles total
  }

  // Money drain every game-day tick (handled in gameTick but we tally here)
  // Actually drain accumulated during dayTick (see gameTick integration)
}

// Recalc adds slum pollution on top of building pollution
function getSlumPollution(){
  return (state.slums ? state.slums.length : 0) * SLUM_POLLUTION;
}
function getSlumDrain(){
  return (state.slums ? state.slums.length : 0) * SLUM_MONEY_DRAIN;
}

// ---- Acel cutscene (shown when bulldozing a slum) ----
function showAcelCutscene(gx, gz, onResolved){
  const slumIdx = state.slums.findIndex(s => s.gx === gx && s.gz === gz);
  if (slumIdx === -1){ onResolved && onResolved(false); return; }

  const bribeCost    = SLUM_BRIBE_BASE  + state.slums.length * 200;
  const relocateCost = SLUM_RELOCATE_BASE + state.slums.length * 400;

  const overlay = document.createElement('div');
  overlay.id = 'acel-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9000;display:flex;align-items:flex-end;justify-content:center;
    background:rgba(0,0,0,0.72);font-family:'Segoe UI',sans-serif;
  `;

  overlay.innerHTML = `
    <div id="acel-panel" style="
      position:relative;width:100%;max-width:720px;margin:0 auto 40px;
      background:linear-gradient(135deg,#1a0f00 0%,#2d1800 60%,#1a0f00 100%);
      border:2px solid #c8860a;border-radius:16px;padding:28px 32px 24px;
      box-shadow:0 0 60px #c8860a66;
    ">
      <div style="display:flex;align-items:flex-end;gap:24px;">
        <img src="./img/assets/char/acel.PNG"
             style="width:120px;height:auto;object-fit:contain;filter:drop-shadow(0 0 12px #c8860a88);
                    border-radius:8px;border:2px solid #c8860a44;flex-shrink:0;">
        <div style="flex:1;">
          <div style="color:#c8860a;font-size:12px;font-weight:600;letter-spacing:2px;margin-bottom:6px;">
            ACEL â€” PENJILAT PROFESIONAL
          </div>
          <div id="acel-text" style="
            color:#f5e6c8;font-size:15px;line-height:1.7;min-height:80px;
            background:rgba(0,0,0,0.3);border-radius:8px;padding:12px 14px;
            border-left:3px solid #c8860a;
          ">...</div>
          <div id="acel-hint" style="color:#c8860a88;font-size:11px;margin-top:6px;cursor:pointer;">
            â–¼ klik untuk lanjut
          </div>
        </div>
      </div>
      <div id="acel-choices" style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const textEl    = overlay.querySelector('#acel-text');
  const hintEl    = overlay.querySelector('#acel-hint');
  const choicesEl = overlay.querySelector('#acel-choices');

  let typeTimer2 = null;
  let typing2 = false;
  let full2 = '';
  let pendingDone2 = null;

  function typeAcel(txt, cb){
    clearInterval(typeTimer2);
    textEl.textContent = ''; choicesEl.innerHTML = '';
    hintEl.style.visibility = 'hidden';
    full2 = txt; typing2 = true; pendingDone2 = cb || null;
    let i = 0;
    typeTimer2 = setInterval(()=>{
      if (i >= full2.length){
        clearInterval(typeTimer2); typing2 = false;
        hintEl.style.visibility = 'visible';
        const cb2 = pendingDone2; pendingDone2 = null; cb2 && cb2();
        return;
      }
      textEl.textContent += full2[i++];
    }, 28);
  }

  function skipAcel(){
    if (typing2){
      clearInterval(typeTimer2); typing2 = false;
      textEl.textContent = full2; hintEl.style.visibility = 'visible';
      const cb2 = pendingDone2; pendingDone2 = null; cb2 && cb2();
    }
  }

  overlay.addEventListener('click', (e)=>{
    if (e.target.closest('#acel-choices')) return;
    skipAcel();
  });

  function showChoices(items){
    choicesEl.innerHTML = '';
    items.forEach(({ label, color, fn }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding:10px 18px;border-radius:8px;border:2px solid ${color};
        background:rgba(0,0,0,0.5);color:${color};cursor:pointer;font-size:13px;
        font-weight:600;transition:all 0.2s;
      `;
      btn.onmouseenter = () => { btn.style.background = color + '33'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(0,0,0,0.5)'; };
      btn.addEventListener('click', () => { choicesEl.innerHTML=''; fn(); });
      choicesEl.appendChild(btn);
    });
  }

  function close(success){
    overlay.style.transition = 'opacity 0.4s';
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.remove(); onResolved && onResolved(success); }, 400);
  }

  function doDestroy(){
    const slum = state.slums[slumIdx];
    if (slum){
      scene.remove(slum.mesh);
      state.grid[slum.gx][slum.gz] = { type:null, mesh:null, rotation:0 };
      state.slums.splice(slumIdx, 1);
      recalcStats();
      Audio.playBulldoze && Audio.playBulldoze();
    }
  }

  // Step 1 â€” intro
  typeAcel(`Eh bos! Santai santai dulu... ðŸ˜Š\n\nSaya Acel, "konsultan relasi warga" di sini. Saya yang ngurusin orang-orang ini ya bos. Mereka ga bakal kemana-mana kalau ga ada "pendekatan" dulu... hehe. Bos mau gimana ini, kita bicarain baik-baik aja kan?`, () => {
    showChoices([
      {
        label: `ðŸ’¸ Suap Acel â€” Rp${bribeCost.toLocaleString('id-ID')}`,
        color: '#ffaa00',
        fn: () => {
          if (state.money < bribeCost){
            typeAcel(`Aduh bos... uangnya kurang nih. Masa mau nawar-nawar sama Acel? Hehe... tambahin dulu ya bos! ðŸ˜…`, () => {
              showChoices([{ label:'Tutup', color:'#888', fn:()=>close(false) }]);
            });
            return;
          }
          state.money -= bribeCost;
          renderTopBar();
          typeAcel(`Nah gitu dong bos! Langsung cair! ðŸ˜\nOke okelah, saya atur mereka pindah sekarang. Tapi ingat ya bos, besok-besok ada lagi yang minta "perhatian"... hehe. Acel selalu siap! ðŸ¤`, () => {
            doDestroy();
            notify('ðŸ’¸ Suap Berhasil', `Acel mengurus segalanya. -Rp${bribeCost.toLocaleString('id-ID')}`, 'warn');
            showChoices([{ label:'Terima kasih (tutup)', color:'#c8860a', fn:()=>close(true) }]);
          });
        }
      },
      {
        label: `ðŸ  Relokasi ke Perumahan â€” Rp${relocateCost.toLocaleString('id-ID')}`,
        color: '#44cc88',
        fn: () => {
          if (state.money < relocateCost){
            typeAcel(`Wah bos, duitnya ga cukup buat relokasi. Dana relokasi itu besar bos, harus Rp${relocateCost.toLocaleString('id-ID')}. Mau pilih jalur lain? ðŸ˜…`, () => {
              showChoices([
                {
                  label: `ðŸ’¸ Suap saja â€” Rp${bribeCost.toLocaleString('id-ID')}`,
                  color: '#ffaa00',
                  fn: () => {
                    choicesEl.innerHTML = '';
                    if (state.money < bribeCost){
                      typeAcel(`Dua-duanya ga ada duitnya bos?? Hehe... tutup dulu aja ya. ðŸ¤·`, () => {
                        showChoices([{ label:'Tutup', color:'#888', fn:()=>close(false) }]);
                      });
                      return;
                    }
                    state.money -= bribeCost;
                    renderTopBar();
                    typeAcel(`Oke bos! Beres! ðŸ˜`, () => {
                      doDestroy();
                      notify('ðŸ’¸ Suap Berhasil', `Acel mengurus segalanya. -Rp${bribeCost.toLocaleString('id-ID')}`, 'warn');
                      showChoices([{ label:'Tutup', color:'#c8860a', fn:()=>close(true) }]);
                    });
                  }
                },
                { label:'Biarkan saja', color:'#888', fn:()=>close(false) }
              ]);
            });
            return;
          }
          state.money -= relocateCost;
          renderTopBar();
          // Reward: relocating gives back long-term tax boost
          state._slumRelocationBonus = (state._slumRelocationBonus || 0) + 1;
          typeAcel(`Wah bagus sekali bos! Bos memang hati emas! ðŸ¥¹\nWarga-warga ini akan dipindah ke perumahan layak. Mereka akan jadi warga produktif yang bayar pajak dengan senang hati! Kota bos pasti makin maju!`, () => {
            doDestroy();
            // Relocate: gain some population and small permanent income boost
            state.money += Math.round(relocateCost * 0.1); // 10% subsidi balik
            state.population = Math.min(state.population + 15, state.homes);
            notify('ðŸ  Relokasi Sukses!',
              `Warga kumuh kini produktif! +15 populasi, bonus pajak permanen. -Rp${relocateCost.toLocaleString('id-ID')}`, 'success');
            Audio.playLevelUp && Audio.playLevelUp();
            showChoices([{ label:'Luar biasa! (tutup)', color:'#44cc88', fn:()=>close(true) }]);
          });
        }
      },
      {
        label: 'ðŸš« Biarkan Saja',
        color: '#888',
        fn: () => {
          typeAcel(`Iya bos, santai aja... mereka juga ga kemana-mana kok. Tapi ingat ya bos, lama-lama polusinya makin parah dan duit bos makin terkuras~ Hehe. ðŸ˜`, () => {
            showChoices([{ label:'Tutup', color:'#888', fn:()=>close(false) }]);
          });
        }
      }
    ]);
  });
}

function makeTrain(){
  if (TRAIN_GLB_TEMPLATE){
    const clone = TRAIN_GLB_TEMPLATE.clone(true);
    clone.userData.isTrain = true;
    return clone;
  }
  // Procedural fallback (if GLB not yet loaded)
  const g = new THREE.Group();
  const bodyCol = choice([0xffffff, 0x0055cc, 0xcc2200, 0x33aa44]);
  const carLen = 1.1, carGap = 0.05;
  const nCars = 3;
  const totalLen = nCars * carLen + (nCars - 1) * carGap;
  let xOff = -totalLen / 2 + carLen / 2;
  for (let ci = 0; ci < nCars; ci++){
    const car = new THREE.Group();
    addBox(car, carLen, 0.22, 0.28, 0, 0.16, 0, mat(bodyCol));
    addBox(car, carLen, 0.03, 0.30, 0, 0.22, 0, mat(0x0033aa));
    for (const wx of [-carLen*0.3, carLen*0.3]){
      for (const wz of [-0.16, 0.16]){
        addCyl(car, 0.05, 0.05, 0.05, 8, mat(0x333344), wx, 0.05, wz, 0, 0, Math.PI/2);
      }
    }
    car.position.x = xOff;
    g.add(car);
    xOff += carLen + carGap;
  }
  g.scale.setScalar(0.55);
  g.userData.isTrain = true;
  return g;
}

function spawnTrain(){
  const rails = state.buildings.filter(b => b.type === 'railway');
  if (rails.length < 3) return;
  const start = choice(rails);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const valid = dirs.filter(([dx,dz]) => {
    const nx = start.x+dx, nz = start.z+dz;
    return inBounds(nx,nz) && state.grid[nx][nz].type === 'railway';
  });
  if (!valid.length) return;
  const [dx, dz] = choice(valid);
  const wp = gridToWorld(start.x, start.z);
  const mesh = makeTrain();
  mesh.position.set(wp.x, TERRAIN.getHeightAt(wp.x, wp.z), wp.z);
  mesh.rotation.y = dirToYaw(dx, dz);
  scene.add(mesh);
  const nextWP = gridToWorld(start.x + dx, start.z + dz);
  state.vehicles.push({
    mesh, gx: start.x, gz: start.z, dx, dz,
    tx: nextWP.x, tz: nextWP.z,
    ngx: start.x + dx, ngz: start.z + dz,
    speed: rand(4.0, 6.0), life: rand(30, 60),
    targetYaw: dirToYaw(dx, dz),
    isTrain: true
  });
}

function pickNextDirectionTrain(v){
  const forward = [v.dx, v.dz];
  const right   = [-v.dz, v.dx];
  const left    = [v.dz, -v.dx];
  const opts = [];
  for (const [dx,dz] of [forward, right, left]){
    const nx = v.ngx+dx, nz = v.ngz+dz;
    if (inBounds(nx,nz) && state.grid[nx][nz].type === 'railway'){
      const w = (dx===v.dx && dz===v.dz) ? 5 : 1;
      for (let i=0;i<w;i++) opts.push([dx,dz]);
    }
  }
  return opts.length ? choice(opts) : null;
}

function makeCar(){
  if (CAR_TEMPLATES.length > 0){
    const tpl = choice(CAR_TEMPLATES);
    return tpl.clone(true);
  }
  // ---- Procedural fallback ----
  const g = new THREE.Group();
  const bodyColor2 = choice([0xff3333,0x3399ff,0xffcc00,0xffffff,0x33cc66,0xff6600,0xcc33ff,0x00ccff,0xff9900,0x66dd00]);
  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor2 });
  const darkMat  = mat(0x222233);
  const glassMt  = glassMat(0xaaddff, 0.55);
  const chromeMat = mat(0xddddee);

  // --- Sedan body using extruded side profile ---
  const profile = new THREE.Shape();
  profile.moveTo(-0.44, 0.04);           // rear bottom
  profile.lineTo( 0.44, 0.04);           // front bottom
  profile.lineTo( 0.46, 0.16);           // front bumper curve
  profile.lineTo( 0.42, 0.21);           // hood start
  profile.lineTo( 0.28, 0.23);           // hood flat
  profile.lineTo( 0.20, 0.34);           // windshield base
  profile.lineTo( 0.10, 0.43);           // windshield top
  profile.lineTo(-0.10, 0.44);           // roof flat
  profile.lineTo(-0.22, 0.42);           // rear window top
  profile.lineTo(-0.38, 0.29);           // trunk line
  profile.lineTo(-0.46, 0.16);           // rear bumper
  profile.lineTo(-0.44, 0.04);
  const extGeo = new THREE.ExtrudeGeometry(profile, { depth:0.32, bevelEnabled:true, bevelThickness:0.018, bevelSize:0.018, bevelSegments:3 });
  extGeo.translate(0, 0, -0.16);
  const body = new THREE.Mesh(extGeo, bodyMat);
  body.castShadow = true;
  g.add(body);

  // underbody
  addBox(g, 0.88, 0.04, 0.3, 0, 0.06, 0, darkMat);

  // bumper bars
  addBox(g, 0.35, 0.07, 0.35, 0.42, 0.12, 0, chromeMat);
  addBox(g, 0.35, 0.07, 0.35, -0.42, 0.12, 0, chromeMat);

  // front windshield glass
  const wsFront = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), glassMt);
  wsFront.position.set(0.15, 0.385, 0);
  wsFront.rotation.set(0, Math.PI/2, -0.7);
  g.add(wsFront);
  // rear windshield glass
  const wsRear = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.15), glassMt);
  wsRear.position.set(-0.3, 0.36, 0);
  wsRear.rotation.set(0, Math.PI/2, 0.65);
  g.add(wsRear);
  // side windows (2 per side)
  for (const zs of [0.155, -0.155]){
    const sw1 = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.1), glassMt);
    sw1.position.set(0.06, 0.39, zs); sw1.rotation.y = zs > 0 ? -Math.PI/2 : Math.PI/2;
    g.add(sw1);
    const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.1), glassMt);
    sw2.position.set(-0.16, 0.38, zs); sw2.rotation.y = zs > 0 ? -Math.PI/2 : Math.PI/2;
    g.add(sw2);
  }

  // wheels with hubcap
  const wheelMat = mat(0x111122);
  const hubcapMat = mat(0xddddee);
  const spokeMat  = mat(0x999aaa);
  function wheel(x, z){
    const wg = new THREE.Group();
    // tyre
    addCyl(wg, 0.095, 0.095, 0.075, 16, wheelMat, 0, 0, 0, 0, 0, Math.PI/2);
    // wheel disc
    addCyl(wg, 0.072, 0.072, 0.076, 16, hubcapMat, 0, 0, 0, 0, 0, Math.PI/2);
    // 5 spokes
    for (let i=0;i<5;i++){
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.077, 0.014, 0.08), spokeMat);
      spoke.rotation.z = i*Math.PI/5*2;
      spoke.position.x = Math.cos(i*Math.PI/5*2)*0.032;
      spoke.position.y = Math.sin(i*Math.PI/5*2)*0.032;
      spoke.position.z = 0.038;
      wg.add(spoke);
    }
    // hub cap center
    addCyl(wg, 0.022, 0.022, 0.082, 8, emissiveMat(bodyColor2, 0.15), 0, 0, 0, 0, 0, Math.PI/2);
    wg.position.set(x, 0.1, z);
    wg.castShadow = true;
    g.add(wg);
  }
  wheel( 0.28,  0.165); wheel( 0.28, -0.165);
  wheel(-0.27,  0.165); wheel(-0.27, -0.165);

  // headlights
  addSphere(g, 0.035, 6, emissiveMat(0xfef9c3, 1.0), 0.44, 0.22,  0.1);
  addSphere(g, 0.035, 6, emissiveMat(0xfef9c3, 1.0), 0.44, 0.22, -0.1);
  // tail lights
  addBox(g, 0.025, 0.04, 0.08, -0.45, 0.22,  0.1, emissiveMat(0xef4444, 0.8));
  addBox(g, 0.025, 0.04, 0.08, -0.45, 0.22, -0.1, emissiveMat(0xef4444, 0.8));
  // side mirrors
  addBox(g, 0.025, 0.035, 0.04, 0.22, 0.32,  0.175, darkMat);
  addBox(g, 0.025, 0.035, 0.04, 0.22, 0.32, -0.175, darkMat);
  // door handles
  addBox(g, 0.035, 0.025, 0.025, 0.04, 0.26,  0.162, chromeMat);
  addBox(g, 0.035, 0.025, 0.025, 0.04, 0.26, -0.162, chromeMat);
  addBox(g, 0.035, 0.025, 0.025, -0.18, 0.26,  0.162, chromeMat);
  addBox(g, 0.035, 0.025, 0.025, -0.18, 0.26, -0.162, chromeMat);
  applyOutlines(g, 0.06);
  return g;
}

// -------------------- PEDESTRIAN (detailed procedural) --------------------
// Realistic procedural humans with varied ethnicities, body types, clothing, hair, accessories,
// and activities (walking, jogging, on phone, with backpack, umbrella, child, elderly).
// Built using capsules/cylinders/spheres rather than boxes for smoother bodies.

// Ethnicity skin tones (Fitzpatrick-inspired range)
const SKIN_TONES = [
  0xfde7d3, // very fair
  0xf6d2b4, // fair
  0xe5b18a, // light
  0xd4a373, // medium
  0xc68e63, // tan
  0xa56a3e, // brown
  0x8a4f2a, // dark brown
  0x5c3a1e, // very dark
];
// Hair colors per ethnicity range
const HAIR_COLORS = [
  0x1a0e08, 0x2b1810, 0x3d2418, 0x5a3825, 0x8a5a2e,
  0xb8865a, 0xd4a574, 0xe8c87a, 0xf0d878, 0x4a2818,
  0x666666, 0x999999, 0xcccccc, 0xeeeeee,            // greys / whites for elderly
  0xa01e1e, 0xc04020,                                 // red / auburn
];
const SHIRT_COLORS = [
  0xe63946,0x3a86ff,0x06d6a0,0xffb703,0x8338ec,0xfb5607,
  0x00afb9,0xef476f,0x118ab2,0xf3722c,0x9b5de5,0xf15bb5,
  0x4cc9f0,0xff006e,0x83b692,0xff9b54,0x7fb069,0xb56576,
];
const PANT_COLORS = [0x2c3e50,0x34495e,0x1a252f,0x6c757d,0x4a5859,0x5e3023,0x3d3635,0x1b3b1f];
const SHOE_COLORS = [0x1a1a1a,0x2c1810,0x5a3825,0x4a4a4a,0xffffff,0x8b0000];

// Activity types -- wider variety
const ACTIVITIES = [
  'walk','walk','walk','walk','walk',
  'jog',
  'phone',
  'backpack',
  'umbrella',
  'briefcase',
  'shopping',
  'shoulder_bag',
  'child',
  'elderly',
  'dog_walker',
  'cyclist',
  'tourist',         // camera + cap
  'coffee',          // holding coffee cup
  'ice_cream',       // holding ice cream
  'headphones',      // wearing headphones
  'jog_headphones',  // jogging with headphones
  'photographer',    // raising camera to eye
  'skater',          // on a skateboard
  'businessman',     // briefcase + suit colors
  'tourist',         // duplicated -> more common
];

// Pre-built shared geometries (cache for performance)
// Proportions tuned to ~7.5 heads tall (realistic adult anatomy).
// Final group scaled down at end of makePedestrian() to fit world (~0.55m tall adult).
const _PED_GEO = {
  head:      new THREE.SphereGeometry(0.075, 14, 12),
  jaw:       new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI*2, Math.PI/2.2, Math.PI/2),
  torsoUp:   new THREE.CylinderGeometry(0.08, 0.095, 0.20, 12),   // chest (wider top)
  torsoDown: new THREE.CylinderGeometry(0.095, 0.075, 0.14, 12),  // abdomen (taper to waist)
  hips:      new THREE.CylinderGeometry(0.075, 0.085, 0.08, 12),
  neck:      new THREE.CylinderGeometry(0.028, 0.032, 0.05, 8),
  shoulder:  new THREE.SphereGeometry(0.045, 8, 6),
  upperArm:  new THREE.CylinderGeometry(0.032, 0.028, 0.20, 8),
  forearm:   new THREE.CylinderGeometry(0.028, 0.022, 0.19, 8),
  hand:      new THREE.SphereGeometry(0.032, 8, 6),
  thigh:     new THREE.CylinderGeometry(0.05, 0.04, 0.28, 10),
  shin:      new THREE.CylinderGeometry(0.038, 0.028, 0.26, 8),
  knee:      new THREE.SphereGeometry(0.042, 8, 6),
  foot:      new THREE.BoxGeometry(0.07, 0.035, 0.13),
  hair1:     new THREE.SphereGeometry(0.082, 14, 10),
  hair2:     new THREE.SphereGeometry(0.085, 14, 10, 0, Math.PI*2, 0, Math.PI/2.3),
  bun:       new THREE.SphereGeometry(0.055, 10, 8),
  cap:       new THREE.CylinderGeometry(0.085, 0.085, 0.035, 12),
  capBrim:   new THREE.BoxGeometry(0.14, 0.012, 0.07),
  fedora:    new THREE.CylinderGeometry(0.078, 0.082, 0.08, 12),
  fedoraBrim:new THREE.CylinderGeometry(0.13, 0.13, 0.012, 16),
  hijab:     new THREE.SphereGeometry(0.105, 14, 12, 0, Math.PI*2, 0, Math.PI/1.5),
  glasses:   new THREE.TorusGeometry(0.018, 0.004, 6, 12),
  briefcase: new THREE.BoxGeometry(0.07, 0.09, 0.035),
  bag:       new THREE.BoxGeometry(0.075, 0.095, 0.045),
  backpack:  new THREE.BoxGeometry(0.115, 0.16, 0.06),
  shoulderBag: new THREE.BoxGeometry(0.10, 0.08, 0.04),
  phone:     new THREE.BoxGeometry(0.022, 0.042, 0.006),
  camera:    new THREE.BoxGeometry(0.06, 0.04, 0.035),
  cameraLens:new THREE.CylinderGeometry(0.015, 0.018, 0.025, 10),
  coffeeCup: new THREE.CylinderGeometry(0.018, 0.014, 0.05, 10),
  coffeeLid: new THREE.CylinderGeometry(0.02, 0.02, 0.008, 10),
  iceCream:  new THREE.ConeGeometry(0.018, 0.045, 8),
  iceCreamScoop: new THREE.SphereGeometry(0.02, 8, 6),
  headphones:new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI),
  headphonePad: new THREE.SphereGeometry(0.022, 8, 6),
  umbrellaShaft: new THREE.CylinderGeometry(0.004, 0.004, 0.40, 6),
  umbrellaCanopy: new THREE.ConeGeometry(0.15, 0.075, 14, 1, true),
  cane:      new THREE.CylinderGeometry(0.007, 0.007, 0.38, 6),
  // Dog (for dog walker)
  dogBody:   new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8),
  dogHead:   new THREE.SphereGeometry(0.04, 8, 6),
  dogLeg:    new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6),
  dogTail:   new THREE.CylinderGeometry(0.008, 0.005, 0.05, 6),
  dogEar:    new THREE.ConeGeometry(0.018, 0.03, 6),
  // Bicycle
  bikeWheel: new THREE.TorusGeometry(0.095, 0.012, 8, 16),
  bikeFrame: new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6),
  // Skateboard
  skateDeck: new THREE.BoxGeometry(0.06, 0.012, 0.22),
  skateWheel:new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8),
};

function pickHairStyle(){
  return choice(['short','short','short','medium','medium','long','long','bun','bald','cap','fedora','hijab']);
}

function buildHair(g, style, hairColor, headY, skinMat){
  const hairMat = mat(hairColor);
  if (style === 'bald') return;
  if (style === 'hijab') {
    const hijabMat = mat(choice([0x8b4789,0x5e60ce,0xff006e,0x3a86ff,0xffba08,0x06d6a0,0x222222,0xf2f2f2]));
    const h = new THREE.Mesh(_PED_GEO.hijab, hijabMat);
    h.position.y = headY - 0.005;
    g.add(h);
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.12, 10), hijabMat);
    drape.position.y = headY - 0.10;
    g.add(drape);
    return;
  }
  if (style === 'cap') {
    const cap = new THREE.Mesh(_PED_GEO.cap, hairMat);
    cap.position.y = headY + 0.035;
    g.add(cap);
    const brim = new THREE.Mesh(_PED_GEO.capBrim, hairMat);
    brim.position.set(0, headY + 0.04, 0.07);
    g.add(brim);
    return;
  }
  if (style === 'fedora') {
    const hatMat = mat(choice([0x2c1810,0x1a1a1a,0x3d2418,0x5a3825]));
    const crown = new THREE.Mesh(_PED_GEO.fedora, hatMat);
    crown.position.y = headY + 0.06;
    g.add(crown);
    const brim = new THREE.Mesh(_PED_GEO.fedoraBrim, hatMat);
    brim.position.y = headY + 0.025;
    g.add(brim);
    return;
  }
  if (style === 'short') {
    const top = new THREE.Mesh(_PED_GEO.hair2, hairMat);
    top.position.y = headY + 0.005;
    g.add(top);
    return;
  }
  if (style === 'medium') {
    const top = new THREE.Mesh(_PED_GEO.hair1, hairMat);
    top.position.y = headY - 0.01;
    top.scale.set(1.05, 0.95, 1.1);
    g.add(top);
    return;
  }
  if (style === 'long') {
    const top = new THREE.Mesh(_PED_GEO.hair1, hairMat);
    top.position.y = headY - 0.01;
    top.scale.set(1.05, 1, 1.15);
    g.add(top);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.022, 0.20, 8), hairMat);
    tail.position.set(0, headY - 0.13, -0.07);
    g.add(tail);
    return;
  }
  if (style === 'bun') {
    const top = new THREE.Mesh(_PED_GEO.hair2, hairMat);
    top.position.y = headY + 0.005;
    g.add(top);
    const bun = new THREE.Mesh(_PED_GEO.bun, hairMat);
    bun.position.set(0, headY + 0.07, -0.04);
    g.add(bun);
    return;
  }
}

function maybeAddFacialHair(g, headY, hairColor){
  if (Math.random() < 0.25){
    const beardMat = mat(hairColor);
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI*2, Math.PI/2.5, Math.PI/2.5), beardMat);
    beard.position.set(0, headY - 0.05, 0.04);
    beard.scale.set(1, 0.85, 0.9);
    g.add(beard);
  }
  if (Math.random() < 0.18){
    // glasses
    const glassMatBlk = mat(0x111111);
    const lensL = new THREE.Mesh(_PED_GEO.glasses, glassMatBlk);
    lensL.position.set(-0.03, headY + 0.005, 0.08);
    lensL.rotation.y = 0;
    g.add(lensL);
    const lensR = new THREE.Mesh(_PED_GEO.glasses, glassMatBlk);
    lensR.position.set(0.03, headY + 0.005, 0.08);
    g.add(lensR);
    // bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.003, 0.003), glassMatBlk);
    bridge.position.set(0, headY + 0.007, 0.085);
    g.add(bridge);
  }
}

function addAccessoryForActivity(parts, activity){
  const { g, rightHand, leftHand, torso, headG } = parts;

  if (activity === 'phone' || activity === 'businessman' && Math.random() < 0.4){
    const phone = new THREE.Mesh(_PED_GEO.phone, mat(0x000000));
    phone.position.set(0.012, -0.018, 0.004);
    rightHand.add(phone);
    parts._holdingRight = true;
  }
  if (activity === 'briefcase' || activity === 'businessman'){
    const bc = new THREE.Mesh(_PED_GEO.briefcase, mat(choice([0x3d2418,0x1a1a1a,0x5a3825])));
    bc.position.set(0.012, -0.05, 0);
    rightHand.add(bc);
    // handle
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 10, Math.PI), mat(0x1a1a1a));
    h.position.set(0.012, -0.005, 0);
    h.rotation.set(Math.PI/2, 0, 0);
    rightHand.add(h);
    parts._holdingRight = true;
  }
  if (activity === 'shopping'){
    const bagColor = choice([0xff006e,0x06d6a0,0xffb703,0x3a86ff,0xef476f,0xffffff]);
    const bag = new THREE.Mesh(_PED_GEO.bag, mat(bagColor));
    bag.position.set(0.018, -0.06, 0);
    rightHand.add(bag);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 12, Math.PI), mat(bagColor));
    handle.position.set(0.018, -0.012, 0);
    handle.rotation.x = Math.PI/2;
    rightHand.add(handle);
    parts._holdingRight = true;
    // Sometimes carry a second bag in left hand
    if (Math.random() < 0.5){
      const bag2 = bag.clone(); leftHand.add(bag2);
      const h2 = handle.clone(); leftHand.add(h2);
      parts._holdingLeft = true;
    }
  }
  if (activity === 'shoulder_bag'){
    const sbColor = choice([0x8b4789,0x3a86ff,0xef476f,0x2c1810,0x06d6a0]);
    const sb = new THREE.Mesh(_PED_GEO.shoulderBag, mat(sbColor));
    sb.position.set(0.12, -0.02, 0.02);
    torso.add(sb);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.012), mat(sbColor));
    strap.position.set(0.06, 0.08, 0.02);
    strap.rotation.z = -0.3;
    torso.add(strap);
  }
  if (activity === 'umbrella'){
    const um = new THREE.Group();
    const shaft = new THREE.Mesh(_PED_GEO.umbrellaShaft, mat(0x2c1810));
    shaft.position.y = 0.14;
    um.add(shaft);
    const canopy = new THREE.Mesh(_PED_GEO.umbrellaCanopy, mat(choice([0xef476f,0x3a86ff,0x06d6a0,0xffb703,0x000000,0xff006e,0xffffff]), {side:2}));
    canopy.position.y = 0.36;
    um.add(canopy);
    rightHand.add(um);
    parts._holdingRight = true;
  }
  if (activity === 'backpack' || activity === 'tourist'){
    const bp = new THREE.Mesh(_PED_GEO.backpack, mat(choice([0x1d3557,0x6a040f,0x2d6a4f,0x3d348b,0x000000,0xef476f])));
    bp.position.set(0, 0, -0.075);
    torso.add(bp);
    const sL = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.18, 0.018), mat(0x1a1a1a));
    sL.position.set(-0.055, 0.05, -0.035);
    torso.add(sL);
    const sR = sL.clone(); sR.position.x = 0.055;
    torso.add(sR);
  }
  if (activity === 'tourist' || activity === 'photographer'){
    const camBody = new THREE.Mesh(_PED_GEO.camera, mat(0x111111));
    const lens = new THREE.Mesh(_PED_GEO.cameraLens, mat(0x222222));
    if (activity === 'photographer'){
      // raised to eye
      const cg = new THREE.Group();
      cg.add(camBody);
      lens.rotation.x = Math.PI/2;
      lens.position.z = 0.03;
      cg.add(lens);
      cg.position.set(0, -0.02, 0.01);
      rightHand.add(cg);
      parts._holdingRight = true;
    } else {
      // hanging around neck
      camBody.position.set(0, -0.13, 0.10);
      torso.add(camBody);
      lens.rotation.x = Math.PI/2;
      lens.position.set(0, -0.13, 0.13);
      torso.add(lens);
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.004), mat(0x1a1a1a));
      strap1.position.set(-0.04, -0.05, 0.08); strap1.rotation.z = -0.3;
      torso.add(strap1);
      const strap2 = strap1.clone(); strap2.position.x = 0.04; strap2.rotation.z = 0.3;
      torso.add(strap2);
    }
  }
  if (activity === 'coffee'){
    const cup = new THREE.Mesh(_PED_GEO.coffeeCup, mat(0xffffff));
    cup.position.set(0.012, -0.02, 0);
    rightHand.add(cup);
    const lid = new THREE.Mesh(_PED_GEO.coffeeLid, mat(0x8b4513));
    lid.position.set(0.012, 0.005, 0);
    rightHand.add(lid);
    parts._holdingRight = true;
  }
  if (activity === 'ice_cream'){
    const cone = new THREE.Mesh(_PED_GEO.iceCream, mat(0xd2a679));
    cone.position.set(0.012, -0.005, 0);
    rightHand.add(cone);
    const scoop = new THREE.Mesh(_PED_GEO.iceCreamScoop, mat(choice([0xff69b4,0xfff5b8,0x6b3410,0x90ee90])));
    scoop.position.set(0.012, 0.022, 0);
    rightHand.add(scoop);
    parts._holdingRight = true;
  }
  if (activity === 'headphones' || activity === 'jog_headphones'){
    const hp = new THREE.Mesh(_PED_GEO.headphones, mat(choice([0x111111,0xef476f,0x3a86ff,0xffffff])));
    hp.rotation.x = Math.PI/2;
    hp.position.y = 0.06;
    headG.add(hp);
    const padL = new THREE.Mesh(_PED_GEO.headphonePad, mat(0x111111));
    padL.position.set(-0.078, 0, 0);
    headG.add(padL);
    const padR = padL.clone(); padR.position.x = 0.078;
    headG.add(padR);
  }
  if (activity === 'dog_walker'){
    // dog companion as separate Object placed by updater; tag mesh
    parts._needsDog = true;
    // leash held in right hand
    const leash = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.18, 4), mat(0xff006e));
    leash.position.set(0.012, -0.09, 0.04);
    leash.rotation.x = 0.4;
    rightHand.add(leash);
    parts._holdingRight = true;
  }
  if (activity === 'cyclist'){
    parts._needsBike = true;
  }
  if (activity === 'skater'){
    parts._needsSkate = true;
  }
  if (activity === 'elderly'){
    const cane = new THREE.Mesh(_PED_GEO.cane, mat(0x3d2418));
    cane.position.set(0.025, -0.18, 0);
    rightHand.add(cane);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.005, 6, 8, Math.PI), mat(0x3d2418));
    handle.position.set(0.025, 0.01, 0);
    handle.rotation.set(0, 0, Math.PI/2);
    rightHand.add(handle);
    parts._holdingRight = true;
  }
}

function buildDog(){
  const d = new THREE.Group();
  const fur = mat(choice([0xc8a472,0xe8d5a3,0x4a3520,0xf5f5f5,0x1a1a1a,0xb8865a]));
  const body = new THREE.Mesh(_PED_GEO.dogBody, fur);
  body.rotation.z = Math.PI/2;
  body.position.y = 0.07;
  d.add(body);
  const head = new THREE.Mesh(_PED_GEO.dogHead, fur);
  head.position.set(0.08, 0.09, 0);
  d.add(head);
  const earL = new THREE.Mesh(_PED_GEO.dogEar, fur);
  earL.position.set(0.08, 0.13, -0.025);
  earL.rotation.x = 0.4;
  d.add(earL);
  const earR = earL.clone(); earR.position.z = 0.025; earR.rotation.x = -0.4;
  d.add(earR);
  const tail = new THREE.Mesh(_PED_GEO.dogTail, fur);
  tail.position.set(-0.08, 0.10, 0);
  tail.rotation.z = -0.6;
  d.add(tail);
  for (const [x,z] of [[0.05,-0.03],[0.05,0.03],[-0.05,-0.03],[-0.05,0.03]]){
    const leg = new THREE.Mesh(_PED_GEO.dogLeg, fur);
    leg.position.set(x, 0.03, z);
    d.add(leg);
  }
  d.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return d;
}

function buildBike(){
  const b = new THREE.Group();
  const frameMat = mat(choice([0xef476f,0x3a86ff,0x06d6a0,0xffb703,0x111111,0xffffff]));
  const wheelMat = mat(0x111111);
  const wf = new THREE.Mesh(_PED_GEO.bikeWheel, wheelMat);
  wf.rotation.y = Math.PI/2; wf.position.set(0.13, 0.095, 0);
  b.add(wf);
  const wr = wf.clone(); wr.position.x = -0.13;
  b.add(wr);
  // frame bars
  const bar1 = new THREE.Mesh(_PED_GEO.bikeFrame, frameMat);
  bar1.rotation.z = Math.PI/3; bar1.position.set(0.04, 0.13, 0);
  b.add(bar1);
  const bar2 = new THREE.Mesh(_PED_GEO.bikeFrame, frameMat);
  bar2.rotation.z = -Math.PI/3; bar2.position.set(-0.04, 0.13, 0);
  b.add(bar2);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.025), mat(0x111111));
  seat.position.set(-0.07, 0.18, 0);
  b.add(seat);
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.10, 6), frameMat);
  handlebar.rotation.x = Math.PI/2;
  handlebar.position.set(0.10, 0.20, 0);
  b.add(handlebar);
  b.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return b;
}

function buildSkateboard(){
  const s = new THREE.Group();
  const deck = new THREE.Mesh(_PED_GEO.skateDeck, mat(choice([0xef476f,0x3a86ff,0x06d6a0,0xffb703,0x111111])));
  deck.position.y = 0.03;
  s.add(deck);
  for (const [x,z] of [[-0.025,-0.085],[0.025,-0.085],[-0.025,0.085],[0.025,0.085]]){
    const w = new THREE.Mesh(_PED_GEO.skateWheel, mat(0xffffff));
    w.rotation.z = Math.PI/2;
    w.position.set(x, 0.015, z);
    s.add(w);
  }
  s.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return s;
}

function makePedestrian(activityPool){
  const g = new THREE.Group();
  const pool = activityPool || ACTIVITIES;
  const activity = choice(pool);
  const isChild   = activity === 'child';
  const isElderly = activity === 'elderly';
  const isJog     = activity === 'jog' || activity === 'jog_headphones';

  // Body size variation -- base proportions are realistic 7.5-head adult.
  // Final scale (applied at end) brings them down to ~0.55m world units.
  const heightMul = isChild ? rand(0.62, 0.72) : (isElderly ? rand(0.92, 0.98) : rand(0.96, 1.05));
  const widthMul  = isChild ? 0.80 : rand(0.90, 1.10);
  // Apply body proportions
  g.scale.set(widthMul, heightMul, widthMul);

  // Ethnicity / skin
  const skinIdx = randInt(0, SKIN_TONES.length - 1);
  const skinColor = SKIN_TONES[skinIdx];
  const skinMat = mat(skinColor);

  // Hair color
  let hairColor;
  if (isElderly && Math.random() < 0.75) {
    hairColor = choice([0x999999, 0xcccccc, 0xeeeeee, 0xbbbbbb, 0xffffff]);
  } else {
    const palette = HAIR_COLORS.slice(0, Math.max(6, skinIdx + 4));
    hairColor = choice(palette);
  }

  // Clothing -- businessmen wear muted suit tones; joggers wear bright athletic
  let shirtPalette = SHIRT_COLORS;
  let pantPalette  = PANT_COLORS;
  if (activity === 'businessman') {
    shirtPalette = [0xffffff, 0xe8eef2, 0xd6e4f0, 0xc4d4e8];
    pantPalette  = [0x1a252f, 0x2c3e50, 0x111111, 0x3d3635];
  } else if (isJog) {
    shirtPalette = [0xff006e, 0x06d6a0, 0xfb5607, 0x3a86ff, 0xffb703, 0xef476f];
  }
  const shirtColor = mat(choice(shirtPalette));
  const pantColor  = mat(choice(pantPalette));
  const shoeColor  = mat(choice(SHOE_COLORS));

  // ---- Body assembly (origin at feet, Y up) ----
  // Anatomical landmarks (in local units; total ~1.0 before scale)
  const ankleY = 0.035;
  const kneeY  = 0.30;
  const hipY   = 0.56;
  const chestY = 0.78;
  const shoulderY = 0.86;
  const neckY  = 0.92;
  const headY  = 1.02;

  // Legs (group pivots at hip)
  function buildLeg(side){
    const leg = new THREE.Group();
    leg.position.set(side * 0.045, hipY, 0);
    const thigh = new THREE.Mesh(_PED_GEO.thigh, pantColor);
    thigh.position.y = -0.14;
    leg.add(thigh);
    const knee = new THREE.Mesh(_PED_GEO.knee, pantColor);
    knee.position.y = -0.27;
    leg.add(knee);
    const shin = new THREE.Mesh(_PED_GEO.shin, pantColor);
    shin.position.y = -0.40;
    leg.add(shin);
    const foot = new THREE.Mesh(_PED_GEO.foot, shoeColor);
    foot.position.set(0, -0.535, 0.025);
    leg.add(foot);
    return leg;
  }
  const leftLeg  = buildLeg(-1);
  const rightLeg = buildLeg(1);
  g.add(leftLeg); g.add(rightLeg);

  // Torso group
  const torso = new THREE.Group();
  torso.position.set(0, hipY, 0);
  const hips = new THREE.Mesh(_PED_GEO.hips, pantColor);
  hips.position.y = 0.04;
  torso.add(hips);
  const tDown = new THREE.Mesh(_PED_GEO.torsoDown, shirtColor);
  tDown.position.y = 0.15;
  torso.add(tDown);
  const tUp = new THREE.Mesh(_PED_GEO.torsoUp, shirtColor);
  tUp.position.y = 0.32;
  torso.add(tUp);
  // Shoulder caps
  const shL = new THREE.Mesh(_PED_GEO.shoulder, shirtColor);
  shL.position.set(-0.095, 0.40, 0); torso.add(shL);
  const shR = shL.clone(); shR.position.x = 0.095; torso.add(shR);
  g.add(torso);

  // Neck
  const neck = new THREE.Mesh(_PED_GEO.neck, skinMat);
  neck.position.y = neckY;
  g.add(neck);

  // Head (as group so we can attach headphones / hats)
  const headG = new THREE.Group();
  headG.position.y = headY;
  const head = new THREE.Mesh(_PED_GEO.head, skinMat);
  headG.add(head);
  const jaw = new THREE.Mesh(_PED_GEO.jaw, skinMat);
  jaw.position.y = -0.02;
  headG.add(jaw);
  // Ears
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), skinMat);
  earL.position.set(-0.072, 0.005, 0); earL.scale.set(0.6, 1, 1);
  headG.add(earL);
  const earR = earL.clone(); earR.position.x = 0.072;
  headG.add(earR);
  // Eyes
  const eyeMat = mat(0x111111);
  const eyeWhiteMat = mat(0xffffff);
  const eyeWL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), eyeWhiteMat);
  eyeWL.position.set(-0.025, 0.005, 0.066); eyeWL.scale.set(1, 0.7, 0.5);
  headG.add(eyeWL);
  const eyeWR = eyeWL.clone(); eyeWR.position.x = 0.025; headG.add(eyeWR);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), eyeMat);
  eyeL.position.set(-0.025, 0.005, 0.072);
  headG.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.025;
  headG.add(eyeR);
  // Tiny mouth line (slightly darker than skin)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.004, 0.003), mat(0x6b3a1d));
  mouth.position.set(0, -0.025, 0.07);
  headG.add(mouth);
  g.add(headG);

  // Hair / hijab / cap -- built around local headY=0 since headG is at headY
  // We'll just append into headG at local coordinates (offset 0)
  buildHair(headG, pickHairStyle.call(null) || 'short', hairColor, 0, skinMat);
  // Actually need to pick once and use again for facial-hair gate
  // ----- Patch: pick hair style explicitly -----

  // Facial hair / glasses
  // (we apply on headG with local headY=0)
  // simple inline reuse:
  if (Math.random() < 0.20 && !isChild){
    const beardMat = mat(hairColor);
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8, 0, Math.PI*2, Math.PI/2.4, Math.PI/2.4), beardMat);
    beard.position.set(0, -0.04, 0.03);
    beard.scale.set(1, 0.8, 0.9);
    headG.add(beard);
  }
  if (Math.random() < 0.20){
    const glassMatBlk = mat(0x111111);
    const lensL = new THREE.Mesh(_PED_GEO.glasses, glassMatBlk);
    lensL.position.set(-0.025, 0.005, 0.068);
    headG.add(lensL);
    const lensR = new THREE.Mesh(_PED_GEO.glasses, glassMatBlk);
    lensR.position.set(0.025, 0.005, 0.068);
    headG.add(lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.003, 0.003), glassMatBlk);
    bridge.position.set(0, 0.007, 0.072);
    headG.add(bridge);
  }

  // Arms (pivot at shoulder, point down)
  function buildArm(side){
    const arm = new THREE.Group();
    arm.position.set(side * 0.105, shoulderY, 0);
    const upper = new THREE.Mesh(_PED_GEO.upperArm, shirtColor);
    upper.position.y = -0.10;
    arm.add(upper);
    const fore = new THREE.Mesh(_PED_GEO.forearm, skinMat);
    fore.position.y = -0.30;
    arm.add(fore);
    const hand = new THREE.Mesh(_PED_GEO.hand, skinMat);
    hand.position.y = -0.40;
    arm.add(hand);
    arm.userData.hand = hand;
    return arm;
  }
  const leftArm  = buildArm(-1);
  const rightArm = buildArm(1);
  g.add(leftArm); g.add(rightArm);

  // Accessories
  const accessoryParts = {
    g, rightHand: rightArm.userData.hand, leftHand: leftArm.userData.hand,
    torso, headG,
    _holdingRight: false, _holdingLeft: false,
    _needsDog: false, _needsBike: false, _needsSkate: false
  };
  addAccessoryForActivity(accessoryParts, activity);

  // Activity pose adjustments
  if (activity === 'phone'){
    rightArm.rotation.x = -1.3;
    rightArm.rotation.z = -0.4;
  }
  if (activity === 'umbrella'){
    rightArm.rotation.x = -1.4;
  }
  if (activity === 'photographer'){
    rightArm.rotation.x = -1.5;
    leftArm.rotation.x  = -1.3;
    leftArm.rotation.z  =  0.3;
    accessoryParts._holdingLeft = true;
  }
  if (activity === 'coffee' || activity === 'ice_cream'){
    rightArm.rotation.x = -0.6;
  }
  if (activity === 'jog' || activity === 'jog_headphones'){
    g.rotation.x = 0.10;
  }
  if (isElderly){
    g.rotation.x = 0.10;
  }

  // Dog / bike / skate companions attach to outer wrapper so they translate with ped
  // We'll wrap the ped in another group and attach extras at world-relative offsets.
  const outer = new THREE.Group();
  outer.add(g);
  if (accessoryParts._needsDog){
    const dog = buildDog();
    dog.position.set(0.18, 0, 0.05);
    outer.add(dog);
    outer.userData.dog = dog;
  }
  if (accessoryParts._needsBike){
    const bike = buildBike();
    bike.position.set(0, 0, 0);
    outer.add(bike);
    // ped sits on bike -- raise feet so they "stand" on pedals
    g.position.y = 0.08;
    // bend legs slightly
    leftLeg.rotation.x =  0.3;
    rightLeg.rotation.x = -0.3;
    // hands on handlebar
    leftArm.rotation.x  = -1.2; leftArm.rotation.z  =  0.4;
    rightArm.rotation.x = -1.2; rightArm.rotation.z = -0.4;
    accessoryParts._holdingLeft = true;
    accessoryParts._holdingRight = true;
    outer.userData.bike = bike;
  }
  if (accessoryParts._needsSkate){
    const skate = buildSkateboard();
    outer.add(skate);
    outer.userData.skate = skate;
  }

  // Speed
  let speedMul = 1.0;
  if (activity === 'jog' || activity === 'jog_headphones') speedMul = 1.9;
  else if (activity === 'cyclist') speedMul = 2.6;
  else if (activity === 'skater')  speedMul = 2.2;
  else if (activity === 'elderly') speedMul = 0.5;
  else if (activity === 'child')   speedMul = rand(0.7, 1.4);
  else if (activity === 'phone')   speedMul = 0.7;
  else if (activity === 'tourist') speedMul = 0.7;
  else if (activity === 'photographer') speedMul = 0.4;
  else if (activity === 'dog_walker')   speedMul = 0.75;
  else if (activity === 'ice_cream')    speedMul = 0.65;
  else if (activity === 'coffee')       speedMul = 0.85;

  // Stash refs on OUTER for animator
  outer.userData.inner = g;
  outer.userData.activity = activity;
  outer.userData.speedMul = speedMul;
  outer.userData.leftLeg  = leftLeg;
  outer.userData.rightLeg = rightLeg;
  outer.userData.leftArm  = leftArm;
  outer.userData.rightArm = rightArm;
  outer.userData.headG    = headG;
  outer.userData.armSwingLockedL = accessoryParts._holdingLeft;
  outer.userData.armSwingLockedR = accessoryParts._holdingRight
    || activity === 'phone' || activity === 'umbrella' || activity === 'briefcase'
    || activity === 'shopping' || activity === 'elderly' || activity === 'coffee'
    || activity === 'ice_cream' || activity === 'photographer' || activity === 'dog_walker'
    || activity === 'businessman';
  outer.userData.legAnim  = !(activity === 'cyclist'); // cyclist legs handled separately
  outer.userData.cyclist  = activity === 'cyclist';

  g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

  // FINAL SCALE -- bring whole outer down so adult ~0.55m world units (was ~1.0).
  outer.scale.setScalar(0.55);
  return outer;
}

// Zone-based activity pools
const ZONE_ACTIVITIES = {
  res:     ['walk','walk','walk','child','elderly','dog_walker','backpack','phone','headphones','jog','jog_headphones','ice_cream'],
  com:     ['walk','shopping','shopping','shoulder_bag','tourist','photographer','phone','phone','coffee','umbrella','briefcase','businessman'],
  ind:     ['walk','walk','backpack','phone','coffee','briefcase'],
  office:  ['businessman','businessman','briefcase','phone','backpack','coffee','walk','shoulder_bag'],
  public:  ['walk','jog','dog_walker','child','elderly','ice_cream','tourist','headphones'],
  transit: ['backpack','phone','shoulder_bag','briefcase','walk','coffee'],
  default: ['walk','walk','walk','jog','phone','backpack','umbrella','shopping','briefcase','child','elderly','dog_walker','tourist','coffee','ice_cream','headphones'],
};

function zoneForType(type){
  const def = BUILDINGS[type];
  if (!def) return 'default';
  if (def.cat === 'res') return 'res';
  if (def.cat === 'com') return 'office';
  if (def.cat === 'ind') return 'ind';
  if (def.cat === 'public') return 'public';
  if (def.cat === 'transit') return 'transit';
  return 'default';
}

function spawnPedestrian(){
  // Exclude roads, water tiles, and railway from spawn points
  const allBuildings = state.buildings.filter(b => 
    b.type !== 'road' && 
    b.type !== 'water_tile' && 
    b.type !== 'railway'
  );
  if (allBuildings.length < 1) return;
  const anchor = choice(allBuildings);
  const wp = gridToWorld(anchor.x, anchor.z);
  const side = choice([[-1,0],[1,0],[0,-1],[0,1]]);
  const px = wp.x + side[0] * (TILE*0.5 + rand(0.1, 0.35)) + rand(-0.25,0.25);
  const pz = wp.z + side[1] * (TILE*0.5 + rand(0.1, 0.35)) + rand(-0.25,0.25);
  // Pick activity pool based on anchor zone
  const zone = zoneForType(anchor.type);
  const pool = ZONE_ACTIVITIES[zone] || ZONE_ACTIVITIES.default;
  const mesh = makePedestrian(pool);
  mesh.position.set(px, 0, pz);
  mesh.rotation.y = rand(0, Math.PI*2);
  scene.add(mesh);
  const baseSpeed = rand(0.5, 0.85) * (mesh.userData.speedMul || 1);
  state.pedestrians.push({
    mesh,
    speed: baseSpeed,
    life:  rand(20, 45),
    dir:   rand(0, Math.PI*2),
    changeDirTimer: rand(2, 5),
    bobTimer: rand(0, Math.PI*2),
    activity: mesh.userData.activity
  });
}

function updatePedestrians(dt){
  for (let i = state.pedestrians.length-1; i >= 0; i--){
    const p = state.pedestrians[i];
    p.life -= dt;
    p.changeDirTimer -= dt;
    const ud = p.mesh.userData;
    const animRate = 8 * (ud.speedMul || 1);
    p.bobTimer += dt * animRate;

    if (p.changeDirTimer <= 0){
      p.dir += rand(-1.0, 1.0);
      p.changeDirTimer = rand(2, 5);
    }
    p.mesh.position.x += Math.cos(p.dir) * p.speed * dt;
    p.mesh.position.z += Math.sin(p.dir) * p.speed * dt;

    // Block pedestrians from walking into water tiles
    const pedGX = Math.floor((p.mesh.position.x + HALF) / TILE);
    const pedGZ = Math.floor((p.mesh.position.z + HALF) / TILE);
    if (inBounds(pedGX, pedGZ)){
      const pedTile = state.grid[pedGX][pedGZ].type;
      if (pedTile === 'water_tile'){
        p.mesh.position.x -= Math.cos(p.dir) * p.speed * dt;
        p.mesh.position.z -= Math.sin(p.dir) * p.speed * dt;
        p.dir += Math.PI + rand(-0.5, 0.5);
        p.changeDirTimer = rand(1, 3);
      }
    }

    p.mesh.rotation.y = -p.dir + Math.PI/2;

    const swing = Math.sin(p.bobTimer);
    const legSwing = swing * (ud.cyclist ? 0 : 0.55);
    const armSwing = swing * 0.45;
    if (ud.legAnim && ud.leftLeg)  ud.leftLeg.rotation.x  =  legSwing;
    if (ud.legAnim && ud.rightLeg) ud.rightLeg.rotation.x = -legSwing;
    // Cyclist legs pedal in circles
    if (ud.cyclist){
      if (ud.leftLeg)  ud.leftLeg.rotation.x  =  Math.sin(p.bobTimer*1.5) * 0.6 + 0.3;
      if (ud.rightLeg) ud.rightLeg.rotation.x = -Math.sin(p.bobTimer*1.5) * 0.6 + 0.3;
    }
    if (ud.leftArm  && !ud.armSwingLockedL) ud.leftArm.rotation.x  = -armSwing;
    if (ud.rightArm && !ud.armSwingLockedR) ud.rightArm.rotation.x =  armSwing;
    // Head bobs slightly
    if (ud.headG) ud.headG.rotation.z = Math.sin(p.bobTimer*0.5) * 0.03;
    // Vertical bob (not for cyclist/skater)
    if (!ud.cyclist && ud.activity !== 'skater'){
      if (ud.inner) ud.inner.position.y = Math.abs(Math.sin(p.bobTimer*0.5)) * 0.012;
    }
    // Dog trots behind, tail wagging
    if (ud.dog){
      ud.dog.rotation.y = Math.sin(p.bobTimer*0.5) * 0.1;
      const tail = ud.dog.children.find(c => c.geometry === _PED_GEO.dogTail);
      if (tail) tail.rotation.y = Math.sin(p.bobTimer*2) * 0.4;
    }

    p.mesh.position.x = clamp(p.mesh.position.x, -HALF+0.5, HALF-0.5);
    p.mesh.position.z = clamp(p.mesh.position.z, -HALF+0.5, HALF-0.5);

    if (p.life <= 0){
      scene.remove(p.mesh);
      p.mesh.traverse(o=>{ if(o.isMesh && o.geometry && !Object.values(_PED_GEO).includes(o.geometry)) o.geometry.dispose(); });
      state.pedestrians.splice(i, 1);
    }
  }
}

// Direction helpers -- car body front is along local +X axis
function dirToYaw(dx, dz){ return Math.atan2(-dz, dx); }
const LANE_OFFSET = 0.3;
function laneOffset(dx, dz){ return { ox: dz * LANE_OFFSET, oz: -dx * LANE_OFFSET }; }

function spawnVehicle(){
  const roads = state.buildings.filter(b=>b.type==='road');
  if (roads.length < 2) return;
  const start = choice(roads);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const valid = dirs.filter(([dx,dz])=>{
    const nx=start.x+dx, nz=start.z+dz;
    return inBounds(nx,nz) && state.grid[nx][nz].type==='road';
  });
  if (!valid.length) return;
  const [dx, dz] = choice(valid);
  const wp = gridToWorld(start.x, start.z);
  const off = laneOffset(dx, dz);
  const mesh = makeCar();
  mesh.position.set(wp.x + off.ox, TERRAIN.getHeightAt(wp.x, wp.z), wp.z + off.oz);
  mesh.rotation.y = dirToYaw(dx, dz);
  // Headlight -- active at night or in rain
  const hl = new THREE.PointLight(0xffffaa, 0, 10, 1.5);
  hl.name = 'headlight';
  hl.position.set(0.4, 0.35, 0);
  mesh.add(hl);
  scene.add(mesh);
  const nextWP = gridToWorld(start.x + dx, start.z + dz);
  const targetOff = laneOffset(dx, dz);
  state.vehicles.push({
    mesh, gx: start.x, gz: start.z, dx, dz,
    tx: nextWP.x + targetOff.ox, tz: nextWP.z + targetOff.oz,
    ngx: start.x + dx, ngz: start.z + dz,
    speed: rand(2.5, 4.0), life: rand(20, 40),
    targetYaw: dirToYaw(dx, dz)
  });
}

function pickNextDirection(v){
  const forward = [v.dx, v.dz];
  const right   = [-v.dz, v.dx];
  const left    = [v.dz, -v.dx];
  const opts = [];
  for (const [dx,dz] of [forward, right, left]){
    const nx = v.ngx+dx, nz = v.ngz+dz;
    if (inBounds(nx,nz) && state.grid[nx][nz].type==='road'){
      const w = (dx===v.dx&&dz===v.dz) ? 4 : 1;
      for (let i=0;i<w;i++) opts.push([dx,dz]);
    }
  }
  return opts.length ? choice(opts) : null;
}

function updateVehicles(dt){
  for (let i=state.vehicles.length-1; i>=0; i--){
    const v = state.vehicles[i];
    v.life -= dt;
    const dxw = v.tx - v.mesh.position.x;
    const dzw = v.tz - v.mesh.position.z;
    const dist = Math.hypot(dxw, dzw);
    const rainPenalty = DN.weather === 'rain' ? 0.65 : 1.0;
    const step = v.speed * dt * rainPenalty;
    if (dist <= step + 0.01){
      v.mesh.position.x = v.tx;
      v.mesh.position.z = v.tz;
      v.gx = v.ngx; v.gz = v.ngz;
      const next = v.isTrain ? pickNextDirectionTrain(v) : (v.isTaxi ? pickNextDirectionTaxi(v) : pickNextDirection(v));
      if (!next){ v.life = 0; }
      else {
        v.dx = next[0]; v.dz = next[1];
        v.ngx = v.gx + v.dx; v.ngz = v.gz + v.dz;
        const wp = gridToWorld(v.ngx, v.ngz);
        if (v.isTrain){
          v.tx = wp.x; v.tz = wp.z;
        } else {
          const off = laneOffset(v.dx, v.dz);
          v.tx = wp.x + off.ox; v.tz = wp.z + off.oz;
        }
        v.targetYaw = dirToYaw(v.dx, v.dz);
      }
    } else {
      v.mesh.position.x += (dxw/dist)*step;
      v.mesh.position.z += (dzw/dist)*step;
    }
    // smooth yaw
    let dy = v.targetYaw - v.mesh.rotation.y;
    while (dy >  Math.PI) dy -= Math.PI*2;
    while (dy < -Math.PI) dy += Math.PI*2;
    v.mesh.rotation.y += dy * Math.min(1, dt*10);
    // GANTI updateVehicles() â€” bagian despawn:
    if (v.life <= 0){
      scene.remove(v.mesh);
      // JANGAN dispose geometry â€” semua vehicle (car/taxi/train) pakai geometry
      // hasil clone dari template yang di-share banyak instance lain.
      // Cukup lepas dari scene saja.
      state.vehicles.splice(i,1);
    }
  }
}
// ==================== DAY/NIGHT/WEATHER UPDATE ====================
function updateDayNight(dt){
  DN.elapsed = (DN.elapsed + dt) % DN.CYCLE;
  const t = DN.elapsed / DN.CYCLE;

  // Throttle sfx ambience check (~every 5s real time)
  if (!updateDayNight._sfxTimer) updateDayNight._sfxTimer = 0;
  updateDayNight._sfxTimer -= dt;
  if (updateDayNight._sfxTimer <= 0){
    updateDayNight._sfxTimer = 5;
    Audio.tickSfxAmbience();
  }

  // Find keyframe bracket
  let kA = _DN_KEYS[0], kB = _DN_KEYS[1];
  for(let i=0; i<_DN_KEYS.length-1; i++){
    if(t >= _DN_KEYS[i][0] && t <= _DN_KEYS[i+1][0]){ kA=_DN_KEYS[i]; kB=_DN_KEYS[i+1]; break; }
  }
  const span = kB[0] - kA[0];
  const f = span < 0.00001 ? 0 : Math.min(1, (t - kA[0]) / span);

  // Base interpolated values
  const skyC  = new THREE.Color(kA[1]).lerp(new THREE.Color(kB[1]), f);
  const fogC  = new THREE.Color(kA[2]).lerp(new THREE.Color(kB[2]), f);
  const fogN  = kA[3] + (kB[3]-kA[3])*f;
  const fogF  = kA[4] + (kB[4]-kA[4])*f;
  const ambC  = new THREE.Color(kA[5]).lerp(new THREE.Color(kB[5]), f);
  const ambI  = kA[6] + (kB[6]-kA[6])*f;
  let   sunI  = kA[7] + (kB[7]-kA[7])*f;
  const moonI = kA[8] + (kB[8]-kA[8])*f;

  // Apply per-map biome tint to sky/fog (subtle during day, not at night)
  if(state._biomeCfg && !DN.isNight){
    const biomeSky = new THREE.Color(state._biomeCfg.skyColor);
    const biomeFog = new THREE.Color(state._biomeCfg.fogColor);
    skyC.lerp(biomeSky, 0.25);
    fogC.lerp(biomeFog, 0.25);
  }

  // Sun arc: east->west during day
  if(sunI > 0){
    const angle = (DN.dayT - 0.5) * Math.PI;
    sun.position.set(
      Math.cos(angle) * 80,
      Math.max(5, Math.sin(angle + Math.PI*0.5) * 90),
      -20
    );
  }

  // Apply weather modifiers
  if(DN.weather === 'rain'){
    skyC.lerp(new THREE.Color(DN.isNight ? 0x08070a : 0x4a4a5a), 0.55);
    fogC.lerp(new THREE.Color(DN.isNight ? 0x060608 : 0x3d3d4a), 0.60);
    scene.fog.near = fogN * 0.6;
    scene.fog.far  = Math.min(fogF, DN.isNight ? 80 : 110);
    ambient.intensity = ambI * 0.60;
    ambient.color.copy(ambC).lerp(new THREE.Color(0x6677aa), 0.4);
    sun.intensity  = sunI * 0.2;
  } else {
    scene.fog.near = fogN;
    scene.fog.far  = fogF;
    ambient.intensity = ambI;
    ambient.color.copy(ambC);
    sun.intensity  = sunI;
  }
  scene.background.copy(skyC);
  scene.fog.color.copy(fogC);
  moon.intensity  = moonI;
  hemi.intensity  = DN.isNight ? 0.10 : 0.55;
  hemi.color.set(DN.isNight ? 0x1a2266 : 0xd4eeff);
  hemi.groundColor.set(DN.isNight ? 0x060608 : 0x88cc66);

  // Vehicle headlights -- on at night or in rain
  const wantHL = DN.isNight || DN.weather === 'rain';
  for(const v of state.vehicles){
    const hl = v.mesh.getObjectByName('headlight');
    if(hl) hl.intensity = wantHL ? 1.8 : 0;
  }

  // Building night lights -- smooth ramp based on ambient darkness
  const lightFactor = DN.isNight
    ? 0.3 + 0.4 * Math.sin(DN.nightT * Math.PI)   // max ~0.7 at midnight
    : Math.max(0, 1 - ambI / 1.0) * 0.5;           // subtle at sunset/sunrise
  const rainBoost = DN.weather === 'rain' ? 0.1 : 0;
  const finalLF = Math.min(1, lightFactor + rainBoost);

  for(const b of state.buildings){
    // Emissive: warm subtle window glow, not full blast
    if(b.emMats && b.emMats.length > 0){
      const ec = b.emColor || 0xffeecc;
      for(const m of b.emMats){
        m.emissive.setHex(ec);
        m.emissiveIntensity = finalLF * 0.30;  // subtle -- just a warm tint on walls
      }
    }
    // PointLight halo: soft ambient spill, not blinding
    if(b.nightLights){
      for(const {light, maxInt} of b.nightLights){
        light.intensity = maxInt * finalLF * 0.4;
      }
    }
  }

  // Cloud tint at night / rain
  cloudGroup.traverse(o=>{
    if(o.isMesh){
      if(DN.isNight) o.material.color.setHex(0x4455aa);
      else if(DN.weather==='rain') o.material.color.setHex(0x778899);
      else o.material.color.setHex(0xffffff);
    }
  });

  // Weather tick
  if(DN.weather === 'rain'){
    DN.rainRemaining -= dt;
    if(DN.rainMesh) DN.rainMesh.visible = true;
    if(DN.rainRemaining <= 0){
      DN.weather = 'clear';
      if(DN.rainMesh) DN.rainMesh.visible = false;
      if(state.running) notify('Rain stopped', 'The storm has cleared.', 'success');
    }
  } else {
    if(DN.rainMesh) DN.rainMesh.visible = false;
    DN.nextWeather -= dt;
    if(DN.nextWeather <= 0){
      DN.nextWeather = rand(120, 600);
      if(Math.random() < 0.35){
        const dur = rand(300, 900);
        DN.weather = 'rain';
        DN.rainRemaining = dur;
        if(state.running) notify('Rain incoming!', 'A storm is rolling through the city.', 'warn');
      }
    }
  }
}

function updateRainParticles(dt){
  if(!DN.rainMesh || !DN.rainMesh.visible) return;
  const pos  = DN.rainVerts;
  const N    = pos.length / 6;
  const FALL = 28 * dt, WX = 4 * dt, WZ = -1 * dt;
  const SPREAD = 90, HEIGHT = 55;
  const cx = camTarget.x, cz = camTarget.z;
  for(let i=0; i<N; i++){
    const b = i*6;
    pos[b+1] -= FALL; pos[b+4] -= FALL;
    pos[b]   += WX;   pos[b+3] += WX;
    pos[b+2] += WZ;   pos[b+5] += WZ;
    if(pos[b+4] < -1){
      const x = cx + rand(-SPREAD, SPREAD), z = cz + rand(-SPREAD, SPREAD);
      const y = rand(HEIGHT*0.5, HEIGHT), len = rand(0.2, 0.65);
      pos[b]=x;    pos[b+1]=y;     pos[b+2]=z;
      pos[b+3]=x+WX*4; pos[b+4]=y-len; pos[b+5]=z+WZ*4;
    }
  }
  DN.rainGeo.attributes.position.needsUpdate = true;
}

// ==================== TAXI SYSTEM ====================
function spawnTaxiPassenger(){
  // Pick a road tile that has a non-road neighbor (so passenger stands on sidewalk)
  const roads = state.buildings.filter(b => b.type === 'road');
  if (roads.length < 2) return;
  // Only spawn if few waiting already
  if (state.taxiPassengers.length >= 3)
    return;

  const road = choice(roads);
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const side = choice(dirs);
  const nx = road.x + side[0], nz = road.z + side[1];
  // Passenger stands just off the road edge
  const rw = gridToWorld(road.x, road.z);
  const wx = rw.x + side[0] * (TILE * 0.72) + rand(-0.15, 0.15);
  const wz = rw.z + side[1] * (TILE * 0.72) + rand(-0.15, 0.15);

  // Pedestrian mesh -- standing still, arm raised (hailing)
  const mesh = makePedestrian(['walk']);
  mesh.position.set(wx, 0, wz);
  // Face toward road
  mesh.rotation.y = Math.atan2(-side[1], side[0]);
  // Lock arm in raised position immediately
  const ud = mesh.userData;
  if (ud.leftArm){ ud.leftArm.rotation.x = -2.0; ud.leftArm.rotation.z = 0.3; }
  ud.armSwingLockedL = true;  // prevent updatePedestrians from resetting it
  scene.add(mesh);

  // Hailing indicator: small yellow exclamation diamond above head
  const indGeo = new THREE.OctahedronGeometry(0.09, 0);
  const indMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  const indicator = new THREE.Mesh(indGeo, indMat);
  indicator.position.set(wx, 1.1, wz);
  indicator._phase = Math.random() * Math.PI * 2;
  scene.add(indicator);

  state.taxiPassengers.push({
    mesh, indicator,
    wx, wz,
    gx: road.x, gz: road.z,  // target road tile for taxi to reach
    claimed: false,
    life: rand(30, 60),       // despawn if unclaimed after this long
  });
}

function spawnTaxi(){
  const roads = state.buildings.filter(b => b.type === 'road');
  if (roads.length < 2) return;
  const start = choice(roads);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const valid = dirs.filter(([dx,dz]) => {
    const nx = start.x + dx, nz = start.z + dz;
    return inBounds(nx, nz) && state.grid[nx][nz].type === 'road';
  });
  if (!valid.length) return;
  const [dx, dz] = choice(valid);
  const wp = gridToWorld(start.x, start.z);
  const off = laneOffset(dx, dz);
  const mesh = makeTaxi();
  mesh.position.set(wp.x + off.ox, TERRAIN.getHeightAt(wp.x, wp.z), wp.z + off.oz);
  mesh.rotation.y = dirToYaw(dx, dz);
  // Headlight
  const hl = new THREE.PointLight(0xffffaa, 0, 10, 1.5);
  hl.name = 'headlight';
  hl.position.set(0.4, 0.35, 0);
  mesh.add(hl);
  // Taxi sign light (yellow on roof)
  const signLight = new THREE.PointLight(0xffee00, 0.0, 4, 1.8);
  signLight.name = 'taxiSign';
  signLight.position.set(0, 0.6, 0);
  mesh.add(signLight);
  scene.add(mesh);
  const nextWP = gridToWorld(start.x + dx, start.z + dz);
  const targetOff = laneOffset(dx, dz);
  state.vehicles.push({
    mesh, gx: start.x, gz: start.z, dx, dz,
    tx: nextWP.x + targetOff.ox, tz: nextWP.z + targetOff.oz,
    ngx: start.x + dx, ngz: start.z + dz,
    speed: rand(2.2, 3.5), life: rand(40, 80),
    targetYaw: dirToYaw(dx, dz),
    isTaxi: true,
    taxiState: 'cruising',   // 'cruising' | 'approaching' | 'pickup' | 'driving'
    taxiTarget: null,        // the taxiPassenger entry
    taxiTimer: 0,
    taxiDropTimer: rand(15, 30),
  });
}

function updateTaxis(dt){
  // Animate taxi sign light (flicker when cruising/approaching)
  // Animate waiting passenger indicators
  for (const p of state.taxiPassengers){
    if (p.indicator){
      p.indicator._phase = (p.indicator._phase || 0) + dt * 3;
      p.indicator.position.y = 1.1 + Math.sin(p.indicator._phase) * 0.08;
      p.indicator.rotation.y += dt * 2;
    }
    // Raise arm
    const ud = p.mesh.userData;
    if (ud.leftArm) ud.leftArm.rotation.x = -2.0;
    if (ud.leftArm) ud.leftArm.rotation.z =  0.3;
  }

  // Update taxi FSM
  for (const v of state.vehicles){
    if (!v.isTaxi) continue;
    const signLight = v.mesh.getObjectByName('taxiSign');

    if (v.taxiState === 'cruising'){
      // Sign light on
      if (signLight) signLight.intensity = 0.5 + Math.sin(Date.now() * 0.004) * 0.15;
      // Scan for unclaimed passengers within range
      const unclaimed = state.taxiPassengers.filter(p => !p.claimed);
      if (unclaimed.length > 0){
        // Find closest unclaimed
        let best = null, bestDist = 999;
        for (const p of unclaimed){
          const d = Math.hypot(v.mesh.position.x - p.wx, v.mesh.position.z - p.wz);
          if (d < bestDist){ bestDist = d; best = p; }
        }
        if (best && bestDist < 20){
          best.claimed = true;
          v.taxiTarget = best;
          v.taxiState = 'approaching';
        }
      }

    } else if (v.taxiState === 'approaching'){
      if (signLight) signLight.intensity = 0.8;
      const p = v.taxiTarget;
      if (!p || p.life <= 0){ v.taxiState = 'cruising'; v.taxiTarget = null; return; }
      // Check if we're on the passenger's target road tile
      if (v.gx === p.gx && v.gz === p.gz){
        // Stop and begin pickup
        v.taxiState = 'pickup';
        v.taxiTimer = 1.8; // seconds stopped
        v.speed = 0;
      }
      // Override next-tile choice to prefer tiles closer to target
      // (handled in pickNextDirectionTaxi below)

    } else if (v.taxiState === 'pickup'){
      v.taxiTimer -= dt;
      if (signLight) signLight.intensity = 1.2;
      // Passenger walks toward taxi while waiting
      const p = v.taxiTarget;
      if (p && p.mesh){
        // Lean toward taxi
        const dx2 = v.mesh.position.x - p.mesh.position.x;
        const dz2 = v.mesh.position.z - p.mesh.position.z;
        p.mesh.rotation.y = Math.atan2(dx2, dz2);
      }
      if (v.taxiTimer <= 0){
        // Passenger boards -- remove from scene
        if (p){
          scene.remove(p.mesh);
          if (p.indicator) scene.remove(p.indicator);
          const idx = state.taxiPassengers.indexOf(p);
          if (idx !== -1) state.taxiPassengers.splice(idx, 1);
        }
        v.taxiTarget = null;
        v.taxiState = 'driving';
        v.speed = rand(2.2, 3.8);
        if (signLight) signLight.intensity = 0; // off = occupied
        v.taxiDropTimer = rand(15, 30);
      }

    } else if (v.taxiState === 'driving'){
      if (signLight) signLight.intensity = 0;
      v.taxiDropTimer -= dt;
      if (v.taxiDropTimer <= 0){
        v.life = 0; // drop off off-screen -- taxi leaves
      }
    }
  }

  // Age + despawn unclaimed passengers
  for (let i = state.taxiPassengers.length - 1; i >= 0; i--){
    const p = state.taxiPassengers[i];
    p.life -= dt;
    if (p.life <= 0){
      scene.remove(p.mesh);
      if (p.indicator) scene.remove(p.indicator);
      state.taxiPassengers.splice(i, 1);
    }
  }
}

// Taxi-aware direction picker: prefers tiles closer to target passenger's road tile
function pickNextDirectionTaxi(v){
  if (v.taxiState === 'approaching' && v.taxiTarget){
    const tgx = v.taxiTarget.gx, tgz = v.taxiTarget.gz;
    const forward = [v.dx, v.dz];
    const right   = [-v.dz, v.dx];
    const left    = [v.dz, -v.dx];
    const opts = [];
    for (const [dx,dz] of [forward, right, left, [-v.dx,-v.dz]]){
      const nx = v.ngx + dx, nz = v.ngz + dz;
      if (inBounds(nx,nz) && state.grid[nx][nz].type === 'road'){
        const dist = Math.abs(nx - tgx) + Math.abs(nz - tgz);
        opts.push({ dir:[dx,dz], dist });
      }
    }
    if (opts.length === 0) return null;
    opts.sort((a,b) => a.dist - b.dist);
    // 80% chance to pick closer tile, 20% random to avoid getting stuck
    return Math.random() < 0.80 ? opts[0].dir : choice(opts).dir;
  }
  return pickNextDirection(v);
}

// -------------------- ECONOMY / TICK --------------------
function recalcStats(){
  let homes=0, jobs=0, power=0, powerGen=0, water=0, waterGen=0, pollution=0, happyBonus=0, tax=0;
  for (const b of state.buildings){
    const def = BUILDINGS[b.type];
    if (def.homes && nearRoad(b.x, b.z, def.size||1)) homes += def.homes;
    if (def.jobs) jobs += def.jobs;
    if (def.power) power += def.power;
    if (def.water) water += def.water;
    if (def.powerGen) powerGen += def.powerGen;
    if (def.waterGen) waterGen += def.waterGen;
    if (def.pollution) pollution += def.pollution;
    if (def.happy) happyBonus += def.happy;
    if (def.tax) tax += def.tax;
  }
  state.homes = homes;
  state.jobs.offered = jobs;
  state.power = { gen: powerGen, demand: power };
  state.water = { gen: waterGen, demand: water };
  state.pollution = pollution + getSlumPollution();
  state._happyBonus = happyBonus;
  state._taxBase = tax;
  loadRegistryVehicles();
  _tickSideMissionProgress();
}

// -------------------- DISTANCE CULLING --------------------
// Hides objects far from camera every 20 frames â€” zero geometry changes, just visibility toggle
let _cullFrameCount = 0;

const CULL_DIST = {
  worldTree:   70,   // small in-grid trees
  outerTree:   90,   // forest / out-of-grid trees
  desertObj:   95,   // desert rocks & trees
  slum:        80,   // slum meshes
  vehicle:     100,  // cars / taxi
  pedestrian:  55,   // NPCs on foot
  cloud:       999,  // clouds always visible
};

function updateDistanceCulling(){
  if (!state.running) return;
  const cx = camTarget.x, cz = camTarget.z;

  function d2(ox, oz){ const dx=ox-cx, dz=oz-cz; return dx*dx+dz*dz; }

  // In-grid world trees
  if (state._worldTrees){
    const threshSq = CULL_DIST.worldTree * CULL_DIST.worldTree;
    for (const m of Object.values(state._worldTrees)){
      m.visible = d2(m.position.x, m.position.z) <= threshSq;
    }
  }

  // Outer / forest trees
  if (state._outerTrees){
    const threshSq = CULL_DIST.outerTree * CULL_DIST.outerTree;
    for (const m of state._outerTrees){
      m.visible = d2(m.position.x, m.position.z) <= threshSq;
    }
  }

  // Desert objects (rocks, desert trees)
  if (state._desertObjects){
    const threshSq = CULL_DIST.desertObj * CULL_DIST.desertObj;
    for (const obj of state._desertObjects){
      obj.mesh.visible = d2(obj.wx, obj.wz) <= threshSq;
    }
  }
  if (state._desertMesh){
    const dz = state._desertZone;
    if (dz){
      const threshSq = (CULL_DIST.desertObj + dz.radius) * (CULL_DIST.desertObj + dz.radius);
      state._desertMesh.visible = d2(dz.cx, dz.cz) <= threshSq;
    }
  }

  // Beach palm trees
  if (state._beachTrees){
    const threshSq = 120 * 120;
    for (const t of state._beachTrees){
      t.mesh.visible = d2(t.wx, t.wz) <= threshSq;
    }
  }
  if (state._beachMesh){
    state._beachMesh.visible = d2(state._beachMesh.position.x, state._beachMesh.position.z) <= 150 * 150;
  }

  // Slums
  if (state.slums){
    const threshSq = CULL_DIST.slum * CULL_DIST.slum;
    for (const s of state.slums){
      if (s.mesh) s.mesh.visible = d2(s.mesh.position.x, s.mesh.position.z) <= threshSq;
    }
  }

  // Vehicles
  const vThreshSq = CULL_DIST.vehicle * CULL_DIST.vehicle;
  for (const v of state.vehicles){
    if (v.mesh) v.mesh.visible = d2(v.mesh.position.x, v.mesh.position.z) <= vThreshSq;
  }

  // Pedestrians
  const pThreshSq = CULL_DIST.pedestrian * CULL_DIST.pedestrian;
  for (const p of state.pedestrians){
    if (p.mesh) p.mesh.visible = d2(p.mesh.position.x, p.mesh.position.z) <= pThreshSq;
  }
}

let _timeEggLastState = '';
function _tickTimeEasterEggs() {
  const tod = DN.isNight ? 'night' : 'day';
  if (tod === _timeEggLastState) return;
  _timeEggLastState = tod;
  const eggs = getTimeEasterEggs(tod);
  for (const egg of eggs) {
    const chance = egg.trigger?.chance ?? 1.0;
    if (Math.random() < chance) {
      _executeEasterEgg(egg);
    }
  }
}

function gameTick(dt){
  if (state.paused || state.speed===0) return;
  const mult = state.speed;
  updateDayNight(dt * mult);
  state.tickSinceLastDay += dt * mult;

  // Slum tick (timer-based, every 2 in-game hours)
  if (!Array.isArray(state.slums)) state.slums = [];
  if (typeof state._slumTimer === 'undefined') state._slumTimer = 0;
  tickSlums(dt, mult);
  //ufo
  tickUFOMidnight();
  // Time-based easter eggs from JSON registry
  _tickTimeEasterEggs();
  updateUFO(dt * mult);
  updateGhostEasterEgg(dt * mult);

  // every "day" (3 real seconds at 1x)
  if (state.tickSinceLastDay >= 3){
    state.tickSinceLastDay = 0;
    advanceCalendar();

    // population growth toward homes capacity
    const powerOk = state.power.gen >= state.power.demand;
    const waterOk = state.water.gen >= state.water.demand;
    const capacity = state.homes;
    let target = capacity;
    if (!powerOk) target = Math.floor(target*0.5);
    if (!waterOk) target = Math.floor(target*0.5);

    if (state.population < target){
      const grow = Math.max(1, Math.floor((target - state.population)*0.15));
      for (let i=0;i<grow;i++){
        state.citizens.push(createCitizen());
      }
      state.population = state.citizens.length;
    } else if (state.population > target){
      const shrink = Math.max(1, Math.floor((state.population - target)*0.1));
      state.citizens.splice(0, shrink);
      state.population = state.citizens.length;
    }

    // happiness
    let happy = 60 + (state._happyBonus||0) - state.pollution*0.5 - state.traffic*0.3;
    if (!powerOk) happy -= 25;
    if (!waterOk) happy -= 20;
    state.happiness = clamp(Math.round(happy), 0, 100);
    if (state.citizens.length){
      for (const c of state.citizens){
        c.happy = clamp(state.happiness + randInt(-10,10), 0, 100);
      }
    }

    // economy
    const slumDrain = getSlumDrain();
    const income = Math.round((state._taxBase||0) + state.population*0.6);
    const expense = Math.round(state.buildings.length*2 + state.power.demand*1 + state.water.demand*1 + slumDrain);
    state.income = income;
    state.expense = expense;
    state.money += (income - expense);

    // level
    if (state.population >= 100000) state.level = 4;
    else if (state.population >= 10000) state.level = 3;
    else if (state.population >= 1000) state.level = 2;
    else state.level = 1;

    // random notifications
    if (state.day % 12 === 0 && Math.random()<0.6){
      const events = [];
      if (!powerOk) events.push(['Power Shortage','Citizens are complaining about blackouts.','danger']);
      if (!waterOk) events.push(['Water Crisis','Water demand exceeds supply.','danger']);
      if (state.pollution>30) events.push(['Air Pollution','Pollution is harming citizens health.','warn']);
      if (state.happiness>=85) events.push(['Citizens are thrilled!','Your city is a wonderful place.','success']);
      if (state.population>=1000 && state.level===2 && !state._notedLvl2){ events.push(['Town promoted!','Population passed 1,000. Town tier reached.','success']); state._notedLvl2=true; Audio.playLevelUp(); }
      if (state.population>=10000 && state.level===3 && !state._notedLvl3){ events.push(['City promoted!','Population passed 10,000.','success']); state._notedLvl3=true; Audio.playLevelUp(); }
      if (events.length) { const [t,m,k]=choice(events); notify(t,m,k); }
    }

    // disasters (rare)
    if (state.day > 30 && Math.random()<0.02){
      triggerDisaster();
    }

    // mission check
    if (!state.sandbox && !state.freeMode && !state._missionChecked && !state._missionShowing){
      if (checkMissionComplete()){
        state._missionChecked = true;
        advanceMissionLevel();
      }
    }
  }

  // ---- Crowd factor: 0.0 (empty) -> 1.0 (full activity) ----
  // Night factor: 0.0 at midnight, ramps up toward day
  let nightF = 1.0;
  if(DN.isNight){
    // nightT: 0=dusk(20:00), 1=dawn(06:00). Deepest night ~= 0.4 (midnight ~00:00)
    const mid = Math.sin(DN.nightT * Math.PI); // peaks at midnight
    nightF = Math.max(0.05, 1.0 - mid * 0.93); // almost nobody at midnight
  } else {
    // dayT: 0=dawn(06:00), 1=dusk(20:00). Rush hour peaks at ~0.3 (10am) & ~0.85 (6pm)
    const rush = 0.4 + 0.4 * Math.max(Math.sin(DN.dayT * Math.PI * 1.5), 0);
    nightF = 0.35 + rush * 0.65;
  }
  const rainF = DN.weather === 'rain' ? 0.18 : 1.0;
  const crowdF = nightF * rainF;

  // vehicle spawn
  const maxVehicles = Math.max(2, Math.round(8 * crowdF));
  if (
      Math.random() < 0.01 * mult * crowdF &&
      state.vehicles.length < maxVehicles
  ){
      spawnVehicle();
  }
  // Cull excess vehicles quickly when conditions change (rain/night)
  // Don't cull taxis that are picking up or driving with a passenger
  if (state.vehicles.length > maxVehicles + 2){
    let culled = 0;
    for (let ci = state.vehicles.length - 1; ci >= 0 && culled < state.vehicles.length - maxVehicles; ci--){
      const cv = state.vehicles[ci];
      if (cv.isTaxi && (cv.taxiState === 'pickup' || cv.taxiState === 'driving')) continue;
      scene.remove(cv.mesh);
      cv.mesh.traverse(o=>{ if(o.isMesh && o.geometry) o.geometry.dispose(); });
      state.vehicles.splice(ci, 1);
      culled++;
    }
  }
  // train spawn â€” only if metro station exists, max 1 per rail line
  const hasMetro = state.buildings.some(b => b.type === 'metro');
  if (hasMetro && Math.random() < 0.01*mult && state.vehicles.filter(v=>v.isTrain).length < 1){
    spawnTrain();
  }
  updateVehicles(dt * mult);

  // ---- TAXI system ----
  const maxTaxis = Math.max(0, Math.round(3 * crowdF));
  const taxiCount = state.vehicles.filter(v => v.isTaxi).length;
  if (Math.random() < 0.025 * mult * crowdF && taxiCount < maxTaxis){
    spawnTaxi();
  }
  // Taxi passenger hailing spawn
  const roads = state.buildings.filter(b => b.type === 'road');
  if (roads.length >= 2 && Math.random() < 0.002 * mult * crowdF){
    spawnTaxiPassenger();
  }
  updateTaxis(dt * mult);

  // pedestrian spawn DISABLED (performance optimization)
  // const maxPeds = Math.max(0, Math.round(Math.min(40, 5 + state.buildings.length) * crowdF));
  // if (Math.random() < 0.06 * mult * crowdF && state.pedestrians.length < maxPeds){
  //   spawnPedestrian();
  // }
  // Pedestrians DISABLED for performance
  // Clear any existing pedestrians on first tick
  if(state.pedestrians.length > 0){
    for(const p of state.pedestrians){
      scene.remove(p.mesh);
    }
    state.pedestrians = [];
  }
  // Citizen life simulation -- drives smart NPC schedules
  CitizenSim.update(dt * mult, crowdF);

  // traffic estimate
  state.traffic = Math.min(100, state.vehicles.length*4 + state.population*0.001);

  // animate windmill
  for (const b of state.buildings){
    if (b.type==='power_wind' && b.mesh.userData.blades){
      b.mesh.userData.blades.rotation.z += dt * mult * 1.5;
    }
  }
  // animate clouds
  cloudGroup.children.forEach(c=>{
    c.position.x += dt * mult * 0.5;
    if (c.position.x > HALF+10) c.position.x = -HALF-10;
  });

  // Distance-based culling (runs every 20 frames to save CPU)
  _cullFrameCount = (_cullFrameCount + 1) % 20;
  if (_cullFrameCount === 0) updateDistanceCulling();
}

// -------------------- DISASTERS --------------------
function triggerDisaster(){
  const kinds = DISASTER_TYPES;
  const kind = choice(kinds);
  if (kind==='fire' && state.buildings.length){
    const victim = choice(state.buildings.filter(b=>b.type!=='road'));
    if (victim){
      flashRed(victim.mesh);
      notify('Fire!', `A fire broke out at ${BUILDINGS[victim.type].name}.`, 'danger');
      setTimeout(()=>{
        // spawn destruction before bulldoze clears the mesh
        if (victim.mesh) spawnDestruction(victim.mesh);
        bulldoze(victim.x, victim.z);
      }, 3500);
    }
  } else if (kind==='earthquake'){
    notify('Earthquake!', 'A minor earthquake damaged parts of the city.', 'danger');
    state.money -= 2000;
    // collapse 1-2 random buildings with animation
    const victims = state.buildings.filter(b=>b.type!=='road');
    const count = Math.min(victims.length, randInt(1, 2));
    for (let i=0;i<count;i++){
      const v = victims[randInt(0, victims.length-1)];
      if (v && v.mesh){
        // shake animation
        const origPos = v.mesh.position.clone();
        let st=0;
        const iv2 = setInterval(()=>{
          st+=0.1;
          v.mesh.position.x = origPos.x + Math.sin(st*30)*0.08*(1-st/1.5);
          v.mesh.position.z = origPos.z + Math.cos(st*25)*0.06*(1-st/1.5);
          if (st>1.5){
            clearInterval(iv2);
            spawnDestruction(v.mesh);
            bulldoze(v.x, v.z);
          }
        }, 50);
      }
    }
  } else {
    notify('Flood', 'Heavy rain flooded parts of the city.', 'warn');
    state.happiness = Math.max(0, state.happiness-10);
  }
}
function flashRed(mesh){
  let t = 0;
  const iv = setInterval(()=>{
    t += 0.2;
    mesh.traverse(o=>{ if (o.isMesh) o.material.emissive = new THREE.Color(t%0.4<0.2?0xff0000:0x000000); });
    if (t>3) clearInterval(iv);
  }, 200);
}

// -------------------- INPUT --------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let mouseDownButton = -1;
let lastMouse = { x:0, y:0 };
let isPanning = false;
let isRotating = false;

function getMouseGrid(e){
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
  mouse.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(ground);
  if (!hit.length) return null;
  const p = hit[0].point;
  const g = worldToGrid(p.x, p.z);
  if (!inBounds(g.x,g.z)) return null;
  return g;
}

// Like getMouseGrid but allows out-of-bounds tiles (used by axe tool for desert objects)
function getMouseGridAny(e){
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
  mouse.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(ground);
  if (!hit.length) return null;
  const p = hit[0].point;
  const g = worldToGrid(p.x, p.z);
  // Clamp to valid GRID range
  g.x = Math.max(0, Math.min(GRID-1, g.x));
  g.z = Math.max(0, Math.min(GRID-1, g.z));
  // Store world position too for distance checks
  g.wx = p.x; g.wz = p.z;
  return g;
}

canvas.addEventListener('mousedown', e=>{
  mouseDownButton = e.button;
  lastMouse.x = e.clientX; lastMouse.y = e.clientY;
  if (e.button === 2){
    // Right click: cancel pending placement, otherwise rotate camera
    if (state.pending){
      state.pending = null;
      clearGhost();
      return;
    }
    isRotating = true;
  }
  else if (e.button === 1) isPanning = true;
  else if (e.button === 0){
    if (state.selected){
      // Axe & hunt use getMouseGridAny so they can reach objects outside land bounds
      const g = (state.selected === 'axe' || state.selected === 'hunt') ? getMouseGridAny(e) : getMouseGrid(e);
      if (!g) return;
      const key = state.selected;
      // Roads & bulldoze & axe & hunt: instant (drag-friendly)
      if (key === 'road' || key === 'bulldoze' || key === 'axe' || key === 'hunt'){
        isDragging = true;
        applyTool(g.x, g.z, g);
        return;
      }
      // Two-click confirm mode
      if (!state.pending){
        // First click: mark pending tile (if placeable)
        if (canPlaceAt(key, g.x, g.z)){
          state.pending = { gx:g.x, gz:g.z };
          spawnGhost(key, g.x, g.z);
        }
      } else {
        // Second click: confirm at the pending tile
        const placed = placeBuilding(key, state.pending.gx, state.pending.gz);
        if (placed){
          state.pending = null;
          clearGhost();
        }
      }
    } else {
      const g = getMouseGrid(e);
      if (g) selectBuildingAt(g.x, g.z);
    }
  }
});
// Double-click to view inside building
canvas.addEventListener('dblclick', e=>{
  if(!state.running) return;
  const g = getMouseGrid(e);
  if(g){
    const cell = state.grid[g.x]?.[g.z];
    if(cell && cell.type && cell.type !== 'road' && cell.type !== 'railway'){
      // Airport special: open map for travel
      if(cell.type === 'airport'){
        showMapSelection((mapId) => {
          if(mapId === state.mapId){ notify('âœˆï¸ Sudah di sini!', 'Kamu sudah berada di ' + state.mapName, 'warn'); return; }
          if(!state.unlockedMaps.includes(mapId)){ notify('ðŸ”’ Terkunci', 'Selesaikan level untuk membuka pulau ini', 'danger'); return; }
          state.mapId = mapId;
          state.mapName = mapId.charAt(0).toUpperCase() + mapId.slice(1);
          notify('âœˆï¸ Pindah Pulau', 'Berpindah ke ' + state.mapName, 'success');
          // Reset map (in full implementation, would load map-specific data)
          uiRoot.innerHTML = '';
          startGame(state.sandbox || state.freeMode, false);
        });
        return;
      }
      _trackBuildingClick(cell.type);
      showInsideBuilding(cell.type);
    }
  }
});
window.addEventListener('mouseup', ()=>{
  isDragging = false; isPanning = false; isRotating = false; mouseDownButton = -1;
});
canvas.addEventListener('mousemove', e=>{
  const g = getMouseGrid(e);
  if (state.pending && state.selected){
    // Pending mode: lock cursor to pending tile, show red, tip about R + click to confirm
    const size = getSize(state.selected);
    const wp = footprintCenterWorld(state.pending.gx, state.pending.gz, size);
    cursorMesh.position.x = wp.x;
    cursorMesh.position.z = wp.z;
    cursorMesh.scale.set(size, 1, size);
    cursorMesh.rotation.y = state.placeRotation * Math.PI / 2;
    cursorMesh.material.color.setHex(0xff3344);
    cursorMesh.visible = true;
    const def = BUILDINGS[state.selected];
    const rotDeg = state.placeRotation * 90;
    showCursorTip(e.clientX, e.clientY, `${def.icon} ${def.name} (${size}x${size}) -- R: rotate (${rotDeg} deg) -- click to confirm, right-click to cancel`);
  } else if (g){
    const size = state.selected ? getSize(state.selected) : 1;
    const wp = footprintCenterWorld(g.x, g.z, size);
    cursorMesh.position.x = wp.x;
    cursorMesh.position.z = wp.z;
    cursorMesh.scale.set(size, 1, size);
    cursorMesh.rotation.y = state.placeRotation * Math.PI / 2;
    cursorMesh.visible = !!state.selected;
    if (state.selected){
      const def = BUILDINGS[state.selected];
      const can = canPlaceAt(state.selected, g.x, g.z);
      cursorMesh.material.color.setHex(can ? 0xffdd00 : 0xef4444);
      const isInstant = state.selected==='road' || state.selected==='bulldoze' || state.selected==='railway' || state.selected==='water_tile' || state.selected==='axe' || state.selected==='hunt';
      const tip = isInstant
        ? `${def.icon} ${def.name} -- $${def.cost}`
        : `${def.icon} ${def.name} (${size}x${size}) -- $${def.cost}  |  click to preview`;
      showCursorTip(e.clientX, e.clientY, tip);
    } else hideCursorTip();
    if (isDragging && state.selected){
      const dragG = (state.selected === 'axe' || state.selected === 'hunt') ? (getMouseGridAny(e) || g) : g;
      applyTool(dragG.x, dragG.z, dragG);
    }
  } else {
    cursorMesh.visible = false;
    hideCursorTip();
  }

  const dx = e.clientX - lastMouse.x;
  const dy = e.clientY - lastMouse.y;
  if (isRotating){
    camAngle -= dx * 0.005;
    camPitch = clamp(camPitch - dy*0.005, 0.2, Math.PI/2 - 0.1);
    updateCamera();
  } else if (isPanning){
    const f = camDist * 0.0015;
    camTarget.x -= (dx*Math.cos(camAngle) - dy*Math.sin(camAngle)) * f;
    camTarget.z -= (dx*Math.sin(camAngle) + dy*Math.cos(camAngle)) * f;
    // Clamp pan to the current world size
    const worldHalf = (state.landSize * TILE) / 2 + 10;
    camTarget.x = clamp(camTarget.x, -HALF, HALF);
  camTarget.z = clamp(camTarget.z, -HALF, HALF);
  updateCamera();
  }
  lastMouse.x = e.clientX; lastMouse.y = e.clientY;
});
canvas.addEventListener('contextmenu', e=>e.preventDefault());
canvas.addEventListener('wheel', e=>{
  e.preventDefault();
  const maxDist = Math.max(130, state.landSize * TILE * 1.5);
  camDist = clamp(camDist + e.deltaY*0.05, 15, maxDist);
  updateCamera();
}, { passive:false });

function applyTool(gx, gz, gFull){
  if (state.selected === 'bulldoze') bulldoze(gx, gz);
  else if (state.selected === 'axe')  cutTree(gx, gz, gFull);
  else if (state.selected === 'hunt') {
    const wx = (gFull && gFull.wx != null) ? gFull.wx : gridToWorld(gx, gz).x;
    const wz = (gFull && gFull.wz != null) ? gFull.wz : gridToWorld(gx, gz).z;
    huntDeer(wx, wz);
  }
  else placeBuilding(state.selected, gx, gz);
}

function cutTree(gx, gz, gFull){
  // World position: use gFull.wx/wz if available (from getMouseGridAny), else derive from grid
  const wx = (gFull && gFull.wx != null) ? gFull.wx : gridToWorld(gx, gz).x;
  const wz = (gFull && gFull.wz != null) ? gFull.wz : gridToWorld(gx, gz).z;
  let cut = false;

  // Cut in-grid tree (only if in bounds)
  if (inBounds(gx, gz)){
    const gridKey = `${gx}_${gz}`;
    if (state._worldTrees && state._worldTrees[gridKey]){
      clearWorldTreeAt(gx, gz);
      cut = true;
    }
  }

  // Cut nearest outer/forest tree within range
  if (state._outerTrees){
    let closest = null, closestDist = (TILE * 2.0) * (TILE * 2.0);
    for (const m of state._outerTrees){
      const ddx = m.position.x - wx, ddz = m.position.z - wz;
      const d2 = ddx*ddx + ddz*ddz;
      if (d2 < closestDist){ closestDist = d2; closest = m; }
    }
    if (closest){
      scene.remove(closest);
      closest.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
      state._outerTrees = state._outerTrees.filter(m => m !== closest);
      cut = true;
    }
  }

  // Cut nearest desert tree or rock within range
  if (!cut && state._desertObjects && state._desertObjects.length){
    let closest = null, closestDist = (TILE * 2.5) * (TILE * 2.5);
    for (const obj of state._desertObjects){
      const ddx = obj.wx - wx, ddz = obj.wz - wz;
      const d2 = ddx*ddx + ddz*ddz;
      if (d2 < closestDist){ closestDist = d2; closest = obj; }
    }
    if (closest){
      scene.remove(closest.mesh);
      closest.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
      state._desertObjects = state._desertObjects.filter(o => o !== closest);
      cut = true;
    }
  }

  // Cut nearest beach palm tree within range
  if (!cut && state._beachTrees && state._beachTrees.length){
    let closest = null, closestDist = (TILE * 3.0) * (TILE * 3.0);
    for (const t of state._beachTrees){
      const ddx = t.wx - wx, ddz = t.wz - wz;
      const d2 = ddx*ddx + ddz*ddz;
      if (d2 < closestDist){ closestDist = d2; closest = t; }
    }
    if (closest){
      scene.remove(closest.mesh);
      closest.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
      state._beachTrees = state._beachTrees.filter(t => t !== closest);
      cut = true;
    }
  }

  if (cut){
    Audio.playBulldoze && Audio.playBulldoze();
  }
  return cut;
}

function selectBuildingAt(gx, gz){
  const cell = state.grid[gx][gz];
  if (cell.type && cell.type!=='road'){
    const og = cell.origin || { gx, gz };
    state.selectedBuilding = { x:og.gx, z:og.gz, type:cell.type };
    renderInfoPanel();
  } else {
    state.selectedBuilding = null;
    renderInfoPanel();
  }
}

// Keyboard
const keys = {};
window.addEventListener('keydown', e=>{
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape') {
    state.selected = null;
    state.placeRotation = 0;
    state.pending = null;
    clearGhost();
    renderConstructionMenu();
    cursorMesh.visible=false;
  }
  if (e.key === '1') setSpeed(1);
  if (e.key === '2') setSpeed(2);
  if (e.key === '3') setSpeed(3);
  if (e.key === '0' || e.key === ' ') { e.preventDefault(); setSpeed(state.speed===0?1:0); }
  if (e.key.toLowerCase()==='b') { state.selected='bulldoze'; state.placeRotation=0; state.pending=null; clearGhost(); renderConstructionMenu(); }
  // R = rotate placement 90 deg clockwise (works in pending mode too)
  if (e.key.toLowerCase()==='r' && state.selected){
    e.preventDefault();
    state.placeRotation = (state.placeRotation + 1) % 4;
    cursorMesh.rotation.y = state.placeRotation * Math.PI / 2;
    if (ghostMesh) ghostMesh.rotation.y = state.placeRotation * Math.PI / 2;
    Audio.playRotate();
  }
});
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });

function setSpeed(s){
  state.speed = s;
  state.paused = (s===0);
  renderTopBar();
}

// -------------------- UI --------------------
const uiRoot = document.getElementById('ui-root');

function renderMainMenu(){
  Audio.init();

  uiRoot.innerHTML = `
  <div id="main-menu">
    <div id="menu-bg"></div>
    <div id="menu-bg-overlay"></div>
    <canvas id="menu-particles"></canvas>
    <div id="menu-content">
      <h1 class="menu-logo">NUSA BOX</h1>
      <div class="menu-subtitle">${LT('subtitle')}</div>
      <div class="menu-buttons">
        <button id="btn-new" class="highlight">
          <span class="btn-icon">${pxImg('mn_new',26)}</span>
          <span class="btn-label">${LT('new_game')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
        <button id="btn-continue" class="${localStorage.getItem('city-empire-save')?'':'disabled'}">
          <span class="btn-icon">${pxImg('mn_continue',26)}</span>
          <span class="btn-label">${LT('continue')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
        <button id="btn-sandbox">
          <span class="btn-icon">${pxImg('mn_sandbox',26)}</span>
          <span class="btn-label">${LT('sandbox')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
        <button id="btn-scenario" class="disabled">
          <span class="btn-icon">${pxImg('mn_scenario',26)}</span>
          <span class="btn-label">${LT('scenario')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
        <button id="btn-multi" class="disabled">
          <span class="btn-icon">${pxImg('mn_multi',26)}</span>
          <span class="btn-label">${LT('multi')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
        <button id="btn-settings">
          <span class="btn-icon">${pxImg('mn_settings',26)}</span>
          <span class="btn-label">${LT('settings')}</span>
          <span class="btn-arrow">â€º</span>
        </button>
      </div>
      <div class="menu-version">${LT('version')}</div>
    </div>
    <div class="footer">Â© NUSA BOX -- built with Three.js</div>
  </div>`;

  // ---- Particle system ----
  const canvas = document.getElementById('menu-particles');
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const PARTICLE_COUNT = 80;

  function resizeCanvas(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const COLORS = ['rgba(76,201,240,', 'rgba(124,92,255,', 'rgba(247,37,133,', 'rgba(255,255,255,', 'rgba(255,200,80,'];
  for (let i = 0; i < PARTICLE_COUNT; i++){
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.5 + 0.1),
      alpha: Math.random() * 0.6 + 0.2,
      dAlpha: (Math.random() - 0.5) * 0.005,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2,
    });
  }

  let particleRaf = null;
  function drawParticles(){
    ctx.clearRect(0, 0, W, H);
    for (const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.dAlpha;
      p.pulse += 0.025;
      if (p.alpha <= 0.05 || p.alpha >= 0.85) p.dAlpha *= -1;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      const glowR = p.r * (2.5 + Math.sin(p.pulse) * 0.8);
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR * 4);
      grd.addColorStop(0, p.color + (p.alpha) + ')');
      grd.addColorStop(0.4, p.color + (p.alpha * 0.4) + ')');
      grd.addColorStop(1, p.color + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
    particleRaf = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // ---- Ripple on click ----
  document.querySelectorAll('#main-menu .menu-buttons button').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      if (btn.classList.contains('disabled')) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Stop particles when menu is replaced
  const observer = new MutationObserver(() => {
    if (!document.getElementById('menu-particles')){
      cancelAnimationFrame(particleRaf);
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
    }
  });
  observer.observe(uiRoot, { childList: true });

  // ---- Button actions ----
  document.getElementById('btn-new').onclick = () => {
    uiRoot.innerHTML = '';
    showMapSelection((mapId) => {
      state.mapId = mapId;
      state.mapName = mapId.charAt(0).toUpperCase() + mapId.slice(1);
      showPresidentCutscene(() => startGame(false));
    });
  };
  document.getElementById('btn-sandbox').onclick = () => {
    showMapSelection((mapId) => {
      state.mapId = mapId;
      state.mapName = mapId.charAt(0).toUpperCase() + mapId.slice(1);
      startGame(true);
    });
  };
  const cont = document.getElementById('btn-continue');
  cont.onclick = () => {
    if (cont.classList.contains('disabled')) return;
    loadGame(); startGame(false, true);
  };
  document.getElementById('btn-settings').onclick = () => showSettings();
}

// ==================== MAP SELECTION SCREEN ====================
const MAP_DATA = {
  sumatra:    { name:'Sumatra',    desc:'Pantai, Laut, Gurun, Hutan', x:22, y:45, unlocked:true, color:'#00ff66' },
  jawa:       { name:'Jawa',       desc:'Hutan, Gunung, Pantai, Laut', x:38, y:68, unlocked:false, color:'#ffee00' },
  kalimantan: { name:'Kalimantan', desc:'Hutan Lebat, Pantai, Gurun', x:45, y:42, unlocked:false, color:'#00ffff' },
  sulawesi:   { name:'Sulawesi',   desc:'Pantai, Hutan, Laut', x:58, y:48, unlocked:false, color:'#ff66bb' },
  papua:      { name:'Papua',      desc:'Pantai, Hutan, Gunung Salju', x:78, y:48, unlocked:false, color:'#cc44ff' },
};

function showMapSelection(onSelect){
  uiRoot.innerHTML = `
  <div id="map-select-screen" style="position:absolute;inset:0;background:linear-gradient(180deg,#080618 0%,#0a0820 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:50;">
    <h2 style="font-family:var(--font);font-size:16px;color:var(--cyan);text-shadow:3px 3px 0 #000;margin-bottom:8px;">PILIH LOKASI</h2>
    <p style="font-family:var(--font);font-size:7px;color:#5544aa;margin-bottom:20px;letter-spacing:1px;">Pilih pulau untuk memulai pembangunan</p>
    <div id="map-container" style="position:relative;width:80vw;max-width:700px;height:50vh;max-height:400px;background:#0c0a1e;border:3px solid var(--purple);border-top:4px solid var(--cyan);box-shadow:6px 6px 0 #000;overflow:hidden;">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,100,200,.08) 0%,rgba(0,50,100,.15) 100%);"></div>
      ${Object.entries(MAP_DATA).map(([id, m]) => `
        <button class="map-pin ${m.unlocked || state.unlockedMaps.includes(id) ? '' : 'locked'}" data-map="${id}" 
          style="position:absolute;left:${m.x}%;top:${m.y}%;transform:translate(-50%,-50%);
          background:${m.unlocked || state.unlockedMaps.includes(id) ? 'rgba(0,255,100,.15)' : 'rgba(50,50,50,.5)'};
          border:2px solid ${m.unlocked || state.unlockedMaps.includes(id) ? m.color : '#333'};
          padding:8px 12px;cursor:${m.unlocked || state.unlockedMaps.includes(id) ? 'pointer' : 'not-allowed'};
          font-family:var(--font);font-size:7px;color:${m.unlocked || state.unlockedMaps.includes(id) ? m.color : '#555'};
          box-shadow:3px 3px 0 #000;transition:all .1s;">
          <div style="font-size:10px;margin-bottom:2px;">ðŸ“</div>
          <div>${m.name}</div>
          ${!(m.unlocked || state.unlockedMaps.includes(id)) ? '<div style="font-size:5px;color:#666;margin-top:2px;">ðŸ”’ Locked</div>' : ''}
        </button>
      `).join('')}
    </div>
    <div id="map-info" style="margin-top:12px;font-family:var(--font);font-size:7px;color:#7766cc;min-height:40px;text-align:center;"></div>
    <button id="map-back-btn" style="margin-top:12px;font-family:var(--font);font-size:7px;padding:8px 16px;border:2px solid var(--red);color:var(--red);background:#1a0000;box-shadow:3px 3px 0 #000;">â† Kembali</button>
  </div>`;

  document.getElementById('map-back-btn').onclick = () => renderMainMenu();

  document.querySelectorAll('.map-pin').forEach(pin => {
    pin.onmouseenter = () => {
      const id = pin.dataset.map;
      const m = MAP_DATA[id];
      const info = document.getElementById('map-info');
      if (info) info.innerHTML = `<span style="color:${m.color}">${m.name}</span> â€” ${m.desc}`;
    };
    pin.onclick = () => {
      const id = pin.dataset.map;
      if (!MAP_DATA[id].unlocked && !state.unlockedMaps.includes(id)) return;
      onSelect(id);
    };
  });
}

// ==================== PHONE / HP UI SYSTEM ====================
function showPhoneUI(){
  const overlay = document.createElement('div');
  overlay.id = 'phone-overlay';
  overlay.style.cssText = `position:absolute;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:60;`;

  const phone = document.createElement('div');
  phone.style.cssText = `width:320px;max-height:80vh;background:linear-gradient(180deg,#0e0a20 0%,#080618 100%);border:3px solid var(--cyan);border-radius:0;box-shadow:6px 6px 0 #000;overflow:hidden;font-family:var(--font);`;

  phone.innerHTML = `
    <div style="padding:10px;background:#0a0818;border-bottom:2px solid var(--purple);display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:7px;color:var(--cyan);">ðŸ“± PHONE</span>
      <span style="font-size:6px;color:#5544aa;">${String(state.day).padStart(2,'0')}/${String(state.month).padStart(2,'0')}/${state.year}</span>
    </div>
    <div id="phone-tabs" style="display:flex;border-bottom:2px solid #2a1f4a;">
      <button class="phone-tab active" data-tab="contacts" style="flex:1;padding:6px;font-family:var(--font);font-size:6px;background:#0c0a18;border:none;color:var(--cyan);cursor:pointer;border-bottom:2px solid var(--cyan);">ðŸ‘¤ Kontak</button>
      <button class="phone-tab" data-tab="email" style="flex:1;padding:6px;font-family:var(--font);font-size:6px;background:#0c0a18;border:none;color:#5544aa;cursor:pointer;">ðŸ“§ Email</button>
      <button class="phone-tab" data-tab="social" style="flex:1;padding:6px;font-family:var(--font);font-size:6px;background:#0c0a18;border:none;color:#5544aa;cursor:pointer;">ðŸ“± Socmed</button>
      <button class="phone-tab" data-tab="calendar" style="flex:1;padding:6px;font-family:var(--font);font-size:6px;background:#0c0a18;border:none;color:#5544aa;cursor:pointer;">ðŸ“… Tanggal</button>
      <button class="phone-tab" data-tab="stats" style="flex:1;padding:6px;font-family:var(--font);font-size:6px;background:#0c0a18;border:none;color:#5544aa;cursor:pointer;">ðŸ“Š Status</button>
    </div>
    <div id="phone-content" style="padding:10px;max-height:55vh;overflow-y:auto;min-height:280px;"></div>
    <div style="padding:8px;text-align:center;border-top:2px solid #2a1f4a;">
      <button id="phone-close" style="font-family:var(--font);font-size:7px;padding:6px 14px;background:#1a0000;border:2px solid var(--red);color:var(--red);cursor:pointer;box-shadow:2px 2px 0 #000;">Tutup</button>
    </div>
  `;

  overlay.appendChild(phone);
  document.getElementById('ui-root').appendChild(overlay);

  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
  phone.querySelector('#phone-close').onclick = () => overlay.remove();

  // Tab switching
  phone.querySelectorAll('.phone-tab').forEach(tab => {
    tab.onclick = () => {
      phone.querySelectorAll('.phone-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#5544aa';
        t.style.borderBottom = 'none';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--cyan)';
      tab.style.borderBottom = '2px solid var(--cyan)';
      renderPhoneTab(tab.dataset.tab);
    };
  });

  renderPhoneTab('contacts');
}

function renderPhoneTab(tab){
  const content = document.getElementById('phone-content');
  if(!content) return;

  switch(tab){
    case 'contacts':
      content.innerHTML = Object.entries(state.relationships).map(([id, val]) => {
        const hearts = Math.floor(val / 20);
        const color = val >= 70 ? 'var(--green)' : val >= 40 ? 'var(--yellow)' : 'var(--red)';
        return `<div style="padding:8px;margin-bottom:4px;background:#110d22;border:2px solid #2a1f4a;border-left:3px solid ${color};">
          <div style="font-size:7px;color:var(--text);margin-bottom:3px;">${id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
          <div style="font-size:6px;color:${color};">${'â¤ï¸'.repeat(hearts)}${'ðŸ–¤'.repeat(5-hearts)} (${val}/100)</div>
        </div>`;
      }).join('');
      break;

    case 'email':
      if(state.phone.emails.length === 0){
        content.innerHTML = `<div style="font-size:7px;color:#5544aa;text-align:center;padding:40px 0;">ðŸ“­ Tidak ada email</div>`;
      } else {
        content.innerHTML = state.phone.emails.map(e => `
          <div style="padding:8px;margin-bottom:4px;background:${e.read ? '#0c0a18' : '#141028'};border:2px solid ${e.read ? '#2a1f4a' : 'var(--cyan)'};cursor:pointer;" onclick="this.querySelector('.email-body').style.display=this.querySelector('.email-body').style.display==='none'?'block':'none'">
            <div style="font-size:6px;color:${e.read ? '#5544aa' : 'var(--cyan)'};">${e.from} â€¢ Hari ${e.day}</div>
            <div style="font-size:7px;color:var(--text);margin-top:2px;">${e.subject}</div>
            <div class="email-body" style="display:none;font-size:6px;color:#7766cc;margin-top:6px;padding-top:6px;border-top:1px solid #2a1f4a;">${e.body}</div>
          </div>
        `).join('');
      }
      break;

    case 'social':
      const defaultPosts = [
        { author:'Warga123', content:'Kota ini makin bagus! ðŸ™ï¸', sentiment:'positive' },
        { author:'NetizenBiasa', content:'Pak Walikota kerja bagus!', sentiment:'positive' },
        { author:'KritikusKota', content:'Kapan jalan diperbaiki?', sentiment:'negative' },
      ];
      const posts = state.phone.socialMedia.length > 0 ? state.phone.socialMedia : defaultPosts;
      content.innerHTML = posts.map(p => {
        const sentColor = p.sentiment === 'positive' ? 'var(--green)' : p.sentiment === 'negative' ? 'var(--red)' : 'var(--yellow)';
        return `<div style="padding:8px;margin-bottom:4px;background:#110d22;border:2px solid #2a1f4a;border-left:3px solid ${sentColor};">
          <div style="font-size:6px;color:var(--cyan);margin-bottom:3px;">@${p.author}</div>
          <div style="font-size:7px;color:var(--text);">${p.content}</div>
        </div>`;
      }).join('');
      break;

    case 'calendar':
      const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
      const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      const totalDays = daysInMonth[state.month - 1];
      let calHTML = `<div style="font-size:8px;color:var(--gold);margin-bottom:8px;text-align:center;">${monthNames[state.month-1]} ${state.year}</div>`;
      calHTML += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">`;
      ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].forEach(d => {
        calHTML += `<div style="font-size:5px;color:#5544aa;text-align:center;padding:2px;">${d}</div>`;
      });
      for(let d=1; d<=totalDays; d++){
        const isToday = d === state.day;
        const hasEvent = state.calendarEvents.some(e => e.day === d && e.month === state.month);
        calHTML += `<div style="font-size:6px;text-align:center;padding:3px;
          background:${isToday ? 'var(--cyan)' : hasEvent ? '#1a1428' : '#0c0a18'};
          color:${isToday ? '#000' : hasEvent ? 'var(--gold)' : '#5544aa'};
          border:1px solid ${isToday ? 'var(--cyan)' : hasEvent ? 'var(--gold)' : '#1e1640'};">${d}${hasEvent ? 'â€¢' : ''}</div>`;
      }
      calHTML += `</div>`;
      // Show events for current day
      const todayEvents = state.calendarEvents.filter(e => e.day === state.day && e.month === state.month);
      if(todayEvents.length > 0){
        calHTML += `<div style="margin-top:8px;border-top:2px solid #2a1f4a;padding-top:6px;">`;
        todayEvents.forEach(ev => {
          calHTML += `<div style="font-size:6px;color:var(--gold);padding:4px;background:#1a1428;margin-bottom:2px;border:1px solid var(--gold);">ðŸ“Œ ${ev.title}</div>`;
        });
        calHTML += `</div>`;
      }
      content.innerHTML = calHTML;
      break;

    case 'stats':
      content.innerHTML = `
        <div style="font-size:7px;color:var(--text);margin-bottom:10px;">ðŸ“Š Status Pribadi</div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;margin-bottom:4px;">
          <div style="font-size:6px;color:#5544aa;">ðŸ’° Keuangan Pribadi</div>
          <div style="font-size:8px;color:var(--gold);margin-top:2px;">$${state.personal.personalMoney.toLocaleString()}</div>
        </div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;margin-bottom:4px;">
          <div style="font-size:6px;color:#5544aa;">â¤ï¸ Kesehatan</div>
          <div style="margin-top:4px;height:6px;background:#0a0818;border:1px solid #2a1f4a;">
            <div style="height:100%;width:${state.personal.health}%;background:${state.personal.health > 50 ? 'var(--green)' : 'var(--red)'};"></div>
          </div>
          <div style="font-size:6px;color:var(--text);margin-top:2px;">${state.personal.health}%</div>
        </div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;margin-bottom:4px;">
          <div style="font-size:6px;color:#5544aa;">ðŸ´ Index Korupsi</div>
          <div style="margin-top:4px;height:6px;background:#0a0818;border:1px solid #2a1f4a;">
            <div style="height:100%;width:${state.personal.corruption}%;background:${state.personal.corruption < 30 ? 'var(--green)' : 'var(--red)'};"></div>
          </div>
          <div style="font-size:6px;color:${state.personal.corruption < 30 ? 'var(--green)' : 'var(--red)'};margin-top:2px;">${state.personal.corruption}% ${state.personal.corruption < 30 ? '(Bersih)' : state.personal.corruption < 60 ? '(Kotor)' : '(Sangat Korup)'}</div>
        </div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;margin-bottom:4px;">
          <div style="font-size:6px;color:#5544aa;">ðŸ¢ Bisnis Pribadi</div>
          ${state.personal.business.length === 0 
            ? '<div style="font-size:6px;color:#5544aa;margin-top:2px;">Belum ada bisnis</div>'
            : state.personal.business.map(b => `<div style="font-size:6px;color:var(--text);margin-top:2px;">â€¢ ${b.name} (+$${b.income}/hari)</div>`).join('')}
        </div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;margin-bottom:4px;">
          <div style="font-size:6px;color:#5544aa;">ðŸ—ºï¸ Lokasi Saat Ini</div>
          <div style="font-size:7px;color:var(--cyan);margin-top:2px;">${state.mapName}</div>
        </div>
        <div style="padding:6px;background:#110d22;border:2px solid #2a1f4a;">
          <div style="font-size:6px;color:#5544aa;">ðŸ† Level Selesai</div>
          <div style="font-size:7px;color:var(--gold);margin-top:2px;">${state.missionLevel - 1}/30</div>
        </div>
      `;
      break;
  }
}

// ==================== INSIDE BUILDING VIEW ====================
function showInsideBuilding(buildingType){
  const registryEvent = getBuildingEvent(buildingType, state);
  const interiorMap = {
    res_low: './img/insideBuilding/home_example.png',
    res_med: './img/insideBuilding/home_example.png',
    res_high: './img/insideBuilding/home_example.png',
    com_shop: './img/insideBuilding/shop_example.png',
    com_mall: './img/insideBuilding/mall_example.png',
    school: './img/insideBuilding/school_example.png',
    hospital: './img/insideBuilding/hospital_example.png',
    police: './img/insideBuilding/police_example.png',
    ind_factory: './img/insideBuilding/factory_example.png',
    ind_office: './img/insideBuilding/office_example.png',
  };
  const imgPath = interiorMap[buildingType] || './img/insideBuilding/home_example.png';
  const bName = BUILDINGS[buildingType]?.name || buildingType;
  const availableMinigames = getMinigamesForBuilding(buildingType);

  if (registryEvent) {
    _applyRegistryBuildingEvent(registryEvent, bName, imgPath, availableMinigames);
    return;
  }

  _showInsideBuildingView(bName, imgPath, availableMinigames);
}

function _showEventDialog(title, line, character, onNext) {
  document.getElementById('event-dialog-overlay')?.remove();
  const charEmoji = {
    pak_wiwi: '👨‍💼',
    amil: '👩‍⚕️',
    the_president: '🎩',
    acel: '👷',
  }[character] || '💬';

  const ov = document.createElement('div');
  ov.id = 'event-dialog-overlay';
  ov.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);width:480px;max-width:90vw;background:#0d0d1a;border:3px solid #8844ff;box-shadow:0 0 30px #8844ff44;z-index:70;font-family:monospace;padding:16px;display:flex;gap:12px;align-items:flex-start;';
  ov.innerHTML = `
    <div style="font-size:32px;flex-shrink:0;">${charEmoji}</div>
    <div style="flex:1;">
      <div style="color:#8844ff;font-size:10px;margin-bottom:6px;">${title}</div>
      <div style="color:#fff;font-size:12px;line-height:1.5;" id="event-dialog-text"></div>
      <button id="event-dialog-next" style="margin-top:10px;padding:6px 16px;background:#2a0066;border:2px solid #8844ff;color:#cc88ff;cursor:pointer;font-size:10px;">Lanjut ▶</button>
    </div>`;

  const textEl = ov.querySelector('#event-dialog-text');
  let charIdx = 0;
  const typeInterval = setInterval(() => {
    if (charIdx < line.length) {
      textEl.textContent += line[charIdx++];
    } else {
      clearInterval(typeInterval);
    }
  }, 25);

  ov.querySelector('#event-dialog-next').onclick = () => {
    clearInterval(typeInterval);
    ov.remove();
    if (onNext) onNext();
  };

  setTimeout(() => {
    if (document.getElementById('event-dialog-overlay') === ov) {
      ov.remove();
      if (onNext) onNext();
    }
  }, 8000);

  document.getElementById('ui-root').appendChild(ov);
}

function _showEventRewardResult(ev, bName, imgPath, availableMinigames) {
  const rewards = [];
  if (ev.reward?.money) rewards.push(`💰 +Rp ${ev.reward.money.toLocaleString()}`);
  if (ev.reward?.happiness) rewards.push(`😊 +${ev.reward.happiness}% kebahagiaan`);
  const rewardLine = rewards.length ? rewards.join('   ') : 'Event selesai!';
  _showEventDialog(ev.name || 'Reward', rewardLine, ev.character, () => {
    _showInsideBuildingView(bName, imgPath, availableMinigames);
  });
}

function _applyRegistryBuildingEvent(ev, bName, imgPath, availableMinigames) {
  const applyReward = () => {
    if (ev.reward?.money && ev.reward.money > 0) {
      state.money += ev.reward.money;
      renderHUD();
      notify('💰 Reward', `+Rp ${ev.reward.money.toLocaleString()}`, 'success');
    }
    if (ev.reward?.happiness && ev.reward.happiness > 0) {
      state.happiness = Math.min(100, state.happiness + ev.reward.happiness);
      notify('😊 Kebahagiaan Naik', `+${ev.reward.happiness}%`, 'success');
    }
    if (ev.reward?.relationship) {
      changeRelationship(ev.reward.relationship.charId, ev.reward.relationship.amount || 0);
    }
  };

  if (ev.dialog?.length) {
    let di = 0;
    const nextLine = () => {
      if (di >= ev.dialog.length) {
        applyReward();
        if (ev.action === 'minigame' && ev.minigameId) _launchRegistryMinigame(ev.minigameId);
        else if (ev.action === 'reward') _showEventRewardResult(ev, bName, imgPath, availableMinigames);
        else _showInsideBuildingView(bName, imgPath, availableMinigames);
        return;
      }
      _showEventDialog(ev.name || 'Event', ev.dialog[di++], ev.character, nextLine);
    };
    nextLine();
  } else if (ev.action === 'minigame' && ev.minigameId) {
    applyReward();
    _launchRegistryMinigame(ev.minigameId);
  } else if (ev.action === 'reward') {
    applyReward();
    _showEventRewardResult(ev, bName, imgPath, availableMinigames);
  } else {
    applyReward();
    _showInsideBuildingView(bName, imgPath, availableMinigames);
  }
}

function _launchRegistryMinigame(minigameId) {
  const mg = REGISTRY_MINIGAMES.find(m => m.id === minigameId);
  if (!mg) { notify('Mini Game', 'Tidak ditemukan: ' + minigameId, 'warn'); return; }

  const config = {
    name: mg.name,
    questions: mg.questions || [],
    rewardMoney: mg.rewardMoney || 0,
    rewardHappiness: mg.rewardHappiness || 0,
    timeLimit: mg.timeLimit || 30,
    targets: mg.config?.targets || 8,
    missAllowed: mg.config?.missAllowed || 3,
  };

  const onWin = (result) => {
    state.money += result.rewardMoney || 0;
    state.happiness = Math.min(100, state.happiness + (result.rewardHappiness || 0));
    renderHUD();
    notify('🎉 ' + mg.name, `Menang! +Rp ${(result.rewardMoney || 0).toLocaleString()}`, 'success');
  };

  const launched = launchMinigame(mg.type, config, onWin, null);
  if (!launched) {
    if (mg.type === 'quiz') _launchQuizMinigame(mg);
    else notify('Mini Game', mg.name + ' (tipe belum tersedia: ' + mg.type + ')', 'info');
  }
}

function _launchQuizMinigame(mg) {
  if (!mg.questions?.length) return;
  let qi = 0, score = 0;
  const total = mg.questions.length;
  function showQ() {
    document.getElementById('minigame-overlay')?.remove();
    if (qi >= total) {
      const passed = score >= Math.ceil(total * 0.6);
      if (passed) {
        state.money += mg.rewardMoney || 0;
        state.happiness = Math.min(100, state.happiness + (mg.rewardHappiness || 0));
        notify('🎉 ' + mg.name, `Skor ${score}/${total} — +Rp ${(mg.rewardMoney||0).toLocaleString()}!`, 'success');
      } else notify(mg.name, `Skor ${score}/${total} — Coba lagi!`, 'warn');
      return;
    }
    const q = mg.questions[qi];
    const ov = document.createElement('div');
    ov.id = 'minigame-overlay';
    ov.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:60;';
    const opts = q.options.map((opt,i) => `<button data-i="${i}" style="font-family:var(--font);font-size:7px;padding:8px;background:#222;border:2px solid #444;color:#ccc;cursor:pointer;">${opt}</button>`).join('');
    ov.innerHTML = `<div style="font-family:var(--font);max-width:480px;width:90%;padding:20px;background:#111;border:3px solid var(--cyan);box-shadow:6px 6px 0 #000;"><div style="font-size:7px;color:var(--cyan);margin-bottom:10px;">${mg.name} — ${qi+1}/${total}</div><div style="font-size:8px;color:#fff;margin-bottom:14px;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${opts}</div><div style="font-size:6px;color:#555;margin-top:8px;">Skor: ${score}/${qi}</div></div>`;
    ov.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const chosen = parseInt(btn.dataset.i);
        if (chosen === q.answer) { score++; btn.style.background='#1a4a1a'; btn.style.borderColor='#4cae4c'; }
        else { btn.style.background='#4a1a1a'; btn.style.borderColor='#cc4444'; }
        ov.querySelectorAll('button').forEach(b => b.disabled = true);
        setTimeout(() => { ov.remove(); qi++; showQ(); }, 900);
      };
    });
    document.getElementById('ui-root').appendChild(ov);
  }
  showQ();
}

// Execute easter egg effect from JSON registry
function _executeEasterEgg(egg) {
  if (!egg || !egg.effect) return;
  const ef = egg.effect;
  if (ef.message) notify('🎉 Easter Egg', ef.message, 'success');
  switch (ef.type) {
    case 'spawn': {
      const count = Math.max(1, ef.count || 1);
      if (ef.spawnType === 'ufo') {
        for (let i = 0; i < count; i++) spawnUFO();
      } else if (ef.spawnType === 'deer') {
        for (let i = 0; i < count; i++) spawnDeer();
      } else if (ef.spawnType === 'ghost') {
        for (let i = 0; i < count; i++) spawnGhostEasterEgg();
      }
      break;
    }
    case 'money':
      state.money += (ef.amount || 0);
      renderHUD();
      break;
    case 'dialog':
      if (ef.lines && ef.lines.length) {
        let di = 0;
        const next = () => {
          if (di < ef.lines.length) {
            notify('💬 ' + (ef.character || egg.name || 'Event'), ef.lines[di++], 'info');
            setTimeout(next, 2000);
          }
        };
        next();
      }
      break;
    case 'fireworks':
      if (ef.message) notify('🎆 Event', ef.message, 'success');
      if (ef.dialog && ef.dialog.lines) {
        let di = 0;
        const next = () => {
          if (di < ef.dialog.lines.length) {
            notify('💬 ' + (ef.dialog.character || ''), ef.dialog.lines[di++], 'info');
            setTimeout(next, 2000);
          }
        };
        setTimeout(next, 500);
      }
      break;
    default:
      notify('🎉 Easter Egg', egg.name, 'success');
  }
}

const _clickTrack = {};

function _trackBuildingClick(buildingType) {
  if (!CLICK_EASTER_EGGS.length) return;
  const now = Date.now();
  for (const egg of CLICK_EASTER_EGGS) {
    const bt = egg.trigger?.buildingType || 'any';
    if (bt !== 'any' && bt !== buildingType) continue;
    if (!_clickTrack[bt]) _clickTrack[bt] = { count: 0, firstT: now };
    const e = _clickTrack[bt];
    e.count++;
    if (e.count === 1) e.firstT = now;
    const elapsed = (now - e.firstT) / 1000;
    const within = egg.trigger?.withinSeconds || 10;
    if (elapsed > within) {
      e.count = 1;
      e.firstT = now;
      continue;
    }
    if (e.count >= (egg.trigger?.times || 5)) {
      e.count = 0;
      _executeEasterEgg(egg);
    }
  }
}

function _showInsideBuildingView(bName, imgPath, availableMinigames) {
  document.getElementById('inside-building-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'inside-building-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:55;';

  const mgButtons = (availableMinigames && availableMinigames.length)
    ? availableMinigames.map(mg => `<button class="mg-btn" data-mgid="${mg.id}" style="font-family:monospace;font-size:11px;padding:8px 16px;background:#1a0033;border:2px solid #aa44ff;color:#cc88ff;cursor:pointer;margin:4px;">🎮 ${mg.name}</button>`).join('')
    : '';

  overlay.innerHTML = `
    <div style="max-width:80vw;max-height:90vh;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="font-family:monospace;font-size:13px;color:#00ccff;text-shadow:2px 2px 0 #000;">${bName}</div>
      <div style="width:560px;max-width:80vw;height:360px;max-height:55vh;background:#111;border:3px solid #4400aa;box-shadow:6px 6px 0 #000;overflow:hidden;display:flex;align-items:center;justify-content:center;">
        <img src="${imgPath}" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      ${mgButtons ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;">${mgButtons}</div>` : ''}
      <div style="font-family:monospace;font-size:10px;color:#555;">Klik di luar area untuk menutup</div>
    </div>`;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelectorAll('.mg-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
      _launchRegistryMinigame(btn.dataset.mgid);
    };
  });

  document.getElementById('ui-root').appendChild(overlay);
}

// ==================== CALENDAR & DATE SYSTEM ====================
function advanceCalendar(){
  state.day++;
  const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
  if(state.day > daysInMonth[state.month - 1]){
    state.day = 1;
    state.month++;
    if(state.month > 12){
      state.month = 1;
      state.year++;
    }
  }
  // Check calendar events
  checkCalendarEvents();
  // Update personal income from business
  state.personal.business.forEach(b => {
    state.personal.personalMoney += b.income;
  });
}

function checkCalendarEvents(){
  const todayEvents = state.calendarEvents.filter(e => e.day === state.day && e.month === state.month);
  todayEvents.forEach(ev => {
    if(ev.type === 'side_mission' && ev.missionId){
      notify('📅 Event Hari Ini', ev.title, 'warn');
      state.phone.emails.unshift({
        id: 'cal_' + Date.now(),
        from: 'Sistem Kalender',
        subject: ev.title,
        body: `Event terjadwal untuk hari ini: ${ev.title}`,
        read: false,
        day: state.day,
      });
    }
  });

  // Check JSON registry date easter eggs
  const dateEgg = getDateEasterEgg(state.month, state.day);
  if (dateEgg) {
    setTimeout(() => _executeEasterEgg(dateEgg), 2000);
  }

  // Check JSON registry side missions that can activate today
  _checkRegistrySideMissions();
  renderSideMissionPanel();
}

// Check and activate any side missions from registry that are now available
function _checkRegistrySideMissions() {
  const available = getAvailableSideMissions(state);
  if (!available.length) return;
  const mission = available[0];
  if (!state.activeSideMissions) state.activeSideMissions = [];
  state.activeSideMissions.push({
    id: mission.id,
    name: mission.name,
    objectives: mission.objectives,
    reward: mission.reward,
    startDay: state.day,
    timeLimit: mission.timeLimit || null,
    progress: {},
  });
  renderSideMissionPanel();
  if (mission.cutscene?.lines?.length) {
    let di = 0;
    const next = () => {
      if (di < mission.cutscene.lines.length) {
        notify('📋 ' + (mission.name || 'Side Mission'), mission.cutscene.lines[di++], 'warn');
        setTimeout(next, 2500);
      }
    };
    next();
  } else {
    notify('📋 Side Mission Baru!', mission.name + ' — ' + (mission.description || ''), 'warn');
  }
}

function _tickSideMissionProgress() {
  if (!state.activeSideMissions?.length) return;
  for (let i = state.activeSideMissions.length - 1; i >= 0; i--) {
    const sm = state.activeSideMissions[i];
    if (!sm.objectives?.length) continue;
    const allDone = sm.objectives.every(obj => _checkSideMissionObjective(obj));
    if (allDone) {
      state.activeSideMissions.splice(i, 1);
      if (!state.completedSideMissions) state.completedSideMissions = [];
      state.completedSideMissions.push(sm.id);
      if (sm.reward?.money)     { state.money += sm.reward.money; }
      if (sm.reward?.happiness) { state.happiness = Math.min(100, state.happiness + sm.reward.happiness); }
      if (sm.reward?.relationship) {
        changeRelationship(sm.reward.relationship.charId, sm.reward.relationship.amount || 0);
      }
      renderHUD();
      notify('🎉 Side Mission Selesai!', `${sm.name} — +Rp ${(sm.reward?.money || 0).toLocaleString()}`, 'success');
      renderSideMissionPanel();
    }
  }
  renderSideMissionPanel();
}

function renderSideMissionPanel() {
  document.getElementById('side-mission-panel')?.remove();
  if (!state.activeSideMissions?.length) return;

  const panel = document.createElement('div');
  panel.id = 'side-mission-panel';
  panel.style.cssText = 'position:absolute;top:60px;right:10px;width:200px;background:rgba(10,5,25,0.92);border:2px solid #aa44ff;font-family:monospace;z-index:40;padding:8px;';

  const items = state.activeSideMissions.map(sm => {
    const objLines = (sm.objectives || []).map(obj => {
      const done = _checkSideMissionObjective(obj);
      return `<div style="font-size:9px;color:${done ? '#00ff88' : '#aaa'};margin-top:3px;">${done ? '✅' : '⬜'} ${obj.label || obj.type}</div>`;
    }).join('');
    return `
      <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #4a2a6a;">
        <div style="color:#cc88ff;font-size:10px;">📋 ${sm.name}</div>
        ${objLines}
        ${sm.reward?.money ? `<div style="font-size:9px;color:#ffcc00;margin-top:3px;">🏆 Rp ${sm.reward.money.toLocaleString()}</div>` : ''}
      </div>`;
  }).join('');

  panel.innerHTML = `<div style="color:#8844ff;font-size:10px;margin-bottom:6px;border-bottom:1px solid #4a2a6a;padding-bottom:4px;">📋 SIDE MISSIONS</div>${items}`;
  document.getElementById('ui-root').appendChild(panel);
}

function _checkSideMissionObjective(obj) {
  switch (obj.type) {
    case 'btype':
      return state.buildings.filter(b => b.type === obj.btype).length >= (obj.min || 1);
    case 'btypes':
      return state.buildings.filter(b => obj.btypes.includes(b.type)).length >= (obj.min || 1);
    case 'population':
      return state.population >= (obj.min || 0);
    case 'happiness':
      return state.happiness >= (obj.min || 0);
    case 'money':
      return state.money >= (obj.min || 0);
    default: return false;
  }
}

// ==================== RELATIONSHIP HELPERS ====================
function changeRelationship(characterId, amount){
  if(!state.relationships[characterId]) state.relationships[characterId] = 50;
  state.relationships[characterId] = clamp(state.relationships[characterId] + amount, 0, 100);
  if(amount > 0) notify('ðŸ’• Hubungan Naik', `${characterId.replace(/_/g,' ')} +${amount}`, 'success');
  else if(amount < 0) notify('ðŸ’” Hubungan Turun', `${characterId.replace(/_/g,' ')} ${amount}`, 'danger');
}

function addCorruption(amount, reason){
  state.personal.corruption = clamp(state.personal.corruption + amount, 0, 100);
  if(amount > 0){
    notify('ðŸ´ Korupsi', `+${amount}% - ${reason}`, 'danger');
    // Social media reaction
    state.phone.socialMedia.unshift({
      author: 'WhistleBlower', content: `Ada yang tidak beres dengan walikota kita...`, sentiment: 'negative'
    });
  }
}

// ==================== SETTINGS PANEL ====================
function showSettings(){
  // Inject panel on top of main menu
  const existing = document.getElementById('settings-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'settings-overlay';

  function buildHTML(){
    return `
      <div id="settings-panel">
        <div class="sp-title">${LT('settings_title')}</div>

        <div class="sp-row">
          <div class="sp-label">${LT('lang_label')}</div>
          <div class="sp-options">
            <button class="sp-opt ${_SET.lang==='id'?'active':''}" data-act="lang-id">${LT('lang_id')}</button>
            <button class="sp-opt ${_SET.lang==='en'?'active':''}" data-act="lang-en">${LT('lang_en')}</button>
          </div>
        </div>

        <div class="sp-row">
          <div class="sp-label">${LT('sound_label')}</div>
          <div class="sp-options">
            <button class="sp-opt ${_SET.sound?'active':''}" data-act="snd-on">${LT('sound_on')}</button>
            <button class="sp-opt ${!_SET.sound?'active':''}" data-act="snd-off">${LT('sound_off')}</button>
          </div>
        </div>

        <button class="sp-close" data-act="close">${LT('close')}</button>
      </div>`;
  }

  // Inject styles once
  if(!document.getElementById('settings-style')){
    const st = document.createElement('style');
    st.id = 'settings-style';
    st.textContent = `
      #settings-overlay{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62);}
      #settings-panel{background:linear-gradient(145deg,#1a0a2e,#0d1b3e);border:3px solid #7c4dff;border-radius:12px;padding:32px 36px;min-width:320px;box-shadow:0 0 40px rgba(124,77,255,.45);image-rendering:pixelated;font-family:'Press Start 2P',monospace,sans-serif;}
      .sp-title{color:#ffe600;font-size:13px;text-align:center;margin-bottom:28px;letter-spacing:2px;text-shadow:0 0 12px #ffe600;}
      .sp-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:16px;}
      .sp-label{color:#ccc;font-size:8px;letter-spacing:1px;white-space:nowrap;}
      .sp-options{display:flex;gap:8px;}
      .sp-opt{background:#1e1040;border:2px solid #4a2080;color:#aaa;font-family:inherit;font-size:7px;padding:7px 12px;border-radius:6px;cursor:pointer;transition:all .15s;letter-spacing:1px;}
      .sp-opt:hover{border-color:#7c4dff;color:#fff;background:#2a1060;}
      .sp-opt.active{background:#7c4dff;border-color:#aa88ff;color:#fff;box-shadow:0 0 10px rgba(124,77,255,.6);}
      .sp-close{display:block;margin:24px auto 0;background:#220a40;border:2px solid #7c4dff;color:#cc88ff;font-family:inherit;font-size:8px;padding:10px 24px;border-radius:6px;cursor:pointer;letter-spacing:2px;transition:all .15s;}
      .sp-close:hover{background:#7c4dff;color:#fff;box-shadow:0 0 14px rgba(124,77,255,.5);}
    `;
    document.head.appendChild(st);
  }

  overlay.innerHTML = buildHTML();
  document.body.appendChild(overlay);

  function refresh(){
    overlay.innerHTML = buildHTML();
    bindEvents();
  }

  function bindEvents(){
    overlay.querySelectorAll('[data-act]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const act = el.dataset.act;
        if(act === 'close'){ overlay.remove(); return; }
        if(act === 'lang-id'){ _SET.lang = 'id'; saveSET(); refresh(); renderMainMenu(); return; }
        if(act === 'lang-en'){ _SET.lang = 'en'; saveSET(); refresh(); renderMainMenu(); return; }
        if(act === 'snd-on'){  _SET.sound = true;  saveSET(); Audio.setEnabled(true);  refresh(); return; }
        if(act === 'snd-off'){ _SET.sound = false; saveSET(); Audio.setEnabled(false); refresh(); return; }
      };
    });
    // Click outside panel to close
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
  }


  bindEvents();
}

// ==================== MISSION SYSTEM ====================
function getMissionObjProgress(obj){
  let current = 0;
  switch(obj.type){
    case 'roads':       current = state.buildings.filter(b=>b.type==='road').length; break;
    case 'btype':       current = state.buildings.filter(b=>b.type===obj.btype).length; break;
    case 'btypes':      current = state.buildings.filter(b=>obj.btypes.includes(b.type)).length; break;
    case 'population':  current = state.population; break;
    case 'money':       current = state.money; break;
    case 'happiness':   current = state.happiness; break;
    case 'jobs':        current = state.jobs.offered; break;
    case 'relationship': current = (state.relationships && state.relationships[obj.charId]) || 0; break;
    case 'income':      current = state.income; break;
    default:            current = 0;
  }
  return { done: current >= obj.min, current: Math.min(current, obj.min), max: obj.min };
}

function checkMissionComplete(){
  if (state.sandbox || state.freeMode) return false;
  const lvl = MISSION_LEVELS[state.missionLevel - 1];
  if (!lvl) return false;
  return lvl.objectives.every(obj => getMissionObjProgress(obj).done);
}

function renderMissionPanel(){
  const panel = document.getElementById('mission-panel');
  if (!panel) return;
  if (state.sandbox){
    panel.style.display = 'none';
    return;
  }
  if (state.freeMode){
    panel.innerHTML = `<div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#00ffff;text-shadow:0 0 8px #00ffff;">ðŸ† FREE MODE<br><span style="color:#aaa;font-size:6px;">Bangun sesuka hati!</span></div>`;
    panel.style.display = 'block';
    return;
  }
  const lvl = MISSION_LEVELS[state.missionLevel - 1];
  if (!lvl){ panel.style.display='none'; return; }
  const minimized = panel.dataset.minimized === '1';
  const objs = lvl.objectives.map(obj => {
    const {done, current, max} = getMissionObjProgress(obj);
    const pct = Math.min(100, Math.round((current/max)*100));
    const col = done ? '#00ff88' : '#00ffff';
    const bar = minimized ? '' : `<div style="background:#0a0520;border:1px solid #2a1f4a;height:4px;margin-top:3px;"><div style="height:4px;background:${col};width:${pct}%"></div></div>`;
    const check = done ? 'âœ“ ' : '';
    if(minimized) return '';
    return `<div style="margin-top:6px;font-size:5.5px;color:${done?'#00ff88':'#ccc'}">${check}${obj.label}<div style="color:${col};font-size:5px;">${current.toLocaleString()} / ${max.toLocaleString()}</div>${bar}</div>`;
  }).join('');
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${minimized?'0':'6px'};">
      <span style="font-size:6px;color:#ffcc00;">LV ${state.missionLevel}/30 Â· ${lvl.name}</span>
      <button onclick="window.renderMissionPanelBtn(document.getElementById('mission-panel').dataset.minimized==='1'?'0':'1')" style="background:none;border:1px solid #2a1f4a;color:#4433aa;font-family:'Press Start 2P',monospace;font-size:6px;cursor:pointer;padding:2px 5px;">${minimized?'â–²':'â–¼'}</button>
    </div>
    ${objs}
    ${!minimized?`<button onclick="window.showLevelBriefingBtn()" style="margin-top:8px;background:#0a0520;border:1px solid #4433aa;color:#7766cc;font-family:'Press Start 2P',monospace;font-size:5px;cursor:pointer;padding:4px 8px;width:100%;">ðŸ“œ LIHAT BRIEFING</button>`:''}
  `;
}

function showLevelBriefing(levelNum, onComplete){
  if (state._missionShowing) return;
  state._missionShowing = true;
  const lvlData = MISSION_LEVELS[levelNum - 1];
  if (!lvlData){ state._missionShowing=false; onComplete && onComplete(); return; }

  const DIALOGUES = [
    ...lvlData.president,
    'ã€ OBJECTIVES ã€‘\n' + lvlData.objectives.map(o=>'Â· '+o.label).join('\n'),
  ];

  let existing = document.getElementById('cutscene-style');
  // reuse existing style if present
  const styleEl = existing || document.createElement('style');
  if(!existing){
    styleEl.id = 'cutscene-style';
    styleEl.textContent = `
      #president-cutscene{position:absolute;inset:0;z-index:60;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;overflow:hidden;cursor:pointer;}
      #cs-bg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.08) 45%,rgba(0,0,0,.55) 100%);}
      #cs-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.10) 2px,rgba(0,0,0,.10) 4px);pointer-events:none;z-index:5;}
      #cs-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.60) 100%);pointer-events:none;z-index:4;}
      #cs-char-wrap{position:absolute;bottom:148px;left:50%;transform:translateX(-50%);z-index:3;animation:csCharSlide .6s cubic-bezier(.2,1,.4,1) both;}
      #cs-char-wrap img{height:360px;width:auto;image-rendering:pixelated;filter:drop-shadow(0 0 28px rgba(0,200,255,.55)) drop-shadow(4px 0 0 #000) drop-shadow(-4px 0 0 #000);}
      @keyframes csCharSlide{from{opacity:0;transform:translateX(-50%) translateY(40px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      #cs-dialogue{position:relative;z-index:6;width:min(800px,92vw);margin-bottom:30px;background:linear-gradient(180deg,rgba(16,12,38,.94) 0%,rgba(8,6,24,.97) 100%);border:3px solid #4433aa;border-top:5px solid #00ffff;box-shadow:6px 6px 0 #000,0 0 32px rgba(0,255,255,.15),0 0 80px rgba(0,0,0,.6);padding:18px 22px 14px;animation:csDlgUp .4s steps(4) both;}
      @keyframes csDlgUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      #cs-speaker{font-family:'Press Start 2P',monospace;font-size:8px;color:#00ffff;text-shadow:2px 2px 0 #000,0 0 10px #00ffff;letter-spacing:1.5px;padding-bottom:10px;border-bottom:2px solid #2a1f4a;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
      #cs-speaker::before{content:'â–¶';color:#cc44ff;font-size:10px;}
      #cs-text{font-family:'Press Start 2P',monospace;font-size:7.5px;color:#eeeeff;line-height:2.1;min-height:68px;white-space:pre-wrap;text-shadow:1px 1px 0 #000;}
      #cs-hint{font-family:'Press Start 2P',monospace;font-size:6px;color:#5544bb;text-align:right;margin-top:10px;letter-spacing:1px;}
      #cs-hint.visible{animation:csBlink 1s steps(1) infinite;}
      @keyframes csBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
      #cs-progress{display:flex;gap:5px;justify-content:center;margin-top:10px;}
      #cs-progress span{width:10px;height:4px;background:#1e1640;border:1px solid #2a1f4a;display:inline-block;}
      #cs-progress span.done{background:#00ffff;}
      #cs-progress span.cur{background:#cc44ff;animation:csBlink 0.8s steps(1) infinite;}
      #cs-skip{position:absolute;top:16px;right:18px;z-index:10;font-family:'Press Start 2P',monospace;font-size:7px;background:rgba(10,8,20,.85);border:2px solid #2a1f4a;color:#4433aa;padding:6px 12px;cursor:pointer;letter-spacing:1px;box-shadow:2px 2px 0 #000;transition:border-color .1s,color .1s,box-shadow .1s;}
      #cs-skip:hover{border-color:#ff4444;color:#ff4444;box-shadow:2px 2px 0 #ff4444;}
      #cs-lvl-badge{position:absolute;top:16px;left:18px;z-index:10;font-family:'Press Start 2P',monospace;font-size:7px;background:rgba(10,8,20,.85);border:2px solid #cc44ff;color:#cc44ff;padding:6px 12px;letter-spacing:1px;box-shadow:2px 2px 0 #000;}
      #cs-fade{position:absolute;inset:0;background:#000;opacity:0;z-index:9;pointer-events:none;transition:opacity .5s;}
    `;
    document.head.appendChild(styleEl);
  }

  const overlay = document.createElement('div');
  overlay.id = 'president-cutscene';
  const uiRoot = document.getElementById('ui-root');
  overlay.innerHTML = `
    <div id="cs-bg"></div>
    <div id="cs-vignette"></div>
    <div id="cs-scanlines"></div>
    <div id="cs-char-wrap">
      <img src="./img/assets/char/char.png" alt="The President" draggable="false"/>
    </div>
    <div id="cs-dialogue">
      <div id="cs-speaker">THE PRESIDENT</div>
      <div id="cs-text"></div>
      <div id="cs-hint">â–¼ CLICK ATAU TEKAN SPASI</div>
      <div id="cs-progress">${DIALOGUES.map(()=>`<span></span>`).join('')}</div>
    </div>
    <div id="cs-lvl-badge">LEVEL ${levelNum}/30</div>
    <button id="cs-skip">SKIP â–¶â–¶</button>
    <div id="cs-fade"></div>
  `;
  uiRoot.appendChild(overlay);

  const textEl   = overlay.querySelector('#cs-text');
  const hintEl   = overlay.querySelector('#cs-hint');
  const fadeEl   = overlay.querySelector('#cs-fade');
  const progress = overlay.querySelectorAll('#cs-progress span');

  let audioCtx2 = null;
  function ac2(){ return audioCtx2||(audioCtx2=new(window.AudioContext||window.webkitAudioContext)()); }
  function beep2(freq,dur,vol=0.07,type='square',delay=0){
    try{const c=ac2(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime+delay);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+delay+dur);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+dur+0.01);}catch(e){}
  }
  const PITCHES=[784,880,988,1047,1175,1319];
  function playTypeBeep2(){beep2(PITCHES[Math.floor(Math.random()*PITCHES.length)],0.042,0.055);}
  function playAdvance2(){beep2(523,0.07,0.09);beep2(659,0.07,0.09,'square',0.08);beep2(784,0.1,0.09,'square',0.16);}
  function playEnd2(){beep2(523,0.08,0.1);beep2(659,0.08,0.1,'square',0.1);beep2(784,0.08,0.1,'square',0.2);beep2(1047,0.2,0.12,'square',0.3);}

  let dlgIdx=0, typing=false, typeTimer=null, fullText='';
  function updateProg2(){progress.forEach((s,i)=>{s.className=i<dlgIdx?'done':i===dlgIdx?'cur':'';}); }
  function showDlg2(idx){
    if(idx>=DIALOGUES.length){
      playEnd2(); hintEl.className=''; hintEl.textContent='';
      fadeEl.style.opacity='1';
      setTimeout(()=>{ overlay.remove(); if(!existing)styleEl.remove(); state._missionShowing=false; onComplete&&onComplete(); },600);
      return;
    }
    updateProg2(); fullText=DIALOGUES[idx]; textEl.textContent=''; hintEl.className=''; hintEl.textContent='â–¼ CLICK ATAU TEKAN SPASI';
    let ci=0; typing=true; clearInterval(typeTimer);
    typeTimer=setInterval(()=>{
      if(ci>=fullText.length){clearInterval(typeTimer);typing=false;hintEl.className='visible';return;}
      textEl.textContent+=fullText[ci];
      if(fullText[ci]!==' '&&fullText[ci]!=='\n'&&ci%2===0)playTypeBeep2();
      ci++;
    },36);
  }
  function advance2(){
    if(typing){clearInterval(typeTimer);typing=false;textEl.textContent=fullText;hintEl.className='visible';}
    else{playAdvance2();dlgIdx++;showDlg2(dlgIdx);}
  }
  function skipAll2(){clearInterval(typeTimer);typing=false;playEnd2();fadeEl.style.opacity='1';setTimeout(()=>{overlay.remove();if(!existing)styleEl.remove();state._missionShowing=false;onComplete&&onComplete();},500);}

  overlay.addEventListener('click', advance2);
  overlay.querySelector('#cs-skip').addEventListener('click', e=>{e.stopPropagation();skipAll2();});
  function onKey2(e){
    if(e.code==='Escape'){e.preventDefault();skipAll2();return;}
    if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight'){e.preventDefault();advance2();}
  }
  document.addEventListener('keydown',onKey2);
  const origOnComplete=onComplete;
  onComplete=()=>{document.removeEventListener('keydown',onKey2);origOnComplete&&origOnComplete();};
  showDlg2(0);
}

function showLevelCompleteScreen(levelNum, onNext){
  const lvlData = MISSION_LEVELS[levelNum - 1];
  const isLast = levelNum >= 30;
  const overlay = document.createElement('div');
  overlay.id = 'level-complete-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,10,0.88);font-family:"Press Start 2P",monospace;';
  const objList = lvlData.objectives.map(o=>`<div style="margin:5px 0;font-size:6.5px;color:#00ff88;">âœ“ ${o.label}</div>`).join('');
  overlay.innerHTML = `
    <div style="text-align:center;max-width:600px;padding:20px;">
      <div style="font-size:8px;color:#ffcc00;text-shadow:0 0 20px #ffcc00;letter-spacing:2px;margin-bottom:6px;">LEVEL ${levelNum} SELESAI!</div>
      <div style="font-size:11px;color:#00ffff;text-shadow:0 0 30px #00ffff;margin-bottom:16px;">${lvlData.name}</div>
      <div style="background:rgba(0,255,136,0.08);border:2px solid #00ff88;padding:12px;margin-bottom:14px;">${objList}</div>
      <div style="font-size:9px;color:#ffdd44;margin-bottom:18px;">+$${lvlData.reward.toLocaleString()} REWARD!</div>
      ${isLast
        ? `<div style="font-size:7px;color:#cc44ff;margin-bottom:16px;line-height:2;">Selamat! Kamu telah menyelesaikan semua 30 Level!<br>Mode Bebas kini aktif â€” bangun sesuka hatimu!</div>`
        : `<div style="font-size:7px;color:#aaa;margin-bottom:16px;">Level berikutnya siap menunggumu...</div>`}
      <button id="lvl-next-btn" style="background:#0a0520;border:3px solid #00ffff;color:#00ffff;font-family:'Press Start 2P',monospace;font-size:9px;padding:14px 30px;cursor:pointer;box-shadow:0 0 20px rgba(0,255,255,.4);letter-spacing:2px;">
        ${isLast ? 'ðŸ† MODE BEBAS' : 'LEVEL BERIKUTNYA â–¶'}
      </button>
      <div style="font-size:5px;color:#2a1f4a;margin-top:12px;">Auto-lanjut dalam <span id="lvl-timer">30</span> detik...</div>
    </div>
  `;
  document.getElementById('ui-root').appendChild(overlay);
  let t = 30;
  const tim = setInterval(()=>{
    t--;
    const el = document.getElementById('lvl-timer');
    if(el) el.textContent = t;
    if(t<=0){ clearInterval(tim); overlay.remove(); onNext&&onNext(); }
  }, 1000);
  document.getElementById('lvl-next-btn').onclick = ()=>{ clearInterval(tim); overlay.remove(); onNext&&onNext(); };
}

function advanceMissionLevel(){
  if (state._missionShowing) return;
  const lvl = state.missionLevel;
  state.money += MISSION_LEVELS[lvl-1].reward;
  Audio.playLevelUp();
  renderTopBar();
  showLevelCompleteScreen(lvl, ()=>{
    if(lvl >= 30){
      state.freeMode = true;
      // Unlock next map when completing all 30 levels
      const mapOrder = ['sumatra','jawa','kalimantan','sulawesi','papua'];
      const currentIdx = mapOrder.indexOf(state.mapId);
      if(currentIdx >= 0 && currentIdx < mapOrder.length - 1){
        const nextMap = mapOrder[currentIdx + 1];
        if(!state.unlockedMaps.includes(nextMap)){
          state.unlockedMaps.push(nextMap);
          notify('ðŸ—ºï¸ Pulau Baru Terbuka!', `${nextMap.charAt(0).toUpperCase() + nextMap.slice(1)} sekarang bisa dikunjungi via Bandara!`, 'success');
        }
      }
      renderMissionPanel();
      notify('ðŸ† Mode Bebas Aktif!','Selamat! Kini kamu bebas membangun Nusabox sesuka hati!','success');
    } else {
      state.missionLevel = lvl + 1;
      state._missionChecked = false;
      renderMissionPanel();
      showLevelBriefing(state.missionLevel, ()=>{});
    }
  });
}

function showPresidentCutscene(onComplete){
  const DIALOGUES = [
    'Selamat datang di Nusabox!\nSaya adalah Presiden negeri ini.',
    'Saya sudah tidak sanggup lagi mengurus\nkota ini karna kebodohan saya.\nTolong bantu saya mengelolanya...',
    'Mulailah dengan membangun JALAN\nuntuk menghubungkan setiap wilayah kota.',
    'Lalu buat ZONA PERUMAHAN\nagar warga bisa pindah dan menetap disini.',
    'Jangan lupa bangun PEMBANGKIT LISTRIK\ndan instalasi AIR -- tanpa itu kota tidak bisa berfungsi.',
    'Bangun gedung KOMERSIAL dan INDUSTRI\nuntuk mendapatkan pajak dan membuka lapangan kerja.',
    'Perhatikan kebahagiaan warga.\nBangun TAMAN dan FASILITAS PUBLIK agar mereka senang.',
    'Saya percayakan kota ini kepadamu,\nWalikota. Semoga sukses membangun Nusabox!',
  ];

  // --- inject cutscene styles ---
  const styleEl = document.createElement('style');
  styleEl.id = 'cutscene-style';
  styleEl.textContent = `
    #president-cutscene{position:absolute;inset:0;z-index:60;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;overflow:hidden;cursor:pointer;}
    #cs-bg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.08) 45%,rgba(0,0,0,.55) 100%);}
    #cs-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.10) 2px,rgba(0,0,0,.10) 4px);pointer-events:none;z-index:5;}
    #cs-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.60) 100%);pointer-events:none;z-index:4;}
    #cs-char-wrap{position:absolute;bottom:148px;left:50%;transform:translateX(-50%);z-index:3;animation:csCharSlide .6s cubic-bezier(.2,1,.4,1) both;}
    #cs-char-wrap img{height:360px;width:auto;image-rendering:pixelated;filter:drop-shadow(0 0 28px rgba(0,200,255,.55)) drop-shadow(4px 0 0 #000) drop-shadow(-4px 0 0 #000);}
    @keyframes csCharSlide{from{opacity:0;transform:translateX(-50%) translateY(40px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    #cs-dialogue{position:relative;z-index:6;width:min(800px,92vw);margin-bottom:30px;background:linear-gradient(180deg,rgba(16,12,38,.94) 0%,rgba(8,6,24,.97) 100%);border:3px solid #4433aa;border-top:5px solid #00ffff;box-shadow:6px 6px 0 #000,0 0 32px rgba(0,255,255,.15),0 0 80px rgba(0,0,0,.6);padding:18px 22px 14px;animation:csDlgUp .4s steps(4) both;}
    @keyframes csDlgUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    #cs-speaker{font-family:'Press Start 2P',monospace;font-size:8px;color:#00ffff;text-shadow:2px 2px 0 #000,0 0 10px #00ffff;letter-spacing:1.5px;padding-bottom:10px;border-bottom:2px solid #2a1f4a;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
    #cs-speaker::before{content:'â–¶';color:#cc44ff;font-size:10px;}
    #cs-text{font-family:'Press Start 2P',monospace;font-size:7.5px;color:#eeeeff;line-height:2.1;min-height:68px;white-space:pre-wrap;text-shadow:1px 1px 0 #000;}
    #cs-hint{font-family:'Press Start 2P',monospace;font-size:6px;color:#5544bb;text-align:right;margin-top:10px;letter-spacing:1px;}
    #cs-hint.visible{animation:csBlink 1s steps(1) infinite;}
    @keyframes csBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
    #cs-progress{display:flex;gap:5px;justify-content:center;margin-top:10px;}
    #cs-progress span{width:10px;height:4px;background:#1e1640;border:1px solid #2a1f4a;display:inline-block;}
    #cs-progress span.done{background:#00ffff;}
    #cs-progress span.cur{background:#cc44ff;animation:csBlink 0.8s steps(1) infinite;}
    #cs-skip{position:absolute;top:16px;right:18px;z-index:10;font-family:'Press Start 2P',monospace;font-size:7px;background:rgba(10,8,20,.85);border:2px solid #2a1f4a;color:#4433aa;padding:6px 12px;cursor:pointer;letter-spacing:1px;box-shadow:2px 2px 0 #000;transition:border-color .1s,color .1s,box-shadow .1s;}
    #cs-skip:hover{border-color:#ff4444;color:#ff4444;box-shadow:2px 2px 0 #ff4444;}
    #cs-fade{position:absolute;inset:0;background:#000;opacity:0;z-index:9;pointer-events:none;transition:opacity .5s;}
  `;
  document.head.appendChild(styleEl);

  // --- build DOM ---
  const overlay = document.createElement('div');
  overlay.id = 'president-cutscene';

  overlay.innerHTML = `
    <div id="cs-bg"></div>
    <div id="cs-vignette"></div>
    <div id="cs-scanlines"></div>
    <div id="cs-char-wrap">
      <img src="./img/assets/char/char.png" alt="The President" draggable="false"/>
    </div>
    <div id="cs-dialogue">
      <div id="cs-speaker">THE PRESIDENT</div>
      <div id="cs-text"></div>
      <div id="cs-hint">â–¼ CLICK ATAU TEKAN SPASI</div>
      <div id="cs-progress">${DIALOGUES.map((_,i)=>`<span></span>`).join('')}</div>
    </div>
    <button id="cs-skip">SKIP â–¶â–¶</button>
    <div id="cs-fade"></div>
  `;
  uiRoot.appendChild(overlay);

  const textEl   = overlay.querySelector('#cs-text');
  const hintEl   = overlay.querySelector('#cs-hint');
  const fadeEl   = overlay.querySelector('#cs-fade');
  const progress = overlay.querySelectorAll('#cs-progress span');

  // --- 8-bit audio ---
  let audioCtx = null;
  function ac(){ return audioCtx || (audioCtx = new (window.AudioContext||window.webkitAudioContext)()); }

  function beep(freq, dur, vol=0.07, type='square', delay=0){
    try{
      const c=ac(), o=c.createOscillator(), g=c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type=type; o.frequency.value=freq;
      g.gain.setValueAtTime(vol, c.currentTime+delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+delay+dur);
      o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur+0.01);
    }catch(e){}
  }

  const TYPING_PITCHES = [784,880,988,1047,1175,1319];
  function playTypeBeep(){
    beep(TYPING_PITCHES[Math.floor(Math.random()*TYPING_PITCHES.length)], 0.042, 0.055);
  }
  function playAdvance(){
    beep(523,0.07,0.09); beep(659,0.07,0.09,undefined,0.08); beep(784,0.1,0.09,undefined,0.16);
  }
  function playEnd(){
    beep(523,0.08,0.1); beep(659,0.08,0.1,undefined,0.1); beep(784,0.08,0.1,undefined,0.2); beep(1047,0.2,0.12,undefined,0.3);
  }

  // --- typewriter ---
  let dlgIdx = 0;
  let typing  = false;
  let typeTimer = null;
  let fullText  = '';

  function updateProgress(){
    progress.forEach((s,i)=>{
      s.className = i < dlgIdx ? 'done' : i === dlgIdx ? 'cur' : '';
    });
  }

  function showDlg(idx){
    if(idx >= DIALOGUES.length){
      playEnd();
      hintEl.className='';
      hintEl.textContent='';
      fadeEl.style.opacity='1';
      setTimeout(()=>{ overlay.remove(); styleEl.remove(); onComplete(); }, 600);
      return;
    }
    updateProgress();
    fullText = DIALOGUES[idx];
    textEl.textContent = '';
    hintEl.className = '';
    hintEl.textContent = 'â–¼ CLICK ATAU TEKAN SPASI';
    let ci = 0;
    typing = true;
    clearInterval(typeTimer);
    typeTimer = setInterval(()=>{
      if(ci >= fullText.length){ clearInterval(typeTimer); typing=false; hintEl.className='visible'; return; }
      textEl.textContent += fullText[ci];
      if(fullText[ci]!=' ' && fullText[ci]!=='\n' && ci%2===0) playTypeBeep();
      ci++;
    }, 36);
  }

  function advance(){
    if(typing){
      clearInterval(typeTimer);
      typing = false;
      textEl.textContent = fullText;
      hintEl.className = 'visible';
    } else {
      playAdvance();
      dlgIdx++;
      showDlg(dlgIdx);
    }
  }

  overlay.addEventListener('click', advance);

  function skipAll(){
    clearInterval(typeTimer);
    typing = false;
    playEnd();
    fadeEl.style.opacity = '1';
    setTimeout(()=>{ overlay.remove(); styleEl.remove(); onComplete(); }, 500);
  }

  overlay.querySelector('#cs-skip').addEventListener('click', e => { e.stopPropagation(); skipAll(); });

  function onKey(e){
    if(e.code==='Escape'){ e.preventDefault(); skipAll(); return; }
    if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowRight'){ e.preventDefault(); advance(); }
  }
  document.addEventListener('keydown', onKey);
  // clean up key listener when done
  const origComplete = onComplete;
  onComplete = ()=>{ document.removeEventListener('keydown', onKey); origComplete(); };

  showDlg(0);
}

// ==================== LAND EXPANSION SYSTEM ====================
const LAND_TIERS = (function(){
  // Generate tiers: 20â†’25â†’30â†’35â†’40â†’45â†’50â†’55â†’60â†’65â†’70â†’75â†’80â†’85â†’90â†’95â†’100
  // Price grows exponentially: base * 1.6^step
  const tiers = [];
  const steps = [25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
  let basePrice = 60000;
  for(let i=0;i<steps.length;i++){
    const s = steps[i];
    const ask = Math.round(basePrice);
    tiers.push({
      toSize: s,
      label: `${s}Ã—${s} Petak`,
      wiwiAsk: ask,
      deal1: Math.round(ask * 0.82),
      deal2: Math.round(ask * 0.66),
    });
    basePrice *= 1.65;
  }
  return tiers;
})();

function getNextLandTier(){ return LAND_TIERS.find(t => t.toSize > state.landSize) || null; }

function updateLandBorderMesh(){
  if (state._landBorderMesh){ scene.remove(state._landBorderMesh); state._landBorderMesh = null; }
  if (state.landSize >= GRID) return;
  const { min } = getLandBounds();
  const size = state.landSize * TILE;
  const offset = min * TILE - HALF + size / 2;
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, 0.1, size));
  const mat = new THREE.LineBasicMaterial({ color: 0xff8800 });
  const mesh = new THREE.LineSegments(geo, mat);
  mesh.position.set(offset, 0.35, offset);
  scene.add(mesh);
  state._landBorderMesh = mesh;
}

function doExpandLand(toSize, cost){
  if (state.money < cost){ notify('Uang Kurang!','Dana tidak cukup untuk membeli tanah ini.','danger'); return; }
  state.money -= cost;
  state.landSize = toSize;
  // Corruption: paying Pak Wiwi increases corruption
  addCorruption(3, 'Bayar Pak Wiwi untuk tanah');
  changeRelationship('pak_wiwi', 5);
  // Actually grow the 3D map
  updateGroundAndGrid();
  if (state._landBorderMesh){ scene.remove(state._landBorderMesh); state._landBorderMesh = null; }
  renderTopBar();
  renderMinimap();
  // Spawn trees on newly unlocked land
  setTimeout(() => spawnWorldTrees(), 100);
  notify('ðŸžï¸ Tanah Dibeli!', `Wilayah kota kini ${toSize}Ã—${toSize} petak!`, 'success');
  Audio.playLevelUp();
}

// ---- President Advisor Cutscene (with choices) ----
function showPresidentAdvisor(){
  if (document.getElementById('president-advisor-scene') || state._missionShowing) return;

  const hasMetTier = getNextLandTier();
  const introduced = !!state._wiwiIntroduced;
  const landFull = !hasMetTier;

  // Build dialog lines based on situation
  const lvlData = MISSION_LEVELS[Math.min(state.missionLevel - 1, 29)];
  const presLines = [
    `Walikota, ada yang bisa saya bantu?\n...walaupun saya sendiri tidak becus\nmengurus semua ini sendirian.`,
    landFull
      ? `Kota kita sudah memenuhi seluruh wilayah\nNusabox yang ada. Luar biasa!\nSaya bahkan tidak pernah bayangkan ini.`
      : (!introduced
          ? `Oh ya, soal lahan kota kita...\nSaya kenal seorang pedagang tanah, namanya Wiwi.\nDia... sopan sekali. *sedikit berkeringat*\nTapi hati-hati ya, Walikota.`
          : `Kalau mau beli tanah, bisa saya hubungkan\nlagi dengan Pak Wiwi.\n*berbisik* Tapi jangan terlalu percaya\ndengan kata-katanya ya, Walikota.`),
  ];

  // Inject style if not exist
  const styleId = 'pres-advisor-style';
  if (!document.getElementById(styleId)){
    const st = document.createElement('style');
    st.id = styleId;
    st.textContent = `
      #president-advisor-scene{position:absolute;inset:0;z-index:62;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.65) 100%);}
      #pa-char{position:absolute;bottom:155px;right:calc(50% - 260px);animation:paSlide .5s cubic-bezier(.2,1,.4,1) both;}
      #pa-char img{height:330px;image-rendering:pixelated;filter:drop-shadow(0 0 24px rgba(0,200,255,.5)) drop-shadow(4px 0 0 #000) drop-shadow(-4px 0 0 #000);}
      @keyframes paSlide{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
      #pa-box{position:relative;z-index:8;width:min(820px,94vw);margin-bottom:26px;background:linear-gradient(180deg,rgba(14,8,36,.96),rgba(6,4,18,.98));border:3px solid #4433aa;border-top:5px solid #00ffff;box-shadow:6px 6px 0 #000,0 0 28px rgba(0,255,255,.12);padding:18px 22px 14px;}
      #pa-name{font-family:'Press Start 2P',monospace;font-size:8px;color:#00ffff;text-shadow:2px 2px 0 #000,0 0 10px #00ffff;letter-spacing:1.5px;padding-bottom:9px;border-bottom:2px solid #2a1f4a;margin-bottom:11px;}
      #pa-name::before{content:'â–¶ ';}
      #pa-text{font-family:'Press Start 2P',monospace;font-size:7.5px;color:#eeeeff;line-height:2.1;min-height:62px;white-space:pre-wrap;text-shadow:1px 1px 0 #000;}
      #pa-choices{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
      #pa-choices button{background:#0a0520;border:2px solid #4433aa;color:#aabbff;font-family:'Press Start 2P',monospace;font-size:6.5px;padding:9px 14px;cursor:pointer;transition:all .12s;letter-spacing:.5px;}
      #pa-choices button:hover{border-color:#00ffff;color:#fff;box-shadow:0 0 10px rgba(0,255,255,.3);}
      #pa-choices button.gold{border-color:#885500;color:#ffcc88;}
      #pa-choices button.gold:hover{border-color:#ffaa00;background:#1a0800;box-shadow:0 0 10px rgba(255,160,0,.3);}
      #pa-choices button.dim{border-color:#221a44;color:#443366;cursor:not-allowed;}
      #pa-hint{font-family:'Press Start 2P',monospace;font-size:6px;color:#5544bb;text-align:right;margin-top:8px;letter-spacing:1px;animation:paBlink 1s steps(1) infinite;}
      @keyframes paBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
      #pa-close-btn{position:absolute;top:14px;right:16px;z-index:10;font-family:'Press Start 2P',monospace;font-size:7px;background:rgba(10,8,20,.85);border:2px solid #2a1f4a;color:#4433aa;padding:5px 10px;cursor:pointer;letter-spacing:1px;}
      #pa-close-btn:hover{border-color:#ff4444;color:#ff4444;}
    `;
    document.head.appendChild(st);
  }

  const overlay = document.createElement('div');
  overlay.id = 'president-advisor-scene';
  overlay.innerHTML = `
    <div id="pa-char"><img src="./img/assets/char/char.png" draggable="false"/></div>
    <div id="pa-box">
      <div id="pa-name">THE PRESIDENT</div>
      <div id="pa-text"></div>
      <div id="pa-choices"></div>
      <div id="pa-hint"></div>
    </div>
    <button id="pa-close-btn">âœ– TUTUP</button>
  `;
  document.getElementById('ui-root').appendChild(overlay);

  const textEl    = overlay.querySelector('#pa-text');
  const choicesEl = overlay.querySelector('#pa-choices');
  const hintEl    = overlay.querySelector('#pa-hint');

  let typeTimer = null;
  let typeIdx   = 0;
  let typing    = false;
  let fullTxt   = '';
  let pendingDone = null;

  function playTypeBeepPA(){
    try{
      const ac = new (window.AudioContext||window.webkitAudioContext)();
      const o=ac.createOscillator(), g=ac.createGain();
      o.connect(g); g.connect(ac.destination);
      const pitches=[784,880,988,1047];
      o.frequency.value = pitches[Math.floor(Math.random()*pitches.length)];
      o.type='square'; g.gain.setValueAtTime(0.05, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.04);
      o.start(); o.stop(ac.currentTime+0.045);
    }catch(e){}
  }

  function typeText(txt, onDone){
    clearInterval(typeTimer);
    textEl.textContent=''; choicesEl.innerHTML=''; hintEl.textContent='';
    fullTxt = txt; typing = true; typeIdx = 0; pendingDone = onDone || null;
    typeTimer = setInterval(()=>{
      if(typeIdx >= fullTxt.length){
        clearInterval(typeTimer); typing=false;
        hintEl.textContent='â–¼ KLIK UNTUK LANJUT';
        const cb = pendingDone; pendingDone = null;
        if(cb) cb();
        return;
      }
      textEl.textContent += fullTxt[typeIdx];
      if(fullTxt[typeIdx]!==' '&&fullTxt[typeIdx]!=='\n'&&typeIdx%2===0) playTypeBeepPA();
      typeIdx++;
    }, 32);
  }

  function skipType(){
    if(typing){
      clearInterval(typeTimer); typing=false;
      textEl.textContent=fullTxt; hintEl.textContent='';
      const cb = pendingDone; pendingDone = null;
      if(cb) cb();
    }
  }

  function showChoices(buttons){
    hintEl.textContent = '';
    choicesEl.innerHTML = '';
    buttons.forEach(({label, cls, action})=>{
      const b = document.createElement('button');
      if(cls) b.className=cls;
      b.textContent = label;
      b.onclick = ()=>{ if(b.classList.contains('dim')) return; action(); };
      choicesEl.appendChild(b);
    });
  }

  function close(){ clearInterval(typeTimer); overlay.remove(); }

  // Click to skip typing
  overlay.querySelector('#pa-box').addEventListener('click', ()=>{ if(typing) skipType(); });
  overlay.querySelector('#pa-close-btn').addEventListener('click', e=>{ e.stopPropagation(); close(); });

  // ---- Dialog flow ----
  function stepIntro(){
    typeText(presLines[0], ()=>{
      typeText(presLines[1], stepShowMenu);
    });
  }

  function stepShowMenu(){
    const tier = getNextLandTier();
    const noLand = !tier;
    const buttons = [
      {
        label: noLand ? 'ðŸžï¸ Tanah Sudah Penuh' : (introduced ? 'ðŸžï¸ Hubungi Pak Wiwi' : 'ðŸžï¸ Kenalkan Pak Wiwi'),
        cls: noLand ? 'dim' : 'gold',
        action: ()=>{ if(noLand) return; introduced ? callWiwiDirect(close) : stepIntroduceWiwi(close); }
      },
      { label: 'ðŸ“œ Briefing Level Ini', action: ()=>{ close(); showLevelBriefing(state.missionLevel, ()=>{}); } },
      { label: `ðŸ“‹ Level ${state.missionLevel}/30 â€” ${lvlData.name}`, cls:'dim', action:()=>{} },
      { label: 'âœ– Tidak Perlu', action: close },
    ];
    showChoices(buttons);
  }

  function stepIntroduceWiwi(onDone){
    state._wiwiIntroduced = true;
    typeText(
      `Baik, izinkan saya kenalkan...\n*memanggil seseorang dari balik pintu*\n\nNamanya Wiwi. Pedagang tanah paling\n"terpercaya" di Nusabox. *sedikit berkeringat*\n\nDia akan menawarkan tanah untuk\nmemperluas wilayah kota kita.\n\nTapi ingat, Walikota...\nberhati-hatilah. ðŸ˜…`,
      ()=>{
        showChoices([
          { label: 'ðŸ‘¤ Temui Pak Wiwi', cls:'gold', action: ()=>{ close(); showWiwiNegotiationFull(); } },
          { label: 'â†© Nanti Saja', action: close },
        ]);
      }
    );
  }

  function callWiwiDirect(closeFn){
    typeText(
      `Baik, saya panggilkan Pak Wiwi sekarang.\n*menelepon*\n\nAh, dia sudah ada di depan pintu...\nCepat sekali. *mengerutkan dahi*\n\nIngat Walikota, jangan langsung\nsetuju dengan harga pertamanya!`,
      ()=>{
        showChoices([
          { label: 'ðŸ’¼ Temui Pak Wiwi', cls:'gold', action: ()=>{ close(); showWiwiNegotiationFull(); } },
          { label: 'â†© Nanti Saja', action: close },
        ]);
      }
    );
  }

  stepIntro();
}

// ---- Wiwi Negotiation ----
function showWiwiNegotiationFull(){
  const tier = getNextLandTier();
  if (!tier){
    notify('Tanah Penuh!','Kamu sudah membeli semua tanah yang tersedia di Nusabox!','success');
    return;
  }

  // Inject style once
  if (!document.getElementById('wiwi-style')){
    const st = document.createElement('style');
    st.id = 'wiwi-style';
    st.textContent = `
      #wiwi-overlay{position:absolute;inset:0;z-index:65;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;background:linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,.7) 100%);}
      #wiwi-char{position:absolute;bottom:160px;right:calc(50% - 300px);animation:wiwiSlide .5s cubic-bezier(.2,1,.4,1) both;}
      #wiwi-char img{height:340px;width:auto;image-rendering:pixelated;filter:drop-shadow(0 0 24px rgba(255,180,0,.4)) drop-shadow(4px 0 0 #000) drop-shadow(-4px 0 0 #000);}
      @keyframes wiwiSlide{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
      #wiwi-dialogue{position:relative;z-index:6;width:min(820px,94vw);margin-bottom:28px;background:linear-gradient(180deg,rgba(20,10,8,.95),rgba(10,5,4,.98));border:3px solid #885500;border-top:5px solid #ffaa00;box-shadow:6px 6px 0 #000,0 0 32px rgba(255,160,0,.12);padding:18px 22px 14px;}
      #wiwi-name{font-family:'Press Start 2P',monospace;font-size:8px;color:#ffaa00;text-shadow:2px 2px 0 #000,0 0 10px #ffaa00;letter-spacing:1.5px;padding-bottom:10px;border-bottom:2px solid #443300;margin-bottom:12px;}
      #wiwi-name::before{content:'ðŸ’¼ ';font-size:11px;}
      #wiwi-text{font-family:'Press Start 2P',monospace;font-size:7.5px;color:#fff0dd;line-height:2.2;min-height:70px;white-space:pre-wrap;text-shadow:1px 1px 0 #000;}
      #wiwi-choices{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
      #wiwi-choices button{background:#120800;border:2px solid #885500;color:#ffcc88;font-family:'Press Start 2P',monospace;font-size:6.5px;padding:9px 14px;cursor:pointer;transition:all .12s;letter-spacing:.5px;}
      #wiwi-choices button:hover{background:#331500;border-color:#ffaa00;color:#fff;box-shadow:0 0 10px rgba(255,160,0,.4);}
      #wiwi-choices button.danger{border-color:#882200;color:#ff8866;}
      #wiwi-choices button.danger:hover{background:#331000;border-color:#ff4400;}
      #wiwi-subtitle{font-family:'Press Start 2P',monospace;font-size:5.5px;color:#aa6600;margin-top:6px;font-style:italic;}
    `;
    document.head.appendChild(st);
  }

  const overlay = document.createElement('div');
  overlay.id = 'wiwi-overlay';
  overlay.innerHTML = `
    <div id="wiwi-char"><img src="./img/assets/char/wiwi.PNG" alt="Wiwi" draggable="false"/></div>
    <div id="wiwi-dialogue">
      <div id="wiwi-name">WIWI â€” Pemilik Tanah Nusabox</div>
      <div id="wiwi-text"></div>
      <div id="wiwi-subtitle"></div>
      <div id="wiwi-choices"></div>
    </div>
  `;
  document.getElementById('ui-root').appendChild(overlay);

  const textEl     = overlay.querySelector('#wiwi-text');
  const subEl      = overlay.querySelector('#wiwi-subtitle');
  const choicesEl  = overlay.querySelector('#wiwi-choices');

  let typeTimer = null;
  function typeText(txt, sub, onDone){
    clearInterval(typeTimer);
    textEl.textContent = ''; subEl.textContent = sub||'';
    choicesEl.innerHTML = '';
    let ci = 0;
    typeTimer = setInterval(()=>{
      if(ci >= txt.length){ clearInterval(typeTimer); onDone && onDone(); return; }
      textEl.textContent += txt[ci]; ci++;
    }, 30);
  }

  function showChoices(buttons){
    choicesEl.innerHTML = '';
    buttons.forEach(({label, cls, action})=>{
      const b = document.createElement('button');
      if(cls) b.className = cls;
      b.textContent = label;
      b.onclick = action;
      choicesEl.appendChild(b);
    });
  }

  function close(){ clearInterval(typeTimer); overlay.remove(); }

  // ---- Negotiation state ----
  const fmt = n => '$' + n.toLocaleString();

  // STEP 1: Greeting
  function step1(){
    typeText(
      `Selamat datang, Bapak/Ibu Walikota yang terhormat!\n*tersenyum manis*\n\nSaya Wiwi, pengelola tanah terbaik di Nusabox.\nSaya dengar Anda ingin memperluas wilayah kota?\n\nKebetulan sekali, saya punya lahan yang...\nsangat spesial untuk Anda. ðŸ˜Š`,
      '',
      ()=>{
        showChoices([
          { label: `ðŸ“‹ Lihat Penawaran`, action: step2 },
          { label: `âœ– Tidak Perlu`, cls:'danger', action: close },
        ]);
      }
    );
  }

  // STEP 2: Quote high price
  function step2(){
    typeText(
      `Ini dia yang Anda butuhkan:\n${tier.label}\n\nHarganya... *membuka buku catatan*\n\nHmm, ini lahan premium, Walikota.\nBelum termasuk biaya administrasi,\npajak notaris, dan... "uang tanda jadi" ðŸ˜Š\n\nTotal: ${fmt(tier.wiwiAsk)}`,
      `* Harga sudah termasuk "biaya-biaya tersembunyi" Wiwi`,
      ()=>{
        const canAfford1 = state.money >= tier.wiwiAsk;
        const canAfford2 = state.money >= tier.deal1;
        showChoices([
          { label: `âœ… Setuju â€” ${fmt(tier.wiwiAsk)}`, action: ()=>step_deal(tier.wiwiAsk, 'full'), cls: canAfford1?'':'danger' },
          { label: `ðŸ’¬ Tawar Dulu`, action: step3 },
          { label: `ðŸš¶ Tidak Jadi`, cls:'danger', action: step_walkaway },
        ]);
      }
    );
  }

  // STEP 3: First negotiation
  function step3(){
    typeText(
      `Oh... *kedipkan mata perlahan*\n\nBaiklah, Walikota. Karena saya sangat menghormati\nAnda sebagai pemimpin kota ini...\n*menghapus beberapa angka*\n\nSaya kurangi "biaya administrasinya" sedikit.\nTapi biaya notaris tetap ya, tidak bisa ditawar. ðŸ˜Š\n\nJadi: ${fmt(tier.deal1)}`,
      `* Wiwi tersenyum... tapi matanya tidak ikut tersenyum`,
      ()=>{
        const canAfford = state.money >= tier.deal1;
        showChoices([
          { label: `âœ… Deal â€” ${fmt(tier.deal1)}`, action: ()=>step_deal(tier.deal1, 'mid'), cls: canAfford?'':'danger' },
          { label: `ðŸ’¬ Tawar Lagi`, action: step4 },
          { label: `ðŸš¶ Tidak Jadi`, cls:'danger', action: step_walkaway },
        ]);
      }
    );
  }

  // STEP 4: Hard negotiation
  function step4(){
    typeText(
      `Waaah... Bapak/Ibu Walikota ini... *tarik napas panjang*\n\nHmm, tidak apa-apa. Saya paham kondisi keuangan kota.\n*menghapus lebih banyak angka dengan muka datar*\n\nIni penawaran TERAKHIR saya, ya.\nSaya sudah potong habis semua margin saya.\n\nSaya rugi kalau begini... *tapi tetap senyum* ðŸ˜Š\n\nFinal price: ${fmt(tier.deal2)}`,
      `* Wiwi tidak pernah rugi. Tidak pernah.`,
      ()=>{
        const canAfford = state.money >= tier.deal2;
        showChoices([
          { label: `âœ… Deal Keras â€” ${fmt(tier.deal2)}`, action: ()=>step_deal(tier.deal2, 'hard'), cls: canAfford?'':'danger' },
          { label: `ðŸš¶ Tidak Jadi`, cls:'danger', action: step_walkaway },
        ]);
      }
    );
  }

  function step_deal(price, mode){
    if (state.money < price){
      typeText(
        `*Wiwi mengangkat alis*\n\nUang Anda... kurang, Walikota.\n*tersenyum simpul*\n\nTidak apa-apa. Kapan-kapan saja kalau sudah ada uangnya.\nSaya tidak kemana-mana kok. ðŸ˜Š`,
        `* Harga bisa lebih tinggi saat Anda kembali`,
        ()=>{ showChoices([{ label:'âœ– Tutup', cls:'danger', action: close }]); }
      );
      return;
    }
    const msgs = {
      full: `Terima kasih, Walikota! Transaksi selesai! ðŸŽ‰\n*bersalaman dengan erat*\n\nAnda tidak akan menyesal membeli dari saya!\nTanah ini sudah resmi milik kota Nusabox. ðŸ˜Š`,
      mid:  `Baik, deal! *menandatangani dokumen*\n\nSenang berbisnis dengan Anda, Walikota.\nJangan lupa, kalau butuh tanah lagi, hubungi saya! ðŸ˜Š`,
      hard: `*menghela napas dramatis*\n\nOke, deal... Demi hubungan baik kita.\nTapi saya catat ini ya, Walikota. *mengangguk pelan*\n\nKota Anda sudah lebih besar sekarang! ðŸ˜Š`,
    };
    typeText(msgs[mode], '', ()=>{
      showChoices([{ label:'ðŸŽ‰ Selesai!', action: ()=>{ close(); doExpandLand(tier.toSize, price); }}]);
    });
  }

  function step_walkaway(){
    typeText(
      `*Wiwi mengangguk sopan*\n\nTidak apa-apa, Walikota. Saya mengerti.\n\nPintu saya selalu terbuka untuk Anda. ðŸ˜Š\n\n...Meskipun harganya mungkin sedikit berbeda\nlain kali kita bertemu. *senyum tipis*`,
      '',
      ()=>{ showChoices([{ label:'ðŸš¶ Pergi', cls:'danger', action: close }]); }
    );
  }

  step1();
}

function startGame(sandbox, loaded=false){
  uiRoot.innerHTML = '';
  if (!loaded){
    state.money = sandbox ? 9999999 : 320000;
    state.sandbox = sandbox;
    state.population = 0;
    state.day = 1;
    state.month = 1;
    state.year = 2024;
    state.missionLevel = 1;
    state.freeMode = false;
    state._missionChecked = false;
    state._missionShowing = false;
    state.landSize = sandbox ? 40 : 20;
    state._landBorderMesh = null;
    state._wiwiIntroduced = false;
  }
  state.running = true;
  state._worldTrees = {};
  state.deers = [];
  state._beachTrees = [];
  state.ships = [];
  _forestCenter = null;  // Reset forest center for new map

  // Apply map-specific biome BEFORE terrain generation
  applyMapBiome();

  // Initialize citizen life simulation after loading buildings
  setTimeout(() => CitizenSim.generate(), 500);
  // Spawn default trees on empty land tiles (slight delay for grid to settle)
  setTimeout(() => {
    spawnWorldTrees();
    setTimeout(spawnDesertZone, 50);
    setTimeout(() => {
      if (_beachGlbReady) spawnBeachZone();
      // Spawn ships after beach zone is ready
      setTimeout(() => { if (_shipGlbLoaded >= SHIP_MODELS.length) spawnShips(); }, 200);
    }, 100);
    // Spawn deer near forest after trees settle
    setTimeout(() => {
      if (_deerReady) spawnDeer();
      else setTimeout(() => spawnDeer(), 2000);
      setTimeout(() => { if (state.running) spawnRegistryAnimals(); }, 1200);
    }, 800);
  }, 300);

  // Switch to gameplay music
  Audio.playGameplayMusic();
  
  buildHUD();
  renderConstructionMenu();
  renderTopBar();
  renderInfoPanel();
  renderMinimap();
  renderMissionPanel();
  updateGroundAndGrid();
  notify('Welcome, Mayor!', 'Build roads first, then zone residential to grow population.', 'success');
  // Add welcome email on new game
  if(!loaded && !sandbox){
    state.phone.emails = [{
      id: 'welcome_1', from: 'The President', subject: 'Selamat Datang, Walikota!',
      body: 'Saya harap kamu bisa membangun kota ini lebih baik dari saya. Mulailah dengan membangun jalan dan rumah untuk warga. Semoga berhasil!',
      read: false, day: 1,
    }];
    state.phone.socialMedia = [
      { author:'WargaBaru', content:'Walikota baru sudah datang! Semoga kota kita jadi lebih baik ðŸ™', sentiment:'positive' },
      { author:'PejuangKota', content:'Akhirnya ada yang mau urus kota kumuh ini ðŸ˜¤', sentiment:'neutral' },
    ];
    // Add calendar event
    state.calendarEvents.push({ day: 15, month: 1, title: 'Festival Pembukaan Kota', type: 'side_mission' });
  }
  // Show level 1 briefing for new story game
  if (!sandbox && !loaded){
    setTimeout(()=>showLevelBriefing(1,()=>{}), 800);
  }
}

function buildHUD(){
  uiRoot.innerHTML = `
    <div id="top-bar"></div>
    <div id="construction-menu"></div>
    <div id="info-panel"></div>
    <div id="notification-center"></div>
    <div id="mini-map">
      <canvas id="minimap-canvas" width="220" height="180"></canvas>
      <div class="modes">
        <button data-mode="normal" class="active">Normal</button>
        <button data-mode="traffic">Traffic</button>
        <button data-mode="pollution">Pollution</button>
        <button data-mode="power">Power</button>
        <button data-mode="happiness">ðŸ˜€</button>
      </div>
    </div>
    <button id="president-advisor-btn" title="Tanya Presiden" style="position:absolute;bottom:215px;right:12px;z-index:35;width:54px;height:54px;border-radius:50%;border:3px solid #00ffff;background:rgba(8,4,24,.92);cursor:pointer;padding:0;overflow:hidden;box-shadow:0 0 14px rgba(0,255,255,.35),2px 2px 0 #000;transition:box-shadow .15s,border-color .15s;">
      <img src="./img/assets/char/char.png" style="width:100%;height:100%;object-fit:cover;object-position:center top;image-rendering:pixelated;" draggable="false"/>
    </button>
    <button id="phone-btn" title="Phone" style="position:absolute;bottom:280px;right:12px;z-index:35;width:44px;height:44px;border-radius:0;border:3px solid var(--gold);background:rgba(8,4,24,.92);cursor:pointer;padding:0;font-size:18px;box-shadow:0 0 10px rgba(255,204,0,.25),3px 3px 0 #000;transition:box-shadow .12s,border-color .12s;">ðŸ“±</button>
    <div id="cursor-info"></div>
    <div id="mission-panel" style="position:absolute;bottom:20px;left:20px;z-index:30;background:rgba(8,4,24,0.92);border:2px solid #4433aa;border-top:3px solid #00ffff;padding:10px 14px;min-width:220px;max-width:280px;font-family:'Press Start 2P',monospace;box-shadow:4px 4px 0 #000,0 0 20px rgba(0,255,255,.1);"></div>
    <div id="cheat-box">
      <span id="cheat-label">ðŸ’¬</span>
      <input id="cheat-input" type="text" placeholder="Enter cheat code..." autocomplete="off" spellcheck="false"/>
      <span id="cheat-status"></span>
    </div>
  `;
  document.querySelectorAll('#mini-map .modes button').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('#mini-map .modes button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      state.minimapMode = b.dataset.mode;
    };
  });

  // Wire president advisor button via addEventListener (avoids global scope issues)
  const presBtn = document.getElementById('president-advisor-btn');
  if(presBtn){
    presBtn.addEventListener('click', ()=>showPresidentAdvisor());
    presBtn.addEventListener('mouseover', ()=>{ presBtn.style.boxShadow='0 0 24px rgba(0,255,255,.7),2px 2px 0 #000'; presBtn.style.borderColor='#88ffff'; });
    presBtn.addEventListener('mouseout',  ()=>{ presBtn.style.boxShadow='0 0 14px rgba(0,255,255,.35),2px 2px 0 #000'; presBtn.style.borderColor='#00ffff'; });
  }

  // Wire phone button
  const phoneBtn = document.getElementById('phone-btn');
  if(phoneBtn){
    phoneBtn.addEventListener('click', ()=>showPhoneUI());
    phoneBtn.addEventListener('mouseover', ()=>{ phoneBtn.style.boxShadow='0 0 18px rgba(255,204,0,.5),3px 3px 0 #000'; phoneBtn.style.borderColor='#ffee00'; });
    phoneBtn.addEventListener('mouseout',  ()=>{ phoneBtn.style.boxShadow='0 0 10px rgba(255,204,0,.25),3px 3px 0 #000'; phoneBtn.style.borderColor='var(--gold)'; });
  }

  // Cheat box
  const cheatInput = document.getElementById('cheat-input');
  const cheatStatus = document.getElementById('cheat-status');

  const CHEATS = {
    'ari ganteng': () => {
      state.cheatUnlockAll = true;
      renderConstructionMenu();
      cheatFeedback('âœ… All buildings unlocked!', 'success');
      Audio.playLevelUp();
    },
    'aba fajar': () => {
      const count = state.constructions.length;
      // Force-complete all constructions instantly
      while (state.constructions.length > 0){
        const c = state.constructions[0];
        c.progress = c.duration; // jump to 100%
        // Remove scaffold
        if (c.scaffMesh) scene.remove(c.scaffMesh);
        // Restore mesh to full scale
        if (c.mesh){
          c.mesh.scale.y = 1;
          c.mesh.position.y = c.scaffY || 0;
        }
        // Register building & grid
        const size = getSize(c.key);
        const bEntry = { x: c.gx, z: c.gz, type: c.key, mesh: c.mesh };
        state.buildings.push(bEntry);
        addBuildingNightLight(bEntry);
        for (let dx=0; dx<size; dx++){
          for (let dz=0; dz<size; dz++){
            const nx = c.gx+dx, nz = c.gz+dz;
            if (inBounds(nx,nz)) state.grid[nx][nz] = {
              type: c.key, mesh: (dx===0&&dz===0) ? c.mesh : null,
              rotation: c.rotation, origin: { gx:c.gx, gz:c.gz }
            };
          }
        }
        if (c.key === 'road') updateRoadOrientations(c.gx, c.gz);
        state.constructions.splice(0, 1);
      }
      recalcStats();
      cheatFeedback(`âš¡ ${count} building${count!==1?'s':''} instantly built!`, 'success');
      Audio.playLevelUp();
    },
    'panggil ufo': () => {
    if (state.ufo){ cheatFeedback('ðŸ‘½ UFO sudah ada di kota!', 'warn'); return; }
    spawnUFO(120); // durasi 2 menit biar cepat dites
    cheatFeedback('ðŸ‘½ UFO dipanggil buat testing!', 'success');
    Audio.playNotify('warn');
  },
  'usir ufo': () => {
    if (!state.ufo){ cheatFeedback('âœ… Tidak ada UFO saat ini', 'success'); return; }
    despawnUFO();
    cheatFeedback('ðŸ‘½ UFO pergi diusir!', 'success');
  },
    'bro am': () => {
      const targets = state.buildings.filter(b => {
        const size = getSize(b.type);
        return size === 2 || size === 4;
      });
      if (targets.length === 0){
        cheatFeedback('âš ï¸ No 2x2 or 4x4 buildings found!', 'error');
        return;
      }
      // Stagger destructions for dramatic effect
      targets.forEach((b, i) => {
        setTimeout(() => {
          // Building may have been already removed by a prior iteration
          const cell = state.grid[b.x]?.[b.z];
          if (!cell || !cell.type) return;
          if (b.mesh) spawnDestruction(b.mesh);
          // Clean up night lights
          if(b.nightLights){ for(const {light} of b.nightLights) scene.remove(light); b.nightLights=null; }
          // Clear grid & buildings without triggering bulldoze audio each time
          const size = getSize(b.type);
          state.buildings = state.buildings.filter(bl => !(bl.x===b.x && bl.z===b.z));
          for (let dx=0; dx<size; dx++){
            for (let dz=0; dz<size; dz++){
              const nx = b.x+dx, nz = b.z+dz;
              if (inBounds(nx,nz)) state.grid[nx][nz] = { type:null, mesh:null, rotation:0 };
            }
          }
          recalcStats();
        }, i * 200); // 200ms stagger between each building
      });
      Audio.playBulldoze();
      cheatFeedback(`ðŸ’¥ ${targets.length} building${targets.length!==1?'s':''} destroyed!`, 'success');
    },
    'tambah uang': () => {
      state.money += 999999;
      renderTopBar();
      cheatFeedback('ðŸ’° +Rp999.999 ditambahkan!', 'success');
      Audio.playNotify('success');
    },
    'kaya raya': () => {
      state.money += 999999999;
      renderTopBar();
      cheatFeedback('ðŸ¤‘ +Rp999.999.999 â€” sultan mode!', 'success');
      Audio.playLevelUp();
    },
    'perbesar peta': () => {
      const next = LAND_TIERS.find(t => t.toSize > state.landSize);
      if (!next){
        cheatFeedback('ðŸ”ï¸ Peta sudah maksimal (100Ã—100)!', 'error');
        return;
      }
      state.landSize = next.toSize;
      updateGroundAndGrid();
      renderTopBar();
      renderMinimap();
      cheatFeedback(`ðŸ—ºï¸ Peta diperbesar ke ${next.toSize}Ã—${next.toSize} petak!`, 'success');
      Audio.playLevelUp();
    },
    'peta maksimal': () => {
      state.landSize = 100;
      updateGroundAndGrid();
      renderTopBar();
      renderMinimap();
      cheatFeedback('ðŸŒ Peta langsung jadi 100Ã—100 petak!', 'success');
      Audio.playLevelUp();
    },
    'naik level': () => {
      state.level = Math.min(4, state.level + 1);
      state.cheatUnlockAll = true;
      renderConstructionMenu();
      cheatFeedback('â¬†ï¸ City level increased!', 'success');
      Audio.playLevelUp();
    },
    'naik misi': () => {
      if (state.sandbox){ cheatFeedback('âš ï¸ Tidak ada misi di sandbox!','error'); return; }
      if (state.freeMode){ cheatFeedback('âœ… Sudah di Free Mode!','success'); return; }
      if (state._missionShowing){ cheatFeedback('â³ Cutscene sedang berjalan...','warn'); return; }
      const cur = state.missionLevel;
      if (cur >= 30){
        state.freeMode = true;
        state._missionChecked = true;
        renderMissionPanel();
        notify('ðŸ† Mode Bebas Aktif!','Semua 30 level selesai!','success');
        cheatFeedback('ðŸ† Free Mode diaktifkan!', 'success');
        Audio.playLevelUp();
      } else {
        state.missionLevel = cur + 1;
        state._missionChecked = false;
        renderMissionPanel();
        showLevelBriefing(state.missionLevel, ()=>{});
        cheatFeedback(`â¬†ï¸ Misi naik ke Level ${state.missionLevel}!`, 'success');
        Audio.playLevelUp();
      }
    },
    'spawn kumuh': () => {
      const prevMissionLevel = state.missionLevel;
      state.missionLevel = 10; // temporarily unlock slum spawning
      spawnSlum();
      state.missionLevel = prevMissionLevel;
      cheatFeedback('ðŸšï¸ Rumah kumuh dimunculkan!', 'success');
    },
    'hapus kumuh': () => {
      if (!state.slums || state.slums.length === 0){
        cheatFeedback('âœ… Tidak ada rumah kumuh!', 'success'); return;
      }
      const count = state.slums.length;
      for (const s of state.slums){
        scene.remove(s.mesh);
        if (inBounds(s.gx, s.gz)) state.grid[s.gx][s.gz] = { type:null, mesh:null, rotation:0 };
      }
      state.slums = [];
      recalcStats();
      renderMinimap();
      cheatFeedback(`ðŸ§¹ ${count} rumah kumuh dihapus!`, 'success');
    },
    'tebang pohon': () => {
      respawnWorldTrees === undefined
        ? cheatFeedback('âš ï¸ Sistem pohon belum siap', 'error')
        : (() => {
            if (!state._worldTrees){ cheatFeedback('âœ… Tidak ada pohon!','success'); return; }
            const count = Object.keys(state._worldTrees).length;
            for (const m of Object.values(state._worldTrees)){
              scene.remove(m);
              m.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
            }
            state._worldTrees = {};
            cheatFeedback(`ðŸŒ² ${count} pohon ditebang!`, 'success');
          })();
    },
    'tanam pohon': () => {
      spawnWorldTrees();
      const count = Object.keys(state._worldTrees || {}).length;
      cheatFeedback(`ðŸŒ³ Pohon ditanam! (total: ${count})`, 'success');
    },
    'spawn rusa': () => {
      if (!_deerReady){
        cheatFeedback('â³ Model rusa belum selesai dimuat...', 'warn'); return;
      }
      // Spawn deer at random empty tiles inside land bounds
      const { min, max } = getLandBounds();
      const mid = Math.floor((min + max) / 2);
      const half = Math.floor((max - min) / 4);
      let spawned = 0;
      for (let attempt = 0; attempt < 30 && spawned < 3; attempt++){
        const gx = mid + randInt(-half, half);
        const gz = mid + randInt(-half, half);
        if (!inBounds(gx, gz)) continue;
        if (state.grid[gx][gz].type !== null) continue;
        const result = makeDeerMesh();
        if (!result) break;
        const { clone, mixer, walkAction, eatAction } = result;
        const wp = gridToWorld(gx, gz);
        clone.position.set(wp.x, TERRAIN.getHeightAt(wp.x, wp.z), wp.z);
        scene.add(clone);
        if (walkAction) walkAction.play();
        state.deers.push({
          mesh: clone, mixer, walkAction, eatAction,
          state: 'walk', stateTimer: rand(3, 8),
          wx: wp.x, wz: wp.z,
          dirAngle: rand(0, Math.PI*2), speed: rand(1.8, 3.2),
        });
        spawned++;
      }
      cheatFeedback(`ðŸ¦Œ ${spawned} rusa muncul di kota!`, 'success');
    },
    'main quiz': () => {
      const mg = REGISTRY_MINIGAMES.find(m => m.type === 'quiz' && m._enabled !== false);
      if (mg) { cheatFeedback('🎮 Launching quiz...', 'success'); setTimeout(() => _launchRegistryMinigame(mg.id), 300); }
      else cheatFeedback('❌ No quiz minigame found', 'error');
    },
    'main tap': () => {
      const mg = REGISTRY_MINIGAMES.find(m => m.type === 'tap' && m._enabled !== false);
      if (mg) { cheatFeedback('🎮 Launching tap game...', 'success'); setTimeout(() => _launchRegistryMinigame(mg.id), 300); }
      else cheatFeedback('❌ No tap minigame found', 'error');
    },
    'bahagia': () => {
      state.happiness = 100;
      renderTopBar();
      cheatFeedback('ðŸ˜„ Happiness maxed!', 'success');
      Audio.playNotify('success');
    },
    // ---- Time cheats ----
    'waktu pagi': () => {
      DN.elapsed = DN.CYCLE * 0.083; // ~08:00
      renderTopBar();
      cheatFeedback('â˜€ï¸ Waktu -> Pagi (08:00)', 'success');
    },
    'waktu siang': () => {
      DN.elapsed = DN.CYCLE * 0.167; // ~10:00 full midday
      renderTopBar();
      cheatFeedback('â˜€ï¸ Waktu -> Siang (10:00)', 'success');
    },
    'waktu sore': () => {
      DN.elapsed = DN.CYCLE * 0.640; // ~17:30 sunset
      renderTopBar();
      cheatFeedback('ðŸŒ… Waktu -> Sore (17:30)', 'success');
    },
    'waktu malam': () => {
      DN.elapsed = DN.CYCLE * 0.720; // ~21:00 deep night
      renderTopBar();
      cheatFeedback('ðŸŒ™ Waktu -> Malam (21:00)', 'success');
    },
    'waktu tengah malam': () => {
      DN.elapsed = DN.CYCLE * 0.833; // 00:00 midnight
      renderTopBar();
      cheatFeedback('ðŸŒ™ Waktu -> Tengah Malam (00:00)', 'success');
    },
    // ---- Weather cheats ----
    'hujan': () => {
      DN.weather = 'rain';
      DN.rainRemaining = rand(300, 900);
      if(DN.rainMesh) DN.rainMesh.visible = true;
      Audio.tickSfxAmbience();
      renderTopBar();
      notify('Hujan!', 'Cheat: hujan dipaksakan.', 'warn');
      cheatFeedback('ðŸŒ§ï¸ Cuaca -> Hujan', 'success');
    },
    'cerah': () => {
      DN.weather = 'clear';
      DN.rainRemaining = 0;
      DN.nextWeather = rand(120, 600);
      if(DN.rainMesh) DN.rainMesh.visible = false;
      Audio.tickSfxAmbience();
      renderTopBar();
      cheatFeedback('â˜€ï¸ Cuaca -> Cerah', 'success');
    },
    // ---- Combined shortcut ----
    'waktu cepat': () => {
      // Speed through a full day in 10 real seconds -> advance elapsed by 1/10 of cycle
      DN.elapsed = (DN.elapsed + DN.CYCLE * 0.1) % DN.CYCLE;
      renderTopBar();
      cheatFeedback('â© Lompat waktu +2.5 jam!', 'success');
    },
    // ---- Personal system cheats ----
    'buka semua pulau': () => {
      state.unlockedMaps = ['sumatra','jawa','kalimantan','sulawesi','papua'];
      cheatFeedback('ðŸ—ºï¸ Semua pulau dibuka!', 'success');
      Audio.playLevelUp();
    },
    'bersihkan korupsi': () => {
      state.personal.corruption = 0;
      cheatFeedback('âœ¨ Korupsi dihapus! Bersih 0%', 'success');
    },
    'uang pribadi': () => {
      state.personal.personalMoney += 500000;
      cheatFeedback('ðŸ’° +500.000 uang pribadi!', 'success');
    },
    'buka hp': () => {
      showPhoneUI();
      cheatFeedback('ðŸ“± Phone dibuka!', 'success');
    },
  };

  function cheatFeedback(msg, type){
    cheatStatus.textContent = msg;
    cheatStatus.className = type;
    setTimeout(()=>{ cheatStatus.textContent = ''; cheatStatus.className = ''; }, 3000);
  }

  cheatInput.addEventListener('keydown', e => {
    // Prevent camera controls from triggering while typing
    e.stopPropagation();
  });
  cheatInput.addEventListener('keyup', e => {
    e.stopPropagation();
    if (e.key === 'Enter'){
      const code = cheatInput.value.trim().toLowerCase();
      if (CHEATS[code]){
        CHEATS[code]();
      } else {
        const egg = getCheatEasterEgg(code);
        if (egg) {
          _executeEasterEgg(egg);
        } else {
          cheatFeedback('❌ Unknown cheat code', 'error');
          Audio.playError();
        }
      }
      cheatInput.value = '';
    }
  });

  // Konami & sequence easter eggs
  let _seqBuffer = [];
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === cheatInput) return;
    _seqBuffer.push(e.key);
    if (_seqBuffer.length > 15) _seqBuffer.shift();
    for (const seq of SEQUENCE_EASTER_EGGS) {
      if (!seq.trigger?.keys?.length) continue;
      const keys = seq.trigger.keys;
      if (_seqBuffer.length >= keys.length) {
        const tail = _seqBuffer.slice(-keys.length);
        if (tail.every((k, i) => k === keys[i])) {
          _seqBuffer = [];
          _executeEasterEgg(seq);
          break;
        }
      }
    }
  });
}

function renderTopBar(){
  const bar = document.getElementById('top-bar');
  if (!bar) return;
  const money = state.money;
  const moneyClass = money < 0 ? 'bad' : (money < 5000 ? 'warn' : 'good');
  const happyClass = state.happiness < 40 ? 'bad' : state.happiness < 65 ? 'warn' : 'good';
  const trafficClass = state.traffic > 60 ? 'bad' : state.traffic > 30 ? 'warn' : 'good';
  const net = state.income - state.expense;
  bar.innerHTML = `
    <div class="stat ${moneyClass}"><span class="icon">${pxImg('ic_money',16)}</span><div><div class="label">Treasury</div><div class="value">$${money.toLocaleString()}</div></div></div>
    <div class="stat"><span class="icon">${pxImg('ic_net',16)}</span><div><div class="label">Net /day</div><div class="value" style="color:${net>=0?'var(--good)':'var(--bad)'}">${net>=0?'+':''}$${net}</div></div></div>
    <div class="stat"><span class="icon">${pxImg('ic_pop',16)}</span><div><div class="label">Population</div><div class="value">${state.population.toLocaleString()}</div></div></div>
    <div class="stat ${happyClass}"><span class="icon">${pxImg('ic_happy',16)}</span><div><div class="label">Happiness</div><div class="value">${state.happiness}%</div></div></div>
    <div class="stat ${trafficClass}"><span class="icon">${pxImg('ic_traffic',16)}</span><div><div class="label">Traffic</div><div class="value">${Math.round(state.traffic)}%</div></div></div>
    <div class="stat"><span class="icon">${pxImg('ic_level',16)}</span><div><div class="label">Level</div><div class="value">${['','Village','Town','City','Metropolis'][state.level]}</div></div></div>
    <div class="stat"><span class="icon">${pxImg('ic_day',16)}</span><div><div class="label">Tanggal</div><div class="value">${state.day}/${state.month}/${state.year}</div></div></div>
    <div class="stat"><span class="icon">${DN.isNight?pxImg('ic_moon',16):pxImg('ic_sunny',16)}</span><div><div class="label">Time</div><div class="value">${DN.clockStr}</div></div></div>
    <div class="stat"><span class="icon">${DN.weather==='rain'?pxImg('ic_rainy',16):pxImg('ic_clock',16)}</span><div><div class="label">Weather</div><div class="value">${DN.weather==='rain'?'Rain':'Clear'}</div></div></div>
    <div class="spacer"></div>
    <div class="speed-controls">
      <button class="${state.speed===0?'active':''}" data-s="0">${pxImg('ic_pause',14)}</button>
      <button class="${state.speed===1?'active':''}" data-s="1">${pxImg('ic_play',14)}</button>
      <button class="${state.speed===2?'active':''}" data-s="2">${pxImg('ic_fast',14)}</button>
      <button class="${state.speed===3?'active':''}" data-s="3">${pxImg('ic_faster',14)}</button>
    </div>
    <button class="menu-btn" id="btn-help">${pxImg('ic_help',14)} Help</button>
    <button class="menu-btn" id="btn-dashboard">${pxImg('ic_dash',14)} Stats</button>
    <button class="menu-btn" id="btn-save">${pxImg('ic_save',14)} Save</button>
    <button class="menu-btn" id="btn-music">${pxImg('ic_music',14)} Music</button>
    <button class="menu-btn" id="btn-menu">${pxImg('ic_menu',14)} Menu</button>
  `;
  bar.querySelectorAll('.speed-controls button').forEach(b=>{
    b.onclick = ()=>setSpeed(parseInt(b.dataset.s));
  });
  document.getElementById('btn-help').onclick = openHelp;
  document.getElementById('btn-dashboard').onclick = openDashboard;
  document.getElementById('btn-save').onclick = ()=>{ saveGame(); notify('Saved','City saved to browser storage.','success'); };
  let _musicOn = true;
  document.getElementById('btn-music').onclick = ()=>{
    _musicOn = !_musicOn;
    Audio.setMusicVol(_musicOn ? 0.35 : 0);
    document.getElementById('btn-music').innerHTML = `${pxImg('ic_music',14)} ${_musicOn ? 'Music' : 'Mute'}`;
  };
  document.getElementById('btn-menu').onclick = ()=>{ if (confirm('Return to main menu? Unsaved changes will be lost.')) location.reload(); };
}

let currentCategory = 'road';
function renderConstructionMenu(){
  const menu = document.getElementById('construction-menu');
  if (!menu) return;
  const cats = CATEGORIES.map(c=>`<button data-cat="${c.id}" class="${c.id===currentCategory?'active':''}"><span>${c.icon}</span> ${c.name}</button>`).join('');
  const cat = CATEGORIES.find(c=>c.id===currentCategory);
  const items = cat.items.map(k=>{
    const b = BUILDINGS[k];
    const locked = !state.cheatUnlockAll && (b.unlock==='metro' && state.level<3 || b.unlock==='big' && state.level<3);
    return `<div class="item ${state.selected===k?'active':''} ${locked?'locked':''}" data-key="${k}">
      <div class="icon">${b.icon}</div>
      <div class="name">${b.name}</div>
      <div class="cost">${b.cost?'$'+b.cost:''}${b.size>1?` Â· ${b.size}x${b.size}`:''}${locked?' ðŸ”’':''}</div>
    </div>`;
  }).join('');
  menu.innerHTML = `<div class="categories">${cats}</div><div class="items">${items}</div>`;
  menu.querySelectorAll('.categories button').forEach(b=>{
    b.onclick = ()=>{ currentCategory = b.dataset.cat; renderConstructionMenu(); };
  });
  menu.querySelectorAll('.item').forEach(el=>{
    el.onclick = ()=>{
      if (el.classList.contains('locked')) return;
      state.selected = (state.selected===el.dataset.key) ? null : el.dataset.key;
      state.placeRotation = 0; // reset rotation on new tool
      state.pending = null;
      clearGhost();
      renderConstructionMenu();
    };
  });
}

function renderInfoPanel(){
  const p = document.getElementById('info-panel');
  if (!p) return;
  if (!state.selectedBuilding){
    p.innerHTML = `
      <div class="title">ðŸ™ï¸ City Overview</div>
      <div class="subtitle">Mayor's Dashboard</div>
      <div class="row"><span>âš¡ Power</span><span>${state.power.gen} / ${state.power.demand}</span></div>
      <div class="row"><span>ðŸ’§ Water</span><span>${state.water.gen} / ${state.water.demand}</span></div>
      <div class="row"><span>ðŸ  Homes</span><span>${state.homes}</span></div>
      <div class="row"><span>ðŸ’¼ Jobs</span><span>${state.jobs.offered}</span></div>
      <div class="row"><span>ðŸŒ«ï¸ Pollution</span><span>${state.pollution}</span></div>
      <div class="row"><span>ðŸ“ˆ Income</span><span style="color:var(--good)">+$${state.income}</span></div>
      <div class="row"><span>ðŸ“‰ Expense</span><span style="color:var(--bad)">-$${state.expense}</span></div>
    `;
    return;
  }
  const b = state.selectedBuilding;
  const def = BUILDINGS[b.type];
  p.innerHTML = `
    <div class="title">${def.icon} ${def.name}</div>
    <div class="subtitle">Tile (${b.x}, ${b.z})</div>
    ${def.homes?`<div class="row"><span>ðŸ  Homes</span><span>${def.homes}</span></div>`:''}
    ${def.jobs?`<div class="row"><span>ðŸ’¼ Jobs</span><span>${def.jobs}</span></div>`:''}
    ${def.power?`<div class="row"><span>âš¡ Power use</span><span>${def.power}</span></div>`:''}
    ${def.powerGen?`<div class="row"><span>âš¡ Power gen</span><span>${def.powerGen}</span></div>`:''}
    ${def.water?`<div class="row"><span>ðŸ’§ Water use</span><span>${def.water}</span></div>`:''}
    ${def.waterGen?`<div class="row"><span>ðŸ’§ Water gen</span><span>${def.waterGen}</span></div>`:''}
    ${def.pollution?`<div class="row"><span>ðŸŒ«ï¸ Pollution</span><span>${def.pollution}</span></div>`:''}
    ${def.tax?`<div class="row"><span>ðŸ’° Tax /day</span><span>+$${def.tax}</span></div>`:''}
    ${def.happy?`<div class="row"><span>ðŸ˜€ Happiness</span><span>+${def.happy}</span></div>`:''}
    <div class="actions">
      <button onclick="window.__bulldozeSelected()">ðŸ’¥ Demolish</button>
      <button onclick="window.__deselectBuilding()">Close</button>
    </div>
  `;
}
window.__bulldozeSelected = ()=>{
  if (!state.selectedBuilding) return;
  bulldoze(state.selectedBuilding.x, state.selectedBuilding.z);
  state.selectedBuilding = null;
  renderInfoPanel();
};
window.__deselectBuilding = ()=>{ state.selectedBuilding = null; renderInfoPanel(); };

// Expose interactive functions to window so inline onclick HTML attributes can call them
window.showPresidentAdvisor = ()=> showPresidentAdvisor();
window.showWiwiNegotiationFull = ()=> showWiwiNegotiationFull();
window.showLevelBriefingBtn = ()=> showLevelBriefing(state.missionLevel, ()=>{});
window.renderMissionPanelBtn = (min)=>{ const p=document.getElementById('mission-panel'); if(p) p.dataset.minimized=min; renderMissionPanel(); };

// Notifications
function notify(title, body, kind='info'){
  const id = Math.random().toString(36).slice(2,8);
  state.notifications.unshift({ id, title, body, kind, time: state.day });
  if (state.notifications.length > 8) state.notifications.pop();
  renderNotifications();
  Audio.playNotify(kind);
  setTimeout(()=>{
    state.notifications = state.notifications.filter(n=>n.id!==id);
    renderNotifications();
  }, 8000);
}
function renderNotifications(){
  const nc = document.getElementById('notification-center');
  if (!nc) return;
  nc.innerHTML = state.notifications.map(n=>`
    <div class="notification ${n.kind}" data-id="${n.id}">
      <div class="head">${n.title}<span class="close">x</span></div>
      <div class="body">${n.body}</div>
    </div>
  `).join('');
  nc.querySelectorAll('.notification').forEach(el=>{
    el.onclick = ()=>{
      const id = el.dataset.id;
      state.notifications = state.notifications.filter(n=>n.id!==id);
      renderNotifications();
    };
  });
}

// Minimap
function renderMinimap(){
  const c = document.getElementById('minimap-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.fillStyle = '#0b1320'; ctx.fillRect(0,0,w,h);
  if (_forestCenter) {
    const fmx = (_forestCenter.x + HALF) / (GRID*TILE) * w;
    const fmz = (_forestCenter.z + HALF) / (GRID*TILE) * h;
    const fmr = (20 / (GRID*TILE)) * Math.min(w, h);
    const fGrad = ctx.createRadialGradient(fmx, fmz, 0, fmx, fmz, fmr);
    fGrad.addColorStop(0, 'rgba(34,139,34,0.55)');
    fGrad.addColorStop(1, 'rgba(34,139,34,0)');
    ctx.fillStyle = fGrad;
    ctx.beginPath(); ctx.arc(fmx, fmz, fmr, 0, Math.PI*2); ctx.fill();
  }
  if (state._desertZone) {
    const { cx, cz, radius } = state._desertZone;
    const dmx = (cx + HALF) / (GRID*TILE) * w;
    const dmz = (cz + HALF) / (GRID*TILE) * h;
    const dmr = (radius / (GRID*TILE)) * Math.min(w, h);
    const dGrad = ctx.createRadialGradient(dmx, dmz, 0, dmx, dmz, dmr);
    dGrad.addColorStop(0, 'rgba(210,180,100,0.6)');
    dGrad.addColorStop(1, 'rgba(210,180,100,0)');
    ctx.fillStyle = dGrad;
    ctx.beginPath(); ctx.arc(dmx, dmz, dmr, 0, Math.PI*2); ctx.fill();
  }
  const cellW = w / GRID;
  const cellH = h / GRID;
  const { min: lmin, max: lmax } = getLandBounds();
  for (let i=0;i<GRID;i++){
    for (let j=0;j<GRID;j++){
      // Locked land - draw hatching
      if (i < lmin || i >= lmax || j < lmin || j >= lmax){
        ctx.fillStyle = '#111a22';
        ctx.fillRect(i*cellW, j*cellH, cellW+0.5, cellH+0.5);
        if ((i+j)%3===0){ ctx.fillStyle='#1a2a38'; ctx.fillRect(i*cellW,j*cellH,cellW+0.5,cellH+0.5); }
        continue;
      }
      const cell = state.grid[i][j];
      let col = null;
      if (state.minimapMode==='normal'){
        if (cell.type === '__slum__' || cell.isSlum){
          col = '#8B2500'; // dark brown-red for slum
        } else if (cell.type){
          col = '#' + BUILDINGS[cell.type].color.toString(16).padStart(6,'0');
        }
      } else if (state.minimapMode==='traffic'){
        if (cell.type==='road') col = '#facc15';
      } else if (state.minimapMode==='pollution'){
        if (cell.type==='ind_factory' || cell.type==='power_coal') col = '#ef4444';
        else if (cell.type) col = '#374151';
      } else if (state.minimapMode==='power'){
        if (cell.type && BUILDINGS[cell.type].powerGen) col = '#facc15';
        else if (cell.type && BUILDINGS[cell.type].power) col = '#60a5fa';
      } else if (state.minimapMode==='happiness'){
        if (cell.type==='park'||cell.type==='school'||cell.type==='hospital') col = '#4ade80';
        else if (cell.type) col = '#475569';
      }
      if (col){
        ctx.fillStyle = col;
        ctx.fillRect(i*cellW, j*cellH, cellW+0.5, cellH+0.5);
      }
    }
  }
  // camera viewport indicator
  const cx = (camTarget.x + HALF)/(GRID*TILE) * w;
  const cz = (camTarget.z + HALF)/(GRID*TILE) * h;
  ctx.strokeStyle = '#4cc9f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx-12, cz-10, 24, 20);
  // land boundary on minimap
  if (state.landSize < GRID){
    const bx = lmin * cellW, bz = lmin * cellH;
    const bw = state.landSize * cellW, bh = state.landSize * cellH;
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3,3]);
    ctx.strokeRect(bx, bz, bw, bh);
    ctx.setLineDash([]);
  }
  const legends = [];
  if (_forestCenter) legends.push({ color: '#228B22', label: 'ðŸŒ² Hutan' });
  if (state._desertZone) legends.push({ color: '#D2A855', label: 'ðŸœï¸ Gurun' });
  if (state._beachZone)  legends.push({ color: '#40C8E0', label: 'ðŸ–ï¸ Pantai' });
  if (legends.length) {
    ctx.font = '7px monospace';
    legends.forEach((l, i) => {
      ctx.fillStyle = l.color;
      ctx.fillRect(4, h - 14 - i*11, 7, 7);
      ctx.fillStyle = '#eee';
      ctx.fillText(l.label, 14, h - 8 - i*11);
    });
  }
}

// Dashboard modal
function openDashboard(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>ðŸ“Š City Management Dashboard</h2>
      <div class="sub">Tier: ${['','Village','Town','City','Metropolis'][state.level]} â€¢ Day ${state.day}</div>
      <div class="grid">
        <div class="card"><div class="label">ðŸ‘¥ Population</div><div class="big">${state.population.toLocaleString()}</div><div class="delta">Capacity ${state.homes}</div></div>
        <div class="card"><div class="label">ðŸ’° Treasury</div><div class="big">$${state.money.toLocaleString()}</div><div class="delta">${state.income-state.expense>=0?'+':''}$${state.income-state.expense}/day</div></div>
        <div class="card"><div class="label">ðŸ˜€ Happiness</div><div class="big">${state.happiness}%</div><div class="bar"><div style="width:${state.happiness}%"></div></div></div>
        <div class="card"><div class="label">âš¡ Power</div><div class="big">${state.power.gen}/${state.power.demand}</div><div class="bar"><div style="width:${Math.min(100,state.power.demand?state.power.demand/Math.max(state.power.gen,1)*100:0)}%"></div></div></div>
        <div class="card"><div class="label">ðŸ’§ Water</div><div class="big">${state.water.gen}/${state.water.demand}</div><div class="bar"><div style="width:${Math.min(100,state.water.demand?state.water.demand/Math.max(state.water.gen,1)*100:0)}%"></div></div></div>
        <div class="card"><div class="label">ðŸ’¼ Jobs</div><div class="big">${state.jobs.offered}</div><div class="delta">Workers: ${state.population}</div></div>
        <div class="card"><div class="label">ðŸŒ«ï¸ Pollution</div><div class="big">${state.pollution}</div><div class="bar"><div style="width:${Math.min(100,state.pollution*2)}%;background:var(--bad)"></div></div></div>
        <div class="card"><div class="label">ðŸš— Traffic</div><div class="big">${Math.round(state.traffic)}%</div><div class="bar"><div style="width:${state.traffic}%;background:var(--warn)"></div></div></div>
        <div class="card"><div class="label">ðŸ—ï¸ Buildings</div><div class="big">${state.buildings.length}</div></div>
      </div>
      <div class="close-row"><button class="primary" id="close-modal">Close</button></div>
    </div>
  `;
  uiRoot.appendChild(overlay);
  overlay.querySelector('#close-modal').onclick = ()=>uiRoot.removeChild(overlay);
  overlay.onclick = (e)=>{ if (e.target===overlay) uiRoot.removeChild(overlay); };
}

function openHelp(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px">
      <h2>â“ Controls</h2>
      <div class="sub">Camera & gameplay</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:14px">
        <b>Rotate view</b><span><kbd>Q</kbd> / <kbd>E</kbd> &nbsp; <i>or</i> &nbsp; Right-mouse drag</span>
        <b>Tilt up/down</b><span><kbd>F</kbd> &nbsp; <i>or</i> &nbsp; Right-mouse drag vertical</span>
        <b>Zoom</b><span><kbd>Z</kbd> / <kbd>X</kbd> &nbsp; <i>or</i> &nbsp; Mouse wheel</span>
        <b>Pan</b><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / Arrow keys / Middle-mouse drag</span>
        <b>Build</b><span>Pick item -> 1st click previews (red) -> <kbd>R</kbd> to rotate -> 2nd click confirms</span>
        <b>Rotate object</b><span><kbd>R</kbd> &nbsp; -- rotate 90 deg (works in preview mode)</span>
        <b>Cancel preview</b><span>Right-click or <kbd>Esc</kbd></span>
        <b>Roads</b><span>Drag to paint (no preview)</span>
        <b>Bulldoze</b><span>Tools -> ðŸ’¥ &nbsp; <i>or</i> &nbsp; <kbd>B</kbd></span>
        <b>Pause / Speed</b><span><kbd>0</kbd>/<kbd>Space</kbd>, <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd></span>
        <b>Cancel tool</b><span><kbd>Esc</kbd></span>
      </div>
      <p style="color:var(--text-dim);font-size:12px;margin-top:14px">Tip: if your right mouse button doesn't work, just use <b>Q</b> and <b>E</b> to spin the camera.</p>
      <div class="close-row"><button class="primary" id="close-help">Got it</button></div>
    </div>
  `;
  uiRoot.appendChild(overlay);
  overlay.querySelector('#close-help').onclick = ()=>uiRoot.removeChild(overlay);
  overlay.onclick = (e)=>{ if (e.target===overlay) uiRoot.removeChild(overlay); };
}

// Cursor tip
function showCursorTip(x,y,text){
  const el = document.getElementById('cursor-info');
  if (!el) return;
  el.textContent = text;
  el.style.left = (x+14)+'px';
  el.style.top = (y+14)+'px';
  el.style.display = 'block';
}
function hideCursorTip(){
  const el = document.getElementById('cursor-info');
  if (el) el.style.display = 'none';
}

// -------------------- SAVE / LOAD --------------------
function saveGame(){
  const compact = {
    money: state.money, day: state.day, month: state.month, year: state.year,
    level: state.level,
    missionLevel: state.missionLevel, freeMode: state.freeMode,
    landSize: state.landSize, wiwiIntroduced: state._wiwiIntroduced,
    happiness: state.happiness, citizens: state.citizens.length,
    buildings: state.buildings.map(b=>({x:b.x,z:b.z,t:b.type})),
    // New fields
    mapId: state.mapId, mapName: state.mapName,
    unlockedMaps: state.unlockedMaps,
    personal: state.personal,
    relationships: state.relationships,
    phone: state.phone,
    activeSideMissions: state.activeSideMissions,
    completedSideMissions: state.completedSideMissions,
    calendarEvents: state.calendarEvents,
  };
  localStorage.setItem('city-empire-save', JSON.stringify(compact));
}
function loadGame(){
  const raw = localStorage.getItem('city-empire-save');
  if (!raw) return;
  const s = JSON.parse(raw);
  state.money = s.money; state.day = s.day; state.level = s.level||1;
  state.month = s.month || 1; state.year = s.year || 2024;
  state.missionLevel = s.missionLevel || 1;
  state.freeMode = s.freeMode || false;
  state.landSize = s.landSize || 20;
  state._wiwiIntroduced = s.wiwiIntroduced || false;
  state._missionChecked = false;
  // Restore new fields
  state.mapId = s.mapId || 'sumatra';
  state.mapName = s.mapName || 'Sumatra';
  state.unlockedMaps = s.unlockedMaps || ['sumatra'];
  if(s.personal) state.personal = s.personal;
  if(s.relationships) state.relationships = s.relationships;
  if(s.phone) state.phone = s.phone;
  if(s.activeSideMissions) state.activeSideMissions = s.activeSideMissions;
  if(s.completedSideMissions) state.completedSideMissions = s.completedSideMissions;
  if(s.calendarEvents) state.calendarEvents = s.calendarEvents;
  for (const b of s.buildings){
    placeBuilding(b.t, b.x, b.z);
    // refund cost since we're loading
    state.money += BUILDINGS[b.t].cost;
  }
  recalcStats();
  updateGroundAndGrid();
}

// -------------------- MAIN LOOP --------------------
let lastT = performance.now();
let uiTick = 0;
function loop(now){
  const dt = Math.min(0.1, (now - lastT)/1000);
  lastT = now;
  // camera WASD pan + QE rotate + RF pitch
  const speed = camDist * 0.6 * dt;
  if (keys['w']||keys['arrowup']) { camTarget.x -= Math.sin(camAngle)*speed; camTarget.z -= Math.cos(camAngle)*speed; updateCamera(); }
  if (keys['s']||keys['arrowdown']) { camTarget.x += Math.sin(camAngle)*speed; camTarget.z += Math.cos(camAngle)*speed; updateCamera(); }
  if (keys['a']||keys['arrowleft']) { camTarget.x -= Math.cos(camAngle)*speed; camTarget.z += Math.sin(camAngle)*speed; updateCamera(); }
  if (keys['d']||keys['arrowright']) { camTarget.x += Math.cos(camAngle)*speed; camTarget.z -= Math.sin(camAngle)*speed; updateCamera(); }
  if (keys['q']) { camAngle -= 1.5*dt; updateCamera(); }
  if (keys['e']) { camAngle += 1.5*dt; updateCamera(); }
  if (keys['r'] && !state.selected) { camPitch = clamp(camPitch + 1.0*dt, 0.2, Math.PI/2 - 0.1); updateCamera(); }
  if (keys['f']) { camPitch = clamp(camPitch - 1.0*dt, 0.2, Math.PI/2 - 0.1); updateCamera(); }
  if (keys['z']) { camDist = clamp(camDist - 30*dt, 15, 130); updateCamera(); }
  if (keys['x']) { camDist = clamp(camDist + 30*dt, 15, 130); updateCamera(); }
  camTarget.x = clamp(camTarget.x, -HALF, HALF);
  camTarget.z = clamp(camTarget.z, -HALF, HALF);

  if (state.running) gameTick(dt);
  updateRainParticles(dt);   // always update regardless of pause/speed
  updateConstructions(dt);
  updateDestructions(dt);
  updateWaterAnimation(dt);
  updateWaterMixers(dt);
  if (state.running) updateDeers(dt);
  if (state.running) updateRegistryAnimals(dt);
  if (state.running) updateShips(dt);
  updateBeachWaves(dt);

  uiTick += dt;
  if (uiTick > 0.25){
    uiTick = 0;
    if (state.running){
      renderTopBar();
      renderInfoPanel();
      renderMinimap();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', ()=>{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// -------------------- BOOT --------------------
renderMainMenu();
initRainParticles();
// pre-warm GLB cache
Object.keys(GLB_MODELS).forEach(k => loadGLBTemplate(k).catch(()=>{}));
requestAnimationFrame(loop);

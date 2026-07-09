/**
 * ============================================================
 * REGISTRY — Developer Extension System
 * ============================================================
 * Memuat semua JSON config dari config/registry/ dan
 * mengekspose API untuk dipakai game engine.
 *
 * Developer HANYA perlu edit JSON files di config/registry/:
 *   buildings.json    — tambah bangunan baru
 *   vehicles.json     — tambah kendaraan baru
 *   minigames.json    — tambah mini game
 *   sideMissions.json — tambah side mission
 *   buildingEvents.json — event saat masuk gedung
 *   easterEggs.json   — easter egg
 * ============================================================
 */

import BUILDING_REGISTRY   from '../../config/registry/buildings.json'     assert { type: 'json' };
import VEHICLE_REGISTRY    from '../../config/registry/vehicles.json'      assert { type: 'json' };
import MINIGAME_REGISTRY   from '../../config/registry/minigames.json'     assert { type: 'json' };
import SIDEMISSION_REGISTRY from '../../config/registry/sideMissions.json' assert { type: 'json' };
import BUILDINGEVENT_REGISTRY from '../../config/registry/buildingEvents.json' assert { type: 'json' };
import EASTEREGG_REGISTRY  from '../../config/registry/easterEggs.json'   assert { type: 'json' };
import ANIMAL_REGISTRY     from '../../config/registry/animals.json'      assert { type: 'json' };

// Filter hanya yang _enabled !== false (default: enabled)
const active = arr => arr.filter(x => !x._comment && !x._comment2 && !x._comment3
  && !x._comment4 && !x._comment5 && !x._comment6 && !x._comment7 && !x._comment8
  && x._enabled !== false);

// ── Buildings ─────────────────────────────────────────────────
/** Bangunan tambahan dari config. Merge dengan BUILDING_DEFS di buildings.js */
export const EXTRA_BUILDINGS = active(BUILDING_REGISTRY);

/** Gabungkan extra buildings ke BUILDING_DEFS yang sudah ada */
export function mergeBuildings(existingDefs) {
  const existingIds = new Set(existingDefs.map(b => b.id));
  const newBuildings = EXTRA_BUILDINGS.filter(b => !existingIds.has(b.id)).map(b => ({
    ...b,
    color: typeof b.color === 'string' ? parseInt(b.color.replace('#', ''), 16) : b.color,
    accent: b.accent ? (typeof b.accent === 'string' ? parseInt(b.accent.replace('#', ''), 16) : b.accent) : undefined,
  }));
  return [...existingDefs, ...newBuildings];
}

// ── Vehicles ──────────────────────────────────────────────────
/** Vehicle tambahan dari config */
export const EXTRA_VEHICLES = active(VEHICLE_REGISTRY);

/** Ambil extra vehicles berdasarkan type */
export function getExtraVehiclesByType(type) {
  return EXTRA_VEHICLES.filter(v => v.type === type);
}

// ── Minigames ─────────────────────────────────────────────────
/** Semua minigame dari config (yang enabled) */
export const REGISTRY_MINIGAMES = active(MINIGAME_REGISTRY);

/** Cari minigame by id */
export function getMinigame(id) {
  return REGISTRY_MINIGAMES.find(m => m.id === id) || null;
}

/** Minigame yang trigger saat masuk bangunan tertentu */
export function getMinigamesForBuilding(btype) {
  return REGISTRY_MINIGAMES.filter(m => m.trigger === 'building' && m.triggerBuilding === btype);
}

// ── Side Missions ─────────────────────────────────────────────
/** Semua side mission dari config (yang enabled) */
export const REGISTRY_SIDE_MISSIONS = active(SIDEMISSION_REGISTRY);

/**
 * Cek side missions yang bisa muncul berdasarkan state game.
 * @param {object} state - game state
 * @returns {Array} missions yang triggernya terpenuhi dan belum aktif
 */
export function getAvailableSideMissions(state) {
  const activeMissionIds = new Set((state.activeSideMissions || []).map(m => m.id));
  const completedIds = new Set(state.completedSideMissions || []);

  return REGISTRY_SIDE_MISSIONS.filter(mission => {
    if (activeMissionIds.has(mission.id) || completedIds.has(mission.id)) return false;
    return checkSideMissionTrigger(mission.trigger, state);
  });
}

function checkSideMissionTrigger(trigger, state) {
  if (!trigger) return true;
  switch (trigger.type) {
    case 'population': return state.population >= (trigger.min || 0);
    case 'level':      return state.missionLevel >= (trigger.min || 0);
    case 'building':   return state.buildings.some(b => b.type === trigger.btype);
    case 'date':
      if (trigger.month && state.month !== trigger.month) return false;
      if (trigger.day   && state.day   !== trigger.day)   return false;
      return true;
    case 'always':
    default: return true;
  }
}

// ── Building Events ───────────────────────────────────────────
/** Semua building events dari config (yang enabled) */
export const REGISTRY_BUILDING_EVENTS = active(BUILDINGEVENT_REGISTRY);

/**
 * Ambil event yang berlaku saat player masuk bangunan.
 * @param {string} btype - tipe bangunan
 * @param {object} state - game state (day, month, missionLevel, population)
 * @returns {object|null} event pertama yang cocok, atau null
 */
export function getBuildingEvent(btype, state) {
  const candidates = REGISTRY_BUILDING_EVENTS.filter(ev => {
    if (!ev.buildingTypes.includes(btype) && !ev.buildingTypes.includes('any')) return false;
    return checkBuildingEventTrigger(ev.trigger, state);
  });
  if (!candidates.length) return null;
  // Jika ada beberapa, ambil yang random
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function checkBuildingEventTrigger(trigger, state) {
  if (!trigger) return true;
  switch (trigger.type) {
    case 'always': return true;
    case 'random': return Math.random() < (trigger.chance || 0.5);
    case 'level':  return state.missionLevel >= (trigger.min || 0);
    case 'population': return state.population >= (trigger.min || 0);
    case 'date': {
      if (trigger.month && state.month !== trigger.month) return false;
      if (trigger.day   && state.day   !== trigger.day)   return false;
      if (trigger.dayFrom && state.day < trigger.dayFrom)  return false;
      if (trigger.dayTo   && state.day > trigger.dayTo)    return false;
      return true;
    }
    default: return false;
  }
}

// ── Easter Eggs ───────────────────────────────────────────────
/** Semua easter eggs dari config (yang enabled) */
export const REGISTRY_EASTER_EGGS = active(EASTEREGG_REGISTRY);

/** Easter eggs yang trigger by cheat keyword */
export const CHEAT_EASTER_EGGS = Object.fromEntries(
  REGISTRY_EASTER_EGGS
    .filter(e => e.type === 'cheat')
    .map(e => [e.trigger.keyword.toLowerCase(), e])
);

/** Easter eggs yang trigger by date */
export const DATE_EASTER_EGGS = REGISTRY_EASTER_EGGS.filter(e => e.type === 'date');

/** Easter eggs yang trigger by keyboard sequence */
export const SEQUENCE_EASTER_EGGS = REGISTRY_EASTER_EGGS.filter(e => e.type === 'sequence');

/** Easter eggs yang trigger by click */
export const CLICK_EASTER_EGGS = REGISTRY_EASTER_EGGS.filter(e => e.type === 'click');

/** Easter eggs yang trigger by time of day */
export const TIME_EASTER_EGGS = REGISTRY_EASTER_EGGS.filter(e => e.type === 'time');

/**
 * Cek easter egg berdasarkan tanggal saat ini.
 * @param {number} month - bulan (1-12)
 * @param {number} day - hari (1-31)
 * @returns {object|null}
 */
export function getDateEasterEgg(month, day) {
  return DATE_EASTER_EGGS.find(e =>
    e.trigger.month === month && e.trigger.day === day
  ) || null;
}

export function getTimeEasterEggs(timeOfDay) {
  return TIME_EASTER_EGGS.filter(e => e.trigger.timeOfDay === timeOfDay);
}

/**
 * Cek cheat keyword terhadap registry easter eggs.
 * @param {string} keyword
 * @returns {object|null} easter egg jika match
 */
export function getCheatEasterEgg(keyword) {
  return CHEAT_EASTER_EGGS[keyword.toLowerCase().trim()] || null;
}

// ── Animals ───────────────────────────────────────────────────
/** Semua hewan dari config (yang enabled) */
export const REGISTRY_ANIMALS = active(ANIMAL_REGISTRY);

/**
 * Ambil hewan berdasarkan biome/zone type
 * @param {string} zoneType - 'forest' | 'desert' | 'ocean' | 'city'
 */
export function getAnimalsForZone(zoneType) {
  return REGISTRY_ANIMALS.filter(a => a.type === zoneType);
}

/** Ambil config satu hewan by id */
export function getAnimalById(id) {
  return REGISTRY_ANIMALS.find(a => a.id === id) || null;
}

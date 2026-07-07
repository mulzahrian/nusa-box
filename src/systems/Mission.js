import { ISLAND_LEVELS } from '../data/levels/index.js';
export function getLevelsForMap(mapId) { return ISLAND_LEVELS[mapId] || ISLAND_LEVELS.sumatra || []; }
export function getObjectiveProgress(obj, state) {
  let current = 0;
  switch (obj.type) {
    case 'roads': current = state.buildings.filter(b => b.type === 'road').length; break;
    case 'btype': current = state.buildings.filter(b => b.type === obj.btype).length; break;
    case 'btypes': current = state.buildings.filter(b => obj.btypes.includes(b.type)).length; break;
    case 'population': current = state.population; break;
    case 'money': current = state.money; break;
    case 'happiness': current = state.happiness; break;
    case 'jobs': current = state.jobs?.offered || 0; break;
    case 'income': current = state.income || 0; break;
    case 'relationship': current = state.relationships?.[obj.charId] || 0; break;
    default: current = 0;
  }
  return { done: current >= (obj.min || 1), current: Math.min(current, obj.min || 1), max: obj.min || 1 };
}
export function checkObjective(obj, state) { return getObjectiveProgress(obj, state).done; }
export function checkLevelComplete(state) {
  if (state.sandbox || state.freeMode) return false;
  const level = getLevelsForMap(state.mapId)[state.missionLevel - 1];
  return !!level && level.objectives.every(obj => checkObjective(obj, state));
}

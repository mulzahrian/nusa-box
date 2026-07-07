/**
 * Level index - maps each island to its level data
 * To add levels for a new island: create a new file and import it here
 */
import SUMATRA_LEVELS from './sumatra';

const LEVELS_BY_MAP = {
  sumatra: SUMATRA_LEVELS,
  jawa: [],       // TODO: Add jawa levels
  kalimantan: [], // TODO: Add kalimantan levels
  sulawesi: [],   // TODO: Add sulawesi levels
  papua: [],      // TODO: Add papua levels
};

export default LEVELS_BY_MAP;

export function getLevelsForMap(mapId) {
  return LEVELS_BY_MAP[mapId] || [];
}

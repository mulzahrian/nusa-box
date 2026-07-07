import levelData from './levelData.json';
import CutsceneData from '../cutscene/CutsceneData';
import { useBuildingStore } from '../store/buildingStore';
import { useCitizenStore } from '../store/citizenStore';
import { useEconomyStore } from '../store/economyStore';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { BUILDING_INDEX } from '../game/buildings/buildingConfig';

const buildingCategories = (buildings) =>
  buildings.reduce((accumulator, building) => {
    const category = BUILDING_INDEX[building.typeId]?.category ?? building.type;
    accumulator[category] = (accumulator[category] ?? 0) + 1;
    return accumulator;
  }, {});

const getObjectiveCurrent = (objective) => {
  const buildings = buildingCategories(useBuildingStore.getState().buildings.filter((item) => item.status === 'active'));
  const citizens = useCitizenStore.getState();
  const economy = useEconomyStore.getState();
  const game = useGameStore.getState();
  switch (objective.type) {
    case 'buildCount':
      return buildings[objective.buildingId] ?? 0;
    case 'population':
      return citizens.population;
    case 'money':
      return economy.money;
    case 'relationship':
      return citizens.relationships?.[objective.character] ?? 0;
    case 'completeMiniGame':
      return game.completedMiniGames.includes(objective.miniGameId) ? 1 : 0;
    default:
      return objective.current ?? 0;
  }
};

const findLevel = (id) => levelData.find((level) => level.id === id);

export const getCurrentLevel = () => {
  const game = useGameStore.getState();
  const levelNumber = game.currentLevel[game.currentMap] ?? 1;
  return levelData.find((level) => level.map === game.currentMap && level.levelNumber === levelNumber) ?? levelData[0];
};

export const checkLevelComplete = (levelId = null) => {
  const level = levelId ? findLevel(levelId) ?? getCurrentLevel() : getCurrentLevel();
  const objectives = level.objectives.map((objective) => ({ ...objective, current: getObjectiveCurrent(objective) }));
  return { level, objectives, complete: objectives.every((objective) => objective.current >= objective.target) };
};

export const startLevel = (levelId) => {
  const level = findLevel(levelId) ?? levelData[0];
  const store = useGameStore.getState();
  store.setLevel(level.map, level.levelNumber);
  store.unlockBuildings(level.unlocksBuildings ?? []);
  if (level.cutsceneStart && CutsceneData[level.cutsceneStart]) {
    useUIStore.getState().setCutsceneData(CutsceneData[level.cutsceneStart]);
  }
  return level;
};

export const completeLevel = (levelId = null) => {
  const result = checkLevelComplete(levelId);
  if (!result.complete) {
    return result;
  }

  const level = result.level;
  const game = useGameStore.getState();
  const citizen = useCitizenStore.getState();
  useEconomyStore.getState().addMoney(level.rewards.money ?? 0);
  citizen.setCompletedLevels(citizen.completedLevels + 1);
  game.unlockBuildings([...(level.unlocksBuildings ?? []), ...(level.rewards.unlocks ?? [])]);
  game.unlockFeatures(level.rewards.unlocks ?? []);
  if (level.cutsceneEnd && CutsceneData[level.cutsceneEnd]) {
    useUIStore.getState().setCutsceneData(CutsceneData[level.cutsceneEnd]);
  }
  const nextLevel = levelData.find((item) => item.map === level.map && item.levelNumber === level.levelNumber + 1);
  if (nextLevel) {
    game.setLevel(nextLevel.map, nextLevel.levelNumber);
  }
  return result;
};

export default { getCurrentLevel, checkLevelComplete, startLevel, completeLevel, levelData };

import sideMissionData from './sideMissionData.json';
import CutsceneData from '../cutscene/CutsceneData';
import { useCitizenStore } from '../store/citizenStore';
import { useEconomyStore } from '../store/economyStore';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useBuildingStore } from '../store/buildingStore';
import { BUILDING_INDEX } from '../game/buildings/buildingConfig';

const getCounts = () =>
  useBuildingStore
    .getState()
    .buildings.filter((item) => item.status === 'active')
    .reduce((accumulator, building) => {
      const category = BUILDING_INDEX[building.typeId]?.category ?? building.type;
      accumulator[category] = (accumulator[category] ?? 0) + 1;
      return accumulator;
    }, {});

const getObjectiveCurrent = (objective) => {
  const game = useGameStore.getState();
  const citizen = useCitizenStore.getState();
  switch (objective.type) {
    case 'buildCount':
      return getCounts()[objective.buildingId] ?? 0;
    case 'population':
      return citizen.population;
    case 'relationship':
      return citizen.relationships?.[objective.character] ?? 0;
    case 'completeMiniGame':
      return game.completedMiniGames.includes(objective.miniGameId) ? 1 : 0;
    default:
      return 0;
  }
};

export const getAvailableMissions = ({ includeManual = false } = {}) => {
  const game = useGameStore.getState();
  const citizen = useCitizenStore.getState();
  return sideMissionData.filter((mission) => {
    const conditions = mission.conditions ?? {};
    const relationshipOkay =
      !conditions.afterRelationship ||
      (citizen.relationships?.[conditions.afterRelationship.character] ?? 0) >= conditions.afterRelationship.value;
    return (
      (!conditions.afterLevel || citizen.completedLevels >= conditions.afterLevel) &&
      (!conditions.afterDate || game.calendarDate.day >= conditions.afterDate) &&
      (!conditions.manualTrigger || includeManual) &&
      relationshipOkay &&
      !game.activeSideMissions.includes(mission.id) &&
      !game.completedSideMissions.includes(mission.id)
    );
  });
};

export const activateMission = (missionId) => {
  const mission = sideMissionData.find((item) => item.id === missionId);
  if (!mission) {
    return null;
  }
  useGameStore.getState().activateSideMission(mission.id);
  if (mission.cutscene && CutsceneData[mission.cutscene]) {
    useUIStore.getState().setCutsceneData(CutsceneData[mission.cutscene]);
  }
  return mission;
};

export const completeMission = (missionId) => {
  const mission = sideMissionData.find((item) => item.id === missionId);
  if (!mission) {
    return null;
  }
  const complete = mission.objectives.every((objective) => getObjectiveCurrent(objective) >= objective.target);
  if (!complete) {
    return { mission, complete: false };
  }
  useGameStore.getState().completeSideMission(mission.id);
  useEconomyStore.getState().addMoney(mission.rewards.money ?? 0);
  if (mission.rewards.relationship) {
    useCitizenStore.getState().updateRelationship(mission.rewards.relationship.character, mission.rewards.relationship.amount);
  }
  return { mission, complete: true };
};

export default { getAvailableMissions, activateMission, completeMission, sideMissionData };

/**
 * Mission/Level System - loads level data from JSON, tracks progress
 */
import useGameStore from '@stores/useGameStore';

class MissionSystem {
  constructor() {
    this.levels = [];    // loaded from JSON or data file
    this.showing = false;
  }
  
  loadLevels(levelData) {
    this.levels = levelData;
  }
  
  getCurrentMission() {
    const { missionLevel } = useGameStore.getState();
    return this.levels.find(l => l.num === missionLevel) || null;
  }
  
  checkObjectives(gameState, buildings) {
    const mission = this.getCurrentMission();
    if (!mission) return { complete: false, progress: [] };
    
    const progress = mission.objectives.map(obj => {
      let current = 0;
      
      switch (obj.type) {
        case 'population':
          current = gameState.population;
          break;
        case 'money':
          current = gameState.money;
          break;
        case 'happiness':
          current = gameState.happiness;
          break;
        case 'roads':
          current = buildings.filter(b => b.type === 'road').length;
          break;
        case 'btype':
          current = buildings.filter(b => b.type === obj.btype).length;
          break;
        case 'btypes':
          current = buildings.filter(b => obj.btypes.includes(b.type)).length;
          break;
        case 'jobs':
          current = gameState.jobs?.offered || 0;
          break;
        default:
          break;
      }
      
      return {
        ...obj,
        current,
        complete: current >= obj.min,
      };
    });
    
    const complete = progress.every(p => p.complete);
    return { complete, progress };
  }
  
  completeCurrentMission() {
    const mission = this.getCurrentMission();
    if (!mission) return;
    
    const store = useGameStore.getState();
    store.addMoney(mission.reward || 0);
    store.setMissionLevel(store.missionLevel + 1);
    store.setLevel(store.level + 1);
  }
}

const missionSystem = new MissionSystem();
export default missionSystem;

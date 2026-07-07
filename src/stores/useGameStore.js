/**
 * Main game state store (Zustand)
 * Handles: money, population, happiness, pollution, day/night, level, map
 */
import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Core state
  running: false,
  paused: false,
  speed: 1,
  
  // Time
  day: 1,
  month: 1,
  year: 2024,
  
  // Economy
  money: 320000,
  income: 0,
  expense: 0,
  
  // Population
  population: 0,
  happiness: 70,
  pollution: 0,
  traffic: 0,
  
  // Weather
  weather: 'sunny',
  season: 'dry',
  
  // Level/Mission
  level: 1,
  missionLevel: 1,
  freeMode: false,
  
  // Map
  mapId: 'sumatra',
  mapName: 'Sumatra',
  unlockedMaps: ['sumatra'],
  landSize: 20,
  
  // Resources
  power: { gen: 0, demand: 0 },
  water: { gen: 0, demand: 0 },
  jobs: { offered: 0, taken: 0 },
  homes: 0,
  
  // Actions
  setRunning: (running) => set({ running }),
  setPaused: (paused) => set({ paused }),
  setSpeed: (speed) => set({ speed }),
  
  setMoney: (money) => set({ money }),
  addMoney: (amount) => set(s => ({ money: s.money + amount })),
  
  setPopulation: (population) => set({ population }),
  setHappiness: (happiness) => set({ happiness }),
  setPollution: (pollution) => set({ pollution }),
  
  setMap: (mapId, mapName) => set({ mapId, mapName }),
  unlockMap: (mapId) => set(s => ({
    unlockedMaps: s.unlockedMaps.includes(mapId)
      ? s.unlockedMaps
      : [...s.unlockedMaps, mapId]
  })),
  
  setLandSize: (landSize) => set({ landSize }),
  setLevel: (level) => set({ level }),
  setMissionLevel: (missionLevel) => set({ missionLevel }),
  setFreeMode: (freeMode) => set({ freeMode }),
  
  advanceDay: () => set(s => {
    let { day, month, year } = s;
    day++;
    if (day > 30) { day = 1; month++; }
    if (month > 12) { month = 1; year++; }
    return { day, month, year };
  }),
  
  setWeather: (weather) => set({ weather }),
  
  // Save/Load
  getSnapshot: () => {
    const s = get();
    return {
      day: s.day, month: s.month, year: s.year,
      money: s.money, income: s.income, expense: s.expense,
      population: s.population, happiness: s.happiness,
      pollution: s.pollution, traffic: s.traffic,
      weather: s.weather, season: s.season,
      level: s.level, missionLevel: s.missionLevel, freeMode: s.freeMode,
      mapId: s.mapId, mapName: s.mapName,
      unlockedMaps: s.unlockedMaps, landSize: s.landSize,
      power: s.power, water: s.water, jobs: s.jobs, homes: s.homes,
    };
  },
  
  loadSnapshot: (data) => set(data),
}));

export default useGameStore;

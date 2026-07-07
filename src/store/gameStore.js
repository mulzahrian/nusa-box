import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAP_ORDER = ['sumatra', 'jawa', 'kalimantan', 'sulawesi', 'papua'];
const PAGE_OPTIONS = ['menu', 'gameplay', 'settings'];
const WEATHER_OPTIONS = ['cerah', 'hujan'];
const SPEED_OPTIONS = ['1x', '2x', '3x'];
const DEFAULT_CAMERA = { x: 0, z: 0, zoom: 28 };
const DEFAULT_BUILDING_ID = 'woodHouse';

const getDayPhase = (hour) => {
  if (hour >= 5 && hour < 11) return 'pagi';
  if (hour >= 11 && hour < 15) return 'siang';
  if (hour >= 15 && hour < 18) return 'sore';
  if (hour >= 18 && hour < 24) return 'malam';
  return 'tengahMalam';
};

const getDaysInMonth = (month, year) => {
  const daysPerMonth = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysPerMonth[(month - 1 + 12) % 12];
};

const normalizeDate = ({ day, month, year }) => {
  let nextDay = day;
  let nextMonth = month;
  let nextYear = year;

  while (nextDay > getDaysInMonth(nextMonth, nextYear)) {
    nextDay -= getDaysInMonth(nextMonth, nextYear);
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
  }

  return { day: nextDay, month: nextMonth, year: nextYear };
};

const toTimeOfDay = ({ hour, minute }) => (hour * 60 + minute) / (24 * 60);

const defaultLevels = MAP_ORDER.reduce((accumulator, mapId) => {
  accumulator[mapId] = 1;
  return accumulator;
}, {});

export const useGameStore = create(
  persist(
    (set, get) => ({
      currentPage: 'menu',
      currentMap: 'sumatra',
      unlockedMaps: ['sumatra'],
      currentLevel: defaultLevels,
      gameTime: { hour: 8, minute: 0 },
      timeOfDay: toTimeOfDay({ hour: 8, minute: 0 }),
      dayPhase: getDayPhase(8),
      weather: 'cerah',
      calendarDate: { day: 1, month: 1, year: 2026 },
      isPaused: false,
      gameSpeed: '1x',
      unlockedBuildings: ['woodHouse'],
      unlockedFeatures: ['cutscene', 'economy'],
      activeSideMissions: [],
      completedSideMissions: [],
      completedMiniGames: [],
      buildMode: true,
      selectedBuildingId: DEFAULT_BUILDING_ID,
      camera: DEFAULT_CAMERA,

      setPage: (page) =>
        set(() => ({
          currentPage: PAGE_OPTIONS.includes(page) ? page : 'menu',
        })),

      setMap: (mapId) =>
        set((state) => ({
          currentMap: state.unlockedMaps.includes(mapId) ? mapId : state.currentMap,
        })),

      setCurrentMap: (mapId) => get().setMap(mapId),

      unlockMap: (mapId) =>
        set((state) => ({
          unlockedMaps: MAP_ORDER.includes(mapId) && !state.unlockedMaps.includes(mapId)
            ? [...state.unlockedMaps, mapId]
            : state.unlockedMaps,
        })),

      setLevel: (mapId, level) =>
        set((state) => ({
          currentLevel: MAP_ORDER.includes(mapId)
            ? {
                ...state.currentLevel,
                [mapId]: Math.max(1, Number(level) || 1),
              }
            : state.currentLevel,
        })),

      nextLevel: (mapId) => {
        const targetMap = mapId || get().currentMap;
        set((state) => ({
          currentLevel: MAP_ORDER.includes(targetMap)
            ? {
                ...state.currentLevel,
                [targetMap]: (state.currentLevel[targetMap] || 1) + 1,
              }
            : state.currentLevel,
        }));
      },

      setWeather: (weather) =>
        set(() => ({
          weather: WEATHER_OPTIONS.includes(weather) ? weather : 'cerah',
        })),
      unlockBuildings: (items) =>
        set((state) => ({
          unlockedBuildings: [...new Set([...state.unlockedBuildings, ...(items || [])])],
        })),
      unlockFeatures: (items) =>
        set((state) => ({
          unlockedFeatures: [...new Set([...state.unlockedFeatures, ...(items || [])])],
        })),
      activateSideMission: (missionId) =>
        set((state) => ({
          activeSideMissions: state.activeSideMissions.includes(missionId)
            ? state.activeSideMissions
            : [...state.activeSideMissions, missionId],
        })),
      completeSideMission: (missionId) =>
        set((state) => ({
          activeSideMissions: state.activeSideMissions.filter((id) => id !== missionId),
          completedSideMissions: state.completedSideMissions.includes(missionId)
            ? state.completedSideMissions
            : [...state.completedSideMissions, missionId],
        })),
      completeMiniGame: (miniGameId) =>
        set((state) => ({
          completedMiniGames: state.completedMiniGames.includes(miniGameId)
            ? state.completedMiniGames
            : [...state.completedMiniGames, miniGameId],
        })),

      setPaused: (isPaused) => set(() => ({ isPaused: Boolean(isPaused) })),

      togglePaused: () => set((state) => ({ isPaused: !state.isPaused })),

      setGameSpeed: (speed) =>
        set(() => ({
          gameSpeed: SPEED_OPTIONS.includes(speed) ? speed : '1x',
        })),

      setCalendarDate: (calendarDate) =>
        set(() => ({
          calendarDate: normalizeDate({
            day: Math.max(1, Number(calendarDate?.day) || 1),
            month: Math.min(12, Math.max(1, Number(calendarDate?.month) || 1)),
            year: Math.max(1, Number(calendarDate?.year) || 1),
          }),
        })),

      setTimeOfDay: (timeOfDay) =>
        set((state) => {
          const normalized = Math.min(0.999, Math.max(0, Number(timeOfDay) || 0));
          const totalMinutes = Math.floor(normalized * 24 * 60);
          const hour = Math.floor(totalMinutes / 60);
          const minute = totalMinutes % 60;
          return {
            timeOfDay: normalized,
            gameTime: { hour, minute },
            dayPhase: getDayPhase(hour),
            calendarDate: state.calendarDate,
          };
        }),

      setBuildMode: (buildMode) => set(() => ({ buildMode: Boolean(buildMode) })),

      selectBuilding: (selectedBuildingId) =>
        set(() => ({
          selectedBuildingId: selectedBuildingId || DEFAULT_BUILDING_ID,
          buildMode: true,
        })),

      cancelBuild: () =>
        set((state) => ({
          buildMode: false,
          selectedBuildingId: state.selectedBuildingId || DEFAULT_BUILDING_ID,
        })),

      setCamera: (camera) =>
        set((state) => ({
          camera: { ...state.camera, ...camera },
        })),

      advanceTime: (minutesToAdvance = 1) =>
        set((state) => {
          if (state.isPaused) {
            return state;
          }

          const speedMultiplier = Number.parseInt(state.gameSpeed, 10) || 1;
          const totalMinutes =
            state.gameTime.hour * 60 +
            state.gameTime.minute +
            Math.max(1, Number(minutesToAdvance) || 1) * speedMultiplier;

          const daysPassed = Math.floor(totalMinutes / (24 * 60));
          const minutesInDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
          const hour = Math.floor(minutesInDay / 60);
          const minute = minutesInDay % 60;
          const calendarDate = normalizeDate({
            ...state.calendarDate,
            day: state.calendarDate.day + daysPassed,
          });

          return {
            gameTime: { hour, minute },
            timeOfDay: toTimeOfDay({ hour, minute }),
            dayPhase: getDayPhase(hour),
            calendarDate,
          };
        }),

      resetGame: () =>
        set(() => ({
          currentPage: 'menu',
          currentMap: 'sumatra',
          unlockedMaps: ['sumatra'],
          currentLevel: { ...defaultLevels },
          gameTime: { hour: 8, minute: 0 },
          timeOfDay: toTimeOfDay({ hour: 8, minute: 0 }),
          dayPhase: getDayPhase(8),
          weather: 'cerah',
          calendarDate: { day: 1, month: 1, year: 2026 },
          isPaused: false,
          gameSpeed: '1x',
          unlockedBuildings: ['woodHouse'],
          unlockedFeatures: ['cutscene', 'economy'],
          activeSideMissions: [],
          completedSideMissions: [],
          completedMiniGames: [],
          buildMode: true,
          selectedBuildingId: DEFAULT_BUILDING_ID,
          camera: DEFAULT_CAMERA,
        })),
    }),
    {
      name: 'nusa-box-game-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

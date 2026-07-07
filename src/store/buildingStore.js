import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getBuildingDefinition } from '../game/buildings/buildingConfig';

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const toTilePosition = (position) => ({ x: Number(position?.x) || 0, y: Number(position?.y) || 0, z: Number(position?.z) || 0 });
const getDefinitionForBuilding = (building) =>
  getBuildingDefinition(building?.typeId || building?.subType || building?.type);

const overlaps = (a, b) =>
  a.position.x < b.position.x + b.size[0] &&
  a.position.x + a.size[0] > b.position.x &&
  a.position.z < b.position.z + b.size[1] &&
  a.position.z + a.size[1] > b.position.z;

export const useBuildingStore = create(
  persist(
    (set, get) => ({
      buildings: [],
      roads: [],

      placeBuilding: (payload) => {
        const definition = getBuildingDefinition(payload?.typeId || payload?.subType || payload?.type);
        const normalizedPosition = toTilePosition(payload?.position);
        const size = definition?.size || payload?.size || [1, 1];

        if (
          get().isAreaOccupied({
            position: normalizedPosition,
            size,
          })
        ) {
          return false;
        }

        set((state) => ({
          buildings: [
            ...state.buildings,
            {
              id: payload?.id || createId('building'),
              typeId: definition?.id || payload?.typeId || payload?.subType || payload?.type || 'generic',
              type: payload?.type || definition?.category || 'generic',
              subType: payload?.subType || definition?.id || payload?.typeId || 'default',
              position: normalizedPosition,
              rotation: Number(payload?.rotation) || 0,
              isBuilding: payload?.isBuilding ?? true,
              buildProgress: Math.max(0, Number(payload?.buildProgress) || 0),
              buildTime: Math.max(25, Number(payload?.buildTime) || definition?.buildTime || 60),
              startedAt: payload?.startedAt || Date.now(),
              status: payload?.status || 'building',
            },
          ],
        }));
        return true;
      },

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((building) => building.id !== id),
        })),

      updateBuildProgress: (id, progressDelta = 1) =>
        set((state) => ({
          buildings: state.buildings.map((building) => {
            if (building.id !== id) {
              return building;
            }

            const buildProgress = Math.min(
              building.buildTime,
              Math.max(0, building.buildProgress + (Number(progressDelta) || 0)),
            );

            return {
              ...building,
              buildProgress,
              isBuilding: buildProgress < building.buildTime,
              status: buildProgress < building.buildTime ? 'building' : 'active',
            };
          }),
        })),

      isAreaOccupied: ({ position, size }, ignoredId) =>
        get().buildings.some((building) => {
          if (building.id === ignoredId) {
            return false;
          }
          const definition = getDefinitionForBuilding(building);
          if (!definition) {
            return false;
          }
          return overlaps(
            { position, size },
            { position: toTilePosition(building.position), size: definition.size },
          );
        }),

      refreshConstruction: () =>
        set((state) => ({
          buildings: state.buildings.map((building) => {
            const definition = getDefinitionForBuilding(building);
            const startedAt = building.startedAt || Date.now();
            const buildTime = Math.max(25, definition?.buildTime || building.buildTime || 60);
            const elapsedSeconds = (Date.now() - startedAt) / 1000;

            if (elapsedSeconds < buildTime && building.status !== 'active') {
              return {
                ...building,
                buildTime,
                buildProgress: elapsedSeconds,
                isBuilding: true,
                status: 'building',
              };
            }

            return {
              ...building,
              buildTime,
              buildProgress: buildTime,
              isBuilding: false,
              status: 'active',
            };
          }),
        })),

      placeRoad: ({
        id,
        type = 'road',
        position,
        rotation = 0,
        curveType = 'straight',
      }) =>
        set((state) => ({
          roads: [
            ...state.roads,
            {
              id: id || createId('road'),
              type,
              position: position || { x: 0, y: 0, z: 0 },
              rotation,
              curveType,
            },
          ],
        })),

      removeRoad: (id) =>
        set((state) => ({
          roads: state.roads.filter((road) => road.id !== id),
        })),

      resetBuildings: () => set(() => ({ buildings: [], roads: [] })),
    }),
    {
      name: 'nusa-box-building-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

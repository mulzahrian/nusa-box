export const WORLD_CONFIG = {
  sumatra: {
    biomeAreas: {
      forest: { center: [-34, 0, -22], size: [48, 42] },
      desert: { center: [42, 0, -34], size: [38, 28] },
      mountain: { center: [58, 0, -46], size: [26, 24] },
      sea: { center: [0, 0, 56], size: [170, 40] },
      airport: { center: [0, 0, -62], size: [36, 14] },
    },
    defaultRoadPaths: {
      ground: [
        [[-86, 0.4, -6], [86, 0.4, -6]],
        [[-50, 0.4, 18], [42, 0.4, 18]],
        [[0, 0.4, -58], [0, 0.4, 42]],
      ],
      water: [[[-92, 0.25, 56], [92, 0.25, 56]]],
      air: [[[-68, 12, -62], [68, 12, -62]]],
    },
  },
};

export const getWorldConfig = (mapId = 'sumatra') => WORLD_CONFIG[mapId] ?? WORLD_CONFIG.sumatra;

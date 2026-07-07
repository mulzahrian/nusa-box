const MAP_SIZE = { width: 1000, height: 1000 };

export const MAP_CONFIG = {
  sumatra: { name: 'Sumatra', size: MAP_SIZE, biomes: { pantai: 0.16, laut: 0.14, gurun: 0.18, 'bukit gurun': 0.12, hutan: 0.4 }, unlockLevel: 1 },
  jawa: { name: 'Jawa', size: MAP_SIZE, biomes: { hutan: 0.5, gunung: 0.2, pantai: 0.16, laut: 0.14 }, unlockLevel: 6 },
  kalimantan: { name: 'Kalimantan', size: MAP_SIZE, biomes: { pantai: 0.14, laut: 0.12, gurun: 0.1, 'bukit gurun': 0.06, hutan: 0.58 }, unlockLevel: 12 },
  sulawesi: { name: 'Sulawesi', size: MAP_SIZE, biomes: { pantai: 0.35, laut: 0.17, hutan: 0.42, gunung: 0.06 }, unlockLevel: 18 },
  papua: { name: 'Papua', size: MAP_SIZE, biomes: { pantai: 0.18, laut: 0.12, hutan: 0.5, gunung: 0.12, salju: 0.08 }, unlockLevel: 24 },
};

const BIOME_ALIAS = {
  pantai: 'sand',
  laut: 'water',
  gurun: 'sand',
  'bukit gurun': 'mountain',
  hutan: 'forest',
  gunung: 'mountain',
  salju: 'snow',
  dataran: 'grass',
};

const HEIGHT_MAP = { water: 0.12, sand: 0.3, grass: 0.55, forest: 0.75, mountain: 1.45, snow: 1.8 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const sampleNoise = (x, z, seed) => {
  const a = Math.sin((x + seed * 7) * 0.018);
  const b = Math.cos((z - seed * 5) * 0.014) * 0.8;
  const c = Math.sin((x + z + seed * 11) * 0.007) * 0.6;
  return clamp((a + b + c + 2.4) / 4.8, 0, 1);
};

const edgeFactor = (x, z, size) => {
  const minEdge = Math.min(x, z, size.width - x, size.height - z);
  return clamp(minEdge / 120, 0, 1);
};

const makeTile = (sourceBiome, x, z, heightScale = 1) => {
  const biome = BIOME_ALIAS[sourceBiome] || 'grass';
  return { x, z, biome, sourceBiome, height: HEIGHT_MAP[biome] * heightScale };
};

export const generateBiomeTile = (mapKey, x, z) => {
  const config = MAP_CONFIG[mapKey] || MAP_CONFIG.sumatra;
  const seed = config.unlockLevel * 13;
  const moisture = sampleNoise(x, z, seed);
  const heat = sampleNoise(x + 300, z - 200, seed + 3);
  const ridge = sampleNoise(x - 120, z + 260, seed + 7);
  const coast = edgeFactor(x, z, config.size) * 0.65 + sampleNoise(x, z, seed + 15) * 0.35;
  const snowZone = 1 - clamp(Math.hypot(x - 820, z - 180) / 220, 0, 1);

  if (coast < 0.24) return makeTile('laut', x, z);
  if (coast < 0.34) return makeTile('pantai', x, z);
  if (mapKey === 'sumatra') {
    if (heat > 0.68 && moisture < 0.46) return makeTile(ridge > 0.66 ? 'bukit gurun' : 'gurun', x, z, 1 + ridge * 0.3);
    return makeTile(moisture > 0.56 ? 'hutan' : 'dataran', x, z, 1 + moisture * 0.2);
  }
  if (mapKey === 'jawa') {
    if (ridge > 0.7) return makeTile('gunung', x, z, 1 + ridge * 0.4);
    return makeTile(moisture > 0.48 ? 'hutan' : 'dataran', x, z, 1 + moisture * 0.15);
  }
  if (mapKey === 'kalimantan') {
    if (heat > 0.72 && moisture < 0.42) return makeTile(ridge > 0.62 ? 'bukit gurun' : 'gurun', x, z, 1 + ridge * 0.25);
    return makeTile(moisture > 0.42 ? 'hutan' : 'dataran', x, z, 1 + moisture * 0.2);
  }
  if (mapKey === 'sulawesi') {
    if (coast < 0.42) return makeTile('pantai', x, z, 1 + coast * 0.15);
    return makeTile(moisture > 0.45 ? 'hutan' : 'dataran', x, z, 1 + moisture * 0.15);
  }
  if (snowZone > 0.52 && ridge > 0.58) return makeTile('salju', x, z, 1.2 + snowZone * 0.5);
  if (ridge > 0.72) return makeTile('gunung', x, z, 1 + ridge * 0.45);
  return makeTile(moisture > 0.5 ? 'hutan' : 'dataran', x, z, 1 + moisture * 0.2);
};

export const getChunkBiomeData = (mapKey, chunkX, chunkZ, chunkSize = 32) => {
  const config = MAP_CONFIG[mapKey] || MAP_CONFIG.sumatra;
  const tiles = [];
  const startX = chunkX * chunkSize;
  const startZ = chunkZ * chunkSize;

  for (let localZ = 0; localZ < chunkSize; localZ += 1) {
    for (let localX = 0; localX < chunkSize; localX += 1) {
      const x = startX + localX;
      const z = startZ + localZ;
      if (x >= config.size.width || z >= config.size.height) {
        continue;
      }
      tiles.push(generateBiomeTile(mapKey, x, z));
    }
  }

  return tiles;
};

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getChunkBiomeData, MAP_CONFIG } from '../map/mapConfig';
import TerrainChunk from './TerrainChunk';

const CHUNK_SIZE = 32;

const buildVisibleChunks = (mapKey, cameraState) => {
  const mapSize = (MAP_CONFIG[mapKey] || MAP_CONFIG.sumatra).size;
  const maxChunkX = Math.ceil(mapSize.width / CHUNK_SIZE);
  const maxChunkZ = Math.ceil(mapSize.height / CHUNK_SIZE);
  const zoomRadius = Math.max(3, Math.min(7, Math.round(cameraState.zoom / 6)));
  const baseChunkX = Math.floor(Math.max(0, cameraState.x) / CHUNK_SIZE);
  const baseChunkZ = Math.floor(Math.max(0, cameraState.z) / CHUNK_SIZE);
  const chunks = [];

  for (let chunkZ = baseChunkZ - zoomRadius; chunkZ <= baseChunkZ + zoomRadius; chunkZ += 1) {
    for (let chunkX = baseChunkX - zoomRadius; chunkX <= baseChunkX + zoomRadius; chunkX += 1) {
      if (chunkX < 0 || chunkZ < 0 || chunkX >= maxChunkX || chunkZ >= maxChunkZ) {
        continue;
      }
      chunks.push({ key: `${chunkX}:${chunkZ}`, chunkX, chunkZ });
    }
  }

  return chunks;
};

export default function TerrainManager() {
  const currentMap = useGameStore((state) => state.currentMap);
  const cameraState = useGameStore((state) => state.camera);
  const [visibleChunks, setVisibleChunks] = useState(() => buildVisibleChunks(currentMap, cameraState));

  useEffect(() => {
    setVisibleChunks(buildVisibleChunks(currentMap, cameraState));
  }, [cameraState.x, cameraState.z, cameraState.zoom, currentMap]);

  const chunkTiles = useMemo(
    () =>
      visibleChunks.map((chunk) => ({
        ...chunk,
        tiles: getChunkBiomeData(currentMap, chunk.chunkX, chunk.chunkZ, CHUNK_SIZE),
      })),
    [currentMap, visibleChunks],
  );

  return (
    <group>
      {chunkTiles.map((chunk) => (
        <TerrainChunk
          key={chunk.key}
          chunkX={chunk.chunkX}
          chunkZ={chunk.chunkZ}
          tiles={chunk.tiles}
          cameraTarget={cameraState}
          cullDistance={Math.max(180, cameraState.zoom * 8)}
        />
      ))}
    </group>
  );
}

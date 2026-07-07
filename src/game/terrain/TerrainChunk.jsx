import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const BIOME_COLOR = {
  grass: '#67b75d',
  water: '#3b82d1',
  sand: '#d8c67a',
  forest: '#2f7d3a',
  mountain: '#7a7d84',
  snow: '#f5f7fb',
};

export default function TerrainChunk({ chunkX, chunkZ, tiles, cameraTarget, cullDistance = 220 }) {
  const meshRef = useRef(null);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const center = useMemo(() => ({ x: chunkX * 32 + 16, z: chunkZ * 32 + 16 }), [chunkX, chunkZ]);
  const shouldRender = !cameraTarget || Math.hypot(center.x - cameraTarget.x, center.z - cameraTarget.z) <= cullDistance;

  useLayoutEffect(() => {
    if (!meshRef.current || !shouldRender) {
      return;
    }
    tiles.forEach((tile, index) => {
      temp.position.set(tile.x, tile.height * 0.5, tile.z);
      temp.scale.set(1, tile.height, 1);
      temp.updateMatrix();
      meshRef.current.setMatrixAt(index, temp.matrix);
      color.set(BIOME_COLOR[tile.biome] || BIOME_COLOR.grass);
      meshRef.current.setColorAt(index, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [color, shouldRender, temp, tiles]);

  if (!shouldRender || tiles.length === 0) {
    return null;
  }

  return (
    <instancedMesh ref={meshRef} args={[null, null, tiles.length]} castShadow receiveShadow frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

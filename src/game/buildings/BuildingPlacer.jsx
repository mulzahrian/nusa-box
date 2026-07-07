import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBuildingStore } from '../../store/buildingStore';
import { useGameStore } from '../../store/gameStore';
import { getBuildingDefinition } from './buildingConfig';
import { generateBiomeTile, MAP_CONFIG } from '../map/mapConfig';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const snapToGrid = (value) => Math.round(value);

export default function BuildingPlacer() {
  const { camera, gl, raycaster } = useThree();
  const buildMode = useGameStore((state) => state.buildMode);
  const currentMap = useGameStore((state) => state.currentMap);
  const selectedBuildingId = useGameStore((state) => state.selectedBuildingId);
  const cancelBuild = useGameStore((state) => state.cancelBuild);
  const placeBuilding = useBuildingStore((state) => state.placeBuilding);
  const isAreaOccupied = useBuildingStore((state) => state.isAreaOccupied);
  const mouse = useRef(new THREE.Vector2());
  const hitPoint = useRef(new THREE.Vector3());
  const [preview, setPreview] = useState({ visible: false, valid: false, x: 0, z: 0 });
  const definition = useMemo(() => getBuildingDefinition(selectedBuildingId), [selectedBuildingId]);

  useEffect(() => {
    const updateMouse = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const handlePlace = (event) => {
      if (!buildMode || !definition || event.button !== 0 || !preview.valid) {
        return;
      }
      event.preventDefault();
      placeBuilding({
        typeId: definition.id,
        type: definition.category,
        subType: definition.id,
        position: { x: preview.x, y: 0, z: preview.z },
        buildTime: definition.buildTime,
      });
    };

    const handleCancel = (event) => {
      if (!buildMode) {
        return;
      }
      event.preventDefault();
      cancelBuild();
    };

    gl.domElement.addEventListener('pointermove', updateMouse);
    gl.domElement.addEventListener('pointerdown', handlePlace);
    gl.domElement.addEventListener('contextmenu', handleCancel);
    return () => {
      gl.domElement.removeEventListener('pointermove', updateMouse);
      gl.domElement.removeEventListener('pointerdown', handlePlace);
      gl.domElement.removeEventListener('contextmenu', handleCancel);
    };
  }, [buildMode, cancelBuild, definition, gl.domElement, placeBuilding, preview.valid, preview.x, preview.z]);

  useFrame(() => {
    if (!buildMode || !definition) {
      if (preview.visible) {
        setPreview((state) => ({ ...state, visible: false, valid: false }));
      }
      return;
    }

    raycaster.setFromCamera(mouse.current, camera);
    if (!raycaster.ray.intersectPlane(groundPlane, hitPoint.current)) {
      return;
    }

    const [width, depth] = definition.size;
    const x = snapToGrid(hitPoint.current.x - width / 2 + 0.5);
    const z = snapToGrid(hitPoint.current.z - depth / 2 + 0.5);
    const mapSize = (MAP_CONFIG[currentMap] || MAP_CONFIG.sumatra).size;
    let valid = x >= 0 && z >= 0 && x + width <= mapSize.width && z + depth <= mapSize.height;

    for (let offsetZ = 0; valid && offsetZ < depth; offsetZ += 1) {
      for (let offsetX = 0; valid && offsetX < width; offsetX += 1) {
        valid = generateBiomeTile(currentMap, x + offsetX, z + offsetZ).biome !== 'water';
      }
    }
    if (valid) {
      valid = !isAreaOccupied({ position: { x, z }, size: definition.size });
    }

    setPreview((state) => (state.x === x && state.z === z && state.valid === valid && state.visible ? state : { visible: true, valid, x, z }));
  });

  if (!buildMode || !definition || !preview.visible) {
    return null;
  }

  const [width, depth] = definition.size;
  return (
    <mesh position={[preview.x + width / 2 - 0.5, definition.height / 2, preview.z + depth / 2 - 0.5]}>
      <boxGeometry args={[width, definition.height, depth]} />
      <meshBasicMaterial color={preview.valid ? '#5ef08d' : '#ff6b6b'} transparent opacity={0.35} />
    </mesh>
  );
}

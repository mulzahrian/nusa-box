import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBuildingStore } from '../../store/buildingStore';
import { BUILDING_INDEX, getBuildingDefinition } from './buildingConfig';

function BuildingInstances({ buildings, definition }) {
  const meshRef = useRef(null);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(definition.color), [definition.color]);

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }
    buildings.forEach((building, index) => {
      const [width, depth] = definition.size;
      temp.position.set(building.position.x + width / 2 - 0.5, definition.height / 2, building.position.z + depth / 2 - 0.5);
      temp.scale.set(width, definition.height, depth);
      temp.updateMatrix();
      meshRef.current.setMatrixAt(index, temp.matrix);
      meshRef.current.setColorAt(index, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [buildings, color, definition.height, definition.size, temp]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.8} />
    </instancedMesh>
  );
}

function ConstructionOverlays({ buildings, now }) {
  return (
    <group>
      {buildings.map((building) => {
        const definition = getBuildingDefinition(building.typeId || building.subType || building.type);
        if (!definition || building.status !== 'building') {
          return null;
        }
        const progress = Math.min(1, (now - (building.startedAt || now)) / (definition.buildTime * 1000));
        if (progress >= 1) {
          return null;
        }
        const [width, depth] = definition.size;
        const x = building.position.x + width / 2 - 0.5;
        const z = building.position.z + depth / 2 - 0.5;

        return (
          <group key={`${building.id}-overlay`} position={[x, definition.height + 0.55, z]}>
            <mesh>
              <boxGeometry args={[width, 0.12, 0.16]} />
              <meshBasicMaterial color="#2e2e2e" transparent opacity={0.8} />
            </mesh>
            <mesh position={[-width / 2 + (width * progress) / 2, 0.01, 0.01]}>
              <boxGeometry args={[Math.max(0.08, width * progress), 0.08, 0.12]} />
              <meshBasicMaterial color="#5ef08d" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function BuildingManager() {
  const buildings = useBuildingStore((state) => state.buildings);
  const refreshConstruction = useBuildingStore((state) => state.refreshConstruction);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshConstruction();
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(timer);
  }, [refreshConstruction]);

  const groupedBuildings = useMemo(() => {
    const groups = {};
    buildings.forEach((building) => {
      const typeId = building.typeId || building.subType || building.type;
      if (!BUILDING_INDEX[typeId]) {
        return;
      }
      groups[typeId] = groups[typeId] || [];
      groups[typeId].push(building);
    });
    return groups;
  }, [buildings]);

  return (
    <group>
      {Object.entries(groupedBuildings).map(([typeId, group]) => (
        <BuildingInstances key={typeId} buildings={group} definition={BUILDING_INDEX[typeId]} />
      ))}
      <ConstructionOverlays buildings={buildings} now={now} />
    </group>
  );
}

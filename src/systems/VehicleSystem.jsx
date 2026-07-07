import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import vehicleConfig from '../config/vehicleConfig';
import { getWorldConfig } from '../config/worldConfig';
import { useBuildingStore } from '../store/buildingStore';
import { useGameStore as useWorldStore } from '../store/gameStore';

const baseDensity = { pagi: 1.15, siang: 1, sore: 0.85, malam: 0.55, tengahMalam: 0.28 };
const domainCount = { ground: 8, water: 2, air: 1 };

const toPath = (road) => {
  const x = (road.position?.x ?? 0) - 64;
  const z = (road.position?.z ?? 0) - 64;
  return road.rotation % 180 === 0 ? [[x - 4, 0.35, z], [x + 4, 0.35, z]] : [[x, 0.35, z - 4], [x, 0.35, z + 4]];
};

const buildTraffic = (paths, dayPhase, weather) => {
  const weatherFactor = weather === 'hujan' ? 0.62 : 1;
  return Object.entries(paths).flatMap(([domain, items]) => {
    const configs = vehicleConfig.filter((entry) => entry.domain === domain && (entry.spawnCondition.phases ?? []).includes(dayPhase) && (entry.spawnCondition.weather ?? []).includes(weather));
    const count = Math.max(0, Math.round((domainCount[domain] ?? 1) * (baseDensity[dayPhase] ?? 1) * weatherFactor));
    return Array.from({ length: count }, (_, index) => ({
      id: `${domain}-${index}-${configs[index % Math.max(configs.length, 1)]?.id ?? 'fallback'}`,
      config: configs[index % Math.max(configs.length, 1)] ?? vehicleConfig[0],
      path: items[index % Math.max(items.length, 1)],
      progress: Math.random(),
    }));
  });
};

function Vehicle({ item }) {
  const ref = useRef(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(item.path.map((point) => new THREE.Vector3(...point))), [item.path]);
  const progress = useRef(item.progress);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }
    progress.current = (progress.current + item.config.speed * delta) % 1;
    const position = curve.getPointAt(progress.current);
    const nextPosition = curve.getPointAt((progress.current + 0.01) % 1);
    ref.current.position.copy(position);
    ref.current.lookAt(nextPosition);
  });

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={item.config.size ?? [1.4, 0.6, 0.9]} />
      <meshStandardMaterial color={item.config.color} />
    </mesh>
  );
}

export default function VehicleSystem() {
  const { currentMap, dayPhase, weather } = useWorldStore();
  const roads = useBuildingStore((state) => state.roads);
  const worldConfig = getWorldConfig(currentMap);
  const roadPaths = roads.length ? roads.slice(0, 14).map(toPath) : worldConfig.defaultRoadPaths.ground;
  const traffic = useMemo(
    () =>
      buildTraffic(
        {
          ground: roadPaths,
          water: worldConfig.defaultRoadPaths.water,
          air: worldConfig.defaultRoadPaths.air,
        },
        dayPhase,
        weather,
      ),
    [dayPhase, roadPaths, weather, worldConfig.defaultRoadPaths.air, worldConfig.defaultRoadPaths.water],
  );

  return traffic.map((item) => <Vehicle key={item.id} item={item} />);
}

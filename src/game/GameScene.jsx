import { OrthographicCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import CameraController from './CameraController';
import Buildings from './buildings/BuildingManager';
import BuildingPlacer from './buildings/BuildingPlacer';
import Terrain from './terrain/TerrainManager';
import DayNightSystem from '../systems/DayNightSystem';
import WeatherSystem from '../systems/WeatherSystem';
import VehicleSystem from '../systems/VehicleSystem';
import AnimalSystem from '../systems/AnimalSystem';
import EasterEggSystem from '../systems/EasterEggSystem';

const blend = (night, day, alpha) => night.map((value, index) => value + (day[index] - value) * alpha);

function SceneContent() {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const buildMode = useGameStore((state) => state.buildMode);
  const daylight = Math.max(0.15, Math.sin(timeOfDay * Math.PI));
  const sky = useMemo(() => blend([0.04, 0.06, 0.12], [0.69, 0.83, 0.96], daylight), [daylight]);
  const fog = useMemo(() => blend([0.05, 0.07, 0.12], [0.77, 0.88, 0.95], daylight), [daylight]);

  return (
    <>
      <color attach="background" args={sky} />
      <fog attach="fog" args={[fog, 95, 260]} />
      <gridHelper args={[512, 128, '#9ca3af', '#6b7280']} position={[0, 0.02, 0]} visible={buildMode} />
      <OrthographicCamera makeDefault near={0.1} far={500} zoom={28} position={[72, 72, 72]} />
      <CameraController />
      <DayNightSystem />
      <WeatherSystem />
      <Terrain />
      <Buildings />
      <VehicleSystem />
      <AnimalSystem />
      <EasterEggSystem />
      <BuildingPlacer />
    </>
  );
}

export default function GameScene() {
  return (
    <Canvas shadows orthographic dpr={[1, 1.5]} gl={{ antialias: true }}>
      <SceneContent />
    </Canvas>
  );
}

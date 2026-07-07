import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runEconomyTick } from './EconomySystem';
import { useGameStore as useWorldStore } from '../store/gameStore';

const keyframes = [
  { at: 0, ambient: '#2b3e63', ambientIntensity: 0.34, sun: '#597bd1', sunIntensity: 0.2, sky: '#071120' },
  { at: 0.25, ambient: '#ffd8b1', ambientIntensity: 0.68, sun: '#ffb567', sunIntensity: 1.05, sky: '#ffbf7a' },
  { at: 0.5, ambient: '#edf7ff', ambientIntensity: 0.92, sun: '#fff1b8', sunIntensity: 1.45, sky: '#87cefa' },
  { at: 0.72, ambient: '#ffcf9a', ambientIntensity: 0.72, sun: '#ff914d', sunIntensity: 1.15, sky: '#ee9a65' },
  { at: 0.87, ambient: '#6f88c7', ambientIntensity: 0.5, sun: '#8bbcff', sunIntensity: 0.4, sky: '#21416b' },
  { at: 1, ambient: '#24365c', ambientIntensity: 0.28, sun: '#496ab8', sunIntensity: 0.16, sky: '#060d18' },
];

const interpolateLighting = (timeOfDay) => {
  const endIndex = keyframes.findIndex((frame) => timeOfDay <= frame.at);
  const end = keyframes[endIndex === -1 ? keyframes.length - 1 : endIndex];
  const start = keyframes[Math.max(0, (endIndex === -1 ? keyframes.length : endIndex) - 1)];
  const alpha = THREE.MathUtils.clamp((timeOfDay - start.at) / Math.max(0.001, end.at - start.at), 0, 1);
  return {
    ambientColor: new THREE.Color(start.ambient).lerp(new THREE.Color(end.ambient), alpha),
    ambientIntensity: THREE.MathUtils.lerp(start.ambientIntensity, end.ambientIntensity, alpha),
    sunColor: new THREE.Color(start.sun).lerp(new THREE.Color(end.sun), alpha),
    sunIntensity: THREE.MathUtils.lerp(start.sunIntensity, end.sunIntensity, alpha),
    sky: new THREE.Color(start.sky).lerp(new THREE.Color(end.sky), alpha),
  };
};

export default function DayNightSystem({ minutesPerSecond = 12 }) {
  const { advanceTime, calendarDate, timeOfDay } = useWorldStore();
  const ambientRef = useRef(null);
  const sunRef = useRef(null);
  const { scene } = useThree();
  const lighting = useMemo(() => interpolateLighting(timeOfDay), [timeOfDay]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      advanceTime(minutesPerSecond);
      const world = useWorldStore.getState();
      runEconomyTick(`${world.calendarDate.day}-${world.calendarDate.month}-${world.calendarDate.year}`);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [advanceTime, minutesPerSecond]);

  useFrame((_, delta) => {
    const angle = timeOfDay * Math.PI * 2 - Math.PI / 2;
    const daylight = Math.max(0.16, Math.sin(angle) * 0.9 + 0.2);
    const targetPosition = new THREE.Vector3(Math.cos(angle) * 120, 18 + daylight * 62, Math.sin(angle) * 80);

    if (ambientRef.current) {
      ambientRef.current.color.lerp(lighting.ambientColor, delta * 2);
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, lighting.ambientIntensity, delta * 2);
    }

    if (sunRef.current) {
      sunRef.current.color.lerp(lighting.sunColor, delta * 2);
      sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, lighting.sunIntensity, delta * 2);
      sunRef.current.position.lerp(targetPosition, delta * 2);
    }

    scene.background = lighting.sky;
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.8} color="#ffffff" />
      <directionalLight ref={sunRef} castShadow intensity={1.2} color="#fff0b7" position={[40, 80, 12]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    </>
  );
}

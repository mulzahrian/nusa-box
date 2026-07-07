import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore as useWorldStore } from '../store/gameStore';

const dummy = new THREE.Object3D();

function RainField({ count = 120 }) {
  const meshRef = useRef(null);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(180),
        y: THREE.MathUtils.randFloat(6, 30),
        z: THREE.MathUtils.randFloatSpread(140),
        speed: THREE.MathUtils.randFloat(12, 22),
      })),
    [count],
  );

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    drops.forEach((drop, index) => {
      drop.y -= drop.speed * delta;
      if (drop.y < 0.4) {
        drop.y = THREE.MathUtils.randFloat(16, 30);
      }
      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.scale.set(0.12, 0.6, 0.12);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#b8d8ff" transparent opacity={0.65} />
    </instancedMesh>
  );
}

export default function WeatherSystem() {
  const { calendarDate, gameTime, weather, setWeather } = useWorldStore();
  const checkpointRef = useRef('');

  useEffect(() => {
    const checkpoint = `${calendarDate.day}-${gameTime.hour >= 12 ? 'pm' : 'am'}`;
    if (checkpointRef.current === checkpoint) {
      return;
    }

    checkpointRef.current = checkpoint;
    const nextWeather = Math.random() > 0.72 ? 'hujan' : 'cerah';
    setWeather(nextWeather);
  }, [calendarDate.day, gameTime.hour, setWeather]);

  return weather === 'hujan' ? <RainField /> : null;
}

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import easterEggConfig from '../config/easterEggConfig';
import { getWorldConfig } from '../config/worldConfig';
import { useGameStore as useWorldStore } from '../store/gameStore';

const isActive = (condition, hour, dayPhase) => {
  const phases = condition.phases ?? [];
  const phaseOk = !phases.length || phases.includes(dayPhase);
  const hourOk =
    (condition.startHour == null && condition.endHour == null) ||
    (hour >= (condition.startHour ?? 0) && hour < (condition.endHour ?? 24));
  return phaseOk && hourOk;
};

function EggActor({ egg, area }) {
  const ref = useRef(null);
  const center = useMemo(() => new THREE.Vector3(area.center[0], egg.behavior.height, area.center[2]), [area, egg.behavior.height]);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }
    const t = clock.elapsedTime * egg.behavior.speed;
    if (egg.behavior.pattern === 'circle') {
      ref.current.position.set(center.x + Math.cos(t) * egg.behavior.radius, center.y + Math.sin(t * 2) * 0.8, center.z + Math.sin(t) * egg.behavior.radius);
      ref.current.rotation.y += 0.01;
      return;
    }
    ref.current.position.set(center.x + Math.cos(t) * egg.behavior.radius, center.y + Math.sin(t * 3) * 0.3, center.z + Math.sin(t * 1.5) * egg.behavior.radius);
  });

  return (
    <mesh ref={ref}>
      {egg.type === 'ufo' ? <cylinderGeometry args={[1.2, 2, 0.55, 18]} /> : <boxGeometry args={[0.8, 1.5, 0.5]} />}
      <meshStandardMaterial color={egg.color} emissive={egg.color} emissiveIntensity={0.3} transparent opacity={0.86} />
    </mesh>
  );
}

export default function EasterEggSystem() {
  const { currentMap, dayPhase, gameTime } = useWorldStore();
  const areas = getWorldConfig(currentMap).biomeAreas;
  const activeEggs = useMemo(() => easterEggConfig.filter((egg) => isActive(egg.condition, gameTime.hour, dayPhase)), [dayPhase, gameTime.hour]);

  return activeEggs.map((egg) => <EggActor key={egg.id} area={areas[egg.areaKey]} egg={egg} />);
}

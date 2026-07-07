import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import animalConfig from '../config/animalConfig';
import { getWorldConfig } from '../config/worldConfig';
import { useGameStore as useWorldStore } from '../store/gameStore';

const randomPoint = (area) => new THREE.Vector3(area.center[0] + THREE.MathUtils.randFloatSpread(area.size[0]), 0.6, area.center[2] + THREE.MathUtils.randFloatSpread(area.size[1]));

function Animal({ config, area, seed }) {
  const ref = useRef(null);
  const target = useRef(randomPoint(area));
  const wait = useRef(seed);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    if (wait.current > 0) {
      wait.current -= delta;
      return;
    }

    const direction = target.current.clone().sub(ref.current.position);
    if (direction.length() < 1) {
      target.current = randomPoint(area);
      wait.current = THREE.MathUtils.randFloat(1, 3);
      return;
    }

    direction.normalize().multiplyScalar(config.speed * delta * 2);
    ref.current.position.add(direction);
    ref.current.lookAt(target.current.x, ref.current.position.y, target.current.z);
  });

  return (
    <mesh ref={ref} position={randomPoint(area)} castShadow>
      <boxGeometry args={config.size ?? [1.1, 0.9, 0.5]} />
      <meshStandardMaterial color={config.color} />
    </mesh>
  );
}

export default function AnimalSystem() {
  const currentMap = useWorldStore((state) => state.currentMap);
  const forest = getWorldConfig(currentMap).biomeAreas.forest;
  const animals = useMemo(
    () =>
      animalConfig.flatMap((config) =>
        Array.from({ length: config.spawnCount ?? 1 }, (_, index) => ({ id: `${config.id}-${index}`, config, seed: index * 0.35 })),
      ),
    [],
  );

  return animals.map((item) => <Animal key={item.id} area={forest} config={item.config} seed={item.seed} />);
}

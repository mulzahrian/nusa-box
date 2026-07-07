import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VEHICLE_COUNT = 24;

export default function Vehicles() {
  const meshRef = useRef(null);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const cars = useMemo(
    () =>
      Array.from({ length: VEHICLE_COUNT }, (_, index) => ({
        lane: index % 2 === 0 ? 'horizontal' : 'vertical',
        base: 12 + index * 6,
        offset: (index % 6) * 18,
        speed: 8 + (index % 5) * 2,
        color: new THREE.Color(index % 3 === 0 ? '#f97316' : index % 3 === 1 ? '#38bdf8' : '#facc15'),
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }
    const time = clock.getElapsedTime();
    cars.forEach((car, index) => {
      const travel = ((time * car.speed + car.offset) % 180) - 90;
      if (car.lane === 'horizontal') {
        temp.position.set(travel, 0.45, car.base);
        temp.rotation.set(0, 0, 0);
      } else {
        temp.position.set(car.base, 0.45, travel);
        temp.rotation.set(0, Math.PI / 2, 0);
      }
      temp.scale.set(0.9, 0.6, 1.6);
      temp.updateMatrix();
      meshRef.current.setMatrixAt(index, temp.matrix);
      meshRef.current.setColorAt(index, car.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, cars.length]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.6} />
    </instancedMesh>
  );
}

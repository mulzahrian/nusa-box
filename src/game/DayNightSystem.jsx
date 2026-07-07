import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

const lerp = (from, to, alpha) => from + (to - from) * alpha;

export default function DayNightSystem() {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const cycle = useMemo(() => {
    const dayStrength = Math.max(0.15, Math.sin(timeOfDay * Math.PI));
    return {
      dayStrength,
      sunHeight: lerp(18, 70, dayStrength),
      sunX: lerp(-110, 110, timeOfDay),
    };
  }, [timeOfDay]);

  return (
    <group>
      <mesh position={[cycle.sunX, cycle.sunHeight, -80]}>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color={cycle.dayStrength > 0.45 ? '#ffd166' : '#dbeafe'} toneMapped={false} />
      </mesh>
      <mesh position={[-cycle.sunX, 52 - cycle.sunHeight * 0.3, 90]}>
        <sphereGeometry args={[3.5, 20, 20]} />
        <meshBasicMaterial color="#b8c7ff" transparent opacity={1 - cycle.dayStrength * 0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

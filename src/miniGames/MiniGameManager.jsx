import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

const modules = import.meta.glob('./*.jsx', { eager: true });
const registry = Object.entries(modules).reduce((accumulator, [path, module]) => {
  const name = path.split('/').pop().replace('.jsx', '');
  if (name !== 'MiniGameManager' && module.default) {
    accumulator[name] = module.default;
  }
  return accumulator;
}, {});

export default function MiniGameManager() {
  const activeMiniGame = useUIStore((state) => state.activeMiniGame);
  const closeMiniGame = useUIStore((state) => state.closeMiniGame);
  const completeMiniGame = useGameStore((state) => state.completeMiniGame);
  const MiniGame = useMemo(() => (activeMiniGame ? registry[activeMiniGame.name] ?? registry.ExampleMiniGame : null), [activeMiniGame]);

  if (!activeMiniGame || !MiniGame) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'grid', placeItems: 'center', background: 'rgba(5, 8, 18, 0.82)' }}>
      <MiniGame
        {...activeMiniGame.props}
        onCancel={() => closeMiniGame()}
        onComplete={(success) => {
          if (success) {
            completeMiniGame(activeMiniGame.name);
          }
          closeMiniGame();
        }}
      />
    </div>
  );
}

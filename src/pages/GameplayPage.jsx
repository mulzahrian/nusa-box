import { useEffect } from 'react';
import BuildingBar from '../components/layout/BuildingBar';
import HUD from '../components/layout/HUD';
import PhoneUI from '../components/layout/PhoneUI';
import CutsceneOverlay from '../components/cutscene/CutsceneOverlay';
import MiniGameManager from '../miniGames/MiniGameManager';
import GameScene from '../components/game/GameScene';
import { startLevel } from '../levels/LevelManager';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

export default function GameplayPage() {
  const toggleBuildMenu = useUIStore((state) => state.toggleBuildMenu);
  const togglePhone = useUIStore((state) => state.togglePhone);
  const toggleMusic = useUIStore((state) => state.toggleMusic);
  const cutsceneVisible = useUIStore((state) => state.showCutscene);
  const setPage = useGameStore((state) => state.setPage);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);
  const togglePaused = useGameStore((state) => state.togglePaused);
  const currentMap = useGameStore((state) => state.currentMap);
  const currentLevel = useGameStore((state) => state.currentLevel);

  useEffect(() => {
    if (!currentLevel[currentMap]) {
      startLevel('sumatra-1');
    }
  }, [currentLevel, currentMap]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'b') toggleBuildMenu();
      if (key === 'p') togglePhone();
      if (key === 'm') toggleMusic();
      if (key === '1') setGameSpeed('1x');
      if (key === '2') setGameSpeed('2x');
      if (key === '3') setGameSpeed('3x');
      if (event.code === 'Space') {
        event.preventDefault();
        togglePaused();
      }
      if (key === 'escape' && !cutsceneVisible) setPage('menu');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cutsceneVisible, setGameSpeed, setPage, toggleBuildMenu, toggleMusic, togglePaused, togglePhone]);

  return (
    <main className="gameplay-page">
      <div className="gameplay-canvas">
        <GameScene />
      </div>

      <div className="gameplay-overlays">
        <HUD />
        <PhoneUI />
        <BuildingBar />
        <CutsceneOverlay />
        <MiniGameManager />
      </div>

      <aside className="pixel-panel gameplay-shortcuts">
        <p>Hotkeys</p>
        <ul>
          <li>B = Building Bar</li>
          <li>P = Phone</li>
          <li>M = Music</li>
          <li>1/2/3 = Speed</li>
          <li>Space = Pause</li>
          <li>Esc = Main Menu</li>
        </ul>
      </aside>
    </main>
  );
}

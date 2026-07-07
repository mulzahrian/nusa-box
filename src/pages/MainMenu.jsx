import './MainMenu.css';
import PixelButton from '../components/elements/PixelButton';
import CutsceneData from '../cutscene/CutsceneData';
import { startLevel } from '../levels/LevelManager';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

export default function MainMenu() {
  const setPage = useGameStore((state) => state.setPage);
  const isMusicOn = useUIStore((state) => state.musicEnabled);
  const toggleMusic = useUIStore((state) => state.toggleMusic);
  const addNotification = useUIStore((state) => state.addNotification);
  const setCutsceneData = useUIStore((state) => state.setCutsceneData);

  const startGame = (mode) => {
    if (mode === 'new') {
      startLevel('sumatra-1');
      setCutsceneData(CutsceneData.introSumatra);
      addNotification({
        title: 'NEW GAME',
        tone: 'success',
        message: 'Save baru dimulai di Sumatra.',
      });
    } else {
      setCutsceneData(null);
      addNotification({
        title: 'CONTINUE',
        tone: 'success',
        message: 'Save terakhir berhasil dimuat.',
      });
    }
    setPage('gameplay');
  };

  return (
    <main className="main-menu">
      <div className="main-menu__backdrop" data-asset="/img/bg/mainmenu.png" />
      <section className="pixel-panel main-menu__panel">
        <p className="main-menu__eyebrow">INDONESIAN CITY-BUILDING SANDBOX</p>
        <h1>NUSA BOX</h1>
        <p className="main-menu__tagline">
          Bangun kota kepulauan impianmu dengan gaya pixel yang hangat dan nostalgic.
        </p>

        <div className="main-menu__actions">
          <PixelButton icon="🎮" onClick={() => startGame('new')}>
            New Game
          </PixelButton>
          <PixelButton icon="💾" variant="secondary" onClick={() => startGame('continue')}>
            Continue
          </PixelButton>
          <PixelButton icon="🌐" variant="ghost" disabled>
            Multiplayer
          </PixelButton>
          <PixelButton icon="⚙️" variant="ghost" onClick={() => setPage('settings')}>
            Settings
          </PixelButton>
        </div>

        <div className="main-menu__footer pixel-card">
          <span>Music: {isMusicOn ? 'ON' : 'OFF'}</span>
          <PixelButton
            icon={isMusicOn ? '🔊' : '🔇'}
            size="tiny"
            variant="secondary"
            onClick={toggleMusic}
          >
            Toggle BGM
          </PixelButton>
        </div>
      </section>
    </main>
  );
}

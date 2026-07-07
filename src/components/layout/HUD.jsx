import './HUD.css';
import PixelButton from '../elements/PixelButton';
import ResourceBar from '../elements/ResourceBar';
import { useCitizenStore } from '../../store/citizenStore';
import { useEconomyStore } from '../../store/economyStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { completeLevel, getCurrentLevel } from '../../levels/LevelManager';

const speeds = ['1x', '2x', '3x'];
const pad = (value) => String(value).padStart(2, '0');

export default function HUD() {
  const { money, pollution } = useEconomyStore();
  const { population, happiness } = useCitizenStore();
  const {
    currentMap,
    gameTime,
    calendarDate,
    weather,
    gameSpeed,
    isPaused,
    setGameSpeed,
    togglePaused,
    setPage,
    completedMiniGames,
  } = useGameStore();
  const addNotification = useUIStore((state) => state.addNotification);
  const openMiniGame = useUIStore((state) => state.openMiniGame);
  const currentLevel = getCurrentLevel();

  const saveGame = () =>
    addNotification({ title: 'SAVE', tone: 'success', message: 'Data kota tersimpan ke save slot lokal.' });

  return (
    <header className="hud-shell">
      <div className="pixel-panel hud-topbar">
        <div className="hud-resource-grid">
          <ResourceBar icon="💰" label="Money" value={`Rp${money.toLocaleString('id-ID')}`} percent={82} />
          <ResourceBar icon="👥" label="Population" value={population.toLocaleString('id-ID')} percent={64} />
          <ResourceBar icon="😊" label="Happiness" value={`${happiness}%`} percent={happiness} />
          <ResourceBar icon="🏭" label="Pollution" value={`${pollution}%`} percent={pollution} />
        </div>

        <div className="hud-side-column">
          <div className="hud-meta pixel-card">
            <span>🕒 Jam: {pad(gameTime.hour)}:{pad(gameTime.minute)}</span>
            <span>📅 Tanggal: {pad(calendarDate.day)}/{pad(calendarDate.month)}/{calendarDate.year}</span>
            <span>⛅ Cuaca: {weather.charAt(0).toUpperCase() + weather.slice(1)}</span>
            <span>🎯 Level: {currentLevel?.levelNumber ?? '-'}</span>
          </div>
          <div className="hud-speed-row pixel-card">
            <PixelButton
              size="tiny"
              variant={isPaused ? 'secondary' : 'ghost'}
              onClick={togglePaused}
            >
              pause
            </PixelButton>
            {speeds.map((item) => (
              <PixelButton
                key={item}
                size="tiny"
                variant={!isPaused && gameSpeed === item ? 'secondary' : 'ghost'}
                onClick={() => {
                  setGameSpeed(item);
                  if (isPaused) togglePaused();
                }}
              >
                {item}
              </PixelButton>
            ))}
          </div>
        </div>
      </div>

      <div className="hud-bottom-row">
        <div className="pixel-panel hud-minimap">
          <div className="hud-minimap__map" />
          <span>Mini Map {currentMap.toUpperCase()}</span>
        </div>

        <div className="pixel-panel hud-actions">
          <PixelButton icon="💾" onClick={saveGame}>
            Save
          </PixelButton>
          <PixelButton icon="🕹️" variant="secondary" onClick={() => openMiniGame('ExampleMiniGame')}>
            Mini Game
          </PixelButton>
          <PixelButton
            icon="✅"
            variant="ghost"
            onClick={() => {
              const result = completeLevel();
              addNotification({
                title: 'LEVEL',
                tone: result?.complete ? 'success' : 'warning',
                message: result?.complete ? 'Level selesai! Reward sudah diberikan.' : 'Objektif level belum lengkap.',
              });
            }}
          >
            Check Level
          </PixelButton>
          <PixelButton icon="⚙️" variant="secondary" onClick={() => setPage('settings')}>
            Settings
          </PixelButton>
          <PixelButton icon="🚪" variant="danger" onClick={() => setPage('menu')}>
            Exit
          </PixelButton>
        </div>
      </div>
    </header>
  );
}

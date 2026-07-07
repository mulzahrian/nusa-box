import './Settings.css';
import PixelButton from '../components/elements/PixelButton';
import PixelSlider from '../components/elements/PixelSlider';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

const languages = [
  ['id', 'Indonesia'],
  ['en', 'English'],
];

export default function Settings() {
  const language = useUIStore((state) => state.language);
  const volume = useUIStore((state) => state.volume);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const setVolume = useUIStore((state) => state.setVolume);
  const setPage = useGameStore((state) => state.setPage);

  return (
    <main className="settings-page">
      <section className="pixel-panel settings-panel">
        <p className="settings-panel__eyebrow">PENGATURAN</p>
        <h1>Settings</h1>

        <div className="settings-panel__grid">
          <PixelSlider
            label="Music Volume"
            value={Math.round(volume.music * 100)}
            onChange={(value) => setVolume('music', value / 100)}
          />
          <PixelSlider
            label="SFX Volume"
            value={Math.round(volume.sfx * 100)}
            onChange={(value) => setVolume('sfx', value / 100)}
          />

          <label className="settings-select">
            <span>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {languages.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <PixelButton icon="↩️" variant="secondary" onClick={() => setPage('menu')}>
          Back
        </PixelButton>
      </section>
    </main>
  );
}

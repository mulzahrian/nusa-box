/**
 * Settings Panel
 */
import React from 'react';
import useSettingsStore from '@stores/useSettingsStore';

export default function SettingsPanel({ onClose }) {
  const lang = useSettingsStore(s => s.lang);
  const sound = useSettingsStore(s => s.sound);
  const musicVolume = useSettingsStore(s => s.musicVolume);
  const setLang = useSettingsStore(s => s.setLang);
  const toggleSound = useSettingsStore(s => s.toggleSound);
  const setMusicVolume = useSettingsStore(s => s.setMusicVolume);
  const t = useSettingsStore(s => s.t);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <h2>⚙️ {t('settings_title')}</h2>
        
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="label">{t('lang_label')}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              className={lang === 'id' ? 'active' : ''}
              onClick={() => setLang('id')}
            >
              🇮🇩 {t('lang_id')}
            </button>
            <button
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >
              🇬🇧 {t('lang_en')}
            </button>
          </div>
        </div>
        
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="label">{t('sound_label')}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={toggleSound}>
              {sound ? `🔊 ${t('sound_on')}` : `🔇 ${t('sound_off')}`}
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="label">Volume</div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={e => setMusicVolume(e.target.value / 100)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div className="close-row">
          <button onClick={onClose}>✕ {t('close')}</button>
        </div>
      </div>
    </div>
  );
}

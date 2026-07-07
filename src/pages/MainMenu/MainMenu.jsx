/**
 * Main Menu Page
 */
import React, { useEffect } from 'react';
import useUIStore from '@stores/useUIStore';
import useSettingsStore from '@stores/useSettingsStore';
import useGameStore from '@stores/useGameStore';
import audio from '@systems/AudioSystem';
import PixelButton from '@components/elements/PixelButton';
import SettingsPanel from '@components/fragments/SettingsPanel';

export default function MainMenu() {
  const setPage = useUIStore(s => s.setPage);
  const showSettings = useUIStore(s => s.showSettings);
  const toggleSettings = useUIStore(s => s.toggleSettings);
  const t = useSettingsStore(s => s.t);
  
  useEffect(() => {
    audio.playBGM('./music/bg/sound.mp3').catch(() => {});
  }, []);
  
  const handleNewGame = () => {
    useGameStore.getState().loadSnapshot({
      day: 1, month: 1, year: 2024,
      money: 320000, population: 0, happiness: 70,
      level: 1, missionLevel: 1, freeMode: false,
      mapId: 'sumatra', mapName: 'Sumatra',
      unlockedMaps: ['sumatra'], landSize: 20,
    });
    setPage('mapSelection');
  };
  
  const handleContinue = () => {
    const saved = localStorage.getItem('nusabox-save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        useGameStore.getState().loadSnapshot(data.game || {});
        setPage('game');
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
  };
  
  const hasSave = !!localStorage.getItem('nusabox-save');
  
  return (
    <div id="main-menu">
      <div id="menu-bg" />
      <div id="menu-bg-overlay" />
      <div id="menu-content">
        <h1 className="menu-logo">NUSA BOX</h1>
        <p className="menu-subtitle">{t('subtitle')}</p>
        <div className="menu-buttons">
          <PixelButton icon="mn_new" label={t('new_game')} onClick={handleNewGame} variant="primary" />
          <PixelButton icon="mn_continue" label={t('continue')} onClick={handleContinue} disabled={!hasSave} />
          <PixelButton icon="mn_sandbox" label={t('sandbox')} onClick={() => {
            useGameStore.getState().setFreeMode(true);
            setPage('mapSelection');
          }} />
          <PixelButton icon="mn_settings" label={t('settings')} onClick={toggleSettings} />
          <PixelButton icon="mn_multi" label={t('multi')} disabled />
        </div>
        <p className="menu-version">{t('version')}</p>
      </div>
      {showSettings && <SettingsPanel onClose={toggleSettings} />}
    </div>
  );
}

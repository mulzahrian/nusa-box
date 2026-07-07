/**
 * TopBar - resource stats, speed controls, menu buttons
 */
import React from 'react';
import useGameStore from '@stores/useGameStore';
import useUIStore from '@stores/useUIStore';
import useSettingsStore from '@stores/useSettingsStore';
import dayNight from '@systems/DayNightSystem';
import StatBar from '@components/elements/StatBar';
import { fmtMoney } from '@utils/helpers';

export default function TopBar() {
  const money = useGameStore(s => s.money);
  const population = useGameStore(s => s.population);
  const happiness = useGameStore(s => s.happiness);
  const pollution = useGameStore(s => s.pollution);
  const level = useGameStore(s => s.level);
  const speed = useGameStore(s => s.speed);
  const setSpeed = useGameStore(s => s.setSpeed);
  const day = useGameStore(s => s.day);
  const month = useGameStore(s => s.month);
  const year = useGameStore(s => s.year);
  
  const togglePhone = useUIStore(s => s.togglePhone);
  const toggleSettings = useUIStore(s => s.toggleSettings);
  const setPage = useUIStore(s => s.setPage);
  
  const handleSave = () => {
    const gameData = useGameStore.getState().getSnapshot();
    localStorage.setItem('nusabox-save', JSON.stringify({ game: gameData, savedAt: Date.now() }));
    useUIStore.getState().addNotification({ type: 'success', title: 'Game Saved', body: 'Progress saved!' });
  };
  
  return (
    <div id="top-bar">
      <StatBar icon="ic_money" label="$" value={fmtMoney(money)} status={money < 1000 ? 'bad' : 'good'} />
      <StatBar icon="ic_pop" label="Pop" value={population} />
      <StatBar icon="ic_happy" label="😊" value={`${happiness}%`} status={happiness < 40 ? 'bad' : happiness > 70 ? 'good' : ''} />
      <StatBar icon="ic_level" label="Lv" value={level} />
      <StatBar value={`${day}/${month}/${year}`} label="📅" />
      <StatBar value={dayNight.getTimeString()} label="🕐" />
      
      <div className="spacer" />
      
      <div className="speed-controls">
        <button className={speed === 0 ? 'active' : ''} onClick={() => setSpeed(0)}>⏸</button>
        <button className={speed === 1 ? 'active' : ''} onClick={() => setSpeed(1)}>▶</button>
        <button className={speed === 2 ? 'active' : ''} onClick={() => setSpeed(2)}>▶▶</button>
        <button className={speed === 3 ? 'active' : ''} onClick={() => setSpeed(3)}>▶▶▶</button>
      </div>
      
      <button className="menu-btn" onClick={() => togglePhone()}>📱</button>
      <button className="menu-btn" id="btn-save" onClick={handleSave}>💾</button>
      <button className="menu-btn" onClick={toggleSettings}>⚙</button>
      <button className="menu-btn" id="btn-menu" onClick={() => setPage('mainMenu')}>🏠</button>
    </div>
  );
}

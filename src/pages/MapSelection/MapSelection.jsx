/**
 * Map Selection Page - choose island to play
 */
import React from 'react';
import useUIStore from '@stores/useUIStore';
import useGameStore from '@stores/useGameStore';
import { MAP_IDS, MAP_NAMES } from '@core/constants';

const MAP_DESCRIPTIONS = {
  sumatra: 'Pantai, Laut, Gurun, Hutan',
  jawa: 'Hutan, Gunung, Pantai, Laut',
  kalimantan: 'Hutan Lebat, Pantai, Laut',
  sulawesi: 'Pantai, Laut, Hutan',
  papua: 'Pantai, Hutan, Gunung Salju',
};

const MAP_COLORS = {
  sumatra: '#ffcc00',
  jawa: '#00ff66',
  kalimantan: '#00ccff',
  sulawesi: '#ff66bb',
  papua: '#cc44ff',
};

export default function MapSelection() {
  const setPage = useUIStore(s => s.setPage);
  const unlockedMaps = useGameStore(s => s.unlockedMaps);
  const setMap = useGameStore(s => s.setMap);
  
  const handleSelect = (mapId) => {
    if (!unlockedMaps.includes(mapId)) return;
    setMap(mapId, MAP_NAMES[mapId]);
    setPage('game');
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 700 }}>
        <h2>🗺️ Pilih Pulau</h2>
        <p className="sub">Pilih daerah untuk memulai pembangunan</p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {MAP_IDS.map(id => {
            const locked = !unlockedMaps.includes(id);
            return (
              <div
                key={id}
                className={`card ${locked ? 'locked' : ''}`}
                style={{
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                  borderTopColor: MAP_COLORS[id],
                }}
                onClick={() => handleSelect(id)}
              >
                <div className="label">{locked ? '🔒' : '📍'} {MAP_NAMES[id]}</div>
                <div className="big" style={{ fontSize: 14, color: MAP_COLORS[id] }}>
                  {MAP_NAMES[id]}
                </div>
                <div className="delta">{MAP_DESCRIPTIONS[id]}</div>
              </div>
            );
          })}
        </div>
        <div className="close-row">
          <button onClick={() => setPage('mainMenu')}>← Kembali</button>
        </div>
      </div>
    </div>
  );
}

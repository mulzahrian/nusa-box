import './BuildingBar.css';
import { useMemo } from 'react';
import PixelButton from '../elements/PixelButton';
import { BUILDING_TYPES } from '../../game/buildings/buildingConfig';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

const categories = [
  ['house', '🏠 House'],
  ['factory', '🏭 Factory'],
  ['school', '🏫 School'],
  ['hospital', '🏥 Hospital'],
  ['office', '🏢 Office'],
  ['energy', '⚡ Energy'],
  ['station', '🚉 Station'],
  ['airport', '✈️ Airport'],
  ['port', '🚢 Port'],
  ['road', '🛣️ Road'],
  ['decoration', '🌳 Decoration'],
];

export default function BuildingBar() {
  const buildMode = useGameStore((state) => state.buildMode);
  const selectedBuildingId = useGameStore((state) => state.selectedBuildingId);
  const selectBuilding = useGameStore((state) => state.selectBuilding);
  const cancelBuild = useGameStore((state) => state.cancelBuild);
  const {
    showBuildMenu,
    selectedBuildCategory,
    setSelectedBuildCategory,
    toggleBuildMenu,
    addNotification,
  } = useUIStore();

  const activeCategory = BUILDING_TYPES[selectedBuildCategory] ? selectedBuildCategory : 'house';
  const items = useMemo(() => Object.values(BUILDING_TYPES[activeCategory] || {}), [activeCategory]);

  const chooseBuilding = (building) => {
    selectBuilding(building.id);
    addNotification({
      title: 'BUILD',
      tone: 'success',
      message: `Mode bangun: ${building.name} siap ditempatkan.`,
    });
  };

  const selectedBuilding = items.find((item) => item.id === selectedBuildingId);

  return (
    <aside className={`pixel-panel building-bar ${showBuildMenu ? 'is-open' : ''}`}>
      <div className="building-bar__header">
        <div>
          <strong>Panel Bangunan</strong>
          <p>
            {selectedBuilding
              ? `Terpilih: ${selectedBuilding.name}`
              : 'Pilih bangunan untuk ditempatkan.'}
          </p>
        </div>
        <div className="building-bar__controls">
          <PixelButton size="tiny" variant="ghost" onClick={toggleBuildMenu}>
            {showBuildMenu ? 'Hide' : 'Show'}
          </PixelButton>
          <PixelButton
            size="tiny"
            variant={buildMode ? 'secondary' : 'ghost'}
            onClick={buildMode ? cancelBuild : () => selectBuilding(selectedBuildingId || 'woodHouse')}
          >
            {buildMode ? 'Cancel Build' : 'Resume Build'}
          </PixelButton>
        </div>
      </div>

      <div className="building-bar__tabs">
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`building-bar__tab ${activeCategory === key ? 'is-active' : ''}`}
            onClick={() => setSelectedBuildCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="building-bar__grid">
        {items.map((building) => (
          <button
            key={building.id}
            type="button"
            className={`building-card ${selectedBuildingId === building.id ? 'is-active' : ''}`}
            onClick={() => chooseBuilding(building)}
          >
            <strong>{building.name}</strong>
            <span>Cost: Rp{building.cost.toLocaleString('id-ID')}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

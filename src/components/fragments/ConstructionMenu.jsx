/**
 * ConstructionMenu - building categories and items
 */
import React, { useState } from 'react';
import useUIStore from '@stores/useUIStore';
import useGameStore from '@stores/useGameStore';
import { BUILDINGS, CATEGORIES } from '@data/buildings';
import { getIconSrc } from '@data/icons';
import { fmtMoney } from '@utils/helpers';

export default function ConstructionMenu() {
  const [activeCategory, setActiveCategory] = useState('road');
  const selectedBuilding = useUIStore(s => s.selectedBuilding);
  const setSelectedBuilding = useUIStore(s => s.setSelectedBuilding);
  const money = useGameStore(s => s.money);
  
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const items = currentCat ? currentCat.items : [];
  
  const handleSelect = (buildingId) => {
    if (selectedBuilding === buildingId) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(buildingId);
    }
  };
  
  return (
    <div id="construction-menu">
      <div className="categories">
        {CATEGORIES.map(cat => {
          const iconSrc = getIconSrc(`cat_${cat.id}`, 16);
          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
            >
              {iconSrc && <img src={iconSrc} width={16} height={16} alt="" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
      <div className="items">
        {items.map(id => {
          const b = BUILDINGS[id];
          if (!b) return null;
          const iconSrc = getIconSrc(id, 32);
          const canAfford = money >= b.cost;
          return (
            <div
              key={id}
              className={`item ${selectedBuilding === id ? 'active' : ''} ${!canAfford ? 'locked' : ''}`}
              onClick={() => canAfford && handleSelect(id)}
            >
              <div className="icon">
                {iconSrc ? <img src={iconSrc} width={32} height={32} alt="" /> : '🏠'}
              </div>
              <div className="name">{b.name}</div>
              <div className="cost">${fmtMoney(b.cost)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

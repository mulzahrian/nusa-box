/**
 * Game Page - main gameplay view with Three.js canvas + UI overlay
 */
import React, { useEffect, useRef } from 'react';
import useGameStore from '@stores/useGameStore';
import useUIStore from '@stores/useUIStore';
import engine from '@core/Engine';
import terrain from '@core/Terrain';
import dayNight from '@systems/DayNightSystem';
import TopBar from '@components/fragments/TopBar';
import ConstructionMenu from '@components/fragments/ConstructionMenu';
import Minimap from '@components/fragments/Minimap';
import NotificationCenter from '@components/fragments/NotificationCenter';
import PhoneUI from '@components/fragments/PhoneUI';
import GameCanvas from './GameCanvas';

export default function GamePage() {
  const mapId = useGameStore(s => s.mapId);
  const showPhone = useUIStore(s => s.showPhone);
  
  useEffect(() => {
    // Apply biome when map changes
    const biome = terrain.applyBiome(mapId);
    if (biome) {
      dayNight.setBiomeTint(biome.skyColor, biome.fogColor);
    }
  }, [mapId]);
  
  return (
    <>
      <GameCanvas />
      <div id="ui-root">
        <TopBar />
        <ConstructionMenu />
        <Minimap />
        <NotificationCenter />
        {showPhone && <PhoneUI />}
      </div>
    </>
  );
}

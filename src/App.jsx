/**
 * Main App component - routes between pages
 */
import React from 'react';
import useUIStore from '@stores/useUIStore';
import MainMenu from '@pages/MainMenu/MainMenu';
import MapSelection from '@pages/MapSelection/MapSelection';
import GamePage from '@pages/Game/GamePage';

export default function App() {
  const currentPage = useUIStore(s => s.currentPage);
  
  switch (currentPage) {
    case 'mainMenu':
      return <MainMenu />;
    case 'mapSelection':
      return <MapSelection />;
    case 'game':
      return <GamePage />;
    default:
      return <MainMenu />;
  }
}

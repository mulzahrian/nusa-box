import { useMemo } from 'react';
import './App.css';
import Notification from './components/fragments/Notification';
import MainMenu from './pages/MainMenu';
import GameplayPage from './pages/GameplayPage';
import Settings from './pages/Settings';
import { useGameStore } from './store/gameStore';

const pages = {
  menu: <MainMenu />,
  gameplay: <GameplayPage />,
  settings: <Settings />,
};

function App() {
  const currentPage = useGameStore((state) => state.currentPage);
  const screen = useMemo(() => pages[currentPage] ?? pages.menu, [currentPage]);

  return (
    <div className="app-shell">
      {screen}
      <Notification />
    </div>
  );
}

export default App;

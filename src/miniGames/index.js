import QuizGame from './QuizGame.js';
import TapGame from './TapGame.js';

export const MINIGAME_ENGINES = {
  quiz: QuizGame,
  tap: TapGame,
};

export function launchMinigame(type, config, onWin, onClose) {
  const engine = MINIGAME_ENGINES[type];
  if (!engine) {
    console.warn('[minigame] unknown type:', type);
    return false;
  }
  engine.launch(config, onWin, onClose);
  return true;
}

export { QuizGame, TapGame };
export default MINIGAME_ENGINES;

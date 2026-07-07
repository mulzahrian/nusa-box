/**
 * Minigame registry
 * Each minigame is a self-contained module in this folder
 * To add a new minigame: create a new .js file and register it here
 * 
 * Minigame interface:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   start(container: HTMLElement): void,  // mount the minigame into DOM
 *   stop(): void,                          // cleanup
 *   onComplete: (callback) => void,        // call when player wins
 * }
 */

import QuizGame from './QuizGame';

const MINIGAMES = {
  quiz: QuizGame,
};

export function getMinigame(id) {
  return MINIGAMES[id] || null;
}

export function registerMinigame(id, gameModule) {
  MINIGAMES[id] = gameModule;
}

export default MINIGAMES;

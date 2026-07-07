/**
 * Save/Load system using localStorage
 */
import useGameStore from '@stores/useGameStore';
import usePersonalStore from '@stores/usePersonalStore';
import useRelationshipStore from '@stores/useRelationshipStore';
import useCalendarStore from '@stores/useCalendarStore';

const SAVE_KEY = 'nusabox-save';

export function saveGame() {
  const data = {
    game: useGameStore.getState().getSnapshot(),
    personal: usePersonalStore.getState().getSnapshot(),
    relationships: useRelationshipStore.getState().getSnapshot(),
    calendar: useCalendarStore.getState().getSnapshot(),
    savedAt: Date.now(),
    version: '1.0.0',
  };
  
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  return true;
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  
  try {
    const data = JSON.parse(raw);
    if (data.game) useGameStore.getState().loadSnapshot(data.game);
    if (data.personal) usePersonalStore.getState().loadSnapshot(data.personal);
    if (data.relationships) useRelationshipStore.getState().loadSnapshot(data.relationships);
    if (data.calendar) useCalendarStore.getState().loadSnapshot(data.calendar);
    return true;
  } catch (e) {
    console.error('Failed to load save:', e);
    return false;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

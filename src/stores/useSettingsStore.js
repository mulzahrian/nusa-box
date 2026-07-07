/**
 * Settings store - language, sound, etc.
 */
import { create } from 'zustand';
import { getLangString } from '@data/language';

const _loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('nusabox-settings') || '{}');
  } catch { return {}; }
};

const _saved = _loadSettings();

const useSettingsStore = create((set, get) => ({
  lang: _saved.lang || 'id',
  sound: _saved.sound !== false,
  musicVolume: _saved.musicVolume ?? 0.5,
  sfxVolume: _saved.sfxVolume ?? 0.7,
  
  setLang: (lang) => {
    set({ lang });
    localStorage.setItem('nusabox-settings', JSON.stringify(get()));
  },
  toggleSound: () => {
    set(s => ({ sound: !s.sound }));
    localStorage.setItem('nusabox-settings', JSON.stringify(get()));
  },
  setMusicVolume: (v) => {
    set({ musicVolume: v });
    localStorage.setItem('nusabox-settings', JSON.stringify(get()));
  },
  setSfxVolume: (v) => {
    set({ sfxVolume: v });
    localStorage.setItem('nusabox-settings', JSON.stringify(get()));
  },
  
  t: (key) => getLangString(key, get().lang),
}));

export default useSettingsStore;

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const createNotificationId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const validTabs = ['contacts', 'email', 'social', 'calendar'];
const validLanguages = ['id', 'en'];
const validCategories = [
  'house',
  'factory',
  'school',
  'hospital',
  'office',
  'energy',
  'station',
  'airport',
  'port',
  'road',
  'decoration',
];

export const useUIStore = create(
  persist(
    (set) => ({
      showPhone: false,
      phoneTab: 'contacts',
      showBuildMenu: true,
      selectedBuildCategory: 'house',
      showCutscene: false,
      cutsceneData: null,
      activeMiniGame: null,
      notifications: [],
      language: 'id',
      musicEnabled: true,
      volume: {
        music: 0.8,
        sfx: 0.8,
      },

      togglePhone: () => set((state) => ({ showPhone: !state.showPhone })),

      setPhoneTab: (phoneTab) =>
        set(() => ({
          phoneTab: validTabs.includes(phoneTab) ? phoneTab : 'contacts',
          showPhone: true,
        })),

      toggleBuildMenu: () => set((state) => ({ showBuildMenu: !state.showBuildMenu })),

      setSelectedBuildCategory: (selectedBuildCategory) =>
        set(() => ({
          selectedBuildCategory: validCategories.includes(selectedBuildCategory)
            ? selectedBuildCategory
            : 'house',
        })),

      toggleCutscene: () => set((state) => ({ showCutscene: !state.showCutscene })),
      setCutsceneVisible: (showCutscene) => set(() => ({ showCutscene: Boolean(showCutscene) })),
      setCutsceneData: (cutsceneData) =>
        set(() => ({
          cutsceneData,
          showCutscene: Boolean(cutsceneData),
        })),
      openMiniGame: (name, props = {}) => set(() => ({ activeMiniGame: { name, props } })),
      closeMiniGame: () => set(() => ({ activeMiniGame: null })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

      addNotification: (notification) =>
        set((state) => {
          const payload =
            typeof notification === 'string' ? { message: notification } : notification || {};
          return {
            notifications: [
              ...state.notifications,
              {
                id: createNotificationId(),
                type: payload.type || 'info',
                tone: payload.tone || payload.type || 'info',
                title: payload.title || 'NOTIFIKASI',
                message: payload.message || '',
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),

      clearNotifications: () => set(() => ({ notifications: [] })),

      setLanguage: (language) =>
        set(() => ({
          language: validLanguages.includes(language) ? language : 'id',
        })),

      setVolume: (channel, value) =>
        set((state) => ({
          volume: ['music', 'sfx'].includes(channel)
            ? {
                ...state.volume,
                [channel]: Math.min(1, Math.max(0, Number(value) || 0)),
              }
            : state.volume,
        })),

      resetUI: () =>
        set(() => ({
          showPhone: false,
          phoneTab: 'contacts',
          showBuildMenu: true,
          selectedBuildCategory: 'house',
          showCutscene: false,
          cutsceneData: null,
          activeMiniGame: null,
          notifications: [],
          language: 'id',
          musicEnabled: true,
          volume: { music: 0.8, sfx: 0.8 },
        })),
    }),
    {
      name: 'nusa-box-ui-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

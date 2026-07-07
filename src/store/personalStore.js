import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const clampStat = (value, max = 100) => Math.min(max, Math.max(0, Number(value) || 0));

export const usePersonalStore = create(
  persist(
    (set) => ({
      corruption: 0,
      personalMoney: 10000,
      personalHealth: 100,
      personalBusiness: [],

      addCorruption: (amount) =>
        set((state) => ({
          corruption: clampStat(state.corruption + (Number(amount) || 0)),
        })),

      updateHealth: (value) =>
        set(() => ({
          personalHealth: clampStat(value),
        })),

      updatePersonalMoney: (value) =>
        set(() => ({
          personalMoney: Math.max(0, Number(value) || 0),
        })),

      addBusiness: (business) =>
        set((state) => ({
          personalBusiness: business
            ? [
                ...state.personalBusiness,
                {
                  id: business.id || `biz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  ...business,
                },
              ]
            : state.personalBusiness,
        })),

      resetPersonalState: () =>
        set(() => ({
          corruption: 0,
          personalMoney: 10000,
          personalHealth: 100,
          personalBusiness: [],
        })),
    }),
    {
      name: 'nusa-box-personal-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

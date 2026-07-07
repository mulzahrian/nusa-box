/**
 * Personal state store (corruption, health, business, finances)
 */
import { create } from 'zustand';

const usePersonalStore = create((set, get) => ({
  corruption: 0,
  health: 100,
  personalMoney: 50000,
  business: [],
  
  addCorruption: (amount) => set(s => ({
    corruption: Math.min(100, s.corruption + amount)
  })),
  
  setHealth: (health) => set({ health }),
  
  addPersonalMoney: (amount) => set(s => ({
    personalMoney: s.personalMoney + amount
  })),
  
  addBusiness: (biz) => set(s => ({
    business: [...s.business, biz]
  })),
  
  getSnapshot: () => {
    const s = get();
    return {
      corruption: s.corruption,
      health: s.health,
      personalMoney: s.personalMoney,
      business: s.business,
    };
  },
  
  loadSnapshot: (data) => set(data),
}));

export default usePersonalStore;

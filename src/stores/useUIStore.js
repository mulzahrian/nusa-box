/**
 * UI state store - manages which panels/modals are open
 */
import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Current page/screen
  currentPage: 'mainMenu', // 'mainMenu' | 'mapSelection' | 'game'
  
  // Panels
  showSettings: false,
  showPhone: false,
  showEconomy: false,
  showDashboard: false,
  showInsideBuilding: null, // building data or null
  showCheatBox: false,
  
  // Construction
  selectedCategory: 'road',
  selectedBuilding: null,
  placeRotation: 0,
  
  // Notifications
  notifications: [],
  
  // Actions
  setPage: (page) => set({ currentPage: page }),
  
  toggleSettings: () => set(s => ({ showSettings: !s.showSettings })),
  togglePhone: () => set(s => ({ showPhone: !s.showPhone })),
  toggleEconomy: () => set(s => ({ showEconomy: !s.showEconomy })),
  toggleDashboard: () => set(s => ({ showDashboard: !s.showDashboard })),
  toggleCheatBox: () => set(s => ({ showCheatBox: !s.showCheatBox })),
  
  setInsideBuilding: (building) => set({ showInsideBuilding: building }),
  
  setCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedBuilding: (b) => set({ selectedBuilding: b }),
  rotateBuilding: () => set(s => ({ placeRotation: (s.placeRotation + 1) % 4 })),
  
  addNotification: (notif) => set(s => ({
    notifications: [
      { id: Date.now(), time: Date.now(), ...notif },
      ...s.notifications
    ].slice(0, 20)
  })),
  
  removeNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
}));

export default useUIStore;

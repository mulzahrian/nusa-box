/**
 * Calendar & Side Mission store
 */
import { create } from 'zustand';

const useCalendarStore = create((set, get) => ({
  calendarEvents: [],
  activeSideMissions: [],
  completedSideMissions: [],
  
  addEvent: (event) => set(s => ({
    calendarEvents: [...s.calendarEvents, { id: Date.now(), ...event }]
  })),
  
  activateSideMission: (mission) => set(s => ({
    activeSideMissions: [...s.activeSideMissions, { id: Date.now(), ...mission }]
  })),
  
  completeSideMission: (missionId) => set(s => {
    const mission = s.activeSideMissions.find(m => m.id === missionId);
    return {
      activeSideMissions: s.activeSideMissions.filter(m => m.id !== missionId),
      completedSideMissions: mission
        ? [...s.completedSideMissions, { ...mission, completedAt: Date.now() }]
        : s.completedSideMissions,
    };
  }),
  
  getEventsForDate: (day, month) => {
    return get().calendarEvents.filter(e => e.day === day && e.month === month);
  },
  
  getSnapshot: () => {
    const s = get();
    return {
      calendarEvents: s.calendarEvents,
      activeSideMissions: s.activeSideMissions,
      completedSideMissions: s.completedSideMissions,
    };
  },
  
  loadSnapshot: (data) => set(data),
}));

export default useCalendarStore;

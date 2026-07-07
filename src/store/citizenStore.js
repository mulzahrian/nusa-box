import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import socialPosts from '../config/socialPosts.json';

const clampStat = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const clampCount = (value) => Math.max(0, Math.round(Number(value) || 0));

const syncEmployment = (population, jobCapacity) => {
  const employed = Math.min(population, clampCount(jobCapacity));
  return {
    employed,
    unemployed: Math.max(0, population - employed),
  };
};

export const useCitizenStore = create(
  persist(
    (set, get) => ({
      population: 120,
      happiness: 72,
      health: 70,
      education: 65,
      employed: 80,
      unemployed: 40,
      housing: 180,
      housingCapacity: 180,
      jobCapacity: 100,
      foodSupply: 160,
      hospitalCapacity: 60,
      growthRate: 0.02,
      corruption: 12,
      completedLevels: 0,
      relationships: { president: 35, acel: 10, amil: 12, ica: 18, adin: 8 },
      contacts: [
        { id: 'president', name: 'The President', role: 'Mentor Nasional', relationship: 35 },
        { id: 'acel', name: 'Acel', role: 'Warga Licik', relationship: 10 },
        { id: 'amil', name: 'Amil', role: 'Koordinator Event', relationship: 12 },
        { id: 'ica', name: 'Ica', role: 'Koordinator Warga', relationship: 18 },
      ],
      emails: [
        { id: 'mail-1', sender: 'Kementerian', subject: 'Program Rumah Baru', preview: 'Bangun 3 rumah untuk bonus dana awal.' },
        { id: 'mail-2', sender: 'Komunitas Nelayan', subject: 'Akses Pelabuhan', preview: 'Warga pantai meminta akses pelabuhan kecil.' },
      ],
      socialPosts,
      calendarEvents: [
        { id: 'event-1', date: 'Hari 2', title: 'Pasar Malam Kampung', note: 'Naikkan happiness dengan dekorasi.' },
        { id: 'event-2', date: 'Hari 4', title: 'Inspeksi Presiden', note: 'Jaga ekonomi dan kebahagiaan warga.' },
      ],

      addCitizens: (amount) =>
        set((state) => {
          const incoming = clampCount(amount);
          const nextPopulation = Math.min(state.housingCapacity, state.population + incoming);
          return {
            population: nextPopulation,
            ...syncEmployment(nextPopulation, state.jobCapacity),
          };
        }),

      updateHappiness: (value) => set(() => ({ happiness: clampStat(value) })),

      updateHealth: (value) => set(() => ({ health: clampStat(value) })),

      updateEducation: (value) => set(() => ({ education: clampStat(value) })),

      setHousingCapacity: (value) =>
        set((state) => {
          const housingCapacity = clampCount(value);
          const population = Math.min(state.population, housingCapacity);
          return {
            housing: housingCapacity,
            housingCapacity,
            population,
            ...syncEmployment(population, state.jobCapacity),
          };
        }),

      setJobCapacity: (value) =>
        set((state) => {
          const jobCapacity = clampCount(value);
          return {
            jobCapacity,
            ...syncEmployment(state.population, jobCapacity),
          };
        }),

      setFoodSupply: (value) => set(() => ({ foodSupply: clampCount(value) })),

      setHospitalCapacity: (value) => set(() => ({ hospitalCapacity: clampCount(value) })),

      setGrowthRate: (value) => set(() => ({ growthRate: Math.max(-1, Number(value) || 0) })),
      setCompletedLevels: (completedLevels) => set(() => ({ completedLevels: clampCount(completedLevels) })),
      updateRelationship: (character, amount) =>
        set((state) => {
          const relationships = {
            ...state.relationships,
            [character]: clampStat((state.relationships[character] ?? 0) + amount),
          };
          return {
            relationships,
            contacts: state.contacts.map((contact) => ({
              ...contact,
              relationship: relationships[contact.id] ?? contact.relationship,
            })),
          };
        }),
      applyDailyGrowth: (populationGrowth, housing) =>
        set((state) => {
          const housingCapacity = Math.max(state.housingCapacity, clampCount(housing));
          const population = Math.max(
            0,
            Math.min(housingCapacity, state.population + Math.round(Number(populationGrowth) || 0)),
          );
          return {
            housing: housingCapacity,
            housingCapacity,
            population,
            happiness: clampStat(state.happiness + ((Number(populationGrowth) || 0) >= 0 ? 1 : -1)),
            ...syncEmployment(population, state.jobCapacity),
          };
        }),

      calculateGrowth: () => {
        const state = get();
        const foodRatio = state.population > 0 ? state.foodSupply / state.population : 1;
        const careRatio = state.population > 0 ? state.hospitalCapacity / state.population : 1;
        const housingRatio = state.population > 0 ? state.housingCapacity / state.population : 1;
        const qualityScore =
          state.happiness * 0.35 + state.health * 0.35 + state.education * 0.3;
        const resourceModifier =
          Math.min(foodRatio, 1.25) * 0.4 +
          Math.min(careRatio * 2, 1.25) * 0.3 +
          Math.min(housingRatio, 1.25) * 0.3;
        const adjustedRate = state.growthRate * (qualityScore / 100) * resourceModifier;
        const growth = Math.round(state.population * adjustedRate);

        set((current) => {
          const nextPopulation = Math.max(
            0,
            Math.min(current.housingCapacity, current.population + growth),
          );

          return {
            population: nextPopulation,
            ...syncEmployment(nextPopulation, current.jobCapacity),
          };
        });

        return growth;
      },

      resetCitizens: () =>
        set(() => ({
          population: 120,
          happiness: 72,
          health: 70,
          education: 65,
          employed: 80,
          unemployed: 40,
          housing: 180,
          housingCapacity: 180,
          jobCapacity: 100,
          foodSupply: 160,
          hospitalCapacity: 60,
          growthRate: 0.02,
          corruption: 12,
          completedLevels: 0,
          relationships: { president: 35, acel: 10, amil: 12, ica: 18, adin: 8 },
          contacts: [
            { id: 'president', name: 'The President', role: 'Mentor Nasional', relationship: 35 },
            { id: 'acel', name: 'Acel', role: 'Warga Licik', relationship: 10 },
            { id: 'amil', name: 'Amil', role: 'Koordinator Event', relationship: 12 },
            { id: 'ica', name: 'Ica', role: 'Koordinator Warga', relationship: 18 },
          ],
          emails: [
            { id: 'mail-1', sender: 'Kementerian', subject: 'Program Rumah Baru', preview: 'Bangun 3 rumah untuk bonus dana awal.' },
            { id: 'mail-2', sender: 'Komunitas Nelayan', subject: 'Akses Pelabuhan', preview: 'Warga pantai meminta akses pelabuhan kecil.' },
          ],
          socialPosts,
          calendarEvents: [
            { id: 'event-1', date: 'Hari 2', title: 'Pasar Malam Kampung', note: 'Naikkan happiness dengan dekorasi.' },
            { id: 'event-2', date: 'Hari 4', title: 'Inspeksi Presiden', note: 'Jaga ekonomi dan kebahagiaan warga.' },
          ],
        })),
    }),
    {
      name: 'nusa-box-citizen-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

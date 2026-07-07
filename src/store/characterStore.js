import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const clampRelationship = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const defaultCharacters = {
  thePresident: {
    name: 'The President',
    image: '/characters/sumatra/thePresident.png',
    relationship: 55,
    map: 'sumatra',
    location: 'Istana Lapangan Sumatra',
    dialogue: ['Bangun Sumatra dengan bijak, rakyat menunggu hasilmu.'],
  },
  pakWiwi: {
    name: 'Pak Wiwi',
    image: '/characters/sumatra/pakWiwi.png',
    relationship: 62,
    map: 'sumatra',
    location: 'Warung kopi pusat kota',
    dialogue: ['Jalan mulus dan pasar ramai itu tanda kota sehat.'],
  },
  acel: {
    name: 'Acel',
    image: '/characters/sumatra/acel.png',
    relationship: 48,
    map: 'sumatra',
    location: 'Terminal antarkota',
    dialogue: ['Transportasi lancar bikin warga betah kerja dan belanja.'],
  },
  amil: {
    name: 'Amil',
    image: '/characters/sumatra/amil.png',
    relationship: 50,
    map: 'sumatra',
    location: 'Kantor kecamatan',
    dialogue: ['Data penduduk rapi akan memudahkan semua kebijakanmu.'],
  },
  ica: {
    name: 'Ica',
    image: '/characters/sumatra/ica.png',
    relationship: 58,
    map: 'sumatra',
    location: 'Rumah sakit kota',
    dialogue: ['Pastikan layanan kesehatan cukup sebelum kota tumbuh terlalu cepat.'],
  },
  adin: {
    name: 'Adin',
    image: '/characters/sumatra/adin.png',
    relationship: 52,
    map: 'sumatra',
    location: 'Sekolah negeri',
    dialogue: ['Investasi pendidikan sekarang akan terasa besar nanti.'],
  },
};

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      characters: defaultCharacters,

      updateRelationship: (id, amount) =>
        set((state) => ({
          characters: state.characters[id]
            ? {
                ...state.characters,
                [id]: {
                  ...state.characters[id],
                  relationship: clampRelationship(state.characters[id].relationship + (Number(amount) || 0)),
                },
              }
            : state.characters,
        })),

      addCharacter: (id, character) =>
        set((state) => ({
          characters:
            id && character
              ? {
                  ...state.characters,
                  [id]: {
                    relationship: 50,
                    location: '',
                    dialogue: [],
                    image: '',
                    map: 'sumatra',
                    ...character,
                  },
                }
              : state.characters,
        })),

      getCharactersByMap: (mapId) =>
        Object.entries(get().characters)
          .filter(([, character]) => character.map === mapId)
          .map(([id, character]) => ({ id, ...character })),

      resetCharacters: () => set(() => ({ characters: defaultCharacters })),
    }),
    {
      name: 'nusa-box-character-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

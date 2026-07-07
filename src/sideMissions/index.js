/**
 * Side Missions index
 * Each side mission file exports an array of mission objects
 * 
 * Mission format:
 * {
 *   id: 'unique-id',
 *   title: 'Mission Title',
 *   description: 'What to do',
 *   trigger: {
 *     type: 'date' | 'level' | 'relationship' | 'always',
 *     day?: number, month?: number,
 *     level?: number,
 *     charId?: string, minRelation?: number,
 *   },
 *   objectives: [...],  // same as level objectives
 *   reward: { money?: number, relationship?: { charId, amount } },
 *   cutscene: { character, lines },
 * }
 */

const SIDE_MISSIONS = [
  {
    id: 'help_acel_01',
    title: 'Membantu Acel',
    description: 'Acel membutuhkan bantuan membersihkan rumahnya',
    mapId: 'sumatra',
    trigger: { type: 'level', level: 3 },
    objectives: [
      { type: 'money', min: 5000, label: 'Bayar $5.000 untuk membersihkan rumah' },
    ],
    reward: { relationship: { charId: 'acel', amount: 15 } },
    cutscene: {
      character: 'acel',
      lines: [
        'Hei Walikota! Rumah saya sudah rusak banget...',
        'Bisa tolong bayar untuk renovasi? Saya janji akan jaga!',
      ],
    },
  },
  {
    id: 'pak_wiwi_land',
    title: 'Tanah Pak Wiwi',
    description: 'Pak Wiwi menawarkan tanah tambahan',
    mapId: 'sumatra',
    trigger: { type: 'level', level: 5 },
    objectives: [
      { type: 'money', min: 50000, label: 'Bayar Pak Wiwi $50.000' },
    ],
    reward: { landExpand: 5, corruption: 10 },
    cutscene: {
      character: 'pak_wiwi',
      lines: [
        'Psst... Walikota, mau tanah tambahan?',
        'Bayar saya saja, tidak perlu birokrasi panjang!',
        '(Hati-hati: ini akan menambah index korupsi)',
      ],
    },
  },
];

export default SIDE_MISSIONS;

export function getSideMissionsForMap(mapId) {
  return SIDE_MISSIONS.filter(m => m.mapId === mapId);
}

/**
 * Relationship & Character store
 */
import { create } from 'zustand';

const DEFAULT_RELATIONSHIPS = {
  sumatra: {
    the_president: { name: 'The President', relation: 50, role: 'Penjelas Level' },
    pak_wiwi: { name: 'Pak Wiwi', relation: 30, role: 'Land Dealer' },
    acel: { name: 'Acel', relation: 20, role: 'Warga Kumuh' },
    amil: { name: 'Amil', relation: 40, role: 'Warga' },
    ica: { name: 'Ica', relation: 40, role: 'Warga' },
    adin: { name: 'Adin', relation: 40, role: 'Warga' },
  },
  jawa: {
    gubernur_jawa: { name: 'Gubernur Jawa', relation: 50, role: 'Penjelas Level' },
    pak_tejo: { name: 'Pak Tejo', relation: 30, role: 'Kontraktor' },
    siti: { name: 'Siti', relation: 40, role: 'Pengusaha' },
    budi: { name: 'Budi', relation: 35, role: 'Petani' },
    rani: { name: 'Rani', relation: 40, role: 'Guru' },
  },
  kalimantan: {
    kepala_adat: { name: 'Kepala Adat', relation: 50, role: 'Penjelas Level' },
    pak_dayak: { name: 'Pak Dayak', relation: 35, role: 'Pemimpin Suku' },
    rini: { name: 'Rini', relation: 40, role: 'Aktivis Lingkungan' },
    hasan: { name: 'Hasan', relation: 30, role: 'Penebang Kayu' },
  },
  sulawesi: {
    raja_bugis: { name: 'Raja Bugis', relation: 50, role: 'Penjelas Level' },
    daeng: { name: 'Daeng', relation: 35, role: 'Nelayan' },
    fatimah: { name: 'Fatimah', relation: 40, role: 'Pedagang' },
    arung: { name: 'Arung', relation: 30, role: 'Pelaut' },
  },
  papua: {
    tetua_papua: { name: 'Tetua Papua', relation: 50, role: 'Penjelas Level' },
    yohan: { name: 'Yohan', relation: 35, role: 'Guide Gunung' },
    mama_ros: { name: 'Mama Ros', relation: 40, role: 'Pedagang Noken' },
    tomas: { name: 'Tomas', relation: 30, role: 'Penambang' },
  },
};

const useRelationshipStore = create((set, get) => ({
  relationships: JSON.parse(JSON.stringify(DEFAULT_RELATIONSHIPS)),
  
  // Phone system
  emails: [],
  socialMedia: [],
  
  getRelation: (mapId, charId) => {
    const rels = get().relationships[mapId];
    return rels ? (rels[charId]?.relation || 0) : 0;
  },
  
  addRelation: (mapId, charId, amount) => set(s => {
    const rels = { ...s.relationships };
    if (rels[mapId] && rels[mapId][charId]) {
      rels[mapId] = { ...rels[mapId] };
      rels[mapId][charId] = { ...rels[mapId][charId] };
      rels[mapId][charId].relation = Math.max(0, Math.min(100,
        rels[mapId][charId].relation + amount
      ));
    }
    return { relationships: rels };
  }),
  
  getCharactersForMap: (mapId) => {
    return get().relationships[mapId] || {};
  },
  
  addEmail: (email) => set(s => ({
    emails: [{ id: Date.now(), read: false, ...email }, ...s.emails]
  })),
  
  addSocialPost: (post) => set(s => ({
    socialMedia: [{ id: Date.now(), ...post }, ...s.socialMedia].slice(0, 50)
  })),
  
  getSnapshot: () => {
    const s = get();
    return {
      relationships: s.relationships,
      emails: s.emails,
      socialMedia: s.socialMedia,
    };
  },
  
  loadSnapshot: (data) => set(data),
}));

export default useRelationshipStore;

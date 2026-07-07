/**
 * Internationalization / Language strings
 */

const LANG = {
  en: {
    new_game: 'New Game',       continue: 'Continue',
    sandbox: 'Sandbox Mode',    scenario: 'Scenario Mode',
    multi: 'Multiplayer',       settings: 'Settings',
    settings_title: 'Settings',
    lang_label: 'Language',     lang_en: 'English', lang_id: 'Indonesian',
    sound_label: 'Sound',       sound_on: 'On',     sound_off: 'Off',
    close: 'Close',
    version: 'v1.0 -- Alpha',
    subtitle: 'Sandbox City Builder',
    // Game UI
    money: 'Money',
    population: 'Population',
    happiness: 'Happiness',
    pollution: 'Pollution',
    traffic: 'Traffic',
    level: 'Level',
    day: 'Day',
    save: 'Save',
    menu: 'Menu',
    build: 'Build',
    roads: 'Roads',
    housing: 'Housing',
    commerce: 'Commerce',
    industry: 'Industry',
    utilities: 'Utilities',
    public: 'Public',
    transit: 'Transit',
    tools: 'Tools',
  },
  id: {
    new_game: 'Game Baru',      continue: 'Lanjutkan',
    sandbox: 'Mode Bebas',      scenario: 'Mode Skenario',
    multi: 'Multipemain',       settings: 'Pengaturan',
    settings_title: 'Pengaturan',
    lang_label: 'Bahasa',       lang_en: 'Inggris',  lang_id: 'Indonesia',
    sound_label: 'Suara',       sound_on: 'Aktif',   sound_off: 'Nonaktif',
    close: 'Tutup',
    version: 'v1.0 -- Alfa',
    subtitle: 'Pembangun Kota Sandbox',
    // Game UI
    money: 'Uang',
    population: 'Populasi',
    happiness: 'Kebahagiaan',
    pollution: 'Polusi',
    traffic: 'Lalu Lintas',
    level: 'Level',
    day: 'Hari',
    save: 'Simpan',
    menu: 'Menu',
    build: 'Bangun',
    roads: 'Jalan',
    housing: 'Perumahan',
    commerce: 'Perdagangan',
    industry: 'Industri',
    utilities: 'Utilitas',
    public: 'Publik',
    transit: 'Transit',
    tools: 'Alat',
  },
};

export default LANG;

export function getLangString(key, lang = 'id') {
  return (LANG[lang] || LANG.id)[key] || key;
}

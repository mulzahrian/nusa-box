/**
 * Level/Mission data for Sumatra
 * Add more levels by simply adding objects to this array
 * 
 * Objective types:
 * - population: { type:'population', min:50 }
 * - money: { type:'money', min:200000 }
 * - happiness: { type:'happiness', min:60 }
 * - roads: { type:'roads', min:5 }
 * - btype: { type:'btype', btype:'school', min:1 }
 * - btypes: { type:'btypes', btypes:['res_low','res_med'], min:3 }
 * - jobs: { type:'jobs', min:100 }
 * - relationship: { type:'relationship', charId:'pak_wiwi', min:60 }
 * - minigame: { type:'minigame', gameId:'quiz' }
 */

const SUMATRA_LEVELS = [
  {
    num: 1, name: 'Memulai Nusabox', reward: 10000,
    objectives: [
      { type: 'roads', min: 5, label: 'Bangun 5 Jalan' },
      { type: 'btypes', btypes: ['res_low', 'res_med', 'res_high'], min: 3, label: 'Bangun 3 Rumah' },
    ],
    cutscene: {
      character: 'the_president',
      characterImage: './img/char/char_example.png',
      lines: [
        'Selamat datang, Walikota baru!\nSaya Presiden Nusabox yang... tidak becus.',
        'Ya, saya akui. Saya TIDAK BECUS mengurus\nkota ini sendiri. Makanya kamu dipanggil!',
        'Mulailah dengan membangun JALAN\ndan beberapa RUMAH untuk warga.',
        'Semoga kamu lebih pintar dari saya...\nYang mana tidak sulit sama sekali.',
      ],
    },
  },
  {
    num: 2, name: 'Warga Pertama', reward: 15000,
    objectives: [
      { type: 'population', min: 50, label: '50 Penduduk' },
      { type: 'btypes', btypes: ['res_low', 'res_med', 'res_high'], min: 5, label: 'Bangun 5 Rumah' },
    ],
    cutscene: {
      character: 'the_president',
      lines: [
        'Bagus! Tapi kota ini masih kosong melompong.',
        'Tambah rumah lebih banyak\ndan ajak 50 warga untuk pindah ke sini.',
      ],
    },
  },
  {
    num: 3, name: 'Cahaya Kota', reward: 20000,
    objectives: [
      { type: 'btypes', btypes: ['power_coal', 'power_solar', 'power_wind'], min: 1, label: 'Bangun 1 Pembangkit Listrik' },
      { type: 'population', min: 100, label: '100 Penduduk' },
    ],
    cutscene: {
      character: 'the_president',
      lines: [
        'Lampu di istana saya sering mati...',
        'Bangunlah PEMBANGKIT LISTRIK agar\nkota ini tidak gelap gulita.',
      ],
    },
  },
  {
    num: 4, name: 'Air Kehidupan', reward: 20000,
    objectives: [
      { type: 'btype', btype: 'water_pump', min: 1, label: 'Bangun 1 Water Pump' },
      { type: 'population', min: 200, label: '200 Penduduk' },
    ],
    cutscene: { character: 'the_president', lines: ['Bangunlah MENARA AIR agar warga\ntidak dehidrasi.'] },
  },
  {
    num: 5, name: 'Kota Bahagia', reward: 25000,
    objectives: [
      { type: 'btypes', btypes: ['park', 'com_mall'], min: 2, label: 'Bangun 2 Taman/Mall' },
      { type: 'happiness', min: 50, label: 'Kebahagiaan 50%' },
      { type: 'population', min: 300, label: '300 Penduduk' },
    ],
    cutscene: { character: 'the_president', lines: ['Bangunlah TAMAN atau MALL\nagar warga bahagia.'] },
  },
  { num: 6, name: 'Roda Ekonomi', reward: 30000, objectives: [{ type: 'btype', btype: 'com_shop', min: 3, label: '3 Toko' }, { type: 'population', min: 400, label: '400 Penduduk' }], cutscene: { character: 'the_president', lines: ['Saatnya bangun TOKO dan SPBU!'] } },
  { num: 7, name: 'Keamanan Kota', reward: 35000, objectives: [{ type: 'btype', btype: 'police', min: 1, label: '1 Kantor Polisi' }, { type: 'population', min: 500, label: '500 Penduduk' }], cutscene: { character: 'the_president', lines: ['Bangunlah KANTOR POLISI!'] } },
  { num: 8, name: 'Generasi Pintar', reward: 35000, objectives: [{ type: 'btype', btype: 'school', min: 1, label: '1 Sekolah' }, { type: 'population', min: 700, label: '700 Penduduk' }], cutscene: { character: 'the_president', lines: ['Bangunlah SEKOLAH!'] } },
  { num: 9, name: 'Industri Bangkit', reward: 40000, objectives: [{ type: 'btype', btype: 'ind_factory', min: 2, label: '2 Pabrik' }, { type: 'jobs', min: 100, label: '100 Lapangan Kerja' }], cutscene: { character: 'the_president', lines: ['Bangunlah PABRIK!'] } },
  { num: 10, name: 'Kota Seribu Jiwa', reward: 75000, objectives: [{ type: 'population', min: 1000, label: '1.000 Penduduk' }, { type: 'money', min: 200000, label: '$200.000' }, { type: 'happiness', min: 60, label: 'Kebahagiaan 60%' }], cutscene: { character: 'the_president', lines: ['Seribu jiwa! Luar biasa!'] } },
  { num: 11, name: 'Pelayanan Kesehatan', reward: 45000, objectives: [{ type: 'btype', btype: 'hospital', min: 1, label: '1 Rumah Sakit' }, { type: 'population', min: 1500, label: '1.500 Penduduk' }], cutscene: { character: 'the_president', lines: ['Bangunlah RUMAH SAKIT!'] } },
  { num: 12, name: 'Transportasi Publik', reward: 50000, objectives: [{ type: 'btype', btype: 'bus_stop', min: 3, label: '3 Halte Bus' }, { type: 'population', min: 2000, label: '2.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Saatnya transportasi publik!'] } },
  { num: 13, name: 'Gedung Pencakar', reward: 60000, objectives: [{ type: 'btypes', btypes: ['skyscraper', 'skyscraper2', 'skyscraper3'], min: 1, label: '1 Gedung Pencakar Langit' }, { type: 'population', min: 3000, label: '3.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Gedung pencakar langit pertama!'] } },
  { num: 14, name: 'Metro Kota', reward: 70000, objectives: [{ type: 'btype', btype: 'metro', min: 1, label: '1 Stasiun Metro' }, { type: 'population', min: 4000, label: '4.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Bangun stasiun metro!'] } },
  { num: 15, name: 'Kota Menengah', reward: 80000, objectives: [{ type: 'population', min: 5000, label: '5.000 Penduduk' }, { type: 'happiness', min: 65, label: 'Kebahagiaan 65%' }], cutscene: { character: 'the_president', lines: ['Setengah jalan! Terus maju!'] } },
  { num: 16, name: 'Energi Hijau', reward: 60000, objectives: [{ type: 'btypes', btypes: ['power_solar', 'power_wind'], min: 3, label: '3 Energi Terbarukan' }], cutscene: { character: 'the_president', lines: ['Saatnya go green!'] } },
  { num: 17, name: 'Pusat Keuangan', reward: 90000, objectives: [{ type: 'btype', btype: 'bank', min: 2, label: '2 Bank' }, { type: 'money', min: 500000, label: '$500.000' }], cutscene: { character: 'the_president', lines: ['Bangun pusat keuangan!'] } },
  { num: 18, name: 'Kota Besar', reward: 100000, objectives: [{ type: 'population', min: 8000, label: '8.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Kota semakin besar!'] } },
  { num: 19, name: 'Hubungan Baik', reward: 50000, objectives: [{ type: 'relationship', charId: 'pak_wiwi', min: 60, label: 'Hubungan Pak Wiwi 60+' }], cutscene: { character: 'pak_wiwi', lines: ['Halo walikota! Ayo jalin hubungan baik!'] } },
  { num: 20, name: 'Bandara Internasional', reward: 150000, objectives: [{ type: 'btype', btype: 'airport', min: 1, label: '1 Bandara' }, { type: 'population', min: 10000, label: '10.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['BANDARA! Kita bisa terbang ke pulau lain!'] } },
  { num: 21, name: 'Ekspansi Tanah', reward: 80000, objectives: [{ type: 'population', min: 12000, label: '12.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Perluas wilayah kita!'] } },
  { num: 22, name: 'Kota Sejahtera', reward: 90000, objectives: [{ type: 'happiness', min: 75, label: 'Kebahagiaan 75%' }, { type: 'population', min: 14000, label: '14.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['Kota yang sejahtera!'] } },
  { num: 23, name: 'Mega Mall', reward: 100000, objectives: [{ type: 'btype', btype: 'com_mall', min: 3, label: '3 Mall' }], cutscene: { character: 'the_president', lines: ['Mall di mana-mana!'] } },
  { num: 24, name: 'Kota Industri', reward: 110000, objectives: [{ type: 'btype', btype: 'ind_factory', min: 5, label: '5 Pabrik' }, { type: 'jobs', min: 500, label: '500 Lapangan Kerja' }], cutscene: { character: 'the_president', lines: ['Industri maju!'] } },
  { num: 25, name: 'Smart City', reward: 120000, objectives: [{ type: 'btype', btype: 'school', min: 3, label: '3 Sekolah' }, { type: 'btype', btype: 'hospital', min: 2, label: '2 RS' }], cutscene: { character: 'the_president', lines: ['Menuju kota pintar!'] } },
  { num: 26, name: 'Triple Towers', reward: 130000, objectives: [{ type: 'btypes', btypes: ['skyscraper', 'skyscraper2', 'skyscraper3'], min: 5, label: '5 Gedung Pencakar' }], cutscene: { character: 'the_president', lines: ['Skyline yang indah!'] } },
  { num: 27, name: 'Kota 20 Ribu', reward: 150000, objectives: [{ type: 'population', min: 20000, label: '20.000 Penduduk' }], cutscene: { character: 'the_president', lines: ['20 ribu! Wow!'] } },
  { num: 28, name: 'Polusi Rendah', reward: 100000, objectives: [{ type: 'happiness', min: 80, label: 'Kebahagiaan 80%' }], cutscene: { character: 'the_president', lines: ['Jaga polusi tetap rendah!'] } },
  { num: 29, name: 'Kota Impian', reward: 200000, objectives: [{ type: 'population', min: 30000, label: '30.000 Penduduk' }, { type: 'money', min: 1000000, label: '$1.000.000' }], cutscene: { character: 'the_president', lines: ['Hampir sampai puncak!'] } },
  { num: 30, name: 'Sumatra Jaya', reward: 500000, objectives: [{ type: 'population', min: 50000, label: '50.000 Penduduk' }, { type: 'happiness', min: 85, label: 'Kebahagiaan 85%' }], cutscene: { character: 'the_president', lines: ['SELAMAT! Sumatra telah menjadi\nkota metropolitan yang luar biasa!', 'Kamu jauh, JAUH lebih baik dari saya!'] } },
];

export default SUMATRA_LEVELS;

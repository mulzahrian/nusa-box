const CutsceneData = {
  introSumatra: {
    id: 'introSumatra',
    scenes: [
      {
        character: 'The President',
        position: 'left',
        text: 'Selamat datang, walikota baru. Sumatra menunggumu untuk berubah dari wilayah sederhana menjadi kota yang hidup.',
      },
      {
        character: 'The President',
        position: 'left',
        text: 'Bangun rumah, jaga ekonomi, dan pimpin rakyat dengan hati. Setiap level akan membuka pelajaran baru untukmu.',
        choices: [{ label: 'Saya siap.', nextSceneIndex: 2 }],
      },
      {
        character: 'Sekretaris Negara',
        position: 'right',
        text: 'Level pertama: bangun 3 rumah dan raih 15 populasi. Setelah itu, fasilitas baru akan terbuka.',
      },
    ],
  },
  sumatraLevel1Start: {
    id: 'sumatraLevel1Start',
    scenes: [{ character: 'The President', position: 'left', text: 'Mulailah dari dasar. Rakyat butuh rumah dan tanda bahwa perubahan benar-benar dimulai.' }],
  },
  sumatraLevel1End: {
    id: 'sumatraLevel1End',
    scenes: [{ character: 'The President', position: 'left', text: 'Kerja bagus. Kini kota kecil ini punya pondasi untuk tumbuh lebih besar.' }],
  },
  sumatraLevel2Start: {
    id: 'sumatraLevel2Start',
    scenes: [{ character: 'The President', position: 'left', text: 'Saatnya usaha rakyat bergerak. Tambah bisnis dan jaga kas daerah tetap positif.' }],
  },
  sumatraLevel3Start: {
    id: 'sumatraLevel3Start',
    scenes: [{ character: 'Pak Wiwi', position: 'right', text: 'Pesisir ramai kalau pelabuhan hidup. Kita perlu koneksi ke laut.' }],
  },
  sumatraLevel4Start: {
    id: 'sumatraLevel4Start',
    scenes: [{ character: 'Ica', position: 'right', text: 'Warga ingin sekolah, klinik, dan rasa aman. Ayo bangun layanan kota.' }],
  },
  sumatraLevel5Start: {
    id: 'sumatraLevel5Start',
    scenes: [{ character: 'The President', position: 'left', text: 'Bandara akan membuka Sumatra ke pulau lain. Ini tanda kota mulai naik kelas.' }],
  },
  sideMissionCleanup: {
    id: 'sideMissionCleanup',
    scenes: [{ character: 'Acel', position: 'right', text: 'Ada rumah dekat hutan yang kotor. Bantu bersihkan, warga bakal senang.' }],
  },
  sideMissionFestival: {
    id: 'sideMissionFestival',
    scenes: [{ character: 'Amil', position: 'right', text: 'Bagaimana kalau kita gelar festival sore? Itu bisa menaikkan hubungan dengan warga.' }],
  },
};

export default CutsceneData;

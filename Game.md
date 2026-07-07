# Nusa Box

### Overview 
ini adalah game sandbox city building dengan ada konsep cutscene visual novelnya jadi ada ceritanya untuk setiap level,dan side event, ceritanya
dimulai dengan seorang yang baru diangkat menjadi walikota di kota kumuh dan terbelakang,dan dipenuhi denga hutan tak terawat dan hanya punya 
beberapa warga saja.

### Konsep game :
jadi untuk konsepnya adalah kita disuruh membangun ulang suatu daerah akan ada 5 map ini di tempat yang berbeda dengan besar grid 1000x1000 setiap map dab ini masih bisa di expand lagi besar gridnya dengan menambah gridnya, dan untuk pertama kali kita main besar daerah akan kecil dulu lalu setiap level akan makin besar mapnya sampai semua map terbuka, dan kita bisa menambah grid di map kita sekarang, atau pindah ke tempat lain lagi karna ingat akan ada 5 tempat yang berbeda dan 1 tempat punya map sebenar 1000x1000 grid, tugas kita adalah untuk membangun kota dan di kasi level level jadi perumahan,kota,gedung,rumah sakit dan lain lain akan terbuka seiring level bertamabah untuk 1 map akan ada 30 level.
setiap level akan di jelaskan dengan cutscene seperti visual novel begitu, begitu juga dengan side story dan lain lain

### Konsep cutscene
akan ada text box lalu karakter akan berbicara disitu,dan akan ada karakter.png,kita bisa memasukkan background juga tetapi kalo tidak ada background pakai background gameplay game saja.

### Stack :
game ini akan di buat untuk web base :
- Three.js
- vite
- react
- javascript
- Zustand atau Redux (kalau pakai React) buat state kota (populasi, uang, dsb)
- Simpan state kota ke localStorage / IndexedDB buat save game di browser

### Menu : (Konsep Menunya setiap button nya selain tulisan ada iconnya juga terus ada musicnya juga bisa)
New Game -> ini untuk pertama kali main atau mau main game baru
Countinue -> untuk melanjutkan game sebelumnya
multiplayer -> untuk sementara di lock dulu
Setting - > didalam setting ada pengaturan untuk besar dan kecilkan suara, dan ubah Bahasa ke [inggris dan Indonesia]

### GamePlay
- di awal game akan muncul map ,gambar map, dengan icon lokasi, 
#### lokasinya adalah
- Sumatra [map pertama yang dibuka]
- jawa
- Kalimantan
- Sulawesi
- papua
setiap lokasi punya besar map 1000x1000 besar gridnya.
lalu akan muncul karakter the president menjelaskan overview game
lalu dia juga akan menjelaskan setiap level
lalu kita akan membangun kota sesuai setiap level,
jika kita sudah menyelesakan level di suatu lokasi maka kita akan mempunyai kebebasan dalam membangun daerah itu terserah kita.
jadi level itu seperti pembelajaran untuk kita tentang fitur yang ada di game kita terutama untuk daerah itu
saya juga ingin setiap lokasi mempunyai perbedaan design map

### konsep map,
untuk setiap map bikinlah banyak biomanya,
ada dataran,lautan dengan pantai,dan hutan dan lain lain saya akan jelaskan di di Bawah :
- Sumatra [pantain,laut,gurun(ada bukit gurun juga),hutan]
- jawa [hutan(ada gunungnya juga),pantai laut]
- Kalimantan [pantain,laut,gurun(ada bukit gurun juga),tapi paling banyak hutan]
- Sulawesi (kebanyakan pantai,danhutan)
- papua (kebanyakan pantai dan hutan tetapi ada daerah special dengan gunung tinggi dan dearah ini bersalju)


### Level
- untuk setiap daerah kamu bisa bikin 30 level tersendiri (contoh bangun 5 rumah dan dapatkan 30 populasi)
- saya juga ingin level ini kamu masukkan aja ke json file sehingga nanti jika saya ingin menambah level sendiri dan untuk object apa bisa di set juga di codingannya jadi saya tinggal ubah ubah saja misalnya objectnya harus ini atau object modelnya di ganti atau harus mendapatkan uang segini
atau harus membuat hubungan baik dengan karakter ini jadi bisa set sendiri level gamenya atau bisa juga nanti harus selesaikan minigame apa jadi bisa di set juga, jadi intinya leveling ini saya bisa bikin interaktif dan bebas dari saya sebagai developer dengan mudah, disini juga saya bisa ganti karater .png atau model .glb atau action actionya terserah saya untuk cerita levelnya

### side mission 
- sama seperti level saya bebas membuat side mission apa,nanti saya akan membuat system calender juga di game jadi saya bisa masukkan side misson untuk tanggal tertentu jadi Waktu memaikan game lebih seru lagi, saya sebagai developer juga pengen mempunyai kebabasan membangun side mission, misalnya juga ada side mission yang bisa di set muncul di tanggal berapa atau setelah kamu  berhubungan dengan karater mana atau setelah menyeslesaikan level mana buatlah saya bisa mudah membuat side missionnya juga jadi saya codingnya gampang disini juga saya bisa ganti karater .png atau model .glb atau action actionya terserah saya untuk cerita levelnya

### mini game
saya mau membuat mini game saya sendir juga jadi berikan saya cara juga atau membuat konsep coding yang mudah jika saya click object ini bisa direct ke mini game mana begitu kamu bisa buat minigame kamu sendiri tetapi berikan saya juga cara buat minigame saya sendiri juga dengan saya coding dengan cara yang mudah, sama seprtinya level dan side mission, untuk mini game nanti folder tersendiri juga ada file.js nya misalnya saya mau tambahkan mini game lain saya tinggal tambahkan file .js saya di minigame itu dan connect kan ke object atau cerita di game.


### karakter 
saat ini akan ada karkter untuk map :
#### Sumatra 
- the president - sebagai penjelas setiap level
- pak wiwi -  jika mau memperbesar tanah saya dengan cara mudah tanpa menyelesaikan task task bisa bayar pak wiwi
- acel - nanti akan ada beberapa rumah kotor default muncul kita bisa membayar acel untuk urus rumah itu [acel ini juga warga kumuh yang licik]
- amil
- ica
- adin
#### untuk pulau pulau lain kamu bikin sendiri karaternya,
dan saya juga ingin mudah menabahkan karakter baru atau merubah karakternya dengan mudah untuk pengembangan game ini

### rid System
- 1 Tile = 1x1
- Chunk Loading

### untuk unsur ekonomi kita bisa pakai
- Money
- Income
- Expense
- Tax

### Semua Bangunan Mempunyai
- Cost
- Population
- Power Usage
- Water Usage
- Maintenance

### Camera
- Isometric
- WASD Move
- Mouse Drag
- Zoom

## Citizen
Need House
Need Job
Need Food
Need Hospital
Need Happiness
Need Education
Growth & migration system
Demografi (kelas sosial, tingkat pendidikan)

---Start---
ini adalah object object yang bisa di gunakan untuk sandboxing
### Building
(saya ingin building punya banyak type,seperti house,factory,school,hospital,office,dan lain lain, lalu di dalam type building ada banyak object lagi conbtohnya di rumah ada rumah kayu,rumah batu,rumah bertingkat dan lain lain, saya ingin saya bisa menambahkan manual juga building dan menambakan juga subs nya)
contohnya seperti ini, kamu bisa tambahkan sendiri
- House
 - Wood House
 - Rich House
- Factory
- School
- Hospital
- Office 
- Energy
 - wind
 - water
 - listrik
 - atom
-Station
 - Train Station
 - Bus Station
- Air Port
- Pelabuhan
saat proses building akan ada jeda Waktu juga, minimal untk 1 building itu proses pembangunanya 25 detik

#### road
(ada juga system jalan, di system jalan akan ada 2 jalan jalan tanah dan asphat, dan jalanya bisa di di rotate dan di ganti bisa melengkung atau lurus, tipikan jalan bisa dipilih juga ada yang bisa perempatan,pertigaan,ke kanang melengkun dan lain lain, dan di jalan akan ada kendaran kendaraan yang lewat tetapi tolong atur supaya ini tidak memberatkan juga, model kendaran saya ingin bisa di tambah juga jadi saya tinggal set di .glb modelnya
lalu pilih type seprti car,motor bike,taxi,truck dan lain lain)

#### rell kereta api
(rell untuk jalan kereta api (kereta api baru muncul Ketika train station building sudah di bentuk baru muncul))

#### Jembatan
(untuk lalu jalan jika ada perairan harus di kasi jembatan)
lampu lalu lintas
(fungsinya mengatur lalu lintas)

#### rambu lalu lintas
(fungsinya mengatur lalu lintas)

#### Lampu merah
(fungsinya mengatur lalu lintas)

#### grass
(memperindanh building)

#### block
(untuk memperindah building)

#### block special for car
(block yang bisa di lalui oleh mobil)

#### bush
(untuk memperindah building)

#### lampu jalan
(untuk memperindah building)

kita juga bisa add gundukan dan bisa kasi lubang di gundukan itu untuk jadi terowongan di jalan nanti


--end---

### cuaca
- cerah
- hujan [akan makin sedikit mobil lewat]

### hari
(hari ini juga akan mengatur itensitas kendaraan juga)
- pagi
- siang
- sore
- malam (jangan terlalu gelap tetapi akan ada effect lampu dari)
- tengah malam

### kendaraan
(kendaraan juga mempunyai banyak type di dalamnya ada subtype juga contohnya, buatlah saya juga bisa add manual mobil baru, dengan type nya sendiri)
- truck
- car
- taxi
- bus

### kendaraan air
(buatlah codingan yang gampang sehingga saya bisa tambah manual kapalnya)
- kapal
- boat
- dan lain lain
Relation

### kendaran Udara
(buatlah codingan yang gampang sehingga saya bisa tambah manual pesawat)
- pesawat
- dan lain lain
selain itu nanti di setiap karakter berikan saya juga status hubungan semakin besar status hubungan 

terus misalnya level game kita sudah seleasi kita bisa pindah ke dearah lain lagi untuk memulau misi baru tapi untuk pindah antar daerah kita perlu bandara jadi nanti Waktu click bandara akan muncul map peta seperti di awal lagi dan kita bisa mulau lagi di daerah yang lain dengan misinya sendiri lagi

terus setiap object bangunan bisa kita click dan kalo kita click akan muncul scene di dalam rumah itu gambar saja sih kamu bisa ambil itu di folder asset/image/insedeBuilding nanti, terus akan ada juga object object di daam rumah yang bisa kita click 

terus di lautnya buatlan ada kapal kapal yang berkeliaran juga

### easter egg
(nanti kita bisa coding sendiri dengan mudah untuk mendambahkan easter egg sendiri dengan code yang simple)
- buatlah jam 1 malam akan ada ufo yang berkeliaran di atas gunug di desert, berkeliaran keliaran 
- nanti di hutan akan muncul hantu juga

### personal
- terus saya juga ingin menambahkan fitur index corruption kita bisa di hitung juga kita korupsi, contohnya membayar pak wiwi, atau membayar marcel begitu
- kita juga mempunyai bisnis pribadi
- kita juga punya state keuangan pribadi
- kita juga punya state Kesehatan pribadi

### animal
- saya juga ingin menambah kan manual hewan hewan seperti di hutan ataunpun di daerah mana gitu bisa di set dengan coding manual
- untuk saat ini munculkan saja beberapa ekor rusa di hutan nanti modelnya bisa kamu ambil dari model .glb saya di dalam modelnya ada animasi nya juga nanti tolong bantu saya set up juga dengan gampang ya


### UI/UX
- saya ingin design menu,bar dan logo dan lain lain itu pixelated ya designnya
- Main HUD (resource bar, minimap, notification)
- building bar
- terus ada state
- terus ada save
- terus ada keluar
- terus ada ekonomi
- terus ada keuangan dearah
- terus ada kebahagian penduduk
- terus ada pollution
- terus ada jam
- tanggal

### nah terus kita ada icon hp di map
- di hp ini ada kontak (dimana kita bisa lihat hubungan kita dengan karakter tersebut)
- ada email di sini akan ada side event dari beberapa karater yang akan muncul kalo emailnya di click akan muncul penjelasan side eventnya
- social media kadang kadang kita bisa lihat aktifitas warga terhadap kita (konten kontennya bisa di set di satu json file dan ada gambarnya dan ini default muncul apa saja, nanti saya sebagai developer bisa set manual juga aktifias warna kalo misalnya warna tidak senang akan muncul disini juga)
- terus ada date disini kita bisa lihat side event pertanggal apa saja (misalnya pada hari rabu setelah level 3 akan muncul side event, bisa dari karater mana side event nya akan ada cerita sendiri sebagai developer saya ingin bisa menambahkan manual juga side event ini)
- akan keliatan state Kesehatan,keuangan dan lain lain,
- akan keliatan level yang sudah selesai


### music 
- music music nya bisa di ambil di file music

### model 3d 
- bisa di ambil di file model

backeground dan karakter bisa di ambil di file assets

di saya juga punya assets gamenya di dalam img/ -char/ --char_example.png -bg/ --mainmenu.png -insedBuilding/ --home_example.png model/ -home/ --home_example.glb music/ -bg/ -sound.mp3

# InstancedMesh
LOD
Chunk
Frustum Culling
Object Pooling
Texture Atlas

## UI
Atomic Design
components
-elements
-fragment
-layout
Pages

- level di simpan di folder sendiri
- mini game di folder sendiri
- side mission di folder sendiri

## AI Rules
Always optimize code.
Never create duplicate functions.
Reuse existing systems.
Always use modules.
Keep files under 300 lines.
Split code into reusable classes


### Note
- sebagai developer saya ingin bisa menambahkan level game,side misson,mini game,object,building karakter,easter egg dan lain lain manual sendiri setelah kamu bikin gamenya jadi bikinlah codingan yang mudah saya tampah
- dan buatlah struktur folder yang sangat rapi sehingga saya mudah maintancenya
- untuk assets nya semnetara kamu pake dulu model 3 kotak buatan kamu yang ringan tapi ini harus mudah di replace dengan path model 3d saya .glb begitu juga untuk karakter dan gambar gambar lainnya kamu bikin kotak simple saja dulu tapi gampang buat saya replace nya jadi asssets saya tinggal saya ganti saja codingannya dengan path assets saya.
- dan saya ingin game ini tidak berat tolong sesuaikan codingannya agar game ini ringan


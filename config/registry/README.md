# 🗂️ Developer Registry Guide

Semua konten game dapat ditambahkan **tanpa menyentuh engine** — cukup edit JSON di folder ini.

---

## 📁 File yang bisa diedit

| File | Isi | Keterangan |
|------|-----|-----------|
| `buildings.json` | Bangunan baru | Tambah tipe bangunan ke kategori yang ada |
| `vehicles.json` | Kendaraan baru | Car, bus, truck, ambulans, dll |
| `minigames.json` | Mini game | Quiz, tap, puzzle — trigger by building/level |
| `sideMissions.json` | Side mission | Misi sampingan dengan reward karakter |
| `buildingEvents.json` | Event dalam gedung | Dialog/reward saat player klik bangunan |
| `easterEggs.json` | Easter egg | Cheat, tanggal, sequence, spawn |

---

## ⚡ Field `_enabled`

```json
"_enabled": true   // aktif
"_enabled": false  // nonaktif (dilewati, tidak perlu hapus)
```

---

## 🏗️ Menambah Bangunan

Edit `buildings.json`, tambahkan objek baru:

```json
{
  "id": "stadium",           // unik, huruf kecil + underscore
  "name": "Stadium",         // nama tampil di UI
  "cost": 5000,              // harga bangun (Rp)
  "cat": "public",           // kategori: road|res|com|ind|util|public|transit|tool
  "color": "#44aaff",        // warna bangunan (hex)
  "accent": "#0055aa",       // warna aksen atap (opsional)
  "h": 2.0,                  // tinggi bangunan
  "size": 4,                 // ukuran grid (1=1x1, 2=2x2, 4=4x4)
  "jobs": 50,                // lapangan kerja yang dihasilkan
  "happy": 10,               // poin kebahagiaan
  "power": 10,               // konsumsi listrik
  "water": 5,                // konsumsi air
  "tax": 150,                // pajak per hari
  "unlock": "metro",         // syarat unlock: null | "metro" | "big"
  "description": "...",      // deskripsi hover
  "_enabled": true
}
```

---

## 🚗 Menambah Kendaraan

Edit `vehicles.json`:

```json
{
  "id": "ambulance",
  "type": "car",              // car | taxi | bus | truck | train
  "path": "./model/car/ambulance.glb",
  "rotY": 1.5708,             // Math.PI/2 = 90 derajat
  "scale": 0.9,
  "spawnWeight": 1,           // makin besar = makin sering muncul
  "requiresBuilding": "hospital", // null = selalu spawn
  "_enabled": true
}
```

---

## 🎮 Menambah Mini Game

Edit `minigames.json`:

```json
{
  "id": "quiz_sejarah",
  "name": "Kuis Sejarah",
  "type": "quiz",
  "trigger": "building",
  "triggerBuilding": "school",  // null = trigger manual
  "rewardMoney": 5000,
  "rewardHappiness": 5,
  "timeLimit": 30,
  "questions": [
    {
      "q": "Pertanyaan?",
      "options": ["A", "B", "C", "D"],
      "answer": 0               // index jawaban benar (0-based)
    }
  ],
  "_enabled": true
}
```

---

## 📋 Menambah Side Mission

Edit `sideMissions.json`:

```json
{
  "id": "side_unik",
  "name": "Nama Misi",
  "description": "Deskripsi singkat.",
  "character": "pak_wiwi",
  "cutscene": {
    "lines": ["Dialog 1", "Dialog 2"]
  },
  "trigger": { "type": "population", "min": 500 },
  "objectives": [
    { "type": "btype", "btype": "hospital", "min": 1, "label": "Bangun 1 RS" }
  ],
  "reward": {
    "money": 20000,
    "happiness": 10,
    "relationship": { "charId": "pak_wiwi", "amount": 20 }
  },
  "_enabled": true
}
```

### Trigger Types:
| type | field tambahan | keterangan |
|------|---------------|-----------|
| `population` | `min` | populasi minimal |
| `level` | `min` | level misi minimal |
| `building` | `btype` | sudah ada bangunan tsb |
| `date` | `month`, `day` | tanggal spesifik |
| `always` | — | langsung muncul |

---

## 🏢 Menambah Building Event (Event Dalam Gedung)

Edit `buildingEvents.json`:

```json
{
  "id": "event_unik",
  "name": "Nama Event",
  "buildingTypes": ["com_shop"],  // tipe bangunan yang memicu
  "trigger": {
    "type": "random",
    "chance": 0.3              // 30% chance muncul setiap kali masuk
  },
  "action": "dialog",
  "character": "pak_wiwi",
  "dialog": ["Halo!", "Apa kabar?"],
  "reward": { "money": 1000 },
  "_enabled": true
}
```

### Trigger Types:
| type | field tambahan |
|------|---------------|
| `always` | — |
| `random` | `chance` (0.0 - 1.0) |
| `date` | `month`, `day` atau `dayFrom`+`dayTo` |
| `level` | `min` |
| `population` | `min` |

### Action Types:
| action | keterangan |
|--------|-----------|
| `dialog` | Tampilkan dialog karakter |
| `minigame` | Buka minigame (tambahkan `minigameId`) |
| `reward` | Langsung beri reward |
| `mission` | Trigger side mission |

---

## 🥚 Menambah Easter Egg

Edit `easterEggs.json`:

```json
{
  "id": "ee_unik",
  "name": "Nama Easter Egg",
  "type": "cheat",
  "trigger": {
    "keyword": "kata rahasia"   // ketik di chatbox/cheat input
  },
  "effect": {
    "type": "dialog",
    "character": "the_president",
    "lines": ["Haha, kamu ketemu easter egg!", "Selamat!"]
  },
  "_enabled": true
}
```

### Easter Egg Types:
| type | trigger field | keterangan |
|------|--------------|-----------|
| `cheat` | `keyword` | Ketik kata di input |
| `date` | `month`, `day` | Otomatis muncul di tanggal |
| `sequence` | `keys` | Tekan tombol keyboard berurutan |
| `time` | `timeOfDay`, `chance` | Otomatis muncul berdasarkan waktu tertentu |
| `spawn` | — | via effect.type: "spawn" |

### Effect Types:
| type | keterangan |
|------|-----------|
| `dialog` | Tampilkan dialog karakter |
| `money` | Beri uang + pesan |
| `spawn` | Spawn objek (ufo, ghost, deer, dll) |
| `fireworks` | Efek kembang api + dialog |

## 🎭 Menambah Object Animasi via JSON

Untuk menambahkan object 3D (dengan atau tanpa animasi) yang bisa di-spawn:

### 1. Taruh file GLB di folder yang sesuai:
- `model/animal/` — hewan
- `model/egg/` — easter egg / special object
- `model/car/` — kendaraan
- `model/ship/` — kapal

### 2. Daftar di JSON yang sesuai:

**Tanpa animasi** (static object):
```json
// config/registry/easterEggs.json
{
  "id": "ee_meteor",
  "name": "Meteor Jatuh",
  "type": "cheat",
  "trigger": { "keyword": "jatuh meteor" },
  "effect": {
    "type": "spawn",
    "spawnType": "custom",
    "model": "./model/egg/meteor.glb",
    "scale": 1.0,
    "positionMode": "sky",   // sky | ground | ocean
    "animated": false,
    "message": "☄️ Meteor jatuh!"
  }
}
```

**Dengan animasi**:
```json
{
  "effect": {
    "type": "spawn",
    "animated": true,
    "animationName": "Fly",   // nama clip animasi di GLB
    "model": "./model/animal/bird.glb",
    "scale": 0.2
  }
}
```

### 3. timeOfDay Easter Egg (spawn malam hari):
```json
{
  "id": "ee_ghost_night",
  "type": "time",
  "trigger": {
    "timeOfDay": "night",   // night | day | midnight | dawn
    "chance": 0.2           // 20% chance per malam
  },
  "effect": {
    "type": "spawn",
    "spawnType": "ghost",
    "message": "👻 Ada yang aneh malam ini..."
  }
}
```

---

## 🎭 Karakter yang tersedia

| id | Nama |
|----|------|
| `the_president` | Presiden Nusabox |
| `pak_wiwi` | Pak Wiwi |
| `ica` | Ica |
| `amil` | Amil |
| `adin` | Adin |

---

## ✅ Checklist menambah konten baru

1. Edit file JSON yang sesuai
2. Set `"_enabled": true`
3. Simpan file
4. Refresh browser (hot reload aktif saat `npm run dev`)
5. Tidak perlu sentuh file lain!

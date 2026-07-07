# NUSA BOX - Sistem Konfigurasi & Expansion Guide

## 📋 Overview

Game ini sekarang menggunakan **JSON-based configuration system** yang memudahkan developer untuk:
- Menambah map baru tanpa mengubah kode
- Membuat level baru dengan objektif custom
- Menambah karakter baru dan mengatur peran mereka
- Membuat side missions dengan kondisi trigger yang fleksibel
- Menambah mini games baru dengan mudah

## 📁 Struktur File

```
skyline/
├── config/
│   ├── maps.json           # Konfigurasi 5 map (Sumatra, Jawa, dll)
│   ├── characters.json     # Data karakter & peran mereka
│   ├── levels.json         # Level progression setiap map
│   ├── sideMissions.json   # Side missions & events
│   └── miniGames.json      # Mini games configuration
├── js/
│   ├── configLoader.js     # Loader untuk config files
│   ├── characterSystem.js  # Sistem manajemen karakter
│   └── levelManager.js     # Sistem manajemen level
├── minigames/              # Folder untuk custom mini games
│   ├── quiz.js             # Game kuis (template)
│   ├── farming.js          # Game pertanian (template)
│   └── fishing.js          # Game memancing (template)
├── assets/
│   ├── character/          # Character PNG images
│   ├── background/         # Background cutscene
│   └── ui/                 # UI assets
└── game.js                 # Main game file
```

## 🎮 Cara Menambah MAP Baru

### 1. Edit `config/maps.json`

```json
{
  "maps": {
    "map_baru": {
      "id": "map_baru",
      "name": "Nama Peta",
      "gridSize": 100,
      "maxGridSize": 200,
      "description": "Deskripsi peta",
      "biomes": {
        "forest": { "enabled": true, "intensity": 1.0 },
        "beach": { "enabled": true, "intensity": 0.8 }
      },
      "startingPosition": { "gx": 50, "gz": 50 },
      "startingMoney": 350000,
      "startingPopulation": 0
    }
  }
}
```

### 2. Di game.js, gunakan:

```javascript
const configLoader = new GameConfigLoader();
await configLoader.loadAll();

const mapConfig = configLoader.getMapConfig('map_baru');
// Setup biomes, terrain, dll sesuai config
```

## 👥 Cara Menambah KARAKTER Baru

### 1. Edit `config/characters.json`

```json
{
  "characters": {
    "nama_karakter": {
      "id": "nama_karakter",
      "name": "Nama Display",
      "description": "Deskripsi",
      "modelPath": "./model/character/nama.glb",
      "imagePath": "./assets/character/nama.png",
      "role": "guide|merchant|npc|cleanup",
      "available_on_maps": ["sumatra", "jawa"],
      "services": [
        {
          "type": "service_type",
          "cost": 10000,
          "description": "Deskripsi service"
        }
      ],
      "personality": "Kepribadian"
    }
  }
}
```

### 2. Di game.js:

```javascript
const characterSystem = new CharacterSystem(configLoader);
await characterSystem.initializeForMap('sumatra', scene);

// Tampilkan cutscene
await characterSystem.showCutscene('nama_karakter', [
  'Dialog 1',
  'Dialog 2'
]);
```

## 📖 Cara Menambah LEVEL Baru

### 1. Edit `config/levels.json`

```json
{
  "levels": {
    "map_id": [
      {
        "num": 6,
        "name": "Nama Level",
        "reward": 30000,
        "character": "the_president",
        "cutscene": {
          "dialogues": [
            "Dialog 1",
            "Dialog 2"
          ]
        },
        "objectives": [
          {
            "type": "population",
            "min": 100,
            "label": "100 Penduduk"
          },
          {
            "type": "btypes",
            "btypes": ["res_low", "com_shop"],
            "min": 5,
            "label": "5 Residence + Commerce"
          }
        ]
      }
    ]
  }
}
```

### Tipe Objective yang Tersedia:

- `population` - Jumlah warga minimum
- `money` - Uang minimum
- `happiness` - Happiness percentage
- `roads` - Jumlah jalan
- `btype` - Satu tipe bangunan
- `btypes` - Multiple tipe bangunan
- `jobs` - Lapangan kerja
- `income` - Pendapatan per hari

### 2. Di game.js:

```javascript
const levelManager = new LevelManager(configLoader, characterSystem);
levelManager.initializeForMap('sumatra');

const level = await levelManager.startLevel();

// Update objective saat gameplay
levelManager.updateObjective('100 Penduduk', state.population, 100);

// Check completion
if (levelManager.areAllObjectivesComplete()) {
  await levelManager.completeLevel();
}
```

## 🎯 Cara Menambah SIDE MISSION

### 1. Edit `config/sideMissions.json`

```json
{
  "sideMissions": [
    {
      "id": "mission_id",
      "name": "Nama Mission",
      "description": "Deskripsi",
      "character": "character_id",
      "reward": 15000,
      "triggeredOn": {
        "mapId": "sumatra",
        "day": 30,
        "type": "date"
      },
      "objectives": [
        {
          "type": "happiness",
          "min": 60,
          "label": "Kebahagiaan 60%"
        }
      ]
    }
  ]
}
```

### Tipe Trigger:

```json
// Trigger berdasarkan tanggal game
"triggeredOn": {
  "mapId": "sumatra",
  "day": 30,
  "type": "date"
}

// Trigger setelah level tertentu completed
"triggeredOn": {
  "mapId": "sumatra",
  "afterLevel": 5,
  "type": "condition"
}

// Trigger setelah relation dengan karakter
"triggeredOn": {
  "mapId": "sumatra",
  "character": "acel",
  "minRelation": 50,
  "type": "character"
}
```

## 🎮 Cara Menambah MINI GAME

### 1. Edit `config/miniGames.json`

```json
{
  "miniGames": [
    {
      "id": "game_id",
      "name": "Nama Game",
      "description": "Deskripsi",
      "scriptFile": "./minigames/nama_game.js",
      "rewardMoney": 10000,
      "rewardHappiness": 15,
      "triggeredBy": {
        "type": "building",
        "building": "park",
        "action": "click"
      }
    }
  ]
}
```

### 2. Buat file mini game di `minigames/nama_game.js`

```javascript
// Template mini game
class QuizGame {
  constructor(config) {
    this.config = config;
    this.score = 0;
  }

  // Jangan lupa: harus ada method start() dan return Promise
  start() {
    return new Promise((resolve) => {
      // Game logic
      const result = {
        completed: true,
        money: this.config.rewardMoney,
        happiness: this.config.rewardHappiness
      };
      resolve(result);
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizGame;
}
```

### 3. Di game.js, trigger mini game:

```javascript
const miniGameConfig = configLoader.getMiniGameForBuilding('park');
if (miniGameConfig) {
  // Load script
  const script = await import(miniGameConfig.scriptFile);
  const game = new script.default(miniGameConfig);
  const result = await game.start();
  
  // Award rewards
  state.money += result.money;
  state.happiness += result.happiness;
}
```

## 📊 Biome System

Setiap map bisa memiliki multiple biomes. Aktifkan/matikan di config:

```json
"biomes": {
  "forest": { "enabled": true, "intensity": 1.2 },
  "desert": { "enabled": true, "intensity": 0.8 },
  "mountain": { "enabled": true, "intensity": 1.0 },
  "beach": { "enabled": true, "intensity": 0.9 },
  "snow": { "enabled": false, "intensity": 0 }
}
```

Biomes yang tersedia:
- `forest` - Hutan
- `desert` - Gurun/Padang pasir
- `mountain` - Gunung
- `beach` - Pantai
- `ocean` - Laut
- `swamp` - Rawa
- `snow` - Salju (untuk high altitude)

## 🔄 Calendar System (Persiapan)

Struktur untuk calendar-based events sudah siap:

```javascript
// Check available missions per hari
const availableMissions = configLoader.getAvailableSideMissions(
  'sumatra',
  currentDay,      // 1-365
  currentLevel     // Level yang sudah di-complete
);
```

## 🚀 Cara Mengintegrasikan ke game.js

```javascript
// 1. Load semua config
const configLoader = new GameConfigLoader();
await configLoader.loadAll();

// 2. Initialize character system
const characterSystem = new CharacterSystem(configLoader);
await characterSystem.initializeForMap('sumatra', scene);

// 3. Initialize level manager
const levelManager = new LevelManager(configLoader, characterSystem);
levelManager.initializeForMap('sumatra');

// 4. Start level
const level = await levelManager.startLevel();

// 5. Update objectives saat gameplay
function updateGameState() {
  levelManager.updateObjective('100 Penduduk', state.population, 100);
  levelManager.updateObjective('Kebahagiaan 60%', state.happiness, 60);
  
  if (levelManager.areAllObjectivesComplete()) {
    levelManager.completeLevel();
  }
}
```

## 💾 Save/Load Game State

State setiap map bisa disave ke localStorage:

```javascript
// Save
const gameState = {
  mapId: 'sumatra',
  currentLevel: 5,
  money: 500000,
  population: 1000,
  completedLevels: [1, 2, 3, 4, 5],
  day: 100
};
localStorage.setItem('skyline-save', JSON.stringify(gameState));

// Load
const saved = JSON.parse(localStorage.getItem('skyline-save'));
if (saved) {
  configLoader.getMapConfig(saved.mapId);
  levelManager.currentLevel = saved.currentLevel;
  state.money = saved.money;
  // ... restore state lainnya
}
```

## 🔧 Tips & Tricks

### 1. Test level baru:
```javascript
levelManager.currentLevel = 5; // Jump ke level 6
await levelManager.startLevel();
```

### 2. Debug objectives:
```javascript
console.log(levelManager.levelObjectivesState);
console.log(levelManager.areAllObjectivesComplete());
```

### 3. Skip level (debug):
```javascript
levelManager.skipLevel(); // Auto-complete current level
```

### 4. Persiapkan untuk chest/rewards:
```json
{
  "reward": 30000,
  "bonusReward": {
    "type": "chest",
    "position": { "gx": 50, "gz": 50 }
  }
}
```

---

## 📝 Checklist untuk Expansion

- [ ] Tambah map di maps.json
- [ ] Buat karakter & tambah di characters.json
- [ ] Design 30 level di levels.json
- [ ] Buat side missions di sideMissions.json
- [ ] Bikin mini games di minigames/ folder
- [ ] Setup cutscene assets (PNG, backgrounds)
- [ ] Test progression & objectives
- [ ] Optimize biome generation per map
- [ ] Setup calendar system untuk events
- [ ] Implement relation system antar karakter

---

**Happy Developing! 🎮**

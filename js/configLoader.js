// ===================== GAME CONFIG LOADER =====================
// Modul untuk memuat dan mengelola konfigurasi game dari JSON files
// Gunakan: const configLoader = new GameConfigLoader();

class GameConfigLoader {
  constructor() {
    this.maps = {};
    this.characters = {};
    this.levels = {};
    this.sideMissions = [];
    this.miniGames = [];
    this.currentMap = null;
    this.currentMapConfig = null;
  }

  /**
   * Load semua config files
   * @returns {Promise<void>}
   */
  async loadAll() {
    try {
      await Promise.all([
        this.loadMaps(),
        this.loadCharacters(),
        this.loadLevels(),
        this.loadSideMissions(),
        this.loadMiniGames()
      ]);
      console.log('[ConfigLoader] Semua config berhasil dimuat');
    } catch (err) {
      console.error('[ConfigLoader] Error loading config:', err);
    }
  }

  /**
   * Load maps configuration
   */
  async loadMaps() {
    try {
      const response = await fetch('./config/maps.json');
      const data = await response.json();
      this.maps = data.maps;
      console.log('[ConfigLoader] Maps loaded:', Object.keys(this.maps));
    } catch (err) {
      console.error('[ConfigLoader] Error loading maps:', err);
    }
  }

  /**
   * Load characters configuration
   */
  async loadCharacters() {
    try {
      const response = await fetch('./config/characters.json');
      const data = await response.json();
      this.characters = data.characters;
      console.log('[ConfigLoader] Characters loaded:', Object.keys(this.characters).length);
    } catch (err) {
      console.error('[ConfigLoader] Error loading characters:', err);
    }
  }

  /**
   * Load levels configuration
   */
  async loadLevels() {
    try {
      const response = await fetch('./config/levels.json');
      const data = await response.json();
      this.levels = data.levels;
      console.log('[ConfigLoader] Levels loaded:', Object.keys(this.levels));
    } catch (err) {
      console.error('[ConfigLoader] Error loading levels:', err);
    }
  }

  /**
   * Load side missions configuration
   */
  async loadSideMissions() {
    try {
      const response = await fetch('./config/sideMissions.json');
      const data = await response.json();
      this.sideMissions = data.sideMissions;
      console.log('[ConfigLoader] Side missions loaded:', this.sideMissions.length);
    } catch (err) {
      console.error('[ConfigLoader] Error loading side missions:', err);
    }
  }

  /**
   * Load mini games configuration
   */
  async loadMiniGames() {
    try {
      const response = await fetch('./config/miniGames.json');
      const data = await response.json();
      this.miniGames = data.miniGames;
      console.log('[ConfigLoader] Mini games loaded:', this.miniGames.length);
    } catch (err) {
      console.error('[ConfigLoader] Error loading mini games:', err);
    }
  }

  /**
   * Dapatkan konfigurasi map tertentu
   * @param {string} mapId
   * @returns {object}
   */
  getMapConfig(mapId) {
    if (!this.maps[mapId]) {
      console.warn(`[ConfigLoader] Map ${mapId} tidak ditemukan`);
      return null;
    }
    this.currentMap = mapId;
    this.currentMapConfig = this.maps[mapId];
    return this.maps[mapId];
  }

  /**
   * Dapatkan semua map yang tersedia
   * @returns {array}
   */
  getAllMaps() {
    return Object.values(this.maps);
  }

  /**
   * Dapatkan character berdasarkan ID
   * @param {string} characterId
   * @returns {object}
   */
  getCharacter(characterId) {
    return this.characters[characterId] || null;
  }

  /**
   * Dapatkan karakter yang tersedia di map tertentu
   * @param {string} mapId
   * @returns {array}
   */
  getCharactersForMap(mapId) {
    return Object.values(this.characters).filter(char =>
      char.available_on_maps.includes(mapId)
    );
  }

  /**
   * Dapatkan levels untuk map tertentu
   * @param {string} mapId
   * @returns {array}
   */
  getLevelsForMap(mapId) {
    return this.levels[mapId] || [];
  }

  /**
   * Dapatkan level tertentu
   * @param {string} mapId
   * @param {number} levelNum
   * @returns {object}
   */
  getLevel(mapId, levelNum) {
    const levels = this.getLevelsForMap(mapId);
    return levels.find(l => l.num === levelNum) || null;
  }

  /**
   * Dapatkan side missions untuk map tertentu
   * @param {string} mapId
   * @returns {array}
   */
  getSideMissionsForMap(mapId) {
    return this.sideMissions.filter(m => m.triggeredOn.mapId === mapId);
  }

  /**
   * Dapatkan side missions yang dapat trigger berdasarkan kondisi
   * @param {string} mapId
   * @param {number} currentDay
   * @param {number} currentLevel
   * @returns {array}
   */
  getAvailableSideMissions(mapId, currentDay, currentLevel) {
    return this.sideMissions.filter(m => {
      if (m.triggeredOn.mapId !== mapId) return false;
      
      if (m.triggeredOn.type === 'date') {
        return currentDay === m.triggeredOn.day;
      } else if (m.triggeredOn.type === 'condition') {
        return currentLevel >= m.triggeredOn.afterLevel;
      }
      return false;
    });
  }

  /**
   * Dapatkan mini game berdasarkan building
   * @param {string} buildingKey
   * @returns {object}
   */
  getMiniGameForBuilding(buildingKey) {
    return this.miniGames.find(mg =>
      mg.triggeredBy.type === 'building' && mg.triggeredBy.building === buildingKey
    ) || null;
  }

  /**
   * Dapatkan mini game berdasarkan location
   * @param {string} location
   * @returns {object}
   */
  getMiniGameForLocation(location) {
    return this.miniGames.find(mg =>
      mg.triggeredBy.type === 'location' && mg.triggeredBy.location === location
    ) || null;
  }

  /**
   * Inisialisasi game state dari map config
   * @param {string} mapId
   * @returns {object}
   */
  initializeGameState(mapId) {
    const mapConfig = this.getMapConfig(mapId);
    if (!mapConfig) return null;

    return {
      mapId: mapId,
      mapName: mapConfig.name,
      gridSize: mapConfig.gridSize,
      maxGridSize: mapConfig.maxGridSize,
      money: mapConfig.startingMoney,
      population: mapConfig.startingPopulation,
      currentDay: 1,
      currentLevel: 0,
      completedLevels: [],
      activeSideMissions: [],
      biomes: mapConfig.biomes,
      startingPosition: mapConfig.startingPosition
    };
  }
}

// Export untuk digunakan di game.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConfigLoader;
}

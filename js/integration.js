// ===================== INTEGRATION EXAMPLE =====================
// Copy dan paste ke game.js atau import dari file ini
// Menunjukkan cara menggunakan GameConfigLoader, CharacterSystem, LevelManager

/**
 * Inisialisasi sistem config dan manager
 * Call ini di awal game.js setelah THREE.js setup
 */
async function initializeGameSystems() {
  console.log('[Game] Initializing config systems...');

  // 1. Initialize config loader
  window.configLoader = new GameConfigLoader();
  await configLoader.loadAll();

  // 2. Initialize character system
  window.characterSystem = new CharacterSystem(configLoader);

  // 3. Initialize level manager
  window.levelManager = new LevelManager(configLoader, characterSystem);

  console.log('[Game] All systems initialized');
  return true;
}

/**
 * Mulai game di map tertentu
 * @param {string} mapId - ID map dari config (sumatra, jawa, dll)
 */
async function startNewGame(mapId) {
  console.log(`[Game] Starting new game on map: ${mapId}`);

  // Get map config
  const mapConfig = configLoader.getMapConfig(mapId);
  if (!mapConfig) {
    console.error(`Map ${mapId} not found!`);
    return;
  }

  // Initialize game state dari config
  const gameState = configLoader.initializeGameState(mapId);
  Object.assign(state, gameState);

  // Initialize character system untuk map ini
  await characterSystem.initializeForMap(mapId, scene);

  // Initialize level manager
  levelManager.initializeForMap(mapId);

  // Setup biomes sesuai config
  setupBiomesForMap(mapConfig);

  // Setup terrain dan world objects
  updateGroundAndGrid();
  respawnWorldTrees();
  spawnDesertZone();
  spawnBeachZone();

  // Start first level
  const level = await levelManager.startLevel();
  
  console.log(`[Game] Map ${mapId} initialized, Level 1 started`);
  return level;
}

/**
 * Setup biomes untuk map tertentu
 * @param {object} mapConfig
 */
function setupBiomesForMap(mapConfig) {
  console.log(`[Game] Setting up biomes for ${mapConfig.name}`);

  // Enable/disable biomes based on config
  const biomes = mapConfig.biomes;

  // Forest
  if (biomes.forest) {
    // spawnWorldTrees sudah di-call di respawnWorldTrees()
    TERRAIN.intensity *= biomes.forest.intensity || 1.0;
  }

  // Desert
  if (biomes.desert) {
    spawnDesertZone();
  }

  // Beach
  if (biomes.beach) {
    spawnBeachZone();
  }

  // Mountain (adjust terrain intensity)
  if (biomes.mountain) {
    TERRAIN.intensity *= biomes.mountain.intensity || 1.0;
  }

  // Snow (future implementation)
  if (biomes.snow) {
    console.log('[Game] Snow biome enabled (future)');
  }

  TERRAIN.rebuild();
}

/**
 * Update game state setiap frame (call dari animate loop)
 */
function updateGameState() {
  if (!state.running || !levelManager) return;

  // Update objective progress
  const level = levelManager.getCurrentLevel();
  if (!level) return;

  // Check setiap objective
  for (const obj of level.objectives) {
    let currentValue = 0;
    let targetValue = obj.min;

    // Get current value based on objective type
    switch (obj.type) {
      case 'population':
        currentValue = state.population;
        break;
      case 'money':
        currentValue = state.money;
        break;
      case 'happiness':
        currentValue = state.happiness;
        break;
      case 'roads':
        currentValue = state.buildings.filter(b => b.type === 'road').length;
        break;
      case 'btype':
        currentValue = state.buildings.filter(b => b.type === obj.btype).length;
        break;
      case 'btypes':
        currentValue = state.buildings.filter(b => obj.btypes.includes(b.type)).length;
        break;
      case 'jobs':
        currentValue = state.jobs.offered;
        break;
      case 'income':
        currentValue = state.income;
        break;
    }

    // Update objective UI
    levelManager.updateObjective(obj.label, currentValue, targetValue);
  }

  // Check jika semua objectives complete
  if (levelManager.areAllObjectivesComplete()) {
    // Bisa trigger auto-complete atau show button
    console.log('[Game] All objectives complete!');
  }
}

/**
 * Trigger mini game dari building click
 * @param {string} buildingKey
 */
async function triggerMiniGame(buildingKey) {
  const miniGameConfig = configLoader.getMiniGameForBuilding(buildingKey);
  if (!miniGameConfig) {
    console.log(`[Game] No mini game for ${buildingKey}`);
    return;
  }

  console.log(`[Game] Starting mini game: ${miniGameConfig.name}`);

  try {
    // Bisa load dari file atau inline class
    // Contoh untuk quiz game:
    const gameClass = QuizGame; // Assuming QuizGame is loaded via script tag
    const game = new gameClass(miniGameConfig);
    const result = await game.start();

    if (result.completed) {
      // Award rewards
      state.money += result.money || 0;
      state.happiness += result.happiness || 0;
      
      console.log(`[Game] Mini game completed! +$${result.money} +${result.happiness} happiness`);
    }
  } catch (err) {
    console.error('[Game] Error running mini game:', err);
  }
}

/**
 * Trigger side mission berdasarkan kondisi
 * Call ini dari update loop atau saat event tertentu
 */
function checkForNewSideMissions() {
  const availableMissions = configLoader.getAvailableSideMissions(
    state.mapId,
    state.day,
    levelManager.completedLevels.length
  );

  if (availableMissions.length > 0) {
    for (const mission of availableMissions) {
      // Cek jika belum di-trigger
      if (!state.activeSideMissions.includes(mission.id)) {
        showSideMissionNotification(mission);
        state.activeSideMissions.push(mission.id);
      }
    }
  }
}

/**
 * Tampilkan notifikasi side mission
 * @param {object} mission
 */
function showSideMissionNotification(mission) {
  console.log(`[Game] New side mission: ${mission.name}`);

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(20, 20, 20, 0.95);
    border: 2px solid gold;
    border-radius: 10px;
    padding: 20px;
    color: white;
    max-width: 300px;
    z-index: 500;
    font-family: Arial, sans-serif;
  `;

  notification.innerHTML = `
    <div style="color: gold; font-weight: bold; margin-bottom: 10px;">
      📢 NEW MISSION
    </div>
    <div style="margin-bottom: 10px;">
      <strong>${mission.name}</strong>
    </div>
    <div style="color: #aaa; font-size: 14px; margin-bottom: 15px;">
      ${mission.description}
    </div>
    <div style="color: #ffcc00; font-size: 14px;">
      Reward: $${mission.reward.toLocaleString()}
    </div>
  `;

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 5000);
}

/**
 * Save game state to localStorage
 */
function saveGame() {
  const gameState = {
    mapId: state.mapId,
    mapName: state.mapName,
    gridSize: state.gridSize,
    money: state.money,
    population: state.population,
    happiness: state.happiness,
    currentDay: state.day,
    currentLevel: levelManager.currentLevel,
    completedLevels: levelManager.completedLevels,
    activeSideMissions: state.activeSideMissions,
    buildings: state.buildings.map(b => ({
      x: b.x,
      y: b.y,
      type: b.type,
      rotation: b.rotation
    }))
  };

  localStorage.setItem('nusabox-save', JSON.stringify(gameState));
  console.log('[Game] Game saved');
}

/**
 * Load game state from localStorage
 */
function loadGame() {
  const saved = localStorage.getItem('nusabox-save');
  if (!saved) return null;

  const gameState = JSON.parse(saved);
  console.log('[Game] Game loaded:', gameState.mapName);
  return gameState;
}

/**
 * Resume game dari save
 * @param {object} gameState
 */
async function resumeGame(gameState) {
  if (!gameState) return;

  // Setup map
  const mapConfig = configLoader.getMapConfig(gameState.mapId);
  Object.assign(state, gameState);

  await characterSystem.initializeForMap(gameState.mapId, scene);
  levelManager.initializeForMap(gameState.mapId);
  levelManager.currentLevel = gameState.currentLevel;

  setupBiomesForMap(mapConfig);
  updateGroundAndGrid();
  respawnWorldTrees();
  spawnDesertZone();
  spawnBeachZone();

  console.log('[Game] Game resumed on', gameState.mapName);
}

// ===================== INTEGRATION CHECKLIST =====================
/*
Di game.js, add ini:

1. Di HTML index.html, add script tags:
   <script src="./js/configLoader.js"></script>
   <script src="./js/characterSystem.js"></script>
   <script src="./js/levelManager.js"></script>
   <script src="./js/integration.js"></script>
   <script src="./minigames/quiz.js"></script>

2. Di game.js animate() loop:
   if (state.running) {
     updateGameState();
     checkForNewSideMissions();
   }

3. Di building click handler:
   if (BUILDINGS[buildingKey]) {
     triggerMiniGame(buildingKey);
   }

4. Di main menu:
   const savedGame = loadGame();
   if (savedGame) {
     // show continue button
   }

5. Di save button:
   saveGame();

6. Di start new game:
   await initializeGameSystems();
   await startNewGame('sumatra');
   
7. Di resume game:
   const savedGame = loadGame();
   await resumeGame(savedGame);
*/

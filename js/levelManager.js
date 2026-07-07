// ===================== LEVEL MANAGEMENT SYSTEM =====================
// Modul untuk mengelola level progression di game
// Gunakan: const levelManager = new LevelManager(configLoader, characterSystem);

class LevelManager {
  constructor(configLoader, characterSystem) {
    this.configLoader = configLoader;
    this.characterSystem = characterSystem;
    this.currentMapId = null;
    this.currentLevel = 0;
    this.completedLevels = [];
    this.levelProgress = {};
    this.levelObjectivesState = {};
  }

  /**
   * Inisialisasi level untuk map tertentu
   * @param {string} mapId
   */
  initializeForMap(mapId) {
    this.currentMapId = mapId;
    this.currentLevel = 0;
    this.completedLevels = [];
    this.levelProgress = {};
    this.levelObjectivesState = {};
    console.log(`[LevelManager] Inisialisasi untuk map: ${mapId}`);
  }

  /**
   * Dapatkan level saat ini
   * @returns {object}
   */
  getCurrentLevel() {
    const levels = this.configLoader.getLevelsForMap(this.currentMapId);
    return levels[this.currentLevel] || null;
  }

  /**
   * Dapatkan level berikutnya
   * @returns {object}
   */
  getNextLevel() {
    const levels = this.configLoader.getLevelsForMap(this.currentMapId);
    if (this.currentLevel + 1 < levels.length) {
      return levels[this.currentLevel + 1];
    }
    return null;
  }

  /**
   * Mulai level (tampilkan cutscene dan objective)
   * @returns {Promise}
   */
  async startLevel() {
    const level = this.getCurrentLevel();
    if (!level) {
      console.warn('[LevelManager] Level tidak ditemukan');
      return;
    }

    console.log(`[LevelManager] Memulai level ${level.num}: ${level.name}`);

    // Reset objective state
    this.levelObjectivesState[level.num] = {};
    for (const obj of level.objectives) {
      this.levelObjectivesState[level.num][obj.label] = false;
    }

    // Tampilkan cutscene jika ada
    if (level.cutscene && level.character) {
      await this.characterSystem.showCutscene(
        level.character,
        level.cutscene.dialogues,
        {
          backdrop: level.cutscene.backdrop,
          duration: 2000
        }
      );
    }

    // Show objectives UI
    this.displayObjectives(level);

    return level;
  }

  /**
   * Tampilkan objectives di UI
   * @param {object} level
   * @private
   */
  displayObjectives(level) {
    // Buat objective UI
    const container = document.createElement('div');
    container.id = `level-objectives-${level.num}`;
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: rgba(20, 20, 20, 0.9);
      border: 2px solid gold;
      border-radius: 10px;
      padding: 20px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 100;
      max-width: 300px;
    `;

    const levelTitle = document.createElement('div');
    levelTitle.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: gold;
      margin-bottom: 15px;
    `;
    levelTitle.textContent = `Level ${level.num}: ${level.name}`;
    container.appendChild(levelTitle);

    const objectivesList = document.createElement('div');
    for (const obj of level.objectives) {
      const objElement = document.createElement('div');
      objElement.style.cssText = `
        padding: 8px;
        margin-bottom: 8px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
      `;
      objElement.id = `objective-${obj.label}`;
      objElement.innerHTML = `
        <span style="color: #aaa;">☐</span> ${obj.label}
      `;
      objectivesList.appendChild(objElement);
    }
    container.appendChild(objectivesList);

    const rewardElement = document.createElement('div');
    rewardElement.style.cssText = `
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid gold;
      font-size: 14px;
      color: #ffcc00;
      text-align: center;
    `;
    rewardElement.textContent = `Reward: $${level.reward.toLocaleString()}`;
    container.appendChild(rewardElement);

    document.body.appendChild(container);
  }

  /**
   * Check dan update progress objective
   * @param {string} objectiveLabel
   * @param {number} currentValue
   * @param {number} targetValue
   * @returns {boolean}
   */
  updateObjective(objectiveLabel, currentValue, targetValue) {
    const level = this.getCurrentLevel();
    if (!level) return false;

    const isComplete = currentValue >= targetValue;
    this.levelObjectivesState[level.num][objectiveLabel] = isComplete;

    // Update UI
    const objElement = document.getElementById(`objective-${objectiveLabel}`);
    if (objElement) {
      const checkbox = isComplete ? '☑' : '☐';
      const color = isComplete ? '#00ff00' : '#aaa';
      objElement.innerHTML = `
        <span style="color: ${color};">${checkbox}</span> 
        ${objectiveLabel} (${currentValue}/${targetValue})
      `;
    }

    return isComplete;
  }

  /**
   * Check apakah semua objective completed
   * @returns {boolean}
   */
  areAllObjectivesComplete() {
    const level = this.getCurrentLevel();
    if (!level) return false;

    return level.objectives.every(obj =>
      this.levelObjectivesState[level.num][obj.label] === true
    );
  }

  /**
   * Complete level saat ini
   * @returns {Promise}
   */
  async completeLevel() {
    const level = this.getCurrentLevel();
    if (!level) return null;

    if (!this.areAllObjectivesComplete()) {
      console.warn('[LevelManager] Belum semua objective complete');
      return null;
    }

    console.log(`[LevelManager] Level ${level.num} completed!`);

    // Add ke completed levels
    this.completedLevels.push(level.num);

    // Show completion message
    this.showCompletionMessage(level);

    // Award reward
    if (window.state) {
      window.state.money += level.reward;
    }

    // Move ke next level
    this.currentLevel++;

    // Check untuk side missions
    const sideMissions = this.configLoader.getAvailableSideMissions(
      this.currentMapId,
      window.state?.day || 1,
      this.currentLevel
    );

    if (sideMissions.length > 0) {
      console.log(`[LevelManager] Ada ${sideMissions.length} side mission tersedia`);
    }

    return level;
  }

  /**
   * Tampilkan pesan level completion
   * @param {object} level
   * @private
   */
  showCompletionMessage(level) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(20, 20, 20, 0.95);
      border: 3px solid gold;
      border-radius: 15px;
      padding: 40px;
      color: white;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 1001;
      min-width: 400px;
    `;

    container.innerHTML = `
      <div style="font-size: 32px; font-weight: bold; color: #ffcc00; margin-bottom: 20px;">
        ✓ LEVEL COMPLETE!
      </div>
      <div style="font-size: 20px; margin-bottom: 20px;">
        ${level.name}
      </div>
      <div style="font-size: 16px; color: #aaa; margin-bottom: 30px;">
        Reward: <span style="color: #ffcc00;">$${level.reward.toLocaleString()}</span>
      </div>
      <button id="continue-btn" style="
        background-color: gold;
        color: black;
        padding: 12px 30px;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
      ">
        Lanjutkan
      </button>
    `;

    document.body.appendChild(container);

    document.getElementById('continue-btn').addEventListener('click', () => {
      document.body.removeChild(container);
    });
  }

  /**
   * Fail level saat ini
   */
  failLevel() {
    const level = this.getCurrentLevel();
    console.warn(`[LevelManager] Level ${level.num} failed`);
    this.displayObjectives(level); // Refresh objectives
  }

  /**
   * Skip level (untuk testing/debug)
   */
  skipLevel() {
    const level = this.getCurrentLevel();
    console.log(`[LevelManager] Level ${level.num} skipped (debug)`);
    this.completeLevel();
  }

  /**
   * Reset semua progress
   */
  resetProgress() {
    this.currentLevel = 0;
    this.completedLevels = [];
    this.levelProgress = {};
    this.levelObjectivesState = {};
    console.log('[LevelManager] Progress reset');
  }

  /**
   * Get level statistics
   * @returns {object}
   */
  getStatistics() {
    const levels = this.configLoader.getLevelsForMap(this.currentMapId);
    return {
      currentLevel: this.currentLevel,
      totalLevels: levels.length,
      completedLevels: this.completedLevels.length,
      progressPercent: (this.completedLevels.length / levels.length) * 100
    };
  }
}

// Export untuk digunakan di game.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelManager;
}

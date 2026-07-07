// ===================== CHARACTER SYSTEM =====================
// Modul untuk mengelola karakter di game
// Gunakan: const characterSystem = new CharacterSystem(configLoader);

class CharacterSystem {
  constructor(configLoader) {
    this.configLoader = configLoader;
    this.characters = [];
    this.activeDialogues = [];
    this.characterModels = new Map();
    this.characterImages = new Map();
  }

  /**
   * Inisialisasi karakter untuk map tertentu
   * @param {string} mapId
   * @param {THREE.Scene} scene
   */
  async initializeForMap(mapId, scene) {
    const chars = this.configLoader.getCharactersForMap(mapId);
    
    for (const charConfig of chars) {
      const character = {
        id: charConfig.id,
        name: charConfig.name,
        config: charConfig,
        mesh: null,
        position: { x: 0, y: 0, z: 0 },
        isActive: false,
        dialogueIndex: 0
      };

      // Load model jika tersedia
      if (charConfig.modelPath && scene) {
        // Placeholder untuk GLTFLoader
        // const model = await loadGLB(charConfig.modelPath);
        // character.mesh = model;
        console.log(`[CharacterSystem] Persiapkan model ${charConfig.name} dari ${charConfig.modelPath}`);
      }

      // Preload image
      if (charConfig.imagePath) {
        this.preloadImage(charConfig.imagePath, charConfig.id);
      }

      this.characters.push(character);
    }

    console.log(`[CharacterSystem] Inisialisasi ${chars.length} karakter untuk ${mapId}`);
  }

  /**
   * Preload image karakter
   * @param {string} imagePath
   * @param {string} characterId
   */
  preloadImage(imagePath, characterId) {
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
      this.characterImages.set(characterId, img);
      console.log(`[CharacterSystem] Image loaded: ${characterId}`);
    };
    img.onerror = () => {
      console.warn(`[CharacterSystem] Failed to load image: ${imagePath}`);
    };
  }

  /**
   * Tampilkan cutscene dengan karakter
   * @param {string} characterId
   * @param {array} dialogues
   * @param {object} options
   * @returns {Promise}
   */
  async showCutscene(characterId, dialogues, options = {}) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) {
      console.warn(`[CharacterSystem] Karakter ${characterId} tidak ditemukan`);
      return;
    }

    const defaultOptions = {
      duration: 3000, // ms per dialogue
      backdrop: './assets/background/default.png',
      position: 'right', // left, right, center
      scale: 1.0,
      ...options
    };

    return new Promise((resolve) => {
      this.showDialogueBox(character, dialogues, defaultOptions, resolve);
    });
  }

  /**
   * Tampilkan dialogue box (internal)
   * @private
   */
  showDialogueBox(character, dialogues, options, resolve) {
    // Buat DOM element untuk cutscene
    const container = document.createElement('div');
    container.id = 'cutscene-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;

    const dialogueBox = document.createElement('div');
    dialogueBox.style.cssText = `
      background-color: rgba(20, 20, 20, 0.95);
      color: white;
      padding: 30px;
      border-radius: 10px;
      width: 80%;
      max-width: 800px;
      margin-bottom: 20px;
      border: 2px solid gold;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    const characterName = document.createElement('div');
    characterName.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: gold;
      margin-bottom: 10px;
    `;
    characterName.textContent = character.name;
    dialogueBox.appendChild(characterName);

    const dialogueText = document.createElement('div');
    dialogueText.style.cssText = `
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 20px;
      min-height: 60px;
    `;
    dialogueBox.appendChild(dialogueText);

    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Lanjut (Click atau Tekan SPACE)';
    continueBtn.style.cssText = `
      background-color: gold;
      color: black;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      float: right;
    `;

    dialogueBox.appendChild(continueBtn);
    container.appendChild(dialogueBox);
    document.body.appendChild(container);

    let currentDialogueIndex = 0;

    const showNextDialogue = () => {
      if (currentDialogueIndex < dialogues.length) {
        dialogueText.textContent = dialogues[currentDialogueIndex];
        currentDialogueIndex++;
      } else {
        // Semua dialogue selesai
        document.body.removeChild(container);
        resolve();
      }
    };

    const handleContinue = () => {
      showNextDialogue();
    };

    continueBtn.addEventListener('click', handleContinue);
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' && document.getElementById('cutscene-container')) {
        e.preventDefault();
        handleContinue();
      }
    });

    // Tampilkan dialogue pertama
    showNextDialogue();
  }

  /**
   * Tampilkan character di scene
   * @param {string} characterId
   * @param {THREE.Scene} scene
   * @param {object} position
   */
  showCharacterInScene(characterId, scene, position = { x: 0, y: 0, z: -10 }) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character || !character.mesh) return;

    character.position = position;
    character.mesh.position.set(position.x, position.y, position.z);
    character.isActive = true;
    
    if (!character.mesh.parent) {
      scene.add(character.mesh);
    }
  }

  /**
   * Sembunyikan character dari scene
   * @param {string} characterId
   * @param {THREE.Scene} scene
   */
  hideCharacterFromScene(characterId, scene) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character || !character.mesh) return;

    character.isActive = false;
    if (character.mesh.parent === scene) {
      scene.remove(character.mesh);
    }
  }

  /**
   * Dapatkan data karakter
   * @param {string} characterId
   * @returns {object}
   */
  getCharacter(characterId) {
    return this.characters.find(c => c.id === characterId) || null;
  }

  /**
   * Dapatkan image karakter
   * @param {string} characterId
   * @returns {Image}
   */
  getCharacterImage(characterId) {
    return this.characterImages.get(characterId) || null;
  }

  /**
   * Trigger service dari character (e.g. pak wiwi expand grid)
   * @param {string} characterId
   * @param {string} serviceType
   * @returns {object}
   */
  triggerService(characterId, serviceType) {
    const character = this.configLoader.getCharacter(characterId);
    if (!character || !character.services) return null;

    const service = character.services.find(s => s.type === serviceType);
    return service || null;
  }
}

// Export untuk digunakan di game.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CharacterSystem;
}

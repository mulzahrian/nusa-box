/**
 * Citizen Life Simulation System
 */
import { rand, randInt, choice } from '@utils/helpers';

const FIRST_NAMES = ['Agus','Budi','Citra','Dewi','Eko','Fitri','Gita','Hadi','Indra','Joko','Kartika','Lina','Made','Nia','Oka','Putri','Rina','Sari','Tono','Udin','Vina','Wahyu','Yuli','Zaki'];
const LAST_NAMES = ['Pratama','Wijaya','Sari','Susanto','Rahman','Hidayat','Saputra','Putra','Lestari','Anggraini'];
const JOBS = ['Programmer','Teacher','Doctor','Engineer','Designer','Manager','Worker','Driver','Chef','Artist'];
const EDUS = ['SD','SMP','SMA','Sarjana','Master'];

class CitizenSystem {
  constructor() {
    this.citizens = [];
    this.maxCitizens = 500;
  }
  
  generateCitizen() {
    return {
      id: Date.now() + Math.random(),
      name: choice(FIRST_NAMES) + ' ' + choice(LAST_NAMES),
      job: choice(JOBS),
      education: choice(EDUS),
      happiness: 50 + randInt(0, 30),
      health: 70 + randInt(0, 30),
      income: randInt(2000, 8000),
      needHouse: true,
      needJob: true,
      needFood: false,
      needHospital: false,
    };
  }
  
  spawnCitizens(count) {
    const spawned = [];
    for (let i = 0; i < count && this.citizens.length < this.maxCitizens; i++) {
      const c = this.generateCitizen();
      this.citizens.push(c);
      spawned.push(c);
    }
    return spawned;
  }
  
  update(gameState) {
    // Growth/migration based on happiness and available homes
    const { happiness, homes, population } = gameState;
    
    if (homes > population && happiness > 40) {
      const migrationRate = Math.floor((happiness - 40) / 20) + 1;
      const available = homes - population;
      const toSpawn = Math.min(migrationRate, available);
      if (toSpawn > 0 && Math.random() < 0.3) {
        this.spawnCitizens(toSpawn);
      }
    }
    
    // Citizens leave if unhappy
    if (happiness < 30 && this.citizens.length > 0 && Math.random() < 0.1) {
      this.citizens.pop();
    }
  }
  
  getPopulation() {
    return this.citizens.length;
  }
  
  clear() {
    this.citizens = [];
  }
}

const citizenSystem = new CitizenSystem();
export default citizenSystem;
export { FIRST_NAMES, LAST_NAMES, JOBS, EDUS };

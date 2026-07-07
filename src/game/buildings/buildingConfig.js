const define = (config) => ({
  buildTime: Math.max(25, config.buildTime),
  modelPath: config.modelPath || '/models/placeholder.glb',
  ...config,
});

export const BUILDING_TYPES = {
  house: {
    woodHouse: define({ id: 'woodHouse', name: 'Wood House', category: 'house', cost: 120, size: [1, 1], populationEffect: 4, powerUsage: 1, waterUsage: 1, maintenance: 3, buildTime: 25, color: '#c98e56', height: 1.4 }),
    richHouse: define({ id: 'richHouse', name: 'Rich House', category: 'house', cost: 450, size: [2, 2], populationEffect: 12, powerUsage: 3, waterUsage: 3, maintenance: 10, buildTime: 40, color: '#d9c3a5', height: 2.6 }),
    apartmentHouse: define({ id: 'apartmentHouse', name: 'Apartment House', category: 'house', cost: 820, size: [2, 2], populationEffect: 28, powerUsage: 5, waterUsage: 6, maintenance: 16, buildTime: 55, color: '#9da7b4', height: 4.4 }),
  },
  factory: {
    smallFactory: define({ id: 'smallFactory', name: 'Small Factory', category: 'factory', cost: 900, size: [2, 2], populationEffect: 10, powerUsage: 12, waterUsage: 6, maintenance: 25, buildTime: 45, color: '#b6654a', height: 3.2 }),
    heavyFactory: define({ id: 'heavyFactory', name: 'Heavy Factory', category: 'factory', cost: 1800, size: [3, 2], populationEffect: 20, powerUsage: 24, waterUsage: 16, maintenance: 48, buildTime: 65, color: '#7f4b3b', height: 4.2 }),
  },
  school: {
    schoolHall: define({ id: 'schoolHall', name: 'School Hall', category: 'school', cost: 650, size: [2, 2], populationEffect: 8, powerUsage: 4, waterUsage: 3, maintenance: 12, buildTime: 35, color: '#f2cf63', height: 2.4 }),
  },
  hospital: {
    clinicHospital: define({ id: 'clinicHospital', name: 'Clinic Hospital', category: 'hospital', cost: 1100, size: [2, 2], populationEffect: 12, powerUsage: 6, waterUsage: 8, maintenance: 22, buildTime: 50, color: '#f4b4b4', height: 2.8 }),
  },
  office: {
    officeTower: define({ id: 'officeTower', name: 'Office Tower', category: 'office', cost: 1500, size: [2, 2], populationEffect: 18, powerUsage: 10, waterUsage: 6, maintenance: 30, buildTime: 60, color: '#7ca2d8', height: 5.1 }),
  },
  energy: {
    windEnergy: define({ id: 'windEnergy', name: 'Wind Energy', category: 'energy', cost: 950, size: [2, 1], populationEffect: 0, powerUsage: -25, waterUsage: 0, maintenance: 18, buildTime: 35, color: '#9cd3d9', height: 4.8 }),
    hydroEnergy: define({ id: 'hydroEnergy', name: 'Hydro Energy', category: 'energy', cost: 1800, size: [3, 2], populationEffect: 0, powerUsage: -55, waterUsage: -10, maintenance: 40, buildTime: 70, color: '#4fa0d8', height: 3.4 }),
    electricPlant: define({ id: 'electricPlant', name: 'Electric Plant', category: 'energy', cost: 1250, size: [2, 2], populationEffect: 0, powerUsage: -40, waterUsage: 10, maintenance: 32, buildTime: 55, color: '#dad06a', height: 3.8 }),
    atomicPlant: define({ id: 'atomicPlant', name: 'Atomic Plant', category: 'energy', cost: 4200, size: [3, 3], populationEffect: 0, powerUsage: -120, waterUsage: 24, maintenance: 90, buildTime: 95, color: '#95f38a', height: 5.4 }),
  },
  station: {
    trainStation: define({ id: 'trainStation', name: 'Train Station', category: 'station', cost: 1300, size: [3, 2], populationEffect: 10, powerUsage: 6, waterUsage: 4, maintenance: 20, buildTime: 55, color: '#7f8894', height: 2.6 }),
    busStation: define({ id: 'busStation', name: 'Bus Station', category: 'station', cost: 700, size: [2, 2], populationEffect: 6, powerUsage: 3, waterUsage: 2, maintenance: 11, buildTime: 30, color: '#6c84d9', height: 2.1 }),
  },
  airport: {
    regionalAirport: define({ id: 'regionalAirport', name: 'Regional Airport', category: 'airport', cost: 3600, size: [4, 3], populationEffect: 24, powerUsage: 16, waterUsage: 10, maintenance: 72, buildTime: 90, color: '#d0d5df', height: 2.4 }),
  },
  port: {
    smallPort: define({ id: 'smallPort', name: 'Small Port', category: 'port', cost: 2100, size: [3, 2], populationEffect: 14, powerUsage: 7, waterUsage: 2, maintenance: 36, buildTime: 65, color: '#5590c0', height: 2.6 }),
  },
  road: {
    dirtRoad: define({ id: 'dirtRoad', name: 'Dirt Road', category: 'road', cost: 40, size: [1, 1], populationEffect: 0, powerUsage: 0, waterUsage: 0, maintenance: 1, buildTime: 25, color: '#7f5539', height: 0.1 }),
    asphaltRoad: define({ id: 'asphaltRoad', name: 'Asphalt Road', category: 'road', cost: 70, size: [1, 1], populationEffect: 0, powerUsage: 0, waterUsage: 0, maintenance: 2, buildTime: 25, color: '#4b5563', height: 0.12 }),
  },
  decoration: {
    bambooPark: define({ id: 'bambooPark', name: 'Bamboo Park', category: 'decoration', cost: 85, size: [1, 1], populationEffect: 2, powerUsage: 0, waterUsage: 0, maintenance: 1, buildTime: 25, color: '#5aa469', height: 0.9 }),
  },
};

export const BUILDING_INDEX = Object.values(BUILDING_TYPES).reduce(
  (result, category) => Object.assign(result, category),
  {},
);

export const getBuildingDefinition = (typeId) => BUILDING_INDEX[typeId];

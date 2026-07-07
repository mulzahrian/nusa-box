import { useBuildingStore } from '../store/buildingStore';
import { useCitizenStore } from '../store/citizenStore';
import { useEconomyStore } from '../store/economyStore';
import { BUILDING_INDEX } from '../game/buildings/buildingConfig';

let lastProcessedDateKey = null;

const categoryRevenue = {
  house: 16,
  factory: 120,
  school: 30,
  hospital: 26,
  office: 90,
  energy: 45,
  station: 55,
  airport: 140,
  port: 110,
};

export const calculateEconomySnapshot = () => {
  const economy = useEconomyStore.getState();
  const citizens = useCitizenStore.getState();
  const buildings = useBuildingStore.getState().buildings.filter((item) => item.status === 'active');
  const totals = buildings.reduce(
    (accumulator, building) => {
      const definition = BUILDING_INDEX[building.typeId];
      if (!definition) {
        return accumulator;
      }
      accumulator.maintenance += definition.maintenance || 0;
      accumulator.businesses += ['factory', 'office', 'airport', 'port', 'station'].includes(definition.category) ? 1 : 0;
      accumulator.housing += definition.category === 'house' ? definition.populationEffect || 0 : 0;
      accumulator.businessIncome += categoryRevenue[definition.category] ?? 20;
      return accumulator;
    },
    { maintenance: economy.baseMaintenance, businesses: 0, housing: citizens.housingCapacity, businessIncome: 0 },
  );

  const taxes = Math.round(citizens.population * 18 * economy.taxRate);
  const housingGap = Math.max(0, totals.housing - citizens.population);
  const happinessFactor = (citizens.happiness - 50) / 14;
  const growth = Math.max(-2, Math.min(8, Math.round(happinessFactor + housingGap * 0.08)));

  return {
    income: taxes + totals.businessIncome,
    expenses: totals.maintenance,
    populationGrowth: growth,
    businesses: totals.businesses,
    housing: Math.max(citizens.housing, totals.housing),
  };
};

export const runEconomyTick = (dateKey) => {
  if (dateKey && dateKey === lastProcessedDateKey) {
    return null;
  }

  const snapshot = calculateEconomySnapshot();
  const economy = useEconomyStore.getState();
  const citizens = useCitizenStore.getState();
  economy.applyDailyEconomy(snapshot);
  citizens.applyDailyGrowth(snapshot.populationGrowth, snapshot.housing);
  lastProcessedDateKey = dateKey ?? `${Date.now()}`;
  return snapshot;
};

export const RANDOM_EVENTS = [
  { id:'power_shortage', title:'Power Shortage', body:'Citizens are complaining about blackouts.', kind:'danger', when:'power deficit' },
  { id:'water_crisis', title:'Water Crisis', body:'Water demand exceeds supply.', kind:'danger', when:'water deficit' },
  { id:'air_pollution', title:'Air Pollution', body:'Pollution is harming citizens health.', kind:'warn', when:'pollution above 30' },
  { id:'citizen_thrilled', title:'Citizens are thrilled!', body:'Your city is a wonderful place.', kind:'success', when:'happiness at least 85' },
  { id:'town_promoted', title:'Town promoted!', body:'Population passed 1,000. Town tier reached.', kind:'success', when:'population at least 1000' },
  { id:'city_promoted', title:'City promoted!', body:'Population passed 10,000.', kind:'success', when:'population at least 10000' },
];
export const DISASTER_TYPES = ['fire', 'earthquake', 'flood'];
export default RANDOM_EVENTS;

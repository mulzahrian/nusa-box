// Developer: add new building types here
export const BUILDING_DEFS = [
  { id:'road', iconKey:'road', name:'Road', cost:50, cat:'road', color:0x5a6070, h:0.05, size:1 },
  { id:'res_low', iconKey:'res_low', name:'Low Density', cost:200, cat:'res', color:0xffdd88, accent:0xdd8800, h:1.2, jobs:0, homes:15, power:1, water:1, tax:8, size:1 },
  { id:'res_med', iconKey:'res_med', name:'Med Density', cost:600, cat:'res', color:0xff8fab, accent:0xcc2255, h:2.6, homes:30, power:3, water:3, tax:22, size:2 },
  { id:'res_high', iconKey:'res_high', name:'High Density', cost:1800, cat:'res', color:0x88ccff, accent:0x1155aa, h:5, homes:60, power:8, water:8, tax:75, size:2 },
  { id:'com_shop', iconKey:'com_shop', name:'Shop', cost:300, cat:'com', color:0x55ddcc, accent:0x117766, h:1.4, jobs:6, power:2, water:1, tax:25, size:1 },
  { id:'com_mall', iconKey:'com_mall', name:'Mall', cost:1500, cat:'com', color:0x55aaff, accent:0x1144bb, h:2.2, jobs:25, power:6, water:3, tax:90, size:3 },
  { id:'ind_factory', iconKey:'ind_factory', name:'Factory', cost:800, cat:'ind', color:0xffaa44, accent:0xaa5500, h:1.6, jobs:20, power:6, water:4, tax:60, pollution:5, size:2 },
  { id:'ind_office', iconKey:'ind_office', name:'Office', cost:1200, cat:'com', color:0xaa88ff, accent:0x5522aa, h:4.2, jobs:30, power:5, water:2, tax:110, size:2 },
  { id:'bank', iconKey:'bank', name:'Bank', cost:2500, cat:'com', color:0xffd700, accent:0x996600, h:3.5, jobs:40, power:4, water:2, tax:200, size:2 },
  { id:'gas_station', iconKey:'gas_station', name:'Gas Station', cost:500, cat:'com', color:0xffee55, accent:0xdd8800, h:1, jobs:4, power:2, water:1, tax:40, size:1 },
  { id:'skyscraper', iconKey:'skyscraper', name:'Skyscraper A', cost:8000, cat:'com', color:0x6655ff, accent:0x221188, h:10, jobs:120, homes:60, power:20, water:12, tax:400, unlock:'metro', size:2 },
  { id:'skyscraper2', iconKey:'skyscraper2', name:'Skyscraper B', cost:10000, cat:'com', color:0x00ccff, accent:0x004466, h:13, jobs:150, homes:80, power:25, water:15, tax:500, unlock:'metro', size:2 },
  { id:'skyscraper3', iconKey:'skyscraper3', name:'Skyscraper C', cost:18000, cat:'com', color:0xff6600, accent:0x882200, h:16, jobs:200, homes:100, power:35, water:20, tax:800, unlock:'big', size:3 },
  { id:'power_coal', iconKey:'power_coal', name:'Coal Plant', cost:1500, cat:'util', color:0x99aabb, accent:0x445566, h:1.8, powerGen:80, pollution:8, size:3 },
  { id:'power_solar', iconKey:'power_solar', name:'Solar Farm', cost:2200, cat:'util', color:0xffee33, h:0.3, powerGen:50, size:3 },
  { id:'power_wind', iconKey:'power_wind', name:'Wind Farm', cost:2000, cat:'util', color:0xddeeff, h:5, powerGen:60, size:2 },
  { id:'water_tile', iconKey:'water_tile', name:'Lake / River', cost:80, cat:'util', color:0x2299ff, h:0.05, size:1, isWater:true },
  { id:'water_pump', iconKey:'water_pump', name:'Water Pump', cost:900, cat:'util', color:0x44bbff, accent:0x1166aa, h:1, waterGen:80, size:1 },
  { id:'park', iconKey:'park', name:'Park', cost:200, cat:'public', color:0x44cc55, h:0.2, happy:5, size:1 },
  { id:'school', iconKey:'school', name:'School', cost:1200, cat:'public', color:0xff6655, accent:0xaa2200, h:1.6, happy:3, edu:1, size:2 },
  { id:'hospital', iconKey:'hospital', name:'Hospital', cost:2000, cat:'public', color:0xffffff, accent:0xff3344, h:2.4, happy:4, size:2 },
  { id:'police', iconKey:'police', name:'Police', cost:900, cat:'public', color:0x4477ff, accent:0xffdd00, h:1.4, happy:2, size:1 },
  { id:'fire', iconKey:'fire', name:'Fire Station', cost:900, cat:'public', color:0xff4422, accent:0xffdd00, h:1.4, happy:2, size:1 },
  { id:'railway', iconKey:'railway', name:'Railway', cost:80, cat:'transit', color:0x555566, h:0.08, size:1 },
  { id:'bus_stop', iconKey:'bus_stop', name:'Bus Stop', cost:300, cat:'transit', color:0xffcc22, accent:0x885500, h:0.5, happy:2, size:1 },
  { id:'metro', iconKey:'metro', name:'Metro Station', cost:5000, cat:'transit', color:0xbb55ff, accent:0x660099, h:2.2, happy:6, unlock:'metro', size:2 },
  { id:'airport', iconKey:'airport', name:'Airport', cost:15000, cat:'transit', color:0xddeeff, accent:0x445566, h:1, happy:8, tax:200, unlock:'big', size:4 },
  { id:'bulldoze', iconKey:'bulldoze', name:'Bulldoze', cost:0, cat:'tool', color:0xef4444, size:1 },
  { id:'axe', iconKey:'axe', name:'Tebang Pohon', cost:0, cat:'tool', color:0x44bb44, size:1 },
  { id:'hunt', iconKey:'hunt', name:'Berburu', cost:0, cat:'tool', color:0xcc4400, size:1 },
];
export const CATEGORY_DEFS = [
  { id:'road', iconKey:'cat_road', name:'Roads', items:['road','railway'] },
  { id:'res', iconKey:'cat_res', name:'Housing', items:['res_low','res_med','res_high'] },
  { id:'com', iconKey:'cat_com', name:'Commerce', items:['com_shop','com_mall','ind_office','bank','gas_station','skyscraper','skyscraper2','skyscraper3'] },
  { id:'ind', iconKey:'cat_ind', name:'Industry', items:['ind_factory'] },
  { id:'util', iconKey:'cat_util', name:'Utilities', items:['power_coal','power_solar','power_wind','water_tile','water_pump'] },
  { id:'public', iconKey:'cat_pub', name:'Public', items:['park','school','hospital','police','fire'] },
  { id:'transit', iconKey:'cat_transit', name:'Transit', items:['bus_stop','metro','airport'] },
  { id:'tool', iconKey:'cat_tool', name:'Tools', items:['bulldoze','axe','hunt'] },
];
export const BUILDINGS = Object.fromEntries(BUILDING_DEFS.map(({ id, ...def }) => [id, { ...def }]));
export const CATEGORIES = CATEGORY_DEFS.map(({ iconKey, ...category }) => ({ ...category, iconKey }));
export function createBuildingCatalog(pxImg, mergeFn) {
  // Jika ada mergeFn dari Registry, tambahkan extra buildings dari JSON
  const defs = mergeFn ? mergeFn(BUILDING_DEFS) : BUILDING_DEFS;
  return {
    BUILDINGS: Object.fromEntries(defs.map(({ id, iconKey, ...def }) => [id, { ...def, icon: pxImg(iconKey || 'road') }])),
    CATEGORIES: CATEGORY_DEFS.map(({ iconKey, ...category }) => ({ ...category, icon: pxImg(iconKey, 16) })),
  };
}
export default BUILDING_DEFS;

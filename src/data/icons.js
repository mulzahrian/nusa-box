/**
 * Pixel Art Icon System
 * Renders 8x8 pixel art icons as SVG data URIs
 */

const PALETTE = {
  '_': null, '0': '#000', '1': '#111', 'D': '#444', 'd': '#555',
  'G': '#888', 'g': '#aaa', 'W': '#fff', 'w': '#ddd',
  'Y': '#ffe600', 'y': '#aa9900', 'R': '#ff4444', 'r': '#882222',
  'B': '#44aaff', 'b': '#2244bb', 'C': '#00e5ff', 'c': '#006688',
  'P': '#cc44ff', 'p': '#660099', 'O': '#ff8800', 'o': '#884400',
  'N': '#00dd66', 'n': '#006633', 'T': '#cc9966', 't': '#886633',
  'K': '#553311', 'k': '#221100', 'S': '#88ccff', 's': '#3366aa',
  'M': '#ff44cc', 'm': '#880066', 'L': '#88ff00', 'l': '#448800',
  'E': '#ffff44', 'e': '#888800', 'A': '#ff9944', 'a': '#cc6600',
  'Q': '#00ffff', 'q': '#008888', 'V': '#55ee88', 'v': '#227744',
  'F': '#ff6644', 'f': '#882200', 'H': '#6699ff', 'h': '#334488',
  'Z': '#ffccaa', 'z': '#cc8866', 'X': '#ff88ff', 'x': '#660066',
  'I': '#ffddbb', 'i': '#aa7744',
};

const ICONS = {
  road:       ['DDDDDDDD','GGGGGGGG','G__YY__G','G______G','G______G','G__YY__G','GGGGGGGG','DDDDDDDD'],
  railway:    ['DtDGGDtD','DtDGGDtD','TTTTTTTT','DtDGGDtD','DtDGGDtD','TTTTTTTT','DtDGGDtD','DtDGGDtD'],
  res_low:    ['___RR___','__RrRR__','_RrRRRR_','WWWBBWWW','WWWBBWWW','WWWDDWWW','TTTTTTTT','________'],
  res_med:    ['_HHHHHH_','HswwswwH','HswwswwH','HssssssH','HswwswwH','HHHDDHhH','TTTTTTTT','________'],
  res_high:   ['SSSSSSSS','SbWbWbWS','SbbbbbbS','SbWbWbWS','SbbbbbbS','SbWbWbWS','SSDDDDSS','TTTTTTTT'],
  com_shop:   ['_OOOOO__','OOOOOOOO','YYYYYYYY','WwBBwwWW','WwBBwwWW','WWWDDWWW','TTTTTTTT','________'],
  com_mall:   ['RRRRRRRR','RoooooOR','RWWBBWWR','RWWBBWWR','RWWBBWWR','RWWDDWWR','TTTTTTTT','________'],
  ind_office: ['_HHHHHH_','HswwswwH','HswwswwH','HswwswwH','HswwswwH','HHHDDHHH','TTTTTTTT','________'],
  bank:       ['YYYYYYYY','YtIIIItY','YtIIIItY','Yt_BB_tY','Yt_BB_tY','YtDDDDtY','YYYYYYYY','TTTTTTTT'],
  gas_station:['_RRRRRR_','_RaAaAR_','GGGGGGGG','G_OO__GG','G_OO__GG','GGGGGGGG','YAAAAAAY','TTTTTTTT'],
  skyscraper: ['__BBBB__','_BSwwSB_','_BSwwSB_','_BSwwSB_','_BSwwSB_','_BBDDBB_','BBBBBBBB','TTTTTTTT'],
  skyscraper2:['_CCCCCC_','CQwwwwQC','CQwwwwQC','CQwwwwQC','CQwwwwQC','CCDDDDCC','CCCCCCCC','TTTTTTTT'],
  skyscraper3:['_XXXXXX_','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPwwwwPX','XPDDDDPX','TTTTTTTT'],
  ind_factory:['_1___1__','_1___1__','_111111_','G1DDD1GG','GGDDDGGG','RRRRRRGG','RwwwwRRR','TTTTTTTT'],
  park:       ['_N___N__','NNN_NNN_','_N___N__','________','__N_____','_NNN____','__N_____','VVVVVVVV'],
  school:     ['_RRRRRR_','RYYYYYY_','R_R__R_R','R_B__B_R','R_B__B_R','RRDDDRRR','TTTTTTTT','________'],
  hospital:   ['_WWWWWW_','WW_RR_WW','W_RRRR_W','WW_RR_WW','WW____WW','W_B__B_W','WWDDDDWW','TTTTTTTT'],
  police:     ['__BBBB__','_BbSSbB_','BbS__SbB','B_SSSS_B','BBbSSbBB','_BB__BB_','BBDDDDBB','TTTTTTTT'],
  fire:       ['_FFFFFF_','RRRRRRRR','RWWWWWWR','RWWWWWWR','RAAAAAWR','RRRRRRRR','AAAAAAAA','TTTTTTTT'],
  power_coal: ['_1___1__','_1___1__','_111111_','GGGGGGGG','GGGDdDGG','GGGDdDGG','GGGGGGGG','TTTTTTTT'],
  power_solar:['YyYyYyYy','yYyYyYyY','YyYyYyYy','yYyYyYyY','YyYyYyYy','yYyYyYyY','_DDDDDD_','TTTTTTTT'],
  power_wind: ['____W___','__gWW___','__W__gW_','gWWWW___','__W__gW_','__gWW___','____DDDD','TTTTTTTT'],
  water_tile: ['BBbBBbBB','bBBBbBBb','BBbBBBbB','bBBcbBBb','BBBBBBcB','bBBBbBBb','BBcBBBBB','bBBBbBBb'],
  water_pump: ['___BB___','__BBBBB_','_BBBBBBB','_B_BBB_B','_BDDDB_B','__DDDBB_','BBBBBBB_','TTTTTTTT'],
  bus_stop:   ['__OOOO__','_OwwwwO_','OOwwwwOO','OOwwwwOO','_OOooOO_','____OO__','____DD__','TTTTTTTT'],
  metro:      ['PPPPPPPP','PwwwwwwP','P______P','PPPPPPPP','________','_PPPPPP_','_P_DD_P_','TTTTTTTT'],
  airport:    ['___gWg__','_gWWWWg_','gWWWWWWg','_gWWWWg_','GGGGGGGG','GGDDDDGG','GGGGGGGG','TTTTTTTT'],
  bulldoze:   ['__YY____','_YYYYOY_','YYYYYYYY','OYYYYYO_','OOYYYOO_','_OOOOO__','__OOOO__','___OO___'],
  axe:        ['____NNN_','___NnNN_','__NnnNN_','_NnnNNN_','NnnNNN__','NNNN____','NNN_____','NN______'],
  hunt:       ['R_______','RR______','_RRR____','__RRRR__','___RRRR_','____RRRR','_____RRR','______RR'],
  // Stats/UI
  ic_money:   ['__YYYY__','_YyYYYY_','YYyyyyyY','YYyYyyyY','YYyYyyyY','YYyyyyyY','_YyYYYY_','__YYYY__'],
  ic_pop:     ['_ZZ__ZZ_','ZZZZZZZZ','_ZZ__ZZ_','_ZZZZZZ_','ZZZZZZZZ','Z_ZZZZ_Z','__Z__Z__','__Z__Z__'],
  ic_happy:   ['__YYYY__','_YYYYYY_','YYyYyYYY','YYYYYYYY','YY_YY_YY','YYyYYyYY','_YYYYYY_','__YYYY__'],
  ic_save:    ['BBBBBBBB','BBYYYY_B','BBYYYY_B','BBYYYY_B','BBBBBBBB','BwwwwwwB','BwwwwwwB','BBBBBBBB'],
  ic_music:   ['__EEE___','__E_EE__','__E__EE_','__E___E_','EEEEE_E_','EEEEEEE_','___EEEE_','___EEE__'],
  // Categories
  cat_road:   ['DDDDDDDD','GGGGGGGG','G__YY__G','G______G','G______G','G__YY__G','GGGGGGGG','DDDDDDDD'],
  cat_res:    ['___RR___','__RrRR__','_RrRRRR_','WWWBBWWW','WWWBBWWW','WWWDDWWW','TTTTTTTT','________'],
  cat_com:    ['_OOOOO__','OOOOOOOO','YYYYYYYY','WwBBwwWW','WwBBwwWW','WWWDDWWW','TTTTTTTT','________'],
  cat_ind:    ['_1___1__','_1___1__','_111111_','G1DDD1GG','GGDDDGGG','RRRRRRGG','TTTTTTTT','________'],
  cat_util:   ['___EE___','__EEEE__','_EEEEEE_','EEEEEEE_','__EEE___','___EEE__','____EE__','_____E__'],
  cat_pub:    ['___WW___','___WW___','WWWWWWWW','WWWWWWWW','___WW___','___WW___','_TTTTTT_','________'],
  cat_transit:['________','_OOOOOO_','OOwwwwOO','OOwwwwOO','_OOOOOO_','____OO__','_oo__oo_','________'],
  cat_tool:   ['_GGG____','_GGGg___','GGGGg___','GGGGg___','__GGg___','__GGg___','__GGg___','__GGg___'],
  // Menu
  mn_new:     ['____TT__','___TTT__','__TTTT__','TTTTTTTT','_TTTTTT_','__TTTT__','___TTT__','____TT__'],
  mn_continue:['________','_N______','_NNN____','_NNNNN__','_NNNNNNNN','_NNNNN__','_NNN____','_N______'],
  mn_sandbox: ['_QqQqQq_','QqQqQqQq','qQqQqQqQ','QqQqQqQq','qQqQqQqQ','QqQqQqQq','qQqQqQqQ','_QqQqQq_'],
  mn_settings:['__gGg___','_gGGGg__','gGGGGGg_','GGG__GGG','GGG__GGG','gGGGGGg_','_gGGGg__','__gGg___'],
};

function renderSVG(rows, size) {
  const h = rows.length;
  const w = rows[0].length;
  const ps = size / w;
  let rects = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === '_' || c === '.') continue;
      const fill = PALETTE[c] || '#f0f';
      rects += `<rect x="${(x * ps).toFixed(1)}" y="${(y * ps).toFixed(1)}" width="${ps.toFixed(1)}" height="${ps.toFixed(1)}" fill="${fill}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

export function getIconSrc(key, size = 24) {
  const rows = ICONS[key];
  if (!rows) return null;
  return 'data:image/svg+xml;base64,' + btoa(renderSVG(rows, size));
}

export function getIconHTML(key, size = 24) {
  const src = getIconSrc(key, size);
  if (!src) return '❓';
  return `<img src="${src}" width="${size}" height="${size}" style="image-rendering:pixelated;vertical-align:middle;display:inline-block">`;
}

export { ICONS, PALETTE };

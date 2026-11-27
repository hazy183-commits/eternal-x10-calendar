const warsaw = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw', month: '2-digit', day: '2-digit',
});
export const CHRISTMAS_CREST = '/images/holiday/clan-crest-christmas.png';
export function christmasCard(params, date = new Date()) {
  if (params.get('season') === 'christmas') return true;
  if (params.get('season') === 'classic') return false;
  const [day, month] = warsaw.format(date).split('/').map(Number);
  return month === 12 && day >= 6 && day <= 27;
}

// Coordinates keep decorations at the edge of the original artwork, away from card labels.
const SCENES = {
  antharas: [230, 36, 28, '#ced3a1', '#be7054', 'pine', 1],
  baium: [185, 29, 17, '#d4e7ff', '#89a4dd', 'frost', 0],
  core: [225, 39, 19, '#bef7ff', '#44b2c9', 'frost', 2],
  frintezza: [220, 34, 32, '#f2c782', '#b877a8', 'ribbon', 0],
  orfen: [255, 31, 24, '#cfe9b3', '#a63445', 'pine', 2],
  'queen-ant': [190, 43, 23, '#ffd691', '#ab5545', 'pine', 0],
  valakas: [210, 38, 34, '#ffe0a3', '#ed6544', 'ribbon', 2],
  zaken: [205, 49, 32, '#ffe2ad', '#ce4d54', 'ribbon', 1],
  aden: [254, 33, 30, '#ffdfa1', '#a83e4f', 'pine', 2],
  dion: [196, 45, 17, '#ffd99d', '#a84951', 'pine', 1],
  giran: [258, 35, 28, '#fff0b5', '#d25045', 'ribbon', 1],
  gludio: [203, 29, 24, '#f3f5e8', '#d9b263', 'frost', 0],
  goddard: [238, 40, 24, '#ddecff', '#cca16c', 'frost', 1],
  innadril: [207, 37, 21, '#bce8e3', '#c17572', 'frost', 2],
  oren: [231, 39, 25, '#ffd592', '#b34450', 'pine', 1],
  rune: [234, 31, 31, '#f8cb93', '#9f445a', 'ribbon', 2],
  schuttgart: [244, 27, 19, '#e2f2ff', '#91b6d2', 'frost', 0],
  'fortress-of-resistance': [238, 37, 33, '#f7ce93', '#b3474a', 'ribbon', 0],
  'devastated-castle': [186, 37, 20, '#e3e9f4', '#aebcc8', 'frost', 2],
  'bandit-stronghold': [224, 41, 28, '#fbd18e', '#ab4556', 'pine', 1],
  'rainbow-spring-chateau': [242, 39, 26, '#ffe0af', '#83c1ad', 'pine', 0],
  'wild-beast-reserve': [245, 31, 29, '#f3e3bc', '#a3554b', 'pine', 2],
  'fortress-of-the-dead': [213, 34, 24, '#f6d3a3', '#a966aa', 'ribbon', 2],
  pvp: [223, 40, 37, '#fff1ca', '#c04749', 'ribbon', 1],
  olympiad: [205, 28, 20, '#e5edf8', '#caa063', 'frost', 1],
  rb: [210, 38, 25, '#ffd79a', '#b94e59', 'pine', 1],
  colloseum: [211, 33, 23, '#f6dfa5', '#8bb7d0', 'frost', 2],
  default: [175, 36, 20, '#f6d3a3', '#a84351', 'pine', 2],
};
// Mix a little cool ambient light into the illustration while retaining the
// original flame and candle colours. Applied before text and crest rendering.
const WINTER_GRADES = {
  frost: [[.92, .025, .025], [.015, .98, .025], [.035, .06, 1.02]],
  pine: [[.96, .025, .01], [.015, 1, .02], [.025, .045, 1.01]],
  ribbon: [[1.015, .02, 0], [.012, .99, .02], [.035, .04, 1.015]],
};
export function winterArtwork(image, scene = '') {
  const style = scene ? (SCENES[scene] ?? SCENES.default)[5] : 'pine';
  return image.recomb(WINTER_GRADES[style]);
}

const DAILY = [163, 30, 21, '#ffe1a4', '#b54552', 'pine', 0];

// Small scene-specific lights follow visible architecture on these source crops.
const FROST_EDGES = {
  aden: ['M118 651L357 540', 'M992 510L1153 587', 'M59 315L149 316'],
  baium: ['M35 401L112 377L135 365', 'M1032 349L1109 372L1168 389'],
  core: ['M23 241L104 241L151 231', 'M1051 232L1110 242L1172 241'],
};
const FEATURE_LIGHTS = {
  baium: [[158, 436], [222, 412], [984, 412], [1065, 435], [1120, 469]],
  core: [[97, 229], [116, 240], [139, 245], [1063, 235], [1094, 232], [1118, 218]],
  frintezza: [[105, 201], [128, 214], [152, 221], [1038, 220], [1065, 214], [1088, 201]],
  valakas: [[75, 316], [110, 330], [145, 324], [1045, 330], [1081, 334], [1124, 315]],
  'bandit-stronghold': [[88, 200], [123, 215], [163, 226], [195, 231], [1020, 228], [1057, 218], [1098, 204]],
  aden: [[153, 630], [200, 608], [248, 587], [297, 564], [344, 543],
    [895, 431], [944, 483], [984, 509], [1022, 533], [1070, 552], [1129, 577]],
  zaken: [[37, 162], [63, 177], [91, 183], [120, 180], [145, 166],
    [1024, 155], [1049, 173], [1077, 180], [1105, 177], [1134, 167]],
};

export function holidayScenery(width, key = '', kind = '') {
  const [span, top, depth, light, accent, style, variation] =
    key ? SCENES[key] ?? SCENES[kind] ?? SCENES.default : DAILY;
  const icy = style === 'frost';
  const warm = style === 'ribbon';
  const winter = icy ? '#a4d8ff' : warm ? '#aebed8' : '#c2e0eb';
  const glow = warm ? '#ed9b50' : light;
  const scale = width / 1200;
  const haze = key ? [
    [0, 70 + top, 230 + span / 3, 290, 'winter-haze', icy ? .66 : .42],
    [1200, 135 + depth, 220, 260, 'winter-haze', .37],
    [variation === 1 ? 115 : 1090, 245 + depth, 170, 130, 'warm-haze', warm ? .66 : .41],
    [790, 10, 500, 225, 'winter-haze', warm ? .32 : .79],
  ] : [[1090, 83, 225, 118, 'warm-haze', .72], [85, 195, 190, 180, 'winter-haze', .55]];
  const frost = (FROST_EDGES[key] ?? []).map((edge) =>
    `<path d="${edge}" fill="none" stroke="#d5edff" stroke-opacity=".23" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 3 8 2"/><path d="${edge}" fill="none" stroke="#e3f1fa" stroke-opacity=".49" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="5 2 14 3"/>`).join('');
  const atmosphere = haze.map(([x, y, rx, ry, fill, opacity]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${fill})" opacity="${opacity}"/>`).join('');
  const lights = FEATURE_LIGHTS[key] ?? [];
  const bulbs = lights.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="14" fill="url(#festive-bulb)"/><circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2.3 : 1.7}" fill="${i % 4 === 0 ? accent : light}" opacity=".9"/>`).join('');
  const snowfall = Array.from({ length: key ? (icy ? 62 : warm ? 24 : 45) : 13 }, (_, i) => {
    const drift = (i * 83 + span) % (key ? 182 : 114);
    const x = !key || i % 2 ? 1187 - drift : 13 + drift;
    const y = 18 + (i * 61 + depth * 3) % (key ? 336 : 69);
    // Keep the seasonal crest and clan name clear.
    if (x < 180 && y < 130) return '';
    const radius = [1.1, 1.65, 1.35, 2.3, 0.8][i % 5];
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${winter}" opacity="${(.24 + (i % 5) * .08).toFixed(2)}"/>`;
  }).join('');
  return `<g transform="scale(${scale})">
    <defs>
      <radialGradient id="winter-haze"><stop stop-color="${winter}" stop-opacity=".63"/><stop offset="1" stop-color="${winter}" stop-opacity="0"/></radialGradient>
      <radialGradient id="warm-haze"><stop stop-color="${glow}" stop-opacity=".54"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="festive-bulb"><stop stop-color="${light}" stop-opacity=".8"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    </defs>
    ${atmosphere}${frost}${snowfall}${bulbs}
  </g>`;
}

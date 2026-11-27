import sharp from 'sharp';

import { isChristmasSeason } from './christmasSeason.js';

export const CHRISTMAS_CREST = '/images/holiday/clan-crest-christmas.png';
export function christmasCard(params, date = new Date()) {
  if (params.get('season') === 'christmas') return true;
  if (params.get('season') === 'classic') return false;
  return isChristmasSeason(date);
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
// Grade original art before the card typography, flag and crest are rendered.
const WINTER_GRADES = {
  frost: [[.78, .06, .025], [.025, .98, .045], [.09, .105, 1.04]],
  pine: [[.87, .045, .025], [.035, 1, .025], [.065, .09, 1.02]],
  ribbon: [[.98, .045, .005], [.02, .95, .025], [.065, .10, 1.02]],
};
const SNOW_STRENGTH = { frost: .76, pine: .63, ribbon: .42 };

export async function winterArtwork(image, scene = '') {
  const style = scene ? (SCENES[scene] ?? SCENES.default)[5] : 'pine';
  const { data, info } = await image.recomb(WINTER_GRADES[style])
    .toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const luminance = new Uint8Array(width * height);
  for (let i = 0; i < luminance.length; i++) {
    const p = i * channels;
    luminance[i] = Math.round(data[p] * .24 + data[p + 1] * .62 + data[p + 2] * .14);
  }

  // Find lit horizontal ridges in each source crop and lay a shallow, irregular
  // strip of frost along them. Draw from an immutable map to avoid spreading.
  const limit = Math.floor(height * (scene ? .77 : .56));
  for (let y = 28; y < limit; y++) {
    for (let x = 5; x < width - 5; x++) {
      const u = x / width;
      const v = y / height;
      if (scene && u > .29 && u < .71 && v < .55 && !['aden', 'dion', 'goddard'].includes(scene)) continue;
      const i = y * width + x;
      const p = i * channels;
      const value = luminance[i];
      const upper = luminance[i - 3 * width];
      const lower = luminance[i + 4 * width];
      const horizontal = Math.abs(luminance[i - 4] - luminance[i + 4]);
      const edge = value - lower;
      const redHeat = data[p] - data[p + 2];
      if (edge < 13 || value < 64 || value > 226 || upper > value + 24 || edge < horizontal || redHeat > 52) continue;

      const noise = ((x * 29 ^ y * 17) & 31) / 31;
      const opacity = Math.min(.8, (edge - 9) / 51) * SNOW_STRENGTH[style] * (.76 + .24 * noise);
      for (let step = 0; step < 3; step++) {
        const offset = p - step * width * channels;
        const amount = opacity * (1 - step * .31);
        data[offset] += (211 - data[offset]) * amount;
        data[offset + 1] += (232 - data[offset + 1]) * amount;
        data[offset + 2] += (246 - data[offset + 2]) * amount;
      }
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
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

// Paint foliage from the edge of the crop, with slightly different drape and
// ornament colours per scene. Nothing crosses the event title or time blocks.
function festiveBough(span, depth, accent, light, style, variation, daily) {
  const x = daily ? 1195 : 1206;
  const y = daily ? 3 : [14, 30, 9][variation];
  const length = daily ? 150 : span * 0.82;
  const snow = style !== 'ribbon';
  const seeded = (i) => ((i * 73 + depth * 37) % 127) / 127;
  const stroke = ['#14291e', '#2c4b32', '#54704a', '#758469'];
  const branches = Array.from({ length: 16 }, (_, i) => {
    const t = i / 16;
    const bx = -t * length;
    const by = 3 + t * depth;
    const reach = (32 - 16 * t) * (.7 + seeded(i) * .6);
    const slope = i % 2 ? 1 : -.68;
    const fan = Array.from({ length: 13 }, (_, j) => {
      const along = j / 13;
      const dx = bx - along * reach;
      const dy = by + along * reach * slope;
      const tip = 5 + seeded(i * 13 + j) * 12;
      return `M${dx.toFixed(1)} ${dy.toFixed(1)}l${(-tip).toFixed(1)} ${(-tip * .47).toFixed(1)}m${tip.toFixed(1)} ${(tip * .47).toFixed(1)}l${(-tip * .53).toFixed(1)} ${(tip * .7).toFixed(1)}`;
    }).join('');
    return `<path d="M${bx} ${by}l${-reach} ${reach * slope}" fill="none" stroke="#282719" stroke-width="2"/><path d="${fan}" fill="none" stroke="${stroke[i % stroke.length]}" stroke-width="${i % 3 === 0 ? 2 : 1.35}" stroke-linecap="round"/>`;
  }).join('');
  const powder = snow ? Array.from({ length: 30 }, (_, i) => {
    const t = i / 30;
    return `<ellipse cx="${(-length * t).toFixed(1)}" cy="${(t * depth + seeded(i) * 12).toFixed(1)}" rx="${(2 + seeded(i + 1) * 6).toFixed(1)}" ry="${(1 + seeded(i + 2) * 2.5).toFixed(1)}" fill="#dcebf0" opacity="${(.26 + seeded(i + 3) * .56).toFixed(2)}"/>`;
  }).join('') : '';
  const bulbs = Array.from({ length: daily ? 6 : 9 }, (_, i) => {
    const t = (i + .6) / 10;
    const bx = -length * t;
    const by = depth * t + 4 + seeded(i + 8) * 21;
    return `<circle cx="${bx}" cy="${by}" r="15" fill="url(#festive-bulb)" opacity=".72"/><circle cx="${bx}" cy="${by}" r="2.3" fill="${i % 3 ? light : accent}"/><circle cx="${bx}" cy="${by}" r=".9" fill="#fff9dd"/>`;
  }).join('');
  const ornaments = [ .2 + variation * .06, .61 + variation * .04 ].slice(0, daily ? 1 : 2).map((t, i) => {
    const bx = -length * t;
    const by = depth * t + 13;
    const drop = 15 + (variation + i * 2) * 4;
    const size = daily ? 8 : (i ? 9 : 12);
    const color = i ? (style === 'frost' ? '#77a6c3' : '#c99448') : '#a32738';
    return `<g transform="translate(${bx} ${by})"><path d="M0 0v${drop}" stroke="#c3a477" stroke-width="1"/><g transform="translate(0 ${drop + size})"><circle cx="2" cy="3" r="${size + 1}" fill="#0b0b0b" opacity=".65"/><circle r="${size}" fill="${color}"/><circle r="${size}" fill="url(#festive-glass)"/><rect x="-3" y="${-size - 3}" width="6" height="4" rx="1" fill="#d0a868"/><path d="M${-size*.75} 1Q0 7 ${size*.75} 1" fill="none" stroke="#ffe198" stroke-opacity=".62" stroke-width=".8"/></g></g>`;
  }).join('');
  return `<g transform="translate(${x} ${y})"><path d="M4 4Q${-length*.50} ${depth*.82} ${-length} ${depth+5}" fill="none" stroke="#111d14" stroke-width="10" stroke-linecap="round"/>${branches}${powder}${bulbs}${ornaments}</g>`;
}

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
  const snowfall = Array.from({ length: key ? (icy ? 105 : warm ? 41 : 76) : 13 }, (_, i) => {
    const drift = (i * 83 + span) % (key ? 326 : 114);
    const x = !key || i % 2 ? 1187 - drift : 13 + drift;
    const y = 18 + (i * 61 + depth * 3) % (key ? 438 : 69);
    // Keep the seasonal crest and clan name clear.
    if (x < 180 && y < 130) return '';
    const radius = [1.05, 2.1, 1.45, 3.25, 0.85][i % 5];
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${winter}" opacity="${(.33 + (i % 5) * .10).toFixed(2)}"/>`;
  }).join('');
  return `<g transform="scale(${scale})">
    <defs>
      <radialGradient id="winter-haze"><stop stop-color="${winter}" stop-opacity=".63"/><stop offset="1" stop-color="${winter}" stop-opacity="0"/></radialGradient>
      <radialGradient id="warm-haze"><stop stop-color="${glow}" stop-opacity=".54"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="festive-glass" cx=".34" cy=".27" r=".75"><stop stop-color="#fff4cf" stop-opacity=".86"/><stop offset=".35" stop-color="#fff4cf" stop-opacity=".19"/><stop offset="1" stop-color="#110508" stop-opacity=".64"/></radialGradient>
      <radialGradient id="festive-bulb"><stop stop-color="${light}" stop-opacity=".8"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    </defs>
    ${atmosphere}${frost}${snowfall}${bulbs}${festiveBough(span, depth, accent, light, style, variation, !key)}
  </g>`;
}

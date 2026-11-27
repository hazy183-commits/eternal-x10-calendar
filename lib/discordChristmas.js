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
  default: [175, 36, 20, '#f6d3a3', '#a84351', 'pine', 2],
};
const DAILY = [163, 30, 21, '#ffe1a4', '#b54552', 'pine', 0];

export function holidayScenery(width, key = '', kind = '') {
  const [span, top, sag, light, accent, style, ornament] =
    key ? SCENES[key] ?? SCENES[kind] ?? SCENES.default : DAILY;
  const end = width - 43;
  const start = end - span;
  const yAt = (t) => top + 4 * sag * t * (1 - t);
  const foliage = style === 'frost' ? ['#526a68', '#8caaa6', '#d8edee'] : ['#223829', '#416344', '#71825a'];
  const needles = Array.from({ length: 46 }, (_, i) => {
    const t = i / 45;
    const x = start + span * t;
    const y = yAt(t);
    const length = 7 + (i * 7 % 12);
    return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q-7 -5 -${length} -${length}M${x.toFixed(1)} ${y.toFixed(1)}q4 6 -${length} ${length}" fill="none" stroke="${foliage[i % 3]}" stroke-width="${i % 3 === 0 ? 2 : 1.1}" stroke-linecap="round"/>`;
  }).join('');
  const lights = Array.from({ length: 10 }, (_, i) => {
    const t = (i + 0.5) / 10;
    const x = start + span * t;
    const y = yAt(t) + 4;
    const color = i % 3 === 0 ? accent : light;
    return `<circle cx="${x}" cy="${y}" r="11" fill="url(#festive-light)" opacity=".72"/><ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.6" fill="${color}"/><circle cx="${x - .5}" cy="${y - 1}" r="1" fill="#fff4d7"/>`;
  }).join('');
  const t = [.28, .53, .76][ornament];
  const tie = yAt(t);
  const feature = {
    pine: `<path d="M0 0c-10 6-11 14 0 21C11 14 10 6 0 0Z" fill="#63432d" stroke="#b69369"/><path d="M-6 6l6 4 6-4m-7 7 7 3 7-3" transform="translate(-1 0)" fill="none" stroke="#d0af7f" opacity=".8"/><circle cx="-9" cy="2" r="3.3" fill="${accent}"/><circle cx="7" cy="5" r="3.7" fill="${accent}"/>`,
    frost: `<path d="M0 3v22m-9-17 18 13m-18 0L9 8M-3 6l3 4 3-4m-6 16 3-4 3 4" fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round"/>`,
    ribbon: `<path d="M0 5C-23-14-25 14 0 8C25 14 23-14 0 5L12 26l-8-3-3 5-2-19-9 15-6 1Z" fill="${accent}" stroke="${light}" stroke-opacity=".62"/><path d="m-3 6 7 1" stroke="#fff0c6" stroke-width="2"/>`,
  }[style];
  return `<g>
    <defs><radialGradient id="festive-light"><stop stop-color="${light}" stop-opacity=".58"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs>
    <path d="M${start} ${top}Q${(start + end) / 2} ${top + 2 * sag} ${end} ${top}" fill="none" stroke="#130d0a" stroke-opacity=".8" stroke-width="7"/>
    <path d="M${start} ${top}Q${(start + end) / 2} ${top + 2 * sag} ${end} ${top}" fill="none" stroke="${foliage[0]}" stroke-width="5"/>
    ${needles}${lights}
    <g transform="translate(${start + span * t} ${tie})"><path d="M0 0v9" stroke="#d5b378"/><g transform="translate(0 8)">${feature}</g></g>
  </g>`;
}

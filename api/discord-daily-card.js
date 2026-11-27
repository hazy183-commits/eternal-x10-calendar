import { christmasIllustration } from '../lib/christmasIllustration.js';
import sharp from 'sharp';
import { christmasCard, CHRISTMAS_CREST, holidayScenery, winterArtwork } from '../lib/discordChristmas.js';
import { Resvg } from '@resvg/resvg-js';

const BG = '/images/discord/daily-plan-background.webp';
const BACKGROUNDS = [
  BG,
  '/images/discord/daily-plan-background-02.webp',
  '/images/discord/daily-plan-background-03.webp',
  '/images/discord/daily-plan-background-04.webp',
  '/images/discord/daily-plan-background-05.webp',
];
const FALLBACK_BG = '/images/eternal-hero-approved.webp';

const EVENT_ACCENTS = {
  "zaken": "#ffad6e",
  "antharas": "#cad297",
  "baium": "#c6dcff",
  "core": "#98eaff",
  "frintezza": "#dec3ff",
  "orfen": "#bce28f",
  "queen-ant": "#f2ca80",
  "valakas": "#ffd090",
  "aden": "#efda9b",
  "dion": "#e4dfa1",
  "giran": "#efc998",
  "gludio": "#d3dbb6",
  "goddard": "#c3d9ef",
  "innadril": "#b1dfe4",
  "oren": "#a9cde6",
  "rune": "#d6c0e4",
  "schuttgart": "#edf8ff",
  "fortress-of-resistance": "#e3c49b",
  "devastated-castle": "#d7cdba",
  "bandit-stronghold": "#d6dc9c",
  "rainbow-spring-chateau": "#bbf0df",
  "wild-beast-reserve": "#dbe8a4",
  "fortress-of-the-dead": "#b7cde0",
  "pvp": "#dbbdf4",
  "colloseum": "#efcf91",
  "olympiad": "#c7e2ff"
};
const TYPE_ACCENTS = { 'EPIC RB': '#a8cdff', SIEGE: '#ffae82', 'CLAN HALL': '#cbdb9b', OLYMPIAD: '#c7b6f6', RB: '#dfc6a4' };

function eventAccent(name, type) {
  const words = ' ' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const has = key => words.includes(' ' + key.replaceAll('-', ' ') + ' ');
  if (has('qa')) return EVENT_ACCENTS['queen-ant'];
  if (has('forest-of-the-dead')) return EVENT_ACCENTS['fortress-of-the-dead'];
  if (has('colosseum') || has('koloseum')) return EVENT_ACCENTS.colloseum;
  const key = Object.keys(EVENT_ACCENTS).find(has);
  return EVENT_ACCENTS[key] ?? TYPE_ACCENTS[type] ?? '#e9c887';
}

function artworkForDate(dateText = '') {
  const match = String(dateText).match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return BG;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return BG;

  const firstRotationDay = Date.UTC(2026, 10, 23);
  const offset = Math.floor((timestamp - firstRotationDay) / 86400000);
  const index = ((offset % BACKGROUNDS.length) + BACKGROUNDS.length) % BACKGROUNDS.length;
  return BACKGROUNDS[index];
}

function decode(value = '') {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Buffer.from(normalized, 'base64').toString('utf8');
  } catch {
    return '';
  }
}
function esc(value = '') {
  return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
function textWidthSafe(value, max = 52) {
  const chars = Array.from(String(value || ''));
  return chars.length > max ? chars.slice(0, max - 1).join('') + '…' : chars.join('');
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'orzelbialy.eu'));
    const holiday = christmasCard(url.searchParams);
    const payload = JSON.parse(decode(url.searchParams.get('p') || ''));
    const date = textWidthSafe(payload.date || '--.--.----', 24);
    const events = Array.isArray(payload.events) ? payload.events.slice(0, 16) : [];
    const cinematic = url.searchParams.get('layout') === 'cinematic';
    const quest = url.searchParams.get('layout') === 'quest';
    const newspaper = url.searchParams.get('layout') === 'newspaper';
    const board = url.searchParams.get('layout') === 'board';
    const refined = url.searchParams.get('layout') === 'refined';
    const width = 1200;
    const rowHeight = cinematic ? 90 : 104;
    const top = cinematic ? 274 : 242;
    const height = quest ? 287 + Math.max(1, events.length) * 132 : newspaper ? 362 + Math.max(1, events.length) * 105 : board ? Math.max(500, 359 + Math.ceil(events.length / 2) * 165) : Math.max(590, top + Math.max(events.length, 1) * rowHeight + 112);

    const imageHost = 'https://orzelbialy.eu';
    const artworkPath = artworkForDate(date);
    const holidayIllustration = holiday && !newspaper ? await christmasIllustration(imageHost, 'daily', width, height).catch(error => {
      console.warn('Seasonal daily illustration unavailable', String(error));
      return null;
    }) : null;
    const background = holidayIllustration ?? (newspaper ? null : await (async () => {
    let backgroundResponse;
    try {
      backgroundResponse = await fetch(imageHost + artworkPath, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Image HTTP ' + backgroundResponse.status);
    } catch (error) {
      console.warn('Daily plan fixed background unavailable; using fallback', artworkPath, String(error));
      backgroundResponse = await fetch(imageHost + FALLBACK_BG, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Daily plan fallback background fetch failed: ' + backgroundResponse.status);
    }
    const sourceArtwork = sharp(Buffer.from(await backgroundResponse.arrayBuffer()))
      .resize(width, height, { fit: 'cover', position: 'right' })
      .modulate({ brightness: 0.86, saturation: 1.12 });
    return holiday ? winterArtwork(sourceArtwork) : sourceArtwork.png().toBuffer();
    })());

    const rows = events.length ? events.map((event, index) => {
      const y = top + index * rowHeight;
      const name = esc(textWidthSafe(event.name || 'Wydarzenie', 35));
      const type = esc(textWidthSafe(event.type || 'EVENT', 28).toUpperCase());
      const location = esc(textWidthSafe(event.location || 'Miejsce do ustalenia', 52));
      const time = esc(textWidthSafe(event.time || '--:--', 8));
      if (cinematic) {
        const accent = eventAccent(event.name, type);
        return `
          <rect x="72" y="${y}" width="1056" height="77" rx="6" fill="#080b14" fill-opacity=".89"/>
          <defs><linearGradient id="eventGlow${index}"><stop stop-color="${accent}" stop-opacity=".24"/><stop offset=".72" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>
          <rect x="72" y="${y}" width="1056" height="77" rx="6" fill="url(#eventGlow${index})"/>
          <path d="M78 ${y+76}H1122" stroke="${accent}" stroke-opacity=".32"/>
          <rect x="72" y="${y+9}" width="4" height="59" rx="2" fill="${accent}"/>
          <text x="168" y="${y+51}" text-anchor="middle" fill="${accent}" font-size="43" font-family="DejaVu Sans" font-weight="700">${time}</text>
          <path d="M260 ${y+13}V${y+64}" stroke="${accent}" stroke-opacity=".4"/>
          <text x="286" y="${y+34}" fill="#fff4e4" font-size="30" font-family="DejaVu Serif" font-weight="700">${name}</text>
          <text x="287" y="${y+61}" fill="#dcd5cf" font-size="18" font-family="DejaVu Sans">${type} · ${location}</text>`;
      }
      return `
        <rect x="52" y="${y}" width="1096" height="86" rx="10" fill="#050910" fill-opacity="${refined ? .72 : .84}" stroke="#d8b66c" stroke-opacity="${refined ? .43 : .56}" stroke-width="1.5"/>
        <rect x="52" y="${y}" width="${refined ? 4 : 8}" height="86" rx="2" fill="#d6b36c"/>
        ${refined ? `<path d="M925 ${y+16}V${y+70}" stroke="#d8b66c" stroke-opacity=".5"/>` : ''}
        <text x="86" y="${y + 35}" fill="#fff5df" font-size="31" font-family="DejaVu Serif" font-weight="700">${name}</text>
        <text x="88" y="${y + 66}" fill="#d8c39b" font-size="${refined ? 19 : 17}" font-family="DejaVu Sans" letter-spacing="1">${type}  ·  ${location}</text>
        <text x="1098" y="${y + 56}" text-anchor="end" fill="#e7c477" font-size="${refined ? 51 : 46}" font-family="DejaVu Serif" font-weight="700">${time}</text>`;
    }).join('') : `
      <rect x="52" y="${top}" width="1096" height="110" rx="10" fill="#050910" fill-opacity=".84" stroke="#d8b66c" stroke-opacity=".56"/>
      <text x="600" y="${top + 66}" text-anchor="middle" fill="#fff5df" font-size="30" font-family="DejaVu Sans">Brak zaplanowanych wydarzeń</text>`;

    const classicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><linearGradient id="shade"><stop offset="0" stop-color="#050408" stop-opacity=".94"/><stop offset=".48" stop-color="#05070c" stop-opacity="${refined ? .67 : .80}"/><stop offset="1" stop-color="#05070c" stop-opacity="${refined ? .40 : .58}"/></linearGradient><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#dce5f1"/><stop offset=".62" stop-color="#6c859f"/><stop offset="1" stop-color="#e9edf1"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff2a5"/><stop offset=".55" stop-color="#ffd45b"/><stop offset="1" stop-color="#aa7224"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#shade)"/>
      <path d="M38 35 H1162 M38 ${height-35} H1162" stroke="#d4ad62" stroke-width="2" stroke-opacity=".88"/><path d="M35 45 V${height-45} M1165 45 V${height-45}" stroke="#d4ad62" stroke-width="1" stroke-opacity=".5"/>
      <path d="M350 94 H850" stroke="#e0ae56" stroke-width="2"/><text x="600" y="82" text-anchor="middle" fill="url(#metal)" font-size="47" font-family="DejaVu Serif" font-weight="700">ORZEŁ BIAŁY</text><text x="600" y="128" text-anchor="middle" fill="url(#gold)" font-size="21" font-family="DejaVu Serif" letter-spacing="6">LINEAGE II</text>
      <text x="600" y="182" text-anchor="middle" fill="url(#metal)" stroke="#101621" stroke-width="2" paint-order="stroke" font-size="57" font-family="DejaVu Serif" font-weight="700">PLAN DNIA</text>
      <text x="600" y="212" text-anchor="middle" fill="url(#gold)" font-size="22" font-family="DejaVu Serif" font-weight="700" letter-spacing="1">${esc(date)}  ·  NAJBLIŻSZE 24 GODZINY</text>
      ${rows}
      <text x="1136" y="${height - 62}" text-anchor="end" fill="#d9b66e" font-size="17" font-family="DejaVu Sans" font-weight="700" letter-spacing="2">ORZELBIALY.EU</text>
    </svg>`;

    const tiles = board ? events.map((event, index) => {
      const x = 48 + (index % 2) * 564;
      const y = 259 + Math.floor(index / 2) * 165;
      const type = textWidthSafe(event.type || 'Wydarzenie', 28).toUpperCase();
      const hue = eventAccent(event.name, type);
      const name = textWidthSafe(event.name || 'Wydarzenie', 44);
      const nameSize = Math.min(34, Math.floor(790 / name.length));
      return `<g transform="translate(${x} ${y})">
        <defs><linearGradient id="tile-${index}" x2="1" y2="1"><stop stop-color="${hue}" stop-opacity=".30"/><stop offset="1" stop-color="${hue}" stop-opacity=".03"/></linearGradient></defs>
        <path d="M0 0H513L540 27V147H0Z" fill="#0a0e18" fill-opacity=".94" stroke="${hue}" stroke-opacity=".65"/>
        <path d="M0 0H513L540 27V147H0Z" fill="url(#tile-${index})"/>
        <text x="24" y="54" fill="${hue}" font-size="47" font-weight="700">${esc(textWidthSafe(event.time || '--:--', 8))}</text>
        <text x="513" y="38" text-anchor="end" fill="${hue}" font-size="17" font-weight="700" letter-spacing="1.4">${esc(type)}</text>
        <path d="M24 70H514" stroke="${hue}" stroke-opacity=".38"/>
        <text x="24" y="108" fill="#fff7e8" font-family="DejaVu Serif" font-size="${nameSize}" font-weight="700">${esc(name)}</text>
        <text x="25" y="133" fill="#dad4ca" font-size="17">${esc(textWidthSafe(event.location || 'Miejsce do ustalenia', 45))}</text>
      </g>`;
    }).join('') : '';
    const boardSvg = board ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans">
      <defs><linearGradient id="board-shade" x2="0" y2="1"><stop stop-color="#080911" stop-opacity=".67"/><stop offset=".38" stop-color="#080911" stop-opacity=".30"/><stop offset="1" stop-color="#080911" stop-opacity=".94"/></linearGradient></defs>
      <rect width="1200" height="${height}" fill="url(#board-shade)"/>
      <path d="M29 166V29H1171V166M29 ${height-100}V${height-29}H1015" fill="none" stroke="#dfae75" stroke-opacity=".66" stroke-width="2"/>
      <text x="150" y="81" fill="#edd1a8" font-size="21" font-weight="700" letter-spacing="3">ORZEŁ BIAŁY</text>
      <text x="48" y="193" fill="#fff3dd" stroke="#10111a" stroke-width="5" paint-order="stroke" font-family="DejaVu Serif" font-weight="700" font-size="85">PLAN DNIA</text>
      <text x="1148" y="161" text-anchor="end" fill="#fff1d8" font-weight="700" font-size="33">${esc(date)}</text>
      <text x="1148" y="195" text-anchor="end" fill="#e7cba8" font-size="18" letter-spacing="2">NAJBLIŻSZE 24 GODZINY</text>
      <path d="M48 223H1152" stroke="#dfae75" stroke-width="2"/>
      ${tiles || '<text x="600" y="345" text-anchor="middle" fill="#fff3dd" font-size="31">Brak zaplanowanych wydarzeń</text>'}
      <text x="49" y="${height-47}" fill="#e0c9af" font-size="17">Godziny w czasie polskim</text>
      <g transform="translate(1020 ${height-83})">
        <path d="M0 7Q42 -6 77 5T148 0V22Q111 34 77 27T0 30Z" fill="#fff5ed"/>
        <path d="M0 30Q42 17 77 27T148 22V45Q111 57 77 50T0 53Z" fill="#cc2548"/>
      </g>
    </svg>` : '';

    const paperRows = newspaper ? events.map((event, index) => {
      const y = 338 + index * 105;
      const name = textWidthSafe(event.name || 'Wydarzenie', 48);
      const location = textWidthSafe(event.location || 'Miejsce do ustalenia', 54);
      const type = textWidthSafe(event.type || 'Wydarzenie', 26);
      return `<g transform="translate(0 ${y})">
        <text x="78" y="49" fill="#9c242d" font-weight="700" font-size="49">${esc(textWidthSafe(event.time || '--:--', 8))}</text>
        <text x="322" y="42" fill="#211e1b" font-family="DejaVu Serif" font-weight="700" font-size="${Math.min(36, Math.floor(1030 / name.length))}">${esc(name)}</text>
        <text x="324" y="74" fill="#575049" font-size="20">${esc(type)} · ${esc(location)}</text>
        <path d="M78 98H1122" stroke="#b8a995"/>
      </g>`;
    }).join('') : '';
    const paperSvg = newspaper ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="DejaVu Sans">
      <defs>
        <linearGradient id="paper" x2="0" y2="1"><stop stop-color="#fff6e4"/><stop offset="1" stop-color="#eadeca"/></linearGradient>
        <pattern id="grain" width="13" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#776757" opacity=".16"/><circle cx="9" cy="7" r=".55" fill="#776757" opacity=".12"/></pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#paper)"/>
      <rect width="100%" height="100%" fill="url(#grain)"/>
      <rect width="1200" height="16" fill="#9c242d"/>
      <path d="M78 109H1122M78 116H1122" stroke="#29241f" stroke-width="2"/>
      <text x="78" y="81" fill="#29241f" font-size="23" font-weight="700" letter-spacing="4">ORZEŁ BIAŁY</text>
      <text x="1122" y="81" text-anchor="end" fill="#29241f" font-size="23" font-weight="700">${esc(date)}</text>
      <text x="71" y="246" fill="#211e1b" font-family="DejaVu Serif" font-weight="700" font-size="120" letter-spacing="-5">Plan dnia</text>
      <path d="M78 277H1122" stroke="#9c242d" stroke-width="4"/>
      <text x="79" y="317" fill="#575049" font-size="19" font-weight="700" letter-spacing="2">NAJBLIŻSZE 24 GODZINY</text>
      <text x="1121" y="317" text-anchor="end" fill="#575049" font-size="19">Czas polski</text>
      ${paperRows || '<text x="78" y="397" fill="#575049" font-size="29">Brak zaplanowanych wydarzeń</text>'}
    </svg>` : '';
    const questPinY = index => 325 + index * 132;
    const questPinX = index => [130, 180, 117, 151][index % 4];
    const route = events.map((_, index) => {
      const x = questPinX(index), y = questPinY(index);
      return index === 0 ? `M${x} ${y}` : `C${questPinX(index - 1)} ${y - 66},${x} ${y - 66},${x} ${y}`;
    }).join(' ');
    const questRows = quest ? events.map((event, index) => {
      const x = questPinX(index), y = questPinY(index);
      const name = textWidthSafe(event.name || 'Wydarzenie', 44);
      const type = textWidthSafe(event.type || 'Wydarzenie', 28);
      const accent = eventAccent(name, type.toUpperCase());
      return `<g>
        <path d="M${x+28} ${y}H242" stroke="${accent}" stroke-opacity=".55" stroke-dasharray="3 7"/>
        <circle cx="${x}" cy="${y}" r="24" fill="#102226" stroke="${accent}" stroke-width="2"/>
        <path d="M${x} ${y-12}l9 12-9 12-9-12Z" fill="${accent}"/>
        <path d="M249 ${y-47}H1100l25 22v77H249Z" fill="#081b21" fill-opacity=".88" stroke="${accent}" stroke-opacity=".58"/>
        <path d="M249 ${y-47}h117" stroke="${accent}" stroke-width="3"/>
        <text x="275" y="${y-14}" fill="${accent}" font-size="16" font-weight="700" letter-spacing="1.4">${esc(type.toUpperCase())}</text>
        <text x="275" y="${y+22}" fill="#fff3d0" font-family="DejaVu Serif" font-size="${Math.min(33, Math.floor(870 / name.length))}" font-weight="700">${esc(name)}</text>
        <text x="276" y="${y+43}" fill="#ded3b3" font-size="16">${esc(textWidthSafe(event.location || 'Miejsce do ustalenia', 48))}</text>
        <text x="1092" y="${y+19}" text-anchor="end" fill="${accent}" font-size="47" font-weight="700">${esc(textWidthSafe(event.time || '--:--', 8))}</text>
      </g>`;
    }).join('') : '';
    const questSvg = quest ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans">
      <defs>
        <linearGradient id="quest-shade" x2="0" y2="1"><stop stop-color="#081519" stop-opacity=".65"/><stop offset=".35" stop-color="#10282d" stop-opacity=".68"/><stop offset="1" stop-color="#061214" stop-opacity=".98"/></linearGradient>
        <pattern id="contours" width="310" height="195" patternUnits="userSpaceOnUse">
          <path d="M-40 56Q66-9 142 50T323 49M-40 72Q64 5 142 67T323 65M-40 88Q64 21 142 83T323 81M-40 146Q69 89 154 137T323 130M-40 163Q69 106 154 154T323 147" fill="none" stroke="#ddc992" stroke-opacity=".18"/>
        </pattern>
      </defs>
      <rect width="1200" height="${height}" fill="url(#quest-shade)"/>
      <rect x="40" y="236" width="1120" height="${height-276}" fill="url(#contours)"/>
      <path d="M27 91V27H169M1031 27H1173V91M27 ${height-91}V${height-27}H169M1031 ${height-27}H1173V${height-91}" fill="none" stroke="#d8b977" stroke-width="2"/>
      <text x="159" y="78" fill="#f0d8a4" font-size="20" font-weight="700" letter-spacing="3">ORZEŁ BIAŁY</text>
      <text x="1124" y="78" text-anchor="end" fill="#f0d8a4" font-size="25" font-weight="700">${esc(date)}</text>
      <text x="600" y="177" text-anchor="middle" fill="#fff0bc" stroke="#071418" stroke-width="5" paint-order="stroke" font-family="DejaVu Serif" font-size="72" font-weight="700">DZIENNIK WYPRAW</text>
      <text x="600" y="220" text-anchor="middle" fill="#efddb1" font-size="20" letter-spacing="3">NAJBLIŻSZE 24 GODZINY · CZAS POLSKI</text>
      <path d="M249 243H564L600 252L636 243H1125" fill="none" stroke="#c4a66c"/>
      <path d="${route}" fill="none" stroke="#d7b879" stroke-width="3" stroke-dasharray="4 9"/>
      ${questRows || '<text x="600" y="336" text-anchor="middle" fill="#fff0bc" font-size="30">Brak zaplanowanych wydarzeń</text>'}
    </svg>` : '';
    const svg = quest ? questSvg : newspaper ? paperSvg : board ? boardSvg : cinematic ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="veil" x2="0" y2="1"><stop stop-color="#080a12" stop-opacity=".30"/><stop offset=".42" stop-color="#080a12" stop-opacity=".64"/><stop offset="1" stop-color="#080a12" stop-opacity=".94"/></linearGradient>
        <linearGradient id="title" x2="0" y2="1"><stop stop-color="#fff8e6"/><stop offset="1" stop-color="#e1ad75"/></linearGradient>
      </defs>
      <rect width="1200" height="${height}" fill="url(#veil)"/>
      <path d="M34 155V28H1128L1166 66V155M34 ${height-120}V${height-29}H1005" fill="none" stroke="#dfae75" stroke-opacity=".66" stroke-width="2"/>
      <text x="103" y="52" text-anchor="middle" fill="#ffe4ce" font-family="DejaVu Sans" font-size="13" font-weight="700" letter-spacing="1.3">ORZEŁ BIAŁY</text>
      <text x="600" y="144" text-anchor="middle" fill="url(#title)" stroke="#100b11" stroke-width="5" paint-order="stroke" font-family="DejaVu Serif" font-size="91" font-weight="700">PLAN DNIA</text>
      <text x="600" y="195" text-anchor="middle" fill="#fff0db" font-family="DejaVu Sans" font-size="25" font-weight="700">${esc(date)} · NAJBLIŻSZE 24 GODZINY</text>
      <path d="M104 236H546L600 245L654 236H1096" fill="none" stroke="#e4b27d" stroke-width="2"/>
      ${rows}
      <text x="74" y="${height-55}" fill="#ead5ba" font-family="DejaVu Sans" font-size="18">Godziny w czasie polskim</text>
      <g transform="translate(1020 ${height-80})">
        <path d="M0 7Q42 -6 77 5T148 0V22Q111 34 77 27T0 30Z" fill="#fff5ed"/>
        <path d="M0 30Q42 17 77 27T148 22V45Q111 57 77 50T0 53Z" fill="#cc2548"/>
      </g>
    </svg>` : classicSvg;

    const fontDir = new URL('../node_modules/dejavu-fonts-ttf/ttf/', import.meta.url).pathname;
    const fontFiles = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSerif.ttf', 'DejaVuSerif-Bold.ttf'].map(file => fontDir + file);
    const seasonalSvg = holiday && !holidayIllustration ? svg.replace('</svg>', holidayScenery(width) + '</svg>') : svg;
    const overlay = new Resvg(seasonalSvg, {
      fitTo: { mode: 'width', value: width },
      font: { fontFiles, fontDirs: [fontDir], loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' }
    }).render().asPng();
    const verified = (svg.includes('PLAN DNIA') || svg.includes('Plan dnia') || svg.includes('DZIENNIK WYPRAW')) && svg.includes(esc(date));
    const layers = [{ input: overlay }];
    if (!newspaper) try {
      const crestResponse = await fetch(imageHost + (holiday ? CHRISTMAS_CREST : '/images/discord/clan-crest.svg'), { signal: AbortSignal.timeout(4500) });
      if (!crestResponse.ok) throw new Error('Clan crest HTTP ' + crestResponse.status);
      const crest = await sharp(Buffer.from(await crestResponse.arrayBuffer()), { density: 180 })
         .resize(quest || board ? 86 : cinematic ? 108 : 150, quest || board ? 54 : cinematic ? 68 : 94, { fit: 'contain', background: '#0000' }).png().toBuffer();
      layers.push({ input: crest, left: quest || board ? 48 : cinematic ? 49 : 52, top: quest || board ? 46 : cinematic ? 59 : 43 });
    } catch (error) {
      console.warn('Daily plan clan crest unavailable', String(error));
    }
    const png = newspaper ? overlay : await sharp(background).composite(layers).png().toBuffer();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.setHeader('X-Card-Season', holiday ? 'christmas' : 'standard');
if (holiday) res.setHeader('X-Card-Winter-Artwork', holidayIllustration ? 'christmas-illustration' : 'snow-v2');

    res.setHeader('X-Daily-Plan-Events', String(events.length));
    res.setHeader('X-Daily-Plan-Style', quest ? 'quest-journal-preview' : newspaper ? 'newspaper-preview' : board ? 'clan-board-preview' : cinematic ? 'cinematic-series-preview' : refined ? 'classic-refined-preview' : 'fixed-clan-art-daily-rotation-v2');
    res.setHeader('X-Daily-Plan-Artwork', artworkPath);
    res.setHeader('X-Daily-Plan-Size', String(png.length));
    res.setHeader('X-Daily-Plan-Text-Verified', verified ? 'true' : 'false');
    res.end(png);
  } catch (error) {
    console.error('Discord daily plan render failed', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(String(error?.message || error));
  }
}

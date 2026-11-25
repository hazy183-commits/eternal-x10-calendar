import sharp from 'sharp';
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
    const payload = JSON.parse(decode(url.searchParams.get('p') || ''));
    const date = textWidthSafe(payload.date || '--.--.----', 24);
    const events = Array.isArray(payload.events) ? payload.events.slice(0, 16) : [];
    const cinematic = url.searchParams.get('layout') === 'cinematic';
    const board = url.searchParams.get('layout') === 'board';
    const refined = url.searchParams.get('layout') === 'refined';
    const width = 1200;
    const rowHeight = cinematic ? 90 : 104;
    const top = cinematic ? 274 : 242;
    const height = board ? Math.max(500, 359 + Math.ceil(events.length / 2) * 165) : Math.max(590, top + Math.max(events.length, 1) * rowHeight + 112);

    const imageHost = 'https://orzelbialy.eu';
    const artworkPath = artworkForDate(date);
    let backgroundResponse;
    try {
      backgroundResponse = await fetch(imageHost + artworkPath, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Image HTTP ' + backgroundResponse.status);
    } catch (error) {
      console.warn('Daily plan fixed background unavailable; using fallback', artworkPath, String(error));
      backgroundResponse = await fetch(imageHost + FALLBACK_BG, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Daily plan fallback background fetch failed: ' + backgroundResponse.status);
    }
    const background = await sharp(Buffer.from(await backgroundResponse.arrayBuffer()))
      .resize(width, height, { fit: 'cover', position: 'right' })
      .modulate({ brightness: 0.86, saturation: 1.12 })
      .png().toBuffer();

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

    const svg = board ? boardSvg : cinematic ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
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
    const overlay = new Resvg(svg, {
      fitTo: { mode: 'width', value: width },
      font: { fontFiles, fontDirs: [fontDir], loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' }
    }).render().asPng();
    const verified = svg.includes('PLAN DNIA') && svg.includes(date);
    const layers = [{ input: overlay }];
    try {
      const crestResponse = await fetch(imageHost + '/images/discord/clan-crest.svg', { signal: AbortSignal.timeout(4500) });
      if (!crestResponse.ok) throw new Error('Clan crest HTTP ' + crestResponse.status);
      const crest = await sharp(Buffer.from(await crestResponse.arrayBuffer()), { density: 180 })
        .resize(board ? 86 : cinematic ? 108 : 150, board ? 54 : cinematic ? 68 : 94, { fit: 'contain' }).png().toBuffer();
      layers.push({ input: crest, left: board ? 48 : cinematic ? 49 : 52, top: board ? 46 : cinematic ? 59 : 43 });
    } catch (error) {
      console.warn('Daily plan clan crest unavailable', String(error));
    }
    const png = await sharp(background).composite(layers).png().toBuffer();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.setHeader('X-Daily-Plan-Events', String(events.length));
    res.setHeader('X-Daily-Plan-Style', board ? 'clan-board-preview' : cinematic ? 'cinematic-series-preview' : refined ? 'classic-refined-preview' : 'fixed-clan-art-daily-rotation-v2');
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

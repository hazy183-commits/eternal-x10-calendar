import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

const BG = '/images/eternal-hero-approved.webp';
const EVENT_ART = {
  antharas: '/images/bosses/antharas.webp',
  baium: '/images/bosses/baium.webp',
  core: '/images/bosses/core.webp',
  frintezza: '/images/bosses/frintezza.webp',
  orfen: '/images/bosses/orfen.webp',
  'queen-ant': '/images/bosses/queen-ant.webp',
  valakas: '/images/bosses/valakas.webp',
  zaken: '/images/bosses/zaken.webp',
  aden: '/images/castles/aden.jpg',
  dion: '/images/castles/dion.jpg',
  giran: '/images/castles/giran.jpg',
  gludio: '/images/castles/gludio.jpg',
  goddard: '/images/castles/goddard.jpg',
  innadril: '/images/castles/innadril.jpg',
  oren: '/images/castles/oren.jpg',
  rune: '/images/castles/rune.jpg',
  schuttgart: '/images/castles/schuttgart.jpg',
  'fortress-of-resistance': '/images/fortress-of-resistance.jpg',
  'devastated-castle': '/images/devastated-castle.jpg',
  'bandit-stronghold': '/images/bandit-stronghold.jpg',
  'rainbow-spring-chateau': '/images/Rainbow%20Springs%20Chateau.jpg',
  'wild-beast-reserve': '/images/Wild%20Beast%20Reserve.jpg',
  'fortress-of-the-dead': '/images/fortress-of-the-dead.jpg',
  pvp: '/images/events/clan-pvp.webp',
  olympiad: '/images/events/olympiad.jpg'
};
const CASTLES = ['aden', 'dion', 'giran', 'gludio', 'goddard', 'innadril', 'oren', 'rune', 'schuttgart'];
const CLAN_HALLS = ['fortress-of-resistance', 'devastated-castle', 'bandit-stronghold', 'rainbow-spring-chateau', 'wild-beast-reserve', 'fortress-of-the-dead'];

function artworkFor(event = {}) {
  const name = String(event.name || '').toLowerCase();
  const type = String(event.type || '').toLowerCase();
  const boss = ['antharas', 'baium', 'frintezza', 'orfen', 'valakas', 'zaken', 'core']
    .find(key => name.includes(key));
  if (boss) return EVENT_ART[boss];
  if (name.includes('queen ant')) return EVENT_ART['queen-ant'];
  if (type.includes('siege')) {
    const castle = CASTLES.find(key => name.includes(key));
    if (castle) return EVENT_ART[castle];
  }
  if (type.includes('clan hall')) {
    const hall = CLAN_HALLS.find(key => name.includes(key.replace(/-/g, ' ')));
    if (hall) return EVENT_ART[hall];
  }
  if (type.includes('olympiad') || name.includes('olympiad')) return EVENT_ART.olympiad;
  if (name.includes('pvp') || type.includes('pvp')) return EVENT_ART.pvp;
  return BG;
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
    const width = 1200;
    const rowHeight = 104;
    const top = 242;
    const height = Math.max(590, top + Math.max(events.length, 1) * rowHeight + 112);

    const imageHost = 'https://orzelbialy.eu';
    const artworkPath = artworkFor(events[0]);
    let backgroundResponse;
    try {
      backgroundResponse = await fetch(imageHost + artworkPath, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Image HTTP ' + backgroundResponse.status);
    } catch (error) {
      console.warn('Daily plan event artwork unavailable; using clan background', artworkPath, String(error));
      backgroundResponse = await fetch(imageHost + BG, { signal: AbortSignal.timeout(7000) });
      if (!backgroundResponse.ok) throw new Error('Daily plan fallback background fetch failed: ' + backgroundResponse.status);
    }
    const background = await sharp(Buffer.from(await backgroundResponse.arrayBuffer()))
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 0.86, saturation: 1.12 })
      .png().toBuffer();

    const rows = events.length ? events.map((event, index) => {
      const y = top + index * rowHeight;
      const name = esc(textWidthSafe(event.name || 'Wydarzenie', 35));
      const type = esc(textWidthSafe(event.type || 'EVENT', 28).toUpperCase());
      const location = esc(textWidthSafe(event.location || 'Miejsce do ustalenia', 52));
      const time = esc(textWidthSafe(event.time || '--:--', 8));
      return `
        <rect x="52" y="${y}" width="1096" height="86" rx="10" fill="#050910" fill-opacity=".84" stroke="#d8b66c" stroke-opacity=".56" stroke-width="1.5"/>
        <rect x="52" y="${y}" width="8" height="86" rx="4" fill="#d6b36c"/>
        <text x="86" y="${y + 35}" fill="#fff5df" font-size="31" font-family="DejaVu Serif" font-weight="700">${name}</text>
        <text x="88" y="${y + 66}" fill="#d8c39b" font-size="17" font-family="DejaVu Sans" letter-spacing="1">${type}  ·  ${location}</text>
        <text x="1098" y="${y + 56}" text-anchor="end" fill="#e7c477" font-size="46" font-family="DejaVu Serif" font-weight="700">${time}</text>`;
    }).join('') : `
      <rect x="52" y="${top}" width="1096" height="110" rx="10" fill="#050910" fill-opacity=".84" stroke="#d8b66c" stroke-opacity=".56"/>
      <text x="600" y="${top + 66}" text-anchor="middle" fill="#fff5df" font-size="30" font-family="DejaVu Sans">Brak zaplanowanych wydarzeń</text>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><linearGradient id="shade"><stop offset="0" stop-color="#050408" stop-opacity=".94"/><stop offset=".48" stop-color="#05070c" stop-opacity=".80"/><stop offset="1" stop-color="#05070c" stop-opacity=".58"/></linearGradient><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#dce5f1"/><stop offset=".62" stop-color="#6c859f"/><stop offset="1" stop-color="#e9edf1"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff2a5"/><stop offset=".55" stop-color="#ffd45b"/><stop offset="1" stop-color="#aa7224"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#shade)"/>
      <path d="M38 35 H1162 M38 ${height-35} H1162" stroke="#d4ad62" stroke-width="2" stroke-opacity=".88"/><path d="M35 45 V${height-45} M1165 45 V${height-45}" stroke="#d4ad62" stroke-width="1" stroke-opacity=".5"/>
      <path d="M226 94 H600" stroke="#e0ae56" stroke-width="2"/><text x="226" y="82" fill="url(#metal)" font-size="47" font-family="DejaVu Serif" font-weight="700">ORZEŁ BIAŁY</text><text x="270" y="128" fill="url(#gold)" font-size="21" font-family="DejaVu Serif" letter-spacing="6">LINEAGE II</text>
      <text x="62" y="182" fill="url(#metal)" stroke="#101621" stroke-width="2" paint-order="stroke" font-size="57" font-family="DejaVu Serif" font-weight="700">PLAN DNIA</text>
      <text x="64" y="212" fill="url(#gold)" font-size="22" font-family="DejaVu Serif" font-weight="700" letter-spacing="1">${esc(date)}  ·  NAJBLIŻSZE 24 GODZINY</text>
      ${rows}
      <text x="1136" y="${height - 62}" text-anchor="end" fill="#d9b66e" font-size="17" font-family="DejaVu Sans" font-weight="700" letter-spacing="2">ORZELBIALY.EU</text>
    </svg>`;

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
        .resize(150, 94, { fit: 'contain' }).png().toBuffer();
      layers.push({ input: crest, left: 52, top: 43 });
    } catch (error) {
      console.warn('Daily plan clan crest unavailable', String(error));
    }
    const png = await sharp(background).composite(layers).png().toBuffer();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.setHeader('X-Daily-Plan-Events', String(events.length));
    res.setHeader('X-Daily-Plan-Style', 'event-poster-v1');
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

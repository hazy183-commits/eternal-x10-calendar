import sharp from 'sharp';
const atlases = [
  { file: 'epiki', columns: 2, rows: 4, keys: ['antharas', 'baium', 'core', 'frintezza', 'orfen', 'queen-ant', 'valakas', 'zaken'] },
  { file: 'zamki', columns: 3, rows: 3, keys: ['aden', 'dion', 'giran', 'gludio', 'goddard', 'innadril', 'oren', 'rune', 'schuttgart'] },
  { file: 'klan', columns: 3, rows: 4, keys: ['fortress-of-resistance', 'devastated-castle', 'bandit-stronghold', 'rainbow-spring-chateau', 'wild-beast-reserve', 'fortress-of-the-dead', 'pvp', 'default', 'olympiad', 'rb', 'raid-needed', 'daily'] },
];

const tiles = new Map(atlases.flatMap(atlas => atlas.keys.map((key, index) => [key, { atlas, index }])));

const cache = new Map();

async function loadArtwork(host, file) {
  const url = `${host}/images/holiday/christmas-scenes-${file}-2026.png`;
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { signal: AbortSignal.timeout(5000) }).then(async response => {
      if (!response.ok) throw new Error(`Seasonal artwork HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    }).catch(error => {
      cache.delete(url);
      throw error;
    }));
  }
  return cache.get(url);
}

export async function christmasIllustration(host, scene, width = 1200, height = 800) {
  if (scene === 'zaken') {
    const artwork = await loadArtwork(host, 'zaken-storm');
    return sharp(artwork).resize(width, height, { fit: 'cover', position: 'centre' }).png().toBuffer();
  }

  const { atlas, index } = tiles.get(scene === 'colloseum' ? 'pvp' : scene) ?? tiles.get('default');
  const atlasBytes = await loadArtwork(host, atlas.file);
  const column = index % atlas.columns;
  const row = Math.floor(index / atlas.columns);
  const left = Math.floor(1536 * column / atlas.columns) + 2;
  const right = Math.floor(1536 * (column + 1) / atlas.columns) - 2;
  const top = Math.floor(1024 * row / atlas.rows) + 2;
  const bottom = Math.floor(1024 * (row + 1) / atlas.rows) - 2;
  const scenicHeight = Math.min(height, Math.round(width * (atlas.columns === 2 ? .43 : atlas.rows === 4 ? .55 : .66)));
  const image = await sharp(atlasBytes).extract({ left, top, width: right - left, height: bottom - top })
    .resize(width, scenicHeight, { fit: 'cover', position: 'centre' }).png().toBuffer();

  const base = '#10151f';
  const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="${base}" stop-opacity="0"/><stop offset="1" stop-color="${base}"/></linearGradient></defs><rect y="${Math.floor(scenicHeight * .63)}" width="${width}" height="${Math.ceil(scenicHeight * .37)}" fill="url(#fade)"/></svg>`);
  return sharp({ create: { width, height, channels: 3, background: base } })
    .composite([{ input: image, left: 0, top: 0 }, { input: fade, left: 0, top: 0 }]).png().toBuffer();
}

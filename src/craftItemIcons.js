const L2_API = 'https://l2api.dev/api/interlude';
const ELMORELAB_IMAGES = 'https://resources.elmorelab.com/images';
const cache = new Map();

function normalizeIconFile(value = '') {
  return String(value || '')
    .trim()
    .replace(/^icon\./i, '')
    .replace(/\.dds$/i, '')
    .replace(/\.png$/i, '')
    .replace(/\.jpg$/i, '');
}

function iconCandidates(iconFile) {
  const icon = normalizeIconFile(iconFile);
  if (!icon) return [];
  const encoded = encodeURIComponent(icon);
  return [
    `/icons/items/${icon}.png`,
    `/assets/icons/items/${icon}.png`,
    `${ELMORELAB_IMAGES}/${encoded}.jpg`,
  ];
}

export async function getInterludeItemIcon(gameItemId, itemName = '') {
  const id = Number(gameItemId || 0);
  const normalizedName = String(itemName || '').trim().toLowerCase();
  const cacheKey = id ? `id:${id}` : `name:${normalizedName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    let item = null;
    if (id) {
      const response = await fetch(`${L2_API}/items/${id}`);
      if (response.ok) item = (await response.json())?.data || null;
    }

    if (!item && itemName) {
      const response = await fetch(`${L2_API}/items?q=${encodeURIComponent(itemName)}&limit=10`);
      if (response.ok) {
        const rows = (await response.json())?.data || [];
        item = rows.find(row => String(row?.name || '').trim().toLowerCase() === normalizedName) || rows[0] || null;
      }
    }

    const direct = item?.iconUrl || item?.icon_url || null;
    const candidates = [
      ...(direct ? [direct] : []),
      ...iconCandidates(item?.iconFile || item?.icon_file || item?.icon),
    ];
    const result = { item, candidates: [...new Set(candidates.filter(Boolean))] };
    cache.set(cacheKey, result);
    return result;
  } catch (_) {
    const result = { item: null, candidates: [] };
    cache.set(cacheKey, result);
    return result;
  }
}

export function installIconWithFallback(node, candidates = [], fallback = '⚒') {
  const urls = [...new Set(candidates.filter(Boolean))];
  if (!node || !urls.length) {
    if (node) node.textContent = fallback;
    return;
  }

  let index = 0;
  const tryNext = () => {
    if (index >= urls.length) {
      node.textContent = fallback;
      node.dataset.iconState = 'missing';
      return;
    }
    const img = new Image();
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      node.replaceChildren(img);
      node.dataset.iconState = 'loaded';
    };
    img.onerror = () => {
      index += 1;
      tryNext();
    };
    img.src = urls[index];
  };
  tryNext();
}

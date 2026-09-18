import iconMap from './craftItemIconMap.json' with { type: 'json' };

const byGameItemId = new Map(
  Object.values(iconMap).map(entry => [Number(entry.game_item_id), entry.local_path]),
);

export function craftItemIconPath(itemKey, gameItemId = null) {
  return iconMap[itemKey]?.local_path || byGameItemId.get(Number(gameItemId || 0)) || '';
}

export function craftItemIconMarkup(item = {}, className = 'craft-item-icon') {
  const src = craftItemIconPath(item.item_key, item.game_item_id);
  if (!src) return `<span class="${className} is-placeholder" aria-hidden="true">⚒</span>`;
  const alt = String(item.name || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  return `<span class="${className}"><img src="${src}" alt="${alt}" width="32" height="32" loading="lazy" decoding="async"></span>`;
}

export function craftItemIconMap() {
  return iconMap;
}

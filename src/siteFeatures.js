// Register independently releasable changes here. Unapproved features default to off.
export const PREVIEW_ORIGIN = 'https://orzel-bialy-git-preview-owner-releases-eternal-x10.vercel.app';
export const FEATURE_SETTING_PREFIX = 'feature:';
export const SITE_FEATURES = Object.freeze([
  { id: 'christmas-tree', title: 'Choinka Orłów', description: 'Bombki z życzeniami członków klanu od 6 do 27 grudnia. Podgląd używa wpisów testowych.', defaultEnabled: false },
  { id: 'christmas-theme', title: 'Świąteczny wygląd strony', description: 'Zimowy las, świąteczny dziedziniec i herb. Działa od 6 do 27 grudnia.', defaultEnabled: true },
  { id: 'christmas-snow', title: 'Padający śnieg', description: 'Drobne płatki po bokach strony od 6 do 27 grudnia.', defaultEnabled: true },
]);

export function featureEnabled(id, settings = {}) {
  const feature = SITE_FEATURES.find(item => item.id === id);
  if (!feature) return false;
  const value = settings[FEATURE_SETTING_PREFIX + id];
  return value === 'on' || (value !== 'off' && feature.defaultEnabled === true);
}

// A preview link activates only the selected change. With no selection,
// the private preview shows the complete set of registered changes.
export function resolveFeature(id, settings, previewSelection) {
  if (previewSelection === undefined) return featureEnabled(id, settings);
  return SITE_FEATURES.some(feature => feature.id === id) && (!previewSelection || previewSelection === id);
}

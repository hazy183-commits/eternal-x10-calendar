import { translateText } from './i18nCore.js';

// Both the carousel and the language observer can refresh this label. Compare
// the final localized text so neither observer keeps undoing the other's work.
export function normalizeActiveStatus(status) {
  if (!['trwa', 'respawn-window-active', 'siege-active', 'olympiad-active'].some(name => status.classList.contains(name))) return;
  const label = translateText('TRWA');
  if (status.textContent !== label) status.textContent = label;
}

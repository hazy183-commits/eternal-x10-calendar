import { isChristmasSeason } from '../lib/christmasSeason.js';

import { PREVIEW_ORIGIN, resolveFeature } from './siteFeatures.js';

const settings = {};
const preview = window.location.origin === PREVIEW_ORIGIN;
const feature = preview ? new URL(window.location.href).searchParams.get('feature') : undefined;
let previousSnow;

const logo = document.querySelector('.topbar .brand-logo');
const standardLogo = logo?.getAttribute('src');
const greeting = document.querySelector('.holiday-greeting');
let previous;

function refreshChristmasTheme() {
  const inSeason = isChristmasSeason();
  const festive = (preview || inSeason) && resolveFeature('christmas-theme', settings, feature);
  const snow = (preview || inSeason) && resolveFeature('christmas-snow', settings, feature);
  if (festive === previous && snow === previousSnow) return;
  previous = festive;
  previousSnow = snow;
  document.documentElement.classList.toggle('holiday-snow', snow);
  document.documentElement.classList.toggle('holiday-website', festive);
  if (greeting) greeting.hidden = !festive;
  if (logo && standardLogo) {
    logo.src = festive ? '/images/holiday/clan-crest-christmas.png' : standardLogo;
  }
}

function refreshAtMinute() {
  refreshChristmasTheme();
  setTimeout(refreshAtMinute, 60_000 - Date.now() % 60_000);
}

window.addEventListener('orzel:site-settings-applied', event => {
  Object.assign(settings, event.detail);
  refreshChristmasTheme();
});
window.addEventListener('orzel:feature-changed', event => {
  settings[event.detail.key] = event.detail.value;
  refreshChristmasTheme();
});
refreshAtMinute();
document.addEventListener('visibilitychange', refreshChristmasTheme);

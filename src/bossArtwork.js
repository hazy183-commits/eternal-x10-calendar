import './landingPremium.css';
import './landingPremium.js';

// Vite serves public/ directly and copies it unchanged into production builds.
const artworkBase = `${import.meta.env.BASE_URL}images/bosses/`;
const eventArtwork = { olympiad: '/images/events/olympiad.jpg' };
const clanHallArtwork = new Map([
  ['fortress of resistance', '/images/fortress-of-resistance.jpg'],
  ['devastated castle', '/images/devastated-castle.jpg'],
  ['bandit stronghold', '/images/bandit-stronghold.jpg'],
  ['rainbow spring chateau', '/images/Rainbow%20Springs%20Chateau.jpg'],
  ['rainbow springs chateau', '/images/Rainbow%20Springs%20Chateau.jpg'],
  ['wild beast reserve', '/images/Wild%20Beast%20Reserve.jpg'],
  ['fortress of the dead', '/images/fortress-of-the-dead.jpg'],
]);
const castleArtwork = new Map([
  ['gludio', 'gludio'], ['dion', 'dion'], ['giran', 'giran'], ['oren', 'oren'],
  ['aden', 'aden'], ['innadril', 'innadril'], ['goddard', 'goddard'],
  ['rune', 'rune'], ['schuttgart', 'schuttgart'],
]);

const bosses = new Map([
  ['queen ant', 'queen-ant'], ['core', 'core'], ['orfen', 'orfen'],
  ['baium', 'baium'], ['zaken', 'zaken'], ['frintezza', 'frintezza'],
  ['antharas', 'antharas'], ['valakas', 'valakas'],
]);
const loads = new Map();
const assigned = new WeakMap();

export function bossArtworkUrl(name = '') {
  const key = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const bossSlug = bosses.get(key);
  if (bossSlug) return `${artworkBase}${bossSlug}.jpg`;
  const clanHallUrl = clanHallArtwork.get(key) ?? [...clanHallArtwork.entries()].find(([hall]) => key.includes(hall))?.[1];
  if (clanHallUrl) return clanHallUrl;
  const castleSlug = [...castleArtwork.entries()].find(([castle]) => key.includes(castle))?.[1];
  if (castleSlug) return `${import.meta.env.BASE_URL}images/castles/${castleSlug}.jpg`;
  return eventArtwork[key] ?? '';
}

function imageLoads(url) {
  if (!loads.has(url)) {
    loads.set(url, new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    }));
  }
  return loads.get(url);
}

export function applyBossArtwork(element, name = '') {
  const url = bossArtworkUrl(name);
  if (assigned.get(element) === url) return;
  assigned.set(element, url);
  element.classList.remove('has-boss-art');
  element.style.removeProperty('--boss-art');
  if (!url) return;
  imageLoads(url).then((loaded) => {
    // Ignore a previous request if this card now represents another event.
    if (!loaded || assigned.get(element) !== url) return;
    element.style.setProperty('--boss-art', `url(${JSON.stringify(url)})`);
    element.classList.add('has-boss-art');
  });
}

export function refreshBossArtwork(root = document) {
  root.querySelectorAll('[data-boss-name]').forEach((element) => {
    applyBossArtwork(element, element.dataset.bossName);
  });
}

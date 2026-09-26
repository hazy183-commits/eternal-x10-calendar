import './landingPremium.css';
import './landingRecruitHighlight.css';
import './landingPremium.js';
import './bossDetailsPl.js';
import './hideBossSources.css';
import './rebornEpicLevels.js';
import './adminHomeScreen.js';
import './adminWorkflowEnhancements.js';
import './leaderAttendanceSummary.js';
import './mobileVisualFixes.css';

// Vite serves public/ directly and copies it unchanged into production builds.
const artworkBase = `${import.meta.env.BASE_URL}images/bosses/`;
const eventArtwork = new Map([
  ['olympiad', '/images/events/olympiad.jpg'],
  ['klanowe pvp', '/images/events/clan-pvp.webp'],
  ['ćwiczenia colloseum', '/images/events/colloseum-training.webp'],
  ['cwiczenia colloseum', '/images/events/colloseum-training.webp'],
]);
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
const loadedArtworks = new Set();
const assigned = new WeakMap();
const pending = new WeakMap();

const artworkObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    artworkObserver.unobserve(entry.target);
    const url = pending.get(entry.target);
    if (url) loadArtwork(entry.target, url);
  }
}, { rootMargin: '400px 0px' });

export function bossArtworkUrl(name = '') {
  if (typeof name === 'string' && /^\/images\//i.test(name.trim())) return name.trim();
  const key = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const bossSlug = bosses.get(key);
  if (bossSlug) return `${artworkBase}${bossSlug}.webp`;
  const clanHallUrl = clanHallArtwork.get(key) ?? [...clanHallArtwork.entries()].find(([hall]) => key.includes(hall))?.[1];
  if (clanHallUrl) return clanHallUrl;
  const castleSlug = [...castleArtwork.entries()].find(([castle]) => key.includes(castle))?.[1];
  if (castleSlug) return `${import.meta.env.BASE_URL}images/castles/${castleSlug}.jpg?v=20260920`;
  return eventArtwork.get(key) ?? '';
}

function imageLoads(url) {
  if (!loads.has(url)) {
    loads.set(url, new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        loadedArtworks.add(url);
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = url;
    }));
  }
  return loads.get(url);
}

function paintArtwork(element, url) {
  // Ignore a previous request if this card now represents another event.
  if (assigned.get(element) !== url) return;
  element.style.setProperty('--boss-art', `url(${JSON.stringify(url)})`);
  element.classList.add('has-boss-art');
}

function loadArtwork(element, url) {
  if (loadedArtworks.has(url)) {
    paintArtwork(element, url);
    return;
  }
  imageLoads(url).then((loaded) => {
    if (!loaded) return;
    paintArtwork(element, url);
  });
}

export function applyBossArtwork(element, name = '') {
  const url = bossArtworkUrl(name);
  if (assigned.get(element) === url) {
    if (url && loadedArtworks.has(url)) paintArtwork(element, url);
    return;
  }
  assigned.set(element, url);
  element.classList.remove('has-boss-art');
  element.style.removeProperty('--boss-art');
  artworkObserver?.unobserve(element);
  if (!url) return;
  pending.set(element, url);
  if (artworkObserver) artworkObserver.observe(element);
  else loadArtwork(element, url);
}

export function refreshBossArtwork(root = document) {
  root.querySelectorAll('[data-boss-name]').forEach((element) => {
    applyBossArtwork(element, element.dataset.bossName);
  });
}

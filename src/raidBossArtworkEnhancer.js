import { bossArtworkUrl } from './bossArtwork.js';

const normalize = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ');

// Interlude NPC IDs. The artwork URLs below point at real Lineage 2 NPC renders/screenshots,
// never generated approximations. Each image has a second independent L2 database fallback.
const RAID_BOSS_IDS = new Map([
  ['ancient weird drake', 25234],
  ['ghost of the well lidia', 25106],
  ['giant marpanak', 25162],
  ['guardian of the statue of giant karum', 25179],
  ['lord ishka', 25407],
  ['taik high prefect arak', 25256],
  ['the 3rd underwater guardian', 25016],
  ['fairy queen timiniel', 25423],
  ['roaring lord kastor', 25226],
  ['gorgolos', 25467],
  ['enmity ghost ramdal', 25444],
  ['fierce tiger king angel', 25125],
  ['gargoyle lord tiphon', 25255],
  ['hekaton prime', 25140],
  ['rahha', 25051],
  ["shilen's priest hisilrome", 25478],
  ["demon's agent falston", 25322],
  ['last titan utenus', 25470],
  ["kernon's faithful servant kelone", 25263],
  ['bloody priest rudelto', 25073],
  ['spirit of andras, the betrayer', 25233],
  ["anakim's nemesis zakaron", 25281],
  ['beast lord behemoth', 25269],
  ["fafurion's herald lokness", 25198],
  ['flame of splendor barakiel', 25325],
  ['korim', 25092],
  ['meanas anor', 25453],
  ['palibati queen themis', 25252],
  ['roaring skylancer', 25163],
  ["shilen's messenger cabrio", 25035],
  ['immortal savior mardil', 25447],
  ['doom blade tanatos', 25248],
  ['vanor chief kandra', 25235],
  ['water dragon seer sheshark', 25199],
  ['death lord hallate', 25220],
  ['antharas priest cloe', 25109],
  ['krokian padisha sobekk', 25202],
  ['bloody empress decarbia', 25266],
  ['death lord ipos', 25276],
  ['death lord shax', 25282],
  ['kernon', 25054],
  ['last lesser giant olkuth', 25244],
  ['palatanos of horrific power', 25249],
  ['storm winged naga', 25229],
  ['flamestone giant', 25524],
  ['ocean flame ashakiel', 25205],
  ['daimon the white-eyed', 25290],
  ['fire of wrath shuriel', 25143],
  ['hestia, guardian deity of the hot springs', 25293],
  ['last lesser giant glaki', 25245],
  ['cherub galaxia', 25450],
  ['longhorn golkonda', 25126],
  ["ketra's hero hekaton", 25299],
  ['queen shyeed', 25514],
  ["varka's hero shadith", 25309],
]);

function wikiSlug(name = '') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function raidBossNpcId(name) {
  return RAID_BOSS_IDS.get(normalize(name)) || null;
}

export function raidBossWikiUrl(name) {
  const id = raidBossNpcId(name);
  if (!id) return 'https://lineage2wiki.org/interlude/monster/#type=boss';
  return `https://lineage2wiki.org/interlude/monster/${id}/${wikiSlug(name)}-raid-boss/`;
}

export function raidBossImageCandidates(name) {
  const id = raidBossNpcId(name);
  const candidates = [];
  if (id) {
    // Real NPC artwork/screenshot endpoints from two Lineage 2 databases.
    candidates.push(`https://wiki.la2era.com/npcs/${id}.jpg`);
    candidates.push(`https://static.l2off.ge/NPCs/${id}.png`);
  }
  const local = bossArtworkUrl(name);
  if (local) candidates.push(local);
  return [...new Set(candidates)];
}

function makeFallback(name, compact = false) {
  const fallback = document.createElement('div');
  fallback.className = compact ? 'needed-rb-real-fallback compact' : 'needed-rb-real-fallback';
  fallback.title = `Brak dostępnego zdjęcia: ${name}`;
  fallback.textContent = 'RB';
  return fallback;
}

function loadRealImage(img, name, onExhausted) {
  const urls = raidBossImageCandidates(name);
  let index = 0;
  const next = () => {
    if (index >= urls.length) {
      onExhausted?.();
      return;
    }
    img.src = urls[index++];
  };
  img.addEventListener('error', next);
  img.referrerPolicy = 'no-referrer';
  next();
}

function enhanceRequestCard(card) {
  if (!card) return;
  const head = card.querySelector('.needed-rb-head');
  const copy = card.querySelector('.needed-rb-copy');
  if (!head || !copy) return;

  const name = copy.querySelector('b')?.textContent?.trim() || 'Raid Boss';

  if (card.dataset.rbArtEnhanced !== '1') {
    const img = document.createElement('img');
    img.className = 'needed-rb-portrait';
    img.alt = `Wygląd ${name}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    const levelBadge = card.querySelector('.needed-rb-level');
    const insertAfterLevel = (element) => {
      if (levelBadge) levelBadge.insertAdjacentElement('afterend', element);
      else head.prepend(element);
    };
    insertAfterLevel(img);

    loadRealImage(img, name, () => {
      const fallback = makeFallback(name);
      img.replaceWith(fallback);
    });

    card.dataset.rbArtEnhanced = '1';
  }

  const actions = card.querySelector('.needed-rb-actions');
  if (actions && !actions.querySelector('[data-rb-location]')) {
    const location = document.createElement('a');
    location.className = 'needed-rb-location';
    location.dataset.rbLocation = '1';
    location.href = raidBossWikiUrl(name);
    location.target = '_blank';
    location.rel = 'noopener noreferrer';
    location.title = `Pokaż mapę spawnu: ${name}`;
    location.textContent = '📍 GDZIE JEST?';
    actions.appendChild(location);
  }
}

function enhanceCalendarRow(row) {
  if (!row || row.dataset.rbArtEnhanced === '1') return;
  const name = row.querySelector('.event-info h3')?.textContent?.trim() || 'Raid Boss';
  const thumb = row.querySelector('.needed-rb-thumb, .event-thumb');
  if (!thumb) return;

  thumb.innerHTML = '';
  thumb.classList.add('needed-rb-has-art');
  const img = document.createElement('img');
  img.className = 'needed-rb-calendar-image';
  img.alt = `Wygląd ${name}`;
  img.loading = 'lazy';
  img.decoding = 'async';
  thumb.appendChild(img);

  loadRealImage(img, name, () => {
    thumb.classList.remove('needed-rb-has-art');
    thumb.replaceChildren(makeFallback(name, true));
  });

  row.dataset.rbArtEnhanced = '1';
}

function enhanceAll() {
  document.querySelectorAll('#neededRbList .needed-rb-card').forEach(enhanceRequestCard);
  document.querySelectorAll('#dailyEvents .needed-rb-calendar-row').forEach(enhanceCalendarRow);
}

export function installRaidBossArtworkEnhancer() {
  if (window.__obRaidBossArtworkEnhancerInstalled) return;
  window.__obRaidBossArtworkEnhancerInstalled = true;

  const style = document.createElement('style');
  style.textContent = `
    .needed-rb-portrait{width:82px;height:82px;object-fit:cover;object-position:center;border:1px solid #8b672f;border-radius:8px;background:#090c0c;box-shadow:0 7px 24px #0008;flex:0 0 82px}
    .needed-rb-head{align-items:center!important}.needed-rb-level{flex:0 0 auto}.needed-rb-copy{padding-left:2px}
    .needed-rb-location{display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border:1px solid #496044;background:#10190f;color:#b8d290;font-size:10px;font-weight:900;text-decoration:none;cursor:pointer}.needed-rb-location:hover{border-color:#6d8c62;background:#172217;color:#d3e8b3}
    .needed-rb-calendar-row .event-thumb.needed-rb-has-art,.needed-rb-calendar-row .needed-rb-thumb.needed-rb-has-art{padding:0!important;overflow:hidden;background:#090c0c!important}
    .needed-rb-calendar-image{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
    .needed-rb-real-fallback{display:grid;place-items:center;width:82px;height:82px;flex:0 0 82px;border:1px solid #66502b;border-radius:8px;background:linear-gradient(145deg,#17140e,#090b0b);color:#b7934c;font-weight:900;letter-spacing:.12em}
    .needed-rb-real-fallback.compact{width:100%;height:100%;min-height:48px;border:0;border-radius:0;font-size:11px}
    @media(max-width:900px){.needed-rb-portrait,.needed-rb-real-fallback{width:62px;height:62px;flex-basis:62px}.needed-rb-head{gap:9px!important}.needed-rb-location{width:100%;box-sizing:border-box}}
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => requestAnimationFrame(enhanceAll));
  const start = () => {
    const zoneList = document.querySelector('#neededRbList');
    const calendar = document.querySelector('#dailyEvents');
    if (!zoneList || !calendar) { setTimeout(start, 150); return; }
    observer.observe(zoneList, { childList:true, subtree:true });
    observer.observe(calendar, { childList:true, subtree:true });
    enhanceAll();
    document.addEventListener('click', e => {
      if (e.target.closest('[data-zone-view="needed-rb"], #filters [data-filter="RB"], #previousDay, #nextDay, #todayButton')) setTimeout(enhanceAll, 120);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
}

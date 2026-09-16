import { bossArtworkUrl } from './bossArtwork.js';

const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function hash(value='') {
  let h = 2166136261;
  for (let i=0;i<value.length;i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(name='') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return words.slice(0,2).map(w => w[0]).join('').toUpperCase() || 'RB';
}

function generatedPortrait(name='', level='') {
  const h = hash(`${name}|${level}`);
  const hue1 = 24 + (h % 26);
  const hue2 = 350 + (h % 10);
  const eye = 36 + (h % 18);
  const horns = 18 + (h % 16);
  const label = esc(initials(name));
  const lvl = esc(level || '?');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <defs>
      <radialGradient id="g" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="hsl(${hue1} 45% 22%)"/><stop offset=".58" stop-color="hsl(${hue2} 28% 10%)"/><stop offset="1" stop-color="#050606"/></radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="160" height="160" rx="12" fill="url(#g)"/>
    <circle cx="80" cy="68" r="44" fill="#0a0d0d" stroke="#6f5325" stroke-width="2"/>
    <path d="M53 58 L${53-horns} 28 L64 47 M107 58 L${107+horns} 28 L96 47" fill="none" stroke="#a47c36" stroke-width="6" stroke-linecap="round"/>
    <path d="M47 83 Q80 116 113 83 Q107 123 80 132 Q53 123 47 83Z" fill="#111515" stroke="#5c4727" stroke-width="2"/>
    <ellipse cx="63" cy="${eye}" rx="9" ry="4" fill="#efb94c" filter="url(#glow)"/>
    <ellipse cx="97" cy="${eye}" rx="9" ry="4" fill="#efb94c" filter="url(#glow)"/>
    <text x="80" y="104" text-anchor="middle" fill="#e8c976" font-family="Arial" font-weight="800" font-size="22">${label}</text>
    <rect x="104" y="118" width="42" height="24" rx="6" fill="#2a1d0e" stroke="#8e672d"/>
    <text x="125" y="135" text-anchor="middle" fill="#e4b960" font-family="Arial" font-weight="800" font-size="13">Lv ${lvl}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function imageFor(name, level) {
  return bossArtworkUrl(name) || generatedPortrait(name, level);
}

function enhanceRequestCard(card) {
  if (!card || card.dataset.rbArtEnhanced === '1') return;
  const head = card.querySelector('.needed-rb-head');
  const copy = card.querySelector('.needed-rb-copy');
  if (!head || !copy) return;
  const name = copy.querySelector('b')?.textContent?.trim() || 'Raid Boss';
  const levelText = card.querySelector('.needed-rb-level')?.textContent || '';
  const level = (levelText.match(/\d+/) || [''])[0];
  const img = document.createElement('img');
  img.className = 'needed-rb-portrait';
  img.alt = name;
  img.loading = 'lazy';
  img.src = imageFor(name, level);
  const levelBadge = card.querySelector('.needed-rb-level');
  if (levelBadge) levelBadge.insertAdjacentElement('afterend', img);
  else head.prepend(img);
  card.dataset.rbArtEnhanced = '1';
}

function enhanceCalendarRow(row) {
  if (!row || row.dataset.rbArtEnhanced === '1') return;
  const name = row.querySelector('.event-info h3')?.textContent?.trim() || 'Raid Boss';
  const meta = row.querySelector('.needed-rb-meta')?.textContent || '';
  const level = (meta.match(/Lv\.\s*(\d+)/i) || [,''])[1];
  const thumb = row.querySelector('.needed-rb-thumb, .event-thumb');
  if (!thumb) return;
  thumb.innerHTML = '';
  thumb.style.backgroundImage = `url(${JSON.stringify(imageFor(name, level))})`;
  thumb.classList.add('needed-rb-has-art');
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
    .needed-rb-portrait{width:72px;height:72px;object-fit:cover;border:1px solid #8b672f;border-radius:8px;background:#090c0c;box-shadow:0 7px 24px #0008;flex:0 0 72px}
    .needed-rb-head{align-items:center!important}.needed-rb-level{flex:0 0 auto}.needed-rb-copy{padding-left:2px}
    .needed-rb-calendar-row .event-thumb.needed-rb-has-art,.needed-rb-calendar-row .needed-rb-thumb.needed-rb-has-art{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;overflow:hidden}
    .needed-rb-calendar-row .event-thumb.needed-rb-has-art span,.needed-rb-calendar-row .needed-rb-thumb.needed-rb-has-art span{display:none!important}
    @media(max-width:900px){.needed-rb-portrait{width:58px;height:58px;flex-basis:58px}.needed-rb-head{gap:9px!important}}
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

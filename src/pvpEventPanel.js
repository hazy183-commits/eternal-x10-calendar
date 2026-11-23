import {
  PVP_EVENTS, PVP_INTERVAL_HOURS, PVP_REWARD, PVP_SERVER_TIME_ZONE, PVP_TIME_ZONE,
  nextPvpEvent, nextPvpEvents, formatPvpDate, pvpCountdownText,
} from './pvpEventSchedule.js';

const EVENT_ICONS = {
  'multi-team-battle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 4 15 16M3 8l4-4 3 3M5 14l-2 2 5 5 2-2M19 4l-4 4M13 10l-2 2"/></svg>',
  'capture-the-base': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l3-3 3 3v12m2 0V9l3-3 3 3v12M7 6V3h3v3m5 0V3h3v3M8 13h.01M16 13h.01"/></svg>',
  'epic-boss-challenge': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7-2-4 6 3 3-2 3 2 6-3-2 7 2 2-3 9H6l-3-9 2-2zM9 13h.01M15 13h.01M10 17h4"/></svg>',
  'korean-tvt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h5v5H4zM15 14h5v5h-5zM9 8l7 8M15 8l-7 8M12 3v3M12 18v3"/></svg>',
  'death-match': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a8 8 0 0 0-5 14.25V21h10v-3.75A8 8 0 0 0 12 3ZM9 11h.01M15 11h.01M9.5 15h5M4 20l3-2m13 2-3-2"/></svg>',
  'capture-the-flag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4m0 1c5-4 9 4 14 0v9c-5 4-9-4-14 0"/></svg>',
};
const poolRows = (className = '') => PVP_EVENTS.map((event) => `<li class="${className} pvp-pool-event-tile" data-pvp-event="${event.id}">
  <span class="pvp-pool-event-icon" aria-hidden="true">${EVENT_ICONS[event.id] || EVENT_ICONS['multi-team-battle']}</span>
  <span class="pvp-pool-event-name">${event.name}</span><code>${event.command}</code>
</li>`).join('');

function localSlotTime(event) {
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: PVP_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(event.startAt));
}

function updateSlot(root, event, now) {
  const put = (selector, value) => {
    const element = root.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  };
  put('[data-pvp-date]', formatPvpDate(event));
  put('[data-pvp-local-time]', `${localSlotTime(event)} · Polska`);
  put('[data-pvp-server-time]', `${event.utcTime} · serwer (${PVP_SERVER_TIME_ZONE})`);
  put('[data-pvp-countdown]', pvpCountdownText(event, now));
}

export function updatePvpRowCountdowns(root, now = new Date()) {
  if (!root) return;
  for (const element of root.querySelectorAll('[data-pvp-countdown-start]')) {
    const text = pvpCountdownText({ startAt: element.dataset.pvpCountdownStart }, now);
    if (element.textContent !== text) element.textContent = text;
  }
}

export function renderPvpEventPanel(root, now = new Date()) {
  if (!root) return;
  if (!root.querySelector('[data-pvp-slot-card]')) {
    root.innerHTML = `<article class="pvp-event-card pvp-slot-card" data-pvp-slot-card>
      <div class="pvp-slot-heading"><div><span class="pvp-slot-kicker">AUTO PVP</span><h4>Najbliższy slot</h4></div><span class="pvp-next-badge">CO ${PVP_INTERVAL_HOURS}H</span></div>
      <dl>
        <div><dt>Data</dt><dd data-pvp-date>—</dd></div>
        <div><dt>Godzina lokalna</dt><dd data-pvp-local-time>—</dd></div>
        <div><dt>Godzina serwera</dt><dd data-pvp-server-time>—</dd></div>
        <div><dt>Odliczanie</dt><dd data-pvp-countdown>—</dd></div>
        <div><dt>Rodzaj eventu</dt><dd>Losowany przez serwer</dd></div>
        <div><dt>Nagroda</dt><dd>${PVP_REWARD}</dd></div>
      </dl>
    </article>
    <article class="pvp-event-card pvp-pool-card">
      <div class="pvp-slot-heading"><div><span class="pvp-slot-kicker">RANDOM POOL</span><h4>Możliwe tryby</h4></div><span class="pvp-pool-count">${PVP_EVENTS.length} trybów</span></div>
      <ul class="pvp-pool-list">${poolRows()}</ul>
      <p>Serwer wybiera tryb przy każdym slocie. Kolejny event nie powtarza ostatnio rozegranego trybu, a szanse zmieniają się po rozgrywkach.</p>
    </article>`;
  }
  const event = nextPvpEvent(null, now);
  if (event) updateSlot(root, event, now);
}

const SIDEBAR_TEMPLATE = `<article class="pvp-sidebar-event pvp-next" data-pvp-slot-card>
  <div class="pvp-sidebar-main"><span class="pvp-sidebar-icon" aria-hidden="true">⚔</span><div class="pvp-sidebar-details">
    <div class="pvp-sidebar-title"><h3>Najbliższy slot</h3><span class="pvp-next-badge">LOSOWANY</span></div>
    <p class="pvp-sidebar-date" data-pvp-date></p>
    <p class="pvp-sidebar-ranges"><span data-pvp-local-time></span><span data-pvp-server-time></span></p>
  </div></div>
  <div class="pvp-sidebar-meta"><p class="pvp-sidebar-status">START SLOTU</p><p class="pvp-sidebar-countdown" data-pvp-countdown></p></div>
</article>
<section class="pvp-sidebar-pool"><div class="pvp-sidebar-pool-head"><h3>Losowana pula</h3><span>${PVP_EVENTS.length} EVENTÓW</span></div><ul>${poolRows('pvp-sidebar-pool-row')}</ul><p>Serwer losuje tryb przy każdym slocie. Ostatni event nie powtarza się od razu, a jego szansa maleje.</p></section>
<aside class="pvp-sidebar-next-slots" aria-label="Kolejne sloty Auto PvP">
  <div class="pvp-sidebar-next-head"><h4>Kolejne starty</h4><span>CZAS POLSKI</span></div>
  <ol class="pvp-sidebar-next-list" data-pvp-next-slot-list></ol>
</aside>`;

function renderPvpSidebarUpcomingSlots(root, now) {
  const list = root.querySelector('[data-pvp-next-slot-list]');
  if (!list) return;
  const slots = nextPvpEvents(4, now);
  const first = slots[0];
  const following = slots.slice(1, 4);
  const signature = following.map((slot) => slot.startAt).join('|');
  if (list.dataset.slots === signature) return;
  list.dataset.slots = signature;
  list.innerHTML = following.length ? following.map((slot, index) => {
    const offset = (index + 1) * PVP_INTERVAL_HOURS;
    const label = slot.date === first?.date
      ? `+${offset}H`
      : new Intl.DateTimeFormat('pl-PL', { timeZone: PVP_TIME_ZONE, weekday: 'short' })
        .format(new Date(slot.startAt)).replace('.', '').toLocaleUpperCase('pl-PL');
    return `<li class="pvp-sidebar-next-slot">
      <span class="pvp-sidebar-next-index">${String(index + 1).padStart(2, '0')}</span>
      <strong>${localSlotTime(slot)}</strong>
      <small>${label}</small>
    </li>`;
  }).join('') : '<li class="pvp-sidebar-next-empty">Brak kolejnych slotów</li>';
}

export function renderPvpSidebar(root, now = new Date()) {
  if (!root) return;
  if (root.dataset.pvpRenderer !== 'random-pool-v3') {
    root.innerHTML = SIDEBAR_TEMPLATE;
    root.dataset.pvpRenderer = 'random-pool-v3';
  }
  const event = nextPvpEvent(null, now);
  if (event) updateSlot(root, event, now);
  renderPvpSidebarUpcomingSlots(root, now);

  const following = nextPvpEvents(3, now).slice(1);
  const nextTimes = following.map((slot) => `${localSlotTime(slot)} Polska`).join(' · ');
  const heading = root.querySelector('.pvp-sidebar-pool-head span');
  if (heading) heading.title = nextTimes ? `Kolejne sloty: ${nextTimes}` : `Co ${PVP_INTERVAL_HOURS} godziny`;
}

if (typeof window !== 'undefined') {
  setTimeout(() => import('./publicCalendarSignups.js').catch((error) => console.warn('Signup viewer disabled', error)), 1800);
}
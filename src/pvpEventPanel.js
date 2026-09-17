import { PVP_EVENTS, PVP_REWARD, PVP_TIME_ZONE, nextPvpEvent, formatPvpDate, pvpEventStatus, pvpCountdownText, pvpTiming } from './pvpEventSchedule.js';

const PVP_ICONS = { 'multi-team-battle': '⚔', 'capture-the-base': '⚑', 'epic-boss-challenge': '☠', 'death-match': '⚔' };
function compactDate(event, now) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: PVP_TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
  if (event.date === today) return 'DZIŚ';
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowDate = new Intl.DateTimeFormat('en-CA', { timeZone: PVP_TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit' }).format(tomorrow);
  if (event.date === tomorrowDate) return 'JUTRO';
  return event.date.slice(8, 10) + '.' + event.date.slice(5, 7);
}
function compactCountdown(event, now) {
  const status = pvpEventStatus(event, now);
  const timing = pvpTiming(event);
  const target = status === 'NADCHODZI' ? timing.registrationStart : status === 'REJESTRACJA OTWARTA' ? timing.eventStart : timing.end;
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2,'0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}

function updatePvpCard(card, event, now) {
  const put = (selector, value) => {
    const element = card.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  };
  const status = pvpEventStatus(event, now);
  put('[data-pvp-date]', formatPvpDate(event));
  put('[data-pvp-time]', `${event.time} · ${PVP_TIME_ZONE}`);
  put('[data-pvp-registration]', event.registrationTimeRange);
  put('[data-pvp-event]', event.eventTimeRange);
  put('[data-pvp-utc]', `${event.utcDate} · ${event.utcTime} UTC`);
  put('[data-pvp-status]', status);
  put('[data-pvp-countdown]', pvpCountdownText(event, now));
  card.classList.toggle('pvp-registering', status === 'REJESTRACJA OTWARTA');
  card.classList.toggle('pvp-active', status === 'EVENT ACTIVE');
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
  if (!root.querySelector('[data-pvp-card]')) {
    root.innerHTML = PVP_EVENTS.map((definition) => `<article class="pvp-event-card" data-pvp-card="${definition.id}">
      <h4>${definition.name}</h4>
      <dl>
        <div><dt>Najbliższa rejestracja</dt><dd data-pvp-date>—</dd></div>
        <div><dt>Start zapisów · lokalnie</dt><dd data-pvp-time>—</dd></div>
        <div><dt>Rejestracja · Europe/Warsaw</dt><dd data-pvp-registration>—</dd></div>
        <div><dt>Event · Europe/Warsaw</dt><dd data-pvp-event>—</dd></div>
        <div><dt>Start zapisów · serwer</dt><dd data-pvp-utc>—</dd></div>
        <div><dt>Status</dt><dd data-pvp-status>—</dd></div>
        <div><dt>Odliczanie</dt><dd data-pvp-countdown>—</dd></div>
        <div><dt>Komenda rejestracji</dt><dd><code>${definition.command}</code></dd></div>
        <div><dt>Nagroda</dt><dd>${PVP_REWARD}</dd></div>
      </dl>
      <p>Zapisy codziennie: ${definition.utcHours.map((hour) => `${String(hour).padStart(2, '0')}:00`).join(' · ')} UTC</p>
    </article>`).join('');
  }
  for (const definition of PVP_EVENTS) {
    const event = nextPvpEvent(definition.id, now);
    const card = root.querySelector(`[data-pvp-card="${definition.id}"]`);
    updatePvpCard(card, event, now);
  }
}

const sidebarSignatures = new WeakMap();

export function renderPvpSidebar(root, now = new Date()) {
  if (!root) return;
  const events = PVP_EVENTS.map(({ id }) => nextPvpEvent(id, now)).filter(Boolean)
    .sort((a, b) => pvpTiming(a).registrationStart - pvpTiming(b).registrationStart);
  const signature = events.map(({ id }) => id).join('|');
  if (sidebarSignatures.get(root) !== signature) {
    root.innerHTML = events.map((event) => `<article class="pvp-sidebar-event" data-pvp-occurrence="${event.id}">
      <div class="pvp-sidebar-main"><span class="pvp-sidebar-icon" aria-hidden="true">${PVP_ICONS[event.pvpId] ?? '✦'}</span><div><h3>${event.name}</h3><p class="pvp-sidebar-date" data-pvp-date></p><p class="pvp-sidebar-ranges"><span>Rejestracja <b data-pvp-registration></b></span><span>Event <b data-pvp-event></b></span></p></div></div>
      <div class="pvp-sidebar-meta"><p class="pvp-sidebar-status" data-pvp-status></p><p class="pvp-sidebar-countdown" data-pvp-countdown></p></div>
    </article>`).join('');
    sidebarSignatures.set(root, signature);
  }
  for (const event of events) {
    updatePvpCard(root.querySelector(`[data-pvp-occurrence="${event.id}"]`), event, now);
    const card = root.querySelector(`[data-pvp-occurrence="${event.id}"]`);
    card.querySelector('[data-pvp-date]').textContent = compactDate(event, now);
    card.querySelector('[data-pvp-countdown]').textContent = compactCountdown(event, now);
  }
}

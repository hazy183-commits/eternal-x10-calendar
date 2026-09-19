import './persistentHeader.js';
import { publishClanEventSources } from './clanEventFeed.js';
import { SupabaseEventRepository } from './supabaseEvents.js';
import { supabase } from './supabaseClient.js';
import { applyBossArtwork, bossArtworkUrl, refreshBossArtwork } from './bossArtwork.js';
import { BOSS_NAMES, presetForBoss, defaultDurationForType } from './adminFormDefaults.js';
import { ADMIN_FILTERS, ADMIN_SORTS, filterAndSortAdminEvents } from './adminList.js';
import { MAX_BATCH_EVENTS, RECURRENCE_PATTERNS, eventIdentity, generateRecurringDates, previewRecurringDates } from './adminScheduling.js';
import { BOSS_RESPAWN_BOSSES, TIME_ZONE, formatLocalDateTime, localInputValues, managerCardData, publicEventKey, publicRespawnEvents } from './bossRespawns.js';
import { SupabaseBossRespawnRepository } from './supabaseBossRespawns.js';
import { SIEGE_CASTLES, castleFromEvent, publicSiegeEvents, siegeCardData, siegePublicKey } from './siegeSchedules.js';
import { SupabaseSiegeScheduleRepository } from './supabaseSiegeSchedules.js';
import { TerritoryOwnershipRepository, applyTerritoryOwners, ownerFor } from './territoryOwnership.js';
import { withOlympiadEvents, olympiadStatus, olympiadCountdownTarget, olympiadLocalDate, formatOlympiadDate } from './olympiadSchedule.js';
import { renderOlympiadPanel } from './olympiadPanel.js';
import { withPvpEvents, pvpEventStatus, pvpCountdownText } from './pvpEventSchedule.js';
import { renderPvpEventPanel, renderPvpSidebar, updatePvpRowCountdowns } from './pvpEventPanel.js';
console.log('APP STARTED');

const artworkName = (event) => event?.boss || event?.name || '';
const TYPES = ['RB', 'Epic RB', 'Clan Hall', 'Siege', 'Olympiad', 'Event'];
const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromEvent = (event) => event?.startAt ? new Date(event.startAt) : new Date(`${event.date}T${event.time}:00`);
const today = new Date(); today.setHours(0, 0, 0, 0);
const repository = new SupabaseEventRepository();
const bossRespawnRepository = new SupabaseBossRespawnRepository();
const siegeScheduleRepository = new SupabaseSiegeScheduleRepository();
const territoryOwnershipRepository = new TerritoryOwnershipRepository(supabase);
let events = [];
let adminEvents = [];
let ordinaryEvents = [];
let bossRespawnRows = [];
let siegeScheduleRows = [];
let territoryOwnershipRows = [];
let session = null;
let pendingAdminAction = null;
let formMode = 'new';
let automaticLocation = true;
let automaticDuration = true;
let recurrenceMode = 'single';
let adminFilter = 'Wszystkie';
let adminSort = 'nearest';
let adminSearch = '';
let selectedDay = new Date(today);
let filter = 'Wszystkie';
let featuredEventId = null;
let featuredRenderSignature = '';

function formatDate(date, options = { weekday: 'long', day: 'numeric', month: 'long' }) { return new Intl.DateTimeFormat('pl-PL', options).format(date); }
function sorted(list) { return [...list].sort((a, b) => dateFromEvent(a) - dateFromEvent(b)); }
function safe(text = '') { return text.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function status(event, now = new Date()) { const start = dateFromEvent(event); const end = new Date(start.getTime() + (event.duration || 60) * 60000); const diff = start - now; if (now >= end) return 'ZAKOŃCZONE'; if (now >= start) return 'TRWA'; if (diff <= 15 * 60000) return 'ZA CHWILĘ'; return 'NADCHODZI'; }
function eventStatus(event, now = new Date()) {
  if (event?.isPvpSchedule) return pvpEventStatus(event, now);
  if (event?.isOlympiadSchedule) return olympiadStatus(event, now);
  if (!event?.isBossRespawn && !event?.isSiegeSchedule) return status(event, now);
  const start = event.startAt ? new Date(event.startAt) : null;
  const end = event.endAt ? new Date(event.endAt) : null;
  if (start && end && Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())) {
    if (now < start) return 'NADCHODZI';
    if (now < end) return event.isSiegeSchedule ? 'SIEGE ACTIVE' : 'RESPAWN WINDOW ACTIVE';
    return 'OKNO ZAKOŃCZONE';
  }
  return event.siegeStatus || event.respawnStatus || status(event, now);
}
function eventDetails(event) { return [event.location ? `⌖ ${safe(event.location)}` : '', event.duration ? `◷ ${event.duration} min` : ''].filter(Boolean).join('  ·  '); }
function getUpcoming() {
  const candidates = events.filter((event) => !event.isPvpSchedule && dateFromEvent(event).getTime() + (event.duration || 60) * 60000 > Date.now());
  const activeBosses = candidates.filter((event) => event.isBossRespawn && eventStatus(event) === 'RESPAWN WINDOW ACTIVE');
  if (activeBosses.length) {
    const activeIds = new Set(activeBosses.map((event) => event.id));
    return [...sorted(activeBosses), ...sorted(candidates.filter((event) => !activeIds.has(event.id)))];
  }
  return sorted(candidates);
}

function renderFilters() { const filters = $('#filters'); if (!filters) return; filters.innerHTML = ['Wszystkie', ...TYPES].map((item) => `<button class="filter-btn ${filter === item ? 'active' : ''}" data-filter="${item}">${item}</button>`).join(''); }
function rowCountdown(event) {
  if (event.isPvpSchedule) return pvpCountdownText(event);
  const currentStatus = eventStatus(event);
  if (['TRWA', 'RESPAWN WINDOW ACTIVE', 'SIEGE ACTIVE', 'OLYMPIAD ACTIVE'].includes(currentStatus)) {
    const seconds = Math.max(0, Math.floor((countdownTargetFor(event).target.getTime() - Date.now()) / 1000));
    return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
  }
  if (currentStatus === 'OKNO ZAKOŃCZONE' || currentStatus === 'ZAKOŃCZONE') return 'Zakończone';
  const seconds = Math.max(0, Math.floor((dateFromEvent(event) - Date.now()) / 1000));
  return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}
function countdownTargetFor(event) {
  const currentStatus = eventStatus(event);
  const active = ['TRWA', 'RESPAWN WINDOW ACTIVE', 'SIEGE ACTIVE', 'OLYMPIAD ACTIVE'].includes(currentStatus);
  if (active) {
    if (event.isOlympiadSchedule) return { target: olympiadCountdownTarget(event), label: 'Do zakończenia' };
    if (event.endAt) return { target: new Date(event.endAt), label: 'Do zakończenia' };
    return { target: new Date(dateFromEvent(event).getTime() + (event.duration || 60) * 60000), label: 'Do zakończenia' };
  }
  return { target: dateFromEvent(event), label: 'Do rozpoczęcia' };
}
function eventRow(event, nearest = false) { const currentStatus = eventStatus(event); const state = calendarEventState(event); const label = state === 'active' ? 'TRWA' : currentStatus; return `<article class="event-row" data-calendar-state="${state}" data-calendar-nearest="${nearest}"><time class="event-time">${event.time}</time><div class="event-thumb" data-boss-name="${safe(artworkName(event))}"><span>ART</span></div><div class="event-info"><h3>${safe(event.name)}</h3>${event.ownerClan ? `<span class="territory-owner-label">Właściciel: ${safe(event.ownerClan)}</span>` : ''}${event.isOlympiadSchedule ? `<span class="olympiad-window">${event.timeRange}</span>` : event.isPvpSchedule ? `<span class="pvp-calendar-times">Rejestracja: ${event.registrationTimeRange}<br />Event: ${event.eventTimeRange}</span>` : ''}</div><span class="type-chip ${event.type.toLowerCase().replaceAll(' ', '-')}">${event.type}</span><p class="event-location">${event.location ? `⌖ ${safe(event.location)}` : 'Wydarzenie klanowe'}</p><div class="row-status"><b class="status-dot ${currentStatus.toLowerCase().replaceAll(' ', '-')} ${event.isBossRespawn || event.isSiegeSchedule ? 'respawn-status' : ''}">${label}</b><span${event.isPvpSchedule ? ` data-pvp-countdown-start="${event.startAt}"` : ''}>${rowCountdown(event)}</span></div></article>`; }
function calendarEventState(event) {
  const current = eventStatus(event);
  if (['TRWA', 'RESPAWN WINDOW ACTIVE', 'SIEGE ACTIVE', 'OLYMPIAD ACTIVE'].includes(current)) return 'active';
  if (['ZAKOŃCZONE', 'OKNO ZAKOŃCZONE', 'OLYMPIAD ENDED'].includes(current)) return 'completed';
  return 'upcoming';
}
function calendarEventsFor(day) {
  return sorted(withPvpEvents(withOlympiadEvents(events, new Date(), dateKey(day)), new Date(), dateKey(day))
    .filter(event => !event.isPvpSchedule && event.date === dateKey(day)));
}
function renderCalendarWeek() {
  const start = new Date(selectedDay);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  $('#calendarWeek').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = dateKey(day);
    const count = calendarEventsFor(day).length;
    const isToday = key === dateKey(new Date());
    const selected = key === dateKey(selectedDay);
    const word = count === 1 ? 'wydarzenie' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'wydarzenia' : 'wydarzeń';
    return `<button type="button" class="calendar-day${selected ? ' selected' : ''}${isToday ? ' today' : ''}" data-calendar-day="${key}" aria-pressed="${selected}" aria-label="${formatDate(day)}, ${count} ${word}"><span>${isToday ? 'Dzisiaj' : formatDate(day, { weekday: 'short' })}</span><b>${formatDate(day, { day: 'numeric', month: 'short' })}</b><small>${count} ${word}</small></button>`;
  }).join('');
}
let calendarClockSignature = '';
function calendarClockKey() {
  return `${Math.floor(Date.now() / 60000)}|${events.map(event => eventStatus(event)).join('|')}`;
}
function refreshCalendarClock() {
  if (calendarClockKey() !== calendarClockSignature) renderCalendar();
}
function renderCalendar() {
  const list = calendarEventsFor(selectedDay).filter(event => filter === 'Wszystkie' || event.type === filter);
  const next = list.find(event => calendarEventState(event) === 'upcoming' && dateFromEvent(event) > new Date());
  $('#selectedDate').textContent = formatDate(selectedDay);
  renderCalendarWeek();
  const heading = '<div class="event-table-head"><span>Godzina</span><span>Wydarzenie</span><span>Typ</span><span>Lokalizacja</span><span>Zapisani</span><span>Status · odliczanie</span></div>';
  $('#dailyEvents').innerHTML = heading + (list.length ? list.map(event => eventRow(event, event === next)).join('') : '<div class="empty-state"><span>✦</span><p>Brak wydarzeń w tej kategorii.</p></div>');
  refreshBossArtwork($('#dailyEvents'));
  calendarClockSignature = calendarClockKey();
}

 function miniRow(event) { const sameDay = event.date === (event.isOlympiadSchedule ? olympiadLocalDate() : dateKey(today)); const countdown = countdownTargetFor(event); return `<div class="mini-event" data-boss-name="${safe(artworkName(event))}" data-event-type="${safe(event.type)}" data-event-location="${safe(event.location || '')}" data-owner-clan="${safe(event.ownerClan || '')}" data-event-start-time="${safe(event.time || '')}" data-countdown-target="${countdown.target.toISOString()}" data-countdown-label="${countdown.label}"><time>${sameDay ? event.time : formatDate(dateFromEvent(event), { day: '2-digit', month: 'short', ...(event.isOlympiadSchedule ? { timeZone: 'Europe/Warsaw' } : {}) })}</time><div><b>${safe(event.name)}</b><span>${event.type}${event.location ? ` · ${safe(event.location)}` : ''}${event.ownerClan ? ` · Właściciel: ${safe(event.ownerClan)}` : ''}</span>${event.isOlympiadSchedule ? `<span class="olympiad-window">${event.timeRange}</span>` : ''}</div></div>`; }
function renderOverview() { const todays = sorted(events.filter((event) => !event.isPvpSchedule && event.date === (event.isOlympiadSchedule ? olympiadLocalDate() : dateKey(today)))); $('#todayCount').textContent = todays.length; $('#todayEvents').innerHTML = todays.length ? todays.map(miniRow).join('') : '<p class="empty-mini">Dziś nie zaplanowano wydarzeń.</p>'; const upcoming = getUpcoming().slice(0, 5); $('#upcomingEvents').innerHTML = upcoming.length ? upcoming.map(miniRow).join('') : '<p class="empty-mini">Brak nadchodzących wydarzeń.</p>'; refreshBossArtwork($('#statistics')); renderPvpSidebar($('#pvpSidebarEvents')); }
function eventWindowLabel(event) { if (event?.isOlympiadSchedule) return `${formatOlympiadDate(event)} · ${event.timeRange} · Europe/Warsaw`; if (!event?.isBossRespawn && !event?.isSiegeSchedule) return `${formatDate(dateFromEvent(event), { weekday: 'long', day: 'numeric', month: 'long' })} · ${event.time}${event.location ? ` · ${event.location}` : ''}`; const start = dateFromEvent(event); const end = event.endAt ? new Date(event.endAt) : new Date(start.getTime() + event.duration * 60000); const endTime = new Intl.DateTimeFormat('pl-PL', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(end); return `${formatLocalDateTime(start, { dateStyle: 'full', timeStyle: 'short' })}–${endTime}${event.location ? ` · ${event.location}` : ''}`; }
 function renderFeaturedOwner(ownerClan) { const chip = $('#nextOwner'); if (!chip) return; const owner = String(ownerClan || '').trim(); chip.hidden = !owner; chip.textContent = owner ? `WŁAŚCICIEL: ${owner}` : ''; }
 function renderFeaturedStart(time) { const box = $('#nextStartTime'); if (!box) return; const value = String(time || '').slice(0, 5); box.hidden = !/^([01]\d|2[0-3]):[0-5]\d$/.test(value); const caption = box.querySelector('span'); const label = box.querySelector('b'); if (caption) caption.textContent = 'START WYDARZENIA'; if (label) label.textContent = box.hidden ? '--:--' : value; }
function featuredDescription(event) { const description = String(event?.description || '').trim(); const owner = String(event?.ownerClan || '').trim(); if (!owner) return description; const ownerSuffix = `Właściciel: ${owner}.`; return description.endsWith(ownerSuffix) ? description.slice(0, -ownerSuffix.length).trim() : description; }
function renderNext() {
  const event = getUpcoming()[0];
  const nextId = event?.id ?? null;
  const changed = nextId !== featuredEventId;
  featuredEventId = nextId;
  const carouselCard = $('#nextEventCard');
  const manualSlide = carouselCard?.dataset?.carouselIndex && carouselCard.dataset.carouselIndex !== '0';
  if (changed) renderOverview();
  if (changed && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orzel:featured-event-updated', { detail: { id: nextId } }));
  } else if (manualSlide) {
    return;
  }
  const nextSignature = event
    ? [event.id, event.name, event.type, event.time, event.location, event.description, event.ownerClan, eventStatus(event)].join('|')
    : 'empty';
  if (!changed && featuredRenderSignature === nextSignature) return;
  featuredRenderSignature = nextSignature;
  applyBossArtwork($('.event-art-large'), artworkName(event));
  if (!event) {
    $('#nextName').textContent = 'BRAK NADCHODZĄCYCH WYDARZEŃ';
    $('#nextType').textContent = 'KALENDARZ KLANU';
    $('#nextType').className = 'type-chip';
    renderFeaturedOwner('');
    renderFeaturedStart('');
    $('#nextLocation').textContent = '—';
    $('#nextMeta').textContent = 'Dodaj nowe wydarzenie w panelu administratora.';
    $('#nextDescription').textContent = 'Gdy wydarzenie zostanie zaplanowane, pojawi się tutaj z pełnym odliczaniem.';
    $('#nextStatus').textContent = 'OCZEKUJE';
    $('#nextStatus').className = 'live-status zakończone';
    return;
  }
  $('#nextName').textContent = event.name;
  $('#nextType').textContent = event.type;
  $('#nextType').className = `type-chip ${event.type.toLowerCase().replaceAll(' ', '-')}`;
  renderFeaturedOwner(event.ownerClan);
  renderFeaturedStart(event.time);
  $('#nextLocation').textContent = event.location || 'Do ustalenia';
  $('#nextMeta').textContent = eventWindowLabel(event).replace(event.location ? ' · ' + event.location : '\u0000', '');
  const description = featuredDescription(event);
  $('#nextDescription').textContent = description === 'Lokalizacja: ' + event.location ? '' : description;
  $('#nextStatus').textContent = eventStatus(event);
  $('#nextStatus').className = `live-status ${eventStatus(event).toLowerCase().replaceAll(' ', '-')}`;
}
function updateCountdown() { const carouselCard = $('#nextEventCard'); if (carouselCard?.dataset?.carouselIndex && carouselCard.dataset.carouselIndex !== '0') return; const event = getUpcoming()[0]; if (!event) { $('#countdownLabel').textContent = 'Do rozpoczęcia'; $('#countdown').innerHTML = '<b>00</b><i>:</i><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b>'; return; } const currentStatus = eventStatus(event); const countdown = countdownTargetFor(event); $('#countdownLabel').textContent = countdown.label; let seconds = Math.max(0, Math.floor((countdown.target - Date.now()) / 1000)); const values = [Math.floor(seconds / 86400), Math.floor((seconds %= 86400) / 3600), Math.floor((seconds %= 3600) / 60), seconds % 60]; $('#countdown').innerHTML = values.map((value, index) => `<b data-digits="${pad(value).length}">${pad(value)}</b>${index < 3 ? '<i>:</i>' : ''}`).join(''); const status = $('#nextStatus'); if (status.textContent !== currentStatus) status.textContent = currentStatus; status.className = `live-status ${currentStatus.toLowerCase().replaceAll(' ', '-')}`; }
function renderAdminFilters() {
  $('#adminFilters').innerHTML = ADMIN_FILTERS.map((item) => `<button class="admin-filter-btn ${adminFilter === item ? 'active' : ''}" type="button" data-admin-filter="${item}">${item}</button>`).join('');
  $('#adminSort').value = adminSort;
  $('#adminSearch').value = adminSearch;
}
function renderAdmin() {
  const all = sorted(adminEvents);
  const visible = filterAndSortAdminEvents(adminEvents, { type: adminFilter, sort: adminSort, query: adminSearch });
  $('#adminCount').textContent = all.length;
  $('#adminEventList').innerHTML = visible.map((event) => `<div class="admin-event"><div class="admin-event-copy"><div class="event-thumb" data-boss-name="${safe(artworkName(event))}"><span>ART</span></div><div><b>${safe(event.name)}</b><span>${event.date} · ${event.time} · ${safe(event.type)}</span><span>${safe(event.location || 'Brak lokalizacji')}</span></div></div><div><button class="edit-btn" data-edit="${event.id}">Edytuj</button><button class="delete-btn" data-delete="${event.id}">Usuń</button></div></div>`).join('') || '<p class="empty-mini">Brak wydarzeń pasujących do filtrów.</p>';
  renderAdminFilters();
  refreshBossArtwork($('#adminEventList'));
}
function renderAll() { renderFilters(); renderCalendar(); renderOverview(); renderNext(); renderAdmin(); updateCountdown(); }
const normalizedBossName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
function mergePublicEvents() {
  const ownedOrdinaryEvents = applyTerritoryOwners(ordinaryEvents, territoryOwnershipRows);
  publishClanEventSources(ownedOrdinaryEvents, bossRespawnRows, siegeScheduleRows, territoryOwnershipRows);
  const managerEvents = publicRespawnEvents(bossRespawnRows, new Date());
  const siegeEvents = applyTerritoryOwners(publicSiegeEvents(siegeScheduleRows, new Date()), territoryOwnershipRows);
  const managerKeys = new Set(managerEvents.map(publicEventKey));
  const managerBosses = new Set(BOSS_RESPAWN_BOSSES.map(normalizedBossName));
  const siegeKeys = new Set(siegeEvents.map(siegePublicKey));
  events = withPvpEvents(withOlympiadEvents([...ownedOrdinaryEvents.filter((event) => {
    const names = [event.boss, event.name]
      .filter(Boolean)
      .map(normalizedBossName);
    if (names.some((name) => managerBosses.has(name)) || managerKeys.has(publicEventKey(event))) return false;
    if (String(event.type || '').toLocaleLowerCase() === 'siege') {
      const castle = castleFromEvent(event);
      if (castle && siegeKeys.has(siegePublicKey({ castle, date: event.date }))) return false;
    }
    return true;
  }), ...managerEvents, ...siegeEvents]));
}
function refreshDynamicEvents() {
  const signature = () => events.filter((event) => event.isBossRespawn || event.isSiegeSchedule || event.isOlympiadSchedule || event.isPvpSchedule)
    .map((event) => `${event.id}:${event.date}:${event.time}:${event.respawnStatus || event.siegeStatus || event.olympiadStatus || event.pvpStatus || eventStatus(event)}`).join('|');
  const before = signature();
  mergePublicEvents();
  const after = signature();
  if (before !== after) { renderCalendar(); renderOverview(); }
}
function isAuthenticated() { return Boolean(session?.user); }
function updateAuthUi() {
  $('#adminLogout').hidden = !isAuthenticated();
}
function closeModal(selector) {
  const modal = $(selector);
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
function openLogin() {
  $('#loginForm').reset();
  $('#loginFeedback').textContent = '';
  $('#loginModal').classList.add('open');
  $('#loginModal').setAttribute('aria-hidden', 'false');
  $('#loginEmail').focus();
}
function showAdminView(form = false) {
  $('#adminListView').hidden = form;
  $('#adminFormView').hidden = !form;
  $('.admin-panel').scrollTop = 0;
  if (form) $('#eventName').focus();
}
function openAdmin() {
  if (!isAuthenticated()) {
    pendingAdminAction = null;
    openLogin();
    return;
  }
  $('#adminModal').classList.add('open');
  $('#adminModal').setAttribute('aria-hidden', 'false');
  resetForm();
  setAdminFeedback('');
  showAdminView();
}
function openNewEvent() {
  if (!isAuthenticated()) {
    pendingAdminAction = 'new';
    openLogin();
    return;
  }
  openAdmin();
  $('#eventDate').value = '';
  $('#eventTime').value = '';
  setAdminFeedback('');
  updateBossPreview('');
  showAdminView(true);
}
function quickTemplateNames() {
  return [...BOSS_NAMES.filter((name) => name !== 'Brak grafiki'), ...TYPES.slice(2)];
}
function renderQuickTemplates() {
  const buttons = $('#quickTemplateButtons');
  if (!buttons) return;
  buttons.innerHTML = quickTemplateNames().map((name) => `<button type="button" class="quick-template-btn" data-template="${safe(name)}">${safe(name)}</button>`).join('');
}
function applyQuickTemplate(name) {
  if (formMode !== 'new') return;
  const preset = presetForBoss(name);
  const type = preset?.type || name;
  $('#eventName').value = name;
  $('#eventType').value = type;
  $('#eventBoss').value = preset ? name : '';
  $('#eventLocation').value = preset?.location || '';
  $('#eventDuration').value = defaultDurationForType(type);
  automaticLocation = true;
  automaticDuration = true;
  updateBossPreview(preset ? name : '');
  updateRecurrencePreview();
  $('#eventName').focus();
}
function updateRecurrencePatternUi() {
  const custom = $('#recurrencePattern').value === 'everyDays';
  $('#recurrenceIntervalField').hidden = !custom;
  updateRecurrencePreview();
}
function setRecurrenceMode(mode) {
  recurrenceMode = mode === 'recurring' ? 'recurring' : 'single';
  const recurring = recurrenceMode === 'recurring' && formMode === 'new';
  $('#recurrenceSection').hidden = !recurring;
  $('#recurrencePreview').hidden = !recurring;
  if (recurring) updateRecurrencePatternUi();
}
function updateRecurrencePreview() {
  if (formMode !== 'new' || recurrenceMode !== 'recurring') return;
  const preview = previewRecurringDates({
    startDate: $('#eventDate').value,
    endDate: $('#recurrenceEndDate').value,
    pattern: $('#recurrencePattern').value,
    intervalDays: $('#recurrenceInterval').value,
  });
  const list = $('#recurrencePreviewList');
  const summary = $('#recurrencePreviewSummary');
  list.innerHTML = preview.dates.map((date) => `<li>${safe(date)}${$('#eventTime').value ? ` · ${safe($('#eventTime').value)}` : ''}</li>`).join('');
  if (preview.error) {
    summary.textContent = preview.error;
    summary.className = 'recurrence-error';
  } else if (!preview.total) {
    summary.textContent = 'Wybierz pierwszą i końcową datę wydarzeń.';
    summary.className = 'recurrence-error';
  } else {
    summary.textContent = `${preview.remaining ? `…oraz ${preview.remaining} kolejnych. ` : ''}Łącznie: ${preview.total}.${preview.exceedsLimit ? ` Maksymalnie można utworzyć ${MAX_BATCH_EVENTS}.` : ''}`;
    summary.className = preview.exceedsLimit ? 'recurrence-error' : '';
  }
}
function setAdminFeedback(message = '', isError = false) {
  const feedback = $('#adminFeedback');
  feedback.textContent = message;
  feedback.classList.toggle('admin-feedback-error', isError);
}
function updateBossPreview(name = '') {
  const image = $('#bossPreviewImage');
  const placeholder = $('#bossPreviewPlaceholder');
  if (!image || !placeholder) return;
  const url = bossArtworkUrl(name);
  image.hidden = true;
  image.removeAttribute('src');
  image.alt = '';
  placeholder.hidden = false;
  placeholder.textContent = url ? 'Ładowanie grafiki…' : 'Wybierz bossa, aby zobaczyć grafikę.';
  if (!url) return;
  image.onload = () => {
    image.hidden = false;
    placeholder.hidden = true;
  };
  image.onerror = () => {
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = 'Brak grafiki';
  };
  image.alt = `Grafika: ${name}`;
  image.src = url;
}
function updateDurationDefault() {
  if (formMode === 'new' && automaticDuration) {
    $('#eventDuration').value = defaultDurationForType($('#eventType').value);
  }
}
function applyBossDefaults() {
  const boss = $('#eventBoss').value;
  const preset = presetForBoss(boss);
  if (formMode === 'new') {
    if (automaticLocation) $('#eventLocation').value = preset?.location || '';
    if (preset) {
      if (!$('#eventName').value.trim()) $('#eventName').value = boss;
      $('#eventType').value = preset.type;
    }
    updateDurationDefault();
  }
  updateBossPreview(preset ? boss : '');
}
function validateEventForm() {
  const checks = [
    ['#eventName', 'Podaj nazwę wydarzenia.'],
    ['#eventDate', 'Wybierz datę wydarzenia.'],
    ['#eventTime', 'Wybierz godzinę wydarzenia.'],
    ['#eventType', 'Wybierz typ wydarzenia.'],
  ];
  for (const [selector, message] of checks) {
    const field = $(selector);
    if (!field.value.trim()) {
      setAdminFeedback(message, true);
      field.focus();
      return false;
    }
  }
  const duration = Number($('#eventDuration').value);
  if (!Number.isFinite(duration) || duration <= 0) {
    setAdminFeedback('Czas trwania musi być większy od 0 minut.', true);
    $('#eventDuration').focus();
    return false;
  }
  if (formMode === 'new' && recurrenceMode === 'recurring') {
    const preview = previewRecurringDates({
      startDate: $('#eventDate').value,
      endDate: $('#recurrenceEndDate').value,
      pattern: $('#recurrencePattern').value,
      intervalDays: $('#recurrenceInterval').value,
    });
    if (preview.error) {
      setAdminFeedback(preview.error, true);
      return false;
    }
    if (preview.exceedsLimit) {
      setAdminFeedback(`Jedna operacja może utworzyć maksymalnie ${MAX_BATCH_EVENTS} wydarzeń.`, true);
      return false;
    }
  }
  setAdminFeedback('');
  return true;
}
function resetForm() {
  formMode = 'new';
  automaticLocation = true;
  automaticDuration = true;
  recurrenceMode = 'single';
  $('#eventForm').reset();
  $('#formTitle').textContent = 'Nowe wydarzenie';
  $('#eventId').value = '';
  $('#eventDate').value = dateKey(selectedDay);
  $('#eventTime').value = '20:00';
  $('#eventType').value = 'RB';
  $('#eventDuration').value = defaultDurationForType('RB');
  $('#eventModeChooser').hidden = false;
  $('#quickTemplates').hidden = false;
  $('#eventModeChooser input[value="single"]').checked = true;
  $('#recurrencePattern').value = 'daily';
  $('#recurrenceInterval').value = '3';
  $('#recurrenceEndDate').value = '';
  setRecurrenceMode('single');
  $('#saveEvent').textContent = 'Zapisz wydarzenie';
  updateBossPreview('');
}
function openEdit(id) {
  const event = adminEvents.find((item) => item.id === id);
  if (!event) return;
  formMode = 'edit';
  automaticLocation = false;
  automaticDuration = false;
  $('#eventId').value = event.id;
  $('#eventName').value = event.name;
  $('#eventType').value = event.type;
  $('#eventDate').value = event.date;
  $('#eventTime').value = event.time;
  $('#eventDuration').value = event.duration || '';
  $('#eventLocation').value = event.location || '';
  $('#eventDescription').value = event.description || '';
  $('#eventBoss').value = BOSS_NAMES.find(name => name.toLowerCase() === artworkName(event).trim().toLowerCase().replace(/\s+/g, ' ')) || '';
  updateBossPreview($('#eventBoss').value || artworkName(event));
  $('#eventModeChooser').hidden = true;
  $('#quickTemplates').hidden = true;
  setRecurrenceMode('single');
  $('#formTitle').textContent = 'Edycja wydarzenia';
  $('#saveEvent').textContent = 'Zapisz zmiany';
  setAdminFeedback('');
  showAdminView(true);
  $('#adminModal').classList.add('open');
  $('#adminModal').setAttribute('aria-hidden', 'false');
}
function formEvent(date = $('#eventDate').value) {
  return {
    name: $('#eventName').value.trim(),
    type: $('#eventType').value,
    boss: $('#eventBoss').value,
    date,
    time: $('#eventTime').value,
    duration: Number($('#eventDuration').value),
    location: $('#eventLocation').value.trim(),
    description: $('#eventDescription').value.trim(),
  };
}
function eventCandidates() {
  const base = formEvent();
  if (recurrenceMode !== 'recurring') return [base];
  const dates = generateRecurringDates({
    startDate: base.date,
    endDate: $('#recurrenceEndDate').value,
    pattern: $('#recurrencePattern').value,
    intervalDays: $('#recurrenceInterval').value,
  });
  return dates.map((date) => ({ ...base, date }));
}
async function splitDuplicates(candidates) {
  const duplicates = await repository.findDuplicates(candidates);
  const duplicateKeys = new Set(duplicates.map((event) => eventIdentity(event)));
  return {
    duplicates,
    fresh: candidates.filter((candidate) => !duplicateKeys.has(eventIdentity(candidate))),
  };
}
function respawnClass(statusValue) { return statusValue.toLowerCase().replaceAll(' ', '-'); }
function managerCountdown(card) {
  const statusValue = card.status;
  const target = statusValue === 'RESPAWN WINDOW ACTIVE' ? card.windowEnd || card.occurrence?.end : card.windowStart || card.occurrence?.start;
  if (!target || statusValue === 'ZABITY' || statusValue === 'OCZEKIWANIE NA OKNO Z GRY' || statusValue === 'OKNO ZAKOŃCZONE') return '—';
  const seconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  return `${Math.floor(seconds / 86400)}d ${pad(Math.floor((seconds % 86400) / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}
function managerDate(value) { return value ? formatLocalDateTime(value) : '—'; }
function renderBossRespawnManager() {
  const container = $('#bossRespawnCards');
  if (!container) return;
  const now = new Date();
  const rows = new Map(bossRespawnRows.map((row) => [row.boss, row]));
  container.innerHTML = BOSS_RESPAWN_BOSSES.map((boss) => {
    const card = managerCardData(boss, rows.get(boss), now);
    const manual = card.mode === 'manual';
    const dateMarker = manual ? (card.windowStart?.toISOString() || '') : (card.occurrence?.date || '');
    const details = manual
      ? `<dl><div><dt>Ostatnie zabicie</dt><dd>${managerDate(card.lastKill)}</dd></div><div><dt>Bazowy respawn</dt><dd>${managerDate(card.baseRespawn)}</dd></div><div><dt>Okno z gry</dt><dd>${card.windowStart ? `${managerDate(card.windowStart)} – ${managerDate(card.windowEnd)}` : '—'}</dd></div></dl>`
      : `<dl><div><dt>Najbliższy termin</dt><dd>${managerDate(card.occurrence?.start)}</dd></div><div><dt>Okno</dt><dd>22:00 – 23:00</dd></div></dl>`;
    const actions = manual ? `<div class="boss-respawn-actions"><button class="secondary-btn" type="button" data-respawn-action="kill" data-respawn-boss="${safe(boss)}">Boss zabity</button><button class="primary-btn" type="button" data-respawn-action="window" data-respawn-boss="${safe(boss)}">Ustaw okno z gry</button></div>` : '';
    return `<article class="boss-respawn-card" data-respawn-card="${safe(boss)}" data-respawn-date="${safe(dateMarker)}"><div class="boss-respawn-card-head"><div class="boss-respawn-art event-thumb" data-boss-name="${safe(boss)}"><span>ART</span></div><div><h4>${safe(boss)}</h4><span class="type-chip ${card.type.toLowerCase().replaceAll(' ', '-')}">${safe(card.type)}</span></div></div><div class="boss-respawn-status"><span class="boss-status-label">Status</span><b data-respawn-status class="${respawnClass(card.status)}">${safe(card.status)}</b><span data-respawn-countdown>${managerCountdown(card)}</span></div>${details}${actions}</article>`;
  }).join('');
  refreshBossArtwork(container);
}
function updateBossRespawnClock() {
  const container = $('#bossRespawnCards');
  if (!container || !container.children.length) return;
  const now = new Date();
  for (const boss of BOSS_RESPAWN_BOSSES) {
    const cardElement = container.querySelector(`[data-respawn-card="${boss}"]`);
    if (!cardElement) continue;
    const row = bossRespawnRows.find((item) => item.boss === boss);
    const card = managerCardData(boss, row, now);
    const marker = card.mode === 'manual' ? (card.windowStart?.toISOString() || '') : (card.occurrence?.date || '');
    if (cardElement.dataset.respawnDate !== marker) { renderBossRespawnManager(); return; }
    const statusElement = cardElement.querySelector('[data-respawn-status]');
    const countdownElement = cardElement.querySelector('[data-respawn-countdown]');
    if (statusElement) { statusElement.textContent = card.status; statusElement.className = respawnClass(card.status); }
    if (countdownElement) countdownElement.textContent = managerCountdown(card);
  }
}
function openBossRespawnDialog(boss, action) {
  if (!isAuthenticated()) return;
  const dialog = $('#bossRespawnDialog');
  const row = bossRespawnRows.find((item) => item.boss === boss);
  const defaults = action === 'window' && row?.window_start ? localInputValues(new Date(row.window_start)) : localInputValues();
  $('#bossRespawnBoss').value = boss;
  $('#bossRespawnAction').value = action;
  $('#bossRespawnDialogTitle').textContent = action === 'kill' ? `Boss zabity: ${boss}` : `Ustaw okno z gry: ${boss}`;
  $('#bossRespawnDialogHint').textContent = action === 'kill' ? 'Podaj faktyczną datę i godzinę zabicia bossa.' : 'Podaj początek dokładnego 30-minutowego okna z gry.';
  $('#bossRespawnDate').value = defaults.date;
  $('#bossRespawnTime').value = defaults.time;
  $('#bossRespawnFeedback').textContent = '';
  dialog.showModal();
}
function siegeCountdown(card) {
  const occurrence = card.occurrence;
  if (!occurrence || card.status === 'BRAK TERMINU') return '—';
  const target = card.status === 'SIEGE ACTIVE' ? occurrence.end : occurrence.start;
  const seconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  return `${Math.floor(seconds / 86400)}d ${pad(Math.floor((seconds % 86400) / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}
function renderSiegeManager() {
  const container = $('#siegeScheduleCards');
  if (!container) return;
  const now = new Date();
  const rows = new Map(siegeScheduleRows.map((row) => [row.castle, row]));
  container.innerHTML = SIEGE_CASTLES.map((castle) => {
    const card = siegeCardData(castle, rows.get(castle), now);
    const marker = card.occurrence?.start?.toISOString() || '';
    const nextDate = card.occurrence ? managerDate(card.occurrence.start) : '—';
    const nextWindow = card.occurrence ? `${formatLocalDateTime(card.occurrence.start, { dateStyle: 'short', timeStyle: 'short' })} – ${formatLocalDateTime(card.occurrence.end, { dateStyle: 'short', timeStyle: 'short' }).split(', ').pop()}` : '—';
    const ownerClan = ownerFor(territoryOwnershipRows, 'castle', castle);
    return `<article class="siege-schedule-card" data-siege-card="${safe(castle)}" data-siege-date="${safe(marker)}"><div class="siege-card-head"><div class="event-thumb" data-boss-name="${safe(castle + ' Castle')}"><span>ART</span></div><h4>${safe(castle)} Castle</h4></div><dl><div><dt>Właściciel</dt><dd>${safe(ownerClan || 'Brak właściciela')}</dd></div><div><dt>Najbliższy termin</dt><dd>${safe(nextDate)}</dd></div><div><dt>Okno</dt><dd>${safe(nextWindow)}</dd></div></dl><div class="siege-schedule-status"><span>Status</span><b data-siege-status class="${respawnClass(card.status)}">${safe(card.status)}</b><span data-siege-countdown>${siegeCountdown(card)}</span></div><button class="primary-btn siege-set-button" type="button" data-siege-action="set" data-siege-castle="${safe(castle)}">Ustaw termin</button></article>`;
  }).join('');
  refreshBossArtwork(container);
}
function updateSiegeClock() {
  const container = $('#siegeScheduleCards');
  if (!container || !container.children.length) return;
  const now = new Date();
  for (const castle of SIEGE_CASTLES) {
    const cardElement = container.querySelector(`[data-siege-card="${castle}"]`);
    if (!cardElement) continue;
    const row = siegeScheduleRows.find((item) => item.castle === castle);
    const card = siegeCardData(castle, row, now);
    const marker = card.occurrence?.start?.toISOString() || '';
    if (cardElement.dataset.siegeDate !== marker) { renderSiegeManager(); return; }
    const statusElement = cardElement.querySelector('[data-siege-status]');
    const countdownElement = cardElement.querySelector('[data-siege-countdown]');
    if (statusElement) { statusElement.textContent = card.status; statusElement.className = respawnClass(card.status); }
    if (countdownElement) countdownElement.textContent = siegeCountdown(card);
  }
}
function openSiegeDialog(castle) {
  if (!isAuthenticated()) return;
  const row = siegeScheduleRows.find((item) => item.castle === castle);
  const date = row?.reference_date || localInputValues().date;
  const time = row?.reference_time || '18:00';
  $('#siegeScheduleCastle').value = castle;
  $('#siegeScheduleDialogTitle').textContent = `Ustaw termin Siege: ${castle}`;
  $('#siegeScheduleDialogHint').textContent = 'Podaj godzinę z zegara serwera. Na stronie zostanie pokazana godzina lokalna (+2 h). Kolejne miesiące zostaną wyliczone automatycznie.';
  $('#siegeScheduleDate').value = date;
  $('#siegeScheduleTime').value = time;
  $('#siegeScheduleFeedback').textContent = '';
  $('#siegeScheduleDialog').showModal();
}
function confirmDelete(item) {
  const dialog = $('#deleteDialog');
  $('#deleteQuestion').textContent = 'Usunąć wydarzenie „' + item.name + '” (' + item.date + ', ' + item.time + ')?';
  dialog.returnValue = 'cancel';
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'delete'), { once:true }));
}
async function load() {
  [ordinaryEvents, bossRespawnRows, siegeScheduleRows, territoryOwnershipRows] = await Promise.all([
    repository.getAll(), bossRespawnRepository.getAll(), siegeScheduleRepository.getAll(), territoryOwnershipRepository.getAll(),
  ]);
  adminEvents = ordinaryEvents;
  window.__obTerritoryOwnershipRows = territoryOwnershipRows;
  window.dispatchEvent(new CustomEvent('orzel:territory-owners-updated', { detail: territoryOwnershipRows }));
  mergePublicEvents();
  renderAll();
  renderBossRespawnManager();
  renderSiegeManager();
  renderOlympiadPanel($('#olympiadSchedule'));
  renderPvpEventPanel($('#pvpEventCards'));
  resetForm();
}

async function initializeAuth() {
  if (!supabase) {
    updateAuthUi();
    return;
  }
  const { data } = await supabase.auth.getSession();
  session = data.session;
  updateAuthUi();
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    updateAuthUi();
    if (!isAuthenticated()) closeModal('#adminModal');
  });
}

function updateClock() { const now = new Date(); const time = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now); $('#serverDate').textContent = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: '2-digit', month: 'long' }).format(now); $('#serverTime').textContent = time; $('#headerTime').textContent = time; }

async function initializeApp() {
  try {
    $('#eventType').innerHTML = TYPES.map((type) => `<option value="${type}">${type.toUpperCase()}</option>`).join('');
    $('#eventBoss').innerHTML = BOSS_NAMES.map((name) => `<option value="${name === 'Brak grafiki' ? '' : name}">${name}</option>`).join('');
    $('#recurrencePattern').innerHTML = RECURRENCE_PATTERNS.map((pattern) => `<option value="${pattern.value}">${pattern.label}</option>`).join('');
    $('#adminSort').innerHTML = ADMIN_SORTS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
    renderQuickTemplates();
    $('#quickTemplateButtons').addEventListener('click', (event) => {
      const template = event.target.closest('[data-template]');
      if (template) applyQuickTemplate(template.dataset.template);
    });
    $('#eventModeChooser').addEventListener('change', (event) => setRecurrenceMode(event.target.value));
    $('#recurrencePattern').addEventListener('change', updateRecurrencePatternUi);
    ['#eventDate', '#eventTime', '#recurrenceEndDate', '#recurrenceInterval'].forEach((selector) => {
      $(selector).addEventListener('input', updateRecurrencePreview);
      $(selector).addEventListener('change', updateRecurrencePreview);
    });
    $('#adminFilters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-admin-filter]');
      if (!button) return;
      adminFilter = button.dataset.adminFilter;
      renderAdmin();
    });
    $('#adminSort').addEventListener('change', (event) => {
      adminSort = event.target.value;
      renderAdmin();
    });
    $('#adminSearch').addEventListener('input', (event) => {
      adminSearch = event.target.value;
      renderAdmin();
    });
    $('#eventBoss').addEventListener('change', applyBossDefaults);
    $('#eventType').addEventListener('change', updateDurationDefault);
    $('#eventLocation').addEventListener('input', () => {
      if (formMode === 'new') automaticLocation = false;
    });
    $('#eventDuration').addEventListener('input', () => {
      if (formMode === 'new') automaticDuration = false;
    });
    $('#filters')?.addEventListener('click', (event) => { if (!event.target.dataset.filter) return; filter = event.target.dataset.filter; renderFilters(); renderCalendar(); });
    $('#calendarWeek').addEventListener('click', (event) => {
      const button = event.target.closest('[data-calendar-day]');
      if (!button) return;
      selectedDay = new Date(button.dataset.calendarDay + 'T12:00:00');
      renderCalendar();
    });
    $('#previousDay').addEventListener('click', () => { selectedDay.setDate(selectedDay.getDate() - 1); renderCalendar(); });
    $('#nextDay').addEventListener('click', () => { selectedDay.setDate(selectedDay.getDate() + 1); renderCalendar(); });
    $('#todayButton').addEventListener('click', () => { selectedDay = new Date(); renderCalendar(); });
    $('#adminTrigger').addEventListener('click', openAdmin);
    $('#adminAdd').addEventListener('click', openNewEvent);
    $('#quickAdd')?.addEventListener('click', openNewEvent);
    $('#adminLogout').addEventListener('click', async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) setAdminFeedback(`Nie udało się wylogować: ${error.message}`, true);
      else closeModal('#adminModal');
    });
    $('#bossRespawnForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isAuthenticated()) {
        $('#bossRespawnFeedback').textContent = 'Sesja administratora wygasła. Zaloguj się ponownie.';
        return;
      }
      const submit = $('#bossRespawnSubmit');
      submit.disabled = true;
      $('#bossRespawnFeedback').textContent = '';
      const boss = $('#bossRespawnBoss').value;
      const action = $('#bossRespawnAction').value;
      try {
        if (action === 'kill') await bossRespawnRepository.saveKill(boss, $('#bossRespawnDate').value, $('#bossRespawnTime').value);
        else await bossRespawnRepository.saveWindow(boss, $('#bossRespawnDate').value, $('#bossRespawnTime').value);
        await load();
        $('#bossRespawnDialog').close();
        setAdminFeedback(action === 'kill' ? `Zapisano zabicie bossa: ${boss}.` : `Zapisano okno z gry: ${boss}.`);
      } catch (error) {
        $('#bossRespawnFeedback').textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
    $('#bossRespawnCancel').addEventListener('click', () => $('#bossRespawnDialog').close());
    $('#siegeScheduleForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!isAuthenticated()) {
        $('#siegeScheduleFeedback').textContent = 'Sesja administratora wygasła. Zaloguj się ponownie.';
        return;
      }
      const submit = $('#siegeScheduleSubmit');
      submit.disabled = true;
      $('#siegeScheduleFeedback').textContent = '';
      const castle = $('#siegeScheduleCastle').value;
      try {
        await siegeScheduleRepository.saveReference(castle, $('#siegeScheduleDate').value, $('#siegeScheduleTime').value);
        await load();
        $('#siegeScheduleDialog').close();
        setAdminFeedback(`Zapisano termin Siege: ${castle}.`);
      } catch (error) {
        $('#siegeScheduleFeedback').textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
    $('#siegeScheduleCancel').addEventListener('click', () => $('#siegeScheduleDialog').close());
    $('#loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!supabase) {
        $('#loginFeedback').textContent = 'Supabase nie jest skonfigurowany.';
        return;
      }
      const submit = $('#loginSubmit');
      submit.disabled = true;
      $('#loginFeedback').textContent = '';
      const { data, error } = await supabase.auth.signInWithPassword({
        email: $('#loginEmail').value.trim(),
        password: $('#loginPassword').value,
      });
      submit.disabled = false;
      if (error || !data.session) {
        $('#loginFeedback').textContent = error?.message || 'Logowanie nie zwróciło aktywnej sesji.';
        return;
      }
      session = data.session;
      updateAuthUi();
      const nextAction = pendingAdminAction;
      pendingAdminAction = null;
      closeModal('#loginModal');
      if (nextAction === 'new') openNewEvent(); else openAdmin();
    });
    document.addEventListener('click', async (event) => {
      if (event.target.matches('[data-close-modal]')) {
        const modal = event.target.closest('.modal');
        if (modal) closeModal(`#${modal.id}`);
      }
      const siegeAction = event.target.closest('[data-siege-action]');
      if (siegeAction) openSiegeDialog(siegeAction.dataset.siegeCastle);
      const respawnAction = event.target.closest('[data-respawn-action]');
      if (respawnAction) openBossRespawnDialog(respawnAction.dataset.respawnBoss, respawnAction.dataset.respawnAction);
      if (event.target.dataset.edit) openEdit(event.target.dataset.edit);
      if (event.target.dataset.delete) {
        const item = adminEvents.find((candidate) => candidate.id === event.target.dataset.delete);
        if (!item || !await confirmDelete(item)) return;
        try {
          await repository.remove(item.id);
          await load();
          setAdminFeedback('Wydarzenie usunięte w Supabase.');
        } catch (error) {
          setAdminFeedback(error.message, true);
        }
      }
    });
    $('#cancelEdit').addEventListener('click', () => { resetForm(); showAdminView(); $('#adminAdd').focus(); });
    $('#eventForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validateEventForm()) return;
      const rawId = $('#eventId').value.trim();
      try {
        let createdCount = 0;
        let skippedCount = 0;
        let firstCreated = null;
        if (rawId) {
          const item = { ...formEvent(), id: rawId };
          await repository.save(item);
          createdCount = 1;
          firstCreated = item;
        } else {
          const candidates = eventCandidates();
          const { fresh } = await splitDuplicates(candidates);
          skippedCount = candidates.length - fresh.length;
          if (!fresh.length) {
            setAdminFeedback(`Pominięto ${skippedCount} duplikat${skippedCount === 1 ? '' : 'y'}. Wydarzenia już istnieją.`, true);
            return;
          }
          if (recurrenceMode === 'recurring' && !window.confirm(`Zostanie utworzonych ${fresh.length} wydarzeń. Czy kontynuować?`)) return;
          for (const candidate of fresh) {
            await repository.save(candidate);
            createdCount += 1;
            firstCreated ||= candidate;
          }
        }
        selectedDay = new Date(`${firstCreated.date}T00:00:00`);
        filter = 'Wszystkie';
        await load();
        renderAll();
        resetForm();
        showAdminView();
        $('#adminAdd').focus();
        if (rawId) {
          setAdminFeedback('Wydarzenie zapisane. Zmiany są już widoczne na stronie.');
        } else if (createdCount === 1 && skippedCount === 0) {
          setAdminFeedback('Wydarzenie zapisane. Zmiany są już widoczne na stronie.');
        } else {
          setAdminFeedback(`Utworzono ${createdCount} wydarzeń.${skippedCount ? ` Pominięto ${skippedCount} duplikat${skippedCount === 1 ? '' : 'y'}.` : ''}`);
        }
      } catch (error) {
        setAdminFeedback(error.message, true);
      }
    });
    document.querySelectorAll('.boss-card').forEach((card) => {
      applyBossArtwork(card, card.querySelector('span').firstChild.textContent);
    });
    await initializeAuth();
    await load();
    updateClock();
    updateCountdown();
    const tick = () => { updateClock(); refreshDynamicEvents(); refreshCalendarClock(); renderNext(); updateCountdown(); updateBossRespawnClock(); updateSiegeClock(); renderOlympiadPanel($('#olympiadSchedule')); renderPvpEventPanel($('#pvpEventCards')); renderPvpSidebar($('#pvpSidebarEvents')); updatePvpRowCountdowns($('#dailyEvents')); };
    let clockTimer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => {
      window.clearInterval(clockTimer);
      clockTimer = 0;
      if (!document.hidden) {
        tick();
        clockTimer = window.setInterval(tick, 1000);
      }
    });
    console.log('APP INITIALIZED', { eventCount: events.length });
  } catch (error) {
    console.error('APP INITIALIZATION FAILED', error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
else initializeApp();

if (typeof window !== 'undefined') window.addEventListener('orzel:featured-event-return', () => { featuredRenderSignature = null; renderNext(); updateCountdown(); });

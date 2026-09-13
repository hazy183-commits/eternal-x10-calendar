console.log('APP STARTED');
const LocalEventRepository = window.LocalEventRepository;
if (!LocalEventRepository) throw new Error('Event repository did not load.');

const TYPES = ['RB', 'Epic RB', 'Siege', 'Olympiad', 'Event'];
const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromEvent = (event) => new Date(`${event.date}T${event.time}:00`);
const today = new Date(); today.setHours(0, 0, 0, 0);
const makeSeed = (id, time, name, type, description, location, duration = 60) => ({ id, date: dateKey(today), time, name, type, description, location, duration });
const newEventId = () => globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const seedEvents = [
  makeSeed('demo-queen-ant', '14:00', 'Queen Ant', 'RB', 'Demonstracyjny rajd klanowy — zbiórka 15 minut przed startem.', 'Queen Ant Nest', 50),
  makeSeed('demo-core', '16:00', 'Core', 'RB', 'Wydarzenie demonstracyjne dla członków klanu.', 'Core Chamber', 45),
  makeSeed('demo-orfen', '18:00', 'Orfen', 'RB', 'Wspólny atak na bossa świata.', 'Sea of Spores', 75),
  makeSeed('demo-baium', '20:00', 'Baium', 'Epic RB', 'Przygotuj teleport i materiały.', 'Baium’s Tower', 90),
  makeSeed('demo-frintezza', '22:00', 'Frintezza', 'Epic RB', 'Rajd demonstracyjny, grupy ustalane na miejscu.', 'Frintezza’s Hall', 100),
  makeSeed('demo-antharas', '23:30', 'Antharas', 'Epic RB', 'Największy rajd demonstracyjny dnia.', 'Antharas’ Lair', 120),
];
const repository = new LocalEventRepository(seedEvents);
let events = [];
let selectedDay = new Date(today);
let filter = 'Wszystkie';

function formatDate(date, options = { weekday: 'long', day: 'numeric', month: 'long' }) { return new Intl.DateTimeFormat('pl-PL', options).format(date); }
function sorted(list) { return [...list].sort((a, b) => dateFromEvent(a) - dateFromEvent(b)); }
function safe(text = '') { return text.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function status(event, now = new Date()) { const start = dateFromEvent(event); const end = new Date(start.getTime() + (event.duration || 60) * 60000); const diff = start - now; if (now >= end) return 'ZAKOŃCZONE'; if (now >= start) return 'TRWA'; if (diff <= 15 * 60000) return 'ZA CHWILĘ'; return 'NADCHODZI'; }
function eventDetails(event) { return [event.location ? `⌖ ${safe(event.location)}` : '', event.duration ? `◷ ${event.duration} min` : ''].filter(Boolean).join('  ·  '); }
function getUpcoming() { return sorted(events.filter((event) => dateFromEvent(event).getTime() + (event.duration || 60) * 60000 > Date.now())); }

function renderFilters() { $('#filters').innerHTML = ['Wszystkie', ...TYPES].map((item) => `<button class="filter-btn ${filter === item ? 'active' : ''}" data-filter="${item}">${item}</button>`).join(''); }
function rowCountdown(event) { const seconds = Math.max(0, Math.floor((dateFromEvent(event) - Date.now()) / 1000)); if (status(event) === 'TRWA') return 'Trwa teraz'; if (status(event) === 'ZAKOŃCZONE') return 'Zakończone'; return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`; }
function eventRow(event) { const eventStatus = status(event); return `<article class="event-row"><time class="event-time">${event.time}</time><div class="event-thumb"><span>ART</span></div><div class="event-info"><h3>${safe(event.name)}</h3></div><span class="type-chip ${event.type.toLowerCase().replaceAll(' ', '-')}">${event.type}</span><p class="event-location">${event.location ? `⌖ ${safe(event.location)}` : 'Wydarzenie klanowe'}</p><div class="row-status"><b class="status-dot ${eventStatus.toLowerCase().replaceAll(' ', '-')}">${eventStatus}</b><span>${rowCountdown(event)}</span></div></article>`; }
function renderCalendar() { const list = sorted(events.filter((event) => event.date === dateKey(selectedDay) && (filter === 'Wszystkie' || event.type === filter))); $('#selectedDate').textContent = formatDate(selectedDay); const heading = '<div class="event-table-head"><span>Godzina</span><span>Wydarzenie</span><span>Typ · Lokalizacja</span><span>Status</span></div>'; $('#dailyEvents').innerHTML = heading + (list.length ? list.map(eventRow).join('') : `<div class="empty-state"><span>✦</span><p>Brak wydarzeń w tej kategorii.</p></div>`); }
function miniRow(event) { return `<div class="mini-event"><time>${event.date === dateKey(today) ? event.time : formatDate(dateFromEvent(event), { day: '2-digit', month: 'short' })}</time><div><b>${safe(event.name)}</b><span>${event.type}${event.location ? ` · ${safe(event.location)}` : ''}</span></div></div>`; }
function renderOverview() { const todays = sorted(events.filter((event) => event.date === dateKey(today))); $('#todayCount').textContent = todays.length; $('#todayEvents').innerHTML = todays.length ? todays.map(miniRow).join('') : '<p class="empty-mini">Dziś nie zaplanowano wydarzeń.</p>'; const upcoming = getUpcoming().slice(0, 5); $('#upcomingEvents').innerHTML = upcoming.length ? upcoming.map(miniRow).join('') : '<p class="empty-mini">Brak nadchodzących wydarzeń.</p>'; }
function renderNext() { const event = getUpcoming()[0]; if (!event) { $('#nextName').textContent = 'BRAK NADCHODZĄCYCH WYDARZEŃ'; $('#nextType').textContent = 'KALENDARZ KLANU'; $('#nextType').className = 'type-chip'; $('#nextMeta').textContent = 'Dodaj nowe wydarzenie w panelu administratora.'; $('#nextDescription').textContent = 'Gdy wydarzenie zostanie zaplanowane, pojawi się tutaj z pełnym odliczaniem.'; $('#nextStatus').textContent = 'OCZEKUJE'; $('#nextStatus').className = 'live-status zakończone'; return; } $('#nextName').textContent = event.name; $('#nextType').textContent = event.type; $('#nextType').className = `type-chip ${event.type.toLowerCase().replaceAll(' ', '-')}`; $('#nextMeta').textContent = `${formatDate(dateFromEvent(event), { weekday: 'long', day: 'numeric', month: 'long' })} · ${event.time}${event.location ? ` · ${event.location}` : ''}`; $('#nextDescription').textContent = event.description || ''; $('#nextStatus').textContent = status(event); $('#nextStatus').className = `live-status ${status(event).toLowerCase().replaceAll(' ', '-')}`; }
function updateCountdown() { const event = getUpcoming()[0]; if (!event) { $('#countdown').innerHTML = '<b>00</b><i>:</i><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b>'; return; } let seconds = Math.max(0, Math.floor((dateFromEvent(event) - Date.now()) / 1000)); const values = [Math.floor(seconds / 86400), Math.floor((seconds %= 86400) / 3600), Math.floor((seconds %= 3600) / 60), seconds % 60]; $('#countdown').innerHTML = values.map((value, index) => `<b>${pad(value)}</b>${index < 3 ? '<i>:</i>' : ''}`).join(''); $('#nextStatus').textContent = status(event); }
function renderAdmin() { const all = sorted(events); $('#adminCount').textContent = all.length; $('#adminEventList').innerHTML = all.map((event) => `<div class="admin-event"><div><b>${safe(event.name)}</b><span>${event.date} · ${event.time} · ${event.type}</span></div><div><button class="edit-btn" data-edit="${event.id}">Edytuj</button><button class="delete-btn" data-delete="${event.id}">Usuń</button></div></div>`).join('') || '<p class="empty-mini">Brak wydarzeń.</p>'; }
function renderAll() { renderFilters(); renderCalendar(); renderOverview(); renderNext(); renderAdmin(); }
function resetForm() { $('#eventForm').reset(); $('#eventId').value = ''; $('#eventDate').value = dateKey(selectedDay); $('#eventTime').value = '20:00'; $('.primary-btn').textContent = 'Zapisz wydarzenie'; }
function openEdit(id) { const event = events.find((item) => item.id === id); if (!event) return; $('#eventId').value = event.id; $('#eventName').value = event.name; $('#eventType').value = event.type; $('#eventDate').value = event.date; $('#eventTime').value = event.time; $('#eventDuration').value = event.duration || ''; $('#eventLocation').value = event.location || ''; $('#eventDescription').value = event.description || ''; $('.primary-btn').textContent = 'Zapisz zmiany'; $('#adminModal').classList.add('open'); $('#adminModal').setAttribute('aria-hidden', 'false'); }
async function load() { events = await repository.getAll(); renderAll(); resetForm(); }

function updateClock() { const now = new Date(); const time = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now); $('#serverDate').textContent = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: '2-digit', month: 'long' }).format(now); $('#serverTime').textContent = time; $('#headerTime').textContent = time; }

async function initializeApp() {
  try {
    $('#eventType').innerHTML = TYPES.map((type) => `<option>${type}</option>`).join('');
    $('#filters').addEventListener('click', (event) => { if (!event.target.dataset.filter) return; filter = event.target.dataset.filter; renderFilters(); renderCalendar(); });
    $('#previousDay').addEventListener('click', () => { selectedDay.setDate(selectedDay.getDate() - 1); renderCalendar(); });
    $('#nextDay').addEventListener('click', () => { selectedDay.setDate(selectedDay.getDate() + 1); renderCalendar(); });
    $('#todayButton').addEventListener('click', () => { selectedDay = new Date(today); renderCalendar(); });
    $('#adminTrigger').addEventListener('click', () => { $('#adminModal').classList.add('open'); $('#adminModal').setAttribute('aria-hidden', 'false'); });
    $('#quickAdd').addEventListener('click', () => { resetForm(); $('#adminModal').classList.add('open'); $('#adminModal').setAttribute('aria-hidden', 'false'); });
    document.addEventListener('click', (event) => { if (event.target.matches('[data-close-modal]')) { $('#adminModal').classList.remove('open'); $('#adminModal').setAttribute('aria-hidden', 'true'); } if (event.target.dataset.edit) openEdit(event.target.dataset.edit); if (event.target.dataset.delete) { events = events.filter((item) => item.id !== event.target.dataset.delete); repository.remove(event.target.dataset.delete).then(renderAll); } });
    $('#cancelEdit').addEventListener('click', resetForm);
    $('#restoreDemo').addEventListener('click', async () => { events = await repository.restoreDemo(); selectedDay = new Date(today); renderAll(); resetForm(); });
    $('#eventForm').addEventListener('submit', async (event) => { event.preventDefault(); const id = $('#eventId').value || newEventId(); const item = { id, name: $('#eventName').value.trim(), type: $('#eventType').value, date: $('#eventDate').value, time: $('#eventTime').value, duration: Number($('#eventDuration').value) || null, location: $('#eventLocation').value.trim(), description: $('#eventDescription').value.trim() }; await repository.save(item); events = await repository.getAll(); selectedDay = new Date(`${item.date}T00:00:00`); renderAll(); resetForm(); });
    await load();
    updateClock();
    updateCountdown();
    setInterval(() => { updateClock(); updateCountdown(); }, 1000);
    console.log('APP INITIALIZED', { eventCount: events.length });
  } catch (error) {
    console.error('APP INITIALIZATION FAILED', error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
else initializeApp();

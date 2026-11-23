export const PVP_TIME_ZONE = 'Europe/Warsaw';
export const PVP_SERVER_TIME_ZONE = 'UTC';
export const PVP_INTERVAL_HOURS = 2;
export const PVP_REWARD = '5 Medal (Event)';
export const PVP_EVENTS = [
  { id: 'multi-team-battle', name: 'Multi Team Battle', command: '.mtreg' },
  { id: 'capture-the-base', name: 'Capture The Base', command: '.ctbreg' },
  { id: 'epic-boss-challenge', name: 'Epic Boss Challenge', command: '.bossreg' },
  { id: 'korean-tvt', name: 'Korean TvT', command: '.kreg' },
  { id: 'death-match', name: 'Death Match', command: '.dmreg' },
  { id: 'capture-the-flag', name: 'Capture the Flag', command: '.ctfreg' },
];

const pad = (value) => String(value).padStart(2, '0');
const utcHours = Array.from({ length: 24 / PVP_INTERVAL_HOURS }, (_, index) => index * PVP_INTERVAL_HOURS);
const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PVP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  timeZone: PVP_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

function localParts(instant) {
  return Object.fromEntries(partsFormatter.formatToParts(instant)
    .filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
}

export function pvpLocalDate(instant = new Date()) {
  const { year, month, day } = localParts(instant);
  return `${year}-${month}-${day}`;
}

function shiftDate(date, offset = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return null;
  const day = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

function localTime(instant) {
  const { hour, minute } = localParts(instant);
  return `${hour}:${minute}`;
}

function utcTime(instant) {
  return `${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())}`;
}

export function pvpTiming(event) {
  const slotStart = new Date(event.startAt);
  return { slotStart, registrationStart: slotStart, eventStart: slotStart, end: slotStart };
}

export function isPvpUpcoming(event, now = new Date()) {
  return pvpTiming(event).slotStart > now;
}

export function pvpEventStatus(event, now = new Date()) {
  return isPvpUpcoming(event, now) ? 'NADCHODZI' : 'SLOT MINĄŁ';
}

export function formatPvpDate(event) {
  return dateFormatter.format(new Date(event.startAt));
}

export function pvpCountdownText(event, now = new Date()) {
  const seconds = Math.max(0, Math.ceil((pvpTiming(event).slotStart - now) / 1000));
  if (!seconds) return 'Startuje teraz';
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
}

function slotForUtcHour(date, hour, now) {
  const time = `${pad(hour)}:00`;
  const start = new Date(`${date}T${time}:00Z`);
  return {
    id: `pvp-random-${date}-${pad(hour)}`,
    pvpId: 'random-pvp-event',
    name: 'Auto PvP · losowany tryb',
    type: 'Event',
    boss: '',
    location: '',
    date: pvpLocalDate(start),
    time: localTime(start),
    startAt: start.toISOString(),
    utcTime: time,
    utcDate: date,
    eventStartAt: start.toISOString(),
    endAt: start.toISOString(),
    registrationTimeRange: `${localTime(start)} · losowanie serwera`,
    eventTimeRange: 'Rodzaj wybierany losowo',
    duration: 0,
    command: '',
    reward: PVP_REWARD,
    description: 'Co 2 godziny rozpoczyna się slot Auto PvP. Serwer losuje tryb z dostępnej puli.',
    isPvpSchedule: true,
    pvpStatus: pvpEventStatus({ startAt: start.toISOString() }, now),
  };
}

export function pvpEventsForUtcDate(date, now = new Date()) {
  if (!shiftDate(date)) return [];
  return utcHours.map((hour) => slotForUtcHour(date, hour, now));
}

export function pvpEventsForLocalDate(date, now = new Date()) {
  if (!shiftDate(date)) return [];
  // Warsaw's local day also includes UTC slots from the preceding date.
  return [shiftDate(date, -1), date].flatMap((utcDate) => pvpEventsForUtcDate(utcDate, now))
    .filter((event) => event.date === date)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

export function nextPvpEvent(_id = null, now = new Date()) {
  return nextPvpEvents(1, now)[0] ?? null;
}

export function nextPvpEvents(limit = 3, now = new Date()) {
  const today = pvpLocalDate(now);
  const days = [today, shiftDate(today, 1), shiftDate(today, 2)].filter(Boolean);
  return days.flatMap((date) => pvpEventsForLocalDate(date, now))
    .filter((event) => isPvpUpcoming(event, now))
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, Math.max(0, Number(limit) || 0));
}

function normalizedName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function identity(event) {
  return `${normalizedName(event.name)}\u0000${event.date}\u0000${String(event.time ?? '').slice(0, 5)}`;
}

// Generate only today, tomorrow and the requested calendar day, in memory.
// Automatic events stay out of ordinary calendar rows; only their time slots are generated.
export function withPvpEvents(events, now = new Date(), calendarDate = null) {
  const today = pvpLocalDate(now);
  const dates = new Set([today, shiftDate(today, 1), calendarDate].filter(Boolean));
  const schedule = [...dates].flatMap((date) => pvpEventsForLocalDate(date, now));
  const scheduleIdentities = new Set(schedule.map(identity));
  const scheduleSlots = new Set(schedule.map((event) => `${event.date}\u0000${event.time}`));
  const pvpNames = new Set(PVP_EVENTS.map((event) => normalizedName(event.name)));
  return [
    ...events.filter((event) => !event.isPvpSchedule
      && !scheduleIdentities.has(identity(event))
      && !(pvpNames.has(normalizedName(event.name)) && scheduleSlots.has(`${event.date}\u0000${String(event.time ?? '').slice(0, 5)}`))),
    ...schedule,
  ];
}

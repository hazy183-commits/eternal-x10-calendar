// Official UTC hours start registration; the event starts 5 minutes later.
export const PVP_TIME_ZONE = 'Europe/Warsaw';
export const PVP_REWARD = '5 Medal (Event)';
export const PVP_REGISTRATION_MINUTES = 5;
export const PVP_EVENT_MINUTES = 10;
export const PVP_EVENTS = [
  { id: 'multi-team-battle', name: 'Multi Team Battle', utcHours: [2, 10, 18], command: '.mtreg' },
  { id: 'capture-the-base', name: 'Capture The Base', utcHours: [4, 12, 20], command: '.ctbreg' },
  { id: 'epic-boss-challenge', name: 'Epic Boss Challenge', utcHours: [0, 8, 16], command: '.bossreg' },
  { id: 'death-match', name: 'Death Match', utcHours: [6, 14, 22], command: '.dmreg' },
];
const pad = (value) => String(value).padStart(2, '0');
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

// startAt remains the base calendar time (registration), preserving identities
// and deduplication with manual records at the official hour.
export function pvpTiming(event) {
  const registrationStart = new Date(event.startAt);
  const eventStart = new Date(registrationStart.getTime() + PVP_REGISTRATION_MINUTES * 60000);
  const end = new Date(eventStart.getTime() + PVP_EVENT_MINUTES * 60000);
  return { registrationStart, eventStart, end };
}

export function isPvpUpcoming(event, now = new Date()) {
  return now < pvpTiming(event).end;
}

export function pvpEventStatus(event, now = new Date()) {
  const { registrationStart, eventStart, end } = pvpTiming(event);
  if (now < registrationStart) return 'NADCHODZI';
  if (now < eventStart) return 'REJESTRACJA OTWARTA';
  if (now < end) return 'EVENT ACTIVE';
  return 'ZAKOŃCZONE';
}

export function formatPvpDate(event) {
  return dateFormatter.format(new Date(event.startAt));
}

export function pvpCountdownText(event, now = new Date()) {
  const status = pvpEventStatus(event, now);
  if (status === 'ZAKOŃCZONE') return 'Zakończone';
  const { registrationStart, eventStart, end } = pvpTiming(event);
  const target = status === 'NADCHODZI' ? registrationStart : status === 'REJESTRACJA OTWARTA' ? eventStart : end;
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  const minutesSeconds = `${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
  if (status === 'REJESTRACJA OTWARTA') return `Start eventu za ${minutesSeconds}`;
  if (status === 'EVENT ACTIVE') return `Koniec za ${minutesSeconds}`;
  return `Rejestracja za ${pad(Math.floor(seconds / 3600))}:${minutesSeconds}`;
}

function localTime(instant) {
  const { hour, minute } = localParts(instant);
  return `${hour}:${minute}`;
}

export function pvpEventsForUtcDate(date, now = new Date()) {
  if (!shiftDate(date)) return [];
  return PVP_EVENTS.flatMap((definition) => definition.utcHours.map((hour) => {
    const utcTime = `${pad(hour)}:00`;
    const start = new Date(`${date}T${utcTime}:00Z`);
    const { eventStart, end } = pvpTiming({ startAt: start });
    const event = {
      id: `pvp-${definition.id}-${date}-${pad(hour)}`,
      pvpId: definition.id, name: definition.name, type: 'Event', boss: '', location: '',
      date: pvpLocalDate(start), time: localTime(start),
      startAt: start.toISOString(), utcTime, utcDate: date,
      eventStartAt: eventStart.toISOString(), endAt: end.toISOString(),
      registrationTimeRange: `${localTime(start)}–${localTime(eventStart)}`,
      eventTimeRange: `${localTime(eventStart)}–${localTime(end)}`,
      duration: PVP_EVENT_MINUTES,
      command: definition.command, reward: PVP_REWARD,
      description: `Rejestracja: ${definition.command} · Nagroda: ${PVP_REWARD}. Zapisy od ${utcTime} UTC przez ${PVP_REGISTRATION_MINUTES} min, następnie ${PVP_EVENT_MINUTES} min wydarzenia.`,
      isPvpSchedule: true,
    };
    return { ...event, pvpStatus: pvpEventStatus(event, now) };
  })).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

export function pvpEventsForLocalDate(date, now = new Date()) {
  if (!shiftDate(date)) return [];
  // Warsaw is ahead of UTC: the local day also includes the preceding UTC day.
  return [shiftDate(date, -1), date].flatMap((utcDate) => pvpEventsForUtcDate(utcDate, now))
    .filter((event) => event.date === date);
}

export function nextPvpEvent(id, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return [date, shiftDate(date, 1)].flatMap((day) => pvpEventsForUtcDate(day, now))
    .find((event) => event.pvpId === id && isPvpUpcoming(event, now)) ?? null;
}

function identity(event) {
  const name = String(event.name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  return `${name}\u0000${event.date}\u0000${String(event.time ?? '').slice(0, 5)}`;
}

// Generate only today, tomorrow and the requested calendar day, in memory.
// Manual duplicates are hidden in the public view; stored records stay intact.
export function withPvpEvents(events, now = new Date(), calendarDate = null) {
  const today = pvpLocalDate(now);
  const dates = new Set([today, shiftDate(today, 1), calendarDate].filter(Boolean));
  const schedule = new Map([...dates].flatMap((date) => pvpEventsForLocalDate(date, now))
    .map((event) => [identity(event), event]));
  return [
    ...events.filter((event) => !event.isPvpSchedule && !schedule.has(identity(event))),
    ...schedule.values(),
  ];
}

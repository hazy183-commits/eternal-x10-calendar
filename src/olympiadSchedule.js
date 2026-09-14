// Server schedule is UTC. Presentation uses Warsaw's IANA zone (including DST).
export const OLYMPIAD_TIME_ZONE = 'Europe/Warsaw';
export const OLYMPIAD_SERVER_HOURS = 'Server time: 20:30–21:30 UTC';

const localPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OLYMPIAD_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  timeZone: OLYMPIAD_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

function localParts(instant) {
  return Object.fromEntries(localPartsFormatter.formatToParts(instant)
    .filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
}

export function olympiadLocalDate(now = new Date()) {
  const { year, month, day } = localParts(now);
  return `${year}-${month}-${day}`;
}

export function olympiadStatus(event, now = new Date()) {
  if (now < new Date(event.startAt)) return 'NADCHODZI';
  if (now < new Date(event.endAt)) return 'OLYMPIAD ACTIVE';
  return 'ZAKOŃCZONE';
}

export function olympiadCountdownTarget(event, now = new Date()) {
  return new Date(olympiadStatus(event, now) === 'OLYMPIAD ACTIVE' ? event.endAt : event.startAt);
}

export function formatOlympiadDate(event) {
  return dateFormatter.format(new Date(event.startAt));
}

// The evening UTC session falls on the same calendar date in Europe/Warsaw.
export function olympiadForDate(date, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return null;
  const start = new Date(`${date}T20:30:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== date) return null;
  if (start.getUTCDay() === 0 || start.getUTCDay() === 6) return null;
  const end = new Date(`${date}T21:30:00.000Z`);
  const localStart = localParts(start);
  const localEnd = localParts(end);
  const event = {
    id: `olympiad-${date}`,
    name: 'OLYMPIAD', type: 'Olympiad', boss: '',
    date: olympiadLocalDate(start), time: `${localStart.hour}:${localStart.minute}`,
    timeRange: `${localStart.hour}:${localStart.minute}–${localEnd.hour}:${localEnd.minute}`,
    duration: (end - start) / 60000,
    location: '',
    description: `Poniedziałek–piątek. ${OLYMPIAD_SERVER_HOURS}. Cykl tygodniowy.`,
    startAt: start.toISOString(), endAt: end.toISOString(),
    isOlympiadSchedule: true,
  };
  return { ...event, olympiadStatus: olympiadStatus(event, now) };
}

export function nextOlympiadEvent(now = new Date()) {
  const day = new Date(now);
  for (let offset = 0; offset < 8; offset += 1) {
    const event = olympiadForDate(day.toISOString().slice(0, 10), now);
    if (event && new Date(event.endAt) > now) return event;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return null;
}

function isManualOlympiad(event) {
  return String(event.type ?? '').trim().toLowerCase() === 'olympiad'
    || /\bolympiad(?:a)?\b/i.test(String(event.name ?? ''));
}

function dateTimeKey(event) {
  return `${event.date}\u0000${String(event.time ?? '').slice(0, 5)}`;
}

// Keep today's session, the next session and (on demand) the calendar's selected day.
// This generates at most three records in memory, with no database access.
export function withOlympiadEvents(events, now = new Date(), calendarDate = null) {
  const schedule = new Map();
  for (const event of [olympiadForDate(olympiadLocalDate(now), now), nextOlympiadEvent(now),
    calendarDate ? olympiadForDate(calendarDate, now) : null]) {
    if (event) schedule.set(dateTimeKey(event), event);
  }
  return [
    ...events.filter((event) => !event.isOlympiadSchedule
      && !(isManualOlympiad(event) && schedule.has(dateTimeKey(event)))),
    ...schedule.values(),
  ];
}

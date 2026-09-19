import { TIME_ZONE, localDateTimeToDate } from './bossRespawns.js';

export const SIEGE_DURATION_MINUTES = 120;
// Siege times are entered in the UTC game server clock; Poland is +2 hours in summer and +1 hour in winter.
export const SIEGE_SERVER_TIME_ZONE = 'UTC';
export const SIEGE_CASTLES = Object.freeze([
  'Gludio', 'Dion', 'Giran', 'Oren', 'Aden', 'Innadril', 'Goddard', 'Rune', 'Schuttgart',
]);

// These are the current known reference points supplied for the server. They are used
// as a read-only fallback until the optional siege_schedule table is populated.
export const SIEGE_REFERENCE_DEFAULTS = Object.freeze([
  Object.freeze({ castle: 'Gludio', reference_date: '2026-10-04', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
  Object.freeze({ castle: 'Giran', reference_date: '2026-09-20', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
  Object.freeze({ castle: 'Aden', reference_date: '2026-09-27', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
  Object.freeze({ castle: 'Innadril', reference_date: '2026-09-20', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
  Object.freeze({ castle: 'Rune', reference_date: '2026-10-04', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
  Object.freeze({ castle: 'Schuttgart', reference_date: '2026-09-20', reference_time: '18:00', duration_minutes: SIEGE_DURATION_MINUTES }),
]);

const pad = (value) => String(value).padStart(2, '0');
const normalized = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : null;
}

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}

function serverDateTimeToLocal(dateKey, time) {
  const date = parseDateKey(dateKey);
  const match = /^(\d{2}):(\d{2})$/.exec(String(time ?? ''));
  if (!date || !match) return null;

  // The game server clock is UTC. Intl applies Europe/Warsaw DST automatically:
  // +2 hours in summer and +1 hour in winter.
  const instant = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    Number(match[1]),
    Number(match[2]),
  ));
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function addMonthsClamped(dateKey, months) {
  const date = parseDateKey(dateKey);
  if (!date || !Number.isInteger(months)) return '';
  const sourceDay = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
  const day = Math.min(sourceDay, daysInMonth(target.getUTCFullYear(), target.getUTCMonth()));
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(day)}`;
}

function normalizeTime(value) {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.exec(String(value ?? ''));
  return match ? String(value).slice(0, 5) : null;
}

export function normalizeSiegeRow(row) {
  const referenceTime = normalizeTime(row?.reference_time);
  if (!row || !SIEGE_CASTLES.includes(row.castle) || !parseDateKey(row.reference_date) || !referenceTime) return null;
  const duration = Number(row.duration_minutes);
  return {
    id: row.id ?? null,
    castle: row.castle,
    reference_date: row.reference_date,
    reference_time: referenceTime,
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : SIEGE_DURATION_MINUTES,
    updated_at: row.updated_at || null,
  };
}

function localDateKey(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function monthDistance(fromDate, toDate) {
  return (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12 + toDate.getUTCMonth() - fromDate.getUTCMonth();
}

export function nextMonthlyOccurrence(row, now = new Date()) {
  const normalizedRow = normalizeSiegeRow(row);
  if (!normalizedRow) return null;
  const referenceDate = parseDateKey(normalizedRow.reference_date);
  const currentDate = parseDateKey(localDateKey(now));
  if (!referenceDate || !currentDate) return null;
  const firstMonth = Math.max(0, monthDistance(referenceDate, currentDate));
  for (let offset = firstMonth; offset < firstMonth + 2400; offset += 1) {
    const date = addMonthsClamped(normalizedRow.reference_date, offset);
    const localReference = serverDateTimeToLocal(date, normalizedRow.reference_time);
    const start = localReference ? localDateTimeToDate(localReference.date, localReference.time) : null;
    if (!start) continue;
    const end = new Date(start.getTime() + normalizedRow.duration_minutes * 60000);
    if (end > now) return { date: localReference.date, time: localReference.time, serverDate: date, serverTime: normalizedRow.reference_time, start, end, duration: normalizedRow.duration_minutes };
  }
  return null;
}

export function siegeStatus(occurrence, now = new Date()) {
  if (!occurrence) return 'BRAK TERMINU';
  if (now < occurrence.start) return 'NADCHODZI';
  if (now < occurrence.end) return 'SIEGE ACTIVE';
  return 'ZAKOŃCZONE';
}

export function siegeCardData(castle, row, now = new Date()) {
  const normalizedRow = normalizeSiegeRow(row);
  const occurrence = nextMonthlyOccurrence(normalizedRow, now);
  return {
    castle,
    row: normalizedRow,
    occurrence,
    status: siegeStatus(occurrence, now),
    duration: normalizedRow?.duration_minutes || SIEGE_DURATION_MINUTES,
  };
}

export function castleFromEvent(event) {
  const text = normalized(`${event?.castle ?? ''} ${event?.name ?? ''} ${event?.location ?? ''}`);
  return SIEGE_CASTLES.find((castle) => text.includes(normalized(castle))) || null;
}

export function siegePublicKey(event) {
  const castle = event?.castle || castleFromEvent(event) || '';
  return `${normalized(castle)}\u0000${event?.date || ''}`;
}

function publicEvent(castle, occurrence, now) {
  return {
    id: `siege-schedule-${normalized(castle).replace(/\s+/g, '-')}-${occurrence.date}`,
    name: `${castle} Castle Siege`,
    castle,
    type: 'Siege',
    date: occurrence.date,
    time: occurrence.time,
    duration: occurrence.duration,
    location: `${castle} Castle`,
    description: 'Miesięczne oblężenie zamku.',
    isSiegeSchedule: true,
    siegeStatus: siegeStatus(occurrence, now),
    startAt: occurrence.start.toISOString(),
    endAt: occurrence.end.toISOString(),
  };
}

export function publicSiegeEvents(rows = [], now = new Date()) {
  return rows
    .map(normalizeSiegeRow)
    .filter(Boolean)
    .map((row) => {
      const occurrence = nextMonthlyOccurrence(row, now);
      return occurrence ? publicEvent(row.castle, occurrence, now) : null;
    })
    .filter(Boolean);
}

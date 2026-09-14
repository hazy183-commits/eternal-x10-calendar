import { BOSS_PRESETS } from './adminFormDefaults.js';

export const TIME_ZONE = 'Europe/Warsaw';

export const MANUAL_RESPAWN_BOSSES = Object.freeze([
  Object.freeze({ name: 'Queen Ant', respawnHours: 24 }),
  Object.freeze({ name: 'Core', respawnHours: 36 }),
  Object.freeze({ name: 'Orfen', respawnHours: 36 }),
  Object.freeze({ name: 'Zaken', respawnHours: 36 }),
  Object.freeze({ name: 'Frintezza', respawnHours: 48 }),
]);

export const STATIC_RESPAWN_BOSSES = Object.freeze([
  Object.freeze({ name: 'Baium', weekday: 6, intervalWeeks: 1 }),
  Object.freeze({ name: 'Antharas', weekday: 0, intervalWeeks: 2, referenceDate: '2026-09-20' }),
  Object.freeze({ name: 'Valakas', weekday: 0, intervalWeeks: 2, referenceDate: '2026-09-27' }),
]);

export const BOSS_RESPAWN_BOSSES = Object.freeze([
  ...MANUAL_RESPAWN_BOSSES.map(({ name }) => name),
  ...STATIC_RESPAWN_BOSSES.map(({ name }) => name),
]);

const pad = (value) => String(value).padStart(2, '0');

function localParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(value).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return parts;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) return null;
  return date;
}

export function addDays(dateKey, days) {
  const date = parseDateKey(dateKey);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function daysBetween(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  return start && end ? Math.round((end - start) / 86400000) : NaN;
}

function timeZoneOffsetMinutes(instant) {
  const parts = localParts(instant);
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

export function localDateTimeToDate(dateKey, time = '00:00') {
  const date = parseDateKey(dateKey);
  const match = /^(\d{2}):(\d{2})$/.exec(String(time ?? ''));
  if (!date || !match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  const guess = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Number(match[1]), Number(match[2]), 0));
  const firstOffset = timeZoneOffsetMinutes(guess);
  const first = new Date(guess.getTime() - firstOffset * 60000);
  const correctedOffset = timeZoneOffsetMinutes(first);
  return new Date(guess.getTime() - correctedOffset * 60000);
}

export function localDateTimeToIso(dateKey, time) {
  const date = localDateTimeToDate(dateKey, time);
  return date ? date.toISOString() : null;
}

export function formatLocalDateTime(value, options = {}) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: TIME_ZONE,
    dateStyle: options.dateStyle || 'short',
    timeStyle: options.timeStyle || 'short',
  }).format(date);
}

export function localInputValues(now = new Date()) {
  const parts = localParts(now);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function normalizeRespawnRow(row) {
  if (!row || typeof row.boss !== 'string' || !BOSS_PRESETS[row.boss]) return null;
  return {
    id: row.id ?? null,
    boss: row.boss,
    last_kill_at: row.last_kill_at || null,
    base_respawn_at: row.base_respawn_at || null,
    window_start: row.window_start || null,
    window_end: row.window_end || null,
    status: row.status || null,
    updated_at: row.updated_at || null,
  };
}

export function calculateBaseRespawnAt(boss, killDate, killTime) {
  const config = MANUAL_RESPAWN_BOSSES.find((item) => item.name === boss);
  const kill = localDateTimeToDate(killDate, killTime);
  if (!config || !kill) return null;
  return new Date(kill.getTime() + config.respawnHours * 3600000);
}

export function calculateWindowEnd(windowDate, windowTime) {
  const start = localDateTimeToDate(windowDate, windowTime);
  return start ? new Date(start.getTime() + 30 * 60000) : null;
}

export function respawnStatus(row, now = new Date()) {
  if (!row) return 'OCZEKIWANIE NA OKNO Z GRY';
  const kill = row.last_kill_at ? new Date(row.last_kill_at) : null;
  const start = row.window_start ? new Date(row.window_start) : null;
  const end = row.window_end ? new Date(row.window_end) : null;
  if (kill && (!start || !Number.isFinite(start.getTime()) || start <= kill)) return 'ZABITY';
  if (!start || !Number.isFinite(start.getTime()) || !end || !Number.isFinite(end.getTime())) return kill ? 'ZABITY' : 'OCZEKIWANIE NA OKNO Z GRY';
  if (now < start) return 'NADCHODZI';
  if (now < end) return 'RESPAWN WINDOW ACTIVE';
  return 'OKNO ZAKOŃCZONE';
}

export function managerCardData(boss, row, now = new Date()) {
  const preset = BOSS_PRESETS[boss];
  const manual = MANUAL_RESPAWN_BOSSES.some((item) => item.name === boss);
  if (!manual) {
    const occurrence = nextStaticOccurrence(boss, now);
    return {
      boss, mode: 'static', type: preset?.type || 'Epic RB', status: staticStatus(occurrence.start, occurrence.end, now), occurrence,
    };
  }
  return {
    boss, mode: 'manual', type: preset?.type || 'RB', row, status: respawnStatus(row, now),
    lastKill: row?.last_kill_at ? new Date(row.last_kill_at) : null,
    baseRespawn: row?.base_respawn_at ? new Date(row.base_respawn_at) : null,
    windowStart: row?.window_start ? new Date(row.window_start) : null,
    windowEnd: row?.window_end ? new Date(row.window_end) : null,
  };
}

function weekdayForDate(dateKey) {
  const date = parseDateKey(dateKey);
  return date ? date.getUTCDay() : NaN;
}

function staticStatus(start, end, now) {
  if (now < start) return 'NADCHODZI';
  if (now < end) return 'RESPAWN WINDOW ACTIVE';
  return 'OKNO ZAKOŃCZONE';
}

export function nextStaticOccurrence(boss, now = new Date()) {
  const config = STATIC_RESPAWN_BOSSES.find((item) => item.name === boss);
  if (!config) return null;
  const parts = localParts(now);
  let date = `${parts.year}-${parts.month}-${parts.day}`;
  let days = (config.weekday - weekdayForDate(date) + 7) % 7;
  date = addDays(date, days);
  for (let attempt = 0; attempt < 800; attempt += 1) {
    const start = localDateTimeToDate(date, '22:00');
    const end = localDateTimeToDate(date, '23:00');
    if (start && end && end > now && isStaticBossOnDate(boss, date)) return { date, start, end };
    date = addDays(date, 7);
  }
  return null;
}

function isStaticBossOnDate(boss, date) {
  const config = STATIC_RESPAWN_BOSSES.find((item) => item.name === boss);
  if (!config) return false;
  if (boss === 'Baium') return true;
  const reference = config.referenceDate;
  const distance = daysBetween(reference, date);
  return Number.isFinite(distance) && distance >= 0 && distance % 14 === 0;
}

function staticEvent(boss, occurrence, now = new Date()) {
  const preset = BOSS_PRESETS[boss];
  return {
    id: `boss-respawn-${boss.toLowerCase().replace(/\s+/g, '-')}-${occurrence.date}`,
    name: boss,
    boss,
    type: preset?.type || 'Epic RB',
    date: occurrence.date,
    time: '22:00',
    duration: 60,
    location: preset?.location || '',
    description: 'Stałe okno respawnu.',
    isBossRespawn: true,
    respawnStatus: staticStatus(occurrence.start, occurrence.end, now),
    startAt: occurrence.start.toISOString(),
    endAt: occurrence.end.toISOString(),
  };
}

function manualEvent(row, now) {
  if (!row?.window_start || !row?.window_end) return null;
  const start = new Date(row.window_start);
  const end = new Date(row.window_end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
  if (end <= now) return null;
  const kill = row.last_kill_at ? new Date(row.last_kill_at) : null;
  if (kill && start <= kill) return null;
  const preset = BOSS_PRESETS[row.boss];
  const startParts = localParts(start);
  return {
    id: `boss-respawn-${row.boss.toLowerCase().replace(/\s+/g, '-')}-${start.getTime()}`,
    name: row.boss,
    boss: row.boss,
    type: preset?.type || 'RB',
    date: `${startParts.year}-${startParts.month}-${startParts.day}`,
    time: `${startParts.hour}:${startParts.minute}`,
    duration: 30,
    location: preset?.location || '',
    description: 'Dokładne 30-minutowe okno respawnu z gry.',
    isBossRespawn: true,
    respawnStatus: respawnStatus(row, now),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
}

export function publicRespawnEvents(rows = [], now = new Date()) {
  const byBoss = new Map(rows.map((row) => [row.boss, normalizeRespawnRow(row)]));
  const manualEvents = MANUAL_RESPAWN_BOSSES.map(({ name }) => manualEvent(byBoss.get(name), now)).filter(Boolean);
  const baiumOccurrence = nextStaticOccurrence('Baium', now);
  const baiumEvents = baiumOccurrence ? [staticEvent('Baium', baiumOccurrence, now)] : [];
  const alternatingCandidates = ['Antharas', 'Valakas']
    .map((name) => {
      const occurrence = nextStaticOccurrence(name, now);
      return occurrence ? staticEvent(name, occurrence, now) : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  return [...manualEvents, ...baiumEvents, ...alternatingCandidates.slice(0, 1)];
}

export function publicEventKey(event) {
  return `${String(event?.boss || event?.name || '').trim().toLocaleLowerCase()}\u0000${event?.date || ''}\u0000${event?.time || ''}`;
}

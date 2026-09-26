import { addDays, localDateTimeToDate, TIME_ZONE } from './bossRespawns.js';

export const CLAN_ACTIVITY_TIME_ZONE = TIME_ZONE;
export const CLAN_ACTIVITY_TIME = '20:20';

export const CLAN_ACTIVITY_EVENTS = Object.freeze([
  Object.freeze({
    id: 'clan-pvp',
    name: 'Klanowe PVP',
    weekdays: Object.freeze([2, 4]),
    artwork: '/images/profile-studio/siege-night.webp',
  }),
  Object.freeze({
    id: 'colloseum-training',
    name: 'Ćwiczenia Colloseum',
    weekdays: Object.freeze([3]),
    artwork: '/images/profile-studio/interlude-magic.webp',
  }),
]);

const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLAN_ACTIVITY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function localDateKey(value = new Date()) {
  return localDateFormatter.format(value);
}

function validDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''));
}

function weekdayForDate(date) {
  if (!validDateKey(date)) return -1;
  const parsed = new Date(`${date}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed.getUTCDay() : -1;
}

function identity(event) {
  return `${String(event?.name ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()}\u0000${event?.date ?? ''}\u0000${String(event?.time ?? '').slice(0, 5)}`;
}

export function clanActivityForDate(date, now = new Date()) {
  if (!validDateKey(date)) return [];
  const weekday = weekdayForDate(date);
  const start = localDateTimeToDate(date, CLAN_ACTIVITY_TIME);
  if (weekday < 0 || !start || !Number.isFinite(start.getTime())) return [];

  return CLAN_ACTIVITY_EVENTS
    .filter((definition) => definition.weekdays.includes(weekday))
    .map((definition) => {
      const end = new Date(start.getTime() + 60 * 60000);
      const event = {
        id: `${definition.id}-${date}`,
        name: definition.name,
        type: 'Event',
        boss: '',
        date,
        time: CLAN_ACTIVITY_TIME,
        duration: 60,
        location: 'Strefa klanu',
        description: 'Cykliczne wydarzenie klanowe · Europe/Warsaw.',
        artwork: definition.artwork,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        isClanActivitySchedule: true,
      };
      return { ...event, clanActivityStatus: start > now ? 'NADCHODZI' : now < end ? 'TRWA' : 'ZAKOŃCZONE' };
    });
}

export function withClanActivityEvents(events, now = new Date(), calendarDate = null) {
  const today = localDateKey(now);
  const upcomingDates = Array.from({ length: 15 }, (_, offset) => addDays(today, offset));
  const dates = new Set([...upcomingDates, calendarDate].filter(validDateKey));
  const schedule = Array.from(dates).flatMap((date) => clanActivityForDate(date, now));
  const scheduleByIdentity = new Map(schedule.map((event) => [identity(event), event]));

  return [
    ...events.filter((event) => !event.isClanActivitySchedule && !scheduleByIdentity.has(identity(event))),
    ...scheduleByIdentity.values(),
  ];
}

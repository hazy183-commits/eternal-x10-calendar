const DAY_MS = 24 * 60 * 60 * 1000;

export const CLAN_HALLS = Object.freeze([
  Object.freeze({ name: 'Fortress of Resistance', weekday: 5, time: '17:00' }),
  Object.freeze({ name: 'Devastated Castle', weekday: 1, time: '17:00' }),
  Object.freeze({ name: 'Bandit Stronghold', weekday: 3, time: '17:00' }),
  Object.freeze({ name: 'Rainbow Spring Chateau', weekday: 1, time: '21:00' }),
  Object.freeze({ name: 'Wild Beast Reserve', weekday: 4, time: '18:00' }),
  Object.freeze({ name: 'Fortress of the Dead', weekday: 2, time: '21:00' }),
]);

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function clanHallEvents(reference = new Date(), daysBefore = 7, daysAfter = 35) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysBefore);
  const totalDays = daysBefore + daysAfter;
  const events = [];

  for (let offset = 0; offset <= totalDays; offset += 1) {
    const date = new Date(start.getTime() + offset * DAY_MS);
    for (const hall of CLAN_HALLS) {
      if (date.getDay() !== hall.weekday) continue;
      events.push({
        id: `clan-hall-${hall.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dateKey(date)}`,
        name: hall.name,
        boss: '',
        type: 'Clan Hall',
        location: hall.name,
        date: dateKey(date),
        time: hall.time,
        duration: 60,
        description: 'Cotygodniowe wydarzenie Clan Hall.',
        isClanHallSchedule: true,
      });
    }
  }
  return events;
}

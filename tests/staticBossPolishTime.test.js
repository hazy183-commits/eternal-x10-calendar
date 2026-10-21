import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalDateTime, nextStaticOccurrence, publicRespawnEvents } from '../src/bossRespawns.js';

function warsawDateTime(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
}

test('Baium stays on Saturday at 22:00 Polish time in summer', () => {
  const now = new Date('2026-07-04T19:00:00.000Z'); // Saturday, 21:00 in Poland
  const occurrence = nextStaticOccurrence('Baium', now);
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-07-04', time: '22:00' });
  assert.equal(formatLocalDateTime(occurrence.start), '04.07.2026, 22:00');
});

test('Baium stays on Saturday at 22:00 Polish time in winter', () => {
  const now = new Date('2026-01-03T20:00:00.000Z'); // Saturday, 21:00 in Poland
  const occurrence = nextStaticOccurrence('Baium', now);
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-01-03', time: '22:00' });
});

test('Valakas is scheduled Sunday at 21:00 Polish time after the DST change', () => {
  const now = new Date('2026-09-27T17:00:00.000Z'); // Sunday, 19:00 in Poland
  const occurrence = nextStaticOccurrence('Valakas', now);
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-09-27', time: '21:00' });
});

test('public static boss events expose local schedule date and time', () => {
  const now = new Date('2026-07-04T19:00:00.000Z');
  const baium = publicRespawnEvents([], now).find((event) => event.boss === 'Baium');
  assert.equal(baium.date, '2026-07-04');
  assert.equal(baium.time, '22:00');
});

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

test('fixed Baium server time is displayed as Polish summer time (+2h), including date rollover', () => {
  const now = new Date('2026-07-04T20:00:00.000Z'); // Saturday, before 22:00 server time
  const occurrence = nextStaticOccurrence('Baium', now);
  assert.equal(occurrence.start.toISOString(), '2026-07-04T22:00:00.000Z');
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-07-05', time: '00:00' });
  assert.equal(formatLocalDateTime(occurrence.start), '05.07.2026, 00:00');
});

test('fixed Baium server time is displayed as Polish winter time (+1h)', () => {
  const now = new Date('2026-01-03T20:00:00.000Z'); // Saturday, before 22:00 server time
  const occurrence = nextStaticOccurrence('Baium', now);
  assert.equal(occurrence.start.toISOString(), '2026-01-03T22:00:00.000Z');
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-01-03', time: '23:00' });
});

test('public static boss events expose the converted Polish date and time', () => {
  const now = new Date('2026-07-04T20:00:00.000Z');
  const baium = publicRespawnEvents([], now).find((event) => event.boss === 'Baium');
  assert.equal(baium.date, '2026-07-05');
  assert.equal(baium.time, '00:00');
  assert.equal(baium.startAt, '2026-07-04T22:00:00.000Z');
});

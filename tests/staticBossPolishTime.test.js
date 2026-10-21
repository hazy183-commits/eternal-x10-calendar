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

test('Baium is Saturday at 22:00 in Polish summer time', () => {
  const occurrence = nextStaticOccurrence('Baium', new Date('2026-07-04T19:00:00.000Z'));
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-07-04', time: '22:00' });
  assert.equal(formatLocalDateTime(occurrence.start), '04.07.2026, 22:00');
});

test('Baium is Saturday at 21:00 in Polish winter time', () => {
  const occurrence = nextStaticOccurrence('Baium', new Date('2026-01-03T19:30:00.000Z'));
  assert.deepEqual(warsawDateTime(occurrence.start), { date: '2026-01-03', time: '21:00' });
});

test('Valakas and Antharas alternate Sundays and use 22 summer / 21 winter Polish time', () => {
  const valakasSummer = nextStaticOccurrence('Valakas', new Date('2026-09-27T17:00:00.000Z'));
  assert.deepEqual(warsawDateTime(valakasSummer.start), { date: '2026-09-27', time: '22:00' });
  const antharasNext = nextStaticOccurrence('Antharas', new Date('2026-10-04T17:00:00.000Z'));
  assert.deepEqual(warsawDateTime(antharasNext.start), { date: '2026-10-04', time: '22:00' });
  const valakasWinter = nextStaticOccurrence('Valakas', new Date('2026-11-01T12:00:00.000Z'));
  assert.deepEqual(warsawDateTime(valakasWinter.start), { date: '2026-11-08', time: '21:00' });
  const antharasWinter = nextStaticOccurrence('Antharas', new Date('2026-11-08T12:00:00.000Z'));
  assert.deepEqual(warsawDateTime(antharasWinter.start), { date: '2026-11-15', time: '21:00' });
});

test('public static boss events expose Polish schedule date and time', () => {
  const now = new Date('2026-07-04T19:00:00.000Z');
  const baium = publicRespawnEvents([], now).find((event) => event.boss === 'Baium');
  assert.equal(baium.date, '2026-07-04');
  assert.equal(baium.time, '22:00');
});

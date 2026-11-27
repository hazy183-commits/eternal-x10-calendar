import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clanActivityForDate,
  withClanActivityEvents,
} from '../src/clanActivitySchedule.js';

test('Klanowe PVP is generated on Tuesday and Thursday at 20:20 Warsaw time', () => {
  const now = new Date('2026-09-28T08:00:00Z');
  const [tuesday] = clanActivityForDate('2026-09-29', now);
  const [thursday] = clanActivityForDate('2026-10-01', now);

  assert.equal(tuesday.name, 'Klanowe PVP');
  assert.equal(thursday.name, 'Klanowe PVP');
  assert.equal(tuesday.time, '20:20');
  assert.equal(tuesday.startAt, '2026-09-29T18:20:00.000Z');
  assert.equal(tuesday.artwork, '/images/events/clan-pvp.webp');
});

test('Ćwiczenia Colloseum is generated on Wednesday and keeps the winter Warsaw offset', () => {
  const [event] = clanActivityForDate('2026-09-30', new Date('2026-09-28T08:00:00Z'));
  const [winterEvent] = clanActivityForDate('2026-12-30', new Date('2026-12-28T08:00:00Z'));

  assert.equal(event.name, 'Ćwiczenia Colloseum');
  assert.equal(event.time, '20:20');
  assert.equal(event.startAt, '2026-09-30T18:20:00.000Z');
  assert.equal(winterEvent.startAt, '2026-12-30T19:20:00.000Z');
  assert.equal(event.artwork, '/images/events/colloseum-training.webp');
});

test('schedule is available for the next day and a selected calendar date without duplicating manual events', () => {
  const now = new Date('2026-09-28T08:00:00Z');
  const manual = [{ id: 'manual', name: 'Klanowe PVP', type: 'Event', date: '2026-09-29', time: '20:20' }];
  const merged = withClanActivityEvents(manual, now, '2026-10-01');

  assert.ok(merged.filter((event) => event.isClanActivitySchedule).length > 2);
  assert.equal(merged.filter((event) => event.date === '2026-09-29').length, 1);
  assert.equal(merged.find((event) => event.date === '2026-10-01').name, 'Klanowe PVP');
});

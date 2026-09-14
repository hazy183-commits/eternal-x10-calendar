import { test } from 'node:test';
import assert from 'node:assert/strict';
import { olympiadForDate, nextOlympiadEvent, withOlympiadEvents, olympiadStatus,
  olympiadCountdownTarget, olympiadLocalDate } from '../src/olympiadSchedule.js';

test('14 September 2026: 20:30 UTC becomes 22:30 Warsaw, lasting exactly one hour', () => {
  const event = olympiadForDate('2026-09-14', new Date('2026-09-14T10:00:00Z'));
  assert.equal(event.startAt, '2026-09-14T20:30:00.000Z');
  assert.equal(event.endAt, '2026-09-14T21:30:00.000Z');
  assert.equal(event.date, '2026-09-14');
  assert.equal(event.timeRange, '22:30–23:30');
  assert.equal(event.duration, 60);
  assert.equal(event.type, 'Olympiad');
  assert.equal(event.olympiadStatus, 'NADCHODZI');
});

test('half-open session boundaries and countdown to the correct instant', () => {
  const event = olympiadForDate('2026-09-14');
  for (const [now, status, target] of [
    ['2026-09-14T20:29:59Z', 'NADCHODZI', event.startAt],
    ['2026-09-14T20:30:00Z', 'OLYMPIAD ACTIVE', event.endAt],
    ['2026-09-14T21:29:59Z', 'OLYMPIAD ACTIVE', event.endAt],
  ]) {
    assert.equal(olympiadStatus(event, new Date(now)), status);
    assert.equal(olympiadCountdownTarget(event, new Date(now)).toISOString(), target);
    assert.equal(nextOlympiadEvent(new Date(now)).id, event.id);
  }
  assert.equal(olympiadStatus(event, new Date(event.endAt)), 'ZAKOŃCZONE');
  assert.equal(nextOlympiadEvent(new Date(event.endAt)).date, '2026-09-15');
});

test('Friday at/after closing, Saturday and Sunday all select Monday', () => {
  for (const now of ['2026-09-18T21:30:00Z', '2026-09-18T21:45:00Z',
    '2026-09-19T08:00:00Z', '2026-09-20T20:00:00Z']) {
    assert.equal(nextOlympiadEvent(new Date(now)).date, '2026-09-21');
  }
  for (const date of ['2026-09-19', '2026-09-20']) {
    assert.equal(olympiadForDate(date), null);
    assert.equal(withOlympiadEvents([], new Date(`${date}T12:00:00Z`), date).filter(e => e.date === date).length, 0);
  }
});

test('DST conversion changes the displayed hour while UTC hours remain fixed', () => {
  for (const [date, range] of [
    ['2026-03-27', '21:30–22:30'], ['2026-03-30', '22:30–23:30'],
    ['2026-10-23', '22:30–23:30'], ['2026-10-26', '21:30–22:30'],
    ['2026-12-14', '21:30–22:30'],
  ]) {
    const event = olympiadForDate(date);
    assert.equal(event.timeRange, range);
    assert.equal(event.startAt, `${date}T20:30:00.000Z`);
    assert.equal(event.duration, 60);
  }
  assert.equal(olympiadLocalDate(new Date('2026-09-14T22:05:00Z')), '2026-09-15');
});

test('on-demand calendar terms, no bulk generation, expired today kept for calendar', () => {
  const now = new Date('2026-09-14T21:30:00Z');
  const events = withOlympiadEvents([], now, '2030-09-16');
  assert.equal(events.length, 3);
  assert.equal(events.find(e => e.date === '2026-09-14').olympiadStatus, 'ZAKOŃCZONE');
  assert.equal(events.find(e => e.date === '2026-09-15').olympiadStatus, 'NADCHODZI');
  assert.ok(events.some(e => e.date === '2030-09-16'));
  assert.equal(withOlympiadEvents(events, now).length, 2);
});

test('duplicate Olympiad dates/times are hidden publicly; other manual events are preserved', () => {
  const rows = [
    { id: 'duplicate', type: 'OLYMPIAD', name: 'Turniej', date: '2026-09-14', time: '22:30:00' },
    { id: 'name-duplicate', type: 'Event', name: 'Olympiada', date: '2026-09-14', time: '22:30' },
    { id: 'different-time', type: 'Olympiad', date: '2026-09-14', time: '20:00' },
    { id: 'ordinary', type: 'Event', name: 'Spotkanie', date: '2026-09-14', time: '22:30' },
  ];
  const original = structuredClone(rows);
  const result = withOlympiadEvents(rows, new Date('2026-09-14T10:00:00Z'));
  assert.deepEqual(result.map(e => e.id), ['different-time', 'ordinary', 'olympiad-2026-09-14']);
  assert.deepEqual(rows, original);
});

test('invalid dates never create a session', () => {
  for (const value of ['2026-02-30', '2026-13-01', 'invalid', '', null]) assert.equal(olympiadForDate(value), null);
});

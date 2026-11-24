import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PVP_REWARD, pvpEventsForUtcDate, pvpEventsForLocalDate, nextPvpEvent,
  withPvpEvents, isPvpUpcoming, pvpEventStatus, pvpCountdownText } from '../src/pvpEventSchedule.js';

const now = new Date('2026-09-14T00:00:00Z');

test('all twelve daily UTC starts convert to the requested Warsaw summer times', () => {
  const events = pvpEventsForUtcDate('2026-09-14', now);
  assert.equal(events.length, 12);
  assert.deepEqual(events.map(({ time }) => time),
    ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00']);
  for (const event of events) {
    assert.equal(event.pvpId, 'random-pvp-event');
    assert.equal(event.type, 'Event');
    assert.equal(event.command, '');
    assert.equal(event.reward, PVP_REWARD);
    assert.equal(event.duration, 0);
    assert.equal(event.eventStartAt, event.startAt);
    assert.equal(event.endAt, event.startAt);
  }
  assert.equal(events.find(event => event.utcTime === '00:00').date, '2026-09-14');
  assert.equal(events.find(event => event.utcTime === '22:00').date, '2026-09-15');
});

test('local midnight belongs to the following day and includes the preceding UTC date', () => {
  const events = pvpEventsForLocalDate('2026-09-15', now);
  assert.equal(events.length, 12);
  assert.ok(events.every(event => event.date === '2026-09-15'));
  assert.equal(events[0].time, '00:00');
  assert.equal(events[0].startAt, '2026-09-14T22:00:00.000Z');
  assert.equal(events[1].startAt, '2026-09-15T00:00:00.000Z');
  assert.equal(pvpEventsForLocalDate('2027-01-01', now)[0].startAt, '2027-01-01T00:00:00.000Z');
});

test('winter, spring-forward and fall-back use actual DST offsets, never a fixed +2', () => {
  assert.equal(pvpEventsForUtcDate('2026-10-26', now).find(event => event.utcTime === '20:00').time, '21:00');
  const spring = pvpEventsForUtcDate('2026-03-29', now);
  assert.equal(spring.find(event => event.utcTime === '00:00').time, '01:00');
  assert.equal(spring.find(event => event.utcTime === '02:00').time, '04:00');
  const fall = pvpEventsForUtcDate('2026-10-25', now);
  assert.equal(fall.find(event => event.utcTime === '00:00').time, '02:00');
  assert.equal(fall.find(event => event.utcTime === '02:00').time, '03:00');
  assert.equal(pvpEventsForLocalDate('2026-10-25', now).length, 13);
  assert.equal(pvpEventsForLocalDate('2026-03-29', now).length, 11);
});

test('the upcoming slot rolls over at the exact draw time', () => {
  const event = pvpEventsForUtcDate('2026-09-14', now).find(({ utcTime }) => utcTime === '10:00');
  const start = Date.parse(event.startAt);
  const before = new Date(start - 1000);
  assert.equal(isPvpUpcoming(event, before), true);
  assert.equal(pvpEventStatus(event, before), 'NADCHODZI');
  assert.equal(pvpCountdownText(event, before), '00:00:01');
  assert.equal(nextPvpEvent(null, before).id, event.id);

  for (const offset of [0, 1000]) {
    const instant = new Date(start + offset);
    assert.equal(isPvpUpcoming(event, instant), false);
    assert.equal(pvpEventStatus(event, instant), 'SLOT MINĄŁ');
    assert.equal(Date.parse(nextPvpEvent(null, instant).startAt) - start, 2 * 3600000);
  }
});

test('the midnight slot advances to the new local day and winter labels use Warsaw time', () => {
  const midnight = nextPvpEvent(null, new Date('2026-09-14T21:59:59Z'));
  assert.equal(midnight.date, '2026-09-15');
  assert.equal(midnight.time, '00:00');
  assert.equal(midnight.startAt, '2026-09-14T22:00:00.000Z');
  assert.equal(nextPvpEvent(null, new Date(midnight.startAt)).time, '02:00');
  const winter = pvpEventsForUtcDate('2026-10-26', now).find(({ utcTime }) => utcTime === '20:00');
  assert.equal(winter.time, '21:00');
});

test('public merge removes matching manual duplicates only, and supports a distant selected day', () => {
  const manual = [
    { id: 'match', name: ' CAPTURE   the base ', date: '2026-09-14', time: '22:00:00', type: 'Event' },
    { id: 'different-time', name: 'Capture The Base', date: '2026-09-14', time: '22:01', type: 'Event' },
    { id: 'different-date', name: 'Capture The Base', date: '2026-09-16', time: '22:00', type: 'Event' },
    { id: 'other', name: 'Spotkanie', date: '2026-09-14', time: '22:00', type: 'Event' },
  ];
  const original = structuredClone(manual);
  const merged = withPvpEvents(manual, now);
  assert.deepEqual(manual, original);
  assert.equal(merged.filter(event => event.isPvpSchedule).length, 24);
  assert.deepEqual(merged.filter(event => !event.isPvpSchedule), manual.slice(1));
  const future = withPvpEvents(merged, now, '2030-12-02');
  assert.equal(future.filter(event => event.date === '2030-12-02').length, 12);
  assert.equal(new Set(future.map(event => event.id)).size, future.length);
  assert.equal(withPvpEvents(future, now).filter(event => event.isPvpSchedule).length, 24);
});

test('invalid calendar dates generate no occurrences', () => {
  for (const date of ['', null, 'bad', '2026-02-30', '2026-13-01']) {
    assert.deepEqual(pvpEventsForUtcDate(date, now), []);
    assert.deepEqual(pvpEventsForLocalDate(date, now), []);
  }
});

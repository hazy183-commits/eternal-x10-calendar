import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PVP_EVENTS, pvpEventsForUtcDate, pvpEventsForLocalDate, nextPvpEvent,
  withPvpEvents, isPvpUpcoming, pvpEventStatus, pvpCountdownText } from '../src/pvpEventSchedule.js';

const now = new Date('2026-09-14T00:00:00Z');

test('all twelve daily UTC starts convert to the requested Warsaw summer times', () => {
  const events = pvpEventsForUtcDate('2026-09-14', now);
  const expected = {
    'Multi Team Battle': ['04:00', '12:00', '20:00'],
    'Capture The Base': ['06:00', '14:00', '22:00'],
    'Epic Boss Challenge': ['02:00', '10:00', '18:00'],
    'Death Match': ['08:00', '16:00', '00:00'],
  };
  assert.equal(events.length, 12);
  for (const definition of PVP_EVENTS) {
    const matching = events.filter(event => event.name === definition.name);
    assert.deepEqual(matching.map(event => event.time), expected[definition.name]);
    for (const event of matching) {
      assert.equal(event.type, 'Event');
      assert.equal(event.command, definition.command);
      assert.equal(event.reward, '5 Medal (Event)');
      assert.equal(event.duration, 10);
      assert.equal(new Date(event.eventStartAt) - new Date(event.startAt), 5 * 60000);
      assert.equal(new Date(event.endAt) - new Date(event.eventStartAt), 10 * 60000);
    }
  }
  assert.equal(events.find(event => event.utcTime === '00:00').date, '2026-09-14');
  assert.equal(events.find(event => event.utcTime === '22:00').date, '2026-09-15');
});

test('local midnight belongs to the following day and includes the preceding UTC date', () => {
  const events = pvpEventsForLocalDate('2026-09-15', now);
  assert.equal(events.length, 12);
  assert.ok(events.every(event => event.date === '2026-09-15'));
  assert.equal(events[0].name, 'Death Match');
  assert.equal(events[0].time, '00:00');
  assert.equal(events[0].startAt, '2026-09-14T22:00:00.000Z');
  assert.equal(events[1].name, 'Epic Boss Challenge');
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

for (const definition of PVP_EVENTS) {
  test(definition.name + ': registration, active event and rollover have exact half-open boundaries', () => {
    const event = pvpEventsForUtcDate('2026-09-14', now).find(event => event.pvpId === definition.id && event.utcTime === String(definition.utcHours[1]).padStart(2, '0') + ':00');
    const start = Date.parse(event.startAt);
    const phases = [
      [-60000, 'NADCHODZI', 'Rejestracja za 00:01:00'],
      [0, 'REJESTRACJA OTWARTA', 'Start eventu za 05:00'],
      [299000, 'REJESTRACJA OTWARTA', 'Start eventu za 00:01'],
      [300000, 'EVENT ACTIVE', 'Koniec za 10:00'],
      [899000, 'EVENT ACTIVE', 'Koniec za 00:01'],
      [900000, 'ZAKOŃCZONE', 'Zakończone'],
    ];
    for (const [offset, status, countdown] of phases) {
      const instant = new Date(start + offset);
      assert.equal(pvpEventStatus(event, instant), status);
      assert.equal(pvpCountdownText(event, instant), countdown);
      assert.equal(isPvpUpcoming(event, instant), offset < 900000);
      const next = nextPvpEvent(definition.id, instant);
      if (offset < 900000) assert.equal(next.id, event.id);
      else assert.equal(Date.parse(next.startAt) - start, 8 * 3600000);
    }
  });
}

test('registration and event windows retain the correct Warsaw midnight and winter dates', () => {
  const midnight = pvpEventsForLocalDate('2026-09-15', now)[0];
  assert.equal(midnight.registrationTimeRange, '00:00–00:05');
  assert.equal(midnight.eventTimeRange, '00:05–00:15');
  assert.equal(midnight.eventStartAt, '2026-09-14T22:05:00.000Z');
  assert.equal(midnight.endAt, '2026-09-14T22:15:00.000Z');
  assert.equal(nextPvpEvent('death-match', new Date('2026-09-14T22:14:59Z')).date, '2026-09-15');
  assert.equal(nextPvpEvent('death-match', new Date('2026-09-14T22:15:00Z')).time, '08:00');
  const winter = pvpEventsForUtcDate('2026-10-26', now).find(event => event.utcTime === '20:00');
  assert.equal(winter.registrationTimeRange, '21:00–21:05');
  assert.equal(winter.eventTimeRange, '21:05–21:15');
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

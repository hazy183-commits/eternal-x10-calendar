import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clanHallEvents } from '../src/clanHallSchedule.js';

function fortressOn(date) {
  const reference = new Date(`${date}T12:00:00`);
  return clanHallEvents(reference, 0, 0).find((event) => event.name === 'Fortress of the Dead');
}

test('fixed Clan Hall events use the summer schedule during Polish daylight time', () => {
  assert.equal(fortressOn('2026-10-20')?.time, '23:00');
});

test('fixed Clan Hall events move one hour earlier after Poland switches to winter time', () => {
  assert.equal(fortressOn('2026-10-27')?.time, '22:00');
});

test('fixed Clan Hall schedule keeps the winter offset for later winter dates', () => {
  assert.equal(fortressOn('2026-12-01')?.time, '22:00');
});

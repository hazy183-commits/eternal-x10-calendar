import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTerritoryOwners, parseTerritoryOwners } from '../src/territoryOwnership.js';

test('parses castle owner names from common OCR layouts', () => {
  const rows = parseTerritoryOwners(`Aden Castle | Owner: WhiteEagles\nGiran Castle\nClan: NightWatch`, 'castle');
  assert.deepEqual(rows.map(({ territory_name, owner_clan, selected }) => ({ territory_name, owner_clan, selected })), [
    { territory_name: 'Aden', owner_clan: 'WhiteEagles', selected: true },
    { territory_name: 'Giran', owner_clan: 'NightWatch', selected: true },
  ]);
});

test('parses clan hall aliases and selects an explicit missing owner for clearing', () => {
  const rows = parseTerritoryOwners(`Rainbow Springs Chateau - Owner: Phoenix\nFortress of the Dead - No owner`, 'clan_hall');
  assert.equal(rows[0].territory_name, 'Rainbow Spring Chateau');
  assert.equal(rows[0].owner_clan, 'Phoenix');
  assert.equal(rows[1].territory_name, 'Fortress of the Dead');
  assert.equal(rows[1].owner_clan, '');
  assert.equal(rows[1].selected, true);
});

test('adds owner information without changing schedule fields', () => {
  const event = { name: 'Aden Castle Siege', castle: 'Aden', type: 'Siege', date: '2026-09-27', time: '18:00', duration: 120, isSiegeSchedule: true, description: 'Miesięczne oblężenie zamku.' };
  const [owned] = applyTerritoryOwners([event], [{ territory_type: 'castle', territory_name: 'Aden', owner_clan: 'WhiteEagles' }]);
  assert.equal(owned.ownerClan, 'WhiteEagles');
  assert.match(owned.description, /Właściciel: WhiteEagles/);
  assert.equal(owned.date, event.date);
  assert.equal(owned.time, event.time);
  assert.equal(owned.duration, event.duration);
});

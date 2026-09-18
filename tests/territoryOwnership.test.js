import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTerritoryOwners, parseTerritoryOwners } from '../src/territoryOwnership.js';
import { ownershipCropRect } from '../src/territoryOwnershipScreenshotImport.js';

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

test('separates clan, leader and siege date from the real castle table OCR', () => {
  const rows = parseTerritoryOwners(`
Oren InFerNalL arr 18:00 11.10.2026
Aden Rise PirataDM 18:00 27.09.2026
Goddard Rising Riska 180011102026
Schuttgart OrzelBialy Unqual 18:0020.09.2026
Gludio ProGame Thurston 18:00 04.10.2026
Dion UnRespectabless Eulabia 18:00 11.10.2026
Giran Valhalla RagnarBR 18:00 20.09.2026
Innadril SevenSerpents LittleHammer 18:00 20.09.2026
Rune LastKingdom Concrete 18:00 04.10.2026
  `, 'castle');
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.territory_name, row.owner_clan])), {
    Oren: 'InFerNalL',
    Aden: 'Rise',
    Goddard: 'Rising',
    Schuttgart: 'OrzelBialy',
    Gludio: 'ProGame',
    Dion: 'UnRespectabless',
    Giran: 'Valhalla',
    Innadril: 'SevenSerpents',
    Rune: 'LastKingdom',
  });
});

test('ignores the table icon misread as Vv before the clan column', () => {
  const rows = parseTerritoryOwners(`
Oren Vv InFerNalL arr 18:00 11.10.2026
Aden vv Rise PirataDM 18:00 27.09.2026
Goddard ww Rising Riska 180011102026
Schuttgart W OrzelBialy Unqual 18:0020.09.2026
Gludio V ProGame Thurston 18:00 04.10.2026
  `, 'castle');
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.territory_name, row.owner_clan])), {
    Oren: 'InFerNalL', Aden: 'Rise', Goddard: 'Rising', Schuttgart: 'OrzelBialy', Gludio: 'ProGame',
  });
});

test('castle OCR crop includes castle and clan columns but excludes leader and siege date', () => {
  assert.deepEqual(ownershipCropRect(662, 294, 'castle'), { x: 0, y: 10, width: 341, height: 278 });
  assert.deepEqual(ownershipCropRect(742, 215, 'clan_hall'), { x: 0, y: 8, width: 338, height: 203 });
});

test('parses the real Clan Hall name and clan columns', () => {
  const rows = parseTerritoryOwners(`
# Hall name Clan name
1 Fortress of Resistance Arcane
2 Devastated Castle Notabene
3 Bandit Stronghold Nieogary
4 Rainbow Spring Chateau OrzelBialy
5 Wild Beast Reserve VisioN
6 Fortress of the Dead NoldoR
  `, 'clan_hall');
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.territory_name, row.owner_clan])), {
    'Fortress of Resistance': 'Arcane',
    'Devastated Castle': 'Notabene',
    'Bandit Stronghold': 'Nieogary',
    'Rainbow Spring Chateau': 'OrzelBialy',
    'Wild Beast Reserve': 'VisioN',
    'Fortress of the Dead': 'NoldoR',
  });
});

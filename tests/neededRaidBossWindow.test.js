import test from 'node:test';
import assert from 'node:assert/strict';
import {warsawLocalToIso} from '../src/neededRaidBossWindow.js';
test('RB summer input preserves Warsaw date and hour',()=>assert.equal(warsawLocalToIso('2026-09-20T18:30'),'2026-09-20T16:30:00.000Z'));
test('RB winter input uses the winter timezone offset',()=>assert.equal(warsawLocalToIso('2026-12-20T18:30'),'2026-12-20T17:30:00.000Z'));
test('RB midnight keeps the correct previous UTC day',()=>assert.equal(warsawLocalToIso('2026-09-20T00:15'),'2026-09-19T22:15:00.000Z'));
test('empty RB input is not submitted as a date',()=>assert.equal(warsawLocalToIso(''),null));

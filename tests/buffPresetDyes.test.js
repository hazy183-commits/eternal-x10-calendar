import test from 'node:test';
import assert from 'node:assert/strict';
import {DYES,parseDyes,serializeDyes,dyeSelector} from '../src/buffPresetDyes.js';
test('catalog uses real Interlude item ids and unique effects',()=>{assert.equal(DYES.length,144);assert.equal(new Set(DYES.map(d=>d.label)).size,144);assert.ok(DYES.find(d=>d.label==='+4 STR / -4 CON').itemIds.includes(4613));assert.ok(!DYES.some(d=>d.label==='+5 STR / -5 CON'));});
test('up to three different dyes round trip with legacy text',()=>{const dyes=['+4 STR / -4 CON','+1 STR / -1 CON','+4 DEX / -4 CON'];assert.deepEqual(parseDyes(serializeDyes(dyes)),dyes);assert.equal(serializeDyes(['','','']),'');assert.deepEqual(parseDyes('+4 STR / −4 CON'),[dyes[0]]);});
test('duplicates, fourth dye and invented effects cannot save',()=>{assert.throws(()=>serializeDyes(['+4 STR / -4 CON','+4 STR / -4 CON']),/różne/);assert.throws(()=>serializeDyes(DYES.slice(0,4).map(d=>d.label)),/maksymalnie/);assert.throws(()=>serializeDyes(['+5 STR / -5 CON']),/listy/);assert.throws(()=>parseDyes('<script>'),/listy/);});
test('selector exposes exactly three optional slots',()=>{const html=dyeSelector();assert.equal((html.match(/data-dye-slot=/g)||[]).length,3);assert.equal((html.match(/— Brak symbolu —/g)||[]).length,3);});

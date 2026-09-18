import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCraftProject } from '../src/craftHomeSummary.js';

test('summarizes owned and missing terminal craft materials as a percentage', () => {
  const summary = summarizeCraftProject({
    complete: false,
    requirements: [
      { itemKey: 'crafted', quantity: 5, ownedAllocated: 0, generatedSurplusUsed: 0, missing: 0 },
      { itemKey: 'ore', quantity: 80, ownedAllocated: 30, generatedSurplusUsed: 10, missing: 40 },
      { itemKey: 'crystal', quantity: 20, ownedAllocated: 20, generatedSurplusUsed: 0, missing: 0 },
    ],
  });
  assert.deepEqual(summary, { have: 60, missing: 40, total: 100, percent: 60 });
});

test('completed craft project always reports one hundred percent', () => {
  assert.equal(summarizeCraftProject({ complete: true, requirements: [] }).percent, 100);
});

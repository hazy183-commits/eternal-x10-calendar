import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCraftProject, wrapProjectIndex } from '../src/craftHomeSummary.js';

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

test('keeps one decimal place so partial progress never appears stuck at zero', () => {
  const summary = summarizeCraftProject({
    complete: false,
    requirements: [
      { quantity: 5200, ownedAllocated: 5200, generatedSurplusUsed: 0, missing: 0 },
      { quantity: 50480, ownedAllocated: 0, generatedSurplusUsed: 0, missing: 50480 },
    ],
  });
  assert.equal(summary.percent, 9.3);
});

test('counts generated craft surplus as covered progress', () => {
  const summary = summarizeCraftProject({
    complete: false,
    requirements: [
      { quantity: 10, ownedAllocated: 0, generatedSurplusUsed: 4, missing: 6 },
    ],
  });
  assert.deepEqual(summary, { have: 4, missing: 6, total: 10, percent: 40 });
});

test('project navigation wraps in both directions', () => {
  assert.equal(wrapProjectIndex(2, 2), 0);
  assert.equal(wrapProjectIndex(-1, 2), 1);
  assert.equal(wrapProjectIndex(7, 0), 0);
});

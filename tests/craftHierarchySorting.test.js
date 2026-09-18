import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortComponentsByRequiredQuantity } from '../src/craftHierarchyEnhancer.js';

test('sorts craft tree materials from the smallest required quantity to the largest', () => {
  const components = [
    { itemKey: 'crafted_leather', quantity: 25 },
    { itemKey: 'design', quantity: 13 },
    { itemKey: 'anvil_lock', quantity: 1 },
    { itemKey: 'asoife', quantity: 5 },
  ];

  assert.deepEqual(
    sortComponentsByRequiredQuantity(components, 2).map(row => row.itemKey),
    ['anvil_lock', 'asoife', 'design', 'crafted_leather'],
  );
  assert.deepEqual(components.map(row => row.itemKey), ['crafted_leather', 'design', 'anvil_lock', 'asoife']);
});

test('uses material name as a stable tie-breaker', () => {
  const itemIndex = new Map([
    ['z', { name: 'Asofe' }],
    ['a', { name: 'Crystal' }],
  ]);
  assert.deepEqual(
    sortComponentsByRequiredQuantity([
      { itemKey: 'a', quantity: 5 },
      { itemKey: 'z', quantity: 5 },
    ], 1, itemIndex).map(row => row.itemKey),
    ['z', 'a'],
  );
});

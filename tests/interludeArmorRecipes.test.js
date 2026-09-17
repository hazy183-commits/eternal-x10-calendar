import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSql, collectRecipeClosure } from '../api/interlude-armor-recipes.js';

const recipe = (outputId, name, ingredients, outputQuantity = 1, grade = null) => ({
  outputId,
  outputQuantity,
  name,
  grade,
  ingredients,
});

test('collects all recursively craftable armor materials and emits their recipes', () => {
  const leather = recipe(2, 'Crafted Leather', [{ id: 4, name: 'Leather', quantity: 4 }]);
  const steel = recipe(5, 'Steel', [{ id: 6, name: 'Iron Ore', quantity: 5 }]);
  const lock = recipe(3, 'Maestro Anvil Lock', [
    { id: 5, name: 'Steel', quantity: 2 },
    { id: 7, name: 'Oriharukon', quantity: 1 },
  ]);
  const armor = recipe(1, 'Draconic Leather Armor', [
    { id: 2, name: 'Crafted Leather', quantity: 3 },
    { id: 3, name: 'Maestro Anvil Lock', quantity: 1 },
  ], 1, 'S');

  const closure = collectRecipeClosure([armor], [armor, leather, lock, steel]);
  assert.deepEqual(new Set(closure.map(row => row.name)), new Set([
    'Draconic Leather Armor', 'Crafted Leather', 'Maestro Anvil Lock', 'Steel',
  ]));

  const sql = buildSql([armor], closure);
  assert.match(sql, /mat_crafted_leather/);
  assert.match(sql, /mat_maestro_anvil_lock/);
  assert.match(sql, /mat_steel/);
  assert.match(sql, /'Interlude material'/);
  assert.match(sql, /r\.output_item_key=v\.output_item_key and r\.is_primary=true/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMainMissingRows, summarizeMainMissing, summarizeMainProgress } from '../src/craftHierarchyEnhancer.js';

const workspace = {
  items: [
    { item_key: 'weapon', name: 'Weapon' },
    { item_key: 'main_mat', name: 'Main Material' },
    { item_key: 'raw_mat', name: 'Raw Material' },
    { item_key: 'recipe_scroll', name: 'Recipe Scroll' },
  ],
  recipes: [
    { id: 'recipe-weapon', output_item_key: 'weapon', output_quantity: 1, is_primary: true, active: true },
    { id: 'recipe-main', output_item_key: 'main_mat', output_quantity: 1, is_primary: true, active: true },
  ],
  components: [
    { recipe_id: 'recipe-weapon', component_item_key: 'main_mat', quantity: 10 },
    { recipe_id: 'recipe-weapon', component_item_key: 'recipe_scroll', quantity: 1 },
    { recipe_id: 'recipe-main', component_item_key: 'raw_mat', quantity: 2 },
  ],
};

test('main missing total ignores missing submaterials below the main recipe', () => {
  const project = {
    targetItemKey: 'weapon',
    targetQuantity: 1,
    ownedAllocated: [{ itemKey: 'raw_mat', quantity: 2 }],
    generatedSurplusUsed: [],
    missing: [{ itemKey: 'raw_mat', name: 'Raw Material', quantity: 18 }],
  };

  assert.deepEqual(getMainMissingRows(project, workspace), [{
    itemKey: 'main_mat',
    name: 'Main Material',
    quantity: 10,
    covered: 0,
    missing: 10,
  }]);
  assert.equal(summarizeMainMissing(project, workspace), 10);
});

test('main missing total uses the remaining quantity of a direct material', () => {
  const project = {
    targetItemKey: 'weapon',
    targetQuantity: 1,
    ownedAllocated: [{ itemKey: 'main_mat', quantity: 4 }],
    generatedSurplusUsed: [],
    missing: [{ itemKey: 'raw_mat', name: 'Raw Material', quantity: 12 }],
  };

  assert.equal(summarizeMainMissing(project, workspace), 6);
});

test('main progress ignores expanded submaterials below the main recipe', () => {
  const project = {
    complete: false,
    targetItemKey: 'weapon',
    targetQuantity: 1,
    ownedAllocated: [{ itemKey: 'main_mat', quantity: 4 }],
    generatedSurplusUsed: [],
    missing: [{ itemKey: 'raw_mat', name: 'Raw Material', quantity: 12 }],
  };

  assert.deepEqual(summarizeMainProgress(project, workspace), {
    have: 4,
    missing: 6,
    total: 10,
    percent: 40,
  });
});

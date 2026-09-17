import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CraftPlannerError, planCraftWorkspace } from '../src/craftPlannerEngine.js';

const item = (item_key, name = item_key) => ({ item_key, name });
const recipe = (id, output_item_key, output_quantity = 1) => ({
  id, output_item_key, output_quantity, is_primary: true, active: true,
});
const component = (recipe_id, component_item_key, quantity) => ({
  recipe_id, component_item_key, quantity,
});
const project = (id, target_item_key, target_quantity, priority = 100, status = 'active') => ({
  id,
  name: `Project ${id}`,
  target_item_key,
  target_quantity,
  priority,
  status,
  created_at: `2026-09-17T10:00:0${id.length}Z`,
});

const baseData = {
  items: [item('weapon', 'Weapon'), item('alloy', 'Alloy'), item('coke', 'Coke')],
  recipes: [recipe('r-weapon', 'weapon')],
  components: [component('r-weapon', 'alloy', 3), component('r-weapon', 'coke', 2)],
};

test('calculates required, allocated and missing mats for one project', () => {
  const plan = planCraftWorkspace({
    ...baseData,
    inventory: [
      { item_key: 'alloy', quantity: 4 },
      { item_key: 'coke', quantity: 10 },
    ],
    projects: [project('one', 'weapon', 2)],
  });

  assert.equal(plan.activeProjects.length, 1);
  assert.deepEqual(plan.activeProjects[0].missing, [
    { itemKey: 'alloy', name: 'Alloy', quantity: 2 },
  ]);
  assert.deepEqual(plan.inventory, [
    { itemKey: 'alloy', name: 'Alloy', quantity: 4, reserved: 4, available: 0 },
    { itemKey: 'coke', name: 'Coke', quantity: 10, reserved: 4, available: 6 },
  ]);
});

test('two active projects cannot reserve the same owned material twice', () => {
  const data = {
    items: [item('weapon'), item('alloy')],
    recipes: [recipe('r-weapon', 'weapon')],
    components: [component('r-weapon', 'alloy', 4)],
    inventory: [{ item_key: 'alloy', quantity: 5 }],
    projects: [
      project('later', 'weapon', 1, 20),
      project('first', 'weapon', 1, 10),
    ],
  };

  const plan = planCraftWorkspace(data);
  const first = plan.activeProjects.find(row => row.id === 'first');
  const later = plan.activeProjects.find(row => row.id === 'later');

  assert.equal(first.ownedAllocated[0].quantity, 4);
  assert.equal(first.missing.length, 0);
  assert.equal(later.ownedAllocated[0].quantity, 1);
  assert.equal(later.missing[0].quantity, 3);
  assert.equal(plan.inventory[0].reserved, 5);
  assert.equal(plan.inventory[0].available, 0);
});

test('recipe yield surplus is reused by the next project before owned stock', () => {
  const data = {
    items: [item('weapon'), item('blade'), item('ore')],
    recipes: [recipe('r-weapon', 'weapon'), recipe('r-blade', 'blade', 3)],
    components: [
      component('r-weapon', 'blade', 4),
      component('r-blade', 'ore', 5),
    ],
    inventory: [{ item_key: 'ore', quantity: 20 }],
    projects: [
      project('first', 'weapon', 1, 10),
      project('second', 'weapon', 1, 20),
    ],
  };

  const plan = planCraftWorkspace(data);
  const first = plan.activeProjects.find(row => row.id === 'first');
  const second = plan.activeProjects.find(row => row.id === 'second');

  assert.equal(first.craftOperations.find(row => row.itemKey === 'blade').crafts, 2);
  assert.equal(first.ownedAllocated.find(row => row.itemKey === 'ore').quantity, 10);
  assert.equal(second.generatedSurplusUsed.find(row => row.itemKey === 'blade').quantity, 2);
  assert.equal(second.craftOperations.find(row => row.itemKey === 'blade').crafts, 1);
  assert.equal(second.ownedAllocated.find(row => row.itemKey === 'ore').quantity, 5);
  assert.equal(plan.inventory.find(row => row.itemKey === 'ore').available, 5);
});

test('already-owned finished target does not reduce requested craft quantity', () => {
  const plan = planCraftWorkspace({
    ...baseData,
    inventory: [
      { item_key: 'weapon', quantity: 9 },
      { item_key: 'alloy', quantity: 3 },
      { item_key: 'coke', quantity: 2 },
    ],
    projects: [project('one', 'weapon', 1)],
  });

  assert.equal(plan.activeProjects[0].missing.length, 0);
  assert.equal(plan.inventory.find(row => row.itemKey === 'weapon').reserved, 0);
  assert.equal(plan.inventory.find(row => row.itemKey === 'weapon').available, 9);
});

test('paused projects stay visible but do not reserve inventory', () => {
  const plan = planCraftWorkspace({
    ...baseData,
    inventory: [{ item_key: 'alloy', quantity: 3 }, { item_key: 'coke', quantity: 2 }],
    projects: [project('paused', 'weapon', 1, 1, 'paused')],
  });

  assert.equal(plan.activeProjects.length, 0);
  assert.equal(plan.projects[0].reservesInventory, false);
  assert.equal(plan.inventory.find(row => row.itemKey === 'alloy').reserved, 0);
});

test('cyclic recipes are rejected instead of recursing forever', () => {
  assert.throws(() => planCraftWorkspace({
    items: [item('a'), item('b')],
    recipes: [recipe('ra', 'a'), recipe('rb', 'b')],
    components: [component('ra', 'b', 1), component('rb', 'a', 1)],
    inventory: [],
    projects: [project('cycle', 'a', 1)],
  }), error => error instanceof CraftPlannerError && error.details.cycle.join('>') === 'a>b>a');
});

test('expands Crafted Leather and Maestro Anvil Lock through every material recipe level', () => {
  const plan = planCraftWorkspace({
    items: [
      item('armor_s', 'S-grade armor'),
      item('armor_a', 'A-grade armor'),
      item('mat_crafted_leather', 'Crafted Leather'),
      item('mat_maestro_anvil_lock', 'Maestro Anvil Lock'),
      item('mat_leather', 'Leather'),
      item('mat_coal', 'Coal'),
      item('mat_steel', 'Steel'),
      item('mat_oriharukon', 'Oriharukon'),
    ],
    recipes: [
      recipe('r-armor', 'armor_s'),
      recipe('r-armor-a', 'armor_a'),
      recipe('r-crafted-leather', 'mat_crafted_leather', 1),
      recipe('r-anvil-lock', 'mat_maestro_anvil_lock', 1),
      recipe('r-steel', 'mat_steel', 1),
    ],
    components: [
      component('r-armor', 'mat_crafted_leather', 2),
      component('r-armor', 'mat_maestro_anvil_lock', 3),
      component('r-armor-a', 'mat_crafted_leather', 1),
      component('r-armor-a', 'mat_maestro_anvil_lock', 2),
      component('r-crafted-leather', 'mat_leather', 4),
      component('r-crafted-leather', 'mat_coal', 1),
      component('r-anvil-lock', 'mat_steel', 2),
      component('r-anvil-lock', 'mat_oriharukon', 1),
      component('r-steel', 'mat_coal', 3),
    ],
    inventory: [],
    projects: [project('armor-s', 'armor_s', 2), project('armor-a', 'armor_a', 1, 110)],
  });

  assert.deepEqual(plan.activeProjects.find(row => row.id === 'armor-s').missing, [
    { itemKey: 'mat_coal', name: 'Coal', quantity: 40 },
    { itemKey: 'mat_leather', name: 'Leather', quantity: 16 },
    { itemKey: 'mat_oriharukon', name: 'Oriharukon', quantity: 6 },
  ]);
  assert.deepEqual(plan.activeProjects.find(row => row.id === 'armor-a').missing, [
    { itemKey: 'mat_coal', name: 'Coal', quantity: 13 },
    { itemKey: 'mat_leather', name: 'Leather', quantity: 4 },
    { itemKey: 'mat_oriharukon', name: 'Oriharukon', quantity: 2 },
  ]);
});

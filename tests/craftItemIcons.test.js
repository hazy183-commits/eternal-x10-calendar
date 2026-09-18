import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
const items = JSON.parse(await readFile(new URL('../data/craft-items-snapshot.json', import.meta.url), 'utf8'));
const iconMap = JSON.parse(await readFile(new URL('../src/craftItemIconMap.json', import.meta.url), 'utf8'));

test('every real Craft Calculator item has a verified local Interlude icon', async () => {
  const realItems = items.filter(item => !item.item_key.startsWith('test_'));
  assert.equal(realItems.length, 311);
  assert.deepEqual(
    realItems.filter(item => !iconMap[item.item_key]).map(item => item.item_key),
    [],
  );

  for (const item of realItems) {
    const entry = iconMap[item.item_key];
    assert.ok(Number.isInteger(entry.game_item_id) && entry.game_item_id > 0, item.item_key);
    assert.match(entry.icon_file, /^[a-zA-Z0-9_.-]+\.png$/);
    assert.equal(entry.local_path, `/assets/interlude/icons/${entry.icon_file}`);
    await access(new URL(`../public${entry.local_path}`, import.meta.url));
  }
});

test('known formerly incorrect and ambiguous IDs resolve to original Interlude items', () => {
  assert.equal(iconMap.mat_animal_skin.game_item_id, 1867);
  assert.equal(iconMap.mat_leather.game_item_id, 1882);
  assert.equal(iconMap.mat_silver_mold.game_item_id, 1886);
  assert.equal(iconMap.weapon_a_branch_of_the_mother_tree.game_item_id, 213);
  assert.equal(iconMap.weapon_a_dasparions_staff.game_item_id, 212);
});

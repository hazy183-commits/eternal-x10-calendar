import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('weapon recipe seed covers every A/S weapon exactly once', async () => {
  const sql = await readFile(new URL('../supabase/craft_weapon_recipe_requirements.sql', import.meta.url), 'utf8');
  const firstBlock = sql.slice(0, sql.indexOf('insert into craft_items'));
  const rows = [...firstBlock.matchAll(/\('(weapon_[as]_[^']+)',(\d+)\)/g)]
    .map(match => ({ itemKey: match[1], recipeItemId: Number(match[2]) }));

  assert.equal(rows.length, 43);
  assert.equal(new Set(rows.map(row => row.itemKey)).size, 43);
  assert.equal(rows.filter(row => row.itemKey.startsWith('weapon_a_')).length, 33);
  assert.equal(rows.filter(row => row.itemKey.startsWith('weapon_s_')).length, 10);
  assert.match(sql, /component_item_key,quantity/);
  assert.match(sql, /'recipe_' \|\| source\.recipe_item_id, 1/);
});

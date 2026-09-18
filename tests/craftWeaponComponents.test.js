import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  VERIFIED_WEAPON_COMPONENTS,
  verifiedWeaponComponents,
} from '../src/craftWeaponComponents.js';

const RAW_SUBMATERIALS = new Set([
  'mat_animal_bone',
  'mat_animal_skin',
  'mat_charcoal',
  'mat_coal',
  'mat_iron_ore',
  'mat_leather',
  'mat_mithril_ore',
  'mat_oriharukon_ore',
  'mat_silver_nugget',
  'mat_stem',
  'mat_suede',
  'mat_thread',
  'mat_varnish',
]);

test('contains verified direct Interlude ingredients for every A/S weapon', () => {
  assert.equal(Object.keys(VERIFIED_WEAPON_COMPONENTS).length, 43);
  assert.equal(Object.keys(VERIFIED_WEAPON_COMPONENTS).filter(key => key.startsWith('weapon_a_')).length, 33);
  assert.equal(Object.keys(VERIFIED_WEAPON_COMPONENTS).filter(key => key.startsWith('weapon_s_')).length, 10);
});

test('Draconic Bow keeps the known-good direct recipe structure', () => {
  assert.deepEqual(verifiedWeaponComponents('weapon_s_draconic_bow'), [
    { itemKey: 'recipe_7580', quantity: 1 },
    { itemKey: 'mat_draconic_bow_shaft', quantity: 17 },
    { itemKey: 'mat_warsmith_holder', quantity: 4 },
    { itemKey: 'mat_mithril_alloy', quantity: 375 },
    { itemKey: 'mat_durable_metal_plate', quantity: 150 },
    { itemKey: 'mat_synthetic_cokes', quantity: 75 },
    { itemKey: 'mat_enria', quantity: 75 },
    { itemKey: 'mat_crystal_s_grade', quantity: 212 },
    { itemKey: 'mat_gemstone_s', quantity: 43 },
  ]);
});

test('raw submaterials are not duplicated on any weapon main recipe', () => {
  for (const [weaponKey, components] of Object.entries(VERIFIED_WEAPON_COMPONENTS)) {
    assert.equal(new Set(components.map(row => row.itemKey)).size, components.length, `${weaponKey}: duplicate component`);
    assert.ok(components.every(row => Number.isSafeInteger(row.quantity) && row.quantity > 0), `${weaponKey}: invalid quantity`);
    assert.deepEqual(
      components.filter(row => RAW_SUBMATERIALS.has(row.itemKey)),
      [],
      `${weaponKey}: raw submaterial leaked into the main recipe`,
    );
  }
});

test('returns a defensive copy and leaves unknown items to database recipes', () => {
  const first = verifiedWeaponComponents('weapon_s_angel_slayer');
  first[0].quantity = 999;
  assert.notEqual(verifiedWeaponComponents('weapon_s_angel_slayer')[0].quantity, 999);
  assert.equal(verifiedWeaponComponents('armor_s_sealed_major_arcana_robe'), null);
});

test('every verified component resolves to an existing Craft item', async () => {
  const snapshot = JSON.parse(await readFile(
    new URL('../data/craft-items-snapshot.json', import.meta.url),
    'utf8',
  ));
  const knownItemKeys = new Set(snapshot.map(row => row.item_key));

  for (const [weaponKey, components] of Object.entries(VERIFIED_WEAPON_COMPONENTS)) {
    assert.ok(knownItemKeys.has(weaponKey), `${weaponKey}: weapon is missing from Craft items`);
    for (const { itemKey } of components) {
      assert.ok(knownItemKeys.has(itemKey), `${weaponKey}: missing component ${itemKey}`);
    }
  }
});

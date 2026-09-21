import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { weapons, armors, jewels, augmentations, jewelrySlots, resolveWeapon, checkedEnchant, validateJewelry, readEquipment } from '../src/loadoutEquipment.js';

test('Interlude A/S weapon catalog includes all three SA and five duals', () => {
  assert.equal(weapons.length, 48);
  assert.equal(weapons.filter(x => x.dual).length, 5);
  for (const w of weapons) {
    assert.ok(['A','S'].includes(w.grade));
    assert.equal(w.sa.length, w.dual ? 0 : 3, w.name);
    assert.equal(new Set(w.sa.map(x=>x.id)).size,w.sa.length);
  }
  assert.deepEqual(weapons.find(x=>x.id===80).sa.map(x=>x.name),['Critical Poison','Haste','Anger']);
  assert.deepEqual(weapons.find(x=>x.id===212).sa.map(x=>x.name),['Mana Up','Conversion','Acumen']);
  assert.equal(resolveWeapon({weapon:'Angel Slayer · Critical Damage'}).id,6367);
  assert.equal(resolveWeapon({weapon:"Tallum Blade + Dark Legion's Edge"}).id,6580);
  assert.equal(resolveWeapon({weapon:'Homunkulus Sword · Acumen'}),undefined);
});
test('all catalog graphics exist and armor graphics are unsealed', async () => {
  assert.equal(armors.length,16);
  for(const item of [...weapons,...armors,...jewels]) await access(new URL('../public/assets/interlude/icons/'+item.icon,import.meta.url));
  for(const armor of armors) assert.match(armor.icon,/_i00\.png$/);
  assert.equal(jewels.filter(x=>x.epic).length,8);
  assert.equal(jewels.filter(x=>!x.epic).length,3);
});
test('five jewelry slots retain different enchants and reject wrong-slot items', () => {
  const selected={necklace:{itemId:8191,enchant:4},earring1:{itemId:6656,enchant:5},earring2:{itemId:858,enchant:6},ring1:{itemId:6658,enchant:7},ring2:{itemId:6660,enchant:8}};
  assert.deepEqual(validateJewelry(selected),selected);
  assert.equal(jewelrySlots.length,5);
  assert.throws(()=>validateJewelry({ring1:{itemId:8191,enchant:4}}));
  for(const n of [-1,31,1.5,'',NaN,'x'])assert.throws(()=>checkedEnchant(n));
  assert.equal(checkedEnchant('30'),30);
});
test('augmentation catalog covers active, passive and chance rolls with valid levels', () => {
  assert.equal(augmentations.length,172);
  assert.equal(new Set(augmentations.map(x=>x.id)).size,172);
  assert.equal(augmentations.find(x=>x.id===3133).kind,'active');
  assert.equal(augmentations.find(x=>x.id===3241).kind,'passive');
  assert.equal(augmentations.find(x=>x.id===3207).kind,'chance');
  assert.equal(augmentations.find(x=>x.id===3206).kind,'active');
  for(const a of augmentations)assert.ok(a.levels.length&&a.levels.every(n=>Number.isInteger(n)&&n>=1&&n<=10));
});
test('editing legacy equipment preserves unsupported labels and old jewelry until explicitly replaced', () => {
  const previous={weapon:'Homunkulus Sword · Acumen',armor:'Tallum Robe',weaponEnchant:10,armorEnchant:6,jewels:'Stary komplet',jewelsEnchant:7,fullEpic:true,augmentation:'stary efekt',customNote:'keep'};
  const card={dataset:{},querySelectorAll:()=>[],querySelector:()=>({value:''})};
  assert.deepEqual(readEquipment(card,previous),previous);
  card.dataset.augmentationDirty='true';
  assert.equal(readEquipment(card,previous).augmentation,'');
});

test('multiple augmentations retain levels and legacy text through save and reload', async () => {
  const {savedAugmentations, validateAugmentations, equipmentFields}=await import('../src/loadoutEquipment.js');
  const a=augmentations[0],b=augmentations[1];
  const values=[{id:a.id,level:a.levels[0]},{id:b.id,level:b.levels.at(-1)},{legacy:'stary efekt'}];
  const previous={weapon:'Angel Slayer',armor:'Tallum Robe',augmentation:'stary efekt'};
  const rows=values.map(v=>({dataset:{legacy:v.legacy||''},querySelector:s=>({value:s==='[data-augmentation-id]'?v.id||'':v.level||''})}));
  const card={dataset:{augmentationDirty:'true'},querySelectorAll:s=>s==='[data-augmentation-row]'?rows:[],querySelector:()=>({value:''})};
  const saved=JSON.parse(JSON.stringify(readEquipment(card,previous)));
  assert.deepEqual(saved.augmentations,values);
  assert.deepEqual(savedAugmentations(saved),values);
  assert.equal((equipmentFields(saved).match(/data-augmentation-row /g)||[]).length,3);
  assert.match(saved.augmentation,/stary efekt/);
  assert.deepEqual(savedAugmentations(previous),[{id:undefined,level:undefined,legacy:'stary efekt'}]);
  assert.throws(()=>validateAugmentations([{id:a.id,level:999}]));
  assert.throws(()=>validateAugmentations([{id:-1,level:1}]));
  rows.splice(0,rows.length);
  const cleared=readEquipment(card,saved);
  assert.deepEqual(cleared.augmentations,[]);
  assert.equal(cleared.augmentation,'');
  assert.deepEqual(savedAugmentations(cleared),[]);
});

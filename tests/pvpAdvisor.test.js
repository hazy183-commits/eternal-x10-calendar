import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('member profile supports multiple loadouts and shareable buff presets', async () => {
  const js = await readFile(new URL('../src/memberBuildProfiles.js', import.meta.url), 'utf8') + await readFile(new URL('../src/buffCatalog.js', import.meta.url), 'utf8');
  const sql = await readFile(new URL('../supabase/migrations/20260919120000_player_loadouts_and_buff_presets.sql', import.meta.url), 'utf8');
  assert.match(js, /DODAJ SUBCLASSĘ/);
  assert.match(js, /fullEpic/);
  assert.match(js, /SETUPY SPOŁECZNOŚCI/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /auth\.uid\(\)\) = user_id or is_shared/);
});

test('subclass editor uses visual equipment and buff pickers', async () => {
  const js = await readFile(new URL('../src/memberBuildProfiles.js', import.meta.url), 'utf8') + await readFile(new URL('../src/buffCatalog.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /Nazwa postaci<input/);
  assert.match(await readFile(new URL('../src/loadoutEquipment.js', import.meta.url), 'utf8'), /class="item-tile/);
  assert.match(js, /class="buff-choice/);
  assert.match(js, /buff-icons\/skill\$\{id\}\.png/);
  assert.match(js, /maksymalnie 24 buffy/);
  assert.match(js, /buffOrder\.push\(name\)/);
  assert.match(js, /const buffs=\[\.\.\.buffOrder\]/);
  assert.match(js, /data-order/);
  assert.match(js, /<details class="build-card loadout-card"/);
  assert.match(js, /data-buff-filter="songs"/);
  assert.match(js, /data-buff-filter="dances"/);
  assert.match(js, /data-buff-filter="prophecies"/);
  assert.match(js, /data-buff-filter="free"/);
  assert.match(js, /FREE_BUFFS=new Set\(\['Malaria','Flu'\]\)/);
  assert.match(js, /FREE_BUFFS\.has\(name\)\|\|slotCount\(buffOrder\)<24/);
  assert.match(js, /Malaria i Flu są poza limitem/);
  assert.match(js, /x\.hidden=category!==['"]all['"]&&x\.dataset\.category!==category/);
  for (const selfBuff of ['Dash','Focus Death','Mirage','Hawk Eye','Snipe','Rapid Fire','Dead Eye','Lionheart','Frenzy','Zealot','Ultimate Defense','Arcane Power']) {
    assert.match(js, new RegExp(`\\['${selfBuff}'`));
  }
  for (const song of ['Earth','Life','Water','Warding','Wind','Hunter','Invocation','Vitality','Storm Guard','Flame Guard','Meditation','Renewal','Vengeance','Champion']) {
    assert.match(js, new RegExp(`Song of ${song}`));
  }
  for (const dance of ['Warrior','Inspiration','Mystic','Fire','Fury','Concentration','Light','Aqua Guard','Earth Guard','Vampire','Protection','Siren']) {
    assert.match(js, new RegExp(`Dance of ${dance}`));
  }
  for (const id of ['0265','0266','0268','0305','0363','0364','0272','0277','0309','0310']) {
    await access(new URL(`../public/assets/interlude/buff-icons/skill${id}.png`, import.meta.url));
    assert.match(js, new RegExp(`'${id}'`));
  }
});

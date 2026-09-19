import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('PvP Advisor exposes matchup, profiles and Reborn effects', async () => {
  const html = await readFile(new URL('../public/pvp-advisor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../public/pvp-advisor.js', import.meta.url), 'utf8');
  assert.match(html, /id="playerClass"/);
  assert.match(html, /id="enemyClass"/);
  assert.match(html, /id="profileSelect"/);
  assert.match(html, /id="malaria"/);
  assert.match(html, /id="flu"/);
  assert.match(js, /Array\.from\(\{length:5\}/);
  assert.match(js, /slice\(0,24\)/);
});

test('complete profiles store enchant, epic jewelry and augment recommendations', async () => {
  const html = await readFile(new URL('../public/pvp-advisor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(html, /id="editSetup"/);
  assert.match(html, /id="setupForm"/);
  assert.match(js, /fullEpic/);
  assert.match(js, /Frintezza/);
  assert.match(js, /Antharas/);
  assert.match(js, /Queen Ant/);
  assert.match(js, /enchant\.weapon/);
  assert.match(js, /Rekomendowane augmentacje/);
  assert.match(js, /AUGMENTS\.length/);
});

test('Eternal overrides remove Acumen augments and prioritize song/dance resists', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /Passive: Acumen/);
  assert.doesNotMatch(js, /Active: Acumen/);
  assert.match(js, /Song of Flame Guard/);
  assert.match(js, /Dance of Aqua Guard/);
  assert.match(js, /hotSpringsNoSlot:true/);
  assert.match(js, /Core \(\+1 STR Eternal\)/);
  assert.match(js, /Orfen \(\+1 INT Eternal\)/);
  assert.match(js, /magicCritCap:'70%'/);
});

test('Noblesse is slot-free and Duelist reserves room for active effects', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(js, /noblesseNoSlot:true/);
  assert.match(js, /Duelist Spirit/);
  assert.match(js, /War Cry/);
  assert.match(js, /Sonic Move/);
  assert.match(js, /Sonic Barrier/);
  assert.match(js, /Celestial Shield \(augmentacja\)/);
  assert.match(js, /pierwszy do usunięcia/);
});

test('clan Discord guidance is encoded for documented classes', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  for (const id of ['SPS','NECRO','OL','HE','TH','BP','WL']) assert.match(js, new RegExp(`${id}:\\{gear:`));
  assert.match(js, /zdejmij Berserker Spirit/);
  assert.match(js, /zdejmij Wind Walk/);
  assert.match(js, /zdejmij Arcane Protection/);
  assert.match(js, /Magnus jest z reguły wybierany zamiast CoV/);
});

test('PvP presets omit Bless the Soul because Eternal has MP potions', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /Bless the Soul/);
});

test('legacy advisor does not render a duplicate buff setup', async () => {
  const js = await readFile(new URL('../public/pvp-advisor.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /<h3>Buff setup<\/h3>/);
});

test('class presets include one appropriate final prophecy or chant', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(js, /Prophecy of Water/);
  assert.match(js, /Prophecy of Wind/);
  assert.match(js, /Prophecy of Fire/);
  assert.match(js, /Chant of Victory/);
  assert.match(js, /Magnus' Chant/);
  assert.match(js, /nie nakładaj ich jednocześnie/);
});

test('every rendered buff includes a readable effect description', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(js, /const BUFF_DESCRIPTIONS=/);
  assert.match(js, /buffDescription\(b\)/);
  for (const buff of ['Acumen','Empower','Resist Shock','Song of Warding','Dance of Siren','Prophecy of Water']) {
    assert.match(js, new RegExp(`['"]${buff}['"]:`));
  }
});

test('buff planner fills every non-reserved slot', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(js, /target=24-reserve/);
  assert.match(js, /Math\.max\(0,target-important\.length\)/);
  assert.match(js, /const slots=\[\.\.\.low\.slice/);
});

test('buff cards use locally stored Lineage 2 skill icons', async () => {
  const js = await readFile(new URL('../public/pvp-profile-v2.js', import.meta.url), 'utf8');
  assert.match(js, /const BUFF_ICON_IDS=/);
  assert.match(js, /buff-icons\/skill\$\{id\}\.png/);
  for (const buff of ['Acumen','Dance of Siren','Prophecy of Water','Chant of Victory']) {
    assert.match(js, new RegExp(`['"]${buff}['"]:['"]\\d+['"]`));
  }
});

test('legacy inventory checkbox grid is removed in favor of full setup editor', async () => {
  const html = await readFile(new URL('../public/pvp-advisor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../public/pvp-advisor.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="inventoryGrid"/);
  assert.doesNotMatch(js, /data-item=/);
});

test('member profile supports multiple loadouts and shareable buff presets', async () => {
  const js = await readFile(new URL('../src/memberBuildProfiles.js', import.meta.url), 'utf8');
  const sql = await readFile(new URL('../supabase/migrations/20260919120000_player_loadouts_and_buff_presets.sql', import.meta.url), 'utf8');
  assert.match(js, /DODAJ SUBCLASSĘ/);
  assert.match(js, /fullEpic/);
  assert.match(js, /SETUPY SPOŁECZNOŚCI/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /auth\.uid\(\)\) = user_id or is_shared/);
});

test('subclass editor uses visual equipment and buff pickers', async () => {
  const js = await readFile(new URL('../src/memberBuildProfiles.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /Nazwa postaci<input/);
  assert.match(js, /class="item-tile/);
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

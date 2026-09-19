import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

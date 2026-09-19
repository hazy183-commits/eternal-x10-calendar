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

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAppearance, DEFAULT_APPEARANCE, randomAppearance, toggleBadge, profileCardMarkup, loadAppearance, saveAppearance } from '../src/profileAppearance.js';

test('untrusted identifiers and malformed values cannot inject URLs, CSS or HTML', () => {
  for (const value of [null, [], '<script>', { background: "url('evil')", frame: '" onclick="evil', ornament: '<script>', accent: 'red;display:none', effect: 'evil', intensity: Infinity, badges: ['pvp', '<script>', 'pvp', 'raid', 'flag', 'poland'] }]) {
    const look = normalizeAppearance(value);
    assert.equal(look.background, 'aden');
    const html = profileCardMarkup({ nickname: '<img src=x onerror=evil>', character_class: '<script>' }, look);
    assert.doesNotMatch(html, /onclick=|onerror=evil>|<script>|url\('evil/);
    assert.match(html, /&lt;img/);
    assert.ok(look.badges.length <= 3);
  }
});
test('defaults are independent, empty badges and zero intensity remain intentional', () => {
  const a = normalizeAppearance(); a.badges.push('raid');
  assert.deepEqual(normalizeAppearance().badges, ['clan']);
  assert.deepEqual(normalizeAppearance({ badges: [], intensity: 0 }).badges, []);
  assert.equal(normalizeAppearance({ intensity: -20 }).intensity, 0);
  assert.equal(normalizeAppearance({ intensity: 150 }).intensity, 100);
  assert.equal(normalizeAppearance({ intensity: '50' }).intensity, 50);
  assert.deepEqual(DEFAULT_APPEARANCE.badges, ['clan']);
});
test('badge selection respects limit, toggles and does not mutate original', () => {
  const original = ['pvp', 'raid', 'poland'];
  assert.deepEqual(toggleBadge(original, 'clan'), original);
  assert.deepEqual(toggleBadge(original, 'raid'), ['pvp', 'poland']);
  assert.deepEqual(toggleBadge([], 'flag'), ['flag']);
  assert.deepEqual(toggleBadge(original, 'invalid'), original);
  assert.deepEqual(original, ['pvp', 'raid', 'poland']);
});
test('random styles are valid and select three unique badges even with a constant RNG', () => {
  for (const rng of [() => 0, () => .999999, Math.random]) for (let i = 0; i < 30; i++) {
    const look = randomAppearance(rng);
    assert.deepEqual(normalizeAppearance(look), look);
    assert.equal(new Set(look.badges).size, 3);
    assert.notEqual(look.ornament, 'none');
  }
});
function client({ user = { id: 'mine' }, row = null, error = null } = {}) {
  const state = { row, writes: [], reads: [] };
  return { state, auth: { getUser: async () => ({ data: { user } }) }, from: table => ({
    select: fields => ({ eq: (key, value) => ({ maybeSingle: async () => { state.reads.push({ table, fields, key, value }); return { data: state.row, error }; } }) }),
    upsert: (payload, options) => {
      state.writes.push({ table, payload, options });
      return { select: () => ({ single: async () => { if (!error) state.row = payload; return { data: error ? null : payload, error }; } }) };
    },
  }) };
}
test('save persists validated choices under the authenticated ID and reload returns same appearance', async () => {
  const db = client();
  const input = { ...DEFAULT_APPEARANCE, ornament: 'ice', badges: ['pvp', 'raid'], user_id: 'someone-else' };
  const saved = await saveAppearance(db, 'mine', input);
  assert.equal(db.state.writes[0].payload.user_id, 'mine');
  assert.equal(db.state.writes[0].options.onConflict, 'user_id');
  assert.deepEqual(await loadAppearance(db, 'mine'), saved);
  assert.equal(db.state.reads[0].value, 'mine');
});
test('signed out or switched account cannot save the old user draft', async () => {
  for (const user of [null, { id: 'other' }]) {
    const db = client({ user });
    await assert.rejects(saveAppearance(db, 'mine', DEFAULT_APPEARANCE), /Sesja/);
    assert.equal(db.state.writes.length, 0);
  }
});
test('missing row is default; read/write failures remain failures rather than fake success', async () => {
  assert.deepEqual(await loadAppearance(client(), 'mine'), normalizeAppearance());
  const db = client({ error: new Error('network down') });
  await assert.rejects(loadAppearance(db, 'mine'), /network/);
  await assert.rejects(saveAppearance(db, 'mine', DEFAULT_APPEARANCE), /Nie udało się zapisać/);
});

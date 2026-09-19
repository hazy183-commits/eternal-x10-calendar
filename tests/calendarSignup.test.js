import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveCalendarSignup } from '../src/calendarSignup.js';

function client({ user = { id: 'member-1' }, fail = false } = {}) {
  const rows = new Map();
  const calls = [];
  return { rows, calls, auth: { getUser: async () => ({ data: { user } }) },
    from(table) {
      if (table === 'profiles') return { select: () => ({ eq: (_, id) => {
        assert.equal(id, user.id);
        return { maybeSingle: async () => ({ data: { nickname: 'Orzel', character_class: 'Bishop', character_level: 80 } }) };
      } }) };
      return { upsert(row, options) {
        calls.push({ row, options });
        return { select: () => ({ single: async () => {
          if (fail) return { error: new Error('RLS denied') };
          rows.set(`${row.event_id || row.schedule_key}:${row.user_id}`, row);
          return { data: row };
        } }) };
      } };
    },
  };
}
for (const id of ['42', 'boss-respawn-queen-ant-2099-01-01']) {
  test(`saves and replaces own answer for ${id}`, async () => {
    const db = client(); const event = { id, endAt: '2099-01-01T20:00:00Z' };
    await saveCalendarSignup(db, event, 'yes');
    const row = await saveCalendarSignup(db, event, 'maybe');
    assert.equal(db.rows.size, 1);
    assert.equal(row.response, 'maybe');
    assert.equal(row.user_id, 'member-1');
    assert.equal(row.character_class, 'Bishop');
    assert.equal(db.calls[0].options.onConflict, id === '42' ? 'event_id,user_id' : 'schedule_key,user_id');
  });
}
test('rejects signed-out, expired, invalid and failed writes', async () => {
  const event = { id: '42', endAt: '2099-01-01T20:00:00Z' };
  const guest = client({ user: null });
  await assert.rejects(saveCalendarSignup(guest, event, 'yes'), /Zaloguj/);
  assert.equal(guest.calls.length, 0);
  await assert.rejects(saveCalendarSignup(client(), { ...event, endAt: '2020-01-01' }, 'yes'), /zakończyło/);
  await assert.rejects(saveCalendarSignup(client(), { ...event, endAt: 'invalid' }, 'yes'), /zakończyło/);
  await assert.rejects(saveCalendarSignup(client(), event, 'other'), /Nieprawidłowa/);
  const failed = client({ fail: true });
  await assert.rejects(saveCalendarSignup(failed, event, 'yes'), /Nie udało/);
  assert.equal(failed.rows.size, 0);
});

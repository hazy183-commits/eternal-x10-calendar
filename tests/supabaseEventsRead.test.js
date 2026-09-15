import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Isolate the real read adapter from Vite env and the live Supabase client.
const source = readFileSync(new URL('../src/supabaseEvents.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');

async function read(result, disconnected = false) {
  const calls = [];
  const client = {};
  for (const method of ['schema', 'from', 'select', 'order']) {
    client[method] = (...args) => { calls.push([method, ...args]); return client; };
  }
  client.abortSignal = async () => {
    if (result instanceof Error) throw result;
    return result;
  };
  const context = vm.createContext({ supabase: disconnected ? null : client, AbortSignal, console: { info() {} } });
  vm.runInContext(source, context);
  // Exercise the read adapter, not the repository's separate Clan Hall schedule.
  const data = await vm.runInContext('readSupabaseEvents()', context) ?? [];
  return { data: JSON.parse(JSON.stringify(data)), calls };
}

test('empty, unavailable, denied and invalid reads return no fabricated events', async () => {
  for (const result of [{ data: [] }, { error: { code: '42501' } }, { data: [{ id: 'bad' }] }, new Error('offline')]) {
    const { data, calls } = await read(result);
    assert.deepEqual(data, []);
    assert.deepEqual(calls.map(([method]) => method), ['schema', 'from', 'select', 'order', 'order']);
  }
  assert.deepEqual((await read(null, true)).data, []);
});

test('real rows still normalize correctly and the repository performs only SELECT', async () => {
  const { data, calls } = await read({ data: [{ id: 21, name: 'Zebranie', type: 'EVENT', event_date: '2026-09-14', event_time: '20:00:00', duration_minutes: 30 }] });
  assert.deepEqual(data, [{ id: '21', name: 'Zebranie', type: 'Event', date: '2026-09-14', time: '20:00', duration: 30, location: '', description: '' }]);
  assert.deepEqual(calls.slice(0, 3), [['schema', 'public'], ['from', 'events'], ['select', '*']]);
});

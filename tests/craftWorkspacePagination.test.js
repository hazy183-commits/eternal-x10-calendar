import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllRows } from '../src/craftWorkspace.js';

test('loads recipe components beyond the Supabase 1000 row response limit', async () => {
  const source = Array.from({ length: 1048 }, (_, index) => ({ id: index + 1 }));
  const calls = [];
  const rows = await fetchAllRows(() => ({
    async range(from, to) {
      calls.push([from, to]);
      return { data: source.slice(from, to + 1), error: null };
    },
  }), 500);

  assert.equal(rows.length, 1048);
  assert.deepEqual(calls, [[0, 499], [500, 999], [1000, 1499]]);
  assert.equal(rows.at(-1).id, 1048);
});

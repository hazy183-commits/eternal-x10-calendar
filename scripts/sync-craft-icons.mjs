import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('../', import.meta.url);
const API = 'https://l2api.dev/api/interlude';
const ICONS = 'https://l2api.dev/icons';
const items = JSON.parse(await readFile(new URL('../data/craft-items-snapshot.json', import.meta.url), 'utf8'));
const outputDir = new URL('../public/assets/interlude/icons/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = value => String(value || '')
  .toLowerCase()
  .replace(/[’`]/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function getJson(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'OrzelBialyCraftIconSync/1.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(attempt * 300);
    }
  }
  throw lastError;
}

async function findExactItem(name) {
  const query = encodeURIComponent(name.replace(/^Recipe:\s*/i, '').replace(/\s*\(\d+%\)\s*$/i, ''));
  const payload = await getJson(`${API}/items?q=${query}&limit=100`);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.filter(row => norm(row.name) === norm(name));
}

async function loadItem(row) {
  const expectedType = row.category === 'weapon' ? 'weapon' : row.category === 'armor' ? 'armor' : 'etcitem';
  const exact = (await findExactItem(row.name)).filter(item => item.type === expectedType);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1 && row.category === 'weapon') {
    const details = await Promise.all(exact.map(item => getJson(`${API}/items/${item.id}`).then(payload => payload?.data)));
    const craftable = details.filter(item => item?.craftedBy?.length && norm(item.name) === norm(row.name));
    if (craftable.length === 1) return craftable[0];
  }
  if (row.game_item_id) {
    const payload = await getJson(`${API}/items/${row.game_item_id}`);
    const item = payload?.data;
    if (!item || Number(item.id) !== Number(row.game_item_id)) return null;
    return item;
  }
  return null;
}

const mapping = {};
const unresolved = [];
const mismatched = [];
for (const [index, row] of items.entries()) {
  if (row.item_key.startsWith('test_')) continue;
  let item;
  try {
    item = await loadItem(row);
  } catch (error) {
    unresolved.push({ ...row, error: String(error) });
    continue;
  }
  if (!item?.id || !item?.iconFile) {
    unresolved.push(row);
    continue;
  }
  if (row.game_item_id && norm(item.name) !== norm(row.name)) {
    mismatched.push({ ...row, api_name: item.name, api_id: item.id });
  }
  const iconFile = path.basename(item.iconFile);
  const localFile = `/assets/interlude/icons/${iconFile}`;
  const response = await fetch(`${ICONS}/${encodeURIComponent(iconFile)}`);
  if (!response.ok) {
    unresolved.push({ ...row, resolved_id: item.id, iconFile, error: `icon ${response.status}` });
    continue;
  }
  await writeFile(new URL(`../public/assets/interlude/icons/${iconFile}`, import.meta.url), Buffer.from(await response.arrayBuffer()));
  mapping[row.item_key] = {
    game_item_id: Number(item.id),
    icon_file: iconFile,
    local_path: localFile,
  };
  if ((index + 1) % 25 === 0) process.stdout.write(`Resolved ${index + 1}/${items.length}\n`);
}

await writeFile(new URL('../src/craftItemIconMap.json', import.meta.url), `${JSON.stringify(mapping, null, 2)}\n`);
const updates = Object.entries(mapping)
  .filter(([key, value]) => Number(items.find(row => row.item_key === key)?.game_item_id || 0) !== value.game_item_id)
  .map(([key, value]) => `  ('${key.replaceAll("'", "''")}', ${value.game_item_id})`)
  .join(',\n');
const sql = updates
  ? `begin;\n\ncreate temporary table craft_item_icon_ids (\n  item_key text primary key,\n  game_item_id integer not null unique\n) on commit drop;\n\ninsert into craft_item_icon_ids (item_key, game_item_id) values\n${updates};\n\nupdate public.craft_items as item\nset game_item_id = null, updated_at = now()\nfrom craft_item_icon_ids as source\nwhere item.item_key = source.item_key\n  and item.game_item_id is distinct from source.game_item_id;\n\nupdate public.craft_items as item\nset game_item_id = source.game_item_id, updated_at = now()\nfrom craft_item_icon_ids as source\nwhere item.item_key = source.item_key\n  and item.game_item_id is distinct from source.game_item_id;\n\ncommit;\n`
  : '-- No missing game_item_id values were resolved.\n';
await writeFile(new URL('../supabase/craft_item_icon_ids.sql', import.meta.url), sql);

console.log(JSON.stringify({ mapped: Object.keys(mapping).length, unresolved: unresolved.length, mismatched: mismatched.length }, null, 2));

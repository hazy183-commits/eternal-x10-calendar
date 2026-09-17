const RAW = 'https://raw.githubusercontent.com/tichopad/L2J_Mobius/master/L2J_Mobius_CT_0_Interlude/dist/game/data';

const wanted = [
  'sealed_dark_crystal_', 'sealed_tallum_', 'sealed_leather_mail_of_nightmare', 'sealed_robe_of_nightmare',
  'sealed_armor_of_nightmare', 'sealed_shield_of_nightmare', 'sealed_helm_of_nightmare', 'sealed_gauntlet_of_nightmare', 'sealed_boots_of_nightmare',
  'sealed_majestic_', 'sealed_imperial_crusader_', 'sealed_draconic_leather_', 'sealed_major_arcana_'
];

const wantedRecipe = name => name.endsWith('_i') && wanted.some(prefix => name.includes(prefix));

async function text(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'OrzelBialyCraft/1.0' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function parseRecipes(xml) {
  const out = [];
  const rx = /<item\s+id="(\d+)"\s+recipeId="(\d+)"\s+name="([^"]+)"\s+craftLevel="(\d+)"\s+type="dwarven"\s+successRate="60">([\s\S]*?)<\/item>/g;
  for (const m of xml.matchAll(rx)) {
    const name = m[3];
    if (!wantedRecipe(name)) continue;
    const body = m[5];
    const ingredients = [...body.matchAll(/<ingredient\s+id="(\d+)"\s+count="(\d+)"\s*\/>/g)]
      .map(x => ({ id: Number(x[1]), quantity: Number(x[2]) }))
      .filter(x => x.id !== Number(m[2]));
    const prod = body.match(/<production\s+id="(\d+)"\s+count="(\d+)"\s*\/>/);
    if (!prod) continue;
    out.push({
      dataId: Number(m[1]), recipeItemId: Number(m[2]), internalName: name,
      craftLevel: Number(m[4]), successRate: 60,
      outputId: Number(prod[1]), outputQuantity: Number(prod[2]), ingredients
    });
  }
  return out;
}

function rangeFile(id) {
  const start = Math.floor(id / 100) * 100;
  const end = start + 99;
  return `${String(start).padStart(5, '0')}-${String(end).padStart(5, '0')}.xml`;
}

function parseItemNames(xml, ids) {
  const map = new Map();
  for (const id of ids) {
    const rx = new RegExp(`<item\\s+id="${id}"[^>]*?name="([^"]+)"`, 'i');
    const m = xml.match(rx);
    if (m) map.set(id, m[1].replace(/&apos;/g, "'").replace(/&amp;/g, '&'));
  }
  return map;
}

function grade(name) {
  return /Imperial Crusader|Draconic Leather|Major Arcana/i.test(name) ? 'S' : 'A';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const recipesXml = await text(`${RAW}/Recipes.xml`);
    const recipes = parseRecipes(recipesXml);
    const ids = new Set();
    for (const recipe of recipes) {
      ids.add(recipe.outputId);
      for (const ing of recipe.ingredients) ids.add(ing.id);
    }
    const grouped = new Map();
    for (const id of ids) {
      const file = rangeFile(id);
      if (!grouped.has(file)) grouped.set(file, []);
      grouped.get(file).push(id);
    }
    const names = new Map();
    await Promise.all([...grouped.entries()].map(async ([file, fileIds]) => {
      const xml = await text(`${RAW}/stats/items/${file}`);
      for (const [id, name] of parseItemNames(xml, fileIds)) names.set(id, name);
    }));
    const result = recipes.map(r => ({
      ...r,
      name: names.get(r.outputId) || r.internalName,
      grade: grade(names.get(r.outputId) || r.internalName),
      ingredients: r.ingredients.map(i => ({ ...i, name: names.get(i.id) || `Item ${i.id}` }))
    }));
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ count: result.length, recipes: result });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

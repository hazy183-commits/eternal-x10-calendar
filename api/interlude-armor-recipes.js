const RAW = 'https://raw.githubusercontent.com/tichopad/L2J_Mobius/master/L2J_Mobius_CT_0_Interlude/dist/game/data';

const finalArmorRx = /^(Sealed )?(Dark Crystal|Tallum|Majestic|Imperial Crusader|Draconic Leather|Major Arcana)|^Sealed (Armor|Leather Armor|Robe|Shield|Helm|Gauntlets|Boots) of Nightmare/i;
const gradeFor = name => /Imperial Crusader|Draconic Leather|Major Arcana/i.test(name) ? 'S' : 'A';

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
    if (!name.endsWith('_i') || !name.includes('sealed_')) continue;
    const body = m[5];
    const ingredients = [...body.matchAll(/<ingredient\s+id="(\d+)"\s+count="(\d+)"\s*\/>/g)]
      .map(x => ({ id: Number(x[1]), quantity: Number(x[2]) }))
      .filter(x => x.id !== Number(m[2]));
    const prod = body.match(/<production\s+id="(\d+)"\s+count="(\d+)"\s*\/>/);
    if (!prod) continue;
    out.push({ dataId:Number(m[1]), recipeItemId:Number(m[2]), internalName:name, craftLevel:Number(m[4]), successRate:60, outputId:Number(prod[1]), outputQuantity:Number(prod[2]), ingredients });
  }
  return out;
}

function rangeFile(id) {
  const start = Math.floor(id / 100) * 100;
  return `${String(start).padStart(5,'0')}-${String(start+99).padStart(5,'0')}.xml`;
}

function parseItemNames(xml, ids) {
  const map = new Map();
  for (const id of ids) {
    const m = xml.match(new RegExp(`<item\\s+id="${id}"[^>]*?name="([^"]+)"`, 'i'));
    if (m) map.set(id, m[1].replace(/&apos;/g,"'").replace(/&amp;/g,'&'));
  }
  return map;
}

const tidyName = name => String(name || '')
  .replace(/\bbreastplate\b/g, 'Breastplate')
  .replace(/\bGlove$/g, 'Gloves')
  .replace(/\bGauntlet$/g, 'Gauntlets');

const slug = value => String(value || '').toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const sqlText = value => `'${String(value ?? '').replaceAll("'", "''")}'`;
const armorKey = recipe => `armor_${recipe.grade.toLowerCase()}_${slug(recipe.name)}`;
const materialKey = name => `mat_${slug(name.replace(/-Grade/gi, ' Grade'))}`;

function buildSql(recipes) {
  const itemMap = new Map();
  for (const r of recipes) {
    const outKey = armorKey(r);
    itemMap.set(outKey, { key: outKey, id:r.outputId, name:r.name, grade:r.grade, category:'armor', stackable:false });
    for (const i of r.ingredients) {
      const key = materialKey(i.name);
      if (!itemMap.has(key)) itemMap.set(key, { key, id:i.id, name:i.name.replace(/-Grade/gi, ' Grade'), grade:null, category:'material', stackable:true });
    }
  }
  const items = [...itemMap.values()];
  const itemValues = items.map(i => `(${sqlText(i.key)},${i.id},${sqlText(i.name)},${i.grade ? sqlText(i.grade) : 'NULL'},${sqlText(i.category)},${i.stackable ? 'true':'false'},true,now())`).join(',\n');
  const recipeValues = recipes.map(r => `(${sqlText(armorKey(r))},1,'Interlude 60%',true,true,now())`).join(',\n');
  const componentValues = recipes.flatMap(r => r.ingredients.map(i => `(${sqlText(armorKey(r))},${sqlText(materialKey(i.name))},${i.quantity})`)).join(',\n');
  return `begin;\n\ndelete from craft_recipe_components where recipe_id in (select id from craft_recipes where output_item_key like 'armor_a_%' or output_item_key like 'armor_s_%');\ndelete from craft_recipes where output_item_key like 'armor_a_%' or output_item_key like 'armor_s_%';\n\ninsert into craft_items (item_key,game_item_id,name,grade,category,stackable,active,updated_at) values\n${itemValues}\non conflict (item_key) do update set game_item_id=excluded.game_item_id,name=excluded.name,grade=excluded.grade,category=excluded.category,stackable=excluded.stackable,active=true,updated_at=now();\n\ninsert into craft_recipes (output_item_key,output_quantity,label,is_primary,active,updated_at) values\n${recipeValues};\n\ninsert into craft_recipe_components (recipe_id,component_item_key,quantity)\nselect r.id,v.component_item_key,v.quantity\nfrom (values\n${componentValues}\n) as v(output_item_key,component_item_key,quantity)\njoin craft_recipes r on r.output_item_key=v.output_item_key and r.label='Interlude 60%' and r.is_primary=true and r.active=true;\n\ncommit;`;
}

export default async function handler(req,res) {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const xml = await text(`${RAW}/Recipes.xml`);
    const rawRecipes = parseRecipes(xml);
    const outputIds = new Set(rawRecipes.map(r=>r.outputId));
    const outputGroups = new Map();
    for (const id of outputIds) { const f=rangeFile(id); if(!outputGroups.has(f)) outputGroups.set(f,[]); outputGroups.get(f).push(id); }
    const outputNames = new Map();
    await Promise.all([...outputGroups.entries()].map(async ([file,ids])=>{
      const itemXml=await text(`${RAW}/stats/items/${file}`);
      for (const [id,name] of parseItemNames(itemXml,ids)) outputNames.set(id,name);
    }));
    const recipes = rawRecipes.filter(r=>finalArmorRx.test(outputNames.get(r.outputId)||''));
    const ids = new Set();
    for (const r of recipes) { ids.add(r.outputId); for (const i of r.ingredients) ids.add(i.id); }
    const groups = new Map();
    for (const id of ids) { const f=rangeFile(id); if(!groups.has(f)) groups.set(f,[]); groups.get(f).push(id); }
    const names = new Map();
    await Promise.all([...groups.entries()].map(async ([file,fileIds])=>{
      const itemXml=await text(`${RAW}/stats/items/${file}`);
      for (const [id,name] of parseItemNames(itemXml,fileIds)) names.set(id,name);
    }));
    const result = recipes.map(r=>({ ...r, name:tidyName(names.get(r.outputId)||r.internalName), grade:gradeFor(names.get(r.outputId)||r.internalName), ingredients:r.ingredients.map(i=>({...i,name:names.get(i.id)||`Item ${i.id}`})) }));
    if (String(req.query?.format || '').toLowerCase() === 'sql') {
      res.setHeader('content-type','text/plain; charset=utf-8');
      return res.status(200).send(buildSql(result));
    }
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({count:result.length,recipes:result});
  } catch(e) { return res.status(500).json({error:e?.message||String(e)}); }
}

const PMFUN = 'https://lineage.pmfun.com';

const armorMatchers = [
  /^Sealed Dark Crystal /i,
  /^Sealed Tallum /i,
  /^Sealed (?:Armor|Boots|Gauntlets|Helm|Leather Armor|Nightmare Robe|Shield) of Nightmare/i,
  /^Sealed Majestic /i,
  /^Sealed Imperial Crusader /i,
  /^Sealed Draconic Leather /i,
  /^Sealed Major Arcana /i,
];

const decode = value => String(value || '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#039;|&#39;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const strip = html => decode(String(html || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim());

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; OrzelBialyCraft/1.0; +https://orzelbialy.eu)',
      'accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`PMfun HTTP ${response.status} for ${url}`);
  return await response.text();
}

function isWantedArmorRecipe(name) {
  if (!/\(60%\)/i.test(name)) return false;
  const clean = name.replace(/^Recipe:\s*/i, '').replace(/\s*\(60%\)\s*$/i, '').trim();
  return armorMatchers.some(rx => rx.test(clean));
}

function gradeFor(name) {
  return /Imperial Crusader|Draconic Leather|Major Arcana/i.test(name) ? 'S' : 'A';
}

function categoryFor(name) {
  if (/Shield/i.test(name)) return 'shield';
  if (/Boots/i.test(name)) return 'boots';
  if (/Gloves|Gauntlets/i.test(name)) return 'gloves';
  if (/Helmet|Helm|Circlet/i.test(name)) return 'helmet';
  if (/Gaiters|Leggings|Stockings/i.test(name)) return 'legs';
  if (/Robe|Tunic/i.test(name)) return 'robe';
  if (/Leather Armor/i.test(name)) return 'light';
  return 'heavy';
}

function parseRecipeLinks(html) {
  const found = [];
  for (const match of String(html).matchAll(/<a[^>]+href=["']([^"']*\/list\/recipe\/(\d+)\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = strip(match[3]);
    if (!isWantedArmorRecipe(label)) continue;
    found.push({ id: Number(match[2]), label, href: new URL(match[1], PMFUN).href });
  }
  const byId = new Map();
  for (const row of found) byId.set(row.id, row);
  return [...byId.values()];
}

function parseMaterialPairs(fragment) {
  const rows = [];
  const imgRe = /<img[^>]+alt=["']([^"']+)["'][^>]*>[\s\S]{0,180}?(?:<a[^>]*>)?\s*([\d,]+)\s*([^<\n\r]{0,120})/gi;
  for (const m of String(fragment).matchAll(imgRe)) {
    const alt = strip(m[1]);
    const qty = Number(String(m[2]).replace(/,/g, ''));
    if (!alt || !Number.isFinite(qty) || qty <= 0) continue;
    const candidate = strip(m[3]);
    const name = candidate && !/^Image$/i.test(candidate) ? candidate.replace(/^x\s*/i, '').trim() : alt;
    rows.push({ name: name || alt, quantity: qty });
  }
  return rows;
}

function parseTotals(html) {
  const raw = String(html || '');
  const idx = raw.search(/Totals\s*:/i);
  if (idx < 0) return [];
  const tail = raw.slice(idx, Math.min(raw.length, idx + 22000));
  let rows = parseMaterialPairs(tail);

  // Fallback: derive material/qty from item links and nearby plain text.
  if (rows.length < 3) {
    rows = [];
    for (const m of tail.matchAll(/<a[^>]+href=["'][^"']*\/item\/\d+[^"']*["'][^>]*>([\s\S]*?)<\/a>[\s\S]{0,80}?([\d,]+)/gi)) {
      const name = strip(m[1]);
      const quantity = Number(String(m[2]).replace(/,/g, ''));
      if (name && Number.isFinite(quantity) && quantity > 0) rows.push({ name, quantity });
    }
  }

  const merged = new Map();
  for (const row of rows) {
    if (/^Recipe:/i.test(row.name)) continue;
    const key = row.name.toLowerCase();
    if (!merged.has(key) || row.quantity > merged.get(key).quantity) merged.set(key, row);
  }
  return [...merged.values()];
}

function parseTitle(html, fallback) {
  const h1 = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1 ? strip(h1[1]) : fallback;
  return title.replace(/\s*-\s*Lineage 2.*$/i, '').replace(/^Recipe:\s*/i, '').replace(/\s*\(60%\).*$/i, '').trim();
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) break;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const levels = await Promise.all([7, 8, 9].map(async level => ({
      level,
      html: await fetchText(`${PMFUN}/list/recipe/l${level}`),
    })));
    const links = levels.flatMap(({ html }) => parseRecipeLinks(html));
    const unique = [...new Map(links.map(row => [row.id, row])).values()].sort((a,b) => a.id - b.id);

    const recipes = await mapLimit(unique, 6, async link => {
      const url = `${link.href}${link.href.includes('?') ? '&' : '?'}v=interlude`;
      try {
        const html = await fetchText(url);
        const name = parseTitle(html, link.label);
        return {
          recipeId: link.id,
          name,
          grade: gradeFor(name),
          slot: categoryFor(name),
          rate: 60,
          sourceUrl: url,
          totals: parseTotals(html),
        };
      } catch (error) {
        return { recipeId: link.id, name: link.label, error: error?.message || String(error), totals: [] };
      }
    });

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return response.status(200).json({ count: recipes.length, recipes });
  } catch (error) {
    return response.status(502).json({ error: error?.message || String(error) });
  }
}

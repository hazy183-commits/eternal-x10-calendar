const PMFUN = 'https://lineage.pmfun.com';
const SET_HINTS = ['dark crystal', 'tallum', 'nightmare', 'majestic'];

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

const norm = value => strip(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; OrzelBialyCraft/1.0; +https://orzelbialy.eu)',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`PMfun HTTP ${response.status}`);
  return response.text();
}

function slugKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractRecipeLinks(html) {
  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']*\/list\/recipe\/(\d+)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const found = new Map();
  for (const match of links) {
    const label = strip(match[3]);
    const lower = label.toLowerCase();
    if (!lower.includes('recipe: sealed')) continue;
    if (!lower.includes('(60%)')) continue;
    if (!SET_HINTS.some(hint => lower.includes(hint))) continue;
    const url = new URL(match[1], PMFUN);
    url.searchParams.set('v', 'interlude');
    found.set(Number(match[2]), { recipeId: Number(match[2]), label, url: url.href });
  }
  return [...found.values()];
}

function extractOutputName(html) {
  const match = String(html || '').match(/<h1[^>]*>\s*Recipe:\s*([\s\S]*?)\(60%\)[\s\S]*?<\/h1>/i);
  if (match) return strip(match[1]).replace(/\s*-\s*Lineage 2.*$/i, '').trim();
  const title = strip(String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  return title.replace(/^Recipe:\s*/i, '').replace(/\(60%\).*$/i, '').replace(/\s*-\s*Lineage 2.*$/i, '').trim();
}

function parseTotalLi(text) {
  const clean = strip(text).replace(/^Image:\s*/i, '').trim();
  if (!clean || /^Recipe:/i.test(clean)) return null;
  const matches = [...clean.matchAll(/\b(\d+)\b/g)];
  for (const match of matches) {
    const qty = Number(match[1]);
    const before = clean.slice(0, match.index).trim();
    const after = clean.slice(match.index + match[1].length).trim();
    if (!before || !after || !qty) continue;
    const a = norm(before);
    const b = norm(after);
    if (a === b || a.endsWith(b) || b.endsWith(a)) return { name: after, quantity: qty };
  }
  return null;
}

function parseTotals(html) {
  const marker = String(html || '').search(/Totals:\s*/i);
  if (marker < 0) return [];
  const tail = String(html || '').slice(marker);
  const ulStart = tail.search(/<ul\b/i);
  if (ulStart < 0) return [];
  const fromUl = tail.slice(ulStart);
  const ulEnd = fromUl.search(/<\/ul>/i);
  const block = ulEnd >= 0 ? fromUl.slice(0, ulEnd + 5) : fromUl.slice(0, 12000);
  const items = [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(match => parseTotalLi(match[1]))
    .filter(Boolean);
  const merged = new Map();
  for (const item of items) merged.set(item.name, Math.max(merged.get(item.name) || 0, item.quantity));
  return [...merged.entries()].map(([name, quantity]) => ({ name, quantity }));
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const listPages = await Promise.all([
      fetchText(`${PMFUN}/list/recipe/l7`),
      fetchText(`${PMFUN}/list/recipe/l8`),
    ]);
    const links = [...extractRecipeLinks(listPages[0]), ...extractRecipeLinks(listPages[1])];
    const unique = [...new Map(links.map(row => [row.recipeId, row])).values()];
    const recipes = [];
    for (const link of unique) {
      const html = await fetchText(link.url);
      const outputName = extractOutputName(html);
      const totals = parseTotals(html);
      if (!outputName || !totals.length) continue;
      recipes.push({
        recipeId: link.recipeId,
        outputName,
        outputKey: `armor_a_${slugKey(outputName)}`,
        label: 'Interlude 60%',
        sourceUrl: link.url,
        totals,
      });
    }
    recipes.sort((a, b) => a.outputName.localeCompare(b.outputName));
    response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return response.status(200).json({ count: recipes.length, recipes });
  } catch (error) {
    return response.status(502).json({ error: error?.message || String(error) });
  }
}

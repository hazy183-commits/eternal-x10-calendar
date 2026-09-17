const PMFUN = 'https://lineage.pmfun.com';

const KNOWN_ITEM_IDS = new Map(Object.entries({
  'stem': 1864,
  'varnish': 1865,
  'suede': 1866,
  'thread': 1868,
  'iron ore': 1869,
  'coal': 1870,
  'charcoal': 1871,
  'animal bone': 1872,
  'silver nugget': 1873,
  'oriharukon ore': 1874,
  'stone of purity': 1875,
  'mithril ore': 1876,
  'adamantite nugget': 1877,
  'braided hemp': 1878,
  'cokes': 1879,
  'steel': 1880,
  'coarse bone powder': 1881,
  'high grade suede': 1885,
  'varnish of purity': 1887,
  'synthetic cokes': 1888,
  'compound braid': 1889,
  'mithril alloy': 1890,
  "artisan's frame": 1891,
  'mold glue': 4039,
  'mold lubricant': 4040,
  'mold hardener': 4041,
  'enria': 4042,
  'craftsman mold': 4047,
  'durable metal plate': 5550,
  'halberd edge': 5542,
  "dasparion's staff edge": 5543,
  'branch of the mother tree head': 5544,
  "dark legion's edge blade": 5545,
  'sword of miracles edge': 5546,
  'tallum blade edge': 5548,
  'elysian head': 5533,
  'soul bow stave': 5534,
  'bloody orchid head': 5536,
  'tallum glaive edge': 5541,
  'meteor shower head': 5532,
  'angel slayer blade': 6691,
  'dragon hunter axe blade': 6693,
  'saint spear blade': 6694,
  'demon splinter blade': 6695,
  'heavens divider edge': 6696,
  'arcana mace head': 6697,
  'imperial staff head': 6690,
  'draconic bow shaft': 7579,
  'flaming dragon skull piece': 8342,
  'spiritual eye piece': 8341,
  "sirra's blade edge": 8712,
  'naga storm piece': 8716,
  "shyeed's bow shaft": 8718,
}));

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

const norm = value => strip(value)
  .toLowerCase()
  .replace(/[’`]/g, "'")
  .replace(/[^a-z0-9']+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const slugify = value => norm(value).replace(/'/g, '').replace(/\s+/g, '-');

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; OrzelBialyCraft/1.0; +https://orzelbialy.eu)',
      'accept': 'text/html,application/xhtml+xml',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) throw new Error(`PMfun HTTP ${response.status}`);
  return { text: await response.text(), url: response.url };
}

function findItemLink(html, wantedName) {
  const wanted = norm(wantedName);
  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']*\/item\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  let best = null;
  for (const match of links) {
    const label = norm(match[3]);
    if (!label) continue;
    const exact = label === wanted;
    const contains = label.includes(wanted) || wanted.includes(label);
    if (!exact && !contains) continue;
    const score = exact ? 1000 : Math.min(label.length, wanted.length);
    if (!best || score > best.score) best = { score, href: match[1], id: Number(match[2]) };
  }
  return best;
}

async function resolveItem(name) {
  const knownId = KNOWN_ITEM_IDS.get(norm(name));
  if (knownId) {
    return {
      id: knownId,
      url: `${PMFUN}/item/${knownId}/${slugify(name)}.html`,
      resolvedBy: 'known-id',
    };
  }

  const homepage = await fetchText(`${PMFUN}/`);
  const forms = [...homepage.text.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];
  const candidates = [];

  for (const form of forms) {
    const attrs = form[1] || '';
    const body = form[2] || '';
    const text = norm(body);
    if (!/search|database/.test(text) && !/search/.test(attrs.toLowerCase())) continue;
    const actionMatch = attrs.match(/action=["']([^"']*)["']/i);
    const methodMatch = attrs.match(/method=["']([^"']*)["']/i);
    const method = (methodMatch?.[1] || 'GET').toUpperCase();
    const inputs = [...body.matchAll(/<input\b([^>]*)>/gi)].map(match => {
      const raw = match[1] || '';
      const nameMatch = raw.match(/name=["']([^"']+)["']/i);
      const typeMatch = raw.match(/type=["']([^"']+)["']/i);
      const valueMatch = raw.match(/value=["']([^"']*)["']/i);
      return { name: nameMatch?.[1], type: (typeMatch?.[1] || 'text').toLowerCase(), value: valueMatch?.[1] || '' };
    }).filter(input => input.name);
    const queryInput = inputs.find(input => ['text','search'].includes(input.type)) || inputs.find(input => !['submit','image','hidden'].includes(input.type));
    if (!queryInput) continue;
    const base = new URL(actionMatch?.[1] || '/', PMFUN);
    const params = new URLSearchParams();
    for (const input of inputs) if (input.type === 'hidden' && input.value) params.set(input.name, input.value);
    params.set(queryInput.name, name);
    candidates.push({ base, params, method });
  }

  for (const candidate of candidates) {
    try {
      let page;
      if (candidate.method === 'POST') {
        page = await fetchText(candidate.base, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: candidate.params.toString(),
        });
      } else {
        candidate.base.search = candidate.params.toString();
        page = await fetchText(candidate.base);
      }
      const found = findItemLink(page.text, name);
      if (found) return { id: found.id, url: new URL(found.href, PMFUN).href, resolvedBy: 'pmfun-search' };
    } catch {}
  }

  throw new Error(`Nie udało się znaleźć materiału „${name}” w PMfun.`);
}

function extractTitle(html) {
  const h1 = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1) return '';
  return strip(h1[1]).replace(/\s*-\s*Lineage 2.*$/i, '').trim();
}

function extractSection(html, label, nextLabel) {
  const source = String(html || '');
  const startRe = new RegExp(`(?:>|^)\\s*${label}\\s*(?:<|$)`, 'i');
  const start = startRe.exec(source);
  if (!start) return '';
  const from = start.index + start[0].length;
  if (!nextLabel) return source.slice(from);
  const rest = source.slice(from);
  const nextRe = new RegExp(`(?:>|^)\\s*${nextLabel}\\s*(?:<|$)`, 'i');
  const next = nextRe.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function parseSectionRows(sectionHtml, method) {
  const rows = [];
  const trMatches = [...String(sectionHtml || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const trMatch of trMatches) {
    const tr = trMatch[1] || '';
    const npcMatch = tr.match(/<a[^>]+href=["']([^"']*\/npc\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!npcMatch) continue;

    const npcName = strip(npcMatch[3]);
    if (!npcName) continue;

    const cells = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(match => strip(match[1]))
      .filter(Boolean);
    const text = strip(tr);
    const levelMatch = npcName
      ? text.match(new RegExp(`${npcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)`, 'i'))
      : null;
    const level = levelMatch ? Number(levelMatch[1]) : (text.match(/\((\d+)\)/)?.[1] ? Number(text.match(/\((\d+)\)/)[1]) : null);
    const type = cells.find(cell => /^(passive|aggressive)$/i.test(cell)) || '';
    const chanceCell = [...cells].reverse().find(cell => /(?:\d+(?:\.\d+)?%|1\s*\/\s*\d+)/i.test(cell)) || '';
    let quantity = '';
    if (chanceCell) {
      const chanceIndex = cells.lastIndexOf(chanceCell);
      if (chanceIndex > 0) quantity = cells[chanceIndex - 1] || '';
    }
    if (!quantity) quantity = [...cells].reverse().find(cell => /^\d+(?:\s*-\s*\d+)?$/i.test(cell)) || '';

    rows.push({
      method,
      npcId: Number(npcMatch[2]),
      npcName,
      level,
      type,
      quantity,
      chance: chanceCell,
      npcUrl: new URL(npcMatch[1], PMFUN).href,
      mapUrl: null,
      likelyInterlude: level == null ? true : level <= 80,
    });
  }

  const seen = new Set();
  return rows.filter(row => {
    const key = [row.method,row.npcId,row.npcName,row.level,row.type,row.quantity,row.chance].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseRows(html) {
  const dropSection = extractSection(html, 'Drop', 'Spoil');
  const spoilSection = extractSection(html, 'Spoil', null);
  const dropRows = parseSectionRows(dropSection, 'drop');
  const spoilRows = parseSectionRows(spoilSection, 'spoil');

  // Fallback for alternate PMfun markup where labels live inside table rows.
  if (dropRows.length || spoilRows.length) return [...dropRows, ...spoilRows];

  const rows = [];
  let mode = null;
  for (const trMatch of String(html || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tr = trMatch[1] || '';
    const text = strip(tr);
    if (/^drop$/i.test(text)) { mode = 'drop'; continue; }
    if (/^spoil$/i.test(text)) { mode = 'spoil'; continue; }
    if (!mode) continue;
    rows.push(...parseSectionRows(`<table><tr>${tr}</tr></table>`, mode));
  }
  return rows;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const name = String(request.query?.name || '').trim();
  const explicitId = Number(request.query?.id || 0);
  if (!name && !explicitId) return response.status(400).json({ error: 'Brak nazwy lub ID materiału.' });

  try {
    const resolved = explicitId > 0
      ? { id: explicitId, url: `${PMFUN}/item/${explicitId}`, resolvedBy: 'explicit-id' }
      : await resolveItem(name);
    const itemPage = await fetchText(resolved.url);
    const rows = parseRows(itemPage.text);
    const title = extractTitle(itemPage.text) || name;

    response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return response.status(200).json({
      source: 'PMfun',
      sourceUrl: itemPage.url,
      itemId: resolved.id,
      resolvedBy: resolved.resolvedBy,
      title,
      rows,
      counts: {
        drop: rows.filter(row => row.method === 'drop').length,
        spoil: rows.filter(row => row.method === 'spoil').length,
        likelyInterlude: rows.filter(row => row.likelyInterlude).length,
      },
      note: 'Lista jest parsowana bezpośrednio ze strony itemu PMfun. Filtr Lv <= 80 jest tylko pomocniczy i nie zastępuje pełnej weryfikacji kroniki.',
    });
  } catch (error) {
    return response.status(502).json({ error: error?.message || String(error) });
  }
}

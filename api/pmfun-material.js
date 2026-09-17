const PMFUN = 'https://lineage.pmfun.com';

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
    const score = exact ? 100 : Math.min(label.length, wanted.length);
    if (!best || score > best.score) best = { score, href: match[1], id: Number(match[2]) };
  }
  return best;
}

async function resolveItem(name) {
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

  // Fallback candidates cover older versions of the PMfun search form.
  if (!candidates.length) {
    for (const key of ['q', 's', 'search', 'query', 'name']) {
      const base = new URL('/', PMFUN);
      const params = new URLSearchParams({ [key]: name });
      candidates.push({ base, params, method: 'GET' });
    }
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
      if (found) return { id: found.id, url: new URL(found.href, PMFUN).href };
    } catch {}
  }

  throw new Error(`Nie udało się znaleźć materiału „${name}” w PMfun.`);
}

function extractTitle(html) {
  const h1 = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1) return '';
  return strip(h1[1]).replace(/\s*-\s*Lineage 2.*$/i, '').trim();
}

function parseRows(html, itemUrl) {
  const rows = [];
  let mode = null;
  const trs = [...String(html || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const trMatch of trs) {
    const tr = trMatch[1] || '';
    const text = strip(tr);
    if (!text) continue;
    if (/^drop$/i.test(text)) { mode = 'drop'; continue; }
    if (/^spoil$/i.test(text)) { mode = 'spoil'; continue; }
    if (!mode) continue;

    const npcMatch = tr.match(/<a[^>]+href=["']([^"']*\/npc\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!npcMatch) continue;
    const npcName = strip(npcMatch[3]);
    if (!npcName) continue;

    const cells = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => strip(match[1])).filter(Boolean);
    const joined = cells.join(' | ');
    const levelMatch = joined.match(new RegExp(`${npcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)`, 'i')) || text.match(/\((\d+)\)/);
    const level = levelMatch ? Number(levelMatch[1]) : null;

    const type = cells.find(cell => /^(passive|aggressive)$/i.test(cell)) || '';
    const chanceCell = [...cells].reverse().find(cell => /%|1\s*\/\s*\d+/i.test(cell)) || '';
    let quantity = '';
    if (chanceCell) {
      const chanceIndex = cells.lastIndexOf(chanceCell);
      if (chanceIndex > 0) quantity = cells[chanceIndex - 1] || '';
    }
    if (!quantity) {
      quantity = [...cells].reverse().find(cell => /^\d+(?:\s*-\s*\d+)?$/i.test(cell)) || '';
    }

    const mapLinkMatch = tr.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*<img[^>]+(?:map|location)/i)
      || tr.match(/<a[^>]+href=["']([^"']*(?:map|loc)[^"']*)["']/i);

    rows.push({
      method: mode,
      npcId: Number(npcMatch[2]),
      npcName,
      level,
      type,
      quantity,
      chance: chanceCell,
      npcUrl: new URL(npcMatch[1], PMFUN).href,
      mapUrl: mapLinkMatch ? new URL(mapLinkMatch[1], PMFUN).href : null,
      likelyInterlude: level == null ? true : level <= 80,
    });
  }

  // Keep distinct PMfun rows: same mob can legitimately appear more than once with different rates.
  const seen = new Set();
  return rows.filter(row => {
    const key = [row.method,row.npcId,row.npcName,row.level,row.type,row.quantity,row.chance].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const name = String(request.query?.name || '').trim();
  const explicitId = Number(request.query?.id || 0);
  if (!name && !explicitId) return response.status(400).json({ error: 'Brak nazwy lub ID materiału.' });

  try {
    const resolved = explicitId > 0
      ? { id: explicitId, url: `${PMFUN}/item/${explicitId}` }
      : await resolveItem(name);
    const itemPage = await fetchText(resolved.url);
    const rows = parseRows(itemPage.text, itemPage.url);
    const title = extractTitle(itemPage.text) || name;

    response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return response.status(200).json({
      source: 'PMfun',
      sourceUrl: itemPage.url,
      itemId: resolved.id,
      title,
      rows,
      counts: {
        drop: rows.filter(row => row.method === 'drop').length,
        spoil: rows.filter(row => row.method === 'spoil').length,
        likelyInterlude: rows.filter(row => row.likelyInterlude).length,
      },
      note: 'PMfun łączy dane z wielu kronik. likelyInterlude oznacza wyłącznie podstawowy filtr poziomu NPC <= 80 i nie jest pełną gwarancją kroniki.',
    });
  } catch (error) {
    return response.status(502).json({ error: error?.message || String(error) });
  }
}

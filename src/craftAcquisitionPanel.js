const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const fmtChance = value => value == null ? '—' : `${Number(value).toLocaleString('pl-PL', { maximumFractionDigits: 4 })}%`;
const fmtQty = row => {
  const min = Number(row.min_quantity || 0);
  const max = Number(row.max_quantity || 0);
  if (!min && !max) return '—';
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(max || min);
};

function ensureStyles() {
  if (document.querySelector('#craftAcquisitionStyles')) return;
  const style = document.createElement('style');
  style.id = 'craftAcquisitionStyles';
  style.textContent = `
    .craft-tree-name b,.craft-inventory-row>div b{cursor:pointer;text-decoration:underline;text-decoration-color:#6c5127;text-underline-offset:3px}.craft-tree-name b:hover,.craft-inventory-row>div b:hover{color:#f0c766}
    .craft-acq-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10050;display:none;align-items:center;justify-content:center;padding:18px}.craft-acq-overlay.is-open{display:flex}
    .craft-acq-modal{width:min(1120px,97vw);max-height:90vh;overflow:auto;border:1px solid #66502a;background:#080c0c;box-shadow:0 22px 70px rgba(0,0,0,.65)}
    .craft-acq-head{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px;border-bottom:1px solid #3f321f;background:#0a0f0f}.craft-acq-head small{color:#a98a4c;font-size:9px;letter-spacing:.1em}.craft-acq-head h3{margin:3px 0 0;color:#eadab5;font:700 22px Georgia}.craft-acq-close{border:1px solid #765925;background:#18130b;color:#e5bd65;width:36px;height:36px;font-size:20px;cursor:pointer}
    .craft-acq-body{padding:16px;display:grid;gap:14px}.craft-acq-note{padding:12px;border:1px solid #33291c;color:#8f897f;font-size:11px;line-height:1.55}.craft-acq-note b{color:#d7c59b}
    .craft-acq-tools{display:grid;grid-template-columns:minmax(220px,1fr) 220px;gap:10px}.craft-acq-tools input,.craft-acq-tools select{padding:10px 12px;border:1px solid #4d3d26;background:#070b0b;color:#ddd}
    .craft-acq-stats{display:flex;gap:8px;flex-wrap:wrap}.craft-acq-stat{border:1px solid #40331f;background:#0f0d09;color:#caae72;padding:6px 9px;font-size:10px}
    .craft-acq-group{border:1px solid #3a2e1d}.craft-acq-group>summary{cursor:pointer;list-style:none;padding:11px 12px;background:#12100c;color:#d4b56b;font-weight:900;font-size:11px;letter-spacing:.08em}.craft-acq-group>summary::-webkit-details-marker{display:none}.craft-acq-list{display:grid}
    .craft-acq-row{display:grid;grid-template-columns:minmax(170px,1.1fr) 62px minmax(180px,1fr) 92px 86px minmax(150px,.8fr);gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #282117}.craft-acq-row b{color:#d9d3c7;font-size:12px}.craft-acq-row span{color:#8c857b;font-size:10px}.craft-acq-row strong{color:#d8bd7f;font-size:11px;text-align:right}.craft-acq-row a{color:#e5bd65;font-size:10px;text-decoration:none;white-space:nowrap}.craft-acq-empty{padding:16px;color:#80796f;font-size:11px}
    .craft-acq-location{display:grid;gap:2px}.craft-acq-location b{font-size:11px;color:#c9b17a}.craft-acq-location small{font-size:9px;color:#736c61}.craft-acq-map-thumb{max-width:150px;max-height:90px;border:1px solid #4b3a22;margin-top:6px}.craft-acq-actions{display:flex;gap:7px;flex-wrap:wrap}.craft-acq-actions a{display:inline-block;padding:6px 8px;border:1px solid #594522;background:#151109}
    @media(max-width:760px){.craft-acq-tools{grid-template-columns:1fr}.craft-acq-row{grid-template-columns:1fr auto}.craft-acq-row>span,.craft-acq-location,.craft-acq-actions{grid-column:1/-1}.craft-acq-row strong{text-align:left}.craft-acq-modal{max-height:94vh}}
  `;
  document.head.appendChild(style);
}

function ensureModal() {
  let overlay = document.querySelector('#craftAcquisitionOverlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'craftAcquisitionOverlay';
  overlay.className = 'craft-acq-overlay';
  overlay.innerHTML = `
    <section class="craft-acq-modal" role="dialog" aria-modal="true" aria-labelledby="craftAcqTitle">
      <div class="craft-acq-head">
        <div><small>WŁASNA BAZA · INTERLUDE</small><h3 id="craftAcqTitle">Materiał</h3></div>
        <button class="craft-acq-close" type="button" aria-label="Zamknij">×</button>
      </div>
      <div class="craft-acq-body"><div class="craft-acq-note">Ładowanie…</div></div>
    </section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', event => {
    if (event.target === overlay || event.target.closest('.craft-acq-close')) overlay.classList.remove('is-open');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') overlay.classList.remove('is-open');
  });
  return overlay;
}

function normalizeLocation(row) {
  const loc = row.craft_locations || null;
  return {
    key: loc?.location_key || row.location_key || '',
    name: loc?.name || row.location || 'Brak przypisanej lokacji',
    region: loc?.region || '',
    mapUrl: loc?.map_url || loc?.wiki_url || '',
    mapImageUrl: loc?.map_image_url || '',
  };
}

function rowHtml(row) {
  const loc = normalizeLocation(row);
  const sourceUrl = row.source_url || '';
  const locationKey = escapeHtml(loc.key || loc.name.toLowerCase());
  return `<div class="craft-acq-row" data-craft-acq-name="${escapeHtml(String(row.monster_name || '').toLowerCase())}" data-craft-acq-location="${locationKey}">
    <b>${escapeHtml(row.monster_name || 'Nieznany mob')}</b>
    <strong>Lv. ${row.monster_level ?? '—'}</strong>
    <div class="craft-acq-location"><b>${escapeHtml(loc.name)}</b>${loc.region ? `<small>${escapeHtml(loc.region)}</small>` : ''}${loc.mapImageUrl ? `<img class="craft-acq-map-thumb" src="${escapeHtml(loc.mapImageUrl)}" alt="Mapa ${escapeHtml(loc.name)}">` : ''}</div>
    <strong>${fmtChance(row.chance_percent)}</strong>
    <strong>x${fmtQty(row)}</strong>
    <div class="craft-acq-actions">
      ${loc.mapUrl ? `<a href="${escapeHtml(loc.mapUrl)}" target="_blank" rel="noopener noreferrer">Mapa ↗</a>` : ''}
      ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Źródło ↗</a>` : ''}
    </div>
  </div>`;
}

function groupHtml(method, rows) {
  const label = method === 'drop' ? 'DROP' : 'SPOIL';
  return `<details class="craft-acq-group" open data-craft-acq-group="${method}"><summary>${label} · <span data-craft-acq-count>${rows.length}</span> wpisów</summary><div class="craft-acq-list">${rows.length ? rows.map(rowHtml).join('') : '<div class="craft-acq-empty">Brak zweryfikowanych wpisów.</div>'}</div></details>`;
}

function applyClientFilters(body) {
  const search = (body.querySelector('[data-craft-acq-search]')?.value || '').trim().toLowerCase();
  const location = body.querySelector('[data-craft-acq-location-filter]')?.value || '';
  body.querySelectorAll('.craft-acq-row').forEach(row => {
    const byName = !search || (row.dataset.craftAcqName || '').includes(search);
    const byLocation = !location || row.dataset.craftAcqLocation === location;
    row.hidden = !(byName && byLocation);
  });
  body.querySelectorAll('[data-craft-acq-group]').forEach(group => {
    const visible = [...group.querySelectorAll('.craft-acq-row')].filter(row => !row.hidden).length;
    const counter = group.querySelector('[data-craft-acq-count]');
    if (counter) counter.textContent = String(visible);
  });
}

export function installCraftAcquisitionPanel(supabase) {
  if (!supabase || document.documentElement.dataset.craftAcqInstalled === '1') return;
  document.documentElement.dataset.craftAcqInstalled = '1';
  ensureStyles();
  const overlay = ensureModal();
  const title = overlay.querySelector('#craftAcqTitle');
  const body = overlay.querySelector('.craft-acq-body');

  const openForName = async name => {
    title.textContent = name;
    body.innerHTML = '<div class="craft-acq-note">Pobieram zweryfikowane dane Interlude z naszej bazy…</div>';
    overlay.classList.add('is-open');

    try {
      const { data: items, error: itemError } = await supabase.from('craft_items').select('item_key,name').eq('name', name).limit(1);
      if (itemError) throw itemError;
      const item = items?.[0];
      if (!item) throw new Error('Nie znaleziono materiału w bazie craftu.');

      const { data: rows, error } = await supabase
        .from('craft_acquisition_sources')
        .select('item_key,method,monster_name,monster_level,location,location_key,chance_percent,min_quantity,max_quantity,source_url,source_name,verified,craft_locations(location_key,name,region,wiki_url,map_url,map_image_url,verified)')
        .eq('item_key', item.item_key)
        .eq('active', true)
        .eq('verified', true)
        .order('method')
        .order('chance_percent', { ascending: false });
      if (error) throw error;

      const all = rows || [];
      const drops = all.filter(row => row.method === 'drop');
      const spoils = all.filter(row => row.method === 'spoil');
      const locations = [...new Map(all.map(row => {
        const loc = normalizeLocation(row);
        return [loc.key || loc.name.toLowerCase(), loc];
      })).entries()];

      body.innerHTML = `
        <div class="craft-acq-note">Pokazuję wyłącznie rekordy oznaczone jako <b>zweryfikowane dla Lineage 2 Interlude</b>. Baza jest nasza i będzie uzupełniana materiał po materiale; brak wpisu oznacza brak zweryfikowanych danych, a nie brak dropu/spoila w grze.</div>
        <div class="craft-acq-tools">
          <input type="search" data-craft-acq-search placeholder="Szukaj moba…">
          <select data-craft-acq-location-filter><option value="">Wszystkie lokacje</option>${locations.map(([key, loc]) => `<option value="${escapeHtml(key)}">${escapeHtml(loc.name)}</option>`).join('')}</select>
        </div>
        <div class="craft-acq-stats"><span class="craft-acq-stat">DROP: ${drops.length}</span><span class="craft-acq-stat">SPOIL: ${spoils.length}</span><span class="craft-acq-stat">Lokacje: ${locations.length}</span></div>
        ${groupHtml('drop', drops)}
        ${groupHtml('spoil', spoils)}
        ${all.length ? '' : '<div class="craft-acq-note">Ten materiał nie ma jeszcze zweryfikowanych wpisów w naszej bazie Interlude.</div>'}`;
      applyClientFilters(body);
    } catch (error) {
      body.innerHTML = `<div class="craft-acq-note">Nie udało się pobrać danych: ${escapeHtml(error?.message || error)}</div>`;
    }
  };

  body.addEventListener('input', () => applyClientFilters(body));
  body.addEventListener('change', () => applyClientFilters(body));

  document.addEventListener('click', event => {
    if (event.target.closest?.('.craft-tree-arrow')) return;
    const treeName = event.target.closest?.('.craft-tree-name b');
    const inventoryName = event.target.closest?.('.craft-inventory-row>div b');
    const target = treeName || inventoryName;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    openForName(target.textContent.trim());
  }, true);
}

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function ensureStyles() {
  if (document.querySelector('#craftAcquisitionStyles')) return;
  const style = document.createElement('style');
  style.id = 'craftAcquisitionStyles';
  style.textContent = `
    .craft-tree-name b,.craft-inventory-row>div b{cursor:pointer;text-decoration:underline;text-decoration-color:#6c5127;text-underline-offset:3px}.craft-tree-name b:hover,.craft-inventory-row>div b:hover{color:#f0c766}
    .craft-acq-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10050;display:none;align-items:center;justify-content:center;padding:18px}.craft-acq-overlay.is-open{display:flex}
    .craft-acq-modal{width:min(1120px,97vw);max-height:90vh;overflow:auto;border:1px solid #66502a;background:#080c0c;box-shadow:0 22px 70px rgba(0,0,0,.65)}
    .craft-acq-head{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px;border-bottom:1px solid #3f321f;background:#0a0f0f}.craft-acq-head small{color:#a98a4c;font-size:9px;letter-spacing:.1em}.craft-acq-head h3{margin:3px 0 0;color:#eadab5;font:700 22px Georgia}.craft-acq-close{border:1px solid #765925;background:#18130b;color:#e5bd65;width:36px;height:36px;font-size:20px;cursor:pointer}
    .craft-acq-body{padding:16px;display:grid;gap:14px}.craft-acq-note{padding:12px;border:1px solid #33291c;color:#8f897f;font-size:11px;line-height:1.55}.craft-acq-note b{color:#d7c59b}.craft-acq-tools{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;align-items:center}.craft-acq-tools input{padding:10px 12px;border:1px solid #4d3d26;background:#070b0b;color:#ddd}.craft-acq-tools label{display:flex;gap:7px;align-items:center;color:#b9ad94;font-size:10px;white-space:nowrap}
    .craft-acq-stats{display:flex;gap:8px;flex-wrap:wrap}.craft-acq-stat{border:1px solid #40331f;background:#0f0d09;color:#caae72;padding:6px 9px;font-size:10px}.craft-acq-group{border:1px solid #3a2e1d}.craft-acq-group>summary{cursor:pointer;list-style:none;padding:11px 12px;background:#12100c;color:#d4b56b;font-weight:900;font-size:11px;letter-spacing:.08em}.craft-acq-group>summary::-webkit-details-marker{display:none}.craft-acq-list{display:grid}.craft-acq-row{display:grid;grid-template-columns:minmax(190px,1.15fr) 62px 95px 95px 95px auto;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #282117}.craft-acq-row.is-post-interlude{opacity:.5}.craft-acq-row b{color:#d9d3c7;font-size:12px}.craft-acq-row span{color:#8c857b;font-size:10px}.craft-acq-row strong{color:#d8bd7f;font-size:11px;text-align:right}.craft-acq-row a{color:#e5bd65;font-size:10px;text-decoration:none;white-space:nowrap}.craft-acq-empty{padding:16px;color:#80796f;font-size:11px}.craft-acq-links{display:flex;gap:8px;flex-wrap:wrap}.craft-acq-links a{display:inline-block;padding:8px 10px;border:1px solid #5f4825;color:#e5bd65;text-decoration:none;font-size:10px;background:#151109}
    @media(max-width:760px){.craft-acq-tools{grid-template-columns:1fr}.craft-acq-row{grid-template-columns:1fr auto auto}.craft-acq-row b{grid-column:1/-1}.craft-acq-row span{grid-column:1/-1}.craft-acq-row strong{text-align:left}.craft-acq-row a{grid-column:1/-1;justify-self:start}.craft-acq-modal{max-height:94vh}}
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
        <div><small>GDZIE ZDOBYĆ · PMFUN</small><h3 id="craftAcqTitle">Materiał</h3></div>
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

function rowHtml(row) {
  const links = [
    row.npcUrl ? `<a href="${escapeHtml(row.npcUrl)}" target="_blank" rel="noopener noreferrer">NPC ↗</a>` : '',
    row.mapUrl ? `<a href="${escapeHtml(row.mapUrl)}" target="_blank" rel="noopener noreferrer">Mapa ↗</a>` : '',
  ].filter(Boolean).join(' · ');
  return `<div class="craft-acq-row${row.likelyInterlude === false ? ' is-post-interlude' : ''}" data-craft-acq-name="${escapeHtml(String(row.npcName || '').toLowerCase())}" data-craft-acq-interlude="${row.likelyInterlude !== false ? '1' : '0'}">
    <b>${escapeHtml(row.npcName || 'Nieznany mob')}</b>
    <strong>Lv. ${row.level ?? '—'}</strong>
    <span>${escapeHtml(row.type || '—')}</span>
    <strong>${escapeHtml(row.quantity || '—')}</strong>
    <strong>${escapeHtml(row.chance || '—')}</strong>
    <span>${links}</span>
  </div>`;
}

function groupHtml(method, rows) {
  const label = method === 'drop' ? 'DROP' : 'SPOIL';
  return `<details class="craft-acq-group" open data-craft-acq-group="${method}"><summary>${label} · <span data-craft-acq-count>${rows.length}</span> wpisów</summary><div class="craft-acq-list">${rows.length ? rows.map(rowHtml).join('') : '<div class="craft-acq-empty">Brak wpisów w PMfun.</div>'}</div></details>`;
}

function applyClientFilters(body) {
  const search = (body.querySelector('[data-craft-acq-search]')?.value || '').trim().toLowerCase();
  const interludeOnly = body.querySelector('[data-craft-acq-interlude-only]')?.checked !== false;

  body.querySelectorAll('.craft-acq-row').forEach(row => {
    const matchesName = !search || (row.dataset.craftAcqName || '').includes(search);
    const matchesChronicle = !interludeOnly || row.dataset.craftAcqInterlude === '1';
    row.hidden = !(matchesName && matchesChronicle);
  });

  body.querySelectorAll('[data-craft-acq-group]').forEach(group => {
    const visible = [...group.querySelectorAll('.craft-acq-row')].filter(row => !row.hidden).length;
    const counter = group.querySelector('[data-craft-acq-count]');
    if (counter) counter.textContent = String(visible);
  });
}

async function loadFallbackSupabase(supabase, name) {
  const { data: items, error: itemError } = await supabase.from('craft_items').select('item_key,name').eq('name', name).limit(1);
  if (itemError) throw itemError;
  const item = items?.[0];
  if (!item) return [];
  const { data, error } = await supabase.from('craft_acquisition_sources').select('*').eq('item_key', item.item_key).eq('active', true).order('method').order('chance_percent', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    method: row.method,
    npcName: row.monster_name,
    level: row.monster_level,
    type: '',
    quantity: row.min_quantity && row.max_quantity && row.min_quantity !== row.max_quantity ? `${row.min_quantity}-${row.max_quantity}` : String(row.max_quantity || row.min_quantity || ''),
    chance: row.chance_percent == null ? '' : `${row.chance_percent}%`,
    npcUrl: row.source_url || null,
    mapUrl: null,
    likelyInterlude: row.monster_level == null ? true : Number(row.monster_level) <= 80,
  }));
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
    body.innerHTML = '<div class="craft-acq-note">Pobieram pełną listę Drop/Spoil z PMfun…</div>';
    overlay.classList.add('is-open');

    try {
      let payload = null;
      let source = 'PMfun';
      try {
        const response = await fetch(`/api/pmfun-material?name=${encodeURIComponent(name)}`, { headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        payload = await response.json();
        if (!Array.isArray(payload?.rows)) throw new Error(payload?.error || 'Nieprawidłowa odpowiedź PMfun.');
      } catch (pmfunError) {
        const fallbackRows = await loadFallbackSupabase(supabase, name);
        payload = { rows: fallbackRows, sourceUrl: 'https://lineage.pmfun.com/', counts: { drop: fallbackRows.filter(r => r.method === 'drop').length, spoil: fallbackRows.filter(r => r.method === 'spoil').length }, error: pmfunError?.message || String(pmfunError) };
        source = 'lokalna kopia awaryjna';
      }

      const all = payload.rows || [];
      const drops = all.filter(row => row.method === 'drop');
      const spoils = all.filter(row => row.method === 'spoil');
      const over80 = all.filter(row => row.likelyInterlude === false).length;

      body.innerHTML = `
        <div class="craft-acq-note">
          Źródło: <b>${escapeHtml(source)}</b>. PMfun agreguje dane z kilku kronik, więc domyślnie ukrywam moby <b>powyżej Lv. 80</b>. To praktyczny filtr pod Interlude, ale nie stanowi stuprocentowej gwarancji kroniki dla każdego pojedynczego moba. ${over80 ? `Ukrytych wpisów Lv. 81+: <b>${over80}</b>.` : ''}
        </div>
        <div class="craft-acq-tools">
          <input type="search" data-craft-acq-search placeholder="Szukaj moba…">
          <label><input type="checkbox" data-craft-acq-interlude-only checked> Pokaż tylko Lv. ≤ 80</label>
        </div>
        <div class="craft-acq-stats">
          <span class="craft-acq-stat">DROP: ${drops.length}</span>
          <span class="craft-acq-stat">SPOIL: ${spoils.length}</span>
          <span class="craft-acq-stat">Łącznie: ${all.length}</span>
        </div>
        ${groupHtml('drop', drops)}
        ${groupHtml('spoil', spoils)}
        ${all.length ? '' : '<div class="craft-acq-note">Nie znaleziono danych dla tego materiału.</div>'}
        <div class="craft-acq-links">
          ${payload.sourceUrl ? `<a href="${escapeHtml(payload.sourceUrl)}" target="_blank" rel="noopener noreferrer">Otwórz materiał w PMfun ↗</a>` : ''}
          <a href="https://lineage.pmfun.com/" target="_blank" rel="noopener noreferrer">PMfun ↗</a>
          <a href="https://lineage2wiki.org/interlude/" target="_blank" rel="noopener noreferrer">Lineage2Wiki Interlude ↗</a>
        </div>`;
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

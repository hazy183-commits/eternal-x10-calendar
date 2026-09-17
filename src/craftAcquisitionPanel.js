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
    .craft-tree-name b,.craft-inventory-row>div b{cursor:pointer;text-decoration:underline;text-decoration-color:#6c5127;text-underline-offset:3px}.craft-tree-name b:hover,.craft-inventory-row>div b:hover{color:#f0c766}.craft-acq-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:10050;display:none;align-items:center;justify-content:center;padding:18px}.craft-acq-overlay.is-open{display:flex}.craft-acq-modal{width:min(920px,96vw);max-height:86vh;overflow:auto;border:1px solid #66502a;background:#080c0c;box-shadow:0 22px 70px rgba(0,0,0,.65)}.craft-acq-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px;border-bottom:1px solid #3f321f;background:#0a0f0f}.craft-acq-head small{color:#a98a4c;font-size:9px;letter-spacing:.1em}.craft-acq-head h3{margin:3px 0 0;color:#eadab5;font:700 22px Georgia}.craft-acq-close{border:1px solid #765925;background:#18130b;color:#e5bd65;width:36px;height:36px;font-size:20px;cursor:pointer}.craft-acq-body{padding:16px;display:grid;gap:16px}.craft-acq-note{padding:12px;border:1px solid #33291c;color:#8f897f;font-size:11px;line-height:1.5}.craft-acq-group{border:1px solid #3a2e1d}.craft-acq-group-title{padding:10px 12px;background:#12100c;color:#d4b56b;font-weight:900;font-size:11px;letter-spacing:.08em}.craft-acq-row{display:grid;grid-template-columns:minmax(180px,1.2fr) 70px minmax(180px,1fr) 90px 90px auto;gap:10px;align-items:center;padding:11px 12px;border-top:1px solid #282117}.craft-acq-row b{color:#d9d3c7;font-size:12px}.craft-acq-row span{color:#8c857b;font-size:10px}.craft-acq-row strong{color:#d8bd7f;font-size:11px;text-align:right}.craft-acq-row a{color:#e5bd65;font-size:10px;text-decoration:none}.craft-acq-empty{padding:16px;color:#80796f;font-size:11px}.craft-acq-links{display:flex;gap:8px;flex-wrap:wrap}.craft-acq-links a{display:inline-block;padding:8px 10px;border:1px solid #5f4825;color:#e5bd65;text-decoration:none;font-size:10px;background:#151109}@media(max-width:760px){.craft-acq-row{grid-template-columns:1fr auto}.craft-acq-row span:nth-of-type(1){grid-column:1/-1}.craft-acq-row span:nth-of-type(2){grid-column:1/-1}.craft-acq-row strong{text-align:left}.craft-acq-row a{justify-self:end}}
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
        <div><small>GDZIE ZDOBYĆ</small><h3 id="craftAcqTitle">Materiał</h3></div>
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
  const source = row.source_url
    ? `<a href="${escapeHtml(row.source_url)}" target="_blank" rel="noopener noreferrer">Źródło ↗</a>`
    : '';
  return `<div class="craft-acq-row">
    <b>${escapeHtml(row.monster_name || 'Inne źródło')}</b>
    <strong>Lv. ${row.monster_level || '—'}</strong>
    <span>${escapeHtml(row.location || 'Brak lokalizacji')}</span>
    <strong>${fmtChance(row.chance_percent)}</strong>
    <strong>x${fmtQty(row)}</strong>
    ${source}
  </div>`;
}

function groupHtml(label, rows) {
  return `<section class="craft-acq-group"><div class="craft-acq-group-title">${label}</div>${rows.length ? rows.map(rowHtml).join('') : '<div class="craft-acq-empty">Brak zweryfikowanych danych.</div>'}</section>`;
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
    body.innerHTML = '<div class="craft-acq-note">Szukam źródeł dropu i spoila dla wersji Interlude…</div>';
    overlay.classList.add('is-open');
    try {
      const { data: items, error: itemError } = await supabase
        .from('craft_items')
        .select('item_key,name')
        .eq('name', name)
        .limit(1);
      if (itemError) throw itemError;
      const item = items?.[0];
      if (!item) {
        body.innerHTML = '<div class="craft-acq-note">Nie znaleziono tego materiału w bazie craftu.</div>';
        return;
      }

      const { data: rows, error } = await supabase
        .from('craft_acquisition_sources')
        .select('*')
        .eq('item_key', item.item_key)
        .eq('active', true)
        .order('method')
        .order('chance_percent', { ascending: false });
      if (error) throw error;

      const all = rows || [];
      const drops = all.filter(row => row.method === 'drop');
      const spoils = all.filter(row => row.method === 'spoil');
      const other = all.filter(row => !['drop','spoil'].includes(row.method));
      body.innerHTML = `
        <div class="craft-acq-note">Dane są dodawane wyłącznie po weryfikacji dla <b>Lineage 2 Interlude</b>. Procenty mogą różnić się na serwerze Reborn, jeśli ma własne rate/drop table.</div>
        ${groupHtml('DROP', drops)}
        ${groupHtml('SPOIL', spoils)}
        ${other.length ? groupHtml('INNE ŹRÓDŁA', other) : ''}
        ${all.length ? '' : '<div class="craft-acq-note">Dla tego materiału nie mamy jeszcze zweryfikowanych mobów. Nie pokazuję zgadywanych danych.</div>'}
        <div class="craft-acq-links">
          <a href="https://lineage2wiki.org/interlude/" target="_blank" rel="noopener noreferrer">Lineage2Wiki Interlude ↗</a>
          <a href="https://lineage.pmfun.com/" target="_blank" rel="noopener noreferrer">PMfun ↗</a>
        </div>`;
    } catch (error) {
      body.innerHTML = `<div class="craft-acq-note">Nie udało się pobrać danych: ${escapeHtml(error?.message || error)}</div>`;
    }
  };

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

import {
  createCraftProject,
  deleteCraftProject,
  loadCraftWorkspace,
  setCraftInventoryQuantity,
  updateCraftProject,
} from './craftWorkspace.js';
import { craftItemIconMarkup, craftItemIconPath } from './craftItemIcons.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');

function projectStatusLabel(status) {
  return ({
    active: 'AKTYWNY',
    paused: 'WSTRZYMANY',
    completed: 'ZAKOŃCZONY',
    archived: 'ARCHIWUM',
  })[status] || String(status || '').toUpperCase();
}

function findItem(workspace, itemKey) {
  return workspace.items.find(item => item.item_key === itemKey) || { item_key: itemKey };
}

function renderRequirementRows(project, workspace) {
  const rows = new Map(project.requirements.map(row => [row.itemKey, row]));
  for (const row of project.missing) {
    if (!rows.has(row.itemKey)) rows.set(row.itemKey, { ...row, ownedAllocated: 0, generatedSurplusUsed: 0, missing: row.quantity });
  }

  if (!rows.size) return '<p class="craft-muted">Brak składników do pokazania.</p>';

  return [...rows.values()].map(row => {
    const item = findItem(workspace, row.itemKey);
    const owned = Number(row.ownedAllocated || 0);
    const virtual = Number(row.generatedSurplusUsed || 0);
    const missing = Number(row.missing || 0);
    const needed = Number(row.quantity || 0);
    const covered = Math.max(0, needed - missing);
    return `
      <div class="craft-mat-row">
        <div class="craft-item-name">${craftItemIconMarkup({ ...item, name: row.name })}<span><b>${escapeHtml(row.name)}</b><small>${escapeHtml(row.itemKey)}</small></span></div>
        <span><em>Potrzeba</em><strong>${fmt(needed)}</strong></span>
        <span><em>Pokryte</em><strong>${fmt(covered)}</strong></span>
        <span><em>Magazyn</em><strong>${fmt(owned)}</strong></span>
        <span><em>Nadwyżka</em><strong>${fmt(virtual)}</strong></span>
        <span class="${missing ? 'craft-missing' : 'craft-ok'}"><em>Brakuje</em><strong>${fmt(missing)}</strong></span>
      </div>`;
  }).join('');
}

function renderProjectCard(project, workspace) {
  const missingTotal = project.missing.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const targetItem = findItem(workspace, project.targetItemKey);
  return `
    <article class="craft-project-card" data-craft-project="${escapeHtml(project.id)}">
      <div class="craft-project-head">
        <div>
          <small>${escapeHtml(projectStatusLabel(project.status))} · PRIORYTET ${fmt(project.priority)}</small>
          <div class="craft-target-title">${craftItemIconMarkup({ ...targetItem, name: project.targetName }, 'craft-item-icon craft-target-icon')}<span><h4>${escapeHtml(project.name)}</h4><p>${escapeHtml(project.targetName)} × ${fmt(project.targetQuantity)}</p></span></div>
        </div>
        <div class="craft-project-actions">
          ${project.status === 'active'
            ? `<button type="button" data-craft-action="pause" data-id="${escapeHtml(project.id)}">Wstrzymaj</button>`
            : `<button type="button" data-craft-action="resume" data-id="${escapeHtml(project.id)}">Wznów</button>`}
          <button type="button" data-craft-action="delete" data-id="${escapeHtml(project.id)}">Usuń</button>
        </div>
      </div>
      <div class="craft-project-summary ${missingTotal ? 'has-missing' : 'is-complete'}">
        <b>${missingTotal ? `Brakuje łącznie: ${fmt(missingTotal)}` : 'Materiały pokryte ✓'}</b>
        <span>${project.reservesInventory ? 'Projekt rezerwuje materiały z magazynu.' : 'Projekt nie rezerwuje materiałów.'}</span>
      </div>
      <div class="craft-mat-list">${renderRequirementRows(project, workspace)}</div>
    </article>`;
}

function renderInventoryRows(workspace) {
  if (!workspace.plan.inventory.length) {
    return '<p class="craft-muted">Magazyn jest pusty. Dodaj pierwszy materiał poniżej.</p>';
  }
  return workspace.plan.inventory.map(row => `
    <div class="craft-inventory-row">
      <div class="craft-item-name">${craftItemIconMarkup({ ...findItem(workspace, row.itemKey), name: row.name })}<span><b>${escapeHtml(row.name)}</b><small>${escapeHtml(row.itemKey)}</small></span></div>
      <span><em>Mam</em><strong>${fmt(row.quantity)}</strong></span>
      <span><em>Zarezerwowane</em><strong>${fmt(row.reserved)}</strong></span>
      <span><em>Dostępne</em><strong>${fmt(row.available)}</strong></span>
      <button type="button" data-craft-edit-stock="${escapeHtml(row.itemKey)}" data-current="${row.quantity}">Zmień</button>
    </div>`).join('');
}

function targetOptions(workspace) {
  const craftableKeys = new Set(workspace.recipes.filter(row => row.active !== false).map(row => row.output_item_key));
  return workspace.items
    .filter(item => craftableKeys.has(item.item_key))
    .map(item => `<option value="${escapeHtml(item.item_key)}">${escapeHtml(item.name)}</option>`)
    .join('');
}

function allItemOptions(workspace) {
  return workspace.items
    .map(item => `<option value="${escapeHtml(item.item_key)}">${escapeHtml(item.name)}</option>`)
    .join('');
}

function selectedIconStyle(workspace, itemKey) {
  const item = findItem(workspace, itemKey);
  const iconPath = craftItemIconPath(item.item_key, item.game_item_id);
  return iconPath ? `--craft-selected-icon:url("${iconPath}")` : '';
}

function ensureUiShell() {
  const layer = document.querySelector('#memberZoneLayer');
  const side = layer?.querySelector('.member-zone-side');
  const main = layer?.querySelector('.member-zone-main');
  if (!layer || !side || !main) return null;

  if (!side.querySelector('[data-zone-view="craft"]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zone-nav';
    button.dataset.zoneView = 'craft';
    button.innerHTML = '⚒ <span>Craft</span>';
    const spacer = side.querySelector('.zone-side-spacer');
    side.insertBefore(button, spacer || null);
  }

  let panel = main.querySelector('[data-zone-panel="craft"]');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'zone-view';
    panel.dataset.zonePanel = 'craft';
    panel.innerHTML = `
      <div class="zone-section-head">
        <small>OSOBISTY PLANER</small>
        <h3>CRAFT WORKSPACE</h3>
        <p>Twój magazyn, wiele projektów i automatyczne liczenie braków.</p>
      </div>
      <div id="craftWorkspaceRoot" class="craft-workspace"><p class="craft-muted">Otwórz zakładkę Craft, aby wczytać dane.</p></div>`;
    main.appendChild(panel);
  }

  if (!document.querySelector('#craftPlannerUiStyles')) {
    const style = document.createElement('style');
    style.id = 'craftPlannerUiStyles';
    style.textContent = `
      .craft-workspace{display:grid;gap:14px;padding-bottom:30px}.craft-toolbar{display:grid;grid-template-columns:1fr 1fr;gap:14px}.craft-box,.craft-project-card{border:1px solid #3d3220;background:#0a0e0e;padding:16px}.craft-box h4,.craft-project-card h4{margin:3px 0 5px;color:#ead9b3;font:700 18px Georgia}.craft-box>p,.craft-project-card p,.craft-muted{color:#837e75;font-size:11px;line-height:1.5}.craft-form{display:grid;grid-template-columns:1fr 110px auto;gap:8px;margin-top:12px}.craft-form.project{grid-template-columns:1.4fr 1fr 90px 90px auto}.craft-form input,.craft-form select{min-width:0;padding:10px;border:1px solid #4a3c25;background:#070b0b;color:#ddd}.craft-form select{padding-left:44px;background-color:#070b0b;background-image:var(--craft-selected-icon);background-repeat:no-repeat;background-position:8px center;background-size:28px 28px}.craft-form button,.craft-project-actions button,.craft-inventory-row button{padding:9px 11px;border:1px solid #765925;background:#18130b;color:#e5bd65;font-weight:800;cursor:pointer}.craft-feedback{min-height:18px;margin:8px 0 0;color:#d9b45e;font-size:11px}.craft-projects{display:grid;gap:12px}.craft-project-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.craft-project-head small{color:#b98a39;font-size:9px;font-weight:900;letter-spacing:.08em}.craft-project-actions{display:flex;gap:6px}.craft-project-summary{display:flex;justify-content:space-between;gap:10px;margin:12px 0;padding:10px;border:1px solid #3a3020;font-size:11px}.craft-project-summary.has-missing b{color:#df9a65}.craft-project-summary.is-complete b{color:#75c88a}.craft-project-summary span{color:#777269}.craft-mat-list,.craft-inventory-list{display:grid}.craft-mat-row,.craft-inventory-row{display:grid;grid-template-columns:minmax(190px,1.6fr) repeat(5,minmax(80px,.7fr));gap:8px;align-items:center;padding:10px 0;border-top:1px solid #292319}.craft-inventory-row{grid-template-columns:minmax(190px,1.6fr) repeat(3,minmax(90px,.7fr)) auto}.craft-item-name,.craft-target-title{display:flex!important;align-items:center;gap:9px}.craft-item-icon{width:32px;height:32px;flex:0 0 32px;display:grid!important;place-items:center;border:1px solid #514225;background:#11100c;color:#7f6c43;font-size:14px;overflow:hidden}.craft-item-icon img{width:32px;height:32px;object-fit:contain}.craft-target-title{margin-top:4px}.craft-target-icon,.craft-target-icon img{width:40px;height:40px}.craft-target-icon{flex-basis:40px}.craft-mat-row>div b,.craft-inventory-row>div b{display:block;color:#d8d2c8;font-size:12px}.craft-mat-row small,.craft-inventory-row small{display:block;color:#666159;font-size:9px}.craft-mat-row span,.craft-inventory-row span{display:grid}.craft-mat-row em,.craft-inventory-row em{color:#6f6a62;font-size:8px;font-style:normal;text-transform:uppercase}.craft-mat-row strong,.craft-inventory-row strong{color:#c9c2b5;font-size:12px}.craft-missing strong{color:#dd8a58}.craft-ok strong{color:#6fc184}.craft-section-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:8px}.craft-section-title small{color:#9b824f}.craft-empty{padding:26px;border:1px dashed #514225;text-align:center;color:#82765f}.craft-loading{padding:30px;text-align:center;color:#b99a5c}.craft-workspace [disabled]{opacity:.5;cursor:not-allowed}
      @media(max-width:900px){.member-zone-side{grid-template-columns:repeat(5,minmax(0,1fr))!important}.craft-toolbar{grid-template-columns:1fr}.craft-form,.craft-form.project{grid-template-columns:1fr 1fr}.craft-form button{grid-column:1/-1}.craft-project-head,.craft-project-summary{display:block}.craft-project-actions{margin-top:10px}.craft-mat-row{grid-template-columns:1fr 1fr 1fr}.craft-mat-row>div{grid-column:1/-1}.craft-inventory-row{grid-template-columns:1fr 1fr 1fr}.craft-inventory-row>div{grid-column:1/-1}.craft-inventory-row button{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  return { layer, side, main, panel, root: panel.querySelector('#craftWorkspaceRoot') };
}

export function installCraftPlannerUi(supabase) {
  if (!supabase || document.documentElement.dataset.craftPlannerInstalled === '1') return;
  const ui = ensureUiShell();
  if (!ui) return;
  document.documentElement.dataset.craftPlannerInstalled = '1';

  let workspace = null;
  let loading = false;

  const setFeedback = message => {
    const node = ui.root.querySelector('.craft-feedback');
    if (node) node.textContent = message || '';
  };

  const refresh = async ({ quiet = false } = {}) => {
    if (loading) return;
    loading = true;
    if (!quiet) ui.root.innerHTML = '<div class="craft-loading">Ładowanie Twojego craft workspace…</div>';
    try {
      workspace = await loadCraftWorkspace(supabase);
      const projects = workspace.plan.projects
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map(project => renderProjectCard(project, workspace))
        .join('');
      ui.root.innerHTML = `
        <div class="craft-toolbar">
          <section class="craft-box">
            <div class="craft-section-title"><div><small>NOWY CEL</small><h4>Dodaj projekt craftu</h4></div></div>
            <p>Każdy aktywny projekt automatycznie rezerwuje potrzebne materiały zgodnie z priorytetem.</p>
            <form class="craft-form project" id="craftProjectForm">
              <input name="name" maxlength="80" required placeholder="np. 3× Draconic Bow">
              <select name="targetItemKey" required>${targetOptions(workspace)}</select>
              <input name="targetQuantity" type="number" min="1" step="1" value="1" required>
              <input name="priority" type="number" min="0" step="10" value="100" required title="Niższa liczba = wyższy priorytet">
              <button type="submit">Dodaj</button>
            </form>
          </section>
          <section class="craft-box">
            <div class="craft-section-title"><div><small>TWÓJ STAN</small><h4>Dodaj / zaktualizuj magazyn</h4></div></div>
            <p>Wpisujesz realny stan. Projekty nie zmieniają go fizycznie — tylko pokazują, ile jest zarezerwowane.</p>
            <form class="craft-form" id="craftStockForm">
              <select name="itemKey" required>${allItemOptions(workspace)}</select>
              <input name="quantity" type="number" min="0" step="1" value="0" required>
              <button type="submit">Zapisz</button>
            </form>
          </section>
        </div>
        <p class="craft-feedback"></p>
        <section class="craft-box">
          <div class="craft-section-title"><div><small>MAGAZYN</small><h4>Mój stan materiałów</h4></div><small>Mam · Zarezerwowane · Dostępne</small></div>
          <div class="craft-inventory-list">${renderInventoryRows(workspace)}</div>
        </section>
        <section>
          <div class="craft-section-title"><div><small>PROJEKTY</small><h4>Moje craft projekty</h4></div><small>${workspace.plan.projects.length} projektów</small></div>
          <div class="craft-projects">${projects || '<div class="craft-empty">Nie masz jeszcze żadnego projektu craftu.</div>'}</div>
        </section>`;
      for (const select of ui.root.querySelectorAll('.craft-form select')) {
        select.setAttribute('style', selectedIconStyle(workspace, select.value));
      }
    } catch (error) {
      ui.root.innerHTML = `<div class="craft-empty"><b>Nie udało się wczytać planera.</b><p>${escapeHtml(error?.message || error)}</p></div>`;
    } finally {
      loading = false;
    }
  };

  ui.side.addEventListener('click', event => {
    const button = event.target.closest('[data-zone-view="craft"]');
    if (!button) return;
    setTimeout(() => refresh(), 0);
  });

  ui.root.addEventListener('submit', async event => {
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    try {
      if (form.id === 'craftProjectForm') {
        await createCraftProject(supabase, {
          name: data.get('name'),
          targetItemKey: data.get('targetItemKey'),
          targetQuantity: data.get('targetQuantity'),
          priority: data.get('priority'),
        });
      } else if (form.id === 'craftStockForm') {
        await setCraftInventoryQuantity(supabase, data.get('itemKey'), data.get('quantity'));
      }
      await refresh({ quiet: true });
      setFeedback('Zapisano.');
    } catch (error) {
      setFeedback(error?.message || String(error));
    }
  });

  ui.root.addEventListener('click', async event => {
    const editStock = event.target.closest('[data-craft-edit-stock]');
    if (editStock) {
      const next = window.prompt('Podaj nowy stan materiału:', editStock.dataset.current || '0');
      if (next === null) return;
      try {
        await setCraftInventoryQuantity(supabase, editStock.dataset.craftEditStock, next);
        await refresh({ quiet: true });
        setFeedback('Stan magazynu zaktualizowany.');
      } catch (error) {
        setFeedback(error?.message || String(error));
      }
      return;
    }

    const action = event.target.closest('[data-craft-action]');
    if (!action) return;
    const projectId = action.dataset.id;
    try {
      if (action.dataset.craftAction === 'delete') {
        if (!window.confirm('Usunąć ten projekt craftu?')) return;
        await deleteCraftProject(supabase, projectId);
      } else if (action.dataset.craftAction === 'pause') {
        await updateCraftProject(supabase, projectId, { status: 'paused' });
      } else if (action.dataset.craftAction === 'resume') {
        await updateCraftProject(supabase, projectId, { status: 'active' });
      }
      await refresh({ quiet: true });
      setFeedback('Projekt zaktualizowany.');
    } catch (error) {
      setFeedback(error?.message || String(error));
    }
  });

  ui.root.addEventListener('change', event => {
    const select = event.target.closest?.('#craftProjectForm select[name="targetItemKey"], #craftStockForm select[name="itemKey"]');
    if (!select || !workspace) return;
    select.setAttribute('style', selectedIconStyle(workspace, select.value));
  });
}

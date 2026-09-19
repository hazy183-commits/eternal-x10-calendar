import {
  createCraftProject,
  deleteCraftProject,
  loadCraftWorkspace,
  setCraftInventoryQuantity,
  updateCraftProject,
} from './craftWorkspace.js';
import { craftItemIconMarkup, craftItemIconPath } from './craftItemIcons.js';
import { summarizeCraftProject } from './craftHomeSummary.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const collapsedProjectIds = new Set();

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
  const progress = summarizeCraftProject(project);
  const collapsed = collapsedProjectIds.has(String(project.id));
  return `
    <article class="craft-project-card ${project.status === 'active' ? 'is-active' : 'is-paused'}${collapsed ? ' is-collapsed' : ''}" data-craft-project="${escapeHtml(project.id)}">
      <div class="craft-project-head">
        <div class="craft-project-identity">
          <small>${escapeHtml(projectStatusLabel(project.status))} · PRIORYTET ${fmt(project.priority)}</small>
          <div class="craft-target-title">${craftItemIconMarkup({ ...targetItem, name: project.targetName }, 'craft-item-icon craft-target-icon')}<span><h4>${escapeHtml(project.name)}</h4><p>${escapeHtml(project.targetName)} × ${fmt(project.targetQuantity)}</p></span></div>
        </div>
        <div class="craft-project-actions">
          <button type="button" class="craft-project-toggle" data-craft-toggle-project="${escapeHtml(project.id)}" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '▸ Rozwiń' : '▾ Zwiń'}</button>
          ${project.status === 'active'
            ? `<button type="button" data-craft-action="pause" data-id="${escapeHtml(project.id)}">Wstrzymaj</button>`
            : `<button type="button" data-craft-action="resume" data-id="${escapeHtml(project.id)}">Wznów</button>`}
          <button type="button" data-craft-action="delete" data-id="${escapeHtml(project.id)}">Usuń</button>
        </div>
      </div>
      <div class="craft-project-body"${collapsed ? ' hidden' : ''}>
        <div class="craft-project-progress">
          <div><span>Postęp projektu</span><b>${progress.percent}%</b></div>
          <div class="craft-progress-track" role="progressbar" aria-label="Postęp projektu ${escapeHtml(project.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}"><i style="--craft-project-progress:${progress.percent}%"></i></div>
        </div>
        <div class="craft-project-summary ${missingTotal ? 'has-missing' : 'is-complete'}">
          <b>${missingTotal ? `Brakuje łącznie: ${fmt(missingTotal)}` : 'Materiały pokryte ✓'}</b>
          <span>${project.reservesInventory ? 'Projekt rezerwuje materiały z magazynu.' : 'Projekt nie rezerwuje materiałów.'}</span>
        </div>
        <div class="craft-mat-list">${renderRequirementRows(project, workspace)}</div>
      </div>
    </article>`;
}

function renderInventoryRows(workspace) {
  if (!workspace.plan.inventory.length) {
    return '<div class="craft-inventory-empty"><span>□</span><b>Plecak jest pusty</b><small>Dodaj pierwszy materiał w sekcji „Uzupełnij magazyn”.</small></div>';
  }
  return workspace.plan.inventory.map(row => `
    <div class="craft-inventory-row" data-craft-stock-name="${escapeHtml(`${row.name} ${row.itemKey}`.toLocaleLowerCase('pl'))}">
      <button class="craft-inventory-slot" type="button" data-craft-edit-stock="${escapeHtml(row.itemKey)}" data-current="${row.quantity}" title="${escapeHtml(row.name)} — kliknij, aby zmienić ilość">
        ${craftItemIconMarkup({ ...findItem(workspace, row.itemKey), name: row.name }, 'craft-item-icon craft-inventory-icon')}
        <strong>${fmt(row.quantity)}</strong>
      </button>
      <div class="craft-inventory-caption">
        <b title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</b>
        <span class="craft-inventory-counts">
          <em class="is-available"><small>Dostępne</small><strong>${fmt(row.available)}</strong></em>
          <em class="is-reserved"><small>Zarezerwowane</small><strong>${fmt(row.reserved)}</strong></em>
        </span>
      </div>
    </div>`).join('');
}

function renderInventoryPreview(workspace) {
  const rows = workspace.plan.inventory.slice(0, 6);
  const icons = rows.map(row => craftItemIconMarkup(
    { ...findItem(workspace, row.itemKey), name: row.name },
    'craft-item-icon craft-inventory-preview-icon',
  )).join('');
  return `${icons}${Array.from({ length: Math.max(0, 6 - rows.length) }, () => '<span class="craft-inventory-preview-empty"></span>').join('')}`;
}

function renderInventoryWindow(workspace, isOpen) {
  const used = workspace.plan.inventory.length;
  return `
    <button class="craft-inventory-launch" type="button" data-craft-open-inventory aria-haspopup="dialog">
      <span class="craft-inventory-launch-art" aria-hidden="true"><img src="/assets/interlude/icons/etc_jewel_box_i00.png" alt=""></span>
      <span class="craft-inventory-launch-copy"><small>PLECAK MATERIAŁÓW</small><b>Stan materiałów</b><em>${used} ${used === 1 ? 'pozycja' : 'pozycji'} w magazynie</em></span>
      <span class="craft-inventory-preview" aria-hidden="true">${renderInventoryPreview(workspace)}</span>
      <strong>Otwórz plecak ›</strong>
    </button>
    <div class="craft-inventory-modal" data-craft-inventory-modal${isOpen ? '' : ' hidden'}>
      <button class="craft-inventory-backdrop" type="button" data-craft-close-inventory aria-label="Zamknij plecak"></button>
      <section class="craft-inventory-window" role="dialog" aria-modal="true" aria-labelledby="craftInventoryTitle">
        <header>
          <span></span>
          <h4 id="craftInventoryTitle">Inventory</h4>
          <div><small>(${used}/250)</small><button type="button" data-craft-close-inventory aria-label="Zamknij">×</button></div>
        </header>
        <div class="craft-inventory-toolbar">
          <button type="button" class="is-active">All</button>
          <span>Materiały craftowe</span>
          <input class="craft-search" id="craftInventorySearch" type="search" placeholder="Szukaj…" aria-label="Szukaj materiału w plecaku">
        </div>
        <div class="craft-inventory-list">${renderInventoryRows(workspace)}</div>
        <footer><span>Kliknij ikonę, aby zmienić ilość.</span><span><i></i> dostępne <i></i> zarezerwowane</span></footer>
      </section>
    </div>`;
}

function renderWorkspaceOverview(workspace) {
  const projects = workspace.plan.projects || [];
  const active = projects.filter(project => project.status === 'active').length;
  const completed = projects.filter(project => summarizeCraftProject(project).percent === 100).length;
  return `
    <section class="craft-overview" aria-label="Podsumowanie craft workspace">
      <div class="craft-overview-copy">
        <small>TWÓJ WARSZTAT</small>
        <h4>Wszystko do craftu w jednym miejscu</h4>
        <p>Sprawdź postęp, uzupełnij magazyn i od razu zobacz, czego jeszcze brakuje.</p>
      </div>
      <div class="craft-overview-stats">
        <div><strong>${active}</strong><span>Aktywne</span></div>
        <div><strong>${projects.length}</strong><span>Wszystkie</span></div>
        <div><strong>${completed}</strong><span>Gotowe</span></div>
        <div><strong>${workspace.plan.inventory.length}</strong><span>W magazynie</span></div>
      </div>
    </section>`;
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
      .craft-workspace{display:grid;gap:20px;padding-bottom:30px;color:#d8d2c8}.craft-overview{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(420px,.85fr);gap:22px;align-items:center;padding:22px;border:1px solid #6a512a;background:linear-gradient(115deg,#17140d 0%,#0c1110 55%,#101714 100%);box-shadow:inset 4px 0 0 #b68938}.craft-overview-copy small,.craft-step-kicker{color:#d2a74e;font-size:10px;font-weight:900;letter-spacing:.12em}.craft-overview-copy h4{margin:5px 0 7px;color:#f0dfb8;font:700 23px Georgia}.craft-overview-copy p{margin:0;color:#9a958c;font-size:13px;line-height:1.5}.craft-overview-stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #3b3323;background:#090d0c}.craft-overview-stats div{display:grid;gap:2px;justify-items:center;padding:13px 7px;border-left:1px solid #30291c}.craft-overview-stats div:first-child{border-left:0}.craft-overview-stats strong{color:#e6c36e;font:700 22px Georgia}.craft-overview-stats span{color:#878178;font-size:9px;text-transform:uppercase;letter-spacing:.06em}.craft-section{display:grid;gap:10px}.craft-section-title{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0}.craft-section-title h4{margin:3px 0 0;color:#ead9b3;font:700 20px Georgia}.craft-section-title small{color:#9b824f;font-size:10px}.craft-section-title>small{padding-bottom:3px}.craft-projects{display:grid;gap:14px}.craft-project-card{position:relative;overflow:hidden;border:1px solid #443821;background:linear-gradient(140deg,#0c1010,#090c0c);padding:18px}.craft-project-card:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:#966d2d}.craft-project-card.is-paused:before{background:#5e5b54}.craft-project-card.is-collapsed{background:linear-gradient(140deg,#101412,#0a0d0c)}.craft-project-body[hidden]{display:none}.craft-project-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}.craft-project-head small{color:#c69a48;font-size:10px;font-weight:900;letter-spacing:.1em}.craft-project-actions{display:flex;gap:7px}.craft-project-toggle{min-width:92px}.craft-target-title{margin-top:7px}.craft-box h4,.craft-project-card h4{margin:3px 0 5px;color:#ead9b3;font:700 18px Georgia}.craft-box>p,.craft-project-card p,.craft-muted{color:#8d887f;font-size:12px;line-height:1.5}.craft-project-progress{display:grid;gap:7px;margin:16px 0 12px}.craft-project-progress>div:first-child{display:flex;align-items:center;justify-content:space-between;color:#958e81;font-size:11px}.craft-project-progress b{color:#f0c767;font-size:17px}.craft-progress-track{height:9px;border:1px solid #443820;background:#060909;overflow:hidden}.craft-progress-track i{display:block;width:var(--craft-project-progress);height:100%;background:linear-gradient(90deg,#8f6422,#efbf58);box-shadow:0 0 14px rgba(226,174,69,.28);transition:width .25s ease}.craft-project-summary{display:flex;justify-content:space-between;gap:10px;margin:0 0 12px;padding:10px 12px;border:1px solid #342c1e;background:#0a0d0c;font-size:11px}.craft-project-summary.has-missing b{color:#df9a65}.craft-project-summary.is-complete b{color:#75c88a}.craft-project-summary span{color:#777269}.craft-toolbar{display:grid;grid-template-columns:1fr 1fr;gap:14px}.craft-box{border:1px solid #3d3220;background:#0a0e0e;padding:18px}.craft-step-head{display:grid;grid-template-columns:34px 1fr;gap:11px;align-items:center;margin-bottom:8px}.craft-step-number{display:grid;place-items:center;width:34px;height:34px;border:1px solid #765925;background:#18130b;color:#e9bd62;font:700 17px Georgia}.craft-step-head h4{margin:2px 0 0}.craft-form{display:grid;grid-template-columns:1fr 110px auto;gap:9px;margin-top:14px;align-items:end}.craft-form.project{grid-template-columns:1.4fr 1fr 90px 90px auto}.craft-control{display:grid;gap:5px;min-width:0}.craft-control>span{color:#9b9488;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.craft-form input,.craft-form select,.craft-search{width:100%;min-width:0;box-sizing:border-box;padding:11px;border:1px solid #4a3c25;background:#070b0b;color:#ddd;outline:none}.craft-form input:focus,.craft-form select:focus,.craft-search:focus{border-color:#b68735;box-shadow:0 0 0 2px rgba(182,135,53,.13)}.craft-form select{padding-left:44px;background-color:#070b0b;background-image:var(--craft-selected-icon);background-repeat:no-repeat;background-position:8px center;background-size:28px 28px}.craft-form button,.craft-project-actions button,.craft-inventory-row button{padding:10px 12px;border:1px solid #765925;background:#18130b;color:#e5bd65;font-weight:800;cursor:pointer}.craft-form button{min-height:40px;background:#8a6325;color:#fff1cb;border-color:#b48637}.craft-project-actions [data-craft-action="delete"]{border-color:#55302b;background:#170d0c;color:#d58d81}.craft-feedback{min-height:18px;margin:-12px 0;color:#d9b45e;font-size:12px}.craft-inventory-head{align-items:center}.craft-inventory-tools{display:flex;align-items:center;gap:10px}.craft-search{width:250px;padding:9px 11px;font-size:12px}.craft-mat-list,.craft-inventory-list{display:grid}.craft-mat-row,.craft-inventory-row{display:grid;grid-template-columns:minmax(190px,1.6fr) repeat(5,minmax(80px,.7fr));gap:8px;align-items:center;padding:10px 0;border-top:1px solid #292319}.craft-inventory-row{grid-template-columns:minmax(190px,1.6fr) repeat(3,minmax(90px,.7fr)) auto}.craft-inventory-row[hidden]{display:none}.craft-item-name,.craft-target-title{display:flex!important;align-items:center;gap:9px}.craft-item-icon{width:32px;height:32px;flex:0 0 32px;display:grid!important;place-items:center;border:1px solid #514225;background:#11100c;color:#7f6c43;font-size:14px;overflow:hidden}.craft-item-icon img{width:32px;height:32px;object-fit:contain}.craft-target-icon,.craft-target-icon img{width:44px;height:44px}.craft-target-icon{flex-basis:44px}.craft-mat-row>div b,.craft-inventory-row>div b{display:block;color:#d8d2c8;font-size:12px}.craft-mat-row small,.craft-inventory-row small{display:block;color:#666159;font-size:9px}.craft-mat-row span,.craft-inventory-row span{display:grid}.craft-mat-row em,.craft-inventory-row em{color:#6f6a62;font-size:8px;font-style:normal;text-transform:uppercase}.craft-mat-row strong,.craft-inventory-row strong{color:#c9c2b5;font-size:12px}.craft-missing strong{color:#dd8a58}.craft-ok strong{color:#6fc184}.craft-empty{padding:26px;border:1px dashed #514225;text-align:center;color:#82765f}.craft-loading{padding:30px;text-align:center;color:#b99a5c}.craft-workspace [disabled]{opacity:.5;cursor:not-allowed}
      @media(max-width:900px){.member-zone-side{grid-template-columns:repeat(5,minmax(0,1fr))!important}.craft-overview{grid-template-columns:1fr;padding:17px}.craft-overview-stats{grid-template-columns:repeat(2,1fr)}.craft-overview-stats div:nth-child(3){border-left:0;border-top:1px solid #30291c}.craft-overview-stats div:nth-child(4){border-top:1px solid #30291c}.craft-toolbar{grid-template-columns:1fr}.craft-form,.craft-form.project{grid-template-columns:1fr 1fr}.craft-form button{grid-column:1/-1}.craft-project-head,.craft-project-summary{display:block}.craft-project-actions{margin-top:12px}.craft-project-summary span{display:block;margin-top:4px}.craft-inventory-head{display:grid;align-items:stretch}.craft-inventory-tools{display:grid}.craft-search{width:100%}.craft-mat-row{grid-template-columns:1fr 1fr 1fr}.craft-mat-row>div{grid-column:1/-1}.craft-inventory-row{grid-template-columns:1fr 1fr 1fr}.craft-inventory-row>div{grid-column:1/-1}.craft-inventory-row button{grid-column:1/-1}}
      @media(max-width:520px){.craft-overview-copy h4{font-size:20px}.craft-project-card,.craft-box{padding:14px}.craft-project-actions{display:grid;grid-template-columns:1fr 1fr}.craft-project-actions button{width:100%}.craft-form,.craft-form.project{grid-template-columns:1fr!important}.craft-control,#craftProjectForm select[name="priority"],.craft-form button{grid-column:1/-1!important}.craft-section-title{align-items:start}.craft-section-title>small{white-space:nowrap}}
    `;
    document.head.appendChild(style);
  }

  if (!document.querySelector('#craftInventoryWindowStyles')) {
    const style = document.createElement('style');
    style.id = 'craftInventoryWindowStyles';
    style.textContent = `
      .craft-inventory-launch{display:grid;grid-template-columns:72px minmax(190px,.7fr) 1fr auto;gap:16px;align-items:center;width:100%;padding:12px 18px;border:1px solid #62502f;background:radial-gradient(circle at 55px 50%,rgba(195,145,48,.16),transparent 120px),linear-gradient(180deg,#17150f,#0a0d0c);color:#d9ceb6;text-align:left;cursor:pointer;box-shadow:inset 0 0 0 1px #0a0805}.craft-inventory-launch:hover,.craft-inventory-launch:focus-visible{border-color:#b38b43;background:radial-gradient(circle at 55px 50%,rgba(220,169,63,.25),transparent 130px),linear-gradient(180deg,#211b10,#0c100f);outline:none}.craft-inventory-launch-art{display:grid;place-items:center;width:68px;height:58px;border:1px solid #74603a;background:radial-gradient(circle,#302617,#0b0d0c 70%);box-shadow:inset 0 0 16px #000,0 0 16px rgba(202,151,50,.1)}.craft-inventory-launch-art img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 3px 5px #000)}.craft-inventory-launch-copy{display:grid;gap:2px}.craft-inventory-launch-copy small{color:#a98648;font-size:9px;font-weight:900;letter-spacing:.11em}.craft-inventory-launch-copy b{color:#eadab8;font:700 18px Georgia}.craft-inventory-launch-copy em{color:#817b71;font-size:10px;font-style:normal}.craft-inventory-preview{display:flex;justify-content:center;gap:5px}.craft-inventory-preview-icon,.craft-inventory-preview-empty{width:34px;height:34px;flex:0 0 34px;border:1px solid #4a412f;background:#090b0a;box-shadow:inset 0 0 8px #000}.craft-inventory-preview-icon img{width:34px;height:34px}.craft-inventory-launch>strong{color:#dbb35f;font-size:11px;white-space:nowrap}.craft-inventory-modal{position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:24px}.craft-inventory-modal[hidden]{display:none}.craft-inventory-backdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.76);cursor:default}.craft-inventory-window{position:relative;width:min(820px,94vw);max-height:min(720px,88vh);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;border:2px solid #71634e;outline:1px solid #17130d;background:linear-gradient(180deg,#201d18,#100f0d 70%);box-shadow:0 22px 80px #000,inset 0 0 35px rgba(0,0,0,.7)}.craft-inventory-window>header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:34px;padding:0 8px;border-bottom:1px solid #554a39;background:linear-gradient(180deg,#302c25,#171511);box-shadow:inset 0 1px #514a3d}.craft-inventory-window>header h4{margin:0;color:#ddd5c8;font:400 14px Georgia;text-align:center}.craft-inventory-window>header>div{display:flex;justify-content:flex-end;align-items:center;gap:8px}.craft-inventory-window>header small{color:#bcb3a4}.craft-inventory-window>header button{width:25px;height:25px;padding:0;border:0;background:transparent;color:#bfb5a3;font-size:25px;line-height:1;cursor:pointer}.craft-inventory-toolbar{display:grid;grid-template-columns:70px 1fr 190px;align-items:center;gap:8px;margin:12px 14px 8px}.craft-inventory-toolbar>button{height:34px;border:1px solid #8d7349;background:linear-gradient(#3a2c1c,#17130d);color:#e2c68a}.craft-inventory-toolbar>span{color:#887d6c;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.craft-inventory-toolbar .craft-search{width:100%;height:34px;padding:7px 10px}.craft-inventory-window .craft-inventory-list{grid-template-columns:repeat(6,minmax(102px,1fr));align-content:start;gap:9px;min-height:280px;margin:0 14px;padding:10px;overflow:auto;border:1px solid #51462f;background:rgba(5,6,5,.72);box-shadow:inset 0 0 20px #000}.craft-inventory-window .craft-inventory-row{position:relative;display:block;min-width:0;padding:0 0 6px;border:1px solid #28231a;background:#0b0d0c}.craft-inventory-window .craft-stock-actions{position:relative!important;display:block!important}.craft-inventory-slot{position:relative!important;display:grid!important;place-items:center;width:100%!important;aspect-ratio:1/1;padding:5px!important;border:1px solid #4f4636!important;background:linear-gradient(135deg,#24211b,#0c0d0c)!important;color:#fff!important;box-shadow:inset 0 0 10px #000;cursor:pointer}.craft-inventory-slot:hover{border-color:#b8995a!important;background:linear-gradient(135deg,#312a1d,#11130f)!important}.craft-inventory-icon,.craft-inventory-icon img{width:44px;height:44px}.craft-inventory-icon{flex-basis:44px;border-color:#66583d}.craft-inventory-slot>strong{position:absolute;right:4px;bottom:1px;padding:1px 2px;color:#fff;font-size:11px;text-shadow:1px 1px 2px #000,-1px -1px 2px #000}.craft-inventory-caption{display:grid;gap:5px;padding:0 5px;margin-top:5px;min-width:0}.craft-inventory-caption>b{overflow:hidden;color:#d6ccba;font-size:10px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}.craft-inventory-counts{display:grid!important;gap:3px}.craft-inventory-counts em{display:flex!important;align-items:center;justify-content:space-between;gap:4px;padding:3px 4px;border:1px solid #282c24;background:#10140f;font-style:normal}.craft-inventory-counts em small{overflow:visible;color:#77a27a;font-size:7px;font-weight:800;line-height:1;text-overflow:clip;text-transform:uppercase}.craft-inventory-counts em strong{color:#91d093;font-size:10px}.craft-inventory-counts .is-reserved{border-color:#30291c;background:#15120c}.craft-inventory-counts .is-reserved small{color:#ae8d50}.craft-inventory-counts .is-reserved strong{color:#e4b961}.craft-inventory-window .craft-stock-remove{position:absolute;z-index:2;top:2px;right:2px;width:18px;height:18px;padding:0!important;border:1px solid #6d3430!important;background:#1b0d0ce6!important;font-size:0}.craft-inventory-window .craft-stock-remove:after{content:'×';font-size:14px;line-height:1}.craft-inventory-empty{grid-column:1/-1;display:grid;place-items:center;gap:6px;padding:50px;color:#777064}.craft-inventory-empty>span{font-size:40px;color:#554c3c}.craft-inventory-empty b{color:#bbb09c}.craft-inventory-empty small{font-size:10px}.craft-inventory-window>footer{display:flex;justify-content:space-between;gap:16px;padding:10px 14px;color:#827b70;font-size:9px}.craft-inventory-window>footer span:last-child{display:flex;gap:7px;align-items:center}.craft-inventory-window>footer i{width:7px;height:7px;border-radius:50%;background:#71b77c}.craft-inventory-window>footer i:last-of-type{background:#d7a85a}
      @media(max-width:900px){.craft-inventory-launch{grid-template-columns:64px 1fr auto}.craft-inventory-launch-art{width:60px;height:54px}.craft-inventory-launch-art img{width:50px;height:50px}.craft-inventory-preview{display:none}.craft-inventory-window .craft-inventory-list{grid-template-columns:repeat(4,minmax(96px,1fr))}.craft-inventory-window .craft-inventory-row>div{grid-column:auto}.craft-inventory-window .craft-stock-actions{grid-column:auto!important}.craft-inventory-toolbar{grid-template-columns:60px 1fr}.craft-inventory-toolbar>span{display:none}.craft-inventory-toolbar .craft-search{grid-column:auto}.craft-inventory-window>footer{display:block}.craft-inventory-window>footer span:last-child{margin-top:5px}}
      @media(max-width:560px){.craft-inventory-launch{grid-template-columns:54px 1fr;padding:10px}.craft-inventory-launch-art{width:50px;height:48px}.craft-inventory-launch-art img{width:44px;height:44px}.craft-inventory-launch>strong{grid-column:2}.craft-inventory-modal{padding:8px}.craft-inventory-window{width:100%;max-height:92vh}.craft-inventory-window .craft-inventory-list{grid-template-columns:repeat(3,minmax(82px,1fr));gap:6px;margin:0 8px;padding:7px}.craft-inventory-toolbar{margin:8px}.craft-inventory-icon,.craft-inventory-icon img{width:38px;height:38px}.craft-inventory-icon{flex-basis:38px}.craft-inventory-caption>b{font-size:9px}.craft-inventory-counts em small{font-size:6px}.craft-inventory-counts em strong{font-size:9px}}
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
  let inventoryOpen = false;

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
        ${renderWorkspaceOverview(workspace)}
        ${renderInventoryWindow(workspace, inventoryOpen)}
        <section class="craft-section">
          <div class="craft-section-title"><div><small>PROJEKTY</small><h4>Moje craft projekty</h4></div><small>${workspace.plan.projects.length} projektów</small></div>
          <div class="craft-projects">${projects || '<div class="craft-empty">Nie masz jeszcze projektu. Dodaj pierwszy cel w sekcji poniżej.</div>'}</div>
        </section>
        <section class="craft-section">
          <div class="craft-section-title"><div><small>DODAJ LUB ZAKTUALIZUJ</small><h4>Zarządzaj swoim planem</h4></div></div>
          <div class="craft-toolbar">
          <section class="craft-box">
            <div class="craft-step-head"><span class="craft-step-number">1</span><div><small class="craft-step-kicker">NOWY CEL</small><h4>Dodaj projekt craftu</h4></div></div>
            <p>Każdy aktywny projekt automatycznie rezerwuje potrzebne materiały zgodnie z priorytetem.</p>
            <form class="craft-form project" id="craftProjectForm">
              <input name="name" type="hidden" maxlength="80" required>
              <label class="craft-control"><span>Przedmiot</span><select name="targetItemKey" required>${targetOptions(workspace)}</select></label>
              <label class="craft-control"><span>Ilość</span><input name="targetQuantity" type="number" min="1" step="1" value="1" required></label>
              <label class="craft-control craft-priority-control"><span>Priorytet</span><input name="priority" type="number" min="0" step="10" value="100" required title="Niższa liczba = wyższy priorytet"></label>
              <button type="submit">Dodaj projekt</button>
            </form>
          </section>
          <section class="craft-box">
            <div class="craft-step-head"><span class="craft-step-number">2</span><div><small class="craft-step-kicker">TWÓJ STAN</small><h4>Uzupełnij magazyn</h4></div></div>
            <p>Wpisujesz realny stan. Projekty nie zmieniają go fizycznie — tylko pokazują, ile jest zarezerwowane.</p>
            <form class="craft-form" id="craftStockForm">
              <label class="craft-control"><span>Materiał</span><select name="itemKey" required>${allItemOptions(workspace)}</select></label>
              <label class="craft-control"><span>Ile masz</span><input name="quantity" type="number" min="0" step="1" value="0" required></label>
              <button type="submit">Zapisz</button>
            </form>
          </section>
          </div>
        </section>
        <p class="craft-feedback"></p>
        `;
      for (const select of ui.root.querySelectorAll('.craft-form select')) {
        select.setAttribute('style', selectedIconStyle(workspace, select.value));
      }
      window.dispatchEvent(new CustomEvent('orzel:craft-workspace-updated', { detail: workspace }));
    } catch (error) {
      ui.root.innerHTML = `<div class="craft-empty"><b>Nie udało się wczytać planera.</b><p>${escapeHtml(error?.message || error)}</p></div>`;
    } finally {
      loading = false;
    }
  };

  window.addEventListener('orzel:craft-workspace-opened', () => refresh());

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
    const openInventory = event.target.closest('[data-craft-open-inventory]');
    if (openInventory) {
      inventoryOpen = true;
      const modal = ui.root.querySelector('[data-craft-inventory-modal]');
      if (modal) modal.hidden = false;
      window.setTimeout(() => ui.root.querySelector('#craftInventorySearch')?.focus(), 0);
      return;
    }

    const closeInventory = event.target.closest('[data-craft-close-inventory]');
    if (closeInventory) {
      inventoryOpen = false;
      const modal = ui.root.querySelector('[data-craft-inventory-modal]');
      if (modal) modal.hidden = true;
      return;
    }

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

    const toggleProject = event.target.closest('[data-craft-toggle-project]');
    if (toggleProject) {
      const projectId = String(toggleProject.dataset.craftToggleProject || '');
      const card = toggleProject.closest('.craft-project-card');
      const body = card?.querySelector('.craft-project-body');
      if (!projectId || !card || !body) return;
      const collapse = !body.hidden;
      body.hidden = collapse;
      card.classList.toggle('is-collapsed', collapse);
      toggleProject.setAttribute('aria-expanded', String(!collapse));
      toggleProject.textContent = collapse ? '▸ Rozwiń' : '▾ Zwiń';
      if (collapse) collapsedProjectIds.add(projectId);
      else collapsedProjectIds.delete(projectId);
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

  ui.root.addEventListener('input', event => {
    const search = event.target.closest?.('#craftInventorySearch');
    if (!search) return;
    const query = search.value.trim().toLocaleLowerCase('pl');
    for (const row of ui.root.querySelectorAll('.craft-inventory-row')) {
      row.hidden = Boolean(query) && !String(row.dataset.craftStockName || '').includes(query);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !inventoryOpen) return;
    inventoryOpen = false;
    const modal = ui.root.querySelector('[data-craft-inventory-modal]');
    if (modal) modal.hidden = true;
  });
}

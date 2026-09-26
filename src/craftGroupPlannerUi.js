import {
  createCraftGroupProject,
  deleteCraftGroupProject,
  inviteCraftGroupMember,
  loadCraftGroupWorkspace,
  removeCraftGroupMember,
  setCraftGroupContribution,
  updateCraftGroupProject,
} from './craftGroupWorkspace.js';
import { craftItemIconMarkup } from './craftItemIcons.js';
import { summarizeMainMissing } from './craftHierarchyEnhancer.js';
import { summarizeCraftProject } from './craftHomeSummary.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');

const targetOptions = (workspace) => {
  const craftable = new Set((workspace.recipes || []).map(row => row.output_item_key));
  return (workspace.items || [])
    .filter(item => craftable.has(item.item_key))
    .map(item => `<option value="${escapeHtml(item.item_key)}">${escapeHtml(item.name)}</option>`)
    .join('');
};

const itemOptions = (workspace) => (workspace.items || [])
  .map(item => `<option value="${escapeHtml(item.item_key)}">${escapeHtml(item.name)}</option>`)
  .join('');

const statusLabel = status => ({ active: 'AKTYWNY', paused: 'WSTRZYMANY', completed: 'ZAKOŃCZONY', archived: 'ARCHIWUM' })[status] || status;

const ensureGroupNavigation = () => {
  const side = document.querySelector('#memberZoneLayer .member-zone-side');
  const craftNav = side?.querySelector('[data-zone-view="craft"]');
  if (!side || !craftNav) return;
  if (!side.querySelector('[data-zone-view="group-craft"]')) {
    const nav = document.createElement('button');
    nav.type = 'button';
    nav.className = 'zone-nav craft-group-nav';
    nav.dataset.zoneView = 'group-craft';
    nav.innerHTML = '<span>Grupowy Craft</span>';
    craftNav.after(nav);
  }
};

const ensureSection = () => {
  const root = document.querySelector('#craftWorkspaceRoot');
  if (!root) return null;
  let section = root.querySelector('[data-craft-group-section]');
  if (!section) {
    section = document.createElement('section');
    section.dataset.craftGroupSection = 'true';
    section.className = 'craft-group-section';
    root.appendChild(section);
  }
  return section;
};

const renderMembers = (group, userId, owner) => {
  const rows = [];
  rows.push(`<div class="craft-group-member"><span class="craft-group-member-avatar">★</span><span><b>${escapeHtml(group.project.ownerNickname)}</b><small>WŁAŚCICIEL</small></span></div>`);
  for (const member of group.members || []) {
    rows.push(`<div class="craft-group-member"><span class="craft-group-member-avatar">⚒</span><span><b>${escapeHtml(member.nickname)}</b><small>${member.role === 'viewer' ? 'PODGLĄD' : 'MOŻE UZUPEŁNIAĆ MAGAZYN'}</small></span>${owner ? `<button type="button" data-group-action="remove-member" data-user-id="${escapeHtml(member.user_id)}" title="Usuń członka">×</button>` : ''}</div>`);
  }
  if (!owner && !(group.members || []).some(member => String(member.user_id) === String(userId))) {
    rows.push('<div class="craft-group-note">Jesteś członkiem tego projektu.</div>');
  }
  return rows.join('');
};

const renderInventory = (group, workspace, userId) => {
  const own = new Map((group.contributions || []).filter(row => String(row.user_id) === String(userId)).map(row => [row.item_key, Number(row.quantity || 0)]));
  if (!group.inventory?.length) return '<div class="craft-group-empty">Wspólny magazyn jest jeszcze pusty.</div>';
  return group.inventory.map(row => {
    const item = workspace.items.find(candidate => candidate.item_key === row.itemKey) || { item_key: row.itemKey, name: row.name };
    return `<div class="craft-group-stock-row"><div class="craft-group-stock-name">${craftItemIconMarkup({ ...item, name: row.name }, 'craft-item-icon')}<span><b>${escapeHtml(row.name)}</b><small>${escapeHtml(row.itemKey)}</small></span></div><strong>${fmt(row.quantity)}</strong><span>Twoje: ${fmt(own.get(row.itemKey) || 0)}</span></div>`;
  }).join('');
};

const renderCandidates = (workspace, group) => {
  const existing = new Set((group.members || []).map(member => String(member.user_id)));
  return (workspace.candidates || [])
    .filter(profile => !existing.has(String(profile.id)))
    .map(profile => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.nickname)}</option>`)
    .join('');
};

function renderEmpty(section, workspace, feedback = '') {
  section.innerHTML = `
    <div class="craft-group-heading"><div><small>WSPÓLNY CRAFTING</small><h4>Grupowy projekt i wspólny magazyn</h4><p>Utwórz jeden cel, zaproś członków i zbierajcie materiały razem.</p></div><span class="craft-group-mark">⚒</span></div>
    <div class="craft-group-steps"><b>Jak zacząć?</b><ol><li>Utwórz projekt, podając jego nazwę, przedmiot i ilość.</li><li>Po utworzeniu wybierz materiał i kliknij „Dodaj do magazynu”.</li><li>W sekcji „Uczestnicy” udostępnij projekt innym osobom.</li></ol></div>
    <div class="craft-group-create-box">
      <div><b>Utwórz grupowy projekt</b><p>Właściciel zarządza projektem, a zaproszone osoby mogą uzupełniać wspólny magazyn.</p></div>
      <form id="craftGroupCreateForm" class="craft-group-form">
        <label><span>Nazwa projektu grupowego</span><input name="name" maxlength="80" required placeholder="Np. Draco Bow dla CP"></label>
        <label><span>Przedmiot</span><select name="targetItemKey" required>${targetOptions(workspace)}</select></label>
        <label><span>Ilość</span><input name="targetQuantity" type="number" min="1" step="1" value="1" required></label>
        <button type="submit">UTWÓRZ PROJEKT</button>
      </form>
      <p class="craft-group-feedback">${escapeHtml(feedback)}</p>
    </div>`;
}

function renderGroup(section, workspace, selectedIndex = 0, feedback = '') {
  const groups = workspace.groups || [];
  if (!groups.length) {
    renderEmpty(section, workspace, feedback);
    return;
  }
  const index = ((selectedIndex % groups.length) + groups.length) % groups.length;
  const group = groups[index];
  const userId = workspace.user.id;
  const owner = String(group.project.owner_id) === String(userId);
  const canEditInventory = owner || (group.members || []).some(member => String(member.user_id) === String(userId) && member.role === 'editor');
  const progress = group.plan ? summarizeCraftProject(group.plan).percent : 0;
  const missing = group.plan ? summarizeMainMissing(group.plan, workspace) : 0;
  const candidates = renderCandidates(workspace, group);

  section.innerHTML = `
    <div class="craft-group-heading"><div><small>WSPÓLNY CRAFTING</small><h4>Grupowy projekt i wspólny magazyn</h4><p>Materiały wszystkich zaproszonych osób liczą się do jednego celu.</p></div><span class="craft-group-mark">⚒</span></div>
    <p class="craft-group-howto">Aby dodać materiały, wybierz je w sekcji „Wspólny magazyn”, wpisz ilość i kliknij „Dodaj do magazynu”. Właściciel udostępnia projekt w sekcji „Uczestnicy”.</p>
    <div class="craft-group-switcher">${groups.length > 1 ? `<button type="button" data-group-project-step="-1" aria-label="Poprzedni projekt">‹</button><span>${index + 1} / ${groups.length}</span><button type="button" data-group-project-step="1" aria-label="Następny projekt">›</button>` : ''}</div>
    <article class="craft-group-project-card" data-craft-group-project>
      <div class="craft-group-project-head"><div><small>${escapeHtml(statusLabel(group.project.status))} · WŁAŚCICIEL: ${escapeHtml(group.project.ownerNickname)}</small><h4>${escapeHtml(group.project.name)}</h4><p>${escapeHtml(group.plan?.targetName || group.project.target_item_key)} × ${fmt(group.project.target_quantity)}</p></div><div class="craft-group-actions">${owner ? `<button type="button" data-group-action="toggle-status">${group.project.status === 'active' ? 'WSTRZYMAJ' : 'WZNÓW'}</button><button type="button" data-group-action="delete-project">USUŃ</button>` : '<span class="craft-group-badge">UDOSTĘPNIONY</span>'}</div></div>
      <div class="craft-group-progress"><div><span>Postęp wspólnego projektu</span><b>${progress}%</b></div><div class="craft-progress-track"><i style="--craft-project-progress:${progress}%"></i></div><small>${missing ? `Brakuje łącznie: ${fmt(missing)}` : 'Materiały pokryte ✓'}</small></div>
      <div class="craft-group-grid">
        <section class="craft-group-box"><div class="craft-group-box-head"><b>WSPÓLNY MAGAZYN</b><span>${group.inventory?.length || 0} materiałów</span></div><div class="craft-group-stock-list">${renderInventory(group, workspace, userId)}</div>${canEditInventory ? `<form id="craftGroupInventoryForm" class="craft-group-form"><label><span>Materiał do wspólnego magazynu</span><select name="itemKey" required>${itemOptions(workspace)}</select></label><label><span>Ilość, którą dodajesz</span><input name="quantity" type="number" min="0" step="1" value="0" required></label><button type="submit">DODAJ DO MAGAZYNU</button></form><p class="craft-group-form-hint">Każda osoba dodaje swój wkład. Suma wszystkich wpisów tworzy wspólny stan.</p>` : '<p class="craft-group-note">Masz podgląd tego magazynu. Właściciel nie nadał Ci uprawnień do jego edycji.</p>'}</section>
        <section class="craft-group-box"><div class="craft-group-box-head"><b>UCZESTNICY</b><span>${(group.members?.length || 0) + 1} osób</span></div><div class="craft-group-members">${renderMembers(group, userId, owner)}</div>${owner ? `<form id="craftGroupInviteForm" class="craft-group-form"><label><span>Dodaj osobę</span><select name="userId" required><option value="">Wybierz członka klanu</option>${candidates}</select></label><label><span>Dostęp</span><select name="role"><option value="editor">Może uzupełniać magazyn</option><option value="viewer">Tylko podgląd</option></select></label><button type="submit">UDOSTĘPNIJ PROJEKT</button></form>` : ''}</section>
      </div>
    </article>
    <p class="craft-group-feedback">${escapeHtml(feedback)}</p>`;
  section.dataset.groupSelectedIndex = String(index);
}

export function installCraftGroupPlannerUi(supabase) {
  if (!supabase || document.documentElement.dataset.craftGroupPlannerInstalled === '1') return;
  document.documentElement.dataset.craftGroupPlannerInstalled = '1';
  ensureGroupNavigation();

  let workspace = null;
  let selectedIndex = 0;
  let loading = false;

  const focusProjectSection = section => {
    const target = section?.querySelector('[data-craft-group-project]');
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const refresh = async (feedback = '', { focusProject = false } = {}) => {
    ensureGroupNavigation();
    const section = ensureSection();
    if (!section || loading) return;
    loading = true;
    section.innerHTML = '<div class="craft-group-loading">Ładowanie grupowego craftingu…</div>';
    try {
      workspace = await loadCraftGroupWorkspace(supabase);
      const currentSection = ensureSection();
      if (!currentSection) return;
      selectedIndex = Math.min(selectedIndex, Math.max(0, (workspace.groups || []).length - 1));
      renderGroup(currentSection, workspace, selectedIndex, feedback);
      if (focusProject) focusProjectSection(currentSection);
    } catch (error) {
      const currentSection = ensureSection();
      if (currentSection) currentSection.innerHTML = `<div class="craft-group-empty"><b>Nie udało się wczytać grupowego craftingu.</b><p>${escapeHtml(error?.message || error)}</p></div>`;
    } finally {
      loading = false;
    }
  };

  const rerender = message => {
    const section = ensureSection();
    if (workspace && section) renderGroup(section, workspace, selectedIndex, message);
    else refresh(message);
  };

  window.addEventListener('orzel:craft-workspace-opened', event => refresh('', { focusProject: event.detail?.focus === 'project' }));
  window.addEventListener('orzel:craft-workspace-updated', () => {
    if (workspace) rerender();
    else if (!loading) refresh();
  });

  document.addEventListener('submit', async event => {
    const form = event.target.closest?.('#craftGroupCreateForm, #craftGroupInviteForm, #craftGroupInventoryForm');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    try {
      if (form.id === 'craftGroupCreateForm') {
        await createCraftGroupProject(supabase, {
          name: data.get('name'),
          targetItemKey: data.get('targetItemKey'),
          targetQuantity: data.get('targetQuantity'),
        });
        selectedIndex = 0;
        await refresh('✓ Grupowy projekt utworzony. Teraz możesz zaprosić członków.');
      } else if (form.id === 'craftGroupInviteForm') {
        await inviteCraftGroupMember(supabase, workspace.groups[selectedIndex].project.id, data.get('userId'), data.get('role'));
        await refresh('✓ Projekt został udostępniony wybranej osobie.');
      } else {
        await setCraftGroupContribution(supabase, workspace.groups[selectedIndex].project.id, data.get('itemKey'), data.get('quantity'));
        await refresh('✓ Twój wkład został zapisany we wspólnym magazynie.');
      }
    } catch (error) {
      rerender(error?.message || String(error));
    }
  });

  document.addEventListener('click', async event => {
    const step = event.target.closest?.('[data-group-project-step]');
    if (step && workspace?.groups?.length) {
      selectedIndex = (selectedIndex + Number(step.dataset.groupProjectStep) + workspace.groups.length) % workspace.groups.length;
      rerender();
      return;
    }
    const action = event.target.closest?.('[data-group-action]');
    if (!action || !workspace?.groups?.[selectedIndex]) return;
    const group = workspace.groups[selectedIndex];
    try {
      if (action.dataset.groupAction === 'remove-member') {
        if (!window.confirm('Usunąć tę osobę z grupowego projektu?')) return;
        await removeCraftGroupMember(supabase, group.project.id, action.dataset.userId);
        await refresh('✓ Członek został usunięty z projektu.');
      } else if (action.dataset.groupAction === 'toggle-status') {
        await updateCraftGroupProject(supabase, group.project.id, { status: group.project.status === 'active' ? 'paused' : 'active' });
        await refresh('✓ Status projektu został zmieniony.');
      } else if (action.dataset.groupAction === 'delete-project') {
        if (!window.confirm('Usunąć grupowy projekt razem ze wspólnym magazynem?')) return;
        await deleteCraftGroupProject(supabase, group.project.id);
        selectedIndex = 0;
        await refresh('✓ Grupowy projekt został usunięty.');
      }
    } catch (error) {
      rerender(error?.message || String(error));
    }
  });

  const style = document.createElement('style');
  style.id = 'craftGroupPlannerStyles';
  style.textContent = `
    .craft-group-nav[data-zone-view="group-craft"] .zone-nav-icon{background-position:33.333% 100%}
    .craft-group-section{display:grid;gap:12px;padding-top:22px;border-top:1px solid #493b25}.craft-group-heading{display:flex;justify-content:space-between;gap:16px;align-items:center}.craft-group-heading small{color:#d2a74e;font-size:10px;font-weight:900;letter-spacing:.12em}.craft-group-heading h4{margin:5px 0 6px;color:#f0dfb8;font:700 22px Georgia}.craft-group-heading p{margin:0;color:#8d887f;font-size:12px}.craft-group-mark{display:grid;place-items:center;width:48px;height:48px;border:1px solid #765925;color:#d8ad55;font-size:23px}.craft-group-steps,.craft-group-howto{margin:0;border:1px solid #3d3220;background:#11130f;padding:12px 14px;color:#b7ad99;font-size:11px;line-height:1.5}.craft-group-steps>b{color:#e6ca85}.craft-group-steps ol{margin:7px 0 0;padding-left:19px}.craft-group-steps li{padding:2px 0}.craft-group-howto{border-left:3px solid #8a6325}.craft-group-switcher{display:flex;justify-content:flex-end;align-items:center;gap:7px;color:#b79451;font-size:11px}.craft-group-switcher button{width:30px;height:28px;border:1px solid #765925;background:#17120b;color:#e5bd65;font-size:18px;cursor:pointer}.craft-group-create-box,.craft-group-project-card{border:1px solid #4b3a21;background:linear-gradient(145deg,#0d1110,#090c0c);padding:18px}.craft-group-create-box>div>b{color:#e9d5a7;font:700 18px Georgia}.craft-group-create-box p{color:#8d887f;font-size:11px;line-height:1.5}.craft-group-form{display:grid;grid-template-columns:minmax(170px,1fr) minmax(170px,1fr) 110px auto;gap:8px;align-items:end;margin-top:13px}.craft-group-form label{display:grid;gap:5px;color:#aaa08e;font-size:10px;font-weight:800}.craft-group-form input,.craft-group-form select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #4a3c25;background:#070b0b;color:#ddd}.craft-group-form button,.craft-group-actions button{padding:10px 12px;border:1px solid #765925;background:#18130b;color:#e5bd65;font-weight:900;font-size:10px;cursor:pointer}.craft-group-form button{min-height:40px;background:#8a6325;color:#fff1cb}.craft-group-form-hint{margin:8px 0 0;color:#777269;font-size:10px;line-height:1.4}.craft-group-feedback{min-height:17px;margin:0;color:#d9b45e;font-size:11px}.craft-group-project-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.craft-group-project-head small{color:#c69a48;font-size:9px;font-weight:900;letter-spacing:.1em}.craft-group-project-head h4{margin:5px 0;color:#ead9b3;font:700 20px Georgia}.craft-group-project-head p{margin:0;color:#8d887f;font-size:12px}.craft-group-actions{display:flex;gap:6px;align-items:center}.craft-group-actions [data-group-action="delete"]{border-color:#55302b;background:#170d0c;color:#d58d81}.craft-group-badge{padding:7px 9px;border:1px solid #4e462e;color:#d2a74e;font-size:9px;font-weight:900}.craft-group-progress{display:grid;gap:7px;margin:16px 0}.craft-group-progress>div:first-child{display:flex;justify-content:space-between;color:#958e81;font-size:11px}.craft-group-progress b{color:#f0c767;font-size:17px}.craft-group-progress small{color:#8d887f;font-size:10px}.craft-group-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.craft-group-box{border:1px solid #3d3220;background:#0a0e0e;padding:14px}.craft-group-box-head{display:flex;justify-content:space-between;gap:10px;padding-bottom:9px;border-bottom:1px solid #302719}.craft-group-box-head b{color:#d9bd7a;font-size:10px;letter-spacing:.08em}.craft-group-box-head span{color:#777269;font-size:10px}.craft-group-stock-list,.craft-group-members{display:grid}.craft-group-stock-row,.craft-group-member{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #282117}.craft-group-stock-name,.craft-group-member{display:flex;gap:8px;min-width:0;align-items:center}.craft-group-stock-name b,.craft-group-member b{display:block;overflow:hidden;color:#d8d2c8;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.craft-group-stock-name small,.craft-group-member small{display:block;color:#777269;font-size:8px}.craft-group-stock-row>strong{color:#e4c77f;font-size:12px}.craft-group-stock-row>span{color:#8d887f;font-size:9px;white-space:nowrap}.craft-group-member-avatar{display:grid;place-items:center;width:25px;height:25px;border:1px solid #5c4827;color:#d8ad55;font-size:12px}.craft-group-member button{margin-left:auto;width:23px;height:23px;border:1px solid #55302b;background:#170d0c;color:#d58d81;cursor:pointer}.craft-group-note,.craft-group-empty,.craft-group-loading{padding:13px;color:#837d72;font-size:11px;line-height:1.5}.craft-group-box .craft-group-form{grid-template-columns:1fr 110px auto}.craft-group-section .craft-item-icon{width:28px;height:28px;flex:0 0 28px}.craft-group-section .craft-item-icon img{width:28px;height:28px}
    @media(max-width:760px){.craft-group-heading{align-items:flex-start}.craft-group-heading h4{font-size:19px}.craft-group-mark{width:40px;height:40px;font-size:19px}.craft-group-create-box,.craft-group-project-card{padding:14px}.craft-group-form,.craft-group-box .craft-group-form{grid-template-columns:1fr}.craft-group-form button{grid-column:1/-1}.craft-group-project-head,.craft-group-actions{display:grid}.craft-group-actions{grid-template-columns:1fr 1fr}.craft-group-badge{justify-self:start}.craft-group-grid{grid-template-columns:1fr}.craft-group-stock-row{grid-template-columns:1fr auto}.craft-group-stock-row>span{grid-column:1/-1;margin-left:36px}.craft-group-stock-name{min-width:0}}
  `;
  document.head.appendChild(style);
}

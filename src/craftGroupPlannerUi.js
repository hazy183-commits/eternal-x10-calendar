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
import { buildRecipeBook } from './craftPlannerEngine.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const collapsedGroupProjectIds = new Set();

const GROUP_INVENTORY_CATEGORIES = ['material', 'recipe'];

const pickerItems = (workspace, craftableOnly = false, categories = null) => {
  const craftable = new Set((workspace.recipes || []).map(row => row.output_item_key));
  return (workspace.items || []).filter(item => (
    (!craftableOnly || craftable.has(item.item_key))
    && (!categories || categories.includes(item.category))
  ));
};

const pickerGrade = item => {
  const grade = String(item?.grade || '').trim().toUpperCase();
  if (grade.startsWith('S')) return 'S';
  if (grade.startsWith('A')) return 'A';
  return '';
};

const sortPickerItems = items => [...items].sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'pl'));

const pickerGroups = (items, mode = 'target') => {
  if (mode === 'inventory') {
    return [
      ['material', '★ Materiały craftowane'],
      ['recipe', '★ Receptury'],
    ].map(([category, label]) => ({
      category,
      label,
      items: sortPickerItems(items.filter(item => item.category === category)),
    })).filter(group => group.items.length);
  }

  if (mode === 'target') {
    const definitions = [
      ['weapon-s', '⚒ S Grade — Broń 60%', item => item.category === 'weapon' && pickerGrade(item) === 'S'],
      ['weapon-a', '⚒ A Grade — Broń 60%', item => item.category === 'weapon' && pickerGrade(item) === 'A'],
      ['armor-s', '⚒ S Grade — Armor 60%', item => item.category === 'armor' && pickerGrade(item) === 'S'],
      ['armor-a', '⚒ A Grade — Armor 60%', item => item.category === 'armor' && pickerGrade(item) === 'A'],
      ['weapon-other', '⚒ Pozostałe bronie', item => item.category === 'weapon'],
      ['armor-other', '⚒ Pozostały armor', item => item.category === 'armor'],
    ];
    const grouped = definitions.map(([category, label, matches]) => ({
      category,
      label,
      items: sortPickerItems(items.filter(matches)),
    })).filter(group => group.items.length);
    const known = new Set(grouped.flatMap(group => group.items.map(item => item.item_key)));
    const otherItems = sortPickerItems(items.filter(item => !known.has(item.item_key)));
    if (otherItems.length) grouped.push({ category: 'other', label: '⚒ Pozostałe przedmioty', items: otherItems });
    return grouped;
  }

  const definitions = [
    ['weapon', 'BRONIE', item => item.category === 'weapon'],
    ['armor', 'ARMORY', item => item.category === 'armor'],
    ['material', 'MATERIAŁY', item => item.category === 'material'],
    ['component', 'CZĘŚCI', item => item.category === 'component'],
    ['recipe', 'RECEPTURY', item => item.category === 'recipe'],
  ];
  const groups = definitions.map(([category, label, matches]) => ({
    category,
    label,
    items: sortPickerItems(items.filter(matches)),
  })).filter(group => group.items.length);
  const known = new Set(groups.flatMap(group => group.items.map(item => item.item_key)));
  const otherItems = sortPickerItems(items.filter(item => !known.has(item.item_key)));
  if (otherItems.length) groups.push({ category: 'other', label: 'POZOSTAŁE', items: otherItems });
  return groups;
};

const pickerOptions = (items, selectedItemKey = '', mode = 'target', placeholder = 'Wybierz przedmiot…') => `${selectedItemKey ? '' : `<option value="" selected disabled>${escapeHtml(placeholder)}</option>`}${pickerGroups(items, mode).map(group => `
  <optgroup label="${group.label}">
    ${group.items.map(item => `<option value="${escapeHtml(item.item_key)}"${item.item_key === selectedItemKey ? ' selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
  </optgroup>`).join('')}`;

const renderItemPicker = (workspace, { name, craftableOnly = false, categories = null, selectedItemKey = '', compact = false, mode = 'target', placeholder = 'Wybierz przedmiot…', openFirstCategory = false } = {}) => {
  const items = pickerItems(workspace, craftableOnly, categories);
  const selected = selectedItemKey ? (items.find(item => item.item_key === selectedItemKey) || (mode === 'inventory' ? null : items[0])) : (mode === 'inventory' ? null : items[0]);
  const groups = pickerGroups(items, mode);
  const selectedKey = selected?.item_key || '';
  const currentLabel = selected?.name || (items.length ? placeholder : 'Brak dostępnych przedmiotów');
  return `<div class="craft-group-picker${compact ? ' is-compact' : ''}" data-group-picker>
    <select class="craft-group-picker-select" name="${escapeHtml(name)}" required aria-label="Wybierz przedmiot">
      ${pickerOptions(items, selectedKey, mode, placeholder)}
    </select>
    <details class="craft-group-picker-dropdown">
      <summary class="craft-group-picker-current" data-group-picker-current>
      ${selected ? craftItemIconMarkup(selected, 'craft-group-picker-current-icon') : '<span class="craft-group-picker-current-icon is-placeholder" aria-hidden="true">⚒</span>'}
      <span data-group-picker-current-name>${escapeHtml(currentLabel)}</span>
      <span class="craft-group-picker-current-arrow" aria-hidden="true">⌄</span>
      </summary>
      <div class="craft-group-picker-groups" aria-label="Przedmioty pogrupowane kategoriami">
      ${groups.map((group, index) => `<details class="craft-group-picker-category"${openFirstCategory && index === 0 ? ' open' : ''}>
        <summary>${escapeHtml(group.label)} <small>${group.items.length}</small></summary>
        <div class="craft-group-picker-items">
          ${group.items.map(item => `<button type="button" class="craft-group-picker-item${item.item_key === selectedKey ? ' is-selected' : ''}" data-group-picker-item="${escapeHtml(item.item_key)}" data-group-picker-name="${escapeHtml(item.name)}" aria-pressed="${item.item_key === selectedKey ? 'true' : 'false'}">
            <span>${escapeHtml(item.name)}</span>
          </button>`).join('')}
        </div>
      </details>`).join('')}
      ${groups.length ? '' : '<div class="craft-group-picker-empty">Brak dostępnych przedmiotów.</div>'}
      </div>
    </details>
  </div>`;
};

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

const ensureGroupRoot = () => {
  const panel = document.querySelector('[data-zone-panel="craft"]');
  const individualRoot = panel?.querySelector('#craftWorkspaceRoot');
  if (!panel) return null;
  let root = panel.querySelector('#craftGroupWorkspaceRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'craftGroupWorkspaceRoot';
    root.className = 'craft-group-workspace';
    root.hidden = true;
    if (individualRoot) individualRoot.after(root);
    else panel.appendChild(root);
  }
  return root;
};

const ensureSection = () => {
  const root = ensureGroupRoot();
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

const groupInventoryRows = (group, workspace) => {
  const allowed = new Set(GROUP_INVENTORY_CATEGORIES);
  return (group.plan?.inventory || []).filter(row => {
    const item = workspace.items.find(candidate => candidate.item_key === row.itemKey);
    return allowed.has(item?.category);
  });
};

const renderGroupInventoryRows = (group, workspace, userId, canEditInventory) => {
  const own = new Map((group.contributions || []).filter(row => String(row.user_id) === String(userId)).map(row => [row.item_key, Number(row.quantity || 0)]));
  const rows = groupInventoryRows(group, workspace);
  if (!rows.length) return '<div class="craft-inventory-empty"><span>□</span><b>Magazyn jest pusty</b><small>Dodaj pierwszy materiał lub receptę.</small></div>';
  return rows.map(row => {
    const item = workspace.items.find(candidate => candidate.item_key === row.itemKey) || { item_key: row.itemKey, name: row.name };
    const mine = own.get(row.itemKey) || 0;
    const slot = canEditInventory
      ? `<button class="craft-inventory-slot" type="button" data-group-edit-stock="${escapeHtml(row.itemKey)}" data-current="${mine}" title="${escapeHtml(row.name)} — kliknij, aby zmienić swój wkład">${craftItemIconMarkup({ ...item, name: row.name }, 'craft-item-icon craft-inventory-icon')}<strong>${fmt(row.quantity)}</strong></button>`
      : `<div class="craft-inventory-slot is-readonly">${craftItemIconMarkup({ ...item, name: row.name }, 'craft-item-icon craft-inventory-icon')}<strong>${fmt(row.quantity)}</strong></div>`;
    return `<div class="craft-inventory-row craft-group-inventory-row" data-craft-stock-name="${escapeHtml(`${row.name} ${row.itemKey}`.toLocaleLowerCase('pl'))}">
      ${slot}
      <div class="craft-inventory-caption"><b title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</b><span class="craft-inventory-counts"><em class="is-available"><small>Łącznie</small><strong>${fmt(row.quantity)}</strong></em><em class="is-reserved"><small>Twój wkład</small><strong>${fmt(mine)}</strong></em></span></div>
    </div>`;
  }).join('');
};

const renderGroupInventoryPreview = (group, workspace) => {
  const rows = groupInventoryRows(group, workspace).slice(0, 6);
  const icons = rows.map(row => {
    const item = workspace.items.find(candidate => candidate.item_key === row.itemKey) || { item_key: row.itemKey, name: row.name };
    return craftItemIconMarkup({ ...item, name: row.name }, 'craft-item-icon craft-inventory-preview-icon');
  }).join('');
  return `${icons}${Array.from({ length: Math.max(0, 6 - rows.length) }, () => '<span class="craft-inventory-preview-empty"></span>').join('')}`;
};

const renderGroupInventoryWindow = (group, workspace, userId, canEditInventory, isOpen) => {
  const rows = groupInventoryRows(group, workspace);
  const count = rows.length;
  return `
    <button class="craft-inventory-launch craft-group-inventory-launch" type="button" data-group-open-inventory aria-haspopup="dialog">
      <span class="craft-inventory-launch-art" aria-hidden="true"><img src="/assets/interlude/icons/etc_jewel_box_i00.png" alt=""></span>
      <span class="craft-inventory-launch-copy"><small>WSPÓLNY MAGAZYN</small><b>Stan materiałów</b><em>${count} ${count === 1 ? 'pozycja' : 'pozycji'}</em></span>
      <span class="craft-inventory-preview" aria-hidden="true">${renderGroupInventoryPreview(group, workspace)}</span>
      <strong>Otwórz magazyn ›</strong>
    </button>
    <div class="craft-inventory-modal craft-group-inventory-modal" data-group-inventory-modal${isOpen ? '' : ' hidden'}>
      <button class="craft-inventory-backdrop" type="button" data-group-close-inventory aria-label="Zamknij magazyn"></button>
      <section class="craft-inventory-window" role="dialog" aria-modal="true" aria-labelledby="craftGroupInventoryTitle">
        <header><span></span><h4 id="craftGroupInventoryTitle">Wspólny magazyn</h4><div><small>(${count}/250)</small><button type="button" data-group-close-inventory aria-label="Zamknij">×</button></div></header>
        <div class="craft-inventory-toolbar"><button type="button" class="is-active">All</button><span>Materiały i recepty</span><input class="craft-search" id="craftGroupInventorySearch" type="search" placeholder="Szukaj…" aria-label="Szukaj materiału lub recepty"></div>
        <div class="craft-inventory-list craft-group-inventory-list">${renderGroupInventoryRows(group, workspace, userId, canEditInventory)}</div>
        ${canEditInventory ? `<form id="craftGroupInventoryForm" class="craft-group-form"><label><span>Dodaj materiał lub receptę</span>${renderItemPicker(workspace, { name: 'itemKey', categories: GROUP_INVENTORY_CATEGORIES, compact: true, mode: 'inventory', placeholder: 'Wybierz materiał lub receptę…' })}</label><label><span>Ilość, którą dodajesz</span><input name="quantity" type="number" min="0" step="1" value="0" required></label><button type="submit">DODAJ DO MAGAZYNU</button></form><p class="craft-group-form-hint">Kliknij pole wyboru, aby rozwinąć listę. Materiały i receptury są pogrupowane jak w magazynie indywidualnym.</p>` : '<p class="craft-group-note">Masz podgląd tego magazynu. Właściciel nie nadał Ci uprawnień do jego edycji.</p>'}
        <footer><span>Kliknij ikonę, aby zmienić swój wkład.</span><span><i></i> łącznie <i></i> Twój wkład</span></footer>
      </section>
    </div>`;
};

const groupRequirementTree = (group, workspace) => {
  const itemIndex = new Map((workspace.items || []).map(item => [item.item_key, item]));
  const recipeBook = buildRecipeBook(workspace.recipes || [], workspace.components || []);
  const targetKey = group.project.target_item_key;
  const targetQuantity = Number(group.project.target_quantity || 0);

  const buildNode = (itemKey, quantity, trail = new Set()) => {
    const item = itemIndex.get(itemKey) || { item_key: itemKey, name: itemKey };
    const recipe = recipeBook.get(itemKey);
    const nextTrail = new Set(trail).add(itemKey);
    const outputQuantity = Math.max(1, Number(recipe?.outputQuantity || 1));
    const crafts = Math.ceil(quantity / outputQuantity);
    const children = recipe?.components?.length && !trail.has(itemKey)
      ? recipe.components.map(component => buildNode(component.itemKey, Number(component.quantity || 0) * crafts, nextTrail))
      : [];
    return {
      itemKey,
      name: item.name || itemKey,
      quantity,
      children,
    };
  };

  const targetRecipe = recipeBook.get(targetKey);
  if (!targetRecipe?.components?.length) return [buildNode(targetKey, targetQuantity)];
  const targetCrafts = Math.ceil(targetQuantity / Math.max(1, Number(targetRecipe.outputQuantity || 1)));
  return targetRecipe.components.map(component => buildNode(
    component.itemKey,
    Number(component.quantity || 0) * targetCrafts,
    new Set([targetKey]),
  ));
};

const renderGroupRequirementNode = (node, requirements, workspace, depth = 0) => {
  const item = workspace.items.find(candidate => candidate.item_key === node.itemKey) || { item_key: node.itemKey, name: node.name };
  const requirement = requirements.get(node.itemKey);
  const missing = node.children.length ? null : Number(requirement?.missing ?? node.quantity);
  const covered = missing === null ? null : Math.max(0, node.quantity - missing);
  const icon = craftItemIconMarkup({ ...item, name: node.name }, 'craft-item-icon');
  const name = `<div class="craft-group-stock-name">${icon}<span><b>${escapeHtml(node.name)}</b><small>${escapeHtml(node.itemKey)}</small></span></div>`;

  if (!node.children.length) {
    return `<div class="craft-group-requirement-row craft-group-requirement-leaf" data-requirement-depth="${depth}">
      ${name}
      <span><em>Potrzeba</em><strong>${fmt(node.quantity)}</strong></span>
      <span><em>Pokryte</em><strong>${fmt(covered)}</strong></span>
      <span class="${missing ? 'craft-missing' : 'craft-ok'}"><em>Brakuje</em><strong>${fmt(missing)}</strong></span>
    </div>`;
  }

  return `<details class="craft-group-requirement-node" data-requirement-depth="${depth}">
    <summary class="craft-group-requirement-row craft-group-requirement-summary">
      ${name}
      <span><em>Potrzeba</em><strong>${fmt(node.quantity)}</strong></span>
      <span><em>Składniki</em><strong>${node.children.length}</strong></span>
    </summary>
    <div class="craft-group-requirement-children">${node.children.map(child => renderGroupRequirementNode(child, requirements, workspace, depth + 1)).join('')}</div>
  </details>`;
};

const renderGroupRequirements = (group, workspace) => {
  const tree = groupRequirementTree(group, workspace);
  if (!tree.length) return '<div class="craft-group-empty">Brak składników do pokazania.</div>';
  const requirements = new Map((group.plan?.requirements || []).map(row => [row.itemKey, row]));
  return tree.map(node => renderGroupRequirementNode(node, requirements, workspace)).join('');
};

const renderCandidates = (workspace, group) => {
  const existing = new Set((group.members || []).map(member => String(member.user_id)));
  return (workspace.candidates || [])
    .filter(profile => !existing.has(String(profile.id)))
    .map(profile => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.nickname)}</option>`)
    .join('');
};

const renderAdditionalGroupProjectForm = workspace => `
  <details class="craft-group-create-collapsible">
    <summary>＋ UTWÓRZ KOLEJNY PROJEKT GRUPOWY</summary>
    <section class="craft-box craft-group-create-box craft-group-create-box-compact">
      <p>Każdy projekt ma osobny wspólny magazyn, uczestników i postęp.</p>
      <form id="craftGroupCreateForm" class="craft-form project craft-group-create-form">
        <label class="craft-control"><span>Nazwa projektu grupowego</span><input name="name" maxlength="80" required placeholder="Np. Draco Bow dla CP"></label>
        <label class="craft-control craft-group-target-control"><span>Broń lub armor</span>${renderItemPicker(workspace, { name: 'targetItemKey', craftableOnly: true, categories: ['weapon', 'armor'], mode: 'target', placeholder: 'Wybierz broń lub armor…' })}</label>
        <label class="craft-control"><span>Ilość</span><input name="targetQuantity" type="number" min="1" step="1" value="1" required></label>
        <button type="submit">UTWÓRZ PROJEKT</button>
      </form>
    </section>
  </details>`;

function renderEmpty(section, workspace, feedback = '') {
  section.innerHTML = `
    <div class="craft-group-heading"><div><small>GRUPOWY CRAFT</small><h4>Wspólny projekt i magazyn</h4><p>Utwórz jeden cel, zaproś członków i zbierajcie materiały razem.</p></div><span class="craft-group-mark">⚒</span></div>
    <div class="craft-group-steps"><b>Jak zacząć?</b><ol><li>Utwórz projekt, podając jego nazwę, przedmiot i ilość.</li><li>Po utworzeniu wybierz materiał i kliknij „Dodaj do magazynu”.</li><li>W sekcji „Uczestnicy” udostępnij projekt innym osobom.</li></ol></div>
    <section class="craft-section craft-group-create-section">
      <div class="craft-section-title"><div><small>NOWY PROJEKT GRUPOWY</small><h4>Dodaj projekt craftu</h4></div></div>
      <section class="craft-box craft-group-create-box">
        <div class="craft-step-head"><span class="craft-step-number">1</span><div><small class="craft-step-kicker">WSPÓLNY CEL</small><h4>Utwórz grupowy projekt</h4></div></div>
        <p>Właściciel zarządza projektem, a zaproszone osoby mogą uzupełniać wspólny magazyn.</p>
        <form id="craftGroupCreateForm" class="craft-form project craft-group-create-form">
          <label class="craft-control"><span>Nazwa projektu grupowego</span><input name="name" maxlength="80" required placeholder="Np. Draco Bow dla CP"></label>
          <label class="craft-control craft-group-target-control"><span>Broń lub armor</span>${renderItemPicker(workspace, { name: 'targetItemKey', craftableOnly: true, categories: ['weapon', 'armor'], mode: 'target', placeholder: 'Wybierz broń lub armor…' })}</label>
          <label class="craft-control"><span>Ilość</span><input name="targetQuantity" type="number" min="1" step="1" value="1" required></label>
          <button type="submit">UTWÓRZ PROJEKT</button>
        </form>
      </section>
      <p class="craft-group-feedback">${escapeHtml(feedback)}</p>
    </section>`;
}

function renderGroup(section, workspace, selectedIndex = 0, feedback = '', inventoryOpen = false) {
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
  const mainRequirementCount = groupRequirementTree(group, workspace).length;
  const projectCollapsed = collapsedGroupProjectIds.has(String(group.project.id));
  const targetItem = workspace.items.find(item => item.item_key === group.project.target_item_key) || {
    item_key: group.project.target_item_key,
    name: group.plan?.targetName || group.project.target_item_key,
  };

  section.innerHTML = `
    <div class="craft-group-heading"><div><small>GRUPOWY CRAFT</small><h4>Wspólny projekt i magazyn</h4><p>Materiały wszystkich zaproszonych osób liczą się do jednego celu.</p></div><span class="craft-group-mark">⚒</span></div>
    <p class="craft-group-howto">Kliknij skrzynkę, aby otworzyć wspólny magazyn. Możesz dodać tylko materiały i recepty; właściciel udostępnia projekt w sekcji „Uczestnicy”.</p>
    ${renderAdditionalGroupProjectForm(workspace)}
    <div class="craft-group-switcher">${groups.length > 1 ? `<button type="button" data-group-project-step="-1" aria-label="Poprzedni projekt">‹</button><span>${index + 1} / ${groups.length}</span><button type="button" data-group-project-step="1" aria-label="Następny projekt">›</button>` : ''}</div>
    <article class="craft-group-project-card${projectCollapsed ? ' is-collapsed' : ''}" data-craft-group-project>
      <div class="craft-group-project-head"><div class="craft-group-project-identity"><button class="craft-group-project-toggle" type="button" data-group-toggle-project aria-expanded="${projectCollapsed ? 'false' : 'true'}" aria-label="${projectCollapsed ? 'Rozwiń' : 'Zwiń'} projekt"><span aria-hidden="true">${projectCollapsed ? '›' : '⌄'}</span></button><div><small>${escapeHtml(statusLabel(group.project.status))} · WŁAŚCICIEL: ${escapeHtml(group.project.ownerNickname)}</small><h4>${escapeHtml(group.project.name)}</h4><div class="craft-group-project-target">${craftItemIconMarkup({ ...targetItem, name: group.plan?.targetName || targetItem.name }, 'craft-item-icon craft-target-icon')}<span><small>TWORZYMY</small><b>${escapeHtml(group.plan?.targetName || targetItem.name)}</b><p>${fmt(group.project.target_quantity)} szt.</p></span></div></div></div><div class="craft-group-actions">${owner ? `<button type="button" data-group-action="toggle-status">${group.project.status === 'active' ? 'WSTRZYMAJ' : 'WZNÓW'}</button><button type="button" data-group-action="delete-project">USUŃ</button>` : '<span class="craft-group-badge">UDOSTĘPNIONY</span>'}</div></div>
      <div class="craft-group-project-body"${projectCollapsed ? ' hidden' : ''}>
      <div class="craft-group-progress"><div><span>Postęp wspólnego projektu</span><b>${progress}%</b></div><div class="craft-progress-track"><i style="--craft-project-progress:${progress}%"></i></div><small>${missing ? `Brakuje łącznie: ${fmt(missing)}` : 'Materiały pokryte ✓'}</small></div>
      <section class="craft-group-requirements craft-box"><div class="craft-group-box-head"><b>GŁÓWNE SKŁADNIKI DO WYKONANIA</b><span>${mainRequirementCount} ${mainRequirementCount === 1 ? 'składnik' : 'składniki'}</span></div><div class="craft-group-requirement-list">${renderGroupRequirements(group, workspace)}</div></section>
      <div class="craft-group-grid">
        <section class="craft-group-box"><div class="craft-group-box-head"><b>WSPÓLNY MAGAZYN</b><span>${groupInventoryRows(group, workspace).length} materiałów</span></div>${renderGroupInventoryWindow(group, workspace, userId, canEditInventory, inventoryOpen)}</section>
        <section class="craft-group-box"><div class="craft-group-box-head"><b>UCZESTNICY</b><span>${(group.members?.length || 0) + 1} osób</span></div><div class="craft-group-members">${renderMembers(group, userId, owner)}</div>${owner ? `<form id="craftGroupInviteForm" class="craft-group-form"><label><span>Dodaj osobę</span><select name="userId" required><option value="">Wybierz członka klanu</option>${candidates}</select></label><label><span>Dostęp</span><select name="role"><option value="editor">Może uzupełniać magazyn</option><option value="viewer">Tylko podgląd</option></select></label><button type="submit">UDOSTĘPNIJ PROJEKT</button></form>` : ''}</section>
      </div>
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
  let groupInventoryOpen = false;

  const focusProjectSection = section => {
    const target = section?.querySelector('[data-craft-group-project]');
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const setWorkspaceMode = groupActive => {
    const individualRoot = document.querySelector('#craftWorkspaceRoot');
    const groupRoot = ensureGroupRoot();
    if (individualRoot) individualRoot.hidden = groupActive;
    if (groupRoot) groupRoot.hidden = !groupActive;
  };

  const refresh = async (feedback = '', { focusProject = false } = {}) => {
    setWorkspaceMode(true);
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
      renderGroup(currentSection, workspace, selectedIndex, feedback, groupInventoryOpen);
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
    if (workspace && section) renderGroup(section, workspace, selectedIndex, message, groupInventoryOpen);
    else refresh(message);
  };

  setWorkspaceMode(false);
  window.addEventListener('orzel:craft-workspace-opened', event => {
    const groupActive = event.detail?.view === 'group-craft' || event.detail?.focus === 'project';
    setWorkspaceMode(groupActive);
    if (groupActive) refresh('', { focusProject: true });
  });
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
        selectedIndex = workspace?.groups?.length ? Number.MAX_SAFE_INTEGER : 0;
        groupInventoryOpen = false;
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
    const toggleGroupProject = event.target.closest?.('[data-group-toggle-project]');
    if (toggleGroupProject && workspace?.groups?.[selectedIndex]) {
      const projectId = String(workspace.groups[selectedIndex].project.id);
      if (collapsedGroupProjectIds.has(projectId)) collapsedGroupProjectIds.delete(projectId);
      else collapsedGroupProjectIds.add(projectId);
      rerender();
      return;
    }

    const openGroupInventory = event.target.closest?.('[data-group-open-inventory]');
    if (openGroupInventory) {
      groupInventoryOpen = true;
      const modal = ensureSection()?.querySelector('[data-group-inventory-modal]');
      if (modal) modal.hidden = false;
      window.setTimeout(() => ensureSection()?.querySelector('#craftGroupInventorySearch')?.focus(), 0);
      return;
    }

    const closeGroupInventory = event.target.closest?.('[data-group-close-inventory]');
    if (closeGroupInventory) {
      groupInventoryOpen = false;
      const modal = ensureSection()?.querySelector('[data-group-inventory-modal]');
      if (modal) modal.hidden = true;
      return;
    }

    const editGroupStock = event.target.closest?.('[data-group-edit-stock]');
    if (editGroupStock && workspace?.groups?.[selectedIndex]) {
      const next = window.prompt('Podaj swój wkład do magazynu:', editGroupStock.dataset.current || '0');
      if (next === null) return;
      try {
        await setCraftGroupContribution(supabase, workspace.groups[selectedIndex].project.id, editGroupStock.dataset.groupEditStock, next);
        await refresh('✓ Twój wkład został zapisany we wspólnym magazynie.');
      } catch (error) {
        rerender(error?.message || String(error));
      }
      return;
    }

    const pickerItem = event.target.closest?.('[data-group-picker-item]');
    if (pickerItem) {
      const picker = pickerItem.closest('[data-group-picker]');
      const select = picker?.querySelector('select');
      if (!picker || !select) return;
      select.value = pickerItem.dataset.groupPickerItem || '';
      picker.querySelectorAll('[data-group-picker-item]').forEach(item => {
        const selected = item === pickerItem;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      const pickedItem = workspace?.items?.find(item => item.item_key === pickerItem.dataset.groupPickerItem);
      const current = picker.querySelector('[data-group-picker-current]');
      const currentName = picker.querySelector('[data-group-picker-current-name]');
      if (current && pickedItem) {
        const currentIcon = current.querySelector('.craft-group-picker-current-icon');
        if (currentIcon) currentIcon.outerHTML = craftItemIconMarkup(pickedItem, 'craft-group-picker-current-icon');
      }
      if (currentName) currentName.textContent = pickerItem.dataset.groupPickerName || '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const dropdown = picker.querySelector('.craft-group-picker-dropdown');
      if (dropdown) dropdown.open = false;
      return;
    }
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

  document.addEventListener('input', event => {
    const search = event.target.closest?.('#craftGroupInventorySearch');
    if (!search) return;
    const query = search.value.trim().toLocaleLowerCase('pl');
    for (const row of ensureSection()?.querySelectorAll('.craft-group-inventory-row') || []) {
      row.hidden = Boolean(query) && !String(row.dataset.craftStockName || '').includes(query);
    }
  });

  const style = document.createElement('style');
  style.id = 'craftGroupPlannerStyles';
  style.textContent = `
    .craft-group-nav[data-zone-view="group-craft"] .zone-nav-icon{background-position:33.333% 100%}
    .craft-group-workspace{display:grid;gap:20px;padding-bottom:30px;color:#d8d2c8}.craft-group-section{display:grid;gap:12px;padding-top:22px}.craft-group-heading{display:flex;justify-content:space-between;gap:16px;align-items:center}.craft-group-heading small{color:#d2a74e;font-size:10px;font-weight:900;letter-spacing:.12em}.craft-group-heading h4{margin:5px 0 6px;color:#f0dfb8;font:700 22px Georgia}.craft-group-heading p{margin:0;color:#8d887f;font-size:12px}.craft-group-mark{display:grid;place-items:center;width:48px;height:48px;border:1px solid #765925;color:#d8ad55;font-size:23px}.craft-group-steps,.craft-group-howto{margin:0;border:1px solid #3d3220;background:#11130f;padding:12px 14px;color:#b7ad99;font-size:11px;line-height:1.5}.craft-group-steps>b{color:#e6ca85}.craft-group-steps ol{margin:7px 0 0;padding-left:19px}.craft-group-steps li{padding:2px 0}.craft-group-howto{border-left:3px solid #8a6325}.craft-group-switcher{display:flex;justify-content:flex-end;align-items:center;gap:7px;color:#b79451;font-size:11px}.craft-group-switcher button{width:30px;height:28px;border:1px solid #765925;background:#17120b;color:#e5bd65;font-size:18px;cursor:pointer}.craft-group-create-box,.craft-group-project-card{border:1px solid #4b3a21;background:linear-gradient(145deg,#0d1110,#090c0c);padding:18px}.craft-group-create-box>div>b{color:#e9d5a7;font:700 18px Georgia}.craft-group-create-box p{color:#8d887f;font-size:11px;line-height:1.5}.craft-group-create-collapsible{border:1px solid #4b3a21;background:#0b0f0e}.craft-group-create-collapsible>summary{padding:12px 14px;color:#e5bd65;font-size:11px;font-weight:900;letter-spacing:.08em;cursor:pointer;list-style:none}.craft-group-create-collapsible>summary::-webkit-details-marker{display:none}.craft-group-create-collapsible>summary:before{content:'›';display:inline-block;margin-right:8px;font-size:17px;line-height:10px;transition:transform .15s ease}.craft-group-create-collapsible[open]>summary:before{transform:rotate(90deg)}.craft-group-create-box-compact{border:0;border-top:1px solid #33291b;padding:14px}.craft-group-form{display:grid;grid-template-columns:minmax(170px,1fr) minmax(170px,1fr) 110px auto;gap:8px;align-items:end;margin-top:13px}.craft-group-create-form{grid-template-columns:1.4fr 1fr 110px auto}.craft-group-form label{display:grid;gap:5px;color:#aaa08e;font-size:10px;font-weight:800}.craft-group-form input,.craft-group-form select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #4a3c25;background:#070b0b;color:#ddd}.craft-group-form button,.craft-group-actions button{padding:10px 12px;border:1px solid #765925;background:#18130b;color:#e5bd65;font-weight:900;font-size:10px;cursor:pointer}.craft-group-form button{min-height:40px;background:#8a6325;color:#fff1cb}.craft-group-form-hint{margin:8px 0 0;color:#777269;font-size:10px;line-height:1.4}.craft-group-feedback{min-height:17px;margin:0;color:#d9b45e;font-size:11px}.craft-group-project-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.craft-group-project-identity{display:flex;gap:10px;align-items:flex-start;min-width:0}.craft-group-project-toggle{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;margin-top:2px;border:1px solid #765925;background:#18130b;color:#e5bd65;font-size:20px;line-height:1;cursor:pointer}.craft-group-project-toggle:hover,.craft-group-project-toggle:focus-visible{border-color:#b78a3b;background:#2a2112;outline:none}.craft-group-project-body[hidden]{display:none}.craft-group-project-head small{color:#c69a48;font-size:9px;font-weight:900;letter-spacing:.1em}.craft-group-project-head h4{margin:5px 0;color:#ead9b3;font:700 20px Georgia}.craft-group-project-head p{margin:0;color:#8d887f;font-size:12px}.craft-group-project-target{display:flex;align-items:center;gap:11px;margin-top:8px}.craft-group-project-target .craft-target-icon,.craft-group-project-target .craft-target-icon img{width:48px;height:48px}.craft-group-project-target .craft-target-icon{flex-basis:48px;border-color:#8a6b38;box-shadow:0 0 12px rgba(210,167,78,.16)}.craft-group-project-target>span{display:grid;gap:2px}.craft-group-project-target>span>small{color:#a98749;font-size:8px;letter-spacing:.12em}.craft-group-project-target>span>b{color:#f0dfb8;font-size:14px}.craft-group-project-target>span>p{font-size:11px}.craft-group-actions{display:flex;gap:6px;align-items:center}.craft-group-actions [data-group-action="delete"]{border-color:#55302b;background:#170d0c;color:#d58d81}.craft-group-badge{padding:7px 9px;border:1px solid #4e462e;color:#d2a74e;font-size:9px;font-weight:900}.craft-group-progress{display:grid;gap:7px;margin:16px 0}.craft-group-progress>div:first-child{display:flex;justify-content:space-between;color:#958e81;font-size:11px}.craft-group-progress b{color:#f0c767;font-size:17px}.craft-group-progress small{color:#8d887f;font-size:10px}.craft-group-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.craft-group-box{border:1px solid #3d3220;background:#0a0e0e;padding:14px}.craft-group-box-head{display:flex;justify-content:space-between;gap:10px;padding-bottom:9px;border-bottom:1px solid #302719}.craft-group-box-head b{color:#d9bd7a;font-size:10px;letter-spacing:.08em}.craft-group-box-head span{color:#777269;font-size:10px}.craft-group-stock-list,.craft-group-members{display:grid}.craft-group-stock-row,.craft-group-member{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #282117}.craft-group-stock-name,.craft-group-member{display:flex;gap:8px;min-width:0;align-items:center}.craft-group-stock-name b,.craft-group-member b{display:block;overflow:hidden;color:#d8d2c8;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.craft-group-stock-name small,.craft-group-member small{display:block;color:#777269;font-size:8px}.craft-group-stock-row>strong{color:#e4c77f;font-size:12px}.craft-group-stock-row>span{color:#8d887f;font-size:9px;white-space:nowrap}.craft-group-member-avatar{display:grid;place-items:center;width:25px;height:25px;border:1px solid #5c4827;color:#d8ad55;font-size:12px}.craft-group-member button{margin-left:auto;width:23px;height:23px;border:1px solid #55302b;background:#170d0c;color:#d58d81;cursor:pointer}.craft-group-note,.craft-group-empty,.craft-group-loading{padding:13px;color:#837d72;font-size:11px;line-height:1.5}.craft-group-box .craft-group-form{grid-template-columns:1fr 110px auto}.craft-group-section .craft-item-icon{width:28px;height:28px;flex:0 0 28px}.craft-group-section .craft-item-icon img{width:28px;height:28px}.craft-group-section .craft-group-project-target .craft-item-icon{width:48px;height:48px;flex-basis:48px}.craft-group-section .craft-group-project-target .craft-item-icon img{width:48px;height:48px}
    .craft-group-picker{display:grid;gap:7px;min-width:0}.craft-group-picker-select{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important;opacity:0!important;pointer-events:none!important}.craft-group-picker-current{display:flex;align-items:center;gap:8px;min-height:42px;padding:6px 9px;border:1px solid #4a3c25;background:#070b0b;color:#e5d7b5}.craft-group-picker-current-icon{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px}.craft-group-picker-current-icon img{width:32px;height:32px;object-fit:contain}.craft-group-picker-current-icon.is-placeholder{color:#d6aa55;font-size:18px}.craft-group-picker-groups{display:grid;gap:6px;max-height:250px;overflow:auto;padding-right:2px}.craft-group-picker-category{border:1px solid #3d3220;background:#0d1110}.craft-group-picker-category summary{padding:7px 9px;color:#d9bd7a;font-size:10px;font-weight:900;letter-spacing:.08em;cursor:pointer;list-style:none}.craft-group-picker-category summary::-webkit-details-marker{display:none}.craft-group-picker-category summary::after{content:'⌄';float:right;color:#96733d}.craft-group-picker-category[open] summary::after{content:'⌃'}.craft-group-picker-category summary small{margin-left:5px;color:#777269;font-size:9px}.craft-group-picker-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:6px}.craft-group-picker-item{display:flex;align-items:center;gap:6px;min-width:0;padding:6px;border:1px solid #342a1b;background:#11130f;color:#bdb4a4;text-align:left;font-size:10px;line-height:1.15;cursor:pointer}.craft-group-picker-item:hover,.craft-group-picker-item.is-selected{border-color:#b78a3b;background:#2a2112;color:#f3db9e}.craft-group-picker-item>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.craft-group-picker-item-icon{display:grid;place-items:center;width:28px;height:28px;flex:0 0 28px}.craft-group-picker-item-icon img{width:28px;height:28px;object-fit:contain}.craft-group-picker-empty{padding:10px;color:#837d72;font-size:10px}.craft-group-picker.is-compact .craft-group-picker-groups{max-height:190px}.craft-group-picker.is-compact .craft-group-picker-current{min-height:36px}.craft-group-picker.is-compact .craft-group-picker-current-icon{width:28px;height:28px;flex-basis:28px}.craft-group-picker.is-compact .craft-group-picker-current-icon img{width:28px;height:28px}
    .craft-group-requirements{padding:14px}.craft-group-requirement-list{display:grid}.craft-group-requirement-node{border-top:1px solid #292319}.craft-group-requirement-node>summary{position:relative;list-style:none;cursor:pointer;padding-left:28px}.craft-group-requirement-node>summary::-webkit-details-marker{display:none}.craft-group-requirement-node>summary:before{content:'›';position:absolute;left:3px;top:50%;display:grid;place-items:center;width:18px;height:18px;border:1px solid #614a28;color:#d3a64f;font-size:16px;line-height:1;transform:translateY(-50%);transition:transform .15s ease}.craft-group-requirement-node[open]>summary:before{transform:translateY(-50%) rotate(90deg)}.craft-group-requirement-row{display:grid;grid-template-columns:minmax(190px,1.6fr) repeat(3,minmax(72px,.7fr));gap:8px;align-items:center;padding:9px 0}.craft-group-requirement-row>span{display:grid;gap:2px}.craft-group-requirement-row em{color:#6f6a62;font-size:8px;font-style:normal;text-transform:uppercase}.craft-group-requirement-row strong{color:#c9c2b5;font-size:12px}.craft-group-requirement-row .craft-missing strong{color:#dd8a58}.craft-group-requirement-row .craft-ok strong{color:#6fc184}.craft-group-requirement-summary .craft-group-stock-name{display:flex;align-items:center;gap:8px}.craft-group-expand-hint strong{color:#d5ab59;font-size:10px;text-transform:uppercase}.craft-group-requirement-children{display:grid;margin-left:25px;border-left:1px solid #4a3b23;padding-left:10px}.craft-group-requirement-children .craft-group-requirement-row{background:rgba(17,19,15,.42);padding-left:8px}.craft-group-requirement-children .craft-group-requirement-node{border-top:1px solid #292319}.craft-group-inventory-launch{margin-top:12px}.craft-group-inventory-modal .craft-group-form{margin:10px 14px 0}.craft-group-inventory-row .craft-inventory-slot.is-readonly{cursor:default}.craft-group-inventory-row .craft-inventory-slot.is-readonly:hover{border-color:#4f4636!important;background:linear-gradient(135deg,#24211b,#0c0d0c)!important}
    @media(max-width:760px){.craft-group-heading{align-items:flex-start}.craft-group-heading h4{font-size:19px}.craft-group-mark{width:40px;height:40px;font-size:19px}.craft-group-create-box,.craft-group-project-card{padding:14px}.craft-group-form,.craft-group-box .craft-group-form{grid-template-columns:1fr}.craft-group-form button{grid-column:1/-1}.craft-group-project-head,.craft-group-actions{display:grid}.craft-group-actions{grid-template-columns:1fr 1fr}.craft-group-badge{justify-self:start}.craft-group-grid{grid-template-columns:1fr}.craft-group-stock-row{grid-template-columns:1fr auto}.craft-group-stock-row>span{grid-column:1/-1;margin-left:36px}.craft-group-stock-name{min-width:0}.craft-group-requirement-row{grid-template-columns:1fr 1fr 1fr}.craft-group-requirement-row>.craft-group-stock-name{grid-column:1/-1}.craft-group-requirement-summary:before{grid-row:1 / span 1}.craft-group-requirement-summary{grid-template-columns:1fr 1fr 1fr}.craft-group-requirement-summary>.craft-group-stock-name{grid-column:1/-1}.craft-group-expand-hint strong{font-size:9px}.craft-group-requirement-children{margin-left:12px;padding-left:6px}.craft-group-picker-groups{max-height:220px}.craft-group-picker-item{font-size:9px;padding:5px}}
    @media(max-width:420px){.craft-group-picker-items{grid-template-columns:1fr}}
    .craft-group-picker-dropdown{min-width:0}.craft-group-picker-dropdown>summary{list-style:none}.craft-group-picker-dropdown>summary::-webkit-details-marker{display:none}.craft-group-picker-current{position:relative;padding-right:31px;cursor:pointer}.craft-group-picker-dropdown[open]>summary{border-color:#b78a3b;background:#17140f}.craft-group-picker-current-arrow{position:absolute;right:10px;color:#d5ab59;font-size:15px;line-height:1}.craft-group-picker-dropdown[open] .craft-group-picker-current-arrow{transform:rotate(180deg)}.craft-group-picker-groups{display:grid;grid-template-columns:1fr;gap:0;max-height:250px;overflow:auto;margin-top:3px;padding:5px 6px 6px;border:1px solid #5a4a2e;background:#070b0b;overscroll-behavior:contain}.craft-group-picker-category{border:0;background:transparent}.craft-group-picker-category summary{padding:7px 10px}.craft-group-picker-items{display:grid;grid-template-columns:1fr;padding:0 0 4px}.craft-group-picker-item{display:block;width:100%;min-width:0;padding:6px 10px 6px 24px;border:0;border-bottom:1px solid #17201c;background:transparent;color:#d5d0c6;text-align:left;font-size:10px;font-weight:700;line-height:1.2;cursor:pointer}.craft-group-picker-item:hover,.craft-group-picker-item.is-selected{background:#1d68c5;color:#fff;border-color:#1d68c5}.craft-group-picker-item>span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.craft-group-picker.is-compact .craft-group-picker-groups{max-height:210px}.craft-group-picker.is-compact .craft-group-picker-item{padding-top:5px;padding-bottom:5px}
    @media(max-width:760px){.craft-group-picker-groups{max-height:220px}.craft-group-picker-item{font-size:9px;padding:5px 9px 5px 19px}}
  `;
  document.head.appendChild(style);
}

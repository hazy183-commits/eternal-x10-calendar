import { loadCraftWorkspace } from './craftWorkspace.js';
import { craftItemIconMarkup } from './craftItemIcons.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const openTreeNodes = new Set();
const MAIN_MATERIAL_ORDER = [
  'mat_maestro_anvil_lock',
  'mat_crafted_leather',
  'mat_warsmith_holder',
  'mat_craftsman_mold',
  'mat_maestro_holder',
  'mat_oriharukon',
  'mat_high_grade_suede',
  'mat_compound_braid',
  'mat_durable_metal_plate',
  'mat_synthetic_cokes',
  'mat_mithril_alloy',
  'mat_coarse_bone_powder',
];

function craftableMaterialOrder(recipeBook) {
  const preferred = MAIN_MATERIAL_ORDER.filter(key => recipeBook.get(key)?.components?.length);
  const remaining = [...recipeBook.entries()]
    .filter(([key, recipe]) => key.startsWith('mat_') && recipe?.components?.length && !preferred.includes(key))
    .map(([key]) => key)
    .sort();
  return [...preferred, ...remaining];
}

function buildRecipeBook(workspace) {
  const componentsByRecipe = new Map();
  for (const row of workspace.components || []) {
    const list = componentsByRecipe.get(row.recipe_id) || [];
    list.push({ itemKey: row.component_item_key, quantity: Number(row.quantity || 0) });
    componentsByRecipe.set(row.recipe_id, list);
  }

  const book = new Map();
  for (const recipe of workspace.recipes || []) {
    if (recipe.active === false || !recipe.output_item_key) continue;
    if (book.has(recipe.output_item_key) && recipe.is_primary === false) continue;
    book.set(recipe.output_item_key, {
      id: recipe.id,
      outputQuantity: Number(recipe.output_quantity || 1),
      components: componentsByRecipe.get(recipe.id) || [],
    });
  }
  return book;
}

function buildItemIndex(workspace) {
  return new Map((workspace.items || []).map(item => [item.item_key, item]));
}

export function sortComponentsByRequiredQuantity(components, crafts = 1, itemIndex = new Map()) {
  return [...(components || [])].sort((left, right) => {
    const quantityDifference = Number(left.quantity || 0) * crafts - Number(right.quantity || 0) * crafts;
    if (quantityDifference) return quantityDifference;
    const leftName = itemIndex.get(left.itemKey)?.name || left.itemKey || '';
    const rightName = itemIndex.get(right.itemKey)?.name || right.itemKey || '';
    return leftName.localeCompare(rightName, 'pl');
  });
}

function projectMaps(project) {
  return {
    owned: new Map((project.ownedAllocated || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
    missing: new Map((project.missing || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
    surplus: new Map((project.generatedSurplusUsed || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
  };
}

function flattenLeaves(itemKey, recipeBook, memo = new Map(), trail = new Set()) {
  if (memo.has(itemKey)) return new Map(memo.get(itemKey));
  if (trail.has(itemKey)) return new Map([[itemKey, 1]]);
  const recipe = recipeBook.get(itemKey);
  if (!recipe?.components?.length || itemKey.startsWith('weapon_')) return new Map([[itemKey, 1]]);

  const nextTrail = new Set(trail);
  nextTrail.add(itemKey);
  const result = new Map();
  const outputQty = Math.max(1, Number(recipe.outputQuantity || 1));
  for (const component of recipe.components) {
    const leaves = flattenLeaves(component.itemKey, recipeBook, memo, nextTrail);
    const factor = Number(component.quantity || 0) / outputQty;
    for (const [leafKey, leafQty] of leaves) {
      result.set(leafKey, (result.get(leafKey) || 0) + leafQty * factor);
    }
  }
  memo.set(itemKey, [...result.entries()]);
  return result;
}

function collapseFlatRecipe(components, recipeBook) {
  if (!components?.length) return [];

  // If the source recipe is already hierarchical (e.g. Draconic Bow after verification), keep it untouched.
  const alreadyStructured = components.some(component =>
    component.itemKey.startsWith('mat_') && recipeBook.get(component.itemKey)?.components?.length
  );
  if (alreadyStructured) return components;

  const available = new Map();
  const originalOrder = [];
  for (const component of components) {
    const qty = Number(component.quantity || 0);
    available.set(component.itemKey, (available.get(component.itemKey) || 0) + qty);
    originalOrder.push(component.itemKey);
  }

  const memo = new Map();
  const collapsed = [];
  for (const materialKey of craftableMaterialOrder(recipeBook)) {
    const recipe = recipeBook.get(materialKey);
    if (!recipe?.components?.length) continue;
    const leaves = flattenLeaves(materialKey, recipeBook, memo);
    if (!leaves.size) continue;

    let crafts = Infinity;
    for (const [leafKey, leafQty] of leaves) {
      if (!(leafQty > 0)) continue;
      crafts = Math.min(crafts, Math.floor((available.get(leafKey) || 0) / leafQty));
    }
    if (!Number.isFinite(crafts) || crafts <= 0) continue;

    const outputQty = Math.max(1, Number(recipe.outputQuantity || 1));
    collapsed.push({ itemKey: materialKey, quantity: crafts * outputQty });
    for (const [leafKey, leafQty] of leaves) {
      available.set(leafKey, Math.max(0, (available.get(leafKey) || 0) - leafQty * crafts));
    }
  }

  // Preserve verified direct/key materials and anything that could not be represented by a common subrecipe.
  const seen = new Set();
  for (const itemKey of originalOrder) {
    if (seen.has(itemKey)) continue;
    seen.add(itemKey);
    const qty = Math.round((available.get(itemKey) || 0) * 1e6) / 1e6;
    if (qty > 0) collapsed.push({ itemKey, quantity: qty });
  }

  return collapsed.length ? collapsed : components;
}

function nodeStatus(itemKey, quantity, recipeBook, maps) {
  const owned = Math.min(quantity, maps.owned.get(itemKey) || 0);
  const virtual = Math.min(Math.max(0, quantity - owned), maps.surplus.get(itemKey) || 0);
  const covered = owned + virtual;
  const recipe = recipeBook.get(itemKey);
  const missing = maps.missing.get(itemKey) || 0;

  if (covered >= quantity) return { cls: 'is-ready', text: `Masz ${fmt(covered)} / ${fmt(quantity)}` };
  if (recipe?.components?.length) return { cls: 'is-craftable', text: `Masz ${fmt(covered)} / ${fmt(quantity)} · do zrobienia ${fmt(quantity - covered)}` };
  return { cls: missing ? 'is-missing' : 'is-craftable', text: `Masz ${fmt(covered)} / ${fmt(quantity)}${missing ? ` · brakuje ${fmt(missing)}` : ''}` };
}

function renderRecipeNode(itemKey, quantity, context, depth = 0, trail = []) {
  const { recipeBook, itemIndex, maps, projectId } = context;
  const item = itemIndex.get(itemKey);
  const name = item?.name || itemKey;
  const recipe = recipeBook.get(itemKey);
  const expandable = recipe?.components?.length && !trail.includes(itemKey);
  const status = nodeStatus(itemKey, quantity, recipeBook, maps);
  const nodeKey = `${projectId}:${[...trail, itemKey].join('>')}`;

  if (!expandable) {
    return `
      <div class="craft-tree-leaf ${status.cls}" style="--craft-depth:${depth}">
        <div class="craft-tree-name"><span class="craft-tree-dot">•</span>${craftItemIconMarkup(item)}<b>${escapeHtml(name)}</b></div>
        <strong>${fmt(quantity)}</strong>
        <small>${escapeHtml(status.text)}</small>
      </div>`;
  }

  const crafts = Math.ceil(quantity / Math.max(1, recipe.outputQuantity));
  const children = sortComponentsByRequiredQuantity(recipe.components, crafts, itemIndex).map(component =>
    renderRecipeNode(component.itemKey, component.quantity * crafts, context, depth + 1, [...trail, itemKey])
  ).join('');

  return `
    <details class="craft-tree-node ${status.cls}" data-craft-tree-key="${escapeHtml(nodeKey)}" style="--craft-depth:${depth}"${openTreeNodes.has(nodeKey) ? ' open' : ''}>
      <summary>
        <span class="craft-tree-name"><span class="craft-tree-arrow">›</span>${craftItemIconMarkup(item)}<b>${escapeHtml(name)}</b></span>
        <strong>${fmt(quantity)}</strong>
        <small>${escapeHtml(status.text)}</small>
      </summary>
      <div class="craft-tree-children">${children}</div>
    </details>`;
}

function renderMainRecipe(project, workspace) {
  const recipeBook = buildRecipeBook(workspace);
  const itemIndex = buildItemIndex(workspace);
  const maps = projectMaps(project);
  const targetRecipe = recipeBook.get(project.targetItemKey);
  if (!targetRecipe?.components?.length) return null;

  const mainComponents = collapseFlatRecipe(targetRecipe.components, recipeBook);
  const crafts = Math.ceil(project.targetQuantity / Math.max(1, targetRecipe.outputQuantity));
  const context = { recipeBook, itemIndex, maps, projectId: String(project.id) };
  const rows = sortComponentsByRequiredQuantity(mainComponents, crafts, itemIndex).map(component =>
    renderRecipeNode(component.itemKey, component.quantity * crafts, context, 0, [project.targetItemKey])
  ).join('');

  return `
    <div class="craft-main-materials">
      <div class="craft-main-materials-head">
        <div><small>GŁÓWNA RECEPTA</small><b>Materiały do wykonania</b></div>
        <span>Kliknij materiał ze strzałką, aby zobaczyć jego składniki.</span>
      </div>
      <div class="craft-tree">${rows}</div>
    </div>`;
}

function ensureStyles() {
  if (document.querySelector('#craftHierarchyEnhancerStyles')) return;
  const style = document.createElement('style');
  style.id = 'craftHierarchyEnhancerStyles';
  style.textContent = `
    .craft-main-materials{margin-top:12px;border-top:1px solid #33291b;padding-top:12px}.craft-main-materials-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:8px}.craft-main-materials-head div{display:grid;gap:2px}.craft-main-materials-head small{color:#9b824f;font-size:9px;letter-spacing:.08em}.craft-main-materials-head b{color:#e4d7b8;font-size:13px}.craft-main-materials-head span{color:#6f6a62;font-size:10px}.craft-tree{display:grid}.craft-tree-node,.craft-tree-leaf{border-top:1px solid #272118}.craft-tree-node summary,.craft-tree-leaf{display:grid;grid-template-columns:minmax(220px,1fr) 90px minmax(190px,.9fr);gap:10px;align-items:center;padding:8px 6px 8px calc(6px + (var(--craft-depth) * 18px));list-style:none}.craft-tree-node summary::-webkit-details-marker{display:none}.craft-tree-node summary{cursor:pointer}.craft-tree-name{display:flex;gap:8px;align-items:center;color:#d9d2c4}.craft-tree-name .craft-item-icon{width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;border:1px solid #514225;background:#11100c;color:#7f6c43;overflow:hidden}.craft-tree-name .craft-item-icon img{width:32px;height:32px;object-fit:contain}.craft-tree-arrow{display:inline-grid;place-items:center;width:18px;height:18px;border:1px solid #5c4827;color:#d8ad55;transition:transform .15s ease}.craft-tree-node[open]>summary .craft-tree-arrow{transform:rotate(90deg)}.craft-tree-dot{display:inline-grid;place-items:center;width:18px;color:#66583e}.craft-tree-node strong,.craft-tree-leaf>strong{color:#e0c98c;text-align:right}.craft-tree-node small,.craft-tree-leaf>small{color:#81796e;text-align:right}.craft-tree-node.is-ready>summary small,.craft-tree-leaf.is-ready>small{color:#69bb7d}.craft-tree-node.is-craftable>summary small{color:#c8a85c}.craft-tree-leaf.is-missing>small{color:#df8f61}.craft-tree-children{background:rgba(255,255,255,.012)}
    @media(max-width:900px){.craft-main-materials-head{display:block}.craft-main-materials-head span{display:block;margin-top:5px}.craft-tree-node summary,.craft-tree-leaf{grid-template-columns:1fr auto;padding-left:calc(4px + (var(--craft-depth) * 13px))}.craft-tree-node small,.craft-tree-leaf>small{grid-column:1/-1;text-align:left;margin-left:26px}}
  `;
  document.head.appendChild(style);
}

export function installCraftHierarchyEnhancer(supabase) {
  if (!supabase || document.documentElement.dataset.craftHierarchyInstalled === '1') return;
  document.documentElement.dataset.craftHierarchyInstalled = '1';
  ensureStyles();

  let running = false;
  let queued = false;
  let observer = null;

  const projectStatusLabel = status => ({ active:'AKTYWNY', paused:'WSTRZYMANY', completed:'ZAKOŃCZONY', archived:'ARCHIWUM' })[status] || String(status || '').toUpperCase();

  const apply = async () => {
    if (running) { queued = true; return; }
    const root = document.querySelector('#craftWorkspaceRoot');
    if (!root) return;
    running = true;
    observer?.disconnect();
    try {
      const workspace = await loadCraftWorkspace(supabase);
      const projects = new Map(workspace.plan.projects.map(project => [String(project.id), project]));

      for (const card of root.querySelectorAll('.craft-project-card[data-craft-project]')) {
        const project = projects.get(String(card.dataset.craftProject));
        if (!project) continue;
        const list = card.querySelector('.craft-mat-list');
        if (!list) continue;
        const renderKey = `${project.targetItemKey}:${project.targetQuantity}:${project.status}:hierarchy-v3`;
        if (list.dataset.hierarchyRenderKey === renderKey) continue;
        const html = renderMainRecipe(project, workspace);
        if (!html) continue;
        list.innerHTML = html;
        list.dataset.hierarchyRenderKey = renderKey;
        const meta = card.querySelector('.craft-project-head>div>small');
        if (meta) meta.textContent = projectStatusLabel(project.status);
      }
    } catch (error) {
      console.warn('Craft hierarchy enhancer:', error);
    } finally {
      running = false;
      observer?.observe(document.body, { childList: true, subtree: true });
      if (queued) { queued = false; queueMicrotask(apply); }
    }
  };

  observer = new MutationObserver(() => queueMicrotask(apply));

  document.addEventListener('click', event => {
    const summary = event.target.closest?.('.craft-tree-node > summary');
    if (!summary) return;
    const details = summary.parentElement;
    const key = details?.dataset?.craftTreeKey;
    if (!key) return;
    setTimeout(() => {
      if (details.open) openTreeNodes.add(key);
      else openTreeNodes.delete(key);
    }, 0);
  }, true);

  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    apply();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else queueMicrotask(start);
}

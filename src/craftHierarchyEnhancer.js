import { loadCraftWorkspace } from './craftWorkspace.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmt = value => Number(value || 0).toLocaleString('pl-PL');
const openTreeNodes = new Set();

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

function projectMaps(project) {
  return {
    owned: new Map((project.ownedAllocated || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
    missing: new Map((project.missing || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
    surplus: new Map((project.generatedSurplusUsed || []).map(row => [row.itemKey, Number(row.quantity || 0)])),
  };
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
        <div class="craft-tree-name"><span class="craft-tree-dot">•</span><b>${escapeHtml(name)}</b></div>
        <strong>${fmt(quantity)}</strong>
        <small>${escapeHtml(status.text)}</small>
      </div>`;
  }

  const crafts = Math.ceil(quantity / Math.max(1, recipe.outputQuantity));
  const children = recipe.components.map(component =>
    renderRecipeNode(component.itemKey, component.quantity * crafts, context, depth + 1, [...trail, itemKey])
  ).join('');

  return `
    <details class="craft-tree-node ${status.cls}" data-craft-tree-key="${escapeHtml(nodeKey)}" style="--craft-depth:${depth}"${openTreeNodes.has(nodeKey) ? ' open' : ''}>
      <summary>
        <span class="craft-tree-name"><span class="craft-tree-arrow">›</span><b>${escapeHtml(name)}</b></span>
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

  const crafts = Math.ceil(project.targetQuantity / Math.max(1, targetRecipe.outputQuantity));
  const context = { recipeBook, itemIndex, maps, projectId: String(project.id) };
  const rows = targetRecipe.components.map(component =>
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
    .craft-main-materials{margin-top:12px;border-top:1px solid #33291b;padding-top:12px}.craft-main-materials-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:8px}.craft-main-materials-head div{display:grid;gap:2px}.craft-main-materials-head small{color:#9b824f;font-size:9px;letter-spacing:.08em}.craft-main-materials-head b{color:#e4d7b8;font-size:13px}.craft-main-materials-head span{color:#6f6a62;font-size:10px}.craft-tree{display:grid}.craft-tree-node,.craft-tree-leaf{border-top:1px solid #272118}.craft-tree-node summary,.craft-tree-leaf{display:grid;grid-template-columns:minmax(180px,1fr) 90px minmax(190px,.9fr);gap:10px;align-items:center;padding:10px 6px 10px calc(6px + (var(--craft-depth) * 18px));list-style:none}.craft-tree-node summary::-webkit-details-marker{display:none}.craft-tree-node summary{cursor:pointer}.craft-tree-name{display:flex;gap:8px;align-items:center;color:#d9d2c4}.craft-tree-arrow{display:inline-grid;place-items:center;width:18px;height:18px;border:1px solid #5c4827;color:#d8ad55;transition:transform .15s ease}.craft-tree-node[open]>summary .craft-tree-arrow{transform:rotate(90deg)}.craft-tree-dot{display:inline-grid;place-items:center;width:18px;color:#66583e}.craft-tree-node strong,.craft-tree-leaf>strong{color:#e0c98c;text-align:right}.craft-tree-node small,.craft-tree-leaf>small{color:#81796e;text-align:right}.craft-tree-node.is-ready>summary small,.craft-tree-leaf.is-ready>small{color:#69bb7d}.craft-tree-node.is-craftable>summary small{color:#c8a85c}.craft-tree-leaf.is-missing>small{color:#df8f61}.craft-tree-children{background:rgba(255,255,255,.012)}
    #craftProjectForm input[name="priority"]{display:none!important}
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

      const priority = root.querySelector('#craftProjectForm input[name="priority"]');
      if (priority) { priority.type = 'hidden'; priority.value = '100'; }

      for (const card of root.querySelectorAll('.craft-project-card[data-craft-project]')) {
        const project = projects.get(String(card.dataset.craftProject));
        if (!project) continue;
        const list = card.querySelector('.craft-mat-list');
        if (!list) continue;
        const renderKey = `${project.targetItemKey}:${project.targetQuantity}:${project.status}`;
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

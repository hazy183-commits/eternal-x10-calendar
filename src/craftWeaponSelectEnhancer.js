const byName = (a, b) => a.textContent.localeCompare(b.textContent, 'en', { sensitivity: 'base' });

const CRAFTED_MATERIAL_HINTS = [
  'alloy', 'cokes', 'plate', 'holder', 'mold', 'frame', 'braid', 'metallic thread',
  'metallic fiber', 'varnish of purity', 'steel', 'coarse bone powder', 'compound', 'leather', 'cord', 'anvil',
];
const KEY_MAT_SUFFIXES = ['_shaft', '_blade', '_edge', '_stave', '_head', '_piece', '_fragment', '_part', '_pattern', '_design', '_lining', '_fabric', '_texture'];

function appendGroup(select, label, options) {
  if (!options.length) return;
  const group = document.createElement('optgroup');
  group.label = label;
  for (const option of options.sort(byName)) group.appendChild(option);
  select.appendChild(group);
}

function enhanceTargetSelect(select) {
  if (!select || select.dataset.craftGroupsReady === '1') return;

  const options = [...select.options].filter(option => /^(weapon|armor)_[sa]_/.test(option.value));
  if (!options.length) return;

  const weaponS = options.filter(option => option.value.startsWith('weapon_s_'));
  const weaponA = options.filter(option => option.value.startsWith('weapon_a_'));
  const armorS = options.filter(option => option.value.startsWith('armor_s_'));
  const armorA = options.filter(option => option.value.startsWith('armor_a_'));

  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Wybierz broń lub armor…';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  appendGroup(select, '⚔ S Grade — Broń 60%', weaponS);
  appendGroup(select, '⚔ A Grade — Broń 60%', weaponA);
  appendGroup(select, '🛡 S Grade — Armory 60%', armorS);
  appendGroup(select, '🛡 A Grade — Armory 60%', armorA);
  select.dataset.craftGroupsReady = '1';
}

function classifyMaterial(option) {
  const key = String(option.value || '').toLowerCase();
  const name = String(option.textContent || '').toLowerCase();
  if (key.includes('crystal_') || key.includes('gemstone_') || name.startsWith('crystal:') || name.startsWith('gemstone')) return 'crystals';
  if (KEY_MAT_SUFFIXES.some(suffix => key.endsWith(suffix))) return 'key';
  if (CRAFTED_MATERIAL_HINTS.some(hint => name.includes(hint))) return 'crafted';
  return 'basic';
}

function enhanceMaterialSelect(select) {
  if (!select || select.dataset.materialListReady === '1') return;

  const materialOptions = [...select.options].filter(option => option.value.startsWith('mat_'));
  if (!materialOptions.length) return;

  const groups = { crafted: [], key: [], crystals: [], basic: [] };
  for (const option of materialOptions) groups[classifyMaterial(option)].push(option);

  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Wybierz materiał…';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  appendGroup(select, '★ Materiały craftowane', groups.crafted);
  appendGroup(select, '◆ Key mats / części broni i armorów', groups.key);
  appendGroup(select, '✦ Crystale i Gemstones', groups.crystals);
  appendGroup(select, '• Surowce i pozostałe materiały', groups.basic);
  select.dataset.materialListReady = '1';
}

function syncProjectName(form) {
  const name = form.querySelector('input[name="name"]');
  const target = form.querySelector('select[name="targetItemKey"]');
  const quantity = form.querySelector('input[name="targetQuantity"]');
  if (!name || !target || !quantity) return;
  const option = target.selectedOptions?.[0];
  if (!option?.value) return;
  name.value = `${option.textContent.trim()} ×${Math.max(1, Number(quantity.value || 1))}`;
}

function enhanceProjectForm(form) {
  if (!form || form.dataset.compactCraftForm === '1') return;

  const name = form.querySelector('input[name="name"]');
  if (name) {
    name.type = 'hidden';
    name.removeAttribute('placeholder');
  }

  const quantity = form.querySelector('input[name="targetQuantity"]');
  if (quantity) {
    quantity.setAttribute('aria-label', 'Ilość sztuk');
    quantity.title = 'Ile sztuk chcesz wykonać';
  }

  const oldPriority = form.querySelector('input[name="priority"]');
  if (oldPriority) {
    const priority = document.createElement('select');
    priority.name = 'priority';
    priority.setAttribute('aria-label', 'Priorytet projektu');
    priority.title = 'Wyższy priorytet wcześniej rezerwuje materiały z magazynu';
    priority.innerHTML = `
      <option value="10">Wysoki priorytet</option>
      <option value="20" selected>Normalny priorytet</option>
      <option value="30">Niski priorytet</option>`;
    oldPriority.replaceWith(priority);
  }

  form.addEventListener('change', () => syncProjectName(form));
  form.addEventListener('input', () => syncProjectName(form));
  form.addEventListener('submit', () => syncProjectName(form), { capture: true });
  form.dataset.compactCraftForm = '1';
}

function ensureStyles() {
  if (document.querySelector('#craftSelectEnhancerStyles')) return;
  const style = document.createElement('style');
  style.id = 'craftSelectEnhancerStyles';
  style.textContent = `
    #craftProjectForm.craft-form.project{grid-template-columns:minmax(260px,1.8fr) 95px minmax(150px,.8fr) auto!important}
    #craftProjectForm select[name="targetItemKey"] optgroup,#craftStockForm select[name="itemKey"] optgroup{font-weight:900;color:#d7b35e;background:#090d0d}
    #craftProjectForm select[name="targetItemKey"] option,#craftStockForm select[name="itemKey"] option{font-weight:600;color:#e4e0d7;background:#090d0d;padding:4px}
    #craftProjectForm select[name="priority"]{font-weight:800;color:#e4c16d}
    #craftStockForm select[name="itemKey"]{font-weight:700}
    @media(max-width:900px){#craftProjectForm.craft-form.project{grid-template-columns:1fr 100px!important}#craftProjectForm .craft-priority-control{grid-column:1/-1}#craftProjectForm button{grid-column:1/-1}}
  `;
  document.head.appendChild(style);
}

function enhanceCraftSelects(root = document) {
  root.querySelectorAll?.('#craftProjectForm select[name="targetItemKey"]').forEach(enhanceTargetSelect);
  root.querySelectorAll?.('#craftStockForm select[name="itemKey"]').forEach(enhanceMaterialSelect);
  root.querySelectorAll?.('#craftProjectForm').forEach(enhanceProjectForm);
}

if (typeof document !== 'undefined') {
  const start = () => {
    ensureStyles();
    enhanceCraftSelects();
    const observer = new MutationObserver(() => queueMicrotask(() => enhanceCraftSelects()));
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else queueMicrotask(start);
}

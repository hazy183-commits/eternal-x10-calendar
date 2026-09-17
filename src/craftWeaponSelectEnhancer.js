const byName = (a, b) => a.textContent.localeCompare(b.textContent, 'en', { sensitivity: 'base' });

const CRAFTED_MATERIAL_HINTS = [
  'alloy', 'cokes', 'plate', 'holder', 'mold', 'frame', 'braid', 'metallic thread',
  'varnish of purity', 'steel', 'coarse bone powder', 'compound', 'leather', 'cord',
];
const KEY_MAT_SUFFIXES = ['_shaft', '_blade', '_edge', '_stave', '_head', '_piece', '_fragment', '_part'];

function appendGroup(select, label, options) {
  if (!options.length) return;
  const group = document.createElement('optgroup');
  group.label = label;
  for (const option of options.sort(byName)) group.appendChild(option);
  select.appendChild(group);
}

function enhanceWeaponSelect(select) {
  if (!select || select.dataset.weaponGroupsReady === '1') return;

  const weaponOptions = [...select.options]
    .filter(option => option.value.startsWith('weapon_s_') || option.value.startsWith('weapon_a_'));
  if (!weaponOptions.length) return;

  const sGrade = weaponOptions.filter(option => option.value.startsWith('weapon_s_'));
  const aGrade = weaponOptions.filter(option => option.value.startsWith('weapon_a_'));

  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Wybierz broń…';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  appendGroup(select, 'S Grade — recepty 60%', sGrade);
  appendGroup(select, 'A Grade — recepty 60%', aGrade);
  select.dataset.weaponGroupsReady = '1';
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
  appendGroup(select, '◆ Key mats / części broni', groups.key);
  appendGroup(select, '✦ Crystale i Gemstones', groups.crystals);
  appendGroup(select, '• Surowce i pozostałe materiały', groups.basic);
  select.dataset.materialListReady = '1';
}

function syncProjectName(form) {
  const name = form.querySelector('input[name="name"]');
  const weapon = form.querySelector('select[name="targetItemKey"]');
  const quantity = form.querySelector('input[name="targetQuantity"]');
  if (!name || !weapon || !quantity) return;
  const option = weapon.selectedOptions?.[0];
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
    #craftProjectForm.craft-form.project{grid-template-columns:minmax(220px,1.6fr) 95px minmax(150px,.8fr) auto!important}
    #craftProjectForm select[name="priority"]{font-weight:800;color:#e4c16d}
    #craftStockForm select[name="itemKey"]{font-weight:700}
    #craftStockForm select[name="itemKey"] optgroup{font-weight:900;color:#d7b35e;background:#090d0d}
    #craftStockForm select[name="itemKey"] option{font-weight:600;color:#e4e0d7;background:#090d0d;padding:4px}
    @media(max-width:900px){#craftProjectForm.craft-form.project{grid-template-columns:1fr 100px!important}#craftProjectForm select[name="priority"]{grid-column:1/-1}#craftProjectForm button{grid-column:1/-1}}
  `;
  document.head.appendChild(style);
}

function enhanceCraftSelects(root = document) {
  root.querySelectorAll?.('#craftProjectForm select[name="targetItemKey"]').forEach(enhanceWeaponSelect);
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

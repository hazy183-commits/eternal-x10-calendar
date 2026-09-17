const byName = (a, b) => a.textContent.localeCompare(b.textContent, 'en', { sensitivity: 'base' });

function enhanceWeaponSelect(select) {
  if (!select || select.dataset.weaponGroupsReady === '1') return;

  const weaponOptions = [...select.options]
    .filter(option => option.value.startsWith('weapon_s_') || option.value.startsWith('weapon_a_'))
    .sort(byName);

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

  const appendGroup = (label, options) => {
    if (!options.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    for (const option of options) group.appendChild(option);
    select.appendChild(group);
  };

  appendGroup('S Grade — recepty 60%', sGrade);
  appendGroup('A Grade — recepty 60%', aGrade);
  select.dataset.weaponGroupsReady = '1';
}

function enhanceMaterialSelect(select) {
  if (!select || select.dataset.materialListReady === '1') return;

  const materialOptions = [...select.options]
    .filter(option => option.value.startsWith('mat_'))
    .sort(byName);

  if (!materialOptions.length) return;

  select.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Wybierz materiał…';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  for (const option of materialOptions) select.appendChild(option);
  select.dataset.materialListReady = '1';
}

function enhanceCraftSelects(root = document) {
  root.querySelectorAll?.('#craftProjectForm select[name="targetItemKey"]').forEach(enhanceWeaponSelect);
  root.querySelectorAll?.('#craftStockForm select[name="itemKey"]').forEach(enhanceMaterialSelect);
}

if (typeof document !== 'undefined') {
  const start = () => {
    enhanceCraftSelects();
    const observer = new MutationObserver(() => queueMicrotask(() => enhanceCraftSelects()));
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else queueMicrotask(start);
}

import catalog from '../data/interlude-equipment.json' with { type: 'json' };
export const { weapons, armors, jewels, augmentations } = catalog;
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kinds = { active: 'Aktywna', passive: 'Pasywna', chance: 'Szansowa' };
export const jewelrySlots = [['necklace', 'Naszyjnik', 'necklace'], ['earring1', 'Kolczyk 1', 'earring'], ['earring2', 'Kolczyk 2', 'earring'], ['ring1', 'Pierścień 1', 'ring'], ['ring2', 'Pierścień 2', 'ring']];
const norm = s => String(s || '').toLowerCase().replaceAll('*', '+').replace(/\s+/g, '').replaceAll('crt.', 'critical');
export function resolveWeapon(e) {
  if (e.weaponId) return weapons.find(x => x.id === Number(e.weaponId));
  const name = String(e.weapon || '').split(' · ')[0];
  return weapons.find(x => norm(x.name) === norm(name));
}
const image = item => item ? `<img src="/assets/interlude/icons/${esc(item.icon)}" alt="" width="32" height="32">` : '<span class="equipment-empty-icon" aria-hidden="true">◇</span>';
const option = (value, name, selected) => `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(name)}</option>`;
const enchant = (attr, value, label) => `<label>${label}<input ${attr} type="number" min="0" max="30" step="1" value="${esc(value ?? 0)}" inputmode="numeric"></label>`;
function saOptions(w, selected = '') {
  return w?.dual ? option('', 'Bonus duali aktywuje się przy +4', '') : option('', 'Bez SA', selected) + (w?.sa || []).map(x => option(x.id, x.name, selected)).join('');
}
function jewelryFields(e) {
  return jewelrySlots.map(([slot, label, type]) => {
    const saved = e.jewelry?.[slot] || {}, item = jewels.find(x => x.id === Number(saved.itemId) && x.slot === type);
    return `<div class="jewel-slot" data-jewel="${slot}"><div class="jewel-icon">${image(item)}</div><label>${label}<select data-jewel-item>${option('', 'Brak', item?.id || '')}${jewels.filter(x => x.slot === type).map(x => option(x.id, x.name, item?.id)).join('')}</select></label>${enchant('data-jewel-enchant', saved.enchant, 'Enchant')}</div>`;
  }).join('');
}
function augmentationFields(id, level, legacy = '') {
  const a = augmentations.find(x => x.id === Number(id));
  return `<button type="button" class="augmentation-tile" data-open-augmentation aria-haspopup="dialog"><span aria-hidden="true">✧</span><b>Augmentacja</b><small>${esc(a ? a.name + ' · ' + kinds[a.kind] : legacy || 'Wybierz efekt')}</small></button><input type="hidden" data-augmentation-id value="${a?.id || ''}"><label ${a ? '' : 'hidden'}>Poziom augmentacji<select data-augmentation-level>${a ? a.levels.map(n => option(n, 'Poziom ' + n, level || a.levels.at(-1))).join('') : ''}</select></label>`;
}
export function equipmentFields(e = {}) {
  const w = resolveWeapon(e), sa = e.weaponSaId || w?.sa.find(x => norm(x.name) === norm(String(e.weapon || '').split(' · ')[1]))?.id || '';
  return `<section class="picker-field equipment-section"><h5>Broń · A / S grade</h5><div class="weapon-controls"><div class="weapon-preview">${image(w)}</div><label>Broń<select data-weapon-id>${option('', e.weapon && !w ? 'Zapisano: ' + e.weapon : 'Wybierz broń', w?.id || '')}${['S', 'A'].map(grade => `<optgroup label="${grade} grade">${weapons.filter(x => x.grade === grade).map(x => option(x.id, x.name, w?.id)).join('')}</optgroup>`).join('')}</select></label><label>Special Ability (SA)<select data-weapon-sa ${!w || w.dual ? 'disabled' : ''}>${saOptions(w, sa)}</select></label>${enchant('data-equipment="weaponEnchant"', e.weaponEnchant, 'Enchant broni')}</div></section>
  <section class="picker-field equipment-section"><h5>Set armoru · odsealowany</h5><div class="item-picker" data-picker="armor">${armors.map(x => `<button type="button" class="item-tile ${x.name === e.armor ? 'selected' : ''}" data-value="${esc(x.name)}" aria-pressed="${x.name === e.armor}">${image(x)}<span>${esc(x.name)}<small>${x.grade} grade</small></span></button>`).join('')}</div><input type="hidden" data-equipment="armor" value="${esc(e.armor || '')}">${enchant('data-equipment="armorEnchant"', e.armorEnchant, 'Enchant armoru')}</section>
  <section class="picker-field equipment-section"><h5>Biżuteria · 5 slotów</h5><div class="jewelry-presets"><button type="button" data-jewelry-set="s">Komplet Tateossian · S grade</button><button type="button" data-jewelry-set="epic">Komplet epików</button></div><p class="equipment-hint">Każdy element wybierzesz i enchantujesz oddzielnie. Komplet epików: Valakas, Antharas, Zaken, Baium i Queen Ant — możesz zmienić dowolny element.</p>${!e.jewelry && (e.fullEpic || e.jewels) ? `<p class="equipment-hint" data-legacy-jewels>Poprzedni zapis: ${esc(e.fullEpic ? 'Full Epic' : e.jewels)}${e.jewelsEnchant ? ' +' + esc(e.jewelsEnchant) : ''}. Wybierz komplet lub uzupełnij sloty, aby zapisać konkretne przedmioty.</p>` : ''}<div class="jewelry-grid">${jewelryFields(e)}</div></section>
  <section class="picker-field equipment-section"><h5>Augmentacja broni</h5><div class="augmentation-controls">${augmentationFields(e.augmentationId, e.augmentationLevel, e.augmentation)}</div></section>`;
}
export function checkedEnchant(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 30 || String(value).trim() === '') throw new Error('Enchant musi być liczbą całkowitą od 0 do 30.');
  return n;
}
export function validateJewelry(value) {
  return Object.fromEntries(jewelrySlots.map(([slot, , type]) => {
    const v = value[slot] || {}, id = Number(v.itemId) || null;
    if (id && !jewels.some(x => x.id === id && x.slot === type)) throw new Error('Wybierz biżuterię pasującą do slotu.');
    return [slot, { itemId: id, enchant: checkedEnchant(v.enchant ?? 0) }];
  }));
}
export function readEquipment(card, previous = {}) {
  const e = { ...previous };
  card.querySelectorAll('[data-equipment]').forEach(x => e[x.dataset.equipment] = x.type === 'number' ? checkedEnchant(x.value) : x.value.trim());
  const id = Number(card.querySelector('[data-weapon-id]').value), w = weapons.find(x => x.id === id);
  if (id && !w) throw new Error('Wybierz broń A lub S grade.');
  if (w) {
    const saId = Number(card.querySelector('[data-weapon-sa]').value), sa = w.sa.find(x => x.id === saId);
    if (saId && !sa) throw new Error('Wybrane SA nie pasuje do broni.');
    Object.assign(e, { weaponId: w.id, weaponSaId: sa?.id || null, weapon: w.name + (sa ? ' · ' + sa.name : '') });
  }
  if (!e.weapon || !e.armor) throw new Error('Wybierz broń i set armoru.');
  if (card.dataset.jewelryDirty || previous.jewelry) {
    e.jewelry = validateJewelry(Object.fromEntries([...card.querySelectorAll('[data-jewel]')].map(x => [x.dataset.jewel, { itemId: x.querySelector('[data-jewel-item]').value, enchant: x.querySelector('[data-jewel-enchant]').value }])));
    const selected = Object.values(e.jewelry).filter(x => x.itemId);
    e.jewels = selected.map(x => jewels.find(j => j.id === x.itemId).name + ' +' + x.enchant).join(', ');
    e.fullEpic = selected.length === 5 && selected.every(x => jewels.find(j => j.id === x.itemId).epic);
    delete e.jewelsEnchant;
  }
  const augmentationId = Number(card.querySelector('[data-augmentation-id]').value);
  if (augmentationId) {
    const a = augmentations.find(x => x.id === augmentationId), level = Number(card.querySelector('[data-augmentation-level]').value);
    if (!a || !a.levels.includes(level)) throw new Error('Wybierz poprawną augmentację i jej poziom.');
    Object.assign(e, { augmentationId, augmentationLevel: level, augmentation: `${a.name} · ${kinds[a.kind]} · Lv. ${level}` });
  } else if (card.dataset.augmentationDirty) {
    Object.assign(e, { augmentationId: null, augmentationLevel: null, augmentation: '' });
  }
  return e;
}
export function bindEquipment(root) {
  root.addEventListener('change', event => {
    const field = event.target, card = field.closest('[data-loadout]');
    if (!card) return;
    if (field.matches('[data-weapon-id]')) {
      const w = weapons.find(x => x.id === Number(field.value)), sa = card.querySelector('[data-weapon-sa]');
      sa.innerHTML = saOptions(w); sa.disabled = !w || w.dual;
      card.querySelector('.weapon-preview').innerHTML = image(w);
    }
    if (field.closest('[data-jewel]')) {
      card.dataset.jewelryDirty = 'true';
      card.querySelector('[data-legacy-jewels]')?.remove();
      if (field.matches('[data-jewel-item]')) field.closest('[data-jewel]').querySelector('.jewel-icon').innerHTML = image(jewels.find(x => x.id === Number(field.value)));
    }
  });
}
export function equipmentClick(event) {
  const button = event.target.closest('[data-jewelry-set], [data-open-augmentation]');
  if (!button) return false;
  const card = button.closest('[data-loadout]');
  if (button.hasAttribute('data-jewelry-set')) {
    const ids = button.dataset.jewelrySet === 's' ? [920, 858, 858, 889, 889] : [6657, 6656, 6659, 6658, 6660];
    jewelrySlots.forEach(([slot], i) => { const field = card.querySelector(`[data-jewel="${slot}"] [data-jewel-item]`); field.value = ids[i]; field.dispatchEvent(new Event('change', { bubbles: true })); });
  } else openAugmentations(card, button);
  return true;
}
function openAugmentations(card, opener) {
  const dialog = document.createElement('dialog');
  dialog.className = 'augmentation-dialog';
  dialog.setAttribute('aria-label', 'Wybierz augmentację');
  dialog.innerHTML = `<div class="augmentation-header"><h3>Wybierz augmentację</h3><button type="button" data-close aria-label="Zamknij">✕</button></div><div class="augmentation-search"><label>Szukaj efektu<input type="search" placeholder="np. Empower, Heal, Wild Magic" autofocus></label><label>Rodzaj<select>${option('', 'Wszystkie', '')}${Object.entries(kinds).map(([id, name]) => option(id, name, '')).join('')}</select></label></div><button type="button" data-clear>Bez augmentacji</button><p class="augmentation-count" aria-live="polite"></p><div class="augmentation-list"></div>`;
  const search = dialog.querySelector('input'), filter = dialog.querySelector('select'), list = dialog.querySelector('.augmentation-list');
  const render = () => {
    const found = augmentations.filter(a => (!filter.value || a.kind === filter.value) && `${a.name} ${a.description}`.toLowerCase().includes(search.value.trim().toLowerCase()));
    dialog.querySelector('.augmentation-count').textContent = `${found.length} efektów`;
    list.innerHTML = found.map(a => `<button type="button" data-augment="${a.id}"><b>${esc(a.name)}</b><span>${kinds[a.kind]}</span><small>${esc(a.description)}</small></button>`).join('') || '<p>Brak pasujących augmentacji.</p>';
  };
  search.oninput = filter.onchange = render;
  dialog.onclick = event => {
    if (event.target.closest('[data-close]')) dialog.close();
    const choice = event.target.closest('[data-augment], [data-clear]');
    if (choice) {
      card.dataset.augmentationDirty = 'true';
      card.querySelector('.augmentation-controls').innerHTML = augmentationFields(choice.dataset.augment);
      dialog.close();
    }
  };
  dialog.addEventListener('close', () => { dialog.remove(); (opener.isConnected ? opener : card.querySelector('[data-open-augmentation]'))?.focus({ preventScroll: true }); }, { once: true });
  document.body.appendChild(dialog); render(); dialog.showModal();
}

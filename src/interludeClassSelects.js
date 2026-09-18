const INTERLUDE_THIRD_CLASSES = [
  { race: 'Human', classes: ['Dreadnought','Duelist','Phoenix Knight','Hell Knight','Sagittarius','Adventurer','Archmage','Soultaker','Arcana Lord','Cardinal','Hierophant'] },
  { race: 'Elf', classes: ["Eva's Templar",'Sword Muse','Wind Rider','Moonlight Sentinel','Mystic Muse','Elemental Master',"Eva's Saint"] },
  { race: 'Dark Elf', classes: ['Shillien Templar','Spectral Dancer','Ghost Hunter','Ghost Sentinel','Storm Screamer','Spectral Master','Shillien Saint'] },
  { race: 'Orc', classes: ['Titan','Grand Khavatari','Dominator','Doomcryer'] },
  { race: 'Dwarf', classes: ['Fortune Seeker','Maestro'] }
];

function buildOptions(placeholder) {
  return [
    `<option value="">${placeholder}</option>`,
    ...INTERLUDE_THIRD_CLASSES.map(group =>
      `<optgroup label="${group.race}">${group.classes.map(name => `<option value="${name.replaceAll('&','&amp;').replaceAll('"','&quot;')}">${name}</option>`).join('')}</optgroup>`
    )
  ].join('');
}

function replaceInputWithSelect(id, placeholder) {
  const current = document.getElementById(id);
  if (!current || current.tagName === 'SELECT') return false;

  const previousValue = current.value || '';
  const select = document.createElement('select');
  select.id = id;
  select.name = current.name || '';
  select.innerHTML = buildOptions(placeholder);
  select.setAttribute('aria-label', current.getAttribute('aria-label') || placeholder);
  current.replaceWith(select);

  if (previousValue) {
    const exists = [...select.options].some(option => option.value === previousValue);
    if (exists) select.value = previousValue;
  }
  return true;
}

function applyClassSelects() {
  replaceInputWithSelect('zoneProfileClass', 'Wybierz klasę');
  replaceInputWithSelect('zoneProfileSubclass', 'Brak / wybierz subclassę');
}

export function installInterludeClassSelects() {
  if (window.__obInterludeClassSelectsInstalled) return;
  window.__obInterludeClassSelectsInstalled = true;

  applyClassSelects();
  const observer = new MutationObserver(applyClassSelects);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-zone-view="profile"]')) setTimeout(applyClassSelects, 0);
  });

  window.addEventListener('pageshow', applyClassSelects);
  setTimeout(applyClassSelects, 300);
  setTimeout(applyClassSelects, 1000);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installInterludeClassSelects, { once: true });
  } else {
    installInterludeClassSelects();
  }
}

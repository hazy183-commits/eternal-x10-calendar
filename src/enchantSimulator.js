import './enchantSimulator.css';
import { craftItemIconPath } from './craftItemIcons.js';

const weapons = [
  'Draconic Bow', 'Angel Slayer', 'Arcana Mace', 'Basalt Battlehammer',
  'Demon Splinter', 'Dragon Hunter Axe', 'Forgotten Blade', 'Heaven’s Divider',
  'Imperial Staff', 'Saint Spear'
];

const magicWeapons = new Set(['Arcana Mace', 'Imperial Staff']);
const baseChanceForWeapon = (weapon) => magicWeapons.has(weapon) ? 40 : 70;

const scrollIcons = {
  regular: 'https://l2db.info/uploads/images/icons/etc_scroll_of_enchant_weapon_i05.png',
  blessed: 'https://l2db.info/uploads/images/icons/etc_blessed_scrl_of_ench_wp_s_i05.png'
};

const formatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });
const percent = (value) => formatter.format(value * 100) + '%';

function nextChance(level, chance) {
  if (level < 3) return 1;
  return level >= 15 ? chance / 2 : chance;
}

function streakChance(level, target, chance) {
  let probability = 1;
  for (let step = level; step < target; step += 1) probability *= nextChance(step, chance);
  return probability;
}

function enchant(level, chance, blessed, roll) {
  if (roll < nextChance(level, chance)) return level + 1;
  return blessed ? 0 : null;
}

const dialog = document.createElement('dialog');
dialog.className = 'enchant-simulator';
dialog.id = 'enchantSimulator';
dialog.setAttribute('aria-labelledby', 'enchantSimulatorTitle');
dialog.innerHTML = `
  <div class="enchant-heading">
    <h2 id="enchantSimulatorTitle">Symulator enchantu S</h2>
    <form method="dialog"><button type="submit" aria-label="Zamknij symulator">×</button></form>
  </div>
  <div class="enchant-slots">
    <label class="enchant-slot">
      <span class="enchant-slot-label">Broń S</span>
      <span class="enchant-slot-icon" aria-hidden="true" data-enchant-weapon-icon>⚔</span>
      <select name="weapon"><option value="">Wybierz broń</option>${weapons.map(name => `<option>${name}</option>`).join('')}</select>
    </label>
    <span class="enchant-plus" aria-hidden="true">+</span>
    <label class="enchant-slot">
      <span class="enchant-slot-label">Zwój S</span>
      <span class="enchant-slot-icon" aria-hidden="true" data-enchant-scroll-icon>▤</span>
      <select name="scroll"><option value="">Wybierz zwój</option><option value="regular">EWS · zwykły</option><option value="blessed">BEWS · Blessed</option></select>
    </label>
  </div>
  <div class="enchant-settings">
    <label>Start <input name="start" type="number" min="0" max="15" value="3" required></label>
    <label>Cel <input name="target" type="number" min="1" max="16" value="8" required></label>
    <label>Szansa bazowa do +15 (%) <input name="chance" type="number" min="0" max="100" step="any" value="70" required></label>
  </div>
  <p class="enchant-note">Model Interlude. Broń fizyczna ma domyślnie 70%, a magiczna 40%. Próba z +15 na +16 ma połowę szansy bazowej. Stawki Eternal nie są potwierdzone. Do +3 próby są bezpieczne. Porażka EWS niszczy broń, a BEWS resetuje ją do +0.</p>
  <div class="enchant-result">
    <strong data-enchant-weapon></strong>
    <span data-enchant-level></span>
  </div>
  <dl class="enchant-stats">
    <div><dt>Następny enchant</dt><dd data-enchant-next></dd></div>
    <div><dt>Do celu bez porażki</dt><dd data-enchant-odds></dd></div>
    <div><dt>Zużyte zwoje</dt><dd data-enchant-scrolls></dd></div>
    <div><dt>Rozbite bronie</dt><dd data-enchant-broken></dd></div>
  </dl>
  <p class="enchant-feedback" role="status"></p>
  <div class="enchant-actions">
    <button class="primary-btn" type="button" data-enchant-roll>Enchantuj</button>
    <button class="primary-btn" type="button" data-enchant-auto>Automat do celu</button>
    <button class="secondary-btn" type="button" data-enchant-reset>Nowa seria</button>
  </div>
`;
document.body.append(dialog);

const field = (name) => dialog.querySelector(`[name="${name}"]`);
const view = (name) => dialog.querySelector(`[data-enchant-${name}]`);
const start = field('start');
const target = field('target');
const chanceInput = field('chance');
const chance = () => chanceInput.valueAsNumber / 100;
const feedback = dialog.querySelector('.enchant-feedback');
let level = start.valueAsNumber;
let scrolls = 0;
let broken = 0;
let autoFrame = null;
const inputs = dialog.querySelectorAll('input, select');
const autoButton = view('auto');

function updateIcon(slot, src, fallback) {
  if (slot.dataset.src === src) return;
  slot.dataset.src = src;
  slot.textContent = fallback;
  if (!src) return;
  const image = new Image(32, 32);
  image.alt = '';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('load', () => {
    if (slot.dataset.src === src) slot.replaceChildren(image);
  }, { once: true });
  image.src = src;
}

function render() {
  const valid = start.validity.valid && target.validity.valid && chanceInput.validity.valid;
  const hasWeapon = Boolean(field('weapon').value);
  const hasScroll = Boolean(field('scroll').value);
  const active = valid && hasWeapon && hasScroll && level !== null && level < target.valueAsNumber;
  const weapon = field('weapon').value;
  view('weapon').textContent = weapon ? weapon + (magicWeapons.has(weapon) ? ' · magiczna' : ' · fizyczna') : 'Włóż broń i zwój';
  view('level').textContent = !hasWeapon ? '—' : level === null ? 'Rozbita' : Number.isInteger(level) ? '+' + level : '—';
  view('scrolls').textContent = formatter.format(scrolls);
  view('broken').textContent = formatter.format(broken);
  const weaponKey = field('weapon').value.toLowerCase().replaceAll('’', '');
  updateIcon(view('weapon-icon'), craftItemIconPath('weapon_s_' + weaponKey.replaceAll(' ', '_')), '⚔');
  updateIcon(view('scroll-icon'), scrollIcons[field('scroll').value] || '', '▤');
  view('next').textContent = active ? percent(nextChance(level, chance())) : '—';
  view('odds').textContent = valid && hasWeapon && hasScroll && level !== null ? percent(streakChance(level, target.valueAsNumber, chance())) : '—';
  const running = autoFrame !== null;
  view('roll').disabled = !active || running;
  autoButton.disabled = !running && (!valid || !hasWeapon || !hasScroll || (level !== null && level >= target.valueAsNumber) || (target.valueAsNumber > 3 && chance() === 0));
  autoButton.textContent = running ? 'Zatrzymaj automat' : 'Automat do +' + (target.validity.valid ? target.valueAsNumber : '…');
  inputs.forEach(input => { input.disabled = running; });
  if (!valid) feedback.textContent = 'Wpisz poprawny poziom początkowy, cel i szansę.';
}

function stopAuto() {
  if (autoFrame !== null) cancelAnimationFrame(autoFrame);
  autoFrame = null;
}

function reset() {
  stopAuto();
  broken = 0;
  level = start.valueAsNumber;
  scrolls = 0;
  feedback.textContent = '';
  render();
}

dialog.querySelector('.enchant-settings').addEventListener('input', (event) => {
  if (event.target === start || event.target === field('weapon')) reset();
  else {
    feedback.textContent = '';
    render();
  }
});
field('weapon').addEventListener('change', () => {
  chanceInput.value = baseChanceForWeapon(field('weapon').value);
  reset();
});
field('scroll').addEventListener('change', render);
view('reset').addEventListener('click', reset);
function rollEnchant() {
  level = enchant(level, chance(), field('scroll').value === 'blessed', Math.random());
  scrolls += 1;
  if (level === null) broken += 1;
}

view('roll').addEventListener('click', () => {
  if (view('roll').disabled) return;
  const previous = level;
  rollEnchant();
  if (level === null) feedback.textContent = 'Porażka. Broń rozbiła się na kryształy.';
  else if (level === 0) feedback.textContent = 'Porażka. Blessed zachował broń i zresetował enchant do +0.';
  else feedback.textContent = `Sukces: +${previous} → +${level}.` + (level >= target.valueAsNumber ? ' Cel osiągnięty!' : '');
  render();
});
autoButton.addEventListener('click', () => {
  if (autoFrame !== null) {
    stopAuto();
    feedback.textContent = 'Automat zatrzymany. Możesz wznowić serię.';
    render();
    return;
  }

  const goal = target.valueAsNumber;
  const limit = scrolls + 1_000_000;
  feedback.textContent = 'Automat w toku. Po rozbiciu bierze nową broń +0.';
  const runBatch = () => {
    const batchLimit = Math.min(scrolls + 250, limit);
    while ((level === null || level < goal) && scrolls < batchLimit) {
      if (level === null) level = 0;
      rollEnchant();
    }

    if (level === goal || scrolls === limit) {
      autoFrame = null;
      feedback.textContent = level === goal
        ? `Cel +${goal} osiągnięty. Łącznie zużyto ${formatter.format(scrolls)} zwojów.`
        : 'Pauza po milionie prób. Możesz wznowić serię.';
    } else {
      autoFrame = requestAnimationFrame(runBatch);
    }
    render();
  };

  autoFrame = requestAnimationFrame(runBatch);
  render();
});
dialog.addEventListener('close', () => {
  if (autoFrame === null) return;
  stopAuto();
  feedback.textContent = 'Automat zatrzymany. Możesz wznowić serię.';
  render();
});

document.addEventListener('click', (event) => {
  const trigger = event.target.closest?.('#memberZoneLayer.open [data-zone-action="enchant"]');
  if (trigger && !dialog.open) dialog.showModal();
});
render();

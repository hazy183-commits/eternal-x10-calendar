import './enchantSimulator.css';

const weapons = [
  'Draconic Bow', 'Angel Slayer', 'Arcana Mace', 'Basalt Battlehammer',
  'Demon Splinter', 'Dragon Hunter Axe', 'Forgotten Blade', 'Heaven’s Divider',
  'Imperial Staff', 'Saint Spear'
];

const formatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });
const percent = (value) => formatter.format(value * 100) + '%';

function nextChance(level, chance) {
  return level < 3 ? 1 : chance;
}

function streakChance(level, target, chance) {
  return chance ** Math.max(0, target - Math.max(3, level));
}

function enchant(level, chance, blessed, roll) {
  if (roll < nextChance(level, chance)) return level + 1;
  return blessed ? 0 : null;
}

const dialog = document.createElement('dialog');
dialog.className = 'enchant-simulator';
dialog.setAttribute('aria-labelledby', 'enchantSimulatorTitle');
dialog.innerHTML = `
  <div class="enchant-heading">
    <h2 id="enchantSimulatorTitle">Symulator enchantu S</h2>
    <form method="dialog"><button type="submit" aria-label="Zamknij symulator">×</button></form>
  </div>
  <div class="enchant-settings">
    <label>Broń <select name="weapon">${weapons.map(name => `<option>${name}</option>`).join('')}</select></label>
    <label>Zwój <select name="scroll"><option value="regular">EWS · zwykły</option><option value="blessed">BEWS · Blessed</option></select></label>
    <label>Start <input name="start" type="number" min="0" max="15" value="3" required></label>
    <label>Cel <input name="target" type="number" min="1" max="16" value="8" required></label>
    <label>Szansa powyżej +3 (%) <input name="chance" type="number" min="0" max="100" step="any" value="66.67" required></label>
  </div>
  <p class="enchant-note">Model Interlude. Szansa 66,67% to założenie. Stawka Reborn Eternal nie jest potwierdzona. Do +3 próby są bezpieczne. Porażka EWS niszczy broń, a BEWS resetuje ją do +0.</p>
  <div class="enchant-result">
    <strong data-enchant-weapon></strong>
    <span data-enchant-level></span>
  </div>
  <dl class="enchant-stats">
    <div><dt>Następny enchant</dt><dd data-enchant-next></dd></div>
    <div><dt>Do celu bez porażki</dt><dd data-enchant-odds></dd></div>
    <div><dt>Zużyte zwoje</dt><dd data-enchant-scrolls></dd></div>
  </dl>
  <p class="enchant-feedback" role="status"></p>
  <div class="enchant-actions">
    <button class="primary-btn" type="button" data-enchant-roll>Enchantuj</button>
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

function render() {
  const valid = start.validity.valid && target.validity.valid && chanceInput.validity.valid;
  const active = valid && level !== null && level < target.valueAsNumber;
  view('weapon').textContent = field('weapon').value;
  view('level').textContent = level === null ? 'Rozbita' : Number.isInteger(level) ? '+' + level : '—';
  view('scrolls').textContent = scrolls;
  view('next').textContent = active ? percent(nextChance(level, chance())) : '—';
  view('odds').textContent = valid && level !== null ? percent(streakChance(level, target.valueAsNumber, chance())) : '—';
  view('roll').disabled = !active;
  if (!valid) feedback.textContent = 'Wpisz poprawny poziom początkowy, cel i szansę.';
}

function reset() {
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
view('reset').addEventListener('click', reset);
view('roll').addEventListener('click', () => {
  if (view('roll').disabled) return;
  const previous = level;
  level = enchant(level, chance(), field('scroll').value === 'blessed', Math.random());
  scrolls += 1;
  if (level === null) feedback.textContent = 'Porażka. Broń rozbiła się na kryształy.';
  else if (level === 0) feedback.textContent = 'Porażka. Blessed zachował broń i zresetował enchant do +0.';
  else feedback.textContent = `Sukces: +${previous} → +${level}.` + (level >= target.valueAsNumber ? ' Cel osiągnięty!' : '');
  render();
});
document.getElementById('openEnchantSimulator').addEventListener('click', (event) => {
  event.preventDefault();
  dialog.showModal();
});
if (location.hash === '#enchant-s') dialog.showModal();
render();

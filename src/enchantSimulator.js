import './enchantSimulator.css';
import { craftItemIconPath } from './craftItemIcons.js';

const weapons = [
  'Draconic Bow', 'Angel Slayer', 'Arcana Mace', 'Basalt Battlehammer',
  'Demon Splinter', 'Dragon Hunter Axe', 'Forgotten Blade', 'Heaven’s Divider',
  'Imperial Staff', 'Saint Spear'
];

const magicWeapons = new Set(['Arcana Mace', 'Imperial Staff']);
const weaponBaseChances = { physical: 70, magic: 40 };
const baseChanceForWeapon = (weapon) => weaponBaseChances[magicWeapons.has(weapon) ? 'magic' : 'physical'];

const scrollIcons = {
  regular: 'https://l2db.info/uploads/images/icons/etc_scroll_of_enchant_weapon_i05.png',
  blessed: 'https://l2db.info/uploads/images/icons/etc_blessed_scrl_of_ench_wp_s_i05.png'
};

const averageRuns = 10;
const simulationLimit = 1_000_000;

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

function referencePercent(probability) {
  const value = probability * 100;
  return value > 0 && value < 0.01 ? value.toPrecision(2).replace('.', ',') + '%' : percent(probability);
}

function referenceRows() {
  const chances = Object.values(weaponBaseChances).map(value => value / 100);
  return Array.from({ length: 16 }, (_, level) => {
    const goal = level + 1;
    const cells = chances.map(chance => {
      const cumulative = streakChance(0, goal, chance);
      return `
        <td>
          <strong class="enchant-odds-step">${referencePercent(nextChance(level, chance))}</strong>
          <span class="enchant-odds-total">od +0 <b>${referencePercent(cumulative)}</b></span>
          <span class="enchant-odds-track" aria-hidden="true"><span style="width:${cumulative * 100}%"></span></span>
        </td>
      `;
    }).join('');
    const rowClass = level < 3 ? 'enchant-odds-safe' : level === 15 ? 'enchant-odds-final' : '';
    return `<tr class="${rowClass}"><th scope="row">+${level} <span>→</span> <strong>+${goal}</strong></th>${cells}</tr>`;
  }).join('');
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
  <details class="enchant-odds-reference">
    <summary><span>Szanse wzmocnienia</span><span class="enchant-odds-range">+0 → +16</span></summary>
    <div class="enchant-odds-body">
      <p>Duża liczba pokazuje szansę na kolejny plus. Wartość „od +0” i pasek pokazują szansę dojścia do danego poziomu bez porażki. Tabela używa domyślnych stawek symulatora.</p>
      <table class="enchant-odds-table">
        <thead><tr><th scope="col">Poziom</th><th scope="col">Broń fizyczna</th><th scope="col">Broń magiczna</th></tr></thead>
        <tbody>${referenceRows()}</tbody>
      </table>
    </div>
  </details>
  <div class="enchant-result">
    <strong data-enchant-weapon></strong>
    <span data-enchant-level></span>
  </div>
  <dl class="enchant-stats">
    <div><dt>Następny enchant</dt><dd data-enchant-next></dd></div>
    <div><dt>Do celu bez porażki</dt><dd data-enchant-odds></dd></div>
    <div><dt>Zużyte zwoje</dt><dd data-enchant-scrolls></dd></div>
    <div><dt>Rozbite bronie</dt><dd data-enchant-broken></dd></div>
    <div><dt>Średnia z ${averageRuns} serii</dt><dd data-enchant-average-result>—</dd></div>
  </dl>
  <p class="enchant-feedback" role="status"></p>
  <div class="enchant-actions">
    <button class="primary-btn" type="button" data-enchant-roll>Enchantuj</button>
    <button class="primary-btn" type="button" data-enchant-auto>Automat do celu</button>
    <button class="secondary-btn" type="button" data-enchant-average>Policz średnią z ${averageRuns} serii</button>
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
let averageFrame = null;
const averageButton = view('average');
const averageResult = view('average-result');
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
  const autoRunning = autoFrame !== null;
  const averageRunning = averageFrame !== null;
  const canSimulate = valid && hasWeapon && hasScroll && (target.valueAsNumber <= 3 || chance() > 0);
  view('roll').disabled = !active || autoRunning || averageRunning;
  autoButton.disabled = averageRunning || (!autoRunning && (!canSimulate || (level !== null && level >= target.valueAsNumber)));
  autoButton.textContent = autoRunning ? 'Zatrzymaj automat' : 'Automat do +' + (target.validity.valid ? target.valueAsNumber : '…');
  averageButton.disabled = autoRunning || (!averageRunning && (!canSimulate || start.valueAsNumber >= target.valueAsNumber));
  averageButton.textContent = averageRunning ? 'Zatrzymaj liczenie średniej' : `Policz średnią z ${averageRuns} serii`;
  inputs.forEach(input => { input.disabled = autoRunning || averageRunning; });
  if (!valid) feedback.textContent = 'Wpisz poprawny poziom początkowy, cel i szansę.';
}

function stopAuto() {
  if (autoFrame !== null) cancelAnimationFrame(autoFrame);
  autoFrame = null;
}

function stopAverage() {
  if (averageFrame !== null) cancelAnimationFrame(averageFrame);
  averageFrame = null;
}

function reset() {
  stopAuto();
  stopAverage();
  averageResult.textContent = '—';
  broken = 0;
  level = start.valueAsNumber;
  scrolls = 0;
  feedback.textContent = '';
  render();
}

dialog.querySelector('.enchant-settings').addEventListener('input', (event) => {
  averageResult.textContent = '—';
  if (event.target === start) reset();
  else {
    feedback.textContent = '';
    render();
  }
});
field('weapon').addEventListener('change', () => {
  chanceInput.value = baseChanceForWeapon(field('weapon').value);
  reset();
});
field('scroll').addEventListener('change', () => {
  averageResult.textContent = '—';
  render();
});
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
  const limit = scrolls + simulationLimit;
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
averageButton.addEventListener('click', () => {
  if (averageFrame !== null) {
    stopAverage();
    feedback.textContent = 'Liczenie średniej zatrzymane.';
    render();
    return;
  }

  const initialLevel = start.valueAsNumber;
  const goal = target.valueAsNumber;
  const baseChance = chance();
  const blessed = field('scroll').value === 'blessed';
  let runLevel = initialLevel;
  let completed = 0;
  let used = 0;
  averageResult.textContent = '—';
  feedback.textContent = `Cel +${goal} · ukończono 0/${averageRuns} serii.`;

  function runBatch() {
    const batchLimit = Math.min(used + 2500, simulationLimit);
    while (used < batchLimit && completed < averageRuns) {
      runLevel = enchant(runLevel, baseChance, blessed, Math.random()) ?? 0;
      used += 1;
      if (runLevel === goal) {
        completed += 1;
        runLevel = initialLevel;
      }
    }

    if (completed === averageRuns) {
      averageFrame = null;
      averageResult.textContent = `${formatter.format(used / averageRuns)} zwojów`;
      feedback.textContent = `Cel +${goal} osiągnięty w każdej z ${averageRuns} serii. Łącznie zużyto ${formatter.format(used)} zwojów.`;
      render();
      return;
    }

    if (used === simulationLimit) {
      averageFrame = null;
      feedback.textContent = `Limit miliona zwojów. Cel +${goal} osiągnięto w ${completed}/${averageRuns} serii. Brak pełnej średniej.`;
      render();
      return;
    }

    const progress = `Cel +${goal} · ukończono ${completed}/${averageRuns} serii.`;
    if (feedback.textContent !== progress) feedback.textContent = progress;
    averageFrame = requestAnimationFrame(runBatch);
  }

  averageFrame = requestAnimationFrame(runBatch);
  render();
});

dialog.addEventListener('close', () => {
  if (averageFrame !== null) {
    stopAverage();
    feedback.textContent = 'Liczenie średniej zatrzymane.';
    render();
    return;
  }
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

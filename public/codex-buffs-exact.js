const exactBuffPresets = {
  Mage: {
    title: 'Mage · preset bazowy 1:1',
    source: 'Discord 20.01.2025',
    asset: '/images/codex/buffs/mage-source.txt',
    note: 'Dokładny układ ikon i kolejność ze screena źródłowego. Nie zmieniamy kolejności ani nie dopisujemy buffów.'
  },
  Dagger: {
    title: 'Dagger · preset bazowy 1:1',
    source: 'Discord 20.01.2025',
    asset: '/images/codex/buffs/dagger-source.txt',
    note: 'Dokładny układ ikon i kolejność ze screena źródłowego.'
  },
  Archer: {
    title: 'Archer · preset bazowy 1:1',
    source: 'Discord 20.01.2025',
    asset: '/images/codex/buffs/archer-source.txt',
    note: 'Dokładny układ ikon i kolejność ze screena źródłowego.'
  }
};

const buffPresetContainer = document.querySelector('#buffPresets');
let exactActivePreset = 'Mage';
const exactCache = new Map();

function ensureExactBuffStyles() {
  if (document.querySelector('#exact-buff-styles')) return;
  const style = document.createElement('style');
  style.id = 'exact-buff-styles';
  style.textContent = `
    .exact-buff-source{margin-top:18px;border:1px solid #3a3021;background:#080807;border-radius:10px;padding:14px;overflow-x:auto}
    .exact-buff-source img{display:block;max-width:none;width:auto;height:auto;image-rendering:auto;border-radius:4px;box-shadow:0 0 0 1px rgba(215,181,109,.18)}
    .exact-buff-badge{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:6px 9px;border-radius:999px;border:1px solid #3f673e;background:#102015;color:#8de2a2;font-size:11px;font-weight:800;letter-spacing:.04em}
    .exact-buff-note{margin-top:12px!important;color:#b8b0a3!important}
    .exact-buff-source-label{font-size:10px;color:#d7b56d;text-transform:uppercase;letter-spacing:.14em;margin-bottom:9px;font-weight:800}
  `;
  document.head.appendChild(style);
}

async function exactImageData(asset) {
  if (exactCache.has(asset)) return exactCache.get(asset);
  const response = await fetch(asset, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Nie udało się wczytać źródła buffów: ${response.status}`);
  const base64 = (await response.text()).trim();
  const dataUri = `data:image/webp;base64,${base64}`;
  exactCache.set(asset, dataUri);
  return dataUri;
}

async function renderExactPreset(key = exactActivePreset) {
  if (!buffPresetContainer || !exactBuffPresets[key]) return;
  exactActivePreset = key;
  ensureExactBuffStyles();
  const p = exactBuffPresets[key];
  buffPresetContainer.innerHTML = `
    <h3>Presety buffów 1:1</h3>
    <div class="preset-tabs">
      ${Object.keys(exactBuffPresets).map(name => `<button class="${name === key ? 'active' : ''}" data-exact-preset="${name}">${name}</button>`).join('')}
    </div>
    <div class="preset-card">
      <h4>${p.title}</h4>
      <p><b>${p.source}</b> · ${p.note}</p>
      <div class="exact-buff-source">
        <div class="exact-buff-source-label">Źródło Discord · kolejność zachowana dokładnie</div>
        <div data-exact-image>Wczytywanie ikon…</div>
      </div>
      <div class="exact-buff-badge">✓ UKŁAD 1:1 ZE SCREENA</div>
      <p class="exact-buff-note">Nie pokazuję tutaj zgadywanej listy nazw. Najważniejsze jest zachowanie dokładnie tych ikon i ich kolejności z materiału klanowego.</p>
    </div>`;
  try {
    const src = await exactImageData(p.asset);
    const mount = buffPresetContainer.querySelector('[data-exact-image]');
    if (mount) mount.innerHTML = `<img src="${src}" alt="${p.title} — dokładny układ buffów ze screena Discord" />`;
  } catch (error) {
    const mount = buffPresetContainer.querySelector('[data-exact-image]');
    if (mount) mount.textContent = 'Nie udało się wczytać ikon. Odśwież stronę.';
    console.error(error);
  }
}

if (buffPresetContainer) {
  buffPresetContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-exact-preset]');
    if (!button) return;
    event.preventDefault();
    renderExactPreset(button.dataset.exactPreset);
  });
  renderExactPreset('Mage');
}

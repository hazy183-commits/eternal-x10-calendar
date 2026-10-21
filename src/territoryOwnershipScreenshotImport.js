import { TERRITORY_GROUPS, TerritoryOwnershipRepository, parseTerritoryOwners } from './territoryOwnership.js';
import { parseSiegeScreenshotText } from './siegeScreenshotImport.js';
import { SIEGE_CASTLES } from './siegeSchedules.js';

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function mergeSiegeCandidates(candidateSets) {
  const votes = new Map();
  for (const rows of candidateSets) {
    for (const row of rows || []) {
      if (!row?.castle || !row.reference_date || !row.reference_time) continue;
      if (!votes.has(row.castle)) votes.set(row.castle, new Map());
      const key = `${row.reference_date}|${row.reference_time}`;
      const options = votes.get(row.castle);
      const current = options.get(key) || { row, count: 0 };
      current.count += 1;
      options.set(key, current);
    }
  }
  return SIEGE_CASTLES.map((castle) => {
    const options = [...(votes.get(castle)?.values() || [])].sort((a, b) => b.count - a.count);
    return options[0]?.row;
  }).filter(Boolean);
}

// Column-only OCR has no castle labels, so only map values to castles when
// all nine dates AND all nine times were read, in source-table order.
function parseSiegeDateColumn(text) {
  const source = String(text ?? '').replace(/\u00a0/g, ' ')
    .replace(/[OoQ](?=\d)/g, '0').replace(/(?<=\d)[OoQ]/g, '0')
    .replace(/[lI|!](?=\d)/g, '1').replace(/(?<=\d)[,;]/g, '.');
  const dates = [...source.matchAll(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(20\d{2})\b/g)]
    .map((match) => {
      const [, day, month, year] = match;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const parsed = new Date(`${date}T12:00:00Z`);
      return parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() + 1 === Number(month) && parsed.getUTCDate() === Number(day) ? date : null;
    }).filter(Boolean);
  const timeSource = source.replace(/\d{1,2}\s*[.\-/]\s*\d{1,2}\s*[.\-/]\s*20\d{2}\b/g, ' ')
    .replace(/(?<=\d)\s*[.,·]\s*(?=\d{2}\b)/g, ':');
  const times = [...timeSource.matchAll(/(?:^|\D)([01]?\d|2[0-3])\s*:\s*([0-5]\d)(?:\D|$)/g)]
    .map((match) => `${String(match[1]).padStart(2, '0')}:${match[2]}`);
  if (dates.length !== SIEGE_CASTLES.length || times.length !== SIEGE_CASTLES.length) return [];
  return SIEGE_CASTLES.map((castle, index) => ({ castle, reference_date: dates[index], reference_time: times[index] }));
}

function loadTesseract(setStatus) {
  if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ob-tesseract]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    setStatus('Ładowanie silnika OCR…', 4);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.dataset.obTesseract = '1';
    script.onload = () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error('Silnik OCR nie uruchomił się.'));
    script.onerror = () => reject(new Error('Nie udało się pobrać silnika OCR.'));
    document.head.appendChild(script);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nie udało się otworzyć screena.')); };
    image.src = url;
  });
}

function contrastCanvas(image, thresholdMode = false) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.max(1, Math.min(2.4, 2600 / Math.max(width, height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114;
    const value = thresholdMode === 'invert' ? (gray > 145 ? 0 : 255) : thresholdMode ? (gray > 145 ? 255 : 0) : Math.max(0, Math.min(255, (gray - 115) * 2 + 128));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function ownershipCropRect(width, height, territoryType = 'castle') {
  const clanColumnEnd = territoryType === 'clan_hall' ? 0.455 : 0.515;
  // Eternal tables are: number | territory | clan | leader | siege date.
  // Clan Hall names need more horizontal room, but both crops stop before the
  // Leader column so OCR never receives leader names or dates.
  return {
    x: 0,
    y: Math.round(height * 0.035),
    width: Math.round(width * clanColumnEnd),
    height: Math.round(height * 0.945),
  };
}

function cropSiegeColumns(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const rect = { x: Math.round(width * 0.43), y: Math.round(height * 0.035), width: Math.round(width * 0.56), height: Math.round(height * 0.945) };
  const scale = Math.max(2, Math.min(3.4, 2600 / Math.max(rect.width, rect.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function cropOwnershipColumns(image, territoryType) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const rect = ownershipCropRect(width, height, territoryType);
  const scale = Math.max(1.8, Math.min(3.2, 2200 / Math.max(rect.width, rect.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function mergeResults(groups) {
  const merged = new Map();
  groups.flat().forEach((row) => {
    const current = merged.get(row.territory_name);
    if (!current || (!current.owner_clan && row.owner_clan)) merged.set(row.territory_name, row);
  });
  return [...merged.values()];
}

function resultRow(row, currentOwners) {
  const current = currentOwners.get(row.territory_name) || 'Brak właściciela';
  return `<div class="territory-ocr-row" data-territory-row data-territory-type="${esc(row.territory_type)}">
    <label><input type="checkbox" data-territory-enabled ${row.selected === false ? '' : 'checked'}><span>Zapisz</span></label>
    <select data-territory-name>${TERRITORY_GROUPS[row.territory_type].map(({ name }) => `<option value="${esc(name)}" ${name === row.territory_name ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>
    <span class="territory-ocr-current" title="Obecny właściciel">${esc(current)}</span>
    <span class="territory-ocr-arrow">→</span>
    <input data-territory-owner maxlength="80" value="${esc(row.owner_clan)}" placeholder="Nazwa klanu lub puste = brak">
    <button type="button" data-territory-remove aria-label="Usuń wiersz">×</button>
  </div>`;
}

export function installTerritoryOwnershipScreenshotImport(supabase) {
  if (!supabase || typeof document === 'undefined' || window.__obTerritoryOwnershipImportInstalled) return;
  window.__obTerritoryOwnershipImportInstalled = true;
  const repository = new TerritoryOwnershipRepository(supabase);
  let type = 'castle';
  let file = null;
  let currentRows = [];

  const style = document.createElement('style');
  style.textContent = `
    .territory-ocr{margin:0 0 18px;padding:16px;border:1px solid #5b482b;background:linear-gradient(145deg,#121511,#090c0c)}.territory-ocr-head{display:flex;justify-content:space-between;gap:15px}.territory-ocr-head h3{margin:3px 0 4px;color:#e6c779;font-size:17px}.territory-ocr-head p{margin:0;color:#888176;font-size:11px}.territory-ocr-tabs{display:flex;gap:6px}.territory-ocr-tabs button,.territory-ocr-button{padding:9px 11px;border:1px solid #66502b;background:#11120f;color:#b99a59;font-size:10px;font-weight:900;cursor:pointer}.territory-ocr-tabs button.active,.territory-ocr-button.primary{border-color:#a77b34;background:#33230f;color:#efca76}.territory-ocr-drop{display:grid;grid-template-columns:150px 1fr;gap:13px;align-items:center;margin-top:13px;padding:11px;border:1px dashed #64502e}.territory-ocr-preview{display:grid;place-items:center;height:96px;overflow:hidden;border:1px solid #342d22;background:#060808;color:#655f54;font-size:10px}.territory-ocr-preview img{width:100%;height:100%;object-fit:cover}.territory-ocr-actions{display:flex;gap:7px;flex-wrap:wrap}.territory-ocr-file{position:absolute;width:1px;height:1px;opacity:0}.territory-ocr-status{min-height:16px;margin-top:9px;color:#948978;font-size:10px}.territory-ocr-status.success{color:#8fb86f}.territory-ocr-status.error{color:#d98275}.territory-ocr-progress{height:4px;background:#18150f}.territory-ocr-progress i{display:block;height:100%;width:0;background:#b98636;transition:width .2s}.territory-ocr-results{display:grid;gap:7px;margin-top:12px}.territory-ocr-row{display:grid;grid-template-columns:66px minmax(145px,1fr) minmax(120px,.9fr) 20px minmax(150px,1fr) 32px;gap:7px;align-items:center}.territory-ocr-row label{display:flex;gap:5px;color:#9f927c;font-size:9px;font-weight:900}.territory-ocr-row select,.territory-ocr-row input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #413723;background:#080b0b;color:#ddd;font-size:10px}.territory-ocr-current{overflow:hidden;color:#918a7f;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.territory-ocr-arrow{text-align:center;color:#a77b34}.territory-ocr-row [data-territory-remove]{width:32px;height:32px;border:1px solid #5b342d;background:#170e0d;color:#d47c6c;cursor:pointer}.territory-ocr-footer{display:flex;gap:8px;margin-top:10px}.territory-ocr-note{margin:9px 0 0;color:#756e62;font-size:9px}@media(max-width:800px){.territory-ocr-head{flex-direction:column}.territory-ocr-drop{grid-template-columns:1fr}.territory-ocr-preview{height:145px}.territory-ocr-row{grid-template-columns:62px 1fr 30px}.territory-ocr-current{grid-column:1/3}.territory-ocr-arrow{display:none}.territory-ocr-row [data-territory-owner]{grid-column:1/3}.territory-ocr-footer{flex-wrap:wrap}}
  `;
  document.head.appendChild(style);

  function mount(manager) {
    if (!manager || manager.querySelector('[data-territory-ocr]')) return;
    const section = document.createElement('section');
    section.className = 'territory-ocr';
    section.dataset.territoryOcr = '1';
    section.innerHTML = `<div class="territory-ocr-head"><div><span class="eyebrow">Import właścicieli ze screena</span><h3>CASTLE / CLAN HALL OCR</h3><p>Jeden screen rozpoznaje właścicieli klanów oraz daty i godziny Siege. Sprawdź oba podglądy przed zapisem.</p></div><div class="territory-ocr-tabs"><button type="button" class="active" data-territory-type="castle">ZAMKI</button><button type="button" data-territory-type="clan_hall">CLAN HALLE</button></div></div><div class="territory-ocr-drop"><div class="territory-ocr-preview" data-territory-preview>Podgląd screena</div><div><div class="territory-ocr-actions"><label class="territory-ocr-button">WYBIERZ SCREEN<input class="territory-ocr-file" data-territory-file type="file" accept="image/png,image/jpeg,image/webp"></label><button class="territory-ocr-button primary" type="button" data-territory-run disabled>ROZPOZNAJ</button></div><div class="territory-ocr-status" data-territory-status>Wybierz screen listy zamków.</div><div class="territory-ocr-progress"><i data-territory-progress></i></div></div></div><div class="territory-ocr-results" data-territory-results></div><div class="territory-ocr-footer"><button class="territory-ocr-button" type="button" data-territory-add>+ DODAJ WIERSZ</button><button class="territory-ocr-button primary" type="button" data-territory-save disabled>ZAPISZ ZAZNACZONE</button></div><p class="territory-ocr-note">Przed zapisem zawsze sprawdź rozpoznane nazwy klanów. Puste pole oznacza brak właściciela.</p>`;
    manager.insertBefore(section, manager.firstChild);

    const setStatus = (message, progress = 0, state = '') => {
      const status = section.querySelector('[data-territory-status]');
      status.textContent = message;
      status.className = `territory-ocr-status ${state}`;
      section.querySelector('[data-territory-progress]').style.width = `${progress}%`;
    };
    const currentOwners = () => new Map(currentRows.filter((row) => row.territory_type === type).map((row) => [row.territory_name, row.owner_clan]));
    const render = (rows) => {
      section.querySelector('[data-territory-results]').innerHTML = rows.map((row) => resultRow(row, currentOwners())).join('');
      section.querySelector('[data-territory-save]').disabled = !rows.length;
    };

    repository.getAll().then((rows) => { currentRows = rows; });
    section.querySelectorAll('[data-territory-type]').forEach((button) => button.addEventListener('click', () => {
      type = button.dataset.territoryType;
      section.querySelectorAll('[data-territory-type]').forEach((item) => item.classList.toggle('active', item === button));
      render([]);
      setStatus(type === 'castle' ? 'Wybierz screen listy zamków.' : 'Wybierz screen listy Clan Halli.');
    }));
    section.querySelector('[data-territory-file]').addEventListener('change', (event) => {
      file = event.target.files?.[0] || null;
      const preview = section.querySelector('[data-territory-preview]');
      preview.innerHTML = '';
      if (file) {
        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        image.onload = () => URL.revokeObjectURL(image.src);
        preview.appendChild(image);
      } else preview.textContent = 'Podgląd screena';
      section.querySelector('[data-territory-run]').disabled = !file;
      setStatus(file ? `Wybrano: ${file.name}` : 'Wybierz screen.');
    });
    section.querySelector('[data-territory-run]').addEventListener('click', async () => {
      if (!file) return;
      const button = section.querySelector('[data-territory-run]');
      button.disabled = true;
      setStatus('Przygotowuję obraz…', 3);
      try {
        const [Tesseract, image] = await Promise.all([loadTesseract(setStatus), loadImage(file)]);
        const ownershipColumns = cropOwnershipColumns(image, type);
        const siegeColumns = cropSiegeColumns(image);
        const territoryLabel = type === 'castle' ? 'Zamek' : 'Clan Hall';
        // Use the same OCR engine for owners and dates; date-column passes are isolated from clan recognition.
        const variants = [
          { image: ownershipColumns, label: `Kolumny ${territoryLabel} + Klan`, psm: '6', owners: true },
          { image: contrastCanvas(ownershipColumns), label: `${territoryLabel} + Klan — kontrast`, psm: '6', owners: true },
          { image: contrastCanvas(ownershipColumns, true), label: `${territoryLabel} + Klan — czarno-białe`, psm: '11', owners: true },
          { image: siegeColumns, label: 'Kolumna dat Siege', psm: '6' },
          { image: contrastCanvas(siegeColumns), label: 'Kolumna dat Siege — kontrast', psm: '6' },
          { image: contrastCanvas(siegeColumns, true), label: 'Kolumna dat Siege — czarno-białe', psm: '11' },
          { image: contrastCanvas(siegeColumns, 'invert'), label: 'Kolumna dat Siege — odwrócony kontrast', psm: '6' },
          { image: file, label: 'Pełny screen — kontrola dat', psm: '6', parser: 'rows' },
          { image: file, label: 'Pełny screen — kontrola właścicieli', psm: '6', owners: true },
        ];
        const parsed = [];
        const siegeTexts = [];
        for (let index = 0; index < variants.length; index += 1) {
          const variant = variants[index];
          const result = await Tesseract.recognize(variant.image, 'eng', {
            tessedit_pageseg_mode: variant.psm,
            preserve_interword_spaces: '1',
            logger: (message) => {
              if (message.status === 'recognizing text') setStatus(`${variant.label}: ${Math.round((message.progress || 0) * 100)}%`, Math.round(8 + (index / variants.length) * 72 + (message.progress || 0) * (70 / variants.length)));
            },
          });
          const recognizedText = result?.data?.text || '';
          siegeTexts.push({ text: recognizedText, parser: variant.parser || (variant.owners ? 'owners' : 'column') });
          if (variant.owners) parsed.push(parseTerritoryOwners(recognizedText, type));
        }
        const rows = mergeResults(parsed);
        render(rows);
        const siegeRows = mergeSiegeCandidates(siegeTexts.map(({ text, parser }) => parser === 'column' ? parseSiegeDateColumn(text) : parser === 'rows' ? parseSiegeScreenshotText(text) : []));
        if (siegeRows.length) window.dispatchEvent(new CustomEvent('ob:siege-screenshot-dates-detected', { detail: { rows: siegeRows, sourceFile: file?.name || '' } }));
        const message = rows.length ? `Rozpoznano ${rows.length} pozycji właścicieli oraz ${siegeRows.length}/9 terminów Siege. ${siegeRows.length === 9 ? 'Sprawdź daty w sekcji importu terminów Siege.' : 'Nie odczytano kompletu dat — upewnij się, że cały prawy słupek jest widoczny.'}` : 'Nie znaleziono nazw. Dodaj wiersze ręcznie lub użyj ciaśniejszego screena.';
        setStatus(message, 88, rows.length ? 'success' : 'error');
      } catch (error) {
        setStatus(error?.message || 'Nie udało się odczytać screena.', 0, 'error');
      } finally {
        button.disabled = false;
      }
    });
    section.querySelector('[data-territory-add]').addEventListener('click', () => {
      const used = new Set([...section.querySelectorAll('[data-territory-name]')].map((field) => field.value));
      const territory = TERRITORY_GROUPS[type].find(({ name }) => !used.has(name)) || TERRITORY_GROUPS[type][0];
      section.querySelector('[data-territory-results]').insertAdjacentHTML('beforeend', resultRow({ territory_type: type, territory_name: territory.name, owner_clan: '', selected: true }, currentOwners()));
      section.querySelector('[data-territory-save]').disabled = false;
    });
    section.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-territory-remove]');
      if (!remove) return;
      remove.closest('[data-territory-row]').remove();
      section.querySelector('[data-territory-save]').disabled = !section.querySelector('[data-territory-row]');
    });
    section.querySelector('[data-territory-save]').addEventListener('click', async () => {
      const rows = [...section.querySelectorAll('[data-territory-row]')].filter((row) => row.querySelector('[data-territory-enabled]').checked).map((row) => ({
        territory_type: row.dataset.territoryType,
        territory_name: row.querySelector('[data-territory-name]').value,
        owner_clan: row.querySelector('[data-territory-owner]').value.trim(),
      }));
      if (!rows.length) return setStatus('Zaznacz przynajmniej jeden wiersz.', 0, 'error');
      const duplicate = rows.find((row, index) => rows.findIndex((other) => other.territory_name === row.territory_name) !== index);
      if (duplicate) return setStatus(`${duplicate.territory_name} występuje więcej niż raz.`, 0, 'error');
      try {
        setStatus('Zapisuję wyłącznie właścicieli…', 92);
        await repository.save(rows);
        setStatus(`Zapisano ${rows.length} pozycji. Terminy pozostały bez zmian.`, 100, 'success');
        setTimeout(() => window.location.reload(), 900);
      } catch (error) {
        setStatus(error.message, 0, 'error');
      }
    });
  }

  const manager = document.querySelector('#siegeManager');
  if (manager) mount(manager);
  else new MutationObserver((_, observer) => {
    const next = document.querySelector('#siegeManager');
    if (next) { mount(next); observer.disconnect(); }
  }).observe(document.body, { childList: true, subtree: true });
}

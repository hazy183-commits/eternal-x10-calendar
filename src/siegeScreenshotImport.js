import { SIEGE_CASTLES } from './siegeSchedules.js';

const normalize = (value) => String(value ?? '').toLocaleLowerCase().replace(/[^a-z]/g, '');
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const pad = (value) => String(value).padStart(2, '0');

function normalizeOcrDigits(value = '') {
  return String(value)
    .replace(/[OoQ](?=\d)/g, '0')
    .replace(/(?<=\d)[OoQ]/g, '0')
    .replace(/[lI|!](?=\d)/g, '1')
    .replace(/(?<=\d)[,;]/g, '.')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/(?<=\d)\s*[·.]\s*(?=\d{2}\b)/g, ':');
}

function validDate(day, month, year) {
  const date = `${year}-${pad(month)}-${pad(day)}`;
  const parsed = new Date(`${date}T12:00:00Z`);
  return parsed.getUTCFullYear() === Number(year)
    && parsed.getUTCMonth() + 1 === Number(month)
    && parsed.getUTCDate() === Number(day) ? date : null;
}

function extractDates(text) {
  const source = normalizeOcrDigits(text).replace(/(?<=\d),(?=\d)/g, '.');
  const matches = [...source.matchAll(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(20\d{2})\b/g)];
  return matches.map((match) => validDate(match[1], match[2], match[3])).filter(Boolean);
}

function extractTimes(text) {
  const withoutDates = normalizeOcrDigits(text)
    .replace(/\d{1,2}\s*[.\-/]\s*\d{1,2}\s*[.\-/]\s*20\d{2}\b/g, ' ');
  const matches = [...withoutDates.matchAll(/(?:^|\D)([01]?\d|2[0-3])\s*:\s*([0-5]\d)(?:\D|$)/g)];
  return matches.map((match) => `${pad(match[1])}:${match[2]}`);
}

function dateTimeRow(castle, date, time) {
  return { castle, reference_date: date, reference_time: time };
}

export function parseSiegeScreenshotText(text) {
  const source = normalizeOcrDigits(String(text ?? '').replace(/\u00a0/g, ' '));
  const rows = new Map();

  // First pass: keep a date/time tied to its castle when OCR returns whole rows.
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const castle = SIEGE_CASTLES.find((name) => normalize(line).includes(normalize(name)));
    if (!castle) continue;
    const date = extractDates(line)[0];
    const time = extractTimes(line)[0];
    if (date && time) rows.set(castle, dateTimeRow(castle, date, time));
  }

  // OCR often reads this UI by columns. Only pair columns when all nine values
  // were recovered, so a partial read can never shift dates onto the wrong castle.
  if (rows.size < SIEGE_CASTLES.length) {
    const foundCastles = [];
    const castleRegex = new RegExp(SIEGE_CASTLES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
    for (const match of source.matchAll(castleRegex)) {
      const castle = SIEGE_CASTLES.find((name) => normalize(name) === normalize(match[0]));
      if (castle && !foundCastles.includes(castle)) foundCastles.push(castle);
    }
    const dates = extractDates(source);
    const times = extractTimes(source);
    if (foundCastles.length === SIEGE_CASTLES.length && dates.length === SIEGE_CASTLES.length && times.length === SIEGE_CASTLES.length) {
      foundCastles.forEach((castle, index) => {
        if (!rows.has(castle)) rows.set(castle, dateTimeRow(castle, dates[index], times[index]));
      });
    }
  }
  return SIEGE_CASTLES.filter((castle) => rows.has(castle)).map((castle) => rows.get(castle));
}

function mergeCandidates(candidateSets) {
  const votes = new Map();
  for (const rows of candidateSets) {
    for (const row of rows || []) {
      if (!row?.castle || !row.reference_date || !row.reference_time) continue;
      const signature = `${row.reference_date}|${row.reference_time}`;
      if (!votes.has(row.castle)) votes.set(row.castle, new Map());
      const bucket = votes.get(row.castle);
      const current = bucket.get(signature) || { row, count: 0 };
      current.count += 1;
      bucket.set(signature, current);
    }
  }
  return SIEGE_CASTLES.map((castle) => {
    const candidates = [...(votes.get(castle)?.values() || [])].sort((a, b) => b.count - a.count);
    return candidates[0]?.row;
  }).filter(Boolean);
}

function loadTesseract() {
  if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const script = document.querySelector('script[data-ob-tesseract]');
    if (script) {
      script.addEventListener('load', () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error('OCR nie uruchomił się.')), { once: true });
      script.addEventListener('error', () => reject(new Error('Nie udało się załadować OCR.')), { once: true });
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    tag.async = true;
    tag.dataset.obTesseract = '1';
    tag.onload = () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error('OCR nie uruchomił się.'));
    tag.onerror = () => reject(new Error('Nie udało się załadować silnika OCR.'));
    document.head.appendChild(tag);
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

function preprocessCanvas(image, mode = 'contrast') {
  const scale = Math.max(1.6, Math.min(3, 2600 / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = data.data;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) total += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
  const mean = total / Math.max(1, pixels.length / 4);
  const threshold = Math.max(105, Math.min(190, mean + 24));
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    const value = mode === 'threshold' ? (gray >= threshold ? 255 : 0)
      : mode === 'invert' ? (gray >= threshold ? 0 : 255)
        : Math.max(0, Math.min(255, (gray - 128) * 1.8 + 128));
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function siegeCropRect(width, height) {
  const tableLike = width / Math.max(1, height) >= 2.7 || height <= 360;
  if (tableLike) return { x: 0, y: 0, width, height, tableLike: true };
  return {
    x: Math.round(width * 0.025),
    y: Math.round(height * 0.17),
    width: Math.round(width * 0.95),
    height: Math.round(height * 0.40),
    tableLike: false,
  };
}

function cropSiegeTable(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const rect = siegeCropRect(width, height);
  const scale = Math.max(1.8, Math.min(3.2, 2800 / Math.max(rect.width, rect.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function installSiegeScreenshotImport(repository, onSaved = async () => {}) {
  if (!repository || !document.querySelector('#siegeManager') || document.querySelector('[data-siege-screenshot-import]')) return;
  const section = document.createElement('section');
  section.className = 'siege-screenshot-import';
  section.dataset.siegeScreenshotImport = '1';
  section.innerHTML = `
    <div class="admin-list-title"><div><span class="eyebrow">Cotygodniowa aktualizacja</span><h3>IMPORT TERMINÓW ZE SCREENA</h3></div></div>
    <p class="siege-manager-note">OCR działa wieloprzebiegowo jak przy Epic Bossach: przycina tabelę, sprawdza kilka wersji kontrastu i porównuje wyniki. Przed zapisem sprawdź wszystkie terminy.</p>
    <div class="siege-import-controls"><label class="secondary-btn">Wybierz screen <input data-siege-file type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button class="primary-btn" data-siege-read type="button" disabled>ODCZYTAJ TERMINY</button></div>
    <div data-siege-status role="status" class="siege-import-status">Nie zmieniamy kalendarza, dopóki nie zatwierdzisz podglądu.</div>
    <div data-siege-preview></div>
    <button class="primary-btn" data-siege-save type="button" disabled>ZATWIERDŹ I ZAPISZ TERMINY</button>`;
  const manager = document.querySelector('#siegeManager');
  manager.insertBefore(section, manager.firstChild);
  const fileInput = section.querySelector('[data-siege-file]');
  const readButton = section.querySelector('[data-siege-read]');
  const saveButton = section.querySelector('[data-siege-save]');
  const status = section.querySelector('[data-siege-status]');
  const preview = section.querySelector('[data-siege-preview]');
  let file = null;
  let rows = [];

  window.addEventListener('ob:siege-screenshot-dates-detected', (event) => {
    const detected = Array.isArray(event.detail?.rows) ? event.detail.rows : [];
    if (!detected.length) return;
    rows = detected;
    renderRows();
    status.textContent = `Daty Siege odczytano tym samym OCR co właścicieli zamków (${detected.length}/9). Sprawdź podgląd i popraw ewentualne błędy przed zapisem.`;
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const renderRows = () => {
    preview.innerHTML = rows.length ? `<div class="siege-import-table"><div class="siege-import-row siege-import-header"><span>Zamek</span><span>Data</span><span>Godzina serwera</span></div>${rows.map((row) => `<div class="siege-import-row" data-siege-row="${esc(row.castle)}"><b>${esc(row.castle)}</b><input type="date" data-siege-date value="${esc(row.reference_date)}" required><input type="time" data-siege-time value="${esc(row.reference_time)}" required></div>`).join('')}</div>` : '';
    saveButton.disabled = rows.length !== SIEGE_CASTLES.length;
  };
  fileInput.addEventListener('change', () => {
    file = fileInput.files?.[0] || null;
    readButton.disabled = !file;
    rows = [];
    renderRows();
    status.textContent = file ? `Wybrano: ${file.name}. Kliknij „Odczytaj terminy”.` : 'Wybierz screen.';
  });
  readButton.addEventListener('click', async () => {
    if (!file) return;
    readButton.disabled = true;
    saveButton.disabled = true;
    status.textContent = 'Przygotowuję screen do dokładniejszego OCR…';
    try {
      const [Tesseract, image] = await Promise.all([loadTesseract(), loadImage(file)]);
      const table = cropSiegeTable(image);
      const variants = [
        { label: 'Przycięta tabela', image: table, psm: '6' },
        { label: 'Tabela — wysoki kontrast', image: preprocessCanvas(table, 'contrast'), psm: '6' },
        { label: 'Tabela — czarno-biała', image: preprocessCanvas(table, 'threshold'), psm: '11' },
        { label: 'Tabela — odwrócony kontrast', image: preprocessCanvas(table, 'invert'), psm: '11' },
        { label: 'Pełny screen (kontrola)', image: file, psm: '6' },
      ];
      const candidateSets = [];
      const rawPasses = [];
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        status.textContent = `${variant.label}: przebieg ${index + 1}/${variants.length}…`;
        const result = await Tesseract.recognize(variant.image, 'eng', {
          tessedit_pageseg_mode: variant.psm,
          preserve_interword_spaces: '1',
          logger: (message) => {
            if (message.status === 'recognizing text') status.textContent = `${variant.label}: ${Math.round((message.progress || 0) * 100)}% (${index + 1}/${variants.length})`;
          },
        });
        const text = result?.data?.text || '';
        rawPasses.push({ label: variant.label, text, confidence: Number(result?.data?.confidence || 0) });
        candidateSets.push(parseSiegeScreenshotText(text));
      }
      rows = mergeCandidates(candidateSets);
      renderRows();
      const missing = SIEGE_CASTLES.filter((castle) => !rows.some((row) => row.castle === castle));
      status.textContent = missing.length
        ? `Rozpoznano ${rows.length}/9 zamków po ${variants.length} przebiegach OCR. Brakuje: ${missing.join(', ')}. Nie można zapisać, dopóki wszystkie pozycje nie zostaną rozpoznane.`
        : `Odczytano wszystkie 9 zamków po ${variants.length} przebiegach OCR. Sprawdź daty i godziny — możesz je poprawić przed zapisem.`;
      if (missing.length) {
        const details = rawPasses.map((pass) => `${pass.label} (${Math.round(pass.confidence)}%): ${pass.text.replace(/\s+/g, ' ').slice(0, 420)}`).join(' | ');
        status.title = details;
      } else status.removeAttribute('title');
    } catch (error) {
      status.textContent = error?.message || 'Nie udało się odczytać screena.';
    } finally {
      readButton.disabled = !file;
    }
  });
  saveButton.addEventListener('click', async () => {
    const values = [...section.querySelectorAll('[data-siege-row]')].map((element) => ({
      castle: element.dataset.siegeRow,
      date: element.querySelector('[data-siege-date]').value,
      time: element.querySelector('[data-siege-time]').value,
    }));
    if (values.length !== SIEGE_CASTLES.length || values.some((row) => !row.date || !row.time || !SIEGE_CASTLES.includes(row.castle))) {
      status.textContent = 'Sprawdź, czy wszystkie 9 zamków ma poprawną datę i godzinę.';
      return;
    }
    const duplicates = values.filter((row, index) => values.findIndex((other) => other.castle === row.castle) !== index);
    if (duplicates.length) { status.textContent = 'W podglądzie są powtórzone zamki.'; return; }
    saveButton.disabled = true;
    readButton.disabled = true;
    status.textContent = 'Zapisuję zatwierdzone terminy…';
    try {
      for (const row of values) await repository.saveReference(row.castle, row.date, row.time);
      await onSaved();
      status.textContent = 'Zapisano terminy wszystkich 9 zamków. Kalendarz został odświeżony.';
      rows = [];
      renderRows();
      fileInput.value = '';
      file = null;
    } catch (error) {
      status.textContent = error?.message || 'Nie udało się zapisać wszystkich terminów. Sprawdź panel i spróbuj ponownie.';
    } finally {
      saveButton.disabled = rows.length !== SIEGE_CASTLES.length;
      readButton.disabled = !file;
    }
  });
}

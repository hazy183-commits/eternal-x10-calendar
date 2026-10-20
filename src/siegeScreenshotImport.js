import { SIEGE_CASTLES } from './siegeSchedules.js';

const DATE_RE = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/;
const TIME_RE = /(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/;
const normalize = (value) => String(value ?? '').toLocaleLowerCase().replace(/[^a-z]/g, '');
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function parseSiegeScreenshotText(text) {
  const source = String(text ?? '').replace(/\u00a0/g, ' ');
  const rows = new Map();

  // Tesseract may read this table row-by-row or column-by-column. First try
  // line matches; then pair the ordered castle/date/time columns separately.
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const castle = SIEGE_CASTLES.find((name) => normalize(line).includes(normalize(name)));
    const dateMatch = DATE_RE.exec(line);
    const timeMatch = TIME_RE.exec(line);
    if (castle && dateMatch && timeMatch) {
      const [, day, month, year] = dateMatch;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const parsed = new Date(`${date}T12:00:00Z`);
      if (parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() + 1 === Number(month) && parsed.getUTCDate() === Number(day)) {
        rows.set(castle, { castle, reference_date: date, reference_time: `${String(timeMatch[1]).padStart(2, '0')}:${timeMatch[2]}` });
      }
    }
  }

  if (rows.size < SIEGE_CASTLES.length) {
    const foundCastles = [];
    const castleRegex = new RegExp(SIEGE_CASTLES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
    for (const match of source.matchAll(castleRegex)) {
      const castle = SIEGE_CASTLES.find((name) => normalize(name) === normalize(match[0]));
      if (castle && !foundCastles.includes(castle)) foundCastles.push(castle);
    }
    const dates = [...source.matchAll(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/g)].map((match) => {
      const [, day, month, year] = match;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const parsed = new Date(`${date}T12:00:00Z`);
      return parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() + 1 === Number(month) && parsed.getUTCDate() === Number(day) ? date : null;
    }).filter(Boolean);
    const times = [...source.matchAll(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/g)]
      .map((match) => `${String(match[1]).padStart(2, '0')}:${match[2]}`);
    if (foundCastles.length === dates.length && dates.length === times.length) {
      foundCastles.forEach((castle, index) => {
        if (!rows.has(castle)) rows.set(castle, { castle, reference_date: dates[index], reference_time: times[index] });
      });
    }
  }
  return SIEGE_CASTLES.filter((castle) => rows.has(castle)).map((castle) => rows.get(castle));
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

export function installSiegeScreenshotImport(repository, onSaved = async () => {}) {
  if (!repository || !document.querySelector('#siegeManager') || document.querySelector('[data-siege-screenshot-import]')) return;
  const section = document.createElement('section');
  section.className = 'siege-screenshot-import';
  section.dataset.siegeScreenshotImport = '1';
  section.innerHTML = `
    <div class="admin-list-title"><div><span class="eyebrow">Cotygodniowa aktualizacja</span><h3>IMPORT TERMINÓW ZE SCREENA</h3></div></div>
    <p class="siege-manager-note">Dodaj screen z tabelą zamków i datami Siege. Sprawdź wszystkie odczytane terminy przed zapisaniem.</p>
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
    status.textContent = 'Rozpoznaję nazwy zamków, daty i godziny…';
    try {
      const Tesseract = await loadTesseract();
      const result = await Tesseract.recognize(file, 'eng', {
        preserve_interword_spaces: '1',
        logger: (message) => { if (message.status === 'recognizing text') status.textContent = `Odczyt OCR: ${Math.round((message.progress || 0) * 100)}%`; },
      });
      rows = parseSiegeScreenshotText(result?.data?.text || '');
      renderRows();
      const missing = SIEGE_CASTLES.filter((castle) => !rows.some((row) => row.castle === castle));
      status.textContent = missing.length
        ? `Odczytano ${rows.length}/9 zamków. Brakuje: ${missing.join(', ')}. Nie można zapisać, dopóki wszystkie pozycje nie zostaną rozpoznane.`
        : 'Odczytano wszystkie 9 zamków. Sprawdź daty i godziny — możesz je poprawić przed zapisem.';
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

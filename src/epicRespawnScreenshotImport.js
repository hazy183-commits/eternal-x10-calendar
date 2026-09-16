import { addDays, localDateTimeToIso } from './bossRespawns.js';

const EPIC_BOSSES = Object.freeze([
  { name: 'Queen Ant', aliases: ['queen ant', 'queenant', 'queen  ant', 'qa'] },
  { name: 'Core', aliases: ['core'] },
  { name: 'Orfen', aliases: ['orfen'] },
  { name: 'Zaken', aliases: ['zaken'] },
  { name: 'Frintezza', aliases: ['frintezza', 'frinteza', 'frintezzaa', 'frintezaa'] },
]);

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const pad = (value) => String(value).padStart(2, '0');

function warsawToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[|!]/g, 'l')
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9ąćęłńóśźż:./\-–—\s']/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value = '') {
  return normalize(value)
    .replace(/0/g, 'o')
    .replace(/[1|!]/g, 'l')
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) {
      next[j] = Math.min(
        next[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = next;
  }
  return prev[b.length];
}

function similarity(a, b) {
  const left = compact(a);
  const right = compact(b);
  const longest = Math.max(left.length, right.length);
  if (!longest) return 0;
  return 1 - (levenshtein(left, right) / longest);
}

function bossMatch(value = '') {
  const line = normalize(value);
  const lineCompact = compact(value);
  let best = { name: '', score: 0 };
  for (const boss of EPIC_BOSSES) {
    for (const alias of boss.aliases) {
      const aliasNorm = normalize(alias);
      const aliasCompact = compact(alias);
      if ((aliasNorm === 'qa' && /(^|\s)qa(\s|$)/i.test(line)) || (aliasNorm !== 'qa' && lineCompact.includes(aliasCompact))) {
        return { name: boss.name, score: 1 };
      }
      const words = line.split(/\s+/).filter(Boolean);
      const spans = [line, ...words];
      for (let size = 2; size <= Math.min(3, words.length); size += 1) {
        for (let i = 0; i <= words.length - size; i += 1) spans.push(words.slice(i, i + size).join(' '));
      }
      for (const span of spans) {
        const score = similarity(span, alias);
        if (score > best.score) best = { name: boss.name, score };
      }
    }
  }
  return best.score >= 0.66 ? best : { name: '', score: best.score };
}

function normalizeForTimes(value = '') {
  return String(value)
    .replace(/[OoQ](?=\d)/g, '0')
    .replace(/(?<=\d)[OoQ]/g, '0')
    .replace(/[lI|!](?=\d)/g, '1')
    .replace(/(?<=\d)[,;]/g, ':')
    .replace(/(?<=\d)\s*[.·]\s*(?=\d{2}\b)/g, ':');
}

function validTime(hour, minute) {
  const h = Number(hour);
  const m = Number(minute);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function extractDate(text, fallback = warsawToday()) {
  const iso = String(text).match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const local = String(text).match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](20\d{2}))?\b/);
  if (!local) return fallback;
  const fallbackYear = fallback.slice(0, 4);
  return `${local[3] || fallbackYear}-${pad(local[2])}-${pad(local[1])}`;
}

export function extractTimes(text) {
  // Remove complete dates before looking for times. Without this guard,
  // a date such as 17.09.2026 can be misread as the time 17:09.
  const withoutDates = String(text)
    .replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]20\d{2}\b/g, ' ');
  const cleaned = normalizeForTimes(withoutDates);
  const results = [];
  const patterns = [
    /\b([0-2]?\d)\s*:\s*([0-5]\d)\b/g,
    /\b([0-2]?\d)\s+([0-5]\d)\b/g,
    /\b([0-2]?\d)\s*\.\s*([0-5]\d)\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of cleaned.matchAll(pattern)) {
      if (!validTime(match[1], match[2])) continue;
      const value = `${pad(match[1])}:${pad(match[2])}`;
      if (!results.includes(value)) results.push(value);
    }
    if (results.length >= 2) break;
  }
  return results.slice(0, 2);
}

function parseOcrText(rawText = '', sourceScore = 0) {
  const rawLines = String(rawText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const defaultDate = extractDate(rawText, warsawToday());
  const candidates = [];

  rawLines.forEach((line, index) => {
    const match = bossMatch(line);
    if (!match.name) return;
    const neighborhoods = [
      [line],
      [rawLines[index - 1], line, rawLines[index + 1]],
      [rawLines[index - 2], rawLines[index - 1], line, rawLines[index + 1], rawLines[index + 2]],
    ];
    for (let radius = 0; radius < neighborhoods.length; radius += 1) {
      const text = neighborhoods[radius].filter(Boolean).join(' ');
      const times = extractTimes(text);
      if (times.length < 2) continue;
      candidates.push({
        boss: match.name,
        date: extractDate(text, defaultDate),
        start: times[0],
        end: times[1],
        selected: true,
        score: match.score * 100 + sourceScore - radius * 2,
      });
      break;
    }
  });

  if (!candidates.length) {
    const normalized = normalize(rawText);
    for (const boss of EPIC_BOSSES) {
      const aliases = boss.aliases.filter((alias) => alias.length > 2);
      for (const alias of aliases) {
        const at = normalized.indexOf(normalize(alias));
        if (at < 0) continue;
        const fragment = normalized.slice(Math.max(0, at - 50), at + alias.length + 160);
        const times = extractTimes(fragment);
        if (times.length >= 2) {
          candidates.push({ boss: boss.name, date: extractDate(fragment, defaultDate), start: times[0], end: times[1], selected: true, score: 75 + sourceScore });
          break;
        }
      }
    }
  }

  return candidates;
}

function mergeCandidates(groups = []) {
  const best = new Map();
  groups.flat().forEach((row) => {
    if (!row?.boss || !row.start || !row.end) return;
    const current = best.get(row.boss);
    if (!current || (row.score || 0) > (current.score || 0)) best.set(row.boss, row);
  });
  return EPIC_BOSSES.map(({ name }) => best.get(name)).filter(Boolean).map(({ score, ...row }) => row);
}

function loadTesseract(progress) {
  if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ob-tesseract]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    progress?.('Ładowanie silnika OCR…', 3);
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
    let value;
    if (mode === 'threshold') value = gray >= threshold ? 255 : 0;
    else if (mode === 'invert') value = gray >= threshold ? 0 : 255;
    else value = Math.max(0, Math.min(255, (gray - 128) * 1.8 + 128));
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

async function runPass(Tesseract, image, label, section, passIndex, passCount, psm = '6') {
  const base = 8 + (passIndex / passCount) * 68;
  const span = 68 / passCount;
  const result = await Tesseract.recognize(image, 'eng', {
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: '1',
    logger: (message) => {
      if (message.status === 'recognizing text') {
        const pct = Math.round((message.progress || 0) * 100);
        setTimeout(() => {
          const status = section.querySelector('[data-ocr-status]');
          const bar = section.querySelector('[data-ocr-progress]');
          if (status) status.textContent = `${label}: ${pct}%`;
          if (bar) bar.style.width = `${Math.min(78, Math.round(base + (message.progress || 0) * span))}%`;
        }, 0);
      }
    },
  });
  return { text: result?.data?.text || '', confidence: Number(result?.data?.confidence || 0) };
}

function rowTemplate(row = {}) {
  const boss = row.boss || EPIC_BOSSES[0].name;
  const date = row.date || warsawToday();
  return `<div class="epic-ocr-row" data-ocr-row>
    <label class="epic-ocr-check"><input type="checkbox" data-ocr-enabled ${row.selected === false ? '' : 'checked'}><span>Zapisz</span></label>
    <select data-ocr-boss>${EPIC_BOSSES.map((item) => `<option value="${esc(item.name)}" ${item.name === boss ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select>
    <input type="date" data-ocr-date value="${esc(date)}">
    <input type="time" data-ocr-start value="${esc(row.start || '')}">
    <span class="epic-ocr-dash">–</span>
    <input type="time" data-ocr-end value="${esc(row.end || '')}">
    <button type="button" class="epic-ocr-remove" data-ocr-remove aria-label="Usuń wiersz">×</button>
  </div>`;
}

function endDateFor(row) {
  return row.end <= row.start ? addDays(row.date, 1) : row.date;
}

export function installEpicRespawnScreenshotImport(supabase) {
  if (!supabase || window.__obEpicRespawnScreenshotImportInstalled) return;
  window.__obEpicRespawnScreenshotImportInstalled = true;

  const style = document.createElement('style');
  style.textContent = `
    .epic-ocr-import{margin:0 0 18px;padding:16px;border:1px solid #5b482b;background:linear-gradient(145deg,#121511,#090c0c);box-shadow:inset 0 0 35px #b27a1f0b}.epic-ocr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.epic-ocr-head h3{margin:3px 0 4px;color:#e6c779;font-size:17px}.epic-ocr-head p{margin:0;color:#888176;font-size:11px;line-height:1.5}.epic-ocr-badge{padding:6px 8px;border:1px solid #67522d;color:#cba85d;font-size:9px;font-weight:900;white-space:nowrap}.epic-ocr-drop{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center;margin-top:14px;padding:12px;border:1px dashed #6b532e;background:#0b0e0e}.epic-ocr-preview{height:104px;border:1px solid #342d22;background:#060808;display:grid;place-items:center;overflow:hidden;color:#655f54;font-size:10px}.epic-ocr-preview img{width:100%;height:100%;object-fit:cover}.epic-ocr-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.epic-ocr-file{position:absolute;inline-size:1px;block-size:1px;opacity:0;pointer-events:none}.epic-ocr-button{padding:10px 12px;border:1px solid #74592e;background:#17140e;color:#d9b35f;font-size:10px;font-weight:900;cursor:pointer}.epic-ocr-button.primary{background:linear-gradient(#3a2811,#21160b);border-color:#a27631;color:#efc56a}.epic-ocr-button:disabled{opacity:.45;cursor:not-allowed}.epic-ocr-status{margin-top:10px;color:#9a8e79;font-size:10px;min-height:16px}.epic-ocr-progress{height:5px;margin-top:6px;background:#18150f;overflow:hidden}.epic-ocr-progress i{display:block;height:100%;width:0;background:#b98636;transition:width .2s}.epic-ocr-results{display:grid;gap:7px;margin-top:12px}.epic-ocr-row{display:grid;grid-template-columns:70px minmax(130px,1.4fr) 140px 104px 14px 104px 32px;gap:7px;align-items:center}.epic-ocr-row select,.epic-ocr-row input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #413723;background:#080b0b;color:#d8d2c8;color-scheme:dark;font-size:10px}.epic-ocr-check{display:flex;gap:5px;align-items:center;color:#9f927c;font-size:9px;font-weight:900}.epic-ocr-check input{width:auto}.epic-ocr-dash{text-align:center;color:#725e38}.epic-ocr-remove{width:32px;height:32px;border:1px solid #5b342d;background:#170e0d;color:#d47c6c;cursor:pointer}.epic-ocr-result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.epic-ocr-raw{margin-top:10px;border-top:1px solid #29241c;padding-top:8px}.epic-ocr-raw summary{cursor:pointer;color:#756d61;font-size:9px}.epic-ocr-raw pre{max-height:220px;overflow:auto;white-space:pre-wrap;color:#938a7c;font-size:9px}.epic-ocr-note{margin-top:8px;color:#776f62;font-size:9px}.epic-ocr-success{color:#8fb86f!important}.epic-ocr-error{color:#d98275!important}@media(max-width:800px){.epic-ocr-drop{grid-template-columns:1fr}.epic-ocr-preview{height:160px}.epic-ocr-row{grid-template-columns:64px 1fr 1fr}.epic-ocr-row [data-ocr-date]{grid-column:1/-1}.epic-ocr-row .epic-ocr-dash{display:none}.epic-ocr-row [data-ocr-start],.epic-ocr-row [data-ocr-end]{grid-column:span 1}.epic-ocr-remove{justify-self:end}.epic-ocr-result-actions .epic-ocr-button{flex:1 1 150px}}
  `;
  document.head.appendChild(style);

  let file = null;
  let rawText = '';

  function setProgress(section, text, percent = 0, cls = '') {
    const status = section.querySelector('[data-ocr-status]');
    const bar = section.querySelector('[data-ocr-progress]');
    status.textContent = text;
    status.className = `epic-ocr-status ${cls}`;
    bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  async function canManage() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', user.id).maybeSingle();
    return profile?.status === 'approved' && ['owner', 'admin'].includes(String(profile.role || '').toLowerCase());
  }

  function renderRows(section, rows) {
    const box = section.querySelector('[data-ocr-results]');
    box.innerHTML = rows.length ? rows.map(rowTemplate).join('') : '';
    section.querySelector('[data-ocr-save]').disabled = !rows.length;
  }

  function collectRows(section) {
    return [...section.querySelectorAll('[data-ocr-row]')].map((row) => ({
      selected: row.querySelector('[data-ocr-enabled]').checked,
      boss: row.querySelector('[data-ocr-boss]').value,
      date: row.querySelector('[data-ocr-date]').value,
      start: row.querySelector('[data-ocr-start]').value,
      end: row.querySelector('[data-ocr-end]').value,
    })).filter((row) => row.selected);
  }

  async function saveRows(section) {
    if (!await canManage()) {
      setProgress(section, 'Brak uprawnień do aktualizacji Epic Bossów.', 0, 'epic-ocr-error');
      return;
    }
    const rows = collectRows(section);
    if (!rows.length) {
      setProgress(section, 'Zaznacz przynajmniej jeden wiersz.', 0, 'epic-ocr-error');
      return;
    }
    const invalid = rows.find((row) => !row.boss || !row.date || !row.start || !row.end);
    if (invalid) {
      setProgress(section, 'Uzupełnij bossa, datę, początek i koniec każdego zaznaczonego okna.', 0, 'epic-ocr-error');
      return;
    }
    const duplicate = rows.find((row, index) => rows.findIndex((other) => other.boss === row.boss) !== index);
    if (duplicate) {
      setProgress(section, `Boss ${duplicate.boss} występuje więcej niż raz. Usuń duplikat.`, 0, 'epic-ocr-error');
      return;
    }
    setProgress(section, 'Zapisywanie okien respawnu…', 82);
    const names = rows.map((row) => row.boss);
    const { data: existingRows, error: readError } = await supabase.from('boss_respawns').select('*').in('boss', names);
    if (readError) {
      setProgress(section, `Nie udało się odczytać obecnych respawnów: ${readError.message}`, 0, 'epic-ocr-error');
      return;
    }
    const existing = new Map((existingRows || []).map((row) => [row.boss, row]));
    const nowIso = new Date().toISOString();
    const payload = rows.map((row) => {
      const current = existing.get(row.boss);
      const startIso = localDateTimeToIso(row.date, row.start);
      const endIso = localDateTimeToIso(endDateFor(row), row.end);
      return {
        ...(current?.id ? { id: current.id } : {}),
        boss: row.boss,
        last_kill_at: current?.last_kill_at || null,
        base_respawn_at: current?.base_respawn_at || null,
        window_start: startIso,
        window_end: endIso,
        status: new Date(endIso) > new Date() ? 'NADCHODZI' : 'OKNO ZAKOŃCZONE',
        updated_at: nowIso,
      };
    });
    if (payload.some((row) => !row.window_start || !row.window_end)) {
      setProgress(section, 'Jedna z dat lub godzin jest nieprawidłowa.', 0, 'epic-ocr-error');
      return;
    }
    const { error } = await supabase.from('boss_respawns').upsert(payload, { onConflict: 'boss' });
    if (error) {
      setProgress(section, `Błąd zapisu: ${error.message}`, 0, 'epic-ocr-error');
      return;
    }
    setProgress(section, `Zapisano ${payload.length} ${payload.length === 1 ? 'okno' : 'okien'}. Odświeżam kalendarz…`, 100, 'epic-ocr-success');
    setTimeout(() => window.location.reload(), 900);
  }

  async function recognize(section) {
    if (!file) {
      setProgress(section, 'Najpierw wybierz screen.', 0, 'epic-ocr-error');
      return;
    }
    if (!await canManage()) {
      setProgress(section, 'Ta funkcja jest dostępna dla Ownera i Admina.', 0, 'epic-ocr-error');
      return;
    }
    const runButton = section.querySelector('[data-ocr-run]');
    runButton.disabled = true;
    section.querySelector('[data-ocr-save]').disabled = true;
    setProgress(section, 'Przygotowuję obraz do dokładniejszego OCR…', 2);

    try {
      const [Tesseract, image] = await Promise.all([
        loadTesseract((text, percent) => setProgress(section, text, percent)),
        loadImage(file),
      ]);
      const variants = [
        { label: 'Oryginał', image: file, psm: '6', bonus: 1 },
        { label: 'Wysoki kontrast', image: preprocessCanvas(image, 'contrast'), psm: '6', bonus: 4 },
        { label: 'Czarno-biały', image: preprocessCanvas(image, 'threshold'), psm: '11', bonus: 5 },
      ];
      const passes = [];
      const parsed = [];
      for (let i = 0; i < variants.length; i += 1) {
        const variant = variants[i];
        setProgress(section, `${variant.label}: przygotowanie…`, 8 + Math.round(i * 22));
        const result = await runPass(Tesseract, variant.image, variant.label, section, i, variants.length, variant.psm);
        passes.push(`${variant.label} (${Math.round(result.confidence)}%):\n${result.text}`);
        parsed.push(parseOcrText(result.text, variant.bonus + Math.max(0, result.confidence / 20)));
      }
      let rows = mergeCandidates(parsed);
      if (rows.length < 3) {
        setProgress(section, 'Dodatkowy przebieg OCR dla trudnego screena…', 76);
        const inverted = await runPass(Tesseract, preprocessCanvas(image, 'invert'), 'Odwrócony kontrast', section, 2, 3, '11');
        passes.push(`Odwrócony kontrast (${Math.round(inverted.confidence)}%):\n${inverted.text}`);
        rows = mergeCandidates([...parsed, parseOcrText(inverted.text, 6 + Math.max(0, inverted.confidence / 20))]);
      }
      rawText = passes.join('\n\n====================\n\n');
      section.querySelector('[data-ocr-raw]').textContent = rawText || '(brak tekstu)';
      renderRows(section, rows);
      if (rows.length) {
        setProgress(section, `Rozpoznano ${rows.length} ${rows.length === 1 ? 'okno' : 'okien'} po kilku przebiegach OCR. Sprawdź godziny przed zatwierdzeniem.`, 88, 'epic-ocr-success');
      } else {
        setProgress(section, 'Nie udało się pewnie dopasować nazw i godzin. Dodaj wiersz ręcznie albo użyj ciaśniejszego screena z tabelą respawnów.', 88, 'epic-ocr-error');
      }
    } catch (error) {
      setProgress(section, error?.message || 'Nie udało się odczytać screena.', 0, 'epic-ocr-error');
    } finally {
      runButton.disabled = false;
    }
  }

  function mount(manager) {
    if (!manager || manager.querySelector('[data-epic-ocr-import]')) return;
    const section = document.createElement('section');
    section.className = 'epic-ocr-import';
    section.dataset.epicOcrImport = '1';
    section.innerHTML = `
      <div class="epic-ocr-head"><div><span class="eyebrow">SZYBKA AKTUALIZACJA</span><h3>SCREEN → OKNA EPIC RB</h3><p>Wrzuć screen z oknami respawnu. Obraz jest powiększany i analizowany kilkoma metodami OCR, a dane zapisują się dopiero po Twoim zatwierdzeniu.</p></div><span class="epic-ocr-badge">OWNER / ADMIN</span></div>
      <div class="epic-ocr-drop">
        <div class="epic-ocr-preview" data-ocr-preview>Podgląd screena</div>
        <div><div class="epic-ocr-controls"><label class="epic-ocr-button">WYBIERZ SCREEN<input class="epic-ocr-file" data-ocr-file type="file" accept="image/png,image/jpeg,image/webp,image/*"></label><button class="epic-ocr-button primary" type="button" data-ocr-run disabled>DOKŁADNIE ROZPOZNAJ SCREEN</button></div><div class="epic-ocr-status" data-ocr-status>Obsługiwane: Queen Ant, Core, Orfen, Zaken, Frintezza.</div><div class="epic-ocr-progress"><i data-ocr-progress></i></div><div class="epic-ocr-note">Nowy tryb robi kilka przebiegów OCR: oryginał, wysoki kontrast, czarno-biały i awaryjnie odwrócony kontrast. Nazwy bossów są dopasowywane również przy literówkach OCR.</div></div>
      </div>
      <div class="epic-ocr-results" data-ocr-results></div>
      <div class="epic-ocr-result-actions"><button class="epic-ocr-button" type="button" data-ocr-add>+ DODAJ WIERSZ</button><button class="epic-ocr-button primary" type="button" data-ocr-save disabled>✓ ZATWIERDŹ I AKTUALIZUJ</button></div>
      <details class="epic-ocr-raw"><summary>Pokaż wszystkie przebiegi OCR</summary><pre data-ocr-raw>(jeszcze nie odczytano)</pre></details>`;
    manager.prepend(section);

    const input = section.querySelector('[data-ocr-file]');
    input.addEventListener('change', () => {
      file = input.files?.[0] || null;
      const preview = section.querySelector('[data-ocr-preview]');
      if (!file) {
        preview.textContent = 'Podgląd screena';
        section.querySelector('[data-ocr-run]').disabled = true;
        return;
      }
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" alt="Screen okien respawnu">`;
      section.querySelector('[data-ocr-run]').disabled = false;
      setProgress(section, `Wybrano: ${file.name}`, 0);
    });
    section.querySelector('[data-ocr-run]').addEventListener('click', () => recognize(section));
    section.querySelector('[data-ocr-add]').addEventListener('click', () => {
      section.querySelector('[data-ocr-results]').insertAdjacentHTML('beforeend', rowTemplate({ date: warsawToday(), selected: true }));
      section.querySelector('[data-ocr-save]').disabled = false;
    });
    section.querySelector('[data-ocr-save]').addEventListener('click', () => saveRows(section));
    section.querySelector('[data-ocr-results]').addEventListener('click', (event) => {
      const remove = event.target.closest('[data-ocr-remove]');
      if (!remove) return;
      remove.closest('[data-ocr-row]')?.remove();
      section.querySelector('[data-ocr-save]').disabled = !section.querySelector('[data-ocr-row]');
    });
  }

  const waitForManager = async () => {
    const manager = document.querySelector('#bossRespawnManager');
    if (!manager) { setTimeout(waitForManager, 180); return; }
    if (await canManage()) mount(manager);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForManager, { once: true });
  else waitForManager();
}

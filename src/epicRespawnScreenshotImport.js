import { addDays, localDateTimeToIso } from './bossRespawns.js';

const EPIC_BOSSES = Object.freeze([
  { name: 'Queen Ant', aliases: ['queen ant', 'queenant', 'queen  ant', 'qa'] },
  { name: 'Core', aliases: ['core'] },
  { name: 'Orfen', aliases: ['orfen'] },
  { name: 'Zaken', aliases: ['zaken'] },
  { name: 'Frintezza', aliases: ['frintezza', 'frinteza', 'frintezzaa'] },
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
    .replace(/[|]/g, 'l')
    .replace(/[^a-z0-9ąćęłńóśźż:./\-–—\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForTimes(value = '') {
  return String(value)
    .replace(/[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Oo]/g, '0')
    .replace(/[lI](?=\d:\d{2})/g, '1');
}

function extractDate(text, fallback = warsawToday()) {
  const iso = String(text).match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;

  const local = String(text).match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](20\d{2}))?\b/);
  if (!local) return fallback;
  const fallbackYear = fallback.slice(0, 4);
  return `${local[3] || fallbackYear}-${pad(local[2])}-${pad(local[1])}`;
}

function extractTimes(text) {
  const cleaned = normalizeForTimes(text);
  const explicit = cleaned.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:-|–|—|do|to)\s*([01]?\d|2[0-3])[:.]([0-5]\d)\b/i);
  if (explicit) return [`${pad(explicit[1])}:${explicit[2]}`, `${pad(explicit[3])}:${explicit[4]}`];

  const matches = [...cleaned.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)]
    .map((match) => `${pad(match[1])}:${match[2]}`);
  return matches.length >= 2 ? matches.slice(0, 2) : [];
}

function bossFromText(value = '') {
  const line = normalize(value);
  for (const boss of EPIC_BOSSES) {
    if (boss.aliases.some((alias) => line.includes(alias))) return boss.name;
  }
  return '';
}

function parseOcrText(rawText = '') {
  const rawLines = String(rawText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const detected = [];
  const seen = new Set();
  const defaultDate = extractDate(rawText, warsawToday());

  rawLines.forEach((line, index) => {
    const boss = bossFromText(line);
    if (!boss || seen.has(boss)) return;
    const neighborhood = [rawLines[index - 1], line, rawLines[index + 1], rawLines[index + 2]]
      .filter(Boolean)
      .join(' ');
    const times = extractTimes(neighborhood);
    if (times.length < 2) return;
    detected.push({ boss, date: extractDate(neighborhood, defaultDate), start: times[0], end: times[1], selected: true });
    seen.add(boss);
  });

  if (!detected.length) {
    for (const boss of EPIC_BOSSES) {
      const aliases = boss.aliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const match = normalize(rawText).match(new RegExp(`(?:${aliases})[^\\n]{0,100}`, 'i'));
      if (!match) continue;
      const times = extractTimes(match[0]);
      if (times.length >= 2) detected.push({ boss: boss.name, date: defaultDate, start: times[0], end: times[1], selected: true });
    }
  }

  return detected;
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
    .epic-ocr-import{margin:0 0 18px;padding:16px;border:1px solid #5b482b;background:linear-gradient(145deg,#121511,#090c0c);box-shadow:inset 0 0 35px #b27a1f0b}.epic-ocr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.epic-ocr-head h3{margin:3px 0 4px;color:#e6c779;font-size:17px}.epic-ocr-head p{margin:0;color:#888176;font-size:11px;line-height:1.5}.epic-ocr-badge{padding:6px 8px;border:1px solid #67522d;color:#cba85d;font-size:9px;font-weight:900;white-space:nowrap}.epic-ocr-drop{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center;margin-top:14px;padding:12px;border:1px dashed #6b532e;background:#0b0e0e}.epic-ocr-preview{height:104px;border:1px solid #342d22;background:#060808;display:grid;place-items:center;overflow:hidden;color:#655f54;font-size:10px}.epic-ocr-preview img{width:100%;height:100%;object-fit:cover}.epic-ocr-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.epic-ocr-file{position:absolute;inline-size:1px;block-size:1px;opacity:0;pointer-events:none}.epic-ocr-button{padding:10px 12px;border:1px solid #74592e;background:#17140e;color:#d9b35f;font-size:10px;font-weight:900;cursor:pointer}.epic-ocr-button.primary{background:linear-gradient(#3a2811,#21160b);border-color:#a27631;color:#efc56a}.epic-ocr-button:disabled{opacity:.45;cursor:not-allowed}.epic-ocr-status{margin-top:10px;color:#9a8e79;font-size:10px;min-height:16px}.epic-ocr-progress{height:5px;margin-top:6px;background:#18150f;overflow:hidden}.epic-ocr-progress i{display:block;height:100%;width:0;background:#b98636;transition:width .2s}.epic-ocr-results{display:grid;gap:7px;margin-top:12px}.epic-ocr-row{display:grid;grid-template-columns:70px minmax(130px,1.4fr) 140px 104px 14px 104px 32px;gap:7px;align-items:center}.epic-ocr-row select,.epic-ocr-row input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #413723;background:#080b0b;color:#d8d2c8;color-scheme:dark;font-size:10px}.epic-ocr-check{display:flex;gap:5px;align-items:center;color:#9f927c;font-size:9px;font-weight:900}.epic-ocr-check input{width:auto}.epic-ocr-dash{text-align:center;color:#725e38}.epic-ocr-remove{width:32px;height:32px;border:1px solid #5b342d;background:#170e0d;color:#d47c6c;cursor:pointer}.epic-ocr-result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.epic-ocr-raw{margin-top:10px;border-top:1px solid #29241c;padding-top:8px}.epic-ocr-raw summary{cursor:pointer;color:#756d61;font-size:9px}.epic-ocr-raw pre{max-height:160px;overflow:auto;white-space:pre-wrap;color:#938a7c;font-size:9px}.epic-ocr-note{margin-top:8px;color:#776f62;font-size:9px}.epic-ocr-success{color:#8fb86f!important}.epic-ocr-error{color:#d98275!important}@media(max-width:800px){.epic-ocr-drop{grid-template-columns:1fr}.epic-ocr-preview{height:160px}.epic-ocr-row{grid-template-columns:64px 1fr 1fr}.epic-ocr-row [data-ocr-date]{grid-column:1/-1}.epic-ocr-row .epic-ocr-dash{display:none}.epic-ocr-row [data-ocr-start],.epic-ocr-row [data-ocr-end]{grid-column:span 1}.epic-ocr-remove{justify-self:end}.epic-ocr-result-actions .epic-ocr-button{flex:1 1 150px}}
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
    setProgress(section, 'Przygotowuję OCR…', 2);

    try {
      const Tesseract = await loadTesseract((text, percent) => setProgress(section, text, percent));
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') setProgress(section, `Odczytywanie screena… ${Math.round((message.progress || 0) * 100)}%`, Math.max(8, Math.round((message.progress || 0) * 72)));
          else if (message.status) setProgress(section, 'OCR: ' + message.status, 7);
        },
      });
      rawText = result?.data?.text || '';
      section.querySelector('[data-ocr-raw]').textContent = rawText || '(brak tekstu)';
      const rows = parseOcrText(rawText);
      renderRows(section, rows);
      if (rows.length) setProgress(section, `Rozpoznano ${rows.length} okien. Sprawdź godziny i kliknij „Zatwierdź”.`, 78, 'epic-ocr-success');
      else setProgress(section, 'Nie znalazłem pewnego okna. Możesz dodać wiersz ręcznie i poprawić dane przed zapisem.', 78, 'epic-ocr-error');
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
      <div class="epic-ocr-head"><div><span class="eyebrow">SZYBKA AKTUALIZACJA</span><h3>SCREEN → OKNA EPIC RB</h3><p>Wrzuć codzienny screen z oknami respawnu. OCR działa w przeglądarce, a dane zapisują się dopiero po Twoim zatwierdzeniu.</p></div><span class="epic-ocr-badge">OWNER / ADMIN</span></div>
      <div class="epic-ocr-drop">
        <div class="epic-ocr-preview" data-ocr-preview>Podgląd screena</div>
        <div><div class="epic-ocr-controls"><label class="epic-ocr-button">WYBIERZ SCREEN<input class="epic-ocr-file" data-ocr-file type="file" accept="image/png,image/jpeg,image/webp,image/*"></label><button class="epic-ocr-button primary" type="button" data-ocr-run disabled>ROZPOZNAJ SCREEN</button></div><div class="epic-ocr-status" data-ocr-status>Obsługiwane: Queen Ant, Core, Orfen, Zaken, Frintezza.</div><div class="epic-ocr-progress"><i data-ocr-progress></i></div><div class="epic-ocr-note">System nie zapisuje wyniku OCR automatycznie. Najpierw możesz poprawić każdą datę i godzinę.</div></div>
      </div>
      <div class="epic-ocr-results" data-ocr-results></div>
      <div class="epic-ocr-result-actions"><button class="epic-ocr-button" type="button" data-ocr-add>+ DODAJ WIERSZ</button><button class="epic-ocr-button primary" type="button" data-ocr-save disabled>✓ ZATWIERDŹ I AKTUALIZUJ</button></div>
      <details class="epic-ocr-raw"><summary>Pokaż tekst odczytany ze screena</summary><pre data-ocr-raw>(jeszcze nie odczytano)</pre></details>`;
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

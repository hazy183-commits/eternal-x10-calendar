const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');

function warsawLocalToIso(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const wallUtc = Date.UTC(y, mo - 1, d, h, mi, 0);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(wallUtc));
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const shownAsUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  const offset = shownAsUtc - wallUtc;
  return new Date(wallUtc - offset).toISOString();
}

function warsawParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

function windowLabel(startIso) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 30 * 60000);
  const fmt = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
  return `${fmt.format(start)}–${fmt.format(end)}`;
}

function parseSelectedDate() {
  const text = document.querySelector('#selectedDate')?.textContent?.toLowerCase() || '';
  const months = { stycznia: 0, lutego: 1, marca: 2, kwietnia: 3, maja: 4, czerwca: 5, lipca: 6, sierpnia: 7, września: 8, pazdziernika: 9, października: 9, listopada: 10, grudnia: 11 };
  const m = text.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)/i);
  if (!m || months[m[2]] == null) return warsawParts(new Date()).date;
  const now = new Date();
  let year = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric' }).format(now));
  let candidate = new Date(year, months[m[2]], Number(m[1]));
  const diff = candidate - now;
  if (diff > 183 * 86400000) year -= 1;
  else if (diff < -183 * 86400000) year += 1;
  return `${year}-${pad(months[m[2]] + 1)}-${pad(Number(m[1]))}`;
}

function statusForWindow(startIso) {
  const start = new Date(startIso).getTime();
  const end = start + 30 * 60000;
  const now = Date.now();
  if (now < start) return 'NADCHODZI';
  if (now < end) return 'OKNO AKTYWNE';
  return 'OKNO ZAKOŃCZONE';
}

export function installNeededRaidBossWindow(supabase) {
  if (!supabase || window.__obNeededRbWindowInstalled) return;
  window.__obNeededRbWindowInstalled = true;

  const style = document.createElement('style');
  style.textContent = `
    .needed-rb-window-field input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #4a3b26;background:#080c0c;color:#ddd;color-scheme:dark}
    .needed-rb-window{margin:10px 0;padding:9px 10px;border:1px solid #5c4727;background:#171108;color:#d9b45f;font-size:11px;font-weight:800}
    .needed-rb-window small{display:block;margin-top:3px;color:#8e8677;font-weight:500}
    .needed-rb-calendar-row{box-shadow:inset 3px 0 #a8782d}
    .needed-rb-calendar-row .needed-rb-thumb{display:grid;place-items:center;border-color:#8d672e;background:linear-gradient(145deg,#33230f,#11100c);color:#e4b75c;font-weight:900;font-size:11px}
    .needed-rb-calendar-row .needed-rb-meta{display:block;margin-top:4px;color:#a68f66;font-size:10px}
  `;
  document.head.appendChild(style);

  let requests = [];
  let requestMap = new Map();
  let calendarBusy = false;

  async function fetchRequests() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('raid_boss_requests')
      .select('id,user_id,nickname,boss_name,boss_level,note,status,expires_at,window_start')
      .eq('status', 'open')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      requests = data;
      requestMap = new Map(data.map(r => [String(r.id), r]));
    }
    return requests;
  }

  function enhanceCards() {
    const list = document.querySelector('#neededRbList');
    if (!list) return;
    list.querySelectorAll('[data-rb-request]').forEach(card => {
      const r = requestMap.get(String(card.dataset.rbRequest));
      const existing = card.querySelector('.needed-rb-window');
      if (!r?.window_start) { existing?.remove(); return; }
      const html = `<b>⏱ Okno RB: ${windowLabel(r.window_start)}</b><small>Okno trwa 30 minut · czas Europe/Warsaw</small>`;
      if (existing) existing.innerHTML = html;
      else {
        const div = document.createElement('div');
        div.className = 'needed-rb-window';
        div.innerHTML = html;
        const note = card.querySelector('.needed-rb-note');
        (note || card.querySelector('.needed-rb-head'))?.insertAdjacentElement('afterend', div);
      }
    });
  }

  async function refreshCards() {
    await fetchRequests();
    enhanceCards();
    patchCalendar();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.currentTarget;
    const zone = document.querySelector('#memberZoneLayer');
    const message = form.querySelector('#neededRbMessage');
    const select = form.querySelector('#neededRbBoss');
    const option = select?.selectedOptions?.[0];
    const input = form.querySelector('#neededRbWindowStart');
    if (!select?.value || !option?.dataset.level) { if (message) message.textContent = 'Wybierz Raid Bossa.'; return; }
    if (!input?.value) { if (message) message.textContent = 'Ustaw rozpoczęcie 30-minutowego okna RB.'; return; }
    const windowStart = warsawLocalToIso(input.value);
    if (!windowStart || new Date(windowStart).getTime() < Date.now() - 30 * 60000) { if (message) message.textContent = 'Wybierz aktualne lub przyszłe okno RB.'; return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (message) message.textContent = 'Musisz być zalogowany.'; return; }
    const { data: profile } = await supabase.from('profiles').select('nickname,status').eq('id', user.id).maybeSingle();
    if (profile?.status !== 'approved') { if (message) message.textContent = 'Konto nie ma jeszcze dostępu członka klanu.'; return; }

    if (message) message.textContent = 'Dodawanie…';
    const { error } = await supabase.from('raid_boss_requests').insert({
      user_id: user.id,
      nickname: profile.nickname || 'Gracz',
      boss_name: select.value,
      boss_level: Number(option.dataset.level),
      note: form.querySelector('#neededRbNote')?.value.trim() || null,
      window_start: windowStart,
    });
    if (error) { if (message) message.textContent = `Błąd: ${error.message}`; return; }
    form.reset();
    setDefaultWindow(input);
    if (message) message.textContent = `RB dodany. Okno ${windowLabel(windowStart)} zostanie pokazane w kalendarzu pod filtrem RB.`;
    await refreshCards();
    setTimeout(() => zone?.querySelector('[data-zone-view="needed-rb"]')?.click(), 30);
  }

  function setDefaultWindow(input) {
    if (!input || input.value) return;
    const now = new Date(Date.now() + 60 * 60000);
    const p = warsawParts(now);
    input.value = `${p.date}T${p.time}`;
  }

  function enhanceForm() {
    const form = document.querySelector('#neededRbForm');
    if (!form || form.dataset.windowEnhanced === '1') return false;
    form.dataset.windowEnhanced = '1';
    const bossLabel = form.querySelector('label');
    const label = document.createElement('label');
    label.className = 'needed-rb-window-field';
    label.innerHTML = 'Rozpoczęcie okna RB <input id="neededRbWindowStart" type="datetime-local" required><small style="color:#81796c;font-weight:500">Koniec okna zostanie wyliczony automatycznie: +30 minut.</small>';
    bossLabel?.insertAdjacentElement('afterend', label);
    setDefaultWindow(label.querySelector('input'));
    form.addEventListener('submit', handleSubmit, true);
    return true;
  }

  function removeEventFilter() {
    document.querySelector('#filters [data-filter="Event"]')?.remove();
  }

  function requestCalendarRow(r) {
    const state = statusForWindow(r.window_start);
    const p = warsawParts(new Date(r.window_start));
    const note = r.note ? ` · ${esc(r.note)}` : '';
    const stateClass = state.toLowerCase().replaceAll(' ', '-').replaceAll('ó', 'o').replaceAll('ę', 'e');
    return `<article class="event-row needed-rb-calendar-row" data-needed-rb-row="${r.id}">
      <time class="event-time">${p.time}</time>
      <div class="event-thumb needed-rb-thumb"><span>RB</span></div>
      <div class="event-info"><h3>${esc(r.boss_name)}</h3><span class="needed-rb-meta">Lv. ${r.boss_level} · okno ${windowLabel(r.window_start)} · zgłosił: ${esc(r.nickname)}${note}</span></div>
      <span class="type-chip rb">RB</span>
      <p class="event-location">⏱ Okno 30 min</p>
      <div class="row-status"><b class="status-dot ${stateClass}">${state}</b><span>${windowLabel(r.window_start)}</span></div>
    </article>`;
  }

  function patchCalendar() {
    if (calendarBusy) return;
    removeEventFilter();
    const list = document.querySelector('#dailyEvents');
    const active = document.querySelector('#filters .filter-btn.active')?.dataset.filter;
    if (!list) return;
    if (active !== 'RB') {
      list.querySelectorAll('[data-needed-rb-row]').forEach(el => el.remove());
      return;
    }
    const selected = parseSelectedDate();
    const matching = requests.filter(r => r.window_start && warsawParts(new Date(r.window_start)).date === selected);
    const wanted = matching.map(r => String(r.id)).sort().join(',');
    const current = [...list.querySelectorAll('[data-needed-rb-row]')].map(el => el.dataset.neededRbRow).sort().join(',');
    if (wanted === current) return;
    calendarBusy = true;
    list.querySelectorAll('[data-needed-rb-row]').forEach(el => el.remove());
    if (matching.length) list.querySelector('.empty-state')?.remove();
    list.insertAdjacentHTML('beforeend', matching.map(requestCalendarRow).join(''));
    const rows = [...list.querySelectorAll('.event-row')];
    rows.sort((a, b) => String(a.querySelector('.event-time')?.textContent || '').localeCompare(String(b.querySelector('.event-time')?.textContent || '')));
    rows.forEach(row => list.appendChild(row));
    calendarBusy = false;
  }

  function waitForUi() {
    const form = document.querySelector('#neededRbForm');
    const list = document.querySelector('#neededRbList');
    const calendar = document.querySelector('#dailyEvents');
    const filters = document.querySelector('#filters');
    if (!form || !list || !calendar || !filters) { setTimeout(waitForUi, 150); return; }
    enhanceForm();
    removeEventFilter();

    let listTimer;
    new MutationObserver(() => {
      clearTimeout(listTimer);
      listTimer = setTimeout(async () => { await fetchRequests(); enhanceCards(); }, 50);
    }).observe(list, { childList: true, subtree: false });

    let calTimer;
    new MutationObserver(() => {
      clearTimeout(calTimer);
      calTimer = setTimeout(patchCalendar, 40);
    }).observe(calendar, { childList: true, subtree: false });
    new MutationObserver(() => { removeEventFilter(); }).observe(filters, { childList: true, subtree: false });

    document.addEventListener('click', event => {
      if (event.target.closest('#filters [data-filter="RB"],#previousDay,#nextDay,#todayButton')) setTimeout(patchCalendar, 80);
    });
    window.addEventListener('focus', refreshCards);
    refreshCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForUi, { once: true });
  else waitForUi();
}

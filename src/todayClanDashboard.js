import { getClanUpcomingEvents, subscribeClanEvents } from './clanEventFeed.js';
import { saveCalendarSignup } from './calendarSignup.js';
import { bossArtworkUrl } from './bossArtwork.js';

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const pad = (value) => String(value).padStart(2, '0');
const keyFor = (row) => String(row?.event_id ?? row?.schedule_key ?? '');
const warsawDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const warsawDateLabel = () => new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const timeLabel = (event) => String(event?.event_time || event?.time || '').slice(0, 5) || '—';
const eventStart = (event) => new Date(event?.startAt || `${event?.event_date || event?.date}T${event?.event_time || event?.time || '00:00'}:00`);
const eventEnd = (event) => new Date(event?.endAt || eventStart(event).getTime() + Number(event?.duration || 60) * 60000);
const typeClass = (event) => {
  const t = String(event?.type || '').toLowerCase();
  if (t.includes('siege')) return 'siege';
  if (t.includes('epic')) return 'epic';
  if (t === 'rb') return 'rb';
  if (t.includes('olympiad')) return 'olympiad';
  if (t.includes('clan')) return 'clan-hall';
  return 'event';
};
const countdown = (event) => {
  const now = Date.now();
  const start = eventStart(event).getTime();
  const end = eventEnd(event).getTime();
  if (now >= start && now < end) {
    const min = Math.max(0, Math.ceil((end - now) / 60000));
    return `TRWA · ${min} min`;
  }
  if (now >= end) return 'ZAKOŃCZONE';
  let minutes = Math.max(0, Math.ceil((start - now) / 60000));
  const days = Math.floor(minutes / 1440); minutes %= 1440;
  const hours = Math.floor(minutes / 60); minutes %= 60;
  if (days) return `za ${days}d ${hours}h`;
  if (hours) return `za ${hours}h ${pad(minutes)}m`;
  return `za ${minutes}m`;
};
const artwork = (event) => bossArtworkUrl(event?.boss || event?.name || event?.location || '');

export function installTodayClanDashboard(supabase) {
  if (!supabase || window.__obTodayClanDashboardInstalled) return;
  window.__obTodayClanDashboardInstalled = true;

  const style = document.createElement('style');
  style.textContent = `
    .today-clan{margin-top:18px}.today-clan-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;padding:15px 17px;border:1px solid #4a3921;background:linear-gradient(120deg,#141812,#090d0d)}
    .today-clan-title{display:flex;align-items:center;gap:11px;flex-wrap:wrap}.today-clan-title>span{font-size:22px}.today-clan-title h3{margin:0;color:#efe5d4;font:700 21px Georgia}.today-clan-title small{color:#9d927e;font-size:10px;text-transform:capitalize}.today-clan-calendar{padding:9px 12px;border:1px solid #8b672d;background:#18130b;color:#e6bc64;font-size:9px;font-weight:900;cursor:pointer}
    .today-clan-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);gap:14px}.today-clan-main,.today-clan-rail{display:grid;gap:14px;align-content:start}
    .today-clan-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.today-event-card{position:relative;min-height:238px;overflow:hidden;border:1px solid #4f3e27;background:#0a0e0e;isolation:isolate}.today-event-card.epic{border-color:#713430}.today-event-card.rb{border-color:#245a72}.today-event-card.siege{border-color:#70531f}.today-event-art{position:absolute;inset:0;background:linear-gradient(180deg,#111,#080b0b);z-index:-2}.today-event-art img{width:100%;height:100%;object-fit:cover;opacity:.45}.today-event-card:after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,transparent 7%,#0709098f 44%,#070909 76%)}
    .today-event-inner{display:flex;flex-direction:column;min-height:214px;padding:12px}.today-event-chip{align-self:flex-start;padding:4px 7px;border:1px solid #675027;background:#15110c;color:#dcb15a;font-size:8px;font-weight:900}.today-event-card.epic .today-event-chip{border-color:#7f302d;background:#3a1514;color:#ff8278}.today-event-card.rb .today-event-chip{border-color:#22637e;background:#0b2936;color:#74cbf2}.today-event-card.siege .today-event-chip{border-color:#8b6727;background:#33270e;color:#e8c05d}
    .today-event-card h4{margin:8px 0 0;color:#fff;font:700 18px Georgia;text-shadow:0 2px 7px #000}.today-event-meta{margin-top:auto}.today-event-time{display:block;color:#fff;font-size:14px;font-weight:900}.today-event-countdown{display:inline-block;margin:7px 0;padding:5px 7px;border-radius:3px;background:#102d18;color:#74e08c;font-size:9px;font-weight:900}.today-event-card.epic .today-event-countdown{background:#351513;color:#ff8f84}.today-event-card.siege .today-event-countdown{background:#30250e;color:#e9c663}.today-event-place{display:block;min-height:28px;color:#b9b2a6;font-size:9px;line-height:1.35}
    .today-card-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:8px}.today-choice{padding:7px 3px;border:1px solid #403625;background:#0b0e0e;color:#918a7f;font-size:7px;font-weight:900;cursor:pointer}.today-choice.yes.active,.today-choice.yes:hover{border-color:#26853d;background:#0d2915;color:#75e58d}.today-choice.maybe.active,.today-choice.maybe:hover{border-color:#8e6c21;background:#2c210a;color:#e8c35e}.today-choice.no.active,.today-choice.no:hover{border-color:#84352f;background:#2c100f;color:#ec7e75}
    .today-box{padding:15px;border:1px solid #3e3323;background:linear-gradient(145deg,#0b1010,#080b0b)}.today-box-title{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:10px;border-bottom:1px solid #2a241c}.today-box-title h4{margin:0;color:#e9dfd0;font:700 15px Georgia}.today-box-title button{border:0;background:none;color:#be974e;font-size:8px;cursor:pointer}
    .today-schedule{display:grid;gap:14px;margin-top:12px}.today-schedule-group{position:relative}.today-schedule-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:3px;padding:8px 10px;border:1px solid #30291d;background:linear-gradient(90deg,#17150f,#0b0e0e)}.today-schedule-head b{color:#e7c16a;font-size:9px;letter-spacing:.12em}.today-schedule-head span{color:#766f64;font-size:8px;text-transform:capitalize}
    .today-timeline{display:grid;gap:0}.today-line{display:grid;grid-template-columns:54px 14px 44px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:66px;padding:6px 2px;border-bottom:1px solid #252019;transition:.16s ease}.today-line:last-child{border-bottom:0}.today-line:hover{background:linear-gradient(90deg,#15170f66,transparent)}.today-line time{color:#d8c6a3;font-size:11px;font-weight:900;text-align:right}.today-line-track{position:relative;align-self:stretch;display:grid;place-items:center}.today-line-track:before,.today-line-track:after{content:'';position:absolute;left:50%;width:1px;transform:translateX(-50%);background:#3f3524}.today-line-track:before{top:-7px;height:calc(50% + 7px)}.today-line-track:after{top:50%;bottom:-7px}.today-line:first-child .today-line-track:before{display:none}.today-line:last-child .today-line-track:after{display:none}.today-dot{position:relative;z-index:2;width:9px;height:9px;border-radius:50%;background:#b88636;box-shadow:0 0 0 3px #241b0c,0 0 12px #b8863633}.today-line.epic .today-dot{background:#d9594f;box-shadow:0 0 0 3px #2d1211,0 0 12px #d9594f44}.today-line.rb .today-dot{background:#4db7e0;box-shadow:0 0 0 3px #0d2731,0 0 12px #4db7e044}.today-line.siege .today-dot{background:#d7a238}.today-line.olympiad .today-dot{background:#bca24c}.today-line.clan-hall .today-dot{background:#ca8d2c}
    .today-line-thumb{width:42px;height:42px;object-fit:cover;border:1px solid #4d402a;background:linear-gradient(135deg,#171811,#090b0b);box-shadow:0 4px 14px #0008}.today-line-thumb.placeholder{display:grid;place-items:center;color:#836c40;font-size:14px}
    .today-line-copy{min-width:0}.today-line-title{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.today-line-copy b{display:block;color:#e5dfd4;font-size:11px;line-height:1.25}.today-line-copy small{display:block;margin-top:3px;color:#7f7a71;font-size:8px}.today-line-kind{padding:2px 5px;border:1px solid #4d3f27;color:#a98a4e;font-size:6px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.today-line.epic .today-line-kind{border-color:#69302c;color:#df746b}.today-line.rb .today-line-kind{border-color:#275d72;color:#66b8dc}.today-line.siege .today-line-kind{border-color:#66501f;color:#d6ae4c}
    .today-line-side{text-align:right;min-width:105px}.today-line-side>span{display:block;color:#7bd890;font-size:9px;font-weight:900}.today-line-side em{display:inline-block;margin-top:5px;padding:3px 6px;border:1px solid #39332a;color:#8a8378;background:#0a0d0d;font-size:7px;font-style:normal;font-weight:900}.today-line-side em.yes{border-color:#285f38;color:#72d388;background:#0b1c10}.today-line-side em.maybe{border-color:#6d5520;color:#d9b551;background:#211908}.today-line-side em.no{border-color:#6b302c;color:#dc756d;background:#21100e}
    .today-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.today-stat{padding:12px;border:1px solid #373023;background:#090d0d;text-align:center}.today-stat b{display:block;color:#ebc56f;font-size:20px}.today-stat span{color:#827c72;font-size:8px}
    @media(max-width:1100px){.today-clan-cards{grid-template-columns:1fr 1fr}.today-clan-layout{grid-template-columns:1fr}.today-clan-rail{grid-template-columns:1fr 1fr}.today-stats{grid-template-columns:repeat(4,1fr)}}
    @media(max-width:700px){.today-clan{margin-top:10px}.today-clan-head{align-items:flex-start;flex-direction:column}.today-clan-title h3{font-size:18px}.today-clan-calendar{width:100%}.today-clan-cards{grid-template-columns:1fr 1fr;gap:7px}.today-event-card{min-height:215px}.today-event-inner{min-height:191px;padding:10px}.today-event-card h4{font-size:15px}.today-card-actions{grid-template-columns:1fr;gap:3px}.today-choice{padding:6px}.today-clan-rail{grid-template-columns:1fr}.today-line{grid-template-columns:40px 12px 38px minmax(0,1fr);gap:7px;padding:7px 0}.today-line time{font-size:9px}.today-line-thumb{width:36px;height:36px}.today-line-side{grid-column:4;text-align:left;display:flex;align-items:center;gap:7px;min-width:0;margin-top:-3px}.today-line-side em{margin-top:0}.today-stats{grid-template-columns:1fr 1fr}.today-box{padding:12px}}
    @media(max-width:430px){.today-clan-cards{grid-template-columns:1fr}.today-event-card{min-height:205px}.today-event-inner{min-height:181px}.today-card-actions{grid-template-columns:repeat(3,1fr)}.today-schedule-head{align-items:flex-start;flex-direction:column;gap:2px}}

    .today-clan-layout{grid-template-columns:minmax(0,1fr)}
    .today-clan-head{padding:20px 22px}.today-clan-title h3{font-size:28px}.today-clan-title small{font-size:13px}.today-clan-calendar{font-size:12px;min-height:44px}
    .today-event-inner{min-height:290px;padding:20px}.today-event-card h4{font-size:26px;line-height:1.2}.today-event-chip{font-size:11px}.today-event-time{font-size:22px}.today-event-countdown{font-size:15px;padding:7px 9px}.today-event-place{font-size:13px;line-height:1.5}.today-choice{font-size:12px;min-height:44px;padding:10px 4px}.today-choice:disabled{opacity:.55;cursor:wait}.today-choice:focus-visible{outline:2px solid #efcb78;outline-offset:2px}
    .today-box{padding:22px}.today-box-title h4{font-size:22px}.today-box-title button{font-size:12px;min-height:40px}.today-schedule-head{padding:12px}.today-schedule-head b,.today-schedule-head span{font-size:12px}
    .today-line{grid-template-columns:72px 14px 64px minmax(0,1fr) auto;min-height:96px;gap:14px;padding:12px 0}.today-line time{font-size:18px}.today-line-thumb{width:60px;height:60px}.today-line-copy b{font-size:20px;line-height:1.4}.today-line-copy small{font-size:13px;line-height:1.5}.today-line-kind{font-size:10px;padding:4px 7px}.today-line-side>span{font-size:18px}.today-line-side em{font-size:12px;padding:6px 9px}.today-stat span{font-size:12px}.today-feedback:empty{display:none}.today-feedback{color:#ed9c81;font-size:14px}
    @media(max-width:1100px){.today-clan-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){.today-clan-title h3{font-size:24px}.today-clan-cards{grid-template-columns:1fr}.today-event-inner{min-height:270px;padding:18px}.today-card-actions{grid-template-columns:repeat(3,1fr)}.today-box{padding:14px}.today-box-title{flex-wrap:wrap}.today-box-title h4{font-size:20px}.today-line{grid-template-columns:52px 48px minmax(0,1fr);gap:10px}.today-line-track{display:none}.today-line time{font-size:15px}.today-line-thumb{width:46px;height:46px}.today-line-copy b{font-size:17px}.today-line-copy small{font-size:12px}.today-line-side{grid-column:2/-1;display:flex;flex-wrap:wrap;gap:8px;text-align:left}.today-line-side>span{font-size:16px}.today-line-side em{font-size:11px}.today-schedule-head{align-items:flex-start;flex-direction:column;gap:5px}}
  `;
  document.head.appendChild(style);

  let user = null;
  let profile = null;
  let signups = new Map();
  let renderSignature = "";
  let refreshing = false;
  let refreshPending = false;
  let pendingChoice = false;
  let mounted = false;
  let refreshTimer = 0;

  const getZone = () => document.querySelector('#memberZoneLayer');
  const getHome = () => getZone()?.querySelector('[data-zone-panel="home"]');
  const go = (view) => getZone()?.querySelector(`[data-zone-view="${view}"]`)?.click();

  async function loadMember() {
    const { data: auth } = await supabase.auth.getUser();
    user = auth?.user || null;
    if (!user) return false;
    const { data } = await supabase.from('profiles').select('id,nickname,role,status').eq('id', user.id).maybeSingle();
    profile = data || null;
    return profile?.status === 'approved';
  }

  async function loadSignups() {
    signups = new Map();
    if (!user) return;
    const { data } = await supabase.from('event_signups').select('event_id,schedule_key,response').eq('user_id', user.id);
    (data || []).forEach((row) => signups.set(keyFor(row), row.response));
  }

  function allUpcoming() {
    return getClanUpcomingEvents(new Date());
  }

  function todayEvents() {
    const today = warsawDateKey();
    return allUpcoming().filter((event) => String(event.event_date || event.date || '') === today);
  }

  function dateKeyForEvent(event) {
    return String(event?.event_date || event?.date || warsawDateKey(eventStart(event)));
  }

  function dateLabelFromKey(key) {
    const today = warsawDateKey();
    const tomorrow = warsawDateKey(new Date(Date.now() + 86400000));
    if (key === today) return ['DZISIAJ', warsawDateLabel()];
    if (key === tomorrow) {
      const label = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00`));
      return ['JUTRO', label];
    }
    const label = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00`));
    return ['PÓŹNIEJ', label];
  }

  function card(event) {
    const src = artwork(event);
    const choice = signups.get(String(event.id));
    return `<article class="today-event-card ${typeClass(event)}" data-today-event="${esc(event.id)}">
      <div class="today-event-art">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : ''}</div>
      <div class="today-event-inner"><span class="today-event-chip">${esc(event.type || 'EVENT')}</span><h4>${esc(event.name || 'Wydarzenie')}</h4><div class="today-event-meta"><span class="today-event-time">Dziś, ${esc(timeLabel(event))}</span><span class="today-event-countdown" data-today-countdown="${esc(event.id)}">${esc(countdown(event))}</span><span class="today-event-place">⌖ ${esc(event.location || event.boss || 'Eternal x10')}</span><div class="today-card-actions">${[['yes','BĘDĘ'],['maybe','MOŻE'],['no','NIE']].map(([key,label]) => `<button type="button" class="today-choice ${key} ${choice === key ? 'active' : ''}" data-today-choice="${key}" data-today-event-id="${esc(event.id)}">${label}</button>`).join('')}</div></div></div>
    </article>`;
  }

  function timelineRow(event) {
    const choice = signups.get(String(event.id));
    const label = choice === 'yes' ? 'Będę' : choice === 'maybe' ? 'Może' : choice === 'no' ? 'Nie będę' : 'Brak deklaracji';
    const src = artwork(event);
    return `<div class="today-line ${typeClass(event)}">
      <time>${esc(timeLabel(event))}</time>
      <span class="today-line-track"><i class="today-dot"></i></span>
      ${src ? `<img class="today-line-thumb" src="${esc(src)}" alt="" loading="lazy">` : '<span class="today-line-thumb placeholder">✦</span>'}
      <div class="today-line-copy"><div class="today-line-title"><b>${esc(event.name || 'Wydarzenie')}</b><span class="today-line-kind">${esc(event.type || 'EVENT')}</span></div><small>${esc(event.location || event.boss || 'Eternal x10')}</small></div>
      <div class="today-line-side"><span data-today-countdown="${esc(event.id)}">${esc(countdown(event))}</span><em class="${choice || ''}">${esc(label)}</em></div>
    </div>`;
  }

  function timelineGroups(events) {
    const groups = new Map();
    events.slice(0, 12).forEach((event) => {
      const key = dateKeyForEvent(event);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    });
    if (!groups.size) return '<div class="today-empty">Brak nadchodzących wydarzeń w kalendarzu.</div>';
    return [...groups.entries()].map(([key, rows]) => {
      const [relative, dateLabel] = dateLabelFromKey(key);
      return `<section class="today-schedule-group"><div class="today-schedule-head"><b>${relative}</b><span>${esc(dateLabel)}</span></div><div class="today-timeline">${rows.map(timelineRow).join('')}</div></section>`;
    }).join('');
  }

  function render() {
    const home = getHome();
    if (!home || !profile) return;
    const events = todayEvents();
    const upcoming = allUpcoming();
    const cards = events.slice(0, 4);
    const epic = events.filter((event) => String(event.type || '').toLowerCase().includes('epic')).length;
    const siege = events.filter((event) => String(event.type || '').toLowerCase().includes('siege')).length;
    const yes = events.filter((event) => signups.get(String(event.id)) === 'yes').length;

    const markup = `<div class="today-clan">
      <div class="today-clan-head"><div class="today-clan-title"><span>▣</span><div><h3>DZISIAJ W KLANIE</h3><small>${esc(warsawDateLabel())}</small></div></div><button type="button" class="today-clan-calendar" data-today-go="events">ZOBACZ CAŁY KALENDARZ →</button></div>
      <p class="today-feedback" role="status"></p><div class="today-clan-layout"><div class="today-clan-main">
        <div class="today-clan-cards">${cards.length ? cards.map(card).join('') : '<div class="today-box today-empty" style="grid-column:1/-1">Dzisiaj nie ma jeszcze zaplanowanych wydarzeń.</div>'}</div>
        <section class="today-box"><div class="today-box-title"><h4>NAJBLIŻSZE WYDARZENIA</h4><button type="button" data-today-go="events">Zobacz wszystkie →</button></div><div class="today-schedule">${timelineGroups(upcoming)}</div></section>
        <div class="today-stats"><div class="today-stat"><b>${events.length}</b><span>Wydarzeń dziś</span></div><div class="today-stat"><b>${epic}</b><span>Epic Bossów</span></div><div class="today-stat"><b>${siege}</b><span>Siege</span></div><div class="today-stat"><b>${yes}</b><span>Twoich „Będę”</span></div></div>
      </div></div></div>`;
    if (renderSignature !== markup) { home.innerHTML = markup; renderSignature = markup; }
  }

  const visible = () => !document.hidden && getZone()?.classList.contains('open') && getHome()?.classList.contains('active');
  async function refresh() {
    if (!visible()) return;
    if (refreshing) { refreshPending = true; return; }
    refreshing = true;
    try {
      if (!await loadMember()) return;
      await loadSignups();
      render();
    } finally {
      refreshing = false;
      if (refreshPending) { refreshPending = false; queueMicrotask(refresh); }
    }
  }

  async function proxyChoice(eventId, choice) {
    if (pendingChoice) return;
    const event = allUpcoming().find(e => String(e.id) === String(eventId));
    if (!event) return;
    pendingChoice = true;
    getHome().querySelectorAll('[data-today-choice]').forEach(b => b.disabled = true);
    const feedback = getHome().querySelector('.today-feedback');
    try {
      await saveCalendarSignup(supabase, event, choice);
      signups.set(String(eventId), choice);
      render();
      window.dispatchEvent(new CustomEvent('orzel:signup-updated'));
    } catch (error) {
      if (feedback) feedback.textContent = error.message || 'Nie udało się zapisać odpowiedzi.';
    } finally {
      pendingChoice = false;
      getHome()?.querySelectorAll('[data-today-choice]').forEach(b => b.disabled = false);
    }
  }

  function bind() {
    const zone = getZone();
    if (!zone || zone.dataset.todayClanBound === '1') return;
    zone.dataset.todayClanBound = '1';
    zone.addEventListener('click', (event) => {
      const goButton = event.target.closest('[data-today-go]');
      if (goButton) { go(goButton.dataset.todayGo); return; }
      const choice = event.target.closest('[data-today-choice]');
      if (choice) proxyChoice(choice.dataset.todayEventId, choice.dataset.todayChoice);
    });
    zone.addEventListener('click', (event) => {
      if (event.target.closest('[data-zone-view="home"]')) setTimeout(refresh, 50);
    });
  }

  const updateCountdowns = () => {
    const home = getHome();
    if (!visible()) return;
    const byId = new Map(allUpcoming().map((event) => [String(event.id), event]));
    home.querySelectorAll('[data-today-countdown]').forEach((node) => {
      const event = byId.get(String(node.dataset.todayCountdown));
      if (event) { const value = countdown(event); if (node.textContent !== value) node.textContent = value; }
    });
  };

  const wait = () => {
    if (!getHome()) { setTimeout(wait, 150); return; }
    bind();
    refresh();
    if (!mounted) {
      mounted = true;
      subscribeClanEvents(refresh);
      window.addEventListener('orzel:signup-updated', refresh);
      new MutationObserver(refresh).observe(getZone(), {attributes:true,attributeFilter:['class']});
      document.addEventListener('visibilitychange', refresh);
      clearInterval(refreshTimer);
      refreshTimer = setInterval(updateCountdowns, 30000);
      supabase.auth.onAuthStateChange(() => setTimeout(refresh, 100));
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait, { once: true });
  else wait();
}

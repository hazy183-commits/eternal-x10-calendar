import { getClanUpcomingEvents, subscribeClanEvents } from './clanEventFeed.js';
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
    .today-timeline{display:grid;gap:0;margin-top:4px}.today-line{display:grid;grid-template-columns:54px 12px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:58px;border-bottom:1px solid #252019}.today-line:last-child{border-bottom:0}.today-line time{color:#d8c6a3;font-size:11px;font-weight:900}.today-dot{width:8px;height:8px;border-radius:50%;background:#b88636;box-shadow:0 0 0 3px #241b0c}.today-line.epic .today-dot{background:#d9594f}.today-line.rb .today-dot{background:#4db7e0}.today-line.siege .today-dot{background:#d7a238}.today-line-copy{min-width:0}.today-line-copy b{display:block;color:#ded8ce;font-size:11px}.today-line-copy small{display:block;margin-top:2px;color:#7f7a71;font-size:8px}.today-line-side{text-align:right}.today-line-side span{display:block;color:#7bd890;font-size:9px;font-weight:900}.today-line-side em{display:block;margin-top:4px;color:#8a8378;font-size:8px;font-style:normal}
    .today-empty{padding:24px 8px;color:#777168;font-size:10px;text-align:center}.today-my-list{display:grid;gap:7px;margin-top:10px}.today-my-row{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center;padding:9px;border:1px solid #2e2920;background:#080c0c}.today-my-thumb{width:40px;height:35px;object-fit:cover;border:1px solid #433822;background:#111}.today-my-copy b{display:block;color:#ded7cb;font-size:10px}.today-my-copy small{color:#817b71;font-size:8px}.today-my-status{padding:5px 7px;border:1px solid #277a3b;color:#6edc84;background:#0c2112;font-size:8px;font-weight:900}.today-my-status.maybe{border-color:#7f6220;color:#dbb954;background:#261d08}.today-my-status.no{border-color:#71322e;color:#dc746c;background:#240f0e}
    .today-announcement{margin-top:10px}.today-announcement b{display:block;color:#e2b458;font-size:11px}.today-announcement p{margin:6px 0;color:#8e887e;font-size:9px;line-height:1.5}.today-announcement small{color:#69655f;font-size:8px}.today-quick{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.today-quick button,.today-quick a{display:grid;place-items:center;min-height:58px;padding:8px;border:1px solid #423622;background:#0b0f0f;color:#caa458;text-decoration:none;font-size:9px;font-weight:900;cursor:pointer}.today-quick .blue{border-color:#27536b;color:#72bde0}.today-quick .green{border-color:#285e38;color:#75cf88}.today-quick .violet{border-color:#56366d;color:#bd8ad8}
    .today-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.today-stat{padding:12px;border:1px solid #373023;background:#090d0d;text-align:center}.today-stat b{display:block;color:#ebc56f;font-size:20px}.today-stat span{color:#827c72;font-size:8px}
    @media(max-width:1100px){.today-clan-cards{grid-template-columns:1fr 1fr}.today-clan-layout{grid-template-columns:1fr}.today-clan-rail{grid-template-columns:1fr 1fr}.today-stats{grid-template-columns:repeat(4,1fr)}}
    @media(max-width:700px){.today-clan{margin-top:10px}.today-clan-head{align-items:flex-start;flex-direction:column}.today-clan-title h3{font-size:18px}.today-clan-calendar{width:100%}.today-clan-cards{grid-template-columns:1fr 1fr;gap:7px}.today-event-card{min-height:215px}.today-event-inner{min-height:191px;padding:10px}.today-event-card h4{font-size:15px}.today-card-actions{grid-template-columns:1fr;gap:3px}.today-choice{padding:6px}.today-clan-rail{grid-template-columns:1fr}.today-line{grid-template-columns:44px 10px minmax(0,1fr);padding:6px 0}.today-line-side{grid-column:3;text-align:left;margin-top:-7px}.today-stats{grid-template-columns:1fr 1fr}.today-box{padding:12px}}
    @media(max-width:430px){.today-clan-cards{grid-template-columns:1fr}.today-event-card{min-height:205px}.today-event-inner{min-height:181px}.today-card-actions{grid-template-columns:repeat(3,1fr)}}
  `;
  document.head.appendChild(style);

  let user = null;
  let profile = null;
  let signups = new Map();
  let announcement = null;
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

  async function loadAnnouncement() {
    const { data } = await supabase.from('clan_announcements').select('id,title,body,is_pinned,created_at').eq('is_active', true).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle();
    announcement = data || null;
  }

  function todayEvents() {
    const today = warsawDateKey();
    return getClanUpcomingEvents(new Date()).filter((event) => String(event.event_date || event.date || '') === today);
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
    return `<div class="today-line ${typeClass(event)}"><time>${esc(timeLabel(event))}</time><span class="today-dot"></span><div class="today-line-copy"><b>${esc(event.name || 'Wydarzenie')}</b><small>${esc(event.location || event.boss || event.type || 'Eternal x10')}</small></div><div class="today-line-side"><span data-today-countdown="${esc(event.id)}">${esc(countdown(event))}</span><em>${esc(label)}</em></div></div>`;
  }

  function myRow(event) {
    const choice = signups.get(String(event.id));
    const src = artwork(event);
    const label = choice === 'yes' ? 'JESTEM' : choice === 'maybe' ? 'MOŻE' : 'NIE BĘDĘ';
    return `<div class="today-my-row">${src ? `<img class="today-my-thumb" src="${esc(src)}" alt="" loading="lazy">` : '<span class="today-my-thumb"></span>'}<div class="today-my-copy"><b>${esc(event.name || 'Wydarzenie')}</b><small>Dziś, ${esc(timeLabel(event))} · ${esc(countdown(event))}</small></div><span class="today-my-status ${choice || ''}">${label}</span></div>`;
  }

  function render() {
    const home = getHome();
    if (!home || !profile) return;
    const events = todayEvents();
    const cards = events.slice(0, 4);
    const mine = events.filter((event) => signups.has(String(event.id)));
    const epic = events.filter((event) => String(event.type || '').toLowerCase().includes('epic')).length;
    const siege = events.filter((event) => String(event.type || '').toLowerCase().includes('siege')).length;
    const yes = events.filter((event) => signups.get(String(event.id)) === 'yes').length;

    home.innerHTML = `<div class="today-clan">
      <div class="today-clan-head"><div class="today-clan-title"><span>▣</span><div><h3>DZISIAJ W KLANIE</h3><small>${esc(warsawDateLabel())}</small></div></div><button type="button" class="today-clan-calendar" data-today-go="events">ZOBACZ CAŁY KALENDARZ →</button></div>
      <div class="today-clan-layout"><div class="today-clan-main">
        <div class="today-clan-cards">${cards.length ? cards.map(card).join('') : '<div class="today-box today-empty" style="grid-column:1/-1">Dzisiaj nie ma jeszcze zaplanowanych wydarzeń.</div>'}</div>
        <section class="today-box"><div class="today-box-title"><h4>NAJBLIŻSZE WYDARZENIA · DZISIAJ</h4><button type="button" data-today-go="events">Zobacz wszystkie →</button></div><div class="today-timeline">${events.length ? events.map(timelineRow).join('') : '<div class="today-empty">Spokojny dzień — brak wydarzeń w kalendarzu.</div>'}</div></section>
        <div class="today-stats"><div class="today-stat"><b>${events.length}</b><span>Wydarzeń dziś</span></div><div class="today-stat"><b>${epic}</b><span>Epic Bossów</span></div><div class="today-stat"><b>${siege}</b><span>Siege</span></div><div class="today-stat"><b>${yes}</b><span>Twoich „Będę”</span></div></div>
      </div><aside class="today-clan-rail">
        <section class="today-box"><div class="today-box-title"><h4>⚔ MOJE DZISIAJ</h4><button type="button" data-today-go="signups">Moje zapisy →</button></div><div class="today-my-list">${mine.length ? mine.map(myRow).join('') : '<div class="today-empty">Nie masz jeszcze deklaracji na dzisiaj.</div>'}</div></section>
        <section class="today-box"><div class="today-box-title"><h4>📣 NAJNOWSZE OGŁOSZENIE</h4><button type="button" data-today-go="announcements">Wszystkie →</button></div>${announcement ? `<div class="today-announcement"><b>${announcement.is_pinned ? '📌 ' : ''}${esc(announcement.title)}</b><p>${esc(announcement.body)}</p><small>${new Date(announcement.created_at).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>` : '<div class="today-empty">Brak aktywnych ogłoszeń.</div>'}</section>
        <section class="today-box"><div class="today-box-title"><h4>⚡ SZYBKIE AKCJE</h4></div><div class="today-quick"><button type="button" class="green" data-today-go="events">▣ Kalendarz</button><button type="button" class="blue" data-today-go="signups">✓ Moje zapisy</button><button type="button" class="violet" data-today-go="needed-rb">⚔ Potrzebne RB</button><a href="https://discord.gg/HtTrJpp7K" target="_blank" rel="noopener noreferrer">◉ Discord</a></div></section>
      </aside></div></div>`;
  }

  async function refresh() {
    if (!await loadMember()) return;
    await Promise.all([loadSignups(), loadAnnouncement()]);
    render();
  }

  async function proxyChoice(eventId, choice) {
    const zone = getZone();
    const sourceRow = [...zone.querySelectorAll('.zone-event-row.signup-row')].find((row) => String(row.dataset.eventId) === String(eventId));
    const button = sourceRow?.querySelector(`.zone-signup-btn[data-choice="${choice}"]`);
    if (button) {
      button.click();
      signups.set(String(eventId), choice);
      render();
      setTimeout(refresh, 700);
      return;
    }
    go('events');
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
    if (!home?.classList.contains('active')) return;
    const byId = new Map(todayEvents().map((event) => [String(event.id), event]));
    home.querySelectorAll('[data-today-countdown]').forEach((node) => {
      const event = byId.get(String(node.dataset.todayCountdown));
      if (event) node.textContent = countdown(event);
    });
  };

  const wait = () => {
    if (!getHome()) { setTimeout(wait, 150); return; }
    bind();
    refresh();
    if (!mounted) {
      mounted = true;
      subscribeClanEvents(() => refresh());
      clearInterval(refreshTimer);
      refreshTimer = setInterval(updateCountdowns, 30000);
      supabase.auth.onAuthStateChange(() => setTimeout(refresh, 100));
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait, { once: true });
  else wait();
}

import { switchClanView } from './clanViewAccess.js';
import { clanZoneIcon } from './adminClanIcons.js';
import './clanZoneIcons.css';
import { installAdminDashboard } from './adminDashboard.js';
import { installMemberEventSignups } from './memberEventSignups.js';

const TECH_DOMAIN = 'members.orzelbialy.local';
const emailForNick = (nick) => `${nick.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')}@${TECH_DOMAIN}`;
const isMemberEmail = (email='') => email.toLowerCase().endsWith(`@${TECH_DOMAIN}`);

export function installMemberAuth(supabase) {
  if (!supabase || document.querySelector('#memberAuthLayer')) return;

  installAdminDashboard(supabase);
  document.documentElement.classList.add('member-locked');

  const layer = document.createElement('div');
  layer.id = 'memberAuthLayer';
  layer.innerHTML = `
    <div class="member-auth-box">
      <img src="/images/logo-orzel-bialy.webp" alt="Orzeł Biały">
      <span class="member-kicker">ORZEŁ BIAŁY · ETERNAL X10</span>
      <h2>STREFA KLANU</h2>
      <p class="member-auth-lead">Zaloguj się, aby wejść na stronę klanu.</p>
      <div class="member-tabs">
        <button type="button" data-member-tab="login" class="active">Zaloguj się</button>
        <button type="button" data-member-tab="register">Zarejestruj się</button>
      </div>
      <form id="memberAuthForm" autocomplete="off">
        <label>Nick w grze / login<input id="memberNick" autocomplete="username" maxlength="120" required placeholder="np. KiRY"></label>
        <label>Hasło<input id="memberPassword" type="password" autocomplete="current-password" minlength="6" required placeholder="Minimum 6 znaków"></label>
        <button class="member-submit" type="submit">ZALOGUJ SIĘ</button>
        <p id="memberAuthFeedback"></p>
      </form>
    </div>`;
  document.body.appendChild(layer);

  const zone = document.createElement('div');
  zone.id = 'memberZoneLayer';
  zone.innerHTML = `
    <div class="member-zone-box">
      <button class="member-zone-close" type="button">×</button>
      <aside class="member-zone-side">
        <img src="/images/logo-orzel-bialy.webp" alt="Orzeł Biały">
        <span class="member-kicker">ORZEŁ BIAŁY</span><h3>STREFA KLANU</h3>
        <button class="zone-nav active" data-zone-view="home">⌂ <span>Pulpit</span></button>
        <button class="zone-nav" data-zone-view="events">▣ <span>Wydarzenia</span></button>
        <button class="zone-nav" data-zone-view="signups">✓ <span>Moje zapisy</span></button>
        <button class="zone-nav" data-zone-view="announcements">◆ <span>Ogłoszenia</span></button>
        <div class="zone-side-spacer"></div>
        <button class="zone-logout">↪ <span>WYLOGUJ SIĘ</span></button>
        <div class="zone-side-foot"><small>ETERNAL X10</small><b>LINEAGE 2 REBORN</b></div>
      </aside>
      <main class="member-zone-main">
        <header><div><span class="member-kicker">PANEL CZŁONKA KLANU</span><h2>Witaj, <strong id="memberZoneNick">—</strong>!</h2><p>Dobrze, że jesteś z nami.</p><em>„Siła klanu tkwi w ludziach, nie w pixelach.”</em></div><small id="memberZoneRole">MEMBER</small></header>
        <section class="zone-view active" data-zone-panel="home">
          <div class="member-zone-grid"><div><b>⚔ KLAN</b><span>Orzeł Biały</span></div><div><b>✦ SERWER</b><span>Eternal x10</span></div><div><b>♛ RANGA</b><span id="memberRankCard">Member</span></div><div><b>● STATUS</b><span class="status-active">Aktywny</span></div></div>
          <div class="zone-columns"><section class="zone-card"><div class="zone-card-title"><div><small>▣ W KOLEJCE</small><h3>NAJBLIŻSZE WYDARZENIA</h3></div><button class="zone-link" data-zone-go="events">Zobacz wszystkie →</button></div><div id="memberUpcomingEvents" class="zone-event-list"><p class="zone-muted">Ładowanie wydarzeń…</p></div></section><section class="zone-card"><div class="zone-card-title"><div><small>📣 KLAN</small><h3>OGŁOSZENIA KLANOWE</h3></div><button class="zone-link" data-zone-go="announcements">Zobacz wszystkie →</button></div><div class="zone-announcement"><b>Witaj w Strefie Klanu</b><p>Najważniejsze informacje dla członków będą pojawiać się właśnie tutaj.</p></div><div class="zone-announcement"><b>Discord</b><p>Pamiętaj, aby być na Discordzie podczas wspólnych akcji i PvP.</p></div></section></div>
          <div class="zone-bottom"><section class="zone-card"><div class="zone-card-title"><div><small>TWÓJ UDZIAŁ</small><h3>MOJE ZAPISY</h3></div></div><p class="zone-muted">Twoje deklaracje wydarzeń znajdziesz w zakładce „Moje zapisy”.</p></section><section class="zone-stack"><a href="https://discord.gg/HtTrJpp7K" target="_blank">◉ Discord klanu <b>↗</b></a><a href="https://www.youtube.com/@orzelbialyfirstofight" target="_blank">▶ YouTube klanu <b>↗</b></a><a href="https://l2reborn.org" target="_blank">◎ Strona serwera <b>↗</b></a></section></div>
          <div class="zone-motto">„Więcej niż gra — to ludzie.” <b>ORZEŁ BIAŁY</b></div>
        </section>
        <section class="zone-view" data-zone-panel="events"><div class="zone-section-head"><small>KALENDARZ KLANU</small><h3>NAJBLIŻSZE WYDARZENIA</h3><p>Wybierz Będę / Może / Nie będę.</p></div><div id="memberAllEvents" class="zone-event-list zone-event-list-full"></div></section>
        <section class="zone-view" data-zone-panel="signups"><div class="zone-section-head"><small>TWÓJ UDZIAŁ</small><h3>MOJE ZAPISY</h3><p>Twoje deklaracje obecności.</p></div><div class="zone-empty">Brak zapisów.</div></section>
        <section class="zone-view" data-zone-panel="announcements"><div class="zone-section-head"><small>INFORMACJE</small><h3>OGŁOSZENIA KLANOWE</h3></div><div class="zone-announcement big"><b>Strefa Klanu</b><p>To miejsce służy do przekazywania informacji i planowania wspólnych akcji.</p></div></section>
      </main>
    </div>`;
  document.body.appendChild(zone);

  const decorateZoneNavIcons = () => {
    for (const button of zone.querySelectorAll('.zone-nav')) {
      for (const node of [...button.childNodes]) {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
      }
      if (!button.querySelector(':scope > .zone-nav-icon')) {
        const icon = document.createElement('i');
        icon.className = 'zone-nav-icon';
        icon.setAttribute('aria-hidden', 'true');
        button.prepend(icon);
      }
      const icon = button.querySelector(':scope > .zone-nav-icon');
      if (icon.dataset.clanIcon !== button.dataset.zoneView) {
        icon.dataset.clanIcon = button.dataset.zoneView;
        icon.innerHTML = clanZoneIcon(button.dataset.zoneView);
      }
    }
    for (const icon of zone.querySelectorAll('.ob-menu-group-icon')) {
      const group = icon.closest('.ob-menu-group');
      const key = group?.dataset.obMenuGroup || group?.dataset.menuGroup;
      if (key && icon.dataset.clanIcon !== key) {
        icon.dataset.clanIcon = key;
        icon.innerHTML = clanZoneIcon(key);
      }
    }
  };
  decorateZoneNavIcons();
  const zoneNavIconObserver = new MutationObserver(() => queueMicrotask(decorateZoneNavIcons));
  zoneNavIconObserver.observe(zone.querySelector('.member-zone-side'), { childList: true, subtree: true });

  const css = document.createElement('style');
  css.textContent = `
    #memberZoneLayer [hidden]{display:none!important}
    html.member-locked body{min-height:100vh;overflow:hidden;background:#030505!important}
    html.member-locked body>*:not(#memberAuthLayer):not(#loginModal){display:none!important}
    html.member-locked #memberAuthLayer{display:grid!important}
    #memberAuthLayer,#memberZoneLayer{position:fixed;inset:0;z-index:10000;display:none;place-items:center;padding:16px;background:radial-gradient(circle at 50% 8%,#2d210f,#030506 58%);backdrop-filter:blur(9px)}
    #memberAuthLayer.open,#memberZoneLayer.open{display:grid}
    html:has(#memberZoneLayer.open),body:has(#memberZoneLayer.open){overflow:hidden!important}
    #memberZoneLayer{overflow:hidden;overscroll-behavior:none}
    #memberZoneLayer .member-zone-main{min-height:0;overscroll-behavior:contain}
    .member-auth-box{width:min(430px,100%);padding:34px;border:1px solid #8d6a2f;background:#080c0c;color:#ddd;text-align:center;box-shadow:0 30px 90px #000}
    .member-auth-box img{width:108px}.member-kicker{display:block;color:#d3a446;font:800 10px/1.4 Arial;letter-spacing:.19em}.member-auth-box h2{margin:8px 0;color:#efd089;font:700 28px Georgia}.member-auth-lead{color:#858178}
    .member-tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #382e1e;margin:20px 0}.member-tabs button{padding:12px;border:0;background:none;color:#777;font-weight:800;cursor:pointer}.member-tabs .active{color:#e4b95e;border-bottom:2px solid #e4b95e}
    .member-auth-box label{display:block;text-align:left;margin:12px 0;color:#a29b8d;font-size:11px;font-weight:800}.member-auth-box input{box-sizing:border-box;width:100%;margin-top:7px;padding:13px;border:1px solid #42392b;background:#090d0d;color:#eee}
    .member-submit{width:100%;padding:14px;margin-top:10px;font-weight:900;cursor:pointer;border:1px solid #bd8d3c;background:linear-gradient(#3a2811,#20160b);color:#f0cf83}#memberAuthFeedback{min-height:18px;color:#d6b46d;font-size:12px;line-height:1.45}
    .member-zone-box{position:relative;display:grid;grid-template-columns:230px 1fr;width:min(1420px,calc(100vw - 32px));height:min(850px,calc(100vh - 32px));overflow:hidden;border:1px solid #765721;background:linear-gradient(145deg,#091010,#060909);box-shadow:0 35px 110px #000;color:#d8d4ca}.member-zone-close{position:absolute;right:16px;top:10px;border:0;background:none;color:#8d887d;font-size:28px;cursor:pointer;z-index:5}
    .member-zone-side{display:flex;flex-direction:column;padding:22px 18px;border-right:1px solid #392c18;background:linear-gradient(180deg,#0d1212,#070a0a)}.member-zone-side img{width:100px;height:82px;object-fit:contain;margin:0 auto 8px}.member-zone-side>.member-kicker{text-align:center}.member-zone-side h3{text-align:center;margin:5px 0 22px;color:#f0cf7e;font:700 22px Georgia}.zone-nav{display:flex;gap:11px;align-items:center;margin:2px 0;padding:9px 11px;border:1px solid transparent;background:transparent;color:#999389;text-align:left;font-weight:800;cursor:pointer}.zone-nav:hover,.zone-nav.active{border-color:#665026;background:linear-gradient(90deg,#3a2812,#18140d);color:#efc56a}.zone-nav-icon{display:block;flex:0 0 30px;width:30px;height:30px;background-image:url("/images/ui-clan-zone-icons-v1.png");background-repeat:no-repeat;background-size:120px 90px;filter:saturate(.82) brightness(.82);transition:filter .15s ease,transform .15s ease}.zone-nav:hover .zone-nav-icon,.zone-nav.active .zone-nav-icon{filter:saturate(1.08) brightness(1.12) drop-shadow(0 0 5px rgba(220,168,66,.42));transform:translateY(-1px)}.zone-nav[data-zone-view="home"] .zone-nav-icon{background-position:0 0}.zone-nav[data-zone-view="events"] .zone-nav-icon{background-position:33.333% 0}.zone-nav[data-zone-view="signups"] .zone-nav-icon{background-position:66.667% 0}.zone-nav[data-zone-view="announcements"] .zone-nav-icon{background-position:100% 0}.zone-nav[data-zone-view="profile"] .zone-nav-icon{background-position:0 50%}.zone-nav[data-zone-view="recruitment"] .zone-nav-icon{background-position:33.333% 50%}.zone-nav[data-zone-view="content-editor"] .zone-nav-icon{background-position:66.667% 50%}.zone-nav[data-zone-view="members"] .zone-nav-icon{background-position:100% 50%}.zone-nav[data-zone-view="needed-rb"] .zone-nav-icon{background-position:0 100%}.zone-nav[data-zone-view="craft"] .zone-nav-icon{background-position:33.333% 100%}.zone-nav[data-zone-view="attendance"] .zone-nav-icon{background-position:66.667% 100%}.zone-side-spacer{flex:1}.zone-logout{padding:14px;border:1px solid #9a722f;background:#17130d;color:#e2b85f;font-weight:900;cursor:pointer}.zone-side-foot{padding:18px 10px 4px;margin-top:14px;border-top:1px solid #302719;color:#777168}.zone-side-foot small,.zone-side-foot b{display:block;font-size:9px;letter-spacing:.14em}
    .member-zone-main{overflow:auto;padding:28px 32px}.member-zone-main>header{display:flex;padding-bottom:20px;border-bottom:1px solid #352b1d}.member-zone-main>header h2{margin:4px 0 2px;color:#eee8dc;font:700 34px Georgia}.member-zone-main>header h2 strong{color:#efcb78}.member-zone-main>header p{margin:0;color:#8b877e}.member-zone-main>header em{display:block;margin-top:7px;color:#716d65;font-size:13px}.member-zone-main>header>small{margin-left:auto;margin-right:28px;height:max-content;padding:9px 12px;border:1px solid #745a29;color:#e0b75d;font-weight:900}.zone-view{display:none}.zone-view.active{display:block}
    .member-zone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.member-zone-grid div{padding:17px;border:1px solid #382f20;background:#0a0e0e}.member-zone-grid b{display:block;margin-bottom:8px;color:#d6a94f;font-size:10px}.status-active{color:#70c982!important}.zone-columns,.zone-bottom{display:grid;grid-template-columns:1.65fr 1fr;gap:14px}.zone-bottom{margin-top:14px}.zone-card{padding:18px;border:1px solid #382f20;background:#0a0e0e}.zone-card-title{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #292319}.zone-card-title small,.zone-section-head small{color:#c89b47;font-size:9px;font-weight:900;letter-spacing:.14em}.zone-card-title h3,.zone-section-head h3{margin:4px 0;color:#eee7da;font:700 18px Georgia}.zone-link{border:0;background:none;color:#c79a48;font-size:10px;cursor:pointer}.zone-event-row{display:grid;grid-template-columns:70px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #282218}.zone-event-date{color:#e0b353;font-weight:900;font-size:11px}.zone-event-info b{display:block;color:#ddd;font-size:12px}.zone-event-info small{color:#7f7b73}.zone-event-type{padding:5px 7px;border:1px solid #755523;color:#d0a14c;font-size:9px;font-weight:900}.zone-announcement{padding:14px 0;border-bottom:1px solid #282218}.zone-announcement b{color:#d9aa50;font-size:12px}.zone-announcement p,.zone-muted{color:#807c74;font-size:11px;line-height:1.5}.zone-stack{display:grid;gap:7px}.zone-stack a{padding:12px 14px;border:1px solid #3f3421;background:#0a0e0e;color:#c9a75e;text-decoration:none;font-size:11px}.zone-stack b{float:right}.zone-motto{text-align:right;margin-top:14px;color:#716c63;font:italic 12px Georgia}.zone-section-head{padding:24px 0 12px}.zone-section-head h3{font-size:25px}.zone-section-head p{color:#7e7a72}.zone-empty{padding:40px;margin-top:18px;border:1px dashed #584526;color:#9b8257;text-align:center}
    @media(max-width:900px){#memberZoneLayer{padding:5px}.member-zone-box{grid-template-columns:1fr;width:100%;height:calc(100vh - 10px)}.member-zone-side{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:9px;border-right:0;border-bottom:1px solid #342918}.member-zone-side img,.member-zone-side>.member-kicker,.member-zone-side h3,.zone-side-spacer,.zone-logout,.zone-side-foot{display:none}.zone-nav{justify-content:center;gap:5px;padding:7px 4px;font-size:10px}.zone-nav-icon{flex-basis:24px;width:24px;height:24px;background-size:96px 72px}.member-zone-main{padding:18px 12px}.member-zone-grid{grid-template-columns:1fr 1fr}.zone-columns,.zone-bottom{grid-template-columns:1fr}.member-zone-main>header h2{font-size:25px}}
  `;
  document.head.appendChild(css);

  const feedback = layer.querySelector('#memberAuthFeedback');
  const nick = layer.querySelector('#memberNick');
  const password = layer.querySelector('#memberPassword');
  const submit = layer.querySelector('.member-submit');
  let mode = 'login';
  let currentProfile = null;

  const setMode = (next) => {
    mode = next;
    layer.querySelectorAll('[data-member-tab]').forEach((b) => b.classList.toggle('active', b.dataset.memberTab === next));
    submit.textContent = next === 'login' ? 'ZALOGUJ SIĘ' : 'UTWÓRZ KONTO';
    password.autocomplete = next === 'login' ? 'current-password' : 'new-password';
    feedback.textContent = '';
    nick.value = '';
    password.value = '';
  };

  let viewRequest = 0;
  const switchView = async (view) => {
    const request = ++viewRequest;
    const { data: { session } } = await supabase.auth.getSession();
    const profile = session ? await getProfile(session.user) : null;
    if (request !== viewRequest) return;
    switchClanView(zone, profile, view);
  };

  const lockPage = (message = '') => {
    ++viewRequest;
    switchClanView(zone, null, 'home');
    document.documentElement.classList.add('member-locked');
    layer.classList.add('open');
    zone.classList.remove('open');
    if (message) feedback.textContent = message;
  };

  const unlockPage = () => {
    document.documentElement.classList.remove('member-locked');
    layer.classList.remove('open');
  };

  const getProfile = async (user) => {
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('nickname,role,status,removed_at').eq('id', user.id).maybeSingle();
    return data || null;
  };

  const isAllowed = (session, profile) => {
    if (!session || profile?.removed_at || profile?.status === 'blocked') return false;
    if (!isMemberEmail(session.user?.email || '')) return true;
    return profile?.status === 'approved';
  };

  const updateAdminVisibility = (session, profile) => {
    const legacyAdmin = session && !isMemberEmail(session.user?.email || '');
    const role = String(profile?.role || '').toLowerCase();
    const canAdmin = Boolean(session && (legacyAdmin || role === 'owner' || role === 'admin'));
    document.querySelector('#adminTrigger')?.toggleAttribute('hidden', !canAdmin);
    document.querySelector('#quickAdd')?.toggleAttribute('hidden', !canAdmin);
  };

  const syncAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    currentProfile = session ? await getProfile(session.user) : null;
    if (isAllowed(session, currentProfile)) {
      unlockPage();
      updateAdminVisibility(session, currentProfile);
      return true;
    }
    updateAdminVisibility(null, null);
    lockPage();
    return false;
  };

  const openZone = async (initialView = 'home') => {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = session ? await getProfile(session.user) : null;
    if (!isAllowed(session, profile)) {
      lockPage('Zaloguj się, aby wejść do Strefy Klanu.');
      return false;
    }
    const nickname = profile?.nickname || (session.user?.email || '').split('@')[0] || 'Członek';
    const role = profile?.role || (!isMemberEmail(session.user?.email || '') ? 'owner' : 'member');
    zone.querySelector('#memberZoneNick').textContent = nickname;
    zone.querySelector('#memberZoneRole').textContent = String(role).toUpperCase();
    zone.querySelector('#memberRankCard').textContent = String(role).replace(/^./, (c) => c.toUpperCase());
    zone.classList.add('open');
    await switchView(initialView);
    return true;
  };

  window.addEventListener('orzel:open-craft-workspace', async () => {
    const opened = await openZone('craft');
    if (opened) window.dispatchEvent(new CustomEvent('orzel:craft-workspace-opened', { detail: { view: 'craft' } }));
  });

  layer.querySelector('.member-tabs').addEventListener('click', (e) => {
    const button = e.target.closest('[data-member-tab]');
    if (button) setMode(button.dataset.memberTab);
  });

  zone.querySelector('.member-zone-close').addEventListener('click', () => zone.classList.remove('open'));
  zone.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-zone-view]');
    const go = e.target.closest('[data-zone-go]');
    if (nav) switchView(nav.dataset.zoneView);
    if (go) switchView(go.dataset.zoneGo);
  });

  zone.querySelector('.zone-logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    lockPage();
  });

  layer.querySelector('#memberAuthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = nick.value.trim();
    const secret = password.value;
    const isEmailIdentifier = identifier.includes('@');
    const isValidNickname = /^[A-Za-z0-9_-]{2,24}$/.test(identifier);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (mode === 'register' && !isValidNickname) {
      feedback.textContent = 'Przy rejestracji użyj nicku: 2–24 znaki, litery/cyfry oraz _ lub -.';
      return;
    }
    if (mode === 'login' && !isValidNickname && !(isEmailIdentifier && isValidEmail)) {
      feedback.textContent = 'Wpisz poprawny nick w grze lub login.';
      return;
    }

    submit.disabled = true;
    feedback.textContent = 'Proszę czekać…';
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email: emailForNick(identifier), password: secret, options: { data: { nickname: identifier } } });
        if (error) throw error;
        await supabase.auth.signOut();
        feedback.textContent = 'Konto utworzone. Czeka na akceptację Ownera.';
        nick.value = '';
        password.value = '';
        return;
      }

      const loginEmail = isEmailIdentifier ? identifier.toLowerCase() : emailForNick(identifier);
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: secret });
      if (error || !data?.session) throw error || new Error('Logowanie nie zwróciło aktywnej sesji.');

      const profile = await getProfile(data.user);
      const role = String(profile?.role || '').toLowerCase();
      const isAdminAccount = !isMemberEmail(data.user?.email || '') || role === 'owner' || role === 'admin';

      if (profile?.removed_at || profile?.status === 'blocked') {
        await supabase.auth.signOut();
        feedback.textContent = 'To konto jest zablokowane.';
        return;
      }
      if (!isAdminAccount && (!profile || profile.status !== 'approved')) {
        await supabase.auth.signOut();
        feedback.textContent = 'Konto czeka na akceptację Ownera.';
        return;
      }

      currentProfile = profile;
      unlockPage();
      updateAdminVisibility(data.session, profile);
      setTimeout(() => {
        const adminTrigger = document.querySelector('#adminTrigger');
        if (isAdminAccount && adminTrigger && !adminTrigger.hidden) adminTrigger.click();
        else openZone();
      }, 350);
    } catch (err) {
      const msg = String(err?.message || '');
      feedback.textContent = msg.includes('Invalid login') ? 'Nieprawidłowy login lub hasło.' : msg.includes('already registered') ? 'Ten nick jest już zajęty.' : 'Nie udało się wykonać operacji.';
    } finally {
      submit.disabled = false;
    }
  });

  const actions = document.querySelector('.header-actions');
  const entry = document.createElement('button');
  const logout = document.createElement('button');
  entry.type = logout.type = 'button';
  entry.className = 'admin-trigger member-auth-entry';
  entry.textContent = '✦ Strefa klanu';
  logout.className = 'admin-trigger member-auth-entry logout';
  logout.textContent = '↪ Wyloguj';
  entry.addEventListener('click', () => openZone());
  logout.addEventListener('click', async () => { await supabase.auth.signOut(); lockPage(); });
  if (actions) actions.append(entry, logout);

  const syncHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = session ? await getProfile(session.user) : null;
    if (!isAllowed(session, profile)) {
      entry.hidden = true;
      logout.hidden = true;
      return;
    }
    const nickname = profile?.nickname || (!isMemberEmail(session.user?.email || '') ? 'Administrator' : 'Strefa klanu');
    entry.textContent = `♟ ${nickname}`;
    entry.hidden = false;
    logout.hidden = false;
  };

  supabase.auth.onAuthStateChange(() => {
    setTimeout(async () => {
      await syncAccess();
      await syncHeader();
    }, 0);
  });

  installMemberEventSignups(supabase);
  layer.classList.add('open');
  syncAccess().then(syncHeader);
}

import { raidBossImageCandidates, raidBossWikiUrl } from './raidBossArtworkEnhancer.js';

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function warsawDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function windowText(startIso) {
  if (!startIso) return 'Brak ustawionego okna';
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 30 * 60000);
  const dateFmt = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit' });
  const timeFmt = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

function windowState(startIso) {
  if (!startIso) return { label: 'BRAK OKNA', cls: 'idle' };
  const start = new Date(startIso).getTime();
  const end = start + 30 * 60000;
  const now = Date.now();
  if (now < start) return { label: 'NADCHODZI', cls: 'upcoming' };
  if (now < end) return { label: 'OKNO AKTYWNE', cls: 'active' };
  return { label: 'OKNO ZAKOŃCZONE', cls: 'ended' };
}

function mountRealImage(container, name) {
  const urls = raidBossImageCandidates(name);
  const img = document.createElement('img');
  img.alt = `Wygląd ${name}`;
  img.referrerPolicy = 'no-referrer';
  img.decoding = 'async';
  let index = 0;
  const next = () => {
    if (index >= urls.length) {
      container.innerHTML = '<div class="rb-detail-image-fallback">RB</div>';
      return;
    }
    img.src = urls[index++];
  };
  img.addEventListener('error', next);
  container.replaceChildren(img);
  next();
}

export function installNeededRaidBossDetails(supabase) {
  if (!supabase || window.__obNeededRbDetailsInstalled) return;
  window.__obNeededRbDetailsInstalled = true;

  const style = document.createElement('style');
  style.textContent = `
    .needed-rb-card,.needed-rb-calendar-row{cursor:pointer}
    .rb-detail-layer{position:fixed;inset:0;z-index:10080;display:none;align-items:center;justify-content:center;padding:18px;background:#000c;backdrop-filter:blur(4px)}
    .rb-detail-layer.open{display:flex}.rb-detail-shell{width:min(820px,96vw);max-height:92vh;overflow:auto;border:1px solid #6e532b;background:linear-gradient(180deg,#121716,#080b0b 44%);box-shadow:0 24px 80px #000;color:#d8d2c8}
    .rb-detail-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #3d3324;background:#0b0f0f;position:sticky;top:0;z-index:2}.rb-detail-top small{color:#a98a50;font-size:9px;font-weight:900;letter-spacing:.14em}.rb-detail-close{border:1px solid #544429;background:#14130e;color:#c9a65b;width:34px;height:34px;font-size:18px;cursor:pointer}
    .rb-detail-body{padding:18px}.rb-detail-hero{display:grid;grid-template-columns:270px 1fr;gap:18px}.rb-detail-image{height:270px;border:1px solid #6c5129;background:#090d0d;overflow:hidden}.rb-detail-image img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}.rb-detail-image-fallback{height:100%;display:grid;place-items:center;color:#b98c3d;font-size:34px;font-weight:900;letter-spacing:.18em;background:radial-gradient(circle at 50% 35%,#322410,#090b0b 68%)}
    .rb-detail-title h2{margin:0;color:#f0e6d3;font-size:24px;line-height:1.15}.rb-detail-title .rb-detail-level{display:inline-flex;margin:8px 0 12px;padding:6px 8px;border:1px solid #8a642d;background:#2b1d0d;color:#e9bd61;font-size:10px;font-weight:900}.rb-detail-state{display:inline-flex;margin-left:8px;padding:6px 8px;border:1px solid #5d4b2c;color:#cdb270;font-size:9px;font-weight:900}.rb-detail-state.active{border-color:#6c8b43;color:#b9d678;background:#14200e}.rb-detail-state.ended{border-color:#6d443a;color:#d99081;background:#20110f}
    .rb-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:8px}.rb-detail-cell{padding:10px;border:1px solid #302a21;background:#0c1010}.rb-detail-cell span{display:block;color:#786f61;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rb-detail-cell b{display:block;margin-top:4px;color:#d9d0c2;font-size:11px}.rb-detail-note{margin:14px 0 0;padding:12px;border-left:3px solid #9b7031;background:#14120d;color:#bfb6a7;font-size:11px;line-height:1.55}
    .rb-detail-section{margin-top:18px;padding-top:14px;border-top:1px solid #2c2720}.rb-detail-section h4{margin:0 0 9px;color:#d7b165;font-size:10px;letter-spacing:.08em}.rb-detail-helper-list{display:flex;flex-wrap:wrap;gap:7px}.rb-detail-helper{padding:7px 9px;border:1px solid #4c402d;background:#11120e;color:#bbb2a4;font-size:10px}.rb-detail-empty{color:#706b62;font-size:10px}
    .rb-detail-location{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px;border:1px solid #33452f;background:linear-gradient(135deg,#11190f,#0b100b)}.rb-detail-location-copy b{display:block;color:#d5dfc7;font-size:11px}.rb-detail-location-copy span{display:block;margin-top:4px;color:#7f8d76;font-size:9px}.rb-detail-map-link{display:inline-flex;align-items:center;justify-content:center;min-width:170px;padding:10px 12px;border:1px solid #5e7a53;background:#152012;color:#c8e1aa;text-decoration:none;font-size:10px;font-weight:900;white-space:nowrap}.rb-detail-map-link:hover{background:#1c2918;border-color:#7d9d6f;color:#e2f3cb}
    .rb-detail-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.rb-detail-action{padding:11px 14px;border:1px solid #6f562e;background:#17130c;color:#d8ad59;font-size:10px;font-weight:900;cursor:pointer}.rb-detail-action.active{background:#33240f;border-color:#aa7a34}.rb-detail-killed{margin-left:auto;border-color:#496137;background:#12200f;color:#acd678}.rb-detail-message{min-height:16px;margin-top:10px;color:#9f8f72;font-size:10px}
    @media(max-width:700px){.rb-detail-layer{padding:8px}.rb-detail-body{padding:12px}.rb-detail-hero{grid-template-columns:1fr}.rb-detail-image{height:230px}.rb-detail-title h2{font-size:20px}.rb-detail-grid{grid-template-columns:1fr}.rb-detail-location{align-items:stretch;flex-direction:column}.rb-detail-map-link{width:100%;box-sizing:border-box}.rb-detail-killed{margin-left:0;width:100%}}
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.className = 'rb-detail-layer';
  layer.innerHTML = '<div class="rb-detail-shell"><div class="rb-detail-top"><small>SZCZEGÓŁY RAID BOSSA</small><button class="rb-detail-close" type="button" aria-label="Zamknij">×</button></div><div class="rb-detail-body"><div class="rb-detail-loading">Ładowanie…</div></div></div>';
  document.body.appendChild(layer);

  let activeId = null;
  let currentUser = null;
  let currentProfile = null;

  const body = () => layer.querySelector('.rb-detail-body');
  const close = () => { layer.classList.remove('open'); activeId = null; document.body.style.removeProperty('overflow'); };

  async function context() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user || null;
    currentProfile = null;
    if (currentUser) {
      const { data } = await supabase.from('profiles').select('nickname,role,status').eq('id', currentUser.id).maybeSingle();
      currentProfile = data || null;
    }
  }

  async function loadDetails(id) {
    activeId = Number(id);
    layer.classList.add('open');
    document.body.style.overflow = 'hidden';
    body().innerHTML = '<div class="rb-detail-loading">Ładowanie szczegółów…</div>';
    await context();

    const [{ data: request, error }, { data: helpers }] = await Promise.all([
      supabase.from('raid_boss_requests').select('id,user_id,nickname,boss_name,boss_level,note,status,created_at,expires_at,window_start').eq('id', activeId).maybeSingle(),
      supabase.from('raid_boss_helpers').select('id,user_id,nickname,created_at').eq('request_id', activeId).order('created_at', { ascending: true }),
    ]);

    if (error || !request) {
      body().innerHTML = '<div class="rb-detail-empty">Nie udało się wczytać tego zgłoszenia.</div>';
      return;
    }

    const helperList = helpers || [];
    const helping = helperList.some(h => h.user_id === currentUser?.id);
    const role = String(currentProfile?.role || '').toLowerCase();
    const canClose = currentProfile?.status === 'approved' && (request.user_id === currentUser?.id || ['owner','admin','leader'].includes(role));
    const canHelp = currentProfile?.status === 'approved' && !!currentUser;
    const state = windowState(request.window_start);
    const locationUrl = raidBossWikiUrl(request.boss_name);

    body().innerHTML = `
      <div class="rb-detail-hero">
        <div class="rb-detail-image" data-rb-detail-image></div>
        <div class="rb-detail-title">
          <h2>${esc(request.boss_name)}</h2>
          <span class="rb-detail-level">Lv. ${request.boss_level}</span><span class="rb-detail-state ${state.cls}">${state.label}</span>
          <div class="rb-detail-grid">
            <div class="rb-detail-cell"><span>Okno RB</span><b>${esc(windowText(request.window_start))}</b></div>
            <div class="rb-detail-cell"><span>Zgłosił</span><b>${esc(request.nickname)}</b></div>
            <div class="rb-detail-cell"><span>Dodano</span><b>${esc(warsawDateTime(request.created_at))}</b></div>
            <div class="rb-detail-cell"><span>Chętni</span><b>${helperList.length}</b></div>
          </div>
          ${request.note ? `<div class="rb-detail-note">${esc(request.note)}</div>` : ''}
        </div>
      </div>
      <div class="rb-detail-section">
        <h4>LOKALIZACJA</h4>
        <div class="rb-detail-location">
          <div class="rb-detail-location-copy"><b>Spawn tego Raid Bossa</b><span>Otwórz stronę Interlude z sekcją MAP i dokładną lokalizacją spawnu.</span></div>
          <a class="rb-detail-map-link" href="${esc(locationUrl)}" target="_blank" rel="noopener noreferrer">📍 OTWÓRZ MAPĘ SPAWNU</a>
        </div>
      </div>
      <div class="rb-detail-section">
        <h4>OSOBY, KTÓRE POMOGĄ</h4>
        <div class="rb-detail-helper-list">${helperList.length ? helperList.map(h => `<span class="rb-detail-helper">${esc(h.nickname)}</span>`).join('') : '<span class="rb-detail-empty">Na razie nikt się nie zgłosił.</span>'}</div>
      </div>
      <div class="rb-detail-actions">
        ${canHelp ? `<button class="rb-detail-action ${helping ? 'active' : ''}" type="button" data-rb-detail-help>${helping ? '✓ POMAGAM' : '+ POMOGĘ'}</button>` : ''}
        ${canClose && request.status === 'open' ? '<button class="rb-detail-action rb-detail-killed" type="button" data-rb-detail-killed>✓ OZNACZ JAKO ZABITY</button>' : ''}
      </div>
      <div class="rb-detail-message"></div>`;

    mountRealImage(body().querySelector('[data-rb-detail-image]'), request.boss_name);
  }

  async function toggleHelp() {
    if (!activeId || !currentUser || currentProfile?.status !== 'approved') return;
    const { data: existing } = await supabase.from('raid_boss_helpers').select('id').eq('request_id', activeId).eq('user_id', currentUser.id).maybeSingle();
    const message = body().querySelector('.rb-detail-message');
    if (message) message.textContent = 'Zapisywanie…';
    let error;
    if (existing?.id) ({ error } = await supabase.from('raid_boss_helpers').delete().eq('id', existing.id));
    else ({ error } = await supabase.from('raid_boss_helpers').insert({ request_id: activeId, user_id: currentUser.id, nickname: currentProfile.nickname || 'Gracz' }));
    if (error) { if (message) message.textContent = `Błąd: ${error.message}`; return; }
    window.dispatchEvent(new CustomEvent('ob:needed-rb-changed'));
    document.querySelector('#memberZoneLayer [data-zone-view="needed-rb"]')?.click();
    await loadDetails(activeId);
  }

  async function markKilled() {
    if (!activeId || !window.confirm('Oznaczyć tego Raid Bossa jako zabitego?')) return;
    const message = body().querySelector('.rb-detail-message');
    if (message) message.textContent = 'Zapisywanie…';
    const { error } = await supabase.from('raid_boss_requests').update({ status: 'closed' }).eq('id', activeId);
    if (error) { if (message) message.textContent = `Błąd: ${error.message}`; return; }
    document.querySelector(`[data-rb-request="${activeId}"]`)?.remove();
    document.querySelector(`[data-needed-rb-row="${activeId}"]`)?.remove();
    window.dispatchEvent(new CustomEvent('ob:needed-rb-changed'));
    close();
    setTimeout(() => document.querySelector('#memberZoneLayer [data-zone-view="needed-rb"]')?.click(), 40);
  }

  document.addEventListener('click', event => {
    const interactive = event.target.closest('button,a,input,select,textarea,label');
    if (!interactive) {
      const card = event.target.closest('[data-rb-request]');
      if (card) { loadDetails(card.dataset.rbRequest); return; }
      const row = event.target.closest('[data-needed-rb-row]');
      if (row) { loadDetails(row.dataset.neededRbRow); return; }
    }
  });

  layer.addEventListener('click', event => {
    if (event.target === layer || event.target.closest('.rb-detail-close')) { close(); return; }
    if (event.target.closest('[data-rb-detail-help]')) { toggleHelp(); return; }
    if (event.target.closest('[data-rb-detail-killed]')) markKilled();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && layer.classList.contains('open')) close(); });
}

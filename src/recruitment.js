import { canAccessClanView, switchClanView } from './clanViewAccess.js';
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export function installRecruitment(supabase) {
  if (!supabase || window.__obRecruitmentInstalled) return;
  window.__obRecruitmentInstalled = true;

  const authLayer = document.querySelector('#memberAuthLayer');
  const authBox = authLayer?.querySelector('.member-auth-box');
  const zone = document.querySelector('#memberZoneLayer');
  if (!authLayer || !authBox || !zone) return;

  const style = document.createElement('style');
  style.id = 'obRecruitmentStyles';
  style.textContent = `
    #memberAuthLayer{overflow:auto}
    .ob-recruit-entry{width:100%;margin-top:10px;padding:14px;border:1px solid #775c2d;background:linear-gradient(180deg,#17130c,#0b0d0d);color:#e6bf6b;font-size:10px;font-weight:900;letter-spacing:.08em;cursor:pointer}
    .ob-recruit-entry:hover{border-color:#c99640;color:#f0d084}
    .ob-recruit-form-box{display:none;margin-top:16px;padding-top:16px;border-top:1px solid #3b301f;text-align:left}
    .ob-recruit-form-box.open{display:block}
    .ob-recruit-form-box h3{margin:0 0 5px;color:#e7c574;font:700 18px Georgia,serif;text-align:center}
    .ob-recruit-form-box>p{margin:0 0 12px;color:#858078;font-size:11px;line-height:1.5;text-align:center}
    .ob-recruit-form-box label{display:block;margin:10px 0;color:#a79f90;font-size:10px;font-weight:800}
    .ob-recruit-form-box input,.ob-recruit-form-box textarea{box-sizing:border-box;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #423729;background:#080c0c;color:#eee;font:inherit;resize:vertical}
    .ob-recruit-form-box textarea{min-height:88px}
    .ob-recruit-form-box .ob-recruit-actions{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:10px;padding-top:0;border-top:0}
    .ob-recruit-send,.ob-recruit-cancel{padding:12px;border:1px solid #8c672d;background:linear-gradient(#3b2812,#21170b);color:#f0cb78;font-weight:900;cursor:pointer}
    .ob-recruit-cancel{border-color:#3f392f;background:#0b0e0e;color:#8e887d}
    .ob-recruit-feedback{min-height:18px;margin:8px 0 0!important;color:#d8b15e!important;font-size:11px!important;text-align:left!important}
    .ob-recruit-hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
    .ob-recruit-nav{position:relative}
    .ob-recruit-badge{display:none;min-width:18px;margin-left:auto;padding:2px 5px;border-radius:999px;background:#9a342a;color:#fff;font-size:9px;text-align:center}
    .ob-recruit-badge.show{display:inline-block}
    .ob-recruit-toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:14px 0}
    .ob-recruit-toolbar button{padding:8px 10px;border:1px solid #5a482b;background:#0d1010;color:#d6b46d;font-size:10px;font-weight:800;cursor:pointer}
    .ob-recruit-list{display:grid;gap:10px}
    .ob-recruit-card{padding:15px 16px;border:1px solid #3b3020;background:linear-gradient(135deg,#0d1111,#080b0b)}
    .ob-recruit-card.new{border-color:#725326;box-shadow:inset 3px 0 0 #b78535}
    .ob-recruit-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}
    .ob-recruit-head h4{margin:0;color:#eee3d2;font:700 17px Georgia,serif}
    .ob-recruit-head small{display:block;margin-top:4px;color:#716c63;font-size:9px}
    .ob-recruit-status{padding:5px 7px;border:1px solid #5f4a28;color:#d8b15e;font-size:9px;font-weight:900;white-space:nowrap}
    .ob-recruit-status.contacted{border-color:#315f6d;color:#7dc6d9}.ob-recruit-status.closed{border-color:#3b5440;color:#82bd8d}
    .ob-recruit-contact{margin:10px 0 0;color:#caa95e;font-size:10px;font-weight:800}
    .ob-recruit-message{margin:9px 0 0;color:#a9a39a;font-size:11px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    .ob-recruit-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px;padding-top:11px;border-top:1px solid #292319}
    .ob-recruit-card-actions button{padding:8px 10px;border:1px solid #564426;background:#12100c;color:#d1aa58;font-size:9px;font-weight:900;cursor:pointer}
    .ob-recruit-card-actions button.active{border-color:#bb8734;background:#2d1e0c;color:#f0ca79}
    .ob-recruit-card-actions [data-recruit-delete]{border-color:#884239;color:#ef9c8c;margin-left:auto;min-height:40px}.ob-recruit-delete-error{color:#ef9c8c;font-size:13px}
    .ob-recruit-empty{padding:34px;border:1px dashed #514328;color:#8d8067;text-align:center}
    @media(max-width:900px){
      .member-zone-side.ob-recruit-ready{grid-template-columns:repeat(5,1fr)!important}
      .ob-recruit-nav{min-width:0}.ob-recruit-nav span:not(.ob-recruit-badge){display:none}
      .ob-recruit-head{display:grid;grid-template-columns:1fr auto}
    }
    @media(max-width:480px){.member-auth-box{padding:24px 18px!important}.ob-recruit-form-box .ob-recruit-actions{grid-template-columns:1fr}.ob-recruit-cancel{order:2}.ob-recruit-toolbar{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'ob-recruit-entry';
  entry.textContent = '⚔ CHCESZ DOŁĄCZYĆ DO KLANU? NAPISZ DO NAS';
  authBox.appendChild(entry);

  const formWrap = document.createElement('section');
  formWrap.className = 'ob-recruit-form-box';
  formWrap.innerHTML = `
    <h3>Dołącz do Orła Białego</h3>
    <p>Zostaw nick i kilka słów o sobie. Liderzy zobaczą wiadomość i odezwiemy się do Ciebie w grze lub przez podany kontakt.</p>
    <form id="obRecruitForm" autocomplete="off">
      <label>Nick w grze *<input id="obRecruitNick" maxlength="24" required placeholder="np. KiRY"></label>
      <label>Kontakt (opcjonalnie)<input id="obRecruitContact" maxlength="120" placeholder="np. nick na Discordzie"></label>
      <label>Wiadomość *<textarea id="obRecruitMessage" maxlength="1000" required placeholder="Napisz krótko kim grasz, czego szukasz i kiedy zwykle jesteś online."></textarea></label>
      <label class="ob-recruit-hp" aria-hidden="true">Strona<input id="obRecruitWebsite" tabindex="-1" autocomplete="off"></label>
      <div class="ob-recruit-actions"><button class="ob-recruit-send" type="submit">WYŚLIJ ZGŁOSZENIE</button><button class="ob-recruit-cancel" type="button">Anuluj</button></div>
      <p id="obRecruitFeedback" class="ob-recruit-feedback" role="status" aria-live="polite"></p>
    </form>`;
  authBox.appendChild(formWrap);

  const openPublicForm = () => {
    formWrap.classList.add('open');
    entry.hidden = true;
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => formWrap.querySelector('#obRecruitNick')?.focus(), 250);
  };

  const nav = document.createElement('button');
  nav.type = 'button';
  nav.className = 'zone-nav ob-recruit-nav';
  nav.dataset.zoneView = 'recruitment';
  nav.hidden = true;
  nav.innerHTML = '✉ <span>Rekrutacja</span><b class="ob-recruit-badge">0</b>';
  zone.querySelector('.zone-side-spacer')?.before(nav);
  zone.querySelector('.member-zone-side')?.classList.add('ob-recruit-ready');

  const panel = document.createElement('section');
  panel.className = 'zone-view';
  panel.dataset.zonePanel = 'recruitment';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="zone-section-head"><small>DOWÓDZTWO KLANU</small><h3>REKRUTACJA</h3><p>Wiadomości od osób, które chcą dołączyć do klanu.</p></div>
    <div class="ob-recruit-toolbar"><span id="obRecruitSummary" class="zone-muted">Ładowanie…</span><button id="obRecruitRefresh" type="button">↻ ODŚWIEŻ</button></div>
    <div id="obRecruitList" class="ob-recruit-list"><div class="ob-recruit-empty">Brak zgłoszeń.</div></div>`;
  zone.querySelector('.member-zone-main')?.appendChild(panel);

  const publicForm = formWrap.querySelector('#obRecruitForm');
  const publicFeedback = formWrap.querySelector('#obRecruitFeedback');
  const sendButton = formWrap.querySelector('.ob-recruit-send');
  const statusLabels = { new: 'NOWE', contacted: 'SKONTAKTOWANO', closed: 'ZAMKNIĘTE' };

  const closePublicForm = () => {
    formWrap.classList.remove('open');
    entry.hidden = false;
  };

  entry.addEventListener('click', openPublicForm);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-ob-recruit-write]')) {
      event.preventDefault();
      openPublicForm();
    }
  });
  formWrap.querySelector('.ob-recruit-cancel')?.addEventListener('click', closePublicForm);

  publicForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nickname = formWrap.querySelector('#obRecruitNick').value.trim();
    const contact = formWrap.querySelector('#obRecruitContact').value.trim();
    const message = formWrap.querySelector('#obRecruitMessage').value.trim();
    const honeypot = formWrap.querySelector('#obRecruitWebsite').value.trim();
    if (honeypot) return;
    if (!/^[A-Za-z0-9_\- .]{2,24}$/.test(nickname)) {
      publicFeedback.textContent = 'Podaj poprawny nick w grze (2–24 znaki).';
      return;
    }
    if (message.length < 3) {
      publicFeedback.textContent = 'Napisz krótką wiadomość.';
      return;
    }
    const lastSent = Number(localStorage.getItem('obRecruitLastSent') || 0);
    if (Date.now() - lastSent < 60000) {
      publicFeedback.textContent = 'Wiadomość została już niedawno wysłana. Spróbuj ponownie za chwilę.';
      return;
    }
    sendButton.disabled = true;
    publicFeedback.textContent = 'Wysyłanie…';
    const { error } = await supabase.from('recruitment_messages').insert({
      nickname,
      contact: contact || null,
      message,
    });
    sendButton.disabled = false;
    if (error) {
      console.error('RECRUITMENT INSERT FAILED', error);
      publicFeedback.textContent = 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.';
      return;
    }
    localStorage.setItem('obRecruitLastSent', String(Date.now()));
    publicForm.reset();
    publicFeedback.textContent = '✓ Zgłoszenie wysłane. Dzięki! Liderzy klanu zobaczą Twoją wiadomość.';
  });

  async function readProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data } = await supabase.from('profiles').select('id,nickname,role,status').eq('id', session.user.id).maybeSingle();
    return data || null;
  }

  async function isStaff() {
    const profile = await readProfile();
    return canAccessClanView(profile, 'recruitment');
  }

  async function loadRecruitment() {
    if (!await isStaff()) return;
    const list = panel.querySelector('#obRecruitList');
    const summary = panel.querySelector('#obRecruitSummary');
    list.innerHTML = '<div class="ob-recruit-empty">Ładowanie zgłoszeń…</div>';
    const { data, error } = await supabase
      .from('recruitment_messages')
      .select('id,nickname,contact,message,status,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('RECRUITMENT LOAD FAILED', error);
      list.innerHTML = '<div class="ob-recruit-empty">Nie udało się pobrać zgłoszeń.</div>';
      return;
    }
    if (!await isStaff()) return;
    const rows = data || [];
    const newCount = rows.filter((row) => row.status === 'new').length;
    const badge = nav.querySelector('.ob-recruit-badge');
    badge.textContent = String(newCount);
    badge.classList.toggle('show', newCount > 0);
    summary.textContent = `${rows.length} zgłoszeń · ${newCount} nowych`;
    if (!rows.length) {
      list.innerHTML = '<div class="ob-recruit-empty">Na razie nie ma żadnych zgłoszeń.</div>';
      return;
    }
    list.innerHTML = rows.map((row) => {
      const created = new Date(row.created_at).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
      const contact = row.contact ? `<div class="ob-recruit-contact">Kontakt: ${esc(row.contact)}</div>` : '<div class="ob-recruit-contact">Kontakt: przez nick w grze</div>';
      return `<article class="ob-recruit-card ${esc(row.status)}" data-recruit-id="${row.id}">
        <div class="ob-recruit-head"><div><h4>${esc(row.nickname)}</h4><small>${esc(created)}</small></div><span class="ob-recruit-status ${esc(row.status)}">${statusLabels[row.status] || esc(row.status)}</span></div>
        ${contact}<p class="ob-recruit-message">${esc(row.message)}</p>
        <div class="ob-recruit-card-actions">
          <button type="button" data-recruit-status="new" class="${row.status === 'new' ? 'active' : ''}">NOWE</button>
          <button type="button" data-recruit-status="contacted" class="${row.status === 'contacted' ? 'active' : ''}">SKONTAKTOWANO</button>
          <button type="button" data-recruit-status="closed" class="${row.status === 'closed' ? 'active' : ''}">ZAMKNIĘTE</button>
          <button type="button" data-recruit-delete aria-label="Usuń zgłoszenie: ${esc(row.nickname)}">USUŃ</button>
        </div></article>`;
    }).join('');
  }

  async function syncStaffUi() {
    const allowed = await isStaff();
    nav.hidden = !allowed;
    panel.hidden = !allowed;
    if (allowed) await loadRecruitment();
    else {
      panel.querySelector('#obRecruitList').innerHTML = '';
      panel.querySelector('#obRecruitSummary').textContent = '';
      nav.querySelector('.ob-recruit-badge')?.classList.remove('show');
      if (panel.classList.contains('active')) {
        switchClanView(zone, null, 'home');
      }
    }
  }

  panel.querySelector('#obRecruitRefresh')?.addEventListener('click', loadRecruitment);
  nav.addEventListener('click', () => setTimeout(loadRecruitment, 0));
  panel.addEventListener('click', async (event) => {
    const remove = event.target.closest('[data-recruit-delete]');
    if (remove) {
      if (remove.disabled || !await isStaff()) return;
      const card = remove.closest('[data-recruit-id]');
      const id = Number(card?.dataset.recruitId);
      if (!id || !window.confirm(`Usunąć zgłoszenie „${card.querySelector('h4').textContent}”? Tej operacji nie można cofnąć.`)) return;
      remove.disabled = true;
      card.querySelector('.ob-recruit-delete-error')?.remove();
      try {
        const { data, error } = await supabase.from('recruitment_messages').delete().eq('id', id).select('id');
        if (error || !data?.length) throw new Error('Nie udało się usunąć zgłoszenia. Odśwież listę i spróbuj ponownie.');
        await loadRecruitment();
      } catch (error) {
        const message = document.createElement('p');
        message.className = 'ob-recruit-delete-error'; message.setAttribute('role', 'alert');
        message.textContent = 'Nie udało się usunąć zgłoszenia. Spróbuj ponownie.';
        card.appendChild(message);
      } finally { remove.disabled = false; }
      return;
    }
    const button = event.target.closest('[data-recruit-status]');
    if (!button || !await isStaff()) return;
    const card = button.closest('[data-recruit-id]');
    const id = Number(card?.dataset.recruitId);
    const nextStatus = button.dataset.recruitStatus;
    if (!id || !['new', 'contacted', 'closed'].includes(nextStatus)) return;
    button.disabled = true;
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('recruitment_messages').update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      handled_by: session?.user?.id || null,
    }).eq('id', id);
    button.disabled = false;
    if (error) {
      console.error('RECRUITMENT UPDATE FAILED', error);
      return;
    }
    await loadRecruitment();
  });

  supabase.auth.onAuthStateChange(() => {nav.hidden=true;panel.hidden=true;panel.querySelector('#obRecruitList').innerHTML='';if(panel.classList.contains('active'))switchClanView(zone,null,'home');setTimeout(syncStaffUi,0)});
  syncStaffUi();
}

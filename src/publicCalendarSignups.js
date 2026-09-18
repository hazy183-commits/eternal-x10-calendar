import { supabase } from './supabaseClient.js';
import { getClanUpcomingEvents, signupIdentity } from './clanEventFeed.js';

// Public signup roster UI v5 — isolated from member/admin modules.
(function bootPublicCalendarSignups(){
  try {
    if (!supabase || window.__publicCalendarSignupsStarted) return;
    window.__publicCalendarSignupsStarted = true;

    const state = { rows: new Map() };
    const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const keyFor = row => String(row?.event_id ?? row?.schedule_key ?? '');
    const norm = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

    const style = document.createElement('style');
    style.textContent = `
      .public-signup-count{display:inline-flex!important;align-items:center!important;gap:8px!important;margin-top:10px!important;padding:7px 10px!important;border:1px solid #3f8a51!important;border-radius:5px!important;background:linear-gradient(180deg,#17301d,#0e1d13)!important;color:#e7f7e9!important;font:900 10px/1 Inter,Arial,sans-serif!important;letter-spacing:.045em!important;cursor:pointer;transition:border-color .15s ease,background .15s ease,transform .15s ease,box-shadow .15s ease;box-shadow:inset 0 0 0 1px #0008,0 3px 12px #0007,0 0 14px #53c86b20!important;white-space:nowrap}
      .public-signup-count:hover{border-color:#66bd78!important;background:linear-gradient(180deg,#1d3c25,#102519)!important;transform:translateY(-1px);box-shadow:inset 0 0 0 1px #0008,0 5px 16px #0008,0 0 16px #53c86b35!important}
      .public-signup-count:focus-visible{outline:1px solid #89d89a;outline-offset:2px}
      .public-signup-count .psc-icon{display:grid!important;place-items:center!important;flex:0 0 22px!important;width:22px!important;height:22px!important;border:1px solid #4f9d61!important;border-radius:4px!important;background:#0b170f!important;color:#9af0aa!important;font-size:12px!important;line-height:1!important}
      .public-signup-count .psc-main{display:inline-flex!important;align-items:baseline!important;gap:5px!important;color:#d8f0dc!important;text-transform:uppercase!important}
      .public-signup-count .psc-main b{color:#a4f5b4!important;font:800 18px/1 Cinzel,Georgia,serif!important;text-shadow:0 0 10px #65d87a66!important}
      .public-signup-count .psc-maybe{display:inline-flex!important;align-items:center!important;min-height:22px!important;padding:5px 7px!important;border:1px solid #8a6a2d!important;border-radius:3px!important;background:#211a0d!important;color:#f0c86b!important;font-size:9px!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.04em!important}
      .public-signup-count .psc-chevron{color:#b8d9bd!important;font-size:14px!important;margin-left:1px!important}
      .public-signup-dialog{width:min(680px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 28px));padding:0;border:1px solid #8d6a2f;border-radius:4px;background:#080c0c;color:#ddd;box-shadow:0 28px 90px #000,0 0 0 1px #000}
      .public-signup-dialog::backdrop{background:#000c;backdrop-filter:blur(4px)}
      .psc-head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:20px 22px 17px;border-bottom:1px solid #463720;background:radial-gradient(circle at 18% 0,#4e36161f,transparent 42%),linear-gradient(180deg,#1a160e,#0a0d0d)}
      .psc-head:after{content:"";position:absolute;left:22px;right:22px;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,#a47d36,transparent)}
      .psc-kicker{display:block;color:#c99b45;font-size:8px;font-weight:900;letter-spacing:.18em}.psc-head h3{margin:5px 0 0;color:#f0e7d8;font:700 22px/1.15 Cinzel,Georgia,serif;letter-spacing:.02em}.psc-meta{margin-top:6px;color:#8f887b;font-size:9px;letter-spacing:.035em}
      .psc-close{display:grid;place-items:center;flex:0 0 auto;border:1px solid #5d4928;border-radius:2px;background:#0a0d0d;color:#caaa67;width:34px;height:34px;font-size:20px;line-height:1;cursor:pointer}.psc-close:hover{border-color:#a37b36;color:#f0c971;background:#16130d}
      .psc-body{padding:18px 22px 22px;overflow:auto;max-height:620px}.psc-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:18px}.psc-pill{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border:1px solid #463821;background:linear-gradient(180deg,#101412,#0a0d0c);font-size:9px;font-weight:900;letter-spacing:.04em}.psc-pill strong{font-size:18px;font-family:Cinzel,Georgia,serif}.psc-pill.yes{color:#80dc94;border-color:#2f7040}.psc-pill.yes strong{color:#98f1aa}.psc-pill.maybe{color:#deb95b;border-color:#765d24}.psc-pill.maybe strong{color:#f1cf71}
      .psc-group{margin-top:18px}.psc-group h4{display:flex;align-items:center;gap:9px;margin:0 0 9px;font-size:10px;letter-spacing:.11em;text-transform:uppercase}.psc-group h4:after{content:"";height:1px;flex:1}.psc-group.yes h4{color:#79d98d}.psc-group.yes h4:after{background:linear-gradient(90deg,#2e7040,transparent)}.psc-group.maybe h4{color:#ddb95f}.psc-group.maybe h4:after{background:linear-gradient(90deg,#765c25,transparent)}
      .psc-roster{display:grid;gap:8px}.psc-person{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:16px;align-items:center;padding:12px 13px;border:1px solid #302a20;border-left-width:3px;border-radius:3px;background:linear-gradient(90deg,#0d1110,#090c0c);box-shadow:inset 0 0 0 1px #0005;transition:background .15s ease,border-color .15s ease,transform .15s ease}.psc-roster.yes .psc-person{border-left-color:#3d8b50}.psc-roster.maybe .psc-person{border-left-color:#9a782d}.psc-person:hover{background:#121611;transform:translateX(1px);border-color:#4a402d}.psc-person-id{display:flex;align-items:center;gap:11px;min-width:0}.psc-avatar{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border:1px solid #66502b;border-radius:50%;background:radial-gradient(circle at 35% 25%,#3a2d16,#11130f 72%);color:#f0ca73;font:800 13px/1 Cinzel,Georgia,serif;box-shadow:inset 0 0 0 2px #0008}.psc-person-copy{min-width:0}.psc-person-copy b{display:block;overflow:hidden;text-overflow:ellipsis;color:#f1eadf;font-size:12px;line-height:1.2;white-space:nowrap}.psc-person-copy small{display:block;margin-top:3px;color:#777167;font-size:8px;letter-spacing:.04em;text-transform:uppercase}.psc-badges{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}.psc-badge{display:inline-flex;align-items:center;min-height:24px;padding:5px 8px;border:1px solid #4b3d25;border-radius:2px;background:#0b0e0d;color:#cfc5b3;font-size:8px;font-weight:900;letter-spacing:.045em;white-space:nowrap}.psc-badge.class{border-color:#6c552d;color:#e2c77e;background:#17140e}.psc-badge.level{border-color:#334f68;color:#9bcaf0;background:#0d151d}.psc-badge.role{border-color:#65422c;color:#e1a47d;background:#1a100c}.psc-badge.muted{color:#777168;border-color:#383229;background:#0a0d0d;font-weight:700}.psc-empty{padding:19px;border:1px dashed #4c3a20;color:#817a6d;text-align:center;font-size:10px;background:#0a0d0d}
      @media(max-width:700px){.public-signup-count{max-width:100%!important;flex-wrap:wrap!important;padding:7px 8px!important;gap:6px!important}.public-signup-count .psc-main b{font-size:16px!important}.psc-head{padding:16px}.psc-head h3{font-size:18px}.psc-head:after{left:16px;right:16px}.psc-body{padding:14px}.psc-summary{grid-template-columns:1fr 1fr}.psc-person{grid-template-columns:1fr;gap:10px;padding:11px}.psc-badges{justify-content:flex-start;padding-left:45px}.public-signup-dialog{width:min(96vw,680px)}}
      @media(max-width:430px){.public-signup-count .psc-chevron{display:none!important}.psc-summary{grid-template-columns:1fr}.psc-pill{padding:9px 10px}.psc-badges{padding-left:0}.psc-badge{font-size:7.5px;padding:5px 7px}.psc-person-copy b{font-size:11.5px}}
    `;
    document.head.appendChild(style);

    const dialog = document.createElement('dialog');
    dialog.className = 'public-signup-dialog';
    dialog.innerHTML = `<div class="psc-head"><div><span class="psc-kicker">ZAPISY KLANOWE</span><h3 id="pscTitle">Wydarzenie</h3><div class="psc-meta" id="pscMeta"></div></div><button class="psc-close" type="button" aria-label="Zamknij">×</button></div><div class="psc-body" id="pscBody"></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.psc-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

    function selectedDate(){
      return document.querySelector('#calendarWeek .calendar-day.selected')?.dataset.calendarDay || '';
    }

    function eventForRow(row){
      const name = norm(row.querySelector('.event-info h3')?.textContent);
      const time = String(row.querySelector('.event-time')?.textContent || '').trim();
      const type = norm(row.querySelector('.type-chip')?.textContent);
      const date = selectedDate();
      return getClanUpcomingEvents(new Date(Date.now() - 14 * 86400000)).find(event =>
        norm(event.name) === name &&
        String(event.time || '').trim() === time &&
        norm(event.type) === type &&
        (!date || String(event.date || '') === date)
      );
    }

    function grouped(event){
      const identity = signupIdentity(event.id);
      const key = String(identity.event_id ?? identity.schedule_key ?? '');
      const rows = state.rows.get(key) || [];
      return {
        yes: rows.filter(row => row.response === 'yes'),
        maybe: rows.filter(row => row.response === 'maybe')
      };
    }

    function personRow(person){
      const nick = person.nickname || 'Gracz';
      const initial = String(nick).trim().charAt(0).toUpperCase() || '•';
      const className = person.character_class ? String(person.character_class) : '';
      const level = person.character_level ? `Lv ${person.character_level}` : '';
      const role = person.party_role ? String(person.party_role).toUpperCase() : '';
      const badges = [
        className ? `<span class="psc-badge class">${esc(className)}</span>` : '',
        level ? `<span class="psc-badge level">${esc(level)}</span>` : '',
        role ? `<span class="psc-badge role">${esc(role)}</span>` : ''
      ].filter(Boolean).join('') || '<span class="psc-badge muted">Brak danych postaci</span>';
      return `<div class="psc-person"><div class="psc-person-id"><span class="psc-avatar">${esc(initial)}</span><div class="psc-person-copy"><b>${esc(nick)}</b><small>członek klanu</small></div></div><div class="psc-badges">${badges}</div></div>`;
    }

    function roster(rows, emptyText, tone){
      return rows.length ? `<div class="psc-roster ${tone}">${rows.map(personRow).join('')}</div>` : `<div class="psc-empty">${emptyText}</div>`;
    }

    function openList(event){
      const lists = grouped(event);
      dialog.querySelector('#pscTitle').textContent = event.name || 'Wydarzenie';
      dialog.querySelector('#pscMeta').textContent = [event.date || '', event.time || '', event.location || ''].filter(Boolean).join(' · ');
      dialog.querySelector('#pscBody').innerHTML = `
        <div class="psc-summary"><span class="psc-pill yes"><span>POTWIERDZENI</span><strong>${lists.yes.length}</strong></span><span class="psc-pill maybe"><span>MOŻE</span><strong>${lists.maybe.length}</strong></span></div>
        <section class="psc-group yes"><h4>Potwierdzeni gracze · ${lists.yes.length}</h4>${roster(lists.yes,'Nikt jeszcze nie potwierdził obecności.','yes')}</section>
        <section class="psc-group maybe"><h4>Może dołączyć · ${lists.maybe.length}</h4>${roster(lists.maybe,'Brak osób oznaczonych jako „może”.','maybe')}</section>
      `;
      if (typeof dialog.showModal === 'function') dialog.showModal();
    }

    function render(){
      try {
        document.querySelectorAll('#dailyEvents .event-row').forEach(row => {
          const info = row.querySelector('.event-info');
          if (!info) return;
          const event = eventForRow(row);
          let button = info.querySelector('.public-signup-count');
          if (!event) { button?.remove(); return; }
          const lists = grouped(event);
          if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'public-signup-count';
            info.appendChild(button);
          }
          const html = `<span class="psc-icon">♙</span><span class="psc-main"><b>${lists.yes.length}</b> zapisanych</span>${lists.maybe.length ? `<span class="psc-maybe">${lists.maybe.length} może</span>` : ''}<span class="psc-chevron">›</span>`;
          if (button.innerHTML !== html) button.innerHTML = html;
          button.title = 'Pokaż listę zapisanych graczy';
          button.setAttribute('aria-label', `${lists.yes.length} zapisanych${lists.maybe.length ? `, ${lists.maybe.length} może` : ''}. Pokaż listę graczy.`);
          button.onclick = () => openList(event);
        });
      } catch (error) {
        console.warn('Public signup render skipped', error);
      }
    }

    async function load(){
      try {
        const { data, error } = await supabase.from('event_signups').select('event_id,schedule_key,nickname,response,character_class,character_level,party_role');
        if (error) return;
        const next = new Map();
        (data || []).forEach(row => {
          const key = keyFor(row);
          if (!key) return;
          if (!next.has(key)) next.set(key, []);
          next.get(key).push(row);
        });
        state.rows = next;
        render();
      } catch (error) {
        console.warn('Public signup load skipped', error);
      }
    }

    const calendar = document.querySelector('#dailyEvents');
    if (calendar) new MutationObserver(() => render()).observe(calendar, { childList:true, subtree:false });
    document.querySelector('#calendarWeek')?.addEventListener('click', () => setTimeout(render, 0));
    document.querySelector('#filters')?.addEventListener('click', () => setTimeout(render, 0));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

    try {
      supabase.channel('public-calendar-signups-v3')
        .on('postgres_changes', { event:'*', schema:'public', table:'event_signups' }, () => load())
        .subscribe();
    } catch {}

    setTimeout(load, 1200);
    setInterval(load, 30000);
  } catch (error) {
    console.warn('Public calendar signups disabled', error);
  }
})();

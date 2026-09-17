import { supabase } from './supabaseClient.js';
import { getClanUpcomingEvents, signupIdentity } from './clanEventFeed.js';

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
      .public-signup-count{display:inline-flex;align-items:center;gap:7px;margin-top:8px;padding:6px 9px;border:1px solid #5e4928;border-radius:3px;background:linear-gradient(180deg,#171a15,#0d110f);color:#e9c66f;font:800 9px/1 Inter,Arial,sans-serif;letter-spacing:.035em;cursor:pointer;transition:border-color .15s ease,background .15s ease,transform .15s ease,box-shadow .15s ease;box-shadow:inset 0 0 0 1px #0007,0 2px 8px #0004;white-space:nowrap}
      .public-signup-count:hover{border-color:#b3863b;background:linear-gradient(180deg,#221c11,#12140f);color:#ffda80;transform:translateY(-1px);box-shadow:inset 0 0 0 1px #0007,0 4px 14px #0007,0 0 12px #b8872520}
      .public-signup-count:focus-visible{outline:1px solid #d7ad5c;outline-offset:2px}
      .public-signup-count .psc-icon{display:grid;place-items:center;width:16px;height:16px;border:1px solid #6b542d;background:#0a0e0d;color:#f0c565;font-size:10px;line-height:1}
      .public-signup-count .psc-main{color:#e8d5a8}.public-signup-count .psc-main b{color:#f3cf73;font-size:10px}.public-signup-count .psc-maybe{padding-left:6px;border-left:1px solid #413824;color:#b3aa97;font-weight:700}.public-signup-count .psc-chevron{color:#7f6c47;font-size:10px;margin-left:1px}
      .public-signup-dialog{width:min(620px,calc(100vw - 28px));max-height:min(720px,calc(100vh - 28px));padding:0;border:1px solid #8d6a2f;border-radius:4px;background:#080c0c;color:#ddd;box-shadow:0 28px 90px #000,0 0 0 1px #000}
      .public-signup-dialog::backdrop{background:#000c;backdrop-filter:blur(4px)}
      .psc-head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:20px 22px 17px;border-bottom:1px solid #463720;background:radial-gradient(circle at 18% 0,#4e36161f,transparent 42%),linear-gradient(180deg,#1a160e,#0a0d0d)}
      .psc-head:after{content:"";position:absolute;left:22px;right:22px;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,#a47d36,transparent)}
      .psc-kicker{display:block;color:#c99b45;font-size:8px;font-weight:900;letter-spacing:.18em}.psc-head h3{margin:5px 0 0;color:#f0e7d8;font:700 22px/1.15 Cinzel,Georgia,serif;letter-spacing:.02em}.psc-meta{margin-top:6px;color:#8f887b;font-size:9px;letter-spacing:.035em}
      .psc-close{display:grid;place-items:center;flex:0 0 auto;border:1px solid #5d4928;border-radius:2px;background:#0a0d0d;color:#caaa67;width:34px;height:34px;font-size:20px;line-height:1;cursor:pointer}.psc-close:hover{border-color:#a37b36;color:#f0c971;background:#16130d}
      .psc-body{padding:18px 22px 22px;overflow:auto;max-height:590px}.psc-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:18px}.psc-pill{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border:1px solid #463821;background:linear-gradient(180deg,#101412,#0a0d0c);font-size:9px;font-weight:900;letter-spacing:.04em}.psc-pill strong{font-size:16px;font-family:Cinzel,Georgia,serif}.psc-pill.yes{color:#80dc94;border-color:#2f7040}.psc-pill.yes strong{color:#98f1aa}.psc-pill.maybe{color:#deb95b;border-color:#765d24}.psc-pill.maybe strong{color:#f1cf71}
      .psc-group{margin-top:16px}.psc-group h4{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:#c9a45a;font-size:9px;letter-spacing:.11em;text-transform:uppercase}.psc-group h4:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,#4c3b22,transparent)}
      .psc-roster{overflow:hidden;border:1px solid #2d281d;background:#090c0c}.psc-person{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 12px;border-top:1px solid #252118;background:linear-gradient(90deg,#0b0e0d,#090c0c)}.psc-person:first-child{border-top:0}.psc-person:hover{background:#10130f}.psc-person b{color:#eee7db;font-size:11px}.psc-person span{color:#898277;font-size:9px;text-align:right}.psc-person span:empty{display:none}.psc-empty{padding:19px;border:1px dashed #4c3a20;color:#817a6d;text-align:center;font-size:10px;background:#0a0d0d}
      @media(max-width:700px){.public-signup-count{max-width:100%;font-size:8px;padding:6px 7px;gap:5px}.public-signup-count .psc-maybe{padding-left:5px}.psc-head{padding:16px}.psc-head h3{font-size:18px}.psc-head:after{left:16px;right:16px}.psc-body{padding:14px}.psc-summary{grid-template-columns:1fr 1fr}.psc-person{grid-template-columns:1fr;gap:3px}.psc-person span{text-align:left}.public-signup-dialog{width:min(96vw,620px)}}
      @media(max-width:430px){.public-signup-count .psc-chevron{display:none}.psc-summary{grid-template-columns:1fr}.psc-pill{padding:9px 10px}}
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
      const details = [person.character_class, person.character_level ? `Lv ${person.character_level}` : '', person.party_role ? String(person.party_role).toUpperCase() : ''].filter(Boolean).join(' · ');
      return `<div class="psc-person"><b>${esc(nick)}</b><span>${esc(details || 'Brak danych klasy')}</span></div>`;
    }

    function roster(rows, emptyText){
      return rows.length ? `<div class="psc-roster">${rows.map(personRow).join('')}</div>` : `<div class="psc-empty">${emptyText}</div>`;
    }

    function openList(event){
      const lists = grouped(event);
      dialog.querySelector('#pscTitle').textContent = event.name || 'Wydarzenie';
      dialog.querySelector('#pscMeta').textContent = [event.date || '', event.time || '', event.location || ''].filter(Boolean).join(' · ');
      dialog.querySelector('#pscBody').innerHTML = `
        <div class="psc-summary"><span class="psc-pill yes"><span>POTWIERDZENI</span><strong>${lists.yes.length}</strong></span><span class="psc-pill maybe"><span>MOŻE</span><strong>${lists.maybe.length}</strong></span></div>
        <section class="psc-group"><h4>Potwierdzeni gracze</h4>${roster(lists.yes,'Nikt jeszcze nie potwierdził obecności.')}</section>
        <section class="psc-group"><h4>Może dołączyć</h4>${roster(lists.maybe,'Brak osób oznaczonych jako „może”.')}</section>
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

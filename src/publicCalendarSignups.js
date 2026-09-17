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
      .public-signup-count{display:inline-flex;align-items:center;gap:7px;margin-top:7px;padding:5px 8px;border:1px solid #5f4826;background:#11130f;color:#e2bd68;font:800 9px/1.1 Inter,Arial,sans-serif;letter-spacing:.04em;cursor:pointer;transition:.15s ease}
      .public-signup-count:hover{border-color:#a77b32;background:#1b170e;color:#f4cf7b;transform:translateY(-1px)}
      .public-signup-count .psc-icon{font-size:11px;color:#f0c565}.public-signup-count .psc-maybe{color:#9c9588;font-weight:700}
      .public-signup-dialog{width:min(560px,calc(100vw - 28px));max-height:min(680px,calc(100vh - 28px));padding:0;border:1px solid #80602b;background:#080c0c;color:#ddd;box-shadow:0 28px 90px #000}
      .public-signup-dialog::backdrop{background:#000b;backdrop-filter:blur(3px)}
      .psc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:19px 20px 15px;border-bottom:1px solid #3b2f1e;background:linear-gradient(180deg,#18140d,#0a0d0d)}
      .psc-kicker{display:block;color:#c99b45;font-size:8px;font-weight:900;letter-spacing:.16em}.psc-head h3{margin:4px 0 0;color:#eee5d5;font:700 20px/1.15 Georgia,serif}
      .psc-close{border:1px solid #574526;background:#0a0d0d;color:#c6a45d;width:34px;height:34px;font-size:20px;cursor:pointer}
      .psc-body{padding:16px 20px 20px;overflow:auto;max-height:560px}.psc-summary{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.psc-pill{padding:6px 9px;border:1px solid #4a3a22;background:#0d1010;font-size:9px;font-weight:900}.psc-pill.yes{color:#78d08a;border-color:#2e6d3d}.psc-pill.maybe{color:#dfb95a;border-color:#725a20}
      .psc-group{margin-top:14px}.psc-group h4{margin:0 0 8px;color:#c8a358;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.psc-person{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:9px 10px;border-top:1px solid #262219;background:#0a0d0d}.psc-person:first-of-type{border-top:0}.psc-person b{color:#e2ddd3;font-size:11px}.psc-person span{color:#817b70;font-size:9px;text-align:right}.psc-empty{padding:18px;border:1px dashed #4c3a20;color:#817a6d;text-align:center;font-size:10px}
      @media(max-width:700px){.public-signup-count{font-size:8px;padding:5px 7px}.psc-body{padding:14px}.psc-person{grid-template-columns:1fr}.psc-person span{text-align:left}}
    `;
    document.head.appendChild(style);

    const dialog = document.createElement('dialog');
    dialog.className = 'public-signup-dialog';
    dialog.innerHTML = `<div class="psc-head"><div><span class="psc-kicker">ZAPISY KLANOWE</span><h3 id="pscTitle">Wydarzenie</h3></div><button class="psc-close" type="button" aria-label="Zamknij">×</button></div><div class="psc-body" id="pscBody"></div>`;
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

    function openList(event){
      const lists = grouped(event);
      dialog.querySelector('#pscTitle').textContent = event.name || 'Wydarzenie';
      dialog.querySelector('#pscBody').innerHTML = `
        <div class="psc-summary"><span class="psc-pill yes">BĘDZIE: ${lists.yes.length}</span><span class="psc-pill maybe">MOŻE: ${lists.maybe.length}</span></div>
        <section class="psc-group"><h4>Potwierdzeni</h4>${lists.yes.length ? lists.yes.map(personRow).join('') : '<div class="psc-empty">Nikt jeszcze nie potwierdził obecności.</div>'}</section>
        ${lists.maybe.length ? `<section class="psc-group"><h4>Może</h4>${lists.maybe.map(personRow).join('')}</section>` : ''}
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
          const html = `<span class="psc-icon">♙</span><span>${lists.yes.length} zapisanych</span>${lists.maybe.length ? `<span class="psc-maybe">· ${lists.maybe.length} może</span>` : ''}`;
          if (button.innerHTML !== html) button.innerHTML = html;
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

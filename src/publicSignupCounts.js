import { supabase } from './supabaseClient.js';
import { getClanUpcomingEvents, signupIdentity } from './clanEventFeed.js';

export function ensurePublicSignupCounts(){
  if(!supabase || window.__publicSignupCountsInstalled) return;
  window.__publicSignupCountsInstalled = true;

  let counts = new Map();
  let refreshTimer = null;

  const css = document.createElement('style');
  css.textContent = `
    .event-signup-count{display:flex;align-items:center;gap:6px;margin-top:6px;color:#d7b566;font-size:9px;font-weight:800;letter-spacing:.045em;text-transform:uppercase;line-height:1.2}
    .event-signup-count:before{content:'♙';display:grid;place-items:center;width:16px;height:16px;border:1px solid #735829;background:#17140d;color:#efc96f;font-size:10px}
    .event-signup-count .maybe{color:#8f887a;font-weight:700;text-transform:none;letter-spacing:0}
    .event-row[data-calendar-state="completed"] .event-signup-count{opacity:.65}
    @media(max-width:820px){.event-signup-count{font-size:8px;margin-top:5px}.event-signup-count:before{width:14px;height:14px;font-size:9px}}
  `;
  document.head.appendChild(css);

  const keyForRow = row => String(row?.event_id ?? row?.schedule_key ?? '');
  const norm = value => String(value || '').trim().replace(/\s+/g,' ').toLowerCase();

  function buildCounts(rows){
    counts = new Map();
    (rows || []).forEach(row => {
      const key = keyForRow(row);
      if(!key) return;
      const entry = counts.get(key) || {yes:0, maybe:0};
      if(row.response === 'yes') entry.yes += 1;
      if(row.response === 'maybe') entry.maybe += 1;
      counts.set(key, entry);
    });
  }

  function eventForCalendarRow(row){
    const name = norm(row.querySelector('.event-info h3')?.textContent);
    const time = String(row.querySelector('.event-time')?.textContent || '').trim();
    const type = norm(row.querySelector('.type-chip')?.textContent);
    return getClanUpcomingEvents(new Date(Date.now() - 24*60*60*1000)).find(event =>
      norm(event.name) === name && String(event.time || '').trim() === time && norm(event.type) === type
    );
  }

  function render(){
    document.querySelectorAll('#dailyEvents .event-row').forEach(row => {
      const info = row.querySelector('.event-info');
      if(!info) return;
      const event = eventForCalendarRow(row);
      let badge = info.querySelector('.event-signup-count');
      if(!event){ badge?.remove(); return; }
      const identity = signupIdentity(event.id);
      const key = String(identity.event_id ?? identity.schedule_key ?? '');
      const count = counts.get(key) || {yes:0, maybe:0};
      if(!badge){
        badge = document.createElement('div');
        badge.className = 'event-signup-count';
        info.appendChild(badge);
      }
      const word = count.yes === 1 ? 'zapisany' : 'zapisanych';
      badge.innerHTML = `<span>${count.yes} ${word}</span>${count.maybe ? `<span class="maybe">+ ${count.maybe} może</span>` : ''}`;
      badge.title = count.maybe ? `${count.yes} potwierdzonych, ${count.maybe} odpowiedzi „może”` : `${count.yes} potwierdzonych uczestników`;
    });
  }

  async function load(){
    const {data,error} = await supabase.from('event_signups').select('event_id,schedule_key,response');
    if(error){
      document.querySelectorAll('.event-signup-count').forEach(el=>el.remove());
      return;
    }
    buildCounts(data);
    render();
  }

  const calendar = document.querySelector('#dailyEvents');
  if(calendar){
    const observer = new MutationObserver(()=>render());
    observer.observe(calendar,{childList:true,subtree:true});
  }

  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) load(); });
  try{
    supabase.channel('public-calendar-signup-counts')
      .on('postgres_changes',{event:'*',schema:'public',table:'event_signups'},()=>load())
      .subscribe();
  }catch{}
  load();
  refreshTimer = setInterval(load,30000);
  window.addEventListener('beforeunload',()=>clearInterval(refreshTimer),{once:true});
}

export const installPublicSignupCounts = () => ensurePublicSignupCounts();

import { getClanUpcomingEvents, subscribeClanEvents } from './clanEventFeed.js';

const MONTHS=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
const WEEKDAYS=['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];

const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function eventDate(e){return String(e.event_date||e.date||'')}
function eventTime(e){return String(e.event_time||e.time||'').slice(0,5)}
function prettyDate(dateKey){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey||''));
  if(!m)return dateKey||'Bez daty';
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  return `${WEEKDAYS[d.getDay()]}, ${Number(m[3])} ${MONTHS[Number(m[2])-1]} ${m[1]}`;
}
function warsawDateKey(offsetDays=0){
  const now=new Date(Date.now()+offsetDays*86400000);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function relativeLabel(dateKey){
  const today=warsawDateKey(0), tomorrow=warsawDateKey(1);
  if(dateKey===today)return 'DZISIAJ';
  if(dateKey===tomorrow)return 'JUTRO';
  const a=new Date(`${today}T00:00:00`),b=new Date(`${dateKey}T00:00:00`);
  const diff=Math.round((b-a)/86400000);
  if(diff>1&&diff<7)return `ZA ${diff} DNI`;
  return 'DZIEŃ';
}
function activeFilter(){return document.querySelector('.admin-filter-btn.active')?.dataset.adminFilter||'Wszystkie'}
function filterMatches(e){
  const f=activeFilter();
  const q=document.querySelector('#adminSearch')?.value?.trim().toLowerCase()||'';
  if(f!=='Wszystkie'&&String(e.type||'')!==f)return false;
  if(q&&!`${e.name||''} ${e.boss||''} ${e.location||''}`.toLowerCase().includes(q))return false;
  return true;
}
function isDatabaseEvent(e){return /^\d+$/.test(String(e.id||''))}
function rowHtml(e){
  const date=eventDate(e),time=eventTime(e),editable=isDatabaseEvent(e);
  const actions=editable
    ? `<div><button class="edit-btn" data-edit="${esc(e.id)}">Edytuj</button><button class="delete-btn" data-delete="${esc(e.id)}">Usuń</button></div>`
    : `<div class="admin-auto-event"><span>AUTOMATYCZNE</span></div>`;
  return `<div class="admin-event ${editable?'':'admin-event-auto'}"><div class="admin-event-copy"><div class="event-thumb" data-boss-name="${esc(e.boss||e.name)}"><span>ART</span></div><div><b>${esc(e.name||'Wydarzenie')}</b><span>${esc(date)} · ${esc(time)} · ${esc(e.type||'Event')}</span><span>${esc(e.location||e.boss||'Brak lokalizacji')}</span></div></div>${actions}</div>`;
}

export function installAdminEventDayGroups(supabase){
  if(!supabase||window.__obAdminDayGroupsInstalled)return;
  window.__obAdminDayGroupsInstalled=true;
  const style=document.createElement('style');
  style.textContent=`#adminEventList{display:grid;gap:18px}.admin-day-group{border:1px solid #362d20;background:#080b0b;overflow:hidden}.admin-day-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 15px;background:linear-gradient(90deg,#231b0f,#111513);border-bottom:1px solid #4b3922}.admin-day-heading>div{display:flex;align-items:center;gap:10px;min-width:0}.admin-day-heading h3{margin:0;color:#ead9b8;font:700 16px Georgia,serif;text-transform:capitalize}.admin-day-heading>b{color:#b68c43;font-size:10px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em}.admin-day-relative{padding:5px 7px;border:1px solid #8b642c;background:#33230f;color:#f0c66e;font-size:8px;font-weight:900;letter-spacing:.08em;white-space:nowrap}.admin-day-events{display:grid}.admin-day-events .admin-event{border:0!important;border-bottom:1px solid #28231b!important;background:#0b0f0f!important;margin:0!important;padding:13px 14px!important}.admin-day-events .admin-event:last-child{border-bottom:0!important}.admin-day-events .admin-event:hover{background:#101514!important}.admin-event-auto{box-shadow:inset 3px 0 #66522f}.admin-auto-event{display:flex;align-items:center;justify-content:flex-end}.admin-auto-event span{padding:7px 9px;border:1px solid #4c412d;color:#9b8e72;font-size:8px;font-weight:900;letter-spacing:.08em}.admin-upcoming-empty{padding:20px;border:1px solid #362d20;background:#0b0f0f;text-align:center}@media(max-width:700px){#adminEventList{gap:13px}.admin-day-heading{align-items:flex-start;padding:11px}.admin-day-heading>div{align-items:flex-start;flex-direction:column;gap:5px}.admin-day-heading h3{font-size:14px}.admin-day-events .admin-event{padding:11px!important}.admin-day-events .admin-event>div:last-child{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}.admin-day-events .admin-event>div:last-child button{width:100%;margin:0!important}.admin-auto-event{display:flex!important;justify-content:flex-start!important;margin-top:8px}}`;
  document.head.appendChild(style);

  let busy=false;
  function refresh(){
    const list=document.querySelector('#adminEventList');
    if(!list||busy)return;
    const source=getClanUpcomingEvents(new Date());
    if(!source.length){return;}
    busy=true;
    try{
      let rows=source.filter(filterMatches);
      const sort=document.querySelector('#adminSort')?.value||'nearest';
      if(sort==='latest')rows=[...rows].reverse();
      else if(sort==='name')rows=[...rows].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pl'));
      else rows=[...rows].sort((a,b)=>new Date(a.startAt||`${eventDate(a)}T${eventTime(a)}:00`)-new Date(b.startAt||`${eventDate(b)}T${eventTime(b)}:00`));

      const groups=new Map();
      for(const e of rows){const date=eventDate(e);if(!groups.has(date))groups.set(date,[]);groups.get(date).push(e)}
      const fragment=document.createDocumentFragment();
      if(!rows.length){const p=document.createElement('p');p.className='empty-mini admin-upcoming-empty';p.textContent='Brak nadchodzących wydarzeń pasujących do filtrów.';fragment.appendChild(p)}
      for(const [date,items] of groups){
        const section=document.createElement('section');section.className='admin-day-group';
        section.innerHTML=`<div class="admin-day-heading"><div><span class="admin-day-relative">${relativeLabel(date)}</span><h3>${prettyDate(date)}</h3></div><b>${items.length} ${items.length===1?'wydarzenie':'wydarzeń'}</b></div><div class="admin-day-events">${items.map(rowHtml).join('')}</div>`;
        fragment.appendChild(section);
      }
      list.replaceChildren(fragment);
      const count=document.querySelector('#adminCount');if(count)count.textContent=rows.length;
    }finally{busy=false}
  }

  const start=()=>{
    const list=document.querySelector('#adminEventList');
    if(!list){setTimeout(start,200);return}
    let timer;
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,80)};
    new MutationObserver(()=>{if(!busy)schedule()}).observe(list,{childList:true,subtree:false});
    const unsubscribe=subscribeClanEvents(()=>setTimeout(refresh,0));
    window.addEventListener('beforeunload',unsubscribe,{once:true});
    document.addEventListener('click',e=>{if(e.target.closest('[data-admin-filter],#adminTrigger,[data-admin-view="events"]'))setTimeout(refresh,120)});
    document.addEventListener('input',e=>{if(e.target.matches('#adminSearch'))schedule()});
    document.addEventListener('change',e=>{if(e.target.matches('#adminSort'))schedule()});
    window.addEventListener('focus',refresh);
    refresh();
    setTimeout(refresh,500);
    setTimeout(refresh,1500);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}

import { supabase } from './supabaseClient.js';

const MONTHS=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
const WEEKDAYS=['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function prettyDate(key){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key||''));if(!m)return key||'Bez daty';const d=new Date(+m[1],+m[2]-1,+m[3]);return `${WEEKDAYS[d.getDay()]}, ${+m[3]} ${MONTHS[+m[2]-1]} ${m[1]}`}
function relativeLabel(key){const now=new Date();now.setHours(0,0,0,0);const d=new Date(`${key}T00:00:00`);if(!Number.isFinite(d.getTime()))return'';const diff=Math.round((d-now)/86400000);if(diff===0)return'DZISIAJ';if(diff===1)return'JUTRO';if(diff>1&&diff<7)return`ZA ${diff} DNI`;return''}
function eventStart(e){const t=String(e.event_time||'00:00').slice(0,5);return new Date(`${e.event_date}T${t}:00`)}
function activeFilter(){return document.querySelector('.admin-filter-btn.active')?.textContent?.trim()||'Wszystkie'}
function searchQuery(){return document.querySelector('#adminSearch')?.value?.trim().toLowerCase()||''}
function matches(e){const f=activeFilter(),q=searchQuery();if(f!=='Wszystkie'&&e.type!==f)return false;if(q&&!`${e.name||''} ${e.boss||''}`.toLowerCase().includes(q))return false;return true}
function row(e){const time=String(e.event_time||'').slice(0,5);return `<div class="admin-event"><div class="admin-event-copy"><div class="event-thumb" data-boss-name="${esc(e.boss||e.name)}"><span>ART</span></div><div><b>${esc(e.name)}</b><span>${esc(e.event_date)} · ${esc(time)} · ${esc(e.type)}</span><span>${esc(e.location||'Brak lokalizacji')}</span></div></div><div><button class="edit-btn" data-edit="${esc(e.id)}">Edytuj</button><button class="delete-btn" data-delete="${esc(e.id)}">Usuń</button></div></div>`}

async function readUpcoming(){
  if(!supabase)return [];
  const now=new Date();const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const {data,error}=await supabase.from('events').select('id,name,type,boss,event_date,event_time,location').gte('event_date',date).order('event_date').order('event_time');
  if(error||!Array.isArray(data))return [];
  return data.filter(e=>eventStart(e)>=Date.now()).filter(matches);
}

async function render(){
  const list=document.querySelector('#adminEventList');if(!list||list.dataset.dbRender==='busy')return;
  list.dataset.dbRender='busy';
  const events=await readUpcoming();
  const groups=new Map();
  for(const e of events){if(!groups.has(e.event_date))groups.set(e.event_date,[]);groups.get(e.event_date).push(e)}
  const html=[...groups.entries()].map(([date,items])=>`<section class="admin-day-group" data-admin-day="${date}"><div class="admin-day-heading"><div><span class="admin-day-relative">${relativeLabel(date)||'DZIEŃ'}</span><h3>${prettyDate(date)}</h3></div><b>${items.length} ${items.length===1?'wydarzenie':'wydarzeń'}</b></div><div class="admin-day-events">${items.map(row).join('')}</div></section>`).join('');
  list.innerHTML=html||'<p class="empty-mini admin-upcoming-empty">Brak nadchodzących wydarzeń dodanych w panelu.</p>';
  const count=document.querySelector('#adminCount');if(count)count.textContent=events.length;
  delete list.dataset.dbRender;
}

function boot(){
  const list=document.querySelector('#adminEventList');if(!list){setTimeout(boot,180);return}
  const style=document.createElement('style');style.textContent=`#adminEventList{display:grid;gap:18px}.admin-day-group{border:1px solid #362d20;background:#080b0b;overflow:hidden}.admin-day-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 15px;background:linear-gradient(90deg,#231b0f,#111513);border-bottom:1px solid #4b3922}.admin-day-heading>div{display:flex;align-items:center;gap:10px;min-width:0}.admin-day-heading h3{margin:0;color:#ead9b8;font:700 16px Georgia,serif;text-transform:capitalize}.admin-day-heading>b{color:#b68c43;font-size:10px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em}.admin-day-relative{padding:5px 7px;border:1px solid #8b642c;background:#33230f;color:#f0c66e;font-size:8px;font-weight:900;letter-spacing:.08em;white-space:nowrap}.admin-day-events{display:grid}.admin-day-events .admin-event{border:0!important;border-bottom:1px solid #28231b!important;background:#0b0f0f!important;margin:0!important;padding:13px 14px!important}.admin-day-events .admin-event:last-child{border-bottom:0!important}.admin-day-events .admin-event:hover{background:#101514!important}.admin-day-events .admin-event-copy b{font-size:14px!important;color:#eee3cf}.admin-day-events .admin-event-copy span{font-size:10px!important;line-height:1.45}.admin-day-events .event-thumb{width:54px!important;height:48px!important;flex:0 0 54px}.admin-upcoming-empty{padding:20px;border:1px solid #362d20;background:#0b0f0f;text-align:center}@media(max-width:700px){#adminEventList{gap:13px}.admin-day-heading{align-items:flex-start;padding:11px}.admin-day-heading>div{align-items:flex-start;flex-direction:column;gap:5px}.admin-day-heading h3{font-size:14px}.admin-day-events .admin-event{padding:11px!important}.admin-day-events .admin-event>div:last-child{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}.admin-day-events .admin-event>div:last-child button{width:100%;margin:0!important}}`;document.head.appendChild(style);
  let timer;const queue=()=>{clearTimeout(timer);timer=setTimeout(render,40)};
  new MutationObserver(()=>{if(!list.dataset.dbRender)queue()}).observe(list,{childList:true});
  document.querySelector('#adminFilters')?.addEventListener('click',()=>setTimeout(render,60));
  document.querySelector('#adminSearch')?.addEventListener('input',()=>setTimeout(render,60));
  document.querySelector('#adminSort')?.addEventListener('change',()=>setTimeout(render,60));
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
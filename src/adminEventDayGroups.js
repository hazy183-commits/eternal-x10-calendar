const MONTHS = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
const WEEKDAYS = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];

function prettyDate(dateKey){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey||''));
  if(!match) return dateKey||'Bez daty';
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
  return `${WEEKDAYS[date.getDay()]}, ${Number(match[3])} ${MONTHS[Number(match[2])-1]} ${match[1]}`;
}

function relativeLabel(dateKey){
  const now=new Date(); now.setHours(0,0,0,0);
  const date=new Date(`${dateKey}T00:00:00`); if(!Number.isFinite(date.getTime())) return '';
  const diff=Math.round((date-now)/86400000);
  if(diff===0) return 'DZISIAJ';
  if(diff===1) return 'JUTRO';
  if(diff===-1) return 'WCZORAJ';
  if(diff>1&&diff<7) return `ZA ${diff} DNI`;
  return '';
}

function extractDate(row){
  const text=[...row.querySelectorAll('.admin-event-copy span')].map(el=>el.textContent||'').join(' ');
  return text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]||'';
}

function groupAdminEvents(){
  const list=document.querySelector('#adminEventList');
  if(!list||list.dataset.dayGrouping==='busy') return;
  const directRows=[...list.children].filter(el=>el.classList?.contains('admin-event'));
  if(!directRows.length) return;
  list.dataset.dayGrouping='busy';
  const groups=[];
  const byDate=new Map();
  directRows.forEach(row=>{
    const date=extractDate(row)||'Bez daty';
    if(!byDate.has(date)){const entry={date,rows:[]};byDate.set(date,entry);groups.push(entry);} 
    byDate.get(date).rows.push(row);
  });
  const fragment=document.createDocumentFragment();
  groups.forEach(({date,rows})=>{
    const section=document.createElement('section'); section.className='admin-day-group'; section.dataset.adminDay=date;
    const rel=relativeLabel(date);
    section.innerHTML=`<div class="admin-day-heading"><div><span class="admin-day-relative">${rel||'DZIEŃ'}</span><h3>${prettyDate(date)}</h3></div><b>${rows.length} ${rows.length===1?'wydarzenie':'wydarzeń'}</b></div><div class="admin-day-events"></div>`;
    const body=section.querySelector('.admin-day-events'); rows.forEach(row=>body.appendChild(row)); fragment.appendChild(section);
  });
  list.replaceChildren(fragment); delete list.dataset.dayGrouping;
}

function boot(){
  const list=document.querySelector('#adminEventList');
  if(!list){setTimeout(boot,180);return;}
  const style=document.createElement('style');
  style.textContent=`
    #adminEventList{display:grid;gap:18px}
    .admin-day-group{border:1px solid #362d20;background:#080b0b;overflow:hidden}
    .admin-day-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 15px;background:linear-gradient(90deg,#231b0f,#111513);border-bottom:1px solid #4b3922}
    .admin-day-heading>div{display:flex;align-items:center;gap:10px;min-width:0}.admin-day-heading h3{margin:0;color:#ead9b8;font:700 16px Georgia,serif;text-transform:capitalize}.admin-day-heading>b{color:#b68c43;font-size:10px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em}
    .admin-day-relative{padding:5px 7px;border:1px solid #8b642c;background:#33230f;color:#f0c66e;font-size:8px;font-weight:900;letter-spacing:.08em;white-space:nowrap}
    .admin-day-events{display:grid;gap:0}.admin-day-events .admin-event{border:0!important;border-bottom:1px solid #28231b!important;background:#0b0f0f!important;margin:0!important;padding:13px 14px!important}.admin-day-events .admin-event:last-child{border-bottom:0!important}.admin-day-events .admin-event:hover{background:#101514!important}
    .admin-day-events .admin-event-copy{min-width:0}.admin-day-events .admin-event-copy b{font-size:14px!important;color:#eee3cf}.admin-day-events .admin-event-copy span{font-size:10px!important;line-height:1.45}.admin-day-events .event-thumb{width:54px!important;height:48px!important;flex:0 0 54px}
    @media(max-width:700px){#adminEventList{gap:13px}.admin-day-heading{align-items:flex-start;padding:11px}.admin-day-heading>div{align-items:flex-start;flex-direction:column;gap:5px}.admin-day-heading h3{font-size:14px}.admin-day-events .admin-event{padding:11px!important}.admin-day-events .admin-event>div:last-child{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}.admin-day-events .admin-event>div:last-child button{width:100%;margin:0!important}}
  `;
  document.head.appendChild(style);
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;groupAdminEvents();});};
  new MutationObserver(schedule).observe(list,{childList:true});
  groupAdminEvents();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

import { supabase } from './supabaseClient.js';

const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={yes:'BĘDĘ',maybe:'MOŻE',no:'NIE BĘDĘ'};
const roleLabels={owner:'WŁAŚCICIEL',leader:'LIDER',member:'CZŁONEK',admin:'ADMINISTRATOR'};
let currentRole=null;

function ensureUi(){
  const zone=document.querySelector('#memberZoneLayer');
  if(!zone)return null;
  let nav=zone.querySelector('[data-zone-view="attendance"]');
  let panel=zone.querySelector('[data-zone-panel="attendance"]');
  if(!nav){
    nav=document.createElement('button');
    nav.type='button';
    nav.className='zone-nav';
    nav.dataset.zoneView='attendance';
    nav.innerHTML='◫ <span>Frekwencja</span>';
    nav.hidden=true;
    zone.querySelector('.zone-side-spacer')?.before(nav);
  }
  if(!panel){
    panel=document.createElement('section');
    panel.className='zone-view';
    panel.dataset.zonePanel='attendance';
    panel.innerHTML='<div class="zone-section-head"><small>DOWÓDZTWO KLANU</small><h3>FREKWENCJA WYDARZEŃ</h3><p>Podgląd deklaracji członków na nadchodzące wydarzenia.</p></div><div id="leaderAttendanceContent" class="leader-attendance-grid"><div class="leader-attendance-empty">Wybierz zakładkę, aby pobrać statystyki.</div></div>';
    zone.querySelector('.member-zone-main')?.appendChild(panel);
  }
  if(!document.querySelector('#leaderAttendanceSafeStyles')){
    const style=document.createElement('style');
    style.id='leaderAttendanceSafeStyles';
    style.textContent=`.leader-attendance-grid{display:grid;gap:12px;margin-top:18px}.leader-attendance-card{padding:16px 18px;border:1px solid #3a3020;background:linear-gradient(135deg,#0c1010,#080b0b)}.leader-attendance-head{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:14px;align-items:center;padding-bottom:12px;border-bottom:1px solid #2b2419}.leader-attendance-head small{display:block;color:#b88c42;font-size:9px;font-weight:900;letter-spacing:.12em}.leader-attendance-head b{display:block;margin-top:4px;color:#eee6d6;font:700 17px Georgia,serif}.leader-attendance-counts{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.leader-attendance-counts span{min-width:70px;padding:7px 8px;border:1px solid #4c402c;background:#0b0e0e;text-align:center;font-size:9px;font-weight:900}.leader-attendance-counts .yes{border-color:#246f36;color:#6ee087}.leader-attendance-counts .maybe{border-color:#7f6420;color:#e2bc58}.leader-attendance-counts .no{border-color:#79342f;color:#e77b72}.leader-attendance-lists{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.leader-attendance-list{padding:10px;border:1px solid #29241c;background:#090c0c}.leader-attendance-list h4{margin:0 0 8px;font-size:9px;letter-spacing:.09em}.leader-attendance-list.yes h4{color:#67d37d}.leader-attendance-list.maybe h4{color:#d9b354}.leader-attendance-list.no h4{color:#df756d}.leader-attendance-list p{margin:0;color:#8a857d;font-size:10px;line-height:1.55}.leader-attendance-empty{padding:34px;border:1px dashed #4d4028;color:#8b7b5c;text-align:center;margin-top:18px}@media(max-width:900px){html.ob-attendance-access .member-zone-side{grid-template-columns:repeat(5,1fr)!important}}@media(max-width:760px){.leader-attendance-head{grid-template-columns:1fr}.leader-attendance-counts{justify-content:flex-start}.leader-attendance-lists{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }
  return {zone,nav,panel};
}

async function readRole(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){currentRole=null;return null;}
  const {data}=await supabase.from('profiles').select('role,status').eq('id',session.user.id).maybeSingle();
  currentRole=data?.status==='approved'?data.role:null;
  return currentRole;
}

async function syncRole(){
  const ui=ensureUi();
  if(!ui)return;
  const role=await readRole();
  const allowed=role==='leader'||role==='owner';
  ui.nav.hidden=!allowed;
  document.documentElement.classList.toggle('ob-attendance-access',allowed);
  const roleText=roleLabels[role]||String(role||'CZŁONEK').toUpperCase();
  const badge=ui.zone.querySelector('#memberZoneRole');if(badge)badge.textContent=roleText;
  const card=ui.zone.querySelector('#memberRankCard');if(card)card.textContent=roleText.charAt(0)+roleText.slice(1).toLowerCase();
  if(!allowed&&ui.panel.classList.contains('active')){
    ui.panel.classList.remove('active');
    ui.zone.querySelector('[data-zone-panel="home"]')?.classList.add('active');
    ui.zone.querySelectorAll('.zone-nav').forEach(b=>b.classList.toggle('active',b.dataset.zoneView==='home'));
  }
}

async function loadAttendance(){
  const ui=ensureUi();
  if(!ui)return;
  const role=currentRole||await readRole();
  if(role!=='leader'&&role!=='owner')return;
  const content=ui.zone.querySelector('#leaderAttendanceContent');
  content.innerHTML='<div class="leader-attendance-empty">Ładowanie frekwencji…</div>';
  const today=new Date().toISOString().slice(0,10);
  const [{data:events,error:eventError},{data:signups,error:signupError}]=await Promise.all([
    supabase.from('events').select('id,name,type,event_date,event_time,location').gte('event_date',today).order('event_date').order('event_time').limit(30),
    supabase.from('event_signups').select('event_id,nickname,response,updated_at')
  ]);
  if(eventError||signupError){content.innerHTML=`<div class="leader-attendance-empty">Nie udało się pobrać statystyk${signupError?`: ${esc(signupError.message)}`:''}.</div>`;return;}
  const byEvent=new Map();
  (signups||[]).forEach(s=>{const key=String(s.event_id);if(!byEvent.has(key))byEvent.set(key,{yes:[],maybe:[],no:[]});if(byEvent.get(key)[s.response])byEvent.get(key)[s.response].push(s.nickname||'Gracz');});
  if(!(events||[]).length){content.innerHTML='<div class="leader-attendance-empty">Brak nadchodzących wydarzeń.</div>';return;}
  content.innerHTML=(events||[]).map(event=>{
    const g=byEvent.get(String(event.id))||{yes:[],maybe:[],no:[]};
    const when=`${new Date(`${event.event_date}T00:00:00`).toLocaleDateString('pl-PL')} · ${String(event.event_time||'').slice(0,5)}`;
    return `<article class="leader-attendance-card"><div class="leader-attendance-head"><div><small>${esc(event.type||'EVENT')} · ${esc(when)}</small><b>${esc(event.name||'Wydarzenie')}</b></div><div class="leader-attendance-counts"><span class="yes">BĘDĘ<br>${g.yes.length}</span><span class="maybe">MOŻE<br>${g.maybe.length}</span><span class="no">NIE BĘDĘ<br>${g.no.length}</span></div></div><div class="leader-attendance-lists">${['yes','maybe','no'].map(key=>`<div class="leader-attendance-list ${key}"><h4>${labels[key]} · ${g[key].length}</h4><p>${g[key].length?g[key].map(esc).join(', '):'Brak deklaracji'}</p></div>`).join('')}</div></article>`;
  }).join('');
}

function boot(){
  if(!supabase)return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(ensureUi()||tries>40){clearInterval(timer);syncRole();}},250);
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-zone-view="attendance"]'))setTimeout(loadAttendance,50);
    if(event.target.closest('.member-auth-entry'))setTimeout(syncRole,180);
  });
  supabase.auth.onAuthStateChange(()=>setTimeout(syncRole,0));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

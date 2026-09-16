import { getClanUpcomingEvents, subscribeClanEvents, signupIdentity } from './clanEventFeed.js';
import { bossArtworkUrl } from './bossArtwork.js';

export function installMemberEventSignups(supabase){
 if(!supabase||window.__memberEventSignupsInstalled)return;window.__memberEventSignupsInstalled=true;
 const labels={yes:'BĘDĘ',maybe:'MOŻE',no:'NIE BĘDĘ'};let events=[],mine=new Map(),tableReady=true;
 const css=document.createElement('style');css.textContent=`
 .zone-signup-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
 .zone-signup-btn{min-width:70px;padding:8px 10px;border:1px solid #584522;background:#0b0f0f;color:#8e887d;font-size:9px;font-weight:900;cursor:pointer;transition:.18s ease;box-shadow:inset 0 0 0 1px transparent}
 .zone-signup-btn:hover{transform:translateY(-1px);color:#eee}
 .zone-signup-btn[data-choice="yes"]:hover,.zone-signup-btn[data-choice="yes"].active{border-color:#26b94f;color:#8cff9f;background:linear-gradient(180deg,#12351c,#092111);box-shadow:0 0 16px #1bc94b22,inset 0 0 0 1px #1c7f37}
 .zone-signup-btn[data-choice="maybe"]:hover,.zone-signup-btn[data-choice="maybe"].active{border-color:#d4a52d;color:#ffd96b;background:linear-gradient(180deg,#3a2d0d,#211906);box-shadow:0 0 16px #d6a52c20,inset 0 0 0 1px #8a6b20}
 .zone-signup-btn[data-choice="no"]:hover,.zone-signup-btn[data-choice="no"].active{border-color:#d34a42;color:#ff8e86;background:linear-gradient(180deg,#3b1513,#210b0a);box-shadow:0 0 16px #d34a4222,inset 0 0 0 1px #8d312d}
 .zone-event-row.signup-row{grid-template-columns:72px 58px minmax(150px,1fr) auto;gap:12px;min-height:64px}
 .zone-event-thumb{width:56px;height:46px;object-fit:cover;border:1px solid #6f5425;background:#111;box-shadow:0 0 12px #0008}
 .zone-event-thumb.placeholder{display:grid;place-items:center;color:#7b6338;font-size:18px;background:linear-gradient(135deg,#151712,#090b0b)}
 .zone-my-signup{display:grid;grid-template-columns:80px 48px 1fr auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #282218}
 .zone-my-signup .zone-event-thumb{width:46px;height:38px}
 .zone-choice{padding:6px 9px;border:1px solid #755523;font-size:9px;font-weight:900}.zone-choice.yes{border-color:#277d3b;color:#70dc86;background:#0c2112}.zone-choice.maybe{border-color:#8d6b22;color:#e4bd56;background:#241c08}.zone-choice.no{border-color:#853631;color:#e47870;background:#25100e}
 .zone-signup-note{margin-top:8px;color:#716c63;font-size:9px}
 @media(max-width:700px){
   #memberZoneLayer .zone-card{padding:12px!important}
   #memberZoneLayer .zone-card-title{align-items:flex-start!important;gap:10px!important;padding-bottom:9px!important}
   #memberZoneLayer .zone-card-title h3{font-size:16px!important;line-height:1.05!important}
   #memberZoneLayer .zone-card-title .zone-link{font-size:8px!important;white-space:nowrap!important;padding-top:2px!important}
   #memberZoneLayer .zone-event-list{display:grid!important;gap:8px!important;margin-top:8px!important}
   #memberZoneLayer .zone-event-row.signup-row{display:grid!important;grid-template-columns:52px 52px minmax(0,1fr)!important;gap:8px 10px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important;min-height:0!important;margin:0!important;padding:11px!important;border:1px solid #332a1d!important;background:linear-gradient(135deg,#0b0f0f,#080b0b)!important}
   #memberZoneLayer .zone-event-date{grid-column:1!important;grid-row:1!important;font-size:9px!important;line-height:1.3!important;text-align:center!important;color:#e0b353!important}
   #memberZoneLayer .zone-event-thumb{grid-column:2!important;grid-row:1!important;width:50px!important;height:46px!important;margin:0!important;object-fit:cover!important}
   #memberZoneLayer .zone-event-info{grid-column:3!important;grid-row:1!important;min-width:0!important}
   #memberZoneLayer .zone-event-info b{font-size:12px!important;line-height:1.2!important;color:#eee!important;white-space:normal!important;overflow-wrap:anywhere!important}
   #memberZoneLayer .zone-event-info small{display:block!important;margin-top:3px!important;font-size:8px!important;line-height:1.35!important;color:#8b867d!important;white-space:normal!important;overflow-wrap:anywhere!important}
   #memberZoneLayer .zone-signup-actions{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;width:100%!important;margin-top:1px!important;justify-content:stretch!important}
   #memberZoneLayer .zone-signup-btn{width:100%!important;min-width:0!important;padding:9px 3px!important;font-size:7.5px!important;line-height:1!important;min-height:34px!important}
   #memberZoneLayer .zone-my-signup{grid-template-columns:48px 46px minmax(0,1fr)!important;gap:8px!important;padding:10px 0!important}
   #memberZoneLayer .zone-my-signup .zone-choice{grid-column:2/-1!important;width:max-content!important}
 }
 @media(max-width:430px){
   #memberZoneLayer .zone-event-row.signup-row{grid-template-columns:46px 48px minmax(0,1fr)!important;padding:10px!important;gap:7px 8px!important}
   #memberZoneLayer .zone-event-thumb{width:46px!important;height:42px!important}
   #memberZoneLayer .zone-event-info b{font-size:11px!important}
   #memberZoneLayer .zone-event-info small{font-size:7.5px!important}
   #memberZoneLayer .zone-signup-btn{font-size:7px!important;padding:8px 2px!important;min-height:32px!important}
 }
 `;document.head.appendChild(css);
 const getUser=async()=>{const {data}=await supabase.auth.getUser();return data?.user||null},key=u=>`ob-event-signups-${u.id}`;
 const readLocal=u=>{try{return new Map(Object.entries(JSON.parse(localStorage.getItem(key(u))||'{}')))}catch{return new Map()}},writeLocal=(u,id,s)=>{const m=readLocal(u);m.set(String(id),s);localStorage.setItem(key(u),JSON.stringify(Object.fromEntries(m)));return m};
 const art=e=>bossArtworkUrl(e.boss||e.name||e.location||'');
 const thumb=e=>{const src=art(e);return src?`<img class="zone-event-thumb" src="${src}" alt="${e.name||'Wydarzenie'}" loading="lazy">`:`<span class="zone-event-thumb placeholder">✦</span>`};
 const html=e=>{const d=new Date(`${e.event_date}T${String(e.event_time||'00:00').slice(0,5)}:00`),c=mine.get(String(e.id));return `<div class="zone-event-row signup-row" data-event-id="${e.id}"><div class="zone-event-date">${d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'})}<br>${String(e.event_time||'').slice(0,5)}</div>${thumb(e)}<div class="zone-event-info"><b>${e.name||'Wydarzenie'}</b><small>${e.location||e.boss||'Eternal x10'} · ${e.type||'EVENT'}</small></div><div class="zone-signup-actions">${['yes','maybe','no'].map(x=>`<button class="zone-signup-btn ${c===x?'active':''}" data-choice="${x}" aria-pressed="${c===x}">${labels[x]}</button>`).join('')}</div></div>`};
 async function load(){const u=await getUser();if(!u)return;events=getClanUpcomingEvents();const s=await supabase.from('event_signups').select('event_id,schedule_key,response').eq('user_id',u.id);if(s.error){tableReady=false;mine=readLocal(u)}else{tableReady=true;mine=new Map((s.data||[]).map(x=>[String(x.event_id??x.schedule_key),x.response]))}render(u)}
 function render(u){const all=document.querySelector('#memberAllEvents'),up=document.querySelector('#memberUpcomingEvents');if(all)all.innerHTML=events.length?events.map(html).join(''):'<p class="zone-muted">Brak nadchodzących wydarzeń.</p>';if(up)up.innerHTML=events.length?events.slice(0,5).map(html).join(''):'<p class="zone-muted">Brak nadchodzących wydarzeń.</p>';document.querySelectorAll('#memberZoneLayer .zone-signup-btn').forEach(b=>b.onclick=()=>save(u,b.closest('[data-event-id]').dataset.eventId,b.dataset.choice));const p=document.querySelector('[data-zone-panel="signups"]');if(!p)return;let box=p.querySelector('.zone-signups-live');if(!box){p.querySelector('.zone-empty')?.remove();box=document.createElement('div');box.className='zone-signups-live zone-card';p.appendChild(box)}const chosen=events.filter(e=>mine.has(String(e.id)));box.innerHTML=chosen.length?chosen.map(e=>{const d=new Date(`${e.event_date}T${String(e.event_time||'00:00').slice(0,5)}:00`),choice=mine.get(String(e.id));return `<div class="zone-my-signup"><div class="zone-event-date">${d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'})}<br>${String(e.event_time||'').slice(0,5)}</div>${thumb(e)}<div class="zone-event-info"><b>${e.name}</b><small>${e.location||e.type||'EVENT'}</small></div><span class="zone-choice ${choice}">${labels[choice]}</span></div>`}).join(''):'<p class="zone-muted">Nie masz jeszcze deklaracji. Wejdź w „Wydarzenia” i wybierz Będę / Może / Nie będę.</p>';if(!tableReady)box.innerHTML+='<p class="zone-signup-note">Deklaracje są tymczasowo zapisywane lokalnie na tym urządzeniu.</p>'}
 async function save(u,id,response){if(tableReady){const nickname=u.user_metadata?.nickname||u.email?.split('@')[0]||'Gracz';const r=await supabase.from('event_signups').upsert({...signupIdentity(id),user_id:u.id,nickname,response,updated_at:new Date().toISOString()},{onConflict:signupIdentity(id).event_id?'event_id,user_id':'schedule_key,user_id'});if(r.error){tableReady=false;mine=writeLocal(u,id,response)}else mine.set(String(id),response)}else mine=writeLocal(u,id,response);render(u)}
 subscribeClanEvents(()=>{events=getClanUpcomingEvents();getUser().then(u=>{if(u)render(u)})});
 const zone=document.querySelector('#memberZoneLayer');
 let wasOpen=false;
 const obs=new MutationObserver(()=>{const open=zone?.classList.contains('open');if(open&&!wasOpen)load();wasOpen=open});
 if(zone)obs.observe(zone,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{if(e.target.closest('[data-zone-view="events"],[data-zone-view="signups"],[data-zone-go="events"]'))load()});
 supabase.auth.onAuthStateChange(()=>{mine=new Map();setTimeout(load,0)});
 setTimeout(load,600);
}

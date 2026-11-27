import { renderEventDays } from './memberEventDays.js';
import { getClanUpcomingEvents, subscribeClanEvents, signupIdentity } from './clanEventFeed.js';
import { bossArtworkUrl } from './bossArtwork.js';

export function installMemberEventSignups(supabase){
  if(!supabase||window.__memberEventSignupsInstalled)return;
  window.__memberEventSignupsInstalled=true;

  const labels={yes:'BĘDĘ',maybe:'MOŻE',no:'NIE BĘDĘ'};
  const roleLabels={dd:'DD',healer:'HEALER',tank:'TANK',support:'SUPPORT',other:'INNE'};
  let events=[];
  let mine=new Map();
  let attendees=new Map();
  let profile=null;
  let tableReady=true;

  const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signupKey=row=>String(row?.event_id ?? row?.schedule_key ?? '');

  const css=document.createElement('style');
  css.textContent=`
  .zone-event-day{margin:0 0 28px;border:1px solid #3b3020;background:linear-gradient(120deg,#12140e99,#080d0c);border-radius:5px;overflow:hidden}
  .zone-event-day-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;background:linear-gradient(90deg,#302310aa,#17170f66);border-bottom:1px solid #584321}
  .zone-event-day-heading>div{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .zone-event-day-heading h4{margin:0;color:#e8d6af;font-size:14px;font-weight:700;text-transform:capitalize;line-height:1.4}
  .zone-event-day-relative{padding:4px 8px;border:1px solid #8e692c;background:#39290f;color:#f1c967;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
  .zone-event-day-count{color:#a99b80;font-size:10px;white-space:nowrap}
  .zone-event-day-rows{padding:0 16px}.zone-event-day-rows>.zone-event-row:last-child{border-bottom:0}
  .zone-event-day.is-today{border-color:#735426}
  #memberUpcomingEvents .zone-event-day-heading{padding:11px 12px;flex-wrap:wrap}
  #memberUpcomingEvents .zone-event-day-heading h4{font-size:12px}
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
  .zone-attendance{grid-column:1/-1;padding-top:8px;border-top:1px solid #262117}
  .zone-attendance-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #493a22;background:#0b0e0e;color:#caa354;font-size:9px;font-weight:900;cursor:pointer}
  .zone-attendance-toggle:hover{border-color:#8c6a31;color:#f0ca75}
  .zone-attendance-counts{display:flex;gap:6px;flex-wrap:wrap}.zone-attendance-counts span{padding:3px 6px;border:1px solid #403623;color:#9d968a;font-size:8px}.zone-attendance-counts .yes{border-color:#245f33;color:#63cb79}.zone-attendance-counts .maybe{border-color:#66531d;color:#cfad52}.zone-attendance-counts .no{border-color:#65312d;color:#cf7069}
  .zone-attendance-list{display:none;padding:9px 10px;border:1px solid #32291c;border-top:0;background:#080b0b}.zone-attendance.open .zone-attendance-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .zone-attendance-group{padding:8px;border:1px solid #28231b;background:#0a0d0d}.zone-attendance-group h5{margin:0 0 7px;font-size:8px;letter-spacing:.08em}.zone-attendance-group.yes h5{color:#65ce7b}.zone-attendance-group.maybe h5{color:#d5b252}.zone-attendance-group.no h5{color:#d97770}.zone-attendee{padding:5px 0;border-bottom:1px solid #211e18;color:#ddd;font-size:9px;line-height:1.35}.zone-attendee:last-child{border-bottom:0}.zone-attendee small{display:block;color:#807a70;font-size:8px}.zone-attendee-empty{color:#6e6961;font-size:8px}
  .zone-profile-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:760px;margin-top:18px;padding:18px;border:1px solid #3a3020;background:linear-gradient(135deg,#0c1010,#080b0b)}
  .zone-profile-form label{display:grid;gap:7px;color:#b69a5e;font-size:9px;font-weight:900;letter-spacing:.05em}.zone-profile-form input,.zone-profile-form select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #4a3b23;background:#080c0c;color:#eee}.zone-profile-form .full{grid-column:1/-1}.zone-profile-actions{grid-column:1/-1;display:flex;align-items:center;gap:12px}.zone-profile-save{padding:11px 18px;border:1px solid #a77830;background:linear-gradient(#3a2812,#21170b);color:#f0cf83;font-weight:900;cursor:pointer}.zone-profile-message{color:#b6a078;font-size:10px}.zone-profile-summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.zone-profile-chip{padding:7px 9px;border:1px solid #4a3b23;background:#0a0d0d;color:#d5b261;font-size:9px;font-weight:800}
  @media(max-width:700px){
    #memberZoneLayer .zone-event-day{margin-bottom:16px}#memberZoneLayer .zone-event-day-heading{padding:12px;align-items:flex-start;flex-wrap:wrap}#memberZoneLayer .zone-event-day-heading h4{font-size:12px}#memberZoneLayer .zone-event-day-rows{display:grid;gap:8px;padding:8px}#memberZoneLayer .zone-event-day-count{font-size:9px}
    #memberZoneLayer .zone-card{padding:12px!important}#memberZoneLayer .zone-card-title{align-items:flex-start!important;gap:10px!important;padding-bottom:9px!important}#memberZoneLayer .zone-card-title h3{font-size:16px!important;line-height:1.05!important}#memberZoneLayer .zone-card-title .zone-link{font-size:8px!important;white-space:nowrap!important;padding-top:2px!important}#memberZoneLayer .zone-event-list{display:grid!important;gap:8px!important;margin-top:8px!important}
    #memberZoneLayer .zone-event-row.signup-row{display:grid!important;grid-template-columns:52px 52px minmax(0,1fr)!important;gap:8px 10px!important;align-items:center!important;width:100%!important;box-sizing:border-box!important;min-height:0!important;margin:0!important;padding:11px!important;border:1px solid #332a1d!important;background:linear-gradient(135deg,#0b0f0f,#080b0b)!important}
    #memberZoneLayer .zone-event-date{grid-column:1!important;grid-row:1!important;font-size:9px!important;line-height:1.3!important;text-align:center!important;color:#e0b353!important}#memberZoneLayer .zone-event-thumb{grid-column:2!important;grid-row:1!important;width:50px!important;height:46px!important;margin:0!important;object-fit:cover!important}#memberZoneLayer .zone-event-info{grid-column:3!important;grid-row:1!important;min-width:0!important}#memberZoneLayer .zone-event-info b{font-size:12px!important;line-height:1.2!important;color:#eee!important;white-space:normal!important;overflow-wrap:anywhere!important}#memberZoneLayer .zone-event-info small{display:block!important;margin-top:3px!important;font-size:8px!important;line-height:1.35!important;color:#8b867d!important;white-space:normal!important;overflow-wrap:anywhere!important}
    #memberZoneLayer .zone-signup-actions{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;width:100%!important;margin-top:1px!important;justify-content:stretch!important}#memberZoneLayer .zone-signup-btn{width:100%!important;min-width:0!important;padding:9px 3px!important;font-size:7.5px!important;line-height:1!important;min-height:34px!important}#memberZoneLayer .zone-my-signup{grid-template-columns:48px 46px minmax(0,1fr)!important;gap:8px!important;padding:10px 0!important}#memberZoneLayer .zone-my-signup .zone-choice{grid-column:2/-1!important;width:max-content!important}
    #memberZoneLayer .zone-attendance{grid-column:1/-1!important;grid-row:3!important}.zone-attendance.open .zone-attendance-list{grid-template-columns:1fr}.zone-attendance-toggle{align-items:flex-start;flex-direction:column}.zone-profile-form{grid-template-columns:1fr;padding:14px}.zone-profile-form .full,.zone-profile-actions{grid-column:1}
  }
  @media(max-width:430px){#memberZoneLayer .zone-event-row.signup-row{grid-template-columns:46px 48px minmax(0,1fr)!important;padding:10px!important;gap:7px 8px!important}#memberZoneLayer .zone-event-thumb{width:46px!important;height:42px!important}#memberZoneLayer .zone-event-info b{font-size:11px!important}#memberZoneLayer .zone-event-info small{font-size:7.5px!important}#memberZoneLayer .zone-signup-btn{font-size:7px!important;padding:8px 2px!important;min-height:32px!important}}
  `;
  document.head.appendChild(css);

  const getUser=async()=>{const {data}=await supabase.auth.getUser();return data?.user||null};
  const localKey=u=>`ob-event-signups-${u.id}`;
  const readLocal=u=>{try{return new Map(Object.entries(JSON.parse(localStorage.getItem(localKey(u))||'{}')))}catch{return new Map()}};
  const writeLocal=(u,id,s)=>{const m=readLocal(u);m.set(String(id),s);localStorage.setItem(localKey(u),JSON.stringify(Object.fromEntries(m)));return m};
  const art=e=>bossArtworkUrl(e.artwork||e.boss||e.name||e.location||'');
  const thumb=e=>{const src=art(e);return src?`<img class="zone-event-thumb" src="${src}" alt="${esc(e.name||'Wydarzenie')}" loading="lazy">`:`<span class="zone-event-thumb placeholder">✦</span>`};

  function ensureProfileUi(){
    const zone=document.querySelector('#memberZoneLayer');
    if(!zone)return;
    let nav=zone.querySelector('[data-zone-view="profile"]');
    if(!nav){
      nav=document.createElement('button');nav.type='button';nav.className='zone-nav';nav.dataset.zoneView='profile';nav.innerHTML='♙ <span>Mój profil</span>';
      zone.querySelector('.zone-side-spacer')?.before(nav);
    }
    let panel=zone.querySelector('[data-zone-panel="profile"]');
    if(!panel){
      panel=document.createElement('section');panel.className='zone-view';panel.dataset.zonePanel='profile';
      panel.innerHTML=`<div class="zone-section-head"><small>POSTAĆ</small><h3>MÓJ PROFIL</h3><p>Uzupełnij klasę i rolę. Dane będą widoczne przy zapisach na wydarzenia.</p></div><div id="zoneProfileSummary" class="zone-profile-summary"></div><form id="zoneProfileForm" class="zone-profile-form"><label>Główna klasa<input id="zoneProfileClass" maxlength="40" placeholder="np. Treasure Hunter"></label><label>Poziom<input id="zoneProfileLevel" type="number" min="1" max="80" placeholder="80"></label><label>Subclassa<input id="zoneProfileSubclass" maxlength="40" placeholder="opcjonalnie"></label><label>Rola w party<select id="zoneProfileRole"><option value="">Wybierz</option><option value="dd">DD</option><option value="healer">Healer</option><option value="tank">Tank</option><option value="support">Support</option><option value="other">Inne</option></select></label><div class="zone-profile-actions"><button class="zone-profile-save" type="submit">ZAPISZ PROFIL</button><span id="zoneProfileMessage" class="zone-profile-message"></span></div></form>`;
      zone.querySelector('.member-zone-main')?.appendChild(panel);
      panel.querySelector('#zoneProfileForm').addEventListener('submit',saveProfile);
    }
  }

  async function loadProfile(u){
    if(!u)return;
    const {data}=await supabase.from('profiles').select('nickname,character_class,character_level,subclass,party_role').eq('id',u.id).maybeSingle();
    profile=data||{nickname:u.user_metadata?.nickname||u.email?.split('@')[0]||'Gracz'};
    renderProfile();
  }

  function renderProfile(){
    ensureProfileUi();
    const form=document.querySelector('#zoneProfileForm');if(!form||!profile)return;
    form.querySelector('#zoneProfileClass').value=profile.character_class||'';
    form.querySelector('#zoneProfileLevel').value=profile.character_level||'';
    form.querySelector('#zoneProfileSubclass').value=profile.subclass||'';
    form.querySelector('#zoneProfileRole').value=profile.party_role||'';
    const summary=document.querySelector('#zoneProfileSummary');
    if(summary){
      const bits=[profile.nickname,profile.character_class,profile.character_level?`Lv. ${profile.character_level}`:'',profile.subclass?`Sub: ${profile.subclass}`:'',profile.party_role?roleLabels[profile.party_role]:''].filter(Boolean);
      summary.innerHTML=bits.map(x=>`<span class="zone-profile-chip">${esc(x)}</span>`).join('')||'<span class="zone-profile-chip">Profil nieuzupełniony</span>';
    }
  }

  async function saveProfile(event){
    event.preventDefault();
    const u=await getUser();if(!u)return;
    const form=event.currentTarget,msg=form.querySelector('#zoneProfileMessage');
    const levelRaw=form.querySelector('#zoneProfileLevel').value.trim();
    const payload={
      p_character_class:form.querySelector('#zoneProfileClass').value.trim(),
      p_character_level:levelRaw?Number(levelRaw):null,
      p_subclass:form.querySelector('#zoneProfileSubclass').value.trim(),
      p_party_role:form.querySelector('#zoneProfileRole').value||null
    };
    if(payload.p_character_level!==null&&(payload.p_character_level<1||payload.p_character_level>80)){msg.textContent='Poziom musi być w zakresie 1–80.';return;}
    msg.textContent='Zapisywanie…';
    const {error}=await supabase.rpc('update_my_character_profile',payload);
    if(error){msg.textContent='Nie udało się zapisać profilu.';return;}
    msg.textContent='Profil zapisany.';
    await loadProfile(u);
    await load();
  }

  function groupedFor(id){
    const list=attendees.get(String(id))||[];
    return {
      yes:list.filter(x=>x.response==='yes'),
      maybe:list.filter(x=>x.response==='maybe'),
      no:list.filter(x=>x.response==='no')
    };
  }

  const attendeeLine=row=>{
    const details=[row.character_class,row.character_level?`Lv. ${row.character_level}`:'',row.party_role?roleLabels[row.party_role]:''].filter(Boolean).join(' · ');
    return `<div class="zone-attendee"><b>${esc(row.nickname||'Gracz')}</b>${details?`<small>${esc(details)}</small>`:''}</div>`;
  };

  function attendanceHtml(id){
    const g=groupedFor(id),total=g.yes.length+g.maybe.length+g.no.length;
    return `<div class="zone-attendance"><button class="zone-attendance-toggle" type="button"><span>KTO BĘDZIE? · ${total}</span><span class="zone-attendance-counts"><span class="yes">BĘDĘ ${g.yes.length}</span><span class="maybe">MOŻE ${g.maybe.length}</span><span class="no">NIE ${g.no.length}</span></span></button><div class="zone-attendance-list">${['yes','maybe','no'].map(k=>`<div class="zone-attendance-group ${k}"><h5>${labels[k]} · ${g[k].length}</h5>${g[k].length?g[k].map(attendeeLine).join(''):'<div class="zone-attendee-empty">Brak osób</div>'}</div>`).join('')}</div></div>`;
  }

  const html=e=>{
    const c=mine.get(String(e.id));
    return `<div class="zone-event-row signup-row" data-event-id="${esc(e.id)}"><div class="zone-event-date">${esc(String(e.event_time||'').slice(0,5))}</div>${thumb(e)}<div class="zone-event-info"><b>${esc(e.name||'Wydarzenie')}</b><small>${esc(e.location||e.boss||'Eternal x10')} · ${esc(e.type||'EVENT')}</small></div><div class="zone-signup-actions">${['yes','maybe','no'].map(x=>`<button class="zone-signup-btn ${c===x?'active':''}" data-choice="${x}" aria-pressed="${c===x}">${labels[x]}</button>`).join('')}</div>${attendanceHtml(e.id)}</div>`;
  };

  async function load(){
    const u=await getUser();if(!u)return;
    ensureProfileUi();
    events=getClanUpcomingEvents();
    const [ownResult,allResult]=await Promise.all([
      supabase.from('event_signups').select('event_id,schedule_key,response').eq('user_id',u.id),
      supabase.from('event_signups').select('event_id,schedule_key,user_id,nickname,response,character_class,character_level,subclass,party_role,updated_at')
    ]);
    if(ownResult.error){tableReady=false;mine=readLocal(u)}else{tableReady=true;mine=new Map((ownResult.data||[]).map(x=>[signupKey(x),x.response]))}
    attendees=new Map();
    if(!allResult.error){(allResult.data||[]).forEach(row=>{const k=signupKey(row);if(!attendees.has(k))attendees.set(k,[]);attendees.get(k).push(row)})}
    await loadProfile(u);
    render(u);
  }

  function bindEventActions(u){
    document.querySelectorAll('#memberZoneLayer .zone-signup-btn').forEach(b=>b.onclick=()=>save(u,b.closest('[data-event-id]').dataset.eventId,b.dataset.choice));
    document.querySelectorAll('#memberZoneLayer .zone-attendance-toggle').forEach(b=>b.onclick=()=>b.closest('.zone-attendance')?.classList.toggle('open'));
  }

  function render(u){
    const all=document.querySelector('#memberAllEvents'),up=document.querySelector('#memberUpcomingEvents');
    if(all)all.innerHTML=events.length?renderEventDays(events,html):'<p class="zone-muted">Brak nadchodzących wydarzeń.</p>';
    if(up)up.innerHTML=events.length?renderEventDays(events.slice(0,5),html):'<p class="zone-muted">Brak nadchodzących wydarzeń.</p>';
    bindEventActions(u);
    const p=document.querySelector('[data-zone-panel="signups"]');if(!p)return;
    let box=p.querySelector('.zone-signups-live');if(!box){p.querySelector('.zone-empty')?.remove();box=document.createElement('div');box.className='zone-signups-live zone-card';p.appendChild(box)}
    const chosen=events.filter(e=>mine.has(String(e.id)));
    box.innerHTML=chosen.length?chosen.map(e=>{const d=new Date(`${e.event_date}T${String(e.event_time||'00:00').slice(0,5)}:00`),choice=mine.get(String(e.id));return `<div class="zone-my-signup"><div class="zone-event-date">${d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'})}<br>${esc(String(e.event_time||'').slice(0,5))}</div>${thumb(e)}<div class="zone-event-info"><b>${esc(e.name)}</b><small>${esc(e.location||e.type||'EVENT')}</small></div><span class="zone-choice ${choice}">${labels[choice]}</span></div>`}).join(''):'<p class="zone-muted">Nie masz jeszcze deklaracji. Wejdź w „Wydarzenia” i wybierz Będę / Może / Nie będę.</p>';
    if(!tableReady)box.innerHTML+='<p class="zone-signup-note">Deklaracje są tymczasowo zapisywane lokalnie na tym urządzeniu.</p>';
  }

  async function save(u,id,response){
    if(tableReady){
      const nickname=profile?.nickname||u.user_metadata?.nickname||u.email?.split('@')[0]||'Gracz';
      const identity=signupIdentity(id);
      const row={...identity,user_id:u.id,nickname,response,character_class:profile?.character_class||null,character_level:profile?.character_level||null,subclass:profile?.subclass||null,party_role:profile?.party_role||null,updated_at:new Date().toISOString()};
      const r=await supabase.from('event_signups').upsert(row,{onConflict:identity.event_id?'event_id,user_id':'schedule_key,user_id'});
      if(r.error){tableReady=false;mine=writeLocal(u,id,response)}else { mine.set(String(id),response); window.dispatchEvent(new CustomEvent('orzel:signup-updated')); }
    }else mine=writeLocal(u,id,response);
    await load();
  }

  ensureProfileUi();
  window.addEventListener('orzel:signup-updated', load);
  window.addEventListener('orzel:profile-updated', load);
  subscribeClanEvents(()=>{events=getClanUpcomingEvents();getUser().then(u=>{if(u)load()})});
  const zone=document.querySelector('#memberZoneLayer');
  let wasOpen=false;
  const obs=new MutationObserver(()=>{const open=zone?.classList.contains('open');if(open&&!wasOpen)load();wasOpen=open});
  if(zone)obs.observe(zone,{attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-zone-view="events"],[data-zone-view="signups"],[data-zone-view="profile"],[data-zone-go="events"]'))load();
  });
  supabase.auth.onAuthStateChange(()=>{mine=new Map();attendees=new Map();profile=null;setTimeout(load,0)});
  setTimeout(load,700);
}

const ROLE_LABELS={owner:'Właściciel',admin:'Administrator',leader:'Lider',member:'Członek',pending:'Oczekuje'};
const esc=(value='')=>String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function installRoleEnhancements(supabase){
  if(!supabase||window.__obRoleEnhancementsInstalled)return;
  window.__obRoleEnhancementsInstalled=true;

  let currentProfile=null;
  let roleManagerBusy=false;

  const style=document.createElement('style');
  style.id='obRoleEnhancementStyles';
  style.textContent=`
    #ownerUsersPanel.role-enhanced>.owner-user-stats,
    #ownerUsersPanel.role-enhanced>#ownerUsersMessage,
    #ownerUsersPanel.role-enhanced>#ownerUsersList{display:none!important}
    .ob-role-manager{display:grid;gap:14px;margin-top:12px}
    .ob-role-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}
    .ob-role-stat{padding:15px 10px;border:1px solid #342b1d;background:#0b0e0e;text-align:center}
    .ob-role-stat b{display:block;color:#e1b85e;font-size:23px}.ob-role-stat span{color:#817b70;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
    .ob-role-help{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
    .ob-role-help div{padding:12px 13px;border:1px solid #30291e;background:linear-gradient(180deg,#0d1111,#090c0c)}
    .ob-role-help b{display:block;margin-bottom:5px;color:#d5ac5b;font-size:10px;letter-spacing:.09em}.ob-role-help span{color:#777269;font-size:10px;line-height:1.45}
    .ob-role-message{min-height:18px;color:#d6b46d;font-size:11px}
    .ob-role-list{display:grid;gap:9px}
    .ob-role-row{display:grid;grid-template-columns:minmax(150px,1fr) 120px 120px minmax(390px,auto);align-items:center;gap:12px;padding:13px 15px;border:1px solid #30291e;background:linear-gradient(90deg,#101414,#0a0c0c)}
    .ob-role-user b{display:block;color:#eee;font-size:15px}.ob-role-user small{color:#68645d}.ob-role-name{color:#d2aa5a;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.ob-role-status{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.ob-role-status.pending{color:#e6ad55}.ob-role-status.approved{color:#70b77b}.ob-role-status.blocked{color:#d06b61}
    .ob-role-actions{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}.ob-role-actions button{padding:8px 10px;border:1px solid #5c4928;background:#15120d;color:#d6b46d;font-size:10px;font-weight:800;cursor:pointer}.ob-role-actions button:hover{border-color:#c79743;color:#f1d38d}.ob-role-actions button.active{border-color:#d3a64c;background:linear-gradient(#3a2812,#21170b);color:#f0d28c}.ob-role-actions .danger{border-color:#66372f;color:#d98275}
    .ob-attendance-nav[hidden]{display:none!important}
    .ob-attendance-grid{display:grid;gap:12px;margin-top:18px}.ob-attendance-card{padding:16px 18px;border:1px solid #3a3020;background:linear-gradient(135deg,#0c1010,#080b0b)}.ob-attendance-head{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:14px;align-items:center;padding-bottom:12px;border-bottom:1px solid #2b2419}.ob-attendance-head small{display:block;color:#b88c42;font-size:9px;font-weight:900;letter-spacing:.12em}.ob-attendance-head b{display:block;margin-top:4px;color:#eee6d6;font:700 17px Georgia,serif}.ob-attendance-counts{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.ob-attendance-counts span{min-width:70px;padding:7px 8px;border:1px solid #4c402c;background:#0b0e0e;text-align:center;font-size:9px;font-weight:900}.ob-attendance-counts .yes{border-color:#246f36;color:#6ee087}.ob-attendance-counts .maybe{border-color:#7f6420;color:#e2bc58}.ob-attendance-counts .no{border-color:#79342f;color:#e77b72}.ob-attendance-lists{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.ob-attendance-list{padding:10px;border:1px solid #29241c;background:#090c0c}.ob-attendance-list h4{margin:0 0 8px;font-size:9px;letter-spacing:.09em}.ob-attendance-list.yes h4{color:#67d37d}.ob-attendance-list.maybe h4{color:#d9b354}.ob-attendance-list.no h4{color:#df756d}.ob-attendance-list p{margin:0;color:#8a857d;font-size:10px;line-height:1.55}.ob-attendance-empty{padding:34px;border:1px dashed #4d4028;color:#8b7b5c;text-align:center;margin-top:18px}
    html.ob-limited-admin #adminAdd,html.ob-limited-admin #quickAdd,html.ob-limited-admin #adminEventList [data-delete],html.ob-limited-admin #adminDashboardTabs [data-admin-tab="bosses"],html.ob-limited-admin #adminDashboardTabs [data-admin-tab="siege"],html.ob-limited-admin #adminDashboardTabs [data-admin-tab="schedule"],html.ob-limited-admin #adminDashboardTabs [data-admin-tab="users"]{display:none!important}
    html.ob-limited-admin #adminDashboardTabs{grid-template-columns:1fr!important}
    html.ob-limited-admin .ob-owner-only-field{display:none!important}
    .ob-admin-limit-banner{display:none;margin:0 0 14px;padding:11px 13px;border:1px solid #6a5128;background:linear-gradient(90deg,#2a1d0d,#11100c);color:#d7b46b;font-size:11px;font-weight:800;letter-spacing:.03em}
    html.ob-limited-admin .ob-admin-limit-banner{display:block}
    @media(max-width:760px){.ob-role-stats{grid-template-columns:1fr 1fr}.ob-role-help{grid-template-columns:1fr}.ob-role-row{grid-template-columns:1fr 1fr}.ob-role-actions{grid-column:1/-1;justify-content:flex-start}.ob-attendance-head{grid-template-columns:1fr}.ob-attendance-counts{justify-content:flex-start}.ob-attendance-lists{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  async function readProfile(){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){currentProfile=null;return null;}
    const {data}=await supabase.from('profiles').select('id,nickname,role,status').eq('id',session.user.id).maybeSingle();
    currentProfile=data||null;
    return currentProfile;
  }

  function prepareAdminFormMarkers(){
    ['eventName','eventType','eventBoss','eventLocation','eventDescription'].forEach((id)=>{
      document.querySelector(`#${id}`)?.closest('label')?.classList.add('ob-owner-only-field');
    });
    ['quickTemplates','eventModeChooser','recurrenceSection','bossPreview'].forEach((id)=>document.querySelector(`#${id}`)?.classList.add('ob-owner-only-field'));
    let banner=document.querySelector('#obAdminLimitBanner');
    if(!banner){
      banner=document.createElement('div');
      banner.id='obAdminLimitBanner';
      banner.className='ob-admin-limit-banner';
      banner.textContent='TRYB ADMINISTRATORA · możesz zmienić wyłącznie datę, godzinę i czas trwania istniejącego wydarzenia.';
      document.querySelector('#adminFormView')?.prepend(banner);
    }
  }

  async function applyRoleUi(){
    const profile=await readProfile();
    const limited=profile?.status==='approved'&&profile?.role==='admin';
    document.documentElement.classList.toggle('ob-limited-admin',limited);
    prepareAdminFormMarkers();
    if(limited){
      const title=document.querySelector('#formTitle');
      if(document.querySelector('#adminFormView')&&!document.querySelector('#adminFormView').hidden&&title)title.textContent='Edytuj termin wydarzenia';
    }
    await syncLeaderUi(profile);
  }

  function ensureLeaderUi(){
    const zone=document.querySelector('#memberZoneLayer');
    if(!zone)return null;
    let nav=zone.querySelector('[data-zone-view="attendance"]');
    if(!nav){
      nav=document.createElement('button');
      nav.type='button';
      nav.className='zone-nav ob-attendance-nav';
      nav.dataset.zoneView='attendance';
      nav.innerHTML='◫ <span>Frekwencja</span>';
      nav.hidden=true;
      zone.querySelector('.zone-side-spacer')?.before(nav);
    }
    let panel=zone.querySelector('[data-zone-panel="attendance"]');
    if(!panel){
      panel=document.createElement('section');
      panel.className='zone-view';
      panel.dataset.zonePanel='attendance';
      panel.innerHTML='<div class="zone-section-head"><small>DOWÓDZTWO KLANU</small><h3>FREKWENCJA WYDARZEŃ</h3><p>Podgląd deklaracji Będę / Może / Nie będę dla nadchodzących wydarzeń.</p></div><div id="obAttendanceContent" class="ob-attendance-grid"><div class="ob-attendance-empty">Wybierz zakładkę, aby pobrać statystyki.</div></div>';
      zone.querySelector('.member-zone-main')?.appendChild(panel);
    }
    return {zone,nav,panel};
  }

  async function syncLeaderUi(profile=currentProfile){
    const ui=ensureLeaderUi();
    if(!ui)return;
    if(!profile)profile=await readProfile();
    const allowed=profile?.status==='approved'&&(profile.role==='leader'||profile.role==='owner');
    ui.nav.hidden=!allowed;
    if(!allowed&&ui.panel.classList.contains('active')){
      ui.panel.classList.remove('active');
      ui.zone.querySelector('[data-zone-panel="home"]')?.classList.add('active');
      ui.zone.querySelectorAll('.zone-nav').forEach((b)=>b.classList.toggle('active',b.dataset.zoneView==='home'));
    }
  }

  async function loadAttendance(){
    const ui=ensureLeaderUi();
    if(!ui)return;
    const profile=currentProfile||await readProfile();
    if(!(profile?.status==='approved'&&(profile.role==='leader'||profile.role==='owner')))return;
    const box=ui.zone.querySelector('#obAttendanceContent');
    if(!box)return;
    box.innerHTML='<div class="ob-attendance-empty">Ładowanie frekwencji…</div>';
    const now=new Date();
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const [{data:events,error:eventError},{data:signups,error:signupError}]=await Promise.all([
      supabase.from('events').select('id,name,type,event_date,event_time,location').gte('event_date',today).order('event_date',{ascending:true}).order('event_time',{ascending:true}).limit(40),
      supabase.from('event_signups').select('event_id,nickname,response,updated_at')
    ]);
    if(eventError||signupError){
      box.innerHTML=`<div class="ob-attendance-empty">Nie udało się pobrać statystyk${signupError?`: ${esc(signupError.message)}`:''}.</div>`;
      return;
    }
    const grouped=new Map();
    (signups||[]).forEach((s)=>{
      const key=String(s.event_id);
      if(!grouped.has(key))grouped.set(key,{yes:[],maybe:[],no:[]});
      if(grouped.get(key)[s.response])grouped.get(key)[s.response].push(s.nickname||'Gracz');
    });
    if(!(events||[]).length){box.innerHTML='<div class="ob-attendance-empty">Brak nadchodzących wydarzeń.</div>';return;}
    const labels={yes:'BĘDĘ',maybe:'MOŻE',no:'NIE BĘDĘ'};
    box.innerHTML=events.map((event)=>{
      const g=grouped.get(String(event.id))||{yes:[],maybe:[],no:[]};
      const date=new Date(`${event.event_date}T00:00:00`).toLocaleDateString('pl-PL');
      const time=String(event.event_time||'').slice(0,5);
      return `<article class="ob-attendance-card"><div class="ob-attendance-head"><div><small>${esc(event.type||'EVENT')} · ${esc(date)} · ${esc(time)}</small><b>${esc(event.name||'Wydarzenie')}</b></div><div class="ob-attendance-counts"><span class="yes">BĘDĘ<br>${g.yes.length}</span><span class="maybe">MOŻE<br>${g.maybe.length}</span><span class="no">NIE BĘDĘ<br>${g.no.length}</span></div></div><div class="ob-attendance-lists">${['yes','maybe','no'].map((key)=>`<div class="ob-attendance-list ${key}"><h4>${labels[key]} · ${g[key].length}</h4><p>${g[key].length?g[key].map(esc).join(', '):'Brak deklaracji'}</p></div>`).join('')}</div></article>`;
    }).join('');
  }

  function ensureRoleManagerShell(){
    const panel=document.querySelector('#ownerUsersPanel');
    if(!panel)return null;
    panel.classList.add('role-enhanced');
    let manager=panel.querySelector('#obRoleManager');
    if(!manager){
      manager=document.createElement('section');
      manager.id='obRoleManager';
      manager.className='ob-role-manager';
      manager.innerHTML=`<div class="ob-role-stats"><div class="ob-role-stat"><b data-role-stat="pending">0</b><span>Oczekuje</span></div><div class="ob-role-stat"><b data-role-stat="member">0</b><span>Członków</span></div><div class="ob-role-stat"><b data-role-stat="leader">0</b><span>Liderów</span></div><div class="ob-role-stat"><b data-role-stat="admin">0</b><span>Administratorów</span></div><div class="ob-role-stat"><b data-role-stat="blocked">0</b><span>Zablokowanych</span></div></div><div class="ob-role-help"><div><b>CZŁONEK</b><span>Strefa klanu, wydarzenia i własne zapisy.</span></div><div><b>LIDER</b><span>To samo co członek + statystyki frekwencji wydarzeń.</span></div><div><b>ADMINISTRATOR</b><span>Może edytować datę, godzinę i czas trwania istniejących wydarzeń.</span></div></div><div id="obRoleMessage" class="ob-role-message"></div><div id="obRoleList" class="ob-role-list"></div>`;
      panel.appendChild(manager);
    }
    return manager;
  }

  async function renderRoleManager(message=''){
    if(roleManagerBusy)return;
    const profile=currentProfile||await readProfile();
    if(!(profile?.status==='approved'&&profile.role==='owner'))return;
    const manager=ensureRoleManagerShell();
    if(!manager)return;
    roleManagerBusy=true;
    const msg=manager.querySelector('#obRoleMessage');
    const list=manager.querySelector('#obRoleList');
    if(msg)msg.textContent=message||'Ładowanie użytkowników…';
    try{
      const {data,error}=await supabase.from('profiles').select('id,nickname,role,status,created_at').order('created_at',{ascending:false});
      if(error)throw error;
      const rows=data||[];
      const setStat=(key,value)=>{const el=manager.querySelector(`[data-role-stat="${key}"]`);if(el)el.textContent=String(value)};
      setStat('pending',rows.filter(x=>x.status==='pending').length);
      setStat('member',rows.filter(x=>x.status==='approved'&&x.role==='member').length);
      setStat('leader',rows.filter(x=>x.status==='approved'&&x.role==='leader').length);
      setStat('admin',rows.filter(x=>x.status==='approved'&&x.role==='admin').length);
      setStat('blocked',rows.filter(x=>x.status==='blocked').length);
      list.innerHTML=rows.map((u)=>{
        const self=u.id===profile.id;
        const owner=u.role==='owner';
        const actions=(!self&&!owner)?`<button data-ob-role="member" data-user-id="${u.id}" class="${u.status==='approved'&&u.role==='member'?'active':''}">Członek</button><button data-ob-role="leader" data-user-id="${u.id}" class="${u.status==='approved'&&u.role==='leader'?'active':''}">Lider</button><button data-ob-role="admin" data-user-id="${u.id}" class="${u.status==='approved'&&u.role==='admin'?'active':''}">Administrator</button>${u.status!=='blocked'?`<button class="danger" data-ob-block data-user-id="${u.id}">Zablokuj</button>`:''}`:'<span>—</span>';
        return `<article class="ob-role-row"><div class="ob-role-user"><b>${esc(u.nickname)}</b><small>${self?'Twoje konto':new Date(u.created_at).toLocaleDateString('pl-PL')}</small></div><span class="ob-role-name">${esc(ROLE_LABELS[u.role]||u.role||'—')}</span><span class="ob-role-status ${esc(u.status)}">${esc(u.status)}</span><div class="ob-role-actions">${actions}</div></article>`;
      }).join('')||'<p>Brak użytkowników.</p>';
      if(msg)msg.textContent=message;
    }catch(error){if(msg)msg.textContent='Nie udało się pobrać użytkowników: '+String(error?.message||error)}
    finally{roleManagerBusy=false;}
  }

  async function setUserRole(userId,role){
    const manager=ensureRoleManagerShell();
    const msg=manager?.querySelector('#obRoleMessage');
    if(msg)msg.textContent='Zapisywanie…';
    const {error}=await supabase.from('profiles').update({role,status:'approved'}).eq('id',userId);
    await renderRoleManager(error?'Błąd: '+error.message:'Uprawnienia zostały zapisane.');
  }

  async function blockUser(userId){
    const manager=ensureRoleManagerShell();
    const msg=manager?.querySelector('#obRoleMessage');
    if(msg)msg.textContent='Blokowanie…';
    const {error}=await supabase.from('profiles').update({status:'blocked'}).eq('id',userId);
    await renderRoleManager(error?'Błąd: '+error.message:'Użytkownik został zablokowany.');
  }

  document.addEventListener('click',(event)=>{
    const roleButton=event.target.closest('[data-ob-role]');
    if(roleButton){event.preventDefault();event.stopPropagation();setUserRole(roleButton.dataset.userId,roleButton.dataset.obRole);return;}
    const blockButton=event.target.closest('[data-ob-block]');
    if(blockButton){event.preventDefault();event.stopPropagation();blockUser(blockButton.dataset.userId);return;}
    if(event.target.closest('[data-admin-tab="users"]'))setTimeout(()=>renderRoleManager(),250);
    if(event.target.closest('#refreshUsers'))setTimeout(()=>renderRoleManager(),250);
    if(event.target.closest('[data-zone-view="attendance"]'))setTimeout(loadAttendance,50);
    if(event.target.closest('.member-auth-entry'))setTimeout(applyRoleUi,100);
    if(event.target.closest('[data-edit]'))setTimeout(()=>{prepareAdminFormMarkers();if(document.documentElement.classList.contains('ob-limited-admin')){const title=document.querySelector('#formTitle');if(title)title.textContent='Edytuj termin wydarzenia';}},50);
  },true);

  supabase.auth.onAuthStateChange(()=>setTimeout(applyRoleUi,0));
  prepareAdminFormMarkers();
  ensureLeaderUi();
  applyRoleUi();
}

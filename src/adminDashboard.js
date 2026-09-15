const esc = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

export function installAdminDashboard(supabase) {
  const panel = document.querySelector('#adminModal .admin-panel');
  if (!panel || document.querySelector('#adminDashboardTabs')) return;
  const note = panel.querySelector('.admin-note');
  const listView = document.querySelector('#adminListView');
  const formView = document.querySelector('#adminFormView');
  const bosses = document.querySelector('#bossRespawnManager');
  const siege = document.querySelector('#siegeManager');
  const olympiad = document.querySelector('#olympiadSchedule');
  const pvp = document.querySelector('#pvpEventSchedule');

  const tabs = document.createElement('div');
  tabs.id='adminDashboardTabs';
  tabs.className='admin-dashboard-tabs';
  tabs.innerHTML=`<button class="active" data-admin-tab="events">✦ <span>Wydarzenia</span></button><button data-admin-tab="bosses">☠ <span>Epic Bossy</span></button><button data-admin-tab="siege">⚔ <span>Castle Siege</span></button><button data-admin-tab="schedule">◷ <span>Harmonogram</span></button><button data-admin-tab="users">♟ <span>Użytkownicy</span><b id="pendingUsersBadge" hidden>0</b></button>`;
  note.after(tabs);

  const users = document.createElement('section');
  users.id='ownerUsersPanel';
  users.className='owner-users-panel';
  users.hidden=true;
  users.innerHTML=`<div class="owner-users-head"><div><span class="eyebrow">Dostęp do strefy klanu</span><h3>UŻYTKOWNICY</h3></div><button id="refreshUsers" class="secondary-btn" type="button">↻ Odśwież</button></div><div class="owner-user-stats"><div><b id="usersPending">0</b><span>Oczekuje</span></div><div><b id="usersApproved">0</b><span>Aktywnych</span></div><div><b id="usersAdmins">0</b><span>Adminów</span></div><div><b id="usersBlocked">0</b><span>Zablokowanych</span></div></div><div id="ownerUsersMessage" class="owner-users-message"></div><div id="ownerUsersList" class="owner-users-list"></div>`;
  pvp.after(users);

  const style=document.createElement('style');
  style.textContent=`#adminModal .admin-panel{width:min(1180px,94vw);max-height:92vh;padding:0 28px 30px;overflow:auto}#adminModal .modal-header{position:sticky;top:0;z-index:20;margin:0 -28px;padding:22px 28px 16px;background:linear-gradient(#101414f8,#0b0e0ef2);border-bottom:1px solid #302819;backdrop-filter:blur(10px)}#adminModal .admin-note{margin:18px 0 12px}.admin-dashboard-tabs{position:sticky;top:83px;z-index:19;display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:0 0 22px;padding:8px;background:#080b0bee;border:1px solid #302819;backdrop-filter:blur(8px)}.admin-dashboard-tabs button{position:relative;min-height:54px;border:1px solid transparent;background:#111515;color:#8f8b82;font-weight:800;cursor:pointer}.admin-dashboard-tabs button:hover{color:#e5c373;border-color:#5d4725}.admin-dashboard-tabs button.active{color:#f0d18b;border-color:#a77a31;background:linear-gradient(#33240f,#171109);box-shadow:inset 0 0 18px #b9822b16}.admin-dashboard-tabs b{position:absolute;right:7px;top:6px;min-width:18px;padding:2px 5px;border-radius:20px;background:#9d3c2d;color:#fff;font-size:10px}.owner-users-panel{padding:4px 0 10px}.owner-users-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:16px}.owner-users-head h3{margin:3px 0;color:#ead08f;font-family:Georgia,serif;font-size:24px}.owner-user-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.owner-user-stats div{padding:15px;border:1px solid #342b1d;background:#0b0e0e;text-align:center}.owner-user-stats b{display:block;color:#e1b85e;font-size:24px}.owner-user-stats span{color:#817b70;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.owner-users-list{display:grid;gap:9px}.owner-user-row{display:grid;grid-template-columns:minmax(150px,1fr) 110px 120px minmax(260px,auto);align-items:center;gap:12px;padding:13px 15px;border:1px solid #30291e;background:linear-gradient(90deg,#101414,#0a0c0c)}.owner-user-name b{display:block;color:#eee;font-size:15px}.owner-user-name small{color:#68645d}.owner-user-role,.owner-user-status{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.owner-user-role{color:#d2aa5a}.owner-user-status.pending{color:#e6ad55}.owner-user-status.approved{color:#70b77b}.owner-user-status.blocked{color:#d06b61}.owner-user-actions{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}.owner-user-actions button{padding:8px 10px;border:1px solid #5c4928;background:#15120d;color:#d6b46d;font-size:11px;font-weight:800;cursor:pointer}.owner-user-actions button:hover{border-color:#c79743;color:#f1d38d}.owner-user-actions .danger{border-color:#66372f;color:#d98275}.owner-users-message{min-height:18px;margin-bottom:8px;color:#d6b46d;font-size:12px}body.admin-modal-open .next-carousel-controls,body.admin-modal-open .next-event-carousel-controls,body.admin-modal-open [class*="next-carousel"],body.admin-modal-open #nextEventCarouselControls{display:none!important}@media(max-width:760px){#adminModal .admin-panel{width:96vw;padding:0 14px 20px}#adminModal .modal-header{margin:0 -14px;padding:16px 14px 12px}.admin-dashboard-tabs{top:72px;grid-template-columns:repeat(5,minmax(66px,1fr));overflow-x:auto}.admin-dashboard-tabs button{font-size:17px}.admin-dashboard-tabs button span{display:block;font-size:9px;margin-top:3px}.owner-user-stats{grid-template-columns:1fr 1fr}.owner-user-row{grid-template-columns:1fr 1fr}.owner-user-actions{grid-column:1/-1;justify-content:flex-start}}`;
  document.head.appendChild(style);

  let currentTab='events';
  let currentProfile=null;
  let ownerAccess=false;
  const sections={events:[listView,formView],bosses:[bosses],siege:[siege],schedule:[olympiad,pvp],users:[users]};
  function showTab(name){if(name==='users'&&!ownerAccess)return;currentTab=name;Object.entries(sections).forEach(([key,els])=>els.forEach(el=>{if(el)el.hidden=key!==name;}));tabs.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===name));if(name==='users')loadUsers();}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-admin-tab]');if(b&&!b.hidden)showTab(b.dataset.adminTab);});

  async function resolveProfile(){
    const {data:{session}}=await supabase.auth.getSession();
    const userTab=tabs.querySelector('[data-admin-tab="users"]');
    if(!session){currentProfile=null;ownerAccess=false;userTab.hidden=true;return null;}
    const [{data:profile},{data:isOwner,error:ownerError}] = await Promise.all([
      supabase.from('profiles').select('id,nickname,role,status').eq('id',session.user.id).maybeSingle(),
      supabase.rpc('is_owner')
    ]);
    currentProfile=profile||null;
    ownerAccess=ownerError ? (currentProfile?.role==='owner'&&currentProfile?.status==='approved') : isOwner===true;
    userTab.hidden=!ownerAccess;
    if(ownerAccess) loadPendingBadge();
    return currentProfile;
  }
  async function loadPendingBadge(){
    if(!ownerAccess)return;
    const {count}=await supabase.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending');
    const badge=document.querySelector('#pendingUsersBadge');
    badge.textContent=count||0;badge.hidden=!count;
  }
  async function loadUsers(){
    await resolveProfile();
    const list=document.querySelector('#ownerUsersList'),msg=document.querySelector('#ownerUsersMessage');
    if(!ownerAccess){list.innerHTML='';msg.textContent='Ta sekcja jest dostępna tylko dla Ownera.';return;}
    msg.textContent='Ładowanie użytkowników…';
    const {data,error}=await supabase.from('profiles').select('id,nickname,role,status,created_at').order('created_at',{ascending:false});
    if(error){msg.textContent='Nie udało się pobrać użytkowników: '+error.message;return;}
    msg.textContent='';
    const rows=data||[];
    document.querySelector('#usersPending').textContent=rows.filter(x=>x.status==='pending').length;
    document.querySelector('#usersApproved').textContent=rows.filter(x=>x.status==='approved').length;
    document.querySelector('#usersAdmins').textContent=rows.filter(x=>x.role==='admin'&&x.status==='approved').length;
    document.querySelector('#usersBlocked').textContent=rows.filter(x=>x.status==='blocked').length;
    const pending=rows.filter(x=>x.status==='pending').length,badge=document.querySelector('#pendingUsersBadge');badge.textContent=pending;badge.hidden=!pending;
    list.innerHTML=rows.map(u=>{const self=u.id===currentProfile?.id;const owner=u.role==='owner';let actions='';if(!self&&!owner){if(u.status==='pending')actions+=`<button data-user-action="approve" data-user-id="${u.id}">✓ Akceptuj</button>`;if(u.status!=='blocked')actions+=`<button class="danger" data-user-action="block" data-user-id="${u.id}">⊘ Zablokuj</button>`;else actions+=`<button data-user-action="approve" data-user-id="${u.id}">↻ Odblokuj</button>`;if(u.status==='approved')actions+=u.role==='admin'?`<button data-user-action="member" data-user-id="${u.id}">Odbierz Admina</button>`:`<button data-user-action="admin" data-user-id="${u.id}">★ Nadaj Admina</button>`;}return `<article class="owner-user-row"><div class="owner-user-name"><b>${esc(u.nickname)}</b><small>${self?'Twoje konto':new Date(u.created_at).toLocaleDateString('pl-PL')}</small></div><span class="owner-user-role">${esc(u.role)}</span><span class="owner-user-status ${esc(u.status)}">${esc(u.status)}</span><div class="owner-user-actions">${actions||'<span>—</span>'}</div></article>`;}).join('')||'<p>Brak użytkowników.</p>';
  }
  users.addEventListener('click',async e=>{const b=e.target.closest('[data-user-action]');if(!b)return;b.disabled=true;const action=b.dataset.userAction;let patch={};if(action==='approve')patch={status:'approved',role:'member'};if(action==='block')patch={status:'blocked'};if(action==='admin')patch={role:'admin'};if(action==='member')patch={role:'member'};const {error}=await supabase.from('profiles').update(patch).eq('id',b.dataset.userId);document.querySelector('#ownerUsersMessage').textContent=error?'Błąd: '+error.message:'Zmiana zapisana.';await loadUsers();});
  document.querySelector('#refreshUsers').addEventListener('click',loadUsers);

  const modal=document.querySelector('#adminModal');
  const observer=new MutationObserver(async()=>{const open=modal.classList.contains('open');document.body.classList.toggle('admin-modal-open',open);if(open){await resolveProfile();if(currentTab==='users'&&!ownerAccess)showTab('events');else if(currentTab==='events'){listView.hidden=false;formView.hidden=true;}}});
  observer.observe(modal,{attributes:true,attributeFilter:['class']});
  supabase.auth.onAuthStateChange(()=>setTimeout(resolveProfile,0));
  resolveProfile();
  showTab('events');
}

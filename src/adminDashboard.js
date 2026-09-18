import { hasAdminPermission, loadAdminPermissionContext } from './adminPermissions.js';

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
  const adminTrigger = document.querySelector('#adminTrigger');
  const quickAdd = document.querySelector('#quickAdd');

  const tabs = document.createElement('div');
  tabs.id='adminDashboardTabs';
  tabs.className='admin-dashboard-tabs';
  tabs.setAttribute('role','tablist');
  tabs.setAttribute('aria-label','Sekcje panelu administratora');
  tabs.innerHTML=`<button class="active" type="button" role="tab" aria-selected="true" data-admin-tab="events"><i>✦</i><span>Wydarzenia</span><small>Kalendarz klanu</small></button><button type="button" role="tab" aria-selected="false" data-admin-tab="bosses"><i>☠</i><span>Epic Bossy</span><small>Okna i respawny</small></button><button type="button" role="tab" aria-selected="false" data-admin-tab="siege"><i>⚔</i><span>Castle Siege</span><small>Terminy zamków</small></button><button type="button" role="tab" aria-selected="false" data-admin-tab="schedule"><i>◷</i><span>Harmonogram</span><small>Stałe wydarzenia</small></button><button type="button" role="tab" aria-selected="false" data-admin-tab="content"><i>✎</i><span>Treści strony</span><small>Napisy, linki i ogłoszenia</small></button><button type="button" role="tab" aria-selected="false" data-admin-tab="users"><i>♟</i><span>Użytkownicy</span><small>Dostęp i role</small><b id="pendingUsersBadge" hidden>0</b></button>`;

  const users = document.createElement('section');
  users.id='ownerUsersPanel';
  users.className='owner-users-panel';
  users.hidden=true;
  users.innerHTML=`<div class="owner-users-head"><div><span class="eyebrow">Dostęp do strefy klanu</span><h3>UŻYTKOWNICY</h3></div><button id="refreshUsers" class="secondary-btn" type="button">↻ Odśwież</button></div><div class="owner-user-stats"><div><b id="usersPending">0</b><span>Oczekuje</span></div><div><b id="usersApproved">0</b><span>Aktywnych</span></div><div><b id="usersAdmins">0</b><span>Adminów</span></div><div><b id="usersBlocked">0</b><span>Zablokowanych</span></div></div><div id="ownerUsersMessage" class="owner-users-message"></div><div id="ownerUsersList" class="owner-users-list"></div>`;
  pvp.after(users);

  const siteContent=document.createElement('section');
  siteContent.id='adminSiteContentPanel';
  siteContent.className='admin-site-content-panel';
  siteContent.hidden=true;
  users.before(siteContent);

  const workspace=document.createElement('div');
  workspace.className='admin-workspace';
  const sidebar=document.createElement('aside');
  sidebar.className='admin-workspace-sidebar';
  sidebar.innerHTML=`<div class="admin-workspace-brand"><span>OB</span><div><small>CENTRUM ZARZĄDZANIA</small><b>ORZEŁ BIAŁY</b></div></div>`;
  const sidebarHelp=document.createElement('div');
  sidebarHelp.className='admin-workspace-help';
  sidebarHelp.innerHTML='<small>WSKAZÓWKA</small><p>Wybierz sekcję. Wszystkie zapisane zmiany są od razu widoczne dla klanu.</p>';
  sidebar.append(tabs,sidebarHelp);
  const content=document.createElement('div');
  content.className='admin-workspace-content';
  const contentHead=document.createElement('div');
  contentHead.className='admin-workspace-content-head';
  contentHead.innerHTML='<div><small data-admin-section-kicker>KALENDARZ KLANU</small><h3 data-admin-section-title>Wydarzenia</h3><p data-admin-section-description>Dodawaj, wyszukuj i edytuj wydarzenia klanowe.</p></div><span data-admin-section-state>AKTYWNA SEKCJA</span>';
  const feedback=document.querySelector('#adminFeedback');
  content.append(contentHead);
  if(feedback)content.append(feedback);
  content.append(listView,formView,bosses,siege,olympiad,pvp,siteContent,users);
  workspace.append(sidebar,content);
  note.after(workspace);

  const style=document.createElement('style');
  style.textContent=`#adminModal .admin-panel{width:min(1180px,94vw);max-height:92vh;padding:0 28px 30px;overflow:auto}#adminModal .modal-header{position:sticky;top:0;z-index:20;margin:0 -28px;padding:22px 28px 16px;background:linear-gradient(#101414f8,#0b0e0ef2);border-bottom:1px solid #302819;backdrop-filter:blur(10px)}#adminModal .admin-note{margin:18px 0 12px}.admin-dashboard-tabs{position:sticky;top:83px;z-index:19;display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:0 0 22px;padding:8px;background:#080b0bee;border:1px solid #302819;backdrop-filter:blur(8px)}.admin-dashboard-tabs button{position:relative;min-height:54px;border:1px solid transparent;background:#111515;color:#8f8b82;font-weight:800;cursor:pointer}.admin-dashboard-tabs button:hover{color:#e5c373;border-color:#5d4725}.admin-dashboard-tabs button.active{color:#f0d18b;border-color:#a77a31;background:linear-gradient(#33240f,#171109);box-shadow:inset 0 0 18px #b9822b16}.admin-dashboard-tabs b{position:absolute;right:7px;top:6px;min-width:18px;padding:2px 5px;border-radius:20px;background:#9d3c2d;color:#fff;font-size:10px}.owner-users-panel{padding:4px 0 10px}.owner-users-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:16px}.owner-users-head h3{margin:3px 0;color:#ead08f;font-family:Georgia,serif;font-size:24px}.owner-user-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.owner-user-stats div{padding:15px;border:1px solid #342b1d;background:#0b0e0e;text-align:center}.owner-user-stats b{display:block;color:#e1b85e;font-size:24px}.owner-user-stats span{color:#817b70;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.owner-users-list{display:grid;gap:9px}.owner-user-row{display:grid;grid-template-columns:minmax(150px,1fr) 110px 120px minmax(260px,auto);align-items:center;gap:12px;padding:13px 15px;border:1px solid #30291e;background:linear-gradient(90deg,#101414,#0a0c0c)}.owner-user-name b{display:block;color:#eee;font-size:15px}.owner-user-name small{color:#68645d}.owner-user-role,.owner-user-status{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.owner-user-role{color:#d2aa5a}.owner-user-status.pending{color:#e6ad55}.owner-user-status.approved{color:#70b77b}.owner-user-status.blocked{color:#d06b61}.owner-user-actions{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}.owner-user-actions button{padding:8px 10px;border:1px solid #5c4928;background:#15120d;color:#d6b46d;font-size:11px;font-weight:800;cursor:pointer}.owner-user-actions button:hover{border-color:#c79743;color:#f1d38d}.owner-user-actions .danger{border-color:#66372f;color:#d98275}.owner-users-message{min-height:18px;margin-bottom:8px;color:#d6b46d;font-size:12px}body.admin-modal-open .next-carousel-controls,body.admin-modal-open .next-event-carousel-controls,body.admin-modal-open [class*="next-carousel"],body.admin-modal-open #nextEventCarouselControls{display:none!important}.topbar .topbar-inner{gap:14px}.topbar .brand{flex:0 0 auto}.topbar .brand-logo{max-width:112px}.topbar .main-nav{gap:18px}.topbar .main-nav a{font-size:11px;white-space:nowrap}.topbar .header-actions{gap:10px;flex:0 0 auto}.topbar .header-actions .admin-trigger{padding-left:18px;padding-right:18px;white-space:nowrap}.topbar .header-clock{min-width:88px}@media(max-width:1250px){.topbar .main-nav{gap:11px}.topbar .main-nav a{font-size:10px}.topbar .header-actions .admin-trigger{padding-left:12px;padding-right:12px;font-size:10px}.topbar .brand-copy{font-size:20px}}@media(max-width:760px){#adminModal .admin-panel{width:96vw;padding:0 14px 20px}#adminModal .modal-header{margin:0 -14px;padding:16px 14px 12px}.admin-dashboard-tabs{top:72px;grid-template-columns:repeat(5,minmax(66px,1fr));overflow-x:auto}.admin-dashboard-tabs button{font-size:17px}.admin-dashboard-tabs button span{display:block;font-size:9px;margin-top:3px}.owner-user-stats{grid-template-columns:1fr 1fr}.owner-user-row{grid-template-columns:1fr 1fr}.owner-user-actions{grid-column:1/-1;justify-content:flex-start}}`;
  document.head.appendChild(style);

  let currentTab='events';
  let currentProfile=null;
  let ownerAccess=false;
  let adminAccess=false;
  let permissionContext={permissions:new Set(['manage_events']),isOwner:false,canOpenAdmin:false};
  const sections={events:[listView,formView],bosses:[bosses],siege:[siege],schedule:[olympiad,pvp],content:[siteContent],users:[users]};
  const sectionCopy={
    events:['KALENDARZ KLANU','Wydarzenia','Dodawaj, wyszukuj i edytuj wydarzenia klanowe.'],
    bosses:['EPIC RAID BOSS','Epic Bossy','Aktualizuj okna respawnu i stan najważniejszych bossów.'],
    siege:['CASTLE CONTROL','Castle Siege','Kontroluj terminy oblężeń wszystkich zamków.'],
    schedule:['STAŁY PLAN SERWERA','Harmonogram','Sprawdzaj Olimpiadę i automatyczne wydarzenia PvP.'],
    content:['EDYTOR BEZ KODOWANIA','Treści strony','Zmieniaj napisy, linki i ogłoszenia widoczne dla klanu.'],
    users:['STREFA KLANU','Użytkownicy i role','Akceptuj konta oraz zarządzaj dostępem członków klanu.'],
  };
  function updateSectionHead(name){const copy=sectionCopy[name];if(!copy)return;contentHead.querySelector('[data-admin-section-kicker]').textContent=copy[0];contentHead.querySelector('[data-admin-section-title]').textContent=copy[1];contentHead.querySelector('[data-admin-section-description]').textContent=copy[2];}
  const tabPermission={events:'manage_events',bosses:'manage_epic',siege:'manage_siege',content:'manage_content',users:'manage_users'};
  const tabAllowed=(name)=>tabPermission[name]?hasAdminPermission(permissionContext,tabPermission[name]):name==='schedule'&&(hasAdminPermission(permissionContext,'manage_events')||hasAdminPermission(permissionContext,'manage_siege'));
  function showTab(name){if(!tabAllowed(name))return;currentTab=name;Object.entries(sections).forEach(([key,els])=>els.forEach(el=>{if(el)el.hidden=key!==name;}));tabs.querySelectorAll('[data-admin-tab]').forEach(b=>{const active=b.dataset.adminTab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});updateSectionHead(name);content.scrollTop=0;if(name==='users')loadUsers();if(name==='content')window.dispatchEvent(new CustomEvent('orzel:admin-content-open'));}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-admin-tab]');if(b&&!b.hidden)showTab(b.dataset.adminTab);});

  function applyAccessUi(){
    if(adminTrigger) adminTrigger.hidden=!adminAccess;
    if(quickAdd) quickAdd.hidden=!adminAccess;
    tabs.querySelectorAll('[data-admin-tab]').forEach(button=>{button.hidden=!tabAllowed(button.dataset.adminTab)});
    for(const item of ['manage_events','manage_epic','manage_territories','manage_siege','manage_content','manage_users','manage_discord'])document.documentElement.classList.toggle(`ob-perm-${item.replaceAll('_','-')}`,hasAdminPermission(permissionContext,item));
    if(!adminAccess && document.querySelector('#adminModal')?.classList.contains('open')){
      document.querySelector('#adminModal').classList.remove('open');
      document.querySelector('#adminModal').setAttribute('aria-hidden','true');
    }
  }
  async function resolveProfile(){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){currentProfile=null;ownerAccess=false;adminAccess=false;applyAccessUi();return null;}
    permissionContext=await loadAdminPermissionContext(supabase);
    currentProfile=permissionContext.profile;
    ownerAccess=permissionContext.isOwner;
    adminAccess=permissionContext.canOpenAdmin;
    applyAccessUi();
    if(adminAccess&&!tabAllowed(currentTab)){
      const first=['events','bosses','siege','schedule','content','users'].find(tabAllowed);
      if(first)showTab(first);
    }
    if(hasAdminPermission(permissionContext,'manage_users')) loadPendingBadge();
    return currentProfile;
  }
  if(adminTrigger) adminTrigger.addEventListener('click',e=>{if(!adminAccess){e.preventDefault();e.stopImmediatePropagation();}},true);
  if(quickAdd) quickAdd.addEventListener('click',e=>{if(!adminAccess){e.preventDefault();e.stopImmediatePropagation();}},true);

  async function loadPendingBadge(){if(!hasAdminPermission(permissionContext,'manage_users'))return;const {count}=await supabase.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending');const badge=document.querySelector('#pendingUsersBadge');badge.textContent=count||0;badge.hidden=!count;}
  async function loadUsers(){await resolveProfile();const list=document.querySelector('#ownerUsersList'),msg=document.querySelector('#ownerUsersMessage');if(!hasAdminPermission(permissionContext,'manage_users')){list.innerHTML='';msg.textContent='Nie masz uprawnienia do zarządzania użytkownikami.';return;}msg.textContent='Ładowanie użytkowników…';const {data,error}=await supabase.from('profiles').select('id,nickname,role,status,created_at').order('created_at',{ascending:false});if(error){msg.textContent='Nie udało się pobrać użytkowników: '+error.message;return;}msg.textContent='';const rows=data||[];document.querySelector('#usersPending').textContent=rows.filter(x=>x.status==='pending').length;document.querySelector('#usersApproved').textContent=rows.filter(x=>x.status==='approved').length;document.querySelector('#usersAdmins').textContent=rows.filter(x=>x.role==='admin'&&x.status==='approved').length;document.querySelector('#usersBlocked').textContent=rows.filter(x=>x.status==='blocked').length;const pending=rows.filter(x=>x.status==='pending').length,badge=document.querySelector('#pendingUsersBadge');badge.textContent=pending;badge.hidden=!pending;list.innerHTML=rows.map(u=>{const self=u.id===currentProfile?.id;const owner=u.role==='owner';let actions='';if(!self&&!owner){if(u.status==='pending')actions+=`<button data-user-action="approve" data-user-id="${u.id}">✓ Akceptuj</button>`;if(u.status!=='blocked')actions+=`<button class="danger" data-user-action="block" data-user-id="${u.id}">⊘ Zablokuj</button>`;else actions+=`<button data-user-action="approve" data-user-id="${u.id}">↻ Odblokuj</button>`;if(u.status==='approved')actions+=u.role==='admin'?`<button data-user-action="member" data-user-id="${u.id}">Odbierz Admina</button>`:`<button data-user-action="admin" data-user-id="${u.id}">★ Nadaj Admina</button>`;}return `<article class="owner-user-row"><div class="owner-user-name"><b>${esc(u.nickname)}</b><small>${self?'Twoje konto':new Date(u.created_at).toLocaleDateString('pl-PL')}</small></div><span class="owner-user-role">${esc(u.role)}</span><span class="owner-user-status ${esc(u.status)}">${esc(u.status)}</span><div class="owner-user-actions">${actions||'<span>—</span>'}</div></article>`;}).join('')||'<p>Brak użytkowników.</p>';}
  users.addEventListener('click',async e=>{const b=e.target.closest('[data-user-action]');if(!b)return;b.disabled=true;const action=b.dataset.userAction;let patch={};if(action==='approve')patch={status:'approved',role:'member'};if(action==='block')patch={status:'blocked'};if(action==='admin')patch={role:'admin'};if(action==='member')patch={role:'member'};const {error}=await supabase.from('profiles').update(patch).eq('id',b.dataset.userId);document.querySelector('#ownerUsersMessage').textContent=error?'Błąd: '+error.message:'Zmiana zapisana.';await loadUsers();});
  document.querySelector('#refreshUsers').addEventListener('click',loadUsers);

  const modal=document.querySelector('#adminModal');
  const observer=new MutationObserver(async()=>{const open=modal.classList.contains('open');document.body.classList.toggle('admin-modal-open',open);if(open){await resolveProfile();if(!adminAccess)return;if(!tabAllowed(currentTab)){const first=['events','bosses','siege','schedule','content','users'].find(tabAllowed);if(first)showTab(first);}else if(currentTab==='events'){listView.hidden=false;formView.hidden=true;}}});
  observer.observe(modal,{attributes:true,attributeFilter:['class']});
  supabase.auth.onAuthStateChange(()=>setTimeout(resolveProfile,0));
  resolveProfile();
  showTab('events');
}

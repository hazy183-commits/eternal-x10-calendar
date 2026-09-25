import { adminClanIcon } from './adminClanIcons.js';
import { refreshVisitStats, hideVisitStats } from './siteVisitStats.js';
import { refreshReleases, hideReleases, installPreviewNotice } from './releaseManager.js';
import './adminDashboardHome.css';
import './adminWorkspace.css';
import './adminEventDayGroups.js';
import { supabase } from './supabaseClient.js';

export function installAdminHomeScreen(supabaseClient){
  if(!supabaseClient||window.__obAdminHomeInstalled)return;
  window.__obAdminHomeInstalled=true;
  installPreviewNotice();

  const waitForDashboard=()=>{
    const panel=document.querySelector('#adminModal .admin-panel');
    const tabs=document.querySelector('#adminDashboardTabs');
    const note=panel?.querySelector('.admin-note');
    if(!panel||!tabs||!note){setTimeout(waitForDashboard,120);return;}
    if(document.querySelector('#adminHomePanel'))return;

    const homeTab=document.createElement('button');
    homeTab.type='button';
    homeTab.setAttribute('role','tab');
    homeTab.setAttribute('aria-selected','false');
    homeTab.dataset.adminTab='home';
    homeTab.innerHTML=adminClanIcon('home')+'<span>Start</span><small>Podsumowanie</small>';
    tabs.prepend(homeTab);

    const home=document.createElement('section');
    home.id='adminHomePanel';
    home.hidden=true;
    home.innerHTML=`
      <div class="admin-home-hero">
        <small>CENTRUM DOWODZENIA · ORZEŁ BIAŁY</small>
        <h3>Panel główny</h3>
        <p>Szybki dostęp do zarządzania wydarzeniami, bossami, siege, harmonogramem oraz członkami klanu.</p>
      </div>
      <div class="admin-home-status">
        <div><small>Zalogowany jako</small><b id="adminHomeUser">—</b></div>
        <div><small>Poziom dostępu</small><b id="adminHomeAccess">—</b></div>
        <div><small>Wydarzenia</small><b id="adminHomeEvents">—</b></div>
        <div><small>Oczekujący</small><b id="adminHomePending">—</b></div>
      </div>
      <div class="admin-home-grid">
        <button class="admin-home-card" type="button" data-home-target="events">
          <span class="admin-home-icon">${adminClanIcon('events')}</span><small>KALENDARZ KLANU</small><h4>Wydarzenia</h4><p>Dodawaj, edytuj i porządkuj wydarzenia klanowe.</p><em>OTWÓRZ →</em>
        </button>
        <button class="admin-home-card owner-only" type="button" data-home-target="bosses">
          <span class="admin-home-icon">${adminClanIcon('bosses')}</span><small>EPIC RAID BOSS</small><h4>Epic Bossy</h4><p>Kontroluj ręczne okna, respawny i najważniejsze bossy.</p><em>OTWÓRZ →</em>
        </button>
        <button class="admin-home-card owner-only" type="button" data-home-target="siege">
          <span class="admin-home-icon">${adminClanIcon('siege')}</span><small>CASTLE CONTROL</small><h4>Castle Siege</h4><p>Zarządzaj terminami siege dla wszystkich zamków.</p><em>OTWÓRZ →</em>
        </button>
        <button class="admin-home-card owner-only" type="button" data-home-target="schedule">
          <span class="admin-home-icon">${adminClanIcon('schedule')}</span><small>STAŁY PLAN</small><h4>Harmonogram</h4><p>Olympiad, Auto PvP i stałe terminy serwerowe.</p><em>OTWÓRZ →</em>
        </button>
        <button class="admin-home-card owner-only" type="button" data-home-target="content">
          <span class="admin-home-icon">${adminClanIcon('content')}</span><small>EDYTOR STRONY</small><h4>Treści i ogłoszenia</h4><p>Zmieniaj nagłówki, opisy, linki oraz komunikaty bez edycji kodu.</p><em>EDYTUJ →</em>
        </button>
        <button class="admin-home-card users owner-only" type="button" data-home-target="users">
          <span class="admin-home-icon">${adminClanIcon('users')}</span><small>STREFA KLANU</small><h4>Użytkownicy i role</h4><p>Akceptuj nowych członków oraz nadaj rangę Członek, Lider lub Administrator.</p><em>ZARZĄDZAJ →</em>
        </button>
      </div>`;

    const content=document.querySelector('#adminModal .admin-workspace-content');
    const contentHead=content?.querySelector('.admin-workspace-content-head');
    if(contentHead)contentHead.after(home);else tabs.after(home);

    const originalButtons=[...tabs.querySelectorAll('[data-admin-tab]:not([data-admin-tab="home"])')];
    const managedSections=[
      document.querySelector('#adminListView'),document.querySelector('#adminFormView'),
      document.querySelector('#bossRespawnManager'),document.querySelector('#siegeManager'),
      document.querySelector('#olympiadSchedule'),document.querySelector('#pvpEventSchedule'),
      document.querySelector('#adminSiteContentPanel'),
      document.querySelector('#ownerUsersPanel')
    ].filter(Boolean);

    const hideHome=()=>{home.hidden=true;homeTab.classList.remove('active');homeTab.setAttribute('aria-selected','false');};
    originalButtons.forEach((button)=>button.addEventListener('click',hideHome,true));

    async function readProfile(){
      const {data:{session}}=await supabaseClient.auth.getSession();
      if(!session)return {session:null,profile:null};
      const {data:profile}=await supabaseClient.from('profiles').select('nickname,role,status,removed_at').eq('id',session.user.id).maybeSingle();
      return {session,profile:profile||null};
    }

    async function refreshHome(){
      hideVisitStats(home);
      hideReleases(home);
      const {session,profile}=await readProfile();
      if(!session)return;
      const role=String(profile?.role||'').toLowerCase();
      const owner=profile?.status==='approved'&&role==='owner'&&!profile?.removed_at;
      void refreshVisitStats(supabaseClient,home,owner);
      void refreshReleases(supabaseClient,home,owner);
      const admin=profile?.status==='approved'&&role==='admin';
      const legacy=!profile;
      const limited=admin&&!owner;
      home.querySelectorAll('.owner-only').forEach((el)=>el.hidden=limited);
      home.querySelector('#adminHomeUser').textContent=profile?.nickname||session.user?.email?.split('@')[0]||'Administrator';
      home.querySelector('#adminHomeAccess').textContent=owner?'PEŁNY · OWNER':admin?'OGRANICZONY · ADMIN':'ADMINISTRATOR';
      const {count:eventCount}=await supabaseClient.from('events').select('id',{count:'exact',head:true});
      home.querySelector('#adminHomeEvents').textContent=eventCount??'—';
      if(owner){
        const {count:pending}=await supabaseClient.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending');
        home.querySelector('#adminHomePending').textContent=pending??0;
      }else home.querySelector('#adminHomePending').textContent='—';
      if(legacy){home.querySelectorAll('.owner-only').forEach((el)=>el.hidden=false);}
    }

    const showHome=async()=>{
      managedSections.forEach((el)=>{el.hidden=true;});
      tabs.querySelectorAll('[data-admin-tab]').forEach((b)=>b.classList.remove('active'));
      homeTab.classList.add('active');
      tabs.querySelectorAll('[data-admin-tab]').forEach((b)=>b.setAttribute('aria-selected',String(b===homeTab)));
      home.hidden=false;
      if(contentHead){contentHead.querySelector('[data-admin-section-kicker]').textContent='CENTRUM DOWODZENIA';contentHead.querySelector('[data-admin-section-title]').textContent='Panel główny';contentHead.querySelector('[data-admin-section-description]').textContent='Najważniejsze informacje i szybki dostęp do zarządzania.';}
      content?.scrollTo?.({top:0,behavior:'instant'});
      await refreshHome();
    };

    homeTab.addEventListener('click',showHome);
    home.addEventListener('click',(event)=>{
      const card=event.target.closest('[data-home-target]');
      if(!card||card.hidden)return;
      const target=tabs.querySelector(`[data-admin-tab="${card.dataset.homeTarget}"]`);
      if(target&&!target.hidden)target.click();
    });

    const modal=document.querySelector('#adminModal');
    let wasOpen=false;
    const observer=new MutationObserver(()=>{
      const open=modal.classList.contains('open');
      if(open&&!wasOpen)setTimeout(showHome,30);
      wasOpen=open;
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});

    supabaseClient.auth.onAuthStateChange(()=>{hideVisitStats(home);hideReleases(home);setTimeout(()=>{if(modal.classList.contains('open'))refreshHome();},0);});
  };

  waitForDashboard();
}

// Wait until the module graph has initialized the shared Supabase client.
// Member features also import artwork, which imports this screen.
queueMicrotask(() => installAdminHomeScreen(supabase));


import './adminWorkflowEnhancements.css';
import { supabase } from './supabaseClient.js';

const esc=(value='')=>String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

export function installAdminWorkflowEnhancements(client=supabase){
  if(!client||window.__obAdminWorkflowInstalled)return;
  window.__obAdminWorkflowInstalled=true;

  let profile=null;
  let events=[];
  let loaded=false;

  async function readProfile(){
    const {data:{session}}=await client.auth.getSession();
    if(!session){profile=null;return null;}
    const {data}=await client.from('profiles').select('id,nickname,role,status').eq('id',session.user.id).maybeSingle();
    profile=data||null;
    return profile;
  }

  const limited=()=>profile?.status==='approved'&&profile?.role==='admin';
  const setTermMode=(active)=>document.documentElement.classList.toggle('ob-term-mode',Boolean(active&&limited()));

  function ensureOwnerIntro(){
    const listView=document.querySelector('#adminListView');
    if(!listView||listView.querySelector('.ob-admin-events-intro'))return;
    const intro=document.createElement('div');
    intro.className='ob-admin-events-intro';
    intro.innerHTML='<div><b>Wydarzenia klanowe</b><span>Wyszukuj, filtruj i edytuj wydarzenia z jednego miejsca.</span></div><em>SZYBKIE ZARZĄDZANIE</em>';
    listView.prepend(intro);
    const search=document.querySelector('#adminSearch');
    if(search)search.placeholder='Szukaj po nazwie lub bossie…';
  }

  function ensureTermManager(){
    let panel=document.querySelector('#adminTermManager');
    if(panel)return panel;
    const form=document.querySelector('#adminFormView');
    if(!form)return null;
    panel=document.createElement('section');
    panel.id='adminTermManager';
    panel.className='ob-term-manager';
    panel.innerHTML=`<div class="ob-term-head"><div><small>ADMINISTRATOR · ZARZĄDZANIE TERMINAMI</small><h3>Terminy wydarzeń</h3><p>Możesz zmieniać wyłącznie datę, godzinę i czas trwania istniejących wydarzeń.</p></div><input id="obTermSearch" class="ob-term-search" type="search" placeholder="Szukaj wydarzenia…" autocomplete="off"></div><div id="obTermMessage" class="ob-term-message"></div><div id="obTermList" class="ob-term-list"></div>`;
    form.after(panel);
    panel.querySelector('#obTermSearch').addEventListener('input',renderTerms);
    panel.addEventListener('click',async(event)=>{
      const button=event.target.closest('[data-term-save]');
      if(!button)return;
      const row=button.closest('.ob-term-row');
      if(!row)return;
      const id=row.dataset.eventId;
      const eventDate=row.querySelector('[data-term-date]')?.value;
      const eventTime=row.querySelector('[data-term-time]')?.value;
      const durationRaw=row.querySelector('[data-term-duration]')?.value;
      const duration=durationRaw?Number(durationRaw):null;
      const message=panel.querySelector('#obTermMessage');
      if(!eventDate||!eventTime||!Number.isFinite(duration)||duration<1||duration>1440){message.textContent='Sprawdź datę, godzinę i czas trwania.';return;}
      button.disabled=true;
      message.textContent='Zapisywanie zmian…';
      const {error}=await client.from('events').update({event_date:eventDate,event_time:eventTime,duration_minutes:duration}).eq('id',id);
      if(error){message.textContent='Nie udało się zapisać: '+error.message;button.disabled=false;return;}
      const found=events.find((item)=>String(item.id)===String(id));
      if(found){found.event_date=eventDate;found.event_time=eventTime;found.duration_minutes=duration;}
      message.textContent='Termin został zapisany.';
      button.textContent='Zapisano ✓';
      setTimeout(()=>{button.textContent='Zapisz';button.disabled=false;},1200);
    });
    return panel;
  }

  function renderTerms(){
    const panel=ensureTermManager();
    if(!panel)return;
    const list=panel.querySelector('#obTermList');
    const q=panel.querySelector('#obTermSearch')?.value?.trim().toLowerCase()||'';
    const filtered=events.filter((item)=>!q||`${item.name||''} ${item.type||''} ${item.location||''}`.toLowerCase().includes(q));
    list.innerHTML=filtered.map((item)=>`<article class="ob-term-row" data-event-id="${esc(item.id)}"><div class="ob-term-event"><b>${esc(item.name||'Wydarzenie')}</b><small>${esc(item.type||'EVENT')}${item.location?` · ${esc(item.location)}`:''}</small></div><label class="ob-term-field">Data<input data-term-date type="date" value="${esc(item.event_date||'')}"></label><label class="ob-term-field">Godzina<input data-term-time type="time" value="${esc(String(item.event_time||'').slice(0,5))}"></label><label class="ob-term-field duration">Czas (min)<input data-term-duration type="number" min="1" max="1440" value="${Number(item.duration_minutes||60)}"></label><button class="ob-term-save" type="button" data-term-save>Zapisz</button></article>`).join('')||'<div class="ob-term-message">Brak wydarzeń pasujących do wyszukiwania.</div>';
  }

  async function loadTerms(force=false){
    if(!limited())return;
    if(loaded&&!force){renderTerms();return;}
    const panel=ensureTermManager();
    if(!panel)return;
    const message=panel.querySelector('#obTermMessage');
    message.textContent='Ładowanie wydarzeń…';
    const {data,error}=await client.from('events').select('id,name,type,location,event_date,event_time,duration_minutes').gte('event_date',todayKey()).order('event_date',{ascending:true}).order('event_time',{ascending:true}).limit(100);
    if(error){message.textContent='Nie udało się pobrać wydarzeń: '+error.message;return;}
    events=data||[];loaded=true;message.textContent=`Nadchodzące wydarzenia: ${events.length}`;renderTerms();
  }

  async function sync(){
    await readProfile();
    ensureOwnerIntro();
    ensureTermManager();
    document.documentElement.classList.toggle('ob-workflow-limited',limited());
    if(!limited())setTermMode(false);
    const eventTab=document.querySelector('#adminDashboardTabs [data-admin-tab="events"]');
    if(eventTab&&limited())eventTab.setAttribute('aria-label','Zarządzanie terminami');
  }

  const wait=()=>{
    if(!document.querySelector('#adminDashboardTabs')||!document.querySelector('#adminFormView')){setTimeout(wait,120);return;}
    sync();
    const modal=document.querySelector('#adminModal');
    let open=false;
    new MutationObserver(()=>{
      const now=modal.classList.contains('open');
      if(now&&!open)setTimeout(async()=>{await sync();setTermMode(false);},60);
      if(!now)setTermMode(false);
      open=now;
    }).observe(modal,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',(event)=>{
      if(event.target.closest('[data-admin-tab="events"]')&&limited()){
        setTermMode(true);
        setTimeout(()=>loadTerms(),40);
        return;
      }
      if(event.target.closest('[data-home-target="events"]')&&limited()){
        setTermMode(true);
        setTimeout(()=>loadTerms(),100);
        return;
      }
      if(event.target.closest('[data-admin-tab="home"]'))setTermMode(false);
      if(event.target.closest('[data-admin-tab="bosses"],[data-admin-tab="siege"],[data-admin-tab="schedule"],[data-admin-tab="users"]'))setTermMode(false);
    },true);
    client.auth.onAuthStateChange(()=>setTimeout(()=>{loaded=false;setTermMode(false);sync();},0));
  };
  wait();
}

queueMicrotask(()=>installAdminWorkflowEnhancements(supabase));

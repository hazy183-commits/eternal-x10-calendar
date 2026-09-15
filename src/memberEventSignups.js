export function installMemberEventSignups(supabase){
  if(!supabase || window.__memberEventSignupsInstalled) return;
  window.__memberEventSignupsInstalled=true;
  const css=document.createElement('style');
  css.textContent=`.zone-signup-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.zone-signup-btn{padding:6px 8px;border:1px solid #5d4825;background:#0b0f0f;color:#a49d90;font-size:9px;font-weight:900;cursor:pointer}.zone-signup-btn:hover,.zone-signup-btn.active{border-color:#c4943e;color:#f0c96f;background:#2b1e0e}.zone-signup-btn[data-choice="no"].active{border-color:#85483d;color:#df8173;background:#25110f}.zone-signup-summary{display:flex;gap:8px;margin-top:5px;color:#777168;font-size:9px}.zone-my-signup{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #282218}.zone-choice{padding:5px 8px;border:1px solid #755523;color:#d9aa50;font-size:9px;font-weight:900}`;
  document.head.appendChild(css);
  const labels={yes:'BĘDĘ',maybe:'MOŻE',no:'NIE BĘDĘ'};
  const getUser=async()=>{const {data}=await supabase.auth.getUser();return data?.user||null};
  async function save(eventId,choice){
    const user=await getUser(); if(!user) return;
    const {error}=await supabase.from('event_signups').upsert({event_id:eventId,user_id:user.id,status:choice,updated_at:new Date().toISOString()},{onConflict:'event_id,user_id'});
    if(error){console.error('signup',error);alert('Nie udało się zapisać deklaracji: '+error.message);return}
    await refresh();
  }
  async function refresh(){
    const user=await getUser(); if(!user) return;
    const {data,error}=await supabase.from('event_signups').select('event_id,status').eq('user_id',user.id);
    if(error){console.warn('event_signups',error.message);return}
    const mine=new Map((data||[]).map(x=>[String(x.event_id),x.status]));
    document.querySelectorAll('#memberZoneLayer .zone-event-row').forEach(row=>{
      const id=row.dataset.eventId; if(!id)return;
      let actions=row.querySelector('.zone-signup-actions');
      if(!actions){actions=document.createElement('div');actions.className='zone-signup-actions';row.appendChild(actions)}
      actions.innerHTML=['yes','maybe','no'].map(c=>`<button class="zone-signup-btn ${mine.get(String(id))===c?'active':''}" data-choice="${c}">${labels[c]}</button>`).join('');
      actions.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();save(id,b.dataset.choice)});
    });
    const panel=document.querySelector('[data-zone-panel="signups"]');
    if(panel){
      let box=panel.querySelector('.zone-signups-live');
      if(!box){box=document.createElement('div');box.className='zone-signups-live zone-card';panel.querySelector('.zone-empty')?.remove();panel.appendChild(box)}
      const rows=[...document.querySelectorAll('#memberAllEvents .zone-event-row')].filter(r=>mine.has(String(r.dataset.eventId)));
      box.innerHTML=rows.length?rows.map(r=>{const id=String(r.dataset.eventId),date=r.querySelector('.zone-event-date')?.textContent||'',info=r.querySelector('.zone-event-info')?.innerHTML||'';return `<div class="zone-my-signup"><div class="zone-event-date">${date}</div><div class="zone-event-info">${info}</div><span class="zone-choice">${labels[mine.get(id)]||mine.get(id)}</span></div>`}).join(''):'<p class="zone-muted">Nie masz jeszcze żadnych deklaracji. Wejdź w „Wydarzenia” i wybierz Będę / Może / Nie będę.</p>';
    }
  }
  const observer=new MutationObserver(()=>{clearTimeout(window.__signupTimer);window.__signupTimer=setTimeout(refresh,120)});
  const zone=document.querySelector('#memberZoneLayer'); if(zone) observer.observe(zone,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-zone-view="events"],[data-zone-view="signups"],[data-zone-go="events"]'))setTimeout(refresh,150)});
  window.refreshMemberEventSignups=refresh;
  setTimeout(refresh,400);
}

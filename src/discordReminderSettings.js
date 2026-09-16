import { getClanUpcomingEvents } from './clanEventFeed.js';

const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eventKey=id=>/^\d+$/.test(String(id))?`event-${id}`:String(id);

export function installDiscordReminderSettings(supabase){
  if(!supabase||window.__obDiscordReminderSettingsInstalled)return;
  window.__obDiscordReminderSettingsInstalled=true;

  const wait=()=>{
    const zone=document.querySelector('#memberZoneLayer');
    const panel=zone?.querySelector('[data-zone-panel="content-editor"]');
    const grid=panel?.querySelector('.ob-owner-grid');
    const editor=panel?.querySelector('#obEditorArea');
    const feedback=panel?.querySelector('#obEditorFeedback');
    if(!zone||!panel||!grid||!editor||!feedback){setTimeout(wait,200);return}
    if(panel.querySelector('#obDiscordReminderCard'))return;

    const style=document.createElement('style');
    style.textContent=`
      .ob-discord-form{display:grid;gap:12px;padding:14px;border:1px solid #49391f;background:#0b0e0e;margin:12px 0}
      .ob-discord-form label{display:grid;gap:6px;color:#b1a58f;font-size:9px;font-weight:800}.ob-discord-form input,.ob-discord-form select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #443824;background:#080b0b;color:#eee}
      .ob-discord-check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center;gap:8px!important}.ob-discord-check input{width:auto!important}
      .ob-discord-events{display:grid;gap:8px}.ob-discord-event{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:10px;border:1px solid #332a1d;background:#090d0d}.ob-discord-event b{display:block;color:#ddd;font-size:11px}.ob-discord-event small{color:#7f7a70}.ob-discord-event select{padding:7px;background:#080b0b;color:#ddd;border:1px solid #4a3b23}.ob-discord-event button{padding:7px 9px;border:1px solid #765724;background:#17120b;color:#e1b75e;font-size:8px;font-weight:900;cursor:pointer}
      @media(max-width:700px){.ob-discord-event{grid-template-columns:1fr}.ob-discord-event select,.ob-discord-event button{width:100%}}
    `;
    document.head.appendChild(style);

    const card=document.createElement('section');
    card.id='obDiscordReminderCard';card.className='ob-owner-box';
    card.innerHTML='<h4>Discord przypomnienia</h4><p class="zone-muted">Automatyczna wiadomość przed bossem, siege lub innym wydarzeniem.</p><button class="ob-editor-btn" id="obOpenDiscordReminders">USTAW PRZYPOMNIENIA</button>';
    grid.appendChild(card);

    const profile=async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return null;const {data}=await supabase.from('profiles').select('id,role,status').eq('id',session.user.id).maybeSingle();return data||null};
    const owner=async()=>{const p=await profile();return p?.status==='approved'&&String(p.role||'').toLowerCase()==='owner'?p:null};

    async function show(){
      const p=await owner();if(!p)return;
      const [{data:s},{data:o}]=await Promise.all([
        supabase.from('discord_notification_settings').select('webhook_url,enabled,reminder_minutes').eq('id',true).maybeSingle(),
        supabase.from('discord_event_reminder_overrides').select('event_key,enabled,reminder_minutes')
      ]);
      const overrides=new Map((o||[]).map(x=>[x.event_key,x]));
      const events=getClanUpcomingEvents().slice(0,30);
      const rows=events.map(e=>{const k=eventKey(e.id),x=overrides.get(k);const enabled=x?.enabled!==false;const mins=x?.reminder_minutes??s?.reminder_minutes??30;return `<div class="ob-discord-event" data-event-key="${esc(k)}"><div><b>${esc(e.name||'Wydarzenie')}</b><small>${esc(e.date||e.event_date||'')} ${esc(String(e.time||e.event_time||'').slice(0,5))}${e.location?` · ${esc(e.location)}`:''}</small></div><select data-reminder-minutes><option value="30" ${mins===30?'selected':''}>30 min</option><option value="15" ${mins===15?'selected':''}>15 min</option><option value="10" ${mins===10?'selected':''}>10 min</option></select><button type="button" data-reminder-toggle data-enabled="${enabled?'1':'0'}">${enabled?'WŁĄCZONE':'WYŁĄCZONE'}</button></div>`}).join('');
      editor.innerHTML=`<form id="obDiscordReminderForm" class="ob-discord-form"><label class="ob-discord-check"><input id="obDiscordEnabled" type="checkbox" ${s?.enabled?'checked':''}><span>Włącz automatyczne przypomnienia</span></label><label>Domyślnie ile minut wcześniej<select id="obDiscordMinutes"><option value="30" ${Number(s?.reminder_minutes||30)===30?'selected':''}>30 minut</option><option value="15" ${Number(s?.reminder_minutes)===15?'selected':''}>15 minut</option><option value="10" ${Number(s?.reminder_minutes)===10?'selected':''}>10 minut</option></select></label><label>Discord Webhook<input id="obDiscordWebhook" type="password" placeholder="${s?.webhook_url?'Webhook jest zapisany — wklej nowy tylko gdy chcesz go zmienić':'Wklej URL webhooka Discord'}"></label><div class="ob-ann-actions"><button class="ob-save-settings" type="submit">ZAPISZ</button><button type="button" id="obDiscordTest">WYŚLIJ TEST</button><button type="button" id="obDiscordClose">ANULUJ</button></div><div><b style="color:#d8b15e;font-size:10px">Wydarzenia</b><p class="zone-muted">Dla każdego wydarzenia możesz wyłączyć przypomnienie lub ustawić 30 / 15 / 10 minut.</p><div class="ob-discord-events">${rows||'<p class="zone-muted">Brak nadchodzących wydarzeń.</p>'}</div></div></form>`;

      editor.querySelector('#obDiscordClose').onclick=()=>editor.innerHTML='';
      editor.querySelector('#obDiscordReminderForm').onsubmit=async ev=>{
        ev.preventDefault();const current=await owner();if(!current)return;
        feedback.textContent='Zapisywanie…';
        const webhook=editor.querySelector('#obDiscordWebhook').value.trim();
        const row={id:true,enabled:editor.querySelector('#obDiscordEnabled').checked,reminder_minutes:Number(editor.querySelector('#obDiscordMinutes').value),updated_by:current.id,updated_at:new Date().toISOString()};
        if(webhook)row.webhook_url=webhook;
        const r=await supabase.from('discord_notification_settings').upsert(row,{onConflict:'id'});
        if(!r.error)await supabase.from('site_settings').upsert({key:'public_site_url',value:location.origin,updated_by:current.id,updated_at:new Date().toISOString()},{onConflict:'key'});
        feedback.textContent=r.error?'Nie udało się zapisać.':'✓ Ustawienia przypomnień zapisane.';
      };
      editor.querySelector('#obDiscordTest').onclick=async()=>{feedback.textContent='Wysyłam test…';const {data,error}=await supabase.rpc('test_discord_notification');feedback.textContent=error?'Test nieudany.':(data?.ok?'✓ Wiadomość testowa wysłana.':(data?.message||'Brak webhooka.'))};
      editor.querySelectorAll('[data-reminder-toggle]').forEach(btn=>btn.onclick=async()=>{const parent=btn.closest('[data-event-key]'),key=parent.dataset.eventKey,enabled=btn.dataset.enabled!=='1',minutes=Number(parent.querySelector('[data-reminder-minutes]').value);const current=await owner();if(!current)return;const r=await supabase.from('discord_event_reminder_overrides').upsert({event_key:key,enabled,reminder_minutes:minutes,updated_by:current.id,updated_at:new Date().toISOString()},{onConflict:'event_key'});if(!r.error){btn.dataset.enabled=enabled?'1':'0';btn.textContent=enabled?'WŁĄCZONE':'WYŁĄCZONE'}});
      editor.querySelectorAll('[data-reminder-minutes]').forEach(sel=>sel.onchange=async()=>{const parent=sel.closest('[data-event-key]'),key=parent.dataset.eventKey,enabled=parent.querySelector('[data-reminder-toggle]').dataset.enabled==='1',minutes=Number(sel.value),current=await owner();if(!current)return;await supabase.from('discord_event_reminder_overrides').upsert({event_key:key,enabled,reminder_minutes:minutes,updated_by:current.id,updated_at:new Date().toISOString()},{onConflict:'event_key'})});
    }

    card.querySelector('#obOpenDiscordReminders').onclick=show;
  };
  wait();
}

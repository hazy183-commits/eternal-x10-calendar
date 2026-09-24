import { confirmLocalized } from './i18nCore.js';
import { canAccessClanView, switchClanView } from './clanViewAccess.js';
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function installClanContentManager(supabase){
  if(!supabase||window.__obClanContentManagerInstalled)return;
  window.__obClanContentManagerInstalled=true;

  const wait=()=>{
    const zone=document.querySelector('#memberZoneLayer');
    const side=zone?.querySelector('.member-zone-side');
    const main=zone?.querySelector('.member-zone-main');
    if(!zone||!side||!main){setTimeout(wait,150);return}
    boot(zone,side,main);
  };

  async function profile(){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return null;
    const {data}=await supabase.from('profiles').select('id,nickname,role,status').eq('id',session.user.id).maybeSingle();
    return data||null;
  }

  async function boot(zone,side,main){
    if(zone.querySelector('[data-zone-view="content-editor"]'))return;
    const style=document.createElement('style');
    style.textContent=`
      .ob-content-nav{position:relative}.ob-content-panel{max-width:900px}
      .ob-ann-toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:12px 0}
      .ob-ann-add,.ob-save-settings,.ob-editor-btn{padding:9px 12px;border:1px solid #765724;background:#17120b;color:#e1b75e;font-weight:900;font-size:9px;cursor:pointer}
      .ob-ann-list{display:grid;gap:10px}.ob-ann-item{padding:14px;border:1px solid #3d3222;background:#0a0e0e}
      .ob-ann-item h4{margin:0 0 5px;color:#e8dfd0;font:700 16px Georgia}.ob-ann-item p{margin:0;color:#8d887f;font-size:11px;line-height:1.5;white-space:pre-wrap}
      .ob-ann-meta{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:9px;color:#746f67;font-size:8px}.ob-ann-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.ob-ann-actions button{padding:7px 9px;border:1px solid #4c3d25;background:#11100c;color:#cfa753;font-size:8px;font-weight:900;cursor:pointer}
      .ob-ann-form,.ob-settings-form{display:grid;gap:9px;padding:14px;border:1px solid #49391f;background:#0b0e0e;margin:12px 0}.ob-ann-form label,.ob-settings-form label{display:grid;gap:5px;color:#b1a58f;font-size:9px;font-weight:800}.ob-ann-form input,.ob-ann-form textarea,.ob-settings-form input,.ob-settings-form textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #443824;background:#080b0b;color:#eee}.ob-ann-form textarea,.ob-settings-form textarea{min-height:82px;resize:vertical}
      .ob-owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ob-owner-box{padding:14px;border:1px solid #3d3222;background:#0a0e0e}.ob-owner-box h4{margin:0 0 8px;color:#e0b75d;font:700 15px Georgia}.ob-editor-feedback{min-height:18px;color:#d8b15e;font-size:10px}.ob-inline-admin{display:inline-flex;gap:6px;margin-left:8px}.ob-home-announcements .zone-announcement{position:relative}
      @media(max-width:700px){.ob-owner-grid{grid-template-columns:1fr}.ob-ann-toolbar{align-items:stretch;flex-direction:column}.ob-ann-actions{display:grid;grid-template-columns:1fr 1fr}.ob-ann-actions button{width:100%}.ob-content-panel{width:100%}}
    `;
    document.head.appendChild(style);

    const annPanel=main.querySelector('[data-zone-panel="announcements"]');
    if(annPanel)annPanel.innerHTML=`<div class="zone-section-head"><small>INFORMACJE</small><h3>OGŁOSZENIA KLANOWE</h3><p>Aktualne informacje od dowództwa klanu.</p></div><div id="obAnnouncementsView" class="ob-ann-list"><p class="zone-muted">Ładowanie ogłoszeń…</p></div>`;

    const homeCard=main.querySelector('[data-zone-go="announcements"]')?.closest('.zone-card');
    if(homeCard){
      homeCard.classList.add('ob-home-announcements');
      const title=homeCard.querySelector('.zone-card-title');
      homeCard.innerHTML='';
      if(title)homeCard.appendChild(title);
      const box=document.createElement('div');box.id='obHomeAnnouncements';homeCard.appendChild(box);
    }

    const nav=document.createElement('button');
    nav.type='button';nav.className='zone-nav ob-content-nav';nav.dataset.zoneView='content-editor';nav.hidden=true;nav.innerHTML='✎ <span>Edycja</span>';
    side.querySelector('.zone-side-spacer')?.before(nav);

    const panel=document.createElement('section');panel.className='zone-view ob-content-panel';panel.dataset.zonePanel='content-editor';panel.hidden=true;panel.innerHTML=`
      <div class="zone-section-head"><small>OWNER</small><h3>EDYCJA STREFY KLANU</h3><p>Zmieniaj najważniejsze treści bez grzebania w kodzie.</p></div>
      <div class="ob-owner-grid">
        <section class="ob-owner-box"><h4>Ogłoszenia</h4><p class="zone-muted">Dodawaj, edytuj, przypinaj i usuwaj ogłoszenia.</p><button class="ob-editor-btn" id="obNewAnnouncement">+ DODAJ OGŁOSZENIE</button></section>
        <section class="ob-owner-box"><h4>Ustawienia strony</h4><p class="zone-muted">Nazwa klanu, serwer, tekst powitalny, motto i linki.</p><button class="ob-editor-btn" id="obOpenSettings">EDYTUJ USTAWIENIA</button></section>
      </div>
      <div id="obEditorArea"></div><p id="obEditorFeedback" class="ob-editor-feedback"></p>`;
    main.appendChild(panel);

    const editor=panel.querySelector('#obEditorArea');const feedback=panel.querySelector('#obEditorFeedback');
    let canEdit=false;let settings={};let announcements=[];

    const getRole=async()=>{const p=await profile();canEdit=canAccessClanView(p,'content-editor');nav.hidden=!canEdit;panel.hidden=!canEdit;if(!canEdit){editor.innerHTML='';feedback.textContent='';if(panel.classList.contains('active'))switchClanView(zone,p,'home')}return p};
    const isStaff=()=>canEdit;
    const requireOwner=async()=>{await getRole();return canEdit};

    const loadSettings=async()=>{const {data}=await supabase.from('site_settings').select('key,value');settings=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));applySettings()};
    const applySettings=()=>{
      const sub=main.querySelector('header p');if(sub&&settings.welcome_subtitle){sub.toggleAttribute('data-no-i18n',settings.welcome_subtitle!=='Dobrze, że jesteś z nami.');sub.textContent=settings.welcome_subtitle};
      const quote=main.querySelector('header em');if(quote&&settings.clan_quote){quote.toggleAttribute('data-no-i18n',!['Siła klanu tkwi w ludziach, nie w pixelach.','„Siła klanu tkwi w ludziach, nie w pixelach.”'].includes(settings.clan_quote));quote.textContent=settings.clan_quote};
      const cards=main.querySelectorAll('.member-zone-grid div span');if(cards[0]&&settings.clan_name)cards[0].textContent=settings.clan_name;if(cards[1]&&settings.server_name)cards[1].textContent=settings.server_name;
      const links=main.querySelectorAll('.zone-stack a');if(links[0]&&settings.discord_url)links[0].href=settings.discord_url;if(links[1]&&settings.youtube_url)links[1].href=settings.youtube_url;if(links[2]&&settings.server_url)links[2].href=settings.server_url;
    };

    const loadAnnouncements=async()=>{
      const p=await getRole();
      // Private clan content is queried only after an authenticated profile exists.
      if(!p){announcements=[];renderAnnouncements();return}
      const {data,error}=await supabase.from('clan_announcements').select('id,title,body,is_pinned,is_active,created_at,updated_at').order('is_pinned',{ascending:false}).order('created_at',{ascending:false});
      if(error){console.error('ANNOUNCEMENTS LOAD FAILED',error);return}
      announcements=data||[];
      renderAnnouncements();
    };
    const renderAnnouncements=()=>{
      const visible=announcements.filter(a=>a.is_active);
      const full=annPanel?.querySelector('#obAnnouncementsView');
      const home=main.querySelector('#obHomeAnnouncements');
      const cardHtml=(a,manage=false)=>`<article class="ob-ann-item" data-ann-id="${a.id}"><h4>${a.is_pinned?'📌 ':''}${esc(a.title)}</h4><p>${esc(a.body)}</p><div class="ob-ann-meta"><span>${new Date(a.created_at).toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'})}</span><span>${a.is_active?'AKTYWNE':'UKRYTE'}</span></div>${manage?`<div class="ob-ann-actions"><button data-ann-edit="${a.id}">EDYTUJ</button><button data-ann-pin="${a.id}">${a.is_pinned?'ODEPNIJ':'PRZYPNIJ'}</button><button data-ann-toggle="${a.id}">${a.is_active?'UKRYJ':'POKAŻ'}</button><button data-ann-delete="${a.id}">USUŃ</button></div>`:''}</article>`;
      if(full)full.innerHTML=visible.length?visible.map(a=>cardHtml(a,isStaff())).join(''):'<div class="zone-empty">Brak aktywnych ogłoszeń.</div>';
      if(home)home.innerHTML=visible.length?visible.slice(0,2).map(a=>`<div class="zone-announcement"><b>${a.is_pinned?'📌 ':''}${esc(a.title)}</b><p>${esc(a.body)}</p></div>`).join(''):'<p class="zone-muted">Brak aktualnych ogłoszeń.</p>';
    };

    const showAnnouncementForm=async(item=null)=>{if(!await requireOwner())return;editor.innerHTML=`<form id="obAnnForm" class="ob-ann-form"><label>Tytuł<input id="obAnnTitle" maxlength="100" required value="${esc(item?.title||'')}"></label><label>Treść<textarea id="obAnnBody" maxlength="1500" required>${esc(item?.body||'')}</textarea></label><label><span><input id="obAnnPinned" type="checkbox" ${item?.is_pinned?'checked':''}> Przypnij na górze</span></label><div class="ob-ann-actions"><button class="ob-ann-add" type="submit">${item?'ZAPISZ ZMIANY':'DODAJ OGŁOSZENIE'}</button><button type="button" id="obCancelEditor">ANULUJ</button></div></form>`;editor.querySelector('#obCancelEditor').onclick=()=>editor.innerHTML='';editor.querySelector('#obAnnForm').onsubmit=async e=>{e.preventDefault();if(!await requireOwner())return;feedback.textContent='Zapisywanie…';const row={title:editor.querySelector('#obAnnTitle').value.trim(),body:editor.querySelector('#obAnnBody').value.trim(),is_pinned:editor.querySelector('#obAnnPinned').checked,updated_at:new Date().toISOString()};let r;if(item)r=await supabase.from('clan_announcements').update(row).eq('id',item.id);else r=await supabase.from('clan_announcements').insert({...row,is_active:true});feedback.textContent=r.error?'Nie udało się zapisać.':'✓ Zapisano.';if(!r.error){editor.innerHTML='';await loadAnnouncements()}}};

    const showSettings=async()=>{if(!await requireOwner())return;editor.innerHTML=`<form id="obSettingsForm" class="ob-settings-form"><label>Nazwa klanu<input data-setting="clan_name" value="${esc(settings.clan_name||'Orzeł Biały')}"></label><label>Nazwa serwera<input data-setting="server_name" value="${esc(settings.server_name||'Eternal x10')}"></label><label>Tekst powitalny<input data-setting="welcome_subtitle" value="${esc(settings.welcome_subtitle||'')}"></label><label>Motto / cytat<textarea data-setting="clan_quote">${esc(settings.clan_quote||'')}</textarea></label><label>Discord URL<input data-setting="discord_url" value="${esc(settings.discord_url||'')}"></label><label>YouTube URL<input data-setting="youtube_url" value="${esc(settings.youtube_url||'')}"></label><label>Strona serwera URL<input data-setting="server_url" value="${esc(settings.server_url||'')}"></label><div class="ob-ann-actions"><button class="ob-save-settings" type="submit">ZAPISZ USTAWIENIA</button><button type="button" id="obCancelEditor">ANULUJ</button></div></form>`;editor.querySelector('#obCancelEditor').onclick=()=>editor.innerHTML='';editor.querySelector('#obSettingsForm').onsubmit=async e=>{e.preventDefault();if(!await requireOwner())return;feedback.textContent='Zapisywanie…';const p=await profile();const rows=[...editor.querySelectorAll('[data-setting]')].map(el=>({key:el.dataset.setting,value:el.value.trim(),updated_by:p?.id||null,updated_at:new Date().toISOString()}));const r=await supabase.from('site_settings').upsert(rows,{onConflict:'key'});feedback.textContent=r.error?'Nie udało się zapisać.':'✓ Ustawienia zapisane.';if(!r.error){settings=Object.fromEntries(rows.map(x=>[x.key,x.value]));applySettings();editor.innerHTML=''}}};

    panel.querySelector('#obNewAnnouncement').onclick=()=>showAnnouncementForm();panel.querySelector('#obOpenSettings').onclick=showSettings;
    annPanel?.addEventListener('click',async e=>{const id=Number(e.target.dataset.annEdit||e.target.dataset.annPin||e.target.dataset.annToggle||e.target.dataset.annDelete||0);if(!id||!await requireOwner())return;const a=announcements.find(x=>x.id===id);if(!a)return;if(e.target.dataset.annEdit){zone.querySelector('[data-zone-view="content-editor"]')?.click();setTimeout(()=>showAnnouncementForm(a),0);return}let r;if(e.target.dataset.annPin)r=await supabase.from('clan_announcements').update({is_pinned:!a.is_pinned,updated_at:new Date().toISOString()}).eq('id',id);if(e.target.dataset.annToggle)r=await supabase.from('clan_announcements').update({is_active:!a.is_active,updated_at:new Date().toISOString()}).eq('id',id);if(e.target.dataset.annDelete&&confirmLocalized('Usunąć to ogłoszenie?'))r=await supabase.from('clan_announcements').delete().eq('id',id);if(r&&!r.error)await loadAnnouncements()});

    zone.addEventListener('click',e=>{if(e.target.closest('[data-zone-view="announcements"],[data-zone-view="content-editor"]'))setTimeout(async()=>{await getRole();await loadSettings();await loadAnnouncements()},0)});
    supabase.auth.onAuthStateChange(()=>{canEdit=false;nav.hidden=true;panel.hidden=true;editor.innerHTML='';if(panel.classList.contains('active'))switchClanView(zone,null,'home');renderAnnouncements();setTimeout(async()=>{await getRole();await loadSettings();await loadAnnouncements()},0)});
    await getRole();await loadSettings();await loadAnnouncements();
  }
  wait();
}

import { hasAdminPermission, loadAdminPermissionContext } from './adminPermissions.js';
import { translateText } from './i18nCore.js';

export function normalizeClanHeader(root=document){
  const entry=[...root.querySelectorAll('.member-auth-entry')].find((button)=>!button.classList.contains('logout'));
  if(!entry)return;
  // This runs inside a subtree observer. Replacing even identical text
  // creates another mutation and can starve app startup and all timers.
  const label=translateText('♟ STREFA KLANU'),accessibleLabel=translateText('Otwórz Strefę Klanu');
  if(entry.textContent!==label)entry.textContent=label;
  if(entry.getAttribute('aria-label')!==accessibleLabel)entry.setAttribute('aria-label',accessibleLabel);
}

export function installOwnerAccessBridge(supabase){
  if(!supabase||window.__obOwnerAccessBridgeInstalled)return;
  window.__obOwnerAccessBridgeInstalled=true;

  const style=document.createElement('style');
  style.textContent=`
    .ob-owner-shortcuts{display:none;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .ob-owner-shortcuts.show{display:grid}
    .ob-owner-shortcut{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:11px 12px;border:1px solid #765724;background:linear-gradient(180deg,#21170c,#0b0e0e);color:#e7bd68;font-size:10px;font-weight:900;letter-spacing:.05em;cursor:pointer}
    .ob-owner-shortcut:hover{border-color:#b88738;color:#f4d28b}
    html:not(.ob-admin-account) #adminTrigger,html:not(.ob-perm-manage-events) #quickAdd{display:none!important}
    #adminModal.ob-owner-admin-open{z-index:12050!important}
    #adminModal.ob-owner-admin-open .modal-backdrop{z-index:0}
    #adminModal.ob-owner-admin-open .admin-panel{z-index:1}
    @media(max-width:700px){.ob-owner-shortcuts{grid-template-columns:1fr}.ob-owner-shortcut{min-height:44px;font-size:9px}#adminModal.ob-owner-admin-open{padding:5px!important;align-items:stretch!important}#adminModal.ob-owner-admin-open .admin-panel{width:100%!important;max-height:calc(100vh - 10px)!important;margin:auto!important}}
  `;
  document.head.appendChild(style);

  let lastAdminState=false;

  const readProfile=async()=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return null;
    const {data}=await supabase.from('profiles').select('role,status').eq('id',session.user.id).maybeSingle();
    return data||null;
  };

  const openAdmin=async()=>{
    const context=await loadAdminPermissionContext(supabase);
    if(!context.canOpenAdmin)return;

    const modal=document.querySelector('#adminModal');
    if(!modal)return;

    const loginModal=document.querySelector('#loginModal');
    loginModal?.classList.remove('open');
    loginModal?.setAttribute('aria-hidden','true');

    const listView=document.querySelector('#adminListView');
    const formView=document.querySelector('#adminFormView');
    if(listView)listView.hidden=false;
    if(formView)formView.hidden=true;

    modal.classList.add('open','ob-owner-admin-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('admin-modal-open');
    document.body.style.overflow='hidden';

    requestAnimationFrame(()=>{
      modal.querySelector('.admin-panel')?.scrollTo({top:0,behavior:'auto'});
    });
  };

  const installOwnerHeaderButton=(allowed)=>{
    let trigger=document.querySelector('#adminTrigger');
    if(!trigger)return;
    if(!trigger.dataset.ownerControlled){
      const replacement=trigger.cloneNode(true);
      replacement.dataset.ownerControlled='true';
      replacement.hidden=!allowed;
      replacement.innerHTML='<span>✦</span> Panel administratora';
      trigger.replaceWith(replacement);
      replacement.addEventListener('click',(event)=>{
        event.preventDefault();
        event.stopPropagation();
        openAdmin();
      });
      trigger=replacement;
    }
    trigger.hidden=!allowed;
  };

  const openEditor=async()=>{
    const context=await loadAdminPermissionContext(supabase);
    if(!hasAdminPermission(context,'manage_content'))return;
    const zone=document.querySelector('#memberZoneLayer');
    const edit=zone?.querySelector('[data-zone-view="content-editor"]');
    if(edit){
      edit.hidden=false;
      edit.click();
      zone?.querySelector('.member-zone-main')?.scrollTo({top:0,behavior:'auto'});
    }
  };

  async function sync(){
    const context=await loadAdminPermissionContext(supabase);
    const isOwner=context.isOwner;
    lastAdminState=context.canOpenAdmin;
    document.documentElement.classList.toggle('ob-owner-account',isOwner);
    document.documentElement.classList.toggle('ob-admin-account',context.canOpenAdmin);
    installOwnerHeaderButton(context.canOpenAdmin);
    normalizeClanHeader();

    const quickAdd=document.querySelector('#quickAdd');
    if(quickAdd)quickAdd.hidden=!hasAdminPermission(context,'manage_events');

    const zone=document.querySelector('#memberZoneLayer');
    if(!zone){setTimeout(sync,150);return}
    const main=zone.querySelector('.member-zone-main');
    const home=zone.querySelector('[data-zone-panel="home"]');
    if(!main||!home){setTimeout(sync,150);return}

    let shortcuts=home.querySelector('.ob-owner-shortcuts');
    if(!shortcuts){
      shortcuts=document.createElement('div');
      shortcuts.className='ob-owner-shortcuts';
      shortcuts.innerHTML='<button type="button" class="ob-owner-shortcut" data-ob-open-editor>✎ EDYTUJ STRONĘ I OGŁOSZENIA</button><button type="button" class="ob-owner-shortcut" data-ob-open-admin>⚙ PANEL ADMINISTRATORA</button>';
      home.prepend(shortcuts);
      shortcuts.querySelector('[data-ob-open-editor]').addEventListener('click',openEditor);
      shortcuts.querySelector('[data-ob-open-admin]').addEventListener('click',openAdmin);
    }

    shortcuts.classList.toggle('show',context.canOpenAdmin||hasAdminPermission(context,'manage_content'));
    const editorBtn=shortcuts.querySelector('[data-ob-open-editor]');
    if(editorBtn)editorBtn.hidden=!hasAdminPermission(context,'manage_content');
    const adminBtn=shortcuts.querySelector('[data-ob-open-admin]');
    if(adminBtn)adminBtn.hidden=!context.canOpenAdmin;

    const editNav=zone.querySelector('[data-zone-view="content-editor"]');
    if(editNav)editNav.hidden=!hasAdminPermission(context,'manage_content');
  }

  document.addEventListener('click',(event)=>{
    if(event.target.closest('.member-auth-entry'))setTimeout(()=>{normalizeClanHeader();sync();},120);
    if(event.target.closest('#adminModal [data-close-modal]')||event.target.closest('#adminModal .close-btn')){
      const modal=document.querySelector('#adminModal');
      setTimeout(()=>{
        modal?.classList.remove('ob-owner-admin-open');
        document.body.style.overflow='';
      },0);
    }
  },true);

  const headerObserver=new MutationObserver(()=>{
    normalizeClanHeader();
    const trigger=document.querySelector('#adminTrigger');
    if(trigger)trigger.hidden=!lastAdminState;
  });
  const header=document.querySelector('.header-actions');
  if(header)headerObserver.observe(header,{childList:true,subtree:true,characterData:true});
  window.addEventListener('orzel:language-changed',()=>normalizeClanHeader());

  supabase.auth.onAuthStateChange(()=>setTimeout(sync,120));
  setTimeout(sync,250);
}

export function installProfilePersistenceFix(supabase){
  if(!supabase||window.__obProfilePersistenceFixInstalled)return;
  window.__obProfilePersistenceFixInstalled=true;

  document.addEventListener('submit',async event=>{
    const form=event.target.closest?.('#zoneProfileForm');
    if(!form)return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const msg=form.querySelector('#zoneProfileMessage');
    const save=form.querySelector('.zone-profile-save');
    const get=id=>form.querySelector(id);
    const className=get('#zoneProfileClass')?.value?.trim()||null;
    const subclass=get('#zoneProfileSubclass')?.value?.trim()||null;
    const levelText=get('#zoneProfileLevel')?.value?.trim()||'';
    const partyRole=get('#zoneProfileRole')?.value||null;
    const level=levelText?Number(levelText):null;

    if(level!==null&&(!Number.isInteger(level)||level<1||level>80)){
      if(msg)msg.textContent='Poziom musi być w zakresie 1–80.';
      return;
    }

    if(msg)msg.textContent='Zapisywanie…';
    if(save)save.disabled=true;
    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user)throw new Error(userError?.message||'Brak aktywnej sesji. Zaloguj się ponownie.');

      const payload={character_class:className,character_level:level,subclass,party_role:partyRole};
      const {data,error}=await supabase.from('profiles').update(payload).eq('id',user.id).select('nickname,character_class,character_level,subclass,party_role').single();
      if(error)throw error;
      if(!data)throw new Error('Profil nie został zapisany w bazie.');

      const signupPayload={character_class:className,character_level:level,subclass,party_role:partyRole};
      const {error:signupError}=await supabase.from('event_signups').update(signupPayload).eq('user_id',user.id);

      const summary=document.querySelector('#zoneProfileSummary');
      if(summary){
        const labels={dd:'DD',healer:'HEALER',tank:'TANK',support:'SUPPORT',other:'INNE'};
        const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const bits=[data.nickname,data.character_class,data.character_level?`Lv. ${data.character_level}`:'',data.subclass?`Sub: ${data.subclass}`:'',data.party_role?labels[data.party_role]:''].filter(Boolean);
        summary.innerHTML=bits.map(v=>`<span class="zone-profile-chip">${esc(v)}</span>`).join('');
      }
      if(msg)msg.textContent=signupError ? 'Profil zapisany. Nie udało się zaktualizować danych przy wcześniejszych zapisach.' : 'Profil zapisany.';
      window.dispatchEvent(new CustomEvent('orzel:profile-updated'));
      if(!signupError)window.dispatchEvent(new CustomEvent('orzel:signup-updated'));
    }catch(error){
      console.error('PROFILE SAVE FAILED',error);
      if(msg)msg.textContent=`Błąd zapisu: ${error.message||'nieznany błąd'}`;
    }finally{
      if(save)save.disabled=false;
    }
  },true);
}

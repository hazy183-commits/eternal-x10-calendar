import { supabase } from './supabaseClient.js';
import { installMemberEventSignups } from './memberEventSignups.js';
import { installClanContentManager } from './clanContentManager.js';

const boot=()=>{
  installMemberEventSignups(supabase);
  installClanContentManager(supabase);
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

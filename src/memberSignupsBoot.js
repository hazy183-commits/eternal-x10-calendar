import { supabase } from './supabaseClient.js';
import { installMemberEventSignups } from './memberEventSignups.js';

const boot=()=>installMemberEventSignups(supabase);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

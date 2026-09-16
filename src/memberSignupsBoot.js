import { supabase } from './supabaseClient.js';
import { installMemberEventSignups } from './memberEventSignups.js';
import { installClanContentManager } from './clanContentManager.js';
import { installMemberRoster } from './memberRoster.js';
import { installOwnerAccessBridge } from './ownerAccessBridge.js';
import { installInterludeClassSelects } from './interludeClassSelects.js';
import { installDiscordReminderSettings } from './discordReminderSettings.js';

const boot=()=>{
  installMemberEventSignups(supabase);
  installClanContentManager(supabase);
  installMemberRoster(supabase);
  installOwnerAccessBridge(supabase);
  installInterludeClassSelects();
  installDiscordReminderSettings(supabase);
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

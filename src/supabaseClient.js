import { createClient } from '@supabase/supabase-js';
import { installMemberAuth } from './memberAuth.js';
import { installMemberEventSignups } from './memberEventSignups.js';
import { installRecruitment } from './recruitment.js';
import { installClanContentManager } from './clanContentManager.js';
import { installMemberRoster } from './memberRoster.js';
import { installOwnerAccessBridge } from './ownerAccessBridge.js';
import { installAdminEventDayGroups } from './adminEventDayGroups.js';
import { installProfilePersistenceFix } from './profilePersistenceFix.js';
import { installNeededRaidBosses } from './neededRaidBosses.js';
import { installNeededRaidBossWindow } from './neededRaidBossWindow.js';
import { installRaidBossArtworkEnhancer } from './raidBossArtworkEnhancer.js';
import './interludeClassSelects.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The publishable key is safe for browser code. Never use a service-role key in Vite.
export const supabase = url?.startsWith('https://') && key?.startsWith('sb_publishable_')
  ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

if (typeof document !== 'undefined') {
  const startMemberFeatures = () => {
    installMemberAuth(supabase);
    installMemberEventSignups(supabase);
    installRecruitment(supabase);
    installClanContentManager(supabase);
    installMemberRoster(supabase);
    installOwnerAccessBridge(supabase);
    installAdminEventDayGroups(supabase);
    installProfilePersistenceFix(supabase);
    installNeededRaidBosses(supabase);
    installNeededRaidBossWindow(supabase);
    installRaidBossArtworkEnhancer();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startMemberFeatures, { once: true });
  else queueMicrotask(startMemberFeatures);
}

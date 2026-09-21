import { createClient } from '@supabase/supabase-js';
import './pageTitle.js';
import { recordSiteVisit } from './siteVisitStats.js';
import { installMemberAuth } from './memberAuth.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The publishable key is safe for browser code. Never use a service-role key in Vite.
export const supabase = url?.startsWith('https://') && key?.startsWith('sb_publishable_')
  ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

if (typeof document !== 'undefined') {
  recordSiteVisit(supabase);
  const startMemberFeatures = async () => {
    installMemberAuth(supabase);
    document.documentElement.classList.remove('access-checking');
    const [
      { installMemberZoneReliability },
      { installMemberEventSignups },
      { installRecruitment },
      { installClanContentManager },
      { installMemberRoster },
      { installOwnerAccessBridge },
      { installAdminEventDayGroups },
      { installProfilePersistenceFix },
      { installNeededRaidBosses },
      { installNeededRaidBossWindow },
      { installRaidBossArtworkEnhancer },
      { installNeededRaidBossDetails },
      { installEpicRespawnScreenshotImport },
      { installTerritoryOwnershipScreenshotImport },
      { installTodayClanDashboard },
      { installCraftPlannerUi },
      { installCraftHierarchyEnhancer },
      { installCraftInventoryDeleteEnhancer },
      { installCraftHomeSummary },
      { installRoleEnhancements },
      { installAdminSiteManager },
      { installPublicSiteSettings },
      { installPermissionManager },
      { installMemberBuildProfiles },
      { installClanPolls },
      { installProfileStudio },
    ] = await Promise.all([
      import('./memberZoneReliability.js'),
      import('./memberEventSignups.js'),
      import('./recruitment.js'),
      import('./clanContentManager.js'),
      import('./memberRoster.js'),
      import('./ownerAccessBridge.js'),
      import('./adminEventDayGroups.js'),
      import('./profilePersistenceFix.js'),
      import('./neededRaidBosses.js'),
      import('./neededRaidBossWindow.js'),
      import('./raidBossArtworkEnhancer.js'),
      import('./neededRaidBossDetails.js'),
      import('./epicRespawnScreenshotImport.js'),
      import('./territoryOwnershipScreenshotImport.js'),
      import('./todayClanDashboard.js'),
      import('./craftPlannerUi.js'),
      import('./craftHierarchyEnhancer.js'),
      import('./craftInventoryDeleteEnhancer.js'),
      import('./craftHomeSummary.js'),
      import('./roleEnhancements.js'),
      import('./adminSiteManager.js'),
      import('./siteSettings.js'),
      import('./permissionManager.js'),
      import('./memberBuildProfiles.js'),
      import('./clanPolls.js'),
      import('./profileStudio.js'),
      import('./craftWeaponSelectEnhancer.js'),
      import('./neededRaidBossRefreshBridge.js'),
      import('./interludeClassSelects.js'),
    ]);
    installMemberZoneReliability(supabase);
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
    installNeededRaidBossDetails(supabase);
    installEpicRespawnScreenshotImport(supabase);
    installTerritoryOwnershipScreenshotImport(supabase);
    installTodayClanDashboard(supabase);
    installCraftPlannerUi(supabase);
    installCraftHierarchyEnhancer(supabase);
    installCraftInventoryDeleteEnhancer(supabase);
    installCraftHomeSummary(supabase);
    installRoleEnhancements(supabase);
    installAdminSiteManager(supabase);
    installPublicSiteSettings(supabase);
    installPermissionManager(supabase);
    installMemberBuildProfiles(supabase);
    installClanPolls(supabase);
    installProfileStudio(supabase);
  };
  const boot = () => startMemberFeatures().catch(error => console.error('MEMBER FEATURES BOOT FAILED', error));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else queueMicrotask(boot);
}

// Keep this feature wired only on staging until the craft planner is approved for production.

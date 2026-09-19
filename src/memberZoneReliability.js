import { switchClanView } from './clanViewAccess.js';
import { memberZoneViewForClickTarget } from './memberZoneNavigation.js';

const TECH_DOMAIN = 'members.orzelbialy.local';
const isMemberEmail = (email = '') => String(email).toLowerCase().endsWith(`@${TECH_DOMAIN}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function installMemberZoneReliability(supabase) {
  if (!supabase || window.__obMemberZoneReliabilityInstalled) return;
  window.__obMemberZoneReliabilityInstalled = true;

  let opening = false;
  let cachedSession = null;
  let cachedProfile = null;
  const cacheKey = (userId) => `ob-member-profile-${userId}`;

  const readCache = (userId) => {
    try {
      const raw = sessionStorage.getItem(cacheKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCache = (userId, profile) => {
    if (!userId || !profile) return;
    try { sessionStorage.setItem(cacheKey(userId), JSON.stringify(profile)); } catch {}
  };

  async function fetchProfile(user, retries = 3) {
    if (!user) return { profile: null, error: null };
    let lastError = null;
    for (let attempt = 0; attempt < retries; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname,role,status,removed_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!error) {
        if (data) writeCache(user.id, data);
        return { profile: data || null, error: null };
      }
      lastError = error;
      await sleep(120 * (attempt + 1));
    }
    return { profile: null, error: lastError };
  }

  function allowed(session, profile) {
    if (!session || profile?.removed_at || profile?.status === 'blocked') return false;
    if (!isMemberEmail(session.user?.email || '')) return true;
    return profile?.status === 'approved';
  }

  function displayProfile(session, profile) {
    const zone = document.querySelector('#memberZoneLayer');
    if (!zone) return;
    const nickname = profile?.nickname || (session.user?.email || '').split('@')[0] || 'Członek';
    const role = profile?.role || (!isMemberEmail(session.user?.email || '') ? 'owner' : 'member');
    const nickNode = zone.querySelector('#memberZoneNick');
    const roleNode = zone.querySelector('#memberZoneRole');
    const rankNode = zone.querySelector('#memberRankCard');
    if (nickNode) nickNode.textContent = nickname;
    if (roleNode) roleNode.textContent = String(role).toUpperCase();
    if (rankNode) rankNode.textContent = String(role).replace(/^./, (c) => c.toUpperCase());
  }

  async function resolveProfile(session) {
    if (!session?.user) return null;
    const result = await fetchProfile(session.user);
    if (result.profile) return result.profile;
    // Access changes must not be bypassed by an older approved profile.
    return null;
  }

  function showLogin(message = '') {
    const layer = document.querySelector('#memberAuthLayer');
    const zone = document.querySelector('#memberZoneLayer');
    document.documentElement.classList.add('member-locked');
    zone?.classList.remove('open');
    layer?.classList.add('open');
    if (message) {
      const feedback = layer?.querySelector('#memberAuthFeedback');
      if (feedback) feedback.textContent = message;
    }
  }

  async function openZone(initialView = 'home') {
    if (opening) return;
    opening = true;
    try {
      const zone = document.querySelector('#memberZoneLayer');
      if (!zone) return;
      let session = cachedSession;
      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }
      if (!session) {
        showLogin('Zaloguj się, aby wejść do Strefy Klanu.');
        return;
      }
      const profile = await resolveProfile(session);
      if (!allowed(session, profile)) {
        showLogin(profile?.status === 'blocked' ? 'To konto jest zablokowane.' : 'Konto nie ma dostępu do Strefy Klanu.');
        return;
      }

      cachedSession = session;
      cachedProfile = profile;
      document.documentElement.classList.remove('member-locked');
      document.querySelector('#memberAuthLayer')?.classList.remove('open');
      displayProfile(session, profile);
      zone.classList.add('open');
      switchClanView(zone, profile, initialView);
      if (initialView === 'craft') {
        window.dispatchEvent(new CustomEvent('orzel:craft-workspace-opened'));
      }
    } catch (error) {
      console.error('[member-zone] Nie udało się otworzyć Strefy Klanu.', error);
      const feedback = document.querySelector('#memberAuthFeedback');
      if (feedback) feedback.textContent = 'Nie udało się otworzyć Strefy Klanu. Odśwież stronę i spróbuj ponownie.';
    } finally {
      opening = false;
    }
  }

  async function healAccess(sessionFromEvent) {
    let session = sessionFromEvent === undefined ? cachedSession : sessionFromEvent;
    if (!session) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    }
    if (!session) return;
    const profile = await resolveProfile(session);
    if (!allowed(session, profile)) return;
    cachedSession = session;
    cachedProfile = profile;
    document.documentElement.classList.remove('member-locked');
    document.querySelector('#memberAuthLayer')?.classList.remove('open');
    displayProfile(session, profile);
  }

  // Capture the click before the older async handler. This removes the race where
  // a transient profile request could make the button appear to do nothing.
  document.addEventListener('click', (event) => {
    const view = memberZoneViewForClickTarget(event.target);
    if (!view) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openZone(view);
  }, true);

  supabase.auth.onAuthStateChange((_event, session) => {
    if (cachedSession?.user?.id !== session?.user?.id) cachedProfile = null;
    cachedSession = session || null;
    setTimeout(() => healAccess(session), 180);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(healAccess, 80);
  });
  window.addEventListener('focus', () => setTimeout(healAccess, 80));

  setTimeout(healAccess, 120);
}

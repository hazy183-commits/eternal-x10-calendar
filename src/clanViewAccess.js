import './interludeClassSelects.js';

export function canAccessClanView(profile, view) {
  if (view !== 'content-editor' && view !== 'recruitment') return true;
  if (profile?.status !== 'approved') return false;
  const role = String(profile.role || '').toLowerCase();
  return view === 'content-editor' ? ['owner', 'admin'].includes(role) : ['owner', 'admin', 'leader'].includes(role);
}

export function switchClanView(zone, profile, requestedView) {
  const view = canAccessClanView(profile, requestedView) ? requestedView : 'home';
  zone.querySelectorAll('.zone-nav').forEach(b => b.classList.toggle('active', b.dataset.zoneView === view));
  const panelView = view === 'group-craft' ? 'craft' : view;
  zone.querySelectorAll('.zone-view').forEach(p => p.classList.toggle('active', p.dataset.zonePanel === panelView));
  const main = zone.querySelector('.member-zone-main');
  if (main) main.scrollTop = 0;
  return view;
}

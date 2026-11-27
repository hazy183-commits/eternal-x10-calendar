export function memberZoneViewForClickTarget(target) {
  if (target?.closest?.('.craft-home-open')) return 'craft';
  if (target?.closest?.('[data-zone-view="group-craft"]')) return 'group-craft';
  if (target?.closest?.('[data-zone-view="craft"]')) return 'craft';
  if (target?.closest?.('.member-auth-entry:not(.logout)')) return 'home';
  return null;
}

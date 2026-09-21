const item = file => `<img src="/assets/interlude/icons/${file}.png" alt="">`;
const badge = (x, y) => `<span class="admin-clan-sprite" style="--icon-x:${x}%;--icon-y:${y}%"></span>`;
const icons = {
  home: '<img src="/images/logo-orzel-bialy.webp" alt="">',
  events: badge(0, 0),
  bosses: badge(66.667, 0),
  siege: '<img src="/images/castles/aden.jpg" alt="">',
  schedule: badge(33.333, 100),
  content: item('weapon_imperial_staff_i00'),
  users: badge(66.667, 100),
};
export const adminClanIcon = name => `<i class="admin-clan-icon" aria-hidden="true">${icons[name] || icons.home}</i>`;
const zoneIcons = {
  planning: item('etc_recipe_black_i00'),
  clan: badge(66.667, 100),
  tools: badge(100, 100),
  admin: icons.siege,
  announcements: item('etc_letter_red_i00'),
  members: item('armor_t90_ul_i02'),
  signups: badge(33.333, 100),
  polls: item('etc_recipe_violet_i00'),
  profile: badge(33.333, 0),
  recruitment: item('shield_imperial_crusader_shield_i02'),
  craft: item('weapon_basalt_battlehammer_i00'),
  attendance: badge(100, 0),
};
const zoneAliases = { 'content-editor':'content', 'needed-rb':'bosses' };
export function clanZoneIcon(name) {
  const key = zoneAliases[name] || name;
  return zoneIcons[key] || icons[key] || icons.home;
}

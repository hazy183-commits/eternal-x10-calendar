import './clanNavigationArt.css';
// Approved sculpted collection, ordered as a four by four artwork sheet.
const slots = {home:0,planning:1,events:2,signups:3,polls:4,clan:5,announcements:6,profile:7,members:8,recruitment:9,attendance:10,tools:11,bosses:12,craft:13,admin:14,content:15};
const aliases = {'content-editor':'content','needed-rb':'bosses',users:'members',siege:'home',schedule:'planning'};
export function clanZoneIcon(name) {
  const slot = slots[aliases[name] || name] ?? 0;
  return `<span class="clan-nav-art" aria-hidden="true" style="--art-x:${slot % 4 * 100 / 3}%;--art-y:${Math.floor(slot / 4) * 100 / 3}%"></span>`;
}
export const adminClanIcon = name => `<i class="admin-clan-icon" aria-hidden="true">${clanZoneIcon(name)}</i>`;

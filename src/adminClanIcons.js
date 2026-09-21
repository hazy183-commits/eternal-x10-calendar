const icons = {
  home: '<img src="/images/logo-orzel-bialy.webp" alt="">',
  events: '<span class="admin-clan-sprite" style="--icon-x:0%;--icon-y:0%"></span>',
  bosses: '<img src="/images/bosses/valakas.webp" alt="">',
  siege: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path fill="#34291a" d="M6 34V15h8v7h12v-7h8v19Z"/><path d="M6 15V9h3v3h2V9h3v6M26 15V9h3v3h2V9h3v6M17 34v-7a3 3 0 0 1 6 0v7M20 22V3"/><path fill="#eee" stroke="none" d="M21 3h12v4H21z"/><path fill="#cf263c" stroke="none" d="M21 7h12v4H21z"/></svg>',
  schedule: '<span class="admin-clan-sprite" style="--icon-x:33.333%;--icon-y:100%"></span>',
  content: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path fill="#34291a" d="M9 6h24v25H13c-5 0-6 5-2 5h19M9 6v25M9 6C4 6 4 12 9 12"/><path d="M14 19h13M14 23h10M14 27h13"/><path stroke="#eee" stroke-width="3" d="M14 11h14"/><path stroke="#ce243a" stroke-width="3" d="M14 14h14"/></svg>',
  users: '<span class="admin-clan-sprite" style="--icon-x:66.667%;--icon-y:100%"></span>',
};
export const adminClanIcon = name => `<i class="admin-clan-icon" aria-hidden="true">${icons[name] || icons.home}</i>`;
const gilded = paths => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const zoneIcons = {
  signups: gilded('<path fill="#302519" d="M10 6h20v29H10z"/><path d="M16 4h8v5h-8zM14 19l4 4 8-9M14 29h12"/>'),
  polls: gilded('<path fill="#302519" d="M6 20h28v14H6z"/><path d="M14 23h12M12 9l13-4 4 11-13 4zM18 12l3 2 3-5"/>'),
  profile: gilded('<path fill="#302519" d="M20 3l14 6v13c0 7-14 15-14 15S6 29 6 22V9z"/><circle cx="20" cy="15" r="5"/><path d="M12 29c0-10 16-10 16 0"/>'),
  recruitment: gilded('<path fill="#302519" d="M7 6h20v27H7z"/><path d="M11 12h11M11 17h8M27 20v13M21 26h13"/>'),
  craft: gilded('<path fill="#302519" d="M8 6l9 9-5 5-9-9zM15 18l17 17M28 4l7 7-10 10-7-7zM21 18L6 35"/>'),
  attendance: gilded('<path fill="#302519" d="M6 9h28v26H6z"/><path d="M6 16h28M13 5v8M27 5v8M13 25l5 5 9-10"/>'),
};
const zoneAliases = { planning:'schedule', clan:'users', tools:'craft', admin:'siege', announcements:'content', members:'users', 'content-editor':'content', 'needed-rb':'bosses' };
export function clanZoneIcon(name) {
  const key = zoneAliases[name] || name;
  return zoneIcons[key] || icons[key] || icons.home;
}

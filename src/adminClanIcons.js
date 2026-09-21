// Original enamel emblems, drawn for the clan navigation at small sizes.
const marks = {
  home: '<path d="M11 24 24 12l13 12h-5v12H16V24zm10 4v8h6v-8z"/>',
  planning: '<path d="M13 14h22v22H13z"/><path d="M17 11v7m14-7v7M13 22h22" class="cut"/><path d="m19 28 3 3 7-6" class="cut"/>',
  events: '<path d="m24 10 4 9 10 1-8 7 2 11-8-6-8 6 2-11-8-7 10-1z"/>',
  signups: '<path d="M16 13h16v25H16z"/><path d="M20 10h8v7h-8z" class="light"/><path d="m20 27 3 3 6-7" class="cut"/>',
  polls: '<path d="M12 29h5v8h-5zm9-9h6v17h-6zm10-8h5v25h-5z"/><path d="M11 39h27" class="line"/>',
  clan: '<path d="m24 15-4-3-2 5-9-5 3 9 7 5-6 7 8-2 3 7 3-7 8 2-6-7 7-5 3-9-9 5-2-5z" class="light"/><path d="m19 8 2 3 3-4 3 4 2-3v6H19z"/>',
  announcements: '<path d="M11 21h10l14-8v22l-14-8H11zm7 6 4 10h-6l-3-10z"/><path d="M38 20v9" class="line"/>',
  profile: '<circle cx="24" cy="18" r="6" class="light"/><path d="M13 36c0-15 22-15 22 0z"/><path d="M17 8h14" class="line"/>',
  members: '<circle cx="17" cy="19" r="5"/><circle cx="31" cy="19" r="5" class="light"/><path d="M8 36c0-15 18-15 18 0zm16 0c0-15 16-15 16 0z"/>',
  recruitment: '<path d="M13 11h18v26H13z"/><path d="M17 16h10M17 21h7" class="cut"/><circle cx="32" cy="31" r="8" class="red"/><path d="M32 26v10m-5-5h10" class="line light-stroke"/>',
  attendance: '<circle cx="24" cy="23" r="12"/><path d="m17 23 5 5 10-11" class="cut"/><path d="m16 33-2 7 10-4 10 4-2-7"/>',
  tools: '<path d="m29 10-6 6 4 5 7-6c4 9-3 15-10 11L14 37l-5-5 12-10c-4-8 1-14 8-12z"/>',
  bosses: '<path d="m13 10 7 6h8l7-6-2 14-4 11-5 4-5-4-4-11z"/><path d="m17 23 5 2m9-2-5 2M21 32h6" class="cut"/>',
  craft: '<path d="M9 23h30l-7 7H21l-4 4h16v4H12v-4l4-4-7-3zM21 10h14v6H21zM25 16h5v7h-5z"/>',
  admin: '<path d="m11 16 8 5 5-11 5 11 8-5-4 17H15zM15 36h18v3H15z"/><circle cx="24" cy="27" r="2" class="red"/>',
  content: '<path d="M12 13h17v25H12z"/><path d="m21 28 12-18 5 4-13 18-6 3z" class="light"/><path d="M16 18h7M16 23h4" class="cut"/>',
  siege: '<path d="M10 13h5v5h4v-5h10v5h4v-5h5v24H10z"/><path d="M21 37V27h6v10" class="cut"/>',
  schedule: '<circle cx="24" cy="24" r="13"/><path d="M24 15v10l7 4" class="cut"/><path d="M20 7h8" class="line"/>',
};
function emblem(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="clan-emblem" viewBox="0 0 48 48" aria-hidden="true"><style>.clan-emblem .cut{fill:none;stroke:#171d1c;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.clan-emblem .line{fill:none;stroke:#e4c585;stroke-width:2.5;stroke-linecap:round}.clan-emblem .light{fill:#f4ead3}.clan-emblem .red{fill:#ac2940}.clan-emblem .light-stroke{stroke:#f4ead3}</style><path d="M4 4h40v30L24 45 4 34z" fill="#171d1c" stroke="#9c7c46" stroke-width="1.5"/><path d="M5 5h38v2H5z" fill="#f4ead3"/><path d="M5 7h38v2H5z" fill="#bd3045"/><g fill="#dfbd77">${marks[name] || marks.home}</g></svg>`;
}
export const adminClanIcon = name => `<i class="admin-clan-icon" aria-hidden="true">${emblem(name === 'users' ? 'members' : name)}</i>`;
const aliases = { 'content-editor':'content', 'needed-rb':'bosses' };
export const clanZoneIcon = name => emblem(aliases[name] || name);


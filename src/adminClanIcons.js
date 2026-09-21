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

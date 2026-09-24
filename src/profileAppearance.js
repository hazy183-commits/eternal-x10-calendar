import { avatarMarkup } from './memberAvatars.js';

export const CLAN_CREST = '/images/logo-orzel-bialy.webp';
export const APPEARANCE_TABLE = 'member_profile_appearance';
export const APPEARANCE_FIELDS = 'background,frame,ornament,badges,accent,effect,intensity';
export const backgrounds = [
  { id: 'eagle-citadel', label: 'Twierdza Orła', image: '/images/profile-studio/eagle-citadel.webp', fresh: true },
  { id: 'siege-night', label: 'Noc oblężenia', image: '/images/profile-studio/siege-night.webp', fresh: true },
  { id: 'polish-forest', label: 'Polska dusza', image: '/images/profile-studio/polish-forest.webp', fresh: true },
  { id: 'interlude-magic', label: 'Magia Interlude', image: '/images/profile-studio/interlude-magic.webp', fresh: true },
  { id: 'aden', label: 'Aden', image: '/images/castles/aden.jpg' },
  { id: 'giran', label: 'Giran', image: '/images/castles/giran.jpg' },
  { id: 'polska', label: 'Biało-czerwoni', image: '/images/clan-background-v1.jpg' },
  { id: 'rune', label: 'Rune', image: '/images/castles/rune.jpg' },
  { id: 'goddard', label: 'Goddard', image: '/images/castles/goddard.jpg' },
  { id: 'innadril', label: 'Innadril', image: '/images/castles/innadril.jpg' },
  { id: 'clan', label: 'Orzeł Biały', image: '/images/eternal-hero-approved.webp' },
  { id: 'none', label: 'Bez tła', image: '' },
];
export const frames = [
  { id: 'steel', label: 'Stal' }, { id: 'gold', label: 'Złoto' },
  { id: 'polish', label: 'Biało-czerwona' }, { id: 'obsidian', label: 'Obsydian' },
  { id: 'rune', label: 'Runiczna' }, { id: 'none', label: 'Bez ramki' },
];
export const ornaments = [
  { id: 'eagle', label: 'Skrzydła Orła', x: 0, y: 0, clan: true },
  { id: 'ribbons', label: 'Barwy Polski', x: 50, y: 0, clan: true },
  { id: 'clan-crest', label: 'Herb Orła Białego', x: 100, y: 0, clan: true },
  { id: 'hussar', label: 'Husarska chwała', x: 0, y: 100, clan: true },
  { id: 'aden-guard', label: 'Obrońca Aden', x: 50, y: 100, clan: true },
  { id: 'soulshot', label: 'Moc Soulshotów', x: 100, y: 100, clan: true },
  { id: 'dragon', label: 'Smocze skrzydła', x: 0, y: 0 },
  { id: 'fire', label: 'Korona ognia', x: 50, y: 0 },
  { id: 'horns', label: 'Mroczne rogi', x: 100, y: 0 },
  { id: 'ice', label: 'Lodowe kryształy', x: 0, y: 100 },
  { id: 'arcane', label: 'Krąg magii', x: 50, y: 100 },
  { id: 'swords', label: 'Miecze bohatera', x: 100, y: 100 },
  { id: 'none', label: 'Bez ozdoby' },
];
export const badges = [
  { id: 'pvp', label: 'PvP', x: 0, y: 0 },
  { id: 'siege', label: 'Oblężenia', x: 100 / 3, y: 0 },
  { id: 'raid', label: 'Raid', x: 200 / 3, y: 0 },
  { id: 'olympiad', label: 'Olimpiada', x: 100, y: 0 },
  { id: 'support', label: 'Wsparcie', x: 0, y: 100 },
  { id: 'veteran', label: 'Weteran', x: 100 / 3, y: 100 },
  { id: 'poland', label: 'Polska', x: 200 / 3, y: 100 },
  { id: 'crystal', label: 'Kryształ', x: 100, y: 100 },
  { id: 'clan', label: 'Herb klanu' }, { id: 'flag', label: 'Flaga Polski' },
];
export const accents = [
  { id: 'gold', label: 'Złoty', color: '#d5ae62' },
  { id: 'red', label: 'Karmazyn', color: '#ed737b' },
  { id: 'blue', label: 'Lodowy błękit', color: '#74bbf2' },
  { id: 'violet', label: 'Ametyst', color: '#bc92f4' },
  { id: 'green', label: 'Szmaragd', color: '#78cfa6' },
  { id: 'silver', label: 'Srebro', color: '#d0d8e2' },
];
export const effects = [
  { id: 'none', label: 'Brak' }, { id: 'glow', label: 'Blask' },
  { id: 'pulse', label: 'Pulsująca aura' }, { id: 'sparks', label: 'Iskry' },
];
export const DEFAULT_APPEARANCE = Object.freeze({
  background: 'aden', frame: 'steel', ornament: 'none',
  badges: Object.freeze(['clan']), accent: 'gold', effect: 'none', intensity: 50,
});
const catalogs = { background: backgrounds, frame: frames, ornament: ornaments, accent: accents, effect: effects };
export const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only catalog identifiers cross the rendering boundary; user-controlled CSS/URLs never do.
export function normalizeAppearance(input) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const result = {};
  for (const [key, catalog] of Object.entries(catalogs)) {
    result[key] = catalog.some(item => item.id === value[key]) ? value[key] : DEFAULT_APPEARANCE[key];
  }
  result.badges = Array.isArray(value.badges)
    ? [...new Set(value.badges)].filter(id => badges.some(item => item.id === id)).slice(0, 3)
    : [...DEFAULT_APPEARANCE.badges];
  result.intensity = typeof value.intensity === 'number' && Number.isFinite(value.intensity)
    ? Math.max(0, Math.min(100, Math.round(value.intensity))) : DEFAULT_APPEARANCE.intensity;
  return result;
}
export function randomAppearance(random = Math.random) {
  const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))].id;
  const pool = [...badges];
  const selected = [];
  for (let i = 0; i < 3; i++) selected.push(pool.splice(Math.min(pool.length - 1, Math.floor(random() * pool.length)), 1)[0].id);
  return normalizeAppearance({ background: pick(backgrounds), frame: pick(frames), ornament: pick(ornaments.filter(item => item.id !== 'none')), badges: selected, accent: pick(accents), effect: pick(effects), intensity: 50 });
}
export function toggleBadge(current, id) {
  const selected = normalizeAppearance({ badges: current }).badges;
  if (!badges.some(item => item.id === id)) return selected;
  if (selected.includes(id)) return selected.filter(item => item !== id);
  return selected.length < 3 ? [...selected, id] : selected;
}
export function badgeMarkup(id) {
  const badge = badges.find(item => item.id === id);
  if (!badge) return '';
  if (id === 'clan') return `<span class="ps-badge ps-badge-clan" role="img" aria-label="Herb klanu"><img src="${CLAN_CREST}" alt="" width="96" height="64"></span>`;
  if (id === 'flag') return '<span class="ps-badge ps-badge-flag" role="img" aria-label="Flaga Polski"><i></i></span>';
  return `<span class="ps-badge ps-badge-sprite" role="img" aria-label="${badge.label}" style="--bx:${badge.x}%;--by:${badge.y}%"></span>`;
}
export function decoratedAvatar(profile, input) {
  const look = normalizeAppearance(input);
  const ornament = ornaments.find(item => item.id === look.ornament);
  return `<span class="ps-avatar ps-frame-${look.frame} ${look.ornament === 'none' ? 'ps-unadorned' : ''} ${ornament.clan ? 'ps-clan-ornament' : ''}" data-ornament="${look.ornament}">
    ${look.ornament !== 'none' ? `<span class="ps-ornament ${ornament.clan ? 'ps-ornament-clan-art' : ''}" aria-hidden="true" style="--ox:${ornament.x}%;--oy:${ornament.y}%"></span>` : ''}
    <span class="ps-face">${avatarMarkup(profile)}</span>
    ${look.ornament === 'clan-crest' ? `<img class="ps-ornament-crest" src="${CLAN_CREST}" alt="Herb Orła Białego">` : ''}
  </span>`;
}
export function profileCardMarkup(profile = {}, input, compact = false) {
  const look = normalizeAppearance(input);
  const bg = backgrounds.find(item => item.id === look.background);
  const color = accents.find(item => item.id === look.accent).color;
  return `<article class="ps-profile-card ${compact ? 'ps-compact' : ''}" data-effect="${look.effect}" style="--ps-accent:${color};--ps-strength:${look.intensity / 100};${bg.image ? `--ps-cover:url('${bg.image}')` : ''}">
    <div class="ps-cover ps-cover-${look.background}" aria-hidden="true"></div>
    <div class="ps-profile-content"><span class="ps-profile-kicker">ORZEŁ BIAŁY · INTERLUDE</span>
      <div class="ps-avatar-stage">${decoratedAvatar(profile, look)}<span class="ps-sparks" aria-hidden="true">✦ · ✧ · ✦</span></div>
      <h3 data-no-i18n>${escapeHtml(profile.nickname || 'Twój nick')}</h3>
      <p class="ps-character">${escapeHtml(profile.character_class || 'Członek klanu')}${profile.character_level ? ` · Lv. ${escapeHtml(profile.character_level)}` : ''}</p>
      <img class="ps-crest" src="${CLAN_CREST}" alt="Herb klanu Orzeł Biały" width="80" height="54">
      <div class="ps-profile-badges" aria-label="Wybrane ozdoby profilu">${look.badges.map(id => `<span title="${badges.find(item => item.id === id).label}">${badgeMarkup(id)}</span>`).join('')}</div>
    </div>
  </article>`;
}
export async function loadAppearance(supabase, userId) {
  const { data, error } = await supabase.from(APPEARANCE_TABLE).select(APPEARANCE_FIELDS).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return normalizeAppearance(data);
}
export async function saveAppearance(supabase, expectedUserId, appearance) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== expectedUserId) throw new Error('Sesja się zmieniła. Zaloguj się ponownie.');
  const payload = { user_id: user.id, ...normalizeAppearance(appearance) };
  const { data, error } = await supabase.from(APPEARANCE_TABLE).upsert(payload, { onConflict: 'user_id' }).select(APPEARANCE_FIELDS).single();
  if (error || !data) throw new Error('Nie udało się zapisać wyglądu. Twoje zmiany pozostają w kreatorze — spróbuj ponownie.');
  return normalizeAppearance(data);
}

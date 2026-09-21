import './profileStudio.css';
import { backgrounds, frames, ornaments, badges, accents, effects, DEFAULT_APPEARANCE, normalizeAppearance, randomAppearance, toggleBadge, badgeMarkup, decoratedAvatar, profileCardMarkup, loadAppearance, saveAppearance } from './profileAppearance.js';

const tabs = [['ornament', 'Ozdoby'], ['background', 'Tła'], ['frame', 'Ramki'], ['badges', 'Odznaki'], ['effects', 'Kolory i efekty']];
const choices = { ornament: ornaments, background: backgrounds, frame: frames, badges };
const headings = { ornament: ['Ozdoby awatara', 'Nadaj postaci własny charakter.'], background: ['Tło profilu', 'Zamki Interlude, barwy Polski i klimat klanu.'], frame: ['Ramka awatara', 'Wykończenie, które połączy cały zestaw.'], badges: ['Twoja kolekcja odznak', 'Wybierz do 3 ozdobnych symboli. Nie zmieniają rangi ani osiągnięć.'], effects: ['Kolor i światło', 'Dopasuj akcenty i subtelne animacje.'] };

export function mountProfileStudio(root, { supabase, demo = false } = {}) {
  let profile = { nickname: 'Twój nick' }, currentUserId = null, draft = normalizeAppearance(DEFAULT_APPEARANCE), saved = normalizeAppearance(DEFAULT_APPEARANCE);
  let activeTab = 'ornament', busy = false, ready = false, dirty = false, revision = 0, disposed = false;
  let avatarUrl = null, avatarPath = null;
  root.classList.add('profile-studio');
  root.innerHTML = `<header class="ps-heading"><div><span class="ps-eyebrow">ATELIER KLANOWE / ORZEŁ BIAŁY</span><h2>Twój profil.<br><em>Twoja legenda.</em></h2><p>Łącz ozdoby, barwy i symbole. Stwórz zestaw, który jest Twój.</p></div><span class="ps-heading-mark" aria-hidden="true">✦</span></header>
    ${demo ? '<p class="ps-demo-note">Podgląd kreatora · zmiany w tej wersji są zapisywane tylko w tej przeglądarce.</p>' : ''}
    <div class="ps-workspace"><section class="ps-controls" aria-label="Dostosuj wygląd">
      <div class="ps-tabs" role="tablist" aria-label="Kategorie wyglądu">${tabs.map(([id, label], i) => `<button type="button" role="tab" id="ps-tab-${id}" aria-controls="ps-options" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-ps-tab="${id}">${label}</button>`).join('')}</div>
      <div id="ps-options" class="ps-options" role="tabpanel" aria-labelledby="ps-tab-ornament"></div>
      <div class="ps-collection"><div><span class="ps-eyebrow">TWÓJ ZESTAW</span><h4>Małe symbole. Wielka historia.</h4></div><span data-ps-badge-count></span><div data-ps-selected class="ps-selected-badges"></div><button type="button" data-ps-edit-badges>Wybierz odznaki →</button></div>
    </section><aside class="ps-live" aria-label="Podgląd profilu"><div class="ps-live-heading"><span class="ps-eyebrow">PODGLĄD NA ŻYWO</span><span class="ps-live-dot">●</span></div><div data-ps-preview></div><p class="ps-preview-note">Tak zobaczą Cię członkowie klanu w podglądzie profilu.</p>
      ${demo ? '' : '<button type="button" class="ps-avatar-link" data-ps-avatar-editor>Zmień miniaturę profilu →</button>'}
      <div class="ps-actions"><button type="button" class="ps-save" data-ps-save>Zapisz wygląd</button><button type="button" data-ps-random>Losuj zestaw</button></div><div class="ps-secondary"><button type="button" data-ps-cancel>Cofnij zmiany</button><button type="button" data-ps-default>Przywróć domyślne</button></div>
      <p class="ps-feedback" data-ps-message role="status" aria-live="polite"></p><button type="button" data-ps-retry hidden>Spróbuj ponownie</button>
    </aside></div>`;
  const q = selector => root.querySelector(selector);
  const message = text => { q('[data-ps-message]').textContent = text; };
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(saved);

  function paintAvatarImages() {
    if (!avatarUrl) return;
    for (const node of root.querySelectorAll('[data-avatar-path]')) {
      const img = new Image(); img.alt = ''; img.src = avatarUrl; node.replaceChildren(img);
    }
  }
  async function resolveAvatar() {
    const path = profile.avatar_path, version = revision;
    if (!path || !supabase) { avatarUrl = null; avatarPath = null; return; }
    if (path === avatarPath && avatarUrl) return;
    avatarUrl = null; avatarPath = path;
    try {
      const { data, error } = await supabase.storage.from('member-avatars').createSignedUrl(path, 300);
      if (disposed || version !== revision || path !== profile.avatar_path) return;
      if (!error && data?.signedUrl) { avatarUrl = data.signedUrl; paintAvatarImages(); }
    } catch { /* Keep a readable initial when an avatar cannot load. */ }
  }
  function controls() {
    for (const button of root.querySelectorAll('button,input')) button.disabled = busy || !ready;
    q('[data-ps-retry]').disabled = busy;
    q('[data-ps-save]').disabled = busy || !ready || !dirty;
    q('[data-ps-cancel]').disabled = busy || !ready || !dirty;
    root.setAttribute('aria-busy', String(busy));
    q('[data-ps-save]').textContent = busy ? 'Zapisywanie…' : 'Zapisz wygląd';
  }
  function paintPreview() {
    q('[data-ps-preview]').innerHTML = profileCardMarkup(profile, draft);
    q('[data-ps-badge-count]').textContent = `${draft.badges.length} / 3`;
    q('[data-ps-selected]').innerHTML = draft.badges.length ? draft.badges.map(id => `<button type="button" data-ps-remove-badge="${id}" aria-label="Usuń odznakę: ${badges.find(item => item.id === id).label}">${badgeMarkup(id)}<span>×</span></button>`).join('') : '<p>Wybierz swoje symbole z kolekcji odznak.</p>';
    paintAvatarImages();
  }
  function paintOptions() {
    root.querySelectorAll('[data-ps-tab]').forEach(button => {
      const selected = button.dataset.psTab === activeTab;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    const [heading, hint] = headings[activeTab];
    let html = `<div class="ps-options-heading"><h3>${heading}</h3><p>${hint}</p></div>`;
    if (activeTab === 'effects') {
      html += `<fieldset class="ps-fieldset"><legend>Kolor akcentu</legend><div class="ps-swatches">${accents.map(item => `<button type="button" data-ps-field="accent" data-ps-value="${item.id}" aria-pressed="${draft.accent === item.id}" aria-label="${item.label}" title="${item.label}" style="--swatch:${item.color}">${draft.accent === item.id ? '✓' : ''}</button>`).join('')}</div></fieldset>
        <fieldset class="ps-fieldset"><legend>Efekt ozdoby</legend><div class="ps-effect-buttons">${effects.map(item => `<button type="button" data-ps-field="effect" data-ps-value="${item.id}" aria-pressed="${draft.effect === item.id}">${item.label}</button>`).join('')}</div></fieldset>
        <label class="ps-intensity">Intensywność efektu <output data-ps-intensity-output>${draft.intensity}%</output><input type="range" min="0" max="100" step="5" value="${draft.intensity}" data-ps-intensity aria-label="Intensywność efektu"></label><p class="ps-motion-note">Animacje respektują ustawienie ograniczonego ruchu w Twoim urządzeniu.</p>`;
    } else {
      html += `<div class="ps-choice-grid ps-choice-${activeTab}">${choices[activeTab].map(item => {
        const selected = activeTab === 'badges' ? draft.badges.includes(item.id) : draft[activeTab] === item.id;
        let visual = '';
        if (activeTab === 'ornament') visual = decoratedAvatar(profile, { ...draft, ornament: item.id });
        if (activeTab === 'frame') visual = decoratedAvatar(profile, { ...draft, ornament: 'none', frame: item.id });
        if (activeTab === 'badges') visual = badgeMarkup(item.id);
        if (activeTab === 'background') visual = item.image ? `<img src="${item.image}" alt="" loading="lazy" class="ps-background-thumbnail">` : '<span class="ps-empty-art" aria-hidden="true">◇</span>';
        return `<button type="button" class="ps-choice ${activeTab === 'ornament' && item.id === 'none' ? 'ps-no-ornament' : ''}" data-ps-field="${activeTab}" data-ps-value="${item.id}" aria-pressed="${selected}"><span class="ps-choice-art">${visual}</span><span class="ps-choice-name">${item.label}</span>${item.clan || item.fresh ? '<span class="ps-new-art">NOWE</span>' : ''}<span class="ps-check" aria-hidden="true">✓</span></button>`;
      }).join('')}</div>`;
    }
    q('#ps-options').innerHTML = html;
    q('#ps-options').setAttribute('aria-labelledby', `ps-tab-${activeTab}`);
    paintAvatarImages();
  }
  function render() { paintOptions(); paintPreview(); controls(); }
  function change(next) {
    draft = normalizeAppearance(next); dirty = isDirty();
    message(dirty ? 'Masz niezapisane zmiany.' : 'Wygląd jest zapisany.');
    const focused = document.activeElement;
    const field = focused?.dataset?.psField, value = focused?.dataset?.psValue;
    render();
    if (field && value) root.querySelector(`[data-ps-field="${field}"][data-ps-value="${value}"]`)?.focus({ preventScroll: true });
  }
  function setTab(id) { activeTab = id; paintOptions(); controls(); }
  root.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-ps-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex(([id]) => id === activeTab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[next][0]); q(`[data-ps-tab="${activeTab}"]`).focus();
  });
  root.addEventListener('input', event => {
    if (!event.target.matches('[data-ps-intensity]') || !ready || busy) return;
    draft.intensity = Number(event.target.value); dirty = isDirty();
    q('[data-ps-intensity-output]').textContent = `${draft.intensity}%`;
    paintPreview(); controls(); message(dirty ? 'Masz niezapisane zmiany.' : 'Wygląd jest zapisany.');
  });
  root.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button || button.disabled || disposed) return;
    if (button.hasAttribute('data-ps-retry')) { await load(); return; }
    if (!ready || busy) return;
    if (button.hasAttribute('data-ps-avatar-editor')) {
      const editor = document.querySelector('.member-avatar-editor');
      if (editor) { editor.scrollIntoView({ behavior: 'auto', block: 'center' }); editor.querySelector('[data-avatar-file]')?.focus({ preventScroll: true }); }
      else message('Edytor miniatury jeszcze się wczytuje. Spróbuj za chwilę.');
      return;
    }
    if (button.dataset.psTab) { setTab(button.dataset.psTab); return; }
    if (button.hasAttribute('data-ps-edit-badges')) { setTab('badges'); q('[data-ps-tab="badges"]').focus(); return; }
    if (button.dataset.psField) {
      const key = button.dataset.psField, value = button.dataset.psValue;
      if (key === 'badges') {
        if (draft.badges.length === 3 && !draft.badges.includes(value)) { message('Masz już 3 odznaki. Usuń jedną, aby wybrać inną.'); return; }
        change({ ...draft, badges: toggleBadge(draft.badges, value) });
      } else change({ ...draft, [key]: value });
      return;
    }
    if (button.dataset.psRemoveBadge) { change({ ...draft, badges: draft.badges.filter(id => id !== button.dataset.psRemoveBadge) }); q('[data-ps-edit-badges]').focus(); return; }
    if (button.hasAttribute('data-ps-random')) { change(randomAppearance()); return; }
    if (button.hasAttribute('data-ps-default')) { change(DEFAULT_APPEARANCE); return; }
    if (button.hasAttribute('data-ps-cancel')) { change(saved); return; }
    if (!button.hasAttribute('data-ps-save')) return;
    const version = revision;
    busy = true; controls(); message('Zapisywanie wyglądu…');
    try {
      const result = demo ? normalizeAppearance(draft) : await saveAppearance(supabase, currentUserId, draft);
      if (disposed || version !== revision) return;
      if (demo) localStorage.setItem('ob-profile-studio-demo-v1', JSON.stringify(result));
      saved = result; draft = normalizeAppearance(result); dirty = false;
      message(demo ? 'Zestaw zapisany w tej przeglądarce (podgląd).' : 'Wygląd zapisany na Twoim koncie.');
      if (!demo) window.dispatchEvent(new CustomEvent('orzel:appearance-updated', { detail: { userId: currentUserId } }));
    } catch (error) { if (!disposed && version === revision) message(error.message || 'Zapis nie powiódł się. Spróbuj ponownie.'); }
    finally { if (!disposed && version === revision) { busy = false; controls(); } }
  });
  async function load() {
    const version = ++revision;
    ready = false; busy = false; currentUserId = null; avatarUrl = null; avatarPath = null; profile = { nickname: 'Twój nick' };
    draft = normalizeAppearance(DEFAULT_APPEARANCE); saved = normalizeAppearance(DEFAULT_APPEARANCE); dirty = false;
    render(); message('Wczytywanie profilu…'); q('[data-ps-retry]').hidden = true;
    try {
      let look;
      if (demo) {
        profile = { nickname: 'Twój nick', character_class: 'Duelist', character_level: 80 };
        try { look = JSON.parse(localStorage.getItem('ob-profile-studio-demo-v1') || 'null'); } catch { look = null; }
        look ||= { ...DEFAULT_APPEARANCE, background: 'eagle-citadel', ornament: 'eagle', frame: 'polish', badges: ['pvp', 'raid', 'poland'], effect: 'glow' };
      } else {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (disposed || version !== revision) return;
        if (error || !user) throw new Error('Zaloguj się, aby ustawić wygląd swojego profilu.');
        const [p, appearance] = await Promise.all([
          supabase.from('profiles').select('id,nickname,avatar_path,character_class,character_level,status,removed_at').eq('id', user.id).single(),
          loadAppearance(supabase, user.id),
        ]);
        if (disposed || version !== revision) return;
        if (p.error || !p.data || p.data.status !== 'approved' || p.data.removed_at) throw new Error('Kreator jest dostępny dla aktywnych członków klanu.');
        currentUserId = user.id; profile = p.data; look = appearance;
      }
      if (disposed || version !== revision) return;
      saved = normalizeAppearance(look); draft = normalizeAppearance(look); dirty = false; ready = true;
      render(); message('Wybierz ozdoby i zapisz swój zestaw.'); await resolveAvatar();
    } catch (error) {
      if (disposed || version !== revision) return;
      message(error?.message?.startsWith('Zaloguj') || error?.message?.startsWith('Kreator') ? error.message : 'Nie udało się wczytać wyglądu. Spróbuj ponownie.');
      q('[data-ps-retry]').hidden = false; controls();
    }
  }
  const auth = supabase?.auth.onAuthStateChange((event, session) => {
    if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
    // Supabase may emit SIGNED_IN again on focus. Do not discard an unsaved draft.
    if (session?.user?.id && session.user.id === currentUserId) return;
    ++revision; ready = false; currentUserId = null; busy = false; avatarUrl = null; controls();
    setTimeout(() => { if (!disposed) load(); }, 0);
  });
  const refreshAvatar = async () => {
    if (!ready || !currentUserId) return;
    const id = currentUserId, version = revision;
    try {
      const { data, error } = await supabase.from('profiles').select('nickname,avatar_path,character_class,character_level').eq('id', id).single();
      if (disposed || version !== revision || error || !data) return;
      profile = { ...profile, ...data }; avatarUrl = null; avatarPath = null; render(); await resolveAvatar();
    } catch { /* Keep current preview and unsaved appearance on a transient failure. */ }
  };
  window.addEventListener('orzel:avatar-updated', refreshAvatar);
  window.addEventListener('orzel:profile-updated', refreshAvatar);
  const beforeUnload = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  load();
  return () => {
    disposed = true; ++revision; auth?.data?.subscription?.unsubscribe();
    window.removeEventListener('orzel:avatar-updated', refreshAvatar); window.removeEventListener('orzel:profile-updated', refreshAvatar); window.removeEventListener('beforeunload', beforeUnload);
  };
}

const mounted = new WeakSet();
export function installProfileStudio(supabase) {
  if (!supabase) return;
  const ensure = () => {
    const panel = document.querySelector('[data-zone-panel="profile"]');
    if (!panel) return false;
    if (mounted.has(panel)) return true;
    mounted.add(panel);
    const root = document.createElement('section'); root.id = 'clanProfileStudio';
    const summary = panel.querySelector('#zoneProfileSummary');
    if (summary) summary.after(root); else panel.prepend(root);
    mountProfileStudio(root, { supabase });
    return true;
  };
  if (!ensure()) {
    const observer = new MutationObserver(() => { if (ensure()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

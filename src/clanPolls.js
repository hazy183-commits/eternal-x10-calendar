import { confirmLocalized } from './i18nCore.js';
import { loadAdminPermissionContext, hasAdminPermission } from './adminPermissions.js';
import { savePollVote, deletePoll } from './clanPollActions.js';

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const toDate = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const formatDateTime = (value) => {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : '';
};

const isOpen = (poll, now = Date.now()) => {
  const startsAt = toDate(poll.starts_at)?.getTime() || 0;
  const endsAt = poll.ends_at ? toDate(poll.ends_at)?.getTime() : null;
  return poll.is_active && startsAt <= now && (endsAt === null || endsAt > now);
};


const MENU_GROUPS = [
  { key: 'planning', label: 'PLANOWANIE', views: ['events', 'signups', 'polls'], icon: '◈', open: true },
  { key: 'clan', label: 'KLAN', views: ['announcements', 'profile', 'members', 'recruitment', 'attendance'], icon: '♜', open: false },
  { key: 'tools', label: 'NARZĘDZIA', views: ['needed-rb', 'craft'], icon: '⚒', open: false },
  { key: 'admin', label: 'ADMINISTRACJA', views: ['content-editor'], icon: '✦', open: false },
];

function organizeClanMenu(zone, side) {
  const viewToGroup = new Map(MENU_GROUPS.flatMap(group => group.views.map(view => [view, group.key])));
  const groups = new Map();

  for (const definition of MENU_GROUPS) {
    let wrapper = side.querySelector('[data-ob-menu-group="' + definition.key + '"]');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'ob-menu-group';
      wrapper.dataset.obMenuGroup = definition.key;
      wrapper.innerHTML = '<button type="button" class="ob-menu-group-trigger" aria-expanded="' + String(definition.open) + '"><i class="ob-menu-group-icon" aria-hidden="true">' + definition.icon + '</i><span>' + definition.label + '</span><b aria-hidden="true">⌄</b></button><div class="ob-menu-group-items"></div>';
      wrapper.querySelector('.ob-menu-group-trigger').addEventListener('click', () => {
        const open = wrapper.classList.toggle('is-open');
        wrapper.querySelector('.ob-menu-group-trigger')?.setAttribute('aria-expanded', String(open));
      });
      wrapper.classList.toggle('is-open', definition.open);
      groups.set(definition.key, wrapper);
      const anchor = side.querySelector('.zone-side-spacer') || side.querySelector('.zone-logout');
      side.insertBefore(wrapper, anchor || null);
    } else {
      groups.set(definition.key, wrapper);
    }
  }

  const directNavs = [...side.children].filter(child => child.matches?.('.zone-nav'));
  for (const nav of directNavs) {
    const groupKey = viewToGroup.get(nav.dataset.zoneView);
    if (!groupKey) continue;
    groups.get(groupKey)?.querySelector('.ob-menu-group-items')?.appendChild(nav);
  }

  for (const definition of MENU_GROUPS) {
    const wrapper = groups.get(definition.key);
    const items = wrapper?.querySelector('.ob-menu-group-items');
    if (!wrapper || !items) continue;
    const visible = [...items.children].some(item => !item.hidden);
    wrapper.hidden = !visible;
  }

  const activePanel = zone.querySelector('.zone-view.active[data-zone-panel]');
  const activeGroup = viewToGroup.get(activePanel?.dataset.zonePanel);
  if (activeGroup) {
    const wrapper = groups.get(activeGroup);
    if (wrapper && !wrapper.classList.contains('is-open')) {
      wrapper.classList.add('is-open');
      wrapper.querySelector('.ob-menu-group-trigger')?.setAttribute('aria-expanded', 'true');
    }
  }
}

export function installClanPolls(supabase) {
  if (!supabase || window.__obClanPollsInstalled) return;
  window.__obClanPollsInstalled = true;

  const waitForZone = () => {
    const zone = document.querySelector('#memberZoneLayer');
    const side = zone?.querySelector('.member-zone-side');
    const main = zone?.querySelector('.member-zone-main');
    if (!zone || !side || !main) {
      setTimeout(waitForZone, 150);
      return;
    }
    boot(zone, side, main);
  };

  async function currentAccess() {
    const [{ data: { session } }, context] = await Promise.all([
      supabase.auth.getSession(),
      loadAdminPermissionContext(supabase),
    ]);
    return {
      session,
      profile: context.profile,
      canManage: hasAdminPermission(context, 'manage_content'),
    };
  }

  async function boot(zone, side, main) {
    if (zone.querySelector('[data-zone-view="polls"]')) return;

    const style = document.createElement('style');
    style.textContent = [
      '.ob-menu-group{display:grid;gap:3px;margin:3px 0}',
      '.ob-menu-group-trigger{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;border:1px solid #3d3220;background:linear-gradient(90deg,#17140e,#0d1010);color:#d8b05e;text-align:left;font-size:10px;font-weight:900;letter-spacing:.08em;cursor:pointer}',
      '.ob-menu-group-trigger:hover,.ob-menu-group.is-open>.ob-menu-group-trigger{border-color:#80612d;background:linear-gradient(90deg,#3a2812,#17140d);color:#f0cf7e}',
      '.ob-menu-group-icon{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;border:1px solid currentColor;border-radius:4px;color:inherit;font-size:13px;line-height:1}',
      '.ob-menu-group-trigger b{margin-left:auto;color:#8c7446;font-size:14px;transition:transform .18s ease}',
      '.ob-menu-group.is-open>.ob-menu-group-trigger b{transform:rotate(180deg)}',
      '.ob-menu-group-items{display:none;gap:2px;padding-left:8px}',
      '.ob-menu-group.is-open>.ob-menu-group-items{display:grid}',
      '.ob-menu-group-items .zone-nav{margin:0;padding-left:9px;font-size:10px}',
      '.ob-menu-group[hidden]{display:none!important}',
      '@media(max-width:900px){#memberZoneLayer .member-zone-box{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;grid-template-rows:none!important;height:100%!important;min-height:0!important;overflow:hidden!important}#memberZoneLayer .member-zone-side{flex:0 0 min(320px,38dvh)!important;width:100%!important;height:min(320px,38dvh)!important;max-height:min(320px,38dvh)!important;min-height:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:max-content!important;align-content:start!important;align-items:start!important;overflow-y:auto!important;overflow-x:hidden!important;padding:8px!important;overscroll-behavior:contain!important;box-sizing:border-box!important;position:relative!important;z-index:2!important}#memberZoneLayer .member-zone-side>*{align-self:start!important;min-height:0!important}#memberZoneLayer .member-zone-side>.zone-nav[data-zone-view="home"]{grid-column:1/-1!important;justify-content:center!important;width:100%!important}#memberZoneLayer .member-zone-side>.zone-side-spacer{display:none!important}#memberZoneLayer .ob-menu-group{min-width:0;width:100%!important;height:max-content!important;min-height:0!important;margin:0;align-self:start!important}#memberZoneLayer .ob-menu-group-items{min-height:0!important;height:max-content!important;padding:4px 0 0;gap:3px}#memberZoneLayer .ob-menu-group-trigger{min-height:42px;padding:6px 8px;font-size:8px;letter-spacing:.04em}#memberZoneLayer .ob-menu-group-icon{flex-basis:22px;width:22px;height:22px;font-size:11px}#memberZoneLayer .ob-menu-group-items .zone-nav{min-width:0;padding:7px 6px;font-size:9px}#memberZoneLayer .zone-logout{grid-column:1/-1!important;position:static!important;width:100%!important;box-sizing:border-box!important;margin-top:4px!important}#memberZoneLayer .member-zone-main{flex:1 1 auto!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;position:relative!important;z-index:1!important}}',
      '.ob-polls-panel{max-width:940px}',
      '.ob-polls-list{display:grid;gap:12px}',
      '.ob-poll-card{padding:18px;border:1px solid #3d3222;background:#0a0e0e}',
      '.ob-poll-card h3{margin:0;color:#eee7da;font:700 20px Georgia}',
      '.ob-poll-description{margin:8px 0;color:#8d887f;font-size:11px;line-height:1.5;white-space:pre-wrap}',
      '.ob-poll-meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;color:#8b8375;font-size:10px}',
      '.ob-poll-meta span{padding:4px 7px;border:1px solid #453822}',
      '.ob-poll-options{display:grid;gap:8px;margin-top:14px}',
      '.ob-poll-option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:11px 13px;border:1px solid #5b4525;background:#11110d;color:#dec078;text-align:left;font-weight:800;cursor:pointer}',
      '.ob-poll-option:hover:not(:disabled){border-color:#bb8d3f;background:#1c160c}',
      '.ob-poll-option:disabled{cursor:default;opacity:.9}',
      '.ob-poll-option.is-selected{border-color:#d7a84d;background:#2a1c09;color:#f3d78d}',
      '.ob-poll-results{display:grid;gap:8px;margin-top:14px}',
      '.ob-poll-result{display:grid;gap:4px}',
      '.ob-poll-result-line{display:flex;justify-content:space-between;gap:10px;color:#d6c39a;font-size:10px}',
      '.ob-poll-result-track{height:7px;background:#191a16;border:1px solid #3b3222}',
      '.ob-poll-result-fill{height:100%;background:linear-gradient(90deg,#8e6427,#e0b55c)}',
      '.ob-poll-note{margin:12px 0 0;color:#7f7a70;font-size:10px}',
      '.ob-poll-empty{padding:34px;border:1px dashed #584526;color:#9b8257;text-align:center}',
      '.ob-poll-admin-list{display:grid;gap:8px;margin-top:12px}',
      '.ob-poll-admin-row{padding:11px;border:1px solid #3d3222;background:#090d0d}',
      '.ob-poll-admin-row strong{display:block;color:#ddd3bd;font-size:12px}',
      '.ob-poll-admin-row small{display:block;margin-top:5px;color:#827b6d;font-size:9px}',
      '.ob-poll-admin-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.ob-poll-admin-entry{display:flex;justify-content:flex-end;margin:14px 0 0}',
      '.ob-poll-admin-entry[hidden]{display:none!important}',
      '.ob-poll-inline-editor{margin-top:10px}',
      '.ob-poll-form{display:grid;gap:9px;padding:14px;border:1px solid #49391f;background:#0b0e0e;margin:12px 0}',
      '.ob-poll-form label{display:grid;gap:5px;color:#b1a58f;font-size:9px;font-weight:800}',
      '.ob-poll-form input,.ob-poll-form textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #443824;background:#080b0b;color:#eee}',
      '.ob-poll-form textarea{min-height:70px;resize:vertical}',
      '.ob-poll-form .ob-poll-option-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.ob-poll-form .ob-poll-option-inputs label{font-size:8px}',
      '.ob-poll-admin-card{margin-top:10px}',
      '@media(max-width:700px){.ob-poll-form .ob-poll-option-inputs{grid-template-columns:1fr}.ob-poll-card{padding:14px}.ob-poll-option{font-size:11px}}',
      '.zone-nav[data-zone-view="polls"] .zone-nav-icon{background-position:66.667% 100%}',
    ].join('');
    document.head.appendChild(style);

    const nav = document.createElement('button');
    nav.type = 'button';
    nav.className = 'zone-nav ob-polls-nav';
    nav.dataset.zoneView = 'polls';
    nav.innerHTML = '<span>Ankiety</span>';
    side.querySelector('.zone-side-spacer')?.before(nav);

    const panel = document.createElement('section');
    panel.className = 'zone-view ob-polls-panel';
    panel.dataset.zonePanel = 'polls';
    panel.innerHTML = [
      '<div class="zone-section-head"><small>GŁOSOWANIE KLANU</small><h3>ANKIETY</h3><p>Oddaj jeden głos w każdej aktywnej ankiecie.</p></div>',
      '<div class="ob-poll-admin-entry" data-poll-admin-entry hidden><button type="button" class="ob-editor-btn" data-poll-create>+ UTWÓRZ ANKIETĘ</button></div>',
      '<div class="ob-poll-inline-editor" data-poll-inline-editor></div>',
      '<p id="obPollActionStatus" class="ob-poll-note" role="status"></p><div id="obPollsList" class="ob-polls-list"><div class="ob-poll-empty">Ładowanie ankiet…</div></div>',
    ].join('');
    main.appendChild(panel);

    const organizeMenuSafely = () => {
      try {
        organizeClanMenu(zone, side);
      } catch (error) {
        console.error('CLAN MENU ORGANIZER FAILED', error);
      }
    };
    [400, 1000, 1800].forEach(delay => window.setTimeout(organizeMenuSafely, delay));
    zone.addEventListener('click', event => {
      const view = event.target.closest('[data-zone-view]')?.dataset.zoneView || event.target.closest('[data-zone-go]')?.dataset.zoneGo;
      if (view) window.setTimeout(organizeMenuSafely, 0);
    });

    let polls = [];
    let ownVotes = new Map();
    let results = new Map();
    let lastAccess = null;
    const pendingPolls = new Set();

    const feedback = () => document.querySelector('#memberZoneLayer #obEditorFeedback');
    const syncInlineAdmin = () => {
      const entry = panel.querySelector('[data-poll-admin-entry]');
      if (entry) entry.hidden = !lastAccess?.canManage;
    };

    const renderResults = (poll) => {
      const counts = results.get(String(poll.id)) || new Map();
      const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
      return '<div class="ob-poll-results">' + poll.options.map((option, index) => {
        const count = counts.get(index) || 0;
        const percent = total ? Math.round((count / total) * 100) : 0;
        return [
          '<div class="ob-poll-result">',
          '<div class="ob-poll-result-line"><span>', esc(option), '</span><span>', count, ' głosów · ', percent, '%</span></div>',
          '<div class="ob-poll-result-track"><div class="ob-poll-result-fill" style="width:', percent, '%"></div></div>',
          '</div>',
        ].join('');
      }).join('') + '</div>';
    };

    const renderPolls = () => {
      const list = panel.querySelector('#obPollsList');
      if (!list) return;
      if (!polls.length) {
        list.innerHTML = '<div class="ob-poll-empty">Brak aktywnych ankiet.</div>';
        return;
      }
      list.innerHTML = polls.map((poll) => {
        const open = isOpen(poll);
        const ownVote = ownVotes.get(String(poll.id));
        const hasVoted = Number.isInteger(ownVote);
        const showResults = hasVoted || !open || lastAccess?.canManage;
        const status = open ? 'AKTYWNA' : (poll.is_active ? 'NIEDOSTĘPNA' : 'ZAKOŃCZONA');
        const ends = poll.ends_at ? 'Koniec: ' + formatDateTime(poll.ends_at) : 'Bez terminu końcowego';
        return [
          '<article class="ob-poll-card">',
          '<h3>', esc(poll.question), '</h3>',
          poll.description ? '<p class="ob-poll-description">' + esc(poll.description) + '</p>' : '',
          '<div class="ob-poll-meta"><span>', status, '</span><span>', esc(ends), '</span></div>',
          '<div class="ob-poll-options">',
          poll.options.map((option, index) => {
            const selected = ownVote === index;
            const disabled = !open || selected || pendingPolls.has(String(poll.id));
            return '<button type="button" class="ob-poll-option' + (selected ? ' is-selected' : '') + '" data-poll-vote="' + poll.id + '" data-poll-option="' + index + '"' + (disabled ? ' disabled' : '') + '><span>' + esc(option) + '</span>' + (selected ? '<b>✓</b>' : '') + '</button>';
          }).join(''),
          '</div>',
          showResults ? renderResults(poll) : '<p class="ob-poll-note">Wybierz jedną odpowiedź. Możesz ją zmienić, dopóki ankieta jest otwarta.</p>',
          hasVoted ? '<p class="ob-poll-note">Twój głos został zapisany.' + (open ? ' Aby zmienić głos, kliknij inną odpowiedź.' : '') + '</p>' : '',
          lastAccess?.canManage ? '<button type="button" class="ob-editor-btn" data-poll-delete="' + poll.id + '"' + (pendingPolls.has(String(poll.id)) ? ' disabled' : '') + '>USUŃ ANKIETĘ</button>' : '',
          '</article>',
        ].join('');
      }).join('');
    };

    const loadResults = async (list) => {
      results = new Map();
      await Promise.all(list.map(async (poll) => {
        const { data, error } = await supabase.rpc('get_clan_poll_results', { p_poll_id: poll.id });
        if (error) {
          console.error('POLL RESULTS LOAD FAILED', error);
          return;
        }
        results.set(String(poll.id), new Map((data || []).map((row) => [Number(row.option_index), Number(row.vote_count)])));
      }));
    };

    const loadPolls = async () => {
      const access = await currentAccess();
      lastAccess = access;
      syncInlineAdmin();
      if (!access.session) {
        polls = [];
        ownVotes = new Map();
        results = new Map();
        renderPolls();
        return;
      }
      const { data, error } = await supabase
        .from('clan_polls')
        .select('id,question,description,options,is_active,starts_at,ends_at,created_at')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('POLLS LOAD FAILED', error);
        panel.querySelector('#obPollsList').innerHTML = '<div class="ob-poll-empty">Nie udało się pobrać ankiet.</div>';
        return;
      }
      polls = data || [];
      ownVotes = new Map();
      results = new Map();
      const ids = polls.map((poll) => poll.id);
      if (ids.length) {
        const { data: votes } = await supabase
          .from('clan_poll_votes')
          .select('poll_id,option_index')
          .eq('user_id', access.session.user.id)
          .in('poll_id', ids);
        ownVotes = new Map((votes || []).map((vote) => [String(vote.poll_id), Number(vote.option_index)]));
        await loadResults(polls.filter((poll) => ownVotes.has(String(poll.id)) || !isOpen(poll) || access.canManage));
      }
      renderPolls();
    };

    const adminArea = () => document.querySelector('#memberZoneLayer [data-zone-panel="content-editor"] #obEditorArea');
    const inlineAdminArea = () => panel.querySelector('[data-poll-inline-editor]');
    const waitForAdminArea = async (target = 'inline') => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const editor = target === 'content' ? adminArea() : inlineAdminArea();
        if (editor) return editor;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
    };
    const adminFeedback = (message) => {
      const nodes = [feedback(), panel.querySelector('[data-poll-form-feedback]')].filter(Boolean);
      [...new Set(nodes)].forEach((node) => { node.textContent = message; });
    };

    const showAdminEditor = async (target = 'inline') => {
      const access = await currentAccess();
      if (!access.canManage) return;
      const editor = await waitForAdminArea(target);
      if (!editor) {
        adminFeedback('Nie udało się otworzyć edytora ankiety. Odśwież strefę klanu i spróbuj ponownie.');
        return;
      }
      const optionInputs = [1, 2, 3, 4].map((index) => [
        '<label>Odpowiedź ', index, '<input data-poll-option-input maxlength="120" ', index <= 2 ? 'required' : '', '></label>',
      ].join('')).join('');
      const activeRows = polls.map((poll) => {
        const state = isOpen(poll) ? 'AKTYWNA' : (poll.is_active ? 'NIEDOSTĘPNA' : 'ZAKOŃCZONA');
        return [
          '<div class="ob-poll-admin-row">',
          '<strong>', esc(poll.question), '</strong>',
          '<small>', state, ' · ', poll.options.length, ' odpowiedzi · utworzono ', esc(formatDateTime(poll.created_at)), '</small>',
          '<div class="ob-poll-admin-actions">',
          poll.is_active ? '<button type="button" class="ob-editor-btn" data-poll-close="' + poll.id + '">ZAKOŃCZ</button>' : '',
          '<button type="button" class="ob-editor-btn" data-poll-delete="' + poll.id + '">USUŃ</button>',
          '</div>',
          '</div>',
        ].join('');
      }).join('');
      editor.innerHTML = [
        '<form id="obPollForm" class="ob-poll-form">',
        '<label>Pytanie<input id="obPollQuestion" maxlength="240" required placeholder="Np. Kto będzie na sobotnim PvP?"></label>',
        '<label>Opis (opcjonalnie)<textarea id="obPollDescription" maxlength="1000" placeholder="Dodatkowe informacje dla członków"></textarea></label>',
        '<div class="ob-poll-option-inputs">', optionInputs, '</div>',
        '<label>Koniec ankiety (opcjonalnie)<input id="obPollEndsAt" type="datetime-local"></label>',
        '<p class="ob-poll-note" data-poll-form-feedback role="status"></p>',
        '<div class="ob-poll-admin-actions"><button type="submit" class="ob-editor-btn">UTWÓRZ ANKIETĘ</button><button type="button" class="ob-editor-btn" id="obPollCancel">ANULUJ</button></div>',
        '</form>',
        '<div class="ob-poll-admin-list">', activeRows || '<p class="zone-muted">Nie ma jeszcze żadnych ankiet.</p>', '</div>',
      ].join('');

      editor.querySelector('#obPollCancel').onclick = () => { editor.innerHTML = ''; };
      editor.querySelector('#obPollForm').onsubmit = async (event) => {
        event.preventDefault();
        const submitButton = editor.querySelector('button[type="submit"]');
        if (submitButton?.disabled) return;
        if (submitButton) submitButton.disabled = true;
        try {
          const current = await currentAccess();
          if (!current.canManage || !current.profile?.id || !current.session?.user?.id) {
            adminFeedback('Brak uprawnień do tworzenia ankiet.');
            return;
          }
          const question = editor.querySelector('#obPollQuestion').value.trim();
          if (question.length < 3) {
            adminFeedback('Pytanie musi mieć co najmniej 3 znaki.');
            return;
          }
          const description = editor.querySelector('#obPollDescription').value.trim() || null;
          const options = [...editor.querySelectorAll('[data-poll-option-input]')]
            .map((input) => input.value.trim())
            .filter(Boolean);
          if (options.length < 2 || options.length > 8 || new Set(options.map((value) => value.toLowerCase())).size !== options.length) {
            adminFeedback('Dodaj od 2 do 8 różnych odpowiedzi.');
            return;
          }
          const startsAt = new Date();
          const endsValue = editor.querySelector('#obPollEndsAt').value;
          const parsedEndsAt = endsValue ? new Date(endsValue) : null;
          const endsAt = parsedEndsAt && Number.isFinite(parsedEndsAt.getTime()) ? parsedEndsAt.toISOString() : null;
          if (endsValue && (!endsAt || parsedEndsAt.getTime() <= startsAt.getTime())) {
            adminFeedback('Data zakończenia musi być późniejsza niż teraz.');
            return;
          }
          adminFeedback('Zapisywanie ankiety…');
          const { error } = await supabase.from('clan_polls').insert({
            question,
            description,
            options,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt,
            is_active: true,
            created_by: current.session.user.id,
          });
          if (error) {
            console.error('POLL CREATE FAILED', error);
            adminFeedback('Nie udało się utworzyć ankiety: ' + (error.message || 'błąd zapisu.'));
            return;
          }
          await loadPolls();
          await showAdminEditor(target);
          adminFeedback('✓ Ankieta utworzona.');
        } catch (error) {
          console.error('POLL CREATE FAILED', error);
          adminFeedback('Nie udało się utworzyć ankiety: ' + (error?.message || 'błąd zapisu.'));
        } finally {
          if (submitButton && editor.contains(submitButton)) submitButton.disabled = false;
        }
      };
      editor.querySelectorAll('[data-poll-close]').forEach((button) => {
        button.onclick = async () => {
          if (!await currentAccess().then((access) => access.canManage)) return;
          const { error } = await supabase.from('clan_polls').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', button.dataset.pollClose);
          adminFeedback(error ? 'Nie udało się zakończyć ankiety.' : '✓ Ankieta zakończona.');
          if (!error) {
            await loadPolls();
            await showAdminEditor(target);
          }
        };
      });
      editor.querySelectorAll('[data-poll-delete]').forEach((button) => {
        button.onclick = async () => {
          if (!confirmLocalized('Usunąć tę ankietę razem z głosami?')) return;
          if (!await currentAccess().then((access) => access.canManage)) return;
          button.disabled = true;
          try {
            await deletePoll(supabase, button.dataset.pollDelete);
            adminFeedback('✓ Ankieta usunięta.');
            await loadPolls();
            await showAdminEditor(target);
          } catch { adminFeedback('Nie udało się usunąć ankiety.'); }
          finally { button.disabled = false; }
        };
      });
    };

    const installAdminCard = () => {
      const grid = zone.querySelector('[data-zone-panel="content-editor"] .ob-owner-grid');
      if (!grid || grid.querySelector('[data-ob-poll-admin-card]')) return Boolean(grid);
      const card = document.createElement('section');
      card.className = 'ob-owner-box ob-poll-admin-card';
      card.dataset.obPollAdminCard = 'true';
      card.innerHTML = '<h4>Ankiety</h4><p class="zone-muted">Twórz ankiety i zarządzaj głosowaniami członków.</p><button type="button" class="ob-editor-btn">ZARZĄDZAJ ANKIETAMI</button>';
      card.querySelector('button').onclick = async () => {
        zone.querySelector('[data-zone-view="content-editor"]')?.click();
        setTimeout(() => showAdminEditor('content'), 0);
      };
      grid.appendChild(card);
      return true;
    };

    const syncAdminCard = async () => {
      const access = await currentAccess();
      const card = zone.querySelector('[data-ob-poll-admin-card]');
      if (card) card.hidden = !access.canManage;
      installAdminCard();
      const inserted = zone.querySelector('[data-ob-poll-admin-card]');
      if (inserted) inserted.hidden = !access.canManage;
    };

    const pollAdminCardWait = () => {
      if (!installAdminCard()) setTimeout(pollAdminCardWait, 250);
    };

    panel.addEventListener('click', async (event) => {
      const remove = event.target.closest('[data-poll-delete]');
      if (remove && !remove.disabled) {
        const id = remove.dataset.pollDelete;
        if (pendingPolls.has(id)) return;
        const poll = polls.find(item => String(item.id) === id);
        if (!poll || !confirmLocalized('Usunąć ankietę „' + poll.question + '” razem ze wszystkimi głosami? Tej operacji nie można cofnąć.')) return;
        pendingPolls.add(id); renderPolls();
        try {
          if (!(await currentAccess()).canManage) throw new Error('Brak uprawnień.');
          await deletePoll(supabase, id);
          await loadPolls();
          panel.querySelector('#obPollActionStatus').textContent = '✓ Ankieta usunięta.';
        } catch { panel.querySelector('#obPollActionStatus').textContent = 'Nie udało się usunąć ankiety. Odśwież listę i spróbuj ponownie.'; }
        finally { pendingPolls.delete(id); renderPolls(); }
        return;
      }
      const button = event.target.closest('[data-poll-vote]');
      if (!button || button.disabled) return;
      const id = button.dataset.pollVote;
      if (pendingPolls.has(id)) return;
      pendingPolls.add(id);
      try {
      const access = await currentAccess();
      const poll = polls.find((item) => String(item.id) === String(button.dataset.pollVote));
      const optionIndex = Number(button.dataset.pollOption);
      if (!access.session || !access.profile?.id || !poll || !isOpen(poll) || !Number.isInteger(optionIndex)) return;
      if (optionIndex >= poll.options.length) return;
      renderPolls();
      await savePollVote(supabase, {pollId:poll.id,userId:access.profile.id,optionIndex,previousVote:ownVotes.get(id)});
      await loadPolls();
      panel.querySelector('#obPollActionStatus').textContent = '✓ Głos zapisany.';
      } catch {
        panel.querySelector('#obPollActionStatus').textContent = 'Nie udało się zapisać głosu. Odśwież ankietę i spróbuj ponownie.';
      } finally { pendingPolls.delete(id); renderPolls(); }
    });

    panel.querySelector('[data-poll-create]').onclick = () => showAdminEditor('inline');

    zone.addEventListener('click', (event) => {
      if (event.target.closest('[data-zone-view="polls"]')) setTimeout(loadPolls, 0);
      if (event.target.closest('[data-zone-view="content-editor"]')) setTimeout(syncAdminCard, 0);
    });

    supabase.auth.onAuthStateChange(() => {
      setTimeout(async () => {
        await loadPolls();
        await syncAdminCard();
      }, 0);
    });

    await loadPolls();
    pollAdminCardWait();
    await syncAdminCard();
  }

  waitForZone();
}

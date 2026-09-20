import { loadAdminPermissionContext, hasAdminPermission } from './adminPermissions.js';

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
      '.ob-poll-form{display:grid;gap:9px;padding:14px;border:1px solid #49391f;background:#0b0e0e;margin:12px 0}',
      '.ob-poll-form label{display:grid;gap:5px;color:#b1a58f;font-size:9px;font-weight:800}',
      '.ob-poll-form input,.ob-poll-form textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #443824;background:#080b0b;color:#eee}',
      '.ob-poll-form textarea{min-height:70px;resize:vertical}',
      '.ob-poll-form .ob-poll-option-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.ob-poll-form .ob-poll-option-inputs label{font-size:8px}',
      '.ob-poll-admin-card{margin-top:10px}',
      '@media(max-width:700px){.ob-poll-form .ob-poll-option-inputs{grid-template-columns:1fr}.ob-poll-card{padding:14px}.ob-poll-option{font-size:11px}}',
      '.zone-nav[data-zone-view="polls"] .zone-nav-icon{background-position:100% 100%}',
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
      '<div id="obPollsList" class="ob-polls-list"><div class="ob-poll-empty">Ładowanie ankiet…</div></div>',
    ].join('');
    main.appendChild(panel);

    let polls = [];
    let ownVotes = new Map();
    let results = new Map();
    let lastAccess = null;

    const feedback = () => document.querySelector('#memberZoneLayer #obEditorFeedback');

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
            const disabled = !open || hasVoted || lastAccess?.canManage;
            return '<button type="button" class="ob-poll-option' + (selected ? ' is-selected' : '') + '" data-poll-vote="' + poll.id + '" data-poll-option="' + index + '"' + (disabled ? ' disabled' : '') + '><span>' + esc(option) + '</span>' + (selected ? '<b>✓</b>' : '') + '</button>';
          }).join(''),
          '</div>',
          showResults ? renderResults(poll) : '<p class="ob-poll-note">Wybierz jedną odpowiedź. Głos można oddać tylko raz.</p>',
          hasVoted ? '<p class="ob-poll-note">Twój głos został zapisany.</p>' : '',
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
    const adminFeedback = (message) => {
      const node = feedback();
      if (node) node.textContent = message;
    };

    const showAdminEditor = async () => {
      const access = await currentAccess();
      if (!access.canManage) return;
      const editor = adminArea();
      if (!editor) return;
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
        '<div class="ob-poll-admin-actions"><button type="submit" class="ob-editor-btn">UTWÓRZ ANKIETĘ</button><button type="button" class="ob-editor-btn" id="obPollCancel">ANULUJ</button></div>',
        '</form>',
        '<div class="ob-poll-admin-list">', activeRows || '<p class="zone-muted">Nie ma jeszcze żadnych ankiet.</p>', '</div>',
      ].join('');

      editor.querySelector('#obPollCancel').onclick = () => { editor.innerHTML = ''; };
      editor.querySelector('#obPollForm').onsubmit = async (event) => {
        event.preventDefault();
        const current = await currentAccess();
        if (!current.canManage || !current.profile?.id) return;
        const question = editor.querySelector('#obPollQuestion').value.trim();
        const description = editor.querySelector('#obPollDescription').value.trim() || null;
        const options = [...editor.querySelectorAll('[data-poll-option-input]')]
          .map((input) => input.value.trim())
          .filter(Boolean);
        if (options.length < 2 || new Set(options.map((value) => value.toLowerCase())).size !== options.length) {
          adminFeedback('Dodaj minimum dwie różne odpowiedzi.');
          return;
        }
        const endsValue = editor.querySelector('#obPollEndsAt').value;
        const endsAt = endsValue ? new Date(endsValue).toISOString() : null;
        if (endsValue && !endsAt) {
          adminFeedback('Podaj poprawną datę zakończenia.');
          return;
        }
        adminFeedback('Zapisywanie ankiety…');
        const { error } = await supabase.from('clan_polls').insert({
          question,
          description,
          options,
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
          is_active: true,
          created_by: current.profile.id,
        });
        if (error) {
          console.error('POLL CREATE FAILED', error);
          adminFeedback('Nie udało się utworzyć ankiety.');
          return;
        }
        adminFeedback('✓ Ankieta utworzona.');
        await loadPolls();
        await showAdminEditor();
      };
      editor.querySelectorAll('[data-poll-close]').forEach((button) => {
        button.onclick = async () => {
          if (!await currentAccess().then((access) => access.canManage)) return;
          const { error } = await supabase.from('clan_polls').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', button.dataset.pollClose);
          adminFeedback(error ? 'Nie udało się zakończyć ankiety.' : '✓ Ankieta zakończona.');
          if (!error) {
            await loadPolls();
            await showAdminEditor();
          }
        };
      });
      editor.querySelectorAll('[data-poll-delete]').forEach((button) => {
        button.onclick = async () => {
          if (!confirm('Usunąć tę ankietę razem z głosami?')) return;
          if (!await currentAccess().then((access) => access.canManage)) return;
          const { error } = await supabase.from('clan_polls').delete().eq('id', button.dataset.pollDelete);
          adminFeedback(error ? 'Nie udało się usunąć ankiety.' : '✓ Ankieta usunięta.');
          if (!error) {
            await loadPolls();
            await showAdminEditor();
          }
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
        setTimeout(showAdminEditor, 0);
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
      const button = event.target.closest('[data-poll-vote]');
      if (!button || button.disabled) return;
      const access = await currentAccess();
      const poll = polls.find((item) => String(item.id) === String(button.dataset.pollVote));
      const optionIndex = Number(button.dataset.pollOption);
      if (!access.session || !access.profile?.id || !poll || !isOpen(poll) || !Number.isInteger(optionIndex)) return;
      button.disabled = true;
      const { error } = await supabase.from('clan_poll_votes').insert({
        poll_id: poll.id,
        user_id: access.profile.id,
        option_index: optionIndex,
      });
      if (error) {
        console.error('POLL VOTE FAILED', error);
        panel.querySelector('#obPollsList').insertAdjacentHTML('afterbegin', '<p class="ob-poll-note">Nie udało się zapisać głosu. Być może głos został już oddany.</p>');
        return;
      }
      await loadPolls();
    });

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

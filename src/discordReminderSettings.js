import { getClanUpcomingEvents } from './clanEventFeed.js';

const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const eventKey = (id) => /^\d+$/.test(String(id)) ? `event-${id}` : String(id);
const bool = (value, fallback = true) => typeof value === 'boolean' ? value : fallback;

function previewMarkup(preview) {
  if (!preview?.ok) return `<p class="ob-discord-preview-empty">${esc(preview?.message || 'Brak wydarzenia do podglądu.')}</p>`;
  return `<article class="ob-discord-preview-message">
    <span>PRZYKŁADOWA WIADOMOŚĆ</span>
    <h5>${esc(preview.title)}</h5>
    <div class="ob-discord-preview-grid">
      <p><small>🕒 START</small><b>${esc(preview.start)}</b></p>
      <p><small>🏷️ TYP</small><b>${esc(preview.type || 'EVENT')}</b></p>
      <p class="wide"><small>📍 LOKALIZACJA</small><b>${esc(preview.location || '—')}</b></p>
      <p><small>👥 BĘDĘ</small><b>${Number(preview.yes_count || 0)}</b><span>${esc(preview.yes_names || '—')}</span></p>
      <p><small>🤔 MOŻE</small><b>${Number(preview.maybe_count || 0)}</b><span>${esc(preview.maybe_names || '—')}</span></p>
    </div>
  </article>`;
}

export function installDiscordReminderSettings(supabase) {
  if (!supabase || window.__obDiscordReminderSettingsInstalled) return;
  window.__obDiscordReminderSettingsInstalled = true;

  const wait = () => {
    const zone = document.querySelector('#memberZoneLayer');
    const panel = zone?.querySelector('[data-zone-panel="content-editor"]');
    const grid = panel?.querySelector('.ob-owner-grid');
    const editor = panel?.querySelector('#obEditorArea');
    const feedback = panel?.querySelector('#obEditorFeedback');
    if (!zone || !panel || !grid || !editor || !feedback) { setTimeout(wait, 200); return; }
    if (panel.querySelector('#obDiscordReminderCard')) return;

    const style = document.createElement('style');
    style.textContent = `
      .ob-discord-form{display:grid;gap:14px;padding:16px;border:1px solid #5d4727;background:radial-gradient(circle at 90% 0,#60421828,transparent 32%),#0b0e0e;margin:12px 0;box-shadow:inset 0 0 28px #0008}
      .ob-discord-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #3d321f}.ob-discord-head h4{margin:0;color:#f0d18d}.ob-discord-head p{margin:4px 0 0}
      .ob-discord-state{flex:none;padding:7px 10px;border:1px solid #6a4b27;background:#171109;color:#d6a958;font-size:9px;font-weight:900;letter-spacing:.06em}.ob-discord-state.ready{border-color:#346448;background:#0b1b12;color:#80d39a}
      .ob-discord-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ob-discord-option{display:flex!important;align-items:flex-start;gap:9px!important;padding:12px;border:1px solid #39301f;background:#090d0d}.ob-discord-option input{width:auto!important;margin-top:2px}.ob-discord-option span{color:#ddd;font-size:10px}.ob-discord-option small{display:block;margin-top:3px;color:#79756c;font-weight:500}
      .ob-discord-form>label{display:grid;gap:6px;color:#b1a58f;font-size:9px;font-weight:800}.ob-discord-form select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #443824;background:#080b0b;color:#eee}
      .ob-discord-help{padding:11px 12px;border-left:2px solid #b8873b;background:#24190866;color:#9d9588;font-size:10px;line-height:1.5}.ob-discord-help b{color:#dfbd73}
      .ob-discord-events{display:grid;gap:8px}.ob-discord-event{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:10px;border:1px solid #332a1d;background:#090d0d}.ob-discord-event b{display:block;color:#ddd;font-size:11px}.ob-discord-event small{color:#7f7a70}.ob-discord-event select{padding:7px;background:#080b0b;color:#ddd;border:1px solid #4a3b23}.ob-discord-event button{padding:7px 9px;border:1px solid #765724;background:#17120b;color:#e1b75e;font-size:8px;font-weight:900;cursor:pointer}.ob-discord-event button[data-enabled="0"]{border-color:#443d33;color:#777;background:#0b0c0c}
      .ob-discord-preview-message{padding:13px;border-left:3px solid #6f75dd;background:#11131a;color:#dadde9;box-shadow:0 8px 22px #0006}.ob-discord-preview-message>span{color:#8f94e4;font-size:8px;font-weight:900;letter-spacing:.12em}.ob-discord-preview-message h5{margin:7px 0 11px;color:#fff;font-size:14px}.ob-discord-preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.ob-discord-preview-grid p{margin:0;padding:8px;background:#090b10}.ob-discord-preview-grid p.wide{grid-column:1/-1}.ob-discord-preview-grid small,.ob-discord-preview-grid b{display:block}.ob-discord-preview-grid small{margin-bottom:3px;color:#777e91;font-size:8px}.ob-discord-preview-grid b{font-size:10px}.ob-discord-preview-empty{margin:0;color:#8d877c}
      @media(max-width:700px){.ob-discord-options,.ob-discord-preview-grid{grid-template-columns:1fr}.ob-discord-event{grid-template-columns:1fr}.ob-discord-event select,.ob-discord-event button{width:100%}.ob-discord-head{display:grid}.ob-discord-preview-grid p.wide{grid-column:auto}}
    `;
    document.head.appendChild(style);

    const card = document.createElement('section');
    card.id = 'obDiscordReminderCard';
    card.className = 'ob-owner-box';
    card.innerHTML = '<h4>Discord powiadomienia</h4><p class="zone-muted">Codzienny raport o 08:00 oraz przypomnienia o wydarzeniach i zgłoszeniach RB. Webhook jest przechowywany poza stroną.</p><button class="ob-editor-btn" id="obOpenDiscordReminders">USTAW POWIADOMIENIA</button>';
    grid.appendChild(card);

    const profile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from('profiles').select('id,role,status').eq('id', session.user.id).maybeSingle();
      return data || null;
    };
    const owner = async () => {
      const current = await profile();
      return current?.status === 'approved' && String(current.role || '').toLowerCase() === 'owner' ? current : null;
    };

    async function show() {
      if (!await owner()) return;
      feedback.textContent = 'Ładowanie ustawień…';
      const [{ data: settings, error: settingsError }, { data: overrides }, { data: status }] = await Promise.all([
        supabase.from('discord_notification_settings').select('enabled,reminder_minutes,notify_event_reminders,notify_needed_rb,daily_digest_enabled').eq('id', true).maybeSingle(),
        supabase.from('discord_event_reminder_overrides').select('event_key,enabled,reminder_minutes'),
        supabase.rpc('discord_notification_status'),
      ]);
      if (settingsError) { feedback.textContent = 'Nie udało się pobrać ustawień Discord.'; return; }

      const configured = status?.configured === true;
      const overrideMap = new Map((overrides || []).map((item) => [item.event_key, item]));
      const events = getClanUpcomingEvents().slice(0, 40);
      const rows = events.map((event) => {
        const key = eventKey(event.id);
        const override = overrideMap.get(key);
        const enabled = override?.enabled !== false;
        const minutes = override?.reminder_minutes ?? settings?.reminder_minutes ?? 30;
        return `<div class="ob-discord-event" data-event-key="${esc(key)}"><div><b>${esc(event.name || 'Wydarzenie')}</b><small>${esc(event.date || event.event_date || '')} ${esc(String(event.time || event.event_time || '').slice(0, 5))}${event.location ? ` · ${esc(event.location)}` : ''}</small></div><select data-reminder-minutes><option value="60" ${minutes === 60 ? 'selected' : ''}>60 min</option><option value="30" ${minutes === 30 ? 'selected' : ''}>30 min</option><option value="15" ${minutes === 15 ? 'selected' : ''}>15 min</option><option value="10" ${minutes === 10 ? 'selected' : ''}>10 min</option></select><button type="button" data-reminder-toggle data-enabled="${enabled ? '1' : '0'}">${enabled ? 'WŁĄCZONE' : 'WYŁĄCZONE'}</button></div>`;
      }).join('');

      editor.innerHTML = `<form id="obDiscordReminderForm" class="ob-discord-form">
        <div class="ob-discord-head"><div><h4>Powiadomienia Discord</h4><p class="zone-muted">Automatyczna kontrola co 5 minut · czas Europe/Warsaw</p></div><span class="ob-discord-state ${configured ? 'ready' : ''}">${configured ? '● WEBHOOK PODŁĄCZONY' : '○ OCZEKUJE NA WEBHOOK'}</span></div>
        <label class="ob-discord-option"><input id="obDiscordEnabled" type="checkbox" ${settings?.enabled ? 'checked' : ''} ${configured ? '' : 'disabled'}><span>Włącz automatyczną wysyłkę<small>${configured ? 'Wiadomości będą wysyłane zgodnie z ustawieniami poniżej.' : 'Opcja odblokuje się po bezpiecznym dodaniu webhooka.'}</small></span></label>
        <div class="ob-discord-options">
          <label class="ob-discord-option"><input id="obDiscordEvents" type="checkbox" ${bool(settings?.notify_event_reminders) ? 'checked' : ''}><span>Wydarzenia<small>RB, Epic RB, Siege, Clan Hall i Olympiada</small></span></label>
          <label class="ob-discord-option"><input id="obDiscordNeededRb" type="checkbox" ${bool(settings?.notify_needed_rb) ? 'checked' : ''}><span>Potrzebne RB<small>Zgłoszenia członków z ustawionym oknem</small></span></label>
          <label class="ob-discord-option"><input id="obDiscordDailyDigest" type="checkbox" \${bool(settings?.daily_digest_enabled) ? 'checked' : ''}><span>Codzienny raport<small>Codziennie o 08:00 · najbliższe 24 godziny</small></span></label>
        </div>
        <label>Domyślnie ile minut wcześniej<select id="obDiscordMinutes"><option value="60" ${Number(settings?.reminder_minutes) === 60 ? 'selected' : ''}>60 minut</option><option value="30" ${Number(settings?.reminder_minutes || 30) === 30 ? 'selected' : ''}>30 minut</option><option value="15" ${Number(settings?.reminder_minutes) === 15 ? 'selected' : ''}>15 minut</option><option value="10" ${Number(settings?.reminder_minutes) === 10 ? 'selected' : ''}>10 minut</option></select></label>
        <div class="ob-discord-help"><b>Webhook nie jest zapisywany w przeglądarce ani w publicznej tabeli.</b><br>Po jego podaniu zostanie umieszczony w zaszyfrowanym sejfie Supabase. Członkowie klanu nie mają do niego dostępu.</div>
        <div class="ob-ann-actions"><button class="ob-save-settings" type="submit">ZAPISZ USTAWIENIA</button><button type="button" id="obDiscordPreview">PODGLĄD WIADOMOŚCI</button><button type="button" id="obDiscordTest" ${configured ? '' : 'disabled'}>WYŚLIJ TEST</button><button type="button" id="obDiscordClose">ZAMKNIJ</button></div>
        <div id="obDiscordPreviewBox"></div>
        <div><b style="color:#d8b15e;font-size:10px">USTAWIENIA DLA KONKRETNYCH WYDARZEŃ</b><p class="zone-muted">Możesz wyłączyć pojedyncze przypomnienie albo zmienić jego czas.</p><div class="ob-discord-events">${rows || '<p class="zone-muted">Brak nadchodzących wydarzeń.</p>'}</div></div>
      </form>`;
      feedback.textContent = configured ? '✓ Mechanizm Discord jest skonfigurowany.' : 'Mechanizm gotowy — brakuje tylko webhooka Discord.';

      editor.querySelector('#obDiscordClose').onclick = () => { editor.innerHTML = ''; };
      editor.querySelector('#obDiscordReminderForm').onsubmit = async (event) => {
        event.preventDefault();
        const current = await owner();
        if (!current) return;
        feedback.textContent = 'Zapisywanie…';
        const row = {
          id: true,
          enabled: configured && editor.querySelector('#obDiscordEnabled').checked,
          notify_event_reminders: editor.querySelector('#obDiscordEvents').checked,
          notify_needed_rb: editor.querySelector('#obDiscordNeededRb').checked,
          daily_digest_enabled: editor.querySelector('#obDiscordDailyDigest').checked,
          reminder_minutes: Number(editor.querySelector('#obDiscordMinutes').value),
          updated_by: current.id,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('discord_notification_settings').upsert(row, { onConflict: 'id' });
        feedback.textContent = error ? 'Nie udało się zapisać ustawień.' : '✓ Ustawienia powiadomień zapisane.';
      };
      editor.querySelector('#obDiscordPreview').onclick = async () => {
        feedback.textContent = 'Przygotowuję podgląd…';
        const { data, error } = await supabase.rpc('preview_discord_notification');
        editor.querySelector('#obDiscordPreviewBox').innerHTML = error ? '<p class="ob-discord-preview-empty">Nie udało się przygotować podglądu.</p>' : previewMarkup(data);
        feedback.textContent = error ? 'Podgląd niedostępny.' : '✓ Podgląd przygotowany bez wysyłania na Discord.';
      };
      editor.querySelector('#obDiscordTest').onclick = async () => {
        feedback.textContent = 'Wysyłam wiadomość testową…';
        const { data, error } = await supabase.rpc('test_discord_notification');
        feedback.textContent = error ? 'Test nieudany.' : (data?.ok ? '✓ Test został przekazany do Discord.' : (data?.message || 'Brak webhooka.'));
      };
      editor.querySelectorAll('[data-reminder-toggle]').forEach((button) => {
        button.onclick = async () => {
          const parent = button.closest('[data-event-key]');
          const current = await owner();
          if (!current) return;
          const enabled = button.dataset.enabled !== '1';
          const { error } = await supabase.from('discord_event_reminder_overrides').upsert({
            event_key: parent.dataset.eventKey,
            enabled,
            reminder_minutes: Number(parent.querySelector('[data-reminder-minutes]').value),
            updated_by: current.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'event_key' });
          if (!error) {
            button.dataset.enabled = enabled ? '1' : '0';
            button.textContent = enabled ? 'WŁĄCZONE' : 'WYŁĄCZONE';
          }
        };
      });
      editor.querySelectorAll('[data-reminder-minutes]').forEach((select) => {
        select.onchange = async () => {
          const parent = select.closest('[data-event-key]');
          const current = await owner();
          if (!current) return;
          await supabase.from('discord_event_reminder_overrides').upsert({
            event_key: parent.dataset.eventKey,
            enabled: parent.querySelector('[data-reminder-toggle]').dataset.enabled === '1',
            reminder_minutes: Number(select.value),
            updated_by: current.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'event_key' });
        };
      });
    }

    card.querySelector('#obOpenDiscordReminders').onclick = show;
  };
  wait();
}

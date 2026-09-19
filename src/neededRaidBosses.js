import { warsawLocalToIso } from './neededRaidBossWindow.js';
const RAID_BOSSES = [
  { level: 60, name: 'Ancient Weird Drake' },
  { level: 60, name: 'Ghost of the Well Lidia' },
  { level: 60, name: 'Giant Marpanak' },
  { level: 60, name: 'Guardian of the Statue of Giant Karum' },
  { level: 60, name: 'Lord Ishka' },
  { level: 60, name: 'Taik High Prefect Arak' },
  { level: 60, name: 'The 3rd Underwater Guardian' },
  { level: 61, name: 'Fairy Queen Timiniel' },
  { level: 62, name: 'Roaring Lord Kastor' },
  { level: 64, name: 'Gorgolos' },
  { level: 65, name: 'Enmity Ghost Ramdal' },
  { level: 65, name: 'Fierce Tiger King Angel' },
  { level: 65, name: 'Gargoyle Lord Tiphon' },
  { level: 65, name: 'Hekaton Prime' },
  { level: 65, name: 'Rahha' },
  { level: 65, name: "Shilen's Priest Hisilrome" },
  { level: 66, name: "Demon's Agent Falston" },
  { level: 66, name: 'Last Titan Utenus' },
  { level: 67, name: "Kernon's Faithful Servant Kelone" },
  { level: 69, name: 'Bloody Priest Rudelto' },
  { level: 69, name: 'Spirit of Andras, the Betrayer' },
  { level: 70, name: "Anakim's Nemesis Zakaron" },
  { level: 70, name: 'Beast Lord Behemoth' },
  { level: 70, name: "Fafurion's Herald Lokness" },
  { level: 70, name: 'Flame of Splendor Barakiel' },
  { level: 70, name: 'Korim' },
  { level: 70, name: 'Meanas Anor' },
  { level: 70, name: 'Palibati Queen Themis' },
  { level: 70, name: 'Roaring Skylancer' },
  { level: 70, name: "Shilen's Messenger Cabrio" },
  { level: 71, name: 'Immortal Savior Mardil' },
  { level: 72, name: 'Doom Blade Tanatos' },
  { level: 72, name: 'Vanor Chief Kandra' },
  { level: 72, name: 'Water Dragon Seer Sheshark' },
  { level: 73, name: 'Death Lord Hallate' },
  { level: 74, name: 'Antharas Priest Cloe' },
  { level: 74, name: 'Krokian Padisha Sobekk' },
  { level: 75, name: 'Bloody Empress Decarbia' },
  { level: 75, name: 'Death Lord Ipos' },
  { level: 75, name: 'Death Lord Shax' },
  { level: 75, name: 'Kernon' },
  { level: 75, name: 'Last Lesser Giant Olkuth' },
  { level: 75, name: 'Palatanos of Horrific Power' },
  { level: 75, name: 'Storm Winged Naga' },
  { level: 76, name: 'Flamestone Giant' },
  { level: 76, name: 'Ocean Flame Ashakiel' },
  { level: 78, name: 'Daimon the White-Eyed' },
  { level: 78, name: 'Fire of Wrath Shuriel' },
  { level: 78, name: 'Hestia, Guardian Deity of the Hot Springs' },
  { level: 78, name: 'Last Lesser Giant Glaki' },
  { level: 79, name: 'Cherub Galaxia' },
  { level: 79, name: 'Longhorn Golkonda' },
  { level: 80, name: "Ketra's Hero Hekaton" },
  { level: 80, name: 'Queen Shyeed' },
  { level: 80, name: "Varka's Hero Shadith" },
];

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byLevel = RAID_BOSSES.reduce((map, boss) => { if (!map.has(boss.level)) map.set(boss.level, []); map.get(boss.level).push(boss); return map; }, new Map());

function bossOptions() {
  return ['<option value="">Wybierz Raid Bossa</option>', ...[...byLevel.entries()].map(([level, bosses]) => `<optgroup label="Level ${level}">${bosses.map(b => `<option value="${esc(b.name)}" data-level="${level}">Lv. ${level} · ${esc(b.name)}</option>`).join('')}</optgroup>`)].join('');
}

function timeLeft(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'wygasło';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m} min`;
}

export function installNeededRaidBosses(supabase) {
  if (!supabase || window.__obNeededRbInstalled) return;
  window.__obNeededRbInstalled = true;

  const waitForZone = () => {
    const zone = document.querySelector('#memberZoneLayer');
    const side = zone?.querySelector('.member-zone-side');
    const main = zone?.querySelector('.member-zone-main');
    if (!zone || !side || !main) { setTimeout(waitForZone, 150); return; }

    if (!side.querySelector('[data-zone-view="needed-rb"]')) {
      const nav = document.createElement('button');
      nav.className = 'zone-nav';
      nav.dataset.zoneView = 'needed-rb';
      nav.innerHTML = '⚔ <span>Potrzebne RB</span>';
      const spacer = side.querySelector('.zone-side-spacer');
      side.insertBefore(nav, spacer || null);
    }

    if (!main.querySelector('[data-zone-panel="needed-rb"]')) {
      const panel = document.createElement('section');
      panel.className = 'zone-view';
      panel.dataset.zonePanel = 'needed-rb';
      panel.innerHTML = `
        <div class="zone-section-head"><small>WSPÓLNE CELE</small><h3>POTRZEBNE RAID BOSSY</h3><p>Zgłoś zwykłego RB 60+, którego chcesz zabić. Wybierz datę i godzinę rozpoczęcia. Okno RB trwa 30 minut i jest widoczne w kalendarzu pod filtrem RB.</p></div>
        <div class="needed-rb-layout">
          <form id="neededRbForm" class="zone-card needed-rb-form">
            <label>Raid Boss<select id="neededRbBoss" required>${bossOptions()}</select></label>
            <label class="needed-rb-window-field">Data i godzina rozpoczęcia RB<input id="neededRbWindowStart" name="window_start" type="datetime-local" required><small>Koniec okna: 30 minut po rozpoczęciu. Czas polski.</small></label>
            <label>Po co / uwagi<textarea id="neededRbNote" maxlength="180" placeholder="np. quest, drop, potrzebuję kill do questa"></textarea></label>
            <button class="needed-rb-primary" type="submit">+ DODAJ RB</button>
            <p id="neededRbMessage" class="zone-muted"></p>
          </form>
          <div id="neededRbList" class="needed-rb-list"><p class="zone-muted">Ładowanie zgłoszeń…</p></div>
        </div>`;
      main.appendChild(panel);
    }

    const style = document.createElement('style');
    style.textContent = `
      .needed-rb-layout{display:grid;grid-template-columns:340px 1fr;gap:16px}.needed-rb-form{align-self:start;display:grid;gap:12px}.needed-rb-form label{display:grid;gap:7px;color:#c5a565;font-size:10px;font-weight:900;letter-spacing:.04em}.needed-rb-form input,.needed-rb-form select,.needed-rb-form input{min-width:0;color-scheme:dark}.needed-rb-window-field small{color:#a69b85;font-weight:400;line-height:1.5}.needed-rb-form textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #4a3b26;background:#080c0c;color:#ddd}.needed-rb-form textarea{min-height:92px;resize:vertical}.needed-rb-primary{padding:13px;border:1px solid #a27631;background:linear-gradient(#3a2811,#21160b);color:#efc56a;font-weight:900;cursor:pointer}.needed-rb-list{display:grid;gap:10px}.needed-rb-card{border:1px solid #3a3123;background:#0a0e0e;padding:14px}.needed-rb-head{display:flex;gap:12px;align-items:flex-start}.needed-rb-level{display:grid;place-items:center;min-width:58px;height:52px;border:1px solid #8b642c;background:#2b1d0d;color:#efc56a;font-weight:900}.needed-rb-copy{min-width:0;flex:1}.needed-rb-copy b{display:block;color:#eee5d6;font-size:14px}.needed-rb-copy small{display:block;color:#817c72;margin-top:4px}.needed-rb-note{margin:10px 0;color:#b7b0a3;font-size:11px}.needed-rb-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.needed-rb-help,.needed-rb-delete,.needed-rb-close{padding:8px 10px;border:1px solid #65502b;background:#13110c;color:#d8ad59;font-size:10px;font-weight:900;cursor:pointer}.needed-rb-help{border-color:#496044;background:#10190f;color:#b8d290}.needed-rb-help.active,.needed-rb-help:hover{border-color:#6d8c62;background:#172217;color:#d3e8b3}.needed-rb-delete{border-color:#60342c;color:#d98574}.needed-rb-helpers{color:#827d74;font-size:10px}.needed-rb-helper-names{margin-top:8px;color:#9b9488;font-size:10px}.needed-rb-empty{padding:28px;border:1px dashed #584526;color:#927d58;text-align:center}.needed-rb-expire{margin-left:auto;color:#9a8b70;font-size:9px;white-space:nowrap}@media(max-width:900px){.needed-rb-layout{grid-template-columns:1fr}.needed-rb-head{flex-wrap:wrap}.needed-rb-expire{margin-left:0;width:100%}}
    `;
    document.head.appendChild(style);

    let currentUser = null;
    let currentProfile = null;
    let requests = [];
    let helpers = [];

    const setView = () => {
      zone.querySelectorAll('.zone-nav').forEach(b => b.classList.toggle('active', b.dataset.zoneView === 'needed-rb'));
      zone.querySelectorAll('.zone-view').forEach(p => p.classList.toggle('active', p.dataset.zonePanel === 'needed-rb'));
      main.scrollTop = 0;
    };

    async function getContext() {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user || null;
      if (!currentUser) return false;
      const { data } = await supabase.from('profiles').select('nickname,role,status').eq('id', currentUser.id).maybeSingle();
      currentProfile = data || null;
      return currentProfile?.status === 'approved';
    }

    async function load() {
      if (!await getContext()) return;
      const now = new Date().toISOString();
      const [r, h] = await Promise.all([
        supabase.from('raid_boss_requests').select('*').eq('status', 'open').gt('expires_at', now).order('created_at', { ascending: false }),
        supabase.from('raid_boss_helpers').select('*').order('created_at', { ascending: true }),
      ]);
      requests = r.data || [];
      helpers = h.data || [];
      render();
    }

    function render() {
      const box = main.querySelector('#neededRbList');
      if (!box) return;
      if (!requests.length) { box.innerHTML = '<div class="needed-rb-empty">Brak aktywnych zgłoszeń RB. Dodaj pierwszy cel.</div>'; return; }
      const role = String(currentProfile?.role || '').toLowerCase();
      const moderator = ['owner', 'admin', 'leader'].includes(role);
      box.innerHTML = requests.map(r => {
        const list = helpers.filter(h => String(h.request_id) === String(r.id));
        const mine = list.some(h => h.user_id === currentUser?.id);
        const canDelete = r.user_id === currentUser?.id || moderator;
        return `<article class="needed-rb-card" data-rb-request="${r.id}">
          <div class="needed-rb-head"><div class="needed-rb-level">Lv. ${r.boss_level}</div><div class="needed-rb-copy"><b>${esc(r.boss_name)}</b><small>Zgłosił: ${esc(r.nickname)}</small></div><span class="needed-rb-expire">Wygasa za ${timeLeft(r.expires_at)}</span></div>
          ${r.note ? `<p class="needed-rb-note">${esc(r.note)}</p>` : ''}
          <div class="needed-rb-actions"><button class="needed-rb-help ${mine ? 'active' : ''}" type="button" data-rb-help="${r.id}">${mine ? '✓ POMAGAM' : '+ POMOGĘ'}</button><span class="needed-rb-helpers">Chętni: <b>${list.length}</b></span>${canDelete ? `<button class="needed-rb-delete" type="button" data-rb-delete="${r.id}">Usuń</button>` : ''}</div>
          ${list.length ? `<div class="needed-rb-helper-names">${list.map(h => esc(h.nickname)).join(' · ')}</div>` : ''}
        </article>`;
      }).join('');
    }

    async function addRequest(event) {
      event.preventDefault();
      if (!await getContext()) return;
      const select = main.querySelector('#neededRbBoss');
      const option = select.selectedOptions[0];
      const message = main.querySelector('#neededRbMessage');
      if (!select.value || !option?.dataset.level) { message.textContent = 'Wybierz Raid Bossa.'; return; }
      const windowInput = main.querySelector('#neededRbWindowStart');
      const windowStart = warsawLocalToIso(windowInput?.value);
      if (!windowStart || new Date(windowStart).getTime() < Date.now() - 30 * 60000) {
        message.textContent = 'Wybierz aktualną lub przyszłą datę i godzinę RB.';
        windowInput?.focus();
        return;
      }
      message.textContent = 'Dodawanie…';
      const payload = { window_start: windowStart, user_id: currentUser.id, nickname: currentProfile.nickname || 'Gracz', boss_name: select.value, boss_level: Number(option.dataset.level), note: main.querySelector('#neededRbNote').value.trim() || null };
      const { error } = await supabase.from('raid_boss_requests').insert(payload);
      if (error) { message.textContent = `Błąd: ${error.message}`; return; }
      main.querySelector('#neededRbForm').reset();
      message.textContent = 'RB dodany z wybraną datą i godziną. Okno trwa 30 minut.';
      window.dispatchEvent(new Event('ob:needed-rb-changed'));
      await load();
    }

    async function toggleHelp(id) {
      if (!await getContext()) return;
      const existing = helpers.find(h => String(h.request_id) === String(id) && h.user_id === currentUser.id);
      if (existing) await supabase.from('raid_boss_helpers').delete().eq('id', existing.id);
      else await supabase.from('raid_boss_helpers').insert({ request_id: Number(id), user_id: currentUser.id, nickname: currentProfile.nickname || 'Gracz' });
      await load();
    }

    async function removeRequest(id) {
      if (!window.confirm('Usunąć to zgłoszenie RB?')) return;
      const { error } = await supabase.from('raid_boss_requests').delete().eq('id', Number(id));
      if (!error) await load();
    }

    side.querySelector('[data-zone-view="needed-rb"]').addEventListener('click', async () => { setView(); await load(); });
    main.querySelector('#neededRbForm').addEventListener('submit', addRequest);
    main.querySelector('[data-zone-panel="needed-rb"]').addEventListener('click', async event => {
      const help = event.target.closest('[data-rb-help]');
      if (help) { await toggleHelp(help.dataset.rbHelp); return; }
      const del = event.target.closest('[data-rb-delete]');
      if (del) await removeRequest(del.dataset.rbDelete);
    });

    supabase.auth.onAuthStateChange(() => setTimeout(load, 0));
  };

  waitForZone();
}

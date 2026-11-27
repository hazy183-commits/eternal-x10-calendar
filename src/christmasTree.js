import { isChristmasSeason } from '../lib/christmasSeason.js';
import { featureEnabled, PREVIEW_ORIGIN } from './siteFeatures.js';
import './christmasTree.css';

const FEATURE = 'christmas-tree';
const SETTING = 'feature:' + FEATURE;
const yearInWarsaw = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Warsaw', year: 'numeric' });
const colors = ['ruby', 'gold', 'pine', 'blue'];
const positions = [[49,29],[42,36],[57,38],[33,46],[48,46],[64,47],[38,54],[54,55],[69,57],[27,63],[46,64],[60,65],[75,67],[31,74],[51,74],[66,75],[21,79],[41,82],[60,82],[78,82]];
const demoOrnaments = [
  { user_id: 'demo-1', nickname: 'Przykładowy Orzeł', message: 'Wesołych Świąt! Oby w nowym roku zawsze starczyło czasu na wspólny rajd.', color: 'ruby' },
  { user_id: 'demo-2', nickname: 'Klanowa Kronika', message: 'Najlepsze wspomnienia to te, które zrobiliśmy razem w Hunter Village.', color: 'gold' },
];

function mountTree(host, client, profile, demo) {
  const year = Number(yearInWarsaw.format(new Date()));
  const section = document.createElement('section');
  section.className = 'clan-christmas-tree';
  section.innerHTML = '<div class="clan-tree-scene"><img src="/images/holiday/clan-christmas-tree.png" alt="Choinka z lampkami" width="512" height="768"><div data-tree-ornaments></div></div><div class="clan-tree-content"><h3>Choinka Orłów</h3><p>Dodaj jedną bombkę z życzeniami albo wspomnieniem z gry. Kliknij bombkę lub nick, żeby przeczytać wpis.</p><p class="clan-tree-demo" hidden>Podgląd testowy. Wpisy tutaj znikają po odświeżeniu.</p><div data-tree-message aria-live="polite" hidden><strong></strong><p></p><button type="button" data-tree-remove hidden>Usuń wpis</button></div><div class="clan-tree-names" data-tree-names></div><form><label>Twój wpis<textarea name="message" maxlength="240" required rows="3" placeholder="Wesołych Świąt, Orły!"></textarea></label><label>Kolor bombki<select name="color"><option value="ruby">Czerwona</option><option value="gold">Złota</option><option value="pine">Zielona</option><option value="blue">Niebieska</option></select></label><button type="submit">Zawieś bombkę</button></form><p data-tree-status role="status"></p></div>';
  if (demo) section.querySelector('.clan-tree-demo').hidden = false;
  if (demo) host.querySelector('.hero')?.after(section);
  else host.prepend(section);
  if (!section.isConnected) host.prepend(section);

  const form = section.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const status = section.querySelector('[data-tree-status]');
  const detail = section.querySelector('[data-tree-message]');
  const remove = section.querySelector('[data-tree-remove]');
  let rows = demo ? [...demoOrnaments] : [];
  let selected = null;
  let busy = false;
  const own = () => rows.find(row => row.user_id === profile.id);
  const setBusy = (value) => { busy = value; submit.disabled = value; remove.disabled = value; };

  function select(row) {
    selected = row;
    detail.hidden = !row;
    if (!row) return;
    detail.querySelector('strong').textContent = row.nickname;
    detail.querySelector('p').textContent = row.message;
    remove.hidden = row.user_id !== profile.id && (demo || profile.role !== 'owner');
  }

  function render() {
    const ornaments = section.querySelector('[data-tree-ornaments]');
    const names = section.querySelector('[data-tree-names]');
    ornaments.replaceChildren();
    names.replaceChildren();
    for (const [index, row] of rows.entries()) {
      const label = document.createElement('button');
      label.type = 'button';
      label.textContent = row.nickname;
      label.addEventListener('click', () => select(row));
      names.append(label);
      if (index >= positions.length) continue;
      const bauble = document.createElement('button');
      bauble.type = 'button';
      bauble.className = 'clan-bauble ' + (colors.includes(row.color) ? row.color : 'gold');
      bauble.style.left = positions[index][0] + '%';
      bauble.style.top = positions[index][1] + '%';
      bauble.setAttribute('aria-label', 'Bombka: ' + row.nickname);
      bauble.addEventListener('click', () => select(row));
      ornaments.append(bauble);
    }
    const current = own();
    submit.textContent = current ? 'Zapisz swoją bombkę' : 'Zawieś bombkę';
    form.elements.message.value = current?.message ?? '';
    form.elements.color.value = current?.color ?? 'ruby';
    select(rows.find(row => row.user_id === selected?.user_id) ?? null);
  }

  async function fetchRows() {
    const { data, error } = await client.from('christmas_ornaments')
      .select('user_id,nickname,message,color')
      .eq('season_year', year).order('created_at').order('user_id');
    if (error) throw error;
    rows = data ?? [];
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const message = form.elements.message.value.trim();
    const color = form.elements.color.value;
    if (!message || Array.from(message).length > 240 || !colors.includes(color)) {
      status.textContent = 'Wpisz życzenia lub wspomnienie (maksymalnie 240 znaków).';
      return;
    }
    const payload = { nickname: profile.nickname, message, color };
    const current = own();
    setBusy(true);
    try {
      if (demo) {
        rows = rows.filter(row => row.user_id !== profile.id);
        rows.push({ ...payload, user_id: profile.id });
      } else {
        const table = client.from('christmas_ornaments');
        const write = current
          ? table.update(payload).eq('season_year', year).eq('user_id', profile.id)
          : table.insert({ ...payload, season_year: year, user_id: profile.id });
        const { error } = await write.select('user_id').single();
        if (error?.code === '23505') {
          await fetchRows();
          render();
          status.textContent = 'Masz już bombkę. Możesz edytować zapisany wpis.';
          return;
        }
        if (error) throw error;
        await fetchRows();
      }
      selected = own();
      render();
      status.textContent = 'Bombka jest na choince.';
    } catch {
      status.textContent = 'Nie udało się zapisać bombki. Odśwież widok i spróbuj ponownie.';
    } finally {
      setBusy(false);
    }
  });

  remove.addEventListener('click', async () => {
    if (!selected || busy || !window.confirm('Usunąć tę bombkę z choinki?')) return;
    const { user_id } = selected;
    setBusy(true);
    try {
      if (demo) rows = rows.filter(row => row.user_id !== user_id);
      else {
        const { error } = await client.from('christmas_ornaments')
          .delete().eq('season_year', year).eq('user_id', user_id).select('user_id').single();
        if (error) throw error;
        await fetchRows();
      }
      selected = null;
      render();
      status.textContent = 'Bombka została zdjęta.';
    } catch {
      status.textContent = 'Nie udało się zdjąć bombki.';
    } finally {
      setBusy(false);
    }
  });
  if (demo) render();
  else {
    setBusy(true);
    void fetchRows().then(() => { render(); setBusy(false); })
      .catch(() => { status.textContent = 'Nie udało się odczytać choinki. Otwórz ponownie Strefę klanu.'; });
  }
  return section;
}

export function installChristmasTree(client) {
  const demo = window.location.origin === PREVIEW_ORIGIN &&
    new URLSearchParams(window.location.search).get('feature') === FEATURE;
  if (demo) {
    const main = document.querySelector('#top');
    if (main) mountTree(main, null, { id: 'demo-owner', nickname: 'Twoja bombka', role: 'owner' }, true);
    return;
  }
  if (!client) return;
  let settings = {};
  let section = null;
  let zone = null;
  let currentHost = null;
  let revision = 0;
  let loading = false;

  function reset() {
    revision++;
    loading = false;
    section?.remove();
    section = null;
    currentHost = null;
  }

  async function sync() {
    const visible = zone?.classList.contains('open');
    const host = zone?.querySelector('[data-zone-panel="home"].active');
    if (!isChristmasSeason() || !featureEnabled(FEATURE, settings) || !visible || !host) {
      if (loading || section) reset();
      return;
    }
    if (currentHost !== host) { reset(); currentHost = host; }
    if (loading || section?.isConnected) return;
    loading = true;
    const request = ++revision;
    try {
      const { data: auth } = await client.auth.getUser();
      if (request !== revision || !auth?.user) return;
      const { data: profile } = await client.from('profiles').select('id,nickname,status,role,removed_at')
        .eq('id', auth.user.id).maybeSingle();
      if (request !== revision || profile?.status !== 'approved' || profile.removed_at || !profile.nickname) return;
      section = mountTree(host, client, profile, false);
    } finally {
      if (request === revision) loading = false;
    }
  }

  const refresh = () => void sync().catch(() => {});
  const zoneObserver = new MutationObserver(refresh);
  function attach() {
    const next = document.querySelector('#memberZoneLayer');
    if (next !== zone) {
      zoneObserver.disconnect();
      reset();
      zone = next;
      if (zone) zoneObserver.observe(zone, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    refresh();
  }
  new MutationObserver(() => { if (!zone?.isConnected) attach(); }).observe(document.body, { childList:true, subtree:true });
  window.addEventListener('orzel:site-settings-applied', event => { settings = event.detail; refresh(); });
  window.addEventListener('orzel:feature-changed', event => {
    if (event.detail.key !== SETTING) return;
    settings = { ...settings, [SETTING]: event.detail.value };
    refresh();
  });
  client.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') { reset(); setTimeout(refresh, 0); }
  });
  document.addEventListener('visibilitychange', refresh);
  setInterval(refresh, 60_000);
  attach();
}

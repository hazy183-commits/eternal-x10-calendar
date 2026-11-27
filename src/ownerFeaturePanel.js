import { PREVIEW_ORIGIN, FEATURE_SETTING_PREFIX, SITE_FEATURES, featureEnabled } from './siteFeatures.js';
import './ownerFeaturePanel.css';

export function hideFeaturePanel(root) {
  root.querySelector('[data-owner-features]')?.remove();
}

export function showFeaturePanel(client, root, profile) {
  if (profile?.role !== 'owner' || profile.status !== 'approved' || profile.removed_at) return;
  if (root.querySelector('[data-owner-features]')) return;
  const panel = document.createElement('section');
  panel.dataset.ownerFeatures = '';
  panel.className = 'owner-features';
  panel.innerHTML = '<h4>Nowości i podgląd</h4><p>Sprawdź każdą zmianę osobno. Przycisk przy zmianie zapisuje tylko jej stan.</p><div data-feature-list></div><p role="status" data-feature-status></p>';
  root.querySelector('[data-owner-preview-shortcut]')?.after(panel);
  if (!panel.isConnected) return;
  const list = panel.querySelector('[data-feature-list]');
  const status = panel.querySelector('[data-feature-status]');
  status.textContent = 'Pobieranie ustawień…';
  const keys = SITE_FEATURES.map(feature => FEATURE_SETTING_PREFIX + feature.id);
  void (async () => {
    const { data, error } = await client.from('site_settings').select('key,value').in('key', keys);
    if (!panel.isConnected) return;
    if (error) { status.textContent = 'Nie udało się pobrać ustawień. Otwórz panel ponownie.'; return; }
    status.textContent = '';
    const settings = Object.fromEntries((data ?? []).map(row => [row.key, row.value]));
    for (const feature of SITE_FEATURES) {
      const row = document.createElement('article');
      row.innerHTML = '<div><strong></strong><p></p><small></small></div><a target="_blank" rel="noopener noreferrer">Sprawdź w wersji testowej ↗</a><button type="button"></button>';
      row.querySelector('strong').textContent = feature.title;
      row.querySelector('p').textContent = feature.description;
      const link = row.querySelector('a');
      link.href = PREVIEW_ORIGIN + '/?feature=' + encodeURIComponent(feature.id);
      const button = row.querySelector('button');
      const state = row.querySelector('small');
      const sync = () => {
        const enabled = featureEnabled(feature.id, settings);
        state.textContent = enabled ? 'Włączone na stronie' : 'Wyłączone na stronie';
        button.textContent = enabled ? 'Wyłącz' : 'Włącz';
      };
      sync();
      button.addEventListener('click', async () => {
        const key = FEATURE_SETTING_PREFIX + feature.id;
        const value = featureEnabled(feature.id, settings) ? 'off' : 'on';
        if (!window.confirm((value === 'on' ? 'Włączyć' : 'Wyłączyć') + ' dla wszystkich: ' + feature.title + '?')) return;
        button.disabled = true;
        try {
          const { error: saveError } = await client.from('site_settings')
            .upsert({ key, value, updated_by: profile.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select('key').single();
          if (saveError) throw saveError;
          settings[key] = value;
          sync();
          status.textContent = 'Zapisano: ' + feature.title + '.';
          window.dispatchEvent(new CustomEvent('orzel:feature-changed', { detail: { key, value } }));
        } catch {
          status.textContent = 'Nie udało się zapisać tej zmiany. Spróbuj ponownie.';
        } finally {
          button.disabled = false;
        }
      });
      list.append(row);
    }
  })().catch(() => { status.textContent = 'Nie udało się pobrać ustawień. Otwórz panel ponownie.'; });
}

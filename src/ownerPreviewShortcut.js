import { adminClanIcon } from './adminClanIcons.js';

export function updatePreviewShortcut(root, profile) {
  let link = root.querySelector('[data-owner-preview-shortcut]');
  const allowed = profile?.role === 'owner' && profile?.status === 'approved' && !profile?.removed_at;
  if (!allowed) { link?.remove(); return; }
  if (link) return;
  link = document.createElement('a');
  link.dataset.ownerPreviewShortcut = '';
  link.className = 'admin-home-card';
  link.style.marginBottom = '12px';
  link.style.textDecoration = 'none';
  link.href = 'https://orzel-bialy-git-preview-owner-releases-eternal-x10.vercel.app/';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.innerHTML = `<span class="admin-home-icon">${adminClanIcon('content')}</span><small>TYLKO DLA WŁAŚCICIELA</small><h4>Wersja testowa</h4><p>Sprawdź nowe zmiany przed publikacją. Otwiera się w nowej karcie.</p><em>OTWÓRZ →</em>`;
  root.querySelector('.admin-home-status').after(link);
}

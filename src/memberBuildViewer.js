import { avatarMarkup, hydrateAvatars } from './memberAvatars.js';
import { armors, jewels, jewelrySlots, resolveWeapon } from './loadoutEquipment.js';
import { BUFFS } from './buffCatalog.js';

const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = item => item ? `<img src="/assets/interlude/icons/${esc(item.icon)}" alt="" width="32" height="32">` : '<span class="member-gear-empty" aria-hidden="true">◇</span>';
const enchant = value => Number.isInteger(Number(value)) && Number(value) >= 0 ? ` +${Number(value)}` : '';
function gear(item, label, value) {
  return `<div class="member-gear-item">${icon(item)}<span><small>${esc(label)}</small><b>${esc(value || 'Nie podano')}</b></span></div>`;
}
export function loadoutPreview(loadout, index) {
  const e = loadout.equipment || {}, weapon = resolveWeapon(e), armor = armors.find(x => x.name === e.armor);
  const jewelry = e.jewelry ? jewelrySlots.map(([slot,label]) => {
    const saved = e.jewelry[slot], item = jewels.find(x => x.id === Number(saved?.itemId));
    return gear(item,label,item ? item.name + enchant(saved.enchant) : 'Brak');
  }).join('') : gear(null,'Biżuteria', (e.fullEpic ? 'Full Epic' : e.jewels || 'Nie podano') + (e.fullEpic || e.jewels ? enchant(e.jewelsEnchant) : ''));
  return `<details class="member-build-card" open><summary>${loadout.character_kind === 'main' ? 'Klasa główna' : 'Subclassa #' + (index + 1)} · ${esc(loadout.class_name)}</summary><div class="member-gear-grid">${gear(weapon,'Broń',e.weapon ? e.weapon + enchant(e.weaponEnchant) : '')}${gear(armor,'Armor',e.armor ? e.armor + enchant(e.armorEnchant) : '')}${jewelry}${gear(null,'Augmentacja',e.augmentation)}</div></details>`;
}
export function buffPreview(preset) {
  return `<article class="member-build-card"><h4>${esc(preset.title)}</h4><p class="member-build-meta">${esc(preset.class_name || 'Dowolna klasa')} · ${(preset.buffs || []).length} buffów</p><div class="member-build-symbols"><b>Symbole / Dyes</b><span>${esc(preset.symbols || 'Nie podano symboli')}</span></div><ol class="member-buff-list">${(preset.buffs || []).map(name => {
    const buff = BUFFS.find(x => x[0] === name);
    return `<li>${buff ? `<img src="/assets/interlude/buff-icons/skill${esc(buff[1])}.png" width="28" height="28" alt="">` : ''}<span>${esc(name)}</span></li>`;
  }).join('')}</ol></article>`;
}
export function memberBuildContent(profile, loadouts, presets) {
  return `<div class="member-build-overview"><span>Klasa główna: <b>${esc(profile.character_class || 'Nie podano')}</b></span><span>Poziom: <b>${esc(profile.character_level || '—')}</b></span><span>Rola w party: <b>${esc(profile.party_role || 'Nie podano')}</b></span></div><h3>Subclassy i wyposażenie <span>(${loadouts.length})</span></h3>${loadouts.length ? loadouts.map(loadoutPreview).join('') : `<p class="member-build-empty">Brak zapisanych zestawów wyposażenia.${profile.subclass ? ' Subclassa w profilu: ' + esc(profile.subclass) + '.' : ''}</p>`}<h3>Dostępne setupy buffów <span>(${presets.length})</span></h3>${presets.length ? presets.map(buffPreview).join('') : '<p class="member-build-empty">Brak setupów buffów udostępnionych do podglądu.</p>'}`;
}

export function openMemberBuildViewer(supabase, member, opener) {
  document.querySelector('.member-build-dialog')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = 'member-build-dialog';
  dialog.setAttribute('aria-label', 'Profil gracza ' + (member.nickname || 'Członek'));
  dialog.innerHTML = `<header><div class="member-profile-heading">${avatarMarkup(member)}<div><small>PROFIL KLANOWY</small><h2>${esc(member.nickname || 'Członek')}</h2><p>Podgląd subclass, wyposażenia i setupów buffów</p></div></div><button type="button" data-close-member aria-label="Zamknij profil gracza">✕</button></header><div class="member-build-content" aria-live="polite"></div>`;
  const body = dialog.querySelector('.member-build-content');
  let request = 0, closed = false;
  const load = async () => {
    const current = ++request;
    body.innerHTML = '<p class="member-build-empty">Ładowanie profilu…</p>';
    try {
      const [p, l, b] = await Promise.all([
        supabase.from('profiles').select('id,nickname,character_class,character_level,subclass,party_role,avatar_path').eq('id',member.id).eq('status','approved').is('removed_at',null).maybeSingle(),
        supabase.from('player_loadouts').select('id,class_name,character_kind,equipment,sort_order').eq('user_id',member.id).order('sort_order').order('created_at'),
        supabase.from('buff_presets').select('id,title,class_name,buffs,symbols').eq('user_id',member.id).order('updated_at',{ascending:false})
      ]);
      if (closed || current !== request) return;
      if (p.error || l.error || b.error) throw new Error('Nie udało się pobrać profilu.');
      if (!p.data) { body.innerHTML = '<p class="member-build-empty">Ten profil nie jest już dostępny w klanie.</p>'; return; }
      dialog.querySelector('h2').textContent = p.data.nickname || 'Członek';
      dialog.querySelector('.member-avatar').outerHTML=avatarMarkup(p.data);hydrateAvatars(supabase,dialog);
      body.innerHTML = memberBuildContent(p.data,l.data || [],b.data || []);
    } catch {
      if (!closed && current === request) body.innerHTML = '<p class="member-build-empty">Nie udało się pobrać profilu.</p><button type="button" data-retry-member>Spróbuj ponownie</button>';
    }
  };
  const close = () => dialog.close();
  const auth = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') close(); });
  const zone = document.querySelector('#memberZoneLayer');
  const observer = zone ? new MutationObserver(() => { if (!zone.classList.contains('open')) close(); }) : null;
  observer?.observe(zone,{attributes:true,attributeFilter:['class']});
  window.addEventListener('orzel:member-removed',close);
  dialog.addEventListener('close',() => {
    closed = true; ++request;
    auth?.data?.subscription?.unsubscribe(); observer?.disconnect();
    window.removeEventListener('orzel:member-removed',close);
    dialog.remove(); if(opener?.isConnected)opener.focus({preventScroll:true});
  },{once:true});
  dialog.addEventListener('click',event => {
    if(event.target.closest('[data-close-member]'))close();
    if(event.target.closest('[data-retry-member]'))load();
  });
  document.body.appendChild(dialog);dialog.showModal();load();
}

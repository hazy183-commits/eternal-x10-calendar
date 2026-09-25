import { confirmLocalized, translateText } from './i18nCore.js';
import './releaseManager.css';

let revision = 0;
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function hideReleases(root) {
  revision++;
  const box = root.querySelector('[data-owner-releases]');
  if (box) { box.hidden=true; box.replaceChildren(); }
}

export async function refreshReleases(client, root, isOwner) {
  hideReleases(root);
  if (!isOwner) return;
  const version = revision;
  let box = root.querySelector('[data-owner-releases]');
  if (!box) {
    box = document.createElement('section');
    box.dataset.ownerReleases='';
    box.className='owner-releases';
    root.querySelector('.admin-home-status').after(box);
  }
  box.hidden=false;
  const heading='<small>TYLKO DLA WŁAŚCICIELA</small><h4>Zmiany i publikacja</h4>';
  box.innerHTML=heading+'<p role="status">Ładowanie wersji…</p>';
  async function api(body) {
    const {data:{session}} = await client.auth.getSession();
    if (!session) throw new Error(translateText('Zaloguj się jako właściciel strony.'));
    const response = await fetch('/api/releases',{method:body?'POST':'GET',headers:{Authorization:`Bearer ${session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
    const contentType=response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error(translateText('Panel publikacji wymaga uruchomienia na hostingu.'));
    const data=await response.json();
    if (!response.ok) throw new Error(translateText(data.error || 'Nie udało się pobrać wersji.'));
    return data;
  }
  try {
    const data=await api();
    if (version!==revision) return;
    if (!data.configured) {
      box.innerHTML=heading+'<p>Panel jest przygotowany. Publikowanie wymaga jeszcze bezpiecznego połączenia z hostingiem.</p><p>Nowe zmiany pozostają w wersji testowej do czasu Twojej decyzji.</p>';
      return;
    }
    box.innerHTML=heading+'<p>Najpierw otwórz podgląd i sprawdź zmiany. Udostępnienie wersji zmieni stronę dla wszystkich.</p><p class="release-current">Wersja publiczna: <code data-no-i18n>'+escape(data.current)+'</code></p><div data-release-list></div><p role="status" aria-live="polite" data-release-status></p><button type="button" class="build-btn" data-release-refresh>Odśwież stan</button>';
    const list=box.querySelector('[data-release-list]');
    if (!data.releases.length) list.innerHTML='<p>Nie ma nowych wersji oczekujących na publikację.</p>';
    for (const release of data.releases) {
      const card=document.createElement('article');
      card.className='release-card';
      const rollback=release.action==='rollback';
      card.innerHTML='<div><small>'+(rollback?'POWRÓT DO POPRZEDNIEJ WERSJI':'GOTOWE DO TWOICH TESTÓW')+'</small><h5 data-no-i18n>'+escape(release.title)+'</h5><p data-no-i18n>'+escape(release.notes)+'</p></div><a class="build-btn" data-release-preview target="_blank" rel="noopener noreferrer">Otwórz prywatny podgląd ↗</a><label><input type="checkbox" data-release-tested> <span>Sprawdziłem tę wersję i chcę udostępnić ją wszystkim.</span></label><button type="button" class="build-btn" data-release-publish disabled>'+(rollback?'Przywróć tę wersję':'Udostępnij wszystkim')+'</button>';
      const url=new URL(release.url);
      if (url.protocol!=='https:' || !/^[a-zA-Z0-9-]+\.vercel\.app$/.test(url.hostname)) throw new Error('Nieprawidłowy adres podglądu.');
      card.querySelector('a').href=url.href;
      const checkbox=card.querySelector('input');
      const button=card.querySelector('[data-release-publish]');
      checkbox.addEventListener('change',()=>button.disabled=!checkbox.checked);
      button.addEventListener('click',async()=>{
        if (!checkbox.checked || version!==revision) return;
        if (!confirmLocalized(rollback?'Przywrócić wybraną wersję strony dla wszystkich?':'Udostępnić przetestowaną wersję strony wszystkim?')) return;
        box.querySelectorAll('button,input').forEach(el=>el.disabled=true);
        const status=box.querySelector('[data-release-status]');
        status.textContent=translateText('Wysyłanie zlecenia do hostingu…');
        try {
          const result = await api({id:release.id,action:release.action,expectedCurrent:data.current,tested:true});
          if (version!==revision) return;
          status.textContent=translateText(result.building?'Trwa budowanie wersji publicznej. Poczekaj około minuty, a następnie odśwież stan.':'Hosting przyjął zlecenie. Odśwież stan, aby potwierdzić aktywną wersję.');
        } catch(error) { if (version===revision) status.textContent=error.message; }
        finally { if (version===revision) box.querySelector('[data-release-refresh]').disabled=false; }
      });
      list.append(card);
    }
    box.querySelector('[data-release-refresh]').onclick=()=>refreshReleases(client,root,true);
  } catch(error) {
    if (version!==revision) return;
    box.innerHTML=heading+'<p role="status"></p><button type="button" class="build-btn">Spróbuj ponownie</button>';
    box.querySelector('p').textContent=error.message;
    box.querySelector('button').onclick=()=>refreshReleases(client,root,true);
  }
}

export function installPreviewNotice() {
  if (!location.hostname.endsWith('.vercel.app') || document.querySelector('[data-preview-notice]')) return;
  const notice=document.createElement('aside');
  notice.dataset.previewNotice='';
  notice.className='private-preview-notice';
  notice.innerHTML='<strong>Prywatna wersja testowa</strong><span>Zmiany wyglądu widzisz tylko tutaj. Edycja danych klanu może zmienić prawdziwe dane.</span><a href="https://orzelbialy.eu" target="_blank" rel="noopener">Otwórz wersję publiczną</a><form method="post" action="/__preview-logout"><button type="submit">Zamknij dostęp do podglądu</button></form>';
  document.body.prepend(notice);
}

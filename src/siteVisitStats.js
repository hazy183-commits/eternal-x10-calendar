export const VISIT_GAP_MS = 30 * 60 * 1000;
export function startsNewVisit(previous, now) {
  const last = Number(previous);
  return previous === null || !Number.isFinite(last) || last <= 0 || now < last || now-last >= VISIT_GAP_MS;
}
export function recordSiteVisit(client) {
  if (!client || !['orzelbialy.eu','www.orzelbialy.eu'].includes(location.hostname) || location.pathname !== '/') return;
  let sent = false;
  const record = async () => {
    if (sent || document.visibilityState !== 'visible') return;
    sent = true;
    document.removeEventListener('visibilitychange', record);
    const now = Date.now();
    let previous = null;
    try { previous = sessionStorage.getItem('ob-last-visit-at'); } catch { /* Count this opening as a visit if storage is unavailable. */ }
    try {
      const {error} = await client.rpc('record_site_view', {p_new_visit: startsNewVisit(previous,now)});
      if (!error) try { sessionStorage.setItem('ob-last-visit-at',String(now)); } catch {}
    } catch { /* Statistics must never interrupt the website. */ }
  };
  document.addEventListener('visibilitychange',record);
  record();
}
let revision = 0;
export function hideVisitStats(root) {
  revision++;
  const box=root.querySelector('[data-owner-visits]');
  if (box) {box.hidden=true;box.innerHTML='';}
}
export async function refreshVisitStats(client,root,isOwner) {
  hideVisitStats(root);
  if(!isOwner)return;
  const version=revision;
  let box=root.querySelector('[data-owner-visits]');
  if(!box){box=document.createElement('section');box.dataset.ownerVisits='';box.className='owner-visit-stats';root.querySelector('.admin-home-status').after(box);}
  box.hidden=false;
  box.innerHTML='<h4>Odwiedziny strony · tylko dla Ciebie</h4><p>Ładowanie statystyk…</p>';
  try {
    const {data,error}=await client.rpc('get_site_visit_stats');
    if(version!==revision)return;
    if(error||!data)throw error||new Error('No statistics');
    const number=value=>Number.isFinite(Number(value))?Number(value).toLocaleString('pl-PL'):'—';
    box.innerHTML='<h4>Odwiedziny strony · tylko dla Ciebie</h4><div class="owner-visits-grid">'+[['Dzisiaj','today'],['Ostatnie 7 dni','week'],['Od uruchomienia','total']].map(([label,key])=>'<div><small>'+label+'</small><b>'+number(data[key+'_visits'])+' wizyt</b><span>'+number(data[key+'_pageviews'])+' odsłon</span></div>').join('')+'</div><p>Anonimowy licznik od wdrożenia. Odsłona = otwarcie lub odświeżenie strony. Nowa wizyta = nowa karta albo powrót po 30 minutach bez odsłony. To orientacyjny ruch, nie liczba osób. Bez zapisu nicków i adresów IP.</p><button type="button" class="build-btn" data-refresh-visits>Odśwież licznik</button>';
    box.querySelector('[data-refresh-visits]').onclick=()=>refreshVisitStats(client,root,true);
  } catch {
    if(version===revision)box.innerHTML='<h4>Odwiedziny strony</h4><p>Nie udało się pobrać statystyk. Otwórz ponownie panel Start.</p>';
  }
}

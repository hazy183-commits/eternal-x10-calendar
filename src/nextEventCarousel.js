import { applyBossArtwork } from './bossArtwork.js';

export function installNextEventCarousel() {
  if (typeof document === 'undefined') return;
  const card = document.querySelector('#nextEventCard');
  if (!card || document.querySelector('#nextEventCarouselControls')) return;

  let index = 0;
  let first = null;
  let selected = null;
  const controls = document.createElement('div');
  controls.id = 'nextEventCarouselControls';
  controls.className = 'next-event-carousel-controls';
  controls.innerHTML = `<button type="button" class="next-event-arrow" data-prev aria-label="Poprzednie wydarzenie">‹</button><div class="next-event-dots"></div><span class="next-event-position" aria-live="polite">1/3</span><button type="button" class="next-event-arrow" data-next aria-label="Następne wydarzenie">›</button>`;
  card.appendChild(controls);

  const style = document.createElement('style');
  style.id = 'next-event-carousel-style';
  style.textContent = `.next-event-card{position:relative}.next-event-carousel-controls{position:absolute;right:18px;bottom:14px;z-index:20;display:flex;align-items:center;gap:8px;padding:5px 7px;border:1px solid #8d6a2f;background:#070b0cf2;box-shadow:0 5px 18px #000a}.next-event-arrow{width:34px;height:34px;border:1px solid #8d6a2f;background:#111617;color:#e3b85f;font:700 25px/1 Georgia,serif;cursor:pointer}.next-event-arrow:hover,.next-event-arrow:focus{outline:none;border-color:#e3b85f;background:#2a2012}.next-event-dots{display:flex;gap:7px}.next-event-dot{width:9px;height:9px;padding:0;border:1px solid #a47d37;background:#191b18;transform:rotate(45deg);cursor:pointer}.next-event-dot.active{background:#e3b85f;box-shadow:0 0 8px #e3b85f88}.next-event-position{min-width:28px;color:#aaa294;font:700 9px Inter,Arial,sans-serif;text-align:center}.next-event-card.carousel-changing .next-event-content,.next-event-card.carousel-changing .event-art-large,.next-event-card.carousel-changing .countdown-block{opacity:.35}.next-event-content,.event-art-large,.countdown-block{transition:opacity .12s ease}@media(max-width:700px){.next-event-carousel-controls{right:9px;bottom:9px}.next-event-arrow{width:40px;height:40px}}`;
  document.head.appendChild(style);

  const rows = () => [...document.querySelectorAll('#upcomingEvents .mini-event')].slice(0, 3);
  const capture = () => {
    if (!first && document.querySelector('#nextName')?.textContent && !document.querySelector('#nextName')?.textContent.includes('BRAK')) {
      first = {
        name: document.querySelector('#nextName').textContent,
        type: document.querySelector('#nextType').textContent,
        typeClass: document.querySelector('#nextType').className,
        meta: document.querySelector('#nextMeta').textContent,
        description: document.querySelector('#nextDescription').textContent,
        art: document.querySelector('#nextName').textContent,
      };
    }
  };
  const drawDots = (total) => {
    controls.querySelector('.next-event-dots').innerHTML = Array.from({ length: total }, (_, i) => `<button type="button" class="next-event-dot ${i === index ? 'active' : ''}" data-index="${i}" aria-label="Pokaż wydarzenie ${i + 1}"></button>`).join('');
    controls.querySelector('.next-event-position').textContent = total ? `${index + 1}/${total}` : '0/0';
  };
  const parseRow = (row) => {
    const name = row.querySelector('b')?.textContent?.trim() || 'Wydarzenie';
    const detail = row.querySelector('span')?.textContent?.trim() || '';
    const when = row.querySelector('time')?.textContent?.trim() || '';
    const parts = detail.split(' · ');
    const type = parts.shift() || 'Event';
    return { name, type, location: parts.join(' · '), when, art: row.dataset.bossName || name };
  };
  const paint = () => {
    const list = rows();
    if (!list.length) return;
    capture();
    if (index === 0 && first) selected = { ...first };
    else selected = parseRow(list[index]);
    const s = selected;
    document.querySelector('#nextName').textContent = s.name;
    document.querySelector('#nextType').textContent = s.type;
    document.querySelector('#nextType').className = s.typeClass || `type-chip ${s.type.toLowerCase().replaceAll(' ', '-')}`;
    document.querySelector('#nextMeta').textContent = s.meta || `${s.when}${s.location ? ` · ${s.location}` : ''}`;
    document.querySelector('#nextDescription').textContent = s.description || 'Jedno z 3 najbliższych wydarzeń w kalendarzu klanu.';
    document.querySelector('#nextStatus').textContent = index === 0 ? document.querySelector('#nextStatus').textContent : 'NADCHODZI';
    if (index !== 0) document.querySelector('#nextStatus').className = 'live-status nadchodzi';
    applyBossArtwork(document.querySelector('.event-art-large'), s.art || s.name);
    drawDots(list.length);
  };
  const show = (i) => {
    const list = rows();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    card.classList.add('carousel-changing');
    window.setTimeout(() => { paint(); card.classList.remove('carousel-changing'); }, 70);
  };
  controls.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-index]');
    if (dot) return show(Number(dot.dataset.index));
    if (e.target.closest('[data-prev]')) show(index - 1);
    if (e.target.closest('[data-next]')) show(index + 1);
  });

  // main.js refreshes the first event every second. Re-apply the selected slide immediately after each refresh.
  const nextName = document.querySelector('#nextName');
  if (nextName) new MutationObserver(() => {
    if (index === 0 || !selected) return;
    queueMicrotask(() => {
      if (document.querySelector('#nextName')?.textContent !== selected.name) paint();
    });
  }).observe(nextName, { childList: true, characterData: true, subtree: true });

  const upcoming = document.querySelector('#upcomingEvents');
  if (upcoming) new MutationObserver(() => {
    const list = rows();
    if (index >= list.length) index = 0;
    drawDots(list.length);
    if (index > 0) queueMicrotask(paint);
  }).observe(upcoming, { childList: true, subtree: true });

  window.setTimeout(() => { capture(); drawDots(rows().length); }, 350);
}

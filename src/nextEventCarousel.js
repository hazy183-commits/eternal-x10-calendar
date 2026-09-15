export function installNextEventCarousel({ getEvents, onChange }) {
  if (typeof document === 'undefined') return { current: () => 0, clamp: () => {} };
  const card = document.querySelector('#nextEventCard');
  if (!card || document.querySelector('#nextEventCarouselControls')) return { current: () => 0, clamp: () => {} };

  let index = 0;
  const controls = document.createElement('div');
  controls.id = 'nextEventCarouselControls';
  controls.className = 'next-event-carousel-controls';
  controls.innerHTML = `<button type="button" class="next-event-arrow" data-next-event-prev aria-label="Poprzednie wydarzenie">‹</button><div class="next-event-dots" aria-label="Najbliższe wydarzenia"></div><span class="next-event-position" aria-live="polite"></span><button type="button" class="next-event-arrow" data-next-event-next aria-label="Następne wydarzenie">›</button>`;
  card.appendChild(controls);

  const style = document.createElement('style');
  style.id = 'next-event-carousel-style';
  style.textContent = `
.next-event-carousel-controls{position:absolute;right:20px;bottom:16px;z-index:8;display:flex;align-items:center;gap:9px;padding:5px 7px;border:1px solid rgba(205,159,70,.36);background:#070b0ce8;box-shadow:0 5px 18px #0008}.next-event-arrow{width:34px;height:34px;border:1px solid rgba(205,159,70,.55);background:#111617;color:#e2b75f;font:700 25px/1 Georgia,serif;cursor:pointer;transition:.18s ease}.next-event-arrow:hover,.next-event-arrow:focus{outline:none;border-color:#e5bd69;background:#2b2113;color:#ffe0a0}.next-event-arrow:disabled{opacity:.28;cursor:default}.next-event-dots{display:flex;gap:6px;align-items:center}.next-event-dot{width:8px;height:8px;padding:0;border:1px solid #a47d37;background:#1b1c19;transform:rotate(45deg);cursor:pointer}.next-event-dot.active{background:#e2b75f;box-shadow:0 0 8px #e2b75f88}.next-event-position{min-width:28px;color:#8f887a;font:700 9px Inter,Arial,sans-serif;letter-spacing:.08em;text-align:center}.next-event-card{position:relative}.next-event-card.carousel-changing .next-event-content,.next-event-card.carousel-changing .event-art-large,.next-event-card.carousel-changing .countdown-block{opacity:.42}.next-event-content,.event-art-large,.countdown-block{transition:opacity .13s ease}
@media(max-width:700px){.next-event-carousel-controls{right:10px;bottom:10px}.next-event-arrow{width:40px;height:40px}.next-event-position{font-size:9px}}
`;
  document.head.appendChild(style);

  const dots = controls.querySelector('.next-event-dots');
  const position = controls.querySelector('.next-event-position');
  const prev = controls.querySelector('[data-next-event-prev]');
  const next = controls.querySelector('[data-next-event-next]');

  function list() { return (getEvents?.() || []).slice(0, 3); }
  function sync() {
    const items = list();
    index = Math.max(0, Math.min(index, Math.max(0, items.length - 1)));
    dots.innerHTML = items.map((_, i) => `<button type="button" class="next-event-dot ${i === index ? 'active' : ''}" data-next-event-index="${i}" aria-label="Pokaż wydarzenie ${i + 1}"></button>`).join('');
    position.textContent = items.length ? `${index + 1}/${items.length}` : '0/0';
    prev.disabled = items.length < 2;
    next.disabled = items.length < 2;
  }
  function select(nextIndex) {
    const items = list();
    if (!items.length) { index = 0; sync(); onChange?.(); return; }
    index = (nextIndex + items.length) % items.length;
    card.classList.add('carousel-changing');
    window.setTimeout(() => { sync(); onChange?.(); card.classList.remove('carousel-changing'); }, 90);
  }
  prev.addEventListener('click', () => select(index - 1));
  next.addEventListener('click', () => select(index + 1));
  dots.addEventListener('click', (event) => {
    const button = event.target.closest('[data-next-event-index]');
    if (button) select(Number(button.dataset.nextEventIndex));
  });
  sync();
  return { current: () => index, clamp: sync, select };
}

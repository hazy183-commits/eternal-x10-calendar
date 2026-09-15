import { applyBossArtwork } from './bossArtwork.js';

export function installNextEventCarousel() {
  if (typeof document === 'undefined') return;
  const card = document.querySelector('#nextEventCard');
  if (!card || document.querySelector('#nextEventCarouselControls')) return;

  let index = 0;
  let selected = null;
  const controls = document.createElement('div');
  controls.id = 'nextEventCarouselControls';
  controls.className = 'next-event-carousel-controls';
  controls.innerHTML = `<button type="button" class="next-event-arrow" data-prev aria-label="Poprzednie wydarzenie">‹</button><div class="next-event-dots"></div><span class="next-event-position" aria-live="polite"></span><button type="button" class="next-event-arrow" data-next aria-label="Następne wydarzenie">›</button>`;
  card.appendChild(controls);

  const style = document.createElement('style');
  style.id = 'next-event-carousel-style';
  style.textContent = `.next-event-card{position:relative}.next-event-carousel-controls{position:absolute;right:18px;bottom:14px;z-index:20;display:flex;align-items:center;gap:8px;padding:5px 7px;border:1px solid #8d6a2f;background:#070b0cf2;box-shadow:0 5px 18px #000a}.next-event-arrow{width:34px;height:34px;border:1px solid #8d6a2f;background:#111617;color:#e3b85f;font:700 25px/1 Georgia,serif;cursor:pointer}.next-event-arrow:hover,.next-event-arrow:focus{outline:none;border-color:#e3b85f;background:#2a2012}.next-event-dots{display:flex;gap:7px}.next-event-dot{width:9px;height:9px;padding:0;border:1px solid #a47d37;background:#191b18;transform:rotate(45deg);cursor:pointer}.next-event-dot.active{background:#e3b85f;box-shadow:0 0 8px #e3b85f88}.next-event-position{min-width:28px;color:#aaa294;font:700 9px Inter,Arial,sans-serif;text-align:center}@media(max-width:700px){.next-event-carousel-controls{right:9px;bottom:9px}.next-event-arrow{width:40px;height:40px}}`;
  document.head.appendChild(style);

  const rows = () => [...document.querySelectorAll('#upcomingEvents .mini-event')].slice(0, 3);
  const pad = (v) => String(v).padStart(2, '0');
  const drawDots = () => {
    const total = rows().length;
    controls.querySelector('.next-event-dots').innerHTML = Array.from({length:total},(_,i)=>`<button type="button" class="next-event-dot ${i===index?'active':''}" data-index="${i}" aria-label="Pokaż wydarzenie ${i+1}"></button>`).join('');
    controls.querySelector('.next-event-position').textContent = total ? `${index+1}/${total}` : '0/0';
  };
  const targetFromRow = (row) => {
    const time = row.querySelector('time')?.textContent?.trim() || '';
    const hm = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!hm) return null;
    const d = new Date(); d.setHours(Number(hm[1]), Number(hm[2]), 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return d;
  };
  const readRow = (row) => {
    const name=row.querySelector('b')?.textContent?.trim()||'Wydarzenie';
    const detail=row.querySelector('span')?.textContent?.trim()||'';
    const when=row.querySelector('time')?.textContent?.trim()||'';
    const parts=detail.split(' · '),type=parts.shift()||'Event';
    return {name,type,location:parts.join(' · '),when,art:row.dataset.bossName||name,target:targetFromRow(row)};
  };
  const paintSelected = () => {
    if (index === 0) { selected = null; return; }
    const row = rows()[index]; if (!row) return;
    selected = readRow(row);
    const s=selected;
    $('#nextName').textContent=s.name;
    $('#nextType').textContent=s.type;
    $('#nextType').className=`type-chip ${s.type.toLowerCase().replaceAll(' ','-')}`;
    $('#nextMeta').textContent=`${s.when}${s.location?` · ${s.location}`:''}`;
    $('#nextDescription').textContent='Jedno z 3 najbliższych wydarzeń w kalendarzu klanu.';
    $('#nextStatus').textContent='NADCHODZI'; $('#nextStatus').className='live-status nadchodzi';
    applyBossArtwork(document.querySelector('.event-art-large'),s.art);
  };
  const $ = (s) => document.querySelector(s);
  const updateSelected = () => {
    if (index===0 || !selected) return;
    // main.js may repaint the first card each second; restore only text if needed, without observers.
    if ($('#nextName').textContent !== selected.name) paintSelected();
    if (!selected.target) return;
    let sec=Math.max(0,Math.floor((selected.target-Date.now())/1000));
    const vals=[Math.floor(sec/86400),Math.floor((sec%=86400)/3600),Math.floor((sec%=3600)/60),sec%60];
    $('#countdown').innerHTML=vals.map((v,i)=>`<b>${pad(v)}</b>${i<3?'<i>:</i>':''}`).join('');
    $('#countdownLabel').textContent='Do rozpoczęcia';
  };
  const show = (i) => {
    const list=rows(); if(!list.length)return;
    index=(i+list.length)%list.length;
    if(index===0){selected=null; drawDots(); return;}
    paintSelected(); drawDots(); updateSelected();
  };
  controls.addEventListener('click',e=>{const dot=e.target.closest('[data-index]');if(dot)return show(Number(dot.dataset.index));if(e.target.closest('[data-prev]'))show(index-1);if(e.target.closest('[data-next]'))show(index+1);});

  // One lightweight timer only. No MutationObservers, so there is no feedback loop/freeze.
  window.setInterval(updateSelected,1000);
  window.setTimeout(drawDots,400);
}

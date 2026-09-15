import { applyBossArtwork } from './bossArtwork.js';

export function installNextEventCarousel() {
  if (typeof document === 'undefined') return;
  const card = document.querySelector('#nextEventCard');
  if (!card || document.querySelector('#nextEventCarouselControls')) return;

  let index = 0;
  let selected = null;
  const $ = (s) => document.querySelector(s);
  const rows = () => [...document.querySelectorAll('#upcomingEvents .mini-event')].slice(0, 3);
  const pad = (v) => String(v).padStart(2, '0');

  const controls = document.createElement('div');
  controls.id = 'nextEventCarouselControls';
  controls.className = 'next-event-carousel-controls';
  controls.innerHTML = `<button type="button" class="next-event-arrow" data-prev aria-label="Poprzednie wydarzenie">‹</button><div class="next-event-dots"></div><span class="next-event-position" aria-live="polite"></span><button type="button" class="next-event-arrow" data-next aria-label="Następne wydarzenie">›</button>`;
  card.appendChild(controls);

  const style = document.createElement('style');
  style.textContent = `.next-event-card{position:relative}.next-event-carousel-controls{position:absolute;right:18px;bottom:14px;z-index:20;display:flex;align-items:center;gap:8px;padding:5px 7px;border:1px solid #8d6a2f;background:#070b0cf2;box-shadow:0 5px 18px #000a}.next-event-arrow{width:34px;height:34px;border:1px solid #8d6a2f;background:#111617;color:#e3b85f;font:700 25px/1 Georgia,serif;cursor:pointer}.next-event-arrow:hover,.next-event-arrow:focus{outline:none;border-color:#e3b85f;background:#2a2012}.next-event-dots{display:flex;gap:7px}.next-event-dot{width:9px;height:9px;padding:0;border:1px solid #a47d37;background:#191b18;transform:rotate(45deg);cursor:pointer}.next-event-dot.active{background:#e3b85f;box-shadow:0 0 8px #e3b85f88}.next-event-position{min-width:28px;color:#aaa294;font:700 9px Inter,Arial,sans-serif;text-align:center}@media(max-width:700px){.next-event-carousel-controls{left:50%;right:auto;bottom:10px;transform:translateX(-50%);width:max-content;max-width:calc(100% - 20px);justify-content:center}.next-event-arrow{width:38px;height:38px}}`;
  document.head.appendChild(style);

  const drawDots = () => {
    const total = rows().length;
    controls.querySelector('.next-event-dots').innerHTML = Array.from({length:total},(_,i)=>`<button type="button" class="next-event-dot ${i===index?'active':''}" data-index="${i}" aria-label="Pokaż wydarzenie ${i+1}"></button>`).join('');
    controls.querySelector('.next-event-position').textContent = total ? `${index+1}/${total}` : '0/0';
  };

  const readRow = (row) => {
    const name=row.querySelector('b')?.textContent?.trim()||'Wydarzenie';
    const detail=row.querySelector('span')?.textContent?.trim()||'';
    const when=row.querySelector('time')?.textContent?.trim()||'';
    const parts=detail.split(' · '),type=parts.shift()||'Event';
    const hm=when.match(/^(\d{1,2}):(\d{2})$/);
    let target=null;
    if(hm){target=new Date();target.setHours(Number(hm[1]),Number(hm[2]),0,0);if(target<=new Date())target.setDate(target.getDate()+1);}
    return {name,type,location:parts.join(' · '),when,art:row.dataset.bossName||name,target};
  };

  const paintCountdown = () => {
    if(!selected?.target) return;
    let sec=Math.max(0,Math.floor((selected.target-Date.now())/1000));
    const days=Math.floor(sec/86400); sec%=86400;
    const hours=Math.floor(sec/3600); sec%=3600;
    const mins=Math.floor(sec/60); const secs=sec%60;
    $('#countdown').innerHTML=[days,hours,mins,secs].map((v,i)=>`<b>${pad(v)}</b>${i<3?'<i>:</i>':''}`).join('');
    $('#countdownLabel').textContent='Do rozpoczęcia';
  };

  const paint = () => {
    if(index===0 || !selected) return;
    $('#nextName').textContent=selected.name;
    $('#nextType').textContent=selected.type;
    $('#nextType').className=`type-chip ${selected.type.toLowerCase().replaceAll(' ','-')}`;
    $('#nextMeta').textContent=`${selected.when}${selected.location?` · ${selected.location}`:''}`;
    $('#nextDescription').textContent='Jedno z 3 najbliższych wydarzeń w kalendarzu klanu.';
    $('#nextStatus').textContent='NADCHODZI';
    $('#nextStatus').className='live-status nadchodzi';
    applyBossArtwork($('.event-art-large'),selected.art);
    paintCountdown();
  };

  const show = (i) => {
    const list=rows(); if(!list.length)return;
    index=(i+list.length)%list.length;
    selected=index===0?null:readRow(list[index]);
    drawDots();
    if(selected) paint();
  };

  controls.addEventListener('click',e=>{const dot=e.target.closest('[data-index]');if(dot)return show(Number(dot.dataset.index));if(e.target.closest('[data-prev]'))show(index-1);if(e.target.closest('[data-next]'))show(index+1);});

  const keepSelectedVisible = () => { if(index>0 && selected) paint(); requestAnimationFrame(keepSelectedVisible); };
  requestAnimationFrame(keepSelectedVisible);
  window.setTimeout(drawDots,400);
}

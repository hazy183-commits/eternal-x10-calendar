import { applyBossArtwork } from './bossArtwork.js';

function installMobileHeaderMenu() {
  if (document.querySelector('#mobileHeaderMenuButton')) return;
  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  const button = document.createElement('button');
  button.id = 'mobileHeaderMenuButton';
  button.type = 'button';
  button.setAttribute('aria-label', 'Otwórz menu');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span class="mobile-menu-bars">☰</span><span>MENU</span>';
  actions.appendChild(button);

  const panel = document.createElement('div');
  panel.id = 'mobileHeaderMenu';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="mobile-menu-backdrop" data-mobile-menu-close></div>
    <nav class="mobile-menu-panel" aria-label="Menu mobilne">
      <div class="mobile-menu-head"><span>ORZEŁ BIAŁY</span><button type="button" data-mobile-menu-close aria-label="Zamknij menu">×</button></div>
      <a href="#top" data-mobile-menu-link>⌂ <span>Strona główna</span></a>
      <a href="#calendar" data-mobile-menu-link>▣ <span>Kalendarz</span></a>
      <a href="#statistics" data-mobile-menu-link>◫ <span>Statystyki</span></a>
      <a href="#guides" data-mobile-menu-link>♜ <span>Poradniki / Bossowie</span></a>
      <a href="#community" data-mobile-menu-link>◆ <span>Community</span></a>
      <button type="button" data-mobile-action="clan">♛ <span>Strefa klanu</span></button>
      <button type="button" data-mobile-action="admin">✦ <span>Panel administratora</span></button>
      <a href="https://discord.gg/HtTrJpp7K" target="_blank" rel="noopener noreferrer">◉ <span>Discord</span></a>
      <button type="button" class="mobile-menu-logout" data-mobile-action="logout">↪ <span>Wyloguj</span></button>
    </nav>`;
  document.body.appendChild(panel);

  const style = document.createElement('style');
  style.textContent = `
    #mobileHeaderMenuButton,#mobileHeaderMenu{display:none}
    @media(max-width:900px){
      .header-actions .admin-trigger,.header-actions .member-auth-entry{display:none!important}
      #mobileHeaderMenuButton{display:flex!important;align-items:center;justify-content:center;gap:8px;width:auto!important;min-width:86px!important;height:38px!important;padding:0 12px!important;border:1px solid #8d6a2f;background:#0b1010;color:#f3ead9;font:700 10px/1 Inter,Arial,sans-serif;letter-spacing:.12em;cursor:pointer}
      #mobileHeaderMenuButton .mobile-menu-bars{color:#e3b85f;font-size:18px;line-height:1}
      #mobileHeaderMenu{position:fixed;inset:0;z-index:12000;display:block;pointer-events:none;visibility:hidden}
      #mobileHeaderMenu.open{pointer-events:auto;visibility:visible}
      .mobile-menu-backdrop{position:absolute;inset:0;background:#000b;opacity:0;transition:opacity .18s ease}
      #mobileHeaderMenu.open .mobile-menu-backdrop{opacity:1}
      .mobile-menu-panel{position:absolute;top:0;right:0;width:min(340px,88vw);height:100dvh;padding:18px 14px 24px;border-left:1px solid #8d6a2f;background:linear-gradient(180deg,#0d1212,#060909);box-shadow:-20px 0 60px #000;transform:translateX(102%);transition:transform .2s ease;overflow:auto}
      #mobileHeaderMenu.open .mobile-menu-panel{transform:translateX(0)}
      .mobile-menu-head{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 14px;margin-bottom:8px;border-bottom:1px solid #3a2f20;color:#e6bd65;font:700 14px Cinzel,Georgia,serif;letter-spacing:.08em}
      .mobile-menu-head button{width:38px;height:38px;border:1px solid #5b4524;background:#0b0f0f;color:#d7aa52;font-size:24px;cursor:pointer}
      .mobile-menu-panel>a,.mobile-menu-panel>button:not(.mobile-menu-head button){box-sizing:border-box;display:flex;width:100%;align-items:center;gap:12px;margin:5px 0;padding:13px 12px;border:1px solid #3e3424;background:#0a0f0f;color:#d8d3c8;text-decoration:none;text-align:left;font:700 11px/1.2 Inter,Arial,sans-serif;letter-spacing:.04em;cursor:pointer}
      .mobile-menu-panel>a:hover,.mobile-menu-panel>button:not(.mobile-menu-head button):hover{border-color:#9a7635;background:#1b160e;color:#efc66f}
      .mobile-menu-panel .mobile-menu-logout{margin-top:14px!important;color:#b9ad97!important}
      body.mobile-menu-open{overflow:hidden!important}
    }
    @media(max-width:430px){#mobileHeaderMenuButton{min-width:78px!important;height:34px!important;padding:0 9px!important;font-size:9px!important}.mobile-menu-panel{width:90vw}}
  `;
  document.head.appendChild(style);

  const open = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-menu-open');
  };
  const close = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-menu-open');
  };

  button.addEventListener('click', open);
  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-mobile-menu-close]')) return close();
    if (event.target.closest('[data-mobile-menu-link]')) return close();
    const action = event.target.closest('[data-mobile-action]')?.dataset.mobileAction;
    if (!action) return;
    close();
    if (action === 'admin') document.querySelector('#adminTrigger')?.click();
    if (action === 'clan') document.querySelector('.member-auth-entry:not(.logout)')?.click();
    if (action === 'logout') document.querySelector('.member-auth-entry.logout')?.click();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
}

export function installNextEventCarousel() {
  if (typeof document === 'undefined') return;
  installMobileHeaderMenu();
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
    const targetValue=row.dataset.countdownTarget;
    const target=targetValue?new Date(targetValue):null;
    return {name,type,location:parts.join(' · '),when,art:row.dataset.bossName||name,target,label:row.dataset.countdownLabel||'Do rozpoczęcia'};
  };

  const paintCountdown = () => {
    if(!selected?.target) return;
    if(selected.target<=new Date()){show(0);return;}
    let sec=Math.max(0,Math.floor((selected.target-Date.now())/1000));
    const days=Math.floor(sec/86400); sec%=86400;
    const hours=Math.floor(sec/3600); sec%=3600;
    const mins=Math.floor(sec/60); const secs=sec%60;
    $('#countdown').innerHTML=[days,hours,mins,secs].map((v,i)=>`<b>${pad(v)}</b>${i<3?'<i>:</i>':''}`).join('');
    $('#countdownLabel').textContent=selected.label;
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
    card.dataset.carouselIndex=String(index);
    selected=index===0?null:readRow(list[index]);
    drawDots();
    if(selected) paint();
  };

  controls.addEventListener('click',e=>{const dot=e.target.closest('[data-index]');if(dot)return show(Number(dot.dataset.index));if(e.target.closest('[data-prev]'))show(index-1);if(e.target.closest('[data-next]'))show(index+1);});

  window.addEventListener('orzel:featured-event-updated',()=>show(0));
  window.setInterval(()=>{if(index>0&&selected)paint();},1000);
  window.setTimeout(drawDots,400);
}

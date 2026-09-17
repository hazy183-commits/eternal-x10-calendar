import { applyBossArtwork } from './bossArtwork.js';

function installMobileHeaderMenu() {
  if (document.querySelector('#mobileHeaderMenuButton')) return;
  const actions = document.querySelector('.header-actions');
  if (!actions) return;
  const button = document.createElement('button');
  button.id = 'mobileHeaderMenuButton'; button.type = 'button';
  button.setAttribute('aria-label','Otwórz menu'); button.setAttribute('aria-expanded','false');
  button.innerHTML = '<span class="mobile-menu-bars">☰</span><span>MENU</span>'; actions.appendChild(button);
  const panel=document.createElement('div'); panel.id='mobileHeaderMenu'; panel.setAttribute('aria-hidden','true');
  panel.innerHTML=`<div class="mobile-menu-backdrop" data-mobile-menu-close></div><nav class="mobile-menu-panel" aria-label="Menu mobilne"><div class="mobile-menu-head"><span>ORZEŁ BIAŁY</span><button type="button" data-mobile-menu-close aria-label="Zamknij menu">×</button></div><a href="#top" data-mobile-menu-link>⌂ <span>Strona główna</span></a><a href="#calendar" data-mobile-menu-link>▣ <span>Kalendarz</span></a><a href="#statistics" data-mobile-menu-link>◫ <span>Statystyki</span></a><a href="#guides" data-mobile-menu-link>♜ <span>Poradniki / Bossowie</span></a><a href="#community" data-mobile-menu-link>◆ <span>Community</span></a><button type="button" data-mobile-action="clan">♛ <span>Strefa klanu</span></button><button type="button" data-mobile-action="admin">✦ <span>Panel administratora</span></button><a href="https://discord.gg/HtTrJpp7K" target="_blank" rel="noopener noreferrer">◉ <span>Discord</span></a><button type="button" class="mobile-menu-logout" data-mobile-action="logout">↪ <span>Wyloguj</span></button></nav>`;
  document.body.appendChild(panel);
  const style=document.createElement('style'); style.textContent=`#mobileHeaderMenuButton,#mobileHeaderMenu{display:none}@media(max-width:900px){.header-actions .admin-trigger,.header-actions .member-auth-entry{display:none!important}#mobileHeaderMenuButton{display:flex!important;align-items:center;justify-content:center;gap:8px;width:auto!important;min-width:86px!important;height:38px!important;padding:0 12px!important;border:1px solid #8d6a2f;background:#0b1010;color:#f3ead9;font:700 10px/1 Inter,Arial,sans-serif;letter-spacing:.12em;cursor:pointer}#mobileHeaderMenuButton .mobile-menu-bars{color:#e3b85f;font-size:18px;line-height:1}#mobileHeaderMenu{position:fixed;inset:0;z-index:12000;display:block;pointer-events:none;visibility:hidden}#mobileHeaderMenu.open{pointer-events:auto;visibility:visible}.mobile-menu-backdrop{position:absolute;inset:0;background:#000b;opacity:0;transition:opacity .18s ease}#mobileHeaderMenu.open .mobile-menu-backdrop{opacity:1}.mobile-menu-panel{position:absolute;top:0;right:0;width:min(340px,88vw);height:100dvh;padding:18px 14px 24px;border-left:1px solid #8d6a2f;background:linear-gradient(180deg,#0d1212,#060909);box-shadow:-20px 0 60px #000;transform:translateX(102%);transition:transform .2s ease;overflow:auto}#mobileHeaderMenu.open .mobile-menu-panel{transform:translateX(0)}.mobile-menu-head{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 14px;margin-bottom:8px;border-bottom:1px solid #3a2f20;color:#e6bd65;font:700 14px Cinzel,Georgia,serif;letter-spacing:.08em}.mobile-menu-head button{width:38px;height:38px;border:1px solid #5b4524;background:#0b0f0f;color:#d7aa52;font-size:24px;cursor:pointer}.mobile-menu-panel>a,.mobile-menu-panel>button:not(.mobile-menu-head button){box-sizing:border-box;display:flex;width:100%;align-items:center;gap:12px;margin:5px 0;padding:13px 12px;border:1px solid #3e3424;background:#0a0f0f;color:#d8d3c8;text-decoration:none;text-align:left;font:700 11px/1.2 Inter,Arial,sans-serif;letter-spacing:.04em;cursor:pointer}.mobile-menu-panel .mobile-menu-logout{margin-top:14px!important;color:#b9ad97!important}body.mobile-menu-open{overflow:hidden!important}}`;
  document.head.appendChild(style);
  const open=()=>{panel.classList.add('open');panel.setAttribute('aria-hidden','false');button.setAttribute('aria-expanded','true');document.body.classList.add('mobile-menu-open')};
  const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');button.setAttribute('aria-expanded','false');document.body.classList.remove('mobile-menu-open')};
  button.addEventListener('click',open); panel.addEventListener('click',e=>{if(e.target.closest('[data-mobile-menu-close]'))return close();if(e.target.closest('[data-mobile-menu-link]'))return close();const action=e.target.closest('[data-mobile-action]')?.dataset.mobileAction;if(!action)return;close();if(action==='admin')document.querySelector('#adminTrigger')?.click();if(action==='clan')document.querySelector('.member-auth-entry:not(.logout)')?.click();if(action==='logout')document.querySelector('.member-auth-entry.logout')?.click()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}

function injectApprovedHeroStyles(){
  if(document.querySelector('#approvedHeroStyles')) return;
  const style=document.createElement('style');
  style.id='approvedHeroStyles';
  style.textContent=`
  @media (min-width: 821px){
    .desktop-hero{
      display:grid!important;
      grid-template-columns:minmax(0,1.16fr) minmax(560px,.84fr)!important;
      min-height:430px!important;
      margin-top:16px!important;
      overflow:hidden!important;
      border:1px solid #8d6a2f!important;
      background:#05090a!important;
      box-shadow:0 18px 48px #000a!important;
    }
    .desktop-hero>.hero{
      position:relative!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:430px!important;
      margin:0!important;
      padding:44px 48px 42px!important;
      overflow:hidden!important;
      border:0!important;
      border-right:1px solid #8d6a2f!important;
      text-align:center!important;
      background:
        linear-gradient(90deg,rgba(4,9,10,.72),rgba(5,9,10,.18) 52%,rgba(4,8,9,.48)),
        linear-gradient(0deg,rgba(3,7,8,.74),transparent 44%),
        url('/images/devastated-castle.jpg') center 44%/cover no-repeat!important;
      isolation:isolate!important;
    }
    .desktop-hero>.hero:before{
      content:'LINEAGE II\\A REBORN'!important;
      white-space:pre!important;
      position:relative!important;
      z-index:2!important;
      display:block!important;
      margin:0 0 17px!important;
      color:#e8c477!important;
      font:600 24px/1.28 Cinzel,Georgia,serif!important;
      letter-spacing:.22em!important;
      text-shadow:0 2px 7px #000!important;
    }
    .desktop-hero>.hero:after{
      content:''!important;
      position:absolute!important;
      inset:7px!important;
      z-index:1!important;
      border:1px solid rgba(190,143,58,.52)!important;
      box-shadow:inset 0 0 0 1px #0008,inset 0 0 46px #0009!important;
      pointer-events:none!important;
    }
    .desktop-hero>.hero h1{
      position:relative!important;
      z-index:2!important;
      margin:0!important;
      color:#f1eadb!important;
      font-size:clamp(66px,5.6vw,100px)!important;
      font-weight:600!important;
      line-height:.84!important;
      letter-spacing:.035em!important;
      text-shadow:0 4px 8px #000,0 0 24px #d19e4428!important;
    }
    .desktop-hero>.hero h1 span{
      display:block!important;
      margin:24px 0 0!important;
      color:#efc66e!important;
      font-size:.43em!important;
      letter-spacing:.15em!important;
    }
    .desktop-hero>.hero .hero-subtitle{
      position:relative!important;
      z-index:2!important;
      margin:23px 0 0!important;
      color:#eadfca!important;
      font:500 11px Cinzel,Georgia,serif!important;
      letter-spacing:.32em!important;
      text-transform:uppercase!important;
    }
    .desktop-hero>.hero .hero-tagline{
      position:relative!important;
      z-index:2!important;
      max-width:none!important;
      margin:17px 0 0!important;
      color:#e5dfd3!important;
      font:500 10px/1.6 Cinzel,Georgia,serif!important;
      letter-spacing:.22em!important;
      text-transform:uppercase!important;
    }
    .desktop-hero>.hero .hero-tagline:after{
      content:'JOIN OUR WORLD'!important;
      display:grid!important;
      place-items:center!important;
      width:365px!important;
      max-width:78%!important;
      height:56px!important;
      margin:25px auto 0!important;
      border:1px solid #9f762f!important;
      outline:1px solid rgba(222,176,83,.2)!important;
      outline-offset:-6px!important;
      background:linear-gradient(180deg,#101516e6,#060909f2)!important;
      color:#e9ce8d!important;
      font:600 16px Cinzel,Georgia,serif!important;
      letter-spacing:.12em!important;
      box-shadow:inset 0 0 30px #000b,0 8px 24px #0007!important;
    }
    .desktop-hero>.focus-section{
      position:relative!important;
      display:flex!important;
      flex-direction:column!important;
      min-width:0!important;
      min-height:430px!important;
      margin:0!important;
      padding:0!important;
      background:#05090a!important;
    }
    .desktop-hero>.focus-section>.section-heading{
      position:relative!important;
      top:auto!important;
      left:auto!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:112px!important;
      margin:0!important;
      padding:16px 30px!important;
      border:0!important;
      border-bottom:1px solid #8d6a2f!important;
      background:radial-gradient(circle at 50% 50%,rgba(184,131,39,.12),transparent 58%),#070c0d!important;
      text-align:center!important;
    }
    .desktop-hero>.focus-section>.section-heading>div{display:block!important}
    .desktop-hero>.focus-section>.section-heading .eyebrow{
      display:block!important;
      padding:0!important;
      border:0!important;
      background:none!important;
      color:#efc979!important;
      font:600 29px Cinzel,Georgia,serif!important;
      letter-spacing:.09em!important;
      text-shadow:0 2px 8px #000!important;
    }
    .desktop-hero>.focus-section>.section-heading h2{
      display:block!important;
      margin:8px 0 0!important;
      color:#cbb68a!important;
      font:500 10px Cinzel,Georgia,serif!important;
      letter-spacing:.22em!important;
      text-transform:uppercase!important;
    }
    .desktop-hero>.focus-section>.section-heading .live-status{
      position:absolute!important;
      right:16px!important;
      top:15px!important;
      z-index:8!important;
      padding:6px 10px!important;
      font-size:9px!important;
    }
    .desktop-hero>.focus-section>.section-heading .live-status:not(.trwa):not(.respawn-window-active):not(.siege-active):not(.olympiad-active){display:none!important}
    .desktop-hero>.focus-section>.section-heading .live-status.trwa,
    .desktop-hero>.focus-section>.section-heading .live-status.respawn-window-active,
    .desktop-hero>.focus-section>.section-heading .live-status.siege-active,
    .desktop-hero>.focus-section>.section-heading .live-status.olympiad-active{
      display:block!important;
      border-color:#547840!important;
      background:#0a160d!important;
      color:#a9dc8f!important;
      box-shadow:0 0 14px rgba(111,178,82,.2)!important;
    }
    .desktop-hero>.focus-section>.section-heading .live-status.trwa:before,
    .desktop-hero>.focus-section>.section-heading .live-status.respawn-window-active:before,
    .desktop-hero>.focus-section>.section-heading .live-status.siege-active:before,
    .desktop-hero>.focus-section>.section-heading .live-status.olympiad-active:before{content:'● ';color:#67cf63}
    .desktop-hero #nextEventCard{
      position:relative!important;
      flex:1!important;
      min-height:318px!important;
      display:grid!important;
      grid-template-columns:minmax(0,1.14fr) minmax(255px,.86fr)!important;
      overflow:hidden!important;
      border:0!important;
      background:#05090a!important;
      box-shadow:none!important;
    }
    .desktop-hero #nextEventCard:before{
      content:''!important;
      position:absolute!important;
      inset:8px!important;
      z-index:6!important;
      border:1px solid rgba(177,133,52,.28)!important;
      pointer-events:none!important;
    }
    .desktop-hero #nextEventCard .event-art-large{
      position:absolute!important;
      inset:0 43% 0 0!important;
      opacity:.86!important;
      background-size:cover!important;
      background-position:center 28%!important;
      filter:contrast(1.08) saturate(.84)!important;
    }
    .desktop-hero #nextEventCard .event-art-large:after{
      content:''!important;
      position:absolute!important;
      inset:0!important;
      background:linear-gradient(90deg,rgba(4,8,9,.06) 0%,rgba(4,8,9,.04) 48%,#05090a 100%),linear-gradient(0deg,#05090ae8 0%,transparent 45%)!important;
    }
    .desktop-hero #nextEventCard .event-aura{background:radial-gradient(ellipse at 66% 34%,rgba(217,167,74,.13),transparent 30%)!important}
    .desktop-hero #nextEventCard .next-event-content{
      position:relative!important;
      z-index:7!important;
      align-self:end!important;
      padding:86px 28px 70px!important;
      text-shadow:0 2px 5px #000!important;
    }
    .desktop-hero #nextEventCard .type-chip{
      padding:5px 9px!important;
      border-color:#b85444!important;
      background:#4b1612d9!important;
      color:#f18a73!important;
    }
    .desktop-hero #nextEventCard #nextName{
      margin:12px 0 9px!important;
      color:#f3ead6!important;
      font-size:38px!important;
      line-height:1!important;
    }
    .desktop-hero #nextEventCard #nextMeta{
      max-width:330px!important;
      color:#e0d8ca!important;
      font-size:11px!important;
      line-height:1.35!important;
    }
    .desktop-hero #nextEventCard #nextDescription{
      max-width:330px!important;
      margin-top:15px!important;
      color:#c9c0b0!important;
      font-size:11px!important;
      line-height:1.5!important;
    }
    .desktop-hero #nextEventCard .countdown-block{
      position:relative!important;
      z-index:7!important;
      align-self:center!important;
      margin:0!important;
      padding:28px 24px 80px!important;
      border-left:1px solid rgba(190,144,56,.25)!important;
      text-align:center!important;
    }
    .desktop-hero #nextEventCard .countdown-block>span{
      color:#e3c274!important;
      font:600 10px Cinzel,Georgia,serif!important;
      letter-spacing:.12em!important;
    }
    .desktop-hero #nextEventCard .countdown{
      gap:7px!important;
      margin-top:10px!important;
      color:#f0c86d!important;
      font-size:40px!important;
      text-shadow:0 0 14px rgba(211,160,68,.34)!important;
    }
    .desktop-hero #nextEventCard .countdown-block small{
      margin-top:5px!important;
      color:#aaa294!important;
      font-size:8px!important;
    }
    .desktop-hero #nextEventCarouselControls{
      right:20px!important;
      bottom:15px!important;
      z-index:20!important;
      padding:6px 8px!important;
      border:1px solid #9a7432!important;
      background:#05090af2!important;
    }
  }
  `;
  document.head.appendChild(style);
}

export function installNextEventCarousel() {
  if (typeof document === 'undefined') return;
  installMobileHeaderMenu();
  injectApprovedHeroStyles();
  const card=document.querySelector('#nextEventCard'); if(!card||document.querySelector('#nextEventCarouselControls'))return;
  let index=0,selected=null; const $=s=>document.querySelector(s); const rows=()=>[...document.querySelectorAll('#upcomingEvents .mini-event')].slice(0,3); const pad=v=>String(v).padStart(2,'0');
  const heading=card.closest('.focus-section')?.querySelector('.section-heading'); if(heading){heading.querySelector('.eyebrow').textContent='NAJBLIŻSZE WYDARZENIA'; heading.querySelector('h2').textContent='SPRAWDŹ CO CZEKA NA SERWERZE';}
  const controls=document.createElement('div'); controls.id='nextEventCarouselControls'; controls.className='next-event-carousel-controls'; controls.innerHTML=`<button type="button" class="next-event-arrow" data-prev aria-label="Poprzednie wydarzenie">‹</button><div class="next-event-dots"></div><span class="next-event-position" aria-live="polite"></span><button type="button" class="next-event-arrow" data-next aria-label="Następne wydarzenie">›</button>`; card.appendChild(controls);
  const style=document.createElement('style'); style.textContent=`.next-event-card{position:relative}.next-event-carousel-controls{position:absolute;right:20px;bottom:16px;z-index:20;display:flex;align-items:center;gap:9px;padding:6px 8px;border:1px solid #9a7432;background:#05090af2;box-shadow:0 5px 18px #000a}.next-event-arrow{width:36px;height:36px;border:1px solid #9a7432;background:#0d1314;color:#e8bc60;font:700 26px/1 Georgia,serif;cursor:pointer}.next-event-arrow:hover{border-color:#f0cd7f;background:#2a2012}.next-event-dots{display:flex;gap:8px}.next-event-dot{width:9px;height:9px;padding:0;border:1px solid #b78a3a;background:#161b18;transform:rotate(45deg);cursor:pointer}.next-event-dot.active{background:#efc663;box-shadow:0 0 9px #e3b85f99}.next-event-position{min-width:30px;color:#c5bcaa;font:700 9px Inter,Arial,sans-serif;text-align:center}@media(max-width:700px){.next-event-carousel-controls{left:50%;right:auto;bottom:10px;transform:translateX(-50%);width:max-content}.next-event-arrow{width:38px;height:38px}}`; document.head.appendChild(style);
  const drawDots=()=>{const total=rows().length;controls.querySelector('.next-event-dots').innerHTML=Array.from({length:total},(_,i)=>`<button type="button" class="next-event-dot ${i===index?'active':''}" data-index="${i}" aria-label="Pokaż wydarzenie ${i+1}"></button>`).join('');controls.querySelector('.next-event-position').textContent=total?`${index+1}/${total}`:'0/0'};
  const readRow=row=>{const name=row.querySelector('b')?.textContent?.trim()||'Wydarzenie',detail=row.querySelector('span')?.textContent?.trim()||'',when=row.querySelector('time')?.textContent?.trim()||'',parts=detail.split(' · '),type=parts.shift()||'Event',targetValue=row.dataset.countdownTarget,target=targetValue?new Date(targetValue):null;return{name,type,location:parts.join(' · '),when,art:row.dataset.bossName||name,target,label:row.dataset.countdownLabel||'Do rozpoczęcia'}};
  const paintCountdown=()=>{if(!selected?.target)return;if(selected.target<=new Date()){show(0);return}let sec=Math.max(0,Math.floor((selected.target-Date.now())/1000));const days=Math.floor(sec/86400);sec%=86400;const hours=Math.floor(sec/3600);sec%=3600;const mins=Math.floor(sec/60),secs=sec%60;$('#countdown').innerHTML=[days,hours,mins,secs].map((v,i)=>`<b>${pad(v)}</b>${i<3?'<i>:</i>':''}`).join('');$('#countdownLabel').textContent=selected.label};
  const paint=()=>{if(index===0||!selected)return;$('#nextName').textContent=selected.name;$('#nextType').textContent=selected.type;$('#nextType').className=`type-chip ${selected.type.toLowerCase().replaceAll(' ','-')}`;$('#nextMeta').textContent=`${selected.when}${selected.location?` · ${selected.location}`:''}`;$('#nextDescription').textContent=selected.location?`Lokalizacja: ${selected.location}`:'Wydarzenie z kalendarza klanu.';$('#nextStatus').textContent='NADCHODZI';$('#nextStatus').className='live-status nadchodzi';applyBossArtwork($('.event-art-large'),selected.art);paintCountdown()};
  const show=i=>{const list=rows();if(!list.length)return;index=(i+list.length)%list.length;card.dataset.carouselIndex=String(index);selected=index===0?null:readRow(list[index]);drawDots();if(selected)paint()};
  controls.addEventListener('click',e=>{const dot=e.target.closest('[data-index]');if(dot)return show(Number(dot.dataset.index));if(e.target.closest('[data-prev]'))show(index-1);if(e.target.closest('[data-next]'))show(index+1)});
  window.addEventListener('orzel:featured-event-updated',()=>show(0)); window.setInterval(()=>{if(index>0&&selected)paintCountdown()},1000); window.setTimeout(drawDots,400);
}

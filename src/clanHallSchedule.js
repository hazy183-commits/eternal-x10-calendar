const DAY_MS = 24 * 60 * 60 * 1000;

export const CLAN_HALLS = Object.freeze([
  Object.freeze({ name: 'Fortress of Resistance', weekday: 5, time: '19:00' }),
  Object.freeze({ name: 'Devastated Castle', weekday: 1, time: '19:00' }),
  Object.freeze({ name: 'Bandit Stronghold', weekday: 3, time: '19:00' }),
  Object.freeze({ name: 'Rainbow Spring Chateau', weekday: 1, time: '23:00' }),
  Object.freeze({ name: 'Wild Beast Reserve', weekday: 4, time: '20:00' }),
  Object.freeze({ name: 'Fortress of the Dead', weekday: 2, time: '23:00' }),
]);

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const EPIC_BOSSES = Object.freeze({
  'queen ant': { name:'QUEEN ANT', level:'40', location:'Wasteland / Ant Nest', respawn:'24h + 4h random', jewel:'Ring of Queen Ant', note:'Vulnerable to fire attacks and highly resistant to bow attacks.', url:'https://lineage2wiki.org/interlude/monster/29001/queen-ant/' },
  'core': { name:'CORE', level:'50', location:'Cruma Tower', respawn:'36h + 4h random', jewel:'Ring of Core', note:'Magic Creature found inside Cruma Tower.', url:'https://lineage2wiki.org/interlude/monster/29006/core/' },
  'orfen': { name:'ORFEN', level:'50', location:'Sea of Spores', respawn:'36h + 4h random', jewel:'Earring of Orfen', note:'Epic boss of the Sea of Spores.', url:'https://lineage2wiki.org/interlude/monster/29014/orfen/' },
  'baium': { name:'BAIUM', level:'75', location:'Tower of Insolence', respawn:'Sobota 22:00 + 1h random', jewel:'Ring of Baium', note:'Entry to Baium requires access to his room; Blooded Fabric is used in the related Interlude quest path.', url:'https://lineage2wiki.org/interlude/monster/29020/baium/' },
  'zaken': { name:'ZAKEN', level:'60', location:"Devil's Isle", respawn:'36h + 4h random', jewel:'Earring of Zaken', note:"Undead Epic Raid Boss located on Devil's Isle.", url:'https://lineage2wiki.org/interlude/monster/29022/zaken/' },
  'frintezza': { name:'FRINTEZZA', level:'85', location:'Last Imperial Tomb', respawn:'48h + 4h random', jewel:'Necklace of Frintezza', note:'Epic encounter connected with the Last Imperial Tomb.', url:'https://lineage2wiki.org/interlude/monster/29045/frintezza/' },
  'antharas': { name:'ANTHARAS', level:'79', location:"Antharas' Nest", respawn:'Co 2. niedzielę 22:00 + 1h random', jewel:'Earring of Antharas', note:'Dragon. Vulnerable to wind attacks and strongly resistant to earth attacks.', url:'https://lineage2wiki.org/interlude/monster/29067/antharas/' },
  'valakas': { name:'VALAKAS', level:'85', location:'Forge of the Gods / Valakas Lair', respawn:'Co 2. niedzielę 22:00 + 1h random', jewel:'Necklace of Valakas', note:'Dragon. Vulnerable to water and highly resistant to fire.', url:'https://lineage2wiki.org/interlude/monster/29028/valakas/' },
});

if (typeof document !== 'undefined') {
  document.querySelectorAll('.boss-gallery .boss-card small').forEach((label) => { label.textContent = 'EPIC RAID BOSS'; });
  const bossAside=document.querySelector('.boss-gallery .section-aside'); if(bossAside) bossAside.remove();

  const communityLinks = [...document.querySelectorAll('#community .community-links a')];
  const serverLink = communityLinks.find((link) => link.querySelector('b')?.textContent.trim().toLowerCase() === 'server');
  if (serverLink) {
    serverLink.href = 'https://lineage2wiki.org/interlude/'; serverLink.target = '_blank'; serverLink.rel = 'noopener noreferrer'; serverLink.classList.add('community-external');
    const title = serverLink.querySelector('b'); const subtitle = serverLink.querySelector('span');
    if (title) title.textContent = 'Drop Kalkulator'; if (subtitle) subtitle.textContent = 'Lineage 2 Interlude';
  }

  const guidesLink = document.querySelector('.main-nav a[href="#guides"]');
  if (guidesLink) { guidesLink.textContent = 'Drop Kalkulator'; guidesLink.href = 'https://lineage2wiki.org/interlude/'; guidesLink.target = '_blank'; guidesLink.rel = 'noopener noreferrer'; }

  let modal;
  const closeEpicModal = () => { if (!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); };
  const ensureEpicModal = () => {
    if (modal) return modal;
    modal = document.createElement('div'); modal.id='epicInfoModal'; modal.className='epic-info-modal'; modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `<div class="epic-info-backdrop" data-epic-close></div><section class="epic-info-panel" role="dialog" aria-modal="true" aria-labelledby="epicInfoTitle"><button class="epic-info-close" type="button" data-epic-close aria-label="Zamknij">×</button><span class="epic-info-kicker">EPIC RAID BOSS</span><h2 id="epicInfoTitle"></h2><p class="epic-info-subtitle">Lineage 2 Interlude · Eternal x10</p><div class="epic-info-grid"><div><span>LEVEL</span><b data-epic-level></b></div><div><span>LOKALIZACJA</span><b data-epic-location></b></div><div><span>RESPAWN ETERNAL X10</span><b data-epic-respawn></b></div><div><span>EPIC JEWEL</span><b data-epic-jewel></b></div></div><div class="epic-info-note"><b>Informacje</b><p data-epic-note></p></div><a class="epic-info-link" data-epic-url target="_blank" rel="noopener noreferrer">STATYSTYKI I DROP →</a></section>`;
    document.body.appendChild(modal); modal.querySelectorAll('[data-epic-close]').forEach((el)=>el.addEventListener('click',closeEpicModal)); return modal;
  };
  const openEpic = (boss) => {
    const box=ensureEpicModal(); box.querySelector('#epicInfoTitle').textContent=boss.name; box.querySelector('[data-epic-level]').textContent=boss.level; box.querySelector('[data-epic-location]').textContent=boss.location; box.querySelector('[data-epic-respawn]').textContent=boss.respawn; box.querySelector('[data-epic-jewel]').textContent=boss.jewel; box.querySelector('[data-epic-note]').textContent=boss.note; box.querySelector('[data-epic-url]').href=boss.url; box.classList.add('open'); box.setAttribute('aria-hidden','false'); box.querySelector('.epic-info-close')?.focus();
  };
  document.querySelectorAll('.boss-gallery .boss-card').forEach((card) => {
    const raw = card.querySelector('span')?.childNodes?.[0]?.textContent?.trim().toLowerCase(); const boss=EPIC_BOSSES[raw]; if(!boss) return;
    card.tabIndex=0; card.setAttribute('role','button'); card.setAttribute('aria-label',`Informacje o ${boss.name}`); card.classList.add('boss-card-clickable'); card.addEventListener('click',()=>openEpic(boss)); card.addEventListener('keydown',(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openEpic(boss);}});
  });
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape') closeEpicModal();});

  // Keep the upcoming sidebar useful: today's events already have their own panel.
  const upcoming=document.getElementById('upcomingEvents');
  if(upcoming){
    let polishing=false;
    const polishUpcoming=()=>{if(polishing)return;polishing=true;requestAnimationFrame(()=>{const rows=[...upcoming.querySelectorAll('.mini-event')];const todayRows=[...document.querySelectorAll('#todayEvents .mini-event')];const todayKeys=new Set(todayRows.map(row=>`${row.querySelector('time')?.textContent.trim()}|${row.querySelector('b')?.textContent.trim()}`));rows.forEach(row=>{const key=`${row.querySelector('time')?.textContent.trim()}|${row.querySelector('b')?.textContent.trim()}`;row.hidden=todayKeys.has(key);});const visible=rows.filter(row=>!row.hidden);let empty=upcoming.querySelector('.future-only-empty');if(!visible.length&&rows.length){if(!empty){empty=document.createElement('p');empty.className='empty-mini future-only-empty';empty.textContent='Kolejne wydarzenia pojawią się tutaj po zakończeniu dzisiejszego harmonogramu.';upcoming.appendChild(empty)}}else empty?.remove();polishing=false;});};
    new MutationObserver(polishUpcoming).observe(upcoming,{childList:true,subtree:true}); new MutationObserver(polishUpcoming).observe(document.getElementById('todayEvents'),{childList:true,subtree:true}); polishUpcoming();
  }
}

if (typeof document !== 'undefined' && !document.getElementById('calendar-filter-polish')) {
  const style=document.createElement('style'); style.id='calendar-filter-polish'; style.textContent=`
#filters.filters{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:8px!important;width:100%;padding:8px!important;border:1px solid rgba(203,158,72,.34)!important;background:linear-gradient(180deg,#111718,#070b0c)!important;box-shadow:inset 0 0 28px #0008,0 7px 24px #0004}
#filters .filter-btn{position:relative;min-width:0;min-height:76px!important;padding:12px 5px 9px!important;overflow:hidden;border:1px solid rgba(203,158,72,.30)!important;background:linear-gradient(180deg,#141a1b,#080c0d)!important;color:#d5d0c5!important;box-shadow:inset 0 1px #ffffff08,inset 0 -14px 24px #0005!important;font:700 10px/1.15 Inter,Arial,sans-serif!important;letter-spacing:.055em!important;text-transform:uppercase;white-space:nowrap;transition:.2s ease!important}
#filters .filter-btn::before{display:grid;place-items:center;width:34px;height:31px;margin:0 auto 6px;color:#d4a64d;font-size:24px;line-height:1;filter:drop-shadow(0 2px 1px #000);transition:.2s ease}#filters .filter-btn::after{content:'';position:absolute;left:20%;right:20%;bottom:0;height:1px;background:linear-gradient(90deg,transparent,#f0cd7f,transparent);opacity:0;transition:.2s ease}#filters .filter-btn:hover{z-index:1;transform:translateY(-2px);border-color:#b78b40!important;color:#f0d99f!important;box-shadow:inset 0 0 20px #d4a64d12,0 7px 17px #0007!important}#filters .filter-btn:hover::before{transform:scale(1.08);filter:drop-shadow(0 0 6px #d4a64d55)}#filters .filter-btn.active{z-index:2;transform:translateY(-2px);border-color:#e1b55d!important;background:radial-gradient(circle at 50% 10%,#9a6d2b3f,transparent 50%),linear-gradient(180deg,#342719,#15110c)!important;color:#fff0c6!important;box-shadow:inset 0 0 25px #f0c1641f,0 0 10px #d4a64d25,0 7px 18px #0008!important;text-shadow:0 0 10px #f0cd7f33}#filters .filter-btn.active::after{opacity:1}#filters .filter-btn.active::before{color:#f3ca69!important;filter:drop-shadow(0 0 7px #d4a64d88)}#filters .filter-btn[data-filter='Wszystkie']::before{content:'✦';font-family:Georgia,serif;font-size:31px}#filters .filter-btn[data-filter='RB']::before{content:'☠';font-size:29px;color:#d7c09a}#filters .filter-btn[data-filter='Epic RB']::before{content:'♦';font-family:Georgia,serif;font-size:31px;color:#bd62c5;text-shadow:0 0 7px #8f39a066}#filters .filter-btn[data-filter='Clan Hall']::before{content:'♜';font-family:Georgia,serif;font-size:31px;color:#d8aa57}#filters .filter-btn[data-filter='Siege']::before{content:'⚔';font-size:29px;color:#d77e5d}#filters .filter-btn[data-filter='Olympiad']::before{content:'❧';font-family:Georgia,serif;font-size:32px;color:#86bfd3;transform:rotate(-18deg)}#filters .filter-btn[data-filter='Event']::before{content:'⚑';font-size:29px;color:#87b978}#filters .filter-btn[data-filter='Olympiad']:hover::before,#filters .filter-btn[data-filter='Olympiad'].active::before{transform:rotate(-18deg) scale(1.08)}
.boss-card-clickable{cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}.boss-card-clickable:hover,.boss-card-clickable:focus{transform:translateY(-4px);border-color:#e0b35c!important;box-shadow:0 0 20px #d8a94b33!important;outline:none}.epic-info-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:22px}.epic-info-modal.open{display:flex}.epic-info-backdrop{position:absolute;inset:0;background:#000c;backdrop-filter:blur(6px)}.epic-info-panel{position:relative;width:min(680px,100%);padding:32px;border:1px solid #b68b3f;background:radial-gradient(circle at 50% 0,#5c421b35,transparent 42%),linear-gradient(180deg,#121718,#06090a);box-shadow:0 24px 80px #000;color:#ddd}.epic-info-close{position:absolute;right:14px;top:10px;border:0;background:transparent;color:#c9a55d;font-size:32px;cursor:pointer}.epic-info-kicker{color:#d9ad58;font:700 11px Inter,sans-serif;letter-spacing:.18em}.epic-info-panel h2{margin:7px 0 0;color:#f3ead7;font:700 34px Cinzel,serif}.epic-info-subtitle{margin:5px 0 24px;color:#888}.epic-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.epic-info-grid div{padding:14px;border:1px solid #7b622f66;background:#0005}.epic-info-grid span{display:block;margin-bottom:5px;color:#8e887d;font-size:10px;letter-spacing:.12em}.epic-info-grid b{color:#e7d5ac;font-size:14px}.epic-info-note{margin-top:16px;padding:15px;border-left:2px solid #c79b4b;background:#b98b3510}.epic-info-note b{color:#dcb668}.epic-info-note p{margin:6px 0 0;color:#aaa;line-height:1.55}.epic-info-link{display:inline-block;margin-top:20px;padding:12px 17px;border:1px solid #bd9144;color:#f0cc7d;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.08em}.epic-info-link:hover{background:#b88b3420}
@media(max-width:1050px){#filters.filters{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
@media(max-width:620px){#filters.filters{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}#filters .filter-btn{min-height:66px!important;font-size:9px!important}.epic-info-panel{padding:26px 18px}.epic-info-grid{grid-template-columns:1fr}.epic-info-panel h2{font-size:27px}.hero{padding-top:38px!important;padding-bottom:38px!important;min-height:auto!important}.hero h1{margin-top:4px!important}.hero-tagline{margin-bottom:0!important}.focus-section{margin-top:16px!important}}
`; document.head.appendChild(style);
}

export function clanHallEvents(reference=new Date(),daysBefore=7,daysAfter=35){const start=new Date(reference);start.setHours(0,0,0,0);start.setDate(start.getDate()-daysBefore);const totalDays=daysBefore+daysAfter;const events=[];for(let offset=0;offset<=totalDays;offset+=1){const date=new Date(start.getTime()+offset*DAY_MS);for(const hall of CLAN_HALLS){if(date.getDay()!==hall.weekday)continue;events.push({id:`clan-hall-${hall.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${dateKey(date)}`,name:hall.name,boss:'',type:'Clan Hall',location:hall.name,date:dateKey(date),time:hall.time,duration:60,description:'Cotygodniowe wydarzenie Clan Hall.',isClanHallSchedule:true});}}return events;}

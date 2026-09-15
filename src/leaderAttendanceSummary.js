function numberFrom(text=''){const match=String(text).match(/(\d+)\s*$/);return match?Number(match[1]):0;}

function decorateAttendance(){
  const box=document.querySelector('#obAttendanceContent');
  if(!box||box.querySelector('.ob-attendance-overview'))return;
  const cards=[...box.querySelectorAll('.ob-attendance-card')];
  if(!cards.length)return;
  let yes=0,maybe=0,no=0;
  cards.forEach((card)=>{
    const yesCount=numberFrom(card.querySelector('.ob-attendance-counts .yes')?.textContent);
    const maybeCount=numberFrom(card.querySelector('.ob-attendance-counts .maybe')?.textContent);
    const noCount=numberFrom(card.querySelector('.ob-attendance-counts .no')?.textContent);
    yes+=yesCount;maybe+=maybeCount;no+=noCount;
    if(!card.querySelector('.ob-attendance-total')){
      const total=document.createElement('div');
      total.className='ob-attendance-total';
      total.innerHTML=`<span>Łącznie deklaracji <b>${yesCount+maybeCount+noCount}</b></span><strong><i class="yes">${yesCount} BĘDZIE</i><i class="maybe">${maybeCount} MOŻE</i><i class="no">${noCount} NIE</i></strong>`;
      card.querySelector('.ob-attendance-head')?.after(total);
    }
  });
  const overview=document.createElement('section');
  overview.className='ob-attendance-overview';
  overview.innerHTML=`<div><small>PODSUMOWANIE NADCHODZĄCYCH EVENTÓW</small><b>${cards.length} wydarzeń · ${yes+maybe+no} deklaracji</b></div><div class="ob-attendance-overview-counts"><span class="yes"><b>${yes}</b>BĘDZIE</span><span class="maybe"><b>${maybe}</b>MOŻE</span><span class="no"><b>${no}</b>NIE</span></div>`;
  box.prepend(overview);
}

function installStyles(){
  if(document.querySelector('#obAttendancePolishStyles'))return;
  const style=document.createElement('style');
  style.id='obAttendancePolishStyles';
  style.textContent=`.ob-attendance-overview{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px 17px;border:1px solid #6a5129;background:linear-gradient(120deg,#18140d,#0b1010);box-shadow:inset 0 0 30px #c98a1710}.ob-attendance-overview small{display:block;color:#b98c42;font-size:8px;font-weight:900;letter-spacing:.13em}.ob-attendance-overview>div>b{display:block;margin-top:4px;color:#eee0c4;font:700 16px Georgia,serif}.ob-attendance-overview-counts{display:flex;gap:7px}.ob-attendance-overview-counts span{min-width:68px;padding:7px 9px;border:1px solid #3a3122;background:#080b0b;text-align:center;font-size:8px;font-weight:900}.ob-attendance-overview-counts span b{display:block;margin-bottom:2px;font-size:17px}.ob-attendance-overview-counts .yes{color:#6fda84;border-color:#2c6f3c}.ob-attendance-overview-counts .maybe{color:#ddb95a;border-color:#765e24}.ob-attendance-overview-counts .no{color:#e27a72;border-color:#71352f}.ob-attendance-total{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0 3px;color:#7f786e;font-size:9px}.ob-attendance-total>span b{color:#d6b46b}.ob-attendance-total strong{display:flex;gap:8px;flex-wrap:wrap}.ob-attendance-total i{font-style:normal;font-size:8px;letter-spacing:.05em}.ob-attendance-total .yes{color:#67d37d}.ob-attendance-total .maybe{color:#d9b354}.ob-attendance-total .no{color:#df756d}@media(max-width:700px){.ob-attendance-overview{grid-template-columns:1fr}.ob-attendance-overview-counts{justify-content:flex-start}.ob-attendance-total{align-items:flex-start;flex-direction:column}}`;
  document.head.appendChild(style);
}

export function installLeaderAttendanceSummary(){
  if(window.__obAttendanceSummaryInstalled)return;
  window.__obAttendanceSummaryInstalled=true;
  installStyles();
  const watch=()=>{
    const box=document.querySelector('#obAttendanceContent');
    if(!box){setTimeout(watch,180);return;}
    let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(decorateAttendance,30);}).observe(box,{childList:true,subtree:true});
    decorateAttendance();
  };
  watch();
  document.addEventListener('click',(event)=>{if(event.target.closest('[data-zone-view="attendance"]'))setTimeout(decorateAttendance,160);});
}

installLeaderAttendanceSummary();

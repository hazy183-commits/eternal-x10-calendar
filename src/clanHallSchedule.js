const DAY_MS = 24 * 60 * 60 * 1000;

export const CLAN_HALLS = Object.freeze([
  Object.freeze({ name: 'Fortress of Resistance', weekday: 5, time: '17:00' }),
  Object.freeze({ name: 'Devastated Castle', weekday: 1, time: '17:00' }),
  Object.freeze({ name: 'Bandit Stronghold', weekday: 3, time: '17:00' }),
  Object.freeze({ name: 'Rainbow Spring Chateau', weekday: 1, time: '21:00' }),
  Object.freeze({ name: 'Wild Beast Reserve', weekday: 4, time: '18:00' }),
  Object.freeze({ name: 'Fortress of the Dead', weekday: 2, time: '21:00' }),
]);

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Premium calendar filter styling. Kept here so it loads together with the
// automatic Clan Hall schedule without adding another blocking stylesheet.
if (typeof document !== 'undefined' && !document.getElementById('calendar-filter-polish')) {
  const style = document.createElement('style');
  style.id = 'calendar-filter-polish';
  style.textContent = `
    #filters.filters {
      display:grid !important;
      grid-template-columns:repeat(7,minmax(0,1fr)) !important;
      gap:7px !important;
      width:100%;
      padding:7px !important;
      border:1px solid rgba(203,158,72,.32) !important;
      background:linear-gradient(180deg,rgba(18,24,24,.98),rgba(7,11,12,.98)) !important;
      box-shadow:inset 0 0 28px rgba(0,0,0,.45),0 7px 24px rgba(0,0,0,.22);
    }
    #filters .filter-btn {
      position:relative;
      min-width:0;
      min-height:54px !important;
      padding:9px 7px 8px !important;
      overflow:hidden;
      border:1px solid rgba(203,158,72,.24) !important;
      background:linear-gradient(180deg,#141a1a 0%,#090d0e 100%) !important;
      color:#c9c5bb !important;
      box-shadow:inset 0 1px rgba(255,255,255,.025),inset 0 -10px 22px rgba(0,0,0,.22) !important;
      font-size:10px !important;
      font-weight:700 !important;
      letter-spacing:.055em !important;
      line-height:1.15;
      text-transform:uppercase;
      white-space:nowrap;
      transition:transform .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease !important;
    }
    #filters .filter-btn::before {
      content:'◆';
      display:block;
      margin-bottom:5px;
      color:#806b3d;
      font-size:9px;
      line-height:1;
      transition:color .18s ease,text-shadow .18s ease;
    }
    #filters .filter-btn::after {
      content:'';
      position:absolute;
      left:22%; right:22%; bottom:0;
      height:1px;
      background:linear-gradient(90deg,transparent,#d4a64d,transparent);
      opacity:0;
      transition:opacity .18s ease;
    }
    #filters .filter-btn:hover {
      z-index:1;
      transform:translateY(-1px);
      border-color:rgba(240,205,127,.68) !important;
      color:#f0d99f !important;
      box-shadow:inset 0 0 18px rgba(212,166,77,.09),0 5px 15px rgba(0,0,0,.35) !important;
    }
    #filters .filter-btn:hover::before { color:#d4a64d; text-shadow:0 0 8px rgba(212,166,77,.45); }
    #filters .filter-btn.active {
      z-index:2;
      transform:translateY(-1px);
      border-color:#d4a64d !important;
      background:radial-gradient(circle at 50% 0,rgba(224,177,84,.25),transparent 56%),linear-gradient(180deg,#342719 0%,#15110c 100%) !important;
      color:#fff0c6 !important;
      box-shadow:inset 0 0 24px rgba(240,193,100,.13),0 0 0 1px rgba(240,205,127,.08),0 5px 18px rgba(0,0,0,.4) !important;
      text-shadow:0 0 10px rgba(240,205,127,.2);
    }
    #filters .filter-btn.active::before { content:'✦'; color:#f0cd7f; font-size:11px; text-shadow:0 0 10px rgba(240,205,127,.6); }
    #filters .filter-btn.active::after { opacity:1; }
    #filters .filter-btn[data-filter='Epic RB']::before { color:#b76b5f; }
    #filters .filter-btn[data-filter='Clan Hall']::before { content:'♜'; color:#d4a64d; font-size:12px; }
    #filters .filter-btn[data-filter='Siege']::before { content:'⚔'; color:#d28b70; font-size:12px; }
    #filters .filter-btn[data-filter='Olympiad']::before { content:'◈'; color:#76b6c9; font-size:12px; }
    #filters .filter-btn[data-filter='Event']::before { content:'✧'; color:#8fbd82; font-size:12px; }
    #filters .filter-btn[data-filter='Wszystkie']::before { content:'✦'; }
    #filters .filter-btn.active::before { color:#f0cd7f; }
    @media (max-width:1050px) {
      #filters.filters { grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
    }
    @media (max-width:620px) {
      #filters.filters { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:5px !important; }
      #filters .filter-btn { min-height:49px !important; font-size:9px !important; }
    }
  `;
  document.head.appendChild(style);
}

export function clanHallEvents(reference = new Date(), daysBefore = 7, daysAfter = 35) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysBefore);
  const totalDays = daysBefore + daysAfter;
  const events = [];

  for (let offset = 0; offset <= totalDays; offset += 1) {
    const date = new Date(start.getTime() + offset * DAY_MS);
    for (const hall of CLAN_HALLS) {
      if (date.getDay() !== hall.weekday) continue;
      events.push({
        id: `clan-hall-${hall.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dateKey(date)}`,
        name: hall.name,
        boss: '',
        type: 'Clan Hall',
        location: hall.name,
        date: dateKey(date),
        time: hall.time,
        duration: 60,
        description: 'Cotygodniowe wydarzenie Clan Hall.',
        isClanHallSchedule: true,
      });
    }
  }
  return events;
}

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

if (typeof document !== 'undefined' && !document.getElementById('calendar-filter-polish')) {
  const style = document.createElement('style');
  style.id = 'calendar-filter-polish';
  style.textContent = `
    #filters.filters{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:8px!important;width:100%;padding:8px!important;border:1px solid rgba(203,158,72,.34)!important;background:linear-gradient(180deg,#111718,#070b0c)!important;box-shadow:inset 0 0 28px #0008,0 7px 24px #0004}
    #filters .filter-btn{position:relative;min-width:0;min-height:76px!important;padding:12px 5px 9px!important;overflow:hidden;border:1px solid rgba(203,158,72,.30)!important;background:linear-gradient(180deg,#141a1b,#080c0d)!important;color:#d5d0c5!important;box-shadow:inset 0 1px #ffffff08,inset 0 -14px 24px #0005!important;font:700 10px/1.15 Inter,Arial,sans-serif!important;letter-spacing:.055em!important;text-transform:uppercase;white-space:nowrap;transition:.2s ease!important}
    #filters .filter-btn::before{display:grid;place-items:center;width:34px;height:31px;margin:0 auto 6px;color:#d4a64d;font-size:24px;line-height:1;filter:drop-shadow(0 2px 1px #000);transition:.2s ease}
    #filters .filter-btn::after{content:'';position:absolute;left:20%;right:20%;bottom:0;height:1px;background:linear-gradient(90deg,transparent,#f0cd7f,transparent);opacity:0;transition:.2s ease}
    #filters .filter-btn:hover{z-index:1;transform:translateY(-2px);border-color:#b78b40!important;color:#f0d99f!important;box-shadow:inset 0 0 20px #d4a64d12,0 7px 17px #0007!important}
    #filters .filter-btn:hover::before{transform:scale(1.08);filter:drop-shadow(0 0 6px #d4a64d55)}
    #filters .filter-btn.active{z-index:2;transform:translateY(-2px);border-color:#e1b55d!important;background:radial-gradient(circle at 50% 10%,#9a6d2b3f,transparent 50%),linear-gradient(180deg,#342719,#15110c)!important;color:#fff0c6!important;box-shadow:inset 0 0 25px #f0c1641f,0 0 10px #d4a64d25,0 7px 18px #0008!important;text-shadow:0 0 10px #f0cd7f33}
    #filters .filter-btn.active::after{opacity:1}
    #filters .filter-btn.active::before{color:#f3ca69!important;filter:drop-shadow(0 0 7px #d4a64d88)}
    #filters .filter-btn[data-filter='Wszystkie']::before{content:'✦';font-family:Georgia,serif;font-size:31px}
    #filters .filter-btn[data-filter='RB']::before{content:'☠';font-size:29px;color:#d7c09a}
    #filters .filter-btn[data-filter='Epic RB']::before{content:'♦';font-family:Georgia,serif;font-size:31px;color:#bd62c5;text-shadow:0 0 7px #8f39a066}
    #filters .filter-btn[data-filter='Clan Hall']::before{content:'♜';font-family:Georgia,serif;font-size:31px;color:#d8aa57}
    #filters .filter-btn[data-filter='Siege']::before{content:'⚔';font-size:29px;color:#d77e5d}
    #filters .filter-btn[data-filter='Olympiad']::before{content:'❧';font-family:Georgia,serif;font-size:32px;color:#86bfd3;transform:rotate(-18deg)}
    #filters .filter-btn[data-filter='Event']::before{content:'⚑';font-size:29px;color:#87b978}
    #filters .filter-btn[data-filter='Olympiad']:hover::before,#filters .filter-btn[data-filter='Olympiad'].active::before{transform:rotate(-18deg) scale(1.08)}
    @media(max-width:1050px){#filters.filters{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
    @media(max-width:620px){#filters.filters{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}#filters .filter-btn{min-height:66px!important;font-size:9px!important}#filters .filter-btn::before{font-size:25px!important}}
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

const dateKey = now => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function renderEventDays(events, renderEvent, now = new Date()) {
  const today = dateKey(now);
  const nextDay = new Date(`${today}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate()+1);
  const tomorrow = nextDay.toISOString().slice(0,10);
  const groups = new Map();
  for (const event of events) {
    if (!groups.has(event.event_date)) groups.set(event.event_date, []);
    groups.get(event.event_date).push(event);
  }
  return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([date,items])=>{
    const day = new Date(`${date}T12:00:00Z`);
    const label = day.toLocaleDateString('pl-PL',{timeZone:'Europe/Warsaw',weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const relative = date===today?'Dzisiaj':date===tomorrow?'Jutro':'';
    return `<section class="zone-event-day${date===today?' is-today':''}"><header class="zone-event-day-heading"><div>${relative?`<span class="zone-event-day-relative">${relative}</span>`:''}<h4><time datetime="${date}">${label}</time></h4></div><span class="zone-event-day-count">Wydarzenia: ${items.length}</span></header><div class="zone-event-day-rows">${items.map(renderEvent).join('')}</div></section>`;
  }).join('');
}

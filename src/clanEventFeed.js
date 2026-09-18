import { BOSS_RESPAWN_BOSSES, publicRespawnEvents, publicEventKey, localDateTimeToDate } from './bossRespawns.js';
import { publicSiegeEvents, castleFromEvent, siegePublicKey } from './siegeSchedules.js';
import { withOlympiadEvents } from './olympiadSchedule.js';
import { applyTerritoryOwners } from './territoryOwnership.js';

const normalized = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
export function clanUpcomingEvents(ordinary, bosses, sieges, now = new Date(), ownership = []) {
  const respawns = publicRespawnEvents(bosses, now, { allStatic: true });
  const siegeEvents = publicSiegeEvents(sieges, now);
  const managed = new Set(BOSS_RESPAWN_BOSSES.map(normalized));
  const siegeKeys = new Set(siegeEvents.map(siegePublicKey));
  const manualIds = new Map(ordinary.filter(e => /^\d+$/.test(String(e.id))).map(e => [publicEventKey(e), String(e.id)]));
  const merged = withOlympiadEvents([
    ...ordinary.filter(e => !e.isPvpSchedule && ![e.boss,e.name].some(n => managed.has(normalized(n)))
      && !(e.type === 'Siege' && castleFromEvent(e) && siegeKeys.has(siegePublicKey(e)))),
    ...respawns, ...siegeEvents,
  ], now);
  return applyTerritoryOwners(merged, ownership).map(e => {
    const start = e.startAt ? new Date(e.startAt) : localDateTimeToDate(e.date, e.time);
    const end = e.endAt ? new Date(e.endAt) : new Date(start?.getTime() + (e.duration || 60) * 60000);
    const id = manualIds.get(publicEventKey(e)) || String(e.id);
    return {...e, id, event_date:e.date, event_time:e.time, startAt:start?.toISOString(), endAt:end.toISOString()};
  }).filter(e => new Date(e.endAt) > now).sort((a,b) => new Date(a.startAt)-new Date(b.startAt));
}

let sources = null;
let signature = '';
const listeners = new Set();
export function publishClanEventSources(ordinary, bosses, sieges, ownership = []) {
  sources = {ordinary, bosses, sieges, ownership};
  const next = JSON.stringify(clanUpcomingEvents(ordinary,bosses,sieges,new Date(),ownership));
  if(next === signature) return;
  signature = next;
  listeners.forEach(listener => listener());
}
export function getClanUpcomingEvents(now = new Date()) {
  return sources ? clanUpcomingEvents(sources.ordinary,sources.bosses,sources.sieges,now,sources.ownership) : [];
}
export function subscribeClanEvents(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function signupIdentity(id) {
  return /^\d+$/.test(String(id)) ? {event_id:String(id),schedule_key:null} : {event_id:null,schedule_key:String(id)};
}

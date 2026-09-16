import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clanUpcomingEvents,signupIdentity} from '../src/clanEventFeed.js';
import {publicRespawnEvents} from '../src/bossRespawns.js';
const now=new Date('2026-09-16T02:20:00Z');
const bosses=[{boss:'Queen Ant',window_start:'2026-09-16T02:33:00Z',window_end:'2026-09-16T03:03:00Z'},{boss:'Orfen',window_start:'2026-09-16T16:09:00Z',window_end:'2026-09-16T16:39:00Z'}];
const manual=[{id:'9',name:'Valakas',boss:'Valakas',type:'Epic RB',date:'2026-09-27',time:'22:00'}];
test('clan list includes today respawns, Olympiad and Antharas before Valakas',()=>{
 const events=clanUpcomingEvents(manual,bosses,[],now);
 assert.ok(events.some(e=>e.name==='Queen Ant'&&e.event_time==='04:33'));
 assert.ok(events.some(e=>e.name==='Orfen'&&e.event_time==='18:09'));
 assert.ok(events.some(e=>e.isOlympiadSchedule&&e.event_date==='2026-09-16'));
 const antharas=events.find(e=>e.name==='Antharas'),valakas=events.find(e=>e.name==='Valakas');
 assert.equal(antharas.event_date,'2026-09-20');assert.equal(valakas.event_date,'2026-09-27');
 assert.ok(events.indexOf(antharas)<events.indexOf(valakas));
 assert.equal(events.filter(e=>e.name==='Valakas').length,1);assert.equal(valakas.id,'9');
});
test('all events are retained beyond 20 entries and expired windows drop out',()=>{
 const ordinary=Array.from({length:30},(_,i)=>({id:String(i+20),name:'Meeting '+i,type:'Event',date:'2026-09-18',time:'19:00'}));
 const events=clanUpcomingEvents(ordinary,bosses,[],new Date('2026-09-16T03:03:00Z'));
 assert.equal(events.filter(e=>e.name.startsWith('Meeting')).length,30);
 assert.ok(!events.some(e=>e.name==='Queen Ant'));
});
test('active windows remain until their end; Warsaw dates do not depend on browser zone',()=>{
 const events=clanUpcomingEvents([],bosses,[],new Date('2026-09-16T02:50:00Z'));
 assert.equal(events[0].name,'Queen Ant');assert.equal(events[0].startAt,'2026-09-16T02:33:00.000Z');
 const midnight=clanUpcomingEvents([{id:'123',name:'Midnight',date:'2026-09-17',time:'00:05',type:'Event'}],[],[],new Date('2026-09-16T22:00:00Z'));
 assert.ok(midnight.some(e=>e.name==='Midnight'&&e.startAt==='2026-09-16T22:05:00.000Z'));
});
test('existing public alternating boss policy is preserved',()=>{
 assert.equal(publicRespawnEvents([],now).filter(e=>['Antharas','Valakas'].includes(e.name)).length,1);
});
test('scheduled attendance never sends a virtual key to a bigint event foreign key',()=>{
 assert.deepEqual(signupIdentity('9'),{event_id:'9',schedule_key:null});
 assert.deepEqual(signupIdentity('boss-respawn-antharas-2026-09-20'),{event_id:null,schedule_key:'boss-respawn-antharas-2026-09-20'});
});

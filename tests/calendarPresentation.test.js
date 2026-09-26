import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './publicAppHarness.js';

test('day strip spans month boundary, counts all events and respects selected-day filters', t => {
  const { run, element } = app(t, '2026-09-30T10:00:00Z');
  run(`events = [{id:'raid',name:'Raid',type:'RB',date:'2026-10-01',time:'18:00',duration:60}];
    selectedDay = new Date('2026-10-01T12:00:00'); filter = 'RB'; renderCalendar();`);
  const week = element('#calendarWeek').innerHTML;
  assert.equal((week.match(/data-calendar-day=/g) || []).length, 29);
  assert.match(week, /data-calendar-day="2026-09-28"/);
  assert.match(week, /data-calendar-day="2026-10-04"/);
  assert.match(week, /data-calendar-day="2026-10-01" aria-pressed="true" aria-label="[^"]*3 wydarzenia"/);
  assert.match(element('#dailyEvents').innerHTML, /Raid/);
  assert.doesNotMatch(element('#dailyEvents').innerHTML, /OLYMPIAD/);
  run(`selectedDay = new Date('2026-10-03T12:00:00'); renderCalendar();`);
  assert.match(element('#dailyEvents').innerHTML, /Brak wydarzeń/);
});

test('rows distinguish completed, active and nearest upcoming; clock advances states', t => {
  const { run, element } = app(t, '2026-09-17T10:00:00Z');
  run(`events = [
    {id:'past',name:'Past',type:'RB',date:'2026-09-17',time:'09:00',startAt:'2026-09-17T08:00:00Z',duration:30},
    {id:'active',name:'Active',type:'RB',date:'2026-09-17',time:'11:30',startAt:'2026-09-17T09:30:00Z',endAt:'2026-09-17T10:30:00Z',duration:60,isBossRespawn:true},
    {id:'next',name:'Next',type:'RB',date:'2026-09-17',time:'12:15',startAt:'2026-09-17T10:15:00Z',duration:30}
  ]; selectedDay = new Date('2026-09-17T12:00:00'); filter = 'RB'; renderCalendar();`);
  let html = element('#dailyEvents').innerHTML;
  assert.equal((html.match(/data-calendar-state="active"/g) || []).length, 1);
  assert.equal((html.match(/data-calendar-state="completed"/g) || []).length, 1);
  assert.equal((html.match(/data-calendar-nearest="true"/g) || []).length, 1);
  assert.match(html, />TRWA<\/b>/);
  t.mock.timers.setTime(new Date('2026-09-17T10:20:00Z').getTime());
  run('refreshCalendarClock();');
  html = element('#dailyEvents').innerHTML;
  assert.equal((html.match(/data-calendar-state="active"/g) || []).length, 2);
  assert.doesNotMatch(html, /data-calendar-nearest="true"/);
});

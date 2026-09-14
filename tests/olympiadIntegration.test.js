import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './publicAppHarness.js';

test('earlier ordinary Event takes the featured card; an active boss retains its priority', t => {
  const { run, element } = app(t, '2026-09-14T18:01:00Z');
  run(`ordinaryEvents = [{id:'meeting', name:'Spotkanie', type:'Event', date:'2026-09-14', time:'20:00', startAt:'2026-09-14T19:00:00Z', duration:60}]; mergePublicEvents(); renderNext();`);
  assert.equal(element('#nextName').textContent, 'Spotkanie');
  t.mock.timers.setTime(Date.parse('2026-09-14T20:45:00Z'));
  run(`ordinaryEvents = []; bossRespawnRows = [{boss:'Queen Ant', window_start:'2026-09-14T20:40:00Z', window_end:'2026-09-14T21:10:00Z'}]; mergePublicEvents(); renderNext();`);
  assert.equal(element('#nextName').textContent, 'Queen Ant');
  assert.equal(element('#nextStatus').textContent, 'RESPAWN WINDOW ACTIVE');
});

test('featured Olympiad switches countdown to its end and rolls Friday into Monday', t => {
  const { run, element } = app(t, '2026-09-18T20:29:00Z');
  run('mergePublicEvents(); renderNext(); updateCountdown();');
  assert.equal(element('#nextName').textContent, 'OLYMPIAD');
  assert.equal(element('#nextStatus').textContent, 'NADCHODZI');
  assert.equal(element('#countdown').innerHTML.replace(/<[^>]*>/g, ''), '00:00:01:00');
  t.mock.timers.setTime(Date.parse('2026-09-18T20:45:00Z'));
  run('refreshDynamicEvents(); renderNext(); updateCountdown();');
  assert.equal(element('#nextStatus').textContent, 'OLYMPIAD ACTIVE');
  assert.equal(element('#countdownLabel').textContent, 'Do zakończenia');
  assert.equal(element('#countdown').innerHTML.replace(/<[^>]*>/g, ''), '00:00:45:00');
  t.mock.timers.setTime(Date.parse('2026-09-18T21:30:00Z'));
  run('refreshDynamicEvents(); renderNext(); updateCountdown();');
  assert.equal(run('getUpcoming().find(e => e.isOlympiadSchedule).date'), '2026-09-21');
  // Daily PvP is excluded, so Baium is the next important event.
  assert.equal(element('#nextName').textContent, 'Baium');
  assert.equal(element('#nextStatus').textContent, 'NADCHODZI');
  assert.equal(element('#countdownLabel').textContent, 'Do rozpoczęcia');
  t.mock.timers.setTime(Date.parse('2026-09-21T20:01:00Z'));
  run('refreshDynamicEvents(); renderNext(); updateCountdown();');
  assert.equal(element('#nextName').textContent, 'OLYMPIAD');
  assert.match(element('#nextMeta').textContent, /poniedziałek, 21 września 2026.*22:30–23:30/);
});

test('calendar filter shows a future winter term and no weekend session', t => {
  const { run, element } = app(t, '2026-09-14T10:00:00Z');
  run(`mergePublicEvents(); selectedDay = new Date('2026-10-26T12:00:00'); filter = 'Olympiad'; renderCalendar();`);
  assert.match(element('#dailyEvents').innerHTML, /OLYMPIAD/);
  assert.match(element('#dailyEvents').innerHTML, /21:30–22:30/);
  run(`selectedDay = new Date('2026-09-19T12:00:00'); renderCalendar();`);
  assert.match(element('#dailyEvents').innerHTML, /Brak wydarzeń/);
});

test('today, upcoming and read-only panel show the Warsaw window with no manual duplicate', t => {
  const { run, element } = app(t, '2026-09-14T20:01:00Z');
  run(`ordinaryEvents = [{id:'manual', name:'Olympiada', type:'Olympiad', date:'2026-09-14', time:'22:30', duration:60}]; adminEvents = ordinaryEvents; mergePublicEvents(); renderOverview(); renderOlympiadPanel($('#olympiadSchedule'));`);
  assert.equal(run('events.filter(e => e.type === "Olympiad").length'), 1);
  assert.equal(run('adminEvents.length'), 1);
  for (const selector of ['#todayEvents', '#upcomingEvents']) assert.match(element(selector).innerHTML, /22:30–23:30/);
  assert.match(element('[data-olympiad-date]').textContent, /14 września 2026/);
  assert.equal(element('[data-olympiad-time]').textContent, '22:30–23:30 · Europe/Warsaw');
  assert.equal(element('[data-olympiad-server]').textContent, 'Server time: 20:30–21:30 UTC');
  assert.equal(element('[data-olympiad-status]').textContent, 'NADCHODZI');
});

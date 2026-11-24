import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './publicAppHarness.js';
import { renderPvpEventPanel, renderPvpSidebar, updatePvpRowCountdowns } from '../src/pvpEventPanel.js';
import { PVP_EVENTS } from '../src/pvpEventSchedule.js';

// Small DOM stand-in for the actual card renderers; no live clients or writes.
function panelRoot() {
  const fields = new Map();
  return {
    innerHTML: '', dataset: {},
    querySelector(selector) {
      if (selector === '[data-pvp-slot-card]') return this.innerHTML.includes('data-pvp-slot-card') ? {} : null;
      const attribute = selector.slice(1, -1);
      if (selector.startsWith('[data-') && !this.innerHTML.includes(attribute)) return null;
      if (!fields.has(selector)) fields.set(selector, {
        textContent: '', innerHTML: '', dataset: {}, style: {}, attributes: new Map(),
        setAttribute(name, value) { this.attributes.set(name, value); },
      });
      return fields.get(selector);
    },
  };
}

const field = (root, name) => root.querySelector('[data-pvp-' + name + ']').textContent;

test('EVENT calendar filter keeps ordinary events while hiding automatic PvP', t => {
  const { run, element } = app(t, '2026-09-14T09:59:00Z');
  run(`ordinaryEvents = [
    {id:'manual', name:'multi team battle', type:'Event', date:'2026-09-14', time:'12:00', duration:60},
    {id:'meeting', name:'Spotkanie', type:'Event', date:'2026-09-14', time:'19:30', duration:30}
  ]; adminEvents = ordinaryEvents; mergePublicEvents(); filter = 'Event'; selectedDay = new Date('2026-09-14T12:00:00'); renderCalendar(); renderOverview();`);
  const html = element('#dailyEvents').innerHTML;
  assert.equal((html.match(/class="event-row"/g) ?? []).length, 1);
  assert.match(html, /Spotkanie/);
  assert.doesNotMatch(html, /OLYMPIAD|Baium/);
  assert.equal(run('adminEvents.length'), 2);
  for (const selector of ['#todayEvents', '#upcomingEvents']) {
    assert.doesNotMatch(element(selector).innerHTML, /Multi Team Battle|Capture The Base|Death Match|Epic Boss Challenge/);
  }
  assert.match(element('#pvpSidebarEvents').innerHTML, /Multi Team Battle/);
});

test('automatic PvP is shown only in its dedicated panel while ordinary Event remains public', t => {
  const { run, element } = app(t, '2026-09-14T09:00:00Z');
  run(`ordinaryEvents = [{id:'manual', name:'Clan Meeting', type:'Event', date:'2026-09-14', time:'13:00', duration:30}]; adminEvents = ordinaryEvents; mergePublicEvents(); selectedDay = new Date('2026-09-14T12:00:00'); filter = 'Wszystkie'; renderCalendar(); renderOverview(); renderNext();`);
  for (const selector of ['#dailyEvents', '#todayEvents', '#upcomingEvents']) {
    const html = element(selector).innerHTML;
    assert.doesNotMatch(html, /Multi Team Battle|Capture The Base|Epic Boss Challenge|Death Match/);
  }
  assert.match(element('#dailyEvents').innerHTML, /Clan Meeting/);
  run(`filter = 'Event'; renderCalendar();`);
  assert.match(element('#dailyEvents').innerHTML, /Clan Meeting/);
  assert.doesNotMatch(element('#dailyEvents').innerHTML, /Multi Team Battle|Capture The Base|Epic Boss Challenge|Death Match/);
  assert.match(element('#pvpSidebarEvents').innerHTML, /Multi Team Battle/);
  assert.match(element('#pvpSidebarEvents').innerHTML, /Capture The Base/);
  assert.match(element('#pvpSidebarEvents').innerHTML, /Epic Boss Challenge/);
  assert.match(element('#pvpSidebarEvents').innerHTML, /Death Match/);
  assert.doesNotMatch(element('#nextName').textContent, /Multi Team Battle|Capture The Base|Epic Boss Challenge|Death Match/);
});

test('automatic PvP slots stay out of the main card before and after each draw', t => {
  const { run, element } = app(t, '2026-09-14T09:59:00Z');
  for (const hour of [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]) {
    for (const offset of [-1000, 0, 1000]) {
      t.mock.timers.setTime(Date.parse('2026-09-14T00:00:00Z') + hour * 3600000 + offset);
      run('mergePublicEvents(); renderNext(); updateCountdown();');
      assert.equal(run('getUpcoming().some(event => event.isPvpSchedule)'), false);
      assert.doesNotMatch(element('#nextName').textContent, /Auto PvP/i);
      assert.ok(!PVP_EVENTS.some(event => event.name === element('#nextName').textContent));
    }
  }
  // With only automatic PvP in memory the hero stays empty, including its clock.
  run('events = events.filter(event => event.isPvpSchedule); renderNext(); updateCountdown();');
  assert.equal(element('#nextName').textContent, 'BRAK NADCHODZĄCYCH WYDARZEŃ');
  assert.equal(element('#countdown').innerHTML.replace(/<[^>]*>/g, ''), '00:00:00:00');
});

test('ordinary events, Siege and active boss priority still work independently of PvP', t => {
  const { run, element } = app(t, '2026-09-14T17:30:00Z');
  run('mergePublicEvents(); renderNext();');
  assert.equal(element('#nextName').textContent, 'OLYMPIAD');
  run(`ordinaryEvents = [{id:'meeting', name:'Spotkanie', type:'Event', date:'2026-09-14', time:'19:40', startAt:'2026-09-14T17:40:00Z', duration:30}]; mergePublicEvents(); renderNext();`);
  assert.equal(element('#nextName').textContent, 'Spotkanie');
  run(`events.push({id:'siege', name:'Siege Gludio', type:'Siege', date:'2026-09-14', time:'19:35', startAt:'2026-09-14T17:35:00Z', endAt:'2026-09-14T19:35:00Z', duration:120, isSiegeSchedule:true}); renderNext();`);
  assert.equal(element('#nextName').textContent, 'Siege Gludio');
  run(`bossRespawnRows = [{boss:'Queen Ant', window_start:'2026-09-14T17:20:00Z', window_end:'2026-09-14T18:20:00Z'}]; mergePublicEvents(); renderNext(); updateCountdown();`);
  assert.equal(element('#nextName').textContent, 'Queen Ant');
  assert.equal(element('#nextStatus').textContent, 'RESPAWN WINDOW ACTIVE');
  assert.equal(element('#countdown').innerHTML.replace(/<[^>]*>/g, ''), '00:00:50:00');
});

test('automatic PvP status clocks stay confined to their dedicated panel', t => {
  const { run, element } = app(t, '2026-09-14T09:59:00Z');
  run(`mergePublicEvents(); selectedDay = new Date('2026-09-14T12:00:00'); filter = 'Event'; renderCalendar();`);
  for (const instant of ['2026-09-14T10:00:00Z', '2026-09-14T10:05:00Z', '2026-09-14T10:15:00Z']) {
    t.mock.timers.setTime(Date.parse(instant));
    run('refreshDynamicEvents(); renderCalendar(); renderOverview();');
    assert.doesNotMatch(element('#dailyEvents').innerHTML, /REJESTRACJA OTWARTA|EVENT ACTIVE|Death Match|Multi Team Battle/);
    assert.equal(run('getUpcoming().some(event => event.isPvpSchedule)'), false);
  }
});

test('admin panel lists all possible modes and advances the two-hour slot at its start', () => {
  const root = panelRoot();
  renderPvpEventPanel(root, new Date('2026-09-14T09:59:00Z'));
  assert.equal((root.innerHTML.match(/data-pvp-slot-card/g) ?? []).length, 1);
  assert.equal((root.innerHTML.match(/data-pvp-event=/g) ?? []).length, PVP_EVENTS.length);
  assert.doesNotMatch(root.innerHTML, /<button|<input|<form/);
  assert.match(root.innerHTML, /5 Medal [(]Event[)]/);
  for (const definition of PVP_EVENTS) {
    assert.ok(root.innerHTML.includes(definition.name));
    assert.ok(root.innerHTML.includes(definition.command));
  }
  assert.match(field(root, 'local-time'), /^12:00/);
  assert.match(field(root, 'server-time'), /^10:00/);
  assert.equal(field(root, 'countdown'), '00:01:00');

  renderPvpEventPanel(root, new Date('2026-09-14T10:00:00Z'));
  assert.match(field(root, 'local-time'), /^14:00/);
  assert.equal(field(root, 'countdown'), '02:00:00');
});

test('sidebar shows the next slot, its progress and the three following Warsaw starts across midnight', () => {
  const root = panelRoot();
  renderPvpSidebar(root, new Date('2026-09-14T19:00:00Z'));
  assert.match(field(root, 'local-time'), /^22:00/);
  const list = root.querySelector('[data-pvp-next-slot-list]');
  assert.deepEqual([...list.innerHTML.matchAll(/<strong>([^<]+)/g)].map((match) => match[1]), ['00:00', '02:00', '04:00']);
  const progress = root.querySelector('[data-pvp-slot-progress]');
  assert.equal(progress.attributes.get('aria-valuenow'), '50');

  renderPvpSidebar(root, new Date('2026-09-14T20:00:00Z'));
  assert.match(field(root, 'local-time'), /^00:00/);
  assert.deepEqual([...list.innerHTML.matchAll(/<strong>([^<]+)/g)].map((match) => match[1]), ['02:00', '04:00', '06:00']);
  assert.equal(progress.attributes.get('aria-valuenow'), '0');
});

test('row countdowns target the slot start between renders', () => {
  const element = { dataset: { pvpCountdownStart: '2026-09-14T10:00:00Z' }, textContent: '' };
  const root = { querySelectorAll(selector) {
    assert.equal(selector, '[data-pvp-countdown-start]');
    return [element];
  } };
  for (const [instant, expected] of [
    ['2026-09-14T08:00:00Z', '02:00:00'],
    ['2026-09-14T09:59:59Z', '00:00:01'],
    ['2026-09-14T10:00:00Z', 'Startuje teraz'],
  ]) {
    updatePvpRowCountdowns(root, new Date(instant));
    assert.equal(element.textContent, expected);
  }
});

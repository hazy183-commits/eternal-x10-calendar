import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './publicAppHarness.js';
import { renderPvpEventPanel, renderPvpSidebar, updatePvpRowCountdowns } from '../src/pvpEventPanel.js';
import { PVP_EVENTS } from '../src/pvpEventSchedule.js';

// Small DOM stand-in for the actual card renderers; no live clients or writes.
function cardsRoot() {
  const cards = new Map();
  const root = { innerHTML: '', querySelector(selector) {
    if (selector === '[data-pvp-card]') return this.innerHTML ? {} : null;
    if (!cards.has(selector)) {
      const fields = new Map();
      const classes = new Set();
      cards.set(selector, { classes, classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } }, querySelector(field) {
        if (!fields.has(field)) fields.set(field, { textContent: '' });
        return fields.get(field);
      } });
    }
    return cards.get(selector);
  } };
  return root;
}

const field = (card, name) => card.querySelector('[data-pvp-' + name + ']').textContent;

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

test('all four automatic PvP events are excluded from the main card and its countdown in every phase', t => {
  const { run, element } = app(t, '2026-09-14T09:59:00Z');
  for (const hour of [0, 2, 4, 6]) {
    for (const offset of [-60000, 0, 299000, 300000, 899000, 900000]) {
      t.mock.timers.setTime(Date.parse('2026-09-14T00:00:00Z') + hour * 3600000 + offset);
      run('mergePublicEvents(); renderNext(); updateCountdown();');
      assert.equal(run('getUpcoming().some(event => event.isPvpSchedule)'), false);
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

test('admin cards preserve commands/rewards and advance only after the full 15-minute cycle', () => {
  const root = cardsRoot();
  renderPvpEventPanel(root, new Date('2026-09-14T09:59:00Z'));
  assert.equal((root.innerHTML.match(/<article /g) ?? []).length, 4);
  assert.doesNotMatch(root.innerHTML, /<button|<input|<form|USTAW TERMIN/);
  assert.equal((root.innerHTML.match(/5 Medal \(Event\)/g) ?? []).length, 4);
  for (const definition of PVP_EVENTS) {
    assert.ok(root.innerHTML.includes(definition.name));
    assert.ok(root.innerHTML.includes(definition.command));
  }
  const card = root.querySelector('[data-pvp-card="multi-team-battle"]');
  assert.equal(field(card, 'time'), '12:00 · Europe/Warsaw');
  assert.equal(field(card, 'utc'), '2026-09-14 · 10:00 UTC');
  assert.equal(field(card, 'registration'), '12:00–12:05');
  assert.equal(field(card, 'event'), '12:05–12:15');
  for (const [instant, status, countdown] of [
    ['2026-09-14T10:00:00Z', 'REJESTRACJA OTWARTA', 'Start eventu za 05:00'],
    ['2026-09-14T10:04:59Z', 'REJESTRACJA OTWARTA', 'Start eventu za 00:01'],
    ['2026-09-14T10:05:00Z', 'EVENT ACTIVE', 'Koniec za 10:00'],
    ['2026-09-14T10:14:59Z', 'EVENT ACTIVE', 'Koniec za 00:01'],
  ]) {
    renderPvpEventPanel(root, new Date(instant));
    assert.equal(field(card, 'status'), status);
    assert.equal(field(card, 'countdown'), countdown);
    assert.equal(field(card, 'time'), '12:00 · Europe/Warsaw');
    assert.equal(card.classes.has('pvp-registering'), status === 'REJESTRACJA OTWARTA');
    assert.equal(card.classes.has('pvp-active'), status === 'EVENT ACTIVE');
  }
  renderPvpEventPanel(root, new Date('2026-09-14T10:15:00Z'));
  assert.equal(field(card, 'status'), 'NADCHODZI');
  assert.equal(field(card, 'time'), '20:00 · Europe/Warsaw');
});

test('compact sidebar shows all four configured cycles in stable order, highlights phases and rolls midnight correctly', () => {
  const root = cardsRoot();
  renderPvpSidebar(root, new Date('2026-09-14T21:59:00Z'));
  assert.equal((root.innerHTML.match(/<article /g) ?? []).length, 4);
  const order = ['Multi Team Battle', 'Capture The Base', 'Epic Boss Challenge', 'Death Match'].map(name => root.innerHTML.indexOf(name));
  assert.ok(order.every(index => index >= 0));
  assert.ok(order[0] < order[1] && order[1] < order[2] && order[2] < order[3]);
  const card = root.querySelector('[data-pvp-occurrence="pvp-death-match-2026-09-14-22"]');
  assert.equal(field(card, 'date'), 'JUTRO');
  assert.equal(field(card, 'registration'), '00:00–00:05');
  assert.equal(field(card, 'event'), '00:05–00:15');
  renderPvpSidebar(root, new Date('2026-09-14T22:00:00Z'));
  assert.equal(field(card, 'status'), 'REJESTRACJA OTWARTA');
  assert.equal(card.classes.has('pvp-registering'), true);
  renderPvpSidebar(root, new Date('2026-09-14T22:05:00Z'));
  assert.equal(field(card, 'status'), 'EVENT ACTIVE');
  assert.equal(card.classes.has('pvp-active'), true);
  renderPvpSidebar(root, new Date('2026-09-14T22:15:00Z'));
  assert.doesNotMatch(root.innerHTML, /pvp-death-match-2026-09-14-22/);
  assert.ok(root.innerHTML.includes('Epic Boss Challenge'));
  assert.equal((root.innerHTML.match(/<article /g) ?? []).length, 4);
});

test('calendar counters use the phase target between rerenders', () => {
  const elements = [
    { dataset: { pvpCountdownStart: '2026-09-14T10:00:00Z' }, textContent: '' },
    { dataset: { pvpCountdownStart: '2026-09-14T08:00:00Z' }, textContent: '' },
  ];
  const root = { querySelectorAll(selector) {
    assert.equal(selector, '[data-pvp-countdown-start]');
    return elements;
  } };
  for (const [instant, text] of [
    ['2026-09-14T09:59:00Z', 'Rejestracja za 00:01:00'],
    ['2026-09-14T10:01:39Z', 'Start eventu za 03:21'],
    ['2026-09-14T10:07:18Z', 'Koniec za 07:42'],
    ['2026-09-14T10:15:00Z', 'Zakończone'],
  ]) {
    updatePvpRowCountdowns(root, new Date(instant));
    assert.equal(elements[0].textContent, text);
    assert.equal(elements[1].textContent, 'Zakończone');
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTimes, parseOcrText, respawnCropRect, serverWindowToWarsaw } from '../src/epicRespawnScreenshotImport.js';

test('dates are never reused as respawn times', () => {
  assert.deepEqual(extractTimes('Queen Ant 17.09.2026 04:34 - 05:04'), ['04:34', '05:04']);
  assert.deepEqual(extractTimes('Frintezza 417.09,2026 12:50 - 13:20'), ['12:50', '13:20']);
});

test('an already cropped, wide Epic table is not cropped a second time', () => {
  assert.deepEqual(respawnCropRect(647, 154), { x: 0, y: 0, width: 647, height: 154, tableLike: true });
  assert.deepEqual(respawnCropRect(1536, 1128), { x: 38, y: 192, width: 1459, height: 451, tableLike: false });
});

test('known Epic table rows keep their own dates and windows', () => {
  const rows = parseOcrText(`
    Queen Ant Dead 17.09.2026 04:34 - 05:04
    Core Dead 17.09.2026 10:45 - 11:15
    Orfen Dead 16.09.2026 15:55 - 16:25
    Zaken Dead 17.09.2026 18:56 - 19:26
    Frintezza Dead 17.09.2026 12:50 - 13:20
    Server Time: 11:18 16.09.2026
  `);
  assert.deepEqual(rows.map(({ boss, date, start, end }) => ({ boss, date, start, end })), [
    { boss: 'Queen Ant', date: '2026-09-17', start: '04:34', end: '05:04' },
    { boss: 'Core', date: '2026-09-17', start: '10:45', end: '11:15' },
    { boss: 'Orfen', date: '2026-09-16', start: '15:55', end: '16:25' },
    { boss: 'Zaken', date: '2026-09-17', start: '18:56', end: '19:26' },
    { boss: 'Frintezza', date: '2026-09-17', start: '12:50', end: '13:20' },
  ]);
});

test('server UTC windows are converted to Warsaw time with date rollover', () => {
  assert.deepEqual(serverWindowToWarsaw({ date: '2026-09-17', start: '04:34', end: '05:04' }), {
    date: '2026-09-17', start: '06:34', end: '07:04', endDate: '2026-09-17',
  });
  assert.deepEqual(serverWindowToWarsaw({ date: '2026-09-17', start: '23:30', end: '00:15' }), {
    date: '2026-09-18', start: '01:30', end: '02:15', endDate: '2026-09-18',
  });
});

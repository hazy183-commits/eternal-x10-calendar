import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSiegeScreenshotText, siegeCropRect, siegeServerTimeToPoland, siegePolandTimeToServer } from '../src/siegeScreenshotImport.js';
import { SIEGE_CASTLES } from '../src/siegeSchedules.js';

test('Siege OCR keeps dates and times tied to individual castle rows', () => {
  const rows = parseSiegeScreenshotText(`
    Gludio 17.10.2026 18:00
    Dion 17.10.2026 18:00
    Giran 18.10.2026 18:00
    Oren 18.10.2026 18:00
    Aden 25.10.2026 18:00
    Innadril 25.10.2026 18:00
    Goddard 01.11.2026 18:00
    Rune 01.11.2026 18:00
    Schuttgart 08.11.2026 18:00
  `);
  assert.equal(rows.length, 9);
  assert.deepEqual(rows.find((row) => row.castle === 'Giran'), {
    castle: 'Giran', reference_date: '2026-10-18', reference_time: '18:00',
  });
  assert.deepEqual(rows.map((row) => row.castle), SIEGE_CASTLES);
});

test('OCR digit confusions and dotted time are normalized without corrupting dates', () => {
  const rows = parseSiegeScreenshotText('Gludio I7.1O.2026 18.00');
  assert.deepEqual(rows, [{
    castle: 'Gludio', reference_date: '2026-10-17', reference_time: '18:00',
  }]);
});

test('a wide, already-cropped table is kept intact like Epic Boss OCR', () => {
  assert.deepEqual(siegeCropRect(900, 220), {
    x: 0, y: 0, width: 900, height: 220, tableLike: true,
  });
  assert.deepEqual(siegeCropRect(1536, 1128), {
    x: 38, y: 192, width: 1459, height: 451, tableLike: false,
  });
});

test('Siege screenshot time is shown in Polish summer and winter time', () => {
  assert.deepEqual(siegeServerTimeToPoland('2026-07-15', '18:00'), { date: '2026-07-15', time: '20:00' });
  assert.deepEqual(siegeServerTimeToPoland('2026-01-15', '18:00'), { date: '2026-01-15', time: '19:00' });
});

test('Siege local preview converts back to server time when saving, including date rollover', () => {
  assert.deepEqual(siegePolandTimeToServer('2026-07-15', '20:00'), { date: '2026-07-15', time: '18:00' });
  assert.deepEqual(siegeServerTimeToPoland('2026-07-15', '23:30'), { date: '2026-07-16', time: '01:30' });
  assert.deepEqual(siegePolandTimeToServer('2026-07-16', '01:30'), { date: '2026-07-15', time: '23:30' });
});

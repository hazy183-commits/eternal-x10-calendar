import test from 'node:test';
import assert from 'node:assert/strict';
import { memberZoneViewForClickTarget } from '../src/memberZoneNavigation.js';

const targetMatching = (...selectors) => ({
  closest(selector) {
    return selectors.includes(selector) ? this : null;
  },
});

test('homepage craft button opens the Craft view', () => {
  assert.equal(memberZoneViewForClickTarget(targetMatching('.craft-home-open')), 'craft');
});

test('sidebar Craft navigation also opens the Craft view', () => {
  assert.equal(memberZoneViewForClickTarget(targetMatching('[data-zone-view="craft"]')), 'craft');
});

test('member-zone header button opens the home view', () => {
  assert.equal(memberZoneViewForClickTarget(targetMatching('.member-auth-entry:not(.logout)')), 'home');
});

test('unrelated buttons are ignored', () => {
  assert.equal(memberZoneViewForClickTarget(targetMatching('.primary-btn')), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeActiveStatus } from '../src/activeEventStatus.js';
import { setLanguage } from '../src/i18nCore.js';

test('active event normalization is stable in both languages for every active event type', () => {
  for (const kind of ['trwa','respawn-window-active','siege-active','olympiad-active']) {
    let value='TRWA',writes=0;
    const status={classList:{contains:name=>name===kind},get textContent(){return value},set textContent(text){value=text;writes++}};
    try {
      setLanguage('en');
      for(let i=0;i<100;i++)normalizeActiveStatus(status);
      assert.equal(value,'IN PROGRESS');assert.equal(writes,1);
      setLanguage('pl');normalizeActiveStatus(status);
      assert.equal(value,'TRWA');assert.equal(writes,2);
    } finally {setLanguage('pl');}
  }
});
test('upcoming and ended event labels are not overwritten by the active event normalizer', () => {
  const status={classList:{contains:()=>false},textContent:'NADCHODZI'};
  normalizeActiveStatus(status);assert.equal(status.textContent,'NADCHODZI');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClanHeader } from '../src/ownerAccessBridge.js';
import { setLanguage } from '../src/i18nCore.js';

test('header observer settles after normalization and leaves timers runnable', async () => {
  let text='♟ Administrator', label=null, mutations=0, callbacks=0;
  const root={querySelectorAll:()=>[entry]};
  const entry={
    classList:{contains:()=>false},
    get textContent(){return text;},
    set textContent(value){
      text=value;mutations++;
      // textContent replaces text nodes even when the value is unchanged.
      queueMicrotask(()=>{if(++callbacks<10)normalizeClanHeader(root);});
    },
    getAttribute:()=>label,
    setAttribute:(_name,value)=>{label=value;},
  };
  normalizeClanHeader(root);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(callbacks,1,'normalizing must not schedule itself forever');
  assert.equal(mutations,1);
  assert.equal(text,'♟ STREFA KLANU');
  assert.equal(label,'Otwórz Strefę Klanu');
  // The clock changes the header subtree every second too.
  for(let i=0;i<60;i++)normalizeClanHeader(root);
  assert.equal(mutations,1,'unrelated header updates must not rewrite the label');
});

test('normalization tolerates missing entry and preserves logout', () => {
  normalizeClanHeader({querySelectorAll:()=>[]});
  const logout={classList:{contains:name=>name==='logout'},textContent:'↪ Wyloguj'};
  normalizeClanHeader({querySelectorAll:()=>[logout]});
  assert.equal(logout.textContent,'↪ Wyloguj');
});

test('English header normalization stays stable and switches back to Polish', () => {
  let text='♟ STREFA KLANU',label='Otwórz Strefę Klanu',writes=0;
  const entry={classList:{contains:()=>false},get textContent(){return text},set textContent(value){text=value;writes++},getAttribute:()=>label,setAttribute:(_,value)=>{label=value}};
  const root={querySelectorAll:()=>[entry]};
  try {
    setLanguage('en');
    for(let i=0;i<60;i++)normalizeClanHeader(root);
    assert.equal(text,'♟ CLAN AREA');
    assert.equal(label,'Open Clan Area');
    assert.equal(writes,1,'language must not make the header observer loop');
    setLanguage('pl');normalizeClanHeader(root);
    assert.equal(text,'♟ STREFA KLANU');
    assert.equal(writes,2);
  } finally {setLanguage('pl');}
});

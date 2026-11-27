import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessClanView, switchClanView } from '../src/clanViewAccess.js';
for (const role of ['member', 'owner', 'admin', 'leader', 'unknown']) {
  for (const status of ['approved', 'pending', 'blocked']) {
    test(`${role}/${status}: restricted views`, () => {
      const p = {role, status};
      assert.equal(canAccessClanView(p,'content-editor'), status==='approved' && ['owner','admin'].includes(role));
      assert.equal(canAccessClanView(p,'recruitment'), status==='approved' && ['owner','admin','leader'].includes(role));
      assert.equal(canAccessClanView(p,'events'),true);
    });
  }
}
test('manual switch cannot activate restricted panels, including after owner loses access', () => {
  const views=['home','events','recruitment','content-editor'];
  const element=(key,value)=>({dataset:{[key]:value},active:false,classList:{toggle(_name,active){this.element.active=active}}});
  const nav=views.map(v=>element('zoneView',v)), panels=views.map(v=>element('zonePanel',v));
  [...nav,...panels].forEach(e=>e.classList.element=e);
  const zone={querySelectorAll:s=>s==='.zone-nav'?nav:panels,querySelector:()=>({scrollTop:50})};
  for(const view of ['recruitment','content-editor']) {
    assert.equal(switchClanView(zone,{role:'owner',status:'approved'},view),view);
    for(const profile of [null,{role:'member',status:'approved'},{role:'owner',status:'blocked'}]) {
      assert.equal(switchClanView(zone,profile,view),'home');
      assert.deepEqual(panels.filter(p=>p.active).map(p=>p.dataset.zonePanel),['home']);
      assert.deepEqual(nav.filter(p=>p.active).map(p=>p.dataset.zoneView),['home']);
    }
  }
});

test('group-craft navigation keeps the Craft panel active while selecting the group entry', () => {
  const nav = ['craft', 'group-craft', 'home'].map(view => ({
    dataset: { zoneView: view },
    active: false,
    classList: { toggle(_name, active) { this.element.active = active; } },
  }));
  const panels = ['craft', 'home'].map(view => ({
    dataset: { zonePanel: view },
    active: false,
    classList: { toggle(_name, active) { this.element.active = active; } },
  }));
  [...nav, ...panels].forEach(element => { element.classList.element = element; });
  const zone = {
    querySelectorAll(selector) { return selector === '.zone-nav' ? nav : panels; },
    querySelector() { return { scrollTop: 50 }; },
  };

  assert.equal(switchClanView(zone, { role: 'owner', status: 'approved' }, 'group-craft'), 'group-craft');
  assert.deepEqual(nav.filter(item => item.active).map(item => item.dataset.zoneView), ['group-craft']);
  assert.deepEqual(panels.filter(item => item.active).map(item => item.dataset.zonePanel), ['craft']);
});

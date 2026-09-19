import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPanelSwitcher } from '../src/persistentHeader.js';
function setup() { const open = new Set(); return {open, switcher:createPanelSwitcher({close:p=>open.delete(p),isOpen:p=>open.has(p)})}; }
test('switching either direction closes the previous panel',()=>{ const {open,switcher}=setup();for(const panel of ['admin','clan','admin','clan']){switcher.request(panel);open.add(panel);switcher.opened(panel);assert.deepEqual([...open],[panel]);}});
test('a delayed previous opening cannot cover the last requested panel',()=>{const {open,switcher}=setup();switcher.request('clan');switcher.request('admin');open.add('admin');switcher.opened('admin');open.add('clan');switcher.opened('clan');assert.deepEqual([...open],['admin']);});
test('programmatic first opening closes another panel and home closes both',()=>{const {open,switcher}=setup();open.add('admin');open.add('clan');switcher.opened('clan');assert.deepEqual([...open],['clan']);switcher.request(null);assert.equal(open.size,0);});
test('returning home rejects an outstanding asynchronous opening',()=>{const {open,switcher}=setup();switcher.request('clan');switcher.request(null);open.add('clan');switcher.opened('clan');assert.equal(open.size,0);});

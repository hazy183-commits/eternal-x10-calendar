import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as pvp from '../src/pvpEventSchedule.js';
import { renderPvpEventPanel, renderPvpSidebar, updatePvpRowCountdowns } from '../src/pvpEventPanel.js';
import * as olympiad from '../src/olympiadSchedule.js';
import * as bosses from '../src/bossRespawns.js';
import * as sieges from '../src/siegeSchedules.js';
import { renderOlympiadPanel } from '../src/olympiadPanel.js';

// Run the real public rendering/merge code with a local DOM stand-in and an inert
// app bootstrap. Repository constructors cannot access Supabase in these tests.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '');

export function app(t, iso) {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(iso) });
  const elements = new Map();
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, {
      textContent: '', innerHTML: '', className: '', classList: { toggle() {} }, querySelector: element,
    });
    return elements.get(selector);
  };
  const context = vm.createContext({
    ...olympiad, ...bosses, ...sieges, ...pvp, renderOlympiadPanel, renderPvpEventPanel, renderPvpSidebar, updatePvpRowCountdowns,
    Date, Intl, console: { log() {} },
    SupabaseEventRepository: class {}, SupabaseBossRespawnRepository: class {}, SupabaseSiegeScheduleRepository: class {},
    applyBossArtwork() {}, refreshBossArtwork() {},
    document: { readyState: 'loading', addEventListener() {}, querySelector: element },
  });
  vm.runInContext(source, context);
  return { run: (code) => vm.runInContext(code, context), element };
}


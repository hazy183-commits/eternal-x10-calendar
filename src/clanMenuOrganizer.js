const GROUPS = [
  { key: 'planning', label: 'PLANOWANIE', views: ['events', 'signups', 'polls'] },
  { key: 'clan', label: 'KLAN', views: ['announcements', 'profile', 'members', 'recruitment', 'attendance'] },
  { key: 'tools', label: 'NARZĘDZIA', views: ['needed-rb', 'craft'] },
  { key: 'admin', label: 'ADMINISTRACJA', views: ['content-editor'] },
];

const VIEW_TO_GROUP = new Map(GROUPS.flatMap(group => group.views.map(view => [view, group.key])));
const STORAGE_KEY = 'ob-clan-menu-groups-v1';

function readOpenState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.fromEntries(GROUPS.map(group => [group.key, saved[group.key] === true || (saved[group.key] === undefined && group.key === 'planning')]));
  } catch {
    return Object.fromEntries(GROUPS.map(group => [group.key, group.key === 'planning']));
  }
}

function writeOpenState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable in private browsing; menu still works for this session.
  }
}

export function installClanMenuOrganizer() {
  if (typeof document === 'undefined' || window.__obClanMenuOrganizerInstalled) return;
  window.__obClanMenuOrganizerInstalled = true;

  const wait = () => {
    const zone = document.querySelector('#memberZoneLayer');
    const side = zone?.querySelector('.member-zone-side');
    const main = zone?.querySelector('.member-zone-main');
    if (!zone || !side || !main) {
      setTimeout(wait, 150);
      return;
    }
    boot(zone, side, main);
  };

  function boot(zone, side, main) {
    const openState = readOpenState();
    const groups = new Map();
    let scheduled = false;

    const css = document.createElement('style');
    css.textContent = [
      '.ob-menu-group{display:grid;gap:3px;margin:3px 0}',
      '.ob-menu-group-trigger{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;border:1px solid #3d3220;background:linear-gradient(90deg,#17140e,#0d1010);color:#d8b05e;text-align:left;font-size:10px;font-weight:900;letter-spacing:.08em;cursor:pointer}',
      '.ob-menu-group-trigger:hover,.ob-menu-group.is-open>.ob-menu-group-trigger{border-color:#80612d;background:linear-gradient(90deg,#3a2812,#17140d);color:#f0cf7e}',
      '.ob-menu-group-icon{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;border:1px solid currentColor;border-radius:4px;color:inherit;font-size:13px;line-height:1}',
      '.ob-menu-group-trigger b{margin-left:auto;color:#8c7446;font-size:14px;transition:transform .18s ease}',
      '.ob-menu-group.is-open>.ob-menu-group-trigger b{transform:rotate(180deg)}',
      '.ob-menu-group-items{display:none;gap:2px;padding-left:8px}',
      '.ob-menu-group.is-open>.ob-menu-group-items{display:grid}',
      '.ob-menu-group-items .zone-nav{margin:0;padding-left:9px;font-size:10px}',
      '.ob-menu-group-items .zone-nav-icon{flex-basis:26px;width:26px;height:26px;background-size:104px 78px}',
      '.ob-menu-group[hidden]{display:none!important}',
      '@media(max-width:900px){',
      '  #memberZoneLayer .member-zone-side{display:grid!important;grid-template-columns:1fr 1fr!important;gap:4px!important;align-content:start!important;overflow:visible!important;padding:8px!important}',
      '  #memberZoneLayer .member-zone-side>.zone-nav[data-zone-view="home"]{grid-column:1/-1!important;justify-content:center!important}',
      '  #memberZoneLayer .member-zone-side>.zone-side-spacer{display:none!important}',
      '  #memberZoneLayer .ob-menu-group{min-width:0;margin:0}',
      '  #memberZoneLayer .ob-menu-group-trigger{min-height:42px;padding:6px 8px;font-size:8px;letter-spacing:.04em}',
      '  #memberZoneLayer .ob-menu-group-icon{flex-basis:22px;width:22px;height:22px;font-size:11px}',
      '  #memberZoneLayer .ob-menu-group-items{padding:4px 0 0;gap:3px}',
      '  #memberZoneLayer .ob-menu-group-items .zone-nav{min-width:0;padding:7px 6px;font-size:9px}',
      '  #memberZoneLayer .ob-menu-group-items .zone-nav-icon{flex-basis:23px;width:23px;height:23px;background-size:92px 69px}',
      '  #memberZoneLayer .ob-menu-group-items .zone-nav span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '}',
    ].join('');
    document.head.appendChild(css);

    const groupMarkup = (group) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'ob-menu-group';
      wrapper.dataset.menuGroup = group.key;
      wrapper.innerHTML = [
        '<button type="button" class="ob-menu-group-trigger" aria-expanded="false">',
        '<i class="ob-menu-group-icon" aria-hidden="true">', group.key === 'planning' ? '◈' : group.key === 'clan' ? '♜' : group.key === 'tools' ? '⚒' : '✦', '</i>',
        '<span>', group.label, '</span><b aria-hidden="true">⌄</b>',
        '</button>',
        '<div class="ob-menu-group-items"></div>',
      ].join('');
      const trigger = wrapper.querySelector('.ob-menu-group-trigger');
      trigger.addEventListener('click', () => {
        openState[group.key] = !openState[group.key];
        updateGroup(group.key);
        writeOpenState(openState);
      });
      groups.set(group.key, wrapper);
      return wrapper;
    };

    const anchor = () => side.querySelector('.zone-side-spacer') || side.querySelector('.zone-logout') || null;

    GROUPS.forEach(group => side.insertBefore(groupMarkup(group), anchor()));

    function updateGroup(key) {
      const group = GROUPS.find(item => item.key === key);
      const wrapper = groups.get(key);
      if (!group || !wrapper) return;
      const items = wrapper.querySelector('.ob-menu-group-items');
      const visible = [...items.querySelectorAll(':scope > .zone-nav')].some(nav => !nav.hidden);
      wrapper.hidden = !visible;
      wrapper.classList.toggle('is-open', Boolean(openState[key]));
      wrapper.querySelector('.ob-menu-group-trigger')?.setAttribute('aria-expanded', String(Boolean(openState[key])));
    }

    function updateAllGroups() {
      GROUPS.forEach(group => updateGroup(group.key));
      const activePanel = main.querySelector('.zone-view.active[data-zone-panel]');
      const activeView = activePanel?.dataset.zonePanel;
      const activeGroup = VIEW_TO_GROUP.get(activeView);
      if (activeGroup && !openState[activeGroup]) {
        openState[activeGroup] = true;
        updateGroup(activeGroup);
        writeOpenState(openState);
      }
    }

    function organize() {
      const directNavs = [...side.children].filter(child => child.matches?.('.zone-nav'));
      for (const nav of directNavs) {
        const view = nav.dataset.zoneView;
        const groupKey = VIEW_TO_GROUP.get(view);
        if (!groupKey) continue;
        const items = groups.get(groupKey)?.querySelector('.ob-menu-group-items');
        if (items) items.appendChild(nav);
      }
      updateAllGroups();
    }

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        organize();
      });
    };

    zone.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-zone-view]');
      const go = event.target.closest('[data-zone-go]');
      const view = nav?.dataset.zoneView || go?.dataset.zoneGo;
      const groupKey = VIEW_TO_GROUP.get(view);
      if (groupKey && !openState[groupKey]) {
        openState[groupKey] = true;
        updateGroup(groupKey);
        writeOpenState(openState);
      }
    });

    const sideObserver = new MutationObserver(schedule);
    sideObserver.observe(side, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    const activeObserver = new MutationObserver(updateAllGroups);
    activeObserver.observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });

    schedule();
    setTimeout(organize, 500);
  }

  wait();
}

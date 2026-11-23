export function createPanelSwitcher({ close, isOpen }) {
  let requested;
  const opposite = (panel) => panel === 'admin' ? 'clan' : 'admin';
  return {
    request(panel) {
      requested = panel;
      if (panel) close(opposite(panel));
      else { close('admin'); close('clan'); }
    },
    opened(panel) {
      if (requested !== undefined && requested !== panel) { close(panel); return; }
      if (isOpen(opposite(panel))) close(opposite(panel));
    },
  };
}

if (typeof document !== 'undefined') {
  const header = document.querySelector('.topbar');
  if (header) {
    const updateHeight = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    };
    new ResizeObserver(updateHeight).observe(header);
    updateHeight();
  }
  const syncCurrentNavigation = () => {
    const offset = Math.ceil(header?.getBoundingClientRect().height || 72) + 28;
    for (const nav of document.querySelectorAll('.main-nav, #mobileHeaderMenu .mobile-menu-panel')) {
      const links = [...nav.querySelectorAll('a[href^="#"]')];
      let current = '#top';
      for (const link of links) {
        const selector = link.getAttribute('href');
        const section = document.querySelector(selector);
        if (section && section.getBoundingClientRect().top <= offset) current = selector;
      }
      links.forEach((link) => {
        if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  };
  let navigationFrame = 0;
  const scheduleNavigationSync = () => {
    if (navigationFrame) return;
    navigationFrame = requestAnimationFrame(() => {
      navigationFrame = 0;
      syncCurrentNavigation();
    });
  };
  window.addEventListener('scroll', scheduleNavigationSync, { passive:true });
  window.addEventListener('resize', scheduleNavigationSync);
  window.addEventListener('hashchange', scheduleNavigationSync);
  window.addEventListener('orzel:nav-mounted', scheduleNavigationSync);
  syncCurrentNavigation();
  const selector = { admin:'#adminModal', clan:'#memberZoneLayer' };
  const switcher = createPanelSwitcher({
    isOpen: (panel) => document.querySelector(selector[panel])?.classList.contains('open'),
    close: (panel) => {
      const element = document.querySelector(selector[panel]);
      if (element?.classList.contains('open')) element.classList.remove('open');
      if (panel === 'admin') {
        element?.classList.remove('ob-owner-admin-open');
        element?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('admin-modal-open');
        document.body.style.overflow = '';
      }
    },
  });
  // Window capture runs before document-level handlers which stop propagation.
  window.addEventListener('click', (event) => {
    const target = event.target;
    if (!target?.closest) return;
    if (target.closest('#adminTrigger, #quickAdd, #adminAdd, [data-ob-open-admin], [data-mobile-action="admin"]')) switcher.request('admin');
    else if (target.closest('.member-auth-entry:not(.logout), .craft-home-open, [data-mobile-action="clan"], [data-mobile-action="craft"]')) switcher.request('clan');
    else if (target.closest('.topbar .brand, .main-nav a[href="#top"], .member-auth-entry.logout, [data-mobile-action="logout"]')) switcher.request(null);
  }, true);
  window.addEventListener('orzel:open-craft-workspace', () => switcher.request('clan'));
  const observed = new WeakSet();
  const observePanels = () => {
    for (const [panel, query] of Object.entries(selector)) {
      const element = document.querySelector(query);
      if (!element || observed.has(element)) continue;
      observed.add(element);
      new MutationObserver((records) => {
        if (element.classList.contains('open') && records.some(record => !(record.oldValue || '').split(/\s+/).includes('open'))) switcher.opened(panel);
      }).observe(element, { attributes:true, attributeFilter:['class'], attributeOldValue:true });
    }
  };
  observePanels();
  new MutationObserver(observePanels).observe(document.body, { childList:true });
}

if (typeof window !== 'undefined' && !window.__obNeededRbRefreshBridgeInstalled) {
  window.__obNeededRbRefreshBridgeInstalled = true;
  window.addEventListener('ob:needed-rb-changed', () => {
    window.dispatchEvent(new Event('focus'));
  });
}

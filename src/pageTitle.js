const PAGE_TITLE = 'Orzeł Biały';

if (typeof document !== 'undefined') {
  const applyTitle = () => {
    if (document.title !== PAGE_TITLE) document.title = PAGE_TITLE;
  };

  applyTitle();

  const titleNode = document.querySelector('title');
  if (titleNode) {
    new MutationObserver(applyTitle).observe(titleNode, { childList: true, characterData: true, subtree: true });
  }

  window.addEventListener('pageshow', applyTitle);
  window.addEventListener('hashchange', applyTitle);
  document.addEventListener('visibilitychange', applyTitle);
}

import './siteMotion.css';

const revealSelector = [
  '.hero',
  '.pvp-hero-panel',
  '.next-event-card',
  '.calendar-section',
  '.event-row',
  '.boss-card',
  '.clan-hall-gallery-card',
  '.ob-gate-login-slot .member-auth-box',
  '.ob-recruit-hero',
  '.ob-gate-info > div',
  '.ob-gate-video',
  '.zone-card',
].join(',');

if (typeof document !== 'undefined' && 'IntersectionObserver' in window) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reduceMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('site-motion-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    const observeTargets = (root) => {
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const targets = root.matches(revealSelector) ? [root] : [];
      targets.push(...root.querySelectorAll(revealSelector));
      targets.forEach((target) => {
        if (target.dataset.siteMotionObserved) return;
        target.dataset.siteMotionObserved = 'true';
        target.classList.add('site-motion-reveal');
        observer.observe(target);
      });
    };

    observeTargets(document.documentElement);
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(observeTargets));
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
}

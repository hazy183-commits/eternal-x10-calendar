// Owns only the strip viewport; date selection and event rendering stay in main.
export function createCalendarNavigation(strip, extendRange) {
  let anchorKey;
  let width = strip.clientWidth;
  let target = null;
  const cards = () => [...strip.querySelectorAll('[data-calendar-day]')];
  const center = (card) => {
    const box = card.getBoundingClientRect();
    const viewport = strip.getBoundingClientRect();
    return strip.scrollLeft + box.left + box.width / 2 - viewport.left - strip.clientLeft - strip.clientWidth / 2;
  };
  const remember = () => {
    if (strip.clientWidth !== width) return;
    const nearest = cards().reduce((best, card) => !best || Math.abs(center(card) - strip.scrollLeft) < Math.abs(center(best) - strip.scrollLeft) ? card : best, null);
    if (nearest) anchorKey = nearest.dataset.calendarDay;
  };
  const move = (left, smooth) => {
    target = left;
    strip.scrollTo({ left, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
  };
  const centerDay = (key, smooth = false) => {
    const card = cards().find(card => card.dataset.calendarDay === key);
    if (!card) return;
    anchorKey = key;
    move(center(card), smooth);
  };
  strip.addEventListener('scroll', remember, { passive: true });
  strip.addEventListener('scrollend', () => { target = null; remember(); });
  for (const event of ['pointerdown', 'wheel', 'keydown']) strip.addEventListener(event, () => { target = null; }, { passive: true });
  new ResizeObserver(() => {
    if (strip.clientWidth === width || !strip.clientWidth) return;
    width = strip.clientWidth;
    if (anchorKey) centerDay(anchorKey);
  }).observe(strip);
  return {
    centerDay,
    // Preserve the visible day and keyboard focus when event counts refresh or
    // more dates are prepended. No scrollIntoView: it also moves the whole page.
    beforeRender() {
      const card = cards().find(card => card.dataset.calendarDay === anchorKey) || cards()[0];
      return card && { key: card.dataset.calendarDay, offset: center(card) - strip.scrollLeft, focus: strip.contains(document.activeElement) ? document.activeElement.dataset.calendarDay : null };
    },
    afterRender(previous, selectedKey) {
      const card = previous && cards().find(card => card.dataset.calendarDay === previous.key);
      if (card) {
        const left = center(card) - previous.offset;
        if (Math.abs(left - strip.scrollLeft) > 1) move(left, false);
        if (previous.focus) cards().find(card => card.dataset.calendarDay === previous.focus)?.focus({ preventScroll: true });
      } else centerDay(selectedKey);
      remember();
    },
    scroll(direction) {
      const first = cards()[0];
      if (!first) return;
      const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap);
      let left = (target ?? strip.scrollLeft) + direction * step;
      if (left < step || left > strip.scrollWidth - strip.clientWidth - step) {
        const before = strip.scrollLeft;
        extendRange(direction);
        left += strip.scrollLeft - before;
      }
      move(left, true);
    },
  };
}

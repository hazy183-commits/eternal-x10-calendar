import { nextOlympiadEvent, formatOlympiadDate, olympiadCountdownTarget,
  OLYMPIAD_SERVER_HOURS } from './olympiadSchedule.js';

export function renderOlympiadPanel(root, now = new Date()) {
  if (!root) return;
  const event = nextOlympiadEvent(now);
  if (!event) return;
  const put = (selector, value) => {
    const element = root.querySelector(selector);
    if (element.textContent !== value) element.textContent = value;
  };
  put('[data-olympiad-date]', formatOlympiadDate(event));
  put('[data-olympiad-time]', `${event.timeRange} · Europe/Warsaw`);
  put('[data-olympiad-server]', OLYMPIAD_SERVER_HOURS);
  put('[data-olympiad-status]', event.olympiadStatus);
  root.querySelector('[data-olympiad-status]').classList.toggle('olympiad-active', event.olympiadStatus === 'OLYMPIAD ACTIVE');
  put('[data-olympiad-countdown-label]', event.olympiadStatus === 'OLYMPIAD ACTIVE' ? 'Do zakończenia' : 'Do rozpoczęcia');
  const seconds = Math.max(0, Math.floor((olympiadCountdownTarget(event, now) - now) / 1000));
  const pad = (value) => String(value).padStart(2, '0');
  put('[data-olympiad-countdown]', `${Math.floor(seconds / 86400)}d ${pad(Math.floor(seconds % 86400 / 3600))}h ${pad(Math.floor(seconds % 3600 / 60))}m ${pad(seconds % 60)}s`);
}

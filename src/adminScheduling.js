export const MAX_BATCH_EVENTS = 100;

export const RECURRENCE_PATTERNS = Object.freeze([
  Object.freeze({ value: 'daily', label: 'Codziennie', stepDays: 1 }),
  Object.freeze({ value: 'weekly', label: 'Co tydzień', stepDays: 7 }),
  Object.freeze({ value: 'biweekly', label: 'Co 2 tygodnie', stepDays: 14 }),
  Object.freeze({ value: 'everyDays', label: 'Co X dni' }),
]);

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  return date;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function recurrenceStepDays(pattern, intervalDays = 1) {
  const option = RECURRENCE_PATTERNS.find((item) => item.value === pattern);
  if (!option) throw new Error('Wybierz sposób powtarzania.');
  if (pattern === 'everyDays') {
    const interval = Number(intervalDays);
    if (!Number.isInteger(interval) || interval <= 0) throw new Error('Podaj liczbę dni większą od 0.');
    return interval;
  }
  return option.stepDays;
}

export function generateRecurringDates({ startDate, endDate, pattern, intervalDays = 1 }, { max = MAX_BATCH_EVENTS } = {}) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end) throw new Error('Wybierz prawidłową datę początkową i końcową.');
  if (end < start) throw new Error('Data końcowa nie może być wcześniejsza niż pierwsza data wydarzenia.');
  const step = recurrenceStepDays(pattern, intervalDays);
  const dates = [];
  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + step)) {
    dates.push(dateKey(current));
    if (dates.length > max) throw new Error(`Jedna operacja może utworzyć maksymalnie ${MAX_BATCH_EVENTS} wydarzeń.`);
  }
  return dates;
}

export function previewRecurringDates(config) {
  try {
    const dates = generateRecurringDates(config, { max: 10000 });
    return {
      dates: dates.slice(0, 10),
      remaining: Math.max(0, dates.length - 10),
      total: dates.length,
      exceedsLimit: dates.length > MAX_BATCH_EVENTS,
      error: '',
    };
  } catch (error) {
    return { dates: [], remaining: 0, total: 0, exceedsLimit: false, error: error.message };
  }
}

export function eventIdentity(event) {
  const name = String(event?.name ?? '').trim().toLocaleLowerCase();
  const date = String(event?.date ?? event?.event_date ?? '').trim();
  const time = String(event?.time ?? event?.event_time ?? '').trim().slice(0, 5);
  return `${name}\u0000${date}\u0000${time}`;
}

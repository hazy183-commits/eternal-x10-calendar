import { english } from './translations.js';

export const LANGUAGE_KEY = 'ob-language-v1';
export const normalizeLanguage = value => value === 'en' ? 'en' : 'pl';
export function readLanguage(storage) {
  try { return normalizeLanguage(storage.getItem(LANGUAGE_KEY)); } catch { return 'pl'; }
}
function browserStorage() { try { return globalThis.localStorage; } catch { return undefined; } }
let language = readLanguage(browserStorage());
export const getLanguage = () => language;
export const getLocale = () => language === 'en' ? 'en-GB' : 'pl-PL';
export function setLanguage(value, storage = browserStorage()) {
  language = normalizeLanguage(value);
  try { storage.setItem(LANGUAGE_KEY, language); } catch { /* The switch still works without storage. */ }
  return language;
}

const folded = new Map([...english].map(([pl, en]) => [pl.toLocaleLowerCase('pl'), en]));
function exact(text) {
  if (english.has(text)) return english.get(text);
  const result = folded.get(text.toLocaleLowerCase('pl'));
  if (result === undefined) return null;
  return text === text.toLocaleUpperCase('pl') ? result.toLocaleUpperCase('en') : result;
}

const dateWords = {
  poniedziałek: 'Monday', wtorek: 'Tuesday', środa: 'Wednesday', czwartek: 'Thursday', piątek: 'Friday', sobota: 'Saturday', niedziela: 'Sunday',
  pon: 'Mon', wt: 'Tue', śr: 'Wed', czw: 'Thu', pt: 'Fri', sob: 'Sat', niedz: 'Sun',
  stycznia: 'January', lutego: 'February', marca: 'March', kwietnia: 'April', maja: 'May', czerwca: 'June', lipca: 'July', sierpnia: 'August', września: 'September', października: 'October', listopada: 'November', grudnia: 'December',
  styczeń: 'January', luty: 'February', marzec: 'March', kwiecień: 'April', maj: 'May', czerwiec: 'June', lipiec: 'July', sierpień: 'August', wrzesień: 'September', październik: 'October', listopad: 'November', grudzień: 'December',
  sty: 'Jan', lut: 'Feb', mar: 'Mar', kwi: 'Apr', cze: 'Jun', lip: 'Jul', sie: 'Aug', wrz: 'Sep', paź: 'Oct', lis: 'Nov', gru: 'Dec',
};
// Only complete UI messages and date-shaped strings match these patterns.
// Arbitrary fragments of authored text must never be translated.
const patterns = [
  [/^Pokaż szczegóły bossa (.+)$/, (_, name) => `Show boss details: ${name}`],
  [/^Usuń odznakę: (.+)$/, (_, label) => `Remove badge: ${exact(label) ?? label}`],
  [/^Uprawnienia: (.+)$/, (_, name) => `Permissions: ${name}`],
  [/^Ustawienia poniżej dotyczą tylko tej osoby i mają pierwszeństwo przed prawami roli „(.+)”\. Odznaczone pola odbierają dostęp\.$/, (_, role) => `These settings apply only to this person and override the “${role}” role permissions. Unchecked fields remove access.`],
  [/^Koniec: (.+)$/, (_, date) => `Ends: ${translateText(date, 'en')}`],
  [/^(AKTYWNA|ZAKOŃCZONA|NIEDOSTĘPNA) · (\d+) odpowiedzi · utworzono (.+)$/, (_, status, count, date) => `${exact(status)} · ${count} answers · created ${translateText(date, 'en')}`],
  [/^(.+) · (Aktywna|Pasywna|Szansowa)$/, (_, name, kind) => `${name} · ${exact(kind)}`],
  [/^Co 2\. niedzielę (.+)$/, (_, time) => `Every other Sunday ${time}`],
  [/^Usunąć wydarzenie „(.+)”\?$/, (_, name) => `Delete the event “${name}”?`],
  [/^Poziom (\d+)$/, (_, n) => `Level ${n}`],
  [/^Odpowiedź (\d+)$/, (_, n) => `Answer ${n}`],
  [/^Subclassa #(\d+)$/, (_, n) => `Subclass #${n}`],
  [/^(\d[\d\s.,]*) (wizyt|odsłon|głosów|odpowiedzi|buffów|wpisów)$/, (_, n, noun) => `${n} ${{wizyt:'visits',odsłon:'page views',głosów:'votes',odpowiedzi:'answers',buffów:'buffs',wpisów:'entries'}[noun]}`],
  [/^(\d+) głosów · (\d+)%$/, (_, n, p) => `${n} votes · ${p}%`],
  [/^(\d+) (minut|minuty|minuta)$/, (_, n) => `${n} minutes`],
  [/^(\d+) zgłoszeń · (\d+) nowych$/, (_, total, count) => `${total} applications · ${count} new`],
  [/^Usunąć ankietę „([\s\S]*)” razem ze wszystkimi głosami\? Tej operacji nie można cofnąć\.$/, (_, title) => `Delete the poll “${title}” and all its votes? This cannot be undone.`],
  [/^Usunąć ogłoszenie „([\s\S]*)”\?$/, (_, title) => `Delete the announcement “${title}”?`],
  [/^Usunąć zgłoszenie „([\s\S]*)”\? Tej operacji nie można cofnąć\.$/, (_, name) => `Delete the application “${name}”? This cannot be undone.`],
  [/^Usunąć (.+) z magazynu\?$/, (_, name) => `Remove ${name} from inventory?`],
  [/^Usunąć „([\s\S]*)” z klanu\?\n\nOsoba zniknie z list członków i straci dostęp do strefy klanu\. Historia jej udziału pozostanie zachowana\.$/, (_, name) => `Remove “${name}” from the clan?\n\nThey will be removed from member lists and lose access to the clan area. Their participation history will be retained.`],
  [/^Zostanie utworzonych (\d+) wydarzeń\. Czy kontynuować\?$/, (_, n) => `${n} events will be created. Continue?`],
  [/^(Boss zabity|Ustaw okno z gry): (.+)$/, (_, label, name) => `${exact(label)}: ${name}`],
  [/^(Błąd|Nie udało się zapisać|Nie udało się pobrać użytkowników|Nie udało się wykonać operacji): ([\s\S]*)$/, (_, label, detail) => `${{'Błąd':'Error','Nie udało się zapisać':'Could not save','Nie udało się pobrać użytkowników':'Could not load users','Nie udało się wykonać operacji':'Operation failed'}[label]}: ${detail}`],
];

export function translateText(value, target = language) {
  const source = String(value ?? '');
  if (target !== 'en' || !source.trim()) return source;
  const text = source.trim();
  let result = exact(text);
  if (result === null) {
    const decorated = text.match(/^([+✓↻↪⊘★⚔⚒⚙✎▣◉◎▶♛♟✦📅📍📣👥🤔⏱🏷️📌▸▾\s]+)(.+)$/u);
    if (decorated) {
      const translated = exact(decorated[2]);
      if (translated !== null) result = decorated[1] + translated;
    }
  }
  if (result === null) {
    for (const [pattern, replace] of patterns) {
      if (pattern.test(text)) { result = text.replace(pattern, replace); break; }
    }
  }
  if (result === null) {
    // Polish date labels produced by existing renderers; never alter time zones.
    const words = text.match(/[\p{L}]+/gu) || [];
    if (words.length && words.every(word => dateWords[word.toLocaleLowerCase('pl')]) && /^[\p{L}\d\s.,:–\-/]+$/u.test(text)) {
      result = text.replace(/[\p{L}]+/gu, word => dateWords[word.toLocaleLowerCase('pl')]);
    }
  }
  if (result === null) return source;
  return source.slice(0, source.indexOf(text)) + result + source.slice(source.indexOf(text) + text.length);
}

export const confirmLocalized = message => window.confirm(translateText(message));
export const alertLocalized = message => window.alert(translateText(message));

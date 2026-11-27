import test from 'node:test';
import assert from 'node:assert/strict';
import { readLanguage, setLanguage, getLanguage, translateText, LANGUAGE_KEY } from '../src/i18nCore.js';

test('Polish is the default and blocked storage does not prevent switching', () => {
  assert.equal(readLanguage(undefined), 'pl');
  assert.equal(readLanguage({getItem(){throw new Error('denied');}}), 'pl');
  assert.equal(readLanguage({getItem:()=> 'de'}), 'pl');
  setLanguage('en', {setItem(){throw new Error('denied');}});
  assert.equal(getLanguage(), 'en');
  setLanguage('pl');
});
test('only the selected language is persisted, with no profile or form data', () => {
  const writes = [];
  setLanguage('en', {setItem:(...args)=>writes.push(args)});
  assert.deepEqual(writes, [[LANGUAGE_KEY, 'en']]);
  assert.equal(readLanguage({getItem:()=> 'en'}), 'en');
  setLanguage('pl');
});
test('navigation, forms, feedback and decorated labels translate with case and whitespace', () => {
  const cases = [['  STREFA KLANU  ','  CLAN AREA  '],['✓ Głos zapisany.','✓ Vote saved.'],['+ DODAJ AUGMENTACJĘ','+ ADD AUGMENTATION'],['⚒ Otwórz Craft Calculator','⚒ Open Craft Calculator'],['Hasło','Password'],['Zapisz prawa roli','Save role permissions']];
  for (const [pl,en] of cases) { assert.equal(translateText(pl,'en'),en); assert.equal(translateText(pl,'pl'),pl); }
});
test('dynamic vote and count labels and Polish dates retain their numbers and times', () => {
  assert.equal(translateText('12 głosów · 75%','en'),'12 votes · 75%');
  assert.equal(translateText('czwartek, 24 września 2026','en'),'Thursday, 24 September 2026');
  assert.equal(translateText('24 wrz 2026, 22:30','en'),'24 Sep 2026, 22:30');
  assert.equal(translateText('Poziom 10','en'),'Level 10');
});
test('confirmation messages preserve embedded poll titles and nicknames verbatim', () => {
  assert.equal(translateText('Usunąć ankietę „Zapisz” razem ze wszystkimi głosami? Tej operacji nie można cofnąć.','en'),'Delete the poll “Zapisz” and all its votes? This cannot be undone.');
  assert.equal(translateText('Usunąć ogłoszenie „Wydarzenia”?' ,'en'),'Delete the announcement “Wydarzenia”?');
});
test('unknown text, game names, HTML and storage identifiers never get fragment replacement', () => {
  for (const value of ['Draconic Bow','Orzeł Biały','clan_polls','manage_users','To moja ankieta o klasie: Klasa','<script>alert(1)</script>','Mój nick to Środa']) assert.equal(translateText(value,'en'),value);
});

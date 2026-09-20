import catalog from '../data/interlude-dyes.json' with { type: 'json' };
export const DYES = catalog.dyes;
const available = new Set(DYES.map(dye => dye.label));
export function serializeDyes(values) {
  const chosen = values.filter(Boolean);
  if (chosen.length > 3) throw new Error('Możesz wybrać maksymalnie 3 symbole.');
  if (new Set(chosen).size !== chosen.length) throw new Error('Wybierz 3 różne symbole — bez powtórzeń.');
  if (chosen.some(value => !available.has(value))) throw new Error('Wybierz symbole z listy dostępnych Dyes.');
  return chosen.join(', ');
}
export function parseDyes(value = '') {
  const values = value.trim() ? value.split(/[,;]\s*/).map(part => part.trim().replace(/−/g, '-').toUpperCase()) : [];
  serializeDyes(values);
  return values;
}
export function dyeSelector() {
  const options = ['STR','DEX','CON','INT','WIT','MEN'].map(stat => '<optgroup label="' + stat + '">' + DYES.filter(dye => dye.stat === stat).map(dye => '<option value="' + dye.label + '">' + dye.label + '</option>').join('') + '</optgroup>').join('');
  return '<fieldset class="wide dye-selector"><legend>Symbole / Dyes <span id="dyeCount">0/3</span></legend><p>Wybierz maksymalnie trzy różne symbole z listy.</p><div class="dye-select-grid">' + [1,2,3].map(slot => '<label>Symbol ' + slot + '<select data-dye-slot="' + slot + '"><option value="">— Brak symbolu —</option>' + options + '</select></label>').join('') + '</div></fieldset>';
}

import quests from './thirdClassQuestData.json';
import './thirdClassQuests.css';

const races = ['Ludzie', 'Elfy', 'Mroczne elfy', 'Orkowie', 'Krasnoludy'];
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/\p{Mark}/gu, '').replaceAll('’', "'");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function externalLink(label, url) {
  const link = element('a', label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

export function installThirdClassQuests() {
  const section = document.getElementById('przydatne-questy');
  if (!section) return;
  const search = section.querySelector('input');
  const race = section.querySelector('select');
  const cards = section.querySelector('.third-class-cards');
  const count = section.querySelector('[role="status"]');
  const dialog = section.querySelector('dialog');
  const content = dialog.querySelector('.third-class-guide');
  races.forEach((name, id) => race.add(new Option(name, id)));
  const render = () => {
    const query = normalize(search.value.trim());
    const results = quests.filter((quest) => (race.value === '' || Number(race.value) === quest.race)
      && normalize(quest.from + ' ' + quest.name + ' ' + (quest.alias || '')).includes(query));
    count.textContent = results.length ? 'Poradniki: ' + results.length : 'Brak klas pasujących do wyszukiwania.';
    cards.replaceChildren(...results.map((quest) => {
      const button = element('button', '', 'third-class-card');
      button.type = 'button';
      button.append(element('strong', quest.from + ' → ' + quest.name), element('small', races[quest.race]));
      button.addEventListener('click', () => openGuide(quest));
      return button;
    }));
  };

  function openGuide(quest) {
    dialog.querySelector('h3').textContent = quest.from + ' → ' + quest.name;
    const steps = element('ol');
    for (const step of quest.steps) {
      const row = element('li');
      row.append(element('p', step.text));
      const images = element('div', '', 'third-class-maps');
      for (const [url, label] of step.images) {
        const link = externalLink('', url);
        const picture = element('img');
        picture.src = url;
        picture.alt = label;
        picture.loading = 'lazy';
        picture.addEventListener('error', () => link.replaceChildren(element('span', label)));
        link.append(picture);
        images.append(link);
      }
      if (images.children.length) row.append(images);
      steps.append(row);
    }
    content.replaceChildren(steps, externalLink('Źródło i dodatkowe mapy oraz zdjęcia NPC', quest.url));
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  search.addEventListener('input', render);
  race.addEventListener('change', render);
  render();
}

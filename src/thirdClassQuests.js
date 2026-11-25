import usefulQuests from './usefulQuestData.json';
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

const classArt = {
  "Duelist": "0297",
  "Dreadnought": "0130",
  "Phoenix Knight": "0406",
  "Hell Knight": "0086",
  "Sagittarius": "0313",
  "Adventurer": "0445",
  "Archmage": "1191",
  "Soultaker": "0270",
  "Arcana Lord": "eternal_bless_queen",
  "Cardinal": "1307",
  "Hierophant": "1356",
  "Eva's Templar": "0341",
  "Sword Muse": "0364",
  "Wind Rider": "0446",
  "Moonlight Sentinel": "0413",
  "Mystic Muse": "1182",
  "Elemental Master": "eternal_bless_seraphim",
  "Eva's Saint": "1355",
  "Shillien Templar": "0351",
  "Spectral Dancer": "0365",
  "Ghost Hunter": "0447",
  "Ghost Sentinel": "0414",
  "Storm Screamer": "1189",
  "Spectral Master": "1268",
  "Shillien Saint": "1357",
  "Titan": "0176",
  "Grand Khavatari": "0420",
  "Dominator": "eternal_victory_paagrio",
  "Doomcryer": "1363",
  "Fortune Seeker": "0111",
  "Maestro": "1040"
};
const stepTitles = [
  'Odbierz sagę', 'Pierwsza rozmowa', 'Zdobądź pierwszy amulet',
  'Tablet of Vision I', 'Tablet of Vision II', 'Tablet of Vision III',
  'Zdobądź czwarty amulet', 'Tablet of Vision IV', 'Pokonaj Archon of Halisha',
  'Tablet of Vision V', 'Tablet of Vision VI', 'Oddaj quest',
];
const addedSupplies = {
  Duelist: 'Top Quality Meat',
  Dreadnought: 'Big White Nimble Fish',
  'Phoenix Knight': 'Big White Fat Fish',
  "Eva's Templar": 'Big White Fat Fish',
  'Sword Muse': 'Big White Fat Fish',
};

function illustration(quest) {
  const image = element('img', '', 'third-class-emblem');
  image.src = quest.icon ? '/images/useful-quests/' + quest.icon + '.svg' : '/assets/interlude/buff-icons/skill' + classArt[quest.name] + '.png';
  image.alt = '';
  image.loading = 'lazy';
  return image;
}

function closeOnBackdrop(dialog) {
  const outside = (event) => {
    if (event.target !== dialog) return false;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom;
  };
  let startedOutside = false;
  dialog.addEventListener('pointerdown', (event) => {
    startedOutside = outside(event);
  });
  dialog.addEventListener('click', (event) => {
    if (startedOutside && outside(event)) dialog.close();
    startedOutside = false;
  });
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
  const preview = element('dialog', '', 'third-class-map-preview');
  const title = element('h3');
  title.id = 'thirdClassMapTitle';
  preview.setAttribute('aria-labelledby', title.id);
  const header = element('header');
  const close = element('button', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Zamknij podgląd');
  close.addEventListener('click', () => preview.close());
  const previewContent = element('div');
  header.append(title, close);
  preview.append(header, previewContent);
  section.append(preview);
  closeOnBackdrop(dialog);
  closeOnBackdrop(preview);

  const catalogue = element('dialog', '', 'third-class-catalogue');
  catalogue.setAttribute('aria-labelledby', 'thirdClassTitle');
  const catalogueClose = element('button', '×', 'third-class-catalogue-close');
  catalogueClose.type = 'button';
  catalogueClose.setAttribute('aria-label', 'Zamknij przydatne questy');
  catalogueClose.addEventListener('click', () => catalogue.close());
  const originalPosition = document.createComment('Przydatne questy');
  section.before(originalPosition);
  document.body.append(catalogue);
  catalogue.append(catalogueClose);
  catalogue.addEventListener('close', () => originalPosition.after(section));
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('a[href$="#przydatne-questy"]');
    const clanOpen = document.querySelector('#memberZoneLayer.open');
    if (!trigger || !clanOpen || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (catalogue.open) return;
    catalogue.append(section);
    catalogue.showModal();
    search.focus({ preventScroll: true });
  });

  function mapImage(url, label) {
    const img = element('img');
    img.alt = label;
    img.addEventListener('error', () => img.replaceWith(element('p', 'Nie udało się wczytać obrazu.')));
    img.decoding = 'async';
    img.fetchPriority = 'high';
    img.src = url;
    return img;
  }

  function showImage(url, label, step) {
    const portrait = url.includes('/npc/') || label.endsWith(' · zdjęcie NPC');
    const forumImage = url.startsWith('https://forum.l2mad.net/');
    title.textContent = label;
    previewContent.replaceChildren();
    if (!portrait && !forumImage && !label.startsWith('Zaznaczony punkt')) {
      previewContent.append(element('p', 'Mapa poglądowa. Kierunek i cel znajdziesz w opisie kroku.'));
    }
    const viewport = element('div', '', 'third-class-full-viewport');
    const zoom = element('button', 'Powiększ mapę');
    zoom.type = 'button';
    zoom.setAttribute('aria-pressed', 'false');
    zoom.addEventListener('click', () => {
      const expanded = viewport.classList.toggle('is-zoomed');
      zoom.setAttribute('aria-pressed', String(expanded));
      zoom.textContent = expanded ? 'Dopasuj do okna' : 'Powiększ mapę';
    });
    viewport.append(mapImage(url, label));
    if (!portrait) previewContent.append(zoom);
    previewContent.append(viewport, element('p', step.text));
    preview.showModal();
    preview.scrollTop = 0;
  }

  const filters = section.querySelector('.third-class-filters');
  const categoryLabel = element('label', 'Kategoria');
  const category = element('select');
  for (const name of ['Wszystkie questy', 'Rozwój postaci', 'Dostęp do lokacji', 'Farm i wymiany', 'Trzecia profesja']) {
    category.add(new Option(name, name));
  }
  categoryLabel.append(category);
  filters.prepend(categoryLabel);
  const searchLabel = search.parentElement.firstChild;
  searchLabel.textContent = 'Szukaj questa lub klasy';
  search.placeholder = 'np. Noblesse, MoS, Adventurer';
  races.forEach((name, id) => race.add(new Option(name, id)));
  const render = () => {
    const query = normalize(search.value.trim());
    const requested = category.value;
    const raceActive = requested === 'Trzecia profesja' || requested === 'Wszystkie questy';
    race.disabled = !raceActive;
    const all = [...usefulQuests, ...quests];
    const groups = new Map();
    let total = 0;
    for (const quest of all) {
      const key = quest.category || 'Trzecia profesja';
      if (requested !== 'Wszystkie questy' && requested !== key) continue;
      if (raceActive && race.value !== '' && Number(race.value) !== quest.race) continue;
      const steps = quest.category ? quest.steps.map((step) => step.text).join(' ') : '';
      const keywords = [quest.from, quest.name, quest.title, quest.alias, key, steps].filter(Boolean).join(' ');
      if (!normalize(keywords).includes(query)) continue;
      const button = element('button', '', 'third-class-card');
      button.type = 'button';
      if (quest.race !== undefined) button.dataset.race = quest.race;
      const copy = element('span', '', 'third-class-card-copy');
      copy.append(element('small', quest.from || quest.level), element('strong', quest.name));
      if (quest.title) copy.append(element('small', quest.title));
      button.append(illustration(quest), copy);
      button.addEventListener('click', () => openGuide(quest));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(button);
      total++;
    }
    count.textContent = total ? 'Poradniki: ' + total : 'Brak questów pasujących do wyszukiwania.';
    cards.classList.add('useful-quest-groups');
    cards.replaceChildren(...Array.from(groups, ([name, buttons]) => {
      const group = element('section', '', 'useful-quest-group');
      const grid = element('div', '', 'third-class-cards');
      grid.append(...buttons);
      group.append(element('h3', name), grid);
      return group;
    }));
  };

  function openGuide(quest) {
    if (!document.querySelector('link[data-quest-image-origin]')) {
      for (const origin of ['https://forum.l2mad.net', 'https://la2wiki.com']) {
        const connection = element('link');
        connection.rel = 'preconnect';
        connection.href = origin;
        connection.dataset.questImageOrigin = '';
        document.head.append(connection);
      }
    }
    dialog.querySelector('h3').textContent = quest.from ? quest.from + ' → ' + quest.name : quest.name;
    const introduction = element('header', '', 'third-class-intro');
    const heading = element('div');
    heading.append(element('strong', quest.title || 'Saga of the ' + (quest.name === 'Dreadnought' ? 'Dreadnoughts' : quest.name)),
      element('p', quest.level ? 'Poziom ' + quest.level : races[quest.race] + ' · poziom 76'));
    introduction.append(illustration(quest), heading);
    const supplies = element('p', 'Przygotuj: ' +
      ['Ice Crystal', 'Divine Stone of Wisdom', addedSupplies[quest.name]].filter(Boolean).join(' · '),
      'third-class-supplies');
    const steps = element('ol', '', 'third-class-steps');
    for (const [index, step] of quest.steps.entries()) {
      const row = element('li');
      row.append(element('h4', step.title || stepTitles[index]), element('p', step.text));
      if (step.forumRoute) {
        row.append(element('p', 'Dojście: ' + step.forumRoute, 'third-class-forum-route'));
      }
      const images = element('div', '', 'third-class-maps');
      for (const [url, label] of step.images) {
        const link = element('button');
        link.type = 'button';
        link.setAttribute('aria-label', 'Powiększ: ' + label);
        link.addEventListener('click', () => showImage(url, label, step));
        const picture = element('img');
        picture.alt = label;
        picture.width = 132;
        picture.height = 92;
        picture.decoding = 'async';
        picture.loading = index < 2 ? 'eager' : 'lazy';
        picture.addEventListener('error', () => link.replaceChildren(element('span', 'Otwórz: ' + label)), { once: true });
        picture.src = url;
        link.append(picture);
        images.append(link);
      }
      if (images.children.length) row.append(images);
      steps.append(row);
    }
    content.replaceChildren(introduction, ...(quest.category ? [] : [supplies]), steps);
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  search.addEventListener('input', render);
  race.addEventListener('change', render);
  category.addEventListener('change', () => {
    if (category.value !== 'Trzecia profesja' && category.value !== 'Wszystkie questy') race.value = '';
    render();
  });
  render();
}

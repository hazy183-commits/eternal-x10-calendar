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

  function locationMap(url, label, [x, y], thumbnail = false) {
    const frame = element('div', '', 'quest-location-map');
    const picture = element('img');
    picture.alt = label;
    picture.loading = thumbnail ? 'lazy' : 'eager';
    picture.decoding = 'async';
    const windowWidth = 520;
    picture.style.width = (2048 / windowWidth * 100) + '%';
    picture.style.left = (50 - x / windowWidth * 100) + '%';
    picture.style.top = (50 - y / 390 * 100) + '%';
    picture.addEventListener('error', () => {
      frame.classList.add('quest-location-map--error');
      frame.replaceChildren(element('span', 'Nie udało się wczytać mapy.'));
    }, { once: true });
    picture.src = url;
    const pin = element('span', '', 'quest-location-pin');
    pin.setAttribute('aria-hidden', 'true');
    frame.append(picture, pin);
    return frame;
  }

  function showImage(url, label, step, point) {
    const portrait = url.includes('/npc/') || label.endsWith(' · zdjęcie NPC');
    const forumImage = url.startsWith('https://forum.l2mad.net/');
    title.textContent = label;
    previewContent.replaceChildren();
    if (!point && !portrait && !forumImage && !label.startsWith('Zaznaczony punkt') && !/l2-servera\.com|masterwork\.wiki|lineage2dex\.com/.test(url)) {
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
    viewport.append(point ? locationMap(url, label, point) : mapImage(url, label));
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

  function addInstructionList(container, text) {
    const instructions = text.match(/[^.!?]+(?:[.!?](?!\d)|$)/g)?.map((part) => part.trim()).filter(Boolean) || [text];
    // Keep short standalone location labels and ordinal numbers with their sentence.
    const combined = [];
    for (const part of instructions) {
      if (combined.length && (/^\d{1,2}\.$/.test(combined.at(-1)) || /\b\d{1,2}\.$/.test(combined.at(-1)))) {
        combined[combined.length - 1] += ' ' + part;
      } else {
        combined.push(part);
      }
    }
    const list = element('ul', '', 'quest-actions');
    list.append(...combined.map((part) => element('li', part)));
    container.append(list);
  }

  const thirdClassDependencies = [
    {
      "title": "The Finest Ingredients – Part 1 · Ice Crystal",
      "text": "Weź quest u Chef Jeremy w Hot Springs. Zdobądź po 50 składników z Hot Springs Bandersnatchling, Hot Springs Atrox i Hot Springs Nepenthes. Wróć do Jeremy’ego po Ice Crystal."
    },
    {
      "title": "Magical Power of Water – Part 1 · ścieżka Ketra",
      "text": "W sojuszu Alliance with Ketra Orcs osiągnij poziom 2. Weź Magical Power of Water u Wakhana w Ketra Orc Outpost. Asefa wyśle Cię po totem ze skrzyni Udan Mardui w Varka Silenos Stronghold. Wróć po Divine Stone of Wisdom."
    },
    {
      "title": "Magical Power of Fire – Part 1 · ścieżka Varka",
      "text": "Jeśli masz sojusz Alliance with Varka Silenos na poziomie 2, wybierz Magical Power of Fire u Naharan Ashanuka w Varka Silenos Outpost. Udan Mardui wyśle Cię po totem ze skrzyni Asefy w Ketra Orc Outpost. Ta ścieżka daje ten sam kamień co sojusz Ketra. Zrób jedną z nich."
    }
  ];

  function dependencyList(entries) {
    const group = element('div', '', 'quest-dependencies');
    group.append(element('strong', 'Questy powiązane'));
    for (const entry of entries) {
      const details = element('details');
      details.append(element('summary', entry.title), element('p', entry.text));
      if (entry.guide) {
        const target = usefulQuests.find((quest) => quest.name === entry.guide);
        if (target) {
          const button = element('button', 'Otwórz poradnik · ' + target.name);
          button.type = 'button';
          button.addEventListener('click', () => openGuide(target));
          details.append(button);
        }
      }
      group.append(details);
    }
    return group;
  }

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
    const quick = element('dl', '', 'quest-quick-info');
    const fields = [
      ['Start', quest.quickStart || quest.steps[0]?.text],
      ['Przygotuj', quest.prepare || 'Ice Crystal i Divine Stone of Wisdom' + (addedSupplies[quest.name] ? ' oraz ' + addedSupplies[quest.name] : '')],
      ['Nagroda', quest.outcome || 'Zmiana profesji na ' + quest.name],
    ];
    for (const [label, value] of fields) {
      const field = element('div');
      field.append(element('dt', label), element('dd', value));
      quick.append(field);
    }
    const steps = element('ol', '', 'third-class-steps');
    for (const [index, step] of quest.steps.entries()) {
      const row = element('li');
      row.append(element('h4', step.title || stepTitles[index]));
      addInstructionList(row, step.text);
      if (step.dependencies?.length) row.append(dependencyList(step.dependencies));
      if (step.forumRoute) {
        row.append(element('p', 'Dojście: ' + step.forumRoute, 'third-class-forum-route'));
      }
      if (step.waypoints?.length) {
        const coordinates = element('details');
        coordinates.append(element('summary', 'Współrzędne w grze (X, Y, Z)'));
        const list = element('ul', '', 'quest-actions');
        for (const [name, position] of step.waypoints) {
          list.append(element('li', name + ' · ' + position));
        }
        coordinates.append(list);
        row.append(coordinates);
      }
      const images = element('div', '', 'third-class-maps');
      for (const [url, label, point] of step.images) {
        const link = element('button');
        link.type = 'button';
        link.setAttribute('aria-label', 'Powiększ: ' + label);
        link.addEventListener('click', () => showImage(url, label, step, point));
        if (point) {
          link.append(locationMap(url, label, point, true), element('span', label, 'quest-map-caption'));
          images.append(link);
          continue;
        }
        const picture = element('img');
        picture.alt = label;
        picture.width = 132;
        picture.height = 92;
        picture.decoding = 'async';
        picture.loading = index < 2 ? 'eager' : 'lazy';
        picture.addEventListener('error', () => link.replaceChildren(element('span', 'Otwórz: ' + label)), { once: true });
        picture.src = url;
        link.append(picture);
        if (!url.includes('/npc/') && !label.endsWith(' · zdjęcie NPC')) {
          link.append(element('span', label, 'quest-map-caption'));
        }
        images.append(link);
      }
      if (images.children.length) row.append(images);
      steps.append(row);
    }
    content.replaceChildren(introduction, quick);
    if (!quest.category) content.append(dependencyList(thirdClassDependencies));
    content.append(steps);
    if (!dialog.open) dialog.showModal();
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

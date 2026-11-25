import quests from './thirdClassQuestData.json';
import './thirdClassQuests.css';


// Regional markers use the same Interlude world map as the epic quest guides.
const worldMap = 'https://lineage.pmfun.com/data/maps/world/Aden%20World%20Map%20Interlude%20%28big%29.png';
const regionPins = {
  'Town of Aden': [78.2, 54.6],
  'Town of Giran': [61.4, 77.6],
  'Town of Oren': [60.8, 59.1],
  'Hunters Village': [67.8, 63.9],
  'Town of Goddard': [77.1, 38.9],
  'Rune Township': [45.7, 40],
  'Wall of Argos': [84.8, 40.7],
  'Forsaken Plains': [85.5, 57.4],
  "The Giant's Cave": [88.2, 61.7],
};

const races = ['Ludzie', 'Elfy', 'Mroczne elfy', 'Orkowie', 'Krasnoludy'];
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/\p{Mark}/gu, '').replaceAll('’', "'");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const classArt = {
  "Duelist": "dual_sword",
  "Dreadnought": "saint_spear",
  "Phoenix Knight": "forgotten_blade",
  "Hell Knight": "dark_legions_edge",
  "Sagittarius": "draconic_bow",
  "Adventurer": "angel_slayer",
  "Archmage": "arcana_mace",
  "Soultaker": "demon_splinter",
  "Arcana Lord": "imperial_staff",
  "Cardinal": "elysian",
  "Hierophant": "meteor_shower",
  "Eva's Templar": "sword_of_miracle",
  "Sword Muse": "tallum_blade",
  "Wind Rider": "bloody_orchid",
  "Moonlight Sentinel": "soul_bow",
  "Mystic Muse": "worldtrees_branch",
  "Elemental Master": "elemental_sword",
  "Eva's Saint": "dasparions_staff",
  "Shillien Templar": "sword_of_ipos",
  "Spectral Dancer": "sirr_blade",
  "Ghost Hunter": "naga_storm",
  "Ghost Sentinel": "shyid_bow",
  "Storm Screamer": "dragon_flame_head",
  "Spectral Master": "hand_of_cabrio",
  "Shillien Saint": "tongue_of_themis",
  "Titan": "heavens_divider",
  "Grand Khavatari": "blood_tornado",
  "Dominator": "eye_of_soul",
  "Doomcryer": "basalt_battlehammer",
  "Fortune Seeker": "barakiel_axe",
  "Maestro": "doom_crusher"
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
  image.src = '/assets/interlude/icons/weapon_' + classArt[quest.name] + '_i00.png';
  image.alt = '';
  image.loading = 'lazy';
  return image;
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

  function mapImage(url, label) {
    const img = element('img');
    img.alt = label;
    img.addEventListener('error', () => img.replaceWith(element('p', 'Nie udało się wczytać obrazu.')));
    img.src = url;
    return img;
  }

  function showImage(url, label, step) {
    const portrait = url.includes('/npc/') || label.endsWith(' · zdjęcie NPC');
    const forumImage = url.startsWith('https://forum.l2mad.net/');
    const region = label.includes(' · ') && !portrait
      ? label.split(' · ').at(-1)
      : step.text.split(/\. | \(/, 1)[0];
    const point = portrait || forumImage ? null : regionPins[region];
    title.textContent = portrait ? label : 'Mapa · krok questa';
    previewContent.replaceChildren();
    if (point) {
      const frame = element('div', '', 'third-class-map-frame');
      const image = mapImage(worldMap, 'Mapa świata Interlude');
      const marker = element('span', '●', 'third-class-map-pin');
      marker.style.left = point[0] + '%';
      marker.style.top = point[1] + '%';
      marker.setAttribute('aria-hidden', 'true');
      marker.hidden = true;
      image.addEventListener('load', () => { marker.hidden = false; });
      if (image.complete && image.naturalWidth) marker.hidden = false;
      frame.append(image, marker);
      previewContent.append(element('p', 'Zaznaczony rejon: ' + region), frame);
    } else if (!portrait && !forumImage) {
      previewContent.append(element('p', 'Fragment mapy z poradnika. Dokładna pozycja wymaga potwierdzenia.'));
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

  races.forEach((name, id) => race.add(new Option(name, id)));
  const render = () => {
    const query = normalize(search.value.trim());
    const results = quests.filter((quest) => (race.value === '' || Number(race.value) === quest.race)
      && normalize(quest.from + ' ' + quest.name + ' ' + (quest.alias || '')).includes(query));
    count.textContent = results.length ? 'Poradniki: ' + results.length : 'Brak klas pasujących do wyszukiwania.';
    cards.replaceChildren(...results.map((quest) => {
      const button = element('button', '', 'third-class-card');
      button.type = 'button';
      button.dataset.race = quest.race;
      const copy = element('span', '', 'third-class-card-copy');
      copy.append(element('small', quest.from), element('strong', quest.name));
      button.append(illustration(quest), copy);
      button.addEventListener('click', () => openGuide(quest));
      return button;
    }));
  };

  function openGuide(quest) {
    dialog.querySelector('h3').textContent = quest.from + ' → ' + quest.name;
    const introduction = element('header', '', 'third-class-intro');
    const heading = element('div');
    heading.append(element('strong', 'Saga of the ' + (quest.name === 'Dreadnought' ? 'Dreadnoughts' : quest.name)),
      element('p', races[quest.race] + ' · poziom 76'));
    introduction.append(illustration(quest), heading);
    const supplies = element('p', 'Przygotuj: ' +
      ['Ice Crystal', 'Divine Stone of Wisdom', addedSupplies[quest.name]].filter(Boolean).join(' · '),
      'third-class-supplies');
    const steps = element('ol', '', 'third-class-steps');
    for (const [index, step] of quest.steps.entries()) {
      const row = element('li');
      row.append(element('h4', stepTitles[index]), element('p', step.text));
      if (step.forumRoute) {
        row.append(element('p', 'Dojście wg L2Mad: ' + step.forumRoute, 'third-class-forum-route'));
      }
      const images = element('div', '', 'third-class-maps');
      for (const [url, label] of step.images) {
        const link = element('button');
        link.type = 'button';
        link.setAttribute('aria-label', 'Powiększ: ' + label);
        link.addEventListener('click', () => showImage(url, label, step));
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
    const sourceLabel = quest.url.includes('forum.l2mad.ws') ? 'Poradnik źródłowy · Forum L2Mad' : 'Poradnik źródłowy · La2Wiki';
    content.replaceChildren(introduction, supplies, steps, externalLink(sourceLabel, quest.url));
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  search.addEventListener('input', render);
  race.addEventListener('change', render);
  render();
}

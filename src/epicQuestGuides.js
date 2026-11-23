const mapImage = (file, label, points = null) => ({
  src: `https://la2wiki.com/${file}`,
  label,
  aspectRatio: file.startsWith('town/') ? 1.14 : 1,
  points: (points?.length ? points : [{ x: 50, y: 50, label: 'Obszar wskazany w kroku' }]).map((point) => ({
    x: Math.max(3, Math.min(97, Number(point.x) || 50)),
    y: Math.max(3, Math.min(97, Number(point.y) || 50)),
    label: point.label || label
  }))
});
const mobImage = (slug, name, level) => ({
  src: `https://la2wiki.com/npc/${slug}.webp`,
  href: `https://la2wiki.com/interlude/npc/${slug}`,
  name,
  level
});

const guides = [
  {
    slug: 'baium',
    name: 'Baium',
    quest: 'An Arrogant Search',
    level: '60–75',
    mode: 'Powtarzalny · solo',
    item: 'Blooded Fabric',
    itemLabel: 'Tkanina splamiona krwią',
    itemUse: 'Każdy uczestnik potrzebuje własnej tkaniny. Jest zużywana przy wejściu do Baiuma.',
    image: '/images/bosses/baium.webp',
    summary: 'Zdobądź trzy relikwie, przygotuj białą tkaninę u Hanellin i splam ją krwią potworów z Tower of Insolence.',
    supplies: ['1 Healing Potion', '5 Antidote'],
    steps: [
      { area: 'Aden · Dark Elven Guild', npc: 'Magister Hanellin', text: 'Weź quest „An Arrogant Search”. Hanellin wyśle cię do Giant’s Cave po Titan’s Powerstone.', maps: [mapImage('town/c-aden.webp', 'Aden — położenie Magister Hanellin', [{ x: 31, y: 50, label: 'Dark Elf Guild · Magister Hanellin' }])] },
      { area: 'Giant’s Cave · dolne komnaty', npc: 'Lesser Giant Mage / Lesser Giant Elder', text: 'Poluj na oba typy olbrzymów, aż wypadnie Titan’s Powerstone. Następnie wróć do Hanellin w Aden.', maps: [mapImage('map/il/4-169.jpg', 'Giant’s Cave — dolne komnaty', [{ x: 22, y: 19, label: 'Kierunek Silent Valley · wejście do Giant’s Cave' }])], mobs: [mobImage('lesser-giant-mage', 'Lesser Giant Mage', '64'), mobImage('lesser-giant-elder', 'Lesser Giant Elder', '65')] },
      { area: 'Aden Castle → Cemetery', npc: 'Claudia Athebalt → Holy Ark of Secrecy 2', text: 'Claudia stoi przed zamkiem. Porozmawiaj z Arką na cmentarzu, zabij strażnika i oddaj klucz do skrzyni, aby dostać Book of Saint.', maps: [mapImage('town/c-aden.webp', 'Aden — Claudia Athebalt', [{ x: 84, y: 50, label: 'Brama do Aden Castle · Claudia Athebalt' }]), mapImage('map/il/4-139.jpg', 'Cemetery — miejsce Holy Ark', [{ x: 73, y: 30, label: 'Cemetery · Holy Ark of Secrecy 2' }])], mobs: [mobImage('ark-guardian-elberoth', 'Ark Guardian Elberoth', '60')] },
      { area: 'Giran → Tanor Canyon', npc: 'Martien → Holy Ark of Secrecy 3', text: 'Martien jest przy północnej bramie Giran. W Tanor Canyon wejdź na grzbiet i szukaj Arki na szczycie drugiej góry. Oddaj klucz, aby otrzymać Bough of Saint.', maps: [mapImage('town/c-giran.webp', 'Giran — Martien', [{ x: 84, y: 43, label: 'Północna brama · Martien' }]), mapImage('map/il/4-183.jpg', 'Tanor Canyon — położenie Arki', [{ x: 72, y: 78, label: 'Szczyt drugiej góry · Holy Ark of Secrecy 3' }])], mobs: [mobImage('ark-guardian-shadowfang', 'Ark Guardian Shadowfang', '60')] },
      { area: 'Dark Elf Village → Undine Waterfall', npc: 'Magister Harne → Ark Guardian’s Corpse', text: 'Po rozmowie z Harne idź do Undine Waterfall. Porozmawiaj ze zwłokami anioła, zabij Angel Killer i ponownie kliknij zwłoki, aby odebrać klucz. Wymień go na Blood of Saint.', maps: [mapImage('town/c-dark-elven.webp', 'Dark Elf Village — Magister Harne', [{ x: 58, y: 49, label: 'Świątynia · Magister Harne' }]), mapImage('map/il/4-154.jpg', 'Undine Waterfall — teren questa', [{ x: 28, y: 79, label: 'Podnóże góry · Ark Guardian’s Corpse' }])], mobs: [mobImage('angel-killer', 'Angel Killer', '60')] },
      { area: 'Aden → Tower of Insolence · piętro 7', npc: 'Magister Hanellin → Platinum Tribe Shaman / Overlord', text: 'Przynieś trzy relikwie Hanellin. Kup 1 Healing Potion i 5 Antidote. Wybierz gałąź „I want to make some money”, aby dostać białą tkaninę. Na 7. piętrze uderzaj wskazane moby bez broni, aż materiał stanie się Blooded Fabric.', maps: [mapImage('town/c-aden.webp', 'Aden — powrót do Hanellin', [{ x: 31, y: 50, label: 'Dark Elf Guild · Magister Hanellin' }])], mobs: [mobImage('platinum-tribe-overlord', 'Platinum Tribe Overlord', '71'), mobImage('platinum-tribe-shaman', 'Platinum Tribe Shaman', '70')] },
      { area: 'Tower of Insolence · piętro 14', npc: 'Angelic Vortex', text: 'Przejdź przez wir z Blooded Fabric w ekwipunku, aby dostać się do Baiuma.' }
    ],
    source: 'https://la2wiki.com/interlude/quest/an-arrogant-search'
  },
  {
    slug: 'antharas',
    name: 'Antharas',
    quest: 'Audience with the Land Dragon',
    level: '50–64',
    mode: 'Powtarzalny · solo',
    item: 'Portal Stone',
    itemLabel: 'Kamień portalu',
    itemUse: 'Każda postać wchodząca do Lair of Antharas musi mieć własny Portal Stone.',
    image: '/images/bosses/antharas.webp',
    summary: 'Zbierz potwierdzenia czterech strażników, zniszcz trzy Abyss Jewels i odbierz kamień od Theodrica.',
    supplies: ['Quest jest osobny dla każdej postaci', 'Zachowaj wszystkie fragmenty Abyss Jewel'],
    steps: [
      { area: 'Giran Castle Town · plac', npc: 'Seal Watchman Gabrielle', text: 'Rozpocznij „Audience with the Land Dragon”. Pierwsza część to trofea dla czterech strażników. W Interlude zadania można robić w dowolnej kolejności, ale wygodniej zebrać komplet przed rundą po NPC.', maps: [mapImage('town/c-giran.webp', 'Giran — Seal Watchman Gabrielle', [{ x: 51, y: 49, label: 'Centralny plac · Seal Watchman Gabrielle' }])] },
      { area: 'Forsaken Plains', npc: 'Marsh Stalker / Marsh Drake', text: 'Teleport z Aden. Zabijaj oba rodzaje mobów i zbierz Marsh Stalker Horn oraz Marsh Drake Talons.', maps: [mapImage('map/il/4-139.jpg', 'Forsaken Plains — obszar trofeów', [{ x: 48, y: 82, label: 'Forsaken Plains · Marsh Stalker i Marsh Drake' }])], mobs: [mobImage('marsh-stalker', 'Marsh Stalker', '54'), mobImage('marsh-drake', 'Marsh Drake', '55')] },
      { area: 'Giant’s Cave · wejście od Silent Valley', npc: 'Kranrot / Hamrut', text: 'Idź z Aden do Silent Valley i wejdź do Giant’s Cave. Zdobądź Kranrot Skin i Hamrut Leg.', maps: [mapImage('map/il/4-169.jpg', 'Giant’s Cave — obszar trofeów', [{ x: 22, y: 19, label: 'Kierunek Silent Valley · Kranrot i Hamrut' }])], mobs: [mobImage('kranrot', 'Kranrot', '59'), mobImage('hamrut', 'Hamrut', '58')] },
      { area: 'Forest of Mirrors → Anghel Waterfall', npc: 'Harit Lizardman Matriarch → Harit Lizardman Zealot', text: 'Zabijaj Matriarch, aż pojawią się questowe Zealoty. Zabijaj Zealoty, dopóki jeden nie upuści Totem of Land Dragon.', maps: [mapImage('map/il/4-154.jpg', 'Forest of Mirrors / Anghel Waterfall', [{ x: 70, y: 36, label: 'Las · Harit Lizardman Matriarch' }])], mobs: [mobImage('harit-lizardman-matriarch', 'Harit Lizardman Matriarch', '55'), mobImage('harit-lizardman-zealot', 'Harit Lizardman Zealot', '55')] },
      { area: 'Seal of Shilen / okolice Antharas’ Lair', npc: 'Blood Queen → Sacrifice of the Sacrificed', text: 'Zabij Blood Queen, aż pojawią się questowe moby Sacrifice of the Sacrificed. Zbierz Remains of Sacrified z jednego z nich.', maps: [mapImage('map/il/4-135.jpg', 'Teren Blood Queen i questowych mobów', [{ x: 43, y: 35, label: 'Okolice Seal of Shilen · Blood Queen' }])], mobs: [mobImage('blood-queen', 'Blood Queen', '60'), mobImage('sacrifice-of-the-sacrificed', 'Sacrifice of the Sacrificed', '20')] },
      { area: 'Ivory Tower · Hunter Village · Aden', npc: 'Magister Kaiena · Prefect Chakiris · Master Kendra · High Priest Orven', text: 'Oddaj Marsh Stalker Horn i Marsh Drake Talons Kaienie; Kranrot Skin i Hamrut Leg Chakirisowi; Totem Kendra; Remains of Sacrified Orvenowi. Zbierz cztery Mark of Watchman i wróć do Gabrielle.', maps: [mapImage('town/c-hunters.webp', 'Hunter Village — Prefect Chakiris', [{ x: 74, y: 44, label: 'Warrior Guild · Prefect Chakiris' }]), mapImage('town/c-aden.webp', 'Aden — Kendra i Orven', [{ x: 69, y: 55, label: 'Warrior Guild · Master Kendra' }, { x: 50, y: 31, label: 'Temple · High Priest Orven' }])] },
      { area: 'Gludin → Windy Hill', npc: 'Warehouse Chief Moke → Abyssal Jewel 1', text: 'Moke stoi w magazynie Gludin. Zabij Abyssal Jewel 1. Gdy przywoła Jewel Guardian Mara, zabij też strażników; zbierz fragment klejnotu i Mara Fang, po czym oddaj oba Moke’owi za Mark of Watchman.', maps: [mapImage('town/c-gludin.webp', 'Gludin — Warehouse Chief Moke', [{ x: 49, y: 61, label: 'Warehouse · Warehouse Chief Moke' }]), mapImage('map/il/4-147.jpg', 'Windy Hill — Abyssal Jewel 1', [{ x: 51, y: 52, label: 'Windy Hill · Abyssal Jewel 1' }])], mobs: [mobImage('abyssal-jewel-1', 'Abyssal Jewel 1', '60'), mobImage('jewel-guardian-mara', 'Jewel Guardian Mara', '')] },
      { area: 'Oren → Sea of Spores', npc: 'Blacksmith Helton → Abyssal Jewel 2', text: 'Helton jest w kuźni Oren. Zabij Abyssal Jewel 2 oraz przywołanych Jewel Guardian Musfel. Zbierz drugi fragment i Musfel Fang, wróć do Heltona po Mark of Watchman.', maps: [mapImage('town/c-oren.webp', 'Oren — Blacksmith Helton', [{ x: 66, y: 60, label: 'Blacksmith · Helton' }]), mapImage('map/il/4-135.jpg', 'Sea of Spores — Abyssal Jewel 2', [{ x: 73, y: 40, label: 'Sea of Spores · Abyssal Jewel 2' }])], mobs: [mobImage('abyssal-jewel-2', 'Abyssal Jewel 2', '60'), mobImage('jewel-guardian-musfel', 'Jewel Guardian Musfel', '')] },
      { area: 'Dragon Valley → polana przed Lair of Antharas', npc: 'Antharas Watchman Gilmore → Cave Keeper / Cave Maiden', text: 'Pokaż Gilmore’owi znaki. Na polanie przed wejściem do Lair of Antharas zabijaj Cave Keeper i Cave Maiden, aż pojawi się Abyssal Jewel 3. Zniszcz ją oraz trzech Jewel Guardian Pyton i zbierz fragment.', maps: [mapImage('map/il/4-169.jpg', 'Dragon Valley — polana przed wejściem do Antharas’ Lair', [{ x: 74, y: 61, label: 'Polana przed wejściem do Lair of Antharas' }])], mobs: [mobImage('cave-keeper', 'Cave Keeper', '58'), mobImage('cave-maiden', 'Cave Maiden', '59'), mobImage('abyssal-jewel-3', 'Abyssal Jewel 3', ''), mobImage('jewel-guardian-pyton', 'Jewel Guardian Pyton', '')] },
      { area: 'Antharas’ Lair · wejście', npc: 'Antharas Watchman Theodric', text: 'Oddaj fragment trzeciego Abyss Jewel Theodricowi. Odbierz Portal Stone i aktywuj nim Heart of Warding. Każda postać w rajdzie musi mieć własny kamień.', maps: [mapImage('map/il/4-169.jpg', 'Wejście do Antharas’ Lair — Theodric', [{ x: 74, y: 61, label: 'Theodric · wejście do Antharas’ Lair' }])] }
    ],
    source: 'https://la2wiki.com/interlude/quest/audience-with-the-land-dragon'
  },
  {
    slug: 'valakas',
    name: 'Valakas',
    quest: 'Into the Flame',
    level: '60–80',
    mode: 'Powtarzalny · party',
    item: 'Floating Stone',
    itemLabel: 'Pływający Kamień',
    itemUse: 'Kamień jest zużywany przy wejściu. Przed każdym rajdem powtórz końcową wymianę u Kleina.',
    image: '/images/bosses/valakas.webp',
    summary: 'Klein w Forge of the Gods wysyła po Vacualite do Hildy. Do jej wykonania potrzeba 50 Vacualite Ore.',
    supplies: ['50 Vacualite Ore na postać', 'Do Kleina prowadzi niebezpieczna droga przez Forge of the Gods'],
    steps: [
      { area: 'Forge of the Gods · Hall of Flames', npc: 'Watcher of Valakas Klein', text: 'Rozpocznij „Into the Flame”. Klein potrzebuje Vacualite, żeby przygotować Floating Stone. Do jego kuźni prowadzi długa, niebezpieczna trasa przez Forge of the Gods.', maps: [mapImage('map/il/4-58.jpg', 'Hall of Flames — Klein i wejście do komnaty Valakasa', [{ x: 48, y: 55, label: 'Hall of Flames · Watcher of Valakas Klein' }])] },
      { area: 'Goddard Castle Town · kuźnia', npc: 'Blacksmith Hilda', text: 'Hilda wyjaśni, że Vacualite powstaje z 50 Vacualite Ore. Po rozmowie idź na polowanie do Garden of Beasts.', maps: [mapImage('town/c-goddard.webp', 'Goddard — Blacksmith Hilda', [{ x: 37, y: 28, label: 'Blacksmith · Hilda' }])] },
      { area: 'Garden of Beasts', npc: 'Kookaburra · Bandersnatch · Grendel', text: 'Zabijaj te trzy rodzaje bestii, aż zbierzesz 50 Vacualite Ore. Następnie wróć do Hildy.', maps: [mapImage('map/il/4-89.jpg', 'Garden of Beasts — obszar polowania', [{ x: 71, y: 78, label: 'Garden of Beasts · bestie do polowania' }])], mobs: [mobImage('kookaburra', 'Kookaburra', '67'), mobImage('bandersnatch', 'Bandersnatch', '69'), mobImage('grendel', 'Grendel', '71')] },
      { area: 'Goddard Castle Town · kuźnia', npc: 'Blacksmith Hilda', text: 'Oddaj 50 rud Hildzie i odbierz Vacualite.', maps: [mapImage('town/c-goddard.webp', 'Goddard — Blacksmith Hilda', [{ x: 37, y: 28, label: 'Blacksmith · Hilda' }])] },
      { area: 'Forge of the Gods · Hall of Flames', npc: 'Watcher of Valakas Klein', text: 'Wymień Vacualite na Floating Stone. Przed kolejnym rajdem ponownie podejmij quest i odbierz nowy kamień.', maps: [mapImage('map/il/4-58.jpg', 'Hall of Flames — powrót do Kleina', [{ x: 48, y: 55, label: 'Hall of Flames · Watcher of Valakas Klein' }])] }
    ],
    source: 'https://la2wiki.com/interlude/quest/into-the-flame'
  },
  {
    slug: 'frintezza',
    name: 'Frintezza',
    quest: 'Four Goblets → Last Imperial Prince → Journey to a Settlement',
    level: '74–80',
    mode: 'Łańcuch questów · party',
    item: 'Removal Scroll',
    itemLabel: 'Frintezza’s Magic Force Field Removal Scroll',
    itemUse: 'Scrolla potrzebuje wyłącznie lider Command Channel. Jest zużywany przy wejściu na rajd.',
    image: '/images/bosses/frintezza.webp',
    summary: 'To łańcuch trzech zadań. Najdłuższe jest zdobycie czterech gobletów w Four Sepulchers.',
    supplies: ['Antique Brooch z questów Four Goblets', 'Entry Pass to the Sepulcher: 1 na osobę na każde wejście'],
    steps: [
      { area: 'Imperial Tomb → Four Sepulchers', npc: 'Ghost of Adventurer → Nameless Spirit', text: 'Weź „Relics of the Old Empire” u Ghost of Adventurer, aby zdobywać Entry Passes z mobów Imperial Tomb. Następnie zbierz party minimum 4 osoby. Każdy członek musi wziąć „Four Goblets” od Nameless Spirit i mieć własny pass na każde wejście.', maps: [mapImage('map/il/4-74.jpg', 'Imperial Tomb / Four Sepulchers — wejście i trasa', [{ x: 57, y: 55, label: 'Wejście do Four Sepulchers' }])] },
      { area: 'Four Sepulchers · 6 sal', npc: 'Sepulcher Manager → Shadow of Halisha', text: 'Lider wybiera jedną z czterech krypt. W salach 1–5 otwieraj Mysterious Box i szukaj klucza: w pierwszej zabij Halisha’s Officer, w trzeciej Executioner of Halisha, w czwartej Halisha’s Foreman, a w piątej Archon of Halisha. W sali 6 pokonaj Shadow of Halisha. Każdy z questem dostaje goblet; powtarzaj wejścia, aż uzbierasz cztery różne.', maps: [mapImage('map/il/4-74.jpg', 'Four Sepulchers — 6 sal i finałowy pokój', [{ x: 57, y: 55, label: 'Komnaty Four Sepulchers · sala 6' }])], mobs: [mobImage('halishas-officer', 'Halisha’s Officer', ''), mobImage('executioner-of-halisha', 'Executioner of Halisha', ''), mobImage('halishas-foreman', 'Halisha’s Foreman', ''), mobImage('archon-of-halisha', 'Archon of Halisha', ''), mobImage('shadow-of-halisha', 'Shadow of Halisha', '81')] },
      { area: 'Four Sepulchers · powrót do centrum', npc: 'Nameless Spirit', text: 'Oddaj cztery różne goblety Nameless Spiritowi i odbierz Antique Brooch.' , maps: [mapImage('map/il/4-74.jpg', 'Four Sepulchers — Nameless Spirit', [{ x: 57, y: 55, label: 'Centrum Four Sepulchers · Nameless Spirit' }])] },
      { area: 'Rune Township · Temple', npc: 'Nameless Spirit → Nurse Devorin → Nameless Spirit', text: 'Z Antique Brooch rozpocznij „Last Imperial Prince”. Porozmawiaj z Nurse Devorin w świątyni Rune i wróć do Nameless Spirit. Ten etap wykonuje się tylko raz.', maps: [mapImage('town/rune.webp', 'Rune Township — mapa NPC', [{ x: 35, y: 57, label: 'Temple · Nameless Spirit i Nurse Devorin' }])] },
      { area: 'Four Sepulchers → Wall of Argos', npc: 'Nameless Spirit → Canyon Antelope / Canyon Antelope Slave', text: 'Po ukończeniu poprzedniego questa rozpocznij „Journey to a Settlement”. Teleportuj się z Goddard do Wall of Argos i zabijaj Canyon Antelope lub Canyon Antelope Slave, aż wypadnie Antelope Skin.', maps: [mapImage('map/il/4-106.jpg', 'Wall of Argos — mapa obszaru questa', [{ x: 74, y: 86, label: 'Wall of Argos · polowanie na Canyon Antelope' }])], mobs: [mobImage('canyon-antelope', 'Canyon Antelope', '68'), mobImage('canyon-antelope-slave', 'Canyon Antelope Slave', '69')] },
      { area: 'Wall of Argos → Four Sepulchers', npc: 'Nameless Spirit', text: 'Oddaj Antelope Skin Spiritowi i odbierz scroll wejściowy. Przed kolejnym rajdem powtórz „Journey to a Settlement”. Scroll jest wymagany od lidera Command Channel; Entry Pass do sepulkry nadal musi mieć każdy uczestnik.' },
      { area: 'Imperial Tomb · wejście do Last Imperial Tomb', npc: 'Imperial Tomb Guide · lider Command Channel', text: 'Lider kanału dowodzenia ma mieć scroll przy sobie i porozmawiać z przewodnikiem. Pozostali gracze nie potrzebują tego scrolla.' }
    ],
    source: 'https://la2wiki.com/interlude/guide/frintezza'
  }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function pinMarkup(point, index) {
  return `<span class="quest-map-pin" style="--pin-x:${point.x}%;--pin-y:${point.y}%" aria-hidden="true"><span>${index + 1}</span></span>`;
}

function mapMarkup(map) {
  const src = escapeHtml(map.src);
  const label = escapeHtml(map.label);
  const points = map.points?.length ? map.points : [{ x: 50, y: 50, label: 'Obszar wskazany w kroku' }];
  const safePoints = points.map((point) => ({
    x: Math.max(3, Math.min(97, Number(point.x) || 50)),
    y: Math.max(3, Math.min(97, Number(point.y) || 50)),
    label: String(point.label || map.label)
  }));
  const pins = safePoints.map(pinMarkup).join('');
  const pointData = escapeHtml(JSON.stringify(safePoints));
  const mapRatio = map.aspectRatio || 1;
  return `<figure class="quest-map-card"><a class="quest-map-link" href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Otwórz mapę z zaznaczonym celem: ${label}" data-quest-map data-map-src="${src}" data-map-label="${label}" data-map-ratio="${mapRatio}" data-map-points="${pointData}"><span class="quest-map-image-frame" style="--map-ratio:${mapRatio}"><img src="${src}" alt="Wycinek mapy Interlude: ${label}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true;this.closest('.quest-map-link').classList.add('is-image-missing')" />${pins}</span><span class="quest-map-open" aria-hidden="true">⌕</span></a><figcaption><span>${label}</span><span class="quest-map-mark-count">${safePoints.length} ${safePoints.length === 1 ? 'CEL' : 'CELE'}</span></figcaption></figure>`;
}

function mobMarkup(mob) {
  const src = escapeHtml(mob.src);
  const href = escapeHtml(mob.href);
  const level = mob.level ? `<small>POZIOM ${escapeHtml(mob.level)}</small>` : '';
  return `<a class="quest-mob-card" href="${href}" target="_blank" rel="noopener noreferrer"><span class="quest-mob-portrait" aria-hidden="true"><img src="${src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true" /></span><span class="quest-mob-copy"><b>${escapeHtml(mob.name)}</b>${level}</span></a>`;
}

function stepMediaMarkup(step) {
  const maps = (step.maps || []).map(mapMarkup).join('');
  const mobs = (step.mobs || []).map(mobMarkup).join('');
  if (!maps && !mobs) return '';
  return `<div class="quest-route-media">${maps ? `<div class="quest-map-strip"><span class="quest-media-label">WYCINKI MAPY</span><div class="quest-map-grid">${maps}</div></div>` : ''}${mobs ? `<div class="quest-mob-group"><span class="quest-media-label">MOBY DO ZABICIA</span><div class="quest-mob-grid">${mobs}</div></div>` : ''}</div>`;
}

function stepMarkup(step, index) {
  return `<li class="quest-route-step"><span class="quest-route-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div class="quest-route-copy"><span class="quest-route-area">${escapeHtml(step.area)}</span><h4>${escapeHtml(step.npc)}</h4><p>${escapeHtml(step.text)}</p>${stepMediaMarkup(step)}</div></li>`;
}

function guideMarkup(guide) {
  const supplies = guide.supplies.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const steps = guide.steps.map(stepMarkup).join('');
  return `<details class="quest-guide" id="quest-${guide.slug}" data-quest-guide="${guide.slug}">
    <summary class="quest-guide-summary">
      <div class="quest-guide-summary-copy">
        <span class="quest-guide-kicker">QUEST WEJŚCIOWY · INTERLUDE</span>
        <h3>${escapeHtml(guide.name)}</h3>
        <p class="quest-guide-quest-name">${escapeHtml(guide.quest)}</p>
        <div class="quest-guide-tags"><span>Poziom ${escapeHtml(guide.level)}</span><span>${escapeHtml(guide.mode)}</span><span>Przedmiot: ${escapeHtml(guide.item)}</span></div>
        <p class="quest-guide-teaser">${escapeHtml(guide.summary)}</p>
        <span class="quest-guide-open"><span class="quest-guide-open-icon" aria-hidden="true">＋</span><span class="quest-guide-open-label">Zobacz quest, mapy i moby</span></span>
      </div>
      <div class="quest-guide-art"><img src="${escapeHtml(guide.image)}" alt="" loading="lazy" /><span class="quest-guide-art-label">${escapeHtml(guide.name)}</span></div>
    </summary>
    <div class="quest-guide-body">
      <div class="quest-guide-route-column"><div class="quest-guide-route-title"><span class="quest-route-emblem" aria-hidden="true">⌖</span><div><span class="eyebrow">SCHEMAT TRASY</span><h4>Gdzie iść i z kim rozmawiać</h4></div></div><ol class="quest-route-steps">${steps}</ol></div>
      <aside class="quest-guide-aside">
        <section class="quest-guide-entry"><span class="eyebrow">WARUNEK WEJŚCIA</span><h4>${escapeHtml(guide.itemLabel)}</h4><p>${escapeHtml(guide.itemUse)}</p></section>
        <section class="quest-guide-prep"><span class="eyebrow">PRZYGOTUJ</span><ul>${supplies}</ul></section>
        <p class="quest-guide-server-note">To klasyczny przebieg Interlude. Nazwy lokacji i NPC pozostawiam w grze po angielsku, żeby łatwo znaleźć je na mapie. Mapy i podglądy mobów pochodzą z bazy Interlude La2Wiki.</p>
        <a class="quest-guide-source" href="${escapeHtml(guide.source)}" target="_blank" rel="noopener noreferrer">Źródło questowe · Interlude ↗</a>
      </aside>
    </div>
  </details>`;
}

function ensureQuestMapModal() {
  let modal = document.getElementById('questMapLightbox');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'questMapLightbox';
  modal.className = 'quest-map-lightbox';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `<div class="quest-map-lightbox-backdrop" data-quest-map-close></div><section class="quest-map-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="questMapLightboxTitle" tabindex="-1"><header class="quest-map-lightbox-header"><div><span class="quest-map-lightbox-kicker">POWIĘKSZONA MAPA</span><h3 class="quest-map-lightbox-title" id="questMapLightboxTitle"></h3></div><button class="quest-map-lightbox-close" type="button" data-quest-map-close aria-label="Zamknij mapę">×</button></header><div class="quest-map-lightbox-stage"><div class="quest-map-lightbox-image-wrap"></div></div><div class="quest-map-lightbox-legend"><span class="quest-map-lightbox-legend-dot" aria-hidden="true"></span><span class="quest-map-lightbox-legend-text"></span></div></section>`;
  document.body.appendChild(modal);
  const close = () => {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal._previousOverflow) document.body.style.overflow = modal._previousOverflow;
    else document.body.style.removeProperty('overflow');
    modal.querySelector('.quest-map-lightbox-image-wrap').replaceChildren();
    if (modal._returnFocus?.isConnected) modal._returnFocus.focus({ preventScroll: true });
  };
  modal._closeMap = close;
  modal.querySelectorAll('[data-quest-map-close]').forEach((control) => control.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !modal.classList.contains('open')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  }, true);
  return modal;
}

function openQuestMap(link) {
  const modal = ensureQuestMapModal();
  const label = link.dataset.mapLabel || 'Mapa questa';
  let points = [];
  try { points = JSON.parse(link.dataset.mapPoints || '[]'); } catch { points = []; }
  if (!points.length) points = [{ x: 50, y: 50, label: 'Obszar wskazany w kroku' }];
  const wrap = modal.querySelector('.quest-map-lightbox-image-wrap');
  wrap.replaceChildren();
  const image = document.createElement('img');
  image.src = link.dataset.mapSrc || link.href;
  image.alt = `Mapa Interlude: ${label}`;
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  const setImageSize = () => {
    const ratio = image.naturalWidth / image.naturalHeight || Number(link.dataset.mapRatio) || 1;
    const maxWidth = Math.min(window.innerWidth * .94, 1280);
    const maxHeight = Math.min(window.innerHeight * .84, 1000);
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    wrap.style.width = `${Math.max(1, image.naturalWidth * scale)}px`;
    wrap.style.height = `${Math.max(1, image.naturalHeight * scale)}px`;
    wrap.style.aspectRatio = `${ratio}`;
  };
  image.addEventListener('load', setImageSize, { once: true });
  wrap.append(image);
  points.forEach((point, index) => {
    const pin = document.createElement('span');
    pin.className = 'quest-map-pin';
    pin.style.setProperty('--pin-x', `${Math.max(3, Math.min(97, Number(point.x) || 50))}%`);
    pin.style.setProperty('--pin-y', `${Math.max(3, Math.min(97, Number(point.y) || 50))}%`);
    pin.setAttribute('aria-hidden', 'true');
    const number = document.createElement('span');
    number.textContent = String(index + 1);
    pin.append(number);
    wrap.append(pin);
  });
  modal.querySelector('.quest-map-lightbox-title').textContent = label;
  const legend = points.map((point, index) => `${index + 1}. ${point.label || label}`).join('   ·   ');
  const markerVerb = points.length === 1 ? 'Czerwona kropka wskazuje' : 'Czerwone kropki wskazują';
  modal.querySelector('.quest-map-lightbox-legend-text').textContent = `${markerVerb}: ${legend}`;
  modal._previousOverflow = document.body.style.overflow;
  modal._returnFocus = link;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.querySelector('.quest-map-lightbox-close').focus({ preventScroll: true }));
}

function setGuideToggleLabel(guide, open) {
  const label = guide.querySelector('.quest-guide-open-label');
  if (label) label.textContent = open ? 'Ukryj poradnik' : 'Zobacz quest, mapy i moby';
}

function ensureQuestModal(list) {
  let modal = document.getElementById('epicQuestGuideModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'epicQuestGuideModal';
  modal.className = 'quest-guide-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `<div class="quest-guide-modal-backdrop" data-quest-guide-close></div><section class="quest-guide-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="questGuideModalTitle" tabindex="-1"><header class="quest-guide-modal-header"><span id="questGuideModalTitle">PORADNIK QUESTU WEJŚCIOWEGO</span><button class="quest-guide-modal-close" type="button" data-quest-guide-close aria-label="Zamknij poradnik">×</button></header><div class="quest-guide-modal-scroll"></div></section>`;
  document.body.appendChild(modal);
  const scroll = modal.querySelector('.quest-guide-modal-scroll');
  const close = () => {
    if (!modal.classList.contains('open')) return;
    const activeGuide = modal._activeGuide;
    if (activeGuide) {
      activeGuide.open = false;
      setGuideToggleLabel(activeGuide, false);
      list.append(activeGuide);
      modal._activeGuide = null;
    }
    scroll.replaceChildren();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal._previousOverflow) document.body.style.overflow = modal._previousOverflow;
    else document.body.style.removeProperty('overflow');
    if (modal._returnFocus?.isConnected) modal._returnFocus.focus({ preventScroll: true });
  };
  modal._closeQuestGuide = close;
  modal.querySelectorAll('[data-quest-guide-close]').forEach((control) => control.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !modal.classList.contains('open') || document.getElementById('questMapLightbox')?.classList.contains('open')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  }, true);
  return modal;
}

function openQuestGuide(slug, trigger, list) {
  const guide = [...list.querySelectorAll('[data-quest-guide]')].find((card) => card.dataset.questGuide === slug);
  if (!guide) return;
  const modal = ensureQuestModal(list);
  if (modal._activeGuide === guide && modal.classList.contains('open')) return;
  if (modal.classList.contains('open')) modal._closeQuestGuide();
  const scroll = modal.querySelector('.quest-guide-modal-scroll');
  modal._previousOverflow = document.body.style.overflow;
  modal._returnFocus = trigger || document.activeElement;
  guide.open = true;
  setGuideToggleLabel(guide, true);
  scroll.replaceChildren(guide);
  modal._activeGuide = guide;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    scroll.scrollTop = 0;
    modal.querySelector('.quest-guide-modal-close').focus({ preventScroll: true });
  });
}

function openGuideFromHash(list) {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const guide = [...list.querySelectorAll('[data-quest-guide]')].find((card) => card.id === id);
  if (guide) openQuestGuide(guide.dataset.questGuide, null, list);
}

export function renderEpicQuestGuides() {
  const list = document.querySelector('#epicQuestGuideList');
  if (!list) return;
  list.innerHTML = guides.map(guideMarkup).join('');
  list.querySelectorAll('.quest-map-image-frame img').forEach((image) => {
    const setMapRatio = () => {
      if (image.naturalWidth && image.naturalHeight) {
        image.parentElement.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
      }
    };
    if (image.complete) setMapRatio();
    else image.addEventListener('load', setMapRatio, { once: true });
  });
  list.querySelectorAll('.quest-guide').forEach((card) => {
    card.addEventListener('toggle', () => setGuideToggleLabel(card, card.open));
  });
  ensureQuestModal(list);
  ensureQuestMapModal();
  list.addEventListener('click', (event) => {
    const mapLink = event.target.closest('.quest-map-link[data-quest-map]');
    if (!mapLink || !list.contains(mapLink)) return;
    event.preventDefault();
    openQuestMap(mapLink);
  });
  window.addEventListener('orzel:open-epic-quest', (event) => openQuestGuide(event.detail?.slug, event.detail?.trigger, list));
  window.addEventListener('hashchange', () => openGuideFromHash(list));
  openGuideFromHash(list);
}

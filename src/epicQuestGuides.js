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
      { area: 'Aden · Dark Elven Guild', npc: 'Magister Hanellin', text: 'Weź quest „An Arrogant Search”. Hanellin wyśle cię po Titan’s Powerstone.' },
      { area: 'Giant’s Cave', npc: 'Lesser Giant Mage / Elder', text: 'Poluj na te moby, aż zdobędziesz Titan’s Powerstone. Wróć z nim do Hanellin.' },
      { area: 'Aden · Cemetery', npc: 'Claudia Athebalt → Holy Ark of Secrecy 2', text: 'Po rozmowie z Claudią otwórz Arkę i pokonaj Ark Guardian Elberoth. Przynieś Hanellin Book of Saint.' },
      { area: 'Giran · Tanor Canyon', npc: 'Martien → Holy Ark of Secrecy 3', text: 'Pokonaj Ark Guardian Shadowfang i zdobądź Bough of Saint.' },
      { area: 'Dark Elf Village · Undine Waterfall', npc: 'Magister Harne → Ark Guardian’s Corpse', text: 'Pokonaj Angel Killer i zdobądź Blood of Saint. Zanieś wszystkie trzy relikwie Hanellin.' },
      { area: 'Aden → Tower of Insolence · piętro 7', npc: 'Magister Hanellin → Platinum Tribe Shaman / Overlord', text: 'Kup 1 Healing Potion i 5 Antidote. W dialogu wybierz gałąź „I want to make some money”, która daje białą tkaninę do powtórnego użycia. Uderzaj moby bez broni, aż tkanina zmieni się w Blooded Fabric.' },
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
      { area: 'Giran Castle Town · plac', npc: 'Seal Watchman Gabrielle', text: 'Rozpocznij quest „Audience with the Land Dragon”.' },
      { area: 'Forsaken Plains · Giant’s Cave · Forest of Mirrors · Forbidden Gateway', npc: 'Marsh Drake / Stalker · Kranrot / Hamrut · Harit Lizardman · Blood Queen', text: 'Zbierz Marsh Stalker Horn i Marsh Drake Talons; Kranrot Skin i Hamrut Leg; Totem of Land Dragon; oraz Remains of Sacrified. Blood Queen w Forbidden Gateway przywołuje moby potrzebne do ostatniego przedmiotu.' },
      { area: 'Ivory Tower · Hunter Village · Aden', npc: 'Kaiena · Chakiris · Kendra · Orven', text: 'Oddaj trofea właściwym strażnikom: Kaiena przyjmuje przedmioty z Forsaken Plains, Chakiris z Giant’s Cave, Kendra totem, a Orven pozostałości ofiary. Odbierz cztery Mark of Watchman i zanieś je Gabrielle.' },
      { area: 'Gludin · Windy Hill · Oren · Sea of Spores', npc: 'Warehouse Chief Moke · Blacksmith Helton', text: 'Moke kieruje do Abyssal Jewel 1 w Windy Hill; wróć do niego z fragmentem i Mara Fang. Helton wysyła do Abyssal Jewel 2 w Sea of Spores; wróć z fragmentem i Musfel Fang. Dwa kolejne Mark of Watchman oddaj Gabrielle.' },
      { area: 'Dragon Valley · wejście do Antharas’ Lair', npc: 'Gilmore · Cave Keeper / Cave Maiden', text: 'Pokaż Gilmore’owi znaki strażników. Poluj na Cave Keeper i Cave Maiden, aż pojawi się trzecia Abyss Jewel. Pokonaj ją i przywołanych strażników, by zdobyć ostatni fragment.' },
      { area: 'Antharas’ Lair · wejście', npc: 'Antharas Watchman Theodric', text: 'Oddaj fragmenty trzeciego Abyss Jewel. Theodric da ci Portal Stone; aktywuj nim Heart of Warding.' }
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
      { area: 'Forge of the Gods · Hall of Flames', npc: 'Watcher of Valakas Klein', text: 'Rozpocznij quest „Into the Flame”. Klein wyjaśni, że do przejścia potrzebny jest Floating Stone, wykonany z Vacualite.' },
      { area: 'Goddard Castle Town · kuźnia', npc: 'Blacksmith Hilda', text: 'Porozmawiaj z Hildą. Poprosi o 50 Vacualite Ore z Garden of Beasts.' },
      { area: 'Garden of Beasts', npc: 'Kookaburra · Bandersnatch · Grendel', text: 'Poluj na te moby, aż zbierzesz 50 Vacualite Ore.' },
      { area: 'Goddard Castle Town · kuźnia', npc: 'Blacksmith Hilda', text: 'Oddaj 50 rud i odbierz Vacualite.' },
      { area: 'Forge of the Gods · Hall of Flames', npc: 'Watcher of Valakas Klein', text: 'Wymień Vacualite na Floating Stone. Przed kolejnym rajdem ponownie podejmij quest i odbierz nowy kamień.' }
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
      { area: 'Imperial Tomb · Four Sepulchers', npc: 'Ghost of Adventurer → Nameless Spirit', text: 'Najpierw weź „Relics of the Old Empire”, aby farmić Entry Passes. Zbierz drużynę co najmniej 4 osób. Każdy bierze „Four Goblets” od Nameless Spirit; przejdź cztery sepulkry i zdobądź cztery różne goblety. Jeśli wypadną duplikaty, potrzebne będą kolejne wejścia. Oddaj komplet Spiritowi i odbierz Antique Brooch.' },
      { area: 'Rune Township · Temple', npc: 'Nameless Spirit → Nurse Devorin → Nameless Spirit', text: 'Z Antique Brooch rozpocznij „Last Imperial Prince”. Porozmawiaj z Nurse Devorin w świątyni Rune i wróć do Nameless Spirit. Ten etap wykonuje się raz.' },
      { area: 'Four Sepulchers → Wall of Argos', npc: 'Nameless Spirit → Canyon Antelope / Slave', text: 'Po ukończeniu poprzedniego questa rozpocznij „Journey to a Settlement”. Teleportuj się z Goddard do Wall of Argos i zbierz Antelope Skin.' },
      { area: 'Wall of Argos → Four Sepulchers', npc: 'Nameless Spirit', text: 'Wróć ze skórą do Spiritu i odbierz scroll wejściowy. Przed kolejnym rajdem powtarzaj „Journey to a Settlement”.' },
      { area: 'Imperial Tomb · wejście do Last Imperial Tomb', npc: 'Imperial Tomb Guide · lider Command Channel', text: 'Lider kanału dowodzenia ma mieć scroll przy sobie i porozmawiać z przewodnikiem. Pozostali gracze nie potrzebują tego scrolla.' }
    ],
    source: 'https://la2wiki.com/interlude/guide/frintezza'
  }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function stepMarkup(step, index) {
  return `<li class="quest-route-step"><span class="quest-route-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div class="quest-route-copy"><span class="quest-route-area">${escapeHtml(step.area)}</span><h4>${escapeHtml(step.npc)}</h4><p>${escapeHtml(step.text)}</p></div></li>`;
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
        <span class="quest-guide-open"><span class="quest-guide-open-icon" aria-hidden="true">＋</span><span class="quest-guide-open-label">Pokaż trasę i NPC</span></span>
      </div>
      <div class="quest-guide-art"><img src="${escapeHtml(guide.image)}" alt="" loading="lazy" /><span class="quest-guide-art-label">${escapeHtml(guide.name)}</span></div>
    </summary>
    <div class="quest-guide-body">
      <div class="quest-guide-route-column"><div class="quest-guide-route-title"><span class="quest-route-emblem" aria-hidden="true">⌖</span><div><span class="eyebrow">SCHEMAT TRASY</span><h4>Gdzie iść i z kim rozmawiać</h4></div></div><ol class="quest-route-steps">${steps}</ol></div>
      <aside class="quest-guide-aside">
        <section class="quest-guide-entry"><span class="eyebrow">WARUNEK WEJŚCIA</span><h4>${escapeHtml(guide.itemLabel)}</h4><p>${escapeHtml(guide.itemUse)}</p></section>
        <section class="quest-guide-prep"><span class="eyebrow">PRZYGOTUJ</span><ul>${supplies}</ul></section>
        <p class="quest-guide-server-note">To klasyczny przebieg Interlude. Nazwy lokacji i NPC pozostawiam w grze po angielsku, żeby łatwo znaleźć je na mapie.</p>
        <a class="quest-guide-source" href="${escapeHtml(guide.source)}" target="_blank" rel="noopener noreferrer">Źródło questowe · Interlude ↗</a>
      </aside>
    </div>
  </details>`;
}

function openGuideFromHash() {
  const guide = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (!guide?.matches('[data-quest-guide]')) return;
  guide.open = true;
  window.requestAnimationFrame(() => guide.scrollIntoView({ block: 'start', behavior: 'smooth' }));
}

export function renderEpicQuestGuides() {
  const list = document.querySelector('#epicQuestGuideList');
  if (!list) return;
  list.innerHTML = guides.map(guideMarkup).join('');
  list.querySelectorAll('.quest-guide').forEach((card) => {
    const label = card.querySelector('.quest-guide-open-label');
    card.addEventListener('toggle', () => {
      if (label) label.textContent = card.open ? 'Zamknij trasę i NPC' : 'Pokaż trasę i NPC';
    });
  });
  window.addEventListener('hashchange', openGuideFromHash);
  openGuideFromHash();
}

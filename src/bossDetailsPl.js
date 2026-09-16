import { bossArtworkUrl } from './bossArtwork.js';

const BOSS_INFO = {
  'Queen Ant': {
    place: 'Ant Nest / Wasteland',
    kind: 'Epic Raid Boss',
    npcId: 29001,
    level: 40,
    hp: '346 301',
    pAtk: '302',
    mAtk: '220',
    pDef: '439',
    mDef: '591',
    text: 'Królowa Mrówek to jeden z najbardziej rozpoznawalnych bossów w Lineage 2. Dowodzi kolonią w Ant Nest i jest ważnym celem klanów ze względu na prestiż oraz walkę o kontrolę nad respawnem.',
    drops: ['Ring of Queen Ant', 'Adena', 'Salamander Skin Mail', "Sage's Rag", 'Half Plate Armor / Plate Gaiters'],
    mechanics: ['Kontrola wejścia do Ant Nest jest równie ważna jak sam DPS.', 'Przygotuj party pod szybkie wejście i ochronę grupy podczas PvP.']
  },
  'Core': {
    place: 'Cruma Tower',
    kind: 'Epic Raid Boss',
    npcId: 29006,
    level: 50,
    hp: '244 871',
    pAtk: '488',
    mAtk: '1 408',
    pDef: '593',
    mDef: '816',
    text: 'Core to potężna, mechaniczna istota ukryta wewnątrz Cruma Tower. Walka odbywa się w zamkniętej przestrzeni, dlatego liczy się dobre ustawienie grupy i utrzymanie kontroli nad wejściem.',
    drops: ['Ring of Core', 'High-Grade Life Stone: level 52', 'High-Grade Life Stone: level 49', 'Adena'],
    mechanics: ['Zamknięta przestrzeń premiuje dobrą organizację party.', 'Pilnuj dojścia do sali i możliwości wejścia przeciwników.']
  },
  'Orfen': {
    place: 'Sea of Spores',
    kind: 'Epic Raid Boss',
    npcId: 29014,
    level: 50,
    hp: '489 744',
    pAtk: '504',
    mAtk: '349',
    pDef: '593',
    mDef: '816',
    text: 'Orfen to mroczna władczyni Sea of Spores. Jest bossem związanym z otwartą strefą, więc utrzymanie terenu często jest równie ważne jak samo zabicie bossa.',
    drops: ['Earring of Orfen', 'High-Grade Life Stone: level 49', 'Ring of Ages', 'Earring of Binding', 'Adena'],
    mechanics: ['Otwarta strefa oznacza dużą rolę kontroli terenu.', 'Warto zabezpieczyć dojścia jeszcze przed wejściem pełnego party.']
  },
  'Baium': {
    place: 'Tower of Insolence',
    kind: 'Epic Raid Boss',
    npcId: 29020,
    level: 75,
    hp: '5 571 187',
    pAtk: '6 117',
    mAtk: '13 033',
    pDef: '1 752',
    mDef: '4 071',
    text: 'Baium to legendarny władca uwięziony na szczycie Tower of Insolence. Należy do najważniejszych bossów w grze i często staje się centrum dużych walk PvP.',
    drops: ['Ring of Baium', 'Ancient Book - Divine Inspiration (Manuscript)', 'Tallum Blade', 'Elemental Sword', "Dasparion's Staff"],
    mechanics: ['Największe znaczenie ma przygotowanie wejścia na szczyt Tower of Insolence.', 'Przed aktywacją bossa warto ustawić party i role na wypadek natychmiastowego PvP.']
  },
  'Zaken': {
    place: "Devil's Isle",
    kind: 'Epic Raid Boss',
    npcId: 29022,
    level: 60,
    hp: '1 293 211',
    pAtk: '6 636',
    mAtk: '55 037',
    pDef: '795',
    mDef: '1 087',
    text: 'Zaken to nieumarły pirat i jeden z najbardziej charakterystycznych bossów Lineage 2. Jego siedziba znajduje się na Devil’s Isle, gdzie ciasne przejścia szybko potrafią zamienić walkę w chaos.',
    drops: ['Earring of Zaken', 'Eminence Bow', 'Yaksa Mace', "Zubei / Avadon equipment", 'Adena'],
    mechanics: ['Ciasna lokacja wymaga dobrej komunikacji i wspólnego prowadzenia grupy.', 'Nie rozciągaj party przy przejściach między pomieszczeniami.']
  },
  'Frintezza': {
    place: 'Imperial Tomb',
    kind: 'Epic Raid Boss',
    npcId: 29045,
    level: 90,
    hp: '1 191 289',
    pAtk: '8 088',
    mAtk: '3 071',
    pDef: '1 802',
    mDef: '3 522',
    text: 'Frintezza to książę związany z Imperial Tomb i jednym z najbardziej widowiskowych encounterów w Lineage 2. Starcie składa się z kilku etapów i kończy walką ze Scarlet Van Halisha.',
    drops: ["Frintezza's Necklace", 'Ancient Book - Divine Inspiration (Manuscript)', 'Blessed Scroll of Escape', 'Blessed Scroll of Resurrection', 'Adena'],
    dropNote: 'Najważniejszy loot encounteru wypada ze Scarlet Van Halisha.',
    mechanics: ['Encounter jest wieloetapowy — zachowaj zasoby na końcową fazę.', 'Kluczowa jest koncentracja całej grupy podczas przejść między etapami.']
  },
  'Antharas': {
    place: "Antharas' Lair",
    kind: 'Epic Raid Boss',
    npcId: 29019,
    level: 79,
    hp: '19 717 847',
    pAtk: '12 713',
    mAtk: '87 781',
    pDef: '2 304',
    mDef: '1 487',
    text: 'Antharas, Smok Ziemi, to jeden z największych i najbardziej ikonicznych bossów w Lineage 2. Walka w jego legowisku wymaga dużej, dobrze przygotowanej grupy i wysokiej przeżywalności.',
    drops: ['Earring of Antharas', 'Scroll: Enchant Weapon (Grade A)', 'Blessed Scroll of Escape', 'Blessed Scroll of Resurrection', 'Adena'],
    mechanics: ['To długa walka — przeżywalność jest ważniejsza od chwilowego maksymalnego DPS.', 'Utrzymuj porządek formacji i reaguj na ruch bossa zamiast bezmyślnie stać w miejscu.']
  },
  'Valakas': {
    place: "Valakas' Lair / Forge of the Gods",
    kind: 'Epic Raid Boss',
    npcId: 29028,
    level: 85,
    hp: '25 095 443',
    pAtk: '13 676',
    mAtk: '110 446',
    pDef: '2 255',
    mDef: '1 633',
    text: 'Valakas, Smok Ognia, należy do najpotężniejszych bossów świata Lineage 2. Samo dotarcie do niego oraz walka wymagają bardzo dobrej koordynacji całego klanu.',
    drops: ['Necklace of Valakas', 'High-Grade Life Stone: level 70', 'Ancient Book - Divine Inspiration (Manuscript)', 'Scroll: Enchant Weapon (Grade A)', 'S-grade equipment / Adena'],
    mechanics: ['Valakas jest odporny na ogień i podatny na wodę w referencyjnych danych Interlude.', 'Utrzymuj rozproszenie i reaguj na zmianę pozycji smoka.']
  }
};

const formatValue = (value) => value ?? '—';

function bossNameFromCard(card) {
  const span = card.querySelector('span');
  const raw = span?.childNodes?.[0]?.textContent?.trim() || '';
  return Object.keys(BOSS_INFO).find((name) => name.toLowerCase() === raw.toLowerCase()) || raw;
}

function ensureStyles() {
  if (document.querySelector('#bossInfoModalPlStyles')) return;
  const style = document.createElement('style');
  style.id = 'bossInfoModalPlStyles';
  style.textContent = `
    .boss-card[data-boss-details]{cursor:pointer;transition:transform .18s ease,filter .18s ease,border-color .18s ease}
    .boss-card[data-boss-details]:hover,.boss-card[data-boss-details]:focus-visible{transform:translateY(-3px);filter:brightness(1.08);border-color:#d0a24c;outline:none}
    .boss-card[data-boss-details]::after{content:'KLIKNIJ, ABY ZOBACZYĆ SZCZEGÓŁY';position:absolute;left:10px;right:10px;bottom:8px;z-index:3;padding:5px 7px;background:#050707d9;border:1px solid #6e552b;color:#d8b468;font-size:8px;font-weight:900;letter-spacing:.08em;text-align:center;opacity:0;transform:translateY(5px);transition:.18s ease;pointer-events:none}
    .boss-card[data-boss-details]:hover::after,.boss-card[data-boss-details]:focus-visible::after{opacity:1;transform:none}
    #bossInfoModalPl{position:fixed;inset:0;z-index:30000;display:none;place-items:center;padding:18px;background:#000d;backdrop-filter:blur(7px)}
    #bossInfoModalPl.open{display:grid}
    .boss-info-pl-card{position:relative;display:grid;grid-template-columns:minmax(300px,39%) 1fr;width:min(1080px,96vw);max-height:90vh;overflow:auto;border:1px solid #8b682f;background:linear-gradient(145deg,#0d1111,#070909);box-shadow:0 30px 100px #000;color:#d8d3c8}
    .boss-info-pl-art{min-height:100%;background-position:center;background-size:cover;position:relative;background-color:#090c0c}
    .boss-info-pl-art::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 45%,#090c0cf2 100%),linear-gradient(0deg,#090c0c99,transparent 55%)}
    .boss-info-pl-content{padding:30px 34px 28px;min-width:0}
    .boss-info-pl-kicker{display:block;color:#d1a24a;font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}
    .boss-info-pl-content h3{margin:7px 0 4px;color:#f1e5cf;font:700 36px/1.05 Georgia,serif;text-transform:uppercase}
    .boss-info-pl-kind{display:inline-block;margin:8px 0 16px;padding:7px 10px;border:1px solid #7a5d2c;color:#ddb65f;background:#17130d;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
    .boss-info-pl-text{margin:0;color:#aaa399;font-size:13px;line-height:1.68}
    .boss-info-pl-meta{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;margin-top:18px;padding-top:15px;border-top:1px solid #352b1c;font-size:11px}.boss-info-pl-meta b{color:#d2aa5a}.boss-info-pl-meta span{color:#aaa39a}
    .boss-info-pl-section{margin-top:20px;padding-top:16px;border-top:1px solid #352b1c}.boss-info-pl-section h4{margin:0 0 10px;color:#d6ac59;font:700 11px Inter,sans-serif;letter-spacing:.13em;text-transform:uppercase}
    .boss-info-pl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.boss-info-pl-stat{padding:9px 10px;border:1px solid #342c20;background:#0b0e0e}.boss-info-pl-stat span{display:block;color:#736d64;font-size:8px;font-weight:800;text-transform:uppercase}.boss-info-pl-stat b{display:block;margin-top:4px;color:#ece1cf;font-size:13px;font-variant-numeric:tabular-nums}
    .boss-info-pl-drop{display:flex;flex-wrap:wrap;gap:7px}.boss-info-pl-drop span{padding:7px 9px;border:1px solid #594525;background:#14110c;color:#ccb16f;font-size:10px}.boss-info-pl-drop span:first-child{border-color:#a77a2f;background:linear-gradient(135deg,#34240f,#17100a);color:#f1d48b;font-weight:900}
    .boss-info-pl-drop-note{margin:8px 0 0;color:#8d857a;font-size:10px;font-style:italic}
    .boss-info-pl-mechanics{margin:0;padding-left:18px;color:#aaa399;font-size:11px;line-height:1.6}.boss-info-pl-mechanics li+li{margin-top:5px}
    .boss-info-pl-reference{margin-top:20px;padding:10px 12px;border:1px solid #2f332d;background:#0a0d0c;color:#777f75;font-size:9px;line-height:1.55}.boss-info-pl-reference b{color:#9ca894}.boss-info-pl-source{color:#b99b5d;text-decoration:none}.boss-info-pl-source:hover{text-decoration:underline}
    .boss-info-pl-close{position:absolute;right:14px;top:10px;z-index:4;width:38px;height:38px;border:1px solid #6c5128;background:#0a0d0df2;color:#d7b66e;font-size:24px;cursor:pointer}
    @media(max-width:760px){#bossInfoModalPl{padding:8px}.boss-info-pl-card{grid-template-columns:1fr;width:100%;max-height:94vh}.boss-info-pl-art{min-height:250px;height:250px}.boss-info-pl-art::after{background:linear-gradient(0deg,#090c0cf2,transparent 72%)}.boss-info-pl-content{padding:22px 18px 20px}.boss-info-pl-content h3{font-size:28px}.boss-info-pl-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.boss-card[data-boss-details]::after{display:none}}
  `;
  document.head.appendChild(style);
}

function ensureModal() {
  ensureStyles();
  let modal = document.querySelector('#bossInfoModalPl');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'bossInfoModalPl';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <article class="boss-info-pl-card" role="dialog" aria-modal="true" aria-labelledby="bossInfoPlTitle">
      <button class="boss-info-pl-close" type="button" aria-label="Zamknij">×</button>
      <div class="boss-info-pl-art"></div>
      <div class="boss-info-pl-content">
        <span class="boss-info-pl-kicker">Hall of Legends · Interlude</span>
        <h3 id="bossInfoPlTitle">Boss</h3>
        <span class="boss-info-pl-kind">Epic Raid Boss</span>
        <p id="bossInfoPlText" class="boss-info-pl-text"></p>
        <div class="boss-info-pl-meta"><b>Lokalizacja</b><span id="bossInfoPlPlace">—</span><b>Kategoria</b><span id="bossInfoPlKind">—</span></div>
        <section class="boss-info-pl-section"><h4>Statystyki</h4><div id="bossInfoPlStats" class="boss-info-pl-stats"></div></section>
        <section class="boss-info-pl-section"><h4>Najważniejszy drop</h4><div id="bossInfoPlDrop" class="boss-info-pl-drop"></div><p id="bossInfoPlDropNote" class="boss-info-pl-drop-note"></p></section>
        <section class="boss-info-pl-section"><h4>Mechanika / info</h4><ul id="bossInfoPlMechanics" class="boss-info-pl-mechanics"></ul></section>
        <div class="boss-info-pl-reference"><b>Uwaga:</b> dane statystyk i dropu są referencją dla Lineage 2 Interlude. Reborn może mieć własne ustawienia serwera, dlatego wartości i loot mogą się różnić. <a id="bossInfoPlSource" class="boss-info-pl-source" href="#" target="_blank" rel="noopener noreferrer">L2Tools · Interlude ↗</a></div>
      </div>
    </article>`;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.removeProperty('overflow');
    const returnTarget = modal._returnTarget;
    if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
  };
  modal._closeBossInfo = close;
  modal.querySelector('.boss-info-pl-close').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    close();
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      event.preventDefault();
      close();
    }
  });
  return modal;
}

function statMarkup(label, value) {
  return `<div class="boss-info-pl-stat"><span>${label}</span><b>${formatValue(value)}</b></div>`;
}

function openBossDetails(name, trigger) {
  const info = BOSS_INFO[name];
  if (!info) return;
  const modal = ensureModal();
  const art = bossArtworkUrl(name);
  modal._returnTarget = trigger || null;
  modal.querySelector('#bossInfoPlTitle').textContent = name;
  modal.querySelector('#bossInfoPlText').textContent = info.text;
  modal.querySelector('#bossInfoPlPlace').textContent = info.place;
  modal.querySelector('#bossInfoPlKind').textContent = info.kind;
  modal.querySelector('.boss-info-pl-kind').textContent = info.kind;
  modal.querySelector('.boss-info-pl-art').style.backgroundImage = art ? `url(${JSON.stringify(art)})` : 'none';
  modal.querySelector('#bossInfoPlStats').innerHTML = [
    statMarkup('Level', info.level), statMarkup('HP', info.hp), statMarkup('P. Atk', info.pAtk),
    statMarkup('M. Atk', info.mAtk), statMarkup('P. Def', info.pDef), statMarkup('M. Def', info.mDef)
  ].join('');
  modal.querySelector('#bossInfoPlDrop').innerHTML = (info.drops || []).map((drop) => `<span>${drop}</span>`).join('') || '<span>—</span>';
  modal.querySelector('#bossInfoPlDropNote').textContent = info.dropNote || '';
  modal.querySelector('#bossInfoPlMechanics').innerHTML = (info.mechanics || []).map((item) => `<li>${item}</li>`).join('') || '<li>Brak dodatkowych informacji.</li>';
  const source = modal.querySelector('#bossInfoPlSource');
  source.href = `https://l2tools.org/interlude/mobs?query=${encodeURIComponent(name)}`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.boss-info-pl-close').focus({ preventScroll: true });
}

function installBossDetailsPl() {
  if (window.__obBossDetailsPlInstalled) return;
  window.__obBossDetailsPlInstalled = true;
  ensureModal();

  const gallery = document.querySelector('.boss-gallery');
  if (!gallery) return;

  gallery.querySelectorAll('.boss-card').forEach((card) => {
    const name = bossNameFromCard(card);
    if (!BOSS_INFO[name]) return;
    card.dataset.bossDetails = name;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Pokaż szczegóły bossa ${name}`);
  });

  // Capture phase intentionally owns clicks on Epic RB cards. This prevents any old/legacy
  // gallery handler from opening a second dialog after this one is closed.
  gallery.addEventListener('click', (event) => {
    const card = event.target.closest('.boss-card[data-boss-details]');
    if (!card || !gallery.contains(card)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openBossDetails(card.dataset.bossDetails, card);
  }, true);

  gallery.addEventListener('keydown', (event) => {
    const card = event.target.closest('.boss-card[data-boss-details]');
    if (!card || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openBossDetails(card.dataset.bossDetails, card);
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBossDetailsPl, { once: true });
else installBossDetailsPl();

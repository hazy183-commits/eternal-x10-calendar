import { bossArtworkUrl } from './bossArtwork.js';

const d = (name, chance, qty, grade = '') => ({ name, chance, qty, grade });

const BOSS_INFO = {
  'Queen Ant': {
    place: 'Ant Nest / Wasteland', kind: 'Epic Raid Boss', npcId: 29001, level: 40,
    hp: '346 301', pAtk: '302', mAtk: '220', pDef: '439', mDef: '591', artPos: '50% 42%',
    text: 'Królowa Mrówek to jeden z najbardziej rozpoznawalnych bossów w Lineage 2. Dowodzi kolonią w Ant Nest i jest ważnym celem klanów ze względu na prestiż oraz walkę o kontrolę nad respawnem.',
    drops: [
      d('Adena', '100%', '120 000–170 000'), d('Salamander Skin Mail', '42.5%', '1–2', 'D'), d("Sage's Rag", '42.5%', '1–2', 'D'),
      d('Half Plate Armor', '37.5%', '1–2', 'D'), d('Plate Gaiters', '37.5%', '1–2', 'D'), d('Mithril Ring', '35%', '1–2', 'D'),
      d("Omen Beast's Eye Earring", '35%', '1–2', 'D'), d('Ring of Queen Ant', '30%', '1', 'EPIC'), d('Necklace of Darkness', '30%', '1–2', 'D'),
      d('Square Shield', '20%', '1–3', 'D'), d('Plate Helmet', '20%', '1–3', 'D'), d('Assault Boots', '20%', '1–3', 'D'),
      d('Ogre Power Gauntlets', '20%', '1–3', 'D'), d('Scroll: Enchant Weapon (Grade D)', '20%', '1–3'), d('Claymore', '6%', '1', 'D'),
      d('Elven Long Sword', '6%', '1', 'D'), d('Bonebreaker', '5.5%', '1', 'D'), d('Ghost Staff', '5.5%', '1', 'D'),
      d('Mithril Dagger', '5.5%', '1', 'D'), d('Light Crossbow', '5.5%', '1', 'D'), d('Glaive', '5.5%', '1', 'D'),
      d('Staff of Life', '5.5%', '1', 'D'), d('Scallop Jamadhr', '5%', '1', 'D')
    ],
    mechanics: ['Podatna na ogień, posiada wysoką odporność na ataki z łuku.', 'Kontrola wejścia do Ant Nest jest równie ważna jak sam DPS.']
  },
  'Core': {
    place: 'Cruma Tower', kind: 'Epic Raid Boss', npcId: 29006, level: 50,
    hp: '622 493', pAtk: '2 439', mAtk: '15 819', pDef: '2 227', mDef: '904', artPos: '50% 50%',
    text: 'Core to potężna, mechaniczna istota ukryta wewnątrz Cruma Tower. Walka odbywa się w zamkniętej przestrzeni, dlatego liczy się dobre ustawienie grupy i utrzymanie kontroli nad wejściem.',
    drops: [
      d('Adena', '100%', '100 000–150 000'), d('High-Grade Life Stone: level 49', '45%', '2–4'), d('High-Grade Life Stone: level 52', '40%', '2–4'),
      d('Ring of Core', '30%', '1', 'EPIC'), d('Scroll: Enchant Weapon (Grade C)', '14%', '1'), d('Composite Shield', '14%', '1', 'C'),
      d("Demon's Gloves", '14%', '1', 'C'), d("Demon's Boots", '14%', '1', 'C'), d('Composite Helmet', '14%', '1', 'C'),
      d("Demon's Stockings", '12%', '1', 'C'), d("Demon's Tunic", '12%', '1', 'C'), d('Theca Leather Gaiters', '12%', '1', 'C'),
      d('Theca Leather Armor', '12%', '1', 'C'), d('Composite Armor', '12%', '1', 'C'), d('Top-Grade Life Stone: level 49', '10%', '1–2'),
      d('Top-Grade Life Stone: level 52', '5%', '1–2'), d('War Axe', '4.8%', '1', 'C'), d('Dark Screamer', '4.8%', '1', 'C'),
      d('Akat Long Bow', '4.8%', '1', 'C'), d('Scorpion', '4.8%', '1', 'C'), d('Caliburs', '4.8%', '1', 'C'),
      d("Sage's Staff", '4%', '1', 'C'), d('Nirvana Axe', '4%', '1', 'C'), d('Fisted Blade', '4%', '1', 'C'), d("Homunkulus's Sword", '4%', '1', 'C')
    ],
    mechanics: ['Zamknięta przestrzeń premiuje dobrą organizację party.', 'Pilnuj dojścia do sali i możliwości wejścia przeciwników.']
  },
  'Orfen': {
    place: 'Sea of Spores', kind: 'Epic Raid Boss', npcId: 29014, level: 50,
    hp: '489 744', pAtk: '504', mAtk: '349', pDef: '593', mDef: '816', artPos: '50% 42%',
    text: 'Orfen to mroczna władczyni Sea of Spores. Jest bossem związanym z otwartą strefą, więc utrzymanie terenu często jest równie ważne jak samo zabicie bossa.',
    drops: [
      d('Adena', '100%', '110 000–150 000'), d('High-Grade Life Stone: level 49', '100%', '1–3'), d('Ring of Ages', '35%', '1–2', 'C'),
      d('Earring of Binding', '35%', '1–2', 'C'), d('Earring of Orfen', '30%', '1', 'EPIC'), d('Necklace of Mermaid', '30%', '1–2', 'C'),
      d('Scroll: Enchant Weapon (Grade C)', '10%', '1–2'), d('Composite Helmet', '10%', '1–2', 'C'), d('Composite Boots', '10%', '1–2', 'C'),
      d('Mithril Gauntlets', '10%', '1–2', 'C'), d('Tower Shield', '10%', '1–2', 'C'), d('Theca Leather Gaiters', '10%', '1', 'C'),
      d("Demon's Tunic", '10%', '1', 'C'), d('Composite Armor', '10%', '1', 'C'), d("Demon's Stockings", '10%', '1', 'C'),
      d('Theca Leather Armor', '10%', '1', 'C'), d('Widow Maker', '4.2%', '1', 'C'), d('War Axe', '4.2%', '1', 'C'),
      d('Sword of Delusion', '4.2%', '1', 'C'), d('Grace Dagger', '4.2%', '1', 'C'), d('Akat Long Bow', '4.2%', '1', 'C'),
      d('Club of Nature', '3.5%', '1', 'C'), d('Sword of Whispering Death', '3.5%', '1', 'C'), d('Fisted Blade', '3.5%', '1', 'C'), d("Pa'agrian Hammer", '3.5%', '1', 'C')
    ],
    mechanics: ['Podatna na ogień, posiada wysoką odporność na ataki z łuku.', 'Otwarta strefa oznacza dużą rolę kontroli terenu.']
  },
  'Baium': {
    place: 'Tower of Insolence', kind: 'Epic Raid Boss', npcId: 29020, level: 75,
    hp: '5 571 187', pAtk: '6 117', mAtk: '13 033', pDef: '1 752', mDef: '4 071', artPos: '50% 38%',
    text: 'Baium to legendarny władca uwięziony na szczycie Tower of Insolence. Należy do najważniejszych bossów w grze i często staje się centrum dużych walk PvP.',
    drops: [
      d('Ring of Baium', '100%', '1', 'EPIC'), d('Ancient Book - Divine Inspiration (Manuscript)', '80%', '5–15'),
      d('Tallum Blade', '6%', '1', 'A'), d('Elemental Sword', '6%', '1', 'A'), d("Dasparion's Staff", '6%', '1', 'A'), d('Bloody Orchid', '6%', '1', 'A'),
      d('Carnage Bow', '6%', '1', 'A'), d('Blood Tornado', '6%', '1', 'A'), d('Halberd', '6%', '1', 'A'), d('Meteor Shower', '6%', '1', 'A'),
      d('Imperial Staff', '1.2%', '1', 'S'), d('Basalt Battlehammer', '1.2%', '1', 'S'), d("Heaven's Divider", '1.2%', '1', 'S'),
      d('Demon Splinter', '1.2%', '1', 'S'), d('Draconic Bow', '1.2%', '1', 'S'), d('Forgotten Blade', '1.2%', '1', 'S'), d('Arcana Mace', '1.2%', '1', 'S'),
      d('Angel Slayer', '0.9%', '1', 'S'), d("Tallum Blade*Dark Legion's Edge", '0.9%', '1', 'S'), d('Saint Spear', '0.9%', '1', 'S')
    ],
    mechanics: ['100% odporności na stun w danych Interlude.', 'Największe znaczenie ma przygotowanie wejścia na szczyt Tower of Insolence.']
  },
  'Zaken': {
    place: "Devil's Isle", kind: 'Epic Raid Boss', npcId: 29022, level: 60,
    hp: '858 518', pAtk: '13 092', mAtk: '19 763', pDef: '2 952', mDef: '3 195', artPos: '50% 40%',
    text: 'Zaken to nieumarły pirat i jeden z najbardziej charakterystycznych bossów Lineage 2. Jego siedziba znajduje się na Devil’s Isle, gdzie ciasne przejścia szybko potrafią zamienić walkę w chaos.',
    drops: [
      d("Zaken's Earring", '100%', '1', 'EPIC'), d('Adena', '100%', '180 000–220 000'), d('High-Grade Life Stone: level 58', '45%', '2–4'),
      d('High-Grade Life Stone: level 61', '40%', '2–4'), d('Avadon Robe', '10%', '1', 'B'), d('Avadon Leather Armor', '10%', '1', 'B'),
      d('Pirate Hat', '10%', '1'), d('Top-Grade Life Stone: level 58', '10%', '1–2'), d('Scroll: Enchant Weapon (Grade B)', '6%', '1'),
      d('Tunic of Zubei', '5%', '1', 'B'), d("Zubei's Gaiters", '5%', '1', 'B'), d('Avadon Gaiters', '5%', '1', 'B'),
      d("Zubei's Leather Gaiters", '5%', '1', 'B'), d('Stockings of Zubei', '5%', '1', 'B'), d('Top-Grade Life Stone: level 61', '5%', '1–2'),
      d('Avadon Breastplate', '5%', '1', 'B'), d("Zubei's Leather Shirt", '5%', '1', 'B'), d("Zubei's Breastplate", '5%', '1', 'B'),
      d('Crystal Dagger', '4.8%', '1', 'C'), d('Samurai Longsword', '4.8%', '1', 'C'), d('Eminence Bow', '3.9%', '1', 'C'), d('Yaksa Mace', '3.6%', '1', 'C'),
      d('Avadon Gloves', '3%', '1', 'B'), d('Orcish Poleaxe', '3%', '1', 'C'), d('Avadon Circlet', '3%', '1', 'B'), d('Avadon Shield', '3%', '1', 'B'),
      d("Zubei's Shield", '3%', '1', 'B'), d("Zubei's Gauntlets", '3%', '1', 'B')
    ],
    mechanics: ['Ciasna lokacja wymaga dobrej komunikacji i wspólnego prowadzenia grupy.', 'Nie rozciągaj party przy przejściach między pomieszczeniami.']
  },
  'Frintezza': {
    place: 'Imperial Tomb', kind: 'Epic Raid Boss', npcId: 29047, level: 85,
    hp: '2 748 900', pAtk: '23 974', mAtk: '101 651', pDef: '2 010', mDef: '6 246', artPos: '50% 35%',
    text: 'Frintezza to wieloetapowy encounter w Imperial Tomb. Najważniejszy loot wypada z końcowego bossa Scarlet Van Halisha, dlatego poniższa tabela dropu odnosi się właśnie do niego.',
    drops: [
      d("Frintezza's Necklace", '100%', '1', 'EPIC'), d('Ancient Book - Divine Inspiration (Manuscript)', '100%', '5–25'),
      d('Blessed Scroll of Escape', '100%', '1–30'), d('Blessed Scroll of Resurrection', '100%', '1–10'), d('Adena', '100%', '9 000 000–11 000 000'),
      d('High-Grade Life Stone: level 70', '45%', '2–4'), d('High-Grade Life Stone: level 76', '40%', '2–4'),
      d('Sealed Dark Crystal Shield', '25%', '1', 'A'), d('Sealed Majestic Necklace', '21%', '1', 'A'), d('Sealed Majestic Ring', '21%', '1', 'A'),
      d('Sealed Dark Crystal Breastplate', '21%', '1', 'A'), d('Sealed Tallum Tunic', '21%', '1', 'A'), d('Sealed Dark Crystal Leather Armor', '18%', '1', 'A'),
      d('Sealed Majestic Earring', '18%', '1', 'A'), d('Sealed Tallum Stockings', '17.5%', '1', 'A'), d('Sealed Nightmare Robe', '17.5%', '1', 'A'),
      d('Sealed Leather Armor of Nightmare', '17.5%', '1', 'A'), d('Sealed Dark Crystal Leggings', '17.5%', '1', 'A'), d('Sealed Phoenix Necklace', '17.5%', '1', 'A'),
      d('Sealed Phoenix Ring', '17.5%', '1', 'A'), d('Sealed Tallum Boots', '15%', '1', 'A'), d('Sealed Armor of Nightmare', '15%', '1', 'A'),
      d('Sealed Dark Crystal Boots', '15%', '1', 'A'), d('Sealed Phoenix Earring', '15%', '1', 'A'), d('Sealed Dark Crystal Gaiters', '15%', '1', 'A'),
      d('Sealed Shield of Nightmare', '15%', '1', 'A'), d('Sealed Tallum Gloves', '15%', '1', 'A'), d('Sealed Tallum Helmet', '15%', '1', 'A'),
      d('Sealed Dark Crystal Gloves', '15%', '1', 'A'), d('Sealed Dark Crystal Helmet', '15%', '1', 'A'), d('Sealed Tateossian Earring', '14%', '1', 'S'),
      d('Sealed Tateossian Necklace', '14%', '1', 'S'), d('Sealed Major Arcana Circlet', '13.6%', '1', 'S'), d('Sealed Major Arcana Boots', '13.6%', '1', 'S'), d('Sealed Major Arcana Glove', '13.6%', '1', 'S'),
      d('Sealed Draconic Leather Boots', '13.2%', '1', 'S')
    ],
    mechanics: ['Encounter jest wieloetapowy — zachowaj zasoby na końcową fazę.', 'Końcowy boss Scarlet Van Halisha jest odporny na łuki.']
  },
  'Antharas': {
    place: "Antharas' Lair", kind: 'Epic Raid Boss', npcId: 29019, level: 79,
    hp: '19 717 847', pAtk: '12 713', mAtk: '87 781', pDef: '2 304', mDef: '1 487', artPos: '47% 34%',
    text: 'Antharas, Smok Ziemi, to jeden z największych i najbardziej ikonicznych bossów w Lineage 2. Walka w jego legowisku wymaga dużej, dobrze przygotowanej grupy i wysokiej przeżywalności.',
    drops: [
      d('Earring of Antharas', '100%', '1', 'EPIC'), d('Scroll: Enchant Weapon (Grade A)', '100%', '1–19'), d('Blessed Scroll of Escape', '100%', '1–59'),
      d('Blessed Scroll of Resurrection', '100%', '1–39'), d('Adena', '100%', '9 000 000–18 000 000'), d('High-Grade Life Stone: level 76', '54%', '3–4'),
      d('Sealed Dark Crystal Breastplate', '50%', '1–3', 'A'), d('Sealed Dark Crystal Shield', '40%', '1–3', 'A'), d('Sealed Shield of Nightmare', '40%', '1–3', 'A'),
      d('Sealed Majestic Ring', '35%', '1–5', 'A'), d('Sealed Tateossian Ring', '35%', '1', 'S'), d('Sealed Tateossian Earring', '35%', '1', 'S'),
      d('Sealed Phoenix Earring', '35%', '1–5', 'A'), d('Sealed Phoenix Ring', '35%', '1–5', 'A'), d('Sealed Majestic Earring', '35%', '1–5', 'A'),
      d('Sealed Draconic Leather Armor', '35%', '1', 'S'), d('Sealed Armor of Nightmare', '35%', '1–3', 'A'), d('Sealed Leather Armor of Nightmare', '35%', '1–3', 'A'),
      d('Sealed Dark Crystal Gaiters', '35%', '1–3', 'A'), d('Sealed Major Arcana Robe', '35%', '1', 'S'), d('Sealed Dark Crystal Leggings', '35%', '1–3', 'A'),
      d('Sealed Imperial Crusader Boots', '34%', '1', 'S'), d('Sealed Imperial Crusader Gauntlet', '34%', '1', 'S'), d('Sealed Imperial Crusader Helmet', '34%', '1', 'S'),
      d('Sealed Draconic Leather Boots', '33%', '1', 'S'), d('Sealed Draconic Leather Helmet', '33%', '1', 'S'), d('Sealed Major Arcana Boots', '33%', '1', 'S'),
      d('Sealed Major Arcana Circlet', '33%', '1', 'S'), d('Sealed Major Arcana Glove', '33%', '1', 'S'), d('Sealed Draconic Leather Glove', '33%', '1', 'S')
    ],
    mechanics: ['Podatny na wiatr, posiada bardzo wysoką odporność na ziemię.', 'To długa walka — przeżywalność jest ważniejsza od chwilowego maksymalnego DPS.']
  },
  'Valakas': {
    place: "Valakas' Lair / Forge of the Gods", kind: 'Epic Raid Boss', npcId: 29028, level: 85,
    hp: '25 095 443', pAtk: '13 676', mAtk: '110 446', pDef: '2 255', mDef: '1 633', artPos: '46% 32%',
    text: 'Valakas, Smok Ognia, należy do najpotężniejszych bossów świata Lineage 2. Samo dotarcie do niego oraz walka wymagają bardzo dobrej koordynacji całego klanu.',
    drops: [
      d('Necklace of Valakas', '100%', '1', 'EPIC'), d('Blessed Scroll of Escape', '100%', '1–59'), d('Blessed Scroll of Resurrection', '100%', '1–39'),
      d('High-Grade Life Stone: level 70', '100%', '4'), d('Ancient Book - Divine Inspiration (Manuscript)', '100%', '12–19'), d('Scroll: Enchant Weapon (Grade A)', '100%', '1–19'),
      d('Adena', '100%', '2 000 000–18 000 000'), d('Sealed Dark Crystal Breastplate', '50%', '1–3', 'A'), d('Sealed Shield of Nightmare', '40%', '1–3', 'A'),
      d('Sealed Dark Crystal Shield', '40%', '1–3', 'A'), d('Sealed Tateossian Ring', '35%', '1', 'S'), d('Sealed Tateossian Earring', '35%', '1', 'S'),
      d('Sealed Dark Crystal Leggings', '35%', '1–3', 'A'), d('Sealed Majestic Ring', '35%', '1–5', 'A'), d('Sealed Majestic Earring', '35%', '1–5', 'A'),
      d('Sealed Major Arcana Robe', '35%', '1', 'S'), d('Sealed Draconic Leather Armor', '35%', '1', 'S'), d('Sealed Phoenix Earring', '35%', '1–5', 'A'),
      d('Sealed Phoenix Ring', '35%', '1–5', 'A'), d('Sealed Armor of Nightmare', '35%', '1–3', 'A'), d('Sealed Leather Armor of Nightmare', '35%', '1–3', 'A'),
      d('Sealed Dark Crystal Gaiters', '35%', '1–3', 'A'), d('Sealed Imperial Crusader Gauntlet', '34%', '1', 'S'), d('Sealed Imperial Crusader Boots', '34%', '1', 'S'),
      d('Sealed Imperial Crusader Helmet', '34%', '1', 'S'), d('Sealed Draconic Leather Boots', '33%', '1', 'S'), d('Sealed Draconic Leather Glove', '33%', '1', 'S')
    ],
    mechanics: ['Podatny na wodę i odporny na ogień w danych Interlude.', 'Utrzymuj rozproszenie i reaguj na zmianę pozycji smoka.']
  }
};

const formatValue = (value) => value ?? '—';
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

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
    #bossInfoModalPl{position:fixed;inset:0;z-index:30000;display:none;place-items:center;padding:18px;background:#000d;backdrop-filter:blur(8px)}
    #bossInfoModalPl.open{display:grid}
    .boss-info-pl-card{position:relative;display:grid;grid-template-columns:minmax(340px,42%) 1fr;width:min(1180px,97vw);max-height:92vh;overflow:auto;border:1px solid #8b682f;background:linear-gradient(145deg,#0f1312,#070909);box-shadow:0 30px 100px #000;color:#d8d3c8}
    .boss-info-pl-art{min-height:620px;background-position:center;background-size:cover;background-repeat:no-repeat;position:sticky;top:0;align-self:start;background-color:#0b0d0c;filter:brightness(1.22) contrast(1.04) saturate(1.08)}
    .boss-info-pl-art::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 72%,#0b0e0dea 100%);pointer-events:none}
    .boss-info-pl-content{padding:30px 34px 30px;min-width:0}
    .boss-info-pl-kicker{display:block;color:#d1a24a;font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}
    .boss-info-pl-content h3{margin:7px 0 4px;color:#f1e5cf;font:700 36px/1.05 Georgia,serif;text-transform:uppercase}
    .boss-info-pl-kind{display:inline-block;margin:8px 0 16px;padding:7px 10px;border:1px solid #7a5d2c;color:#ddb65f;background:#17130d;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
    .boss-info-pl-text{margin:0;color:#b9b1a6;font-size:13px;line-height:1.7}
    .boss-info-pl-meta{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;margin-top:18px;padding-top:15px;border-top:1px solid #352b1c;font-size:11px}.boss-info-pl-meta b{color:#d2aa5a}.boss-info-pl-meta span{color:#aaa39a}
    .boss-info-pl-server{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:18px}.boss-info-pl-server div{padding:10px;border:1px solid #55401e;background:linear-gradient(180deg,#181208,#0d0e0c)}.boss-info-pl-server small{display:block;color:#87765b;font-size:8px;text-transform:uppercase}.boss-info-pl-server b{display:block;margin-top:4px;color:#e8c36f;font-size:13px}
    .boss-info-pl-section{margin-top:20px;padding-top:16px;border-top:1px solid #352b1c}.boss-info-pl-section h4{margin:0 0 10px;color:#d6ac59;font:700 11px Inter,sans-serif;letter-spacing:.13em;text-transform:uppercase}
    .boss-info-pl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.boss-info-pl-stat{padding:9px 10px;border:1px solid #342c20;background:#0b0e0e}.boss-info-pl-stat span{display:block;color:#736d64;font-size:8px;font-weight:800;text-transform:uppercase}.boss-info-pl-stat b{display:block;margin-top:4px;color:#ece1cf;font-size:13px;font-variant-numeric:tabular-nums}
    .boss-info-pl-drop-wrap{max-height:310px;overflow:auto;border:1px solid #30291f;background:#090c0b}.boss-info-pl-drop-head,.boss-info-pl-drop-row{display:grid;grid-template-columns:minmax(0,1fr) 72px 92px;gap:8px;align-items:center;padding:8px 10px}.boss-info-pl-drop-head{position:sticky;top:0;z-index:2;background:#13110d;border-bottom:1px solid #4c3a20;color:#a88e60;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.boss-info-pl-drop-row{border-bottom:1px solid #211d17;color:#b9b1a5;font-size:10px}.boss-info-pl-drop-row:last-child{border-bottom:0}.boss-info-pl-drop-row b{color:#d8d0c2;font-weight:700}.boss-info-pl-drop-row .chance,.boss-info-pl-drop-row .qty{text-align:right;font-variant-numeric:tabular-nums}.boss-info-pl-drop-row.epic{background:linear-gradient(90deg,#33230f55,transparent);box-shadow:inset 3px 0 #c28a31}.boss-info-pl-drop-row.epic b,.boss-info-pl-drop-row.epic .chance{color:#f0c86e}
    .boss-info-pl-drop-summary{display:flex;justify-content:space-between;gap:10px;margin:8px 0 0;color:#7f786e;font-size:9px}.boss-info-pl-drop-summary b{color:#b99b62}.boss-info-pl-mechanics{margin:0;padding-left:18px;color:#aaa399;font-size:11px;line-height:1.6}.boss-info-pl-mechanics li+li{margin-top:5px}
    .boss-info-pl-reference{margin-top:20px;padding:11px 12px;border:1px solid #2f332d;background:#0a0d0c;color:#82877f;font-size:9px;line-height:1.55}.boss-info-pl-reference b{color:#aeb7a7}.boss-info-pl-source{color:#c7a45f;text-decoration:none}.boss-info-pl-source:hover{text-decoration:underline}
    .boss-info-pl-close{position:absolute;right:14px;top:10px;z-index:5;width:38px;height:38px;border:1px solid #6c5128;background:#0a0d0df2;color:#d7b66e;font-size:24px;cursor:pointer}
    @media(max-width:760px){#bossInfoModalPl{padding:7px}.boss-info-pl-card{grid-template-columns:1fr;width:100%;max-height:95vh}.boss-info-pl-art{position:relative;min-height:300px;height:300px;filter:brightness(1.28) contrast(1.03) saturate(1.1)}.boss-info-pl-art::after{background:linear-gradient(0deg,#0b0e0dd9 0%,transparent 42%)}.boss-info-pl-content{padding:20px 16px}.boss-info-pl-content h3{font-size:29px}.boss-info-pl-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.boss-info-pl-server{grid-template-columns:1fr 1fr}.boss-info-pl-drop-head,.boss-info-pl-drop-row{grid-template-columns:minmax(0,1fr) 64px 76px;padding:8px}.boss-info-pl-drop-wrap{max-height:330px}}
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
        <span class="boss-info-pl-kicker">Hall of Legends · Eternal x10 · Interlude</span>
        <h3 id="bossInfoPlTitle">Boss</h3><span class="boss-info-pl-kind">Epic Raid Boss</span>
        <p id="bossInfoPlText" class="boss-info-pl-text"></p>
        <div class="boss-info-pl-meta"><b>Lokalizacja</b><span id="bossInfoPlPlace">—</span><b>Kategoria</b><span id="bossInfoPlKind">—</span></div>
        <div class="boss-info-pl-server"><div><small>Eternal · Epic Drop</small><b>x1</b></div><div><small>Epic XP / SP</small><b>x5</b></div><div><small>VIP / Vote dla Epic</small><b>bez mnożnika dropu</b></div></div>
        <section class="boss-info-pl-section"><h4>Statystyki Interlude</h4><div id="bossInfoPlStats" class="boss-info-pl-stats"></div></section>
        <section class="boss-info-pl-section"><h4>Drop · szansa i ilość</h4><div class="boss-info-pl-drop-wrap"><div class="boss-info-pl-drop-head"><span>Przedmiot</span><span style="text-align:right">Szansa</span><span style="text-align:right">Ilość</span></div><div id="bossInfoPlDrop"></div></div><div class="boss-info-pl-drop-summary"><span>Wartości bazowe: Interlude</span><b>Eternal Epic Boss Drop = x1</b></div></section>
        <section class="boss-info-pl-section"><h4>Mechanika / info</h4><ul id="bossInfoPlMechanics" class="boss-info-pl-mechanics"></ul></section>
        <div class="boss-info-pl-reference"><b>Źródła:</b> oficjalna strona L2Reborn potwierdza dla Eternal mnożnik <b>Epic Boss Drop x1</b> i <b>Epic Boss XP/SP x5</b>. Tabela przedmiotów, szans i ilości jest referencją z bazy Lineage 2 Interlude. Reborn może mieć własne zmiany konkretnej tabeli — w grze najpewniejszą kontrolą jest Shift + klik na bossie. <a id="bossInfoPlSource" class="boss-info-pl-source" href="#" target="_blank" rel="noopener noreferrer">Pełna baza Interlude ↗</a> · <a class="boss-info-pl-source" href="https://l2reborn.org/server-features/eternal-2/" target="_blank" rel="noopener noreferrer">Eternal rates ↗</a></div>
      </div>
    </article>`;
  document.body.appendChild(modal);
  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.removeProperty('overflow'); const t=modal._returnTarget; if(t?.isConnected)t.focus({preventScroll:true}); };
  modal._closeBossInfo = close;
  modal.querySelector('.boss-info-pl-close').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); close(); });
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) { e.preventDefault(); close(); } });
  return modal;
}

function statMarkup(label, value) { return `<div class="boss-info-pl-stat"><span>${label}</span><b>${formatValue(value)}</b></div>`; }
function dropMarkup(item) { return `<div class="boss-info-pl-drop-row ${item.grade === 'EPIC' ? 'epic' : ''}"><b>${esc(item.name)}${item.grade && item.grade !== 'EPIC' ? ` <small>[${esc(item.grade)}]</small>` : ''}</b><span class="chance">${esc(item.chance)}</span><span class="qty">${esc(item.qty)}</span></div>`; }

function openBossDetails(name, trigger) {
  const info = BOSS_INFO[name]; if (!info) return;
  const modal = ensureModal(); const art = bossArtworkUrl(name); modal._returnTarget = trigger || null;
  modal.querySelector('#bossInfoPlTitle').textContent = name; modal.querySelector('#bossInfoPlText').textContent = info.text;
  modal.querySelector('#bossInfoPlPlace').textContent = info.place; modal.querySelector('#bossInfoPlKind').textContent = info.kind; modal.querySelector('.boss-info-pl-kind').textContent = info.kind;
  const artBox = modal.querySelector('.boss-info-pl-art'); artBox.style.backgroundImage = art ? `url(${JSON.stringify(art)})` : 'none'; artBox.style.backgroundPosition = info.artPos || '50% 50%';
  modal.querySelector('#bossInfoPlStats').innerHTML = [statMarkup('Level',info.level),statMarkup('HP',info.hp),statMarkup('P. Atk',info.pAtk),statMarkup('M. Atk',info.mAtk),statMarkup('P. Def',info.pDef),statMarkup('M. Def',info.mDef)].join('');
  modal.querySelector('#bossInfoPlDrop').innerHTML = (info.drops || []).map(dropMarkup).join('') || '<div class="boss-info-pl-drop-row"><b>—</b><span></span><span></span></div>';
  modal.querySelector('#bossInfoPlMechanics').innerHTML = (info.mechanics || []).map(x => `<li>${esc(x)}</li>`).join('');
  modal.querySelector('#bossInfoPlSource').href = `https://lineage2wiki.org/interlude/monster/${info.npcId}/${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; modal.querySelector('.boss-info-pl-close').focus({preventScroll:true});
}

function installBossDetailsPl() {
  if (window.__obBossDetailsPlInstalled) return; window.__obBossDetailsPlInstalled = true; ensureModal();
  const gallery = document.querySelector('.boss-gallery'); if (!gallery) return;
  gallery.querySelectorAll('.boss-card').forEach(card => { const name=bossNameFromCard(card); if(!BOSS_INFO[name])return; card.dataset.bossDetails=name; card.tabIndex=0; card.setAttribute('role','button'); card.setAttribute('aria-label',`Pokaż szczegóły bossa ${name}`); });
  gallery.addEventListener('click', e => { const card=e.target.closest('.boss-card[data-boss-details]'); if(!card||!gallery.contains(card))return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); openBossDetails(card.dataset.bossDetails,card); }, true);
  gallery.addEventListener('keydown', e => { const card=e.target.closest('.boss-card[data-boss-details]'); if(!card||(e.key!=='Enter'&&e.key!==' '))return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); openBossDetails(card.dataset.bossDetails,card); }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBossDetailsPl, { once:true }); else installBossDetailsPl();

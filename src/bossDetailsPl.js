import { bossArtworkUrl } from './bossArtwork.js';

const BOSS_INFO = {
  'Queen Ant': {
    place: 'Ant Nest',
    kind: 'Epic Raid Boss',
    text: 'Królowa Mrówek to jeden z najbardziej rozpoznawalnych bossów w Lineage 2. Dowodzi kolonią w Ant Nest i jest ważnym celem klanów ze względu na prestiż oraz walkę o kontrolę nad respawnem. Starcie zwykle wymaga szybkiej organizacji i dobrej kontroli wejścia do leża.'
  },
  'Core': {
    place: 'Cruma Tower',
    kind: 'Epic Raid Boss',
    text: 'Core to potężna, mechaniczna istota ukryta wewnątrz Cruma Tower. Walka z nim odbywa się w zamkniętej przestrzeni, dlatego liczy się dobre ustawienie grupy, kontrola przeciwników i szybka reakcja na pojawiające się zagrożenia.'
  },
  'Orfen': {
    place: 'Sea of Spores',
    kind: 'Epic Raid Boss',
    text: 'Orfen to mroczna władczyni Sea of Spores. Jest bossem związanym z otwartą strefą, więc samo dotarcie i utrzymanie terenu często jest równie ważne jak walka z nią. To klasyczny cel dla zorganizowanych grup i klanów.'
  },
  'Baium': {
    place: 'Tower of Insolence',
    kind: 'Epic Raid Boss',
    text: 'Baium to legendarny władca uwięziony na szczycie Tower of Insolence. Należy do najważniejszych bossów w grze i często staje się centrum dużych walk PvP. Sukces wymaga przygotowania wejścia, kontroli strefy i bardzo dobrej organizacji całego klanu.'
  },
  'Zaken': {
    place: "Devil's Isle",
    kind: 'Epic Raid Boss',
    text: 'Zaken to nieumarły pirat i jeden z najbardziej charakterystycznych bossów Lineage 2. Jego siedziba znajduje się na Devil’s Isle. Walka odbywa się w klimatycznej, zamkniętej lokacji, gdzie łatwo o chaos, dlatego ważne są komunikacja i wspólne prowadzenie grupy.'
  },
  'Frintezza': {
    place: 'Imperial Tomb',
    kind: 'Epic Raid Boss',
    text: 'Frintezza to książę związany z Imperial Tomb i jednym z najbardziej widowiskowych starć w Lineage 2. Encounter składa się z kilku etapów, dlatego drużyna musi być przygotowana na dłuższą walkę, zmiany sytuacji i utrzymanie pełnej koncentracji do samego końca.'
  },
  'Antharas': {
    place: "Antharas' Lair",
    kind: 'Epic Raid Boss',
    text: 'Antharas, Smok Ziemi, to jeden z największych i najbardziej ikonicznych bossów w Lineage 2. Walka odbywa się w jego legowisku i jest wydarzeniem dla dużej, dobrze przygotowanej grupy. Najważniejsze są organizacja, przeżywalność i utrzymanie porządku podczas długiego starcia.'
  },
  'Valakas': {
    place: 'Forge of the Gods',
    kind: 'Epic Raid Boss',
    text: 'Valakas, Smok Ognia, należy do najpotężniejszych bossów świata Lineage 2. Dotarcie do niego prowadzi przez Forge of the Gods, a samo starcie wymaga bardzo dobrej koordynacji całego klanu. To jedno z najbardziej prestiżowych i widowiskowych wydarzeń PvE w grze.'
  }
};

function bossNameFromCard(card) {
  const span = card.querySelector('span');
  const raw = span?.childNodes?.[0]?.textContent?.trim() || '';
  return Object.keys(BOSS_INFO).find((name) => name.toLowerCase() === raw.toLowerCase()) || raw;
}

function ensureModal() {
  let modal = document.querySelector('#bossInfoModalPl');
  if (modal) return modal;

  const style = document.createElement('style');
  style.id = 'bossInfoModalPlStyles';
  style.textContent = `
    .boss-card[data-boss-details]{cursor:pointer;transition:transform .18s ease,filter .18s ease,border-color .18s ease}
    .boss-card[data-boss-details]:hover,.boss-card[data-boss-details]:focus-visible{transform:translateY(-3px);filter:brightness(1.08);border-color:#d0a24c;outline:none}
    .boss-card[data-boss-details]::after{content:'KLIKNIJ, ABY ZOBACZYĆ OPIS';position:absolute;left:10px;right:10px;bottom:8px;z-index:3;padding:5px 7px;background:#050707c9;border:1px solid #6e552b;color:#d8b468;font-size:8px;font-weight:900;letter-spacing:.08em;text-align:center;opacity:0;transform:translateY(5px);transition:.18s ease;pointer-events:none}
    .boss-card[data-boss-details]:hover::after,.boss-card[data-boss-details]:focus-visible::after{opacity:1;transform:none}
    #bossInfoModalPl{position:fixed;inset:0;z-index:14000;display:none;place-items:center;padding:18px;background:#000c;backdrop-filter:blur(7px)}
    #bossInfoModalPl.open{display:grid}
    .boss-info-pl-card{position:relative;display:grid;grid-template-columns:minmax(280px,42%) 1fr;width:min(940px,96vw);max-height:88vh;overflow:auto;border:1px solid #8b682f;background:linear-gradient(145deg,#0d1111,#070909);box-shadow:0 30px 100px #000;color:#d8d3c8}
    .boss-info-pl-art{min-height:420px;background-position:center;background-size:cover;position:relative}
    .boss-info-pl-art::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 45%,#090c0cf2 100%),linear-gradient(0deg,#090c0c88,transparent 45%)}
    .boss-info-pl-content{padding:34px 34px 30px;align-self:center}
    .boss-info-pl-kicker{display:block;color:#d1a24a;font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}
    .boss-info-pl-content h3{margin:7px 0 4px;color:#f1e5cf;font:700 36px/1.05 Georgia,serif;text-transform:uppercase}
    .boss-info-pl-kind{display:inline-block;margin:8px 0 20px;padding:7px 10px;border:1px solid #7a5d2c;color:#ddb65f;background:#17130d;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
    .boss-info-pl-content p{margin:0;color:#aaa399;font-size:14px;line-height:1.75}
    .boss-info-pl-meta{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin-top:24px;padding-top:18px;border-top:1px solid #352b1c;font-size:11px}.boss-info-pl-meta b{color:#d2aa5a}.boss-info-pl-meta span{color:#918a80}
    .boss-info-pl-close{position:absolute;right:14px;top:10px;z-index:4;width:38px;height:38px;border:1px solid #6c5128;background:#0a0d0de8;color:#d7b66e;font-size:24px;cursor:pointer}
    @media(max-width:760px){.boss-info-pl-card{grid-template-columns:1fr}.boss-info-pl-art{min-height:260px}.boss-info-pl-art::after{background:linear-gradient(0deg,#090c0cf2,transparent 70%)}.boss-info-pl-content{padding:24px 20px}.boss-info-pl-content h3{font-size:29px}.boss-card[data-boss-details]::after{display:none}}
  `;
  document.head.appendChild(style);

  modal = document.createElement('div');
  modal.id = 'bossInfoModalPl';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <article class="boss-info-pl-card" role="dialog" aria-modal="true" aria-labelledby="bossInfoPlTitle">
      <button class="boss-info-pl-close" type="button" aria-label="Zamknij">×</button>
      <div class="boss-info-pl-art"></div>
      <div class="boss-info-pl-content">
        <span class="boss-info-pl-kicker">Hall of Legends · opis bossa</span>
        <h3 id="bossInfoPlTitle">Boss</h3>
        <span class="boss-info-pl-kind">Epic Raid Boss</span>
        <p id="bossInfoPlText"></p>
        <div class="boss-info-pl-meta"><b>Lokalizacja</b><span id="bossInfoPlPlace">—</span><b>Kategoria</b><span id="bossInfoPlKind">—</span></div>
      </div>
    </article>`;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };
  modal.querySelector('.boss-info-pl-close').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) close(); });
  return modal;
}

function openBossDetails(name) {
  const info = BOSS_INFO[name];
  if (!info) return;
  const modal = ensureModal();
  const art = bossArtworkUrl(name);
  modal.querySelector('#bossInfoPlTitle').textContent = name;
  modal.querySelector('#bossInfoPlText').textContent = info.text;
  modal.querySelector('#bossInfoPlPlace').textContent = info.place;
  modal.querySelector('#bossInfoPlKind').textContent = info.kind;
  modal.querySelector('.boss-info-pl-kind').textContent = info.kind;
  modal.querySelector('.boss-info-pl-art').style.backgroundImage = art ? `url(${JSON.stringify(art)})` : 'none';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.boss-info-pl-close').focus();
}

function installBossDetailsPl() {
  document.querySelectorAll('.boss-gallery .boss-card').forEach((card) => {
    const name = bossNameFromCard(card);
    if (!BOSS_INFO[name] || card.dataset.bossDetails) return;
    card.dataset.bossDetails = name;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Pokaż opis bossa ${name}`);
    card.addEventListener('click', () => openBossDetails(name));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openBossDetails(name);
      }
    });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBossDetailsPl, { once: true });
else installBossDetailsPl();

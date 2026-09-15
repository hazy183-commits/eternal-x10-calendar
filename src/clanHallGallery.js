const CLAN_HALL_GALLERY = [
  {
    name: 'Fortress of Resistance',
    image: 'https://i.ytimg.com/vi/vXezxS5XxjM/hqdefault.jpg',
    source: 'https://www.youtube.com/watch?v=vXezxS5XxjM',
    sourceLabel: 'Kadr z nagrania Clan Hall Siege',
  },
  {
    name: 'Devastated Castle',
    image: 'https://i.ytimg.com/vi/8aF-AkJ_1X8/hqdefault.jpg',
    source: 'https://www.youtube.com/watch?v=8aF-AkJ_1X8',
    sourceLabel: 'Kadr z nagrania Devastated Castle Siege',
  },
  {
    name: 'Bandit Stronghold',
    image: 'https://interlude.wiki/wp-content/uploads/2024/02/bandit-stronghold.png',
    source: 'https://interlude.wiki/bandit-stronghold-guide/',
    sourceLabel: 'Screen z gry · Interlude.Wiki',
  },
  {
    name: 'Rainbow Spring Chateau',
    image: 'https://interlude.wiki/wp-content/uploads/2021/03/Rainbow-Springs-Chateau.png',
    source: 'https://interlude.wiki/rainbow-springs-chateau-guide/',
    sourceLabel: 'Screen z gry · Interlude.Wiki',
  },
  {
    name: 'Wild Beast Reserve',
    image: 'https://l2-servera.com/wp-content/uploads/2025/05/alpen-cougar-a-upskale-1000x645.jpeg',
    source: 'https://l2-servera.com/en/kategorii/wiki/locations/wild-beast-reserve/',
    sourceLabel: 'Screen z rejonu Wild Beast Reserve',
  },
  {
    name: 'Fortress of the Dead',
    image: 'https://i.ytimg.com/vi/eTEaoqA4Z1k/hqdefault.jpg',
    source: 'https://www.youtube.com/watch?v=eTEaoqA4Z1k',
    sourceLabel: 'Kadr z nagrania Clan Hall Siege',
  },
];

function createClanHallGallery() {
  if (typeof document === 'undefined' || document.getElementById('clanHallGallery')) return;
  const epicGallery = document.querySelector('.boss-gallery');
  if (!epicGallery) return;

  const section = document.createElement('section');
  section.id = 'clanHallGallery';
  section.className = 'clan-hall-gallery wrap';
  section.innerHTML = `
    <div class="clan-hall-gallery-head">
      <div><span>CONTESTABLE CLAN HALLS</span><h2>Clan Hall Terenowe</h2></div>
      <p>Prawdziwe ujęcia z Lineage 2</p>
    </div>
    <div class="clan-hall-gallery-grid">
      ${CLAN_HALL_GALLERY.map((hall) => `
        <article class="clan-hall-gallery-card">
          <a href="${hall.source}" target="_blank" rel="noopener noreferrer" aria-label="${hall.name} — źródło grafiki">
            <img src="${hall.image}" alt="${hall.name} w Lineage 2" loading="lazy" referrerpolicy="no-referrer" />
            <span class="clan-hall-gallery-shade"></span>
            <span class="clan-hall-gallery-copy"><b>${hall.name}</b><small>CLAN HALL</small></span>
          </a>
          <span class="clan-hall-gallery-source">${hall.sourceLabel}</span>
        </article>`).join('')}
    </div>`;

  epicGallery.insertAdjacentElement('afterend', section);

  if (!document.getElementById('clan-hall-gallery-style')) {
    const style = document.createElement('style');
    style.id = 'clan-hall-gallery-style';
    style.textContent = `
      .clan-hall-gallery{margin-top:18px;margin-bottom:24px;padding:18px;border:1px solid rgba(190,145,60,.42);background:linear-gradient(180deg,#0c1112,#050809);box-shadow:inset 0 0 30px #0008}
      .clan-hall-gallery-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:14px}.clan-hall-gallery-head span{color:#d6a94e;font:700 10px Inter,Arial,sans-serif;letter-spacing:.16em}.clan-hall-gallery-head h2{margin:5px 0 0;color:#eee7d8;font:700 27px Cinzel,Georgia,serif}.clan-hall-gallery-head p{margin:0;color:#777;font-size:11px}
      .clan-hall-gallery-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.clan-hall-gallery-card{min-width:0;border:1px solid rgba(190,145,60,.42);background:#070a0b;overflow:hidden}.clan-hall-gallery-card>a{position:relative;display:block;height:185px;overflow:hidden;color:inherit;text-decoration:none}.clan-hall-gallery-card img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.78) contrast(1.05) brightness(.78);transition:transform .28s ease,filter .28s ease}.clan-hall-gallery-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 38%,#020303ed 100%)}.clan-hall-gallery-copy{position:absolute;left:10px;right:10px;bottom:10px;text-align:center}.clan-hall-gallery-copy b{display:block;color:#f1eadc;font:700 13px Cinzel,Georgia,serif;text-shadow:0 2px 5px #000}.clan-hall-gallery-copy small{display:block;margin-top:3px;color:#d3a34c;font:700 8px Inter,Arial,sans-serif;letter-spacing:.12em}.clan-hall-gallery-source{display:block;padding:7px 8px;color:#777;font-size:8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.clan-hall-gallery-card:hover{border-color:#d4a64d}.clan-hall-gallery-card:hover img{transform:scale(1.045);filter:saturate(.95) contrast(1.06) brightness(.9)}
      @media(max-width:1200px){.clan-hall-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){.clan-hall-gallery{padding:12px}.clan-hall-gallery-head{align-items:flex-start;flex-direction:column;gap:4px}.clan-hall-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.clan-hall-gallery-card>a{height:155px}.clan-hall-gallery-copy b{font-size:11px}.clan-hall-gallery-source{font-size:7px}}
    `;
    document.head.appendChild(style);
  }
}

if (typeof document !== 'undefined') createClanHallGallery();

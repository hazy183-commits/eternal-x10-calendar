const YOUTUBE_URL = 'https://www.youtube.com/@orzelbialyfirstofight';
const REBORN_URL = 'https://l2reborn.org/';

function updateCommunityLinks() {
  const links = [...document.querySelectorAll('#community .community-links a')];

  const youtube = links.find((link) => link.querySelector('b')?.textContent.trim().toLowerCase() === 'forum');
  if (youtube) {
    youtube.href = YOUTUBE_URL;
    youtube.target = '_blank';
    youtube.rel = 'noopener noreferrer';
    const title = youtube.querySelector('b');
    const subtitle = youtube.querySelector('span');
    if (title) title.textContent = 'YouTube';
    if (subtitle) subtitle.textContent = 'Orzeł Biały – materiały';
  }

  // clanHallSchedule.js currently turns the old Server tile into Drop Kalkulator,
  // so the remaining old Clan tile becomes the Reborn server link.
  const server = links.find((link) => link.querySelector('b')?.textContent.trim().toLowerCase() === 'clan');
  if (server) {
    server.href = REBORN_URL;
    server.target = '_blank';
    server.rel = 'noopener noreferrer';
    const title = server.querySelector('b');
    const subtitle = server.querySelector('span');
    if (title) title.textContent = 'Serwer';
    if (subtitle) subtitle.textContent = 'Przejdź na Reborn';
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateCommunityLinks, { once: true });
  else updateCommunityLinks();
}

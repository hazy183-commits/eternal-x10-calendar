import { isChristmasSeason } from '../lib/christmasSeason.js';

const logo = document.querySelector('.topbar .brand-logo');
const standardLogo = logo?.getAttribute('src');
const greeting = document.querySelector('.holiday-greeting');
let previous;

function refreshChristmasTheme() {
  const festive = isChristmasSeason();
  if (festive === previous) return;
  previous = festive;
  document.documentElement.classList.toggle('holiday-website', festive);
  if (greeting) greeting.hidden = !festive;
  if (logo && standardLogo) {
    logo.src = festive ? '/images/holiday/clan-crest-christmas.png' : standardLogo;
  }
}

function refreshAtMinute() {
  refreshChristmasTheme();
  setTimeout(refreshAtMinute, 60_000 - Date.now() % 60_000);
}

refreshAtMinute();
document.addEventListener('visibilitychange', refreshChristmasTheme);

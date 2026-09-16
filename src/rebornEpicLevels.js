const REBORN_LEVELS = new Map([
  ['Queen Ant', 80],
  ['Core', 80],
  ['Orfen', 80],
  ['Zaken', 80],
  ['Frintezza', 90],
]);

function patchEpicLevel() {
  const modal = document.querySelector('#bossInfoModalPl');
  if (!modal || !modal.classList.contains('open')) return;

  const name = modal.querySelector('#bossInfoPlTitle')?.textContent?.trim();
  const levelCell = [...modal.querySelectorAll('.boss-info-pl-stat')]
    .find((cell) => cell.querySelector('span')?.textContent?.toLowerCase().startsWith('level'));
  if (!name || !levelCell) return;

  const label = levelCell.querySelector('span');
  const value = levelCell.querySelector('b');
  const rebornLevel = REBORN_LEVELS.get(name);

  if (rebornLevel) {
    if (label) label.textContent = 'Level Reborn';
    if (value) value.textContent = String(rebornLevel);
    levelCell.title = 'Poziom z tabeli Epic Boss w Community Board na Reborn Eternal';
  } else if (label) {
    label.textContent = 'Level Interlude';
  }
}

function installRebornEpicLevels() {
  const start = () => {
    const modal = document.querySelector('#bossInfoModalPl');
    if (!modal) {
      setTimeout(start, 100);
      return;
    }

    const observer = new MutationObserver(() => requestAnimationFrame(patchEpicLevel));
    observer.observe(modal, { attributes: true, childList: true, subtree: true, characterData: true });
    patchEpicLevel();
  };
  start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installRebornEpicLevels, { once: true });
} else {
  installRebornEpicLevels();
}

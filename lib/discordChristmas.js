const warsaw = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw', month: '2-digit', day: '2-digit',
});
export const CHRISTMAS_CREST = '/images/holiday/clan-crest-christmas.png';
export function christmasCard(params, date = new Date()) {
  if (params.get('season') === 'christmas') return true;
  if (params.get('season') === 'classic') return false;
  const [day, month] = warsaw.format(date).split('/').map(Number);
  return month === 12 && day >= 6 && day <= 27;
}

export function holidayScenery(width, key = '') {
  const warm = ['zaken', 'valakas', 'frintezza'].includes(key);
  const dots = Array.from({ length: 32 }, (_, i) => {
    const x = i % 2 ? width - 30 - (i * 71 % 245) : 26 + (i * 79 % 240);
    const y = 30 + i * 53 % 246;
    const fill = warm ? ['#ffc574', '#e0524d', '#fff1be'][i % 3] : '#e7f4ff';
    return `<circle cx="${x}" cy="${y}" r="${1 + i % 3 * .55}" fill="${fill}" opacity="${.38 + i % 4 * .12}"/>`;
  }).join('');
  const lights = Array.from({ length: 12 }, (_, i) => {
    const x = width - 35 - i * 19;
    const y = 38 + Math.sin(i / 3) * 19;
    const fill = ['#ffd58c', '#ee7b71', '#b7e5bf'][i % 3];
    return `<circle cx="${x}" cy="${y.toFixed(1)}" r="6" fill="${fill}" opacity=".18"/><circle cx="${x}" cy="${y.toFixed(1)}" r="2.2" fill="${fill}"/>`;
  }).join('');
  return `<g>${dots}<path d="M${width-245} 34Q${width-143} 77 ${width-33} 38" fill="none" stroke="#b39b63" stroke-opacity=".55"/>${lights}</g>`;
}

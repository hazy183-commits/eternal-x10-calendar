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

export function holidayScenery(width, key = '', kind = '') {
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
  const x = width - 126;
  const tree = `<g transform="translate(${x} 108)">
    <path d="M-4 90H4V108H-4Z" fill="#795436"/>
    <path d="M0 3L-22 38H-13L-34 62H-23L-47 94Q0 107 47 94L23 62H34L13 38H22Z" fill="#153a2b" stroke="#59734b" stroke-width="2"/>
    <path d="M-18 40Q0 49 18 40M-30 66Q0 80 30 66M-41 91Q0 105 41 91" fill="none" stroke="#e0ba71" stroke-width="2"/>
    <path d="M0-9l3 9 10 1-8 5 3 9-8-5-8 5 3-9-8-5 10-1Z" fill="#ffe393"/>
    ${[[-11,37],[10,49],[-18,64],[19,69],[0,80],[-29,90],[30,92]].map(([a,b],i)=>`<circle cx="${a}" cy="${b}" r="4" fill="${i%2?'#ed5752':'#ffd37f'}"/>`).join('')}
  </g>`;
  const wreath = `<g transform="translate(${x} 141)">
    <circle r="27" fill="none" stroke="#112a1b" stroke-width="13"/>
    ${Array.from({length:18},(_,i)=>`<ellipse cx="0" cy="-27" rx="4" ry="11" fill="${i%2?'#466549':'#254333'}" transform="rotate(${i*20})"/>`).join('')}
    <path d="M0 22Q-17 10-19 24Q-14 32 0 26Q17 10 19 24Q14 32 0 26L12 43L3 39L0 29L-7 43L-13 38Z" fill="#b9273d" stroke="#ff9570"/>
  </g>`;
  const castleStar = `<g transform="translate(${x} 129)" fill="#ffe19a"><path d="M0-35L5-7L22-21L8-4L38 0L8 5L22 22L5 8L0 36L-5 8L-22 22L-8 5L-38 0L-8-4L-22-21L-5-7Z"/><circle r="13" opacity=".28"/></g>`;
  const accent = kind === 'siege' ? castleStar : key === 'zaken' || kind === 'clan hall' ? wreath : key === 'baium' ? '' : tree;
  return `<g>${dots}${accent}<path d="M${width-245} 34Q${width-143} 77 ${width-33} 38" fill="none" stroke="#b39b63" stroke-opacity=".55"/>${lights}</g>`;
}

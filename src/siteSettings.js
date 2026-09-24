export const SITE_SETTING_FIELDS = [
  { key:'hero_eyebrow', label:'Napis nad tytułem', group:'Strona główna', max:80, fallback:'Wspólny kalendarz klanu' },
  { key:'hero_title', label:'Główny tytuł', group:'Strona główna', max:80, fallback:'ETERNAL X10 MAIN' },
  { key:'hero_subtitle', label:'Podtytuł', group:'Strona główna', max:100, fallback:'Lineage 2 Reborn' },
  { key:'hero_tagline', label:'Hasło strony', group:'Strona główna', max:160, fallback:'Więcej niż gra — to nasza społeczność' },
  { key:'community_title', label:'Tytuł sekcji linków', group:'Sekcja społeczności', max:80, fallback:'Community' },
  { key:'community_description', label:'Opis sekcji linków', group:'Sekcja społeczności', max:240, multiline:true, fallback:'Wszystko, czego potrzebujesz, aby pozostać w kontakcie z klanem.' },
  { key:'discord_url', label:'Link do Discorda', group:'Linki', type:'url', fallback:'https://discord.gg/HtTrJpp7K' },
  { key:'youtube_url', label:'Link do YouTube', group:'Linki', type:'url', fallback:'https://www.youtube.com/@orzelbialyfirstofight' },
  { key:'server_url', label:'Link do strony serwera', group:'Linki', type:'url', fallback:'https://l2reborn.org/' },
  { key:'clan_name', label:'Nazwa klanu', group:'Strefa klanu', max:60, fallback:'Orzeł Biały' },
  { key:'server_name', label:'Nazwa serwera', group:'Strefa klanu', max:60, fallback:'Eternal x10' },
  { key:'welcome_subtitle', label:'Tekst powitalny', group:'Strefa klanu', max:160, fallback:'Dobrze, że jesteś z nami.' },
  { key:'clan_quote', label:'Motto klanu', group:'Strefa klanu', max:240, multiline:true, fallback:'Siła klanu tkwi w ludziach, nie w pixelach.' },
];

const cleanUrl=(value,fallback='')=>{try{const url=new URL(String(value||fallback));return ['http:','https:'].includes(url.protocol)?url.href:fallback}catch{return fallback}};
const setText=(selector,value)=>{const node=document.querySelector(selector);if(node&&value){const defaults=SITE_SETTING_FIELDS.map(x=>x.fallback);node.toggleAttribute('data-no-i18n',!defaults.includes(value)&&!defaults.includes(value.replace(/^„|”$/g,'')));node.textContent=value}};

export function applySiteSettings(settings={}){
  const value=(key)=>String(settings[key]||SITE_SETTING_FIELDS.find(x=>x.key===key)?.fallback||'').trim();
  setText('.hero .eyebrow',value('hero_eyebrow'));
  const heroTitle=document.querySelector('.hero h1');
  if(heroTitle){const words=value('hero_title').split(/\s+/);const accent=words.pop()||'';heroTitle.replaceChildren(document.createTextNode(`${words.join(' ')} `));const span=document.createElement('span');span.textContent=accent;heroTitle.append(span);}
  setText('.hero-subtitle',value('hero_subtitle'));
  setText('.hero-tagline',value('hero_tagline'));
  setText('#community h2',value('community_title'));
  setText('#community>div:first-child p',value('community_description'));
  const links={discord_url:['a[href*="discord"]'],youtube_url:['a[href*="youtube"]'],server_url:['a[href*="l2reborn"]','.brand-subtitle-link']};
  Object.entries(links).forEach(([key,selectors])=>selectors.forEach(selector=>document.querySelectorAll(selector).forEach(node=>{node.href=cleanUrl(value(key),node.href)})));
  const zone=document.querySelector('#memberZoneLayer');
  if(zone){setText('#memberZoneLayer .member-zone-main>header p',value('welcome_subtitle'));setText('#memberZoneLayer .member-zone-main>header em',`„${value('clan_quote')}”`);const cards=zone.querySelectorAll('.member-zone-grid div span');if(cards[0])cards[0].textContent=value('clan_name');if(cards[1])cards[1].textContent=value('server_name');}
  window.dispatchEvent(new CustomEvent('orzel:site-settings-applied',{detail:settings}));
}

export async function loadSiteSettings(supabase){
  const {data,error}=await supabase.from('site_settings').select('key,value');
  if(error)throw error;
  return Object.fromEntries((data||[]).map(row=>[row.key,row.value]));
}

export function installPublicSiteSettings(supabase){
  if(!supabase||window.__obPublicSettingsInstalled)return;
  window.__obPublicSettingsInstalled=true;
  loadSiteSettings(supabase).then(applySiteSettings).catch(error=>console.warn('SITE SETTINGS LOAD FAILED',error.message));
}

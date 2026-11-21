import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const ASSETS={antharas:'/images/bosses/antharas.webp',baium:'/images/bosses/baium.webp',core:'/images/bosses/core.webp',frintezza:'/images/bosses/frintezza.webp',orfen:'/images/bosses/orfen.webp','queen-ant':'/images/bosses/queen-ant.webp',valakas:'/images/bosses/valakas.webp',zaken:'/images/bosses/zaken.webp',rb:'/images/eternal-hero-approved.webp',aden:'/images/castles/aden.jpg',dion:'/images/castles/dion.jpg',giran:'/images/castles/giran.jpg',gludio:'/images/castles/gludio.jpg',goddard:'/images/castles/goddard.jpg',innadril:'/images/castles/innadril.jpg',oren:'/images/castles/oren.jpg',rune:'/images/castles/rune.jpg',schuttgart:'/images/castles/schuttgart.jpg','fortress-of-resistance':'/images/fortress-of-resistance.jpg','devastated-castle':'/images/devastated-castle.jpg','bandit-stronghold':'/images/bandit-stronghold.jpg','rainbow-spring-chateau':'/images/Rainbow%20Springs%20Chateau.jpg','wild-beast-reserve':'/images/Wild%20Beast%20Reserve.jpg','fortress-of-the-dead':'/images/fortress-of-the-dead.jpg',pvp:'/images/events/clan-pvp.webp',colloseum:'/images/events/colloseum-training.webp',olympiad:'/images/events/olympiad.jpg',default:'/images/logo-orzel-bialy.webp'};
function dec(v=''){try{return new TextDecoder().decode(Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(v.length/4)*4,'=')),c=>c.charCodeAt(0)))}catch{return ''}}
function esc(s=''){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
export default async function handler(req,res){
try{
const u=new URL(req.url,'https://'+(req.headers['x-forwarded-host']||req.headers.host||'orzelbialy.eu'));
const name=(dec(u.searchParams.get('n'))||'Wydarzenie klanowe').slice(0,80),date=(dec(u.searchParams.get('d'))||'--.--.----').slice(0,20),time=(dec(u.searchParams.get('t'))||'--:--').slice(0,10),location=(dec(u.searchParams.get('l'))||'Lokalizacja do ustalenia').slice(0,80),type=(dec(u.searchParams.get('k'))||'EVENT').slice(0,30);
const s=name.toLowerCase();const kind=type.toLowerCase();let key=['frintezza','antharas','baium','valakas','zaken','core','orfen'].find(k=>s.includes(k));if(!key&&s.includes('queen ant'))key='queen-ant';if(!key&&kind==='siege'){key=['aden','dion','giran','gludio','goddard','innadril','oren','rune','schuttgart'].find(c=>s.includes(c))||'aden';}if(!key&&kind==='clan hall'){key=['fortress-of-resistance','devastated-castle','bandit-stronghold','rainbow-spring-chateau','wild-beast-reserve','fortress-of-the-dead'].find(c=>s.includes(c.replace(/-/g,' ')))||'default';}if(!key&&kind==='rb')key='rb';if(!key&&s.includes('pvp'))key='pvp';if(!key&&(s.includes('colloseum')||s.includes('colosseum')))key='colloseum';if(!key&&kind==='olympiad')key='olympiad';key=key||'default';
const response=await fetch('https://orzelbialy.eu'+ASSETS[key]);if(!response.ok)throw new Error('Boss image fetch failed: '+response.status);
const original=Buffer.from(await response.arrayBuffer());
const background=await sharp(original).resize(1200,630,{fit:'cover',position:'centre'}).modulate({brightness:.62}).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="shade"><stop offset="0" stop-color="#05080c" stop-opacity=".96"/><stop offset=".62" stop-color="#05080c" stop-opacity=".60"/><stop offset="1" stop-color="#05080c" stop-opacity=".10"/></linearGradient><linearGradient id="bottom"><stop offset="0" stop-color="#05080c" stop-opacity=".88"/><stop offset="1" stop-color="#05080c" stop-opacity="0"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#shade)"/><rect y="365" width="1200" height="265" fill="url(#bottom)"/>
<rect x="22" y="22" width="1156" height="586" rx="8" fill="none" stroke="#d4ad62" stroke-width="2" stroke-opacity=".8"/>
<text x="66" y="82" fill="#e2c27d" font-size="25" font-family="Roboto" font-weight="700" letter-spacing="3">ORZEŁ BIAŁY  |  ETERNAL X10</text>
<text x="66" y="151" fill="#d7b66d" font-size="21" font-family="Roboto" font-weight="700" letter-spacing="5">RAID BOSS / WYDARZENIE KLANOWE</text>
<text x="66" y="240" fill="#fff8e9" font-size="76" font-family="Roboto" font-weight="700">${esc(name.toUpperCase())}</text>
<text x="66" y="318" fill="#d9bd83" font-size="19" font-family="Roboto" font-weight="700" letter-spacing="4">DATA I GODZINA WYDARZENIA</text>
<text x="66" y="405" fill="#fff7e6" font-size="57" font-family="Roboto" font-weight="700">${esc(date)}</text>
<text x="450" y="405" fill="#e3bc69" font-size="88" font-family="Roboto" font-weight="700">${esc(time)}</text>
<text x="66" y="477" fill="#f5ead5" font-size="27" font-family="Roboto" font-weight="400">${esc(location)}</text>
<text x="66" y="548" fill="#e1c27d" font-size="20" font-family="Roboto" font-weight="700" letter-spacing="2">PRZYGOTUJ SIĘ. ZBIÓRKA PRZED RESPAWNEM!</text>
<text x="1135" y="580" text-anchor="end" fill="#d9b66e" font-size="17" font-family="Roboto" font-weight="700" letter-spacing="2">ORZELBIALY.EU</text></svg>`;
const fontFiles=['../node_modules/roboto-npm-webfont/fonts/roboto.ttf','../node_modules/roboto-npm-webfont/fonts/robotobold.ttf'].map(p=>new URL(p,import.meta.url).pathname);
const overlay=new Resvg(svg,{fitTo:{mode:'width',value:1200},font:{fontFiles,loadSystemFonts:false,defaultFontFamily:'Roboto'}}).render().asPng();
const overlayPixels=await sharp(overlay).raw().toBuffer({resolveWithObject:true});
let textPixels=0;
const textZones=[{x1:55,x2:1080,y1:48,y2:100},{x1:55,x2:1080,y1:118,y2:175},{x1:55,x2:1080,y1:195,y2:270},{x1:55,x2:1080,y1:285,y2:340},{x1:55,x2:1080,y1:365,y2:435},{x1:55,x2:1080,y1:445,y2:500},{x1:55,x2:1080,y1:520,y2:565},{x1:900,x2:1150,y1:560,y2:600}];
for(let y=0;y<overlayPixels.info.height;y++)for(let x=0;x<overlayPixels.info.width;x++){
  if(!textZones.some(z=>x>=z.x1&&x<=z.x2&&y>=z.y1&&y<=z.y2))continue;
  const i=(y*overlayPixels.info.width+x)*overlayPixels.info.channels;
  const r=overlayPixels.data[i],g=overlayPixels.data[i+1],b=overlayPixels.data[i+2],a=overlayPixels.data[i+3];
  if(a>180&&r>175&&g>125&&b>45)textPixels++;
}
const png=await sharp(background).composite([{input:overlay}]).png().toBuffer();
res.statusCode=200;res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');res.setHeader('X-Card-Image-Source',key);res.setHeader('X-Card-Size',String(png.length));res.setHeader('X-Card-Text-Pixels',String(textPixels));res.setHeader('X-Card-Text-Verified',textPixels>1500?'true':'false');res.end(png);
}catch(e){console.error('Discord card render failed',e);res.statusCode=500;res.setHeader('Content-Type','text/plain');res.end(String(e?.stack||e))}
}
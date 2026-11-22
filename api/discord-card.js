import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const ASSETS={antharas:'/images/bosses/antharas.webp',baium:'/images/bosses/baium.webp',core:'/images/bosses/core.webp',frintezza:'/images/bosses/frintezza.webp',orfen:'/images/bosses/orfen.webp','queen-ant':'/images/bosses/queen-ant.webp',valakas:'/images/bosses/valakas.webp',zaken:'/images/bosses/zaken.webp',rb:'/images/eternal-hero-approved.webp',aden:'/images/castles/aden.jpg',dion:'/images/castles/dion.jpg',giran:'/images/castles/giran.jpg',gludio:'/images/castles/gludio.jpg',goddard:'/images/castles/goddard.jpg',innadril:'/images/castles/innadril.jpg',oren:'/images/castles/oren.jpg',rune:'/images/castles/rune.jpg',schuttgart:'/images/castles/schuttgart.jpg','fortress-of-resistance':'/images/fortress-of-resistance.jpg','devastated-castle':'/images/devastated-castle.jpg','bandit-stronghold':'/images/bandit-stronghold.jpg','rainbow-spring-chateau':'/images/Rainbow%20Springs%20Chateau.jpg','wild-beast-reserve':'/images/Wild%20Beast%20Reserve.jpg','fortress-of-the-dead':'/images/fortress-of-the-dead.jpg',pvp:'/images/events/clan-pvp.webp',colloseum:'/images/events/colloseum-training.webp',olympiad:'/images/events/olympiad.jpg',default:'/images/logo-orzel-bialy.webp'};
function dec(v=''){try{return new TextDecoder().decode(Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(v.length/4)*4,'=')),c=>c.charCodeAt(0)))}catch{return ''}}
function esc(s=''){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
export default async function handler(req,res){
try{
const u=new URL(req.url,'https://'+(req.headers['x-forwarded-host']||req.headers.host||'orzelbialy.eu'));
const name=(dec(u.searchParams.get('n'))||'Wydarzenie klanowe').slice(0,80),date=(dec(u.searchParams.get('d'))||'--.--.----').slice(0,20),time=(dec(u.searchParams.get('t'))||'--:--').slice(0,10),location=(dec(u.searchParams.get('l'))||'Lokalizacja do ustalenia').slice(0,80),attendees=(dec(u.searchParams.get('a'))||'Brak potwierdzonych zgłoszeń').slice(0,180),type=(dec(u.searchParams.get('k'))||'EVENT').slice(0,30);
const gathering=(dec(u.searchParams.get('g'))||'').slice(0,120);const gatheringParts=gathering.split('|');const gatherLine1=gatheringParts[0]||'';const gatherLine2=gatheringParts[1]||'';const s=name.toLowerCase();const kind=type.toLowerCase();let key=['frintezza','antharas','baium','valakas','zaken','core','orfen'].find(k=>s.includes(k));if(!key&&s.includes('queen ant'))key='queen-ant';if(!key&&kind==='siege'){key=['aden','dion','giran','gludio','goddard','innadril','oren','rune','schuttgart'].find(c=>s.includes(c))||'aden';}if(!key&&kind==='clan hall'){key=['fortress-of-resistance','devastated-castle','bandit-stronghold','rainbow-spring-chateau','wild-beast-reserve','fortress-of-the-dead'].find(c=>s.includes(c.replace(/-/g,' ')))||'default';}if(!key&&kind==='rb')key='rb';if(!key&&s.includes('pvp'))key='pvp';if(!key&&(s.includes('colloseum')||s.includes('colosseum')))key='colloseum';if(!key&&kind==='olympiad')key='olympiad';key=key||'default';
const response=await fetch('https://orzelbialy.eu'+ASSETS[key]);if(!response.ok)throw new Error('Boss image fetch failed: '+response.status);
const original=Buffer.from(await response.arrayBuffer());
const background=await sharp(original).resize(1200,800,{fit:'cover',position:'attention'}).modulate({brightness:.85}).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><linearGradient id="shade"><stop offset="0" stop-color="#05080c" stop-opacity=".96"/><stop offset=".62" stop-color="#05080c" stop-opacity=".84"/><stop offset="1" stop-color="#05080c" stop-opacity=".10"/></linearGradient><linearGradient id="bottom"><stop offset="0" stop-color="#05080c" stop-opacity=".88"/><stop offset="1" stop-color="#05080c" stop-opacity="0"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#shade)"/><rect y="510" width="1200" height="290" fill="url(#bottom)"/>
<path d="M42 38 H1158 M42 763 H1158" fill="none" stroke="#d4ad62" stroke-width="2" stroke-opacity=".65"/>
<text x="240" y="108" fill="#f8f2e9" font-size="55" font-family="DejaVu Sans" font-weight="700" letter-spacing="2">ORZEŁ BIAŁY</text><path d="M240 129 H700" stroke="#e0ae56" stroke-width="2"/><text x="240" y="165" fill="#e4bc69" font-size="22" font-family="DejaVu Sans" letter-spacing="5">LINEAGE II  •  ETERNAL X10</text>
<text x="66" y="243" fill="#d7b66d" font-size="24" font-family="DejaVu Sans" font-weight="700" letter-spacing="5">${esc(kind==="siege"?"CASTLE SIEGE":kind==="clan hall"?"CLAN HALL":kind==="rb"?"RAID BOSS":kind==="olympiad"?"OLYMPIAD":"EPIC BOSS / WYDARZENIE")}</text>
<text x="66" y="349" fill="#fff8e9" font-size="${name.length>22?43:name.length>13?62:94}" font-family="DejaVu Sans" font-weight="700">${esc(name.toUpperCase())}</text>
<path d="M66 369 H735" stroke="#d6a24e" stroke-width="1"/><text x="66" y="412" fill="#d9bd83" font-size="19" font-family="DejaVu Sans" font-weight="700" letter-spacing="3">DATA I GODZINA WYDARZENIA</text>
<text x="66" y="473" fill="#ffda78" font-size="49" font-family="DejaVu Sans" font-weight="700">${esc(date)}</text>
<text x="421" y="473" fill="#ffda78" font-size="58" font-family="DejaVu Sans" font-weight="700">${esc(time)}</text>
<text x="66" y="517" fill="#f5ead5" font-size="20" font-family="DejaVu Sans" font-weight="400">${esc(location)}</text>
${`<text x="66" y="595" fill="#ffce67" font-size="30" font-family="DejaVu Sans" font-weight="700">MIEJSCE ZBIÓRKI: ${esc((gatherLine2||"HUNTER VILLAGE").toUpperCase())}</text>`}
<rect x="65" y="634" width="705" height="105" rx="4" fill="#08090c" fill-opacity=".76"/><text x="83" y="669" fill="#f2e7d1" font-size="26" font-family="DejaVu Sans" font-weight="700">LISTA OBECNOŚCI</text><text x="83" y="709" fill="#fff7e6" font-size="20" font-family="DejaVu Sans">${esc(attendees.slice(0,85))}</text>
<text x="1135" y="750" text-anchor="end" fill="#d9b66e" font-size="17" font-family="DejaVu Sans" font-weight="700" letter-spacing="2">ORZELBIALY.EU</text></svg>`;
const fontDir=new URL('../node_modules/dejavu-fonts-ttf/ttf/',import.meta.url).pathname;
const fontFiles=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(p=>fontDir+p);
const overlay=new Resvg(svg,{fitTo:{mode:'width',value:1200},font:{fontFiles,fontDirs:[fontDir],loadSystemFonts:true,defaultFontFamily:'DejaVu Sans'}}).render().asPng();
const overlayPixels=await sharp(overlay).raw().toBuffer({resolveWithObject:true});
let textPixels=0;
const textZones=[{x1:220,x2:1080,y1:65,y2:120},{x1:220,x2:1080,y1:125,y2:183},{x1:55,x2:1080,y1:210,y2:360},{x1:55,x2:1080,y1:360,y2:420},{x1:55,x2:1080,y1:425,y2:490},{x1:55,x2:1080,y1:495,y2:540},{x1:55,x2:1080,y1:560,y2:620},{x1:55,x2:1080,y1:640,y2:730},{x1:900,x2:1150,y1:735,y2:760}];
for(let y=0;y<overlayPixels.info.height;y++)for(let x=0;x<overlayPixels.info.width;x++){
  if(!textZones.some(z=>x>=z.x1&&x<=z.x2&&y>=z.y1&&y<=z.y2))continue;
  const i=(y*overlayPixels.info.width+x)*overlayPixels.info.channels;
  const r=overlayPixels.data[i],g=overlayPixels.data[i+1],b=overlayPixels.data[i+2],a=overlayPixels.data[i+3];
  if(a>180&&r>175&&g>125&&b>45)textPixels++;
}
let layers=[{input:overlay}];
try { const emblemResponse=await fetch('https://orzelbialy.eu/images/logo-orzel-bialy.webp'); if(emblemResponse.ok){const emblem=await sharp(Buffer.from(await emblemResponse.arrayBuffer())).resize(155,155,{fit:'contain'}).png().toBuffer();layers.push({input:emblem,left:66,top:47});}}catch(err){console.warn('Logo overlay unavailable',err);}
const png=await sharp(background).composite(layers).png().toBuffer();
res.statusCode=200;res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');res.setHeader('X-Card-Image-Source',key);res.setHeader('X-Card-Size',String(png.length));res.setHeader('X-Card-Text-Pixels',String(textPixels));res.setHeader('X-Card-Text-Verified',textPixels>1500?'true':'false');res.end(png);
}catch(e){console.error('Discord card render failed',e);res.statusCode=500;res.setHeader('Content-Type','text/plain');res.end(String(e?.stack||e))}
}
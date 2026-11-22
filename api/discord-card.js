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
const background=await sharp(original).resize(1200,630,{fit:'cover',position:'centre'}).modulate({brightness:.62}).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
 <linearGradient id="leftShade" x1="0" x2="1"><stop offset="0" stop-color="#05070b" stop-opacity=".88"/><stop offset=".42" stop-color="#05070b" stop-opacity=".68"/><stop offset=".72" stop-color="#05070b" stop-opacity=".28"/><stop offset="1" stop-color="#05070b" stop-opacity=".06"/></linearGradient>
 <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070b" stop-opacity="0"/><stop offset="1" stop-color="#05070b" stop-opacity=".62"/></linearGradient>
 <linearGradient id="gold"><stop offset="0" stop-color="#956321"/><stop offset=".5" stop-color="#f7df9b"/><stop offset="1" stop-color="#a7772d"/></linearGradient>
 <linearGradient id="panel"><stop offset="0" stop-color="#101116" stop-opacity=".94"/><stop offset="1" stop-color="#080a0e" stop-opacity=".72"/></linearGradient>
 <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<rect width="1200" height="630" fill="url(#leftShade)"/>
<rect y="450" width="1200" height="180" fill="url(#bottomShade)"/>
<rect x="18" y="18" width="1164" height="594" rx="18" fill="none" stroke="#08090c" stroke-width="12"/>
<rect x="20" y="20" width="1160" height="590" rx="16" fill="none" stroke="url(#gold)" stroke-width="3"/>
<rect x="32" y="32" width="1136" height="566" rx="10" fill="none" stroke="#e5c77e" stroke-opacity=".2" stroke-width="1"/>
<text x="62" y="76" fill="#e8ce91" font-size="25" font-family="DejaVu Sans" font-weight="700" letter-spacing="3">ORZEŁ BIAŁY  |  ETERNAL X10</text>
<path d="M62 100H1138" stroke="url(#gold)" stroke-width="2" stroke-opacity=".7"/>
<rect x="62" y="125" width="500" height="42" rx="6" fill="#b68a43" fill-opacity=".16" stroke="#d8b76d" stroke-opacity=".7"/>
<text x="82" y="153" fill="#f2dfb4" font-size="18" font-family="DejaVu Sans" font-weight="700" letter-spacing="3">RAID BOSS / WYDARZENIE KLANOWE</text>
<text x="62" y="258" fill="#000" opacity=".75" font-size="84" font-family="DejaVu Sans" font-weight="700" transform="translate(3 4)">${esc(name.toUpperCase())}</text>
<text x="62" y="254" fill="#fff5df" font-size="84" font-family="DejaVu Sans" font-weight="700">${esc(name.toUpperCase())}</text>
<path d="M62 280H770" stroke="url(#gold)" stroke-width="4"/>
<rect x="62" y="305" width="390" height="112" rx="10" fill="url(#panel)" stroke="#c9a45e" stroke-opacity=".65" stroke-width="2"/>
<rect x="472" y="305" width="300" height="112" rx="10" fill="url(#panel)" stroke="#c9a45e" stroke-opacity=".65" stroke-width="2"/>
<text x="88" y="341" fill="#d9bd83" font-size="18" font-family="DejaVu Sans" font-weight="700" letter-spacing="3">DATA WYDARZENIA</text>
<text x="88" y="395" fill="#fff7e8" font-size="52" font-family="DejaVu Sans" font-weight="700">${esc(date)}</text>
<text x="500" y="341" fill="#d9bd83" font-size="18" font-family="DejaVu Sans" font-weight="700" letter-spacing="3">GODZINA STARTU</text>
<text x="500" y="397" fill="#edc873" font-size="70" font-family="DejaVu Sans" font-weight="700">${esc(time)}</text>
<rect x="62" y="438" width="710" height="60" rx="8" fill="#0a0c10" fill-opacity=".88" stroke="#c9a45e" stroke-width="2"/>
<text x="88" y="476" fill="#fff0d0" font-size="25" font-family="DejaVu Sans" font-weight="700">MIEJSCE ZBIÓRKI: ${esc(location.toUpperCase())}</text>
${gathering?'<rect x="62" y="513" width="710" height="58" rx="8" fill="#0a0c10" fill-opacity=".92" stroke="#d5ad60" stroke-width="2"/><text x="88" y="550" fill="#edc873" font-size="24" font-family="DejaVu Sans" font-weight="700">'+esc(gatherLine1)+'</text>':'<rect x="62" y="513" width="710" height="58" rx="8" fill="#0a0c10" fill-opacity=".92" stroke="#d5ad60" stroke-width="2"/><text x="88" y="550" fill="#edc873" font-size="24" font-family="DejaVu Sans" font-weight="700">ZBIÓRKA: 30 MINUT PRZED ROZPOCZĘCIEM</text>'}
<text x="64" y="592" fill="#fff7e6" font-size="20" font-family="DejaVu Sans" font-weight="700">BĘDĄ: ${esc(attendees)}</text>
<text x="1138" y="592" text-anchor="end" fill="#e1bd70" font-size="17" font-family="DejaVu Sans" font-weight="700" letter-spacing="2">ORZELBIALY.EU</text>
</svg>`;
const fontDir=new URL('../node_modules/dejavu-fonts-ttf/ttf/',import.meta.url).pathname;
const fontFiles=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(p=>fontDir+p);
const overlay=new Resvg(svg,{fitTo:{mode:'width',value:1200},font:{fontFiles,fontDirs:[fontDir],loadSystemFonts:true,defaultFontFamily:'DejaVu Sans'}}).render().asPng();
const overlayPixels=await sharp(overlay).raw().toBuffer({resolveWithObject:true});
let textPixels=0;
const textZones=[{x1:55,x2:1080,y1:48,y2:100},{x1:55,x2:1080,y1:118,y2:175},{x1:55,x2:1080,y1:195,y2:270},{x1:55,x2:1080,y1:255,y2:305},{x1:55,x2:1080,y1:320,y2:385},{x1:55,x2:1080,y1:390,y2:435},{x1:55,x2:1080,y1:445,y2:485},{x1:55,x2:1080,y1:520,y2:570},{x1:900,x2:1150,y1:560,y2:600}];
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
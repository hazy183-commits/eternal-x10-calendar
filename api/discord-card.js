import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
const ASSETS={antharas:'/images/bosses/antharas.webp',baium:'/images/bosses/baium.webp',core:'/images/bosses/core.webp',frintezza:'/images/bosses/frintezza.webp',orfen:'/images/bosses/orfen.webp','queen-ant':'/images/bosses/queen-ant.webp',valakas:'/images/bosses/valakas.webp',zaken:'/images/bosses/zaken.webp',rb:'/images/eternal-hero-approved.webp',aden:'/images/castles/aden.jpg',dion:'/images/castles/dion.jpg',giran:'/images/castles/giran.jpg',gludio:'/images/castles/gludio.jpg',goddard:'/images/castles/goddard.jpg',innadril:'/images/castles/innadril.jpg',oren:'/images/castles/oren.jpg',rune:'/images/castles/rune.jpg',schuttgart:'/images/castles/schuttgart.jpg','fortress-of-resistance':'/images/fortress-of-resistance.jpg','devastated-castle':'/images/devastated-castle.jpg','bandit-stronghold':'/images/bandit-stronghold.jpg','rainbow-spring-chateau':'/images/Rainbow%20Springs%20Chateau.jpg','wild-beast-reserve':'/images/Wild%20Beast%20Reserve.jpg','fortress-of-the-dead':'/images/fortress-of-the-dead.jpg',pvp:'/images/events/clan-pvp.webp',colloseum:'/images/events/colloseum-training.webp',olympiad:'/images/events/olympiad.jpg',default:'/images/eternal-hero-approved.webp'};
function dec(v=''){try{return new TextDecoder().decode(Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(v.length/4)*4,'=')),c=>c.charCodeAt(0)))}catch{return ''}}
function esc(s=''){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
export default async function handler(req,res){
try{
const u=new URL(req.url,'https://'+(req.headers['x-forwarded-host']||req.headers.host||'orzelbialy.eu'));
const name=(dec(u.searchParams.get('n'))||'Wydarzenie klanowe').slice(0,80),date=(dec(u.searchParams.get('d'))||'--.--.----').slice(0,20),time=(dec(u.searchParams.get('t'))||'--:--').slice(0,10),location=(dec(u.searchParams.get('l'))||'Lokalizacja do ustalenia').slice(0,80),attendees=(dec(u.searchParams.get('a'))||'Brak potwierdzonych zgłoszeń').slice(0,180),type=(dec(u.searchParams.get('k'))||'EVENT').slice(0,30);
const gathering=(dec(u.searchParams.get('g'))||'').slice(0,120);const gatheringParts=gathering.split('|');const gatherLine1=gatheringParts[0]||'';const gatherLine2=gatheringParts[1]||'';const s=name.toLowerCase();const kind=type.toLowerCase();let key=['frintezza','antharas','baium','valakas','zaken','core','orfen'].find(k=>s.includes(k));if(!key&&s.includes('queen ant'))key='queen-ant';if(!key&&kind==='siege'){key=['aden','dion','giran','gludio','goddard','innadril','oren','rune','schuttgart'].find(c=>s.includes(c))||'aden';}if(!key&&kind==='clan hall'){key=['fortress-of-resistance','devastated-castle','bandit-stronghold','rainbow-spring-chateau','wild-beast-reserve','fortress-of-the-dead'].find(c=>s.includes(c.replace(/-/g,' ')))||'default';}if(!key&&kind==='rb')key='rb';if(!key&&s.includes('pvp'))key='pvp';if(!key&&(s.includes('colloseum')||s.includes('colosseum')))key='colloseum';if(!key&&kind==='olympiad')key='olympiad';key=key||'default';
const imageHost='https://orzelbialy.eu';let original;try{const response=await fetch(imageHost+ASSETS[key],{signal:AbortSignal.timeout(7000)});if(!response.ok)throw new Error('Image HTTP '+response.status);original=Buffer.from(await response.arrayBuffer());}catch(error){console.warn('Event background unavailable, using clan artwork',key,String(error));const fallback=await fetch(imageHost+ASSETS.default,{signal:AbortSignal.timeout(7000)});if(!fallback.ok)throw new Error('Fallback image HTTP '+fallback.status);original=Buffer.from(await fallback.arrayBuffer());}
// The finished poster artwork can be deployed at /images/discord/poster-template.png.
// Keep the event scene and all live text dynamic; missing artwork never breaks notifications.
let templateArtwork=null;
try{
 const templateResponse=await fetch(imageHost+'/images/discord/poster-template.svg',{signal:AbortSignal.timeout(3500)});
 if(templateResponse.ok&&/^(image\/|application\/svg\+xml)/.test(String(templateResponse.headers.get('content-type')||''))){
   const bytes=Buffer.from(await templateResponse.arrayBuffer());
   templateArtwork=await sharp(bytes).resize(1200,800,{fit:'fill'}).png().toBuffer();
 }
}catch(error){console.warn('Poster artwork not yet available',String(error));}
const eventScene=await sharp(original).resize(1200,800,{fit:'cover',position:'attention'}).modulate({brightness:1.52,saturation:1.24}).sharpen({sigma:0.7,m1:0.8,m2:1.2}).png().toBuffer();
// Use the full boss scene as the poster background, then layer the transparent frame artwork over it.
const scene=templateArtwork
 ? await sharp(eventScene).composite([{input:templateArtwork,left:0,top:0}]).png().toBuffer()
 : eventScene;
const backdrop=Buffer.from('<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="left" x1="0" x2="1"><stop stop-color="#030409" stop-opacity=".92"/><stop offset=".38" stop-color="#050610" stop-opacity=".78"/><stop offset=".54" stop-color="#070812" stop-opacity=".52"/><stop offset=".70" stop-color="#070812" stop-opacity=".20"/><stop offset=".86" stop-color="#070812" stop-opacity=".08"/><stop offset="1" stop-color="#050510" stop-opacity=".12"/></linearGradient><linearGradient id="vignette" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#02030a" stop-opacity=".1"/><stop offset=".4" stop-color="#05030a" stop-opacity="0"/><stop offset="1" stop-color="#080207" stop-opacity=".48"/></linearGradient></defs><rect width="1200" height="800" fill="url(#left)"/><rect width="1200" height="800" fill="url(#vignette)"/></svg>');
const background=await sharp(scene).composite([{input:backdrop}]).png().toBuffer();
const displayName=name.replace(/\s*(castle siege|— potrzebne rb)$/i,'').trim();
const titleSize=displayName.length>20?42:displayName.length>16?48:displayName.length>12?60:displayName.length>9?76:displayName.length>7?88:104;
const isEpicBoss=['antharas','baium','core','frintezza','orfen','queen-ant','valakas','zaken'].includes(key);
const eventSubtitle=kind==='siege'?'CASTLE SIEGE':kind==='clan hall'?'CLAN HALL':kind==='rb'?'RAID BOSS':kind==='olympiad'?'OLYMPIAD':(kind==='epic'||isEpicBoss)?'EPIC BOSS':'WYDARZENIE KLANOWE';
const gatheringPlace='HUNTER VILLAGE',meetingNotice='ZBIÓRKA 30 MINUT PRZED STARTEM';
const names=attendees.split(/[\n,;]+/).map(p=>p.trim()).filter(Boolean).slice(0,8);
const namesSvg=names.map((p,i)=>{const x=[88,370,650,920][i%4],y=709+Math.floor(i/4)*26;return `<text x="${x}" y="${y}" fill="#eac56c" font-size="20" font-family="DejaVu Sans">•</text><text x="${x+22}" y="${y}" fill="#f8f2e9" font-size="18" font-family="DejaVu Sans">${esc(p.length>23?p.slice(0,21)+'…':p)}</text>`}).join('');
const noConfirmed=names.length===0||names.every(n=>/^brak potwierdzonych/i.test(n));const attendeeSvg=noConfirmed?'<text x="600" y="710" text-anchor="middle" fill="#eee5d5" font-size="20" font-family="DejaVu Sans">Brak potwierdzonych zgłoszeń</text>':namesSvg;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#dce5f1"/><stop offset=".7" stop-color="#778da5"/><stop offset="1" stop-color="#f1f3f5"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff3ae"/><stop offset=".55" stop-color="#ffd45c"/><stop offset="1" stop-color="#a87525"/></linearGradient><linearGradient id="panel"><stop stop-color="#02040a" stop-opacity=".82"/><stop offset="1" stop-color="#02040a" stop-opacity=".08"/></linearGradient></defs>
<rect x="35" y="30" width="715" height="150" fill="#03050b" fill-opacity=".62"/>
<text x="236" y="104" fill="#142038" stroke="#03050b" stroke-width="6" paint-order="stroke" font-size="58" font-family="DejaVu Serif" font-weight="700" letter-spacing="-1">ORZEŁ BIAŁY</text><text x="236" y="100" fill="url(#metal)" stroke="#0a0a10" stroke-width="1.5" paint-order="stroke" font-size="58" font-family="DejaVu Serif" font-weight="700" letter-spacing="-1">ORZEŁ BIAŁY</text><path d="M236 124H708" stroke="#e0ae56" stroke-width="2"/><text x="304" y="160" fill="url(#gold)" font-size="25" font-family="DejaVu Serif" letter-spacing="8">LINEAGE II</text>
<text x="63" y="296" fill="#06142a" stroke="#02040a" stroke-width="8" paint-order="stroke" font-size="${titleSize}" font-family="DejaVu Serif" font-weight="700" letter-spacing="-2">${esc(displayName.toUpperCase())}</text><text x="63" y="293" fill="url(#metal)" stroke="#23354b" stroke-width="2" paint-order="stroke" font-size="${titleSize}" font-family="DejaVu Serif" font-weight="700" letter-spacing="-2">${esc(displayName.toUpperCase())}</text><path d="M68 316Q255 333 478 313" fill="none" stroke="#51bfff" stroke-width="4" opacity=".7"/><path d="M62 333H168M515 333H728" stroke="#e0bb7b" stroke-width="2"/><text x="184" y="340" fill="#f4f1ef" stroke="#11131a" stroke-width="2" paint-order="stroke" font-size="27" font-family="DejaVu Serif" font-weight="700" letter-spacing="3">${esc(eventSubtitle)}</text><path d="M65 358H728" stroke="#c6a775" stroke-width="2"/>
<rect x="52" y="373" width="690" height="238" fill="url(#panel)"/>
<g stroke="#e8b65d" fill="none" stroke-width="4"><rect x="72" y="392" width="43" height="39" rx="2"/><path d="M72 403H115M82 385V399M105 385V399M82 412H105M82 421H105"/><circle cx="94" cy="479" r="22"/><path d="M94 464V479L107 487"/></g><text x="132" y="431" fill="#f5f2ef" font-size="32" font-family="DejaVu Serif" font-weight="700">DATA:</text><text x="286" y="431" fill="url(#gold)" font-size="42" font-family="DejaVu Serif" font-weight="700">${esc(date)}</text><text x="132" y="497" fill="#f5f2ef" font-size="32" font-family="DejaVu Serif" font-weight="700">GODZINA:</text><text x="352" y="497" fill="url(#gold)" font-size="48" font-family="DejaVu Serif" font-weight="700">${esc(time)}</text>
<g fill="#dcb15e"><circle cx="78" cy="548" r="10"/><circle cx="108" cy="540" r="13"/><circle cx="139" cy="548" r="10"/><path d="M60 572Q60 555 78 555Q96 555 96 572ZM87 578Q87 557 108 557Q129 557 129 578ZM121 572Q121 555 139 555Q157 555 157 572Z"/></g><text x="190" y="556" fill="#f6f0e6" font-size="28" font-family="DejaVu Serif" font-weight="700">MIEJSCE ZBIÓRKI:</text><text x="190" y="595" fill="url(#gold)" font-size="37" font-family="DejaVu Serif" font-weight="700">${gatheringPlace}</text>
<path d="M43 646H1157" stroke="#d6ad5e" stroke-width="3"/><text x="600" y="683" text-anchor="middle" fill="url(#gold)" stroke="#100b08" stroke-width="2" paint-order="stroke" font-size="26" font-family="DejaVu Serif" font-weight="700" letter-spacing="2">LISTA OBECNOŚCI</text><path d="M72 690H1128" stroke="#b99350" stroke-width="1.5"/>${attendeeSvg}
<text x="42" y="774" fill="url(#gold)" stroke="#1c0d0a" stroke-width="2" paint-order="stroke" font-size="29" font-family="DejaVu Serif" font-style="italic">Razem po zwycięstwo!</text><text x="780" y="773" text-anchor="middle" fill="#ffe2a1" stroke="#170f0b" stroke-width="2" paint-order="stroke" font-size="17" font-family="DejaVu Serif" font-weight="700">${meetingNotice}</text>
</svg>`;
const fontDir=new URL('../node_modules/dejavu-fonts-ttf/ttf/',import.meta.url).pathname;
const fontFiles=['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSerif.ttf','DejaVuSerif-Bold.ttf','DejaVuSerif-Italic.ttf'].map(p=>fontDir+p);
const overlay=new Resvg(svg,{fitTo:{mode:'width',value:1200},font:{fontFiles,fontDirs:[fontDir],loadSystemFonts:true,defaultFontFamily:'DejaVu Sans'}}).render().asPng();
const overlayPixels=await sharp(overlay).raw().toBuffer({resolveWithObject:true});
let textPixels=0;
const textZones=[{x1:220,x2:800,y1:60,y2:170},{x1:45,x2:760,y1:220,y2:360},{x1:55,x2:760,y1:380,y2:520},{x1:55,x2:760,y1:520,y2:615},{x1:40,x2:1160,y1:640,y2:735},{x1:35,x2:1180,y1:740,y2:795}];
for(let y=0;y<overlayPixels.info.height;y++)for(let x=0;x<overlayPixels.info.width;x++){
  if(!textZones.some(z=>x>=z.x1&&x<=z.x2&&y>=z.y1&&y<=z.y2))continue;
  const i=(y*overlayPixels.info.width+x)*overlayPixels.info.channels;
  const r=overlayPixels.data[i],g=overlayPixels.data[i+1],b=overlayPixels.data[i+2],a=overlayPixels.data[i+3];
  if(a>180&&r>175&&g>125&&b>45)textPixels++;
}
// Compose decorative artwork BELOW the event text to keep every label readable.
let layers=[];
const flag=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="540" height="180" viewBox="0 0 470 170"><defs><linearGradient id="white" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".94"/><stop offset="1" stop-color="#e7e0e0" stop-opacity=".9"/></linearGradient><linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ed2940" stop-opacity=".92"/><stop offset="1" stop-color="#9c1128" stop-opacity=".9"/></linearGradient></defs><path d="M0 65 Q80 20 170 50 T350 40 T470 10 L470 88 Q350 124 250 98 T0 128Z" fill="url(#white)"/><path d="M0 128 Q100 75 220 105 T470 88 L470 170 L0 170Z" fill="url(#red)"/></svg>');
layers.push({input:flag,left:660,top:620});
layers.push({input:overlay});
// Place the original Lineage II clan crest where the reference shows the eagle.
let crest=null;
try{
 const crestResponse=await fetch(imageHost+'/images/discord/clan-crest.svg',{signal:AbortSignal.timeout(4500)});
 if(!crestResponse.ok)throw new Error('Clan crest HTTP '+crestResponse.status);
 const crestBytes=Buffer.from(await crestResponse.arrayBuffer());
 crest=await sharp(crestBytes,{density:180}).resize(160,120,{fit:'contain'}).png().toBuffer();
 layers.push({input:crest,left:34,top:28});
}catch(error){console.warn('Clan crest could not be rendered',String(error));}
const png=await sharp(background).composite(layers).png().toBuffer();
res.statusCode=200;res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');res.setHeader('X-Card-Image-Source',key);res.setHeader('X-Card-Template',templateArtwork?'clan-crest-reference-v5':'dynamic-event-v3');res.setHeader('X-Card-Size',String(png.length));res.setHeader('X-Card-Text-Pixels',String(textPixels));res.setHeader('X-Card-Text-Verified',textPixels>1500?'true':'false');res.end(png);
}catch(e){console.error('Discord card render failed',e);res.statusCode=500;res.setHeader('Content-Type','text/plain');res.end(String(e?.stack||e))}
}
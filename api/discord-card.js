import React from 'react';
import { ImageResponse } from '@vercel/og';
const ASSETS={antharas:'/images/bosses/antharas.webp',baium:'/images/bosses/baium.webp',core:'/images/bosses/core.webp',frintezza:'/images/bosses/frintezza.webp',orfen:'/images/bosses/orfen.webp','queen-ant':'/images/bosses/queen-ant.webp',valakas:'/images/bosses/valakas.webp',zaken:'/images/bosses/zaken.webp',siege:'/images/castles/aden.jpg',pvp:'/images/events/clan-pvp.webp',colloseum:'/images/events/colloseum-training.webp',olympiad:'/images/events/olympiad.jpg',default:'/images/logo-orzel-bialy.webp'};
function dec(v=''){try{return new TextDecoder().decode(Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(v.length/4)*4,'=')),c=>c.charCodeAt(0)))}catch{return ''}}
function txt(v,f,n){return (v||f).trim().slice(0,n)||f}
export default async function handler(req,res){
const u=new URL(req.url,'https://'+(req.headers['x-forwarded-host']||req.headers.host||'orzelbialy.eu'));
const name=txt(dec(u.searchParams.get('n')),'Wydarzenie klanowe',80),date=txt(dec(u.searchParams.get('d')),'--.--.----',20),time=txt(dec(u.searchParams.get('t')),'--:--',10),location=txt(dec(u.searchParams.get('l')),'Lokalizacja do ustalenia',80),type=txt(dec(u.searchParams.get('k')),'EVENT',30);
const s=name.toLowerCase();let key=['frintezza','antharas','baium','valakas','zaken','core','orfen'].find(k=>s.includes(k));if(!key&&s.includes('queen ant'))key='queen-ant';if(!key&&type.toLowerCase()==='siege')key='siege';if(!key&&s.includes('pvp'))key='pvp';if(!key&&(s.includes('colloseum')||s.includes('colosseum')))key='colloseum';if(!key&&type.toLowerCase()==='olympiad')key='olympiad';key=key||'default';
const image='https://orzelbialy.eu'+ASSETS[key];
const textNode=(value,style)=>React.createElement('div',{style},value);
const card=React.createElement('div',{style:{width:1200,height:630,display:'flex',position:'relative',backgroundColor:'#090c12',overflow:'hidden',color:'#f7f2e7',fontFamily:'Arial,sans-serif'}},
React.createElement('img',{src:image,style:{position:'absolute',width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',opacity:.82}}),
React.createElement('div',{style:{position:'absolute',inset:0,display:'flex',background:'linear-gradient(90deg,rgba(5,8,12,.98) 0%,rgba(5,8,12,.90) 35%,rgba(5,8,12,.42) 68%,rgba(5,8,12,.18) 100%),linear-gradient(0deg,rgba(5,8,12,.92),transparent 45%)'}}),
React.createElement('div',{style:{position:'absolute',inset:24,border:'1px solid rgba(209,164,74,.48)',display:'flex'}}),
React.createElement('div',{style:{position:'absolute',left:62,top:48,display:'flex',flexDirection:'column'}},
textNode('ORZEŁ BIAŁY · ETERNAL X10',{display:'flex',color:'#d6b46a',fontSize:23,letterSpacing:4,fontWeight:700}),
textNode('⚔  RAID / CLAN EVENT',{display:'flex',marginTop:42,color:'#c6a45e',fontSize:21,letterSpacing:6,fontWeight:800}),
textNode(name.toUpperCase(),{display:'flex',marginTop:12,fontSize:64,fontWeight:900,maxWidth:780,lineHeight:1.04,textShadow:'0 4px 22px rgba(0,0,0,.6)'}),
textNode('RESPAWN / EVENT START',{display:'flex',marginTop:36,color:'#bfa86b',fontSize:19,letterSpacing:4,fontWeight:700}),
React.createElement('div',{style:{display:'flex',alignItems:'baseline',gap:30,marginTop:12}},textNode(date,{display:'flex',fontSize:54,fontWeight:900,color:'#fff7e6'}),textNode(time,{display:'flex',fontSize:82,fontWeight:900,color:'#d5b46a',lineHeight:1})),
textNode('📍  '+location,{display:'flex',marginTop:22,fontSize:24,color:'#f3e7cd'}),
textNode('PRZYGOTUJ SIĘ. ZBIÓRKA PRZED RESPAWNEM!',{display:'flex',marginTop:38,fontSize:18,color:'#c6c4be',letterSpacing:2})
),
textNode('ORZELBIALY.EU',{position:'absolute',right:60,bottom:48,display:'flex',fontSize:18,color:'#d2b16c',letterSpacing:3,fontWeight:700}));
try{const out=new ImageResponse(card,{width:1200,height:630});const png=Buffer.from(await out.arrayBuffer());res.statusCode=200;res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');res.end(png)}catch(e){console.error('Discord card render failed',e);res.statusCode=500;res.end(String(e?.stack||e))}
}
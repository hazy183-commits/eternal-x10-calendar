const YOUTUBE_CHANNEL='https://www.youtube.com/@orzelbialyfirstofight';

function safeText(value=''){
  return String(value).replace(/[&<>"']/g,(char)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function shuffle(list){
  const copy=[...list];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function posterMarkup(title,index){
  const label=index===0?'MASS PVP · EPIC FIGHTS':'SIEGE · CLAN ACTION';
  return `<span class="ob-play">▶</span><div><small>${label}</small><b>${safeText(title)}</b><em>Kliknij PLAY — film zostanie tutaj</em></div>`;
}

function renderVideoPoster(card,video,index){
  card.classList.remove('is-playing','is-unavailable');
  card.dataset.videoId=video?.id||'';
  card.dataset.videoTitle=video?.title||'';
  card.dataset.videoSlot=String(index);
  card.style.backgroundImage=video?.thumbnail?`url("${video.thumbnail}")`:'';
  card.innerHTML=video?.id
    ?posterMarkup(video.title,index)
    :`<div><small>ORZEŁ BIAŁY · YOUTUBE</small><b>Materiały z kanału chwilowo niedostępne</b><em>Kliknij, aby przejść do YouTube</em></div>`;
  if(!video?.id)card.classList.add('is-unavailable');
}

function restorePoster(card){
  const id=card.dataset.videoId;
  if(!id){
    renderVideoPoster(card,null,Number(card.dataset.videoSlot||0));
    return;
  }
  card.classList.remove('is-playing');
  card.innerHTML=posterMarkup(card.dataset.videoTitle||'Orzeł Biały — akcja klanu',Number(card.dataset.videoSlot||0));
}

async function loadRandomChannelVideos(shell){
  const cards=[...shell.querySelectorAll('[data-ob-video]')];
  try{
    const response=await fetch(`/api/youtube-videos?t=${Date.now()}`,{cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload?.error||`HTTP ${response.status}`);
    const videos=shuffle(Array.isArray(payload.videos)?payload.videos:[]);
    if(!videos.length)throw new Error('Brak filmów');
    cards.forEach((card,index)=>renderVideoPoster(card,videos[index%videos.length],index));
  }catch(error){
    console.warn('Nie udało się pobrać losowych filmów YouTube',error);
    cards.forEach((card,index)=>renderVideoPoster(card,null,index));
  }
}

export function installPremiumLanding(){
  const layer=document.querySelector('#memberAuthLayer');
  const authBox=layer?.querySelector('.member-auth-box');
  if(!layer||!authBox||layer.querySelector('.ob-gate-shell'))return false;

  const shell=document.createElement('section');
  shell.className='ob-gate-shell';
  shell.innerHTML=`
    <header class="ob-gate-header">
      <div class="ob-gate-brand">
        <img src="/images/logo-orzel-bialy.png" alt="Orzeł Biały" />
        <div>
          <span>LINEAGE 2 REBORN · ETERNAL X10</span>
          <h1>ORZEŁ BIAŁY</h1>
          <p>More than a game — it’s a community</p>
        </div>
      </div>
      <div class="ob-gate-status"><i></i> STREFA KLANU</div>
    </header>
    <div class="ob-gate-grid">
      <div class="ob-gate-login-slot"></div>
      <aside class="ob-gate-media">
        <div class="ob-recruit-box ob-recruit-hero">
          <span>REKRUTACJA · ORZEŁ BIAŁY</span>
          <h3>Nie szukamy statystów. Szukamy ludzi, którzy chcą pisać z nami historię.</h3>
          <p>Epic RB, siege i mass PvP to tylko pole bitwy. Prawdziwa siła zaczyna się wcześniej — w party, we wspólnych decyzjach i w tym, że wchodzimy razem i walczymy do końca. Nie interesuje nas idealny gear ani liczby w profilu. Liczy się charakter, aktywność i to, czy potrafisz grać dla ekipy. Orzeł Biały to nie kolejny tag nad głową. To ludzie, z którymi chce się wracać do gry.</p>
          <div class="ob-recruit-actions">
            <b>Stań z nami w jednym szeregu. Zostań częścią Orła Białego.</b>
            <button type="button" class="ob-recruit-write" data-ob-recruit-write>NAPISZ DO NAS ✦</button>
          </div>
        </div>
        <div class="ob-gate-info">
          <div><small>SERWER</small><b>Eternal x10 Main</b></div>
          <div><small>KLAN</small><b>Orzeł Biały</b></div>
          <div><small>GRA</small><b>Lineage 2 Reborn</b></div>
        </div>
        <div class="ob-gate-media-head ob-gate-media-head-lower">
          <div><span>ORZEŁ BIAŁY MEDIA</span><h2>AKCJE KLANU</h2></div>
          <a href="${YOUTUBE_CHANNEL}" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
        </div>
        <div class="ob-gate-videos">
          <button class="ob-gate-video ob-video-one" type="button" data-ob-video data-video-slot="0" aria-label="Odtwórz losowy film Orła Białego">
            <div><small>ORZEŁ BIAŁY · YOUTUBE</small><b>Losuję film z kanału…</b><em>Chwila…</em></div>
          </button>
          <button class="ob-gate-video ob-video-two" type="button" data-ob-video data-video-slot="1" aria-label="Odtwórz drugi losowy film Orła Białego">
            <div><small>ORZEŁ BIAŁY · YOUTUBE</small><b>Losuję drugi film…</b><em>Chwila…</em></div>
          </button>
        </div>
      </aside>
    </div>
    <footer class="ob-gate-footer"><span>PRIVATE CLAN AREA</span><p>Dostęp do kalendarza, zapisów i informacji klanowych mają wyłącznie zatwierdzeni członkowie.</p></footer>`;

  layer.appendChild(shell);
  shell.querySelector('.ob-gate-login-slot').appendChild(authBox);
  authBox.querySelector('img')?.classList.add('ob-auth-old-logo');
  authBox.querySelector('.member-auth-close')?.setAttribute('aria-hidden','true');

  shell.querySelectorAll('[data-ob-video]').forEach((card)=>{
    card.addEventListener('click',(event)=>{
      if(event.target.closest('.ob-player-close')||card.classList.contains('is-playing'))return;
      const videoId=card.dataset.videoId;
      if(!videoId){
        window.open(YOUTUBE_CHANNEL,'_blank','noopener,noreferrer');
        return;
      }
      shell.querySelectorAll('.ob-gate-video.is-playing').forEach((other)=>{
        if(other!==card)restorePoster(other);
      });
      card.classList.add('is-playing');
      card.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0" title="${safeText(card.dataset.videoTitle||'Orzeł Biały — YouTube')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><button class="ob-player-close" type="button" aria-label="Zamknij film">×</button>`;
    });
  });

  shell.addEventListener('click',(event)=>{
    const close=event.target.closest('.ob-player-close');
    if(!close)return;
    const card=close.closest('.ob-gate-video');
    if(!card)return;
    event.preventDefault();
    event.stopPropagation();
    restorePoster(card);
  });

  loadRandomChannelVideos(shell);
  return true;
}

function bootPremiumLanding(){
  if(installPremiumLanding())return;
  const observer=new MutationObserver(()=>{
    if(installPremiumLanding())observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),10000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootPremiumLanding,{once:true});
else bootPremiumLanding();

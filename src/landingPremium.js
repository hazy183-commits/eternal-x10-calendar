export function installPremiumLanding(){
  const layer=document.querySelector('#memberAuthLayer');
  const authBox=layer?.querySelector('.member-auth-box');
  if(!layer||!authBox||layer.querySelector('.ob-gate-shell'))return;

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
        <div class="ob-gate-media-head">
          <div><span>ORZEŁ BIAŁY MEDIA</span><h2>AKCJE KLANU</h2></div>
          <a href="https://www.youtube.com/@orzelbialyfirstofight" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
        </div>
        <div class="ob-gate-videos">
          <a class="ob-gate-video ob-video-one" href="https://www.youtube.com/@orzelbialyfirstofight" target="_blank" rel="noopener noreferrer">
            <span class="ob-play">▶</span>
            <div><small>MASS PVP · EPIC FIGHTS</small><b>Najlepsze akcje Orła Białego</b><em>Otwórz kanał YouTube</em></div>
          </a>
          <a class="ob-gate-video ob-video-two" href="https://www.youtube.com/@orzelbialyfirstofight" target="_blank" rel="noopener noreferrer">
            <span class="ob-play">▶</span>
            <div><small>SIEGE · CLAN ACTION</small><b>Eternal x10 — wspólna gra</b><em>Zobacz materiały klanu</em></div>
          </a>
        </div>
        <div class="ob-gate-info">
          <div><small>SERWER</small><b>Eternal x10 Main</b></div>
          <div><small>KLAN</small><b>Orzeł Biały</b></div>
          <div><small>GRA</small><b>Lineage 2 Reborn</b></div>
        </div>
        <div class="ob-gate-links">
          <a href="https://discord.gg/HtTrJpp7K" target="_blank" rel="noopener noreferrer">◉ Discord klanu</a>
          <a href="https://l2reborn.org/" target="_blank" rel="noopener noreferrer">◎ Strona serwera</a>
        </div>
      </aside>
    </div>
    <footer class="ob-gate-footer"><span>PRIVATE CLAN AREA</span><p>Dostęp do kalendarza, zapisów i informacji klanowych mają wyłącznie zatwierdzeni członkowie.</p></footer>`;

  layer.appendChild(shell);
  shell.querySelector('.ob-gate-login-slot').appendChild(authBox);
  authBox.querySelector('img')?.classList.add('ob-auth-old-logo');
  authBox.querySelector('.member-auth-close')?.setAttribute('aria-hidden','true');
}

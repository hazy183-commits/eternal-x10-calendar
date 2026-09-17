const exactBuffPresets={
Mage:{title:'Mage · preset bazowy',source:'Discord 20.01.2025',asset:'/images/codex/buffs/mage-source.txt'},
Dagger:{title:'Dagger · preset bazowy',source:'Discord 20.01.2025',asset:'/images/codex/buffs/dagger-source.txt'},
Archer:{title:'Archer · preset bazowy',source:'Discord 20.01.2025',asset:'/images/codex/buffs/archer-source.txt'}
};

const buffCatalog={
'Berserker Spirit':{effect:'Zwiększa P. Atk., M. Atk., Atk. Spd., Casting Spd. i szybkość poruszania, kosztem obniżenia P. Def., M. Def. i Evasion.',details:'Buff ofensywny. Bardzo mocny do zwiększania tempa walki, ale zmniejsza przeżywalność.'},
'Acumen':{effect:'Zwiększa Casting Speed.',details:'Kluczowy buff dla klas magicznych i healerów. Na najwyższym standardowym poziomie zwiększa Casting Spd. o 30%.'},
'Shield':{effect:'Zwiększa P. Def.',details:'Podstawowy buff defensywny przeciw obrażeniom fizycznym.'},
'Mental Shield':{effect:'Zwiększa odporność na ataki mentalne.',details:'Pomaga przeciw efektom takim jak Sleep, Hold, Fear i Silence.'},
'Greater Shield':{effect:'Znacznie zwiększa P. Def.',details:'Mocniejszy wariant defensywnego buffa pod przeżywalność fizyczną.'},
'Magic Barrier':{effect:'Zwiększa M. Def.',details:'Podstawowa ochrona przeciw obrażeniom magicznym.'},
'Bless the Body':{effect:'Zwiększa maksymalne HP.',details:'Większy zapas HP poprawia przeżywalność w PvP i mass PvP.'},
'Empower':{effect:'Zwiększa M. Atk.',details:'Podstawowy buff zwiększający siłę magicznych ataków.'},
'Wild Magic':{effect:'Zwiększa szansę na magiczny critical.',details:'Szczególnie wartościowy dla ofensywnych casterów.'},
'Wind Walk':{effect:'Zwiększa szybkość poruszania.',details:'Buff mobilności. Na Interlude może być zastępowany potionem w setupach, w których trzeba oszczędzać sloty.'},
'Death Whisper':{effect:'Zwiększa obrażenia z critical hitów.',details:'Jeden z podstawowych buffów damage dla daggerów i łuczników.'},
'Haste':{effect:'Zwiększa Attack Speed.',details:'Podstawowy buff dla klas fizycznych.'},
'Guidance':{effect:'Zwiększa Accuracy.',details:'Pomaga trafiać cele o wysokim Evasion.'},
'Focus':{effect:'Zwiększa Critical Rate.',details:'Podstawowy buff pod częstsze trafienia krytyczne.'},
'Might':{effect:'Zwiększa P. Atk.',details:'Podstawowy buff zwiększający fizyczne obrażenia.'}
};

// Rozpoznania, których jesteśmy pewni z ikon źródłowych. Pozostałych nie zgadujemy.
const verifiedSlots={
Mage:{4:'Berserker Spirit',5:'Acumen',6:'Shield',7:'Mental Shield',8:'Greater Shield',9:'Magic Barrier',10:'Bless the Body',11:'Empower',12:'Wild Magic',14:'Wind Walk'},
Dagger:{4:'Mental Shield',5:'Greater Shield',6:'Magic Barrier',7:'Bless the Body',8:'Death Whisper',9:'Wind Walk',10:'Haste',11:'Shield',12:'Guidance'},
Archer:{3:'Wind Walk',4:'Berserker Spirit',5:'Haste',6:'Might',8:'Magic Barrier',9:'Death Whisper',10:'Focus',12:'Guidance'}
};

const buffPresetContainer=document.querySelector('#buffPresets');
let exactActivePreset='Mage';
const exactCache=new Map();

function ensureExactBuffStyles(){if(document.querySelector('#exact-buff-styles'))return;const style=document.createElement('style');style.id='exact-buff-styles';style.textContent=`
.exact-buff-grid{display:grid;grid-template-columns:repeat(12,44px);gap:7px;margin-top:18px;overflow-x:auto;padding:5px 2px 10px}.exact-buff-cell{position:relative;width:44px;height:44px;border:1px solid #4a3b24;border-radius:7px;background:#090909;cursor:pointer;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03);transition:.15s}.exact-buff-cell:hover{transform:translateY(-2px);border-color:#d7b56d;box-shadow:0 5px 15px rgba(0,0,0,.35),0 0 0 1px rgba(215,181,109,.2)}.exact-buff-icon{position:absolute;inset:3px;background-repeat:no-repeat;border-radius:3px;image-rendering:auto}.exact-buff-num{position:absolute;right:1px;bottom:1px;background:rgba(0,0,0,.83);color:#ecd9aa;font-size:8px;font-weight:800;line-height:13px;min-width:13px;text-align:center;border-radius:3px}.exact-buff-cell.verified:after{content:'✓';position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;display:grid;place-items:center;background:#176b3b;color:#b8ffd0;font-size:8px;font-weight:900}.exact-buff-help{margin-top:10px!important;color:#aaa59b!important;font-size:12px!important}.buff-detail-modal{position:fixed;inset:0;z-index:100;display:none}.buff-detail-modal.open{display:block}.buff-detail-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px)}.buff-detail-card{position:relative;z-index:2;width:min(520px,calc(100% - 24px));margin:12vh auto;background:linear-gradient(180deg,#17140f,#0c0c0b);border:1px solid #6e552c;border-radius:14px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.65)}.buff-detail-close{position:absolute;right:14px;top:10px;border:0;background:none;color:#ddd;font-size:28px;cursor:pointer}.buff-detail-top{display:flex;align-items:center;gap:16px;padding-right:35px}.buff-detail-preview{width:62px;height:62px;flex:0 0 62px;border:1px solid #6b5430;border-radius:9px;background:#080808;overflow:hidden;position:relative}.buff-detail-preview .exact-buff-icon{inset:4px}.buff-detail-card h3{font-family:Cinzel,serif;margin:0 0 4px;font-size:23px}.buff-detail-slot{color:#d7b56d;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.buff-detail-body{margin-top:20px;border-top:1px solid #2e271c;padding-top:17px}.buff-detail-body h4{margin:0 0 7px;color:#d7b56d;font-size:11px;text-transform:uppercase;letter-spacing:.14em}.buff-detail-body p{margin:0 0 16px;color:#c5beb2;line-height:1.65}.buff-unverified{padding:11px 13px;border-left:3px solid #8b6a31;background:#17130d;color:#c9b98f;font-size:12px;line-height:1.55}@media(max-width:700px){.exact-buff-grid{grid-template-columns:repeat(6,44px);width:max-content;max-width:100%;}.buff-detail-card{margin:7vh auto}}
`;document.head.appendChild(style);}

async function exactImageData(asset){if(exactCache.has(asset))return exactCache.get(asset);const r=await fetch(asset,{cache:'no-store'});if(!r.ok)throw new Error('Nie udało się wczytać źródła buffów');const data=`data:image/webp;base64,${(await r.text()).trim()}`;exactCache.set(asset,data);return data;}

function iconStyle(src,slot){const i=slot-1,col=i%12,row=Math.floor(i/12);const x=col===11?100:(col/11)*100;const y=row?100:0;return `background-image:url('${src}');background-size:1200% 200%;background-position:${x}% ${y}%`;}

function ensureDetailModal(){let modal=document.querySelector('#buffDetailModal');if(modal)return modal;modal=document.createElement('div');modal.id='buffDetailModal';modal.className='buff-detail-modal';modal.innerHTML=`<div class="buff-detail-backdrop" data-buff-close></div><article class="buff-detail-card"><button class="buff-detail-close" data-buff-close>×</button><div id="buffDetailContent"></div></article>`;document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target.closest('[data-buff-close]'))modal.classList.remove('open')});window.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});return modal;}

function openBuffDetail(preset,slot,src){const modal=ensureDetailModal();const name=verifiedSlots[preset]?.[slot];const info=name?buffCatalog[name]:null;document.querySelector('#buffDetailContent').innerHTML=`<div class="buff-detail-top"><div class="buff-detail-preview"><span class="exact-buff-icon" style="${iconStyle(src,slot)}"></span></div><div><div class="buff-detail-slot">${preset} · slot ${slot}/24</div><h3>${name||`Buff #${slot}`}</h3></div></div><div class="buff-detail-body">${info?`<h4>Co daje</h4><p>${info.effect}</p><h4>Jak działa w praktyce</h4><p>${info.details}</p><div class="buff-unverified" style="border-left-color:#2f8d54;color:#b8e8c7">✓ Nazwa tej ikony została rozpoznana i przypisana do opisu.</div>`:`<h4>Źródło</h4><p>To dokładnie ikona z pozycji ${slot} w klanowym presecie ${preset} ze screena Discorda.</p><div class="buff-unverified">Nie przypisuję tutaj nazwy ani statystyk na zgadywanie. Ikona i kolejność są 1:1; opis uzupełnimy dopiero po pewnej identyfikacji tego konkretnego buffa.</div>`}</div>`;modal.classList.add('open');}

async function renderExactPreset(key=exactActivePreset){if(!buffPresetContainer||!exactBuffPresets[key])return;exactActivePreset=key;ensureExactBuffStyles();const p=exactBuffPresets[key];buffPresetContainer.innerHTML=`<h3>Presety buffów</h3><div class="preset-tabs">${Object.keys(exactBuffPresets).map(n=>`<button class="${n===key?'active':''}" data-exact-preset="${n}">${n}</button>`).join('')}</div><div class="preset-card"><h4>${p.title}</h4><p><b>${p.source}</b> · dokładna kolejność ikon ze screena.</p><div data-buff-grid>Wczytywanie…</div><p class="exact-buff-help">Kliknij dowolny buff. Każdy jest osobnym polem; zielony ✓ oznacza, że nazwa i opis ikony są już zweryfikowane.</p></div>`;try{const src=await exactImageData(p.asset);const mount=buffPresetContainer.querySelector('[data-buff-grid]');mount.className='exact-buff-grid';mount.innerHTML=Array.from({length:24},(_,i)=>{const slot=i+1,verified=!!verifiedSlots[key]?.[slot];return `<button class="exact-buff-cell ${verified?'verified':''}" data-buff-slot="${slot}" aria-label="${key} buff slot ${slot}"><span class="exact-buff-icon" style="${iconStyle(src,slot)}"></span><span class="exact-buff-num">${slot}</span></button>`}).join('');mount.querySelectorAll('[data-buff-slot]').forEach(btn=>btn.addEventListener('click',()=>openBuffDetail(key,Number(btn.dataset.buffSlot),src)));}catch(e){const mount=buffPresetContainer.querySelector('[data-buff-grid]');if(mount)mount.textContent='Nie udało się wczytać ikon.';console.error(e)}}

if(buffPresetContainer){buffPresetContainer.addEventListener('click',e=>{const b=e.target.closest('[data-exact-preset]');if(!b)return;e.preventDefault();renderExactPreset(b.dataset.exactPreset)});renderExactPreset('Mage');}

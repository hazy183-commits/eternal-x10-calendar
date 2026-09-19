const advisorLink=document.createElement('a');advisorLink.href='/pvp-advisor.html';advisorLink.textContent='PvP Advisor';document.querySelector('.codex-topbar nav')?.prepend(advisorLink);
const classes=[
{name:'Spellsinger',short:'SPS',group:'Mage',desc:'Burst/control mage pod PvP i walkę przeciw casterom.',gear:['Dark Crystal Robe +6','Tallum Robe +3'],weapon:['Arcana Mace Acumen +6 · Passive Wild Magic 10','Homunkulus Acumen · Active Wild Magic 10'],jewels:['TT set +5'],dyes:['+4 WIT / -4 MEN','+4 CON / -5 STR','+4 INT / -4 MEN'],skills:['Hydro Blast → Power','Surrender to Water → Chance','Aura Flash → Chance','Solar Flare → Power','Aqua Splash → Power','Frost Wall → Power','Aura Flare → Power'],buffs:['Daily + PvP','PvP','vs Mage PT','vs Archer PT','Epic Boss vs Mage PT'],tip:'Przy niektórych setupach augmentacja zdejmuje Wind Walk lub Berserker Spirit. W PvP można to kompensować Greater Haste Potion.'},
{name:'Necromancer',short:'Necro',group:'Mage',desc:'Debuff pressure + mocny magic damage.',gear:['Dark Crystal Robe +6'],weapon:['Arcana Mace Acumen +6 · Passive Empower 10','Homunkulus Acumen · Active Empower 10'],jewels:['TT set +5'],dyes:['+4 WIT / -4 MEN','+4 CON / -5 STR','+4 INT / -4 MEN'],skills:['Gloom → Chance','Silence → Chance','Curse Disease → Chance','Anchor → Chance','Sleep → Chance','Death Spike → Power','Vampiric Claw → Power','Curse Death Link → Power','Reanimated Man → Power (+10)'],buffs:['Daily + PvP','PvP','vs Mage PT','vs Archer PT'],tip:'Build jest ustawiony pod skuteczne debuffy i presję w mass PvP.'},
{name:'Overlord',short:'OL',group:'Support',desc:'Debuffy, wsparcie klanu i CP/HP sustain.',gear:['Major Arcana +6','Dark Crystal jako alternatywa pod CP/HP spam'],weapon:['Arcana Mace Acumen +6 · Passive Empower 10','Active Empower','Active Shield','Active Magic Barrier'],jewels:['TT set +5'],dyes:['+4 WIT / -4 MEN','+4 CON / -5 STR','+1 WIT / -1 MEN','Oly alternatywnie: +4 DEX / -4 STR'],skills:['Priorytet: debuffy i utility'],buffs:['Major Arcana · debuff setup','Dark Crystal · CP/HP spam'],tip:'Dobieraj set do roli: Major Arcana pod rzucanie debuffów, Dark Crystal pod spam CP/HP.'},
{name:'Hawkeye',short:'HK',group:'Archer',desc:'Stabilny ranged DPS z mocnym crit pressure.',gear:['Archer armor wg aktualnego setupu klanu'],weapon:['Draconic Bow Focus +8 · Passive Duel Might 10','Active Duel Might 10'],jewels:['TT set +5','AQ +5 jako mocny upgrade'],dyes:['+4 STR / -4 CON','+1 STR / -1 CON','+4 DEX / -4 CON'],skills:['Stunning Shot → Chance','Double Shot → Power','Snipe → Power','Vicious Stance → Power'],buffs:['PvP','Event bez Wind Walk'],tip:'Jeśli setup nie zawiera WW, pamiętaj o Greater Haste Potion. Przy augmentacji może wypaść Arcane Protection.'},
{name:'Treasure Hunter',short:'TH',group:'Dagger',desc:'Mobilny dagger z naciskiem na Backstab i burst.',gear:['Draconic Set +6'],weapon:['Angel Slayer Haste · Passive Shield 10','Angel Slayer Haste · Passive Magic Barrier 10','Angel Slayer Haste · Passive Duel Might 10'],jewels:['TT set +5'],dyes:['+4 DEX / -4 STR','+1 DEX / -1 STR','+4 CON / -4 STR'],skills:['Backstab → Power (warto celować w +12)','Deadly Blow → Power','Vicious Stance → Power'],buffs:['PvP','Event / Mage'],tip:'Backstab enchantuj w Power. W materiale klanowym +12 jest wskazane jako ważny cel.'},
{name:'Bishop',short:'BP',group:'Support',desc:'Heal, mana pressure i defensywne warianty pod enemy setup.',gear:['Dark Crystal Robe +6','Blue Wolf Light +6','Tallum Robe +6'],weapon:['Passive Shield 10','Passive Magic Barrier 10','Passive Clarity 10','Active Shield 10','Active Magic Barrier 10','Active Clarity 10'],jewels:['TT set +5'],dyes:['+4 WIT / -4 MEN','+4 CON / -5 STR','+4 DEX / -5 STR'],skills:['Major Group Heal → Cost','Major Heal → Cost','Battle Heal → Cost','Mana Burn → Power','Mana Storm → Power','Magical Backfire → Chance'],buffs:['HP + P.Def','M.Def','Mana Burn','vs Fighters','vs Mage'],tip:'Bishop powinien mieć kilka presetów i zmieniać je zależnie od tego, czy głównym zagrożeniem jest physical pressure, magic damage czy mana fight.'},
{name:'Warlord',short:'WL',group:'Fighter',desc:'AOE stun frontliner pod mass PvP.',gear:['Imperial Crusader +3','Majestic Heavy +3'],weapon:['Saint Spear +3 Haste/Health lub A-grade z odpowiednim SA','Passive Shield / Magic Barrier','Active Refresh / Magic Barrier / Shield'],jewels:['Full TT +5','Frintezza mile widziana pod cooldown stuna'],dyes:['Offensive: +5 DEX / -5 STR +4 CON / -4 STR','Tankier: +5 CON / -5 STR +4 DEX / -4 STR'],skills:['Thrill Fight sytuacyjnie','Lionheart vs WL/OL','Thunder Storm na uciekających','Braveheart +1000 CP','Revival na niskim HP','Battle Force pod Symbol of Noise'],buffs:['Mass PvP','EXP'],tip:'Biegnij przed callerem, po komendzie wchodź w skupisko przeciwnika i próbuj przerwać spellforce stunem. Największa wartość WL to kontrola dużej grupy.'},
{name:'Duelist',short:'Glad',group:'Fighter',desc:'Mocny melee/AOE setup pod daily i mass PvP.',gear:['Tallum Heavy +6'],weapon:['Tallum Blade + Dark Legion’s Edge +4','Passive Duel Might'],jewels:['TT / epiki zależnie od dostępności'],dyes:['Daily PvP: +5 STR / +4 DEX / -9 CON','Mass PvP: +5 STR / +4 CON / -9 DEX'],skills:['Self: Duelist Spirit','War Cry','Augmentation','Sonic Move','Sonic Barrier'],buffs:['Daily PvP bez Berserker Spirit','Mass PvP z Berserker Spirit'],tip:'Active augment hierarchy: Skill Refresh / Refresh → Duel Might → Magic Barrier → Shield → Might. Przy większej liczbie archers/glads/daggers Shield może zastąpić Elemental Protection.'}
];

const hotSprings=[
{name:'Rheumatism',for:'Warrior · Spoil · Archer',levels:['Critical +3%','Critical +5%, P.Def -4%','Critical +8%, P.Def -4%','Critical +10%, P.Def -4%','Critical +5%, P.Def -8%']},
{name:'Flu',for:'Warrior · Spoil · Archer',levels:['Atk. Speed +4%','Atk. Speed +8%, P.Atk -4%','Atk. Speed +12%, P.Atk -4%','Atk. Speed +16%, P.Atk -4%','Atk. Speed +8%, P.Atk -8%']},
{name:'Cholera',for:'Warrior · Spoil · Archer',levels:['Accuracy +3','Accuracy +6, Evasion -3','Accuracy +8, Evasion -3','Accuracy +10, Evasion -3','Accuracy +6, Evasion -5']},
{name:'Malaria',for:'Mage · OL · Cardinal',levels:['Casting Speed +4%','Casting Speed +8%, MP Cost -4%','Casting Speed +12%, MP Cost -4%','Casting Speed +16%, MP Cost -4%','Casting Speed +8%, MP Cost -8%']}
];

// Buffy: nie zgadujemy nazw ani kolejności ikon. Presety poniżej odpowiadają dokładnie
// wariantom widocznym w materiałach źródłowych z Discorda. Numery pokazują pozycję slotu 1→24.
const presetData={
'Mage':{title:'Mage · preset bazowy',source:'Discord 20.01.2025',slots:24,note:'Kolejność 1→24 jest kluczowa przy overbuffie. Najmniej istotne buffy mają wypadać jako pierwsze.'},
'Dagger':{title:'Dagger · preset bazowy',source:'Discord 20.01.2025',slots:24,note:'Układ dla daggerów z zachowaniem dokładnej kolejności slotów ze screena.'},
'Archer':{title:'Archer · preset bazowy',source:'Discord 20.01.2025',slots:24,note:'Układ dla łuczników; kolejność zachowana jako osobny preset.'},
'Titan':{title:'Titan · PvP / farm',source:'Discord 05.02.2025',slots:23,note:'Na screenie zaznaczono, że przy 23 slotach jako pierwsze spadają mniej istotne pozycje.'},
'BP Fighters':{title:'Bishop vs Fighters',source:'Discord 05.02.2025',slots:24,note:'Preset pod daggery, archery, destro i inne klasy fizyczne.'},
'BP Mage':{title:'Bishop vs Mage',source:'Discord 05.02.2025',slots:24,note:'Osobny defensywny preset Bishopa przeciw klasom magicznym.'},
'Mage/Necro Siege':{title:'Mage / Necro · Siege / Epic',source:'Discord 30.03.2025',slots:24,note:'Na najbliższy siege: SPS zamiast Magnusa ma brać POW. Bless the Body i Wind Walk ustawione na początku pod overbuff.'},
'Cardinal Siege':{title:'Cardinal · Siege / Epic',source:'Discord 30.03.2025',slots:24,note:'Bless the Body i Wind Walk mają być na pierwszych miejscach w razie overbuffa.'},
'WL EXP':{title:'Warlord · EXP',source:'Discord 21.04.2025',slots:24,note:'Preset EXP dla Warlorda zgodnie ze screenem.'},
'SPS Epic':{title:'SPS · Epic Boss vs Mage PT',source:'Discord 01.05.2025',slots:24,note:'Dedykowany preset SPS na Epic Boss przy walce przeciw PT magów.'},
'Glad Daily':{title:'Duelist · Daily PvP',source:'Discord 29.08.2026',slots:24,note:'Daily PvP bez Berserker Spirit. Self buffy: Duelist Spirit / War Cry / Augmentation / Sonic Move / Sonic Barrier.'},
'Glad Mass':{title:'Duelist · Mass PvP',source:'Discord 29.08.2026',slots:24,note:'Mass PvP z Berserker Spirit. Elemental Protection można zamieniać zależnie od enemy setupu.'}
};

const filter=document.querySelector('#classFilter');
const grid=document.querySelector('#classGrid');
const groups=['Wszystkie','Mage','Dagger','Archer','Fighter','Support'];
let active='Wszystkie';
function renderFilters(){filter.innerHTML=groups.map(g=>`<button class="${g===active?'active':''}" data-group="${g}">${g}</button>`).join('');}
function renderClasses(){const list=active==='Wszystkie'?classes:classes.filter(c=>c.group===active);grid.innerHTML=list.map(c=>`<article class="class-card" data-class="${c.short}"><span class="class-type">${c.group}</span><h3>${c.name}</h3><p>${c.desc}</p><div class="class-tags"><span>${c.short}</span><span>OB Build</span><span>PvP</span></div></article>`).join('');}
filter.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active=b.dataset.group;renderFilters();renderClasses();});
grid.addEventListener('click',e=>{const card=e.target.closest('[data-class]');if(!card)return;openClass(card.dataset.class);});

const modal=document.querySelector('#classModal');
const detail=document.querySelector('#classDetail');
function list(title,items,full=false){return `<section class="detail-box ${full?'full':''}"><h3>${title}</h3><ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul></section>`;}
function openClass(short){const c=classes.find(x=>x.short===short);if(!c)return;detail.innerHTML=`<div class="detail-head"><span>${c.group.toUpperCase()} · OB RECOMMENDED BUILD</span><h2>${c.name} <small>(${c.short})</small></h2><p>${c.desc}</p><div class="class-tags"><span>Eternal x10</span><span>PvP focused</span><span>Clan tested</span></div></div><div class="detail-grid">${list('Armor',c.gear)}${list('Weapon / Augments',c.weapon)}${list('Jewellery',c.jewels)}${list('Dyes',c.dyes)}${list('Skills / Enchant',c.skills,true)}${list('Buff presets',c.buffs,true)}<section class="detail-box full"><h3>Clan Tip</h3><div class="tip-box">${c.tip}</div></section></div>`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
modal.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal();});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

const presetWrap=document.querySelector('#buffPresets');
let presetActive='Mage';
function renderPreset(){const p=presetData[presetActive];const slotHtml=Array.from({length:p.slots},(_,i)=>`<span class="buff-pill" title="Slot ${i+1} · kolejność wg screena źródłowego">${i+1}</span>`).join('');presetWrap.innerHTML=`<h3>Presety ze screenów</h3><div class="preset-tabs">${Object.keys(presetData).map(k=>`<button class="${k===presetActive?'active':''}" data-preset="${k}">${k}</button>`).join('')}</div><div class="preset-card"><h4>${p.title}</h4><p><b>${p.source}</b> · ${p.note}</p><div class="buff-row" aria-label="Kolejność slotów 1 do ${p.slots}">${slotHtml}</div><p style="margin-top:12px;color:#d7b56d"><b>Źródło nadrzędne:</b> screen z Discorda. Nazw buffów nie zgadujemy — kolejnym krokiem jest podpięcie dokładnych ikon 1:1.</p></div>`;}
presetWrap.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;presetActive=b.dataset.preset;renderPreset();});

document.querySelector('#hotSpringsGrid').innerHTML=hotSprings.map(m=>`<article class="mechanic-card panel"><span class="for">${m.for}</span><h3>Hot Springs ${m.name}</h3><div class="level-list">${m.levels.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div></article>`).join('');

renderFilters();renderClasses();renderPreset();

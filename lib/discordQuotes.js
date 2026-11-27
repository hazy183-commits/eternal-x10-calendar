const leads = [
  "Jak zrobi się ciasno, trzymaj się swoich.",
  "Dobry plan zaczyna się od tego, że wszyscy go słyszeli.",
  "Jeśli wyjdzie za pierwszym razem, mówimy, że tak miało być.",
  "Na zbiórce liczymy postacie, nie deklaracje.",
  "Szansa na sukces rośnie, kiedy nie musimy cię budzić na Discordzie.",
  "Dawaj, zróbmy coś, o czym jutro będzie co opowiadać.",
  "Wpadnij choćby na chwilę. Tak mówią wszyscy, którzy schodzą ostatni.",
  "Jeśli plan A padnie, spokojnie. Alfabet jest długi.",
  "Zawsze ktoś pyta, czy zdąży. Bądź tym, który już jest.",
  "Czasem jedna dobra decyzja robi więcej niż cały ekwipunek.",
  "W tej ekipie nikt nie musi robić wszystkiego. Wystarczy, że zrobi swoje.",
  "Zagraj do końca. Najlepsze akcje nie zawsze dobrze się zaczynają.",
  "Rywal już sobie dopisał wygraną. Idźmy mu poprawić statystyki.",
  "Nie musimy wyglądać groźnie. Wystarczy, że będziemy skuteczni.",
  "Dobre akcje zaczynają się od tego, że ktoś wreszcie mówi: jedziemy.",
  "Sprawdź ekwipunek przed startem. Elegancka śmierć nadal jest śmiercią."
];
const themed = {
  "olympiad": [
    "Wchodzisz po punkty. Wychodzisz z opinią o balansie klas.",
    "Na arenie nie ma komu powiedzieć, że healer zaspał.",
    "Jak ci siądzie pierwszy stun, zachowaj spokój. Rywal też jest zdziwiony.",
    "Punkty same się nie zrobią. Za to wymówki robią się błyskawicznie."
  ],
  "zaken": [
    "Zaken ma statek. Duchy też liczą się do frekwencji.",
    "Kto zgubi się w porcie, dostaje na następną wyprawę mapę i opiekuna."
  ],
  "queen-ant": [
    "Jak ktoś powie „to tylko mrówka”, wchodzi pierwszy."
  ],
  "baium": [
    "Po tylu schodach wypada wrócić z wieży z czymś więcej niż zakwasami."
  ],
  "valakas": [
    "Kto nie ma resist fire, niech stanie obok tego, kto ma. Będzie raźniej."
  ],
  "siege": [
    "Brama nie pęknie od dyskusji na voice.",
    "Jak padnę pod bramą, podnieście mnie. Żona myśli, że jestem na zakupach."
  ],
  "pvp": [
    "Najpierw się bijemy. Potem ustalimy, czy to lag, czy dostaliśmy w mordę."
  ],
  "core": [
    "Core nie ma nóg, a i tak ktoś zapyta, gdzie uciekł."
  ],
  "orfen": [
    "Orfen ma sieć. Nam wystarczy, że wszyscy mamy internet."
  ],
  "antharas": [
    "Do jaskini wchodzimy razem. Wyjście po trupie liczy się jako teleport."
  ],
  "frintezza": [
    "Frintezza gra na organach. My wchodzimy bez biletów."
  ]
};
const endings = [
  "Na zbiórce liczymy postacie, nie deklaracje.",
  "Bądź na czas. Healer też chce czasem odpocząć.",
  "Weź buffy. Wymówki już są na miejscu.",
  "Tylko nie wbiegaj przed tankiem, do cholery.",
  "Nie zostawiamy swoich po pierwszym wipe.",
  "Jak zadziała, mówimy, że tak miało być.",
  "Kto będzie pierwszy, temu nikt nie powie, że się spóźnił.",
  "Jak coś jebnie, na voice zapadnie ta piękna cisza.",
  "Widzimy się na zbiórce. Resztę ogarniemy razem.",
  "Jedno dobre wejście potrafi odwrócić całą walkę.",
  "Wpadnij z ekipą. Po to jest klan.",
  "Daj znać na voice, zanim ruszysz."
];
const tags = [
  "Orły, do kompletu!",
  "Czekamy na swoich.",
  "Dziś gramy do końca.",
  "Trzymamy szyk.",
  "Zbierzmy pełny skład."
];
const arenaEndings = [
  "Pilnuj dystansu.",
  "Pokaż, co umiesz bez pomocy party.",
  "Zagraj pierwszą rundę na spokojnie.",
  "Nie oddawaj tempa za darmo.",
  "Trzymaj nerwy na wodzy.",
  "Zostaw wymówki przed wejściem.",
  "Poczekaj na dobry moment.",
  "Daj rywalowi chwilę na popełnienie błędu.",
  "Każdy punkt się liczy.",
  "Zagraj po swojemu.",
  "Mądrzejszy ruch wygrywa z głośniejszym krzykiem.",
  "Wejdź po wygraną."
];
const arenaTags = ['Pora na pojedynek.', 'Zaufaj swojemu planowi.', 'Graj do ostatniej sekundy.', 'Arena czeka.', 'Zrób swoje.'];

export function discordQuote(index, category) {
  const slot = index % (leads.length * endings.length * tags.length);
  const lead = slot % leads.length;
  const round = Math.floor(slot / leads.length);
  const olympiad = category === 'olympiad';
  const closing = olympiad ? arenaEndings : endings;
  const signoff = olympiad ? arenaTags : tags;
  const headline = (Object.hasOwn(themed, category) ? themed[category][lead] : undefined) ?? leads[lead];
  return [headline, closing[(round + lead) % closing.length] + ' ' + signoff[Math.floor(round / closing.length)]];

}

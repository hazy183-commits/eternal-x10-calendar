const leads = [
  "Jak ktoś powie „to tylko mrówka”, wchodzi pierwszy.",
  "Zaken ma statek. My mamy ludzi. Duchy też liczą się do frekwencji.",
  "Po tylu schodach wypada wrócić z wieży z czymś więcej niż zakwasami.",
  "Kto nie ma resist fire, niech stanie obok tego, kto ma. Będzie raźniej.",
  "Jak padnę pod bramą, podnieście mnie. Żona myśli, że jestem na zakupach.",
  "Najpierw się bijemy. Potem ustalimy, czy to lag, czy dostaliśmy w mordę.",
  "Wchodzisz po punkty. Wychodzisz z opinią o balansie klas.",
  "Jak zrobi się ciasno, trzymaj się swoich. Po to wchodzimy razem.",
  "Core nie ma nóg, a i tak ktoś zapyta, gdzie uciekł.",
  "Orfen ma sieć. Nam wystarczy, że wszyscy mają internet.",
  "Do jaskini wchodzimy razem. Wyjście po trupie liczy się jako teleport.",
  "Frintezza gra na organach. My wchodzimy bez biletów.",
  "Kto krzyczy „mam go”, niech dla odmiany faktycznie go ma.",
  "Brama nie pęknie od dyskusji na voice.",
  "Wpadnij choćby na chwilę. Tak mówią wszyscy, którzy schodzą ostatni.",
  "W tej ekipie nikt nie musi robić wszystkiego. Wystarczy, że zrobi swoje."
];
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
export function quoteTrial(index) {
  const slot = index % (leads.length * endings.length * tags.length);
  const lead = slot % leads.length;
  const round = Math.floor(slot / leads.length);
  return [leads[lead], endings[(round + lead) % endings.length] + ' ' + tags[Math.floor(round / endings.length)]];
}

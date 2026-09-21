# Kreator profilu Orła Białego

Kreator jest częścią „Strefa klanu → Mój profil”. Każdy aktywny członek zapisuje własny wygląd. Ten sam zestaw pojawia się w podglądzie profilu otwieranym z listy członków. Wykorzystuje dotychczasową miniaturę gracza i prawdziwy herb klanu.

## Możliwości

- 8 teł, 6 ramek i 6 graficznych ozdób oraz możliwość wyłączenia ozdoby.
- 10 odznak; gracz wybiera maksymalnie 3. Są kosmetyczne, nie nadają rang ani osiągnięć.
- 6 kolorów, 4 efekty i regulacja intensywności.
- Podgląd na żywo, losowanie, cofnięcie niezapisanych zmian i ustawienia domyślne.
- Zapis na koncie, obsługa błędów bez utraty edycji, ochrona przed przeniesieniem zmian na inne konto.
- Układ na komputer, tablet i telefon, nawigacja klawiaturą i respektowanie ograniczonego ruchu.

## Stan przygotowania

Przygotowano na gałęzi `feat/profile-studio`, na bazie `41324b7` z `origin/main`.
Interfejs nie został opublikowany na stronie produkcyjnej.
Tabela `public.member_profile_appearance` i polityki dostępu zostały dodane do istniejącej bazy `eternal-x10-calendar`. Migracja została zastosowana pod wersją `20260921051034`. Nie uruchamiać jej drugi raz na tej bazie. Nie zmieniono danych kont ani profili graczy.

## Podgląd

Uruchom projekt standardowo i otwórz `/profile-studio.html`.
To jawnie oznaczony podgląd bez logowania: zapisuje wyłącznie swój demonstracyjny zestaw w tej przeglądarce. Nie edytuje kont. W sekcji „Mój profil” używana jest ta sama implementacja kreatora z prawdziwym zapisem do Supabase.

## Weryfikacja

- Budowanie Vite: poprawne; ostrzeżenia o istniejących mieszanych importach pozostają.
- Testy wyglądu, miniatur i widoku profilu: poprawne.
- Pełny zestaw: 133/134. Istniejący, niezmieniony test `admin/approved: restricted views` oczekuje dostępu do edytora treści wyłącznie dla ownera, podczas gdy aktualny kod produkcyjny dopuszcza ownera i admina. Kreator nie zmienia uprawnień ani tego testu.
- Przeglądarka: przełączanie ozdób, tła, ramki, koloru i efektu; limit 3 odznak; usuwanie i zastępowanie; losowanie; cofanie; reset; zapis podglądu i odtworzenie po odświeżeniu.
- Test kontrolowanego klienta kont w przeglądarce: zapis/ponowny odczyt, błąd zapisu i ponowienie, ponowne zdarzenie logowania bez utraty edycji, zmiana konta podczas zapisu, wylogowanie.
- Testy na prawdziwej bazie w transakcji zakończonej ROLLBACK: własny zapis i odczyt; podgląd dla aktywnych członków; odrzucenie obcych zapisów, przenoszenia właściciela, złych opcji i dostępu kont zablokowanych/usuniętych oraz anonimowych. Dane testowe nie pozostały w bazie.
- 390 px i 768 px: bez poziomego przepełnienia; grafiki wczytane. Podgląd oraz główna strona logowania bez błędów JavaScript.
- Pełnego logowania prawdziwym kontem w lokalnej przeglądarce nie wykonywano. Zapis klienta sprawdzono kontrolowanym klientem testowym, a uprawnienia i odczyt/zapis oddzielnie w rzeczywistej bazie.
- Audyt Supabase nie zgłosił uwag dla nowej tabeli. W bazie pozostają niezależne, wcześniejsze uwagi dotyczące funkcji wyników ankiet, logów Discorda i ochrony haseł; nie zmieniano ich w tym zadaniu.

## Grafiki

Nowe arkusze `public/images/profile-studio/ornaments.webp` i `badges.webp` powstały w wbudowanym ImageGen. Są używane jako atlasy z pozycjonowaniem i maską CSS. Awatar jest osobną warstwą, a ramka pozostaje niezależna od ozdoby. Grafiki skompresowano do WebP, łącznie około 1 MB. Herb i tła pochodzą z istniejącego projektu.

Prompty końcowe: arkusz 3×2 — smocze skrzydła, korona ognia, rogi z czaszkami, lodowe kryształy, ametystowy krąg, miecze z laurem; arkusz 4×2 — miecze PvP, tarcza oblężeń, smocza czaszka, trofeum Olimpiady, laska wsparcia, klepsydra weterana, polski orzeł, kryształ. Styl metalowych ozdób fantasy inspirowany Interlude, bez tekstu i bez portretów, jednakowe komórki do nakładania na miniaturę gracza. Próba wygenerowania kanału alpha nie dała przezroczystości; interfejs świadomie używa masek CSS zamiast deklarować przezroczyste pliki.

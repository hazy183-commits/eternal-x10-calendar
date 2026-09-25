# Prywatne testy i ręczna publikacja

## Stan przygotowania

Panel, serwer publikacji i ochrona podglądu są przygotowane. Token ograniczony do projektu (90 dni, utworzony za zgodą właściciela) oraz identyfikatory zapisano w Vercel dla Production i Preview. Migracja 20260925053627 dodaje katalog sprawdzonych wersji z odczytem tylko dla ownera. Nowe wdrożenie przygotowujemy na osobnej gałęzi; publikacja nadal wymaga decyzji właściciela.

## Obsługa

Właściciel otwiera Panel administratora → Start → Zmiany i publikacja. Widzi obecną wersję i przygotowane kandydatury. Otwiera prywatny podgląd, testuje, zaznacza potwierdzenie i wybiera „Udostępnij wszystkim”. Dialog potwierdza publiczny skutek. Przyjęcie zlecenia nie jest ogłaszane jako zakończona publikacja; „Odśwież stan” sprawdza rzeczywistą wersję publiczną.

Wygenerowane domeny wdrożeń wymagają osobnego logowania aktywnego właściciela. Ochrona obejmuje HTML, zasoby i API, sprawdzając sesję oraz rolę po stronie serwera. Cookie jest Secure, HttpOnly i SameSite=Strict, wygasa najpóźniej po godzinie. Logowanie do samej aplikacji może być wymagane osobno. „Zamknij dostęp do podglądu” usuwa cookie ochrony. Domeny orzelbialy.eu i www.orzelbialy.eu obsługują publicznie zatwierdzoną wersję.

## Konfiguracja hostingu — bez wpisywania sekretów do repozytorium

Na Vercel, dla Production oraz Preview:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: istniejące publiczne dane projektu do logowania. Serwer nie wymaga service_role.
- `RELEASE_VERCEL_TOKEN`: sekretny token z uprawnieniami wyłącznie właściwego zespołu/projektu, z ograniczonym terminem ważności. Nigdy nie przesyłać go w rozmowie ani nie używać prefiksu VITE_.
- `RELEASE_PROJECT_ID`: `prj_vL0aKwhSKDTRalEcWJUSYp88QLQJ`.
- `RELEASE_TEAM_ID`: `team_5opFq7afQcNWBXMIE8GnUF7H`.
- `RELEASE_CANDIDATES_JSON`: opcjonalny awaryjny katalog / izolowane testy. Nie ustawiamy go w normalnym wdrożeniu. Aktywny katalog jest w `public.owner_release_candidates`: `id`, `title`, `notes`, `action`, `tests_passed`, `enabled`. `action=rollback` tylko dla poprzedniej produkcyjnej wersji zgodnej z aktualną bazą.

Zmiana zmiennych Vercel wymaga nowego wdrożenia; nie aktualizuje istniejących. Dodanie kandydatury do katalogu bazy działa od razu, bez przebudowy strony. Utrzymujący stronę rejestruje dokładne ID po testach; konto owner ma odczyt katalogu, ale nie może samodzielnie dopisać dowolnego wdrożenia przez API bazy. Panel działa także we właściwie skonfigurowanej prywatnej wersji, więc pierwsza publikacja nie wymaga drugiego wdrożenia kontrolnego.

## Pierwsze uruchomienie

1. Utworzyć osobną gałąź preview, skonfigurować zmienne i wdrożyć bez promowania. Nie pushować do main.
2. Sprawdzić w hostingu, że middleware jest wdrożone i obejmuje wszystkie ścieżki. Odczyt bez cookie HTML/JS/obrazów/API ma być zablokowany. Zweryfikować brak obejścia przez nagłówki middleware i warianty ścieżek. Sprawdzić zalogowanie członka i administratora: odmowa; aktywnego ownera: dostęp. Nie polegać wyłącznie na testach jednostkowych.
3. Sprawdzić sesję wygasłą/usunięte uprawnienia, wylogowanie podglądu, panel desktop/mobile i wygaśnięcie API; nie przesyłać hasła przez query string.
4. Zarejestrować ID sprawdzonej wersji w katalogu bazy. Właściciel może z jej prywatnego panelu wykonać pierwszą publikację po testach. Kolejne kandydatury pojawią się również w publicznym panelu ownera po odświeżeniu stanu.
5. Po kliknięciu właściciela potwierdzić alias domeny produkcyjnej, API oraz rolę ownera. Nigdy nie zakładać, że HTTP 202 oznacza zakończenie operacji.

## Granice wersji pierwszej

- Publikacja dotyczy całego wdrożenia. Osobne przełączniki wybranych funkcji wymagają oddzielnego przygotowania tych funkcji.
- Prywatny podgląd nie tworzy kopii danych. Jeśli używa produkcyjnego Supabase, zmiany ankiet, kont i wydarzeń nadal zapisują się do prawdziwej bazy; pasek podglądu mówi o tym wprost. Testy zapisu wyłącznie na izolowanych danych, bez wysyłania powiadomień.
- Przywrócenie wdrożenia nie cofa migracji ani zapisów w bazie. Nie rejestrować niezgodnej wersji jako rollback.
- Kontrola `expectedCurrent` wykrywa nieaktualny panel. Vercel rozstrzyga kolidujące operacje (409); ta wersja nie dodaje globalnej blokady bazodanowej.
- Nie usunięto automatycznego deployu main w ustawieniach Vercel. Reguła pracy w AGENTS.md zakazuje pushowania/mergowania tam bez zgody właściciela. Dodatkowa blokada organizacyjna gałęzi wymaga osobnej konfiguracji GitHub.

## Weryfikacja

`node --test` sprawdza m.in. prawa ownera, błędy sesji, ochronę zasobów, prywatny cookie, listę dozwolonych wersji, projekt/status wdrożenia, nieaktualny panel i poprawny endpoint promocji. `node node_modules/vite/bin/vite.js build` sprawdza paczkę strony. Testy są bez mutacji rzeczywistego hostingu i bazy; nie zastępują pierwszego testu wdrożenia opisanego powyżej.

Dokumentacja: https://vercel.com/docs/deployments/promoting-a-deployment, https://vercel.com/docs/routing-middleware, https://supabase.com/docs/reference/javascript/auth-getuser. API promocji zweryfikowane w https://openapi.vercel.sh: POST /v10/projects/{projectId}/promote/{deploymentId}; rollback POST /v1/projects/{projectId}/rollback/{deploymentId}.

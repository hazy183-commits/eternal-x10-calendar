# Odczyt Supabase (Vite)

Konfiguracja znajduje się w ignorowanym przez Git pliku `.env.local`:
`VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY`.
Zmiana konfiguracji wymaga restartu Vite.

Klient anonimowy wykonuje SELECT na `public.events`; INSERT, UPDATE i DELETE
wykonuje panel administratora wyłącznie po aktywnym zalogowaniu przez Supabase
Auth. Nie loguje użytkowników w części publicznej.
Uprawnienia odczytu zależą od polityk RLS w Supabase; aplikacja ich nie zmienia.
Klucz publishable jest publiczny i trafia do aplikacji przeglądarkowej.
Nigdy nie zastępuj go kluczem secret/service_role.

Oczekiwane pola: id, name, type, event_date (YYYY-MM-DD), event_time
(HH:mm lub HH:mm:ss). Opcjonalne: location, description,
duration_minutes (minuty), boss (nazwa bossa).
Typy: RB, Epic RB, Siege, Olympiad, Event (wielkość liter dowolna).
Puste boss oznacza brak grafiki; brak pola boss zachowuje dopasowanie po nazwie.

Przy otwarciu strony aplikacja pobiera wydarzenia z Supabase. Pusty wynik,
błąd uprawnień, niepoprawne rekordy lub przekroczenie 5 sekund oznaczają pustą
listę zwykłych wydarzeń. localStorage nie jest źródłem wydarzeń.
Niezależne harmonogramy automatyczne nadal są wyliczane przez aplikację.

Panel administratora zapisuje pola formularza do istniejących kolumn:
`name`, `type`, `boss`, `event_date`, `event_time`, `duration_minutes`,
`location` i `description`. Nowe rekordy otrzymują `id` z bazy; edycja i
usuwanie używają istniejącego `id`. Po każdej operacji wykonywany jest nowy
SELECT i widok jest odświeżany z aktualnej odpowiedzi Supabase.

Rola `anon` potrzebuje wyłącznie polityki odczytu. Rola `authenticated` musi
mieć granty i polityki RLS dla INSERT/UPDATE/DELETE oraz sekwencji
identyfikatorów, jeśli `id` jest generowane automatycznie. Aplikacja nie
zmienia tych uprawnień. Wcześniejszy test potwierdził, że `anon` nie ma
uprawnień do zapisu (`42501`), więc testy CRUD wykonuj dopiero po konfiguracji
polityk dla zalogowanego administratora.

Logowanie korzysta z `supabase.auth.signInWithPassword`, a wylogowanie z
`supabase.auth.signOut`. Sesja jest utrzymywana przez klienta Supabase po
odświeżeniu strony (`persistSession` i `autoRefreshToken`). Hasło i adres
administratora nie są zapisane w kodzie ani w plikach projektu.

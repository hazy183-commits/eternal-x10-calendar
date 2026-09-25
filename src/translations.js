import { gameCopy } from './translationsGame.js';
// UI copy only. Player names, authored content and game item names are not translated.
const pairs = `
Strona główna|Home
Poradniki|Guides
Poradniki / Bossowie|Guides / Bosses
Craft kalkulator|Craft calculator
Panel administratora|Admin panel
Strefa klanu|Clan area
Pulpit|Dashboard
Planowanie|Planning
Klan|Clan
Narzędzia|Tools
Administracja|Administration
Wydarzenia|Events
Moje zapisy|My sign-ups
Ogłoszenia|Announcements
Ogłoszenia klanowe|Clan announcements
Ankiety|Polls
Mój profil|My profile
Członkowie|Members
Rekrutacja|Recruitment
Frekwencja|Attendance
Potrzebne RB|Needed raid bosses
Treści strony|Site content
Wyloguj|Log out
Wyloguj się|Log out
Zaloguj|Log in
Zaloguj się|Log in
Zarejestruj się|Register
Utwórz konto|Create account
Hasło|Password
Nick w grze / login|In-game nickname / login
Minimum 6 znaków|At least 6 characters
np. KiRY|e.g. KiRY
Zaloguj się, aby wejść na stronę klanu.|Log in to enter the clan website.
Zaloguj się kontem administratora Supabase, aby zarządzać wydarzeniami.|Log in with your administrator account to manage events.
Logowanie administratora|Administrator login
Dostęp chroniony|Protected access
Dostęp do strefy klanu|Clan area access
Dostęp do kalendarza, zapisów i informacji klanowych mają wyłącznie zatwierdzeni członkowie.|Only approved members can access the calendar, sign-ups and clan information.
Nieprawidłowy login lub hasło.|Incorrect login or password.
Ten nick jest już zajęty.|This nickname is already taken.
Nie udało się wykonać operacji.|The operation failed.
Panel członka klanu|Clan member panel
Witaj,|Welcome,
Dobrze, że jesteś z nami.|Glad to have you with us.
„Siła klanu tkwi w ludziach, nie w pixelach.”|“A clan's strength is in its people, not its pixels.”
„Więcej niż gra — to ludzie.”|“More than a game — it's the people.”
Więcej niż gra — to nasza społeczność|More than a game — it's our community
Wspólny kalendarz klanu|Shared clan calendar
Kalendarz klanu|Clan calendar
Kalendarz wydarzeń|Event calendar
Kalendarz|Calendar
Harmonogram|Schedule
Czas serwera|Server time
Najbliższe wydarzenie|Next event
Najbliższe wydarzenia|Upcoming events
Przygotuj się do bitwy|Prepare for battle
Brak nadchodzących wydarzeń|No upcoming events
Brak nadchodzących wydarzeń.|No upcoming events.
Brak nadchodzących wydarzeń w kalendarzu.|No upcoming events in the calendar.
Dodaj wydarzenie w panelu administratora.|Add an event in the admin panel.
Lokalizacja|Location
Start wydarzenia|Event start
Do rozpoczęcia|Starts in
Do zakończenia|Ends in
dni|days
godz.|hrs
sek.|sec
Wróć do dzisiaj|Back to today
Przewiń dni w lewo|Scroll days left
Przewiń dni w prawo|Scroll days right
Wybierz dzień|Select a day
Główna nawigacja|Main navigation
Zamknij|Close
Otwórz|Open
Zamknij profil gracza|Close player profile
Zamknij okno|Close window
Zamknij menu|Close menu
Otwórz menu|Open menu
Zobacz wszystkie →|View all →
Zobacz cały kalendarz →|View full calendar →
Twój udział|Your participation
Twoja obecność|Your attendance
Twoje deklaracje obecności.|Your attendance responses.
Twoje deklaracje wydarzeń znajdziesz w zakładce „Moje zapisy”.|Find your event responses in “My sign-ups”.
Wybierz Będę / Może / Nie będę.|Choose Going / Maybe / Not going.
Będę|Going
Będzie|Going
Może|Maybe
Nie będę|Not going
Nie będą|Not going
Tak|Yes
Nie|No
Zapisani|Signed up
Potwierdzeni|Confirmed
Brak zapisów.|No sign-ups.
Nie masz jeszcze deklaracji. Wejdź w „Wydarzenia” i wybierz Będę / Może / Nie będę.|No responses yet. Open “Events” and choose Going / Maybe / Not going.
Deklaracje są tymczasowo zapisywane lokalnie na tym urządzeniu.|Responses are temporarily stored on this device.
Informacje|Information
Witaj w Strefie Klanu|Welcome to the Clan Area
Najważniejsze informacje dla członków będą pojawiać się właśnie tutaj.|Important information for members will appear here.
Pamiętaj, aby być na Discordzie podczas wspólnych akcji i PvP.|Join Discord during clan activities and PvP.
To miejsce służy do przekazywania informacji i planowania wspólnych akcji.|Share information and plan clan activities here.
Discord klanu|Clan Discord
YouTube klanu|Clan YouTube
Strona serwera|Server website
Serwer|Server
Ranga|Rank
Aktywny|Active
Aktywne|Active
Aktywna|Active
Aktywnych|Active
Nieaktywna|Inactive
Zakończone|Ended
Zakończona|Ended
Zamknięte|Closed
Niedostępna|Unavailable
Nadchodzi|Upcoming
Trwa|In progress
Za chwilę|Starting soon
Okno zakończone|Window ended
W kolejce|Coming up
Rozmowy i powiadomienia|Chat and notifications
Akcje klanu|Clan action
Dołącz do Eternal|Join Eternal
Dołącz do Orła Białego|Join Orzeł Biały
Wszystko, czego potrzebujesz, aby pozostać w kontakcie z klanem.|Everything you need to stay in touch with the clan.
Kliknij PLAY — film zostanie tutaj|Click PLAY to watch here
Kliknij, aby przejść do YouTube|Click to open YouTube
Materiały z kanału chwilowo niedostępne|Channel videos temporarily unavailable
Losuję drugi film…|Choosing another video…
Losuję film z kanału…|Choosing a channel video…
Rekrutacja · Orzeł Biały|Recruitment · Orzeł Biały
Nie szukamy statystów. Szukamy ludzi, którzy chcą pisać z nami historię.|We want people who will make history with us.
Epic RB, siege i mass PvP to tylko pole bitwy. Prawdziwa siła zaczyna się wcześniej — w party, we wspólnych decyzjach i w tym, że wchodzimy razem i walczymy do końca. Nie interesuje nas idealny gear ani liczby w profilu. Liczy się charakter, aktywność i to, czy potrafisz grać dla ekipy. Orzeł Biały to nie kolejny tag nad głową. To ludzie, z którymi chce się wracać do gry.|Epic raids, sieges and mass PvP are only the battlefield. Real strength starts in the party, in shared decisions and in entering together and fighting to the end. We care about character, activity and teamwork more than perfect gear or profile numbers. Orzeł Biały is more than a tag above your head. It's the people who make you want to return to the game.
Stań z nami w jednym szeregu. Zostań częścią Orła Białego.|Stand with us. Become part of Orzeł Biały.
Napisz do nas ✦|Contact us ✦
Chcesz dołączyć do klanu? Napisz do nas|Want to join the clan? Contact us
Zostaw nick i kilka słów o sobie. Liderzy zobaczą wiadomość i odezwiemy się do Ciebie w grze lub przez podany kontakt.|Leave your nickname and tell us about yourself. Our leaders will contact you in-game or using your contact details.
Nick w grze *|In-game nickname *
Kontakt (opcjonalnie)|Contact details (optional)
Wiadomość *|Message *
Wyślij zgłoszenie|Send application
Dowództwo klanu|Clan leadership
Wiadomości od osób, które chcą dołączyć do klanu.|Messages from people who want to join the clan.
Brak zgłoszeń.|No applications.
Na razie nie ma żadnych zgłoszeń.|No applications yet.
Nowe|New
Skontaktowano|Contacted
Kontakt: przez nick w grze|Contact: in-game nickname
Podaj poprawny nick w grze (2–24 znaki).|Enter a valid in-game nickname (2–24 characters).
Napisz krótką wiadomość.|Write a short message.
Wiadomość została już niedawno wysłana. Spróbuj ponownie za chwilę.|You recently sent a message. Please try again shortly.
Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.|Could not send the message. Please try again shortly.
Zgłoszenie wysłane. Dzięki! Liderzy klanu zobaczą Twoją wiadomość.|Application sent. Thank you! The clan leaders will see your message.
Zarządzanie|Management
Centrum zarządzania|Management centre
Centrum dowodzenia · Orzeł Biały|Command centre · Orzeł Biały
Aktywna sekcja|Active section
Panel główny|Main panel
Podsumowanie|Overview
Szybkie zarządzanie|Quick management
Szybki dostęp do zarządzania wydarzeniami, bossami, siege, harmonogramem oraz członkami klanu.|Quick access to events, bosses, sieges, schedules and clan members.
Wybierz sekcję. Wszystkie zapisane zmiany są od razu widoczne dla klanu.|Choose a section. Saved changes are immediately visible to the clan.
Zarządzaj →|Manage →
Otwórz →|Open →
Epic Bossy|Epic bosses
Epic Bossów|Epic bosses
Monitoring bossów|Boss tracking
Okna i respawny|Windows and respawns
Kontroluj ręczne okna, respawny i najważniejsze bossy.|Manage manual windows, respawns and major bosses.
Terminy zamków|Castle dates
Harmonogram zamków|Castle schedule
Zarządzaj terminami siege dla wszystkich zamków.|Manage siege dates for all castles.
Stałe wydarzenia|Recurring events
Olympiad, Auto PvP i stałe terminy serwerowe.|Olympiad, Auto PvP and recurring server events.
Napisy, linki i ogłoszenia|Text, links and announcements
Treści i linki|Content and links
Treści i ogłoszenia|Content and announcements
Użytkownicy|Users
Użytkownicy i role|Users and roles
Akceptuj konta oraz zarządzaj dostępem członków klanu.|Approve accounts and manage clan member access.
Dostęp i role|Access and roles
Administrator|Administrator
Admini|Admins
Adminów|Admins
Administratorów|Administrators
Członek|Member
Członków|Members
Lider|Leader
Liderzy|Leaders
Liderów|Leaders
Właściciel|Owner
Oczekuje|Pending
Oczekujący|Pending
Zablokowanych|Blocked
Zablokuj|Block
Odblokuj|Unblock
Akceptuj|Approve
Nadaj Admina|Make admin
Odbierz Admina|Remove admin role
Usuń z klanu|Remove from clan
Twoje konto|Your account
Uprawnienia|Permissions
Domyślne prawa roli|Default role permissions
Zapisz prawa roli|Save role permissions
Zapisz dla użytkownika|Save for user
Poziom dostępu|Access level
Zarządzanie dostępem|Access management
Akceptuj nowych członków oraz nadaj rangę Członek, Lider lub Administrator.|Approve new members and assign Member, Leader or Administrator roles.
Brak użytkowników.|No users.
Brak pasujących osób.|No matching people.
Nie masz uprawnienia do zarządzania użytkownikami.|You do not have permission to manage users.
Członek został usunięty z klanu.|The member has been removed from the clan.
Zmiana zapisana.|Change saved.
Zmiana została zapisana.|Change saved.
Anuluj|Cancel
Anuluj edycję|Cancel editing
Zapisz|Save
Zapisz zmiany|Save changes
Zapisz ustawienia|Save settings
Zapisz i opublikuj|Save and publish
Edytuj|Edit
Edytuj →|Edit →
Usuń|Delete
Odśwież|Refresh
Spróbuj ponownie|Try again
Wybierz|Select
Szukaj|Search
Sortowanie|Sort order
Wszystkie|All
Rodzaj|Type
Typ|Type
Kategoria|Category
Brak|None
Gotowe|Done
Dodano|Added
Chwila…|One moment…
Ładowanie…|Loading…
Zapisywanie…|Saving…
Wysyłanie…|Sending…
Usuwanie…|Deleting…
Ładowanie wydarzeń…|Loading events…
Ładowanie użytkowników…|Loading users…
Ładowanie profilu…|Loading profile…
Ładowanie frekwencji…|Loading attendance…
Ładowanie ogłoszeń…|Loading announcements…
Ładowanie ankiet…|Loading polls…
Ładowanie statystyk…|Loading statistics…
Ładowanie szczegółów…|Loading details…
Ładowanie zgłoszeń…|Loading applications…
Nie udało się zapisać.|Could not save.
Zapisano.|Saved.
Ustawienia zapisane.|Settings saved.
Nie udało się pobrać profilu.|Could not load the profile.
Nie udało się pobrać członków.|Could not load members.
Nie udało się pobrać zgłoszeń.|Could not load applications.
Nie udało się przygotować podglądu.|Could not prepare the preview.
Dodaj wydarzenie|Add event
Nowe wydarzenie|New event
Edytuj wydarzenie|Edit event
Lista wydarzeń|Event list
Wydarzenie|Event
Wydarzenia klanowe|Clan events
Wydarzeń dziś|Today's events
Dodawaj i edytuj wydarzenia w Supabase. Zmiany są od razu widoczne na stronie.|Add and edit events. Changes appear on the website immediately.
Dodawaj, edytuj i porządkuj wydarzenia klanowe.|Add, edit and organise clan events.
Dodawaj, wyszukuj i edytuj wydarzenia klanowe.|Add, search and edit clan events.
Wyszukuj, filtruj i edytuj wydarzenia z jednego miejsca.|Search, filter and edit events in one place.
Nazwa lub boss|Name or boss
Szybki wybór|Quick selection
Tryb tworzenia|Creation mode
Pojedyncze|Single
Cykliczne|Recurring
Nazwa wydarzenia|Event name
Boss / grafika|Boss / artwork
Wybierz bossa, aby zobaczyć grafikę.|Select a boss to preview its artwork.
Data|Date
Godzina|Time
Godzina serwera|Server time
Godzina lokalna|Local time
Godzina PL|Polish time
Czas trwania (min)|Duration (min)
Czas (min)|Time (min)
Opis (opcjonalnie)|Description (optional)
Lokalizacja (opcjonalnie)|Location (optional)
Powtarzanie|Repeat
Częstotliwość|Frequency
Co ile dni|Every how many days
Generuj wydarzenia do|Generate events until
Terminy do utworzenia|Dates to create
Terminy wydarzeń|Event dates
Zapisz wydarzenie|Save event
Usuń wydarzenie|Delete event
To wydarzenie zostanie usunięte z kalendarza.|This event will be removed from the calendar.
Brak wydarzeń pasujących do filtrów.|No events match the filters.
Brak wydarzeń pasujących do wyszukiwania.|No events match your search.
Brak wydarzeń w tej kategorii.|No events in this category.
Dziś nie zaplanowano wydarzeń.|No events scheduled today.
Dzisiaj nie ma jeszcze zaplanowanych wydarzeń.|No events scheduled today yet.
Boss zabity|Boss killed
Podaj faktyczną datę i godzinę zabicia bossa.|Enter the actual date and time the boss was killed.
Podaj początek dokładnego 30-minutowego okna z gry.|Enter the start of the exact 30-minute in-game window.
Ustaw okno z gry|Set in-game window
Okno z gry|In-game window
Okno|Window
Ostatnie zabicie|Last kill
Bazowy respawn|Base respawn
Ustaw termin Siege|Set siege date
Ustaw termin|Set date
Zapisz termin|Save date
Ręczne okna z gry i stałe harmonogramy są obsługiwane niezależnie od zwykłych wydarzeń.|Manual in-game windows and recurring schedules are managed separately from regular events.
Przechowujemy jeden punkt referencyjny zamku, a kolejne miesiące wyliczamy automatycznie.|We store one reference date per castle and calculate subsequent months automatically.
Ankiety klanowe|Clan polls
Głosowanie klanu|Clan voting
Utwórz ankietę|Create poll
Zarządzaj ankietami|Manage polls
Usuń ankietę|Delete poll
Pytanie|Question
Koniec ankiety (opcjonalnie)|Poll end (optional)
Oddaj jeden głos w każdej aktywnej ankiecie.|Cast one vote in each active poll.
Twórz ankiety i zarządzaj głosowaniami członków.|Create polls and manage clan voting.
Brak aktywnych ankiet.|No active polls.
Nie ma jeszcze żadnych ankiet.|No polls yet.
Nie udało się pobrać ankiet.|Could not load polls.
Bez terminu końcowego|No end date
Wybierz jedną odpowiedź. Możesz ją zmienić, dopóki ankieta jest otwarta.|Choose one answer. You can change it while the poll is open.
Twój głos został zapisany.|Your vote has been saved.
Twój głos został zapisany. Aby zmienić głos, kliknij inną odpowiedź.|Your vote has been saved. Click another answer to change it.
Aby zmienić głos, kliknij inną odpowiedź.|Click another answer to change your vote.
Głos został zmieniony.|Your vote has been changed.
Ankieta została usunięta razem z głosami.|The poll and its votes have been deleted.
Ankieta została usunięta.|Poll deleted.
Usunąć tę ankietę razem z głosami?|Delete this poll and its votes?
Usunąć to ogłoszenie?|Delete this announcement?
Dodaj ogłoszenie|Add announcement
Nowe ogłoszenie|New announcement
Aktualne informacje od dowództwa klanu.|Latest information from the clan leadership.
Brak aktualnych ogłoszeń.|No current announcements.
Brak aktywnych ogłoszeń.|No active announcements.
Brak ogłoszeń. Utwórz pierwszy komunikat dla klanu.|No announcements. Create the first message for the clan.
Dodawaj, edytuj, przypinaj i usuwaj ogłoszenia.|Add, edit, pin and delete announcements.
Twórz komunikaty widoczne w Strefie Klanu.|Create messages visible in the Clan Area.
Tytuł|Title
Treść|Content
Przypnij na górze|Pin to top
Przypnij ogłoszenie na górze|Pin announcement to top
Przypnij|Pin
Odepnij|Unpin
Ukryj|Hide
Pokaż|Show
Ukryte|Hidden
Edycja strefy klanu|Edit clan area
Edytor strony|Site editor
Ustawienia strony|Site settings
Edytuj ustawienia|Edit settings
Edytuj stronę i ogłoszenia|Edit site and announcements
Zarządzanie treścią strony|Site content management
Zmieniasz tutaj teksty i linki. Po zapisaniu są od razu widoczne na stronie.|Edit text and links here. Saved changes appear on the site immediately.
Zmieniaj najważniejsze treści bez grzebania w kodzie.|Edit key content without changing code.
Zmieniaj nagłówki, opisy, linki oraz komunikaty bez edycji kodu.|Edit headings, descriptions, links and messages without changing code.
Nazwa klanu, serwer, tekst powitalny, motto i linki.|Clan name, server, welcome text, motto and links.
Nazwa klanu|Clan name
Nazwa serwera|Server name
Tekst powitalny|Welcome text
Motto / cytat|Motto / quote
Strona serwera URL|Server website URL
Przywróć zapisane|Restore saved
Połączone z Supabase|Connected to Supabase
Baza klanu|Clan database
Członkowie klanu|Clan members
Kliknij członka, aby zobaczyć jego subclassy, wyposażenie i setupy buffów.|Click a member to view their subclasses, equipment and buff setups.
Postać|Character
Klasa|Class
Główna klasa|Main class
Klasa główna|Main class
Klasa główna:|Main class:
Poziom|Level
Poziom:|Level:
Rola w party|Party role
Rola w party:|Party role:
Wybierz klasę|Select class
Nie podano|Not specified
Nie podano symboli|No symbols specified
Dowolna klasa|Any class
Profil nieuzupełniony|Profile incomplete
Brak danych postaci|No character details
Uzupełnij klasę i rolę. Dane będą widoczne przy zapisach na wydarzenia.|Fill in your class and role. These details will appear with your event sign-ups.
Zapisz profil|Save profile
Subclassa|Subclass
Subclassy i wyposażenie|Subclasses and equipment
Dodaj subclassę|Add subclass
Dodaj subclassy tej postaci. Każda ma osobny sprzęt oraz enchant.|Add subclasses for this character. Each has its own equipment and enchant levels.
Nie dodano jeszcze żadnej subclassy.|No subclasses added yet.
Broń|Weapon
Broń · A / S grade|Weapon · A / S grade
Set armoru · odsealowany|Armour set · unsealed
Biżuteria · 5 slotów|Jewellery · 5 slots
Komplet epików|Epic jewellery set
Komplet Tateossian · S grade|Tateossian set · S grade
Każdy element wybierzesz i enchantujesz oddzielnie. Komplet epików: Valakas, Antharas, Zaken, Baium i Queen Ant — możesz zmienić dowolny element.|Select and enchant each item separately. Epic set: Valakas, Antharas, Zaken, Baium and Queen Ant — each item can be changed.
Augmentacja|Augmentation
Augmentacje|Augmentations
Dodaj augmentację|Add augmentation
Usuń augmentację|Remove augmentation
Wybierz augmentację|Select augmentation
Bez augmentacji|No augmentation
Poziom augmentacji|Augmentation level
Szukaj efektu|Search effect
Brak pasujących augmentacji.|No matching augmentations.
Dodaj posiadane augmentacje dla tej klasy. Każda może mieć osobny efekt i poziom.|Add augmentations for this class. Each can have its own effect and level.
Moje setupy buffów|My buff setups
Utwórz setup buffów|Create buff setup
Nazwa setupu|Setup name
Symbole / Dyes|Symbols / Dyes
Wybierz maksymalnie trzy różne symbole z listy.|Choose up to three different symbols from the list.
— Brak symbolu —|— No symbol —
Zapisz setup|Save setup
Udostępnij innym|Share with others
Nie masz jeszcze własnego setupu buffów.|You have no buff setups yet.
Setupy społeczności|Community setups
Udostępnione przez innych graczy — możesz skopiować je do edytora.|Shared by other players — copy them to the editor.
Nikt jeszcze nie udostępnił setupu.|No shared setups yet.
Kopiuj do edytora|Copy to editor
Zwiń edytor buffów|Collapse buff editor
Rozwiń edytor buffów|Expand buff editor
Wybierz maksymalnie 24 buffy zajmujące slot. Malaria i Flu są zapisywane poza limitem. Udostępnione setupy są widoczne także w Twoim profilu klanowym.|Select up to 24 slot-based buffs. Malaria and Flu do not count towards the limit. Shared setups also appear in your clan profile.
Profil klanowy|Clan profile
Podgląd subclass, wyposażenia i setupów buffów|Subclass, equipment and buff setup preview
Dostępne setupy buffów|Available buff setups
Brak setupów buffów udostępnionych do podglądu.|No buff setups shared for viewing.
Brak zapisanych zestawów wyposażenia.|No saved equipment sets.
Ten profil nie jest już dostępny w klanie.|This profile is no longer available in the clan.
Miniatura profilu|Profile picture
Zmień miniaturę profilu →|Change profile picture →
Widoczna dla członków klanu. JPG, PNG lub WebP do 5 MB. Obraz przytniemy do kwadratu.|Visible to clan members. JPG, PNG or WebP up to 5 MB. The image will be cropped to a square.
Wybierz obraz|Choose image
Zapisz miniaturę|Save picture
Usuń miniaturę|Remove picture
Wygląd profilu|Profile appearance
Atelier klanowe / Orzeł Biały|Clan atelier / Orzeł Biały
Twój profil.|Your profile.
Twoja legenda.|Your legend.
Łącz ozdoby, barwy i symbole. Stwórz zestaw, który jest Twój.|Combine ornaments, colours and symbols. Create your own look.
Podgląd na żywo|Live preview
Tak zobaczą Cię członkowie klanu w podglądzie profilu.|This is how clan members will see your profile.
Twój zestaw|Your look
Losuj zestaw|Randomise look
Cofnij zmiany|Undo changes
Zapisz wygląd|Save appearance
Przywróć domyślne|Restore defaults
Tło|Background
Ramka|Frame
Ozdoba|Ornament
Odznaki|Badges
Kolor akcentu|Accent colour
Efekt ozdoby|Ornament effect
Intensywność efektu|Effect intensity
Animacje respektują ustawienie ograniczonego ruchu w Twoim urządzeniu.|Animations respect your device's reduced motion setting.
Małe symbole. Wielka historia.|Small symbols. A great story.
Wybierz swoje symbole z kolekcji odznak.|Choose your symbols from the badge collection.
Wybierz odznaki →|Choose badges →
Podgląd kreatora · zmiany w tej wersji są zapisywane tylko w tej przeglądarce.|Studio preview · changes in this version are saved only in this browser.
Twierdza Orła|Eagle's citadel
Noc oblężenia|Siege night
Polska dusza|Polish soul
Magia Interlude|Interlude magic
Biało-czerwoni|White and red
Bez tła|No background
Stal|Steel
Złoto|Gold
Biało-czerwona|White and red
Obsydian|Obsidian
Runiczna|Runic
Bez ramki|No frame
Skrzydła Orła|Eagle's wings
Barwy Polski|Polish colours
Herb Orła Białego|Orzeł Biały crest
Husarska chwała|Hussar glory
Obrońca Aden|Defender of Aden
Moc Soulshotów|Soulshot power
Smocze skrzydła|Dragon wings
Korona ognia|Crown of fire
Mroczne rogi|Dark horns
Lodowe kryształy|Ice crystals
Krąg magii|Circle of magic
Miecze bohatera|Hero's swords
Bez ozdoby|No ornament
Oblężenia|Sieges
Olimpiada|Olympiad
Wsparcie|Support
Weteran|Veteran
Polska|Poland
Kryształ|Crystal
Herb klanu|Clan crest
Flaga Polski|Polish flag
Złoty|Gold
Karmazyn|Crimson
Lodowy błękit|Ice blue
Ametyst|Amethyst
Szmaragd|Emerald
Srebro|Silver
Blask|Glow
Pulsująca aura|Pulsing aura
Iskry|Sparks
Rozwiń ▼|Expand ▼
Zwiń ▲|Collapse ▲
Rozwiń|Expand
Zwiń|Collapse
Dzisiaj w klanie|Today in the clan
Wspólne cele|Shared goals
Frekwencja wydarzeń|Event attendance
Podgląd deklaracji Będę / Może / Nie będę dla nadchodzących wydarzeń.|View Going / Maybe / Not going responses for upcoming events.
Łącznie deklaracji|Total responses
Twoich „Będę”|Your “Going” responses
Brak osób|No people
Chętni|Volunteers
Chętni:|Volunteers:
Na razie nikt się nie zgłosił.|No volunteers yet.
Potrzebne Raid Bossy|Needed raid bosses
Nowy cel|New target
Dodaj RB|Add RB
Dodaj lub zaktualizuj|Add or update
Zgłoś zwykłego RB 60+, którego chcesz zabić. Wybierz datę i godzinę rozpoczęcia. Okno RB trwa 30 minut i jest widoczne w kalendarzu pod filtrem RB.|Request a level 60+ raid boss. Select the start date and time. The 30-minute RB window appears under the RB filter in the calendar.
Wybierz Raid Bossa|Select raid boss
Data i godzina rozpoczęcia RB|Raid boss start date and time
Okno RB|RB window
Okno trwa 30 minut · czas Europe/Warsaw|30-minute window · Europe/Warsaw time
Koniec okna: 30 minut po rozpoczęciu. Czas polski.|Window ends 30 minutes after the start. Polish time.
Po co / uwagi|Purpose / notes
Zgłosił|Requested by
Osoby, które pomogą|Players offering help
Brak aktywnych zgłoszeń RB. Dodaj pierwszy cel.|No active RB requests. Add the first target.
Nie udało się wczytać tego zgłoszenia.|Could not load this request.
Oznacz jako zabity|Mark as killed
Oznaczyć tego Raid Bossa jako zabitego?|Mark this raid boss as killed?
Usunąć to zgłoszenie RB?|Delete this RB request?
Szczegóły Raid Bossa|Raid boss details
Statystyki i drop →|Stats and drops →
Statystyki Interlude|Interlude stats
Wybierz zakładkę, aby pobrać statystyki.|Select a tab to load stats.
Otwórz mapę spawnu|Open spawn map
Spawn tego Raid Bossa|This raid boss's spawn
Otwórz stronę Interlude z sekcją MAP i dokładną lokalizacją spawnu.|Open the Interlude page with its MAP section and exact spawn location.
Mapa ↗|Map ↗
Pełna baza Interlude ↗|Full Interlude database ↗
Wartości bazowe: Interlude|Base values: Interlude
Drop · szansa i ilość|Drops · chance and quantity
Szansa|Chance
Ilość|Quantity
Przedmiot|Item
Mechanika / info|Mechanics / info
Nagroda|Reward
Odwiedziny strony|Site visits
Odwiedziny strony · tylko dla Ciebie|Site visits · only visible to you
Odśwież licznik|Refresh counter
Dzisiaj|Today
Ostatnie 7 dni|Last 7 days
Od początku|All time
Nie udało się pobrać statystyk. Otwórz ponownie panel Start.|Could not load statistics. Reopen the Start panel.
Anonimowy licznik od wdrożenia. Odsłona = otwarcie lub odświeżenie strony. Nowa wizyta = nowa karta albo powrót po 30 minutach bez odsłony. To orientacyjny ruch, nie liczba osób. Bez zapisu nicków i adresów IP.|Anonymous counter since launch. Page view = opening or refreshing the page. New visit = a new tab or returning after 30 minutes without a page view. Approximate traffic, not a count of people. No nicknames or IP addresses are stored.
Powiadomienia Discord|Discord notifications
Discord powiadomienia|Discord notifications
Codzienny raport|Daily report
Codziennie o 08:00 · najbliższe 24 godziny|Daily at 08:00 · next 24 hours
Automatyczna kontrola co 5 minut · czas Europe/Warsaw|Automatic check every 5 minutes · Europe/Warsaw time
Włącz automatyczną wysyłkę|Enable automatic sending
Domyślnie ile minut wcześniej|Default minutes before event
Ustaw powiadomienia|Configure notifications
Podgląd wiadomości|Message preview
Przykładowa wiadomość|Example message
Podsumowanie nadchodzących eventów|Upcoming events overview
Wyślij test|Send test
Ustawienia dla konkretnych wydarzeń|Individual event settings
Możesz wyłączyć pojedyncze przypomnienie albo zmienić jego czas.|Disable an individual reminder or change its timing.
Webhook nie jest zapisywany w przeglądarce ani w publicznej tabeli.|The webhook is not stored in the browser or a public table.
Po jego podaniu zostanie umieszczony w zaszyfrowanym sejfie Supabase. Członkowie klanu nie mają do niego dostępu.|It will be stored in an encrypted vault. Clan members cannot access it.
Codzienny raport o 08:00 oraz przypomnienia o wydarzeniach i zgłoszeniach RB. Webhook jest przechowywany poza stroną.|Daily report at 08:00 and reminders for events and RB requests. The webhook is stored outside the website.
Wszystko do craftu w jednym miejscu|Everything for crafting in one place
Twój warsztat|Your workshop
Twój magazyn, wiele projektów i automatyczne liczenie braków.|Your inventory, multiple projects and automatically calculated shortages.
Osobisty planer|Personal planner
Moje craft projekty|My crafting projects
Zarządzaj swoim planem|Manage your plan
Sprawdź postęp, uzupełnij magazyn i od razu zobacz, czego jeszcze brakuje.|Check progress, update your inventory and see what you still need.
Ładowanie Twojego craft workspace…|Loading your crafting workspace…
Nie udało się wczytać planera.|Could not load the planner.
Nie udało się wczytać projektu|Could not load the project
Nie masz jeszcze projektu craftu|You have no crafting projects yet
Nie masz jeszcze projektu. Dodaj pierwszy cel w sekcji poniżej.|No projects yet. Add your first target below.
Dodaj broń lub armor w Craft Calculatorze, a tutaj pojawi się jego aktualny postęp.|Add a weapon or armour in the Craft Calculator to see its progress here.
Otwórz Craft Calculator|Open Craft Calculator
Otwórz zakładkę Craft, aby wczytać dane.|Open the Craft tab to load data.
Projekty|Projects
Dodaj projekt|Add project
Dodaj projekt craftu|Add crafting project
Mój projekt craftu|My crafting project
Priorytet|Priority
Niski priorytet|Low priority
Normalny priorytet|Normal priority
Wysoki priorytet|High priority
Każdy aktywny projekt automatycznie rezerwuje potrzebne materiały zgodnie z priorytetem.|Each active project automatically reserves the materials it needs, according to priority.
Wstrzymaj|Pause
Wznów|Resume
Zakończ|Complete
Postęp projektu|Project progress
Ukończenie projektu|Project completion
Zobacz projekt →|View project →
Usunąć ten projekt craftu?|Delete this crafting project?
Magazyn|Inventory
Plecak materiałów|Materials bag
Otwórz plecak ›|Open bag ›
Plecak jest pusty|The bag is empty
Dodaj pierwszy materiał w sekcji „Uzupełnij magazyn”.|Add your first material in “Update inventory”.
Uzupełnij magazyn|Update inventory
Wpisujesz realny stan. Projekty nie zmieniają go fizycznie — tylko pokazują, ile jest zarezerwowane.|Enter your actual stock. Projects do not change it — they only show reserved quantities.
Materiał|Material
Materiały craftowe|Crafting materials
Materiały do wykonania|Required materials
Stan materiałów|Material stock
Ile masz|Your quantity
W magazynie|In stock
Twój stan|Your stock
Mam / brakuje|Owned / missing
Potrzeba|Required
Brakuje|Missing
Pokryte|Covered
Zarezerwowane|Reserved
dostępne|available
Dostępne|Available
Nadwyżka|Surplus
Razem|Total
Kliknij ikonę, aby zmienić ilość.|Click the icon to change the quantity.
Kliknij materiał ze strzałką, aby zobaczyć jego składniki.|Click a material with an arrow to view its ingredients.
Główna recepta|Main recipe
Własna baza · Interlude|Our database · Interlude
Brak składników do pokazania.|No ingredients to display.
Pobieram zweryfikowane dane Interlude z naszej bazy…|Loading verified Interlude data from our database…
Brak zweryfikowanych wpisów.|No verified entries.
Ten materiał nie ma jeszcze zweryfikowanych wpisów w naszej bazie Interlude.|This material has no verified entries in our Interlude database yet.
Pokazuję wyłącznie rekordy oznaczone jako|Showing only records marked as
zweryfikowane dla Lineage 2 Interlude|verified for Lineage 2 Interlude
Źródła:|Sources:
Źródło nadrzędne:|Primary source:
Źródło ↗|Source ↗
Wszystkie lokacje|All locations
Import właścicieli ze screena|Import owners from screenshot
Wybierz screen|Choose screenshot
Wybierz screen listy zamków.|Select a screenshot of the castle list.
Rozpoznaj|Recognise
Dokładnie rozpoznaj screen|Scan screenshot precisely
Podgląd screena|Screenshot preview
(jeszcze nie odczytano)|(not read yet)
Pokaż wszystkie przebiegi OCR|Show all OCR passes
Zatwierdź i aktualizuj|Confirm and update
Zapisz zaznaczone|Save selected
Dodaj wiersz|Add row
Zamki|Castles
Właściciel: brak|Owner: none
OCR wpisuje tylko aktualny klan. Terminy i godziny pozostają bez zmian.|OCR updates only the current clan. Dates and times stay unchanged.
Przed zapisem zawsze sprawdź rozpoznane nazwy klanów. Puste pole oznacza brak właściciela.|Check recognised clan names before saving. An empty field means no owner.
Wrzuć screen z oknami respawnu. Godziny ze screena są traktowane jako czas serwera (UTC) i automatycznie przeliczane na czas polski.|Upload a screenshot of respawn windows. Screenshot times are treated as server time (UTC) and automatically converted to Polish time.
Importer wycina samą tabelę, wykonuje kilka przebiegów OCR i pokazuje już czas polski. Przykład: 04:34 serwera → 06:34 w Polsce (latem).|The importer crops the table, runs several OCR passes and shows Polish time. Example: 04:34 server time → 06:34 in Poland (summer).
Obsługiwane: Queen Ant, Core, Orfen, Zaken, Frintezza.|Supported: Queen Ant, Core, Orfen, Zaken, Frintezza.
Screen → okna Epic RB|Screenshot → Epic RB windows
Szybka aktualizacja|Quick update
Stały plan|Fixed schedule
Automatyczne|Automatic
Rejestracja|Registration
Rejestracja · Europe/Warsaw|Registration · Europe/Warsaw
Najbliższa rejestracja|Next registration
Najbliższy termin|Next date
Start zapisów · lokalnie|Registration opens · local
Start zapisów · serwer|Registration opens · server
Poniedziałek–piątek · Cykl tygodniowy|Monday–Friday · weekly cycle
Codziennie · Stały harmonogram UTC|Daily · fixed UTC schedule
Godziny harmonogramu oznaczają start zapisów. Rejestracja trwa 5 minut, a event kolejne 10 minut. Godziny lokalne: Europe/Warsaw.|Scheduled times indicate the start of registration. Registration lasts 5 minutes, followed by a 10-minute event. Local times: Europe/Warsaw.
Komenda rejestracji|Registration command
Status · odliczanie|Status · countdown
Odliczanie|Countdown
Dzień|Day
Gra|Game
Przeciwnik / cel|Opponent / target
Wskazówka|Tip
Zalogowany jako|Logged in as
Edycja|Editing
Inne|Other
Może edytować datę, godzinę i czas trwania istniejących wydarzeń.|Can edit the date, time and duration of existing events.
Możesz zmieniać wyłącznie datę, godzinę i czas trwania istniejących wydarzeń.|You can only change the date, time and duration of existing events.
Administrator · zarządzanie terminami|Administrator · schedule management
Miejsca na grafiki bossów|Boss artwork slots
Bez mnożnika dropu|Without a drop multiplier
Przeglądaj|Browse
Nazwa|Name
Opis|Description
Szczegóły|Details
Opcje|Options
Odpowiedzi|Answers
Usuń subclassę|Remove subclass
Pokaż wyniki|Show results
Zmień głos|Change vote
Głosuj|Vote
Brak wyników.|No results.
Pomogę|I'll help
Kliknij lokację, aby zobaczyć informacje|Click the location for details
Presety ze screenów|Presets from screenshots
Strefa klanu, wydarzenia i własne zapisy.|Clan area, events and your sign-ups.
Zgłoszenia członków z ustawionym oknem|Member requests with a scheduled window
Członek klanu|Clan member
wpisów|entries
wydarzeń|events
Dziś|Today
Później|Later
Szukaj po nicku...|Search by nickname...
Szukaj materiału w plecaku|Search bag materials
Brak / wybierz subclassę|None / select subclass
Brak aktywnej sesji. Zaloguj się ponownie.|No active session. Please log in again.
Brak osób oznaczonych jako „może”.|No “Maybe” responses.
Brak osób oznaczonych jako „nie będę”.|No “Not going” responses.
Brak połączenia z Supabase.|No database connection.
Brak uprawnień do aktualizacji Epic Bossów.|You do not have permission to update epic bosses.
Brak uprawnień do tworzenia ankiet.|You do not have permission to create polls.
Brak uprawnień.|Permission denied.
Brak wydarzenia do podglądu.|No event to preview.
Brak właściciela|No owner
Błąd:|Error:
Co tydzień|Weekly
Czas trwania musi być większy od 0 minut.|Duration must be greater than 0 minutes.
Data końcowa nie może być wcześniejsza niż pierwsza data wydarzenia.|The end date cannot be before the first event date.
Data zakończenia musi być późniejsza niż teraz.|The end date must be in the future.
Dodaj od 2 do 8 różnych odpowiedzi.|Add 2 to 8 different answers.
Dodatkowe informacje dla członków|Additional information for members
Dodawanie i edycja wydarzeń|Adding and editing events
Dokładne 30-minutowe okno respawnu z gry.|Exact 30-minute in-game respawn window.
Dostosuj wygląd|Customise appearance
Edycja ogłoszenia|Edit announcement
Edytor miniatury jeszcze się wczytuje. Spróbuj za chwilę.|The picture editor is still loading. Try again shortly.
Gdy wydarzenie zostanie zaplanowane, pojawi się tutaj z pełnym odliczaniem.|Once an event is scheduled, it will appear here with a countdown.
Główny tytuł|Main title
Hasło strony|Site tagline
Herb klanu Orzeł Biały|Orzeł Biały clan crest
Ile sztuk chcesz wykonać|How many do you want to craft
Ilość składnika recepty|Recipe ingredient quantity
Ilość sztuk|Quantity
Ilość wyniku recepty|Recipe output quantity
Jedna z dat lub godzin jest nieprawidłowa.|One of the dates or times is invalid.
Kategorie wyglądu|Appearance categories
Kolor i światło|Colour and light
Konto czeka na akceptację Ownera.|Your account is awaiting the owner's approval.
Konto nie ma dostępu do Strefy Klanu.|Your account does not have access to the Clan Area.
Konto nie ma jeszcze dostępu członka klanu.|Your account does not have clan member access yet.
Konto utworzone. Czeka na akceptację Ownera.|Account created. Awaiting the owner's approval.
Kontroluj terminy oblężeń wszystkich zamków.|Manage siege dates for all castles.
Kreator jest dostępny dla aktywnych członków klanu.|The studio is available to active clan members.
Liczba sztuk musi być dodatnią liczbą całkowitą.|Quantity must be a positive integer.
Logowanie nie zwróciło aktywnej sesji.|Login did not return an active session.
Masz już 3 odznaki. Usuń jedną, aby wybrać inną.|You already have 3 badges. Remove one to select another.
Materiały pokryte ✓|Materials covered ✓
Miesięczne oblężenie zamku.|Monthly castle siege.
Miniatura usunięta.|Profile picture removed.
Możesz wybrać maksymalnie 24 buffy zajmujące slot. Malaria i Flu są poza limitem.|Select up to 24 slot-based buffs. Malaria and Flu do not count towards the limit.
Możesz wybrać maksymalnie 3 symbole.|Select up to 3 symbols.
Możesz zmienić swoją odpowiedź w dowolnej chwili.|You can change your response at any time.
Musisz być zalogowany, aby korzystać z planera craftu.|Log in to use the crafting planner.
Musisz być zalogowany.|You must be logged in.
Nadaj postaci własny charakter.|Give your character a personal touch.
Najbliższe najpierw|Soonest first
Najważniejsze informacje i szybki dostęp do zarządzania.|Key information and quick access to management.
Napis nad tytułem|Text above the title
Napisz krótko kim grasz, czego szukasz i kiedy zwykle jesteś online.|Tell us what you play, what you are looking for and when you are usually online.
Następne wydarzenie|Next event
Nazwa projektu musi mieć od 1 do 80 znaków.|The project name must be 1–80 characters long.
Nie można odczytać tego obrazu. Wybierz inny plik.|Cannot read this image. Choose another file.
Nie udało się odczytać screena.|Could not read the screenshot.
Nie udało się otworzyć Strefy Klanu. Odśwież stronę i spróbuj ponownie.|Could not open the Clan Area. Refresh the page and try again.
Nie udało się otworzyć edytora ankiety. Odśwież strefę klanu i spróbuj ponownie.|Could not open the poll editor. Refresh the Clan Area and try again.
Nie udało się otworzyć screena.|Could not open the screenshot.
Nie udało się pewnie dopasować nazw i godzin. Dodaj wiersz ręcznie albo użyj ciaśniejszego screena z tabelą respawnów.|Could not reliably match names and times. Add a row manually or use a more tightly cropped screenshot.
Nie udało się pobrać profilu. Spróbuj ponownie.|Could not load the profile. Try again.
Nie udało się pobrać silnika OCR.|Could not load the OCR engine.
Nie udało się pobrać ustawień Discord.|Could not load Discord settings.
Nie udało się usunąć ankiety.|Could not delete the poll.
Nie udało się usunąć ankiety. Odśwież listę i spróbuj ponownie.|Could not delete the poll. Refresh the list and try again.
Nie udało się usunąć członka.|Could not remove the member.
Nie udało się usunąć zgłoszenia. Odśwież listę i spróbuj ponownie.|Could not delete the application. Refresh the list and try again.
Nie udało się usunąć zgłoszenia. Spróbuj ponownie.|Could not delete the application. Try again.
Nie udało się wczytać miniatury. Odśwież stronę.|Could not load the profile picture. Refresh the page.
Nie udało się wczytać wyglądu. Spróbuj ponownie.|Could not load the appearance. Try again.
Nie udało się zakończyć ankiety.|Could not close the poll.
Nie udało się zapisać głosu. Odśwież ankietę i spróbuj ponownie.|Could not save your vote. Refresh the poll and try again.
Nie udało się zapisać miniatury. Spróbuj ponownie.|Could not save the profile picture. Try again.
Nie udało się zapisać odpowiedzi.|Could not save your response.
Nie udało się zapisać odpowiedzi. Spróbuj ponownie.|Could not save your response. Try again.
Nie udało się zapisać profilu.|Could not save the profile.
Nie udało się zapisać ustawień.|Could not save settings.
Nie udało się zapisać wyglądu. Twoje zmiany pozostają w kreatorze — spróbuj ponownie.|Could not save the appearance. Your changes remain in the studio — try again.
Nie udało się zapisać wyposażenia. Spróbuj ponownie.|Could not save equipment. Try again.
Nie udało się zapisać. Twoje zmiany zostały w formularzu — spróbuj ponownie.|Could not save. Your changes remain in the form — try again.
Nie usunięto ankiety.|The poll was not deleted.
Nie zapisano głosu. Odśwież ankietę.|Your vote was not saved. Refresh the poll.
Nie znaleziono materiału w bazie craftu.|Material not found in the crafting database.
Nie znaleziono nazw. Dodaj wiersze ręcznie lub użyj ciaśniejszego screena.|No names found. Add rows manually or use a more tightly cropped screenshot.
Niepoprawny głos.|Invalid vote.
Nieprawidłowa odpowiedź.|Invalid response.
Nieprawidłowy priorytet projektu.|Invalid project priority.
Nieprawidłowy priorytet.|Invalid priority.
Nieprawidłowy status projektu.|Invalid project status.
Nikt jeszcze nie potwierdził obecności.|Nobody has confirmed attendance yet.
Np. Kto będzie na sobotnim PvP?|e.g. Who is coming to Saturday's PvP?
Ogłoszenie|Announcement
Obecny właściciel|Current owner
Obraz może mieć maksymalnie 5 MB.|The image must be no larger than 5 MB.
Odpowiedź zapisana.|Response saved.
Opis sekcji linków|Links section description
Otwórz Strefę Klanu|Open Clan Area
Pełny · Owner|Full · Owner
Pełny screen (kontrola)|Full screenshot (review)
Pełny screen — kontrola|Full screenshot — review
Pierścień 1|Ring 1
Pierścień 2|Ring 2
Pobieranie aktualnych treści…|Loading current content…
Pobieranie uprawnień…|Loading permissions…
Podaj godzinę z zegara serwera. Na stronie zostanie pokazana godzina polska (+2 h latem / +1 h zimą). Kolejne miesiące zostaną wyliczone automatycznie.|Enter the server clock time. The site will show Polish time (+2 h in summer / +1 h in winter). Subsequent months will be calculated automatically.
Podaj liczbę dni większą od 0.|Enter a number of days greater than 0.
Podaj nazwę setupu.|Enter a setup name.
Podaj nazwę wydarzenia.|Enter an event name.
Podaj nowy stan materiału:|Enter the new material stock:
Podaj prawidłową datę i godzinę początku okna.|Enter a valid window start date and time.
Podaj prawidłową datę i godzinę zabicia.|Enter a valid kill date and time.
Podgląd gotowy. Kliknij „Zapisz miniaturę”.|Preview ready. Click “Save picture”.
Podgląd niedostępny.|Preview unavailable.
Podgląd nowej miniatury|New picture preview
Podgląd profilu|Profile preview
Podtytuł|Subtitle
Pokaż listę zapisanych graczy|Show signed-up players
Postęp projektu craftu|Crafting project progress
Poziom musi być w zakresie 1–80.|Level must be between 1 and 80.
Profil nie został zapisany w bazie.|The profile was not saved to the database.
Profil zapisany. Nie udało się zaktualizować danych przy wcześniejszych zapisach.|Profile saved. Could not update details for earlier sign-ups.
Projekt nie rezerwuje materiałów.|This project does not reserve materials.
Projekt rezerwuje materiały z magazynu.|This project reserves inventory materials.
Proszę czekać…|Please wait…
Przeglądarka nie obsługuje zapisu miniatur.|Your browser does not support saving profile pictures.
Przejdź na Reborn|Open Reborn
Przełącz projekt craftu|Switch crafting project
Przy rejestracji użyj nicku: 2–24 znaki, litery/cyfry oraz _ lub -.|Choose a nickname with 2–24 characters: letters, numbers, _ or -.
Przycięta tabela|Cropped table
Przygotowuję obraz do dokładniejszego OCR…|Preparing the image for more accurate OCR…
Przygotowuję obraz…|Preparing image…
Przygotowuję podgląd…|Preparing preview…
Przygotowywanie podglądu…|Preparing preview…
Pytanie musi mieć co najmniej 3 znaki.|The question must be at least 3 characters long.
RB dodany z wybraną datą i godziną. Okno trwa 30 minut.|RB added at the selected date and time. The window lasts 30 minutes.
Rywalizujące klany|Competing clans
Stały plan serwera|Fixed server schedule
Screeny OCR i respawny bossów|Screenshot OCR and boss respawns
Screeny OCR i właściciele|Screenshot OCR and owners
Sekcja społeczności|Community section
Sesja administratora wygasła. Zaloguj się ponownie.|Your admin session has expired. Log in again.
Sesja się zmieniła. Zaloguj się ponownie.|Your session has changed. Log in again.
Sesja została zmieniona.|Your session has changed.
Silnik OCR nie uruchomił się.|The OCR engine failed to start.
Siła klanu tkwi w ludziach, nie w pixelach.|A clan's strength is in its people, not its pixels.
Sprawdzaj Olimpiadę i automatyczne wydarzenia PvP.|Check Olympiad and automatic PvP events.
Sprawdź datę, godzinę i czas trwania.|Check the date, time and duration.
Stan materiału musi być liczbą całkowitą równą 0 lub większą.|Material stock must be a whole number of 0 or more.
Stałe okno respawnu.|Fixed respawn window.
Supabase zwrócił wydarzenie w niezgodnym formacie.|The database returned an event in an incompatible format.
Supabase: nie udało się pobrać wydarzeń.|Database: could not load events.
Supabase: niezgodny format wydarzeń.|Database: incompatible event format.
Supabase: połączenie niedostępne.|Database: connection unavailable.
TRYB ADMINISTRATORA · możesz zmienić wyłącznie datę, godzinę i czas trwania istniejącego wydarzenia.|ADMIN MODE · you can only change the date, time and duration of an existing event.
Ta funkcja jest dostępna dla Ownera i Admina.|This feature is available to the owner and admins.
Ta sekcja jest dostępna wyłącznie dla właściciela strony.|This section is only available to the site owner.
Tabela — czarno-biała|Table — black and white
Tabela — odwrócony kontrast|Table — inverted contrast
Termin został zapisany.|Date saved.
To wydarzenie już się zakończyło.|This event has already ended.
Twój nick|Your nickname
Tytuł sekcji linków|Links section title
Tła|Backgrounds
Tło profilu|Profile background
Udostępniony|Shared
Uprawnienia zostały zapisane.|Permissions saved.
Ustaw rozpoczęcie 30-minutowego okna RB.|Set the start of the 30-minute RB window.
Ustawienia powiadomień|Notification settings
Usuń wiersz|Remove row
Uzupełnij bossa, datę, początek i koniec każdego zaznaczonego okna.|Fill in the boss, date, start and end of each selected window.
Uzupełnij wyposażenie|Complete equipment
Użytkownik|User
Użytkownik został zablokowany.|The user has been blocked.
Wyłączone|Disabled
Włączone|Enabled
Zakończony|Completed
Wszystkie dane są aktualne.|All data is up to date.
Wybierz 3 różne symbole — bez powtórzeń.|Choose 3 different symbols — no duplicates.
Wybierz aktualne lub przyszłe okno RB.|Select a current or future RB window.
Wybierz aktualną lub przyszłą datę i godzinę RB.|Select a current or future RB date and time.
Wybierz biżuterię pasującą do slotu.|Select jewellery that fits the slot.
Wybierz broń A lub S grade.|Select an A or S grade weapon.
Wybierz broń i set armoru.|Select a weapon and armour set.
Wybierz broń lub armor…|Select a weapon or armour…
Wybierz datę wydarzenia.|Select the event date.
Wybierz do 3 ozdobnych symboli. Nie zmieniają rangi ani osiągnięć.|Choose up to 3 decorative symbols. They do not change your rank or achievements.
Wybierz godzinę wydarzenia.|Select the event time.
Wybierz klasę.|Select a class.
Wybierz materiał…|Select material…
Wybierz ozdoby i zapisz swój zestaw.|Choose ornaments and save your look.
Wybierz pierwszą i końcową datę wydarzeń.|Select the first and last event dates.
Wybierz poprawną augmentację i jej poziom.|Select a valid augmentation and level.
Wybierz prawidłową datę początkową i końcową.|Select valid start and end dates.
Wybierz sposób powtarzania.|Select a recurrence pattern.
Wybierz symbole z listy dostępnych Dyes.|Select symbols from the available Dyes.
Wydarzenie usunięte w Supabase.|Event deleted.
Wydarzenie zapisane. Zmiany są już widoczne na stronie.|Event saved. Changes are now visible on the site.
Wygląd jest zapisany.|Appearance saved.
Wygląd zapisany na Twoim koncie.|Appearance saved to your account.
Wykończenie, które połączy cały zestaw.|A finishing touch to bring the look together.
Wyposażenie zapisane.|Equipment saved.
Wysyłam wiadomość testową…|Sending test message…
Wyższy priorytet wcześniej rezerwuje materiały z magazynu|Higher priority reserves inventory materials first
Zaloguj się jako Owner lub Admin.|Log in as the owner or an admin.
Zaloguj się jako administrator, aby ustawiać terminy Siege.|Log in as an admin to set siege dates.
Zaloguj się jako administrator, aby zmieniać respawny bossów.|Log in as an admin to change boss respawns.
Zaloguj się jako administrator, aby zmieniać wydarzenia.|Log in as an admin to change events.
Zaloguj się ponownie, aby zapisać odpowiedź.|Log in again to save your response.
Zaloguj się, aby ustawić wygląd swojego profilu.|Log in to customise your profile.
Zaloguj się, aby wejść do Strefy Klanu.|Log in to enter the Clan Area.
Zaloguj się, aby wybrać odpowiedź.|Log in to choose a response.
Zapis nie powiódł się. Spróbuj ponownie.|Save failed. Try again.
Zapisano odpowiedź: może.|Response saved: maybe.
Zapisano: będziesz na wydarzeniu.|Saved: you are going to the event.
Zapisano: nie będziesz na wydarzeniu.|Saved: you are not going to the event.
Zapisuję wyłącznie właścicieli…|Saving owners only…
Zapisywanie praw użytkownika…|Saving user permissions…
Zapisywanie wyglądu…|Saving appearance…
Zapisz się|Sign up
Zarządzanie terminami|Schedule management
Zestaw zapisany w tej przeglądarce (podgląd).|Look saved in this browser (preview).
Zmiana dat oblężeń|Changing siege dates
Zmieniaj napisy, linki i ogłoszenia widoczne dla klanu.|Edit text, links and announcements visible to the clan.
Zmień komunikat|Edit message
Napisz komunikat dla klanu|Write a message for the clan
Opublikuj|Publish
Przypięte|Pinned
Widoczne|Visible
Ankieta usunięta.|Poll deleted.
Ankieta zakończona.|Poll closed.
Domyślne prawa roli zapisane.|Default role permissions saved.
Głos zapisany.|Vote saved.
Podgląd przygotowany bez wysyłania na Discord.|Preview prepared without sending to Discord.
Test został przekazany do Discord.|Test sent to Discord.
Ustawienia powiadomień zapisane.|Notification settings saved.
Zapisano. Zmiany są już widoczne na stronie.|Saved. Changes are now visible on the site.
Ładowanie grafiki…|Loading artwork…
Ładowanie silnika OCR…|Loading OCR engine…
Ładowanie ustawień…|Loading settings…
nieznany błąd|unknown error
np. quest, drop, potrzebuję kill do questa|e.g. quest, drop, need a quest kill
Ozdoby|Ornaments
Ramki|Frames
Kolory i efekty|Colours and effects
Ozdoby awatara|Avatar ornaments
Ramka awatara|Avatar frame
Twoja kolekcja odznak|Your badge collection
Zamki Interlude, barwy Polski i klimat klanu.|Interlude castles, Polish colours and clan atmosphere.
Dopasuj akcenty i subtelne animacje.|Adjust accents and subtle animations.
Wybrane ozdoby profilu|Selected profile ornaments
Interaktywny podgląd|Interactive preview
Oznaczenie podglądu|Preview identification
LINEAGE II INTERLUDE · TWÓJ KLAN. TWÓJ STYL.|LINEAGE II INTERLUDE · YOUR CLAN. YOUR STYLE.
Odtwórz losowy film Orła Białego|Play a random Orzeł Biały video
Odtwórz drugi losowy film Orła Białego|Play another random Orzeł Biały video
Od uruchomienia|Since launch
Najdalsze najpierw|Latest first
Codziennie|Daily
Co 2 tygodnie|Every 2 weeks
Co X dni|Every X days
Naszyjnik|Necklace
Kolczyk 1|Earring 1
Kolczyk 2|Earring 2
Pasywna|Passive
Szansowa|Chance
Bez SA|No SA
Bonus duali aktywuje się przy +4|Dual weapon bonus activates at +4
Edycja wydarzenia|Edit event
Prywatny|Private
Drop Kalkulator|Drop calculator
Strona|Website
Linki|Links
Motto klanu|Clan motto
Link do Discorda|Discord link
Link do YouTube|YouTube link
Link do strony serwera|Server website link
Nazwa lub opis|Name or description
Zapisywanie praw roli…|Saving role permissions…
Indywidualne uprawnienia zapisane.|Individual permissions saved.
Wydarzenie klanowe|Clan event
Zapisz ankietę|Save poll
Edytuj ankietę|Edit poll
Ankieta aktywna|Active poll
Data rozpoczęcia|Start date
Data zakończenia|End date
Nazwa lub nick|Name or nickname
Wróć|Back
Zapisz wyposażenie|Save equipment
Usunąć wydarzenie|Delete event
Dodaj nowe wydarzenie w panelu administratora.|Add a new event in the admin panel.
Menu mobilne|Mobile menu
To konto jest zablokowane.|This account is blocked.
Wpisz poprawny nick w grze lub login.|Enter a valid in-game nickname or login.
Do ustalenia|To be confirmed
TYLKO DLA WŁAŚCICIELA|OWNER ONLY
Zmiany i publikacja|Changes and publishing
Ładowanie wersji…|Loading versions…
Panel jest przygotowany. Publikowanie wymaga jeszcze bezpiecznego połączenia z hostingiem.|The panel is prepared. Publishing still requires a secure connection to the hosting service.
Nowe zmiany pozostają w wersji testowej do czasu Twojej decyzji.|New changes stay in preview until you decide to publish them.
Najpierw otwórz podgląd i sprawdź zmiany. Udostępnienie wersji zmieni stronę dla wszystkich.|Open the preview and test the changes first. Publishing will update the website for everyone.
Wersja publiczna:|Public version:
POWRÓT DO POPRZEDNIEJ WERSJI|RESTORE A PREVIOUS VERSION
GOTOWE DO TWOICH TESTÓW|READY FOR YOUR TESTS
Otwórz prywatny podgląd ↗|Open private preview ↗
Sprawdziłem tę wersję i chcę udostępnić ją wszystkim.|I have tested this version and want to publish it for everyone.
Udostępnij wszystkim|Publish for everyone
Przywróć tę wersję|Restore this version
Odśwież stan|Refresh status
Nie ma nowych wersji oczekujących na publikację.|There are no new versions waiting to be published.
Zaloguj się jako właściciel strony.|Sign in as the website owner.
Panel publikacji wymaga uruchomienia na hostingu.|The publishing panel must run on the hosting service.
Nie udało się pobrać wersji.|Could not load versions.
Przywrócić wybraną wersję strony dla wszystkich?|Restore the selected website version for everyone?
Udostępnić przetestowaną wersję strony wszystkim?|Publish the tested website version for everyone?
Wysyłanie zlecenia do hostingu…|Sending the request to the hosting service…
Hosting przyjął zlecenie. Odśwież stan, aby potwierdzić aktywną wersję.|The hosting service accepted the request. Refresh the status to confirm the active version.
Hosting nie potwierdził operacji. Odśwież stan przed ponowną próbą.|The hosting service did not confirm the operation. Refresh the status before trying again.
Prywatna wersja testowa|Private preview
Zmiany wyglądu widzisz tylko tutaj. Edycja danych klanu może zmienić prawdziwe dane.|Design changes are visible only here. Editing clan data may change real data.
Otwórz wersję publiczną|Open public website
Zamknij dostęp do podglądu|Sign out of private preview
`;

export const english = new Map((pairs.trim() + '\n' + gameCopy.trim()).split('\n').map(line => {
  const split = line.indexOf('|');
  return [line.slice(0, split), line.slice(split + 1)];
}));

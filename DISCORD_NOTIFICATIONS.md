# Powiadomienia Discord

Mechanizm działa w Supabase i jest sprawdzany co 5 minut. Nie zależy od limitu
Vercel Cron. Dopóki brakuje sekretu `discord_webhook_url` albo ustawienie
`enabled` ma wartość `false`, funkcja kończy pracę bez wysyłania wiadomości.

## Obsługiwane powiadomienia

- wydarzenia dodane ręcznie,
- okna RB i stałe Epic RB,
- Siege,
- Clan Hall,
- Olympiada,
- zgłoszenia „Potrzebne RB” z ustawionym oknem.

Wiadomość zawiera godzinę Europe/Warsaw, typ wydarzenia, lokalizację oraz liczbę
zapisów „Będę” i „Może”. Klucz wydarzenia, start i czas przypomnienia tworzą
unikalny wpis w `discord_reminder_log`, więc ten sam alert nie jest wysyłany
ponownie.

## Podłączenie webhooka

Webhook jest sekretem. Nie należy dodawać go do kodu, pliku `.env`,
`discord_notification_settings` ani panelu przeglądarkowego. Po otrzymaniu URL:

1. zapisać lub zaktualizować sekret o nazwie `discord_webhook_url` w Supabase Vault;
2. jako Owner otworzyć panel Discord i użyć „Wyślij test”;
3. sprawdzić wiadomość na właściwym kanale Discord;
4. dopiero po udanym teście włączyć automatyczną wysyłkę;
5. sprawdzić, czy `discord_reminder_log` otrzymał pojedynczy wpis dla testowego terminu.

Panel pozwala wcześniej użyć „Podgląd wiadomości”. Ten przycisk generuje treść,
ale niczego nie wysyła.

## Bezpieczeństwo

- webhook jest szyfrowany w Supabase Vault;
- funkcje wysyłające nie są dostępne dla `anon`;
- test i podgląd wymagają zatwierdzonego konta Owner;
- Discord `allowed_mentions` jest pusty, więc dane wydarzenia nie mogą wywołać
  niezamierzonego `@everyone` lub wzmianki roli;
- automatyczna wysyłka pozostaje wyłączona po migracji.

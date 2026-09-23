-- Make Discord dates and start times easier to scan.
-- Date stays neutral; the start time is separated and emphasized.
begin;

CREATE OR REPLACE FUNCTION public.process_discord_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  settings_row public.discord_notification_settings%rowtype;
  candidate record;
  minutes_until numeric;
  claimed integer;
  yes_count integer;
  maybe_count integer;
  yes_names text;
  maybe_names text;
  yes_value text;
  maybe_value text;
  correction_notice boolean;
  site_url text;
  webhook text;
  request_identifier bigint;
  message_payload jsonb;
  sent integer := 0;
begin
  select * into settings_row
  from public.discord_notification_settings
  where id = true;

  if not found or not settings_row.enabled then
    return 0;
  end if;

  select decrypted_secret into webhook
  from vault.decrypted_secrets
  where name = 'discord_webhook_url'
  order by updated_at desc
  limit 1;

  if nullif(btrim(webhook), '') is null then
    return 0;
  end if;

  select coalesce(
    (select value from public.site_settings where key = 'public_site_url' limit 1),
    'https://orzel-bialy.vercel.app'
  ) into site_url;

  for candidate in
    select *
    from public.discord_notification_candidates(now())
    where reminder_enabled
      and start_at < now() + interval '4 hours'
  loop
    correction_notice := candidate.event_type = 'Siege'
      and (candidate.start_at at time zone 'Europe/Warsaw')::date = date '2026-09-20';

    if candidate.event_key like 'needed-rb-%' and not settings_row.notify_needed_rb then
      continue;
    end if;
    if candidate.event_key not like 'needed-rb-%' and not settings_row.notify_event_reminders then
      continue;
    end if;

    minutes_until := extract(epoch from (candidate.start_at - now())) / 60.0;
    if abs(minutes_until - candidate.reminder_minutes) > 3 then
      continue;
    end if;

    insert into public.discord_reminder_log (
      event_key, event_start, reminder_minutes, notification_kind, delivery_status
    ) values (
      candidate.event_key, candidate.start_at, candidate.reminder_minutes, 'event_reminder', 'claiming'
    ) on conflict do nothing;
    get diagnostics claimed = row_count;
    if claimed = 0 then
      continue;
    end if;

    yes_count := 0;
    maybe_count := 0;
    yes_names := '';
    maybe_names := '';

    if candidate.event_id is not null then
      select
        count(*) filter (where response = 'yes'),
        count(*) filter (where response = 'maybe'),
        coalesce(
          string_agg(
            btrim(nickname),
            ', ' order by lower(btrim(nickname))
          ) filter (
            where response = 'yes'
              and nullif(btrim(nickname), '') is not null
          ),
          ''
        ),
        coalesce(
          string_agg(
            btrim(nickname),
            ', ' order by lower(btrim(nickname))
          ) filter (
            where response = 'maybe'
              and nullif(btrim(nickname), '') is not null
          ),
          ''
        )
      into yes_count, maybe_count, yes_names, maybe_names
      from public.event_signups
      where event_id = candidate.event_id;
    else
      select
        count(*) filter (where response = 'yes'),
        count(*) filter (where response = 'maybe'),
        coalesce(
          string_agg(
            btrim(nickname),
            ', ' order by lower(btrim(nickname))
          ) filter (
            where response = 'yes'
              and nullif(btrim(nickname), '') is not null
          ),
          ''
        ),
        coalesce(
          string_agg(
            btrim(nickname),
            ', ' order by lower(btrim(nickname))
          ) filter (
            where response = 'maybe'
              and nullif(btrim(nickname), '') is not null
          ),
          ''
        )
      into yes_count, maybe_count, yes_names, maybe_names
      from public.event_signups
      where schedule_key = candidate.event_key;
    end if;

    yes_value := left(
      format(
        'Będzie: **%s**%s%s',
        yes_count,
        case when nullif(yes_names, '') is not null then E'\n' else '' end,
        coalesce(nullif(yes_names, ''), '—')
      ),
      1024
    );
    maybe_value := left(
      format(
        'Może: **%s**%s%s',
        maybe_count,
        case when nullif(maybe_names, '') is not null then E'\n' else '' end,
        coalesce(nullif(maybe_names, ''), '—')
      ),
      1024
    );

    message_payload := jsonb_build_object(
      'username', 'Orzeł Biały · Kalendarz',
      'content', case when correction_notice then
        E'⚠️ **KOREKTA — DZISIAJ**\nWcześniejsze powiadomienie o Siege miało błędną godzinę z powodu problemu z przeliczeniem czasu serwera. Prawidłowy start dzisiejszego Siege to **20:00**. Zbiórka za pół godziny.'
      else '🔔 **ZBIÓRKA ZA PÓŁ GODZINY**'
      end,
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array()),
      'embeds', jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'title', '⚔️ ' || candidate.event_name,
        'description', case when correction_notice then
          'Korekta wcześniejszej wiadomości: prawidłowa godzina dzisiejszego Siege to 20:00.'
        else 'Przygotuj postać — za pół godziny zbiórka na Discordzie.'
        end,
        'color', case candidate.event_type
          when 'Epic RB' then 10181046
          when 'Siege' then 13860957
          when 'Clan Hall' then 13936727
          when 'Olympiad' then 7907517
          else 12684620
        end,
        'fields', jsonb_build_array(
          jsonb_build_object('name', '📅 Data', 'value', to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY'), 'inline', true),
          jsonb_build_object('name', '⏰ Start', 'value', '**' || to_char(candidate.start_at at time zone 'Europe/Warsaw', 'HH24:MI') || '**', 'inline', true),
          jsonb_build_object('name', '🏷️ Typ', 'value', candidate.event_type, 'inline', true),
          jsonb_build_object('name', '📍 Lokalizacja', 'value', coalesce(candidate.event_location, '—'), 'inline', false),
          jsonb_build_object('name', '👥 Będę', 'value', yes_value, 'inline', false),
          jsonb_build_object('name', '🤔 Może', 'value', maybe_value, 'inline', false)
        ),
        'url', site_url,
        'footer', jsonb_build_object('text', 'Orzeł Biały · Eternal x10 · czas Europe/Warsaw')
      )))
    );

    select net.http_post(
      url := webhook || case when webhook like '%?%' then '&wait=true' else '?wait=true' end,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := message_payload,
      timeout_milliseconds := 10000
    ) into request_identifier;

    update public.discord_reminder_log
    set request_id = request_identifier,
        delivery_status = 'queued',
        payload = message_payload
    where event_key = candidate.event_key
      and event_start = candidate.start_at
      and reminder_minutes = candidate.reminder_minutes;

    sent := sent + 1;
  end loop;

  return sent;
end;
$function$;


CREATE OR REPLACE FUNCTION public.process_discord_daily_digest()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  settings_row public.discord_notification_settings%rowtype;
  local_now timestamp;
  report_date date;
  digest_start timestamptz;
  digest_end timestamptz;
  candidate record;
  lines text[] := array[]::text[];
  event_line text;
  site_url text;
  webhook text;
  request_identifier bigint;
  claimed integer;
  message_payload jsonb;
  digest_key text;
begin
  select *
  into settings_row
  from public.discord_notification_settings
  where id = true;

  if not found
     or not settings_row.enabled
     or not settings_row.daily_digest_enabled then
    return 0;
  end if;

  local_now := now() at time zone 'Europe/Warsaw';

  if local_now::time < time '08:00'
     or local_now::time >= time '08:10' then
    return 0;
  end if;

  report_date := local_now::date;
  digest_start := (report_date + time '08:00') at time zone 'Europe/Warsaw';
  digest_end := digest_start + interval '24 hours';
  digest_key := 'daily-digest-' || to_char(report_date, 'YYYY-MM-DD');

  select decrypted_secret
  into webhook
  from vault.decrypted_secrets
  where name = 'discord_webhook_url'
  order by updated_at desc
  limit 1;

  if nullif(btrim(webhook), '') is null then
    return 0;
  end if;

  select coalesce(
    (
      select value
      from public.site_settings
      where key = 'public_site_url'
      limit 1
    ),
    'https://orzel-bialy.vercel.app'
  )
  into site_url;

  for candidate in
    select *
    from public.discord_notification_candidates(digest_start)
    where start_at > digest_start
      and start_at <= digest_end
    order by start_at, event_name
  loop
    event_line := format(
      '📅 %s · ⏰ **%s** · %s · **%s**%s',
      to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY'),
      to_char(candidate.start_at at time zone 'Europe/Warsaw', 'HH24:MI'),
      coalesce(nullif(candidate.event_type, ''), 'EVENT'),
      coalesce(candidate.event_name, 'Wydarzenie'),
      case
        when nullif(candidate.event_location, '') is not null
          then ' · ' || candidate.event_location
        else ''
      end
    );

    lines := array_append(lines, event_line);
  end loop;

  insert into public.discord_reminder_log (
    event_key,
    event_start,
    reminder_minutes,
    notification_kind,
    delivery_status
  ) values (
    digest_key,
    digest_start,
    0,
    'daily_digest',
    'claiming'
  )
  on conflict do nothing;

  get diagnostics claimed = row_count;
  if claimed = 0 then
    return 0;
  end if;

  message_payload := jsonb_build_object(
    'username', 'Orzeł Biały · Kalendarz',
    'content', '🌅 **PLAN DNIA — NAJBLIŻSZE 24 GODZINY**',
    'allowed_mentions', jsonb_build_object('parse', jsonb_build_array()),
    'embeds', jsonb_build_array(jsonb_build_object(
      'description', left(
        coalesce(
          array_to_string(lines, E'\n'),
          'Brak zaplanowanych wydarzeń w najbliższych 24 godzinach.'
        ),
        3900
      ),
      'color', 4769792,
      'url', site_url,
      'footer', jsonb_build_object(
        'text', 'Orzeł Biały · Eternal x10 · czas Europe/Warsaw'
      )
    ))
  );

  select net.http_post(
    url := webhook || case
      when webhook like '%?%' then '&wait=true'
      else '?wait=true'
    end,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := message_payload,
    timeout_milliseconds := 10000
  )
  into request_identifier;

  update public.discord_reminder_log
  set request_id = request_identifier,
      delivery_status = 'queued',
      payload = message_payload
  where event_key = digest_key
    and event_start = digest_start
    and reminder_minutes = 0;

  return 1;
end;
$function$;


CREATE OR REPLACE FUNCTION private.preview_discord_notification()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  candidate record;
  yes_count integer := 0;
  maybe_count integer := 0;
  yes_names text := '';
  maybe_names text := '';
  site_url text;
  configured boolean := false;
begin
  if not public.is_owner_user() then
    raise exception 'forbidden';
  end if;

  select *
  into candidate
  from public.discord_notification_candidates(now())
  where reminder_enabled
  order by start_at
  limit 1;

  select coalesce(
    (select value from public.site_settings where key = 'public_site_url' limit 1),
    'https://orzel-bialy.vercel.app'
  ) into site_url;

  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'discord_webhook_url' and nullif(btrim(decrypted_secret), '') is not null
  ) into configured;

  if candidate is null then
    return jsonb_build_object('ok', false, 'configured', configured, 'message', 'Brak nadchodzących wydarzeń do podglądu.');
  end if;

  if candidate.event_id is not null then
    select
      count(*) filter (where response = 'yes'),
      count(*) filter (where response = 'maybe'),
      coalesce(
        string_agg(btrim(nickname), ', ' order by lower(btrim(nickname))) filter (
          where response = 'yes' and nullif(btrim(nickname), '') is not null
        ),
        ''
      ),
      coalesce(
        string_agg(btrim(nickname), ', ' order by lower(btrim(nickname))) filter (
          where response = 'maybe' and nullif(btrim(nickname), '') is not null
        ),
        ''
      )
    into yes_count, maybe_count, yes_names, maybe_names
    from public.event_signups
    where event_id = candidate.event_id;
  else
    select
      count(*) filter (where response = 'yes'),
      count(*) filter (where response = 'maybe'),
      coalesce(
        string_agg(btrim(nickname), ', ' order by lower(btrim(nickname))) filter (
          where response = 'yes' and nullif(btrim(nickname), '') is not null
        ),
        ''
      ),
      coalesce(
        string_agg(btrim(nickname), ', ' order by lower(btrim(nickname))) filter (
          where response = 'maybe' and nullif(btrim(nickname), '') is not null
        ),
        ''
      )
    into yes_count, maybe_count, yes_names, maybe_names
    from public.event_signups
    where schedule_key = candidate.event_key;
  end if;

  return jsonb_build_object(
    'ok', true,
    'configured', configured,
    'event_key', candidate.event_key,
    'title', '⚔️ ' || candidate.event_name || ' — zbiórka za pół godziny',
    'type', candidate.event_type,
    'start', to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY HH24:MI'),
    'start_date', to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY'),
    'start_time', to_char(candidate.start_at at time zone 'Europe/Warsaw', 'HH24:MI'),
    'location', candidate.event_location,
    'yes_count', yes_count,
    'maybe_count', maybe_count,
    'yes_names', yes_names,
    'maybe_names', maybe_names,
    'site_url', site_url
  );
end;
$function$;


commit;

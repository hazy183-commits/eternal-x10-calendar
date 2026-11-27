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
  attendee_names text;
  yes_value text;
  maybe_value text;
  correction_notice boolean;
  site_url text;
  webhook text;
  request_identifier bigint;
  message_payload jsonb;
  sent integer := 0;
  quote_index integer;
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

  -- Serialize quote allocation across concurrent reminder runs.
  if not pg_try_advisory_xact_lock(924251701) then
    return 0;
  end if;



  for candidate in
    select *
    from public.discord_notification_candidates(now())
    where reminder_enabled
      and event_key not like 'clan-activity-colloseum-%'
      and start_at < now() + interval '4 hours'
    order by start_at - make_interval(mins => reminder_minutes), event_key
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

    attendee_names := coalesce(nullif(yes_names, ''), 'Brak potwierdzonych zgłoszeń');

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

    -- Reserve all recently queued slots, even if Discord delivery is uncertain.
    select slot into quote_index
    from generate_series(0, 959) as slots(slot)
    where not (
      slot = any(array(
        select mod((substring(payload #>> '{embeds,0,image,url}' from '[?&]q=([0-9]{1,15})(?:&|$)'))::bigint, 960)::integer
        from public.discord_reminder_log
        where notification_kind = 'event_reminder'
          and sent_at >= now() - interval '4 months'
          and request_id is not null
          and (payload #>> '{embeds,0,image,url}') ~ '[?&]q=[0-9]{1,15}(?:&|$)'
      ))
    )
    order by slot
    limit 1;

    message_payload := jsonb_build_object(
      'username', 'Orzeł Biały · Kalendarz',
      'content', '',
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array()),
      'embeds', jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'color', case candidate.event_type
          when 'Epic RB' then 10181046
          when 'Siege' then 13860957
          when 'Clan Hall' then 13936727
          when 'Olympiad' then 7907517
          else 12684620
        end,
        'image', jsonb_build_object('url', case when candidate.reminder_minutes = 60 then public.discord_notification_image(candidate.event_name, candidate.event_type, candidate.event_location, to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY'), to_char(candidate.start_at at time zone 'Europe/Warsaw', 'HH24:MI'), attendee_names, 'ZBIÓRKA: 30 MIN PRZED EVENTEM|HUNTER VILLAGE') else public.discord_notification_image(candidate.event_name, candidate.event_type, candidate.event_location, to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY'), to_char(candidate.start_at at time zone 'Europe/Warsaw', 'HH24:MI'), attendee_names) end || '&q=' || coalesce(quote_index::text, 'none')),
        'fields', jsonb_build_array(),
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

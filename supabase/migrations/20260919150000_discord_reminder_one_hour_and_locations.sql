begin;

update public.discord_notification_settings
set reminder_minutes = 60,
    updated_at = now()
where id = true;

create or replace function public.discord_notification_candidates(reference_at timestamptz default now())
returns table (
  event_key text,
  event_id bigint,
  event_name text,
  event_type text,
  event_location text,
  start_at timestamptz,
  reminder_enabled boolean,
  reminder_minutes integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with settings as (
    select s.reminder_minutes
    from public.discord_notification_settings s
    where s.id = true
  ),
  manual_events as (
    select
      'event-' || e.id::text as event_key,
      e.id as event_id,
      e.name as event_name,
      e.type as event_type,
      nullif(e.location, '') as event_location,
      ((e.event_date::text || ' ' || e.event_time::text)::timestamp at time zone 'Europe/Warsaw') as start_at
    from public.events e
  ),
  manual_bosses as (
    select
      'boss-respawn-' || lower(regexp_replace(b.boss, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        (extract(epoch from b.window_start) * 1000)::bigint::text as event_key,
      null::bigint as event_id,
      b.boss as event_name,
      case when b.boss in ('Baium', 'Antharas', 'Valakas', 'Frintezza') then 'Epic RB' else 'RB' end as event_type,
      case b.boss
        when 'Queen Ant' then 'Queen Ant Nest'
        when 'Core' then 'Core Chamber'
        when 'Orfen' then 'Sea of Spores'
        when 'Zaken' then 'Devil''s Isle'
        when 'Frintezza' then 'Frintezza''s Hall'
        else null
      end as event_location,
      b.window_start as start_at
    from public.boss_respawns b
    where b.window_start is not null
      and b.window_end is not null
      and b.window_end > reference_at
  ),
  static_bosses as (
    select
      'boss-respawn-baium-' || to_char(d::date, 'YYYY-MM-DD') as event_key,
      null::bigint as event_id,
      'Baium'::text as event_name,
      'Epic RB'::text as event_type,
      'Tower of Insolence'::text as event_location,
      (d::date + time '22:00') at time zone 'Europe/Warsaw' as start_at
    from generate_series(
      (reference_at at time zone 'Europe/Warsaw')::date,
      (reference_at at time zone 'Europe/Warsaw')::date + 21,
      interval '1 day'
    ) d
    where extract(dow from d) = 6

    union all

    select
      'boss-respawn-antharas-' || to_char(d::date, 'YYYY-MM-DD'),
      null::bigint,
      'Antharas',
      'Epic RB',
      'Antharas'' Nest',
      (d::date + time '22:00') at time zone 'Europe/Warsaw'
    from generate_series(
      (reference_at at time zone 'Europe/Warsaw')::date,
      (reference_at at time zone 'Europe/Warsaw')::date + 21,
      interval '1 day'
    ) d
    where extract(dow from d) = 0
      and d::date >= date '2026-09-20'
      and ((d::date - date '2026-09-20') % 14) = 0

    union all

    select
      'boss-respawn-valakas-' || to_char(d::date, 'YYYY-MM-DD'),
      null::bigint,
      'Valakas',
      'Epic RB',
      'Forge of the Gods / Valakas Lair',
      (d::date + time '22:00') at time zone 'Europe/Warsaw'
    from generate_series(
      (reference_at at time zone 'Europe/Warsaw')::date,
      (reference_at at time zone 'Europe/Warsaw')::date + 21,
      interval '1 day'
    ) d
    where extract(dow from d) = 0
      and d::date >= date '2026-09-27'
      and ((d::date - date '2026-09-27') % 14) = 0
  ),
  olympiad as (
    select
      'olympiad-' || to_char(d::date, 'YYYY-MM-DD') as event_key,
      null::bigint as event_id,
      'OLYMPIAD'::text as event_name,
      'Olympiad'::text as event_type,
      'Olympiad Arena'::text as event_location,
      (d::date + time '20:30') at time zone 'UTC' as start_at
    from generate_series(
      (reference_at at time zone 'UTC')::date,
      (reference_at at time zone 'UTC')::date + 8,
      interval '1 day'
    ) d
    where extract(isodow from d) between 1 and 5
  ),
  siege_occurrences as (
    select
      ss.*,
      occurrence.occurrence_date
    from public.siege_schedule ss
    cross join lateral (
      select (ss.reference_date + make_interval(months => month_offset))::date as occurrence_date
      from generate_series(0, 36) month_offset
      where (ss.reference_date + make_interval(months => month_offset))::date >=
        (reference_at at time zone 'Europe/Warsaw')::date
      order by occurrence_date
      limit 1
    ) occurrence
  ),
  sieges as (
    select
      'siege-schedule-' || lower(regexp_replace(s.castle, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        to_char(s.occurrence_date, 'YYYY-MM-DD') as event_key,
      null::bigint as event_id,
      s.castle || ' Castle Siege' as event_name,
      'Siege'::text as event_type,
      s.castle || ' Castle' as event_location,
      (s.occurrence_date + s.reference_time) at time zone 'Europe/Warsaw' as start_at
    from siege_occurrences s
  ),
  clan_hall_definitions(name, weekday, event_time) as (
    values
      ('Fortress of Resistance'::text, 5, time '19:00'),
      ('Devastated Castle'::text, 1, time '19:00'),
      ('Bandit Stronghold'::text, 3, time '19:00'),
      ('Rainbow Spring Chateau'::text, 1, time '23:00'),
      ('Wild Beast Reserve'::text, 4, time '20:00'),
      ('Fortress of the Dead'::text, 2, time '23:00')
  ),
  clan_halls as (
    select
      'clan-hall-' || trim(both '-' from lower(regexp_replace(h.name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' ||
        to_char(d::date, 'YYYY-MM-DD') as event_key,
      null::bigint as event_id,
      h.name as event_name,
      'Clan Hall'::text as event_type,
      h.name as event_location,
      (d::date + h.event_time) at time zone 'Europe/Warsaw' as start_at
    from clan_hall_definitions h
    cross join generate_series(
      (reference_at at time zone 'Europe/Warsaw')::date,
      (reference_at at time zone 'Europe/Warsaw')::date + 8,
      interval '1 day'
    ) d
    where extract(dow from d) = h.weekday
  ),
  needed_rb as (
    select
      'needed-rb-' || r.id::text as event_key,
      null::bigint as event_id,
      r.boss_name || ' — potrzebne RB' as event_name,
      'RB'::text as event_type,
      case lower(btrim(r.boss_name))
        when 'queen ant' then 'Queen Ant Nest'
        when 'core' then 'Core Chamber'
        when 'orfen' then 'Sea of Spores'
        when 'zaken' then 'Devil''s Isle'
        when 'frintezza' then 'Frintezza''s Hall'
        when 'baium' then 'Baium''s Tower'
        when 'antharas' then 'Antharas'' Lair'
        when 'valakas' then 'Valakas'' Lair'
        else null
      end as event_location,
      r.window_start as start_at
    from public.raid_boss_requests r
    where r.status = 'open'
      and r.expires_at > reference_at
      and r.window_start is not null
      and r.window_start > reference_at
  ),
  all_candidates as (
    select * from manual_events
    union all select * from manual_bosses
    union all select * from static_bosses
    union all select * from olympiad
    union all select * from sieges
    union all select * from clan_halls
    union all select * from needed_rb
  ),
  linked_candidates as (
    select
      coalesce('event-' || linked_event.id::text, c.event_key) as event_key,
      coalesce(c.event_id, linked_event.id) as event_id,
      c.event_name,
      c.event_type,
      coalesce(c.event_location, linked_event.linked_event_location) as event_location,
      c.start_at
    from all_candidates c
    left join lateral (
      select e.id, nullif(e.location, '') as linked_event_location
      from public.events e
      where c.event_id is null
        and e.event_date = (c.start_at at time zone 'Europe/Warsaw')::date
        and e.event_time::time = (c.start_at at time zone 'Europe/Warsaw')::time
        and (
          lower(btrim(coalesce(nullif(e.boss, ''), e.name))) = lower(btrim(c.event_name))
          or (c.event_type = 'Olympiad' and lower(e.type) = 'olympiad')
          or (c.event_type = 'Siege' and lower(e.type) = 'siege'
            and lower(c.event_name) like '%' || lower(e.name) || '%')
        )
      order by e.id
      limit 1
    ) linked_event on true
  ),
  deduplicated as (
    select distinct on (c.event_key) c.*
    from linked_candidates c
    order by c.event_key, c.event_id nulls last
  )
  select
    c.event_key,
    c.event_id,
    c.event_name,
    c.event_type,
    c.event_location,
    c.start_at,
    coalesce(o.enabled, true) as reminder_enabled,
    coalesce(o.reminder_minutes, settings.reminder_minutes, 60) as reminder_minutes
  from deduplicated c
  cross join settings
  left join public.discord_event_reminder_overrides o on o.event_key = c.event_key
  where c.start_at > reference_at
  order by c.start_at, c.event_name;
$$;;

create or replace function public.process_discord_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
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
      'content', '🔔 **ZBIÓRKA ZA PÓŁ GODZINY**',
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array()),
      'embeds', jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'title', '⚔️ ' || candidate.event_name,
        'description', 'Przygotuj postać — za pół godziny zbiórka na Discordzie.',
        'color', case candidate.event_type
          when 'Epic RB' then 10181046
          when 'Siege' then 13860957
          when 'Clan Hall' then 13936727
          when 'Olympiad' then 7907517
          else 12684620
        end,
        'fields', jsonb_build_array(
          jsonb_build_object('name', '🕒 Start', 'value', to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM.YYYY · HH24:MI'), 'inline', true),
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
$$;;

create or replace function private.preview_discord_notification()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
    'location', candidate.event_location,
    'yes_count', yes_count,
    'maybe_count', maybe_count,
    'yes_names', yes_names,
    'maybe_names', maybe_names,
    'site_url', site_url
  );
end;
$$;;

commit;
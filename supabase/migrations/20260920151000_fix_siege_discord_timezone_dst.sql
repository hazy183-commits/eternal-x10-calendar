-- Keep Discord Siege reminders aligned with the public calendar.
-- Siege reference dates and times are stored in the game server's UTC clock.
-- Display and reminder times use Europe/Warsaw, including DST automatically.

begin;

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
        (reference_at at time zone 'UTC')::date
      order by occurrence_date
      limit 1
    ) occurrence
  ),
  sieges as (
    select
      'siege-schedule-' || lower(regexp_replace(s.castle, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        to_char(((s.occurrence_date + s.reference_time) at time zone 'UTC') at time zone 'Europe/Warsaw', 'YYYY-MM-DD') as event_key,
      null::bigint as event_id,
      s.castle || ' Castle Siege' as event_name,
      'Siege'::text as event_type,
      s.castle || ' Castle' as event_location,
      (s.occurrence_date + s.reference_time) at time zone 'UTC' as start_at
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
$;


commit;

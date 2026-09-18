-- Daily Discord digest for Orzel Bialy.
-- Runs independently from the existing event reminders and stays aligned
-- with 08:00 Europe/Warsaw across daylight-saving changes.

begin;

alter table public.discord_notification_settings
  add column if not exists daily_digest_enabled boolean not null default true;

create or replace function public.process_discord_daily_digest()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings_row public.discord_notification_settings%rowtype;
  local_now timestamp;
  report_date date;
  digest_start timestamptz;
  digest_end timestamptz;
  candidate record;
  yes_count integer;
  maybe_count integer;
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

  -- The scheduler runs every five minutes. This short local-time window
  -- keeps the report aligned with 08:00 Europe/Warsaw across DST changes.
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
    yes_count := 0;
    maybe_count := 0;

    if candidate.event_id is not null then
      select
        count(*) filter (where response = 'yes'),
        count(*) filter (where response = 'maybe')
      into yes_count, maybe_count
      from public.event_signups
      where event_id = candidate.event_id;
    else
      select
        count(*) filter (where response = 'yes'),
        count(*) filter (where response = 'maybe')
      into yes_count, maybe_count
      from public.event_signups
      where schedule_key = candidate.event_key;
    end if;

    event_line := format(
      '🕒 **%s** · %s · **%s**%s — Będzie: **%s** · Może: **%s**',
      to_char(candidate.start_at at time zone 'Europe/Warsaw', 'DD.MM · HH24:MI'),
      coalesce(nullif(candidate.event_type, ''), 'EVENT'),
      coalesce(candidate.event_name, 'Wydarzenie'),
      case
        when nullif(candidate.event_location, '') is not null
          then ' · ' || candidate.event_location
        else ''
      end,
      yes_count,
      maybe_count
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
      'title', '📅 Wydarzenia od 08:00 do 08:00',
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
$$;

revoke all on function public.process_discord_daily_digest() from public, anon, authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid
  into existing_job
  from cron.job
  where jobname = 'orzel-bialy-discord-daily-digest'
  limit 1;

  if existing_job is null then
    perform cron.schedule(
      'orzel-bialy-discord-daily-digest',
      '*/5 * * * *',
      'select public.process_discord_daily_digest();'
    );
  else
    perform cron.alter_job(
      existing_job,
      schedule := '*/5 * * * *',
      command := 'select public.process_discord_daily_digest();',
      active := true
    );
  end if;
end;
$$;

commit;

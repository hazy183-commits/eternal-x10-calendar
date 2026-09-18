-- Add attendee names to the Discord reminder preview.

begin;

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
    'title', '⚔️ ' || candidate.event_name || ' — za ' || candidate.reminder_minutes || ' min',
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
$$;

revoke all on function private.preview_discord_notification() from public, anon, authenticated;

commit;

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.can_moderate_clan(uuid) set schema private;
alter function public.is_approved_clan_member(uuid) set schema private;
alter function public.is_owner() set schema private;
alter function public.enforce_event_editor_limits() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.rls_auto_enable() set schema private;
alter function public.set_raid_boss_request_expiry_from_window() set schema private;

revoke all on function private.can_moderate_clan(uuid) from public, anon;
grant execute on function private.can_moderate_clan(uuid) to authenticated;
revoke all on function private.is_approved_clan_member(uuid) from public, anon;
grant execute on function private.is_approved_clan_member(uuid) to authenticated;
revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

revoke all on function private.enforce_event_editor_limits() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.rls_auto_enable() from public, anon, authenticated;
revoke all on function private.set_raid_boss_request_expiry_from_window() from public, anon, authenticated;

revoke all on function public.is_owner_user() from public, anon, authenticated;

alter function public.discord_notification_status() set schema private;
alter function public.preview_discord_notification() set schema private;
alter function public.test_discord_notification() set schema private;
alter function public.update_my_character_profile(text, integer, text, text) set schema private;

revoke all on function private.discord_notification_status() from public, anon;
grant execute on function private.discord_notification_status() to authenticated;
revoke all on function private.preview_discord_notification() from public, anon;
grant execute on function private.preview_discord_notification() to authenticated;
revoke all on function private.test_discord_notification() from public, anon;
grant execute on function private.test_discord_notification() to authenticated;
revoke all on function private.update_my_character_profile(text, integer, text, text) from public, anon;
grant execute on function private.update_my_character_profile(text, integer, text, text) to authenticated;

create function public.discord_notification_status()
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.discord_notification_status(); $$;

create function public.preview_discord_notification()
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.preview_discord_notification(); $$;

create function public.test_discord_notification()
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.test_discord_notification(); $$;

create function public.update_my_character_profile(
  p_character_class text,
  p_character_level integer,
  p_subclass text,
  p_party_role text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.update_my_character_profile(
    p_character_class,
    p_character_level,
    p_subclass,
    p_party_role
  );
$$;

revoke all on function public.discord_notification_status() from public, anon;
grant execute on function public.discord_notification_status() to authenticated;
revoke all on function public.preview_discord_notification() from public, anon;
grant execute on function public.preview_discord_notification() to authenticated;
revoke all on function public.test_discord_notification() from public, anon;
grant execute on function public.test_discord_notification() to authenticated;
revoke all on function public.update_my_character_profile(text, integer, text, text) from public, anon;
grant execute on function public.update_my_character_profile(text, integer, text, text) to authenticated;

alter function private.set_raid_boss_request_expiry_from_window()
  set search_path = 'public';

commit;

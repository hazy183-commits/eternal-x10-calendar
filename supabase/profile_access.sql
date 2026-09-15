-- Applied to production through migration fix_recursive_staff_profile_policy.
-- Keep self-read and owner-only UPDATE policies unchanged.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
-- Only inspect the caller's own role. No caller-supplied user ID and no profile data returned.
-- A separate non-exposed function avoids recursively evaluating profiles SELECT policies.
create or replace function private.current_user_is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
      and role in ('owner', 'admin', 'leader')
  );
$$;
revoke all on function private.current_user_is_staff() from public, anon;
grant execute on function private.current_user_is_staff() to authenticated;
alter policy "staff can read profiles" on public.profiles
  using ((select private.current_user_is_staff()));

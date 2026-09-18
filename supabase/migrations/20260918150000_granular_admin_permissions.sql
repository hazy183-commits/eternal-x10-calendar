-- Granular, owner-managed permissions for the clan administration panel.
create table if not exists public.role_permissions (
  role text not null check (role in ('member','leader','admin')),
  permission text not null check (permission in ('manage_events','manage_epic','manage_territories','manage_siege','manage_content','manage_users','manage_discord')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (role, permission)
);

create table if not exists public.user_permission_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null check (permission in ('manage_events','manage_epic','manage_territories','manage_siege','manage_content','manage_users','manage_discord')),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (user_id, permission)
);

alter table public.role_permissions enable row level security;
alter table public.user_permission_overrides enable row level security;
grant select on public.role_permissions to authenticated;
grant select, insert, update, delete on public.user_permission_overrides to authenticated;
grant insert, update, delete on public.role_permissions to authenticated;

insert into public.role_permissions (role, permission, enabled)
select role_name, permission_name, role_name = 'admin' and permission_name = 'manage_events'
from unnest(array['member','leader','admin']) role_name
cross join unnest(array['manage_events','manage_epic','manage_territories','manage_siege','manage_content','manage_users','manage_discord']) permission_name
on conflict (role, permission) do nothing;

create or replace function private.has_admin_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select true from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'approved' and p.role = 'owner'),
    (select upo.enabled from public.user_permission_overrides upo
      join public.profiles p on p.id = upo.user_id
      where upo.user_id = (select auth.uid()) and upo.permission = required_permission and p.status = 'approved'
      limit 1),
    (select rp.enabled from public.role_permissions rp
      join public.profiles p on p.role = rp.role
      where p.id = (select auth.uid()) and p.status = 'approved' and rp.permission = required_permission
      limit 1),
    false
  );
$$;

revoke all on function private.has_admin_permission(text) from public;
grant execute on function private.has_admin_permission(text) to authenticated;

drop policy if exists "role permissions authenticated read" on public.role_permissions;
create policy "role permissions authenticated read" on public.role_permissions for select to authenticated using (true);
drop policy if exists "role permissions owner write" on public.role_permissions;
create policy "role permissions owner write" on public.role_permissions for all to authenticated
using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists "permission overrides own or owner read" on public.user_permission_overrides;
create policy "permission overrides own or owner read" on public.user_permission_overrides for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_owner()));
drop policy if exists "permission overrides owner write" on public.user_permission_overrides;
create policy "permission overrides owner write" on public.user_permission_overrides for all to authenticated
using ((select public.is_owner())) with check ((select public.is_owner()));

-- Prevent a normal member from promoting or approving their own profile.
create or replace function private.protect_profile_access_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not (select public.is_owner())
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Only the owner can change account role or status';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_profile_access_fields() from public;
drop trigger if exists protect_profile_access_fields on public.profiles;
create trigger protect_profile_access_fields before update on public.profiles
for each row execute function private.protect_profile_access_fields();

-- Replace broad authenticated-write rules with permission-aware rules.
drop policy if exists "Authenticated can insert events" on public.events;
drop policy if exists "Authenticated can update events" on public.events;
drop policy if exists "Authenticated can delete events" on public.events;
drop policy if exists "Authenticated users can add events" on public.events;
drop policy if exists "Authenticated users can update events" on public.events;
drop policy if exists "Authenticated users can delete events" on public.events;
create policy "events permitted insert" on public.events for insert to authenticated with check ((select private.has_admin_permission('manage_events')));
create policy "events permitted update" on public.events for update to authenticated using ((select private.has_admin_permission('manage_events'))) with check ((select private.has_admin_permission('manage_events')));
create policy "events permitted delete" on public.events for delete to authenticated using ((select private.has_admin_permission('manage_events')));

drop policy if exists "boss_respawns_authenticated_insert" on public.boss_respawns;
drop policy if exists "boss_respawns_authenticated_update" on public.boss_respawns;
drop policy if exists "boss_respawns_authenticated_delete" on public.boss_respawns;
create policy "boss respawns permitted insert" on public.boss_respawns for insert to authenticated with check ((select private.has_admin_permission('manage_epic')));
create policy "boss respawns permitted update" on public.boss_respawns for update to authenticated using ((select private.has_admin_permission('manage_epic'))) with check ((select private.has_admin_permission('manage_epic')));
create policy "boss respawns permitted delete" on public.boss_respawns for delete to authenticated using ((select private.has_admin_permission('manage_epic')));

drop policy if exists "siege_schedule_authenticated_insert" on public.siege_schedule;
drop policy if exists "siege_schedule_authenticated_update" on public.siege_schedule;
drop policy if exists "siege_schedule_authenticated_delete" on public.siege_schedule;
create policy "siege schedule permitted insert" on public.siege_schedule for insert to authenticated with check ((select private.has_admin_permission('manage_siege')));
create policy "siege schedule permitted update" on public.siege_schedule for update to authenticated using ((select private.has_admin_permission('manage_siege'))) with check ((select private.has_admin_permission('manage_siege')));
create policy "siege schedule permitted delete" on public.siege_schedule for delete to authenticated using ((select private.has_admin_permission('manage_siege')));

drop policy if exists "territory_ownership_manager_insert" on public.territory_ownership;
drop policy if exists "territory_ownership_manager_update" on public.territory_ownership;
create policy "territory ownership permitted insert" on public.territory_ownership for insert to authenticated
with check (updated_by = (select auth.uid()) and (select private.has_admin_permission('manage_territories')));
create policy "territory ownership permitted update" on public.territory_ownership for update to authenticated
using ((select private.has_admin_permission('manage_territories')))
with check (updated_by = (select auth.uid()) and (select private.has_admin_permission('manage_territories')));

drop policy if exists "settings_owner_write" on public.site_settings;
create policy "settings permitted write" on public.site_settings for all to authenticated
using ((select private.has_admin_permission('manage_content'))) with check ((select private.has_admin_permission('manage_content')));
drop policy if exists "announcements_staff_write" on public.clan_announcements;
create policy "announcements permitted write" on public.clan_announcements for all to authenticated
using ((select private.has_admin_permission('manage_content'))) with check ((select private.has_admin_permission('manage_content')));

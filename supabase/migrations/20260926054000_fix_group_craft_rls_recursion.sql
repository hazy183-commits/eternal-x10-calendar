-- Avoid mutual RLS recursion between group projects and memberships.
-- The helper functions read only the group tables and are not exposed through
-- the public schema; policies still enforce the caller's auth.uid().
create or replace function private.is_craft_group_owner(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = $1
        and project_row.owner_id = (select auth.uid())
    );
$$;

create or replace function private.is_craft_group_member(project_id uuid, required_role text default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.craft_group_members member_row
      where member_row.group_project_id = $1
        and member_row.user_id = (select auth.uid())
        and ($2 is null or member_row.role = $2)
    );
$$;

create or replace function private.can_read_craft_group(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      (select private.is_craft_group_owner($1))
      or (select private.is_craft_group_member($1))
    );
$$;

create or replace function private.can_edit_craft_group(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      (select private.is_craft_group_owner($1))
      or (select private.is_craft_group_member($1, 'editor'))
    );
$$;

revoke all on function private.is_craft_group_owner(uuid) from public;
revoke all on function private.is_craft_group_member(uuid, text) from public;
revoke all on function private.can_read_craft_group(uuid) from public;
revoke all on function private.can_edit_craft_group(uuid) from public;
grant execute on function private.is_craft_group_owner(uuid) to authenticated;
grant execute on function private.is_craft_group_member(uuid, text) to authenticated;
grant execute on function private.can_read_craft_group(uuid) to authenticated;
grant execute on function private.can_edit_craft_group(uuid) to authenticated;

drop policy if exists "group project members can read projects" on public.craft_group_projects;
drop policy if exists "users can create group projects" on public.craft_group_projects;
drop policy if exists "owners can update group projects" on public.craft_group_projects;
drop policy if exists "owners can delete group projects" on public.craft_group_projects;
drop policy if exists "group owners and members can read memberships" on public.craft_group_members;
drop policy if exists "owners can invite approved members" on public.craft_group_members;
drop policy if exists "owners can update member roles" on public.craft_group_members;
drop policy if exists "owners can remove members" on public.craft_group_members;
drop policy if exists "group members can read shared inventory" on public.craft_group_inventory;
drop policy if exists "group members can add own inventory" on public.craft_group_inventory;
drop policy if exists "members can update own inventory" on public.craft_group_inventory;
drop policy if exists "members can delete own inventory" on public.craft_group_inventory;

create policy "group project members can read projects"
  on public.craft_group_projects for select to authenticated
  using ((select private.can_read_craft_group(id)));

create policy "users can create group projects"
  on public.craft_group_projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "owners can update group projects"
  on public.craft_group_projects for update to authenticated
  using ((select private.is_craft_group_owner(id)))
  with check (owner_id = (select auth.uid()));

create policy "owners can delete group projects"
  on public.craft_group_projects for delete to authenticated
  using ((select private.is_craft_group_owner(id)));

create policy "group owners and members can read memberships"
  on public.craft_group_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_craft_group_owner(group_project_id))
  );

create policy "owners can invite approved members"
  on public.craft_group_members for insert to authenticated
  with check (
    user_id <> (select auth.uid())
    and (select private.is_craft_group_owner(group_project_id))
    and (select private.is_approved_clan_member(user_id))
  );

create policy "owners can update member roles"
  on public.craft_group_members for update to authenticated
  using ((select private.is_craft_group_owner(group_project_id)))
  with check (
    role in ('editor', 'viewer')
    and user_id <> (select auth.uid())
    and (select private.is_craft_group_owner(group_project_id))
    and (select private.is_approved_clan_member(user_id))
  );

create policy "owners can remove members"
  on public.craft_group_members for delete to authenticated
  using ((select private.is_craft_group_owner(group_project_id)));

create policy "group members can read shared inventory"
  on public.craft_group_inventory for select to authenticated
  using ((select private.can_read_craft_group(group_project_id)));

create policy "group members can add own inventory"
  on public.craft_group_inventory for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.can_edit_craft_group(group_project_id))
  );

create policy "members can update own inventory"
  on public.craft_group_inventory for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.can_edit_craft_group(group_project_id))
  )
  with check (user_id = (select auth.uid()));

create policy "members can delete own inventory"
  on public.craft_group_inventory for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.can_edit_craft_group(group_project_id))
  );

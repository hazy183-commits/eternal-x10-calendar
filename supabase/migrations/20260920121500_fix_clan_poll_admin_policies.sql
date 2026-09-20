begin;

drop policy if exists "clan polls admins manage" on public.clan_polls;

drop policy if exists "clan polls admins insert" on public.clan_polls;
create policy "clan polls admins insert"
  on public.clan_polls
  for insert
  to authenticated
  with check (
    private.has_admin_permission('manage_content')
    and (
      created_by is null
      or created_by = (select auth.uid())
    )
  );

drop policy if exists "clan polls admins update" on public.clan_polls;
create policy "clan polls admins update"
  on public.clan_polls
  for update
  to authenticated
  using (private.has_admin_permission('manage_content'))
  with check (private.has_admin_permission('manage_content'));

drop policy if exists "clan polls admins delete" on public.clan_polls;
create policy "clan polls admins delete"
  on public.clan_polls
  for delete
  to authenticated
  using (private.has_admin_permission('manage_content'));

commit;
-- Preserve the existing guard and point it to the private owner check.
create or replace function private.protect_profile_access_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (new.role is distinct from old.role or new.status is distinct from old.status)
     and not (select private.is_owner()) then
    raise exception 'Only the owner can change account role or status';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_profile_access_fields() from public;

grant delete on public.recruitment_messages to authenticated;
create policy recruitment_staff_delete on public.recruitment_messages
for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.status = 'approved'
    and p.role in ('owner','admin','leader')
));

alter table public.profiles add column removed_at timestamptz;
alter table public.profiles add constraint removed_member_has_no_access
check (removed_at is null or (status = 'blocked' and role <> 'owner'));

create or replace function private.protect_profile_access_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (new.role is distinct from old.role or new.status is distinct from old.status
          or new.removed_at is distinct from old.removed_at)
     and not (select private.is_owner()) then
    raise exception 'Only the owner can change account role, status or membership';
  end if;
  if new.removed_at is not null and (old.role = 'owner' or new.id = (select auth.uid())) then
    raise exception 'Nie można usunąć własnego konta ani właściciela.';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_profile_access_fields() from public;

create function public.remove_clan_member(target_id uuid)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_owner()) then
    raise exception 'Tylko właściciel może usuwać członków.' using errcode = '42501';
  end if;
  if target_id = (select auth.uid()) then
    raise exception 'Nie można usunąć własnego konta.';
  end if;
  update public.profiles set status = 'blocked', role = 'member', removed_at = now()
  where id = target_id and role <> 'owner' and removed_at is null;
  if not found then
    raise exception 'Nie znaleziono członka do usunięcia lub konto jest chronione.';
  end if;
end;
$$;
revoke all on function public.remove_clan_member(uuid) from public, anon;
grant execute on function public.remove_clan_member(uuid) to authenticated;

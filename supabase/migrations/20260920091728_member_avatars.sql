alter table public.profiles add column avatar_path text;
alter table public.profiles add constraint profile_avatar_own_path check (
  avatar_path is null or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.webp$')
);
create function private.protect_member_avatar() returns trigger language plpgsql
set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() <> old.id and new.avatar_path is distinct from old.avatar_path then
    raise exception 'Możesz zmieniać tylko własną miniaturę.' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_member_avatar() from public;
create trigger protect_member_avatar before update on public.profiles
for each row execute function private.protect_member_avatar();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('member-avatars','member-avatars',false,1048576,array['image/webp']);
create policy "Members upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id='member-avatars' and (select private.current_user_is_active_clan_member())
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.webp$'));
create policy "Members read clan avatars" on storage.objects for select to authenticated
using (bucket_id='member-avatars' and (select private.current_user_is_active_clan_member())
  and ((storage.foldername(name))[1]=(select auth.uid())::text or exists (
    select 1 from public.profiles p where p.avatar_path=name and p.status='approved' and p.removed_at is null
  )));
create policy "Members delete own avatar" on storage.objects for delete to authenticated
using (bucket_id='member-avatars' and (select private.current_user_is_active_clan_member())
  and (storage.foldername(name))[1]=(select auth.uid())::text);

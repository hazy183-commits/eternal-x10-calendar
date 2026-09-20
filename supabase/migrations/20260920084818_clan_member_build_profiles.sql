-- Clan members may inspect active members' builds, but only owners may edit them.
-- The private lookup avoids recursive policies on profiles and checks the caller.
create function private.current_user_is_active_clan_member()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved' and removed_at is null
  );
$$;
revoke all on function private.current_user_is_active_clan_member() from public, anon;
grant execute on function private.current_user_is_active_clan_member() to authenticated;

create policy "Active members read clan profiles" on public.profiles
for select to authenticated using (
  (select private.current_user_is_active_clan_member())
  and status = 'approved' and removed_at is null
);

create policy "Active members read clan loadouts" on public.player_loadouts
for select to authenticated using (
  (select private.current_user_is_active_clan_member())
  and exists (select 1 from public.profiles p
    where p.id = player_loadouts.user_id and p.status = 'approved' and p.removed_at is null)
);

drop policy "Members read own or shared buff presets" on public.buff_presets;
create policy "Members read own or clan buff presets" on public.buff_presets
for select to authenticated using (
  (select auth.uid()) = user_id
  or (is_shared and (select private.current_user_is_active_clan_member())
    and exists (select 1 from public.profiles p
      where p.id = buff_presets.user_id and p.status = 'approved' and p.removed_at is null))
);
comment on table public.buff_presets is 'Owner-editable buff setups. Only explicitly shared setups are visible to other active clan members.';

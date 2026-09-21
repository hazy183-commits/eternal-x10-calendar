grant update(option_index) on public.clan_poll_votes to authenticated;
create policy "clan poll votes own active update" on public.clan_poll_votes for update to authenticated
using (user_id = (select auth.uid()) and private.current_user_is_active_clan_member()
and exists(select 1 from public.clan_polls p where p.id=clan_poll_votes.poll_id and p.is_active and p.starts_at<=now() and (p.ends_at is null or p.ends_at>now())))
with check(user_id = (select auth.uid()) and private.current_user_is_active_clan_member()
and exists(select 1 from public.clan_polls p where p.id=clan_poll_votes.poll_id and p.is_active and p.starts_at<=now() and (p.ends_at is null or p.ends_at>now()) and clan_poll_votes.option_index>=0 and clan_poll_votes.option_index<cardinality(p.options)));

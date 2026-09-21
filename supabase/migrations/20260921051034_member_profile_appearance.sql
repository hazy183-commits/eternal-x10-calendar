-- Cosmetic choices only. No roles, privileges or earned achievements live here.
create table public.member_profile_appearance (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  background text not null default 'aden' check (background in ('aden','giran','polska','rune','goddard','innadril','clan','none')),
  frame text not null default 'steel' check (frame in ('steel','gold','polish','obsidian','rune','none')),
  ornament text not null default 'none' check (ornament in ('dragon','fire','horns','ice','arcane','swords','none')),
  badges text[] not null default array['clan']::text[] check (
    cardinality(badges) <= 3 and array_position(badges, null) is null
    and badges <@ array['pvp','siege','raid','olympiad','support','veteran','poland','crystal','clan','flag']::text[]
  ),
  accent text not null default 'gold' check (accent in ('gold','red','blue','violet','green','silver')),
  effect text not null default 'none' check (effect in ('none','glow','pulse','sparks')),
  intensity integer not null default 50 check (intensity between 0 and 100)
);
alter table public.member_profile_appearance enable row level security;
revoke all on public.member_profile_appearance from anon, authenticated;
grant select, insert, update on public.member_profile_appearance to authenticated;

create policy "Active clan members read profile appearance"
on public.member_profile_appearance for select to authenticated using (
  (select private.current_user_is_active_clan_member())
  and exists (select 1 from public.profiles p where p.id = user_id and p.status = 'approved' and p.removed_at is null)
);
create policy "Members insert own profile appearance"
on public.member_profile_appearance for insert to authenticated with check (
  user_id = (select auth.uid()) and (select private.current_user_is_active_clan_member())
);
create policy "Members update own profile appearance"
on public.member_profile_appearance for update to authenticated using (
  user_id = (select auth.uid()) and (select private.current_user_is_active_clan_member())
) with check (
  user_id = (select auth.uid()) and (select private.current_user_is_active_clan_member())
);
comment on table public.member_profile_appearance is 'Owner-editable cosmetic profile choices, visible only to active clan members. Badges are decorations, not earned achievements.';

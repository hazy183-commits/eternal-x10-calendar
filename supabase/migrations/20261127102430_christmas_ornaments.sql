create table public.christmas_ornaments (
  season_year integer not null check (season_year >= 2026),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 80),
  message text not null check (char_length(btrim(message)) between 1 and 240),
  color text not null check (color in ('ruby','gold','pine','blue')),
  created_at timestamptz not null default now(),
  primary key (season_year, user_id)
);

alter table public.christmas_ornaments enable row level security;
revoke all on public.christmas_ornaments from public, anon, authenticated;
grant select, insert, delete on public.christmas_ornaments to authenticated;
grant update (nickname, message, color) on public.christmas_ornaments to authenticated;

create function private.christmas_ornament_season()
returns integer language sql stable security invoker set search_path = ''
as $function$
  select extract(year from (now() at time zone 'Europe/Warsaw'))::integer
  where to_char(now() at time zone 'Europe/Warsaw', 'MMDD') between '1206' and '1227'
    and exists (select 1 from public.site_settings where key = 'feature:christmas-tree' and value = 'on');
$function$;
revoke all on function private.christmas_ornament_season() from public;
grant execute on function private.christmas_ornament_season() to authenticated;

create policy "active members read current tree" on public.christmas_ornaments
for select to authenticated
using ((select private.current_user_is_active_clan_member()) and season_year = (select private.christmas_ornament_season()));

create policy "members hang their own ornament" on public.christmas_ornaments
for insert to authenticated
with check (
  (select private.current_user_is_active_clan_member())
  and season_year = (select private.christmas_ornament_season())
  and user_id = (select auth.uid())
  and nickname = (select p.nickname from public.profiles p where p.id = (select auth.uid()))
);

create policy "members edit their own ornament" on public.christmas_ornaments
for update to authenticated
using (
  (select private.current_user_is_active_clan_member())
  and season_year = (select private.christmas_ornament_season()) and user_id = (select auth.uid())
)
with check (
  (select private.current_user_is_active_clan_member())
  and season_year = (select private.christmas_ornament_season())
  and user_id = (select auth.uid())
  and nickname = (select p.nickname from public.profiles p where p.id = (select auth.uid()))
);

create policy "members or owner remove ornaments" on public.christmas_ornaments
for delete to authenticated
using (
  (select private.current_user_is_active_clan_member())
  and season_year = (select private.christmas_ornament_season())
  and (user_id = (select auth.uid()) or (select private.is_owner()))
);

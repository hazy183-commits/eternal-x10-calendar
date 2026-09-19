-- PvP Advisor: five equipment presets per authenticated member.
create table if not exists public.pvp_equipment_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 1 and 5),
  name text not null check (char_length(name) between 1 and 32),
  class_id text not null default 'SPS',
  equipment jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

alter table public.pvp_equipment_profiles enable row level security;

drop policy if exists "Members read own PvP profiles" on public.pvp_equipment_profiles;
create policy "Members read own PvP profiles" on public.pvp_equipment_profiles
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Members create own PvP profiles" on public.pvp_equipment_profiles;
create policy "Members create own PvP profiles" on public.pvp_equipment_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Members update own PvP profiles" on public.pvp_equipment_profiles;
create policy "Members update own PvP profiles" on public.pvp_equipment_profiles
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Members delete own PvP profiles" on public.pvp_equipment_profiles;
create policy "Members delete own PvP profiles" on public.pvp_equipment_profiles
for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists pvp_equipment_profiles_user_id_idx
on public.pvp_equipment_profiles (user_id);

comment on table public.pvp_equipment_profiles is
'Five user-owned equipment presets for the Eternal x10 PvP Advisor.';

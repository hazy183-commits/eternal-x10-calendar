-- Boss Respawn Manager: uruchom ręcznie w Supabase SQL Editor.
create table if not exists public.boss_respawns (
  id uuid primary key default gen_random_uuid(),
  boss text not null unique check (boss in ('Queen Ant', 'Core', 'Orfen', 'Zaken', 'Frintezza', 'Baium', 'Antharas', 'Valakas')),
  last_kill_at timestamptz,
  base_respawn_at timestamptz,
  window_start timestamptz,
  window_end timestamptz,
  status text,
  updated_at timestamptz not null default now()
);

alter table public.boss_respawns enable row level security;

grant select on table public.boss_respawns to anon, authenticated;
grant insert, update, delete on table public.boss_respawns to authenticated;

drop policy if exists "boss_respawns_public_read" on public.boss_respawns;
create policy "boss_respawns_public_read"
  on public.boss_respawns for select
  to anon, authenticated
  using (true);

drop policy if exists "boss_respawns_authenticated_insert" on public.boss_respawns;
create policy "boss_respawns_authenticated_insert"
  on public.boss_respawns for insert
  to authenticated
  with check (auth.role() = 'authenticated');

drop policy if exists "boss_respawns_authenticated_update" on public.boss_respawns;
create policy "boss_respawns_authenticated_update"
  on public.boss_respawns for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "boss_respawns_authenticated_delete" on public.boss_respawns;
create policy "boss_respawns_authenticated_delete"
  on public.boss_respawns for delete
  to authenticated
  using (auth.role() = 'authenticated');

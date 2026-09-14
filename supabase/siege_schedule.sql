-- Siege Manager: uruchom ręcznie w Supabase SQL Editor.
-- Ten skrypt nie jest wykonywany przez aplikację.
create table if not exists public.siege_schedule (
  id uuid primary key default gen_random_uuid(),
  castle text not null unique check (castle in ('Gludio', 'Dion', 'Giran', 'Oren', 'Aden', 'Innadril', 'Goddard', 'Rune', 'Schuttgart')),
  reference_date date not null,
  reference_time time not null,
  duration_minutes integer not null default 120 check (duration_minutes > 0),
  updated_at timestamptz not null default now()
);

alter table public.siege_schedule enable row level security;

grant select on table public.siege_schedule to anon, authenticated;
grant insert, update, delete on table public.siege_schedule to authenticated;

drop policy if exists "siege_schedule_public_read" on public.siege_schedule;
create policy "siege_schedule_public_read"
  on public.siege_schedule for select
  to anon, authenticated
  using (true);

drop policy if exists "siege_schedule_authenticated_insert" on public.siege_schedule;
create policy "siege_schedule_authenticated_insert"
  on public.siege_schedule for insert
  to authenticated
  with check (auth.role() = 'authenticated');

drop policy if exists "siege_schedule_authenticated_update" on public.siege_schedule;
create policy "siege_schedule_authenticated_update"
  on public.siege_schedule for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "siege_schedule_authenticated_delete" on public.siege_schedule;
create policy "siege_schedule_authenticated_delete"
  on public.siege_schedule for delete
  to authenticated
  using (auth.role() = 'authenticated');

-- Optional initial known reference points. Run manually only if you want to seed them.
insert into public.siege_schedule (castle, reference_date, reference_time, duration_minutes)
values
  ('Gludio', '2026-10-04', '18:00', 120),
  ('Giran', '2026-09-20', '18:00', 120),
  ('Aden', '2026-09-27', '18:00', 120),
  ('Innadril', '2026-09-20', '18:00', 120),
  ('Rune', '2026-10-04', '18:00', 120),
  ('Schuttgart', '2026-09-20', '18:00', 120)
on conflict (castle) do nothing;

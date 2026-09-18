create table if not exists public.territory_ownership (
  territory_type text not null check (territory_type in ('castle', 'clan_hall')),
  territory_name text not null,
  owner_clan text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (territory_type, territory_name),
  check (owner_clan is null or char_length(trim(owner_clan)) between 1 and 80)
);

create index if not exists territory_ownership_updated_by_idx
  on public.territory_ownership (updated_by);

alter table public.territory_ownership enable row level security;

grant select on table public.territory_ownership to anon, authenticated;
grant insert, update on table public.territory_ownership to authenticated;

drop policy if exists "territory_ownership_public_read" on public.territory_ownership;
create policy "territory_ownership_public_read"
  on public.territory_ownership for select
  to anon, authenticated
  using (true);

drop policy if exists "territory_ownership_manager_insert" on public.territory_ownership;
create policy "territory_ownership_manager_insert"
  on public.territory_ownership for insert
  to authenticated
  with check (
    (select auth.uid()) = updated_by
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and status = 'approved'
        and role in ('owner', 'admin')
    )
  );

drop policy if exists "territory_ownership_manager_update" on public.territory_ownership;
create policy "territory_ownership_manager_update"
  on public.territory_ownership for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and status = 'approved'
        and role in ('owner', 'admin')
    )
  )
  with check (
    (select auth.uid()) = updated_by
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and status = 'approved'
        and role in ('owner', 'admin')
    )
  );

insert into public.territory_ownership (territory_type, territory_name)
values
  ('castle', 'Gludio'),
  ('castle', 'Dion'),
  ('castle', 'Giran'),
  ('castle', 'Oren'),
  ('castle', 'Aden'),
  ('castle', 'Innadril'),
  ('castle', 'Goddard'),
  ('castle', 'Rune'),
  ('castle', 'Schuttgart'),
  ('clan_hall', 'Fortress of Resistance'),
  ('clan_hall', 'Devastated Castle'),
  ('clan_hall', 'Bandit Stronghold'),
  ('clan_hall', 'Rainbow Spring Chateau'),
  ('clan_hall', 'Wild Beast Reserve'),
  ('clan_hall', 'Fortress of the Dead')
on conflict (territory_type, territory_name) do nothing;

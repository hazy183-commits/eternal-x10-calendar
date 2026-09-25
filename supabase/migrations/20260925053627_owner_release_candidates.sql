create table public.owner_release_candidates (
  id text primary key check (id ~ '^dpl_[a-zA-Z0-9]+$'),
  title text not null check (char_length(title) between 1 and 160),
  notes text not null default '' check (char_length(notes) <= 4000),
  action text not null default 'publish' check (action in ('publish','rollback')),
  tests_passed boolean not null default false,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  check (not enabled or tests_passed)
);
alter table public.owner_release_candidates enable row level security;
revoke all on public.owner_release_candidates from public, anon, authenticated;
grant select on public.owner_release_candidates to authenticated;
create policy owner_reads_release_candidates on public.owner_release_candidates
for select to authenticated using ((select private.is_owner()));
comment on table public.owner_release_candidates is 'Exact deployment IDs registered by maintainers after tests; active owner can read, clients cannot mutate.';

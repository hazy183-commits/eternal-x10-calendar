-- Multiple characters/subclasses with equipment and shareable buff presets.
create table if not exists public.player_loadouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  character_name text not null default '', class_name text not null check (char_length(btrim(class_name)) between 1 and 60),
  character_kind text not null default 'subclass' check (character_kind in ('main', 'subclass')),
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  equipment jsonb not null default '{}'::jsonb check (jsonb_typeof(equipment) = 'object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists player_loadouts_user_order_idx on public.player_loadouts (user_id, sort_order, created_at);
alter table public.player_loadouts enable row level security;
create policy "Members read own loadouts" on public.player_loadouts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Members create own loadouts" on public.player_loadouts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members update own loadouts" on public.player_loadouts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members delete own loadouts" on public.player_loadouts for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.buff_presets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 60),
  title text not null check (char_length(btrim(title)) between 1 and 80), class_name text not null default '',
  buffs jsonb not null default '[]'::jsonb check (jsonb_typeof(buffs) = 'array' and jsonb_array_length(buffs) between 1 and 24),
  is_shared boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists buff_presets_user_updated_idx on public.buff_presets (user_id, updated_at desc);
create index if not exists buff_presets_shared_updated_idx on public.buff_presets (updated_at desc) where is_shared;
alter table public.buff_presets enable row level security;
create policy "Members read own or shared buff presets" on public.buff_presets for select to authenticated using ((select auth.uid()) = user_id or is_shared);
create policy "Members create own buff presets" on public.buff_presets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members update own buff presets" on public.buff_presets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members delete own buff presets" on public.buff_presets for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.player_loadouts, public.buff_presets to authenticated;
revoke all on public.player_loadouts, public.buff_presets from anon;
comment on table public.player_loadouts is 'User-owned main class and subclass equipment setups.';
comment on table public.buff_presets is 'User-owned 1-24 slot buff presets; shared rows are readable by authenticated clan members.';

-- Personal craft workspace for clan members.
-- Applied to Supabase as migration: add_personal_craft_workspace.

create table if not exists public.craft_items (
  item_key text primary key,
  game_item_id integer unique,
  name text not null,
  grade text,
  category text,
  stackable boolean not null default true,
  acquisition_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint craft_items_item_key_format check (item_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$')
);

create table if not exists public.craft_recipes (
  id uuid primary key default gen_random_uuid(),
  output_item_key text not null references public.craft_items(item_key) on update cascade on delete restrict,
  output_quantity integer not null default 1 check (output_quantity > 0),
  label text,
  is_primary boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists craft_recipes_one_primary_per_item
  on public.craft_recipes(output_item_key)
  where is_primary and active;

create table if not exists public.craft_recipe_components (
  recipe_id uuid not null references public.craft_recipes(id) on delete cascade,
  component_item_key text not null references public.craft_items(item_key) on update cascade on delete restrict,
  quantity bigint not null check (quantity > 0),
  primary key (recipe_id, component_item_key)
);

create table if not exists public.craft_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null references public.craft_items(item_key) on update cascade on delete restrict,
  quantity bigint not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

create table if not exists public.craft_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  target_item_key text not null references public.craft_items(item_key) on update cascade on delete restrict,
  target_quantity integer not null default 1 check (target_quantity > 0 and target_quantity <= 1000000),
  priority integer not null default 100 check (priority between 0 and 1000000),
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists craft_projects_user_status_priority_idx
  on public.craft_projects(user_id, status, priority, created_at);
create index if not exists craft_inventory_user_idx
  on public.craft_inventory(user_id);

alter table public.craft_items enable row level security;
alter table public.craft_recipes enable row level security;
alter table public.craft_recipe_components enable row level security;
alter table public.craft_inventory enable row level security;
alter table public.craft_projects enable row level security;

create policy "members can read craft items"
  on public.craft_items for select to authenticated using (true);
create policy "members can read craft recipes"
  on public.craft_recipes for select to authenticated using (true);
create policy "members can read craft recipe components"
  on public.craft_recipe_components for select to authenticated using (true);

create policy "users can read own craft inventory"
  on public.craft_inventory for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can insert own craft inventory"
  on public.craft_inventory for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update own craft inventory"
  on public.craft_inventory for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete own craft inventory"
  on public.craft_inventory for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read own craft projects"
  on public.craft_projects for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users can insert own craft projects"
  on public.craft_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users can update own craft projects"
  on public.craft_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users can delete own craft projects"
  on public.craft_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.craft_items, public.craft_recipes, public.craft_recipe_components to authenticated;
grant select, insert, update, delete on public.craft_inventory, public.craft_projects to authenticated;

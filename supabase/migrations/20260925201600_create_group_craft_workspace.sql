create table if not exists public.craft_group_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  target_item_key text not null references public.craft_items(item_key),
  target_quantity integer not null default 1 check (target_quantity between 1 and 1000000),
  priority integer not null default 100 check (priority between 0 and 1000000),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.craft_group_members (
  group_project_id uuid not null references public.craft_group_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  invited_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (group_project_id, user_id)
);

create table if not exists public.craft_group_inventory (
  group_project_id uuid not null references public.craft_group_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null references public.craft_items(item_key),
  quantity bigint not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (group_project_id, user_id, item_key)
);

create index if not exists craft_group_projects_owner_idx
  on public.craft_group_projects(owner_id, created_at desc);
create index if not exists craft_group_members_user_idx
  on public.craft_group_members(user_id, group_project_id);
create index if not exists craft_group_inventory_project_idx
  on public.craft_group_inventory(group_project_id, item_key);

alter table public.craft_group_projects enable row level security;
alter table public.craft_group_members enable row level security;
alter table public.craft_group_inventory enable row level security;

grant select, insert, update, delete on public.craft_group_projects to authenticated;
grant select, insert, update, delete on public.craft_group_members to authenticated;
grant select, insert, update, delete on public.craft_group_inventory to authenticated;

create policy "group project members can read projects"
  on public.craft_group_projects for select to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.craft_group_members member_row
      where member_row.group_project_id = id
        and member_row.user_id = (select auth.uid())
    )
  );

create policy "users can create group projects"
  on public.craft_group_projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "owners can update group projects"
  on public.craft_group_projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners can delete group projects"
  on public.craft_group_projects for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "group owners and members can read memberships"
  on public.craft_group_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and project_row.owner_id = (select auth.uid())
    )
  );

create policy "owners can invite approved members"
  on public.craft_group_members for insert to authenticated
  with check (
    user_id <> (select auth.uid())
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and project_row.owner_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.profiles invited_profile
      where invited_profile.id = user_id
        and invited_profile.status = 'approved'
        and invited_profile.removed_at is null
    )
  );

create policy "owners can update member roles"
  on public.craft_group_members for update to authenticated
  using (
    exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and project_row.owner_id = (select auth.uid())
    )
  )
  with check (
    role in ('editor', 'viewer')
    and user_id <> (select auth.uid())
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and project_row.owner_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.profiles invited_profile
      where invited_profile.id = user_id
        and invited_profile.status = 'approved'
        and invited_profile.removed_at is null
    )
  );

create policy "owners can remove members"
  on public.craft_group_members for delete to authenticated
  using (
    exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and project_row.owner_id = (select auth.uid())
    )
  );

create policy "group members can read shared inventory"
  on public.craft_group_inventory for select to authenticated
  using (
    exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and (
          project_row.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.craft_group_members member_row
            where member_row.group_project_id = project_row.id
              and member_row.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "group members can add own inventory"
  on public.craft_group_inventory for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and (
          project_row.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.craft_group_members member_row
            where member_row.group_project_id = project_row.id
              and member_row.user_id = (select auth.uid())
              and member_row.role = 'editor'
          )
        )
    )
  );

create policy "members can update own inventory"
  on public.craft_group_inventory for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and (
          project_row.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.craft_group_members member_row
            where member_row.group_project_id = project_row.id
              and member_row.user_id = (select auth.uid())
              and member_row.role = 'editor'
          )
        )
    )
  )
  with check (user_id = (select auth.uid()));

create policy "members can delete own inventory"
  on public.craft_group_inventory for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.craft_group_projects project_row
      where project_row.id = group_project_id
        and (
          project_row.owner_id = (select auth.uid())
          or exists (
            select 1
            from public.craft_group_members member_row
            where member_row.group_project_id = project_row.id
              and member_row.user_id = (select auth.uid())
              and member_row.role = 'editor'
          )
        )
    )
  );

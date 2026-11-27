create or replace function public.create_craft_group_project(
  p_project_name text,
  p_target_item_key text,
  p_target_quantity integer default 1
)
returns public.craft_group_projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_project public.craft_group_projects;
begin
  if (select auth.uid()) is null then
    raise exception 'Musisz być zalogowany, aby utworzyć projekt grupowy.';
  end if;

  if p_project_name is null or char_length(btrim(p_project_name)) not between 1 and 80 then
    raise exception 'Nazwa projektu musi mieć od 1 do 80 znaków.';
  end if;

  if p_target_quantity is null or p_target_quantity not between 1 and 1000000 then
    raise exception 'Liczba sztuk musi być dodatnią liczbą całkowitą.';
  end if;

  if not exists (
    select 1
    from public.craft_items item_row
    where item_row.item_key = p_target_item_key
  ) then
    raise exception 'Wybrany przedmiot nie istnieje.';
  end if;

  if not exists (
    select 1
    from public.craft_recipes recipe_row
    where recipe_row.output_item_key = p_target_item_key
      and recipe_row.active = true
  ) then
    raise exception 'Wybrany przedmiot nie ma aktywnej receptury.';
  end if;

  insert into public.craft_group_projects (
    owner_id,
    name,
    target_item_key,
    target_quantity,
    status
  ) values (
    (select auth.uid()),
    btrim(p_project_name),
    p_target_item_key,
    p_target_quantity,
    'active'
  )
  returning * into created_project;

  return created_project;
end;
$$;

revoke all on function public.create_craft_group_project(text, text, integer) from public;
grant execute on function public.create_craft_group_project(text, text, integer) to authenticated;

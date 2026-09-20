-- Transactional integration test: all fixture accounts and rows are rolled back.
begin;
create temporary table build_test_users(kind text primary key, id uuid default gen_random_uuid());
insert into build_test_users(kind) values ('viewer'),('target'),('pending'),('blocked'),('removed');
grant select on build_test_users to authenticated;
insert into auth.users(id,raw_user_meta_data)
select id,jsonb_build_object('nickname','qa_'||replace(id::text,'-','')) from build_test_users;
update public.profiles p set role='member',
  status=case when t.kind in ('viewer','target') then 'approved' when t.kind='pending' then 'pending' else 'blocked' end,
  removed_at=case when t.kind='removed' then now() else null end
from build_test_users t where p.id=t.id;
insert into public.player_loadouts(user_id,class_name,equipment)
select id,'Duelist','{"weapon":"Arcana Mace · Acumen","armor":"Tallum Heavy"}'::jsonb from build_test_users;
insert into public.buff_presets(user_id,author_name,title,buffs,is_shared)
select id,'QA','Shared','["Haste"]'::jsonb,true from build_test_users;
insert into public.buff_presets(user_id,author_name,title,buffs,is_shared)
select id,'QA','Private','["Might"]'::jsonb,false from build_test_users where kind='target';
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from build_test_users where kind='viewer'),true);
do $$ declare target uuid := (select id from build_test_users where kind='target'); affected integer; denied boolean := false; begin
  if not exists(select 1 from public.profiles where id=target) then raise exception 'Member cannot see target profile'; end if;
  if not exists(select 1 from public.player_loadouts where user_id=target) then raise exception 'Member cannot see target loadouts'; end if;
  if not exists(select 1 from public.buff_presets where user_id=target and is_shared) then raise exception 'Member cannot see shared buffs'; end if;
  if exists(select 1 from public.buff_presets where user_id=target and not is_shared) then raise exception 'Private buffs leaked'; end if;
  if exists(select 1 from public.profiles where id in(select id from build_test_users where kind in('pending','blocked','removed'))) then raise exception 'Inactive profile leaked'; end if;
  if exists(select 1 from public.player_loadouts where user_id in(select id from build_test_users where kind in('pending','blocked','removed'))) then raise exception 'Inactive loadouts leaked'; end if;
  if exists(select 1 from public.buff_presets where user_id in(select id from build_test_users where kind in('pending','blocked','removed'))) then raise exception 'Inactive shared buffs leaked'; end if;
  update public.player_loadouts set class_name='Titan' where user_id=target; get diagnostics affected=row_count; if affected<>0 then raise exception 'Foreign loadout update allowed'; end if;
  delete from public.player_loadouts where user_id=target; get diagnostics affected=row_count; if affected<>0 then raise exception 'Foreign loadout delete allowed'; end if;
  update public.buff_presets set title='Changed' where user_id=target; get diagnostics affected=row_count; if affected<>0 then raise exception 'Foreign buff update allowed'; end if;
  delete from public.buff_presets where user_id=target; get diagnostics affected=row_count; if affected<>0 then raise exception 'Foreign buff delete allowed'; end if;
  begin insert into public.player_loadouts(user_id,class_name)values(target,'Titan'); exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'Foreign loadout insert allowed'; end if;
end $$;
do $$ declare actor record; target uuid := (select id from build_test_users where kind='target'); begin
  for actor in select id from build_test_users where kind in('pending','blocked','removed') loop
    perform set_config('request.jwt.claim.sub',actor.id::text,true);
    if exists(select 1 from public.profiles where id=target) or exists(select 1 from public.player_loadouts where user_id=target) or exists(select 1 from public.buff_presets where user_id=target) then raise exception 'Inactive viewer can read clan builds'; end if;
  end loop;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from build_test_users where kind='target'),true);
do $$ declare affected integer; begin
  if not exists(select 1 from public.buff_presets where user_id=auth.uid() and not is_shared) then raise exception 'Owner lost private buffs'; end if;
  update public.player_loadouts set class_name='Titan' where user_id=auth.uid();get diagnostics affected=row_count;if affected<>1 then raise exception 'Owner cannot edit own loadout';end if;
  update public.buff_presets set title='My edit' where user_id=auth.uid();get diagnostics affected=row_count;if affected<>2 then raise exception 'Owner cannot edit own buffs';end if;
end $$;
set local role anon;
do $$ declare denied boolean := false; begin
  begin perform 1 from public.player_loadouts limit 1; exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'Anonymous loadout access allowed'; end if;
  denied=false;
  begin perform 1 from public.buff_presets limit 1; exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'Anonymous buff access allowed'; end if;
end $$;
rollback;
select 'PASS: approved member reads, private/inactive/anonymous denial, owner-only writes; fixtures rolled back' as result;

begin;
insert into public.owner_release_candidates(id,title,tests_passed,enabled)
values ('dpl_rlsFixtureOnly','RLS fixture',true,true);

select set_config('request.jwt.claim.sub',coalesce((select id::text from public.profiles where role='owner' and status='approved' and removed_at is null limit 1),''),true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.owner_release_candidates where id='dpl_rlsFixtureOnly') <> 1 then raise exception 'Owner cannot read'; end if;
  begin
    insert into public.owner_release_candidates(id,title) values('dpl_denied','Forbidden');
    raise exception 'Owner could register unchecked deployment';
  exception when insufficient_privilege then null; end;
  begin
    update public.owner_release_candidates set enabled=false where id='dpl_rlsFixtureOnly';
    raise exception 'Owner could mutate catalog';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.owner_release_candidates where id='dpl_rlsFixtureOnly';
    raise exception 'Owner could delete catalog';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claim.sub',coalesce((select id::text from public.profiles where role='admin' and status='approved' limit 1),gen_random_uuid()::text),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.owner_release_candidates) then raise exception 'Admin can read owner catalog'; end if;
end $$;
reset role;

select set_config('request.jwt.claim.sub',coalesce((select id::text from public.profiles where role='member' and status='approved' limit 1),gen_random_uuid()::text),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.owner_release_candidates) then raise exception 'Member can read owner catalog'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  begin
    perform 1 from public.owner_release_candidates;
    raise exception 'Anonymous can read owner catalog';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;

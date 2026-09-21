begin;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
create temporary table appearance_test_users(kind text primary key,id uuid default gen_random_uuid());
insert into appearance_test_users(kind) values ('owner'),('viewer'),('blocked');
grant select on appearance_test_users to authenticated;
insert into auth.users(id,raw_user_meta_data)
select id,jsonb_build_object('nickname','appearance_test_'||replace(id::text,'-','')) from appearance_test_users;
update public.profiles p set role='member',status=case when t.kind='blocked' then 'blocked' else 'approved' end
from appearance_test_users t where p.id=t.id;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from appearance_test_users where kind='owner'),true);
insert into public.member_profile_appearance(user_id,ornament,badges) values(auth.uid(),'dragon',array['pvp','raid','poland']);
insert into public.member_profile_appearance(user_id,ornament) values(auth.uid(),'ice')
on conflict (user_id) do update set ornament=excluded.ornament;
do $$ begin
 if not exists(select 1 from public.member_profile_appearance where user_id=auth.uid() and ornament='ice') then raise exception 'Own save/reload failed'; end if;
 begin update public.member_profile_appearance set badges=array['pvp','raid','poland','flag'] where user_id=auth.uid(); raise exception 'Too many badges accepted'; exception when check_violation then null; end;
 begin update public.member_profile_appearance set ornament='not-a-catalog-id' where user_id=auth.uid(); raise exception 'Unknown ornament accepted'; exception when check_violation then null; end;
 begin update public.member_profile_appearance set intensity=101 where user_id=auth.uid(); raise exception 'Invalid intensity accepted'; exception when check_violation then null; end;
 begin update public.member_profile_appearance set user_id=(select id from appearance_test_users where kind='viewer') where user_id=auth.uid(); raise exception 'Ownership transfer accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from appearance_test_users where kind='viewer'),true);
do $$ declare target uuid:=(select id from appearance_test_users where kind='owner'); n integer; begin
 if not exists(select 1 from public.member_profile_appearance where user_id=target) then raise exception 'Clan member cannot read appearance'; end if;
 update public.member_profile_appearance set frame='gold' where user_id=target; get diagnostics n=row_count;
 if n<>0 then raise exception 'Foreign appearance update allowed'; end if;
 begin insert into public.member_profile_appearance(user_id) values(target) on conflict(user_id) do update set ornament='fire'; raise exception 'Foreign appearance upsert allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from appearance_test_users where kind='blocked'),true);
do $$ begin
 if exists(select 1 from public.member_profile_appearance) then raise exception 'Blocked viewer read appearance'; end if;
 begin insert into public.member_profile_appearance(user_id) values(auth.uid()); raise exception 'Blocked user wrote appearance'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
update public.profiles set removed_at=now(),status='blocked' where id=(select id from appearance_test_users where kind='owner');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from appearance_test_users where kind='viewer'),true);
do $$ begin
 if exists(select 1 from public.member_profile_appearance where user_id=(select id from appearance_test_users where kind='owner')) then raise exception 'Removed member appearance visible'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.member_profile_appearance; raise exception 'Anonymous read allowed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: own save/reload, clan read, validation, foreign writes, ownership transfer, blocked/removed/anonymous access; fixtures rolled back' as result;

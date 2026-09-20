begin;
create temporary table avatar_test_users(kind text primary key,id uuid default gen_random_uuid());
insert into avatar_test_users(kind) values ('owner'),('viewer'),('blocked');
grant select on avatar_test_users to authenticated;
insert into auth.users(id,raw_user_meta_data)select id,jsonb_build_object('nickname','avatar_test_'||replace(id::text,'-',''))from avatar_test_users;
update public.profiles p set role='member',status=case when t.kind='blocked' then 'blocked' else 'approved' end from avatar_test_users t where p.id=t.id;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from avatar_test_users where kind='owner'),true);
insert into storage.objects(bucket_id,name)values('member-avatars',auth.uid()::text||'/11111111-1111-4111-8111-111111111111.webp');
update public.profiles set avatar_path=auth.uid()::text||'/11111111-1111-4111-8111-111111111111.webp' where id=auth.uid();
select set_config('request.jwt.claim.sub',(select id::text from avatar_test_users where kind='viewer'),true);
do $$ declare target uuid:=(select id from avatar_test_users where kind='owner');denied boolean:=false;n integer;begin
 if not exists(select 1 from storage.objects where bucket_id='member-avatars' and name=target::text||'/11111111-1111-4111-8111-111111111111.webp')then raise exception 'Clan avatar not readable';end if;
 begin insert into storage.objects(bucket_id,name)values('member-avatars',target::text||'/22222222-2222-4222-8222-222222222222.webp');exception when insufficient_privilege then denied=true;end;if not denied then raise exception 'Foreign folder upload allowed';end if;
 update storage.objects set metadata='{}'::jsonb where bucket_id='member-avatars' and name=target::text||'/11111111-1111-4111-8111-111111111111.webp';get diagnostics n=row_count;if n<>0 then raise exception 'Foreign file update allowed';end if;
 update public.profiles set avatar_path=null where id=target;get diagnostics n=row_count;if n<>0 then raise exception 'Foreign profile avatar edit allowed';end if;
 denied=false;begin update public.profiles set avatar_path=target::text||'/11111111-1111-4111-8111-111111111111.webp' where id=auth.uid();exception when check_violation then denied=true;end;if not denied then raise exception 'Another user image can be assigned';end if;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from avatar_test_users where kind='blocked'),true);
do $$ declare denied boolean:=false;begin
 if exists(select 1 from storage.objects where bucket_id='member-avatars')then raise exception 'Blocked viewer read avatars';end if;
 begin insert into storage.objects(bucket_id,name)values('member-avatars',auth.uid()::text||'/33333333-3333-4333-8333-333333333333.webp');exception when insufficient_privilege then denied=true;end;if not denied then raise exception 'Blocked upload allowed';end if;
end $$;
set local role anon;
do $$ begin if exists(select 1 from storage.objects where bucket_id='member-avatars')then raise exception 'Anonymous read allowed';end if;end $$;
rollback;
select 'PASS: own upload/profile, clan read, foreign writes and blocked/anonymous reads denied; fixtures rolled back' as result;

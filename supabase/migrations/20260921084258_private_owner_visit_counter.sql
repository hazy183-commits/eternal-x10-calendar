create table private.site_visit_totals (
day date primary key,
visits bigint not null default 0 check(visits>=0),
pageviews bigint not null default 0 check(pageviews>=0)
);
alter table private.site_visit_totals enable row level security;
revoke all on private.site_visit_totals from public,anon,authenticated;

create function private.record_site_view(p_new_visit boolean) returns void
language sql security definer set search_path='' as $$
insert into private.site_visit_totals(day,visits,pageviews)
values((now() at time zone 'Europe/Warsaw')::date,case when p_new_visit then 1 else 0 end,1)
on conflict(day) do update set visits=site_visit_totals.visits+excluded.visits,pageviews=site_visit_totals.pageviews+1;
$$;
revoke all on function private.record_site_view(boolean) from public;
grant execute on function private.record_site_view(boolean) to anon,authenticated;

create function public.record_site_view(p_new_visit boolean default false) returns void
language sql security invoker set search_path='' as $$select private.record_site_view(p_new_visit);$$;
revoke all on function public.record_site_view(boolean) from public;
grant execute on function public.record_site_view(boolean) to anon,authenticated;

create function private.get_site_visit_stats() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; today date:=(now() at time zone 'Europe/Warsaw')::date;
begin
if not exists(select 1 from public.profiles where id=auth.uid() and role='owner' and status='approved' and removed_at is null) then
raise exception 'Owner access required' using errcode='42501';
end if;
select jsonb_build_object(
'today_visits',coalesce(sum(visits) filter(where day=today),0),
'today_pageviews',coalesce(sum(pageviews) filter(where day=today),0),
'week_visits',coalesce(sum(visits) filter(where day>=today-6),0),
'week_pageviews',coalesce(sum(pageviews) filter(where day>=today-6),0),
'total_visits',coalesce(sum(visits),0),'total_pageviews',coalesce(sum(pageviews),0),
'started_on',min(day)) into result from private.site_visit_totals;
return result;
end;$$;
revoke all on function private.get_site_visit_stats() from public,anon;
grant execute on function private.get_site_visit_stats() to authenticated;
create function public.get_site_visit_stats() returns jsonb
language sql security invoker set search_path='' as $$select private.get_site_visit_stats();$$;
revoke all on function public.get_site_visit_stats() from public,anon;
grant execute on function public.get_site_visit_stats() to authenticated;

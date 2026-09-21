create or replace function visit_ingest.record_site_view(p_new_visit boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
if exists(select 1 from public.profiles where id=auth.uid() and role='owner') then return; end if;
insert into private.site_visit_totals(day,visits,pageviews)
values((now() at time zone 'Europe/Warsaw')::date,case when p_new_visit then 1 else 0 end,1)
on conflict(day) do update set visits=site_visit_totals.visits+excluded.visits,pageviews=site_visit_totals.pageviews+1;
end;$$;

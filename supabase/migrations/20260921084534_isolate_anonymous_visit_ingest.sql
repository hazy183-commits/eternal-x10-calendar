create schema visit_ingest;
revoke all on schema visit_ingest from public;
grant usage on schema visit_ingest to anon,authenticated;
alter function private.record_site_view(boolean) set schema visit_ingest;
create or replace function public.record_site_view(p_new_visit boolean default false) returns void language sql security invoker set search_path='' as $$select visit_ingest.record_site_view(p_new_visit);$$;

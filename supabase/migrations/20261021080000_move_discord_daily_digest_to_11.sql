-- Move the daily Discord digest from 08:00 to 11:00 Europe/Warsaw.
-- The worker remains polled every five minutes; only its delivery window changes.
do $migration$
declare
  ddl text;
begin
  select pg_get_functiondef('public.process_discord_daily_digest()'::regprocedure)
    into ddl;
  ddl := replace(replace(ddl, '08:00', '11:00'), '08:10', '11:10');
  execute ddl;
end
$migration$;

-- Keep the daily Discord digest at 11:00 during Polish summer time
-- and move it to 10:00 during Polish winter time.
-- The worker is still polled every five minutes; no fixed UTC schedule is used.
do $migration$
declare
  ddl text;
begin
  select pg_get_functiondef('public.process_discord_daily_digest()'::regprocedure)
    into ddl;

  ddl := replace(
    ddl,
    '  local_now timestamp;',
    '  local_now timestamp;
  digest_time time;'
  );

  ddl := replace(
    ddl,
    '  local_now := now() at time zone ''Europe/Warsaw'';',
    '  local_now := now() at time zone ''Europe/Warsaw'';
  digest_time := case
    when local_now - (now() at time zone ''UTC'') = interval ''2 hours''
      then time ''11:00''
    else time ''10:00''
  end;'
  );

  ddl := replace(
    ddl,
    '  if local_now::time < time ''11:00''
     or local_now::time >= time ''11:10'' then',
    '  if local_now::time < digest_time
     or local_now::time >= digest_time + interval ''10 minutes'' then'
  );

  ddl := replace(
    ddl,
    '  digest_start := (report_date + time ''11:00'') at time zone ''Europe/Warsaw'';',
    '  digest_start := (report_date + digest_time) at time zone ''Europe/Warsaw'';'
  );

  ddl := replace(
    ddl,
    '''📅 Wydarzenia od 08:00 do 08:00''',
    '''📅 PLAN DNIA — NAJBLIŻSZE 24 GODZINY'''
  );

  if position('digest_time time;' in ddl) = 0
     or position('digest_start := (report_date + digest_time)' in ddl) = 0
     or position('local_now::time < digest_time' in ddl) = 0 then
    raise exception 'Nie udało się bezpiecznie zaktualizować harmonogramu Discord — sprawdź definicję process_discord_daily_digest().';
  end if;

  execute ddl;
end
$migration$;

-- Add attendance for generated calendar occurrences, preserving existing event IDs and RLS.
alter table public.event_signups add column schedule_key text;
alter table public.event_signups alter column event_id drop not null;
alter table public.event_signups add constraint event_signups_one_source check (
 (event_id is not null and schedule_key is null) or
 (event_id is null and schedule_key is not null and length(schedule_key) between 1 and 200
  and schedule_key ~ '^(boss-respawn-|siege-schedule-|clan-hall-|olympiad-)')
);
alter table public.event_signups add constraint event_signups_schedule_user_key unique(schedule_key,user_id);

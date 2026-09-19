alter table public.buff_presets
  drop constraint if exists buff_presets_buffs_check;

alter table public.buff_presets
  add constraint buff_presets_buffs_check
  check (
    jsonb_typeof(buffs) = 'array'
    and jsonb_array_length(buffs) between 1 and 26
  );

comment on table public.buff_presets is
  'User-owned buff presets: up to 24 slot buffs plus slot-free Malaria and Flu; shared rows are readable by authenticated clan members.';

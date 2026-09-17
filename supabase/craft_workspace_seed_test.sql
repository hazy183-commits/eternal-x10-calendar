-- Technical seed used only while the craft planner is developed on staging.
-- These records are intentionally prefixed with [TEST] and can be removed before production rollout.

insert into public.craft_items (item_key, name, grade, category, stackable, acquisition_notes)
values
  ('test_weapon','[TEST] Broń testowa','S','weapon',false,'Dane techniczne do testów planera.'),
  ('test_blade','[TEST] Blade','S','component',true,'Dane techniczne do testów planera.'),
  ('test_alloy','[TEST] Alloy',null,'material',true,'Dane techniczne do testów planera.'),
  ('test_ore','[TEST] Ore',null,'material',true,'Dane techniczne do testów planera.'),
  ('test_coke','[TEST] Coke',null,'material',true,'Dane techniczne do testów planera.')
on conflict (item_key) do nothing;

begin;

with weapon_recipes(item_key, recipe_item_id) as (values
  ('weapon_a_barakiels_axe',8694),
  ('weapon_a_behemoths_tuning_fork',8696),
  ('weapon_a_blood_tornado',5452),
  ('weapon_a_bloody_orchid',5446),
  ('weapon_a_branch_of_the_mother_tree',5462),
  ('weapon_a_cabrios_hand',8708),
  ('weapon_a_carnage_bow',5444),
  ('weapon_a_daimon_crystal',8710),
  ('weapon_a_dark_legions_edge',5464),
  ('weapon_a_dasparions_staff',5460),
  ('weapon_a_destroyer_hammer',8487),
  ('weapon_a_doom_crusher',8326),
  ('weapon_a_dragon_grinder',5450),
  ('weapon_a_dragon_slayer',5434),
  ('weapon_a_elemental_sword',5468),
  ('weapon_a_elysian',5440),
  ('weapon_a_flaming_dragon_skull',8316),
  ('weapon_a_halberd',5458),
  ('weapon_a_infernal_master',8300),
  ('weapon_a_meteor_shower',5438),
  ('weapon_a_naga_storm',8698),
  ('weapon_a_shyeeds_bow',8702),
  ('weapon_a_sirras_blade',8690),
  ('weapon_a_sobekks_hurricane',8704),
  ('weapon_a_soul_bow',5442),
  ('weapon_a_soul_separator',5448),
  ('weapon_a_spiritual_eye',8314),
  ('weapon_a_sword_of_ipos',8692),
  ('weapon_a_sword_of_miracles',5466),
  ('weapon_a_tallum_blade',5470),
  ('weapon_a_tallum_glaive',5456),
  ('weapon_a_themis_tongue',8706),
  ('weapon_a_tiphons_spear',8700),
  ('weapon_s_angel_slayer',6887),
  ('weapon_s_arcana_mace',6899),
  ('weapon_s_basalt_battlehammer',6883),
  ('weapon_s_demon_splinter',6895),
  ('weapon_s_draconic_bow',7580),
  ('weapon_s_dragon_hunter_axe',6891),
  ('weapon_s_forgotten_blade',6881),
  ('weapon_s_heavens_divider',6897),
  ('weapon_s_imperial_staff',6885),
  ('weapon_s_saint_spear',6893)
)
insert into craft_items (item_key,game_item_id,name,grade,category,stackable,active,updated_at)
select 'recipe_' || source.recipe_item_id,
       source.recipe_item_id,
       'Recipe: ' || weapon.name || ' (60%)',
       weapon.grade,
       'recipe',
       true,
       true,
       now()
from weapon_recipes source
join craft_items weapon on weapon.item_key=source.item_key and weapon.category='weapon'
on conflict (item_key) do update set
  game_item_id=excluded.game_item_id,
  name=excluded.name,
  grade=excluded.grade,
  category='recipe',
  stackable=true,
  active=true,
  updated_at=now();

with weapon_recipes(item_key, recipe_item_id) as (values
  ('weapon_a_barakiels_axe',8694),('weapon_a_behemoths_tuning_fork',8696),('weapon_a_blood_tornado',5452),
  ('weapon_a_bloody_orchid',5446),('weapon_a_branch_of_the_mother_tree',5462),('weapon_a_cabrios_hand',8708),
  ('weapon_a_carnage_bow',5444),('weapon_a_daimon_crystal',8710),('weapon_a_dark_legions_edge',5464),
  ('weapon_a_dasparions_staff',5460),('weapon_a_destroyer_hammer',8487),('weapon_a_doom_crusher',8326),
  ('weapon_a_dragon_grinder',5450),('weapon_a_dragon_slayer',5434),('weapon_a_elemental_sword',5468),
  ('weapon_a_elysian',5440),('weapon_a_flaming_dragon_skull',8316),('weapon_a_halberd',5458),
  ('weapon_a_infernal_master',8300),('weapon_a_meteor_shower',5438),('weapon_a_naga_storm',8698),
  ('weapon_a_shyeeds_bow',8702),('weapon_a_sirras_blade',8690),('weapon_a_sobekks_hurricane',8704),
  ('weapon_a_soul_bow',5442),('weapon_a_soul_separator',5448),('weapon_a_spiritual_eye',8314),
  ('weapon_a_sword_of_ipos',8692),('weapon_a_sword_of_miracles',5466),('weapon_a_tallum_blade',5470),
  ('weapon_a_tallum_glaive',5456),('weapon_a_themis_tongue',8706),('weapon_a_tiphons_spear',8700),
  ('weapon_s_angel_slayer',6887),('weapon_s_arcana_mace',6899),('weapon_s_basalt_battlehammer',6883),
  ('weapon_s_demon_splinter',6895),('weapon_s_draconic_bow',7580),('weapon_s_dragon_hunter_axe',6891),
  ('weapon_s_forgotten_blade',6881),('weapon_s_heavens_divider',6897),('weapon_s_imperial_staff',6885),
  ('weapon_s_saint_spear',6893)
)
insert into craft_recipe_components (recipe_id,component_item_key,quantity)
select recipe.id, 'recipe_' || source.recipe_item_id, 1
from weapon_recipes source
join craft_recipes recipe on recipe.output_item_key=source.item_key and recipe.active=true and recipe.is_primary=true
on conflict (recipe_id,component_item_key) do update set quantity=excluded.quantity;

commit;

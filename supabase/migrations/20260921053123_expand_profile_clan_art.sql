-- Extend only cosmetic catalog allowlists; preserve all existing choices and policies.
alter table public.member_profile_appearance
  drop constraint member_profile_appearance_background_check,
  add constraint member_profile_appearance_background_check check (background in (
    'aden','giran','polska','rune','goddard','innadril','clan','none',
    'eagle-citadel','siege-night','polish-forest','interlude-magic'
  )),
  drop constraint member_profile_appearance_ornament_check,
  add constraint member_profile_appearance_ornament_check check (ornament in (
    'dragon','fire','horns','ice','arcane','swords','none',
    'eagle','ribbons','clan-crest','hussar','aden-guard','soulshot'
  ));

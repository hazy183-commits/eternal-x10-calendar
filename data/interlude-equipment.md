# Subclass equipment catalog

`interlude-equipment.json` is a static Interlude catalog; no third-party API is called by the browser.

- Base A/S weapons use the existing craft catalog, plus dual swords 5704, 5705, 5706, 8938 and 6580. All 43 non-dual weapons have three SA variants; dual bonuses activate at +4, with no Soul Crystal selection.
- Item names and icon filenames were checked using `https://l2api.dev/api/interlude/items/{id}`. SA variants use the obtainable C4–Interlude item IDs (5596 onward), excluding obsolete pre-C4 alternatives still present in some datapacks. Dasparion's Staff variants 5596–5598 are included explicitly because the API omits their relationship to base item 212.
- Armor icons use unsealed chest IDs. All 15 A/S sets and the previously supported Blue Wolf Light set are included. Shadow items are excluded.
- Jewelry includes unsealed Tateossian and all eight Interlude epic items, restricted to their actual neck/ear/finger slots.
- Augmentation skill IDs and levels come from `Hl4p3x/L2JServer_C6_Interlude` master, `dist/game/data/stats/augmentation/augmentation_skillmap.xml`; names, descriptions and active/passive/chance categories come from the corresponding skill XML files (3000–3399). Only mapped augmentation skills are included. Music 3206 is classified as active per its description (the emulator marks its unfinished implementation passive).

The JSON stores source URLs. Existing legacy equipment is retained until a user replaces its fields. New jewelry is stored in `equipment.jewelry` with independent item IDs and enchants; readable legacy summary fields remain available.

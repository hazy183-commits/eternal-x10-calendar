export const BOSS_PRESETS = Object.freeze({
  'Queen Ant': Object.freeze({ slug: 'queen-ant', location: 'Queen Ant Nest', type: 'RB' }),
  Core: Object.freeze({ slug: 'core', location: 'Core Chamber', type: 'RB' }),
  Orfen: Object.freeze({ slug: 'orfen', location: 'Sea of Spores', type: 'RB' }),
  Baium: Object.freeze({ slug: 'baium', location: "Baium's Tower", type: 'Epic RB' }),
  Zaken: Object.freeze({ slug: 'zaken', location: "Devil's Isle", type: 'RB' }),
  Frintezza: Object.freeze({ slug: 'frintezza', location: "Frintezza's Hall", type: 'Epic RB' }),
  Antharas: Object.freeze({ slug: 'antharas', location: "Antharas' Lair", type: 'Epic RB' }),
  Valakas: Object.freeze({ slug: 'valakas', location: "Valakas' Lair", type: 'Epic RB' }),
});

export const BOSS_NAMES = [...Object.keys(BOSS_PRESETS), 'Brak grafiki'];

export function presetForBoss(name = '') {
  return BOSS_PRESETS[name] || null;
}

export function defaultDurationForType(type = '') {
  return ({
    RB: 30,
    'Epic RB': 60,
    Siege: 120,
    Olympiad: 60,
    Event: 60,
  })[type] ?? 60;
}

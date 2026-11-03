// ============================================================
// src/world/data/monsters.js — definisi monster (data-driven).
// Sprite mengacu ke id di public/assets/sprites/manifest.json.
//
// element: lihat data/elements.js.
// level: skala stat = hp * (1+0.15*(lv-1)), dmg * (1+0.12*(lv-1)).
// area: zona habitat (untuk filter/quest nanti).
// atkStyle: 'contact' (sangat dekat) | 'melee' (dekat) | 'ranged' (jauh).
//   - contact/melee: atkRange = jarak pukul (px).
//   - ranged: fireRange = jarak tembak, keepDist = jaga jarak, projSpeed.
// drops: [{ item, rate }] — rate = % peluang jatuh per kill
// (roll independen per item). ATURAN: tiap item drop EKSKLUSIF milik
// satu monster (tidak dibagi antar monster berbeda).
// ============================================================

export const MONSTERS = {
  'goblin-hutan': {
    id: 'goblin-hutan',
    name: 'Goblin Hutan',
    sprite: 'goblin-hutan',
    element: 'bumi', level: 1, area: 'Hutan Pinggiran',
    atkStyle: 'melee',
    hp: 30, dmg: 6,
    speed: 42, chaseSpeed: 72,
    aggroR: 130, atkRange: 40, atkCd: 1.0,
    goldMin: 5, goldMax: 10,
    drops: [
      { item: 'tangan-goblin', rate: 35 },
      { item: 'apel-hutan', rate: 12 },
      { item: 'topi-goblin', rate: 5 },
      { item: 'pentungan-goblin', rate: 6 },
      { item: 'jimat-goblin', rate: 2 },
    ],
    desc: 'Goblin usil penghuni hutan Joseon. Lemah tapi berani berkerumun.',
  },
  'laba-laba-hutan': {
    id: 'laba-laba-hutan',
    name: 'Laba-laba Hutan',
    sprite: 'monster-laba-laba-hutan',
    element: 'bumi', level: 2, area: 'Hutan Pinggiran',
    atkStyle: 'contact',
    hp: 26, dmg: 7,
    speed: 55, chaseSpeed: 85,
    aggroR: 140, atkRange: 26, atkCd: 1.0,
    goldMin: 6, goldMax: 11,
    drops: [
      { item: 'kaki-laba-laba', rate: 32 },
      { item: 'jaring-laba-laba', rate: 22 },
      { item: 'taring-laba-laba', rate: 8 },
      { item: 'racun-laba-laba', rate: 3 },
      { item: 'karapas-laba-laba', rate: 1.5 },
    ],
    desc: 'Laba-laba raksasa berlumut. Menyergap dari sangat dekat dengan taring beracun.',
  },
  'serigala-hutan': {
    id: 'serigala-hutan',
    name: 'Serigala Hutan',
    sprite: 'monster-serigala-hutan',
    element: 'angin', level: 2, area: 'Hutan Pinggiran',
    atkStyle: 'contact',
    hp: 22, dmg: 8,
    speed: 60, chaseSpeed: 95,
    aggroR: 150, atkRange: 26, atkCd: 0.9,
    goldMin: 6, goldMax: 12,
    drops: [
      { item: 'bulu-serigala', rate: 30 },
      { item: 'taring-serigala', rate: 25 },
      { item: 'kalung-taring', rate: 3 },
      { item: 'taring-alpha', rate: 0.5 },
    ],
    desc: 'Pemburu cepat. Menerjang dari sangat dekat, gigitannya dalam.',
  },
  'jamur-raksasa': {
    id: 'jamur-raksasa',
    name: 'Jamur Raksasa',
    sprite: 'monster-jamur-raksasa',
    element: 'air', level: 3, area: 'Hutan Dalam',
    atkStyle: 'ranged',
    hp: 55, dmg: 4,
    speed: 28, chaseSpeed: 50,
    aggroR: 190, atkCd: 1.6,
    fireRange: 185, keepDist: 110, projSpeed: 170,
    goldMin: 8, goldMax: 14,
    drops: [
      { item: 'spora-jamur', rate: 30 },
      { item: 'jamur-biru', rate: 12 },
      { item: 'tudung-spora', rate: 2 },
    ],
    desc: 'Jamur tua yang hidup. Menyemburkan spora dari kejauhan.',
  },
};

export function getMonsterDef(id) {
  return MONSTERS[id] || null;
}

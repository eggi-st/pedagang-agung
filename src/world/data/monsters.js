// ============================================================
// src/world/data/monsters.js — definisi monster (data-driven).
// Sprite: 'lpc' = nama sheet LPC di public/assets/sprites/lpc/<nama>.png
// (diputar via src/world/lpc.js); 'sprite' = fallback id manifest bila
// sheet LPC gagal dimuat.
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
  'orc-hutan': {
    id: 'orc-hutan',
    name: 'Orc Hutan',
    sprite: 'goblin-hutan', // fallback bila sheet LPC gagal dimuat
    lpc: 'orc-hutan', // sheet LPC: public/assets/sprites/lpc/orc-hutan.png
    element: 'bumi', level: 2, area: 'Hutan Pinggiran',
    atkStyle: 'contact',
    hp: 26, dmg: 7,
    speed: 55, chaseSpeed: 85,
    aggroR: 140, atkRange: 26, atkCd: 1.0,
    goldMin: 6, goldMax: 11,
    drops: [
      { item: 'kulit-orc', rate: 32 },
      { item: 'taring-orc', rate: 22 },
      { item: 'cakar-orc', rate: 8 },
      { item: 'darah-orc', rate: 3 },
      { item: 'baju-perang-orc', rate: 1.5 },
    ],
    desc: 'Orc brutal penghuni hutan. Menyerang dari sangat dekat dengan cakar dan taring.',
  },
  'skeleton-liar': {
    id: 'skeleton-liar',
    name: 'Skeleton Liar',
    sprite: 'goblin-hutan', // fallback bila sheet LPC gagal dimuat
    lpc: 'skeleton-liar', // sheet LPC: public/assets/sprites/lpc/skeleton-liar.png
    element: 'angin', level: 2, area: 'Hutan Pinggiran',
    atkStyle: 'contact',
    hp: 22, dmg: 8,
    speed: 60, chaseSpeed: 95,
    aggroR: 150, atkRange: 26, atkCd: 0.9,
    goldMin: 6, goldMax: 12,
    drops: [
      { item: 'tulang-belulang', rate: 30 },
      { item: 'tengkorak-retak', rate: 25 },
      { item: 'kalung-tengkorak', rate: 3 },
      { item: 'tengkorak-raja', rate: 0.5 },
    ],
    desc: 'Kerangka hidup yang bergerak secepat angin. Serangannya menusuk dari dekat.',
  },
  'troll-rawa': {
    id: 'troll-rawa',
    name: 'Troll Rawa',
    sprite: 'goblin-hutan', // fallback bila sheet LPC gagal dimuat
    lpc: 'troll-rawa', // sheet LPC: public/assets/sprites/lpc/troll-rawa.png
    element: 'air', level: 3, area: 'Hutan Dalam',
    atkStyle: 'ranged',
    hp: 55, dmg: 4,
    speed: 28, chaseSpeed: 50,
    aggroR: 190, atkCd: 1.6,
    fireRange: 185, keepDist: 110, projSpeed: 170,
    goldMin: 8, goldMax: 14,
    drops: [
      { item: 'lendir-troll', rate: 30 },
      { item: 'batu-rawa', rate: 12 },
      { item: 'kulit-troll', rate: 2 },
    ],
    desc: 'Troll rawa yang besar. Melempar batu dari kejauhan.',
  },
};

export function getMonsterDef(id) {
  return MONSTERS[id] || null;
}

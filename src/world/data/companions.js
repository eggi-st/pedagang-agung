// ============================================================
// src/world/data/companions.js — definisi kelas pendamping (data-driven).
// Dipakai Tahap 3 (sistem rekrut & party). role menentukan AI:
// 'dealer' = ikut menyerang, 'healer' = memulihkan HP pemain,
// 'ranged' = menyerang dari jarak jauh.
// ============================================================

export const COMPANIONS = {
  'pendekar': {
    id: 'pendekar',
    name: 'Pendekar',
    sprite: 'companion-pendekar',
    role: 'dealer',
    hp: 80, dmg: 8,
    hireCost: 150,
    desc: 'Pendekar muda Joseon. Setia, berani, tebasannya mantap.',
  },
  'tabib': {
    id: 'tabib',
    name: 'Tabib',
    sprite: 'companion-tabib',
    role: 'healer',
    hp: 60, dmg: 4, heal: 12,
    hireCost: 150,
    desc: 'Tabib hanbok merah muda. Menyembuhkan luka dengan ramuan.',
  },
  'pemanah': {
    id: 'pemanah',
    name: 'Pemanah',
    sprite: 'companion-pemanah',
    role: 'ranged',
    hp: 65, dmg: 7, range: 160,
    hireCost: 150,
    desc: 'Pemburu akurat. Panahnya jarang meleset.',
  },
};

export function getCompanionDef(id) {
  return COMPANIONS[id] || null;
}

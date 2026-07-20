// ENTRY POINT — status: kerangka minimal, BUKAN game lengkap.
//
// File ini membuktikan struktur modul (import/export ES modules) berhasil
// di-resolve dan di-build oleh Vite. Logic permainan sesungguhnya (battle,
// render tab, save/load, dst) MASIH ada di ../original-reference.html
// dan belum dipindah kemari.
//
// LANGKAH SELANJUTNYA (Fase 2-3 di rencana-migrasi-claude-code.md):
//   1. Baca original-reference.html di root proyek ini.
//   2. Pindahkan fungsi-fungsi logic (battleAttack, buy, sell, travel,
//      startBattle, dst) ke src/systems/*.js sesuai kategori masing-masing
//      (lihat komentar TODO di tiap file src/systems/ kalau sudah dibuat).
//   3. Pindahkan fungsi render (render(), renderBattle(), renderPeta(), dst)
//      ke src/ui/*.js.
//   4. Import semuanya di sini dan panggil initGame() saat DOMContentLoaded.

import { GOODS, WEAPONS, ARMORS, FACTORY_RECIPES } from './data/economy.js';
import { CITIES, CITY_LEVEL_RANGE, CITY_ICON } from './data/world.js';
import { ELEMENTS, elementMultiplier } from './data/elements.js';
import { MERC_NAMES, RANK_NAMES, MAX_GENERALS } from './data/mercenaries/index.js';
import { MONSTERS, DUNGEON_MONSTERS } from './data/monsters.js';
import { RARITY_ORDER, ITEM_TYPE_NAMES } from './data/items.js';
import { CLASSES, CLASS_TRANSFORMS } from './data/classes.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { paintAllSprites, spriteCanvasHTML } from './ui/sprites.js';
import { sfx, haptic } from './audio/sfx.js';
import { playMusic } from './audio/music.js';

// Sanity check di console — hapus setelah Fase 2 selesai.
console.log('[Pedagang Agung] Data modules loaded:', {
  goods: GOODS.length,
  weapons: WEAPONS.length,
  armors: ARMORS.length,
  cities: CITIES.length,
  elements: ELEMENTS,
  merc_names: MERC_NAMES.length,
  monsters: MONSTERS.length + DUNGEON_MONSTERS.length,
  rarity_order: RARITY_ORDER,
  classes: Object.keys(CLASSES),
  achievements: ACHIEVEMENTS.length,
});

document.getElementById('continue-slot').innerHTML =
  '<div style="font-size:8px; color:var(--dim); padding:8px;">' +
  '⚠️ Migrasi belum selesai — game logic masih di original-reference.html. ' +
  'Lihat komentar di src/main.js untuk langkah selanjutnya.</div>';

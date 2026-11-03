// ============================================================
// src/world/map-dungeon.js — interior "Gua Latihan" (dungeon Joseon).
// 40 x 30 tile. Ruang masuk (tangga) → koridor → ruang utama.
// Deterministik (seed tetap).
// ============================================================

import { TILE } from './tiles.js';

export const DUN_W = 40;
export const DUN_H = 30;

export function buildDungeon() {
  const map = [];
  for (let y = 0; y < DUN_H; y++) {
    map.push(new Array(DUN_W).fill(TILE.DUNGEON_WALL));
  }
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < DUN_W && y < DUN_H) map[y][x] = t; };
  const rect = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };
  const F = TILE.DUNGEON_FLOOR;

  // Ruang masuk (selatan) + tangga.
  rect(16, 23, 23, 28, F);
  const stairs = { tx: 19, ty: 26 };
  set(stairs.tx, stairs.ty, TILE.STAIRS);
  // Koridor ke utara.
  rect(18, 12, 21, 22, F);
  // Ruang utama (utara) + peti harta.
  rect(11, 4, 28, 11, F);
  const chest = { tx: 19, ty: 5 };
  set(chest.tx, chest.ty, TILE.CHEST);
  // Pilar hiasan.
  set(14, 7, TILE.DUNGEON_WALL); set(24, 7, TILE.DUNGEON_WALL);

  return {
    map,
    // spawn pemain: di tangga masuk
    entrance: { x: (stairs.tx + 0.5) * 32, y: (stairs.ty + 0.5) * 32 },
    stairs,
    chest,
    monsterSpawns: [
      { x: 19.5 * 32, y: 24.5 * 32, def: 'goblin-hutan' },
      { x: 21.5 * 32, y: 26.5 * 32, def: 'laba-laba-hutan' },
      { x: 16.5 * 32, y: 7.5 * 32, def: 'serigala-hutan' },
      { x: 23.5 * 32, y: 8.5 * 32, def: 'jamur-raksasa' },
    ],
  };
}

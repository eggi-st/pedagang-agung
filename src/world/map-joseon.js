// ============================================================
// src/world/map-joseon.js — peta demo Joseon untuk Fase 0.
//
// 64 x 44 tile. Dibangun prosedural deterministik (seed tetap) supaya
// setiap build/dev-server menampilkan peta yang sama.
// Isi: kota Hanseong (barat laut), jalan setapak ke tenggara,
// mulut gua dungeon + papan "Dalam Pembangunan" (GDD R11).
// ============================================================

import { TILE } from './tiles.js';

export const MAP_W = 64;
export const MAP_H = 44;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildJoseonMap() {
  const rand = mulberry32(20261102);
  const map = [];
  for (let y = 0; y < MAP_H; y++) {
    map.push(new Array(MAP_W).fill(TILE.GRASS));
  }
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) map[y][x] = t; };
  const rect = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };

  // Perbatasan: gunung 2 lapis.
  for (let x = 0; x < MAP_W; x++) {
    for (let y = 0; y < 2; y++) { set(x, y, TILE.MOUNTAIN); set(x, MAP_H - 1 - y, TILE.MOUNTAIN); }
  }
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < 2; x++) { set(x, y, TILE.MOUNTAIN); set(MAP_W - 1 - x, y, TILE.MOUNTAIN); }
  }

  // Sungai di sisi timur (dengan 1 jembatan tanah).
  for (let y = 2; y < MAP_H - 2; y++) set(MAP_W - 8, y, TILE.WATER);
  for (let y = 2; y < MAP_H - 2; y++) set(MAP_W - 7, y, TILE.WATER);
  set(MAP_W - 8, 24, TILE.PATH); set(MAP_W - 7, 24, TILE.PATH); // jembatan

  // ---- Kota Hanseong (barat laut) ----
  const cx0 = 6, cy0 = 6, cx1 = 19, cy1 = 15;
  rect(cx0, cy0, cx1, cy1, TILE.CITY);
  // Pagar keliling, gerbang di sisi selatan (tengah).
  for (let x = cx0; x <= cx1; x++) { set(x, cy0, TILE.WALL); set(x, cy1, TILE.WALL); }
  for (let y = cy0; y <= cy1; y++) { set(cx0, y, TILE.WALL); set(cx1, y, TILE.WALL); }
  const gateX = 12;
  set(gateX, cy1, TILE.GATE);
  // Bangunan hanok di dalam kota.
  rect(8, 8, 10, 9, TILE.ROOF);
  rect(14, 8, 17, 9, TILE.ROOF);
  rect(8, 12, 10, 13, TILE.ROOF);
  rect(15, 12, 17, 13, TILE.ROOF);

  // ---- Jalan setapak: gerbang → selatan → timur → gua ----
  const path = [];
  for (let y = cy1 + 1; y <= 26; y++) path.push([gateX, y]);
  for (let x = gateX + 1; x <= 40; x++) path.push([x, 26]);
  for (let y = 26; y <= 33; y++) path.push([40, y]);
  for (const [x, y] of path) set(x, y, TILE.PATH);

  // ---- Gua dungeon (tenggara), dikelilingi gunung ----
  const caveX = 42, caveY = 34;
  rect(40, 32, 46, 36, TILE.MOUNTAIN);
  set(caveX, caveY, TILE.CAVE);
  // Ukir jalan menembus gunung sampai depan mulut gua.
  set(40, 32, TILE.PATH); set(40, 33, TILE.PATH);
  set(41, 33, TILE.PATH); set(41, 34, TILE.PATH);

  // Pohon & bunga acak (tidak di jalan/kota/gua).
  for (let i = 0; i < 260; i++) {
    const x = 2 + ((rand() * (MAP_W - 4)) | 0);
    const y = 2 + ((rand() * (MAP_H - 4)) | 0);
    if (map[y][x] !== TILE.GRASS) continue;
    const r = rand();
    if (r < 0.55) set(x, y, TILE.TREE);
    else if (r < 0.7) set(x, y, TILE.FLOWER);
  }

  return {
    map,
    // spawn: di jalan tepat di luar gerbang kota
    spawn: { x: (gateX + 0.5) * 32, y: (cy1 + 2.5) * 32 },
    cityGate: { tx: gateX, ty: cy1, name: 'Hanseong' },
    cave: { tx: caveX, ty: caveY },
    // Titik kembali dari dungeon: di jalan depan mulut gua.
    caveReturn: { x: 41.5 * 32, y: 34.5 * 32 },
  };
}

// ============================================================
// src/world/tiles.js — definisi tile, painter prosedural, utilitas peta.
// Fase 0 rebuild: dunia jalan-bebas.
//
// Tile digambar prosedural di offscreen canvas 32x32 (TILE_SIZE).
// Modul ini DOM-free saat import (aman untuk unit test); painter
// hanya jalan saat paintTiles() dipanggil dari browser.
// ============================================================

export const TILE_SIZE = 32;

export const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  MOUNTAIN: 4,
  CITY: 5,    // lantai kota (bisa jalan)
  ROOF: 6,    // bangunan hanok (halangan)
  WALL: 7,    // pagar kota (halangan)
  GATE: 8,    // gerbang kota (bisa jalan → pemicu prompt masuk kota)
  CAVE: 9,    // mulut gua dungeon (halangan; didekatnya ada SIGN)
  SIGN: 10,   // papan tanda (halangan)
  FLOWER: 11,
  DUNGEON_FLOOR: 12, // lantai gua (bisa jalan)
  DUNGEON_WALL: 13,  // dinding gua (halangan)
  STAIRS: 14,        // tangga masuk/keluar dungeon (bisa jalan)
  CHEST: 15,         // peti harta (halangan; interaksi via E)
  CHEST_OPEN: 16,    // peti yang sudah dibuka (halangan)
};

const WALKABLE = new Set([TILE.GRASS, TILE.PATH, TILE.CITY, TILE.GATE, TILE.FLOWER,
  TILE.DUNGEON_FLOOR, TILE.STAIRS]);

export function isWalkable(t) {
  return WALKABLE.has(t);
}

// Ambil tile pada koordinat tile (tx, ty). Di luar peta = MOUNTAIN (halangan).
export function tileAt(map, tx, ty) {
  if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return TILE.MOUNTAIN;
  return map[ty][tx];
}

// Cek apakah pixel (px, py) bisa dipijak.
export function walkableAt(map, px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return isWalkable(tileAt(map, tx, ty));
}

// RNG kecil deterministik untuk variasi visual tile.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = TILE_SIZE; c.height = TILE_SIZE;
  return [c, c.getContext('2d')];
}

function speckle(ctx, rand, n, colors, y0 = 0, y1 = TILE_SIZE) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[(rand() * colors.length) | 0];
    ctx.fillRect((rand() * TILE_SIZE) | 0, y0 + ((rand() * (y1 - y0)) | 0), 2, 2);
  }
}

// Gambar semua tile prosedural. Kembalikan array canvas per TILE_*.
export function paintTiles() {
  const out = [];
  const rand = mulberry32(20261102);

  // GRASS — hijau-biru khas Joseon
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#5da24f'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#549645'; x.fillRect(0, 0, 32, 4);
    speckle(x, rand, 14, ['#4c8a3e', '#6cb45e', '#549645']);
    out[TILE.GRASS] = c;
  }
  // PATH — tanah
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#c9a86a'; x.fillRect(0, 0, 32, 32);
    speckle(x, rand, 16, ['#b8975c', '#d8bc80', '#a98850']);
    out[TILE.PATH] = c;
  }
  // WATER
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#3f7fbf'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#5b9bd5';
    for (let i = 0; i < 3; i++) {
      const y = 6 + i * 10 + ((rand() * 4) | 0);
      x.fillRect(4 + ((rand() * 8) | 0), y, 12, 2);
    }
    speckle(x, rand, 6, ['#3570aa']);
    out[TILE.WATER] = c;
  }
  // TREE — atas rumput + tajuk + batang
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.GRASS], 0, 0);
    x.fillStyle = '#6b4a2f'; x.fillRect(14, 20, 4, 12);
    x.fillStyle = '#2e7d32';
    x.fillRect(8, 8, 16, 14); x.fillRect(11, 4, 10, 8);
    x.fillStyle = '#388e3c'; x.fillRect(10, 10, 8, 6);
    speckle(x, rand, 8, ['#1b5e20', '#43a047'], 4, 22);
    out[TILE.TREE] = c;
  }
  // MOUNTAIN — abu-biru
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#6e7f8d'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#5a6b78';
    x.beginPath(); x.moveTo(0, 32); x.lineTo(16, 6); x.lineTo(32, 32); x.closePath(); x.fill();
    x.fillStyle = '#e8eef2';
    x.beginPath(); x.moveTo(16, 6); x.lineTo(22, 18); x.lineTo(10, 18); x.closePath(); x.fill();
    speckle(x, rand, 8, ['#4e5f6b']);
    out[TILE.MOUNTAIN] = c;
  }
  // CITY — lantai batu kota
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#9a9a92'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#8a8a82';
    x.fillRect(0, 15, 32, 2); x.fillRect(15, 0, 2, 32);
    speckle(x, rand, 8, ['#a8a8a0', '#7e7e76']);
    out[TILE.CITY] = c;
  }
  // ROOF — atap hanok (aksen merah khas Joseon)
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.CITY], 0, 0);
    x.fillStyle = '#3d4c5c'; x.fillRect(2, 6, 28, 18);
    x.fillStyle = '#c0392b'; x.fillRect(2, 6, 28, 4);          // bubungan merah
    x.fillStyle = '#2c3844';
    for (let i = 0; i < 4; i++) x.fillRect(4 + i * 7, 10, 3, 14);
    x.fillStyle = '#d4a017'; x.fillRect(13, 12, 6, 8);          // jendela
    out[TILE.ROOF] = c;
  }
  // WALL — pagar kayu kota
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.GRASS], 0, 0);
    x.fillStyle = '#7a5a38'; x.fillRect(0, 10, 32, 14);
    x.fillStyle = '#5e4429';
    for (let i = 0; i < 8; i++) x.fillRect(i * 4, 10, 2, 14);
    x.fillStyle = '#4a3520'; x.fillRect(0, 8, 32, 4);
    out[TILE.WALL] = c;
  }
  // GATE — gerbang (lantai + pilar merah)
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.CITY], 0, 0);
    x.fillStyle = '#c0392b'; x.fillRect(2, 4, 5, 24); x.fillRect(25, 4, 5, 24);
    x.fillStyle = '#3d4c5c'; x.fillRect(0, 0, 32, 5);
    out[TILE.GATE] = c;
  }
  // CAVE — mulut gua gelap di gunung
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.MOUNTAIN], 0, 0);
    x.fillStyle = '#14181d';
    x.beginPath(); x.ellipse(16, 20, 10, 9, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#05070a';
    x.beginPath(); x.ellipse(16, 21, 7, 6, 0, 0, Math.PI * 2); x.fill();
    out[TILE.CAVE] = c;
  }
  // SIGN — papan tanda kayu
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.GRASS], 0, 0);
    x.fillStyle = '#6b4a2f'; x.fillRect(14, 14, 4, 18);
    x.fillStyle = '#8a6238'; x.fillRect(6, 4, 20, 12);
    x.fillStyle = '#5e4429'; x.fillRect(6, 4, 20, 2);
    out[TILE.SIGN] = c;
  }
  // FLOWER — rumput + bunga
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.GRASS], 0, 0);
    const cols = ['#f5f5f5', '#f8bbd0', '#fff59d'];
    for (let i = 0; i < 5; i++) {
      x.fillStyle = cols[(rand() * cols.length) | 0];
      x.fillRect(4 + ((rand() * 24) | 0), 4 + ((rand() * 24) | 0), 3, 3);
    }
    out[TILE.FLOWER] = c;
  }
  // DUNGEON_FLOOR — batu gelap
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#4a4a55'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#3f3f49';
    x.fillRect(0, 15, 32, 2); x.fillRect(15, 0, 2, 32);
    speckle(x, rand, 10, ['#55555f', '#36363e']);
    out[TILE.DUNGEON_FLOOR] = c;
  }
  // DUNGEON_WALL — bata gua gelap
  {
    const [c, x] = makeCanvas();
    x.fillStyle = '#2b2b33'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = '#3a3a44'; x.fillRect(0, 0, 32, 5);
    x.fillStyle = '#222228';
    for (let r = 0; r < 3; r++) {
      const y = 8 + r * 8;
      x.fillRect(0, y, 32, 2);
      x.fillRect(r % 2 ? 8 : 0, y, 2, 8);
      x.fillRect(r % 2 ? 24 : 16, y, 2, 8);
    }
    out[TILE.DUNGEON_WALL] = c;
  }
  // STAIRS — tangga batu
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.DUNGEON_FLOOR], 0, 0);
    for (let i = 0; i < 4; i++) {
      x.fillStyle = i % 2 ? '#5c5c68' : '#484852';
      x.fillRect(4, 4 + i * 6, 24, 5);
      x.fillStyle = '#2b2b33'; x.fillRect(4, 8 + i * 6, 24, 1);
    }
    out[TILE.STAIRS] = c;
  }
  // CHEST — peti harta kayu + aksen emas
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.DUNGEON_FLOOR], 0, 0);
    x.fillStyle = '#6b4a2f'; x.fillRect(6, 12, 20, 14);
    x.fillStyle = '#7d5a3a'; x.fillRect(6, 12, 20, 5);
    x.fillStyle = '#d4a017'; x.fillRect(6, 16, 20, 2); x.fillRect(14, 12, 4, 14);
    x.fillStyle = '#4a3520'; x.fillRect(4, 24, 24, 3);
    out[TILE.CHEST] = c;
  }
  // CHEST_OPEN — peti terbuka, kosong
  {
    const [c, x] = makeCanvas();
    x.drawImage(out[TILE.DUNGEON_FLOOR], 0, 0);
    x.fillStyle = '#4a3520'; x.fillRect(6, 12, 20, 14); // badan lebih gelap
    x.fillStyle = '#2b2b33'; x.fillRect(8, 13, 16, 9);  // dalam kosong
    x.fillStyle = '#6b4a2f'; x.fillRect(4, 4, 24, 7);   // tutup terbuka
    x.fillStyle = '#d4a017'; x.fillRect(6, 16, 20, 2);
    out[TILE.CHEST_OPEN] = c;
  }
  return out;
}

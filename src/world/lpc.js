// ============================================================
// src/world/lpc.js — pemutar frame spritesheet Universal LPC.
// Layout kanonis (lihat generator Liberated Pixel Cup):
//   frame 64x64, 13 kolom; tiap animasi = 4 baris arah
//   (up, left, down, right), kecuali hurt/climb (1 baris).
// Offset baris & siklus frame diambil dari generator.
// Atribusi: public/assets/sprites/lpc/CREDITS.txt (CC-BY-SA 3.0).
// ============================================================

export const LPC_FRAME = 64;

// Baris dasar tiap animasi (arah down = baris + 2).
const ROWS = {
  spellcast: 0,
  thrust: 4,
  walk: 8,
  slash: 12,
  shoot: 16,
  hurt: 20,   // 1 baris, dipakai semua arah
  climb: 21,  // 1 baris
  idle: 22,
  jump: 26,
  run: 38,
};

// Urutan arah di sheet.
const DIRS = ['up', 'left', 'down', 'right'];

export const LPC_ANIMS = {
  idle:  { row: ROWS.idle,  frames: [0, 1], fps: 3 },
  walk:  { row: ROWS.walk,  frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 10 },
  run:   { row: ROWS.run,   frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 12 },
  slash: { row: ROWS.slash, frames: [0, 1, 2, 3, 4, 5], fps: 14 },
  thrust:{ row: ROWS.thrust,frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 14 },
  shoot: { row: ROWS.shoot, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], fps: 14 },
  hurt:  { row: ROWS.hurt,  frames: [0, 1, 2, 3, 4, 5], fps: 12 },
  jump:  { row: ROWS.jump,  frames: [0, 1, 2, 3, 4], fps: 10 },
};

export function createLpc() {
  return { anim: 'idle', dir: 'down', t: 0, frame: 0 };
}

// Ganti animasi (reset ke frame awal bila berbeda).
export function lpcPlay(p, anim, dir) {
  const d = DIRS.includes(dir) ? dir : 'down';
  if (p.anim !== anim || p.dir !== d) {
    p.anim = anim; p.dir = d; p.t = 0; p.frame = 0;
  }
}

export function lpcUpdate(p, dt) {
  const a = LPC_ANIMS[p.anim] || LPC_ANIMS.idle;
  p.t += dt;
  const step = 1 / a.fps;
  while (p.t >= step) {
    p.t -= step;
    p.frame = (p.frame + 1) % a.frames.length;
  }
}

// Kotak sumber frame saat ini di sheet: { sx, sy }.
export function lpcFrame(p) {
  const a = LPC_ANIMS[p.anim] || LPC_ANIMS.idle;
  const singleRow = p.anim === 'hurt' || p.anim === 'climb';
  const dirIdx = singleRow ? 0 : DIRS.indexOf(p.dir);
  const row = a.row + (singleRow ? 0 : dirIdx);
  const col = a.frames[p.frame % a.frames.length];
  return { sx: col * LPC_FRAME, sy: row * LPC_FRAME };
}

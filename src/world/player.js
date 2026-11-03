// ============================================================
// src/world/player.js — entitas pemain + movement + collision tile.
// Posisi (x, y) = titik kaki (bawah-tengah) dalam pixel peta.
// Collision: hitbox 18x10 di kaki, gerak per-sumbu (x lalu y).
// ============================================================

import { walkableAt } from './tiles.js';

export const PLAYER_SPEED = 150; // pixel/detik
export const PLAYER_MAX_HP = 100;
export const PLAYER_ATK = 10;      // damage serangan dasar
export const PLAYER_ATK_RANGE = 54; // jangkauan tebasan (px)
export const PLAYER_ATK_CD = 0.45;  // cooldown antar tebasan (detik)
// Skill dasar (slice 4). Skill AKTIF memakai mana; skill pasif (belum ada) gratis.
export const SKILL1_DMG = 25;       // Tebasan Api
export const SKILL1_RANGE = 72;
export const SKILL1_CD = 6;
export const SKILL1_COST = 15;      // mana Tebasan Api
export const SKILL2_DIST = 90;      // Dash: jarak luncuran (px)
export const SKILL2_CD = 8;
export const DASH_COST = 10;        // mana Dash

export function createPlayer(x, y) {
  return {
    x, y,
    hw: 9, hh: 5,          // setengah lebar/tinggi hitbox kaki
    speed: PLAYER_SPEED,
    dir: 'down',           // 'up' | 'down' | 'left' | 'right'
    moving: false,
    walkPhase: 0,          // untuk animasi (dipakai slice berikutnya)
    hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
    atkCd: 0,              // sisa cooldown serangan
    atkAnim: 0,            // sisa durasi animasi tebasan (untuk render)
    atkAnimColor: null,    // warna busur tebasan (null = default)
    skill1Cd: 0, skill2Cd: 0,
    dashAnim: 0,           // sisa efek visual dash (untuk render)
    fainted: false,        // true = pingsan (menunggu bangun di penginapan)
  };
}

// Dash ke arah hadap sejauh SKILL2_DIST (berhenti sebelum dinding).
export function dashPlayer(p, map) {
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [dx, dy] = D[p.dir] || D.down;
  let moved = 0;
  for (let s = 0; s < SKILL2_DIST / 10; s++) {
    const nx = p.x + dx * 10, ny = p.y + dy * 10;
    if (axisBlocked(map, nx, ny, p.hw, p.hh)) break;
    p.x = nx; p.y = ny; moved += 10;
  }
  if (moved > 0) p.dashAnim = 0.25;
  return moved;
}

function axisBlocked(map, x, y, hw, hh) {
  // Cek 4 sudut hitbox kaki.
  return !walkableAt(map, x - hw, y - hh)
      || !walkableAt(map, x + hw, y - hh)
      || !walkableAt(map, x - hw, y + hh)
      || !walkableAt(map, x + hw, y + hh);
}

export function updatePlayer(p, input, dt, map) {
  let dx = 0, dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.joyActive) { dx += input.joyX; dy += input.joyY; }

  const len = Math.hypot(dx, dy);
  p.moving = len > 0.15;
  if (!p.moving) return;

  dx /= Math.max(1, len); dy /= Math.max(1, len);
  // Arah hadap: sumbu dominan.
  if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
  else p.dir = dy > 0 ? 'down' : 'up';

  const step = p.speed * dt;
  // Sumbu X dulu, lalu Y — meluncur di dinding (slide).
  const nx = p.x + dx * step;
  if (!axisBlocked(map, nx, p.y, p.hw, p.hh)) p.x = nx;
  const ny = p.y + dy * step;
  if (!axisBlocked(map, p.x, ny, p.hw, p.hh)) p.y = ny;

  p.walkPhase += dt * 10;
}

// Tests: standar ukuran & gambar sprite (draw.js) + animasi dasar.
import { describe, it, expect } from 'vitest';
import { SPRITE_HEIGHT, drawSize, flashProgress } from '../src/world/draw.js';
import { createMonster, damageMonster, updateMonster } from '../src/world/monster.js';
import { damagePlayer } from '../src/world/combat.js';
import { TILE } from '../src/world/tiles.js';

function openMap() {
  return Array.from({ length: 40 }, () => Array(40).fill(TILE.DUNGEON_FLOOR));
}

describe('drawSize (anti gepeng/melar)', () => {
  it('lebar mengikuti rasio asli sprite', () => {
    // laba-laba: 1576x1071 (rasio 1.47), tinggi baku monster 48
    const s = drawSize(1576, 1071, SPRITE_HEIGHT.monster);
    expect(s.h).toBe(48);
    expect(s.w).toBeCloseTo(48 * (1576 / 1071), 5);
    expect(s.w).toBeGreaterThan(s.h); // tetap lebar, tidak gepeng
  });
  it('sprite tegak tetap tegak', () => {
    // pedagang: 928x2146 (rasio 0.43), tinggi baku player 70
    const s = drawSize(928, 2146, SPRITE_HEIGHT.player);
    expect(s.h).toBe(70);
    expect(s.w).toBeCloseTo(70 * (928 / 2146), 5);
    expect(s.w).toBeLessThan(s.h);
  });
  it('dimensi nol tidak meledak', () => {
    expect(drawSize(0, 0, 48)).toEqual({ w: 48, h: 48 });
    expect(drawSize(100, 0, 48)).toEqual({ w: 48, h: 48 });
  });
  it('standar mencakup 4 kategori', () => {
    expect(SPRITE_HEIGHT.player).toBe(70);
    expect(SPRITE_HEIGHT.companion).toBe(60);
    expect(SPRITE_HEIGHT.npc).toBe(52);
    expect(SPRITE_HEIGHT.monster).toBe(48);
  });
});

describe('flashProgress', () => {
  it('1 saat penuh, 0 saat habis, clamp', () => {
    expect(flashProgress(0.35, 0.35)).toBe(1);
    expect(flashProgress(0, 0.35)).toBe(0);
    expect(flashProgress(0.175, 0.35)).toBeCloseTo(0.5, 5);
    expect(flashProgress(9, 0.35)).toBe(1);
    expect(flashProgress(0.1, 0)).toBe(0);
  });
});

describe('animasi kematian monster (deathT)', () => {
  it('mati mengisi deathT 0.6 detik', () => {
    const m = createMonster(100, 100, 'goblin-hutan');
    m.hp = 1;
    damageMonster(m, 99, null);
    expect(m.state).toBe('dead');
    expect(m.deathT).toBeCloseTo(0.6, 5);
  });
  it('deathT berkurang tiap update saat mati', () => {
    const m = createMonster(100, 100, 'goblin-hutan');
    m.hp = 1;
    damageMonster(m, 99, null);
    updateMonster(m, 0.2, openMap(), null);
    expect(m.deathT).toBeCloseTo(0.4, 5);
    updateMonster(m, 0.5, openMap(), null);
    expect(m.deathT).toBeLessThanOrEqual(0);
  });
});

describe('animasi kena pukul pemain (hurtT)', () => {
  it('damagePlayer mengisi hurtT 0.3 detik', () => {
    const p = { hp: 100, maxHp: 100, defense: 0, fainted: false };
    damagePlayer(p, 10, null);
    expect(p.hurtT).toBeCloseTo(0.3, 5);
    expect(p.hp).toBe(90);
  });
  it('tidak mengisi bila sudah pingsan', () => {
    const p = { hp: 0, maxHp: 100, defense: 0, fainted: true, hurtT: 0 };
    damagePlayer(p, 10, null);
    expect(p.hurtT).toBe(0);
  });
});

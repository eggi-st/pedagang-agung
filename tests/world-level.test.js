// Tests: experience, level (maks 255), stat Xian + mana.
import { describe, it, expect } from 'vitest';
import {
  MAX_LEVEL, POINTS_PER_LEVEL, STATS, BASE_STATS,
  BASE_MANA, MANA_PER_WIS, MANA_REGEN,
  newProgress, xpForLevel, gainXp, allocateStat, recalcStats, effectiveStats,
} from '../src/world/level.js';

function makePlayer() {
  const p = { hp: 100, equip: { weapon: null, armor: null }, ...newProgress() };
  recalcStats(p);
  return p;
}

describe('kurva XP', () => {
  it('xpForLevel menanjak', () => {
    expect(xpForLevel(1)).toBe(20);
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(100)).toBeGreaterThan(xpForLevel(10));
  });
});

describe('gainXp', () => {
  it('naik 1 level + 3 poin stat', () => {
    const p = makePlayer();
    const ups = gainXp(p, xpForLevel(1));
    expect(ups).toBe(1);
    expect(p.level).toBe(2);
    expect(p.statPoints).toBe(POINTS_PER_LEVEL);
  });
  it('bisa naik beberapa level sekaligus (sisa XP terbawa)', () => {
    const p = makePlayer();
    const need = xpForLevel(1) + xpForLevel(2) + 5;
    const ups = gainXp(p, need);
    expect(ups).toBe(2);
    expect(p.level).toBe(3);
    expect(p.xp).toBe(5);
    expect(p.statPoints).toBe(2 * POINTS_PER_LEVEL);
  });
  it('cap di level 255', () => {
    const p = makePlayer();
    p.level = 254;
    const ups = gainXp(p, xpForLevel(254) * 10);
    expect(p.level).toBe(MAX_LEVEL);
    expect(ups).toBe(1);
    expect(gainXp(p, 99999)).toBe(0);
    expect(p.level).toBe(MAX_LEVEL);
  });
});

describe('stat Xian', () => {
  it('4 stat: Strength, Agility, Vitality, Wisdom', () => {
    expect(STATS.map((s) => s.id)).toEqual(['str', 'agi', 'vit', 'wis']);
    expect(STATS.map((s) => s.name)).toEqual(['Strength', 'Agility', 'Vitality', 'Wisdom']);
  });
  it('alokasi berhasil mengurangi poin & menaikkan stat', () => {
    const p = makePlayer();
    p.statPoints = 3;
    expect(allocateStat(p, 'wis')).toBe(true);
    expect(p.stats.wis).toBe(BASE_STATS.wis + 1);
    expect(p.statPoints).toBe(2);
  });
  it('gagal bila tidak ada poin / stat tak dikenal', () => {
    const p = makePlayer();
    expect(allocateStat(p, 'str')).toBe(false);
    p.statPoints = 1;
    expect(allocateStat(p, 'dex')).toBe(false); // dex sudah tidak ada
    expect(p.statPoints).toBe(1);
  });
});

describe('stat turunan (recalcStats)', () => {
  it('Strength: serangan range dari power', () => {
    const p = makePlayer(); // str 5 → statAtk 2, power 12
    expect(p.statAtk).toBe(2);
    expect(p.atkMin).toBe(Math.floor(12 * 0.85));
    expect(p.atkMax).toBe(Math.ceil(12 * 1.15));
    expect(p.atkMin).toBeLessThanOrEqual(p.atkMax);
  });
  it('Agility: speed + crit + defense', () => {
    const p = makePlayer(); // agi 5
    expect(p.speed).toBe(150 + 5 * 1.5);
    expect(p.critChance).toBeCloseTo(5 * 0.003);
    expect(p.defense).toBe(Math.floor(5 / 3));
  });
  it('Vitality: +5 HP maks tiap poin', () => {
    const p = makePlayer();
    expect(p.maxHp).toBe(100 + 5 * 5);
    p.stats.vit = 10;
    recalcStats(p);
    expect(p.maxHp).toBe(100 + 10 * 5);
  });
  it('Wisdom: +mana maks tiap poin', () => {
    const p = makePlayer();
    expect(p.maxMana).toBe(BASE_MANA + 5 * MANA_PER_WIS);
    expect(p.mana).toBe(p.maxMana); // init penuh
    p.stats.wis = 10;
    recalcStats(p);
    expect(p.maxMana).toBe(BASE_MANA + 10 * MANA_PER_WIS);
  });
  it('mana tidak melebihi maxMana saat recalc', () => {
    const p = makePlayer();
    p.mana = 5;
    p.stats.wis = 1;
    recalcStats(p);
    expect(p.mana).toBe(5);
  });
});

describe('equipment menambah stat', () => {
  it('statBonus senjata ikut dihitung', async () => {
    const { getItemDef } = await import('../src/world/data/items.js');
    const def = getItemDef('pedang-besi');
    expect(def.statBonus.str).toBeGreaterThan(0);
    const p = makePlayer();
    const before = p.statAtk;
    p.equip.weapon = 'pedang-besi';
    recalcStats(p);
    expect(p.statAtk).toBeGreaterThanOrEqual(before);
    expect(effectiveStats(p).str).toBe(p.stats.str + def.statBonus.str);
  });
  it('tanpa equipment = stat dasar', () => {
    const p = makePlayer();
    expect(effectiveStats(p)).toEqual(p.stats);
  });
});

describe('konstanta mana', () => {
  it('regen terdefinisi positif', () => {
    expect(MANA_REGEN).toBeGreaterThan(0);
  });
});

// Tests: sistem elemen + level + gaya serang + drop eksklusif.
import { describe, it, expect } from 'vitest';
import { ELEMENT_CYCLE, effectiveness, MULT_EFFECTIVE, MULT_RESIST, MULT_SAME } from '../src/world/data/elements.js';
import { MONSTERS } from '../src/world/data/monsters.js';
import { ITEMS } from '../src/world/data/items.js';
import { createMonster, updateMonster, damageMonster } from '../src/world/monster.js';

describe('tabel efektivitas', () => {
  it('siklus menang 1.5x, kalah 0.7x', () => {
    for (let i = 0; i < ELEMENT_CYCLE.length; i++) {
      const atk = ELEMENT_CYCLE[i];
      const beaten = ELEMENT_CYCLE[(i + 1) % ELEMENT_CYCLE.length];
      const beater = ELEMENT_CYCLE[(i - 1 + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length];
      expect(effectiveness(atk, beaten)).toBe(MULT_EFFECTIVE);
      expect(effectiveness(atk, beater)).toBe(MULT_RESIST);
    }
  });
  it('api efektif ke angin (1.5x), resist ke bumi (0.7x)', () => {
    expect(effectiveness('api', 'angin')).toBe(1.5);
    expect(effectiveness('api', 'bumi')).toBe(0.7);
  });
  it('elemen sama 0.8x; netral selalu 1.0x; tak terkait 1.0x', () => {
    expect(effectiveness('api', 'api')).toBe(MULT_SAME);
    expect(effectiveness('neutral', 'api')).toBe(1);
    expect(effectiveness('api', 'neutral')).toBe(1);
    expect(effectiveness('api', 'air')).toBe(1); // api vs air tidak terkait langsung
  });
});

describe('monster: elemen, level, gaya serang', () => {
  it('definisi lengkap: element/level/area/atkStyle', () => {
    for (const [id, m] of Object.entries(MONSTERS)) {
      expect(m.element, id).toBeTruthy();
      expect(m.level, id).toBeGreaterThan(0);
      expect(m.area, id).toBeTruthy();
      expect(['contact', 'melee', 'ranged'], id).toContain(m.atkStyle);
    }
  });
  it('level scaling: serigala Lv2 & jamur Lv3 lebih kuat dari base', () => {
    const s = createMonster(0, 0, 'serigala-hutan');
    expect(s.level).toBe(2);
    expect(s.hp).toBe(Math.round(22 * 1.15));
    expect(s.dmg).toBe(Math.round(8 * 1.12));
    const j = createMonster(0, 0, 'jamur-raksasa');
    expect(j.level).toBe(3);
    expect(j.hp).toBe(Math.round(55 * 1.3));
    expect(j.atkStyle).toBe('ranged');
    const g = createMonster(0, 0, 'goblin-hutan');
    expect(g.hp).toBe(30); // Lv1 = base
    expect(g.element).toBe('bumi');
  });
  it('ranged menembak proyektil (bukan hitPlayer)', () => {
    const j = createMonster(0, 0, 'jamur-raksasa');
    const player = { x: 150, y: 0, fainted: false };
    const res = updateMonster(j, 0.016, [[]], player);
    expect(res && res.fireProjectile).toBeTruthy();
    expect(res.fireProjectile.element).toBe('air');
    expect(res.fireProjectile.dmg).toBe(j.dmg);
  });
  it('ranged mundur bila pemain terlalu dekat', () => {
    const j = createMonster(200, 160, 'jamur-raksasa');
    const x0 = j.x;
    const player = { x: 250, y: 160, fainted: false }; // jarak 50 < keepDist 110
    // map minimal: semua GRASS (walkable)
    const map = Array.from({ length: 10 }, () => Array(10).fill(0));
    updateMonster(j, 0.5, map, player);
    expect(j.x).toBeLessThan(x0); // menjauh ke kiri
  });
});

describe('damage berelemen', () => {
  it('api vs goblin (bumi) = resist 0.7x', () => {
    const g = createMonster(0, 0, 'goblin-hutan');
    damageMonster(g, 10, [], 'api');
    expect(g.hp).toBe(30 - Math.max(1, Math.round(10 * 0.7)));
  });
  it('api vs serigala (angin) = effective 1.5x + floater Effective!', () => {
    const s = createMonster(0, 0, 'serigala-hutan');
    const floaters = [];
    const hp0 = s.hp;
    damageMonster(s, 10, floaters, 'api');
    expect(s.hp).toBe(hp0 - Math.round(10 * 1.5));
    expect(floaters.some((f) => f.text === 'Effective!')).toBe(true);
  });
  it('netral selalu 1.0x (kompatibel mundur)', () => {
    const g = createMonster(0, 0, 'goblin-hutan');
    damageMonster(g, 10, []);
    expect(g.hp).toBe(20);
  });
});

describe('drop eksklusif per monster', () => {
  it('tiap item drop hanya dimiliki satu monster', () => {
    const owner = {};
    for (const m of Object.values(MONSTERS)) {
      for (const d of m.drops) {
        expect(owner[d.item], `item ${d.item} dobel`).toBeUndefined();
        owner[d.item] = m.id;
      }
    }
  });
  it('semua item drop terdaftar di ITEMS', () => {
    for (const m of Object.values(MONSTERS)) {
      for (const d of m.drops) expect(ITEMS[d.item], d.item).toBeTruthy();
    }
  });
});

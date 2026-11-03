// Tests Tahap 2: modul data + integritas sprite + wiring monster.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../public/assets/sprites/manifest.json';
import { MONSTERS } from '../src/world/data/monsters.js';
import { ITEMS } from '../src/world/data/items.js';
import { TOWNS } from '../src/world/data/towns.js';
import { NPCS } from '../src/world/data/npcs.js';
import { COMPANIONS } from '../src/world/data/companions.js';
import { createMonster } from '../src/world/monster.js';

describe('monster defs', () => {
  it('semua sprite terdaftar di manifest & stat valid', () => {
    for (const [id, d] of Object.entries(MONSTERS)) {
      expect(manifest[d.sprite], `sprite ${id}`).toBeTruthy();
      expect(d.hp).toBeGreaterThan(0);
      expect(d.dmg).toBeGreaterThan(0);
      expect(d.goldMin).toBeLessThanOrEqual(d.goldMax);
      expect(d.name).toBeTruthy();
    }
  });
  it('4 monster dengan karakter berbeda (standar/cepat/tebal/penyergap)', () => {
    expect(Object.keys(MONSTERS).length).toBe(4);
    const speeds = Object.values(MONSTERS).map((d) => d.speed);
    expect(new Set(speeds).size).toBe(4); // semua beda
    const styles = Object.values(MONSTERS).map((d) => d.atkStyle);
    expect(styles).toContain('ranged'); // ada yang jarak jauh
    expect(styles).toContain('contact'); // ada yang sangat dekat
  });
});

describe('item defs', () => {
  it('sprite (bila ada) terdaftar & efek sesuai kind', () => {
    for (const [id, d] of Object.entries(ITEMS)) {
      if (d.sprite) expect(manifest[d.sprite], `sprite ${id}`).toBeTruthy();
      else expect(d.icon, `icon ${id}`).toBeTruthy(); // fallback emoji wajib
      expect(d.price).toBeGreaterThanOrEqual(0);
      if (d.kind === 'equipment') expect(Object.keys(d.statBonus || {}).length).toBeGreaterThan(0);
      if (d.kind === 'consumable') expect(d.effect.heal).toBeGreaterThan(0);
    }
  });
});

describe('town & npc defs', () => {
  it('kota merujuk NPC yang ada; NPC punya sprite & dialog', () => {
    for (const [, t] of Object.entries(TOWNS)) {
      expect(t.buildings.length).toBeGreaterThan(0);
      for (const nid of t.npcs) expect(NPCS[nid], `npc ${nid}`).toBeTruthy();
    }
    for (const [id, n] of Object.entries(NPCS)) {
      expect(manifest[n.sprite], `sprite ${id}`).toBeTruthy();
      expect(n.lines.length).toBeGreaterThan(0);
    }
  });
});

describe('companion defs', () => {
  it('semua sprite terdaftar, role valid, ada biaya rekrut', () => {
    for (const [id, c] of Object.entries(COMPANIONS)) {
      expect(manifest[c.sprite], `sprite ${id}`).toBeTruthy();
      expect(['dealer', 'healer', 'ranged']).toContain(c.role);
      expect(c.hireCost).toBeGreaterThan(0);
    }
  });
});

describe('createMonster dengan definisi', () => {
  it('pakai stat definisi (serigala lebih cepat dari goblin)', () => {
    const s = createMonster(0, 0, 'serigala-hutan');
    expect(s.name).toBe('Serigala Hutan');
    expect(s.speed).toBe(60);
    expect(s.hp).toBe(Math.round(22 * 1.15)); // Lv2 scaling
    expect(s.element).toBe('angin');
    expect(s.atkStyle).toBe('contact');
    expect(s.sprite).toBe('monster-serigala-hutan');
    const g = createMonster(0, 0, 'goblin-hutan');
    expect(s.speed).toBeGreaterThan(g.speed);
  });
  it('kompatibel mundur: nama bebas -> stat goblin standar', () => {
    const m = createMonster(0, 0, 'Goblin');
    expect(m.name).toBe('Goblin');
    expect(m.hp).toBe(30);
    expect(m.dmg).toBe(6);
  });
});

describe('manifest states (pola per-state)', () => {
  const SPRITE_DIR = join(process.cwd(), 'public', 'assets', 'sprites');
  it('setiap file state yang tercatat benar-benar ada di disk', () => {
    for (const [id, entry] of Object.entries(manifest)) {
      expect(existsSync(join(SPRITE_DIR, entry.file)), `file dasar ${id}`).toBe(true);
      if (entry.states) {
        for (const [st, f] of Object.entries(entry.states)) {
          expect(existsSync(join(SPRITE_DIR, f)), `state ${st} dari ${id}`).toBe(true);
        }
      }
    }
  });
  it('goblin-hutan punya state Walk/Attack/Hurt (Faint menyusul)', () => {
    const states = manifest['goblin-hutan'].states || {};
    expect(states.Walk).toBeTruthy();
    expect(states.Attack).toBeTruthy();
    expect(states.Hurt).toBeTruthy();
  });
});

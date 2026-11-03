// Tests: pemutar frame spritesheet LPC.
import { describe, it, expect } from 'vitest';
import { createLpc, lpcPlay, lpcUpdate, lpcFrame, LPC_FRAME, LPC_ANIMS } from '../src/world/lpc.js';

describe('lpc frame layout (kanonis Universal LPC)', () => {
  it('frame 64px; arah down = baris +2', () => {
    expect(LPC_FRAME).toBe(64);
    const p = createLpc();
    lpcPlay(p, 'walk', 'down');
    const f = lpcFrame(p);
    expect(f.sx).toBe(1 * 64); // walk mulai dari frame 1
    expect(f.sy).toBe((8 + 2) * 64); // baris walk 8 + arah down
  });
  it('arah up/left/right memetakan benar', () => {
    const p = createLpc();
    lpcPlay(p, 'idle', 'up');
    expect(lpcFrame(p).sy).toBe(22 * 64);
    lpcPlay(p, 'idle', 'left');
    expect(lpcFrame(p).sy).toBe(23 * 64);
    lpcPlay(p, 'idle', 'right');
    expect(lpcFrame(p).sy).toBe(25 * 64);
  });
  it('hurt satu baris untuk semua arah', () => {
    const p = createLpc();
    lpcPlay(p, 'hurt', 'left');
    const a = lpcFrame(p), b = (() => { lpcPlay(p, 'hurt', 'up'); return lpcFrame(p); })();
    expect(a.sy).toBe(b.sy);
    expect(a.sy).toBe(20 * 64);
  });
});

describe('lpcPlay / lpcUpdate', () => {
  it('ganti animasi me-reset frame', () => {
    const p = createLpc();
    lpcPlay(p, 'walk', 'down');
    lpcUpdate(p, 0.5);
    expect(p.frame).toBeGreaterThan(0);
    lpcPlay(p, 'idle', 'down');
    expect(p.frame).toBe(0);
    expect(p.anim).toBe('idle');
  });
  it('frame berputar sesuai fps', () => {
    const p = createLpc();
    lpcPlay(p, 'walk', 'down'); // 8 frame, 10 fps
    lpcUpdate(p, 0.1);
    expect(p.frame).toBe(1);
    lpcUpdate(p, 0.8);
    expect(p.frame).toBe((1 + 8) % 8);
  });
  it('arah tak dikenal fallback ke down', () => {
    const p = createLpc();
    lpcPlay(p, 'walk', 'diagonal');
    expect(p.dir).toBe('down');
  });
});

describe('roster monster LPC (3 Nov 2026)', () => {
  it('orc/skeleton/troll punya def.lpc + drop valid', async () => {
    const { MONSTERS } = await import('../src/world/data/monsters.js');
    const { ITEMS } = await import('../src/world/data/items.js');
    for (const id of ['orc-hutan', 'skeleton-liar', 'troll-rawa']) {
      const def = MONSTERS[id];
      expect(def, id).toBeTruthy();
      expect(def.lpc, id).toBe(id); // nama sheet = id
      expect(def.drops.length, id).toBeGreaterThan(0);
      for (const d of def.drops) {
        expect(ITEMS[d.item], `${id}:${d.item}`).toBeTruthy();
        expect(d.rate, `${id}:${d.item}`).toBeGreaterThan(0);
      }
    }
    // roster lama sudah tidak dipakai
    for (const id of ['laba-laba-hutan', 'serigala-hutan', 'jamur-raksasa']) {
      expect(MONSTERS[id], id).toBeFalsy();
    }
  });
  it('createMonster membawa lpc dari definisi', async () => {
    const { createMonster } = await import('../src/world/monster.js');
    const m = createMonster(0, 0, 'orc-hutan');
    expect(m.lpc).toBe('orc-hutan');
    expect(m.lpcPlayer).toBeNull(); // diisi main.js saat boot
    const g = createMonster(0, 0, 'goblin-hutan');
    expect(g.lpc).toBeNull(); // goblin tetap sprite biasa
  });
});

// Tests Tahap 3a: entitas NPC + mesin dialog.
import { describe, it, expect } from 'vitest';
import { createNpc, openDialogue, advanceDialogue, closeDialogue } from '../src/world/npc.js';

describe('NPC', () => {
  it('createNpc memakai definisi dari data', () => {
    const n = createNpc(100, 200, 'penjaga-toko');
    expect(n.name).toBe('Bang Soma');
    expect(n.sprite).toBe('npc-penjaga-toko');
    expect(n.role).toBe('shop');
    expect(n.lines.length).toBeGreaterThan(0);
    expect(n.talking).toBe(false);
  });
  it('defId tak dikenal melempar error', () => {
    expect(() => createNpc(0, 0, 'hantu')).toThrow();
  });
});

describe('dialog', () => {
  it('alur buka -> lanjut -> tutup di akhir', () => {
    const n = createNpc(0, 0, 'nenek-penginapan');
    const first = openDialogue(n);
    expect(n.talking).toBe(true);
    expect(first).toBe(n.lines[0]);
    let line = null;
    for (let i = 1; i < n.lines.length; i++) {
      line = advanceDialogue(n);
      expect(line).toBe(n.lines[i]);
      expect(n.talking).toBe(true);
    }
    const end = advanceDialogue(n);
    expect(end).toBeNull();
    expect(n.talking).toBe(false);
  });
  it('closeDialogue menutup paksa', () => {
    const n = createNpc(0, 0, 'penjaga-toko');
    openDialogue(n);
    closeDialogue(n);
    expect(n.talking).toBe(false);
  });
});

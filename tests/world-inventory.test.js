// Tests Tahap 3b: inventory + drop table + rarity.
import { describe, it, expect } from 'vitest';
import { createInventory, addItem, removeItem, countItem, listItems, totalCount } from '../src/world/inventory.js';
import { ITEMS, RARITY, RARITY_ORDER, getItemDef, rarityColor, compareItems } from '../src/world/data/items.js';
import { MONSTERS } from '../src/world/data/monsters.js';

describe('inventory', () => {
  it('tambah/kurang/hitung/hapus-otomatis', () => {
    const inv = createInventory();
    addItem(inv, 'daun-kering', 3);
    addItem(inv, 'daun-kering', 2);
    expect(countItem(inv, 'daun-kering')).toBe(5);
    expect(totalCount(inv)).toBe(5);
    expect(removeItem(inv, 'daun-kering', 2)).toBe(true);
    expect(countItem(inv, 'daun-kering')).toBe(3);
    expect(removeItem(inv, 'daun-kering', 9)).toBe(false); // stok kurang: tidak berubah
    expect(countItem(inv, 'daun-kering')).toBe(3);
    expect(removeItem(inv, 'daun-kering', 3)).toBe(true);
    expect('daun-kering' in inv.items).toBe(false); // qty 0 -> kunci dihapus
  });
  it('item tak dikenal melempar error', () => {
    const inv = createInventory();
    expect(() => addItem(inv, 'tidak-ada')).toThrow();
  });
  it('listItems terurut: rarity tertinggi dulu', () => {
    const inv = createInventory();
    addItem(inv, 'daun-kering');
    addItem(inv, 'taring-alpha');
    addItem(inv, 'pedang-besi');
    const ids = listItems(inv);
    expect(ids[0]).toBe('taring-alpha'); // legendary
    expect(ids[ids.length - 1]).toBe('daun-kering'); // common
  });
});

describe('rarity', () => {
  it('6 tier sesuai urutan + warna valid', () => {
    expect(RARITY_ORDER).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);
    for (const r of RARITY_ORDER) {
      expect(RARITY[r].name).toBeTruthy();
      expect(RARITY[r].color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(rarityColor(r)).toBe(RARITY[r].color);
    }
  });
  it('setiap item punya rarity & kind valid; quest tidak bisa dijual (price 0)', () => {
    const kinds = ['sellable', 'consumable', 'equipment', 'special', 'quest'];
    for (const [id, d] of Object.entries(ITEMS)) {
      expect(RARITY_ORDER, id).toContain(d.rarity);
      expect(kinds, id).toContain(d.kind);
      if (d.kind === 'quest') expect(d.price).toBe(0);
      if (d.kind === 'consumable') expect(d.effect.heal).toBeGreaterThan(0);
      if (d.kind === 'equipment') expect(Object.keys(d.statBonus || {}).length).toBeGreaterThan(0);
    }
  });
  it('ada item di tiap tier kecuali mythic (khusus boss)', () => {
    const have = new Set(Object.values(ITEMS).map((d) => d.rarity));
    for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
      expect(have.has(r), `tier ${r}`).toBe(true);
    }
  });
});

describe('drop table monster', () => {
  it('semua item drop terdaftar; rate 0 < rate <= 100', () => {
    for (const [mid, m] of Object.entries(MONSTERS)) {
      expect(Array.isArray(m.drops), mid).toBe(true);
      for (const d of m.drops) {
        expect(getItemDef(d.item), `${mid} -> ${d.item}`).toBeTruthy();
        expect(d.rate).toBeGreaterThan(0);
        expect(d.rate).toBeLessThanOrEqual(100);
      }
    }
  });
  it('mythic tidak dijatuhkan monster biasa', () => {
    const mythicIds = Object.keys(ITEMS).filter((id) => ITEMS[id].rarity === 'mythic');
    for (const m of Object.values(MONSTERS)) {
      for (const d of m.drops) {
        expect(mythicIds, `${m.id} menjatuhkan mythic`).not.toContain(d.item);
      }
    }
  });
});

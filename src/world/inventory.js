// ============================================================
// src/world/inventory.js — tas pemain (data-driven, lihat data/items.js).
// Struktur: { items: { <itemId>: qty } }.
// ============================================================
import { getItemDef, compareItems } from './data/items.js';

export function createInventory() {
  return { items: {} };
}

export function addItem(inv, id, qty = 1) {
  if (!getItemDef(id)) throw new Error(`Item tidak dikenal: ${id}`);
  if (qty <= 0) return;
  inv.items[id] = (inv.items[id] || 0) + qty;
}

// Mengembalikan false bila stok kurang (tidak ada perubahan).
export function removeItem(inv, id, qty = 1) {
  const have = inv.items[id] || 0;
  if (have < qty) return false;
  inv.items[id] = have - qty;
  if (inv.items[id] <= 0) delete inv.items[id];
  return true;
}

export function countItem(inv, id) {
  return inv.items[id] || 0;
}

// Daftar id terurut: rarity tertinggi dulu, lalu nama.
export function listItems(inv) {
  return Object.keys(inv.items).sort(compareItems);
}

export function totalCount(inv) {
  return Object.values(inv.items).reduce((a, b) => a + b, 0);
}

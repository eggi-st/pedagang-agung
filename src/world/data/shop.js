// ============================================================
// src/world/data/shop.js — stok toko per merchant (npc id).
// Harga beli = def.price (belum ada marjin; tidak ada celah arbitrase
// karena harga jual juga = price).
// ============================================================

export const SHOP_STOCK = {
  // Bang Soma (penjaga toko Hanseong).
  'penjaga-toko': [
    'ramuan-merah',   // heal 50
    'ramuan-besar',   // heal 120
    'apel-hutan',     // heal 10 + kenyang 35
    'pedang-besi',    // senjata awal
    'karung-emas',    // item jual
  ],
};

export function getShopStock(npcId) {
  return SHOP_STOCK[npcId] || [];
}

// ============================================================
// src/world/data/items.js — definisi item (data-driven).
//
// rarity: common (putih) < uncommon (hijau) < rare (biru)
//         < epic (ungu) < legendary (oranye) < mythic (merah).
// kind: 'sellable' (hanya bisa dijual) | 'consumable' (pakai: heal/dll)
//       | 'equipment' (dipakai: tambah stat) | 'special' (item khusus)
//       | 'quest' (item quest; tidak bisa dijual).
// sprite: id di manifest; null = pakai icon emoji (fallback).
// ============================================================

export const RARITY = {
  common:    { name: 'Common',    color: '#cfd8dc' },
  uncommon:  { name: 'Uncommon',  color: '#66bb6a' },
  rare:      { name: 'Rare',      color: '#42a5f5' },
  epic:      { name: 'Epic',      color: '#ab47bc' },
  legendary: { name: 'Legendary', color: '#ffa726' },
  mythic:    { name: 'Mythic',    color: '#ef5350' },
};

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const ITEMS = {
  // ---- Common ----
  'daun-kering': {
    id: 'daun-kering', name: 'Daun Kering', sprite: null, icon: '🍂',
    rarity: 'common', kind: 'sellable', price: 2,
    desc: 'Daun kering biasa. Laku sedikit di pasar.',
  },
  'tulang-kecil': {
    id: 'tulang-kecil', name: 'Tulang Kecil', sprite: null, icon: '🦴',
    rarity: 'common', kind: 'sellable', price: 4,
    desc: 'Tulang monster kecil. Bahan kerajinan murah.',
  },
  'ramuan-merah': {
    id: 'ramuan-merah', name: 'Ramuan Merah', sprite: 'item-ramuan-merah', icon: '🧪',
    rarity: 'common', kind: 'consumable', price: 25,
    effect: { heal: 50 },
    desc: 'Ramuan herbal tabib. Pulihkan 50 HP.',
  },
  'karung-emas': {
    id: 'karung-emas', name: 'Karung Emas', sprite: 'item-karung-emas', icon: '💰',
    rarity: 'common', kind: 'sellable', price: 100,
    desc: 'Karung koin emas. Langsung laku 100 emas.',
  },
  'apel-hutan': {
    id: 'apel-hutan', name: 'Apel Hutan', sprite: null, icon: '🍎',
    rarity: 'common', kind: 'consumable', price: 8,
    effect: { heal: 10, satiety: 35 },
    desc: 'Apel liar. +10 HP, +35 kenyang.',
  },
  // ---- Uncommon ----
  'taring-serigala': {
    id: 'taring-serigala', name: 'Taring Serigala', sprite: null, icon: '🦷',
    rarity: 'uncommon', kind: 'sellable', price: 12,
    desc: 'Taring tajam. Dicari pandai besi.',
  },
  'ramuan-besar': {
    id: 'ramuan-besar', name: 'Ramuan Besar', sprite: null, icon: '⚗️',
    rarity: 'uncommon', kind: 'consumable', price: 60,
    effect: { heal: 120 },
    desc: 'Ramuan pekat. Pulihkan 120 HP.',
  },
  'pedang-besi': {
    id: 'pedang-besi', name: 'Pedang Besi', sprite: 'item-pedang-besi', icon: '🗡️',
    rarity: 'uncommon', kind: 'equipment', price: 80, slot: 'weapon',
    statBonus: { str: 6 },
    desc: 'Pedang tempa pandai besi Hanseong. +5 serangan.',
  },
  // ---- Rare ----
  'jamur-biru': {
    id: 'jamur-biru', name: 'Jamur Biru', sprite: null, icon: '🍄',
    rarity: 'rare', kind: 'sellable', price: 40,
    desc: 'Jamur langka berpendar biru. Kolektor membayar mahal.',
  },
  'kristal-hutan': {
    id: 'kristal-hutan', name: 'Kristal Hutan', sprite: null, icon: '💎',
    rarity: 'rare', kind: 'special', price: 150,
    desc: 'Kristal berdenyut aneh. Mungkin bahan ritual kuno.',
  },
  'jubah-pemburu': {
    id: 'jubah-pemburu', name: 'Jubah Pemburu', sprite: null, icon: '🥋',
    rarity: 'rare', kind: 'equipment', price: 200, slot: 'armor',
    statBonus: { vit: 5 },
    desc: 'Jubah kulit tebal. +25 HP maks.',
  },
  // ---- Epic ----
  'pedang-baja-hitam': {
    id: 'pedang-baja-hitam', name: 'Pedang Baja Hitam', sprite: null, icon: '⚔️',
    rarity: 'epic', kind: 'equipment', price: 400, slot: 'weapon',
    statBonus: { str: 10, agi: 2 },
    desc: 'Baja hitam legam. +15 serangan.',
  },
  'esensi-hutan': {
    id: 'esensi-hutan', name: 'Esensi Hutan', sprite: null, icon: '✨',
    rarity: 'epic', kind: 'special', price: 300,
    desc: 'Esensi murni hutan. Bahan ritual tingkat tinggi.',
  },
  // ---- Legendary ----
  'taring-alpha': {
    id: 'taring-alpha', name: 'Taring Alpha', sprite: null, icon: '🐺',
    rarity: 'legendary', kind: 'special', price: 800,
    desc: 'Taring pemimpin kawanan serigala. Ditakuti dan dihormati.',
  },
  // ---- Mythic (belum dijatuhkan monster mana pun; khusus boss/event) ----
  'mahkota-raja-hutan': {
    id: 'mahkota-raja-hutan', name: 'Mahkota Raja Hutan', sprite: null, icon: '👑',
    rarity: 'mythic', kind: 'quest', price: 0,
    desc: 'Mahkota Raja Hutan. Tak ternilai, tak bisa dijual.',
  },
  // ---- Drop eksklusif Goblin Hutan (bumi): bagian tubuh goblin ----
  'tangan-goblin': {
    id: 'tangan-goblin', name: 'Tangan Goblin', sprite: null, icon: '✋',
    rarity: 'common', kind: 'sellable', price: 3,
    desc: 'Tangan goblin. Bahan kerajinan kasar.',
  },
  'topi-goblin': {
    id: 'topi-goblin', name: 'Topi Goblin', sprite: null, icon: '🧢',
    rarity: 'uncommon', kind: 'equipment', price: 45, slot: 'armor',
    statBonus: { vit: 2 },
    desc: 'Topi kulit goblin. +10 HP maks.',
  },
  'pentungan-goblin': {
    id: 'pentungan-goblin', name: 'Pentungan Goblin', sprite: null, icon: '🏏',
    rarity: 'uncommon', kind: 'equipment', price: 35, slot: 'weapon',
    statBonus: { str: 2 },
    desc: 'Pentungan kayu goblin. +3 serangan.',
  },
  'jimat-goblin': {
    id: 'jimat-goblin', name: 'Jimat Goblin', sprite: null, icon: '🧿',
    rarity: 'rare', kind: 'special', price: 60,
    desc: 'Jimat tulang ukiran goblin. Dipercaya membawa hoki.',
  },
  // ---- Drop eksklusif Serigala Hutan (angin) ----
  'bulu-serigala': {
    id: 'bulu-serigala', name: 'Bulu Serigala', sprite: null, icon: '🪶',
    rarity: 'common', kind: 'sellable', price: 4,
    desc: 'Bulu lebat. Hangat dan ringan.',
  },
  'kalung-taring': {
    id: 'kalung-taring', name: 'Kalung Taring', sprite: null, icon: '📿',
    rarity: 'rare', kind: 'equipment', price: 120, slot: 'armor',
    statBonus: { str: 4, agi: 2 },
    desc: 'Kalung taring serigala. +4 serangan.',
  },
  // ---- Drop eksklusif Laba-laba Hutan (bumi): bagian tubuh laba-laba ----
  'kaki-laba-laba': {
    id: 'kaki-laba-laba', name: 'Kaki Laba-laba', sprite: null, icon: '🦵',
    rarity: 'common', kind: 'sellable', price: 4,
    desc: 'Kaki laba-laba raksasa. Kuat dan ringan.',
  },
  'jaring-laba-laba': {
    id: 'jaring-laba-laba', name: 'Jaring Laba-laba', sprite: null, icon: '🕸️',
    rarity: 'common', kind: 'sellable', price: 6,
    desc: 'Jaring lengket. Bahan tali dan perangkap.',
  },
  'taring-laba-laba': {
    id: 'taring-laba-laba', name: 'Taring Laba-laba', sprite: null, icon: '🕷️',
    rarity: 'uncommon', kind: 'sellable', price: 14,
    desc: 'Taring bergerigi. Masih meneteskan racun.',
  },
  'racun-laba-laba': {
    id: 'racun-laba-laba', name: 'Racun Laba-laba', sprite: null, icon: '☠️',
    rarity: 'rare', kind: 'special', price: 70,
    desc: 'Racun pekat laba-laba. Bahan ramuan dan senjata.',
  },
  'karapas-laba-laba': {
    id: 'karapas-laba-laba', name: 'Karapas Laba-laba', sprite: null, icon: '🛡️',
    rarity: 'rare', kind: 'equipment', price: 150, slot: 'armor',
    statBonus: { vit: 4 },
    desc: 'Karapas keras berlumut. +20 HP maks.',
  },
  // ---- Drop eksklusif Jamur Raksasa (air) ----
  'spora-jamur': {
    id: 'spora-jamur', name: 'Spora Jamur', sprite: null, icon: '🌫️',
    rarity: 'common', kind: 'sellable', price: 5,
    desc: 'Spora berpendar lembut. Bahan pewarna alami.',
  },
  'tudung-spora': {
    id: 'tudung-spora', name: 'Tudung Spora', sprite: null, icon: '🎩',
    rarity: 'epic', kind: 'equipment', price: 350, slot: 'armor',
    statBonus: { vit: 6, wis: 4 },
    desc: 'Tudung jamur raksasa. +40 HP maks.',
  },
};

export function getItemDef(id) {
  return ITEMS[id] || null;
}

export function rarityColor(rarity) {
  return (RARITY[rarity] || RARITY.common).color;
}

// Urutan tampil di inventory: rarity tertinggi dulu, lalu nama.
export function compareItems(aId, bId) {
  const a = ITEMS[aId], b = ITEMS[bId];
  const ra = RARITY_ORDER.indexOf(a.rarity), rb = RARITY_ORDER.indexOf(b.rarity);
  if (ra !== rb) return rb - ra;
  return a.name.localeCompare(b.name);
}

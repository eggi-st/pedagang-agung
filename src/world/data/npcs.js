// ============================================================
// src/world/data/npcs.js — definisi NPC kota (data-driven).
// role: 'shop' | 'inn' | 'trainer' | 'flavor'.
// lines: dialog yang diucapkan bergantian saat diajak bicara.
// ============================================================

export const NPCS = {
  'penjaga-toko': {
    id: 'penjaga-toko',
    name: 'Bang Soma',
    sprite: 'npc-penjaga-toko',
    role: 'shop',
    lines: [
      'Selamat datang di tokoku! Lihat-lihat dulu, jangan malu bertanya.',
      'Pedang besi ini tempaan sendiri. Dijamin tajam!',
      'Ramuan merah selalu laris. Petualang sepertimu pasti butuh.',
    ],
  },
  'nenek-penginapan': {
    id: 'nenek-penginapan',
    name: 'Nenek Buni',
    sprite: 'npc-nenek-penginapan',
    role: 'inn',
    lines: [
      'Aigo, petualang muda! Kamar hangat sudah siap.',
      'Istirahatlah yang cukup. Gua itu berbahaya...',
      'Selimutku tebal, tidurmu pasti nyenyak.',
    ],
  },
};

export function getNpcDef(id) {
  return NPCS[id] || null;
}

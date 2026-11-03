// ============================================================
// src/world/data/towns.js — definisi kota (data-driven).
// buildings: fasilitas yang ada di kota. npcs: id NPC yang tinggal
// di kota (lihat npcs.js).
// ============================================================

export const TOWNS = {
  'hanseong': {
    id: 'hanseong',
    name: 'Hanseong',
    nation: 'Joseon',
    desc: 'Ibu kota Joseon. Pasar ramai, tembok kokoh, penginapan hangat.',
    buildings: [
      { id: 'toko', name: 'Toko', icon: '🛒' },
      { id: 'penginapan', name: 'Penginapan', icon: '🏠' },
      { id: 'balai-latihan', name: 'Balai Latihan', icon: '⚔️' },
      { id: 'aula-promosi', name: 'Aula Promosi', icon: '🎖️' },
      { id: 'pabrik', name: 'Pabrik', icon: '🏭' },
    ],
    npcs: ['penjaga-toko', 'nenek-penginapan'],
  },
};

export function getTownDef(id) {
  return TOWNS[id] || null;
}

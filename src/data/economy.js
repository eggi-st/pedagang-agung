// Data ekonomi: komoditas dagang, senjata, zirah, resep pabrik
export const GOODS = [
  { id: 'sutra', name: 'Sutra', icon: '🧵', base: 40 },
  { id: 'teh', name: 'Teh', icon: '🍵', base: 15 },
  { id: 'rempah', name: 'Rempah', icon: '🌶️', base: 25 },
  { id: 'porselen', name: 'Porselen', icon: '🏺', base: 55 },
  { id: 'senjata_dagang', name: 'Senjata Antik', icon: '🗡️', base: 70 },
];

export const WEAPONS = [
  { id: 'pedang_kayu', name: 'Pedang Kayu', atk: 5, price: 50, elem: 'Bumi' },
  { id: 'pedang_besi', name: 'Pedang Besi', atk: 12, price: 150, elem: 'Petir' },
  { id: 'pedang_baja', name: 'Pedang Baja', atk: 22, price: 350, elem: 'Api' },
];

export const ARMORS = [
  { id: 'jubah_kain', name: 'Jubah Kain', def: 4, price: 40 },
  { id: 'zirah_kulit', name: 'Zirah Kulit', def: 10, price: 130 },
  { id: 'zirah_baja', name: 'Zirah Baja', def: 20, price: 320 },
];

export const FACTORY_RECIPES = [
  { id: 'kain_halus', name: 'Kain Sutra Halus', inputs: { sutra: 5 }, days: 2, goldCost: 30, sellValue: 280 },
  { id: 'minyak_rempah', name: 'Minyak Rempah Wangi', inputs: { rempah: 5 }, days: 2, goldCost: 20, sellValue: 170 },
  { id: 'porselen_ukir', name: 'Porselen Berukir', inputs: { porselen: 3 }, days: 3, goldCost: 40, sellValue: 260 },
];

export const ELITE_EXCHANGES = [
  { id: 'rebirth_stone', name: 'Rebirth Stone', tp: 50, desc: 'Perkuat 1 jendral permanen (+5 ATK/+10 HP)' },
  { id: 'upgrade_part', name: 'Upgrade Part', tp: 70, desc: 'Bahan promosi Jendral tingkat atas' },
  { id: 'potion_bundle', name: 'Paket 3 Ramuan', tp: 30, desc: 'Isi ulang 3 ramuan penyembuh sekaligus' },
];

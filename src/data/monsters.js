// Musuh biasa (encounter perjalanan) dan musuh dungeon
export const MONSTERS = [
  { name: 'Bandit Jalanan', hpBase: 30, atkBase: 6, elem: 'Bumi' },
  { name: 'Serigala Hutan', hpBase: 24, atkBase: 8, elem: 'Angin' },
  { name: 'Perampok Bersenjata', hpBase: 40, atkBase: 10, elem: 'Petir' },
  { name: 'Prajurit Bayaran Jahat', hpBase: 55, atkBase: 13, elem: 'Api' },
];

export const DUNGEON_MONSTERS = [
  { name: 'Roh Gua', hpBase: 35, atkBase: 9, elem: 'Air' },
  { name: 'Laba-laba Raksasa', hpBase: 45, atkBase: 11, poisonChance: 0.3, elem: 'Bumi' },
  { name: 'Golem Batu', hpBase: 60, atkBase: 14, elem: 'Bumi' },
];

export const MONSTER_ICON = {
  'Bandit Jalanan': '🗡️',
  'Serigala Hutan': '🐺',
  'Perampok Bersenjata': '🏹',
  'Prajurit Bayaran Jahat': '😈',
  'Roh Gua': '👻',
  'Laba-laba Raksasa': '🕷️',
  'Golem Batu': '🗿',
  'Pasukan Garnisun': '🏯',
};

export function monsterIcon(name) {
  const base = name.replace(/ \d+$/, '');
  return MONSTER_ICON[base] || '👹';
}

// TODO (Fase 7): tambah lebih banyak jenis musuh, idealnya dikelompokkan
// per region/negara dengan tabel drop unik masing-masing, alih-alih
// satu pool generik yang dipakai semua tempat seperti sekarang.

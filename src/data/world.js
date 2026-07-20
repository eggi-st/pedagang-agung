// Data dunia: daftar kota, rentang level rekomendasi, icon kota
export const CITIES = ['Hanseong', 'Beijing', 'Kyoto', 'Taipei', 'Chennai'];

export const CITY_LEVEL_RANGE = {
  Hanseong: '1-8',
  Beijing: '6-14',
  Kyoto: '12-20',
  Taipei: '18-28',
  Chennai: '25-40',
};

export const CITY_ICON = {
  Hanseong: '🏯',
  Beijing: '🏛️',
  Kyoto: '⛩️',
  Taipei: '🏮',
  Chennai: '🕌',
};

// TODO (Fase migrasi lanjutan): pecah CITIES jadi per-region/negara,
// tambah hunting spot terpisah dari dungeon, dan rute laut antar region.

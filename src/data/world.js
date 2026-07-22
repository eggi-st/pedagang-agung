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

// Negara/pulau tiap kota. Perjalanan dalam negara sama = darat (1 hari,
// gratis); antar negara = kapal (lebih lama + ongkos). Beijing & Taipei
// satu daratan (Ming), jadi bisa lewat darat.
export const CITY_NATION = {
  Hanseong: 'Joseon',
  Beijing: 'Ming',
  Taipei: 'Ming',
  Kyoto: 'Jepang',
  Chennai: 'India',
};

// Nama tampilan negara (untuk header/peta).
export const NATION_LABEL = {
  Joseon: 'Joseon', Ming: 'Ming (China)', Jepang: 'Jepang', India: 'India',
};

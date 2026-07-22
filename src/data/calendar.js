// Kalender & musim. Waktu tetap SATU sumbu: state.day (naik saat bepergian).
// Modul ini hanya menerjemahkan day -> tanggal/tahun/musim, dan menghitung
// faktor harga musiman. Tidak ada jam real-time — cocok untuk hobi offline.

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR; // 360

// Empat musim, masing-masing 3 bulan. `cheap`/`dear` = id komoditas yang
// harganya cenderung turun/naik pada musim itu (efek diterapkan ke baseline
// yang jadi target pemulihan harga, jadi pasar bergeser halus tiap musim).
export const SEASONS = [
  { key: 'semi',   name: 'Semi',          icon: '🌸', cheap: ['teh'],         dear: ['porselen'] },
  { key: 'panas',  name: 'Panas',         icon: '☀️', cheap: ['rempah'],      dear: ['sutra'] },
  { key: 'gugur',  name: 'Gugur (Panen)', icon: '🍂', cheap: ['sutra', 'teh'], dear: ['senjata_dagang'] },
  { key: 'dingin', name: 'Dingin',        icon: '❄️', cheap: [],              dear: ['sutra', 'porselen', 'teh'] },
];

/** Terjemahkan day (mulai 1) ke {year, month, dayOfMonth, season}. */
export function calendarFromDay(day) {
  const d = Math.max(1, day | 0) - 1;
  const year = Math.floor(d / DAYS_PER_YEAR) + 1;
  const doy = d % DAYS_PER_YEAR;
  const month = Math.floor(doy / DAYS_PER_MONTH) + 1;      // 1..12
  const dayOfMonth = (doy % DAYS_PER_MONTH) + 1;           // 1..30
  const season = SEASONS[Math.floor((month - 1) / 3)];     // 0..3
  return { year, month, dayOfMonth, season };
}

export function seasonForDay(day) {
  return calendarFromDay(day).season;
}

const CHEAP_FACTOR = 0.8;
const DEAR_FACTOR = 1.25;

/** Pengali harga musiman untuk sebuah komoditas pada hari tertentu. */
export function seasonalFactor(goodId, day) {
  const s = seasonForDay(day);
  if (s.cheap.includes(goodId)) return CHEAP_FACTOR;
  if (s.dear.includes(goodId)) return DEAR_FACTOR;
  return 1;
}

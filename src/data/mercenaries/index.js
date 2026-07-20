// STATUS SAAT INI: satu pool nama mercenary generik dipakai semua negara.
//
// TODO (Fase 7 — konten besar, lihat rencana-migrasi-claude-code.md):
// Pecah ini jadi roster BERBEDA per negara asal, mis:
//   joseon.js  -> unit ala Korea (Hwarang, dst)
//   china.js   -> unit ala China (Shaolin, dst)
//   jepang.js  -> unit ala Jepang (Ronin, dst)
// lalu di genRecruits(nation) pilih dari roster sesuai `state.nation`,
// bukan dari MERC_NAMES generik seperti sekarang.

export const MERC_NAMES = [
  'Prajurit Hwarang',
  'Pendekar Shaolin',
  'Ronin Pengembara',
  'Pemanah Elit',
  'Perisai Baja',
  'Biksu Petarung',
];

export const RANK_NAMES = ['Prajurit', 'Perwira', 'Kapten', 'Jendral', 'Jendral Agung', 'Legenda Perang'];
export const RANK_ICON = ['🪖', '💂', '🎖️', '⚔️', '👑', '🌟'];
export const RANK_BODY_COLOR = ['#8a6a4a', '#9788b8', '#4fd1c5', '#4a90d9', '#f4c542', '#e0523f'];

export const MAX_GENERALS = 6;

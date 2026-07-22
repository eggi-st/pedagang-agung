// Roster jendral berbeda per NEGARA asal kota tempat kamu merekrut.
// genRecruits(nation) memilih dari pool negara itu.
export const NATION_MERCS = {
  Joseon: ['Prajurit Hwarang', 'Pemanah Joseon', 'Pendekar Taekkyon', 'Perisai Baja'],
  Ming: ['Pendekar Shaolin', 'Biksu Petarung', 'Pengawal Kaisar', 'Panah Terbang'],
  Jepang: ['Ronin Pengembara', 'Samurai Bayaran', 'Ninja Bayangan', 'Ashigaru'],
  India: ['Pendekar Kalari', 'Penjaga Kuil', 'Pemanah Rajput', 'Naga Sakti'],
};

// Pool gabungan (fallback bila negara tak dikenal).
export const MERC_NAMES = [...new Set(Object.values(NATION_MERCS).flat())];

export const RANK_NAMES = ['Prajurit', 'Perwira', 'Kapten', 'Jendral', 'Jendral Agung', 'Legenda Perang'];
export const RANK_ICON = ['🪖', '💂', '🎖️', '⚔️', '👑', '🌟'];
export const RANK_BODY_COLOR = ['#8a6a4a', '#9788b8', '#4fd1c5', '#4a90d9', '#f4c542', '#e0523f'];

export const MAX_GENERALS = 6;

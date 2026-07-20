// Kelas karakter dasar + transformasi tahap 2
export const CLASSES = {
  Pedagang: { label: '🧑‍💼 Pedagang', capBonus: 20, discountPct: 5, desc: 'Kapasitas dagang +20, harga beli -5%' },
  Petarung: { label: '🗡️ Petarung', atkFlat: 6, hpFlat: 25, desc: 'ATK dasar +6, HP maksimal +25' },
  Cendekiawan: { label: '📚 Cendekiawan', lukFlat: 3, expPct: 15, desc: 'LUK +3, perolehan EXP +15%' },
};

export const NATION_ICON = { Joseon: '🇰🇷', China: '🇨🇳', Jepang: '🇯🇵' };
export const NATION_BODY_COLOR = { Joseon: '#4a90d9', China: '#e0523f', Jepang: '#5fc36a' };

export const CLASS_TRANSFORM_LEVEL = 15;
export const CLASS_TRANSFORMS = {
  Pedagang: {
    title: 'Saudagar Agung',
    skillName: 'Suap Musuh',
    skillDesc: 'Coba suap musuh terlemah agar langsung kabur/kalah (gagal = tidak ada efek)',
    cooldown: 5,
  },
  Petarung: {
    title: 'Jenderal Perang',
    skillName: 'Serangan Ganda',
    skillDesc: 'Menyerang 2 kali berturut-turut dalam satu giliran',
    cooldown: 4,
  },
  Cendekiawan: {
    title: 'Sarjana Bijak',
    skillName: 'Strategi Cerdas',
    skillDesc: 'Sembuhkan 30 HP + hilangkan racun + buff ATK party 1 giliran',
    cooldown: 5,
  },
};

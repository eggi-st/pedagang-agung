// Template pixel-art (grid ASCII). '.' = transparan, huruf lain = slot warna.
//
// Slot warna humanoid: H=rambut/helm, S=kulit, B=badan/pakaian,
//                      A=aksen (sepatu, trim, bulu helm), W=senjata/properti
// Slot warna monster:  M=badan, E=mata, W=senjata/properti
//
// Semua grid 12 kolom. Tinggi boleh beda-beda — mesin render menyesuaikan
// dan selalu memakai ukuran sel bulat supaya pikselnya tetap tajam.

// ---------- HUMANOID ----------

// Dipakai sebagai fallback dan untuk kelas yang belum punya template khusus.
export const SPRITE_HUMANOID = [
  '....HHHH....',
  '...HHHHHH...',
  '..HSSSSSSH..',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '....SSSS....',
  '..BBBBBBBB..',
  '.BBBBBBBBBB.',
  '.BBBBBBBBBB.',
  '..BBBBBBBB..',
  '...BB..BB...',
  '...BB..BB...',
  '...AA..AA...',
  '..AAA..AAA..',
];

// Pedagang — ransel dagangan di punggung.
export const SPRITE_MERCHANT = [
  '....HHHH....',
  '...HHHHHH...',
  '..HSSSSSSH..',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '....SSSS....',
  '..WBBBBBB...',
  '.WWBBBBBBB..',
  '.WWBBBBBBB..',
  '..BBBBBBBB..',
  '...BB..BB...',
  '...BB..BB...',
  '...AA..AA...',
  '..AAA..AAA..',
];

// Petarung — pedang tegak di sisi kanan.
export const SPRITE_FIGHTER = [
  '....HHHH....',
  '...HHHHHH...',
  '..HSSSSSSH..',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '....SSSS..W.',
  '..BBBBBBB.W.',
  '.BBBBBBBBBW.',
  '.BBBBBBBBBW.',
  '..BBBBBBAW..',
  '...BB..BB...',
  '...BB..BB...',
  '...AA..AA...',
  '..AAA..AAA..',
];

// Cendekiawan — topi sarjana tinggi, gulungan di tangan.
export const SPRITE_SCHOLAR = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '....HHHH....',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '....SSSS....',
  '..BBBBBBBB..',
  '.BBBBBBBBBB.',
  '.BWWBBBBBBB.',
  '..WWBBBBBB..',
  '...BB..BB...',
  '...BB..BB...',
  '...AA..AA...',
  '..AAA..AAA..',
];

// Jendral — helm berbulu, bahu berlapis baja.
export const SPRITE_GENERAL = [
  '.....AA.....',
  '....HHHH....',
  '...HHHHHH...',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '....SSSS....',
  '..ABBBBBBA..',
  '.ABBBBBBBBA.',
  '.ABBBBBBBBA.',
  '..BBBBBBBB..',
  '...BB..BB...',
  '...BB..BB...',
  '...AA..AA...',
  '..AAA..AAA..',
];

// ---------- MONSTER ----------

// Fallback generik untuk musuh yang belum punya bentuk sendiri.
export const SPRITE_MONSTER = [
  '...MMMMMM...',
  '..MMMMMMMM..',
  '..MEMMMMEM..',
  '..MMMMMMMM..',
  '...MMMMMM...',
  '.MMMMMMMMMM.',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  '..MMMMMMMM..',
  '..MM....MM..',
  '..MM....MM..',
  '.MMM....MMM.',
];

export const SPRITE_BANDIT = [
  '...MMMMMM...',
  '..MMMMMMMM..',
  '..MEMMMMEM..',
  '..MMMMMMMM..',
  '...MMMMMM...',
  '..MMMMMMMW..',
  '.MMMMMMMMW..',
  '.MMMMMMMMW..',
  '..MMMMMMM...',
  '..MM....MM..',
  '..MM....MM..',
  '.MMM....MMM.',
];

export const SPRITE_WOLF = [
  '.MM......MM.',
  '.MMM....MMM.',
  '..MMMMMMMM..',
  '.MEMMMMMMEM.',
  '.MMMMMMMMMM.',
  'MMMMMMMMMMMM',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  '..MMMMMMMM..',
  '..M..MM..M..',
  '..M..MM..M..',
  '.MM..MM..MM.',
];

export const SPRITE_ARCHER = [
  '...MMMMMM.W.',
  '..MMMMMMMMW.',
  '..MEMMMMEMW.',
  '..MMMMMMM.W.',
  '...MMMMMM.W.',
  '..MMMMMMMMW.',
  '.MMMMMMMMMW.',
  '.MMMMMMMM.W.',
  '..MMMMMMM...',
  '..MM....MM..',
  '..MM....MM..',
  '.MMM....MMM.',
];

export const SPRITE_DEMON_MERC = [
  '.M........M.',
  '.MM......MM.',
  '..MMMMMMMM..',
  '..MEMMMMEM..',
  '..MMMMMMMM..',
  '...MMMMMM...',
  '.MMMMMMMMMM.',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  '..MMM..MMM..',
  '..MM....MM..',
  '.MMM....MMM.',
];

export const SPRITE_GHOST = [
  '....MMMM....',
  '..MMMMMMMM..',
  '.MMMMMMMMMM.',
  '.MMEMMMMEMM.',
  '.MMMMMMMMMM.',
  '.MMMMMMMMMM.',
  '.MMMMMMMMMM.',
  '.MMMMMMMMMM.',
  '..MMMMMMMM..',
  '..M.MM.MM...',
  '...M.M..M...',
  '....M...M...',
];

export const SPRITE_SPIDER = [
  'M..........M',
  '.M...MM...M.',
  '..M.MMMM.M..',
  '...MMMMMM...',
  '.MMEMMMMEMM.',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  '..MMMMMMMM..',
  '.M.MMMMMM.M.',
  'M...M..M...M',
  '....M..M....',
  '...M....M...',
];

export const SPRITE_GOLEM = [
  '.MMMMMMMMMM.',
  'MMMMMMMMMMMM',
  'MMEMMMMMMEMM',
  'MMMMMMMMMMMM',
  'MMMMMMMMMMMM',
  '.MMMMMMMMMM.',
  'MMMMMMMMMMMM',
  'MMMMMMMMMMMM',
  'MMMMMMMMMMMM',
  '.MMM....MMM.',
  '.MMM....MMM.',
  'MMMM....MMMM',
];

export const SPRITE_GARRISON = [
  '...MMMMMM.W.',
  '..MMMMMMMMW.',
  '..MEMMMMEMW.',
  '..MMMMMMMMW.',
  '...MMMMMM.W.',
  '.MMMMMMMMMW.',
  'MMMMMMMMMMW.',
  'MMMMMMMMMMW.',
  '.MMMMMMMM.W.',
  '..MM....MM..',
  '..MM....MM..',
  '.MMM....MMM.',
];

// ---------- PEMBANDING GAYA (khusus sprite-lab) ----------
//
// Tiga versi serigala untuk menilai dengan mata, bukan dengan argumen:
// datar 12x12 (gaya sekarang), 12x12 berbayang, dan 16x16 berbayang.
//
// Konvensi baru: huruf BESAR = warna dasar, huruf kecil = bayangan
// (dihitung otomatis oleh mesin render, TIDAK digambar tangan — jadi
// pewarnaan dinamis per elemen tetap jalan), 'K' = garis luar.

export const SPRITE_WOLF_SHADED = [
  '.KK......KK.',
  '.KMK....KMK.',
  '..KMMMMMMK..',
  '.KMEMMMMEMK.',
  '.KMMMMMMMmK.',
  'KMMMMMMMMmmK',
  'KMMMMMMMmmmK',
  '.KMMMMMmmmK.',
  '..KMMmmmmK..',
  '..M..MM..m..',
  '..M..MM..m..',
  '.KK..KK..KK.',
];

export const SPRITE_WOLF_HD = [
  '..KK........KK..',
  '..KMK......KMK..',
  '..KMMK....KMMK..',
  '...KMMMMMMMMK...',
  '..KMMMMMMMMMMK..',
  '.KMMEMMMMMMEMMK.',
  '.KMMMMMMMMMMMmK.',
  'KMMMMMMMMMMMMmmK',
  'KMMMMMMMMMMMmmmK',
  'KMMMMMMMMMMmmmmK',
  '.KMMMMMMMMmmmmK.',
  '..KMMMMMMmmmmK..',
  '...KMMMMMMmmmK..',
  '...MM.....mm....',
  '...MM.....mm....',
  '..KKKK...KKKK...',
];

export const DEMO_SPRITE = {
  'demo-datar': SPRITE_WOLF,
  'demo-bayang': SPRITE_WOLF_SHADED,
  'demo-hd': SPRITE_WOLF_HD,
};

// ---------- PEMETAAN ----------

// Nama monster (dari data/monsters.js) -> template bentuknya.
export const MONSTER_SPRITE = {
  'Bandit Jalanan': SPRITE_BANDIT,
  'Serigala Hutan': SPRITE_WOLF,
  'Perampok Bersenjata': SPRITE_ARCHER,
  'Prajurit Bayaran Jahat': SPRITE_DEMON_MERC,
  'Roh Gua': SPRITE_GHOST,
  'Laba-laba Raksasa': SPRITE_SPIDER,
  'Golem Batu': SPRITE_GOLEM,
  'Pasukan Garnisun': SPRITE_GARRISON,
};

// Nama kelas (dari data/classes.js) -> template bentuknya.
export const CLASS_SPRITE = {
  Pedagang: SPRITE_MERCHANT,
  Petarung: SPRITE_FIGHTER,
  Cendekiawan: SPRITE_SCHOLAR,
};

export const SKIN_TONE = '#f4c9a0';

// Warna properti/senjata per konteks — dipisah dari warna badan supaya
// pedang, busur, dan gulungan tetap terbaca di atas pakaian warna apa pun.
export const PROP_COLOR = '#d8d2c4';
export const PACK_COLOR = '#8a5a2b';

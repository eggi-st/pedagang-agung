// Sistem rarity & tipe item rampasan
export const RARITY_RANGE = { Biasa: [4, 9], Langka: [10, 19], Legendaris: [20, 36] };
export const RARITY_SELL = { Biasa: 20, Langka: 70, Legendaris: 220 };
export const RARITY_ORDER = ['Biasa', 'Langka', 'Legendaris'];

export const ITEM_TYPE_NAMES = {
  offensive: {
    Biasa: ['Pedang Karatan', 'Belati Tumpul'],
    Langka: ['Pedang Bayangan', 'Taring Naga'],
    Legendaris: ['Pedang Naga Sakti', 'Bilah Petir'],
  },
  defensive: {
    Biasa: ['Perisai Kayu', 'Sarung Tangan Kulit'],
    Langka: ['Perisai Kutukan', 'Zirah Roh'],
    Legendaris: ['Perisai Dewa Perang', 'Zirah Abadi'],
  },
  balanced: {
    Biasa: ['Cincin Karat', 'Anting Perak'],
    Langka: ['Jimat Naga', 'Kalung Macan'],
    Legendaris: ['Mahkota Kuno', 'Azimat Dewa'],
  },
};

export const TYPE_LABEL = {
  offensive: 'Ofensif (ATK)',
  defensive: 'Defensif (DEF)',
  balanced: 'Seimbang (ATK/DEF/Stat)',
};

export const TYPE_ICON = { offensive: '⚔️', defensive: '🛡️', balanced: '💍' };

export const DIAGRAMS = [
  { id: 'diagram_naga', name: 'Pusaka Naga Agung', type: 'offensive', bonus: 45, goldCost: 200, medalCost: 3 },
  { id: 'diagram_perisai', name: 'Perisai Dewa Abadi', type: 'defensive', bonus: 45, goldCost: 200, medalCost: 3 },
  { id: 'diagram_jimat', name: 'Jimat Kaisar Sejati', type: 'balanced', bonus: 38, goldCost: 180, medalCost: 3 },
];

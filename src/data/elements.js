// Sistem elemen: siklus counter Api > Angin > Bumi > Petir > Air > Api
export const ELEMENTS = ['Api', 'Angin', 'Bumi', 'Petir', 'Air'];

export const ELEMENT_ICON = { Api: '🔥', Angin: '💨', Bumi: '⛰️', Petir: '⚡', Air: '💧' };

export const ELEMENT_BODY_COLOR = {
  Api: '#e0523f',
  Angin: '#4fd1c5',
  Bumi: '#8a6a4a',
  Petir: '#f4c542',
  Air: '#4a90d9',
};

/**
 * Hitung multiplier damage berdasarkan elemen penyerang vs elemen target.
 * atkElem "menang" atas elemen berikutnya dalam siklus (index+1) -> 1.3x
 * atkElem "kalah" jika target adalah elemen sebelumnya dalam siklus -> 0.75x
 */
export function elementMultiplier(atkElem, defElem) {
  if (!atkElem || !defElem) return 1;
  const ai = ELEMENTS.indexOf(atkElem);
  const di = ELEMENTS.indexOf(defElem);
  if (ai < 0 || di < 0 || ai === di) return 1;
  if ((ai + 1) % 5 === di) return 1.3;
  if ((di + 1) % 5 === ai) return 0.75;
  return 1;
}

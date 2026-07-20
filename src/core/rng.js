// Angka acak. Sengaja dipisah supaya nanti bisa diganti generator
// ber-seed saat menulis test distribusi drop rate (Fase 4).

/** Bilangan bulat acak antara min dan max, keduanya inklusif. */
export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

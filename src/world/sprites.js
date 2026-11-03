// ============================================================
// src/world/sprites.js — loader sprite PNG (art AI gaya 16-bit JRPG).
// PNG diproses jadi transparan saat build aset (lihat art-samples/).
// Render selalu dengan imageSmoothingEnabled=false (pixelated).
// ============================================================

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('gagal memuat sprite: ' + src));
    img.src = src;
  });
}

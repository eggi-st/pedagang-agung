// ============================================================
// src/world/draw.js — STANDAR ukuran & gambar sprite.
// Masalah yang diperbaiki: tiap sprite digambar paksa ke kotak
// tetap (monster 36x44, NPC 30x52) tanpa peduli rasio asli,
// sehingga laba-laba gepeng, NPC melar, tiap state goblin
// penyok beda-beda. Standar baru:
//   - Tiap kategori punya TINGGI baku; lebar = ikut rasio asli.
//   - Jangkar: kaki di (x, feetY) untuk semua karakter.
//   - Bayangan proporsional terhadap lebar gambar.
// Animasi prosedural (tilt/lunge/flash/fall/breathe) juga di sini
// agar konsisten di semua aktor.
// ============================================================

// Tinggi baku per kategori (px game). Lebar dihitung dari rasio sprite.
export const SPRITE_HEIGHT = {
  player: 70,
  companion: 60,
  npc: 52,
  monster: 48,
};

// Ukuran gambar dari dimensi asli (w0, h0): tinggi baku, lebar ikut rasio.
// Tidak pernah gepeng/melar. Mengembalikan { w, h }.
export function drawSize(w0, h0, targetH) {
  if (!h0 || h0 <= 0 || !w0 || w0 <= 0) return { w: targetH, h: targetH };
  return { w: (targetH * w0) / h0, h: targetH };
}

// Bayangan elips di kaki, lebar proporsional.
export function drawShadow(ctx, x, feetY, w, alpha = 0.25) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, feetY - 2, Math.max(4, w * 0.32), Math.max(2, w * 0.11), 0, 0, Math.PI * 2);
  ctx.fill();
}

// Gambar aktor berjangkar kaki.
// opts:
//   tilt    — kemiringan (radian) di sekitar kaki, mis. goyang jalan.
//   dx, dy  — offset tambahan (mis. lunge menyerang).
//   flash   — 0..1, kilau putih (kena pukul). 1 = terang 2x.
//   fall    — 0..1, roboh ke samping + memudar (kematian/pingsan).
//   breathe — sudut fase napas (radian); null = mati.
//   alpha   — transparansi dasar.
export function drawActor(ctx, img, x, feetY, w, h, opts = {}) {
  if (!img) return;
  const { tilt = 0, dx = 0, dy = 0, flash = 0, fall = 0, breathe = null, alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (1 - fall * 0.75)));
  ctx.translate(x + dx, feetY + dy);
  ctx.rotate(tilt + fall * Math.PI * 0.45);
  if (flash > 0) ctx.filter = `brightness(${1 + Math.min(1, flash) * 1.2})`;
  const bh = breathe === null ? 1 : 1 + Math.sin(breathe) * 0.02;
  const bw = breathe === null ? 1 : 1 - Math.sin(breathe) * 0.01;
  ctx.drawImage(img, (-w * bw) / 2, -h * bh, w * bw, h * bh);
  ctx.restore();
}

// Progres kilau dari sisa timer: sisa/durasi -> 0..1.
export function flashProgress(remain, duration) {
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(1, remain / duration));
}

// Gambar satu frame dari spritesheet (sx, sy, ukuran frame fs),
// berjangkar kaki. opts sama seperti drawActor.
export function drawSheetFrame(ctx, sheet, sx, sy, fs, x, feetY, w, h, opts = {}) {
  if (!sheet) return;
  const { tilt = 0, dx = 0, dy = 0, flash = 0, fall = 0, alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (1 - fall * 0.75)));
  ctx.translate(x + dx, feetY + dy);
  ctx.rotate(tilt + fall * Math.PI * 0.45);
  if (flash > 0) ctx.filter = `brightness(${1 + Math.min(1, flash) * 1.2})`;
  ctx.drawImage(sheet, sx, sy, fs, fs, -w / 2, -h, w, h);
  ctx.restore();
}

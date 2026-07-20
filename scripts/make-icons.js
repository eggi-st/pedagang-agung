// Membuat ikon PWA dari template sprite yang sudah ada di src/data/sprites.js.
//
// Digenerate, bukan digambar tangan, supaya tetap konsisten dengan seluruh
// proyek: nol aset gambar yang dikelola manual. Kalau sprite pedagangnya
// diubah, jalankan ulang `npm run icons` dan ikonnya ikut berubah.
//
// PNG ditulis manual (zlib bawaan Node + CRC32) supaya tidak perlu
// dependensi tambahan apa pun.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { SPRITE_MERCHANT, SKIN_TONE, PACK_COLOR } from '../src/data/sprites.js';

const TABEL_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABEL_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(tipe, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const isi = Buffer.concat([Buffer.from(tipe, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(isi));
  return Buffer.concat([len, isi, crc]);
}

/** @param {Uint8Array} rgba panjang = w*h*4 */
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // 10-12 = compression, filter, interlace = 0

  // Tiap baris diawali byte filter 0 (None).
  const baris = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    baris[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4)
      .copy(baris, y * (w * 4 + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(baris, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const gelap = (c, f) => c.map((v) => Math.max(0, Math.round(v * f)));

// Slot warna sprite pedagang. Huruf kecil = bayangan, mengikuti konvensi
// yang dipakai mesin render di ui/sprites.js.
const DASAR = {
  H: hex('#2a1a0a'),
  S: hex(SKIN_TONE),
  B: hex('#f4c542'),
  A: hex('#a5820a'),
  W: hex(PACK_COLOR),
};
const WARNA = { ...DASAR };
for (const [k, v] of Object.entries(DASAR)) WARNA[k.toLowerCase()] = gelap(v, 0.62);

const LATAR = hex('#2b2140');
const PINGGIR = hex('#f4c542');

function buatIkon(ukuran) {
  const rgba = new Uint8Array(ukuran * ukuran * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= ukuran || y >= ukuran) return;
    const i = (y * ukuran + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };

  // Latar penuh + bingkai emas tipis.
  for (let y = 0; y < ukuran; y++) for (let x = 0; x < ukuran; x++) set(x, y, LATAR);
  const tebal = Math.max(2, Math.round(ukuran * 0.025));
  for (let y = 0; y < ukuran; y++) {
    for (let x = 0; x < ukuran; x++) {
      if (x < tebal || y < tebal || x >= ukuran - tebal || y >= ukuran - tebal) set(x, y, PINGGIR);
    }
  }

  // Sprite di tengah, ukuran sel bulat supaya pikselnya tetap tajam.
  const kolom = SPRITE_MERCHANT[0].length;
  const barisSprite = SPRITE_MERCHANT.length;
  const sel = Math.max(1, Math.floor((ukuran * 0.72) / barisSprite));
  const offX = Math.floor((ukuran - kolom * sel) / 2);
  const offY = Math.floor((ukuran - barisSprite * sel) / 2);

  for (let r = 0; r < barisSprite; r++) {
    for (let c = 0; c < kolom; c++) {
      const ch = SPRITE_MERCHANT[r][c];
      if (ch === '.') continue;
      const warna = WARNA[ch];
      if (!warna) continue;
      for (let dy = 0; dy < sel; dy++) {
        for (let dx = 0; dx < sel; dx++) set(offX + c * sel + dx, offY + r * sel + dy, warna);
      }
    }
  }

  return encodePNG(ukuran, ukuran, rgba);
}

mkdirSync('public/icons', { recursive: true });
for (const ukuran of [192, 512]) {
  const png = buatIkon(ukuran);
  writeFileSync(`public/icons/icon-${ukuran}.png`, png);
  console.log(`public/icons/icon-${ukuran}.png — ${png.length} byte`);
}

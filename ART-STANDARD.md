# ATURAN ASET — Pedagang Agung

Keputusan Eggi, 3 Nov 2026. Menggantikan aturan "semua aset original" (2 Nov 2026).

## Standar

**Semua karakter dan monster** dibuat via
[Universal LPC Spritesheet Character Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/)
— pilih part satu per satu (body, head, hair, torso, legs, dst), lalu export.

Alasan: sprite AI tidak seragam dan kualitasnya di bawah standar; sprite LPC
selaras, lengkap (idle/walk/slash/hurt/dll), dan gaya pokesurvivor.

## Prosedur per aset

1. Susun karakter di generator (pilih tiap kategori satu per satu).
2. Export **full spritesheet PNG** + file **Credits (TXT)** dari generator.
3. Simpan di `public/assets/sprites/lpc/<nama>.png` dan `CREDITS.txt` di folder yang sama.
4. Daftarkan di engine via `src/world/lpc.js` (layout kanonis: frame 64x64,
   13 kolom, urutan arah up/left/down/right).

## Lisensi (wajib)

Semua aset LPC berlisensi **CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0**:
komersial boleh, **atribusi wajib**. File `CREDITS.txt` per sprite adalah
bukti atribusi — jangan dihapus. Daftar penulis juga dicatat di bawah.

## Roster generator (terverifikasi dari source generator)

- Manusia: male/female/teen/child/muscular/pregnant + semua pakaian/rambut.
- Monster humanoid: **goblin, orc, troll, skeleton, zombie, vampire,
  frankenstein, lizard** (+ ekor/sayap).
- TIDAK ADA di generator: laba-laba, jamur, serigala utuh
  (hanya telinga/ekor serigala).

## Roster monster game (keputusan Eggi 3 Nov 2026)

Monster yang tidak ada di generator DIGANTI (bukan dicari di luar):
laba-laba → Orc Hutan, serigala → Skeleton Liar, jamur → Troll Rawa.
Stat/level/elemen/role slot dipertahankan; drop eksklusif diganti mengikuti
identitas baru (item lama dipertahankan sebagai LEGACY di data/items.js
agar save lama tidak rusak).

## Daftar aset dipakai

| Nama file | Karakter | Penulis utama | Tanggal |
|---|---|---|---|
| `pedagang-lpc.png` | Pedagang Joseon (topknot, cardigan biru) | lihat CREDITS.txt | 3 Nov 2026 |
| `orc-hutan.png` | Orc Hutan (hijau, sleeveless walnut) | lihat CREDITS-orc-hutan.txt | 3 Nov 2026 |
| `skeleton-liar.png` | Skeleton Liar (kerangka utuh) | lihat CREDITS-skeleton-liar.txt | 3 Nov 2026 |
| `troll-rawa.png` | Troll Rawa (hijau gelap, sleeveless walnut) | lihat CREDITS-troll-rawa.txt | 3 Nov 2026 |

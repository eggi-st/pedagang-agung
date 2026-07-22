# Prompt Gambar (ChatGPT / DALL·E) — Monster Legendaris & Latar Kota

Kamu bisa generate gambar ini di ChatGPT, lalu kirim ke sini untuk aku
masukkan ke game (mengganti sprite placeholder). Monster legendaris cocok
pakai gambar eksternal karena elemennya TETAP per negara (tak perlu
pewarnaan dinamis seperti monster biasa).

## Spesifikasi konsisten (sertakan di SEMUA prompt)
- **Gaya:** pixel art 8-bit/16-bit, low-res, tajam (bukan halus/anti-alias).
- **Ukuran:** kanvas persegi, subjek mengisi ~80%, **latar transparan** (PNG).
- **Palet game (agar menyatu):** ungu gelap `#2b2140`, emas `#f4c542`,
  merah `#e0523f`, hijau `#5fc36a`, biru `#4a90d9`, teks terang `#ede4ff`.
- **Tanpa teks/watermark.** Satu subjek, menghadap depan/3-per-empat.

## Monster Legendaris (신수 per negara)

**1. Joseon — Harimau Roh Baekdu** (elemen Angin 💨)
> Pixel art sprite, transparent background: a majestic spirit tiger of Mount
> Baekdu, white-and-cyan glowing fur, wind swirls around it, fierce but noble,
> 8-bit low-res, sharp pixels, palette leaning cyan/white/gold, facing 3/4,
> subject fills 80% of a square canvas, no text.

**2. Ming (China) — Naga Kaisar Giok** (elemen Air 💧)
> Pixel art sprite, transparent background: an imperial Chinese jade dragon,
> serpentine, teal-and-gold scales, flowing water motifs, regal, 8-bit low-res,
> sharp pixels, palette teal/gold, coiled facing the viewer, fills 80% of a
> square canvas, no text.

**3. Jepang — Oni Merah Agung** (elemen Api 🔥)
> Pixel art sprite, transparent background: a great red oni demon, muscular,
> two horns, fanged, holding a kanabo club, flames around fists, menacing,
> 8-bit low-res, sharp pixels, palette red/black/gold, facing front, fills 80%
> of a square canvas, no text.

**4. India — Gajah Perang Suci** (elemen Bumi ⛰️)
> Pixel art sprite, transparent background: a sacred armored war elephant,
> ornate gold-and-earth barding, tusks capped in metal, stoic and massive,
> 8-bit low-res, sharp pixels, palette earthy brown/gold, side-facing, fills
> 80% of a square canvas, no text.

## (Opsional) Latar Kota — untuk Fase 4 identitas kota
Satu latar per kota, gaya sama, lebar (rasio ~2:1), untuk header/peta:
- **Hanseong (Joseon):** istana bergaya Korea (Gyeongbokgung), gunung, senja.
- **Beijing (Ming):** Kota Terlarang, atap emas, kabut.
- **Kyoto (Jepang):** kuil merah torii, sakura.
- **Taipei (Ming):** pelabuhan pasar ramai, lampion.
- **Chennai (India):** kuil batu ukir, warna hangat.

## Cara integrasi (setelah kamu kirim gambar)
- Aku simpan sebagai PNG kecil, sisipkan sebagai sprite legendaris (ganti
  placeholder di `MONSTER_SPRITE`), atau sebagai latar kota (Fase 4).
- Idealnya sudah pixel-perfect & latar transparan; kalau belum, aku rapikan.

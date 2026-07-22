# Rencana Pengembangan Visual & Tema — Pedagang Agung

Dokumen ini memecah pekerjaan "bikin cantik & konsisten" jadi fase-fase yang
bisa diproses satu per satu, dengan game tetap jalan dan bisa di-deploy di
tiap langkah (sama seperti pemecahan Fase 2).

---

## Analisa Kondisi Sekarang (jujur)

**Yang sudah bagus:**
- Palet warna sudah terdefinisi di `:root` (ungu/emas/gelap) dan cukup konsisten.
- Panel sudah bergaya 8-bit (border tebal, inset, bayangan drop).
- Layout responsif sudah jalan (HP / tablet / desktop).
- Mesin sprite prosedural + bayangan terhitung sudah ada (nol aset).
- Rarity item sudah punya treatment warna (border/glow).

**Masalah nyata yang ditemukan (dari audit kode):**
1. **Emoji vs pixel art bentrok.** UI penuh emoji (🇰🇷 🗡️ 🏭 🏛️ dst, ratusan
   pemakaian). Emoji dirender beda tiap perangkat/OS dan tabrakan gaya dengan
   sprite piksel. Ini penyebab utama terasa "tidak satu tema".
2. **Style ad-hoc tersebar.** Banyak `style="font-size:6.5px;color:var(--dim)"`
   ditempel langsung di template render (17× dim, 14× 6.5px, dst). Susah
   dipoles serentak, gampang tidak konsisten.
3. **Gaya sprite belum diputuskan.** Ada 3 opsi di sprite-lab (datar / berbayang
   / 16×16) tapi belum dipilih. Semua sprite masih pakai yang datar.
4. **Modal generik.** `event-overlay` & `battle-overlay` cuma memakai `.panel`
   biasa — belum ada bingkai bertema (dekret/gulungan untuk event, panji perang
   untuk tempur).
5. **Animasi tempur tidak tersambung.** `playSpriteAnim` (attack/hit/cast/defeat)
   sudah dibuat & diuji, tapi battle nyata masih pakai `.hit-flash` CSS —
   engine-nya nganggur.
6. **Tidak ada identitas kota / latar.** Semua kota identik kecuali nama +
   1 emoji. Perjalanan tidak terasa berpindah tempat.
7. **Suara sebagian nganggur.** `sfx`/`playMusic` sudah dipanggil, tapi banyak
   momen tanpa umpan balik audio/haptik.

---

## Arah Seni yang Diusulkan

**Tema:** kekaisaran dagang Asia Timur (Joseon–Ming–Jepang), nuansa
"saudagar & kerajaan". Bukan fantasi generik.

**Prinsip:**
- **Pixel-first.** Ganti emoji fungsional dengan ikon piksel bergaya seragam
  (atau perlakuan khusus kalau emoji dipertahankan). Satu bahasa visual.
- **Palet bernama & bermakna:** emas kekaisaran (kekayaan/dagang), ungu ningrat
  (UI/panel), giok/teal (kemakmuran/perdagangan), merah darah (tempur),
  gelap malam (latar). Sebagian besar sudah ada — tinggal dikodifikasi & dipakai
  konsisten.
- **Bingkai bertema:** panel dagang terasa seperti buku besar/pasar; panel
  wilayah seperti panji/heraldik; modal event seperti gulungan dekret.
- **Konsistensi > kemewahan.** Satu sistem yang rapi mengalahkan banyak efek
  yang tabrakan.

---

## Fase-Fase

### Fase 0 — Kunci Arah (mockup)
**Tujuan:** lihat target sebelum mengubah apa pun secara luas.
**Kerja:** 1 mockup visual (layar dagang + 1 modal + 1 kartu kota) dengan
palet, bingkai, dan ikon versi baru — untuk disetujui/diubah dulu.
**Kenapa duluan:** mengecat seluruh game "buta" berisiko dikerjakan dua kali.
**Risiko:** nol (belum menyentuh game).

### Fase 1 — Sistem Warna & Komponen Bingkai (fondasi)
**Tujuan:** satu sumber kebenaran untuk warna, ukuran, dan bingkai.
**Kerja:**
- Kodifikasi palet bernama + skala ukuran di `styles/` (sebagian sudah ada).
- Bereskan style ad-hoc di `render.js` jadi kelas komponen (mis. `.hint`,
  `.muted`, `.section-note`) — hapus `style="..."` tersebar.
- Komponen bingkai bertema: `.panel--ledger`, `.panel--banner`, sudut hias.
**File:** `styles/base.css` (+ mungkin `styles/components.css`), `src/ui/render.js`.
**Verifikasi:** semua tab render sama fungsinya, nol regresi; ukur di 3 lebar.
**Risiko:** rendah (murni presentasi).

### Fase 2 — Sprite: Putuskan Gaya + Kembangkan
**Tujuan:** naikkan kualitas & konsistensi sprite.
**Kerja:**
- Putuskan gaya (rekomendasi: **16×16 berbayang**) lalu terapkan ke semua.
- Ganti emoji barang/aksi dgn ikon piksel seragam (komoditas, senjata, item).
- Sprite identitas kota (skyline/ikon per kota).
**File:** `src/data/sprites.js`, `src/ui/sprites.js`, template di `render.js`.
**Verifikasi:** sprite-lab + cek di game; ukuran bundle tetap wajar.
**Risiko:** sedang (banyak titik pemakaian emoji).

### Fase 3 — Modal, Pop-up & Layar Judul Berbingkai
**Tujuan:** momen penting terasa istimewa.
**Kerja:**
- Bingkai bertema untuk `event-overlay` (gulungan/dekret) & `battle-overlay`
  (panji perang) + animasi masuk lebih baik + latar gelap bertekstur.
- Poles layar judul & pemilihan negara/kelas (sudah bersprite, tinggal frame).
**File:** `index.html`, `styles/base.css`, `src/ui/overlay.js`, `battle-ui.js`.
**Verifikasi:** buka tiap overlay, cek animasi & keterbacaan; reduced-motion.
**Risiko:** rendah–sedang.

### Fase 4 — Identitas Layar per Konteks + Latar Kota
**Tujuan:** tiap layar terasa "tempat", bukan daftar seragam.
**Kerja:**
- Warna tema + latar/siluet per kota; header kota yang berkarakter.
- Layar dagang = nuansa pasar/buku besar; wilayah = heraldik; tempur = arena.
- Transisi antar-tab/kota yang halus.
**File:** `render.js` (per-tab), `styles/`, `data/world.js` (warna kota).
**Verifikasi:** keliling kota, cek tiap kota beda & tetap ringan di HP.
**Risiko:** sedang.

### Fase 5 — Polish Mikro & Umpan Balik
**Tujuan:** game terasa "hidup" dan responsif.
**Kerja:**
- **Sambungkan animasi tempur** (`playSpriteAnim`) ke aksi serang/kena/tumbang
  — engine sudah ada, tinggal dipanggil dari `battle.js`/`battle-ui.js`.
- Angka melayang (+180g, +EXP), counter berdetak.
- Lengkapi umpan balik suara + haptik di momen yang belum.
- Font piksel di-self-host (offline sudah tercache SW, tapi self-host lebih pasti).
**File:** `battle-ui.js`, `battle.js`, `render.js`, `audio/*`, `styles/`.
**Verifikasi:** main satu sesi penuh; reduced-motion tetap hormat.
**Risiko:** rendah–sedang.

---

## Track Paralel — 2 Lubang Gameplay (jangan dilupakan)

Ini BUKAN visual, tapi menentukan apakah game seru. Disisipkan di sela fase:
- **#2 Kalah tempur ada konsekuensi.** `loseBattle` (`systems/battle.js`) kini
  gratis total — menang jadi tak berarti.
- **#3 Tempur jatuhkan loot, bukan gold gratis.** Supaya dagang tetap jadi
  jantung permainan (+ skill nego ala Xian). Lihat riset Xian.

**Catatan prioritas jujur:** visual bikin game *menarik dipandang*; dua lubang
ini bikin game *seru dimainkan*. Idealnya jalan berbarengan — poles Fase 1–2
sambil menutup #3. Tak ada yang bertahan main game dagang karena sprite-nya
bagus kalau loop-nya belum terasa; sebaliknya loop bagus tapi jelek dipandang
kurang mengundang teman mencoba. Keduanya perlu.

---

## Urutan yang Disarankan
Fase 0 (mockup, kunci arah) → Fase 1 (fondasi warna/komponen) → sisipkan #3 →
Fase 2 (sprite) → Fase 3 (modal) → sisipkan #2 → Fase 4 (identitas layar) →
Fase 5 (polish).

Tiap fase: 1+ commit, diverifikasi di browser, di-push → auto-deploy ke
`pedagang-agung.vercel.app`.

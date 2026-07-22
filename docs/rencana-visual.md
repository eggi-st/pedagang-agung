# Rencana Pengembangan — Pedagang Agung (Visual, Konten & Kejelasan)

Roadmap terarah untuk membuat game **jelas, konsisten, dan bertema**. Tiap fase
bisa diproses satu per satu, game tetap jalan & bisa di-deploy di tiap langkah.

## Keputusan Arah (dikunci)
- **Gaya:** tetap **piksel 8-bit**, dipertajam (bayangan + ikon piksel). Koheren
  dengan yang sudah ada, nol biaya artis, pewarnaan dinamis tetap jalan.
- **Warna:** **disiplin 4 peran** (lihat Fase 1) — bukan 7 aksen bebas.
- **Emoji fungsional diganti ikon piksel** supaya satu bahasa visual.

---

## Analisa Kondisi Sekarang
**Bagus:** palet terdefinisi, panel 8-bit, responsif, mesin sprite + bayangan,
rarity item bertreatment, harga pasar bereaksi (baru).

**Masalah (audit kode):**
1. **Warna terlalu banyak** — 7 aksen (emas/merah/hijau/biru/ungu/teal/oranye)
   dipakai bebas; statbar & tag jadi pelangi → membingungkan.
2. **Emoji vs pixel bentrok** — ratusan emoji, render beda tiap HP.
3. **Style ad-hoc tersebar** di template render (susah dipoles serentak).
4. **Gaya sprite belum diterapkan** (opsi berbayang/16×16 belum dipakai).
5. **Modal generik** (event/battle overlay belum bertema).
6. **Peta cuma daftar kartu** — belum berbentuk peta, perjalanan tak terasa.
7. **Animasi tempur nganggur** (`playSpriteAnim` belum dipanggil battle).
8. **Belum ada nama pemain**; status & inventory bisa lebih jelas.
9. **Jenis monster terbatas** (8), tabel drop generik.

---

## Palet Disiplin (4 Peran) — inti Fase 1
Dari 7 aksen → 4 peran + netral. Prinsip: **satu jenis aksi = satu warna, selalu.**

| Peran | Warna | Dipakai untuk |
|---|---|---|
| **Kekayaan / aksi utama** | Emas | Beli, mulai, klaim gold, judul, angka penting |
| **Bahaya / tempur / lepas** | Merah | Jual, serang, reset, HP musuh |
| **Aman / berhasil** | Hijau | Klaim reward, milik, HP sendiri, konfirmasi |
| **Info / navigasi** | Biru | Pakai/equip, tab aktif, perjalanan, sekunder |
| Netral (chrome) | Ungu gelap panel | Tombol sekunder, tab non-aktif, latar |
| Teks | Terang / redup | Teks utama & sekunder |

Oranye→dilebur ke Emas, Teal→dilebur ke Biru, Ungu-aksen→Netral. Ungu terang
hanya untuk skill/transformasi (efek "spesial", jarang). Statbar ditenangkan:
nilai default emas, hanya HP hijau — bukan lima warna sekaligus.

---

## Fase-Fase

### Fase 0 — Mockup arah *(opsional, cepat)*
Satu mockup layar dagang + modal + kartu kota dengan palet & ikon baru untuk
disetujui sebelum diterapkan luas.

### Fase 1 — Disiplin Warna + Komponen *(mulai di sini)*
- Terapkan palet 4 peran (lebur oranye/teal/ungu-aksen).
- Tenangkan statbar & tag (kurangi ragam warna serempak).
- Bereskan style ad-hoc jadi kelas komponen (`.hint`, `.muted`, `.note`).
- File: `styles/base.css`, `src/ui/render.js`. Risiko rendah (presentasi).

### Fase 2 — Kejelasan & Identitas Pemain
- **Nama pemain**: input saat buat karakter → `state.playerName`, tampil di
  status, layar akhir, dan gelar. File: `index.html`, `game.js`, `render.js`,
  `state.js`, `save.js` (+migrasi).
- **Status karakter lebih jelas**: kelompokkan stat (tempur/dagang), label jelas,
  tampilkan efek elemen senjata & bonus reputasi kota.
- **Inventory lebih rapi**: pisah tas rampasan / gudang gear / barang olahan
  dengan header & ikon konsisten; sortir per rarity.

### Fase 3 — Sprite & Ikon Piksel + Jenis Monster
- Terapkan gaya sprite final (rekomendasi **16×16 berbayang**).
- **Ganti emoji fungsional** (komoditas, senjata, aksi, kota) dgn ikon piksel.
- **Perbanyak jenis monster** + sprite khas per jenis + tabel drop per region;
  musuh menyesuaikan kota/dungeon, bukan satu pool generik.
- File: `data/sprites.js`, `data/monsters.js`, `ui/sprites.js`, template render.

### Fase 4 — Peta Visual (bentuk maps)
- Ubah daftar kota jadi **peta sesungguhnya**: kota berposisi, rute tergambar,
  posisimu ditandai, wilayah kekuasaan diwarnai. Canvas titik+garis sederhana.
- Jarak antar kota terasa → keputusan perjalanan lebih bermakna.
- File: `ui/render.js` (peta), `data/world.js` (koordinat kota).

### Fase 5 — Modal, Pop-up & Layar Judul Berbingkai
- Event overlay = gulungan/dekret; battle overlay = panji perang; animasi masuk
  & latar bertekstur. Poles layar judul & pemilihan negara/kelas.
- File: `index.html`, `styles/`, `ui/overlay.js`, `ui/battle-ui.js`.

### Fase 6 — Identitas Layar per Konteks + Latar Kota
- Warna tema + siluet/latar per kota; header kota berkarakter; transisi halus.
- Dagang = nuansa pasar/buku besar; wilayah = heraldik; tempur = arena.

### Fase 7 — Polish & Umpan Balik
- **Sambungkan `playSpriteAnim`** ke serang/kena/tumbang (engine sudah ada).
- Angka melayang (+180g/+EXP), counter berdetak, suara & haptik dilengkapi.
- Font piksel self-host.

---

## Track Konten & Sistem Gameplay (Xian-inspired)
Fitur yang diminta, dipetakan ke mekanik Xian. Dikerjakan bertahap.
- ✅ **Heal di luar pertempuran (Penginapan)** — pulihkan HP kamu + jendral,
  biaya sesuai HP hilang. (selesai)
- ✅ **Equip karakter diperdalam** — slot tubuh: senjata, kepala, badan, celana,
  sepatu + 2 aksesoris; toko per-slot, DEF menjumlah, migrasi save lama. (selesai)
- **Equip pasukan (jendral)** — beri jendral senjata/aksesori sendiri (bukan cuma
  karakter utama). Butuh: slot equip per jendral, efek stat, UI di kartu jendral.
- **Slot tambahan (dan lainnya)** — sarung tangan, jubah/cape, cincin; efek stat
  khusus per slot (mis. sepatu → AGI).
- **Jendral lebih dalam** — elemen & formasi lebih jelas (garda depan/belakang
  berpengaruh), sinergi antar-jendral, tampilan pangkat & syarat promosi jelas.
- **Dungeon lebih banyak & bervariasi** — dungeon per region, bos unik bertema,
  tabel drop khas, kedalaman/kesulitan berjenjang (bukan 1 pool generik).
- **Quest lebih jelas & beragam** — UI misi lebih terbaca (progress, reward,
  lokasi), jenis misi baru (antar-barang, buru monster spesifik, kuasai wilayah),
  rantai misi guild.
- **Jenis monster lebih banyak** (lihat Fase 3) — sprite khas + elemen + drop.
- **Hal menyenangkan lain (Xian):** event pasar acak (festival/kelangkaan),
  reputasi kota berjenjang dengan manfaat, gelar/achievement lebih kaya,
  New Game+ yang lebih bermakna, rute dagang & kapal (jangka panjang).

## Track Paralel — Gameplay (bukan visual, tapi penentu keseruan)
- **#2 Kalah tempur ada konsekuensi** — `loseBattle` kini gratis total.
- **#3 Tempur jatuhkan loot, bukan gold gratis** (+ skill nego) — agar dagang
  tetap jadi jantung permainan.
Disisipkan di sela fase visual; keduanya perlu (menarik dipandang ≠ seru dimainkan).

---

## Urutan Disarankan
Fase 1 (warna/kejelasan) → Fase 2 (nama/status/inventory) → sisip #3 →
Fase 3 (sprite/ikon/monster) → Fase 4 (peta) → Fase 5 (modal) → sisip #2 →
Fase 6 (identitas layar) → Fase 7 (polish).

Tiap fase: 1+ commit, diverifikasi di browser, di-push → auto-deploy.

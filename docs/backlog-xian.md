# Backlog Pengembangan — Pedagang Agung (arah Xian: pembangunan pasukan)

## Reframe Identitas (penting)
Xian (거상) BUKAN 100% dagang — inti sebenarnya **membangun pasukan besar**,
dengan dagang sebagai mesin ekonomi yang mendanainya. Ini menggeser arah:
lean lebih dalam ke progression pasukan/karakter & pertempuran, dengan dagang
sebagai fondasi (yang sudah dibuat bereaksi).

## Apa yang Terverifikasi dari Riset vs dari Ingatan Pemain
Riset mendalam ke sumber Korea MENGONFIRMASI: credit level (progresi ekonomi
terpisah dari level tempur), sistem 5 elemen, promosi ber-gate, formasi
craftable, skill nego. Riset TIDAK bisa mengonfirmasi (bahkan cenderung
menyangkal) roster per-negara, dan TIDAK punya data soal: rasa lapar/makan,
skill & combo jendral, barak, inventory pusat.

**Kesimpulan jujur:** untuk hal-hal itu, INGATAN PEMAIN lebih andal daripada
riset AI. Fitur di bawah yang bertanda (ingatan) dibangun dari deskripsi pemain,
bukan klaim terverifikasi — kalau ada detail Xian yang perlu diluruskan, koreksi
dari pemain menang.

---

## SUDAH SELESAI
- Harga pasar bereaksi (jual menekan, beli menaikkan, pulih harian).
- Nama pemain; disiplin warna (4 peran); penginapan (heal luar tempur).
- Equip karakter multi-slot (kepala/badan/celana/sepatu + senjata + 2 aksesori).
- Pasukan monster (tangkap monster kalah jadi prajurit).
- Persenjatai pasukan (senjata cadangan → ATK + ganti elemen).

---

## BACKLOG

### Ekonomi Produksi & Geografi
- ✅ **Pabrik per-kota + kepemilikan** — tiap kota punya pabrik berbeda; harus
  DIBELI (300g) dulu; isi kebutuhan → produksi jalan otomatis seiring hari
  (biaya produksi) → hasil dijual ke pasar. Banyak pabrik bisa jalan paralel.
  (selesai)
- ✅ **Kapal antar-negara + geografi per-negara** — tiap kota punya negara
  (CITY_NATION); perjalanan dalam negara = darat (1 hari, gratis), antar negara
  = kapal (2 hari + ongkos 50g). Daftar tujuan & peta menampilkan mode & negara.
  Pemulihan harga berjalan per hari yang dilewati. (selesai)
  Lanjutan: ongkos/durasi kapal per jarak; lebih banyak kota per negara.
- **Slot pabrik lebih dari satu per kota / upgrade kapasitas** — perluasan
  produksi.

### Waktu & Kalender
- ✅ **Kalender + musim** — day ditampilkan sebagai Tahun/Bulan/Hari; 4 musim
  (Semi/Panas/Gugur/Dingin) memodulasi harga (barang tertentu murah/mahal per
  musim, ±20-25% ke baseline). Berbasis giliran, TANPA jam real-time (keputusan
  sadar: decay real-time menghukum pemain hobi offline & bentrok ekonomi
  giliran). (selesai)
  Analisa lengkap: Xian pakai jam real-time (1 hari-game ~48 mnt nyata) karena
  MMO persisten; tidak cocok ditiru untuk single-player offline.

### A. Progression & Survival
- ✅ **Level per anggota** — jendral & monster dapat EXP dan naik level sendiri.
- ✅ **Rasa lapar & makan** — kenyang (state.satiety, HUD) turun 8/hari; habis =
  kehilangan 8 HP/hari (bisa berujung game over). Warung makan: 15g, +45 kenyang.
  (selesai)
- ✅ **Konsekuensi kalah** — kabur berhasil menjatuhkan 10% gold; kalah tempur
  (char HP 0) = game over sejak awal. (selesai)

### B. Konten per-Negara (ingatan)
- ✅ **Jendral khas per negara** — NATION_MERCS: Joseon/Ming/Jepang/India punya
  roster nama jendral sendiri; genRecruits(nation) memilih sesuai kota. (selesai)
- ✅ **Monster khas per negara** — NATION_MONSTERS: encounter perjalanan memakai
  pool monster negara tujuan; monster yang dilawan & ditangkap beda antar negara.
  (selesai)
- ✅ **Monster legendaris per negara (신수)** — LEGENDARY per negara (Harimau Roh
  Baekdu/Naga Kaisar Giok/Oni Merah Agung/Gajah Perang Suci). "Berburu" di kota
  (butuh Lv8+); menang = menjinakkannya jadi pasukan legendaris + 6 medali;
  sekali per negara. Sprite masih PLACEHOLDER (bentuk besar yang ada) — prompt
  art asli di docs/prompt-gambar.md. (mekanik selesai; art menyusul)
- Lanjutan: stat/elemen jendral khas per negara (bukan cuma nama); monster baru
  bertema per negara dgn sprite sendiri.

### C. Kedalaman Jendral
- **Equip utama per jendral** (ingatan) — tiap jendral punya senjata/pusaka
  khasnya (signature), bukan cuma senjata cadangan generik.
- **Skill per jendral** (ingatan) — tiap jendral punya skill unik (bukan cuma
  auto-attack).
- **Combo 2 jendral** (ingatan) — sinergi/serangan gabungan saat dua jendral
  tertentu ada di satu pertempuran.

### D. Penyimpanan
- ✅ **Barak** — simpan jendral/monster di luar party aktif (party maks 6);
  tukar-pasang kapan saja. state.barracks; anggota di barak tak bertempur/EXP.
  (selesai)
- ✅ **Gudang pusat item** — simpan/ambil item, akses di kota mana pun.
  state.storage. (selesai)
- Lanjutan: batas kapasitas tas (biar gudang jadi keputusan), biaya sewa
  gudang/barak per hari (tekanan upkeep).

### E. Sistem Tempur v2
- ✅ **Skill jendral aktif** — tiap anggota (jendral & monster) punya skill khas
  ELEMEN-nya (Api=AOE, Petir=nuke tunggal, Angin=2x hit, Air=heal pasukan,
  Bumi=Dinding Batu -40% damage), dipicu pemain, 1x per tempur. (selesai)
- ✅ **Combo antar-jendral** — pasangan elemen tertentu (Api+Angin=Badai Api,
  Petir+Air=Prahara Petir, Bumi+Api=Letusan Gunung, Air+Angin=Topan+heal,
  Petir+Bumi=Gempa Petir) memicu serangan gabungan AOE, memakai jatah skill
  KEDUA anggota. Tombol muncul saat pasangan tersedia. (selesai)
- ✅ **Inisiatif pembuka per-AGI** — kalau musuh lebih gesit (skala hari + bos),
  mereka MENYERGAP (satu giliran gratis) sebelum kamu bergerak; AGI tinggi
  menghindarinya. (selesai — versi terkandung)
  Lanjutan penuh: urutan giliran per-unit interleaved (rewrite loop besar).
- ✅ **Formasi depan/belakang berpengaruh** — dua anggota teratas = garda depan,
  menyerap ~85% serangan + bonus DEF (idx0 lebih tebal), melindungi barisan
  belakang DAN pemain; kalau garda depan tumbang, belakang & pemain terekspos.
  (selesai)
- Target selection manual & info elemen yang lebih jelas (lanjutan).

**Tempur v2 kini lengkap:** skill jendral ✅ · combo ✅ · inisiatif AGI ✅ ·
formasi ✅.

### F. Ekonomi & Tekanan (lubang lama)
- **#2 Kalah tempur ada konsekuensi** (gold/hari/item hilang).
- **#3 Tempur jatuhkan loot, bukan gold gratis** + skill nego jual loot.

### G. Visual
- Fase 1 (warna) ✅; Fase 3 (ikon piksel ganti emoji + jenis monster) berikutnya.
- Peta visual, modal berbingkai, identitas kota, animasi tempur tersambung.
- OPSI gambar eksternal (via ChatGPT/DALL·E) — lihat catatan di bawah.

---

## Rekomendasi Urutan
1. Pilih fondasi identitas: **konten per-negara** (B) + **level per anggota** (A)
   — ini menegakkan reframe "pembangunan pasukan".
2. **Barak + inventory pusat** (D) — infrastruktur yang dibutuhkan begitu pasukan
   & item makin banyak.
3. **Kedalaman jendral** (C: skill + combo + equip utama) menyatu dengan
   **tempur v2** (E) — ini paket "pertempuran jauh lebih menarik".
4. Selipkan **rasa lapar** (A) & **lubang #2/#3** (F) sebagai tekanan.
5. **Visual/sprites** (G) jalan paralel.

## Soal Gambar via ChatGPT / DALL·E
Trade-off jujur:
- Pixel-art prosedural sekarang: nol aset, bundle mungil, pewarnaan dinamis
  per elemen GRATIS, offline. Kelemahan: detail terbatas.
- Gambar AI eksternal: detail lebih tinggi, TAPI mematikan pewarnaan dinamis
  (1 monster×5 elemen jadi banyak file), menambah bobot, dan RISIKO tak
  konsisten gaya (tiap generate beda). Pixel-art dari DALL·E sering tidak
  benar-benar pixel-perfect.
- **Rekomendasi:** pertahankan sprite gameplay prosedural; pakai gambar
  eksternal HANYA untuk yang prosedural lemah — LATAR KOTA, ART LAYAR JUDUL,
  potret jendral legendaris. AI bisa menuliskan prompt spesifik + konsisten
  (palet, ukuran, gaya) untuk pemain generate di ChatGPT, lalu dimasukkan.

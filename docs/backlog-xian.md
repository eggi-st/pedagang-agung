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
- **Level per anggota** — jendral & monster dapat EXP dan naik level sendiri
  (bukan cuma promosi berbayar). Karakter utama sudah naik level.
- **Rasa lapar & makan** (ingatan) — karakter utama lapar seiring hari; harus
  makan (item makanan / beli di kota). Kalau kelaparan: penalti stat/HP. Ini
  sekaligus mengisi lubang "tekanan/konsekuensi".

### B. Konten per-Negara (ingatan)
- ✅ **Jendral khas per negara** — NATION_MERCS: Joseon/Ming/Jepang/India punya
  roster nama jendral sendiri; genRecruits(nation) memilih sesuai kota. (selesai)
- ✅ **Monster khas per negara** — NATION_MONSTERS: encounter perjalanan memakai
  pool monster negara tujuan; monster yang dilawan & ditangkap beda antar negara.
  (selesai)
- **Kota monster legendaris per negara** — lokasi khusus memunculkan monster
  legendaris sesuai negara (mirip 신수/흉수). BELUM. Lanjutan: encounter/bos
  legendaris unik per negara + sprite khas (nyambung ke Fase 3).
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
- **Combo antar-jendral** — sinergi/serangan gabungan saat kombinasi tertentu.
- **Urutan giliran per AGI** — bukan fixed (pemain → pasukan → musuh).
- **Formasi depan/belakang** benar-benar menentukan siapa kena.
- Target selection & info elemen yang lebih jelas.

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

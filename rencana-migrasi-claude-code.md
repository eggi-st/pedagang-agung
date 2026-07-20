# Rencana Migrasi "Pedagang Agung" ke Claude Code

## Kenapa Migrasi Ini Penting

File sekarang (~2.300 baris, satu file HTML) sudah mendekati batas wajar untuk dikembangkan dengan aman lewat chat biasa. Setiap edit butuh saya grep manual buat mastiin nggak ada yang pecah — itu nggak scalable kalau mau nambah roster mercenary per negara, peta 20+ lokasi, sistem kapal, dll.

Claude Code kasih kemampuan yang nggak ada di sini:
- **Banyak file** — data, logic, UI dipisah rapi, bukan satu file raksasa
- **Testing otomatis** — bisa nulis test buat formula damage/drop rate, biar rebalancing nggak bikin bug diam-diam
- **Version control (git)** — tiap perubahan tercatat, bisa rollback kalau ada yang pecah
- **Build tool** — bundler modern (Vite dll), live-reload pas develop
- **Package manager** — bisa install library beneran (Capacitor buat APK, Three.js kalau suatu saat mau 3D, testing framework, dll)
- **Terminal penuh** — jalanin command apapun, bukan cuma bash terbatas kayak di sini

---

## Struktur Proyek yang Diusulkan

```
pedagang-agung/
├── index.html                 # Entry point, minimal — cuma load CSS+JS
├── package.json                # Dependency & script (dev, build)
├── vite.config.js              # Build tool config
├── src/
│   ├── main.js                 # Inisialisasi game
│   ├── data/                   # SEMUA data statis, dipisah per kategori
│   │   ├── goods.js             # Komoditas dagang
│   │   ├── weapons.js           # Senjata & zirah
│   │   ├── mercenaries/         # Roster per negara
│   │   │   ├── joseon.js
│   │   │   ├── china.js
│   │   │   └── jepang.js
│   │   ├── monsters.js          # Semua jenis musuh + drop table
│   │   ├── cities.js            # Data kota, region, hunting spot
│   │   ├── elements.js          # Sistem elemen
│   │   └── classes.js           # Kelas karakter & transformasi
│   ├── systems/                # LOGIC per sistem, terpisah
│   │   ├── battle.js            # Combat, skill, target, elemen
│   │   ├── economy.js           # Trade, harga, reputasi, pabrik
│   │   ├── generals.js          # Rekrut, promosi, formasi, equip
│   │   ├── inventory.js         # Item, crafting, diagram
│   │   ├── quests.js            # Misi harian, guild quest
│   │   ├── territory.js         # Kuasai wilayah, benteng, pajak
│   │   ├── progression.js       # Level, exp, NG+, achievement
│   │   └── save.js              # Save/load, multi-slot, migrasi
│   ├── ui/                     # Rendering, dipisah per tab/layar
│   │   ├── render-trade.js
│   │   ├── render-battle.js
│   │   ├── render-character.js
│   │   ├── render-map.js
│   │   └── sprites.js           # Engine pixel-art canvas
│   ├── audio/
│   │   ├── sfx.js
│   │   └── music.js
│   └── state.js                 # Definisi state pusat + migrateState()
├── styles/
│   ├── base.css
│   ├── components.css           # Button, card, row, dll
│   └── battle.css
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # Icon buat home screen
├── tests/
│   ├── battle.test.js            # Test formula damage, elemen counter
│   ├── economy.test.js           # Test harga, reputasi
│   └── save-migration.test.js    # Test migrateState() jalan benar
└── service-worker.js             # Buat PWA offline-capable
```

---

## Fase Migrasi (Bertahap, Bukan Sekali Jalan)

### Fase 0 — Setup Proyek
- Inisialisasi proyek dengan Vite (build tool ringan, cocok buat vanilla JS)
- Setup git repository
- Pindahkan CSS ke file terpisah dulu (paling gampang, resiko nol)

### Fase 1 — Ekstrak Data
- Semua `const` (GOODS, WEAPONS, MONSTERS, CITIES, dll) dipindah ke `src/data/`
- Ini murni "potong-tempel", nggak ada logic berubah — resiko rendah
- Langsung dapat manfaat: gampang nambah data baru tanpa scroll file 2000 baris

### Fase 2 — Ekstrak Systems (Logic)
- Fungsi battle (`battleAttack`, `enemyTurn`, dll) → `systems/battle.js`
- Fungsi ekonomi (`buy`, `sell`, `startProduction`, dll) → `systems/economy.js`
- dst per kategori
- Di sinilah mulai butuh `import`/`export` antar modul — sedikit refactor tapi logic tetap sama

### Fase 3 — Ekstrak UI Rendering
- Pisahkan fungsi render per tab
- Ini juga kesempatan bikin rendering lebih efisien (update sebagian DOM, bukan innerHTML penuh tiap aksi — jadi animasi makin mulus)

### Fase 4 — Tambah Testing
- Test unit buat formula-formula penting: `elementMultiplier()`, `rollDrop()`, `promoteCost()`, dll
- Test migrasi save lama biar nggak ada yang pecah tiap update

### Fase 5 — PWA (Installable di HP)
- Tambah `manifest.json` + `service-worker.js`
- Hasilnya: bisa "Add to Home Screen" di HP, jalan fullscreen kayak app asli, bisa dipakai offline

### Fase 6 — (Opsional) Bungkus jadi APK
- Pakai Capacitor: `npx cap add android`
- Build APK asli buat di-install manual atau upload ke Play Store

### Fase 7 — Baru Setelah Ini: Konten Besar
- Roster mercenary per negara, peta per-region, sistem kapal, dll
- Jauh lebih aman dikerjakan sekarang karena strukturnya udah rapi

---

## Yang Perlu Kamu Siapkan

1. **Install Claude Code** — lewat terminal, VS Code, atau JetBrains di komputer. Kalau belum familiar command line, versi desktop app-nya (Claude Code di Claude Desktop) lebih ramah pemula.
2. **Node.js** terinstall (buat jalanin Vite dkk) — Claude Code bisa bantu install ini juga.
3. File HTML yang sekarang — tinggal saya/Claude Code baca dan pecah sesuai struktur di atas.

## Kalau Kamu Mau Mulai Sekarang

Saya bisa siapkan draft awal strukturnya di sini dulu (Fase 0-1: setup + ekstrak data ke file-file terpisah) sebagai starting point, lalu kamu lanjutkan sisanya di Claude Code untuk Fase 2 ke atas yang butuh terminal/build-tool sungguhan. Atau, kalau kamu sudah punya Claude Code siap dipakai, saya bisa tuliskan initial prompt yang bisa langsung kamu paste ke Claude Code untuk mulai migrasi dari nol dengan konteks lengkap proyek ini.

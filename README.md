# Pedagang Agung — Proyek Migrasi

Status: **Fase 0-1 selesai dan TERVERIFIKASI JALAN** (bukan cuma ditulis, tapi sudah di-`npm install`, di-test, dan di-build sungguhan). Fase 2 ke atas belum dikerjakan — itu tugas kamu bareng Claude Code selanjutnya.

## Yang Sudah Terbukti Jalan

```bash
npm install     # 43 package terinstall bersih
npm test        # 5/5 test lulus (tests/elements.test.js)
npm run build   # Build sukses, 16 modul ES ter-transform ke dist/
```

Jangan percaya begitu saja klaim di atas — jalankan sendiri buat verifikasi.

## Struktur yang Sudah Ada

```
pedagang-agung/
├── original-reference.html   ⭐ GAME LENGKAP ASLI — 2.259 baris, semua logic ada di sini
├── index.html                  Shell baru, load CSS+JS eksternal
├── package.json / vite.config.js
├── src/
│   ├── main.js                 Entry point MINIMAL (cuma import data + sanity check console.log)
│   ├── state.js                 Skeleton — dokumentasi bentuk state, LOGIC BELUM DIPINDAH
│   ├── data/                    ✅ SEMUA data statis sudah diekstrak & diverifikasi
│   │   ├── economy.js            (GOODS, WEAPONS, ARMORS, FACTORY_RECIPES)
│   │   ├── world.js              (CITIES, CITY_LEVEL_RANGE, CITY_ICON)
│   │   ├── elements.js           (ELEMENTS + elementMultiplier — ADA TEST-NYA)
│   │   ├── monsters.js           (MONSTERS, DUNGEON_MONSTERS, monsterIcon)
│   │   ├── items.js              (RARITY_*, ITEM_TYPE_NAMES, DIAGRAMS)
│   │   ├── classes.js            (CLASSES, CLASS_TRANSFORMS, NATION_ICON)
│   │   ├── achievements.js       (ACHIEVEMENTS)
│   │   ├── sprites.js            (template pixel-art ASCII)
│   │   └── mercenaries/index.js  (MERC_NAMES, RANK_*, MAX_GENERALS)
│   ├── systems/                 ❌ KOSONG — logic MASIH di original-reference.html
│   ├── ui/
│   │   └── sprites.js            ✅ Engine gambar sprite (sudah diekstrak & dipakai main.js)
│   └── audio/
│       ├── sfx.js                ✅ Sound effect (sudah diekstrak)
│       └── music.js              ✅ Musik chiptune (sudah diekstrak)
├── styles/
│   └── base.css                 ✅ Seluruh CSS asli (belum dipecah lagi, tapi sudah terpisah dari HTML)
├── tests/
│   └── elements.test.js         ✅ Contoh test yang BENERAN jalan (5/5 pass)
└── public/
    └── manifest.json             PWA manifest (icon PNG belum dibuat — lihat catatan di bawah)
```

## Yang BELUM Dikerjakan (PR untuk Claude Code)

### Fase 2 — Pindahkan Logic ke `src/systems/`
Buka `original-reference.html`, cari fungsi-fungsi berikut, pindahkan per kategori:

| File tujuan | Fungsi yang dipindah dari original-reference.html |
|---|---|
| `systems/battle.js` | `startBattle`, `battleAttack`, `battleSkillHeavy`, `battleSkillWarcry`, `battleSkillTransform`, `battleUsePotion`, `battleDefend`, `battleFlee`, `enemyTurn`, `generalsAutoAttack`, `pickPartyTarget`, `tickPoisonAll`, `tickCooldowns`, `checkBattleEnd`, `winBattle`, `loseBattle`, `maybePoisonEnemy` |
| `systems/economy.js` | `buy`, `sell`, `buyGear`, `equipGear`, `sellGear`, `buyPotion`, `travel`, `reputationBonusPct`, `startProduction`, `sellProcessed`, `exchangeTP` |
| `systems/generals.js` | `recruitGeneral`, `promoteGeneral`, `promoteCost`, `moveGeneral`, `useRebirthStone` |
| `systems/inventory.js` | `equipAccessory`, `sellItem`, `toggleCraftSelect`, `craftItems`, `craftDiagram`, `genItem`, `rollDrop` |
| `systems/quests.js` | `genQuest`, `claimQuest`, `genGuildQuest`, `claimGuildQuest`, `guildQuestReady`, `guildQuestLabel` |
| `systems/territory.js` | `attackGarrison`, `upgradeGudang`, `upgradeBenteng`, `enterDungeon`, `enterTestTown`, `enterHistoricalScenario`, `testTownAvailable` |
| `systems/progression.js` | Bagian level-up di `winBattle`, `checkAchievements`, `startNewGamePlus` |
| `systems/save.js` | `saveGame`, `loadSavedGame`, `clearSave`, `manualSave`, `continueGame`, `migrateState` |

**Penting:** banyak fungsi ini saling bergantung pada `state` global. Saat memindahkan, ganti akses `state.xxx` langsung jadi `import { state } from '../state.js'`, dan pastikan `state` di-reassign lewat `setState()` (sudah disiapkan di `state.js`), bukan variabel lokal baru — kalau tidak, modul lain akan pegang referensi `state` yang basi.

### Fase 3 — Pindahkan Render ke `src/ui/`
Fungsi `render()`, `renderBattle()`, `renderPeta()`, `renderFactory()`, `renderEliteNPC()`, `renderCraftAction()`, `renderDiagramAction()`, `renderAchievements()`, `switchTab()` — pecah per tab (`render-trade.js`, `render-battle.js`, `render-character.js`, `render-map.js`).

### Fase 4 — Lengkapi Test
Tambah test untuk logic yang beresiko tinggi salah hitung: `promoteCost()`, `rollDrop()` (cek distribusi rarity dengan seed tetap), `elementMultiplier` sudah ada duluan sebagai contoh.

### Fase 5 — PWA
- Buat `public/icons/icon-192.png` dan `icon-512.png` (belum ada — generate pakai canvas script atau tool image apapun)
- Tambah `service-worker.js` di root, register di `main.js`

### Fase 6 (opsional) — APK
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
```

## Kenapa Saya Nggak Sekaligus Pindahkan Semua Logic di Sini

Karena chat ini nggak punya browser sungguhan buat saya tes hasilnya jalan atau nggak — resiko salah pindah (variabel ke-skip, referensi `state` basi, dst) tinggi kalau saya kerjakan buta tanpa preview langsung. Claude Code (VS Code/terminal) punya `npm run dev` dengan live-reload asli, jadi setiap potongan logic yang dipindah bisa langsung dicoba di browser sungguhan — jauh lebih aman daripada saya tebak-tebak di sini.

Data (Fase 1), sebaliknya, aman dipindah "buta" karena murni struktur nilai tanpa efek samping — makanya itu yang saya selesaikan dan verifikasi duluan.

// Daftar pencapaian tersembunyi. `check` menerima seluruh `state` game.
export const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Kemenangan Pertama', desc: 'Menangkan 1 pertempuran', check: (s) => s.stats.battlesWon >= 1 },
  { id: 'collector', name: 'Kolektor', desc: 'Kumpulkan 5 item rampasan', check: (s) => s.items.length >= 5 },
  { id: 'legendary_owner', name: 'Pemburu Legenda', desc: 'Miliki 1 item Legendaris', check: (s) => s.items.some((i) => i.rarity === 'Legendaris') },
  { id: 'conqueror', name: 'Penakluk', desc: 'Kuasai 3 wilayah', check: (s) => s.owned.length >= 3 },
  { id: 'level10', name: 'Veteran', desc: 'Capai Level 10', check: (s) => s.char.level >= 10 },
  { id: 'rich', name: 'Saudagar Kaya', desc: 'Kumpulkan 2000 gold', check: (s) => s.gold >= 2000 },
  { id: 'general_master', name: 'Panglima', desc: 'Punya Jendral Agung', check: (s) => s.generals.some((g) => g.rank >= 4) },
  { id: 'crafter', name: 'Alkemis', desc: 'Berhasil crafting 1 item', check: (s) => (s.stats.itemsCrafted || 0) >= 1 },
  { id: 'quest_master', name: 'Penyelesai Misi', desc: 'Selesaikan 5 misi harian', check: (s) => (s.stats.questsCompleted || 0) >= 5 },
  { id: 'transformed', name: 'Transformasi Sejati', desc: 'Bertransformasi ke kelas tahap 2', check: (s) => s.classTransformed === true },
  { id: 'legend_general', name: 'Legenda Perang', desc: 'Punya jendral rank Legenda Perang', check: (s) => s.generals.some((g) => g.rank >= 5) },
  { id: 'test_town_champion', name: 'Juara Test Town', desc: 'Taklukkan Test Town 1 kali', check: (s) => (s.stats.testTownCleared || 0) >= 1 },
];

// ============================================================
// src/world/level.js — experience, level, stat, dan mana.
// Stat mengikuti Xian (The Great Merchant): Strength, Agility,
// Vitality, Wisdom. Level maks: 255. Tiap naik level: +3 poin stat.
// Mana: dipakai skill AKTIF (serang/support). Skill pasif jalan
// otomatis tanpa mana (belum ada skill pasif di Fase 0).
// Equipment menambah stat via def.statBonus (mis. { str: 2 }).
// ============================================================
import { getItemDef } from './data/items.js';

export const MAX_LEVEL = 255;
export const POINTS_PER_LEVEL = 3;
export const BASE_STAT_VALUE = 5;

// Mana
export const BASE_MANA = 30;      // mana dasar saat Wisdom 0
export const MANA_PER_WIS = 10;   // +mana maks tiap poin Wisdom
export const MANA_REGEN = 4;      // mana pulih per detik

export const STATS = [
  { id: 'str', name: 'Strength', icon: '💪', desc: '+1 serangan tiap 2 Strength' },
  { id: 'agi', name: 'Agility',  icon: '🌀', desc: '+1,5 kecepatan & +0,3% crit tiap Agility' },
  { id: 'vit', name: 'Vitality', icon: '❤️', desc: '+5 HP maks tiap Vitality' },
  { id: 'wis', name: 'Wisdom',   icon: '🔮', desc: '+10 Mana maks tiap Wisdom' },
];

export const BASE_STATS = { str: 5, agi: 5, vit: 5, wis: 5 };

export function newProgress() {
  return { level: 1, xp: 0, statPoints: 0, stats: { ...BASE_STATS } };
}

// XP untuk naik dari level n ke n+1 (kurva menanjak).
export function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.5));
}

// Stat efektif = stat dasar + bonus equipment yang terpasang.
export function effectiveStats(player) {
  const s = { ...player.stats };
  for (const slot of ['weapon', 'armor']) {
    const id = player.equip && player.equip[slot];
    if (!id) continue;
    const def = getItemDef(id);
    if (def && def.statBonus) {
      for (const k of Object.keys(s)) s[k] += def.statBonus[k] || 0;
    }
  }
  return s;
}

// Hitung ulang stat turunan pemain. Dipanggil saat init, alokasi poin,
// atau equipment berubah.
export function recalcStats(player) {
  const s = effectiveStats(player);
  player.maxHp = 100 + s.vit * 5;
  player.hp = Math.min(player.hp ?? player.maxHp, player.maxHp);
  player.maxMana = BASE_MANA + s.wis * MANA_PER_WIS;
  player.mana = Math.min(player.mana ?? player.maxMana, player.maxMana);
  player.statAtk = Math.floor(s.str / 2);
  // Serangan ala Xian: range "10 - 14" dari total power.
  const power = 10 + player.statAtk;
  player.atkMin = Math.floor(power * 0.85);
  player.atkMax = Math.ceil(power * 1.15);
  // Defense dari Agility: mengurangi damage monster (min 1).
  player.defense = Math.floor(s.agi / 3);
  player.speed = 150 + s.agi * 1.5;
  player.critChance = s.agi * 0.003;
}

// Tambah XP; mengembalikan jumlah level yang naik (0 bila tidak naik).
export function gainXp(player, amount) {
  if (player.level >= MAX_LEVEL || amount <= 0) return 0;
  player.xp += amount;
  let ups = 0;
  while (player.level < MAX_LEVEL && player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level);
    player.level++;
    player.statPoints += POINTS_PER_LEVEL;
    ups++;
  }
  if (player.level >= MAX_LEVEL) player.xp = 0;
  return ups;
}

// Alokasikan 1 poin ke stat. false bila tidak ada poin / stat tak dikenal.
export function allocateStat(player, statId) {
  if (player.statPoints <= 0) return false;
  if (!Object.prototype.hasOwnProperty.call(BASE_STATS, statId)) return false;
  player.statPoints--;
  player.stats[statId]++;
  recalcStats(player);
  return true;
}

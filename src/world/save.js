// ============================================================
// src/world/save.js — save permanen berversion (localStorage).
// Key: pa.save.v1. Menggantikan sessionStorage demo (pa-world-v1).
// Menyimpan: posisi, map aktif, gold, progres pemain (level/xp/stat),
// HP/mana/kenyang, equipment, inventory, party, status peti.
// ============================================================

export const SAVE_KEY = 'pa.save.v1';
export const SAVE_VERSION = 1;
const LEGACY_KEY = 'pa-world-v1';

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Kumpulkan state menjadi objek save. s = { player, inv, gold, active,
// chestLooted, party }.
export function collectSave(s) {
  const p = s.player;
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    map: s.active === 'dungeon' ? 'dungeon' : 'field',
    x: Math.round(p.x),
    y: Math.round(p.y),
    gold: Math.max(0, Math.floor(s.gold)),
    chestLooted: !!s.chestLooted,
    player: {
      level: p.level | 0,
      xp: Math.max(0, Math.floor(p.xp)),
      statPoints: Math.max(0, p.statPoints | 0),
      stats: {
        str: num(p.stats.str, 5) | 0,
        agi: num(p.stats.agi, 5) | 0,
        vit: num(p.stats.vit, 5) | 0,
        wis: num(p.stats.wis, 5) | 0,
      },
      hp: Math.max(0, p.hp),
      mana: Math.max(0, p.mana),
      satiety: Math.max(0, Math.min(100, p.satiety)),
      equip: {
        weapon: p.equip.weapon || null,
        armor: p.equip.armor || null,
      },
    },
    inv: { ...(s.inv.items || {}) },
    party: (s.party.members || []).map((m) => ({
      id: m.id,
      level: m.level | 0,
      xp: Math.max(0, Math.floor(m.xp)),
    })),
  };
}

export function writeSave(s) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(collectSave(s)));
    return true;
  } catch {
    return false; // storage penuh / mode privat
  }
}

// null bila tidak ada / versi beda / korup.
export function readSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!d || d.version !== SAVE_VERSION || !d.player) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* abaikan */ }
}

// Migrasi sekali dari sessionStorage demo lama (posisi + gold saja).
// Mengembalikan { map, x, y, gold } atau null.
export function migrateLegacy() {
  try {
    const d = JSON.parse(sessionStorage.getItem(LEGACY_KEY) || 'null');
    sessionStorage.removeItem(LEGACY_KEY);
    if (!d || (d.map !== 'field' && d.map !== 'dungeon')) return null;
    return { map: d.map, x: num(d.x), y: num(d.y), gold: Math.max(0, num(d.gold) | 0) };
  } catch {
    return null;
  }
}

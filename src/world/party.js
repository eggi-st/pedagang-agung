// ============================================================
// src/world/party.js — sistem party: rekrut & pecat pendamping.
// Fondasi: rekrut bayar emas, maks 2 pendamping, ikut XP 50%,
// naik level → +10 maxHp & heal penuh. Ikut tempur = fase lanjutan.
// ============================================================
import { getCompanionDef } from './data/companions.js';
import { xpForLevel, MAX_LEVEL } from './level.js';

export const MAX_MEMBERS = 2; // pendamping selain pemain

export function createParty() {
  return { members: [] }; // member: { id, level, xp, hp }
}

export function memberMaxHp(def, level) {
  return def.hp + (level - 1) * 10;
}

// Coba rekrut. Mengembalikan { ok, cost?, reason? }; emas dipotong pemanggil.
export function hireMember(party, compId) {
  const def = getCompanionDef(compId);
  if (!def) return { ok: false, reason: 'tidak dikenal' };
  if (party.members.some((m) => m.id === compId)) return { ok: false, reason: 'sudah direkrut' };
  if (party.members.length >= MAX_MEMBERS) return { ok: false, reason: 'party penuh (maks 2)' };
  party.members.push({ id: compId, level: 1, xp: 0, hp: def.hp });
  return { ok: true, cost: def.hireCost };
}

export function dismissMember(party, compId) {
  const i = party.members.findIndex((m) => m.id === compId);
  if (i < 0) return false;
  party.members.splice(i, 1);
  return true;
}

export function getMember(party, compId) {
  return party.members.find((m) => m.id === compId) || null;
}

// XP pendamping: 50% dari XP kill pemain. Naik level → heal penuh.
// Mengembalikan daftar { id, ups } yang naik level.
export function gainPartyXp(party, amount) {
  const ups = [];
  const share = Math.floor(amount / 2);
  if (share <= 0) return ups;
  for (const m of party.members) {
    const def = getCompanionDef(m.id);
    if (!def || m.level >= MAX_LEVEL) continue;
    m.xp += share;
    let u = 0;
    while (m.level < MAX_LEVEL && m.xp >= xpForLevel(m.level)) {
      m.xp -= xpForLevel(m.level);
      m.level++;
      u++;
    }
    if (u > 0) {
      m.hp = memberMaxHp(def, m.level);
      ups.push({ id: m.id, ups: u });
    }
  }
  return ups;
}

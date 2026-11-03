// ============================================================
// src/world/companion-ai.js — pendamping ikut tempur.
// Peran dari data/companions.js:
//   'dealer' (Pendekar): dekati & tebas monster terdekat.
//   'ranged' (Pemanah): tembak panah dari jarak jauh (proyektil ramah).
//   'healer' (Tabib): pulihkan sekutu yang HP-nya < 70%.
// Monster tetap fokus menyerang pemain (pemain = tank); pendamping
// tidak bisa diserang di iterasi ini.
// Damage/heal skala level: × (1 + 0,1 × (level - 1)).
// ============================================================

import { getCompanionDef } from './data/companions.js';
import { memberMaxHp } from './party.js';
import { damageMonster } from './monster.js';
import { walkableAt } from './tiles.js';

export const DEALER_CD = 1.2;      // detik antar tebasan
export const DEALER_RANGE = 44;    // jangkauan tebasan (px)
export const DEALER_AGGRO = 280;   // radius cari target (px)
export const RANGED_CD = 1.5;      // detik antar tembakan
export const RANGED_MIN_DIST = 80; // mundur bila monster terlalu dekat
export const HEALER_CD = 3.0;      // detik antar heal
export const HEAL_THRESHOLD = 0.7; // heal bila HP < 70%
export const ARROW_SPEED = 420;    // px/detik

// Damage dasar × skala level. Terukur: Lv1 = def.dmg, tiap level +10%.
export function compDmg(def, level) {
  return Math.max(1, Math.round(def.dmg * (1 + 0.1 * (level - 1))));
}

export function compHealAmount(def, level) {
  return Math.max(1, Math.round((def.heal || 0) * (1 + 0.1 * (level - 1))));
}

function nearestMonster(monsters, x, y, maxDist) {
  let best = null, bestD = maxDist;
  for (const m of monsters) {
    if (m.state === 'dead') continue;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}

function stepToward(f, tx, ty, speed, dt, map) {
  const dx = tx - f.x, dy = ty - f.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const step = Math.min(d, speed * dt);
  const nx = f.x + (dx / d) * step, ny = f.y + (dy / d) * step;
  if (walkableAt(map, nx, f.y)) f.x = nx;
  if (walkableAt(map, f.x, ny)) f.y = ny;
}

// pairs: [{ follower, member }] — follower & member paralel per index.
// Hanya jalan saat inCombat = true (di dungeon & ada monster hidup).
// Mengembalikan true bila ada aksi tempur (untuk follow-loop skip).
export function updateCompanions(pairs, player, monsters, projectiles, floaters, map, dt, onKill) {
  let anyEngaged = false;
  const playerDead = player.fainted;
  for (const { follower: f, member } of pairs) {
    if (f.cd > 0) f.cd -= dt;
    if (f.atkAnim > 0) f.atkAnim -= dt;
    const def = getCompanionDef(member.id);
    if (!def || playerDead) { f.engaged = false; continue; }
    const alive = monsters.some((m) => m.state !== 'dead');
    if (!alive) { f.engaged = false; continue; }

    if (def.role === 'dealer') {
      const target = nearestMonster(monsters, f.x, f.y, DEALER_AGGRO);
      if (!target) { f.engaged = false; continue; }
      f.engaged = true; anyEngaged = true;
      const d = Math.hypot(target.x - f.x, target.y - f.y);
      if (d > DEALER_RANGE) {
        stepToward(f, target.x, target.y, 165, dt, map);
      } else if (f.cd <= 0) {
        f.cd = DEALER_CD;
        f.atkAnim = 0.22;
        const dmg = compDmg(def, member.level);
        const died = damageMonster(target, dmg, floaters, 'neutral', false);
        if (died && onKill) onKill(target);
      }
    } else if (def.role === 'ranged') {
      const range = def.range || 160;
      const target = nearestMonster(monsters, f.x, f.y, range);
      if (!target) { f.engaged = false; continue; }
      f.engaged = true; anyEngaged = true;
      const d = Math.hypot(target.x - f.x, target.y - f.y);
      // Jaga jarak: mundur bila terlalu dekat.
      if (d < RANGED_MIN_DIST) {
        stepToward(f, f.x + (f.x - target.x), f.y + (f.y - target.y), 120, dt, map);
      }
      if (f.cd <= 0) {
        f.cd = RANGED_CD;
        f.atkAnim = 0.22;
        const dx = target.x - f.x, dy = (target.y - 35) - (f.y - 40);
        const dist = Math.hypot(dx, dy) || 1;
        projectiles.push({
          x: f.x, y: f.y - 40,
          vx: (dx / dist) * ARROW_SPEED, vy: (dy / dist) * ARROW_SPEED,
          dmg: compDmg(def, member.level), element: 'neutral',
          friendly: true, ttl: 2.5,
        });
      }
    } else if (def.role === 'healer') {
      // Cari sekutu (pemain + semua member) dengan rasio HP terendah < 70%.
      let worst = null, worstRatio = HEAL_THRESHOLD;
      // Kumpulkan semua sekutu dari pairs (termasuk diri sendiri, tapi HP-nya selalu penuh).
      const all = [{ hp: player.hp, maxHp: player.maxHp, apply: (v) => { player.hp = Math.min(player.maxHp, player.hp + v); }, px: player.x, py: player.y }];
      for (const p2 of pairs) {
        const d2 = getCompanionDef(p2.member.id);
        if (!d2) continue;
        const mh = memberMaxHp(d2, p2.member.level);
        all.push({ hp: p2.member.hp, maxHp: mh, apply: (v) => { p2.member.hp = Math.min(mh, p2.member.hp + v); }, px: p2.follower.x, py: p2.follower.y });
      }
      for (const a of all) {
        const r = a.maxHp > 0 ? a.hp / a.maxHp : 1;
        if (r < worstRatio) { worstRatio = r; worst = a; }
      }
      // Hanya "engaged" (berhenti mengikuti) bila ada yang perlu disembuhkan;
      // kalau semua sehat, tabib tetap mengikuti pemain seperti biasa.
      f.engaged = !!worst;
      if (worst) anyEngaged = true;
      if (worst && f.cd <= 0) {
        f.cd = HEALER_CD;
        const amt = compHealAmount(def, member.level);
        worst.apply(amt);
        floaters.push({ x: worst.px, y: worst.py - 80, text: '+' + amt, color: '#69f0ae', ttl: 1.0 });
      }
    } else {
      f.engaged = false;
    }
  }
  return anyEngaged;
}

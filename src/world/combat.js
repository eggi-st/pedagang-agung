// ============================================================
// src/world/combat.js — logika tempur realtime dasar (slice 3-4).
// Serangan pemain: tebasan busur ke arah hadap. Skill: Tebasan Api
// (damage besar) & Dash. Damage monster: pukulan jarak dekat.
// Angka damage melayang (floaters). onKill(m) dipanggil tiap monster
// mati — dipakai main.js untuk hadiah (gold, heal).
// ============================================================

import { PLAYER_ATK, PLAYER_ATK_RANGE, PLAYER_ATK_CD,
         SKILL1_DMG, SKILL1_RANGE, SKILL1_CD } from './player.js';
import { damageMonster } from './monster.js';

const FACING = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};

// Mana untuk skill aktif. true bila cukup (langsung dipotong).
export function spendMana(player, cost) {
  if ((player.mana ?? 0) < cost) return false;
  player.mana -= cost;
  return true;
}

function arcHit(player, monsters, floaters, dmgMin, dmgMax, range, dotMin, animColor, atkElement, onKill) {
  const [fx, fy] = FACING[player.dir] || FACING.down;
  const satMult = satietyMult(player);
  let hits = 0;
  for (const m of monsters) {
    if (m.state === 'dead') continue;
    const dx = m.x - player.x, dy = m.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) continue;
    const dot = dist > 0.01 ? (dx * fx + dy * fy) / dist : 1;
    if (dot < dotMin) continue;
    // Damage di-roll per kena dalam range serangan (ala Xian: "Attack 10 - 14").
    const roll = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin + 1));
    const isCrit = Math.random() < (player.critChance || 0);
    const hitDmg = Math.round((isCrit ? roll * 1.5 : roll) * satMult);
    const died = damageMonster(m, hitDmg, floaters, atkElement, isCrit);
    hits++;
    if (died && onKill) onKill(m);
  }
  return hits;
}

// Pengali lapar: < 25 → serangan melemah 25%.
export function satietyMult(player) {
  return (player.satiety ?? 100) < 25 ? 0.75 : 1;
}

// Serangan dasar. Mengembalikan jumlah monster yang kena.
export function playerAttack(player, monsters, floaters, onKill) {
  if (player.fainted || player.atkCd > 0) return 0;
  player.atkCd = PLAYER_ATK_CD;
  player.atkAnim = 0.18;
  player.atkAnimColor = null;
  const lo = player.atkMin ?? PLAYER_ATK, hi = player.atkMax ?? PLAYER_ATK;
  return arcHit(player, monsters, floaters, lo, hi, PLAYER_ATK_RANGE, 0.2, null, 'neutral', onKill);
}

// Skill 1 — Tebasan Api: damage besar, jangkauan lebih jauh & lebar.
export function skillStrike(player, monsters, floaters, onKill) {
  if (player.fainted || player.skill1Cd > 0) return 0;
  player.skill1Cd = SKILL1_CD;
  player.atkAnim = 0.25;
  player.atkAnimColor = 'fire';
  const base = SKILL1_DMG + (player.statAtk || 0);
  return arcHit(player, monsters, floaters, Math.floor(base * 0.85), Math.ceil(base * 1.15),
    SKILL1_RANGE, 0.0, 'fire', 'api', onKill);
}

// Damage ke pemain (dikurangi Defense, minimal 1).
// Mengembalikan true jika pemain pingsan.
export function damagePlayer(player, dmg, floaters) {
  if (player.fainted) return false;
  const red = Math.max(1, dmg - (player.defense || 0));
  player.hp -= red;
  if (floaters) floaters.push({ x: player.x, y: player.y - 80, text: '-' + red, color: '#ff5252', ttl: 0.8 });
  if (player.hp <= 0) {
    player.hp = 0;
    player.fainted = true;
    return true;
  }
  return false;
}

export function updateFloaters(floaters, dt) {
  for (const f of floaters) { f.ttl -= dt; f.y -= 22 * dt; }
  for (let i = floaters.length - 1; i >= 0; i--) {
    if (floaters[i].ttl <= 0) floaters.splice(i, 1);
  }
}

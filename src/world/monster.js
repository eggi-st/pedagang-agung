// ============================================================
// src/world/monster.js — monster field/dungeon.
// Slice 2: AI mondar-mandir (wander).
// Slice 3: tempur realtime dasar — aggro, kejar, serang, mati, respawn.
// ============================================================

import { walkableAt } from './tiles.js';
import { getMonsterDef } from './data/monsters.js';
import { effectiveness, MULT_EFFECTIVE, MULT_RESIST } from './data/elements.js';

export const MONSTER_AGGRO_R = 130; // default bila definisi tak punya
export const MONSTER_ATK_RANGE = 30;
export const MONSTER_RESPAWN_T = 20; // detik hingga respawn

// defIdOrName: id definisi di data/monsters.js (mis. 'serigala-hutan').
// Kompatibilitas lama: string nama bebas -> pakai stat goblin standar.
export function createMonster(x, y, defIdOrName = 'goblin-hutan') {
  const def = getMonsterDef(defIdOrName);
  const name = def ? def.name : defIdOrName;
  const s = def || {};
  const level = s.level ?? 1;
  const hpScale = 1 + 0.15 * (level - 1);
  const dmgScale = 1 + 0.12 * (level - 1);
  const baseHp = s.hp ?? 30;
  const baseDmg = s.dmg ?? 6;
  return {
    x, y, name,
    defId: def ? def.id : null,
    sprite: s.sprite || 'goblin-hutan',
    element: s.element || 'neutral',
    level, area: s.area || '-',
    atkStyle: s.atkStyle || 'melee', // 'contact' | 'melee' | 'ranged'
    homeX: x, homeY: y,
    hw: 9, hh: 5,
    speed: s.speed ?? 42,
    chaseSpeed: s.chaseSpeed ?? 72,
    aggroR: s.aggroR ?? MONSTER_AGGRO_R,
    atkRange: s.atkRange ?? MONSTER_ATK_RANGE,
    fireRange: s.fireRange ?? 0,   // ranged: jarak tembak
    keepDist: s.keepDist ?? 0,     // ranged: jaga jarak minimum
    projSpeed: s.projSpeed ?? 160, // ranged: kecepatan proyektil
    dir: 'down',
    state: 'idle',             // 'idle' | 'walk' | 'chase' | 'attack' | 'dead'
    timer: 1 + Math.random() * 2,
    dx: 0, dy: 0,
    walkPhase: Math.random() * 6,
    aggroCooldown: 0,          // jeda antar toast peringatan
    hp: Math.round(baseHp * hpScale), maxHp: Math.round(baseHp * hpScale),
    dmg: Math.round(baseDmg * dmgScale), // damage ke pemain per pukulan
    goldMin: s.goldMin ?? 5, goldMax: s.goldMax ?? 10,
    drops: s.drops ? s.drops.map((d) => ({ ...d })) : [],
    atkCd: 0,                  // cooldown serangan monster
    atkCdMax: s.atkCd ?? 1.0,
    respawnT: 0,               // hitung mundur saat mati
    aggro: false,              // true = sedang mengejar/menyerang
    hurtT: 0,                  // sisa animasi Hurt (detik)
    atkAnimT: 0,               // sisa animasi Attack (detik)
  };
}

// State sprite untuk render (lihat ASSET-PIPELINE.md §5).
// Urutan prioritas: Hurt > Attack > Walk > Idle.
export function monsterSpriteState(m) {
  if (m.state === 'dead') return null;
  if (m.hurtT > 0) return 'Hurt';
  if (m.atkAnimT > 0) return 'Attack';
  if (m.state === 'walk' || m.state === 'chase') return 'Walk';
  return 'Idle';
}

function blockedAt(map, x, y, hw, hh) {
  return !walkableAt(map, x, y) // titik tengah selalu ikut dicek
      || !walkableAt(map, x - hw, y - hh)
      || !walkableAt(map, x + hw, y - hh)
      || !walkableAt(map, x - hw, y + hh)
      || !walkableAt(map, x + hw, y + hh);
}

function moveToward(m, tx, ty, speed, dt, map) {
  const dx = tx - m.x, dy = ty - m.y;
  const len = Math.hypot(dx, dy) || 1;
  const step = speed * dt;
  const nx = m.x + (dx / len) * step;
  if (!blockedAt(map, nx, m.y, m.hw, m.hh)) m.x = nx;
  const ny = m.y + (dy / len) * step;
  if (!blockedAt(map, m.x, ny, m.hw, m.hh)) m.y = ny;
  m.dir = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  m.walkPhase += dt * 8;
}

// Dipanggil saat monster kena serangan. Mengembalikan true jika mati.
// atkElement: elemen serangan (lihat data/elements.js); efektivitas
// dihitung terhadap m.element (1.5x effective / 0.7x resist).
export function damageMonster(m, dmg, floaters, atkElement = 'neutral', crit = false) {
  if (m.state === 'dead') return false;
  const mult = effectiveness(atkElement, m.element);
  const finalDmg = Math.max(1, Math.round(dmg * mult));
  m.hp -= finalDmg;
  m.aggro = true; // diserang = langsung mengejar
  m.hurtT = 0.35; // animasi Hurt
  if (floaters) {
    floaters.push({ x: m.x, y: m.y - 52, text: String(finalDmg), color: crit ? '#ffeb3b' : '#ffd54a', ttl: 0.8 });
    if (crit) floaters.push({ x: m.x, y: m.y - 70, text: 'CRIT!', color: '#ffeb3b', ttl: 0.9 });
    else if (mult >= MULT_EFFECTIVE) floaters.push({ x: m.x, y: m.y - 70, text: 'Effective!', color: '#7CFC00', ttl: 0.9 });
    else if (mult <= MULT_RESIST) floaters.push({ x: m.x, y: m.y - 70, text: 'Resist', color: '#9e9e9e', ttl: 0.9 });
  }
  if (m.hp <= 0) {
    m.hp = 0;
    m.state = 'dead';
    m.respawnT = MONSTER_RESPAWN_T;
    m.aggro = false;
    if (floaters) floaters.push({ x: m.x, y: m.y - 70, text: 'KO!', color: '#ff8a65', ttl: 1.2 });
    return true;
  }
  return false;
}

export function updateMonster(m, dt, map, player) {
  if (m.atkCd > 0) m.atkCd -= dt;
  if (m.aggroCooldown > 0) m.aggroCooldown -= dt;
  if (m.hurtT > 0) m.hurtT -= dt;
  if (m.atkAnimT > 0) m.atkAnimT -= dt;

  // Mati: hitung mundur respawn di titik awal.
  if (m.state === 'dead') {
    m.respawnT -= dt;
    if (m.respawnT <= 0) {
      m.state = 'idle';
      m.hp = m.maxHp;
      m.x = m.homeX; m.y = m.homeY;
      m.timer = 1;
    }
    return;
  }

  const px = player ? player.x : Infinity;
  const py = player ? player.y : Infinity;
  const playerFainted = player ? player.fainted : true;
  const distP = Math.hypot(px - m.x, py - m.y);

  // Kejar pemain yang dekat & sadar.
  if (!playerFainted && distP < m.aggroR) {
    m.aggro = true;
    // Ranged: jaga jarak; tembak bila dalam fireRange.
    if (m.atkStyle === 'ranged') {
      if (distP < m.keepDist) {
        // Terlalu dekat: mundur menjauh.
        m.state = 'chase';
        const dx = m.x - px, dy = m.y - py;
        const len = Math.hypot(dx, dy) || 1;
        moveToward(m, m.x + (dx / len) * 40, m.y + (dy / len) * 40, m.chaseSpeed, dt, map);
        return null;
      }
      if (distP <= m.fireRange) {
        m.state = 'attack';
        m.dx = 0; m.dy = 0;
        if (m.atkCd <= 0) {
          m.atkCd = m.atkCdMax;
          m.atkAnimT = 0.3; // animasi Attack
          const dx = px - m.x, dy = py - m.y;
          const len = Math.hypot(dx, dy) || 1;
          return {
            fireProjectile: {
              x: m.x, y: m.y - 30,
              vx: (dx / len) * m.projSpeed, vy: (dy / len) * m.projSpeed,
              dmg: m.dmg, element: m.element,
            },
          }; // sinyal ke main.js
        }
        return null;
      }
      m.state = 'chase';
      moveToward(m, px, py, m.chaseSpeed, dt, map);
      return null;
    }
    // Contact/melee: dekati lalu pukul.
    if (distP <= m.atkRange) {
      m.state = 'attack';
      m.dx = 0; m.dy = 0;
      if (m.atkCd <= 0) {
        m.atkCd = m.atkCdMax;
        m.atkAnimT = 0.3; // animasi Attack
        return { hitPlayer: m.dmg, element: m.element }; // sinyal ke main.js
      }
      return null;
    }
    m.state = 'chase';
    moveToward(m, px, py, m.chaseSpeed, dt, map);
    return null;
  }

  // Tidak aggro: mondar-mandir seperti dulu.
  m.aggro = false;
  m.timer -= dt;
  if (m.timer <= 0) {
    if (m.state === 'idle' && Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2;
      m.dx = Math.cos(a); m.dy = Math.sin(a);
      m.state = 'walk';
      m.dir = Math.abs(m.dx) > Math.abs(m.dy)
        ? (m.dx > 0 ? 'right' : 'left') : (m.dy > 0 ? 'down' : 'up');
    } else {
      m.state = 'idle'; m.dx = 0; m.dy = 0;
    }
    m.timer = 1 + Math.random() * 2.5;
  }
  if (m.state === 'walk') {
    const step = m.speed * dt;
    const nx = m.x + m.dx * step;
    if (!blockedAt(map, nx, m.y, m.hw, m.hh)) m.x = nx;
    else { m.state = 'idle'; m.timer = 0.5; }
    const ny = m.y + m.dy * step;
    if (!blockedAt(map, m.x, ny, m.hw, m.hh)) m.y = ny;
    else { m.state = 'idle'; m.timer = 0.5; }
    m.walkPhase += dt * 8;
  }
  return null;
}

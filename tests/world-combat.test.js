// Tests tempur realtime dasar (slice 3).
import { describe, it, expect } from 'vitest';
import { TILE, isWalkable } from '../src/world/tiles.js';
import { createPlayer, PLAYER_ATK, dashPlayer, SKILL1_DMG, SKILL1_CD, SKILL2_DIST, SKILL2_CD } from '../src/world/player.js';
import { createMonster, updateMonster, damageMonster, monsterSpriteState, MONSTER_RESPAWN_T } from '../src/world/monster.js';
import { playerAttack, skillStrike, damagePlayer, updateFloaters } from '../src/world/combat.js';

function openMap() {
  return Array.from({ length: 10 }, () => new Array(10).fill(TILE.DUNGEON_FLOOR));
}
function farPlayer() {
  const p = createPlayer(900, 900);
  return p;
}

describe('playerAttack', () => {
  it('monster di depan dalam jangkauan kena damage & jadi aggro', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(40, 0, 'Goblin');
    const floaters = [];
    const hits = playerAttack(p, [m], floaters);
    expect(hits).toBe(1);
    expect(m.hp).toBe(30 - PLAYER_ATK);
    expect(m.aggro).toBe(true);
    expect(p.atkCd).toBeGreaterThan(0);
    expect(floaters.length).toBeGreaterThan(0);
  });
  it('monster di belakang (di luar busur) tidak kena', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(-40, 0, 'Goblin');
    expect(playerAttack(p, [m], [])).toBe(0);
    expect(m.hp).toBe(30);
  });
  it('monster di luar jangkauan tidak kena', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(200, 0, 'Goblin');
    expect(playerAttack(p, [m], [])).toBe(0);
    expect(m.hp).toBe(30);
  });
  it('cooldown mencegah serangan beruntun', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(40, 0, 'Goblin');
    expect(playerAttack(p, [m], [])).toBe(1);
    expect(playerAttack(p, [m], [])).toBe(0); // masih cooldown
    expect(m.hp).toBe(30 - PLAYER_ATK);
  });
  it('onKill dipanggil tiap monster mati (untuk hadiah)', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(40, 0, 'Goblin'); m.hp = 5;
    let killed = 0;
    playerAttack(p, [m], [], () => { killed++; });
    expect(m.state).toBe('dead');
    expect(killed).toBe(1);
  });
});

describe('damageMonster & respawn', () => {
  it('HP 0 -> mati, respawn 20 detik di titik awal', () => {
    const m = createMonster(100, 100, 'Goblin');
    const died = damageMonster(m, 30, []);
    expect(died).toBe(true);
    expect(m.state).toBe('dead');
    expect(m.respawnT).toBe(MONSTER_RESPAWN_T);
    updateMonster(m, MONSTER_RESPAWN_T + 1, openMap(), farPlayer());
    expect(m.state).toBe('idle');
    expect(m.hp).toBe(m.maxHp);
    expect(m.x).toBe(m.homeX); expect(m.y).toBe(m.homeY);
  });
});

describe('monster aggro & serang', () => {
  it('mengejar pemain dalam radius aggro (jarak menyusut)', () => {
    const map = openMap();
    const m = createMonster(4.5 * 32, 4.5 * 32, 'Goblin');
    const p = createPlayer(6.5 * 32, 4.5 * 32, ); // ~64px
    const d0 = Math.hypot(p.x - m.x, p.y - m.y);
    for (let i = 0; i < 60; i++) updateMonster(m, 1 / 60, map, p);
    const d1 = Math.hypot(p.x - m.x, p.y - m.y);
    expect(m.aggro).toBe(true);
    expect(d1).toBeLessThan(d0);
  });
  it('memukul pemain dalam jarak serang (damage 6, ada cooldown)', () => {
    const m = createMonster(0, 0, 'Goblin');
    const p = createPlayer(20, 0, );
    const r1 = updateMonster(m, 1 / 60, openMap(), p);
    expect(r1).toEqual({ hitPlayer: 6, element: 'neutral' });
    const r2 = updateMonster(m, 1 / 60, openMap(), p);
    expect(r2).toBeNull(); // cooldown
  });
  it('tidak mengejar pemain yang pingsan', () => {
    const m = createMonster(0, 0, 'Goblin');
    const p = createPlayer(60, 0, ); p.fainted = true;
    updateMonster(m, 1 / 60, openMap(), p);
    expect(m.aggro).toBe(false);
  });
});

describe('damagePlayer', () => {
  it('HP berkurang & pingsan di 0', () => {
    const p = createPlayer(0, 0, );
    const floaters = [];
    expect(damagePlayer(p, 30, floaters)).toBe(false);
    expect(p.hp).toBe(70);
    expect(damagePlayer(p, 70, floaters)).toBe(true);
    expect(p.fainted).toBe(true);
    expect(p.hp).toBe(0);
  });
});

describe('updateFloaters', () => {
  it('ttl berkurang & entri kedaluwarsa dibuang', () => {
    const fs = [{ x: 0, y: 0, text: '10', color: '#fff', ttl: 0.5 }];
    updateFloaters(fs, 0.2);
    expect(fs.length).toBe(1);
    expect(fs[0].ttl).toBeCloseTo(0.3, 5);
    updateFloaters(fs, 0.4);
    expect(fs.length).toBe(0);
  });
});

describe('skillStrike (Tebasan Api)', () => {
  it('damage 25, jangkauan 72, cooldown 6 dtk', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(60, 0, 'Goblin');
    const hits = skillStrike(p, [m], [], null);
    expect(hits).toBe(1);
    const dealt = 30 - m.hp;
    // damage di-roll dalam range 85%-115% dari SKILL1_DMG (elemen netral vs bumi = 1.0)
    expect(dealt).toBeGreaterThanOrEqual(Math.floor(SKILL1_DMG * 0.85));
    expect(dealt).toBeLessThanOrEqual(Math.ceil(SKILL1_DMG * 1.15));
    expect(p.skill1Cd).toBe(SKILL1_CD);
    expect(skillStrike(p, [m], [], null)).toBe(0); // cooldown
  });
  it('mengenai monster di samping (busur lebar)', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    const m = createMonster(40, 40, 'Goblin'); // diagonal, dot ~0.7
    expect(skillStrike(p, [m], [], null)).toBe(1);
  });
});

describe('dashPlayer', () => {
  it('meluncur 90px ke arah hadap', () => {
    const p = createPlayer(100, 100); p.dir = 'right';
    const moved = dashPlayer(p, openMap());
    expect(moved).toBe(SKILL2_DIST);
    expect(p.x).toBe(190);
    expect(p.dashAnim).toBeGreaterThan(0);
  });
  it('berhenti sebelum dinding', () => {
    const p = createPlayer(300, 160); p.dir = 'right'; // dekat tepi kanan peta 10x10
    const moved = dashPlayer(p, openMap());
    expect(moved).toBeLessThan(SKILL2_DIST);
    expect(p.x).toBe(310); // tile 10 = di luar peta -> berhenti
  });
});

describe('tile peti', () => {
  it('CHEST & CHEST_OPEN tidak bisa dipijak', () => {
    expect(isWalkable(TILE.CHEST)).toBe(false);
    expect(isWalkable(TILE.CHEST_OPEN)).toBe(false);
  });
});

describe('monsterSpriteState', () => {
  it('prioritas: Hurt > Attack > Walk > Idle; mati -> null', () => {
    const m = createMonster(0, 0, 'goblin-hutan');
    expect(monsterSpriteState(m)).toBe('Idle');
    m.state = 'walk';
    expect(monsterSpriteState(m)).toBe('Walk');
    m.atkAnimT = 0.2;
    expect(monsterSpriteState(m)).toBe('Attack');
    m.hurtT = 0.2;
    expect(monsterSpriteState(m)).toBe('Hurt');
    m.state = 'dead';
    expect(monsterSpriteState(m)).toBeNull();
  });
  it('damageMonster menyalakan timer Hurt', () => {
    const m = createMonster(0, 0, 'goblin-hutan');
    damageMonster(m, 5, []);
    expect(m.hurtT).toBeGreaterThan(0);
    expect(monsterSpriteState(m)).toBe('Hurt');
  });
});

describe('mana & defense', () => {
  it('spendMana memotong bila cukup, menolak bila kurang', async () => {
    const { spendMana } = await import('../src/world/combat.js');
    const p = { mana: 20, maxMana: 80 };
    expect(spendMana(p, 15)).toBe(true);
    expect(p.mana).toBe(5);
    expect(spendMana(p, 10)).toBe(false);
    expect(p.mana).toBe(5);
  });
  it('defense mengurangi damage monster (min 1)', () => {
    const p = createPlayer(0, 0);
    p.defense = 5;
    damagePlayer(p, 8, []);
    expect(p.hp).toBe(100 - 3);
    damagePlayer(p, 4, []);
    expect(p.hp).toBe(100 - 3 - 1); // tidak kurang dari 1
  });
  it('damage serangan di-roll dalam range atkMin-atkMax', () => {
    const p = createPlayer(0, 0); p.dir = 'right';
    p.atkMin = 10; p.atkMax = 14; p.critChance = 0; p.satiety = 100;
    for (let i = 0; i < 30; i++) {
      const m = createMonster(40, 0, 'goblin-hutan');
      const hp0 = m.hp;
      playerAttack(p, [m], []);
      p.atkCd = 0;
      const dealt = hp0 - m.hp;
      // damageMonster pakai effectiveness netral=1.0 → dealt dalam [10,14]
      expect(dealt).toBeGreaterThanOrEqual(10);
      expect(dealt).toBeLessThanOrEqual(14);
    }
  });
});

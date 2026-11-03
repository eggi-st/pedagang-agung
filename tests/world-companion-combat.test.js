// Tests: pendamping ikut tempur (dealer/ranged/healer).
import { describe, it, expect } from 'vitest';
import { updateCompanions, compDmg, compHealAmount,
         DEALER_CD, RANGED_CD, HEALER_CD, DEALER_RANGE, DEALER_AGGRO } from '../src/world/companion-ai.js';
import { createParty, hireMember } from '../src/world/party.js';
import { createMonster } from '../src/world/monster.js';
import { TILE } from '../src/world/tiles.js';

// Peta 40x40 semua lantai dungeon (bisa jalan).
function openMap() {
  return Array.from({ length: 40 }, () => Array(40).fill(TILE.DUNGEON_FLOOR));
}

function setup(compId, level = 1) {
  const party = createParty();
  hireMember(party, compId);
  const member = party.members[0];
  member.level = level;
  const follower = { id: compId, x: 640, y: 640, cd: 0, atkAnim: 0, engaged: false };
  const pairs = [{ follower, member }];
  const player = { x: 640, y: 700, hp: 100, maxHp: 100, fainted: false };
  return { party, member, follower, pairs, player, map: openMap(), projectiles: [], floaters: [] };
}

describe('compDmg / compHealAmount (skala level)', () => {
  it('Lv1 = nilai dasar definisi', () => {
    expect(compDmg({ dmg: 8 }, 1)).toBe(8);
    expect(compHealAmount({ heal: 12 }, 1)).toBe(12);
  });
  it('tiap level +10% (Lv6 = 1.5x)', () => {
    expect(compDmg({ dmg: 8 }, 6)).toBe(12);
    expect(compDmg({ dmg: 7 }, 11)).toBe(14);
  });
});

describe('dealer (Pendekar)', () => {
  it('menebas monster dalam jangkauan & cooldown jalan', () => {
    const s = setup('pendekar');
    const m = createMonster(660, 640, 'goblin-hutan');
    const hp0 = m.hp;
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(m.hp).toBeLessThan(hp0);
    expect(s.follower.cd).toBeGreaterThan(0);
    expect(s.follower.engaged).toBe(true);
    // Panggilan langsung kedua: cooldown menahan serangan.
    const hp1 = m.hp;
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(m.hp).toBe(hp1);
  });
  it('mendekati monster yang jauh (di dalam aggro)', () => {
    const s = setup('pendekar');
    const m = createMonster(640 + DEALER_AGGRO - 40, 640, 'goblin-hutan');
    const x0 = s.follower.x;
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.5, null);
    expect(s.follower.x).toBeGreaterThan(x0); // bergerak ke arah monster
    expect(s.follower.engaged).toBe(true);
  });
  it('tidak engaged bila monster di luar aggro', () => {
    const s = setup('pendekar');
    const m = createMonster(640 + DEALER_AGGRO + 100, 640, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.follower.engaged).toBe(false);
    expect(m.hp).toBe(m.maxHp);
  });
  it('monster mati diabaikan; onKill dipanggil saat kill', () => {
    const s = setup('pendekar');
    const m = createMonster(660, 640, 'goblin-hutan');
    m.hp = 1;
    let killed = 0;
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, () => { killed++; });
    expect(m.state).toBe('dead');
    expect(killed).toBe(1);
  });
  it('menyerang monster terdekat dulu', () => {
    const s = setup('pendekar');
    const near = createMonster(660, 640, 'goblin-hutan');
    const far = createMonster(760, 640, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [near, far], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });
});

describe('ranged (Pemanah)', () => {
  it('menembak panah ramah dalam range', () => {
    const s = setup('pemanah');
    const m = createMonster(640 + 120, 640, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.projectiles.length).toBe(1);
    expect(s.projectiles[0].friendly).toBe(true);
    expect(s.follower.engaged).toBe(true);
  });
  it('tidak menembak di luar range', () => {
    const s = setup('pemanah');
    const m = createMonster(640 + 300, 640, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.projectiles.length).toBe(0);
    expect(s.follower.engaged).toBe(false);
  });
  it('mundur bila monster terlalu dekat', () => {
    const s = setup('pemanah');
    const m = createMonster(660, 640, 'goblin-hutan');
    const x0 = s.follower.x;
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.5, null);
    expect(s.follower.x).toBeLessThan(x0); // menjauhi monster
  });
});

describe('healer (Tabib)', () => {
  it('menyembuhkan pemain di bawah 70% HP', () => {
    const s = setup('tabib');
    s.player.hp = 50;
    const m = createMonster(900, 900, 'goblin-hutan'); // jauh, tak relevan
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.player.hp).toBe(62); // +12 heal Lv1
    expect(s.floaters.some((f) => f.text === '+12')).toBe(true);
    expect(s.follower.engaged).toBe(true);
  });
  it('tidak heal bila semua sehat (tetap follow)', () => {
    const s = setup('tabib');
    const m = createMonster(900, 900, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.player.hp).toBe(100);
    expect(s.floaters.length).toBe(0);
    expect(s.follower.engaged).toBe(false); // kembali mengikuti pemain
  });
  it('memilih sekutu dengan rasio HP terendah', () => {
    const s = setup('tabib');
    s.player.hp = 60; // 60%
    // Tambah pendekar kedua dengan HP 30% (lebih kritis).
    hireMember(s.party, 'pendekar');
    const mem2 = s.party.members[1];
    mem2.hp = 24; // 24/80 = 30%
    const f2 = { id: 'pendekar', x: 600, y: 600, cd: 0, atkAnim: 0, engaged: false };
    s.pairs.push({ follower: f2, member: mem2 });
    const m = createMonster(900, 900, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(mem2.hp).toBe(36); // pendekar disembuhkan duluan (+12)
    expect(s.player.hp).toBe(60);
  });
  it('cooldown menahan heal beruntun', () => {
    const s = setup('tabib');
    s.player.hp = 50;
    const m = createMonster(900, 900, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.player.hp).toBe(62); // hanya sekali
  });
});

describe('kondisi umum', () => {
  it('tidak bertempur saat pemain pingsan', () => {
    const s = setup('pendekar');
    s.player.fainted = true;
    const m = createMonster(660, 640, 'goblin-hutan');
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(m.hp).toBe(m.maxHp);
    expect(s.follower.engaged).toBe(false);
  });
  it('tidak bertempur bila tak ada monster hidup', () => {
    const s = setup('pendekar');
    const m = createMonster(660, 640, 'goblin-hutan');
    m.state = 'dead';
    updateCompanions(s.pairs, s.player, [m], s.projectiles, s.floaters, s.map, 0.016, null);
    expect(s.follower.engaged).toBe(false);
  });
  it('konstanta cooldown sesuai rencana', () => {
    expect(DEALER_CD).toBe(1.2);
    expect(RANGED_CD).toBe(1.5);
    expect(HEALER_CD).toBe(3.0);
    expect(DEALER_RANGE).toBe(44);
  });
});

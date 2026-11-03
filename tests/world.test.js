// Tests untuk engine dunia Fase 0: tile, collision pemain, kamera.
import { describe, it, expect } from 'vitest';
import { TILE, TILE_SIZE, isWalkable, tileAt, walkableAt } from '../src/world/tiles.js';
import { createPlayer, updatePlayer } from '../src/world/player.js';
import { createCamera, clampCamera, snapCamera } from '../src/world/camera.js';
import { buildJoseonMap, MAP_W, MAP_H } from '../src/world/map-joseon.js';
import { buildDungeon, DUN_W, DUN_H } from '../src/world/map-dungeon.js';
import { createMonster, updateMonster } from '../src/world/monster.js';

function fakeInput(over = {}) {
  return { up: false, down: false, left: false, right: false, joyActive: false, joyX: 0, joyY: 0, ...over };
}

describe('isWalkable', () => {
  it('rumput, jalan, lantai kota, gerbang, bunga bisa dipijak', () => {
    for (const t of [TILE.GRASS, TILE.PATH, TILE.CITY, TILE.GATE, TILE.FLOWER]) {
      expect(isWalkable(t)).toBe(true);
    }
  });
  it('air, pohon, gunung, atap, pagar, gua, papan menghalangi', () => {
    for (const t of [TILE.WATER, TILE.TREE, TILE.MOUNTAIN, TILE.ROOF, TILE.WALL, TILE.CAVE, TILE.SIGN]) {
      expect(isWalkable(t)).toBe(false);
    }
  });
});

describe('tileAt', () => {
  const map = [[TILE.GRASS, TILE.WATER], [TILE.PATH, TILE.TREE]];
  it('di luar peta dianggap gunung (halangan)', () => {
    expect(tileAt(map, -1, 0)).toBe(TILE.MOUNTAIN);
    expect(tileAt(map, 0, -1)).toBe(TILE.MOUNTAIN);
    expect(tileAt(map, 2, 0)).toBe(TILE.MOUNTAIN);
    expect(tileAt(map, 0, 5)).toBe(TILE.MOUNTAIN);
  });
  it('koordinat pixel dipetakan ke tile yang benar', () => {
    expect(walkableAt(map, 10, 10)).toBe(true);              // (0,0) rumput
    expect(walkableAt(map, TILE_SIZE + 5, 5)).toBe(false);   // (1,0) air
  });
});

describe('updatePlayer', () => {
  const openMap = [[TILE.GRASS, TILE.GRASS, TILE.GRASS], [TILE.GRASS, TILE.GRASS, TILE.GRASS]];
  it('bergerak sesuai input dan arah hadap ikut sumbu dominan', () => {
    const p = createPlayer(48, 48);
    updatePlayer(p, fakeInput({ right: true }), 1 / 60, openMap);
    expect(p.x).toBeGreaterThan(48);
    expect(p.dir).toBe('right');
    expect(p.moving).toBe(true);
  });
  it('diam kalau tidak ada input', () => {
    const p = createPlayer(48, 48);
    updatePlayer(p, fakeInput(), 1 / 60, openMap);
    expect(p.x).toBe(48); expect(p.y).toBe(48);
    expect(p.moving).toBe(false);
  });
  it('terhalang dinding: tidak menembus tile air', () => {
    // Kolom x=1 adalah air; pemain di (0.5 tile) jalan ke kanan.
    const map = [[TILE.GRASS, TILE.WATER, TILE.GRASS]];
    const p = createPlayer(16, 16);
    for (let i = 0; i < 120; i++) updatePlayer(p, fakeInput({ right: true }), 1 / 60, map);
    // Hitbox hw=9: titik kaki x tidak boleh melewati 32-9=23 secara berarti.
    expect(p.x).toBeLessThan(32);
  });
  it('meluncur di dinding (slide): gerak diagonal di koridor vertikal', () => {
    const map = [[TILE.GRASS, TILE.WATER], [TILE.GRASS, TILE.WATER], [TILE.GRASS, TILE.WATER]];
    const p = createPlayer(16, 48);
    for (let i = 0; i < 60; i++) updatePlayer(p, fakeInput({ right: true, down: true }), 1 / 60, map);
    expect(p.y).toBeGreaterThan(48); // tetap bisa turun walau kanan mentok
    expect(p.x).toBeLessThan(32);
  });
});

describe('kamera', () => {
  it('snap menempatkan target di tengah', () => {
    const cam = createCamera(400, 300);
    snapCamera(cam, 500, 400);
    expect(cam.x).toBe(300); expect(cam.y).toBe(250);
  });
  it('clamp menahan kamera di dalam peta', () => {
    const cam = createCamera(400, 300);
    cam.x = -100; cam.y = 99999;
    clampCamera(cam, 1000, 800);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(500);
  });
});

describe('buildJoseonMap', () => {
  it('berukuran 64x44 dan deterministik', () => {
    const a = buildJoseonMap(), b = buildJoseonMap();
    expect(a.map.length).toBe(MAP_H);
    expect(a.map[0].length).toBe(MAP_W);
    expect(JSON.stringify(a.map)).toBe(JSON.stringify(b.map));
  });
  it('spawn di tile yang bisa dipijak, gerbang & gua di posisi benar', () => {
    const w = buildJoseonMap();
    expect(walkableAt(w.map, w.spawn.x, w.spawn.y)).toBe(true);
    expect(tileAt(w.map, w.cityGate.tx, w.cityGate.ty)).toBe(TILE.GATE);
    expect(tileAt(w.map, w.cave.tx, w.cave.ty)).toBe(TILE.CAVE);
    expect(w.cityGate.name).toBe('Hanseong');
  });
  it('ada jalan dari gerbang ke gua (flood fill lewat tile walkable)', () => {
    const w = buildJoseonMap();
    const seen = new Set();
    const q = [[w.cityGate.tx, w.cityGate.ty + 1]];
    let reached = false;
    while (q.length) {
      const [x, y] = q.pop();
      const k = x + ',' + y;
      if (seen.has(k)) continue;
      seen.add(k);
      if (x === 41 && y === 34) { reached = true; break; } // depan gua
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        if (isWalkable(tileAt(w.map, nx, ny))) q.push([nx, ny]);
      }
    }
    expect(reached).toBe(true);
  });
});

describe('tile dungeon', () => {
  it('lantai dungeon & tangga walkable, dinding & peti tidak', () => {
    expect(isWalkable(TILE.DUNGEON_FLOOR)).toBe(true);
    expect(isWalkable(TILE.STAIRS)).toBe(true);
    expect(isWalkable(TILE.DUNGEON_WALL)).toBe(false);
    expect(isWalkable(TILE.CHEST)).toBe(false);
  });
});

describe('buildDungeon', () => {
  it('berukuran 40x30, tangga & spawn bisa dipijak', () => {
    const d = buildDungeon();
    expect(d.map.length).toBe(DUN_H);
    expect(d.map[0].length).toBe(DUN_W);
    expect(tileAt(d.map, d.stairs.tx, d.stairs.ty)).toBe(TILE.STAIRS);
    expect(walkableAt(d.map, d.entrance.x, d.entrance.y)).toBe(true);
    expect(tileAt(d.map, d.chest.tx, d.chest.ty)).toBe(TILE.CHEST);
  });
  it('ada 4 spawn monster di tile walkable', () => {
    const d = buildDungeon();
    expect(d.monsterSpawns.length).toBe(4);
    for (const s of d.monsterSpawns) {
      expect(walkableAt(d.map, s.x, s.y)).toBe(true);
    }
  });
  it('ruang utama terhubung ke tangga (flood fill)', () => {
    const d = buildDungeon();
    const seen = new Set();
    const q = [[d.stairs.tx, d.stairs.ty]];
    let reachedChestAdj = false;
    while (q.length) {
      const [x, y] = q.pop();
      const k = x + ',' + y;
      if (seen.has(k)) continue;
      seen.add(k);
      if (Math.abs(x - d.chest.tx) + Math.abs(y - d.chest.ty) === 1) { reachedChestAdj = true; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= DUN_W || ny >= DUN_H) continue;
        if (isWalkable(tileAt(d.map, nx, ny))) q.push([nx, ny]);
      }
    }
    expect(reachedChestAdj).toBe(true);
  });
});

describe('monster wander', () => {
  it('tidak pernah keluar area walkable setelah 600 tick', () => {
    const d = buildDungeon();
    const m = createMonster(d.monsterSpawns[0].x, d.monsterSpawns[0].y, 'Goblin Hutan');
    for (let i = 0; i < 600; i++) {
      updateMonster(m, 1 / 60, d.map);
      expect(walkableAt(d.map, m.x, m.y)).toBe(true);
    }
  });
  it('bergerak lebih lambat dari pemain', () => {
    const m = createMonster(100, 100, 'Goblin Hutan');
    expect(m.speed).toBeLessThan(150);
  });
});

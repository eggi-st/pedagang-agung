// Tests: save permanen berversion + party (rekrut/pecat/XP).
import { describe, it, expect, beforeEach } from 'vitest';
import { SAVE_KEY, SAVE_VERSION, collectSave, writeSave, readSave, clearSave } from '../src/world/save.js';
import { createParty, hireMember, dismissMember, gainPartyXp, memberMaxHp, MAX_MEMBERS } from '../src/world/party.js';

// localStorage mock (vitest node env).
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
globalThis.sessionStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  clear() { this._s = {}; },
};

function fakeState() {
  return {
    player: {
      x: 100, y: 200, level: 5, xp: 30, statPoints: 3,
      stats: { str: 8, agi: 6, vit: 7, wis: 5 },
      hp: 90, mana: 40, satiety: 80,
      equip: { weapon: 'pedang-besi', armor: null },
    },
    inv: { items: { 'ramuan-merah': 2 } },
    gold: 500,
    active: 'dungeon',
    chestLooted: true,
    party: { members: [{ id: 'pendekar', level: 3, xp: 10, hp: 100 }] },
  };
}

beforeEach(() => { clearSave(); });

describe('save', () => {
  it('collectSave berversion & lengkap', () => {
    const d = collectSave(fakeState());
    expect(d.version).toBe(SAVE_VERSION);
    expect(d.map).toBe('dungeon');
    expect(d.gold).toBe(500);
    expect(d.player.stats.str).toBe(8);
    expect(d.party[0].id).toBe('pendekar');
    expect(d.inv['ramuan-merah']).toBe(2);
    expect(d.savedAt).toBeGreaterThan(0);
  });
  it('write + read round-trip', () => {
    expect(writeSave(fakeState())).toBe(true);
    const d = readSave();
    expect(d.player.level).toBe(5);
    expect(d.party.length).toBe(1);
  });
  it('readSave null bila kosong / versi beda / korup', () => {
    expect(readSave()).toBeNull();
    store[SAVE_KEY] = JSON.stringify({ version: 999 });
    expect(readSave()).toBeNull();
    store[SAVE_KEY] = 'bukan json{{{';
    expect(readSave()).toBeNull();
  });
  it('key = pa.save.v1', () => {
    expect(SAVE_KEY).toBe('pa.save.v1');
  });
});

describe('party', () => {
  it('rekrut sukses, duplikat & penuh ditolak', () => {
    const p = createParty();
    expect(hireMember(p, 'pendekar').ok).toBe(true);
    expect(hireMember(p, 'pendekar').ok).toBe(false); // duplikat
    expect(hireMember(p, 'tabib').ok).toBe(true);
    const r = hireMember(p, 'pemanah');
    expect(r.ok).toBe(false); // penuh
    expect(r.reason).toMatch(/penuh/);
    expect(p.members.length).toBe(MAX_MEMBERS);
  });
  it('rekrut tak dikenal ditolak', () => {
    expect(hireMember(createParty(), 'naga').ok).toBe(false);
  });
  it('pecat anggota', () => {
    const p = createParty();
    hireMember(p, 'pendekar');
    expect(dismissMember(p, 'pendekar')).toBe(true);
    expect(p.members.length).toBe(0);
    expect(dismissMember(p, 'pendekar')).toBe(false);
  });
  it('XP party 50%, naik level heal penuh', () => {
    const p = createParty();
    hireMember(p, 'tabib');
    const m = p.members[0];
    m.hp = 10;
    const ups = gainPartyXp(p, 40); // share 20 = cukup naik Lv1→Lv2 (20 XP)
    expect(ups.length).toBe(1);
    expect(m.level).toBe(2);
    expect(m.hp).toBe(memberMaxHp({ hp: 60 }, 2)); // heal penuh
  });
  it('memberMaxHp +10 per level', () => {
    expect(memberMaxHp({ hp: 80 }, 1)).toBe(80);
    expect(memberMaxHp({ hp: 80 }, 5)).toBe(120);
  });
});

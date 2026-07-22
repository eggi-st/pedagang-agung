import { describe, it, expect, beforeEach } from 'vitest';
import { pickPartyTarget } from '../src/systems/battle.js';
import { setState } from '../src/state.js';

// pickPartyTarget membaca state.generals + state.char (+ getDef). Diuji tanpa
// browser dengan state minimal; distribusi diperiksa statistik atas banyak
// panggilan karena memakai Math.random.
function baseState(generals) {
  setState({
    generals,
    char: { hp: 100, maxHp: 100, agi: 5, str: 5, classAtkBonus: 0 },
    equipment: { weapon: null, kepala: null, badan: null, celana: null, sepatu: null, accessory1: null, accessory2: null },
    items: [],
  });
}
const gen = (hp = 30) => ({ hp, maxHp: 30, atk: 5, elem: 'Api' });

function sample(n = 4000) {
  const hits = { front: 0, back: 0, char: 0 };
  for (let i = 0; i < n; i++) {
    const t = pickPartyTarget();
    if (!t) continue;
    if (t.ref === 'char') hits.char++;
    else if (t.idx < 2) hits.front++;
    else hits.back++;
  }
  return hits;
}

describe('pickPartyTarget (formasi)', () => {
  beforeEach(() => {});

  it('garda depan menyerap sebagian besar serangan saat hidup', () => {
    baseState([gen(), gen(), gen(), gen()]); // 4 jendral: 2 depan, 2 belakang
    const h = sample();
    const total = h.front + h.back + h.char;
    expect(h.front / total).toBeGreaterThan(0.75); // ~85% ke garda depan
    expect(h.back + h.char).toBeGreaterThan(0);     // sisanya bocor
  });

  it('barisan belakang & pemain terlindungi selama garda depan hidup', () => {
    baseState([gen(), gen(), gen()]);
    const h = sample();
    expect((h.back + h.char) / (h.front + h.back + h.char)).toBeLessThan(0.3);
  });

  it('kalau garda depan tumbang, belakang & pemain terekspos', () => {
    baseState([gen(0), gen(0), gen()]); // dua depan tumbang, satu belakang hidup
    const h = sample();
    expect(h.front).toBe(0);
    expect(h.back + h.char).toBeGreaterThan(0);
  });

  it('tanpa jendral, pemain selalu jadi target', () => {
    baseState([]);
    const h = sample(200);
    expect(h.char).toBe(200);
    expect(h.front + h.back).toBe(0);
  });

  it('null kalau seluruh pasukan & pemain tumbang', () => {
    setState({ generals: [gen(0)], char: { hp: 0, maxHp: 100, agi: 5, str: 5 },
      equipment: { weapon: null }, items: [] });
    expect(pickPartyTarget()).toBeNull();
  });
});

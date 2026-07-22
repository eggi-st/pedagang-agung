import { describe, it, expect } from 'vitest';
import { availableCombo, COMBOS } from '../src/systems/battle.js';
import { setState, setBattle } from '../src/state.js';

// availableCombo membaca state.generals + battle.generalSkillUsed + elemen
// efektif anggota. Diuji tanpa browser dengan menyetel state & battle tiruan.
function setup(elems, { used = [], over = false } = {}) {
  setState({ generals: elems.map((e, i) => ({ name: 'G' + i, hp: 10, maxHp: 10, atk: 5, elem: e })) });
  setBattle({ over, generalSkillUsed: used, enemies: [], flashTargets: new Set() });
}

describe('COMBOS', () => {
  it('setiap combo punya nama dan dua elemen berbeda', () => {
    COMBOS.forEach((c) => {
      expect(c.name).toBeTruthy();
      expect(c.a).not.toBe(c.b);
    });
  });
});

describe('availableCombo', () => {
  it('null kalau pasangan elemen tidak membentuk combo', () => {
    setup(['Api', 'Api']);
    expect(availableCombo()).toBeNull();
  });

  it('menemukan combo untuk pasangan yang cocok (Api + Angin)', () => {
    setup(['Api', 'Angin']);
    const r = availableCombo();
    expect(r).not.toBeNull();
    expect(r.combo.name).toBe('Badai Api');
  });

  it('urutan elemen tidak penting', () => {
    setup(['Angin', 'Api']);
    expect(availableCombo().combo.name).toBe('Badai Api');
  });

  it('mengabaikan anggota yang skill-nya sudah dipakai', () => {
    setup(['Api', 'Angin'], { used: [0] });
    expect(availableCombo()).toBeNull();
  });

  it('mengabaikan anggota yang tumbang (hp<=0)', () => {
    setState({ generals: [
      { name: 'a', hp: 0, maxHp: 10, atk: 5, elem: 'Api' },
      { name: 'b', hp: 10, maxHp: 10, atk: 5, elem: 'Angin' },
    ] });
    setBattle({ over: false, generalSkillUsed: [], enemies: [], flashTargets: new Set() });
    expect(availableCombo()).toBeNull();
  });

  it('null saat pertempuran sudah berakhir', () => {
    setup(['Api', 'Angin'], { over: true });
    expect(availableCombo()).toBeNull();
  });

  it('menemukan combo di antara 3+ anggota (pasangan mana pun)', () => {
    setup(['Bumi', 'Petir', 'Bumi']); // Petir + Bumi = Gempa Petir
    const r = availableCombo();
    expect(r).not.toBeNull();
    expect(r.combo.name).toBe('Gempa Petir');
  });
});

import { describe, it, expect } from 'vitest';
import { elementMultiplier, ELEMENTS } from '../src/data/elements.js';

describe('elementMultiplier', () => {
  it('mengembalikan 1 kalau salah satu elemen kosong', () => {
    expect(elementMultiplier(null, 'Api')).toBe(1);
    expect(elementMultiplier('Api', null)).toBe(1);
  });

  it('mengembalikan 1 kalau elemen sama', () => {
    expect(elementMultiplier('Api', 'Api')).toBe(1);
  });

  it('Api unggul atas Angin (siklus: Api > Angin > Bumi > Petir > Air > Api)', () => {
    expect(elementMultiplier('Api', 'Angin')).toBe(1.3);
  });

  it('Api lemah melawan Air (Air mendahului Api dalam siklus)', () => {
    expect(elementMultiplier('Api', 'Air')).toBe(0.75);
  });

  it('setiap elemen dalam siklus mengalahkan tepat satu elemen lain', () => {
    ELEMENTS.forEach((elem, i) => {
      const next = ELEMENTS[(i + 1) % ELEMENTS.length];
      expect(elementMultiplier(elem, next)).toBe(1.3);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { priceTrend } from '../src/systems/economy.js';
import { setState } from '../src/state.js';
import { GOODS } from '../src/data/economy.js';

// priceTrend murni membaca state.prices vs state.basePrices, jadi bisa diuji
// tanpa DOM/audio — cukup menyetel state minimal.
function stateWith(prices, basePrices) {
  setState({ prices: { Kota: prices }, basePrices: basePrices ? { Kota: basePrices } : undefined });
}

describe('priceTrend', () => {
  beforeEach(() => setState(null));

  it('nol saat harga tepat di baseline', () => {
    stateWith({ teh: 15 }, { teh: 15 });
    expect(priceTrend('Kota', 'teh')).toBe(0);
  });

  it('positif saat harga di atas baseline (bagus dijual)', () => {
    stateWith({ teh: 18 }, { teh: 15 });
    expect(priceTrend('Kota', 'teh')).toBe(20); // 18/15 - 1 = +20%
  });

  it('negatif saat harga di bawah baseline (bagus dibeli)', () => {
    stateWith({ teh: 12 }, { teh: 15 });
    expect(priceTrend('Kota', 'teh')).toBe(-20);
  });

  it('membulatkan ke persen terdekat', () => {
    stateWith({ teh: 16 }, { teh: 15 });
    expect(priceTrend('Kota', 'teh')).toBe(7); // 6,67% -> 7
  });

  // Save lama tanpa basePrices harus jatuh ke base kanonik GOODS, bukan crash.
  it('fallback ke base GOODS kalau basePrices tidak ada', () => {
    const teh = GOODS.find((g) => g.id === 'teh');
    stateWith({ teh: teh.base * 2 }, null);
    expect(priceTrend('Kota', 'teh')).toBe(100);
  });
});

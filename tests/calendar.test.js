import { describe, it, expect } from 'vitest';
import { calendarFromDay, seasonForDay, seasonalFactor, DAYS_PER_YEAR } from '../src/data/calendar.js';

describe('calendarFromDay', () => {
  it('hari 1 = Tahun 1, Bulan 1, Hari 1, musim Semi', () => {
    const c = calendarFromDay(1);
    expect(c).toMatchObject({ year: 1, month: 1, dayOfMonth: 1 });
    expect(c.season.key).toBe('semi');
  });

  it('hari 30 masih Bulan 1, hari 31 masuk Bulan 2', () => {
    expect(calendarFromDay(30)).toMatchObject({ month: 1, dayOfMonth: 30 });
    expect(calendarFromDay(31)).toMatchObject({ month: 2, dayOfMonth: 1 });
  });

  it('musim bergeser tiap 3 bulan', () => {
    expect(seasonForDay(1).key).toBe('semi');          // bulan 1
    expect(seasonForDay(31 + 90).key).toBe('panas');   // bulan 4-ish
    expect(seasonForDay(1 + 180).key).toBe('gugur');   // bulan 7
    expect(seasonForDay(1 + 270).key).toBe('dingin');  // bulan 10
  });

  it('tahun bertambah setelah 360 hari', () => {
    expect(calendarFromDay(DAYS_PER_YEAR).year).toBe(1);       // hari 360 = akhir tahun 1
    expect(calendarFromDay(DAYS_PER_YEAR + 1).year).toBe(2);   // hari 361 = tahun 2
    expect(calendarFromDay(DAYS_PER_YEAR + 1)).toMatchObject({ month: 1, dayOfMonth: 1 });
  });

  it('nilai day di bawah 1 tetap aman (dianggap hari 1)', () => {
    expect(calendarFromDay(0)).toMatchObject({ year: 1, month: 1, dayOfMonth: 1 });
  });
});

describe('seasonalFactor', () => {
  it('barang murah musiman < 1, barang mahal > 1, lainnya = 1', () => {
    // Semi (hari 1): teh murah, porselen mahal
    expect(seasonalFactor('teh', 1)).toBeLessThan(1);
    expect(seasonalFactor('porselen', 1)).toBeGreaterThan(1);
    expect(seasonalFactor('rempah', 1)).toBe(1);
  });

  it('barang sama bisa murah di satu musim, mahal di musim lain', () => {
    // Sutra: mahal di Panas & Dingin, murah di Gugur (panen)
    expect(seasonalFactor('sutra', 1 + 90)).toBeGreaterThan(1);   // panas
    expect(seasonalFactor('sutra', 1 + 180)).toBeLessThan(1);     // gugur
  });
});

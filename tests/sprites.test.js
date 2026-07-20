import { describe, it, expect, beforeEach } from 'vitest';
import { computeFrame, drawPixelSprite, setSpriteMotion, shade } from '../src/ui/sprites.js';
import {
  SPRITE_MONSTER,
  SPRITE_HUMANOID,
  MONSTER_SPRITE,
  CLASS_SPRITE,
  DEMO_SPRITE,
} from '../src/data/sprites.js';

// State sprite tiruan — bentuknya harus sama dengan yang dibuat paintSpriteCanvas.
function mockState(over = {}) {
  return {
    template: SPRITE_HUMANOID,
    colors: { H: '#000', S: '#fff', B: '#00f', A: '#ff0', W: '#ccc' },
    cell: 5,
    phase: 0,
    anim: null,
    animStart: 0,
    gone: false,
    ...over,
  };
}

// Canvas tiruan yang mencatat setiap fillRect, supaya bisa diperiksa
// tanpa butuh browser sungguhan.
function mockCanvas(width, height) {
  const rects = [];
  let fill = null;
  return {
    width,
    height,
    rects,
    getContext: () => ({
      imageSmoothingEnabled: true,
      globalAlpha: 1,
      set fillStyle(v) { fill = v; },
      get fillStyle() { return fill; },
      clearRect() {},
      fillRect(x, y, w, h) { rects.push({ x, y, w, h, fill }); },
    }),
  };
}

const MONSTER_COLORS = { M: '#f00', E: '#000', W: '#ccc' };

describe('drawPixelSprite', () => {
  it('memakai ukuran sel bulat supaya piksel tidak pecah', () => {
    // 50px / 12 kolom = 4,16 -> dibulatkan ke bawah jadi 4
    const c = mockCanvas(50, 50);
    drawPixelSprite(c, SPRITE_MONSTER, MONSTER_COLORS);
    expect(c.rects.length).toBeGreaterThan(0);
    for (const r of c.rects) {
      expect(Number.isInteger(r.x)).toBe(true);
      expect(Number.isInteger(r.y)).toBe(true);
      expect(r.w).toBe(4);
      expect(r.h).toBe(4);
    }
  });

  it('menempatkan sprite di tengah canvas', () => {
    const c = mockCanvas(50, 50);
    drawPixelSprite(c, SPRITE_MONSTER, MONSTER_COLORS);
    const minX = Math.min(...c.rects.map((r) => r.x));
    const maxX = Math.max(...c.rects.map((r) => r.x + r.w));
    // Sisa ruang kiri dan kanan seimbang (toleransi 1px karena pembulatan)
    expect(Math.abs(minX - (50 - maxX))).toBeLessThanOrEqual(1);
  });

  it('tidak menggambar sel transparan', () => {
    const c = mockCanvas(48, 48);
    drawPixelSprite(c, ['M.M', '.M.', 'M.M'], { M: '#f00' });
    expect(c.rects.length).toBe(5); // 5 huruf M, 4 titik dilewati
  });

  it('tint menimpa seluruh warna slot', () => {
    const c = mockCanvas(48, 48);
    drawPixelSprite(c, ['MEM'], { M: '#f00', E: '#0f0' }, { tint: '#fff' });
    expect(c.rects.every((r) => r.fill === '#fff')).toBe(true);
  });

  it('offset dx/dy menggeser seluruh sprite', () => {
    const a = mockCanvas(48, 48);
    const b = mockCanvas(48, 48);
    drawPixelSprite(a, ['M'], { M: '#f00' });
    drawPixelSprite(b, ['M'], { M: '#f00' }, { dx: 3, dy: -2 });
    expect(b.rects[0].x - a.rects[0].x).toBe(3);
    expect(b.rects[0].y - a.rects[0].y).toBe(-2);
  });
});

describe('computeFrame — gerak diam', () => {
  beforeEach(() => setSpriteMotion(true));

  it('bergerak naik-turun seiring waktu', () => {
    const st = mockState();
    const ys = [0, 200, 400, 600, 800, 1000, 1200].map((t) => computeFrame(st, t).dy);
    expect(new Set(ys).size).toBeGreaterThan(1);
  });

  it('fase berbeda membuat sprite tidak bergerak serempak', () => {
    const a = computeFrame(mockState({ phase: 0 }), 300).dy;
    const b = computeFrame(mockState({ phase: Math.PI }), 300).dy;
    expect(a).not.toBe(b);
  });

  it('amplitudonya tidak pernah nol walau selnya sangat kecil', () => {
    const st = mockState({ cell: 1 });
    const ys = Array.from({ length: 20 }, (_, i) => computeFrame(st, i * 130).dy);
    expect(ys.some((y) => y !== 0)).toBe(true);
  });
});

describe('computeFrame — animasi sekali jalan', () => {
  beforeEach(() => setSpriteMotion(true));

  it('serang memajukan sprite lalu mengembalikannya', () => {
    const st = mockState({ anim: 'attack', animStart: 0 });
    const puncak = computeFrame(st, 120).dx; // ~40% dari 300ms
    expect(puncak).toBeGreaterThan(0);
    expect(computeFrame(st, 290).dx).toBeLessThan(puncak);
  });

  it('kena memberi kilatan putih di paruh awal saja', () => {
    const st = mockState({ anim: 'hit', animStart: 0 });
    expect(computeFrame(st, 40).tint).toBe('#fff');
    expect(computeFrame(st, 260).tint).toBeNull();
  });

  it('tumbang memudarkan sprite lalu menandainya gone', () => {
    const st = mockState({ anim: 'defeat', animStart: 0 });
    const awal = computeFrame(st, 60).alpha;
    expect(computeFrame(st, 400).alpha).toBeLessThan(awal);

    computeFrame(st, 999); // lewat durasi 620ms
    expect(st.anim).toBeNull();
    expect(st.gone).toBe(true);
  });

  it('membersihkan anim setelah durasi habis agar loop bisa berhenti', () => {
    const st = mockState({ anim: 'attack', animStart: 0 });
    computeFrame(st, 301);
    expect(st.anim).toBeNull();
  });
});

describe('computeFrame — saat animasi dimatikan', () => {
  beforeEach(() => setSpriteMotion(false));

  it('tidak ada gerak diam', () => {
    const st = mockState();
    const ys = [0, 300, 600, 900].map((t) => computeFrame(st, t).dy);
    expect(ys.every((y) => y === 0)).toBe(true);
  });

  // Regresi: sebelumnya pengecekan motionEnabled mendahului logika waktu,
  // sehingga st.anim tidak pernah dibersihkan dan loop rAF berputar selamanya.
  it('tetap menyelesaikan animasi supaya loop tidak berputar selamanya', () => {
    const st = mockState({ anim: 'attack', animStart: 0 });
    computeFrame(st, 301);
    expect(st.anim).toBeNull();
  });

  it('perubahan status tumbang tetap terlihat walau gerak dimatikan', () => {
    const st = mockState({ anim: 'defeat', animStart: 0 });
    expect(computeFrame(st, 310).alpha).toBeLessThan(1);
    computeFrame(st, 999);
    expect(st.gone).toBe(true);
  });
});

describe('shade — warna turunan', () => {
  it('menggelapkan warna secara proporsional', () => {
    // 79,209,197 x 0,62 -> 49,130,122
    expect(shade('#4fd1c5', 0.62)).toBe('#31827a');
  });

  it('mencampur ke putih saat faktor di atas 1', () => {
    const terang = shade('#4fd1c5', 1.4);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(terang.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(0x4f);
    expect(g).toBeGreaterThan(0xd1);
    expect(b).toBeGreaterThan(0xc5);
  });

  it('tidak pernah keluar dari rentang 0-255', () => {
    expect(shade('#ffffff', 2)).toBe('#ffffff');
    expect(shade('#000000', 0)).toBe('#000000');
  });

  it('mengembalikan nilai asli kalau bukan hex 6 digit', () => {
    expect(shade('bukan-warna', 0.5)).toBe('bukan-warna');
    expect(shade('#abc', 0.5)).toBe('#abc');
  });

  // Inilah alasan bayangan dihitung, bukan digambar: satu template
  // melayani semua elemen dan bayangannya ikut berubah sendiri.
  it('warna dasar berbeda menghasilkan bayangan berbeda', () => {
    const api = shade('#e0523f', 0.62);
    const air = shade('#4a90d9', 0.62);
    expect(api).not.toBe(air);
  });
});

describe('data template sprite', () => {
  const semua = Object.entries({
    ...Object.fromEntries(Object.entries(MONSTER_SPRITE).map(([k, v]) => [`monster:${k}`, v])),
    ...Object.fromEntries(Object.entries(CLASS_SPRITE).map(([k, v]) => [`kelas:${k}`, v])),
    ...Object.fromEntries(Object.entries(DEMO_SPRITE).map(([k, v]) => [`demo:${k}`, v])),
    'fallback:humanoid': SPRITE_HUMANOID,
    'fallback:monster': SPRITE_MONSTER,
  });

  it('setiap template punya baris sama panjang', () => {
    for (const [nama, tpl] of semua) {
      const lebar = tpl[0].length;
      for (const baris of tpl) {
        expect(baris.length, `${nama}: baris tidak sama panjang -> "${baris}"`).toBe(lebar);
      }
    }
  });

  it('setiap template punya piksel tidak transparan', () => {
    for (const [nama, tpl] of semua) {
      const isi = tpl.join('').replace(/\./g, '');
      expect(isi.length, `${nama}: template kosong`).toBeGreaterThan(0);
    }
  });

  it('setiap monster punya bentuk yang benar-benar berbeda', () => {
    const sidik = Object.entries(MONSTER_SPRITE).map(([n, t]) => [n, t.join('|')]);
    const unik = new Set(sidik.map(([, s]) => s));
    expect(unik.size, 'ada monster yang memakai bentuk identik').toBe(sidik.length);
  });
});

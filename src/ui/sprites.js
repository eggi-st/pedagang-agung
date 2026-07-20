import {
  SPRITE_HUMANOID,
  SPRITE_MONSTER,
  MONSTER_SPRITE,
  CLASS_SPRITE,
  SKIN_TONE,
  PROP_COLOR,
  PACK_COLOR,
} from '../data/sprites.js';
import { NATION_BODY_COLOR } from '../data/classes.js';
import { RANK_BODY_COLOR } from '../data/mercenaries/index.js';
import { ELEMENT_BODY_COLOR } from '../data/elements.js';

// Format atribut: data-sprite="jenis:warna:bentuk"
//   player:Joseon:Pedagang   -> warna badan dari negara, bentuk dari kelas
//   general:3                -> warna badan dari pangkat, bentuk jendral
//   monster:Api:Serigala Hutan -> warna dari elemen, bentuk dari nama monster
// Bagian "bentuk" opsional; kalau kosong dipakai template generik.

let motionEnabled = true;
try {
  motionEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch { /* lingkungan tanpa matchMedia (mis. test) — animasi tetap aktif */ }

/** Matikan/hidupkan animasi secara manual (mis. dari tombol setelan). */
export function setSpriteMotion(on) {
  motionEnabled = !!on;
}

/**
 * Menggambar template ke canvas dengan ukuran sel BULAT dan posisi di tengah,
 * supaya piksel tidak pernah pecah/blur berapa pun ukuran canvas-nya.
 */
export function drawPixelSprite(canvas, template, colors, opts = {}) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const rows = template.length;
  const cols = template[0].length;

  const cell = Math.max(1, Math.floor(Math.min(canvas.width / cols, canvas.height / rows)));
  const originX = Math.floor((canvas.width - cols * cell) / 2) + (opts.dx || 0);
  const originY = Math.floor((canvas.height - rows * cell) / 2) + (opts.dy || 0);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;

  for (let r = 0; r < rows; r++) {
    const row = template[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = opts.tint || colors[ch] || '#fff';
      ctx.fillRect(originX + c * cell, originY + r * cell, cell, cell);
    }
  }

  ctx.globalAlpha = 1;
}

/** Menerjemahkan atribut data-sprite jadi {template, colors}. */
function resolveSprite(spec) {
  const parts = String(spec).split(':');
  const kind = parts[0];
  const colorKey = parts[1] || '';
  const shapeKey = parts.slice(2).join(':');

  if (kind === 'player') {
    return {
      template: CLASS_SPRITE[shapeKey] || SPRITE_HUMANOID,
      colors: {
        H: '#2a1a0a',
        S: SKIN_TONE,
        B: NATION_BODY_COLOR[colorKey] || '#4a90d9',
        A: '#f4c542',
        W: shapeKey === 'Pedagang' ? PACK_COLOR : PROP_COLOR,
      },
    };
  }

  if (kind === 'general') {
    return {
      template: CLASS_SPRITE[shapeKey] || SPRITE_HUMANOID,
      colors: {
        H: '#2a1a0a',
        S: SKIN_TONE,
        B: RANK_BODY_COLOR[parseInt(colorKey, 10)] || '#9788b8',
        A: '#ede4ff',
        W: PROP_COLOR,
      },
    };
  }

  return {
    template: MONSTER_SPRITE[shapeKey] || SPRITE_MONSTER,
    colors: {
      M: ELEMENT_BODY_COLOR[colorKey] || '#7a2a2a',
      E: '#1a1423',
      W: PROP_COLOR,
    },
  };
}

// ---------- LOOP ANIMASI ----------

const registry = new Map(); // canvas -> state
let rafId = null;

const ANIM = {
  hit:     { ms: 320, flash: '#fff' },
  attack:  { ms: 300 },
  cast:    { ms: 420, flash: '#cfe8ff' },
  defeat:  { ms: 620 },
};

/**
 * Menghitung offset/tint satu frame dari state sprite. Fungsi murni
 * (kecuali mengubah st.anim saat animasi selesai) — diekspor supaya bisa
 * diuji tanpa browser, karena rAF tidak jalan di tab latar belakang.
 */
export function computeFrame(st, now) {
  const out = { dx: 0, dy: 0, alpha: 1, tint: null };

  // Waktu animasi HARUS tetap maju walau gerak dimatikan. Kalau pengecekan
  // motionEnabled ditaruh sebelum blok ini, st.anim tidak pernah dibersihkan
  // dan loop berputar selamanya — persis pemborosan baterai yang mau dihindari.
  let t = 0;
  if (st.anim) {
    t = (now - st.animStart) / ANIM[st.anim].ms;
    if (t >= 1) {
      const finished = st.anim;
      st.anim = null;
      if (finished === 'defeat') { st.gone = true; out.alpha = 0; }
      return out;
    }
  }

  if (!motionEnabled) {
    // Gerak dimatikan: lewati bob dan goyang, tapi perubahan STATUS tetap
    // terlihat — pemain masih harus tahu bahwa musuhnya tumbang.
    if (st.anim === 'defeat') out.alpha = 1 - t;
    return out;
  }

  // Gerak diam: naik-turun halus. Fase acak per sprite supaya tidak serempak.
  const amp = Math.max(1, Math.round(st.cell * 0.18));
  out.dy = Math.round(Math.sin(now / 520 + st.phase) * amp);

  if (!st.anim) return out;

  const cfg = ANIM[st.anim];

  if (st.anim === 'hit') {
    if (t < 0.45) out.tint = cfg.flash;
    out.dx = Math.round(Math.sin(t * Math.PI * 6) * st.cell * 0.6);
  } else if (st.anim === 'attack') {
    // Maju cepat lalu kembali: puncak di 40% durasi.
    const p = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;
    out.dx = Math.round(p * st.cell * 1.6);
  } else if (st.anim === 'cast') {
    if (Math.floor(t * 8) % 2 === 0) out.tint = cfg.flash;
    out.dy -= Math.round(Math.sin(t * Math.PI) * st.cell);
  } else if (st.anim === 'defeat') {
    out.alpha = 1 - t;
    out.dy = Math.round(t * st.cell * 2);
    out.tint = t > 0.5 ? '#6b5a7a' : null;
  }

  return out;
}

// Gerak diam tidak perlu 60fps. Menahannya di ~20fps memangkas kerja
// menggambar dua pertiga tanpa terlihat bedanya, dan itu penting di HP —
// loop rAF yang jalan terus-terusan adalah penguras baterai yang nyata.
const IDLE_FPS = 20;
const IDLE_INTERVAL = 1000 / IDLE_FPS;

let timerId = null;
let lastDraw = 0;

function tick(now) {
  rafId = null;
  timerId = null;

  let alive = false;
  let animating = false;

  for (const [canvas, st] of registry) {
    if (!canvas.isConnected) { registry.delete(canvas); continue; }
    alive = true;
    if (st.anim) animating = true;

    // Sprite yang sudah tumbang dan tidak sedang dianimasi: tidak perlu digambar ulang.
    if (st.gone && !st.anim) continue;

    const f = computeFrame(st, now);
    drawPixelSprite(canvas, st.template, st.colors, f);
  }

  lastDraw = now;

  // Tidak ada sprite, atau semuanya diam dengan animasi dimatikan: hentikan
  // loop sepenuhnya. Akan dinyalakan lagi oleh paint/playSpriteAnim berikutnya.
  if (!alive || (!motionEnabled && !animating)) return;

  schedule(animating);
}

// Modul ini diimpor juga oleh test di Node, yang tidak punya DOM.
const HAS_DOM = typeof document !== 'undefined';

function schedule(smooth) {
  if (!HAS_DOM) return;
  if (rafId != null || timerId != null) return;
  if (document.hidden) return; // tab tidak terlihat — jangan bakar CPU

  if (smooth) {
    rafId = requestAnimationFrame(tick);
  } else {
    const wait = Math.max(0, IDLE_INTERVAL - (performance.now() - lastDraw));
    timerId = setTimeout(() => requestAnimationFrame(tick), wait);
  }
}

function ensureLoop() {
  if (registry.size) schedule(false);
}

if (HAS_DOM) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      if (timerId != null) { clearTimeout(timerId); timerId = null; }
    } else {
      ensureLoop();
    }
  });
}

/** Menggambar satu canvas ber-atribut data-sprite dan mendaftarkannya ke loop. */
export function paintSpriteCanvas(canvas) {
  const spec = canvas.getAttribute('data-sprite');
  if (!spec) return;

  const { template, colors } = resolveSprite(spec);
  const cell = Math.max(
    1,
    Math.floor(Math.min(canvas.width / template[0].length, canvas.height / template.length)),
  );

  const prev = registry.get(canvas);
  registry.set(canvas, {
    template,
    colors,
    cell,
    // Fase tetap per elemen supaya sprite tidak "meloncat" saat digambar ulang.
    phase: prev ? prev.phase : Math.random() * Math.PI * 2,
    anim: prev ? prev.anim : null,
    animStart: prev ? prev.animStart : 0,
    gone: false,
  });

  drawPixelSprite(canvas, template, colors);
  ensureLoop();
}

export function paintAllSprites(root) {
  (root || document).querySelectorAll('.sprite-canvas').forEach(paintSpriteCanvas);
}

/**
 * Memicu animasi sekali jalan pada satu sprite.
 * @param {HTMLCanvasElement|string} target canvas atau selector CSS
 * @param {'hit'|'attack'|'cast'|'defeat'} type
 */
export function playSpriteAnim(target, type) {
  const canvas = typeof target === 'string' ? document.querySelector(target) : target;
  if (!canvas || !ANIM[type]) return;

  let st = registry.get(canvas);
  if (!st) { paintSpriteCanvas(canvas); st = registry.get(canvas); }
  if (!st) return;

  st.anim = type;
  st.animStart = performance.now();
  st.gone = false;
  schedule(true);
}

export function spriteCanvasHTML(kind, key, size = 28, shape = '') {
  const spec = shape ? `${kind}:${key}:${shape}` : `${kind}:${key}`;
  return `<canvas class="sprite-canvas" width="${size}" height="${size}" data-sprite="${spec}"></canvas>`;
}

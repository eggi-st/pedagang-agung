// Halaman pratinjau sprite — alat bantu pengembangan, bukan bagian dari game.
// Berguna karena src/main.js belum merender game (logic masih di
// original-reference.html), jadi tanpa halaman ini kerja visual tidak terlihat.

import { paintAllSprites, playSpriteAnim, setSpriteMotion, spriteCanvasHTML } from './ui/sprites.js';
import { MONSTERS, DUNGEON_MONSTERS } from './data/monsters.js';
import { CLASSES } from './data/classes.js';
import { ELEMENTS } from './data/elements.js';
import { RANK_NAMES } from './data/mercenaries/index.js';

const NATIONS = ['Joseon', 'China', 'Jepang'];
const SIZES = [72, 48, 120];

let sizeIdx = 0;
let motionOn = true;

function cell(html, label) {
  return `<div class="cellbox">${html}<div class="nm">${label}</div></div>`;
}

function renderGrids() {
  const all = [...MONSTERS, ...DUNGEON_MONSTERS, { name: 'Pasukan Garnisun', elem: 'Bumi' }];

  document.getElementById('grid-monsters').innerHTML = all
    .map((m) => cell(spriteCanvasHTML('monster', m.elem, 56, m.name), `${m.name}<br>${m.elem}`))
    .join('');

  document.getElementById('grid-players').innerHTML = Object.keys(CLASSES)
    .flatMap((cls) => NATIONS.map((n) => cell(spriteCanvasHTML('player', n, 56, cls), `${cls}<br>${n}`)))
    .join('');

  document.getElementById('grid-generals').innerHTML = RANK_NAMES
    .map((nm, i) => cell(spriteCanvasHTML('general', i, 56, 'Petarung'), nm))
    .join('');

  paintAllSprites();
}

function stageCanvases() {
  return [...document.querySelectorAll('.stage .sprite-canvas')];
}

document.querySelectorAll('[data-anim]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-anim');
    // Sprite kiri "menyerang", sprite kanan yang menerima — kecuali tombol
    // Kena/Tumbang yang memang ditujukan ke sprite kanan.
    const [left, right] = stageCanvases();
    if (type === 'attack' || type === 'cast') {
      playSpriteAnim(left, type);
      setTimeout(() => playSpriteAnim(right, 'hit'), 160);
    } else {
      playSpriteAnim(right, type);
    }
  });
});

const motionBtn = document.getElementById('motion-btn');
motionBtn.addEventListener('click', () => {
  motionOn = !motionOn;
  setSpriteMotion(motionOn);
  motionBtn.textContent = `🎬 Animasi: ${motionOn ? 'AKTIF' : 'MATI'}`;
  if (!motionOn) paintAllSprites(); // gambar ulang di posisi netral
});

const sizeBtn = document.getElementById('size-btn');
sizeBtn.addEventListener('click', () => {
  sizeIdx = (sizeIdx + 1) % SIZES.length;
  const px = SIZES[sizeIdx];
  stageCanvases().forEach((c) => { c.width = px; c.height = px; });
  sizeBtn.textContent = `🔍 Ukuran: ${px}px`;
  paintAllSprites();
});

renderGrids();

// Elemen dipakai buat nge-cek cepat kalau nanti ada elemen baru ditambahkan.
console.log('[Sprite Lab] elemen:', ELEMENTS.join(', '));

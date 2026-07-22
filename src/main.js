// ENTRY POINT.
//
// Seluruh logic permainan ada di ./game.js. File ini tipis: memuat game,
// menyiapkan sprite layar awal, dan mendaftarkan service worker PWA.

import './game.js';
import { paintAllSprites } from './ui/sprites.js';

// Sprite di layar judul dan kartu pilihan negara/kelas.
paintAllSprites();

// Daftarkan service worker supaya game bisa dipasang (Add to Home Screen)
// dan dibuka offline. Dilewati di localhost agar tidak mengganggu HMR saat
// pengembangan — di sana kita mau selalu memuat kode terbaru.
if ('serviceWorker' in navigator
  && location.hostname !== 'localhost'
  && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* abaikan; game tetap jalan tanpa offline */ });
  });
}

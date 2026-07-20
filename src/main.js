// ENTRY POINT.
//
// Seluruh logic permainan ada di ./game.js — hasil pemindahan Fase 2 dari
// original-reference.html. File ini sengaja tipis: tugasnya hanya memuat
// game dan menyiapkan sprite di layar awal.
//
// LANGKAH BERIKUTNYA (Fase 2 lanjutan): pecah game.js ke src/systems/*
// dan src/ui/* satu sistem per commit, dengan game tetap bisa dijalankan
// di setiap langkah.

import './game.js';
import { paintAllSprites } from './ui/sprites.js';

// Sprite di layar judul dan kartu pilihan negara/kelas.
paintAllSprites();

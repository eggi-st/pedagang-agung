import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    // Hanya index.html yang ikut build produksi. sprite-lab.html SENGAJA
    // tidak dimasukkan di sini supaya tidak ter-deploy ke URL publik —
    // itu meja kerja internal. Dev server (npm run dev) tetap menyajikannya
    // di /sprite-lab.html karena Vite melayani file HTML apa pun saat dev.
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

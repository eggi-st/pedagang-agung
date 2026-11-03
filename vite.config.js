import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    // index.html + world.html ikut build produksi. world.html adalah
    // permukaan game nyata (dunia jalan-bebas), bukan alat internal.
    // sprite-lab.html SENGAJA tidak dimasukkan di sini supaya tidak
    // ter-deploy ke URL publik — itu meja kerja internal. Dev server
    // (npm run dev) tetap menyajikan file HTML apa pun saat dev.
    rollupOptions: {
      input: {
        main: 'index.html', // = game dunia (dulu world.html)
        world: 'world.html', // alias, tetap bisa dibuka langsung
        classic: 'trading-classic.html', // game dagang 8-bit lama
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        // Halaman pratinjau sprite — ikut dibuild supaya bisa dicek
        // langsung di HP/tablet sungguhan, bukan cuma di dev server.
        spriteLab: 'sprite-lab.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

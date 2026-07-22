// Service worker PWA — membuat game bisa dipasang dan dibuka offline.
//
// Strategi:
//   - Navigasi (HTML): JARINGAN DULU. Supaya setiap deploy baru langsung
//     sampai ke pemain saat online; kalau offline, jatuh ke cache.
//   - Aset (JS/CSS/PNG/font): CACHE DULU. Nama berkas ber-hash berubah tiap
//     deploy, jadi aman disimpan permanen — versi baru = nama baru = cache
//     miss = diambil segar. Font Google ikut tercache setelah kunjungan
//     pertama, jadi tampilan piksel tetap muncul saat offline.

const CACHE = 'pedagang-agung-v1';
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // allSettled: satu aset gagal jangan sampai membatalkan install.
    await Promise.allSettled(SHELL.map((u) => cache.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('/', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      // status 200 untuk same-origin; type 'opaque' untuk font lintas-origin.
      if (fresh && (fresh.ok || fresh.type === 'opaque')) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return Response.error();
    }
  })());
});

// Service worker: aset statis tersedia offline; API selalu ke jaringan.
const VERSI = 'hitungruntut-v1';
const ASET = [
  '/', '/css/style.css', '/manifest.webmanifest', '/icon.svg',
  '/js/main.js', '/js/api.js', '/js/state.js', '/js/teks.js',
  '/js/ui/dom.js', '/js/ui/ekspresi.js', '/js/ui/angka.js', '/js/ui/umpan.js',
  '/js/game/contoh.js', '/js/game/langkah.js', '/js/game/latihan.js', '/js/game/misi.js',
  '/js/game/aturan.js', '/js/game/pemanasan.js', '/js/game/peta.js', '/js/game/peneliti.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((kunci) => Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // network-first agar perubahan kode langsung terlihat; cache bila offline
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const salinan = r.clone();
        caches.open(VERSI).then((c) => c.put(e.request, salinan));
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/'))),
  );
});

const CACHE = 'smart-ebus-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/vendors~main.chunk.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    e.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

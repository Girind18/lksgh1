// ========== SERVICE WORKER v5 ==========
const CACHE_VERSION = 'v5';
const CACHE_NAME = 'awb-gh1-' + CACHE_VERSION;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './core.js',
  './app.js',
  './manifest.json',
  './logo-awb.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('🔧 SW', CACHE_VERSION, 'installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => console.warn('Skip cache:', url))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW', CACHE_VERSION, 'activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Hapus cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;

  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isJS = url.pathname.endsWith('.js');

  // Network First untuk HTML & JS (fresh selalu)
  if (isHTML || isJS) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache First untuk asset
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

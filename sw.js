// ========== SERVICE WORKER ==========
const CACHE_NAME = 'awb-gh1-v4';
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

// Install
self.addEventListener('install', (event) => {
  console.log('🔧 SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Beberapa aset gagal dicache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('✅ SW activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Cache First, Fallback Network
self.addEventListener('fetch', (event) => {
  // Skip request POST & Apps Script
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fallback ke index.html kalau offline & tidak ada cache
        return caches.match('./index.html');
      });
    })
  );
});

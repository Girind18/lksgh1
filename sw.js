// ========== SW.JS (SERVICE WORKER) ==========

const CACHE_NAME = 'awb-gh1-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './core.js',
  './app.js',
  './manifest.json',
  './logo-awb.png'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache First, Fallback to Network
self.addEventListener('fetch', (event) => {
  // Lewati request ke Google Apps Script agar selalu fresh
  if (event.request.url.includes('script.google.com')) return;

  // Lewati request POST (form submission)
  if (event.request.method !== 'GET') return;

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
        // Fallback jika offline dan tidak ada cache
        return caches.match('./index.html');
      });
    })
  );
});

// ========== SERVICE WORKER v7 ==========
const CACHE_VERSION = 'v7';
const CACHE_NAME = 'awb-gh1-' + CACHE_VERSION;
const ASSETS = [
  './',
  './index.html',
  './core.js',
  './app.js',
  './manifest.json',
  './logo-awb.png'
];

self.addEventListener('install', (event) => {
  console.log('🔧 SW', CACHE_VERSION, 'install');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url => cache.add(url).catch(err => console.warn('Skip:', url))))
    )
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW', CACHE_VERSION, 'activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? (console.log('🗑️ Hapus:', k), caches.delete(k)) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;

  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isJS = url.pathname.endsWith('.js');

  // Network First untuk HTML & JS
  if (isHTML || isJS) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

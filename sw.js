const CACHE_NAME = 'thailand-2026-jo-jeth-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first with network fallback for same-origin and Google Fonts/Tailwind CDN assets
  if (
    url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn.tailwindcss.com'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Refresh cache in background for same-origin files
          if (url.origin === self.location.origin) {
            fetch(event.request)
              .then((networkRes) => {
                if (networkRes && networkRes.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkRes.clone()));
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
    );
  }
});

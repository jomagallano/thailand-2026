// sw.js — Offline Service Worker for Thailand 2026 Itinerary
const CACHE_NAME = 'thailand-2026-v1';
const ASSETS = [
  './',
  './index.html'
];

// Cache core app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Clean up older caches when you bump CACHE_NAME (e.g. v1 -> v2)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Serve from cache first, fall back to network (and cache fonts/assets as visited)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Optionally cache Google Fonts stylesheets/woff2 files on first online load
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.url.startsWith(self.location.origin) ||
              event.request.url.includes('fonts.googleapis.com') ||
              event.request.url.includes('fonts.gstatic.com'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

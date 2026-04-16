// Vitalle PWA Service Worker - Elite Version
// ✅ self.skipWaiting() & clients.claim() for IMMEDIATE install prompt

const CACHE_NAME = 'vitalle-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.ico',
  '/logo-vitalle.png',
  '/icon.png'
];

self.addEventListener('install', event => {
  console.log('Vitalle SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Vitalle SW: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Vitalle SW: Activating...');
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Vitalle SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // ✅ IMMEDIATE CONTROL - This fixes install prompt!
      self.clients.claim(),
      self.skipWaiting()
    ])
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});


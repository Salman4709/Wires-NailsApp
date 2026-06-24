/* ════════════════════════════════════════════════════════════
   Service Worker — سلك ومسمار PWA Shell
   Strategy: Cache-First for shell assets, Network-Only for GAS
════════════════════════════════════════════════════════════ */

var CACHE_NAME  = 'silk-nails-shell-v1';
var SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/Nails.x1.png',
  './icons/Nails.x5@0.5x.png',
  './icons/Nails.x25@0.25x.png'
];

/* ── Install: pre-cache shell assets ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key)   { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch: shell from cache, GAS always from network ── */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Let GAS requests always go to the network (never cache them)
  if (url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Shell assets: Cache-First
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // Cache any newly fetched shell asset
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});

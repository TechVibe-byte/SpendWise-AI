
const CACHE_NAME = 'spendwise-v2';

// Essential files to cache immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Domains allowed for runtime caching
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Install SW and precache essentials
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Check if origin is allowed
  const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => url.origin === origin);
  if (!isAllowedOrigin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Network request to update cache
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if valid response
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Network failed
        });

        // Return cached response if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

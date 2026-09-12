const CACHE_NAME = 'admin-cache-v3';

// Install: skip pre-caching to avoid failures from missing files
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first strategy
// Always try to get fresh data from the network.
// Only fall back to cache if the network fails (offline mode).
// Never cache API responses or cross-origin requests.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-http(s) schemes (e.g. chrome-extension://, moz-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests (e.g. Cloudinary, Google fonts, CDNs) to avoid CORS/Cache errors
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET and API requests entirely (always go to network)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful static asset responses
        if (response.ok && (url.pathname.match(/\.(css|js|woff2?|png|jpg|webp|svg|ico)$/))) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone).catch(() => {}))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache as fallback
        return caches.match(event.request);
      })
  );
});


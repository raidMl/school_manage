const CACHE_NAME = 'client-cache-v10';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept API calls or non-GET requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for all requests to ensure updates are always seen
  event.respondWith(
    fetch(event.request)
      .then(res => {
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

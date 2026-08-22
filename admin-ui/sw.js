const CACHE_NAME = 'admin-cache-v1';
const urlsToCache = [
  '/',
  '/admin-ui/index.html',
  '/admin-ui/css/style.css',
  // Add other static assets if needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

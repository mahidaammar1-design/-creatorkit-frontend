// CreatorKit service worker — minimal offline shell cache.
// Bumping CACHE_NAME invalidates old caches automatically.
const CACHE_NAME = 'creatorkit-v1';
const SHELL_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation requests (so users always get fresh content when online),
// falling back to the cached shell when offline. Everything else passes straight through.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, clone));
          return response;
        })
        .catch(() => caches.match(SHELL_URL))
    );
  }
});

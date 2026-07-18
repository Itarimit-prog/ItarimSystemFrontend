const CACHE_VERSION = 10; // Инкрементируй при каждом деплое!
const PRECACHE = `itarim-precache-${CACHE_VERSION}`;
const RUNTIME = `itarim-runtime-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== PRECACHE && name !== RUNTIME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API — всегда сеть
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Навигация (index.html) — Network First с fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(PRECACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Статика Vite (хэш в имени) — Cache First, но обновляем в фоне
  const isStatic = request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image' ||
                   request.destination === 'font';

  if (isStatic || url.pathname.match(/\.[a-f0-9]{8}\./)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Остальное — Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch (e) { data = { title: 'Itarim', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Itarim', {
      body: data.body || 'Новое обновление',
      icon: '/icons/192x192.png',
      badge: '/icons/96x96.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) { if ('focus' in client) { client.focus(); return; } }
      return clients.openWindow('/');
    })
  );
});

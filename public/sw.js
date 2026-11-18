// Timy Service Worker for PWA Offline Caching & Lockscreen Web Push Notifications
const CACHE_NAME = 'timy-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.warn('Cache addAll warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first for static icons and shell, network-first for live API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API, SSE, and non-GET requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Native Web Push Event from Google FCM / Apple APNs
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Timy Alert', message: event.data.text() };
    }
  }

  const title = data.title || 'Timy: Timetable Update';
  const options = {
    body: data.message || 'A lecture schedule or venue change was just published.',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: data.tag || `timy-push-${Date.now()}`,
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.url || '/timetable',
      ...data,
    },
    requireInteraction: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: 'TIMY_PUSH_NOTIFICATION',
            payload: {
              ...data,
              courseCode: data.courseCode || title.replace('Timy: ', ''),
              message: data.message || options.body,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }),
    ])
  );
});

// Message listener from active client tabs
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data.payload;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: tag || `timy-local-${Date.now()}`,
      vibrate: [200, 100, 200, 100, 400],
      data: data || {},
      requireInteraction: true,
    });
  }
});

// Notification click navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/timetable';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

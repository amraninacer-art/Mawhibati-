// ══════════════════════════════════════════
// موهبتي مستقبلي — Service Worker v1.0
// ══════════════════════════════════════════

const CACHE_NAME = 'mawhibati-v1';
const BASE = '/Mawhibati-/';

const STATIC_FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'portals.html',
  BASE + 'manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ── Install ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_FILES.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase — لا نكاشه أبداً
  if (url.hostname.includes('supabase.co')) {
    return event.respondWith(fetch(event.request));
  }

  // الفيديوهات — لا نكاشهم
  if (event.request.url.match(/\.(mp4|webm|ogg)$/i)) {
    return event.respondWith(fetch(event.request));
  }

  // باقي الطلبات — Cache First ثم Network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // صفحة Offline
        if (event.request.destination === 'document') {
          return caches.match(BASE + 'index.html');
        }
      });
    })
  );
});

// ── Push Notifications ────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'موهبتي مستقبلي', {
      body: data.body || 'لديك إشعار جديد',
      icon: 'https://amraninacer-art.github.io/Mawhibati-/about-care.jpg',
      badge: 'https://amraninacer-art.github.io/Mawhibati-/about-care.jpg',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: data.url || BASE }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || BASE)
  );
});

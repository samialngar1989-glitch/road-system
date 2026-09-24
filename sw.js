// Service Worker - يسمح بتثبيت التطبيق والعمل بدون إنترنت
const CACHE_NAME = 'road-system-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/core.js',
  './js/data.js',
  './js/logs.js',
  './js/reports.js',
  './js/main.js',
  './manifest.json'
];

// تثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// تنشيط
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

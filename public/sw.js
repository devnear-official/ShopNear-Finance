// ShopNear Finance Service Worker
const CACHE_NAME = 'shopnear-finance-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/manifest.json',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up stale caches
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Next.js HMR/Dev requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.includes('/_next/webpack-hmr')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL).then((offlineRes) => {
          return offlineRes || new Response('You are offline. Please check your network connection.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts, scripts)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default network-first strategy
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

/**
 * Service Worker for Wasteland Tarot
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'wasteland-tarot-v1';
const RUNTIME_CACHE = 'wasteland-tarot-runtime';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
];

// API routes to cache
const API_CACHE_ROUTES = [
  '/api/v1/cards',
  '/api/v1/spreads',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all clients
  return self.clients.claim();
});

// Fetch event - handle requests with caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  // Static assets - Cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  }

  // API calls - Network first
  if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Card images - Stale while revalidate
  if (url.pathname.startsWith('/assets/cards/')) {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  // Apply strategy
  if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
    event.respondWith(cacheFirst(request));
  } else if (strategy === CACHE_STRATEGIES.NETWORK_FIRST) {
    event.respondWith(networkFirst(request));
  } else if (strategy === CACHE_STRATEGIES.STALE_WHILE_REVALIDATE) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  console.log('[SW] Cache miss, fetching:', request.url);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Return offline page or fallback
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Return cached version immediately
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-readings') {
    event.waitUntil(syncReadings());
  }
});

async function syncReadings() {
  // Sync offline readings when back online
  console.log('[SW] Syncing offline readings...');
  // Implementation would sync with backend
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New update available',
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Wasteland Tarot', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

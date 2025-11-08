/**
 * Service Worker for Wasteland Tarot PWA
 *
 * Caching Strategy:
 * - App Shell: Cache First (HTML, CSS, JS, Fonts)
 * - Static Assets: Cache First with Network Fallback (Images, Icons)
 * - API Calls: Network First with Cache Fallback
 * - Dynamic Content: Stale While Revalidate
 *
 * Cache Version: v2
 * Max Age: 7 days for static, 1 day for API
 */

const CACHE_VERSION = 'wasteland-tarot-v2';
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// App Shell - Critical resources for offline functionality
const APP_SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Static Assets - Cacheable resources
const STATIC_URLS = [
  '/fonts/Cubic_11.woff2',
  '/favicon.svg',
  '/logo.svg',
];

// Cache expiration times in milliseconds
const MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 24 * 60 * 60 * 1000, // 1 day
  dynamic: 60 * 60 * 1000, // 1 hour
};

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then((cache) => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      }),
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching Static Assets');
        return cache.addAll(STATIC_URLS);
      }),
    ]).then(() => {
      console.log('[Service Worker] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete caches that don't match current version
            return cacheName.startsWith('wasteland-tarot-') &&
                   !cacheName.startsWith(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
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

// Cache-first strategy with expiration
async function cacheFirst(request) {
  const cacheName = request.url.match(/\.(woff2|woff|ttf|svg|png|jpg|jpeg)$/)
    ? STATIC_CACHE
    : APP_SHELL_CACHE;
  const maxAge = cacheName === STATIC_CACHE ? MAX_AGE.static : MAX_AGE.static;

  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cache is expired
    const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
    const now = Date.now();

    if (now - cacheTime.getTime() < maxAge) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cachedResponse;
    }
  }

  try {
    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Clone and add cache timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());

      const cachedResponseWithTime = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponseWithTime);
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, using cache:', request.url);

    // Return cached response even if expired
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }

    throw error;
  }
}

// Network-first strategy with cache fallback
async function networkFirst(request) {
  const cacheName = request.url.includes('/api/') ? API_CACHE : DYNAMIC_CACHE;
  const cache = await caches.open(cacheName);

  try {
    console.log('[Service Worker] Network first:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Clone and cache successful responses with timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());

      const cachedResponseWithTime = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponseWithTime);
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }

    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch new version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());

      const cachedResponseWithTime = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponseWithTime);
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
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

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    console.log('[Service Worker] Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[Service Worker] Loaded - Version:', CACHE_VERSION);

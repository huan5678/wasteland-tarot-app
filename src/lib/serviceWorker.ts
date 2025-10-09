/**
 * Service Worker Registration and Management
 */

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              console.log('New service worker available');

              // Notify user about update
              if (confirm('New version available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered');
    }
  }
}

export async function checkServiceWorkerStatus() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();

    return {
      supported: true,
      registered: !!registration,
      controller: !!navigator.serviceWorker.controller,
    };
  }

  return {
    supported: false,
    registered: false,
    controller: false,
  };
}

// Cache management
export async function clearCache(cacheName?: string) {
  if ('caches' in window) {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    console.log('Cache cleared');
  }
}

export async function getCacheSize() {
  if ('caches' in window && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usageInMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
      quotaInMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
    };
  }
  return null;
}

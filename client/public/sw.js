// Service Worker for O'zbek Talim PWA
const CACHE_NAME = 'uzbek-talim-v2';
const STATIC_CACHE_NAME = 'static-cache-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v2';
const IMAGE_CACHE_NAME = 'image-cache-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/login',
  '/register',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/profile/,
  /\/api\/tests/,
  /\/api\/lessons/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle image files with cache-first strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            // Return a fallback image if available
            return caches.match('/icon-192x192.png');
          });
        });
      })
    );
    return;
  }

  // Handle static files with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version while checking for updates
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for data when back online
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'test-submission') {
    event.waitUntil(syncTestSubmissions());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Yangi bildirishnoma',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ko\'rish',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Yopish',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('O\'zbek Talim', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync test submissions when back online
async function syncTestSubmissions() {
  try {
    // Get pending test submissions from IndexedDB
    const pendingSubmissions = await getPendingSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        await fetch('/api/test-submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        });
        
        // Remove from pending after successful submission
        await removePendingSubmission(submission.id);
      } catch (error) {
        console.error('Failed to sync submission:', error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Helper functions for IndexedDB operations
function getPendingSubmissions() {
  return new Promise((resolve) => {
    // Simplified - in real implementation, use IndexedDB
    resolve([]);
  });
}

function removePendingSubmission(id) {
  return new Promise((resolve) => {
    // Simplified - in real implementation, use IndexedDB
    resolve();
  });
}
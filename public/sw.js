// Service Worker for Push Notifications
// This file handles push notification events

const CACHE_NAME = 'formhook-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('[Service Worker] Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {
    title: 'FormHook Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'formhook-notification',
    data: {}
  };

  // Parse notification data from push event
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        title: pushData.title || data.title,
        body: pushData.message || pushData.body || data.body,
        icon: pushData.icon || data.icon,
        badge: pushData.badge || data.badge,
        tag: pushData.tag || pushData.type || data.tag,
        data: pushData.metadata || pushData.data || {},
        // Optional properties
        ...(pushData.url && { data: { ...data.data, url: pushData.url } }),
        ...(pushData.image && { image: pushData.image }),
        ...(pushData.requireInteraction && { requireInteraction: true })
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
      data.body = event.data.text();
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: false,
    // Actions for rich notifications
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  });

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }

  // Determine URL to open
  let urlToOpen = '/notifications';
  
  if (event.notification.data) {
    // Custom URL from notification data
    if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
    // Form-specific URLs
    else if (event.notification.data.formId) {
      urlToOpen = `/forms/${event.notification.data.formId}`;
    }
    // Submission-specific URLs
    else if (event.notification.data.submissionId) {
      urlToOpen = `/submissions?id=${event.notification.data.submissionId}`;
    }
  }

  // Open or focus window
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        return client.focus().then(() => client.navigate(urlToOpen));
      }
    }
    
    // No window open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // Optional: Send analytics about notification dismissal
  // This could help track engagement
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('Test Notification', {
      body: 'This is a test notification from FormHook',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test'
    });
  }
});

// Fetch event - optional: add offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network failed, try to return cached version
          return caches.match('/offline.html');
        });
      })
  );
});

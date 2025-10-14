const CACHE_NAME = 'sushieats-admin-v1';
const urlsToCache = [
  '/admin',
  '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push reçu');

  if (!event.data) {
    console.log('[Service Worker] Push sans données');
    return;
  }

  const data = event.data.json();
  console.log('[Service Worker] Données push:', data);

  const options = {
    body: data.body,
    icon: data.icon || '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
    badge: data.badge || '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data,
    requireInteraction: data.requireInteraction !== false,
    tag: data.tag || 'default',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Voir la commande'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Événement CLICK sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Chercher une fenêtre admin déjà ouverte
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

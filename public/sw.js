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
  // Ne pas intercepter les requêtes API/Supabase
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('/rest/v1/') ||
      event.request.url.includes('/functions/v1/')) {
    return; // Laisser le navigateur gérer ces requêtes normalement
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then(response => {
          // Retourner la réponse du cache ou une erreur réseau propre
          return response || new Response('Network error', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
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

// Gestion du renouvellement d'abonnement (clé VAPID peut changer, iOS peut invalider)
self.addEventListener('pushsubscriptionchange', (event) => {
  // Clé publique VAPID côté client (non sensible)
  const VAPID_PUBLIC_KEY = "BEYWWy-vm-sDP0agWRhcvAUuVrqmfMGfYoZp5OwutWGstOn_F6qlsC1IKt5mh2ZWsY7UbGGpWJYJbN3xnOSDQP0";

  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    }).then((newSubscription) => {
      // Informer les clients pour qu'ils mettent à jour la BDD via Supabase
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: newSubscription
          });
        });
      });
    }).catch((err) => {
      console.error('[Service Worker] Erreur resubscribe lors de pushsubscriptionchange:', err);
    })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

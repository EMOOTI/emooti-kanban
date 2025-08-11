const CACHE_NAME = 'emooti-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si existe
        if (response) {
          return response;
        }

        // Si no está en cache, hacer petición a red
        return fetch(event.request)
          .then((response) => {
            // No cachear peticiones que no sean exitosas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para cachearla
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red, devolver página offline
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Emooti',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver tarea',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Emooti', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

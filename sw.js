// Service worker mínimo: solo habilita "Instalar app". No cachea nada,
// así la app instalada siempre usa datos en vivo del CRM (reservas, precios, etc.).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // sin respondWith: cada pedido va directo a la red, como si no hubiera service worker.
});

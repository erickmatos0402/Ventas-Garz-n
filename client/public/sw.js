/* Service worker mínimo: hace instalable la web como app (Chrome exige uno
 * con manejador de `fetch`) sin cachear nada, para que cada despliegue se
 * vea siempre actualizado. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Sin `respondWith`: el navegador sigue su red normal.
});

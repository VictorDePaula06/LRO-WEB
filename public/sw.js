self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass-through fetch handler (required by Chromium-based browsers for PWA installation)
  e.respondWith(
    fetch(e.request).catch(() => {
      // Offline fallback can be added here in the future
      return new Response("Sem conexão com a internet. O LRO Controle precisa de rede para sincronizar com o Firebase.");
    })
  );
});

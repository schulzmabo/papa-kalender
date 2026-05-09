// sw.js — Papa Kalender Service Worker
// Version hochzaehlen bei jeder neuen index.html Veröffentlichung
const VERSION = 'papa-kalender-v15';
const CACHE = VERSION;
// Bei Installation: alten Cache loeschen, sofort aktivieren
self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.skipWaiting())
  );
});
// Aktivierung: sofort alle Clients uebernehmen
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
// Fetch: Network-first Strategie
// → immer zuerst vom Server laden
// → nur bei Offline auf Cache zurueckfallen
self.addEventListener('fetch', event => {
  // kalender.json immer fresh vom Netz (nie cachen)
  if (event.request.url.includes('kalender.json')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('kalender.json')
      )
    );
    return;
  }
  // index.html: Network-first, Cache als Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Frische Antwort in Cache speichern
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Offline: aus Cache servieren
        caches.match(event.request)
      )
  );
});

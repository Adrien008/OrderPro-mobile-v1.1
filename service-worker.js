/* OrderPro - service worker : fonctionnement hors-ligne.
 * Stratégie : réseau d'abord (pour recevoir les mises à jour), puis cache si pas de connexion. */
const CACHE = "orderpro-mobile-v10";

const FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./mobile-ui.css",
  "./mobile-ui.js",
  "./license-config.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FICHIERS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(
        cles
          .filter((cle) => cle !== CACHE)
          .map((cle) => caches.delete(cle))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE).then((cache) => {
          cache.put(e.request, copie);
        });
        return reponse;
      })
      .catch(() =>
        caches.match(e.request).then(
          (reponse) => reponse || caches.match("./index.html")
        )
      )
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((fenetres) =>
      fenetres.length
        ? fenetres[0].focus()
        : clients.openWindow("./")
    )
  );
});

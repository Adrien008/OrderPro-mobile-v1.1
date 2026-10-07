/* OrderPro - service worker : fonctionnement hors-ligne.
 * Stratégie : réseau d'abord (pour recevoir les mises à jour), puis cache si pas de connexion. */
const CACHE = "orderpro-v13";
const FICHIERS = ["./", "./index.html", "./style.css", "./app.js", "./desktop.css", "./desktop.js", "./desktop-ui.css", "./desktop-ui.js", "./mobile-ui.css", "./mobile-ui.js", "./license-config.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Installation : mise en cache des fichiers de base
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)));
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Requêtes : réseau d'abord, cache en secours
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
        return rep;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match("./index.html")))
  );
});

// Clic sur une notification : ouvrir l'application
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then((l) => (l.length ? l[0].focus() : clients.openWindow("./"))));
});

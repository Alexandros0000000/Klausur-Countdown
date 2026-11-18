// =====================================================================
// Service Worker für die Lernplan-App
// =====================================================================
// Er speichert alle Dateien der App im Cache, damit sie auch offline startet.
//
// WICHTIG: Bei jeder Änderung an der App (index.html, Icons, …) die VERSION
// erhöhen. Nur dann erkennt das iPad, dass es eine neue Version gibt, und
// zeigt den Hinweis "Update verfügbar – neu laden".
const VERSION = "2026-11-19-1";
const CACHE_NAME = "lernplan-" + VERSION;

// Alle Dateien, die die App zum Starten braucht
const DATEIEN = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-32.png",
  "./icons/icon-152.png",
  "./icons/icon-167.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

// 1. Installieren: alle Dateien frisch vom Server holen und in den Cache legen
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // cache: "reload" umgeht den Browser-Cache, damit wirklich die neue Version geladen wird
      cache.addAll(DATEIEN.map(url => new Request(url, { cache: "reload" }))))
  );
  // Nicht sofort aktivieren – die Seite fragt erst, ob neu geladen werden soll.
});

// 2. Aktivieren: alte Caches früherer Versionen löschen
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen
        .filter(name => name.startsWith("lernplan-") && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// 3. Die Seite meldet: "Update jetzt aktivieren"
self.addEventListener("message", event => {
  if (event.data === "jetzt-aktualisieren") self.skipWaiting();
});

// 4. Anfragen beantworten: zuerst aus dem Cache (schnell + offline), sonst aus dem Netz
self.addEventListener("fetch", event => {
  const anfrage = event.request;
  if (anfrage.method !== "GET" || new URL(anfrage.url).origin !== self.location.origin) return;

  // Seitenaufrufe (auch mit #heute usw.) bekommen immer die App-Seite
  if (anfrage.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then(antwort => antwort || fetch(anfrage))
    );
    return;
  }

  event.respondWith(
    caches.match(anfrage, { ignoreSearch: true }).then(antwort => antwort || fetch(anfrage))
  );
});

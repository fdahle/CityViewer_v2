const CACHE_NAME = "sw_cache"
const toCache = [
    "css/box.css",
    "css/context.css",
    "css/controls.css",
    "css/main.css",
    "css/overview.css",
    "css/settings.css",
    "css/viewer.css",
    "img/cityjson_logo.svg",
    "js/ext/earcut.js",
    "js/ext/FaceNormalsHelper.js",
    "js/ext/jquery-3.3.1.min.js",
    "js/ext/OrbitControls.js",
    "js/ext/three.js",
    "/js/document.js",
    "/js/function.js",
    "/js/menu.js",
    "/js/overview.js",
    "/js/values.js",
    "/js/viewer.js",
    "/public/favicon.ico",
    "/public/logo-128x128.png",
    "/public/logo-144x144.png",
    "/public/logo-152x152.png",
    "/public/logo-192x192.png",
    "/public/logo-256x256.png",
    "/public/logo-512x512.png",
    "/public/manifest.json",
    "/index.html",
    "/"
];


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(toCache)
      })
      .then(self.skipWaiting())
  )
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(event.request)
          })
      })
  )
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key)
            return caches.delete(key)
          }
        }))
      })
      .then(() => self.clients.claim())
  )
})

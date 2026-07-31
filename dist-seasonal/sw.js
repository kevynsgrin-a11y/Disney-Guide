/* =========================================================================
   Service worker.
   Scope is deliberately narrow. We precache exactly the two things a guest
   actually needs when the park WiFi gives up: their saved food list (the tool
   page itself — the data already lives in localStorage) and the park maps.
   Everything else is served stale-while-revalidate, with an offline fallback.
   ========================================================================= */

var VERSION = '2026-07-67'
var PRECACHE = 'rrg-precache-' + VERSION
var RUNTIME = 'rrg-runtime-' + VERSION
var PRECACHE_URLS = ["/","/offline/","/calendar/","/when-to-go/","/tools/trip-timing/","/events/","/assets/css/main.css?v=1","/assets/css/print.css?v=1","/assets/js/app.js?v=1","/assets/js/trip-timing.js?v=1","/manifest.webmanifest"]
var OFFLINE_URL = '/offline/'

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(function (cache) {
        // addAll is atomic — one 404 would abandon the whole install, so each
        // request is added independently and failures are tolerated.
        return Promise.all(PRECACHE_URLS.map(function (url) {
          return cache.add(new Request(url, { cache: 'reload' })).catch(function () {})
        }))
      })
      .then(function () { return self.skipWaiting() })
  )
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key)
        }))
      })
      .then(function () { return self.clients.claim() })
  )
})

function isHtml (request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').indexOf('text/html') > -1
}

self.addEventListener('fetch', function (event) {
  var request = event.request
  if (request.method !== 'GET') return

  var url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first so content stays fresh, cache as the safety net.
  if (isHtml(request)) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var copy = response.clone()
          caches.open(RUNTIME).then(function (cache) { cache.put(request, copy) })
          return response
        })
        .catch(function () {
          return caches.match(request)
            .then(function (cached) { return cached || caches.match(OFFLINE_URL) })
        })
    )
    return
  }

  // Static assets: cache first, refresh in the background.
  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone()
          caches.open(RUNTIME).then(function (cache) { cache.put(request, copy) })
        }
        return response
      }).catch(function () { return cached })
      return cached || network
    })
  )
})

self.addEventListener('message', function (event) {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

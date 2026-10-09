/* Offline copies belong to one content revision. Never use obsolete app caches as a fallback. */
var VERSION = '__VERSION__'
var PRECACHE = 'rrg-precache-' + VERSION
var RUNTIME = 'rrg-runtime-' + VERSION
var PRECACHE_URLS = __PRECACHE__
var OFFLINE_URL = '/offline/'

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(PRECACHE).then(function (cache) {
    return Promise.all(PRECACHE_URLS.map(function (url) {
      return cache.add(new Request(url, { cache: 'reload' })).catch(function () {})
    }))
  }).then(function () { return self.skipWaiting() }))
})

self.addEventListener('activate', function (event) {
  var upgraded = false
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (/^rrg-(precache|runtime)-/.test(key) && key !== PRECACHE && key !== RUNTIME) {
        upgraded = true
        return caches.delete(key)
      }
    }))
  }).then(function () { return self.clients.claim() }).then(function () {
    // Existing tabs can contain obsolete inline data. Reload on upgrade; localStorage survives.
    if (!upgraded) return
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      clients.forEach(function (client) {
        // Navigation can wait for activation. Awaiting it here would deadlock this upgrade.
        if (client.url.startsWith(self.registration.scope)) client.navigate(client.url).catch(function () {})
      })
    })
  }))
})

function currentMatch (request) {
  return caches.open(RUNTIME).then(function (cache) { return cache.match(request) })
    .then(function (cached) {
      return cached || caches.open(PRECACHE).then(function (cache) { return cache.match(request) })
    })
}

function isHtml (request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').indexOf('text/html') > -1
}

self.addEventListener('fetch', function (event) {
  var request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  if (isHtml(request)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(function (response) {
      if (response.status === 200) {
        var copy = response.clone()
        event.waitUntil(caches.open(RUNTIME).then(function (cache) { return cache.put(request, copy) }))
      }
      return response
    }).catch(function () {
      return currentMatch(request).then(function (cached) { return cached || currentMatch(OFFLINE_URL) })
        .then(function (cached) {
          return cached || new Response('This page has not been saved for the current site revision. Reconnect to load it.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        })
    }))
    return
  }
  event.respondWith(currentMatch(request).then(function (cached) {
    var network = fetch(request, { cache: 'reload' }).then(function (response) {
      if (response.status === 200) {
        var copy = response.clone()
        event.waitUntil(caches.open(RUNTIME).then(function (cache) { return cache.put(request, copy) }))
      }
      return response
    }).catch(function () { return cached || Response.error() })
    event.waitUntil(network.then(function () {}))
    return cached || network
  }))
})

self.addEventListener('message', function (event) {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

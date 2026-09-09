/* =========================================================================
   Analytics consent gate.
   -------------------------------------------------------------------------
   The privacy page promises that nothing measures a visit until the visitor
   says so, and that the mechanism ships before the script does. This is that
   mechanism: a first-party, cookieless gate.

   - No stored decision (first visit): a quiet banner offers Yes / No thanks.
     Nothing loads until an answer, and no answer means no.
   - "granted": the aggregate Cloudflare Web Analytics beacon is injected.
     It sets no cookie and assembles no cross-site profile.
   - "denied": nothing ever loads; the banner never returns until site data
     is cleared, which is also how either choice is revoked.
   ========================================================================= */

(function () {
  'use strict'

  var KEY = 'rrg-analytics'
  var CONFIG = document.getElementById('analytics-config')

  function decided () {
    try {
      var v = localStorage.getItem(KEY)
      return v === 'granted' || v === 'denied'
    } catch (e) { return true } /* storage blocked: never ask, never load */
  }

  function loadBeacon () {
    if (!CONFIG || !navigator.onLine) return
    var token = CONFIG.getAttribute('data-token')
    if (!token) return
    var s = document.createElement('script')
    s.defer = true
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }))
    document.body.appendChild(s)
  }

  function decide (value) {
    try { localStorage.setItem(KEY, value) } catch (e) { /* blocked storage: stay unloaded */ }
    if (value === 'granted') loadBeacon()
  }

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    if (!CONFIG) return
    if (decided()) {
      try {
        if (localStorage.getItem(KEY) === 'granted') loadBeacon()
      } catch (e) { /* ignore */ }
      return
    }

    var bar = document.createElement('div')
    bar.className = 'consent-bar'
    bar.setAttribute('role', 'region')
    bar.setAttribute('aria-label', 'Analytics choice')
    bar.innerHTML =
      '<p>Count visits in aggregate — no cookie, no profile, nothing identifying — or carry on without it. Your choice applies to every visit and is stored only in this browser.</p>' +
      '<span class="consent-bar__actions">' +
        '<button type="button" class="btn btn--small" data-consent="granted">Count me in</button>' +
        '<button type="button" class="btn btn--ghost btn--small" data-consent="denied">No thanks</button>' +
      '</span>'
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]')
      if (!b) return
      decide(b.getAttribute('data-consent'))
      bar.remove()
    })
    document.body.appendChild(bar)
  })
})()

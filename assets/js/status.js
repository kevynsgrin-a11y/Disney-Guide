/* =========================================================================
   Ride status: the guest-report layer.
   -------------------------------------------------------------------------
   Anonymous, unverified, expiring. The client keeps three promises:
   - nothing identifying is sent: a random daily id lives in localStorage,
     rotated every day, and that is the whole "who";
   - every number shown is recomputed from the rolling window, so nothing
     stale can survive a day;
   - the visual language stays unmistakably "guests say" — dashed amber,
     never the solid pills the site uses for verified facts.
   ========================================================================= */

(function () {
  'use strict'

  var BOARD
  var PARK

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  /* A daily anonymous id: random, rotated at midnight, never linked to anything else. */
  function dailyId () {
    try {
      var today = new Date().toISOString().slice(0, 10)
      var stored = JSON.parse(localStorage.getItem('rrg-status-id') || 'null')
      if (stored && stored.day === today) return stored.id
      var id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      localStorage.setItem('rrg-status-id', JSON.stringify({ day: today, id: id }))
      return id
    } catch (e) { return 'anonymous' }
  }

  function esc (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  /* Tier text: guests say, never "confirmed by us". */
  function tierFor (r) {
    if (r.count12h >= 7) {
      return { cls: 'status-row--red', pill: 'REPORTED CLOSED BY ' + r.count12h + '+ GUESTS IN LAST 12 HOURS — PROCEED ACCORDINGLY', hint: 'Unverified. Check the operator\u2019s app before walking over.' }
    }
    if (r.count2h >= 2) {
      return { cls: 'status-row--amber', pill: r.count2h + ' guests report this closed in the last 2 hours', hint: 'Unverified advisory.' }
    }
    if (r.count12h > 0) {
      return { cls: 'status-row--amber-faint', pill: r.count12h + ' guest report' + (r.count12h === 1 ? '' : 's') + ' in the last 12 hours', hint: 'Unverified.' }
    }
    return null
  }

  function paint (reports) {
    var byRide = {}
    ;(reports || []).forEach(function (r) { byRide[r.ride] = r })
    BOARD.querySelectorAll('[data-ride]').forEach(function (row) {
      var slug = row.getAttribute('data-ride')
      row.classList.remove('status-row--red', 'status-row--amber', 'status-row--amber-faint')
      var slot = row.querySelector('[data-report-slot]')
      if (!slot) return /* scheduled rows never carry guest tiers */
      var r = byRide[slug]
      var tier = r ? tierFor(r) : null
      if (tier) {
        row.classList.add(tier.cls)
        slot.innerHTML = '<span class="status-pill status-pill--guest">' + esc(tier.pill) + '</span>' +
          '<span class="status-hint">' + esc(tier.hint) + '</span>'
      } else {
        slot.innerHTML = ''
      }
      ensureReportButton(row, slot)
    })
  }

  function ensureReportButton (row, slot) {
    if (row.querySelector('[data-report-btn]')) return
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn--ghost btn--small status-report-btn'
    btn.setAttribute('data-report-btn', '')
    btn.textContent = 'Report closed'
    btn.addEventListener('click', function () { send(row.getAttribute('data-ride'), btn) })
    slot.appendChild(btn)
  }

  /* Turnstile loads lazily on the first report and never otherwise - visitors who only
     read the board download nothing from the challenge CDN. */
  var TURNSTILE_SITEKEY = document.querySelector('[data-status-board]')
    ? (document.querySelector('[data-turnstile-key]') ? document.querySelector('[data-turnstile-key]').getAttribute('data-turnstile-key') : '')
    : ''

  function turnstileToken () {
    if (!TURNSTILE_SITEKEY) return Promise.resolve(null)
    if (!window.turnstile) {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        s.onload = function () { resolve() }
        s.onerror = function () { reject(new Error('turnstile unavailable')) }
        document.head.appendChild(s)
      }).then(function () { return turnstileToken() })
    }
    return new Promise(function (resolve) {
      var el = document.createElement('div')
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px'
      document.body.appendChild(el)
      var widgetId = window.turnstile.render(el, {
        sitekey: TURNSTILE_SITEKEY,
        callback: function (token) { try { window.turnstile.remove(widgetId) } catch (e) {} el.remove(); resolve(token) },
        'error-callback': function () { try { window.turnstile.remove(widgetId) } catch (e) {} el.remove(); resolve(null) },
      })
    })
  }

  function send (ride, btn) {
    btn.disabled = true
    btn.textContent = 'Sending…'
    turnstileToken().catch(function () { return null }).then(function (token) {
    return fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ park: PARK, ride: ride, client: dailyId(), token: token }),
    })
    }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b } }) })
      .then(function (res) {
        if (res.ok) {
          btn.textContent = 'Reported — thank you'
          load()
        } else {
          btn.textContent = res.body.error === 'duplicate' ? 'Already reported' : 'Try again shortly'
          setTimeout(function () { btn.disabled = false; btn.textContent = 'Report closed' }, 2500)
        }
      })
      .catch(function () {
        btn.textContent = 'Offline — try again'
        setTimeout(function () { btn.disabled = false; btn.textContent = 'Report closed' }, 2500)
      })
  }

  function load () {
    fetch('/api/status?park=' + encodeURIComponent(PARK))
      .then(function (r) { return r.ok ? r.json() : { reports: [] } })
      .then(function (b) { paint(b.reports) })
      .catch(function () { /* the scheduled board is complete without this */ })
  }

  ready(function () {
    BOARD = document.querySelector('[data-status-board]')
    if (!BOARD) return
    PARK = BOARD.getAttribute('data-status-board')
    load()
    setInterval(load, 60000)
  })
})()

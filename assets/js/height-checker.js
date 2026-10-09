/* =========================================================================
   Height Checker
   Reads the ride/height dataset embedded in the page and answers the single
   most-searched theme-park question there is: "what can my kid actually ride?"
   Works without JS as a plain table; the slider is an enhancement.
   ========================================================================= */

(function () {
  'use strict'

  function knownHeight (value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
  }

  function heightStatus (inches, ride) {
    if ((ride.s || 'open') !== 'open') return 'closed'
    if (!knownHeight(ride.h) || !knownHeight(inches)) return 'unknown'
    if (knownHeight(ride.max) && inches > ride.max) return 'over'
    if (inches < ride.h) return ride.h - inches <= 2 ? 'near' : 'later'
    if (knownHeight(ride.accompaniedBelow) && inches < ride.accompaniedBelow) return 'companion'
    if (ride.restrictionsKnown === false || !Array.isArray(ride.restrictions) || ride.restrictions.some(function (rule) { return typeof rule !== 'string' || !rule.trim() }) || ride.restrictions.length) return 'review'
    return 'now'
  }

  function gapLabel (gap) {
    // Round only the display, and keep every positive shortfall visibly nonzero.
    return gap > 0 && gap < 0.01 ? '<0.01 in' : '+' + Number(gap.toFixed(2)) + ' in'
  }

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    var node = document.getElementById('height-data')
    var slider = document.querySelector('[data-height-slider]')
    if (!node || !slider) return

    var data
    try { data = JSON.parse(node.textContent) } catch (e) { return }
    var parks = data.parks || []

    var valueEl = document.querySelector('[data-height-value]')
    var cmEl = document.querySelector('[data-height-cm]')
    var canEl = document.querySelector('[data-height-can]')
    var cantEl = document.querySelector('[data-height-cant]')
    var unknownEl = document.querySelector('[data-height-unknown]')
    var results = document.querySelector('[data-height-results]')
    var announce = document.querySelector('[data-height-announce]')
    var unitToggle = document.querySelector('[data-height-unit]')
    var useMetric = false
    var announceTimer = null

    /* Dragging the slider fires `input` on every pixel. Announcing each one would talk over the
       previous sentence and never finish one; this waits for the value to settle instead. */
    function announceResult (text) {
      if (!announce) return
      if (announceTimer) clearTimeout(announceTimer)
      announceTimer = setTimeout(function () { announce.textContent = text }, 400)
    }

    function persist (inches) {
      try { localStorage.setItem('rrg-height', String(inches)) } catch (e) { /* ignore */ }
    }
    function restore () {
      try {
        var stored = Number(localStorage.getItem('rrg-height'))
        if (stored >= Number(slider.min) && stored <= Number(slider.max)) return stored
      } catch (e) { /* ignore */ }
      return Number(slider.value)
    }

    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')
    var toast = null
    var toastTimer = null

    /* A quiet line of prose, not a popup: one unlock at a time, gone in two and a half
       seconds. Ported from the height-checker comp's milestone moment, minus everything
       that would have turned it into a celebration. */
    function announceUnlock (ride) {
      if (!ride || REDUCED.matches) return
      if (!toast) {
        var host = document.querySelector('.hchecker') || document.body
        toast = document.createElement('p')
        toast.className = 'hchecker__toast'
        toast.setAttribute('role', 'status')
        host.appendChild(toast)
      }
      toast.textContent = ride.n + ' now meets the verified height conditions. Staff make the final decision.'
      toast.setAttribute('data-open', '')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(function () { toast.removeAttribute('data-open') }, 2500)
    }

    function render (inches, prevInches) {
      var cm = Math.round(inches * 2.54)
      if (valueEl) valueEl.textContent = useMetric ? String(cm) : String(inches)
      if (cmEl) cmEl.textContent = useMetric ? inches + ' inches' : cm + ' cm'

      var totalCan = 0
      var totalCant = 0
      var totalUnknown = 0
      var unlocked = null

      var html = parks.map(function (park) {
        var can = []
        var cant = []
        var unknown = []
        park.rides.forEach(function (ride) {
          var status = heightStatus(inches, ride)
          if (status === 'closed') return
          ride._heightStatus = status
          if (status === 'unknown' || status === 'companion' || status === 'review') {
            unknown.push(ride)
            totalUnknown++
          } else if (status === 'now') {
            can.push(ride)
            totalCan++
            /* Crossing a threshold on this movement is the unlock moment; the tallest such
               ride is the one worth naming. */
            if (prevInches != null && heightStatus(prevInches, ride) !== 'now') {
              if (!unlocked || ride.h > unlocked.h) unlocked = ride
            }
          }
          else {
            cant.push(ride)
            totalCant++
          }
        })
        /* Sorted by how close they are, so the nearest miss reads first — that is the one that
           decides whether a family waits a season or books now. */
        var nearMiss = cant.filter(function (r) { return r._heightStatus === 'near' })
          .sort(function (a, b) { return a.h - b.h })
        return '<section class="hchecker__park">' +
          '<h3><a href="' + esc(park.url) + '">' + esc(park.name) + '</a> ' +
          '<small>' + can.length + ' height conditions met' +
          (unknown.length ? ' · ' + unknown.length + ' need checking' : '') + '</small></h3>' +
          (nearMiss.length
            ? '<div class="nearmiss"><p class="nearmiss__title">' +
              (nearMiss.length === 1 ? 'One ride is just out of reach' : nearMiss.length + ' rides are just out of reach') +
              '</p><ul class="nearmiss__list">' + nearMiss.map(function (r) {
                var gap = r.h - inches
                /* How close the child already is — the bar is the encouragement. */
                var pct = Math.max(4, Math.min(96, Math.round((inches / r.h) * 100)))
                return '<li class="nearmiss__item"><span class="nearmiss__gap">' + esc(gapLabel(gap)) + '</span> ' + esc(r.n) +
                  '<span class="nearmiss__bar" aria-hidden="true"><span class="nearmiss__fill" style="width:' + pct + '%"></span></span>' +
                  '<span class="nearmiss__pct">' + pct + '% of the way there</span></li>'
              }).join('') + '</ul></div>'
            : '') +
          '<ul class="ride-chiplist">' +
            can.map(function (r) {
              var glow = unlocked && r.n === unlocked.n && r.h === unlocked.h ? ' data-unlocked' : ''
              return '<li' + glow + '>' + esc(r.n) + '</li>'
            }).join('') +
            cant.map(function (r) {
              return '<li data-blocked data-need="' + r.h + '">' + esc(r.n) +
                (r._heightStatus === 'over' ? ' · exceeds ' + r.max + ' in maximum' : '') + '</li>'
            }).join('') +
            unknown.map(function (r) {
              var reason = r._heightStatus === 'companion'
                ? 'supervising companion required below ' + r.accompaniedBelow + ' in'
                : r._heightStatus === 'review' ? 'check rider restrictions: ' + (Array.isArray(r.restrictions) && r.restrictions.length ? r.restrictions.filter(function (rule) { return typeof rule === 'string' && rule.trim() }).join('; ') : 'current rider restrictions need verification') : 'height unverified'
              return '<li data-unverified>' + esc(r.n) + ' · ' + esc(reason) + '</li>'
            }).join('') +
          '</ul></section>'
      }).join('')

      if (results) results.innerHTML = html
      if (canEl) canEl.textContent = String(totalCan)
      if (cantEl) cantEl.textContent = String(totalCant)
      if (unknownEl) unknownEl.textContent = String(totalUnknown)

      announceResult(
        (useMetric ? cm + ' centimetres' : inches + ' inches') + ': ' +
        totalCan + ' meet verified height conditions, ' + totalCant + ' outside height limits, ' +
        totalUnknown + ' need checking. Attraction staff make the final eligibility determination.'
      )

      if (unlocked) announceUnlock(unlocked)
      /* C5: the one moment of earned warmth */
      if (totalCan > 0 && totalCant === 0 && totalUnknown === 0 && !window.__rrkAllClear) {
        window.__rrkAllClear = true
        var allClear = document.createElement('p')
        allClear.className = 'hchecker__toast'
        allClear.setAttribute('role', 'status')
        allClear.textContent = 'All listed height conditions are met. Attraction staff make the final eligibility determination.'
        document.querySelector('.hchecker') && document.querySelector('.hchecker').appendChild(allClear)
        setTimeout(function () { allClear.removeAttribute('data-open') }, 3000)
        setTimeout(function () { allClear.setAttribute('data-open', '') }, 50)
        setTimeout(function () { allClear.remove() }, 4500)
      }
    }

    function esc (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      })
    }

    slider.addEventListener('input', function () {
      var inches = Number(slider.value)
      var prevValue = slider.getAttribute('data-prev')
      var prev = prevValue == null ? null : Number(prevValue)
      persist(inches)
      render(inches, isNaN(prev) ? null : prev)
      slider.setAttribute('data-prev', String(inches))
    })

    if (unitToggle) {
      unitToggle.addEventListener('click', function () {
        useMetric = !useMetric
        unitToggle.textContent = useMetric ? 'Show inches' : 'Show centimetres'
        unitToggle.setAttribute('aria-pressed', String(useMetric))
        var unitLabel = document.querySelector('[data-height-unit-label]')
        if (unitLabel) unitLabel.textContent = useMetric ? 'cm' : 'inches'
        render(Number(slider.value))
      })
    }

    var initial = restore()
    slider.value = String(initial)
    slider.setAttribute('data-prev', String(initial))
    render(initial)
  })
})()

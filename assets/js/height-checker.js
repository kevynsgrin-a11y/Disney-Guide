/* =========================================================================
   Height Checker
   Reads the ride/height dataset embedded in the page and answers the single
   most-searched theme-park question there is: "what can my kid actually ride?"
   Works without JS as a plain table; the slider is an enhancement.
   ========================================================================= */

(function () {
  'use strict'

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
    var pctEl = document.querySelector('[data-height-pct]')
    var results = document.querySelector('[data-height-results]')
    var unitToggle = document.querySelector('[data-height-unit]')
    var useMetric = false

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

    function render (inches) {
      var cm = Math.round(inches * 2.54)
      if (valueEl) valueEl.textContent = useMetric ? String(cm) : String(inches)
      if (cmEl) cmEl.textContent = useMetric ? inches + ' inches' : cm + ' cm'

      var totalCan = 0
      var totalAll = 0

      var html = parks.map(function (park) {
        var can = []
        var cant = []
        park.rides.forEach(function (ride) {
          totalAll++
          if (ride.h == null || ride.h <= inches) { can.push(ride); totalCan++ }
          else cant.push(ride)
        })
        /* Sorted by how close they are, so the nearest miss reads first — that is the one that
           decides whether a family waits a season or books now. */
        var nearMiss = cant.filter(function (r) { return r.h - inches <= 2 })
          .sort(function (a, b) { return a.h - b.h })
        return '<section class="hchecker__park">' +
          '<h3><a href="' + esc(park.url) + '">' + esc(park.name) + '</a> ' +
          '<small>' + can.length + ' of ' + park.rides.length + ' rideable</small></h3>' +
          (nearMiss.length
            ? '<div class="nearmiss"><p class="nearmiss__title">' +
              (nearMiss.length === 1 ? 'One ride is just out of reach' : nearMiss.length + ' rides are just out of reach') +
              '</p><ul class="nearmiss__list">' + nearMiss.map(function (r) {
                var gap = r.h - inches
                return '<li><span class="nearmiss__gap">+' + gap + '"</span> ' + esc(r.n) + '</li>'
              }).join('') + '</ul></div>'
            : '') +
          '<ul class="ride-chiplist">' +
            can.map(function (r) { return '<li>' + esc(r.n) + '</li>' }).join('') +
            cant.map(function (r) {
              return '<li data-blocked data-need="' + r.h + '">' + esc(r.n) + '</li>'
            }).join('') +
          '</ul></section>'
      }).join('')

      if (results) results.innerHTML = html
      if (canEl) canEl.textContent = String(totalCan)
      if (cantEl) cantEl.textContent = String(totalAll - totalCan)
      if (pctEl) pctEl.textContent = totalAll ? Math.round((totalCan / totalAll) * 100) + '%' : '—'
    }

    function esc (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      })
    }

    slider.addEventListener('input', function () {
      var inches = Number(slider.value)
      persist(inches)
      render(inches)
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
    render(initial)
  })
})()

/* =========================================================================
   Road-Trip Combiner — two to five parks, one ordered trip.
   Drive legs come from authored cluster data (typical, no-traffic); where
   no leg is authored the tool says so instead of guessing. The order honours
   the authored cluster sequences; custom cross-region picks get nearest-
   neighbour ordering from the leg table, honestly labelled.
   ========================================================================= */

var RoadTrip = (function () {
  'use strict'

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function legKey (a, b) { return a < b ? a + '|' + b : b + '|' + a }

  function legMinutes (a, b, legs) {
    return legs[legKey(a, b)]
  }

  function fmtHrs (mins) {
    if (mins == null) return null
    var h = Math.floor(mins / 60), m = Math.round(mins % 60)
    if (!h) return m + ' min'
    return m ? h + ' h ' + m + ' min' : h + ' h'
  }

  /**
   * Order the selection: authored cluster order first (parks that appear
   * together in a cluster keep the authored sequence), then nearest-
   * neighbour chaining for stragglers using the leg table. Returns the
   * ordered slugs, the per-hop legs, the total, and any hops with no
   * authored leg — the tool reports those rather than inventing them.
   */
  function itineraryFor (selected, data) {
    if (!selected || selected.length < 2) return null
    var order = selected.slice()
    // Stable authored ordering: if every selected park belongs to one cluster, use its sequence.
    for (var c = 0; c < data.clusters.length; c++) {
      var cluster = data.clusters[c]
      var inCluster = order.filter(function (s) { return cluster.parks.indexOf(s) !== -1 })
      if (inCluster.length === order.length) {
        order.sort(function (a, b) { return cluster.parks.indexOf(a) - cluster.parks.indexOf(b) })
        break
      }
    }
    // Nearest-neighbour chaining for anything not covered by a single cluster.
    if (order.length > 2) {
      var chained = [order[0]]
      var rest = order.slice(1)
      while (rest.length) {
        var from = chained[chained.length - 1]
        rest.sort(function (a, b) {
          var la = legMinutes(from, a, data.legs), lb = legMinutes(from, b, data.legs)
          return (la == null ? 1e9 : la) - (lb == null ? 1e9 : lb)
        })
        chained.push(rest.shift())
      }
      order = chained
    }
    var hops = []
    var total = 0
    var missing = []
    for (var i = 0; i < order.length - 1; i++) {
      var mins = legMinutes(order[i], order[i + 1], data.legs)
      if (mins == null) missing.push([order[i], order[i + 1]])
      else total += mins
      hops.push({ from: order[i], to: order[i + 1], minutes: mins })
    }
    return { order: order, hops: hops, totalMinutes: missing.length ? null : total, missing: missing, days: order.length }
  }

  function clusterNoteFor (selected, data) {
    var notes = []
    data.clusters.forEach(function (c) {
      var overlap = selected.filter(function (s) { return c.parks.indexOf(s) !== -1 }).length
      if (overlap >= 2) notes.push({ name: c.name, band: c.schoolBand })
    })
    return notes
  }

  function render (mount, data) {
    var slugs = Object.keys(data.parks)
    mount.innerHTML =
      '<form class="tool-form" data-roadtrip-form>' +
        '<fieldset class="tool-checks"><legend>Pick 2–5 parks</legend>' +
          slugs.map(function (s) {
            return '<label><input type="checkbox" name="park" value="' + esc(s) + '"> ' + esc(data.parks[s].name) + '</label>'
          }).join('') +
        '</fieldset>' +
        '<button class="btn btn--primary" type="submit" disabled data-roadtrip-go>Combine</button> ' +
        '<span class="muted field-note" data-roadtrip-count>Pick at least two parks.</span>' +
      '</form>' +
      '<div class="tool-output" data-roadtrip-output aria-live="polite"></div>'

    var form = mount.querySelector('[data-roadtrip-form]')
    var out = mount.querySelector('[data-roadtrip-output]')
    var go = form.querySelector('[data-roadtrip-go]')
    var count = form.querySelector('[data-roadtrip-count]')
    form.addEventListener('change', function () {
      var n = form.querySelectorAll('input[name=park]:checked').length
      go.disabled = n < 2 || n > 5
      count.textContent = n < 2 ? 'Pick at least two parks.' : n > 5 ? 'Five is the honest maximum for one trip.' : n + ' parks selected.'
    })
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var selected = [...form.querySelectorAll('input[name=park]:checked')].map(function (i) { return i.value })
      var it = itineraryFor(selected, data)
      if (!it) return
      var bands = clusterNoteFor(selected, data)
      out.innerHTML =
        '<h2>Your trip — ' + it.days + ' park day' + (it.days === 1 ? '' : 's') + '</h2>' +
        '<ol class="plan-steps">' + it.order.map(function (s, i) {
          return '<li><span class="plan-steps__time">Day ' + (i + 1) + '</span><span><a href="' + esc(data.parks[s].url) + '">' + esc(data.parks[s].name) + '</a></span></li>'
        }).join('') + '</ol>' +
        '<h3>Drive legs</h3>' +
        '<ul class="roadtrip-legs">' + it.hops.map(function (h) {
          return '<li>' + esc(data.parks[h.from].name) + ' → ' + esc(data.parks[h.to].name) + ': ' +
            (h.minutes == null ? '<strong>no authored drive time</strong> — check your route; we do not guess' : '<strong>' + fmtHrs(h.minutes) + '</strong> typical, without traffic') + '</li>'
        }).join('') + '</ul>' +
        (it.totalMinutes != null ? '<p><strong>Total driving: ' + fmtHrs(it.totalMinutes) + '</strong> across ' + (it.hops.length) + ' leg' + (it.hops.length === 1 ? '' : 's') + '.</p>' : '') +
        (bands.length ? '<h3>Crowd windows that decide the dates</h3><ul>' + bands.map(function (b) {
          return '<li><strong>' + esc(b.name) + ':</strong> ' + esc(b.band) + '</li>'
        }).join('') + '</ul>' : '') +
        '<p class="field-note muted">' + esc(data.note) + '</p>' +
        '<p><button class="btn btn--ghost" type="button" onclick="window.print()">Print the itinerary</button></p>'
    })
  }

  function init () {
    var mount = document.querySelector('[data-roadtrip]')
    var el = document.getElementById('roadtrip-data')
    if (!mount || !el) return
    var data
    try { data = JSON.parse(el.textContent) } catch (e) { return }
    render(mount, data)
  }

  return { itineraryFor: itineraryFor, clusterNoteFor: clusterNoteFor, legMinutes: legMinutes, fmtHrs: fmtHrs, init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', RoadTrip.init)
  else RoadTrip.init()
}

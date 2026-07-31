/* =========================================================================
   Trip Timing
   Ranks all twelve months against whatever the visitor actually cares about.
   Every seasonal site publishes a crowd calendar; almost none of them let you
   say "I care about cost, not weather" and re-rank on that. This does.

   Scores are precomputed at build time from the same authored month data the
   /when-to-go/ pages render, so the tool and the pages can never disagree.
   Falls back to the full month grid with JavaScript off.
   ========================================================================= */

(function () {
  'use strict'

  var STORE = 'psg-timing'
  var DIMENSIONS = ['crowds', 'cost', 'weather', 'events']

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function esc (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  ready(function () {
    var node = document.getElementById('timing-data')
    var panel = document.querySelector('[data-timing]')
    if (!node || !panel) return

    var data
    try { data = JSON.parse(node.textContent) } catch (e) { return }
    var months = data.months || []
    if (!months.length) return

    var results = panel.querySelector('[data-timing-results]')
    var resortInputs = panel.querySelectorAll('[name="timing-resort"]')
    var priorityInputs = panel.querySelectorAll('[data-timing-priority]')
    var summary = panel.querySelector('[data-timing-summary]')

    function state () {
      var resort = 'walt-disney-world'
      for (var i = 0; i < resortInputs.length; i++) {
        if (resortInputs[i].checked) resort = resortInputs[i].value
      }
      var chosen = []
      for (var j = 0; j < priorityInputs.length; j++) {
        if (priorityInputs[j].checked) chosen.push(priorityInputs[j].value)
      }
      // Deselecting everything would rank by nothing, so an empty set means "weigh it all evenly"
      // rather than an empty board.
      return { resort: resort, priorities: chosen.length ? chosen : DIMENSIONS.slice() }
    }

    function scoreFor (month, st) {
      var total = 0
      for (var i = 0; i < st.priorities.length; i++) {
        var dim = st.priorities[i]
        if (dim === 'weather') total += (month.w && month.w[st.resort]) || 3
        else total += month[dim] || 3
      }
      return total / st.priorities.length
    }

    function persist (st) {
      try { localStorage.setItem(STORE, JSON.stringify(st)) } catch (e) { /* ignore */ }
    }

    function restore () {
      try {
        var saved = JSON.parse(localStorage.getItem(STORE) || 'null')
        if (!saved || !saved.priorities) return
        for (var i = 0; i < resortInputs.length; i++) {
          resortInputs[i].checked = resortInputs[i].value === saved.resort
        }
        for (var j = 0; j < priorityInputs.length; j++) {
          priorityInputs[j].checked = saved.priorities.indexOf(priorityInputs[j].value) !== -1
        }
      } catch (e) { /* ignore */ }
    }

    function render () {
      var st = state()
      persist(st)

      var ranked = months.map(function (m) {
        return { m: m, score: scoreFor(m, st) }
      }).sort(function (a, b) {
        return b.score - a.score || a.m.n - b.m.n
      })

      var best = ranked[0].score
      var worst = ranked[ranked.length - 1].score
      var span = Math.max(0.001, best - worst)

      if (results) {
        results.innerHTML = ranked.map(function (row, i) {
          // Normalised against the visible spread rather than the 1–5 absolute, so the bars stay
          // readable when every month scores similarly on the chosen dimensions.
          var pct = Math.round(((row.score - worst) / span) * 92) + 8
          return '<li class="timing-result">' +
            '<span class="timing-result__rank">' + (i + 1) + '</span>' +
            '<span>' +
              '<a class="timing-result__name" href="' + esc(row.m.url) + '">' + esc(row.m.name) + '</a>' +
              '<span class="timing-result__bar"><span class="timing-result__fill" style="width:' + pct + '%"></span></span>' +
            '</span>' +
            '<span class="grade grade--' + esc(row.m.tone) + '">' + esc(row.m.grade) + '</span>' +
          '</li>'
        }).join('')
      }

      if (summary) {
        var top = ranked.slice(0, 3).map(function (r) { return r.m.name })
        var labels = st.priorities.map(function (p) {
          return p === 'crowds' ? 'thin crowds' : p === 'cost' ? 'low cost' : p === 'weather' ? 'good weather' : 'plenty on'
        })
        var resortName = st.resort === 'disneyland' ? 'the Disneyland Resort' : 'Walt Disney World'
        summary.textContent = 'For ' + resortName + ', weighing ' + listify(labels) + ': ' +
          listify(top) + ' come out on top.'
      }
    }

    function listify (arr) {
      if (arr.length <= 1) return arr[0] || ''
      return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]
    }

    for (var i = 0; i < resortInputs.length; i++) resortInputs[i].addEventListener('change', render)
    for (var j = 0; j < priorityInputs.length; j++) priorityInputs[j].addEventListener('change', render)

    restore()
    panel.removeAttribute('hidden')
    var fallback = document.querySelector('[data-timing-fallback]')
    if (fallback) fallback.hidden = true
    render()
  })
})()

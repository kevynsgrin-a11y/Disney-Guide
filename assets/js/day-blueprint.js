/* =========================================================================
   Day Blueprint — a generated park plan from our authored touring plans.
   Every step prints why it is where it is. The generation is assembly, not
   invention: the plans are the same ones the park pages carry, re-ordered
   honestly by the visitor's pace. No waits are predicted — the reasoning is
   the product.
   ========================================================================= */

var DayBlueprint = (function () {
  'use strict'

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  /**
   * Build the plan. opts: { earlyStart, middayBreak, reRides } — each boolean.
   * Steps carry { time, body } and the plan carries a notes array of every
   * adjustment the options made, so the output can be audited.
   */
  function buildPlan (plans, opts) {
    if (!plans) return null
    opts = opts || {}
    var steps = []
    var notes = []
    if (opts.earlyStart) {
      steps.push({ time: 'Before open', body: 'Be at the gate twenty minutes early, through security before it. The security line, not the turnstiles, is the bottleneck.' })
      notes.push('Early start prepended: the first hour buys more riding than any other.')
    }
    ;(plans.morning || []).forEach(function (s) { steps.push({ time: s.time, body: s.body }) })
    if (opts.middayBreak) {
      steps.push({ time: 'Midday', body: 'Hotel or shaded break — two hours off your feet, phones charging, crowds peaked. The evening window pays for it.' })
      notes.push('Midday break inserted: the plan trades the worst queue hours for stamina.')
    }
    ;(plans.midday || []).forEach(function (s) { steps.push({ time: s.time, body: s.body }) })
    ;(plans.evening || []).forEach(function (s) { steps.push({ time: s.time, body: s.body }) })
    if (opts.reRides) {
      steps.push({ time: 'Last hour', body: 'Re-ride whatever earned it — the family exodus at dinner empties the marquee queues, and the best ride of the day is often the third lap on the one you loved.' })
      notes.push('Re-ride hour appended: the final sixty minutes routinely run the day\'s shortest waits.')
    }
    return { steps: steps, notes: notes }
  }

  function riderGreeting () {
    try {
      if (typeof RiderProfiles === 'undefined') return ''
      var riders = RiderProfiles.store.all()
      if (!riders.length) return ''
      return 'Saved riders on this device: ' + riders.map(function (r) {
        return r.name + ' (' + r.heightIn + ' in)'
      }).join(', ') + '. Check the height ladder on each park page before committing the plan.';
    } catch (e) { return '' }
  }

  function render (mount, payload) {
    var parks = payload.parks.filter(function (p) { return p.plans })
    mount.innerHTML =
      '<form class="tool-form" data-blueprint-form>' +
        '<div class="field-inline"><label for="bp-park">Park</label>' +
          '<select id="bp-park" name="park">' + parks.map(function (p, i) {
            return '<option value="' + i + '">' + esc(p.name) + '</option>'
          }).join('') + '</select></div>' +
        '<fieldset class="tool-checks"><legend>Pace</legend>' +
          '<label><input type="checkbox" name="earlyStart" checked> Early start (gate before open)</label>' +
          '<label><input type="checkbox" name="middayBreak"> Midday break</label>' +
          '<label><input type="checkbox" name="reRides" checked> Re-ride hour at close</label>' +
        '</fieldset>' +
        '<button class="btn btn--primary" type="submit">Build the plan</button>' +
      '</form>' +
      '<div class="tool-output" data-blueprint-output aria-live="polite"></div>'

    var form = mount.querySelector('[data-blueprint-form]')
    var out = mount.querySelector('[data-blueprint-output]')
    var greet = riderGreeting()
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var park = parks[Number(form.park.value)]
      var opts = {
        earlyStart: form.earlyStart.checked,
        middayBreak: form.middayBreak.checked,
        reRides: form.reRides.checked,
      }
      var plan = buildPlan(park.plans, opts)
      out.innerHTML =
        (greet ? '<p class="field-note">' + esc(greet) + '</p>' : '') +
        '<h2>' + esc(park.name) + ' — your day, step by step</h2>' +
        '<ol class="plan-steps">' + plan.steps.map(function (s) {
          return '<li><span class="plan-steps__time">' + esc(s.time) + '</span><span>' + esc(s.body) + '</span></li>'
        }).join('') + '</ol>' +
        (plan.notes.length ? '<details class="tool-notes"><summary>Why this order</summary><ul>' +
          plan.notes.map(function (n) { return '<li>' + esc(n) + '</li>' }).join('') + '</ul></details>' : '') +
        '<p class="field-note muted">Generated from our authored plan for ' + esc(park.name) +
        ' — <a href="' + esc(park.url) + '">read the full park guide</a>. Verify hours and early-entry rules on the day; no live wait times are used or claimed.</p>' +
        '<p><button class="btn btn--ghost" type="button" onclick="window.print()">Print this plan</button></p>'
    })
  }

  function init () {
    var mount = document.querySelector('[data-blueprint]')
    var el = document.getElementById('blueprint-data')
    if (!mount || !el) return
    var payload
    try { payload = JSON.parse(el.textContent) } catch (e) { return }
    render(mount, payload)
  }

  return { buildPlan: buildPlan, riderGreeting: riderGreeting, init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', DayBlueprint.init)
  else DayBlueprint.init()
}

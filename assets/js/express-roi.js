/* =========================================================================
   Express Pass ROI — the buy-or-skip arithmetic, printed.
   Inputs are the visitor's; prices are banded ranges from the site data
   (as-of framed); the output is cost per hour saved with every assumption
   on the page. A calculator that hides its assumptions is marketing.
   ========================================================================= */

var ExpressROI = (function () {
  'use strict'

  /** Minutes saved per skip: standby minus a ~10-minute skip-entry wait. */
  var SKIP_ENTRY_MIN = 10

  /**
   * The arithmetic. Inputs: { party, rides, standbyMin, tier: {rangeUsd:[lo,hi]} }.
   * Verdict bands on cost-per-hour-saved: under $20/hr reads as strong value
   * for a holiday, over $50/hr reads as poor unless re-rides are the point.
   */
  function compute (input) {
    var party = Math.max(1, Math.min(12, Number(input.party) || 2))
    var rides = Math.max(1, Math.min(40, Number(input.rides) || 10))
    var standby = Math.max(10, Math.min(120, Number(input.standbyMin) || 45))
    var tier = input.tier
    var savedPerRide = Math.max(0, standby - SKIP_ENTRY_MIN)
    var minutesSaved = savedPerRide * rides
    var hoursSaved = minutesSaved / 60
    var costLow = tier.rangeUsd[0] * party
    var costHigh = tier.rangeUsd[1] * party
    var perHourLow = hoursSaved > 0 ? costLow / hoursSaved : null
    var perHourHigh = hoursSaved > 0 ? costHigh / hoursSaved : null
    // Break-even rides at the cheap end of the band to hit $20/hr
    var targetRate = 20
    var breakEvenRides = savedPerRide > 0 ? Math.ceil(costLow / targetRate / (savedPerRide / 60)) : null
    var verdict
    if (savedPerRide === 0) verdict = 'poor value — no savings to price; a day this calm does not need the product at any price'
    else if (perHourHigh == null) verdict = 'not computable'
    else if (perHourHigh < 20) verdict = 'strong value on this band — buy before the date sells out'
    else if (perHourLow > 50) verdict = 'poor value on this band — a calmer date or fewer expectations beats the pass'
    else verdict = 'a defensible buy: inside the usual value band, and better the more you re-ride'
    return {
      party: party, rides: rides, standbyMin: standby,
      minutesSaved: minutesSaved, hoursSaved: Math.round(hoursSaved * 10) / 10,
      costLow: costLow, costHigh: costHigh,
      perHourLow: perHourLow == null ? null : Math.round(perHourLow),
      perHourHigh: perHourHigh == null ? null : Math.round(perHourHigh),
      breakEvenRides: breakEvenRides, verdict: verdict,
    }
  }

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function render (mount, data) {
    mount.innerHTML =
      '<form class="tool-form" data-roi-form>' +
        '<div class="field-inline"><label for="roi-party">Party size</label><input id="roi-party" type="number" min="1" max="12" value="4"></div>' +
        '<div class="field-inline"><label for="roi-rides">Rides you\'d actually take (or re-take) <span class="muted">1–40</span></label><input id="roi-rides" type="number" min="1" max="40" value="12"></div>' +
        '<div class="field-inline"><label for="roi-wait">Typical standby wait, minutes <span class="muted">your honest guess</span></label><input id="roi-wait" type="number" min="10" max="120" value="45"></div>' +
        '<div class="field-inline"><label for="roi-tier">Tier</label><select id="roi-tier">' +
          data.tiers.map(function (t, i) { return '<option value="' + i + '">' + esc(t.label) + ' ($' + t.rangeUsd[0] + '–' + t.rangeUsd[1] + ')</option>' }).join('') +
        '</select></div>' +
        '<button class="btn btn--primary" type="submit">Run the arithmetic</button>' +
      '</form>' +
      '<div class="tool-output" data-roi-output aria-live="polite"></div>'

    var form = mount.querySelector('[data-roi-form]')
    var out = mount.querySelector('[data-roi-output]')
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var r = compute({
        party: form.querySelector('#roi-party').value,
        rides: form.querySelector('#roi-rides').value,
        standbyMin: form.querySelector('#roi-wait').value,
        tier: data.tiers[Number(form.querySelector('#roi-tier').value)],
      })
      out.innerHTML =
        '<h2>The arithmetic, printed</h2>' +
        '<ul class="roi-lines">' +
          '<li>Skip value per ride: <strong>' + r.standbyMin + ' min standby − ' + SKIP_ENTRY_MIN + ' min skip entry = ' + (r.standbyMin - SKIP_ENTRY_MIN) + ' min saved</strong></li>' +
          '<li>' + r.rides + ' rides × ' + (r.standbyMin - SKIP_ENTRY_MIN) + ' min = <strong>' + r.hoursSaved + ' hours saved</strong> (per person)</li>' +
          '<li>Tier band × party: <strong>$' + r.costLow + '–' + r.costHigh + '</strong> total for ' + r.party + '</li>' +
          '<li>Cost per hour saved: <strong>$' + r.perHourLow + '–' + r.perHourHigh + '</strong></li>' +
          (r.breakEvenRides ? '<li>Break-even at $20/hr (band floor): about <strong>' + r.breakEvenRides + ' rides</strong></li>' : '') +
        '</ul>' +
        '<div class="callout callout--note"><p><strong>Verdict: ' + esc(r.verdict) + '.</strong> ' +
        'The verdict reads the band, not a promise — the cheap end of the date range and a re-riding party move it, a calm weekday and a once-per-ride plan unmake it.</p></div>' +
        '<p class="field-note muted">Prices are ' + esc(data.asOf) + '. ' + esc(data.parkNote) + ' <a href="' + esc(data.guideUrl) + '">The line-skip guide has the full tier detail.</a></p>'
    })
  }

  function init () {
    var mount = document.querySelector('[data-express-roi]')
    var el = document.getElementById('roi-data')
    if (!mount || !el) return
    var data
    try { data = JSON.parse(el.textContent) } catch (e) { return }
    render(mount, data)
  }

  return { compute: compute, SKIP_ENTRY_MIN: SKIP_ENTRY_MIN, init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ExpressROI.init)
  else ExpressROI.init()
}

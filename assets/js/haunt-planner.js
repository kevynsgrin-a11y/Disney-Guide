/* =========================================================================
   Haunt Planner — an ordered haunt-night route from the wait-curve pattern.
   The pattern, multi-year and honest: marquee mazes hold their queues from
   open to close (hit them in the first hour or the last two); the back half
   of the park thins after midnight; scare zones peak mid-evening. House
   NAMES are not guessed — they land on the event page when announced. What
   this builds is the shape of the night, printable, with line-skip math
   for the peak Saturdays that need it.
   ========================================================================= */

var HauntPlanner = (function () {
  'use strict'

  var MAZE_MIN = 13 // minutes per walk-through, pattern average
  var PEAK_MAZE_QUEUE = 50 // minutes standby at a marquee on a peak night

  /**
   * Build the route. Inputs: { houseCount, nightType: 'weeknight'|'peak',
   * arrive: 'open'|'late' }. Steps are ordered by the wait-curve logic and
   * each carries its reason — the reasoning IS the tool.
   */
  function buildRoute (input) {
    var houses = Math.max(1, Math.min(15, Number(input.houseCount) || 10))
    var peak = input.nightType === 'peak'
    var late = input.arrive === 'late'
    var marquee = Math.min(2, houses)
    var backHalf = Math.max(0, houses - marquee - 1)
    var finale = houses - marquee - backHalf

    var steps = []
    var h = 0
    function take (n) { var s = h + 1; h += n; return s }

    if (!late) {
      steps.push({ window: 'First hour', body: 'Go straight to the marquee mazes — the newest, the IP-headliners, whatever the map flags biggest. Their queues hold all night; the first hour is their shortest. Do ' + marquee + ' now (' + take(marquee) + '–' + h + ').' , why: 'Marquee queues never fall until the last two hours.' })
    } else {
      steps.push({ window: 'Arriving late', body: 'Skip the marquee queues for now — at peak hours they are the longest lines on property. Work the back half first; return to the marquees in the final two hours when their queues collapse (' + marquee + ' saved for the end, #' + (houses - marquee + 1) + '–' + houses + ').', why: 'The late arrival inverts the route: back half first, marquees last.' })
    }
    if (backHalf > 0) steps.push({ window: 'Mid-evening', body: 'Work the back half of the park — the mazes farthest from the entrance. ' + backHalf + ' house' + (backHalf === 1 ? '' : 's') + ' (' + take(backHalf) + '–' + h + '), scare zones between them at walking pace.', why: 'Back-half queues thin as the crowd gravitates to the entrance-side headliners.' })
    steps.push({ window: 'Mid-evening +', body: 'One show or scare-zone sit-down — the event\'s signature spectacle, mid-evening when the streets are at their fullest.', why: 'The street atmosphere peaks mid-evening; the sit-down rests the feet the mazes will need.' })
    if (finale > 0 || late) steps.push({ window: 'Final two hours', body: (finale > 0 ? 'Remaining house' + (finale === 1 ? '' : 's') + ' (' + take(finale) + '–' + h + '), then ' : '') + (late ? 'the marquee mazes (' + marquee + ')' : 're-rides and the marquee re-walk if the line-skip allows') + '. Queues collapse toward close; the last hour is the calmest haunt hour of the night.', why: 'The final-hour collapse is the single most exploitable fact of the haunt night.' })
    if (peak) steps.push({ window: 'All night', body: 'Peak-Saturday reality: ' + houses + ' houses at ~' + PEAK_MAZE_QUEUE + ' min standby + ' + MAZE_MIN + ' min walk = about ' + Math.round((houses * (PEAK_MAZE_QUEUE + MAZE_MIN)) / 60) + ' hours of queueing alone. This route cuts the worst of it; the event\'s line-skip product erases the rest — the one upcharge this site recommends without hedging on a night like this.', why: 'Peak Saturdays are the line-skip product\'s whole reason to exist.' })
    steps.push({ window: 'Before you go', body: 'House names and this year\'s dates are on the event page the moment the park announces them — check it against this route, then print this page.', why: 'The pattern holds; the names change every year.' })
    return { steps: steps, houses: houses }
  }

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function render (mount, data) {
    mount.innerHTML =
      '<form class="tool-form" data-haunt-form>' +
        '<div class="field-inline"><label for="hp-event">Event</label><select id="hp-event">' +
          data.events.map(function (e, i) { return '<option value="' + i + '">' + esc(e.name) + '</option>' }).join('') +
        '</select></div>' +
        '<div class="field-inline"><label for="hp-houses">Houses this year <span class="muted">pattern default 10; set the announced count</span></label><input id="hp-houses" type="number" min="1" max="15" value="10"></div>' +
        '<div class="field-inline"><label for="hp-night">Night type</label><select id="hp-night"><option value="weeknight">Weeknight (early season)</option><option value="peak">Peak Saturday</option></select></div>' +
        '<div class="field-inline"><label for="hp-arrive">You arrive</label><select id="hp-arrive"><option value="open">At open</option><option value="late">Late (after 9)</option></select></div>' +
        '<button class="btn btn--primary" type="submit">Build the route</button>' +
      '</form>' +
      '<div class="tool-output" data-haunt-output aria-live="polite"></div>'

    var form = mount.querySelector('[data-haunt-form]')
    var out = mount.querySelector('[data-haunt-output]')
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var ev0 = data.events[Number(form.querySelector('#hp-event').value)]
      var route = buildRoute({
        houseCount: form.querySelector('#hp-houses').value,
        nightType: form.querySelector('#hp-night').value,
        arrive: form.querySelector('#hp-arrive').value,
      })
      out.innerHTML =
        '<h2>Your ' + esc(ev0.name) + ' route</h2>' +
        '<ol class="plan-steps">' + route.steps.map(function (s) {
          return '<li><span class="plan-steps__time">' + esc(s.window) + '</span><span>' + esc(s.body) + '</span></li>'
        }).join('') + '</ol>' +
        '<details class="tool-notes"><summary>Why this order</summary><ul>' + route.steps.map(function (s) {
          return '<li><strong>' + esc(s.window) + ':</strong> ' + esc(s.why) + '</li>'
        }).join('') + '</ul></details>' +
        '<p class="field-note muted">' + esc(data.note) + ' <a href="' + esc(ev0.url) + '">Open the ' + esc(ev0.name) + ' page</a> for dates, pricing and this year\'s line-up.</p>' +
        '<p><button class="btn btn--ghost" type="button" onclick="window.print()">Print the route</button></p>'
    })
  }

  function init () {
    var mount = document.querySelector('[data-haunt-planner]')
    var el = document.getElementById('haunt-data')
    if (!mount || !el) return
    var data
    try { data = JSON.parse(el.textContent) } catch (e) { return }
    render(mount, data)
  }

  return { buildRoute: buildRoute, MAZE_MIN: MAZE_MIN, init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', HauntPlanner.init)
  else HauntPlanner.init()
}

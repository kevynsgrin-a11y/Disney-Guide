/* Source-backed 2026 HHN checklist. Ticket prices are entered by the visitor. */
var HauntPlanner = (function () {
  'use strict'

  function esc (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function quote (value) {
    if (value === '' || value == null) return null
    var n = Number(value)
    return Number.isFinite(n) && n >= 0 && n <= 10000 ? n : null
  }
  function dollars (n) { return '$' + n.toFixed(2) }

  function buildChecklist (event, input) {
    var houses = event.houseLineup || []
    var chosen = Array.from(new Set((input.priorities || []).map(Number)))
    if (chosen.length > 3 || chosen.some(function (i) { return !Number.isInteger(i) || i < 0 || i >= houses.length })) return null
    var rest = houses.map(function (_, i) { return i }).filter(function (i) { return chosen.indexOf(i) < 0 })
    var party = Math.max(1, Math.min(20, Math.trunc(Number(input.party) || 1)))
    var base = quote(input.basePrice)
    var alternative = quote(input.alternativePrice)
    var night = input.night || ''
    return {
      order: chosen.concat(rest), priorities: chosen, party: party,
      baseTotal: base == null ? null : base * party,
      alternativeTotal: alternative == null ? null : alternative * party,
      difference: base == null || alternative == null ? null : (alternative - base) * party,
      dateStatus: !night ? 'Confirm your date in Universal’s ticket calendar.'
        : (night < event.startDate || night > event.endDate) ? 'This date is outside the published season range.'
          : 'This date is inside the season range; confirm it is an event night in Universal’s ticket calendar.',
    }
  }

  function storageKey (event) { return 'haunt-planner-' + event.slug + '-' + event.year }
  function readSaved (event) {
    try { return JSON.parse(localStorage.getItem(storageKey(event))) || {} } catch (e) { return {} }
  }
  function save (event, value) {
    try { localStorage.setItem(storageKey(event), JSON.stringify(value)); return true } catch (e) { return false }
  }

  function render (mount, data) {
    mount.innerHTML =
      '<form class="tool-form" data-haunt-form>' +
        '<div class="field-inline"><label for="hp-event">Event</label><select id="hp-event">' + data.events.map(function (e, i) { return '<option value="' + i + '">' + esc(e.name) + '</option>' }).join('') + '</select></div>' +
        '<p class="field-note" data-haunt-source></p>' +
        '<div class="field-inline"><label for="hp-date">Your event date (optional)</label><input id="hp-date" type="date"><span class="field-note muted">The season includes non-event nights; confirm your date with Universal.</span></div>' +
        '<fieldset class="tool-checks"><legend>Choose up to three must-do houses</legend><div data-haunt-houses></div></fieldset>' +
        '<div class="field-inline"><label for="hp-party">People in your group</label><input id="hp-party" type="number" min="1" max="20" value="1"></div>' +
        '<div class="field-inline"><label for="hp-base">Event admission per person from checkout ($, optional)</label><input id="hp-base" type="number" min="0" step="0.01" inputmode="decimal"></div>' +
        '<div class="field-inline"><label for="hp-option">Compare with</label><select id="hp-option"></select></div>' +
        '<div class="field-inline"><label for="hp-alternative">Alternative total per person from checkout ($, optional)</label><input id="hp-alternative" type="number" min="0" step="0.01" inputmode="decimal"><span class="field-note muted">Include event admission in this amount when the alternative requires a separate ticket. This tool never estimates a price.</span></div>' +
        '<button class="btn btn--primary" type="submit">Make my checklist</button>' +
      '</form><div class="tool-output" data-haunt-output aria-live="polite"></div>'

    var form = mount.querySelector('[data-haunt-form]')
    var output = mount.querySelector('[data-haunt-output]')
    function field (id) { return form.querySelector('#' + id) }
    function current () { return data.events[Number(field('hp-event').value)] }
    function switchEvent () {
      var event = current()
      var saved = readSaved(event)
      form.querySelector('[data-haunt-source]').innerHTML = '<strong>' + esc(event.year) + ' official lineup:</strong> ' + event.houseLineup.length + ' houses, ' + esc(event.dateLabel) + '. <a href="' + esc(event.sourceUrl) + '">Source</a> · checked ' + esc(event.verified) + '.'
      form.querySelector('[data-haunt-houses]').innerHTML = event.houseLineup.map(function (name, i) {
        return '<label class="haunt-choice"><input type="checkbox" value="' + i + '" ' + ((saved.priorities || []).indexOf(i) >= 0 ? 'checked' : '') + '> ' + esc(name) + '</label>'
      }).join('')
      field('hp-option').innerHTML = event.options.map(function (name, i) { return '<option value="' + i + '">' + esc(name) + '</option>' }).join('')
      field('hp-date').value = saved.night || ''
      field('hp-party').value = saved.party || 1
      field('hp-base').value = saved.basePrice == null ? '' : saved.basePrice
      field('hp-alternative').value = saved.alternativePrice == null ? '' : saved.alternativePrice
      field('hp-option').value = saved.option || 0
      output.innerHTML = ''
    }
    field('hp-event').addEventListener('change', switchEvent)
    switchEvent()
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var event = current()
      var input = {
        priorities: Array.from(form.querySelectorAll('[data-haunt-houses] input:checked')).map(function (el) { return Number(el.value) }),
        night: field('hp-date').value, party: field('hp-party').value, basePrice: field('hp-base').value,
        alternativePrice: field('hp-alternative').value, option: Number(field('hp-option').value),
      }
      var plan = buildChecklist(event, input)
      if (!plan) { output.innerHTML = '<p role="alert">Choose no more than three must-do houses.</p>'; return }
      var stored = readSaved(event)
      var done = Array.isArray(stored.done) ? stored.done : []
      var persisted = save(event, Object.assign({}, input, { done: done }))
      output.innerHTML =
        '<h2>' + esc(event.name) + ': ' + event.year + ' checklist</h2>' +
        '<p><strong>Selected date:</strong> ' + esc(input.night || 'none') + '. ' + esc(plan.dateStatus) + '</p>' +
        '<ul class="haunt-checklist">' + plan.order.map(function (i) {
          return '<li><label><input type="checkbox" data-done="' + i + '" ' + (done.indexOf(i) >= 0 ? 'checked' : '') + '> ' +
            (plan.priorities.indexOf(i) >= 0 ? '<strong>Must-do</strong> · ' : '') + esc(event.houseLineup[i]) + '</label></li>'
        }).join('') + '</ul>' +
        '<h3>Ticket comparison for ' + plan.party + ' ' + (plan.party === 1 ? 'person' : 'people') + '</h3>' +
        '<p>Event admission: ' + (plan.baseTotal == null ? 'not entered' : dollars(plan.baseTotal)) + '. ' + esc(event.options[input.option]) + ': ' +
          (plan.alternativeTotal == null ? 'not entered' : dollars(plan.alternativeTotal)) +
          (plan.difference == null ? '.' : '. Difference: ' + (plan.difference < 0 ? '−' : '+') + dollars(Math.abs(plan.difference)) + '.') + '</p>' +
        '<p class="field-note muted">Prices are your entries. Compare the same date and product terms at checkout. The official house lineup was checked ' + esc(event.verified) + '; locations and waits may change.</p>' +
        '<p class="field-note muted">' + (persisted ? 'Saved on this device.' : 'This browser did not save the checklist.') + ' <a href="' + esc(event.url) + '">Event guide</a> · <a href="' + esc(event.ticketUrl) + '">Universal event calendar</a></p>' +
        '<p><button class="btn btn--ghost" type="button" data-print>Print checklist</button></p>'
      output.querySelector('[data-print]').addEventListener('click', function () { window.print() })
      output.querySelectorAll('[data-done]').forEach(function (box) {
        box.addEventListener('change', function () {
          var completed = Array.from(output.querySelectorAll('[data-done]:checked')).map(function (el) { return Number(el.dataset.done) })
          save(event, Object.assign({}, input, { done: completed }))
        })
      })
    })
  }

  function init () {
    var mount = document.querySelector('[data-haunt-planner]')
    var el = document.getElementById('haunt-data')
    if (!mount || !el) return
    try { render(mount, JSON.parse(el.textContent)) } catch (e) { mount.textContent = 'Planner data is unavailable. Please use the event guides.' }
  }
  return { buildChecklist: buildChecklist, init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', HauntPlanner.init)
  else HauntPlanner.init()
}

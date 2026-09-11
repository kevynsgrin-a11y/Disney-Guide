/* =========================================================================
   Rider Profiles — the height passport.
   A family's riders (name, birthday, height) stay in localStorage on this
   device: no account, no upload, nothing sent anywhere. Once saved, every
   height table on this site can say "rides now / near miss / not yet", and
   growth bands turn "not yet" into "eligible around March 2027".

   The math is deliberately banded, not point-estimated: children grow at
   wildly different rates, so every projection is a RANGE sourced from
   typical growth by age, labelled as an estimate, and the page says to
   verify at the stick. That honesty is the product.
   ========================================================================= */

var RiderProfiles = (function () {
  'use strict'

  /* ---------- pure math (unit-tested) ---------- */

  function ageAt (birthdayISO, atISO) {
    if (!birthdayISO) return null
    var b = new Date(birthdayISO + 'T00:00:00')
    var t = atISO ? new Date(atISO + 'T00:00:00') : new Date()
    if (isNaN(b) || isNaN(t)) return null
    var age = t.getFullYear() - b.getFullYear()
    var m = t.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--
    return age >= 0 && age < 130 ? age : null
  }

  /** Typical annual growth in inches, banded low/high by age. A range, never a promise. */
  function growthBand (age) {
    if (age == null) return { low: 1.5, high: 2.5, label: 'typical school-age growth' }
    if (age <= 3) return { low: 2.5, high: 3.5, label: 'typical growth at age ' + age }
    if (age <= 8) return { low: 1.75, high: 2.75, label: 'typical growth at age ' + age }
    if (age <= 11) return { low: 2.0, high: 3.0, label: 'typical growth at age ' + age }
    if (age <= 14) return { low: 1.0, high: 3.0, label: 'puberty — the widest-guessing years' }
    if (age <= 16) return { low: 0.25, high: 1.5, label: 'growth slowing at age ' + age }
    return { low: 0, high: 0.5, label: 'mostly done growing' }
  }

  function addMonthsISO (iso, months) {
    var d = new Date(iso + 'T00:00:00')
    if (isNaN(d)) return null
    var day = d.getDate()
    d.setMonth(d.getMonth() + months)
    if (d.getDate() < day) d.setDate(0) // clamp to end of month
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function monthLabel (iso) {
    if (!iso || iso.length < 7) return ''
    return MONTHS[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4)
  }

  var PROJECTION_CAP = 60 // months — beyond that, "years away" is the honest answer

  /**
   * How long until `heightIn` reaches `needIn`, given growth `band` from a
   * measurement taken on `measuredOn`. Returns months-soonest/months-latest
   * and human month labels; null months mean "not in any honest window".
   */
  function projectToHeight (needIn, heightIn, band, measuredOn) {
    var gap = needIn - heightIn
    if (gap <= 0) return { now: true, soonestM: 0, latestM: 0, soonest: '', latest: '' }
    var base = measuredOn && /^\d{4}-\d{2}-\d{2}$/.test(measuredOn)
      ? measuredOn
      : new Date().toISOString().slice(0, 10)
    var soonestM = band.high > 0 ? Math.ceil(gap / band.high * 12) : PROJECTION_CAP + 1
    var latestM = band.low > 0 ? Math.ceil(gap / band.low * 12) : PROJECTION_CAP + 1
    soonestM = Math.min(soonestM, PROJECTION_CAP + 1)
    latestM = Math.min(latestM, PROJECTION_CAP + 1)
    if (soonestM > PROJECTION_CAP) return { now: false, soonestM: null, latestM: null, soonest: '', latest: '' }
    return {
      now: false,
      soonestM: soonestM,
      latestM: latestM,
      soonest: monthLabel(addMonthsISO(base, soonestM)),
      latest: monthLabel(addMonthsISO(base, latestM)),
    }
  }

  function statusFor (heightIn, requirementIn) {
    if (requirementIn == null) return 'any' // no requirement posted
    if (heightIn >= requirementIn) return 'now'
    return requirementIn - heightIn <= 2 ? 'near' : 'later'
  }

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  var math = {
    ageAt: ageAt, growthBand: growthBand, addMonthsISO: addMonthsISO,
    monthLabel: monthLabel, projectToHeight: projectToHeight, statusFor: statusFor,
  }

  /* ---------- store (localStorage, this device only) ---------- */

  var KEY = 'rider-profiles'
  function read () {
    try {
      var raw = localStorage.getItem(KEY)
      var doc = raw ? JSON.parse(raw) : null
      return doc && Array.isArray(doc.riders) ? doc : { riders: [] }
    } catch (e) { return { riders: [] } }
  }
  function write (doc) {
    try { localStorage.setItem(KEY, JSON.stringify(doc)) } catch (e) { /* private mode: profiles live for this page view only */ }
  }
  var store = {
    all: function () { return read().riders },
    save: function (rider) {
      if (!rider || !rider.name || !rider.name.trim()) return null
      var doc = read()
      var clean = {
        id: rider.id || ('r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
        name: rider.name.trim().slice(0, 40),
        birthday: /^\d{4}-\d{2}-\d{2}$/.test(rider.birthday || '') ? rider.birthday : null,
        heightIn: Math.max(24, Math.min(84, Math.round((Number(rider.heightIn) || 0) * 2) / 2)),
        measuredOn: /^\d{4}-\d{2}-\d{2}$/.test(rider.measuredOn || '') ? rider.measuredOn : new Date().toISOString().slice(0, 10),
      }
      var at = doc.riders.findIndex(function (r) { return r.id === clean.id })
      if (at >= 0) doc.riders[at] = clean; else doc.riders.push(clean)
      write(doc)
      return clean
    },
    remove: function (id) {
      var doc = read()
      doc.riders = doc.riders.filter(function (r) { return r.id !== id })
      write(doc)
    },
  }

  /* ---------- payload (inline per page by the build) ---------- */

  function payloadFromDOM () {
    var el = document.getElementById('rider-data')
    if (!el) return null
    try {
      var p = JSON.parse(el.textContent)
      return Array.isArray(p.attractions) ? p : null
    } catch (e) { return null }
  }

  /* ---------- the watch strip (home + park height pages) ---------- */

  function nearestMiss (rider, attractions) {
    var best = null
    for (var i = 0; i < attractions.length; i++) {
      var a = attractions[i]
      if (a.h == null) continue
      var gap = a.h - rider.heightIn
      if (gap > 0 && (!best || gap < best.gap)) best = { gap: gap, ride: a }
    }
    return best
  }

  function renderWatch (mount, payload) {
    if (!mount) return
    var riders = store.all()
    if (!riders.length || !payload) { mount.hidden = true; return }
    var attractions = payload.attractions
    var html = riders.slice(0, 4).map(function (r) {
      var miss = nearestMiss(r, attractions)
      if (!miss) {
        return '<div class="rider-watch__item"><strong>' + esc(r.name) + '</strong> clears every posted height on this site. Ride everything.</div>'
      }
      var band = growthBand(ageAt(r.birthday))
      var proj = projectToHeight(miss.ride.h, r.heightIn, band, r.measuredOn)
      var when = proj.now ? 'now' : proj.soonest
        ? (proj.soonest === proj.latest ? 'around ' + proj.soonest : 'between ' + proj.soonest + ' and ' + proj.latest)
        : 'years away at ' + band.label
      return '<div class="rider-watch__item">' +
        '<strong>' + esc(r.name) + '</strong> is <strong>' + (Math.round(miss.gap * 10) / 10) + ' in</strong> from ' +
        esc(miss.ride.n) + ' <span class="muted">(' + esc(miss.ride.p) + ')</span> — eligible ' + when + '.' +
        '</div>'
    }).join('')
    mount.innerHTML =
      '<p class="rider-watch__eyebrow">Your riders</p>' + html +
      '<a class="btn btn--ghost rider-watch__cta" href="' + esc(payload.myRidersUrl) + '">Open My Riders</a>'
    mount.hidden = false
  }

  /* ---------- height table decoration (park height pages) ---------- */

  var BADGES = {
    now: { cls: 'rider-badge--now', text: 'Rides now' },
    near: { cls: 'rider-badge--near', text: 'Near miss' },
    later: { cls: 'rider-badge--later', text: 'Not yet' },
    any: { cls: 'rider-badge--now', text: 'Any height' },
  }

  function decorateTable (table, rider) {
    if (!table) return
    var rows = table.querySelectorAll('tbody tr')
    for (var i = 0; i < rows.length; i++) {
      var cell = rows[i].querySelector('[data-value]')
      if (!cell) continue
      var req = Number(cell.getAttribute('data-value'))
      var status = statusFor(rider.heightIn, isNaN(req) ? null : req)
      var proj = ''
      if (status === 'later') {
        var band = growthBand(ageAt(rider.birthday))
        var p = projectToHeight(req, rider.heightIn, band, rider.measuredOn)
        if (p.soonest) proj = ' · ~' + (p.soonest === p.latest ? p.soonest : p.soonest + '–' + p.latest)
      }
      var b = BADGES[status]
      rows[i].classList.remove('rider-row--now', 'rider-row--near', 'rider-row--later')
      rows[i].classList.add('rider-row--' + status)
      cell.insertAdjacentHTML('beforeend',
        ' <span class="rider-badge ' + b.cls + '">' + esc(rider.name) + ': ' + b.text + proj + '</span>')
    }
  }

  function decorateHeightsPage () {
    var table = document.querySelector('[data-heights-table]')
    if (!table) return
    var riders = store.all()
    if (!riders.length) return
    var note = document.createElement('p')
    note.className = 'rider-note muted'
    note.textContent = 'Showing status for ' + (riders.length === 1 ? riders[0].name : riders.length + ' saved riders') +
      ' — heights stay on this device. Manage them in My Riders.'
    table.parentNode.insertBefore(note, table)
    // Decorate with the tallest saved rider by default: one label set per row, least noise.
    var primary = riders.slice().sort(function (a, b) { return b.heightIn - a.heightIn })[0]
    decorateTable(table, primary)
  }

  /* ---------- My Riders page ---------- */

  function parkSummary (rider, payload) {
    var byPark = {}
    payload.attractions.forEach(function (a) {
      if (a.h == null) return
      var s = statusFor(rider.heightIn, a.h)
      byPark[a.p] = byPark[a.p] || { p: a.p, u: a.u, now: 0, near: 0, later: 0, misses: [] }
      byPark[a.p][s]++
      if (s === 'near') byPark[a.p].misses.push(a)
    })
    return Object.values(byPark)
  }

  function ladderFor (rider, payload, limit) {
    return payload.attractions
      .filter(function (a) { return a.h != null && a.h > rider.heightIn })
      .sort(function (x, y) { return x.h - y.h })
      .slice(0, limit || 5)
      .map(function (a) {
        var band = growthBand(ageAt(rider.birthday))
        var p = projectToHeight(a.h, rider.heightIn, band, rider.measuredOn)
        return {
          ride: a, gap: Math.round((a.h - rider.heightIn) * 10) / 10,
          when: p.soonest ? (p.soonest === p.latest ? p.soonest : p.soonest + ' – ' + p.latest) : 'years away',
          bandLabel: band.label,
        }
      })
  }

  function riderCard (rider, payload) {
    var age = ageAt(rider.birthday)
    var parks = parkSummary(rider, payload)
    var totalNow = parks.reduce(function (n, p) { return n + p.now }, 0)
    var ladder = ladderFor(rider, payload, 5)
    var band = growthBand(age)
    return '<article class="rider-card" data-rider-id="' + esc(rider.id) + '">' +
      '<header class="rider-card__head">' +
        '<h3>' + esc(rider.name) + '</h3>' +
        '<p class="muted">' + (age != null ? 'age ' + age + ' · ' : '') + rider.heightIn + ' in, measured ' + esc(rider.measuredOn) +
        ' · ' + band.label + ' (' + band.low + '–' + band.high + ' in/yr)</p>' +
        '<div class="rider-card__actions">' +
          '<button class="btn btn--ghost" type="button" data-edit-rider="' + esc(rider.id) + '">Edit</button>' +
          '<button class="btn btn--ghost" type="button" data-remove-rider="' + esc(rider.id) + '">Remove</button>' +
        '</div>' +
      '</header>' +
      '<p class="rider-card__verdict">Clears <strong>' + totalNow + '</strong> posted height requirements across this site' +
        (ladder.length ? '. Next unlocks:' : ' — every posted requirement on this site.') + '</p>' +
      (ladder.length ? '<ol class="rider-ladder">' + ladder.map(function (s) {
        return '<li><strong>' + esc(s.ride.n) + '</strong> <span class="muted">(' + esc(s.ride.p) + ')</span>' +
          ' — ' + s.gap + ' in to go, eligible ~' + s.when + '</li>'
      }).join('') + '</ol>' : '') +
      '<details class="rider-card__parks"><summary>By park</summary><ul>' + parks.map(function (p) {
        return '<li><a href="' + esc(p.u) + '">' + esc(p.p) + '</a>: ' + p.now + ' cleared' +
          (p.near ? ', <strong>' + p.near + ' near miss' + (p.near === 1 ? '' : 'es') + '</strong>' : '') +
          (p.later ? ', ' + p.later + ' to grow into' : '') + '</li>'
      }).join('') + '</ul></details>' +
      '</article>'
  }

  function renderMyRiders (root, payload) {
    var riders = store.all()
    if (!riders.length) {
      root.innerHTML = '<div class="rider-empty">' +
        '<h2>No riders saved yet</h2>' +
        '<p>Add each child once — name, birthday if you know it, and their height measured with shoes on. ' +
        'From then on this site labels every height table for your family and projects when each ride unlocks.</p>' +
        '<p class="muted">Riders never leave this device. No account, no sync, no email.</p>' +
        '</div>'
    } else {
      root.innerHTML = riders.map(function (r) { return riderCard(r, payload) }).join('')
    }
  }

  function bindMyRiders (root, payload, form) {
    root.addEventListener('click', function (ev) {
      var t = ev.target
      var editId = t.getAttribute && t.getAttribute('data-edit-rider')
      var rmId = t.getAttribute && t.getAttribute('data-remove-rider')
      if (rmId) { store.remove(rmId); renderMyRiders(root, payload); return }
      if (editId) {
        var r = store.all().find(function (x) { return x.id === editId })
        if (!r) return
        form._editing = r.id
        form.querySelector('[name=name]').value = r.name
        form.querySelector('[name=birthday]').value = r.birthday || ''
        form.querySelector('[name=heightIn]').value = r.heightIn
        form.querySelector('[name=measuredOn]').value = r.measuredOn
        form.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
    form.addEventListener('submit', function (ev) {
      ev.preventDefault()
      var saved = store.save({
        id: form._editing || null,
        name: form.querySelector('[name=name]').value,
        birthday: form.querySelector('[name=birthday]').value,
        heightIn: form.querySelector('[name=heightIn]').value,
        measuredOn: form.querySelector('[name=measuredOn]').value,
      })
      if (!saved) { form.querySelector('[data-form-note]').textContent = 'A name and a height are all we need.'; return }
      form.reset()
      form._editing = null
      form.querySelector('[name=measuredOn]').value = new Date().toISOString().slice(0, 10)
      form.querySelector('[data-form-note]').textContent = ''
      renderMyRiders(root, payload)
      var watch = document.querySelector('[data-rider-watch]')
      if (watch) renderWatch(watch, payload)
    })
  }

  /* ---------- height checker hook: save this height as a rider ---------- */

  function attachSaveHook (mount, valueEl) {
    if (!mount || !valueEl) return
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn--ghost'
    btn.textContent = 'Save this height as a rider'
    btn.addEventListener('click', function () {
      var name = window.prompt("Rider's name (stays on this device):")
      if (!name || !name.trim()) return
      store.save({ name: name, heightIn: valueEl.textContent })
      btn.textContent = 'Saved — view in My Riders'
      btn.disabled = true
    })
    mount.appendChild(btn)
  }

  /* ---------- boot ---------- */

  function init () {
    var payload = payloadFromDOM()
    var watch = document.querySelector('[data-rider-watch]')
    if (watch && payload) renderWatch(watch, payload)
    if (document.querySelector('[data-heights-table]')) decorateHeightsPage()
    var root = document.querySelector('[data-my-riders]')
    if (root && payload) {
      var form = document.querySelector('[data-rider-form]')
      renderMyRiders(root, payload)
      if (form) {
        form.querySelector('[name=measuredOn]').value = new Date().toISOString().slice(0, 10)
        bindMyRiders(root, payload, form)
        var printBtn = document.querySelector('[data-rider-print]')
        if (printBtn) printBtn.addEventListener('click', function () { window.print() })
      }
    }
    var hook = document.querySelector('[data-save-rider-hook]')
    if (hook) attachSaveHook(hook, document.querySelector('[data-height-value]'))
  }

  return { math: math, store: store, renderWatch: renderWatch, _internals: { nearestMiss: nearestMiss, ladderFor: ladderFor, riderCard: riderCard } , init: init }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', RiderProfiles.init)
  else RiderProfiles.init()
}

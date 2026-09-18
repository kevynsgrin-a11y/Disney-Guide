/* =========================================================================
   Career Ladder — the height career with a credit counter.

   The rungs come from the dataset's own asserted minimums (payload built at
   build time); the riding history is the reader's, in localStorage on this
   device, in the same spirit as the food tracker and the rider profiles.
   Saved riders are shared with RiderProfiles when that engine is present,
   so a family enters a child once and every tool agrees.

   Honesty rules carried over from the rest of the site: a coaster without
   an asserted minimum never appears on a rung (it is counted, not guessed),
   projections are banded ranges, and a retired coaster stays creditable —
   riding history does not expire when a ride does.
   ========================================================================= */

var CareerLadder = (function () {
  'use strict'

  /* ---------- pure core (unit-tested) ---------- */

  /** Rungs ascending from the asserted minimums; one rung per distinct height. */
  function rungsFor (coasters) {
    var byHeight = {}
    var unverified = []
    for (var i = 0; i < coasters.length; i++) {
      var c = coasters[i]
      if (c.h == null) { unverified.push(c); continue }
      (byHeight[c.h] = byHeight[c.h] || []).push(c)
    }
    var rungs = Object.keys(byHeight)
      .map(Number)
      .sort(function (a, b) { return a - b })
      .map(function (h) { return { h: h, items: byHeight[h] } })
    return { rungs: rungs, unverified: unverified }
  }

  function statusFor (heightIn, reqIn) {
    if (reqIn == null) return 'any'
    if (heightIn >= reqIn) return 'now'
    return reqIn - heightIn <= 2 ? 'near' : 'later'
  }

  /** Summary counts for one height against every coaster. */
  function summaryFor (heightIn, coasters) {
    var now = 0, near = 0, later = 0, unverified = 0
    for (var i = 0; i < coasters.length; i++) {
      var c = coasters[i]
      if (c.h == null) { unverified++; continue }
      var s = statusFor(heightIn, c.h)
      if (s === 'now') now++; else if (s === 'near') near++; else later++
    }
    return { now: now, near: near, later: later, unverified: unverified, total: coasters.length }
  }

  function esc (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    })
  }

  /* ---------- credits (localStorage, this device only) ---------- */

  var KEY = 'career-credits'
  function readCredits () {
    try {
      var doc = JSON.parse(localStorage.getItem(KEY))
      return doc && Array.isArray(doc.ids) ? doc : { ids: [] }
    } catch (e) { return { ids: [] } }
  }
  function writeCredits (doc) {
    try { localStorage.setItem(KEY, JSON.stringify(doc)) } catch (e) { /* private mode: history lives for this page view */ }
  }
  var credits = {
    has: function (id) { return readCredits().ids.indexOf(id) >= 0 },
    toggle: function (id, on) {
      var doc = readCredits()
      var at = doc.ids.indexOf(id)
      if (on && at < 0) doc.ids.push(id)
      if (!on && at >= 0) doc.ids.splice(at, 1)
      writeCredits(doc)
    },
    count: function (coasters) {
      var doc = readCredits()
      var known = {}
      var n = 0
      for (var i = 0; i < coasters.length; i++) known[coasters[i].id] = true
      for (var j = 0; j < doc.ids.length; j++) if (known[doc.ids[j]]) n++
      return n
    },
  }

  /* ---------- rendering ---------- */

  function payloadFromDOM () {
    var el = document.getElementById('career-data')
    if (!el) return null
    try {
      var p = JSON.parse(el.textContent)
      return Array.isArray(p.coasters) ? p : null
    } catch (e) { return null }
  }

  function riderOptions (riders) {
    return riders.slice().sort(function (a, b) { return b.heightIn - a.heightIn })
  }

  function renderLadder (mount, payload, chosen) {
    var heightIn = chosen.heightIn
    var ladder = rungsFor(payload.coasters)
    var summary = summaryFor(heightIn, payload.coasters)
    var ridden = credits.count(payload.coasters)
    var math = window.RiderProfiles && window.RiderProfiles.math
    var band = math && chosen.birthday ? math.growthBand(math.ageAt(chosen.birthday)) : null

    var out = ''
    out += '<div class="career-summary">'
    out += '<p>' + esc(chosen.name || 'This rider') + ' at <strong>' + heightIn + ' in</strong> clears <strong>' + summary.now + '</strong> posted minimums'
    if (summary.near) out += ', with <strong>' + summary.near + '</strong> within two inches'
    out += '. Credits: <strong>' + ridden + '</strong> of ' + summary.total + ' documented coasters ridden.</p>'
    out += '</div>'

    out += '<div class="rider-ruler career-ruler" role="img" aria-label="Height ladder from ' +
      ladder.rungs.map(function (r) { return r.h + ' inches' }).join(', ') + '.">'
    out += '<ol class="ruler__rungs">'

    var floorRider = null
    for (var i = ladder.rungs.length - 1; i >= 0; i--) {
      var rung = ladder.rungs[i]
      var state = heightIn >= rung.h ? 'cleared' : 'ahead'
      var when = ''
      if (state === 'ahead' && math && band) {
        var p = math.projectToHeight(rung.h, heightIn, band, chosen.measuredOn)
        when = p.soonest ? (p.soonest === p.latest ? '~' + p.soonest : '~' + p.soonest + ' – ' + p.latest) : 'years away'
      }
      out += '<li class="ruler__rung ruler__rung--' + state + '">'
      out += '<span class="ruler__tick" aria-hidden="true"></span>'
      out += '<span class="ruler__label"><strong>' + rung.h + ' in</strong> · ' + rung.items.length + ' coaster' + (rung.items.length === 1 ? '' : 's') + '</span>'
      out += (state === 'cleared'
        ? '<span class="ruler__state ruler__state--cleared">Cleared</span>'
        : '<span class="ruler__state ruler__state--ahead">' + (when || 'Not yet') + '</span>')
      out += '</li>'

      var floor = i === 0 ? -Infinity : ladder.rungs[i - 1].h
      if (floorRider === null && heightIn < rung.h && heightIn >= floor) {
        floorRider = true
        out += '<li class="ruler__marker">'
        out += '<span class="ruler__marker-line" aria-hidden="true"></span>'
        out += '<span class="ruler__marker-label">' + esc(chosen.name || 'This rider') + ' — ' + heightIn + ' in' + (chosen.measuredOn ? ', measured ' + esc(chosen.measuredOn) : '') + '</span>'
        out += '</li>'
      }

      out += '<li class="career-rung__items">'
      out += rung.items.map(function (c) { return creditRow(c) }).join('')
      out += '</li>'
    }
    if (heightIn >= (ladder.rungs.length ? ladder.rungs[ladder.rungs.length - 1].h : Infinity)) {
      out += '<li class="ruler__marker">'
      out += '<span class="ruler__marker-line" aria-hidden="true"></span>'
      out += '<span class="ruler__marker-label">' + esc(chosen.name || 'This rider') + ' — ' + heightIn + ' in, above every rung</span>'
      out += '</li>'
    }
    out += '</ol></div>'

    if (ladder.unverified.length) {
      out += '<details class="career-unverified"><summary>' + ladder.unverified.length + ' documented coaster' + (ladder.unverified.length === 1 ? ' has' : 's have') + ' no verified minimum — listed, never guessed onto a rung</summary>'
      out += '<ul>' + ladder.unverified.map(function (c) { return '<li>' + creditRow(c) + '</li>' }).join('') + '</ul>'
      out += '</details>'
    }

    out += '<div class="career-actions">'
    out += '<button class="btn btn--ghost" type="button" data-career-print>Print the career card</button>'
    out += '<a class="btn btn--ghost" href="' + esc(payload.myRidersUrl) + '">Manage riders</a>'
    out += '</div>'

    mount.innerHTML = out
  }

  function creditRow (c) {
    var checked = credits.has(c.id) ? ' checked' : ''
    var closed = c.s !== 'open' ? ' <span class="pill pill--closed">Permanently closed</span>' : ''
    return '<label class="career-credit">' +
      '<input type="checkbox" data-credit="' + esc(c.id) + '"' + checked + '> ' +
      '<span class="career-credit__name">' + esc(c.n) + '</span>' +
      '<span class="career-credit__park">' + esc(c.p) + '</span>' + closed +
      '</label>'
  }

  /* ---------- controls ---------- */

  function currentChoice (mount, payload) {
    var riders = (window.RiderProfiles && window.RiderProfiles.store.all()) || []
    var select = mount.querySelector('[data-career-rider]')
    var manual = mount.querySelector('[data-career-height]')
    var chosen = null
    if (select && select.value && select.value !== '__manual' && riders.length) {
      chosen = riders.find(function (r) { return r.id === select.value })
    }
    if (chosen) return { name: chosen.name, heightIn: chosen.heightIn, birthday: chosen.birthday, measuredOn: chosen.measuredOn }
    var h = Number(manual && manual.value) || 48
    return { name: '', heightIn: Math.max(24, Math.min(84, h)), birthday: null, measuredOn: null }
  }

  function controlsHTML (riders) {
    var out = '<div class="career-controls">'
    out += '<label class="career-control">Which rider? '
    out += '<select data-career-rider>'
    var ordered = riderOptions(riders)
    for (var i = 0; i < ordered.length; i++) {
      out += '<option value="' + esc(ordered[i].id) + '"' + (i === 0 ? ' selected' : '') + '>' + esc(ordered[i].name) + ' — ' + ordered[i].heightIn + ' in</option>'
    }
    out += '<option value="__manual"' + (ordered.length ? '' : ' selected') + '>Just a height</option>'
    out += '</select></label>'
    out += '<label class="career-control">Height (inches) '
    out += '<input type="number" inputmode="numeric" min="24" max="84" step="0.5" value="48" data-career-height>'
    out += '</label>'
    out += '</div>'
    return out
  }

  function boot () {
    var mount = document.querySelector('[data-career-ladder]')
    if (!mount) return
    var payload = payloadFromDOM()
    if (!payload) return
    var riders = (window.RiderProfiles && window.RiderProfiles.store.all()) || []
    mount.innerHTML = controlsHTML(riders) + '<div data-career-board></div>'
    var board = mount.querySelector('[data-career-board]')

    function refresh () {
      renderLadder(board, payload, currentChoice(mount, payload))
      var manualWrap = mount.querySelector('[data-career-height]')
      var select = mount.querySelector('[data-career-rider]')
      if (manualWrap && select) {
        manualWrap.disabled = !!(select.value && select.value !== '__manual')
      }
    }

    mount.addEventListener('change', function (ev) {
      var t = ev.target
      if (t.getAttribute && t.getAttribute('data-credit')) {
        credits.toggle(t.getAttribute('data-credit'), t.checked)
        refresh()
        return
      }
      // hasAttribute, not getAttribute: these carry no values, and '' is falsy
      if (t.hasAttribute && (t.hasAttribute('data-career-rider') || t.hasAttribute('data-career-height'))) refresh()
    })
    mount.addEventListener('click', function (ev) {
      var t = ev.target
      if (t.hasAttribute && t.hasAttribute('data-career-print')) window.print()
    })
    refresh()
  }

  return {
    _internals: { rungsFor: rungsFor, statusFor: statusFor, summaryFor: summaryFor },
    credits: credits,
    boot: boot,
  }
})()

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', CareerLadder.boot)
  else CareerLadder.boot()
}

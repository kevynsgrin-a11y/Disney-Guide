/* =========================================================================
   Food Tracker
   -------------------------------------------------------------------------
   Runs on any page containing [data-food-id] cards. On the dedicated tool page
   it also drives filters, progress, share links, and the printable checklist.

   Storage:  localStorage["rrg-food"] = { "version": 2, "state": { id: status } }
             status ∈ "want" | "tried" | "skip"   (absent = unset)

   Sharing:  two bits per item over a canonical, append-only id order, packed
             little-endian into bytes and base64url-encoded into the URL hash.
             ~200 items → 50 bytes → ~67 characters. Unknown ids in a decoded
             payload are dropped; ids added after a link was created decode as
             unset, so old links keep working forever as long as the canonical
             order is only ever appended to.
   ========================================================================= */

(function () {
  'use strict'

  var KEY = 'rrg-food'
  var VERSION = 2
  var STATUSES = ['want', 'tried', 'skip']
  var CODE = { 0: null, 1: 'want', 2: 'tried', 3: 'skip' }
  var BITS = { want: 1, tried: 2, skip: 3 }

  /* ---------- Storage ----------------------------------------------------- */

  function read () {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (!parsed || typeof parsed !== 'object') return {}
      // Migration hook. v1 stored a bare id→status map with no envelope.
      if (!parsed.version) return sanitize(parsed)
      return sanitize(parsed.state || {})
    } catch (e) { return {} }
  }

  function sanitize (map) {
    var out = {}
    for (var id in map) {
      if (Object.prototype.hasOwnProperty.call(map, id) && STATUSES.indexOf(map[id]) > -1) {
        out[id] = map[id]
      }
    }
    return out
  }

  function write (state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: VERSION, state: state }))
    } catch (e) { /* storage full or blocked — the session still works in memory */ }
  }

  /* ---------- Share encoding ---------------------------------------------- */

  function encode (order, state) {
    var bytes = new Uint8Array(Math.ceil(order.length / 4))
    for (var i = 0; i < order.length; i++) {
      var bit = BITS[state[order[i]]] || 0
      if (!bit) continue
      bytes[i >> 2] |= bit << ((i & 3) * 2)
    }
    var binary = ''
    for (var b = 0; b < bytes.length; b++) binary += String.fromCharCode(bytes[b])
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  function decode (order, token) {
    var padded = token.replace(/-/g, '+').replace(/_/g, '/')
    while (padded.length % 4) padded += '='
    var binary
    try { binary = atob(padded) } catch (e) { return null }
    var state = {}
    for (var i = 0; i < order.length; i++) {
      var byte = i >> 2 < binary.length ? binary.charCodeAt(i >> 2) : 0
      var status = CODE[(byte >> ((i & 3) * 2)) & 3]
      if (status) state[order[i]] = status
    }
    return state
  }

  /* ---------- DOM --------------------------------------------------------- */

  var cards = []
  var state = {}
  var order = []

  function paint (card) {
    var id = card.getAttribute('data-food-id')
    var status = state[id] || ''
    if (status) card.setAttribute('data-state', status)
    else card.removeAttribute('data-state')
    card.querySelectorAll('[data-track]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-track') === status))
    })
  }

  function paintAll () { cards.forEach(paint) }

  function setStatus (id, status) {
    if (state[id] === status) delete state[id]
    else state[id] = status
    write(state)
    cards.filter(function (c) { return c.getAttribute('data-food-id') === id }).forEach(paint)
    updateProgress()
    applyFilters()
  }

  /* ---------- Progress ---------------------------------------------------- */

  function counts () {
    var total = order.length || cards.length
    var tried = 0; var want = 0; var skip = 0
    for (var id in state) {
      if (state[id] === 'tried') tried++
      else if (state[id] === 'want') want++
      else if (state[id] === 'skip') skip++
    }
    return { total: total, tried: tried, want: want, skip: skip }
  }

  function updateProgress () {
    var c = counts()
    var ring = document.querySelector('.tracker-progress__fg')
    var countEl = document.querySelector('[data-progress-count]')
    var labelEl = document.querySelector('[data-progress-label]')
    if (countEl) countEl.textContent = c.tried + ' / ' + c.total
    if (labelEl) {
      var pct = c.total ? Math.round((c.tried / c.total) * 100) : 0
      labelEl.textContent = pct + '% tried · ' + c.want + ' on your list'
    }
    if (ring) {
      var r = Number(ring.getAttribute('r')) || 18
      var circumference = 2 * Math.PI * r
      var progress = c.total ? c.tried / c.total : 0
      ring.setAttribute('stroke-dasharray', (circumference * progress).toFixed(2) + ' ' + circumference.toFixed(2))
    }
    document.querySelectorAll('[data-count="tried"]').forEach(function (n) { n.textContent = c.tried })
    document.querySelectorAll('[data-count="want"]').forEach(function (n) { n.textContent = c.want })
    document.querySelectorAll('[data-count="total"]').forEach(function (n) { n.textContent = c.total })
  }

  /* ---------- Filters ----------------------------------------------------- */

  var filters = { park: 'all', category: 'all', diet: 'all', status: 'all', query: '' }

  function matches (card) {
    if (filters.park !== 'all' && card.getAttribute('data-park') !== filters.park) return false
    if (filters.category !== 'all' && card.getAttribute('data-category') !== filters.category) return false
    if (filters.diet !== 'all') {
      var diets = (card.getAttribute('data-diet') || '').split(' ')
      if (diets.indexOf(filters.diet) < 0) return false
    }
    if (filters.status !== 'all') {
      var status = state[card.getAttribute('data-food-id')] || 'unset'
      if (filters.status === 'unset' ? status !== 'unset' : status !== filters.status) return false
    }
    if (filters.query) {
      if (card.textContent.toLowerCase().indexOf(filters.query) < 0) return false
    }
    return true
  }

  function applyFilters () {
    var shown = 0
    cards.forEach(function (card) {
      var ok = matches(card)
      card.hidden = !ok
      if (ok) shown++
    })
    // Hide a park group whose every card is filtered out.
    document.querySelectorAll('[data-park-group]').forEach(function (group) {
      var any = Array.prototype.some.call(group.querySelectorAll('[data-food-id]'), function (c) { return !c.hidden })
      group.hidden = !any
    })
    var empty = document.querySelector('[data-empty-state]')
    if (empty) empty.hidden = shown > 0
    var shownEl = document.querySelector('[data-shown-count]')
    if (shownEl) shownEl.textContent = shown
  }

  function initFilters () {
    document.querySelectorAll('[data-filter]').forEach(function (control) {
      var key = control.getAttribute('data-filter')
      if (control.tagName === 'SELECT' || control.tagName === 'INPUT') {
        var event = control.type === 'search' || control.type === 'text' ? 'input' : 'change'
        control.addEventListener(event, function () {
          filters[key] = key === 'query' ? control.value.trim().toLowerCase() : control.value
          applyFilters()
        })
      } else {
        control.addEventListener('click', function () {
          var value = control.getAttribute('data-value')
          filters[key] = filters[key] === value ? 'all' : value
          document.querySelectorAll('[data-filter="' + key + '"][data-value]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === filters[key]))
          })
          applyFilters()
        })
      }
    })
  }

  /* ---------- Actions ------------------------------------------------------ */

  function flash (message) {
    var el = document.querySelector('[data-tracker-status]')
    if (!el) return
    el.textContent = message
    clearTimeout(flash._t)
    flash._t = setTimeout(function () { el.textContent = '' }, 4000)
  }

  function shareUrl () {
    return location.origin + location.pathname + '#s=' + encode(order, state)
  }

  function initActions () {
    var share = document.querySelector('[data-action="share"]')
    if (share) {
      share.addEventListener('click', function () {
        var url = shareUrl()
        history.replaceState(null, '', '#s=' + encode(order, state))
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(
            function () { flash('Share link copied to your clipboard.') },
            function () { flash('Link is in the address bar — copy it from there.') }
          )
        } else {
          flash('Link is in the address bar — copy it from there.')
        }
      })
    }

    var print = document.querySelector('[data-action="print"]')
    if (print) {
      print.addEventListener('click', function () {
        document.body.classList.add('print-checklist')
        var restore = function () { document.body.classList.remove('print-checklist') }
        addEventListener('afterprint', restore, { once: true })
        setTimeout(function () { print.blur(); window.print() }, 30)
      })
    }

    var reset = document.querySelector('[data-action="reset"]')
    if (reset) {
      reset.addEventListener('click', function () {
        if (!confirm('Clear every want, tried, and skip on this device? This cannot be undone.')) return
        state = {}
        write(state)
        history.replaceState(null, '', location.pathname)
        paintAll(); updateProgress(); applyFilters()
        flash('Your list has been cleared.')
      })
    }

    var wantAll = document.querySelector('[data-action="want-visible"]')
    if (wantAll) {
      wantAll.addEventListener('click', function () {
        var n = 0
        cards.forEach(function (card) {
          if (card.hidden) return
          var id = card.getAttribute('data-food-id')
          if (!state[id]) { state[id] = 'want'; n++ }
        })
        write(state); paintAll(); updateProgress(); applyFilters()
        flash(n + ' item' + (n === 1 ? '' : 's') + ' added to your list.')
      })
    }
  }

  /* ---------- Boot ---------------------------------------------------------- */

  function readOrder () {
    var node = document.getElementById('food-order')
    if (!node) return []
    try { return JSON.parse(node.textContent) || [] } catch (e) { return [] }
  }

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    cards = Array.prototype.slice.call(document.querySelectorAll('[data-food-id]'))
    if (!cards.length) return
    order = readOrder()
    state = read()

    // A shared link wins over local state, but we keep the local copy in place
    // until the visitor actually interacts, so nothing is silently destroyed.
    var hash = location.hash.match(/[#&]s=([A-Za-z0-9\-_]+)/)
    if (hash && order.length) {
      var shared = decode(order, hash[1])
      if (shared) {
        state = shared
        write(state)
        flash('Loaded a shared list. Your previous list on this device has been replaced.')
      }
    }

    document.addEventListener('click', function (e) {
      var button = e.target.closest && e.target.closest('[data-track]')
      if (!button) return
      var card = button.closest('[data-food-id]')
      if (!card) return
      setStatus(card.getAttribute('data-food-id'), button.getAttribute('data-track'))
    })

    initFilters()
    initActions()
    paintAll()
    updateProgress()
    applyFilters()
  })
})()

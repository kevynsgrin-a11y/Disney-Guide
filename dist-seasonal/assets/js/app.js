/* =========================================================================
   Site-wide behaviour. No dependencies, no build step.
   Everything here is progressive: the site is fully readable with JS disabled.
   ========================================================================= */

(function () {
  'use strict'

  var THEME_KEY = 'rrg-theme'

  /* ---------- Theme ------------------------------------------------------ */

  function currentTheme () {
    var stored = null
    try { stored = localStorage.getItem(THEME_KEY) } catch (e) { /* private mode */ }
    if (stored === 'dark' || stored === 'light') return stored
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function initTheme () {
    var button = document.querySelector('[data-theme-toggle]')
    if (!button) return
    button.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try { localStorage.setItem(THEME_KEY, next) } catch (e) { /* ignore */ }
      button.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
    })
  }

  /* ---------- Mobile nav ------------------------------------------------- */

  function initNav () {
    var header = document.querySelector('[data-nav]')
    var toggle = header && header.querySelector('.nav-toggle')
    if (!header || !toggle) return
    toggle.addEventListener('click', function () {
      var open = header.hasAttribute('data-open')
      if (open) header.removeAttribute('data-open')
      else header.setAttribute('data-open', '')
      toggle.setAttribute('aria-expanded', String(!open))
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.hasAttribute('data-open')) {
        header.removeAttribute('data-open')
        toggle.setAttribute('aria-expanded', 'false')
        toggle.focus()
      }
    })
  }

  /* ---------- Sortable tables -------------------------------------------- */

  function cellValue (row, index, type) {
    var cell = row.children[index]
    if (!cell) return type === 'number' ? -Infinity : ''
    var explicit = cell.getAttribute('data-value')
    var text = explicit != null ? explicit : cell.textContent.trim()
    if (type === 'number') {
      var n = parseFloat(String(text).replace(/[^0-9.\-]/g, ''))
      return isNaN(n) ? -Infinity : n
    }
    return text.toLowerCase()
  }

  function initSortableTables () {
    document.querySelectorAll('table[data-sortable]').forEach(function (table) {
      var body = table.tBodies[0]
      if (!body) return
      table.querySelectorAll('thead th[data-sort-index]').forEach(function (th) {
        th.setAttribute('role', 'button')
        th.setAttribute('tabindex', '0')
        function sort () {
          var index = Number(th.getAttribute('data-sort-index'))
          var type = th.getAttribute('data-sort-type') || 'text'
          var asc = th.getAttribute('aria-sort') !== 'ascending'
          table.querySelectorAll('thead th').forEach(function (other) { other.removeAttribute('aria-sort') })
          th.setAttribute('aria-sort', asc ? 'ascending' : 'descending')
          var rows = Array.prototype.slice.call(body.rows)
          rows.sort(function (a, b) {
            var va = cellValue(a, index, type)
            var vb = cellValue(b, index, type)
            if (va < vb) return asc ? -1 : 1
            if (va > vb) return asc ? 1 : -1
            return 0
          })
          rows.forEach(function (row) { body.appendChild(row) })
        }
        th.addEventListener('click', sort)
        th.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort() }
        })
      })
    })
  }

  /* ---------- Search ------------------------------------------------------ */

  var searchIndex = null
  var searchLoading = null

  function loadIndex () {
    if (searchIndex) return Promise.resolve(searchIndex)
    if (searchLoading) return searchLoading
    searchLoading = fetch('/search-index.json')
      .then(function (r) { return r.ok ? r.json() : { items: [] } })
      .then(function (data) { searchIndex = data.items || []; return searchIndex })
      .catch(function () { searchIndex = []; return searchIndex })
    return searchLoading
  }

  function scoreItem (item, query) {
    var title = item.t.toLowerCase()
    var idx = title.indexOf(query)
    if (idx === 0) return 100 - title.length * 0.05
    if (idx > 0) return 70 - idx
    if (item.k && item.k.indexOf(query) > -1) return 40
    // Loose subsequence match on the title for typo-ish input.
    var qi = 0
    for (var i = 0; i < title.length && qi < query.length; i++) {
      if (title[i] === query[qi]) qi++
    }
    return qi === query.length ? 15 : -1
  }

  function highlight (text, query) {
    var lower = text.toLowerCase()
    var i = lower.indexOf(query)
    if (i < 0) return escapeHtml(text)
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + query.length)) +
      '</mark>' + escapeHtml(text.slice(i + query.length))
  }

  function escapeHtml (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function initSearch () {
    var overlay = document.querySelector('[data-search-overlay]')
    var input = document.querySelector('[data-search-input]')
    var results = document.querySelector('[data-search-results]')
    if (!overlay || !input || !results) return

    var lastFocus = null
    var active = -1

    function open () {
      lastFocus = document.activeElement
      overlay.hidden = false
      document.body.style.overflow = 'hidden'
      loadIndex()
      setTimeout(function () { input.focus() }, 10)
    }
    function close () {
      overlay.hidden = true
      document.body.style.overflow = ''
      if (lastFocus && lastFocus.focus) lastFocus.focus()
    }

    function render (query) {
      var q = query.trim().toLowerCase()
      active = -1
      if (q.length < 2) {
        results.innerHTML = '<p class="search-panel__hint">Start typing — every ride, restaurant, snack, and guide on the site is searchable.</p>'
        return
      }
      var scored = []
      for (var i = 0; i < (searchIndex || []).length; i++) {
        var s = scoreItem(searchIndex[i], q)
        if (s > 0) scored.push({ item: searchIndex[i], score: s })
      }
      scored.sort(function (a, b) { return b.score - a.score })
      var top = scored.slice(0, 24)
      if (!top.length) {
        results.innerHTML = '<p class="search-panel__hint">Nothing matched “' + escapeHtml(query) + '”.</p>'
        return
      }
      results.innerHTML = top.map(function (entry) {
        return '<a class="search-result" role="option" href="' + escapeHtml(entry.item.u) + '">' +
          '<strong>' + highlight(entry.item.t, q) + '</strong>' +
          '<span>' + escapeHtml(entry.item.c || '') + '</span></a>'
      }).join('')
    }

    function move (delta) {
      var nodes = results.querySelectorAll('.search-result')
      if (!nodes.length) return
      if (active > -1 && nodes[active]) nodes[active].removeAttribute('data-active')
      active = (active + delta + nodes.length) % nodes.length
      nodes[active].setAttribute('data-active', '')
      nodes[active].scrollIntoView({ block: 'nearest' })
    }

    document.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', open) })
    document.querySelectorAll('[data-search-close]').forEach(function (b) { b.addEventListener('click', close) })
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close() })

    input.addEventListener('input', function () {
      loadIndex().then(function () { render(input.value) })
    })
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
      else if (e.key === 'Enter') {
        var nodes = results.querySelectorAll('.search-result')
        if (active > -1 && nodes[active]) { e.preventDefault(); nodes[active].click() }
      }
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) { close(); return }
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && overlay.hidden) {
        var tag = (document.activeElement && document.activeElement.tagName) || ''
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        open()
      }
    })
  }

  /* ---------- Connectivity ------------------------------------------------ */

  function initConnectivity () {
    var note = document.createElement('div')
    note.className = 'offline-note'
    note.setAttribute('role', 'status')
    note.textContent = 'Offline — showing your saved copy'
    document.body.appendChild(note)
    function update () {
      if (navigator.onLine) document.body.removeAttribute('data-offline')
      else document.body.setAttribute('data-offline', '')
    }
    addEventListener('online', update)
    addEventListener('offline', update)
    update()
  }

  /* ---------- Service worker ---------------------------------------------- */

  function initServiceWorker () {
    if (!('serviceWorker' in navigator)) return
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return
    addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline support is optional */ })
    })
  }

  /* ---------- Go ---------------------------------------------------------- */

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    initTheme()
    initNav()
    initSortableTables()
    initSearch()
    initConnectivity()
    initServiceWorker()
  })
})()

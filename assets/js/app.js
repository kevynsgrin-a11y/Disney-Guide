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
          applySort(body, rows)
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
      input.removeAttribute('aria-activedescendant')
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
      results.innerHTML = top.map(function (entry, i) {
        return '<a class="search-result" role="option" id="search-result-' + i + '" href="' + escapeHtml(entry.item.u) + '">' +
          '<strong>' + highlight(entry.item.t, q) + '</strong>' +
          '<span>' + escapeHtml(entry.item.c || '') + '</span></a>'
      }).join('')
      input.removeAttribute('aria-activedescendant')
    }

    function move (delta) {
      var nodes = results.querySelectorAll('.search-result')
      if (!nodes.length) return
      if (active > -1 && nodes[active]) nodes[active].removeAttribute('data-active')
      active = (active + delta + nodes.length) % nodes.length
      nodes[active].setAttribute('data-active', '')
      nodes[active].scrollIntoView({ block: 'nearest' })
      /* The highlight is a custom attribute, so without this the listbox looks navigable but
         announces nothing: focus never leaves the input and no option is ever "current". */
      if (nodes[active].id) input.setAttribute('aria-activedescendant', nodes[active].id)
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

  /* ---------- Sort motion -------------------------------------------------- */

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)')

  /**
   * FLIP row sort: rows glide from their old position to their new one instead of snapping.
   * Ported from the Bolt dossier comp — measured against the site's own table markup, and
   * skipped entirely under reduced motion where the reorder is instant, as before.
   */
  function applySort (body, rows) {
    if (REDUCED_MOTION.matches) {
      rows.forEach(function (row) { body.appendChild(row) })
      return
    }
    var before = rows.map(function (row) { return row.getBoundingClientRect().top })
    rows.forEach(function (row) { body.appendChild(row) })
    rows.forEach(function (row, i) {
      var delta = before[i] - row.getBoundingClientRect().top
      if (!delta) return
      row.style.transition = 'none'
      row.style.transform = 'translateY(' + delta + 'px)'
      requestAnimationFrame(function () {
        row.style.transition = 'transform .3s cubic-bezier(.22,.61,.36,1)'
        row.style.transform = ''
      })
    })
    setTimeout(function () {
      rows.forEach(function (row) { row.style.transition = '' })
    }, 400)
  }

  /* ---------- Scroll reveal ------------------------------------------------- */

  /* One restrained fade-and-rise as a band enters the viewport — the class is added by
     JavaScript only, so the page without JS renders exactly as it always has. */
  function initReveal () {
    /* Never hide anything in a hidden tab: observers and frames are throttled there, and a
       page that loaded in the background must not still be invisible when it is focused. */
    if (REDUCED_MOTION.matches || document.hidden) return
    var bands = document.querySelectorAll('main .band')
    if (!bands.length || !('IntersectionObserver' in window)) return
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed')
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })
    bands.forEach(function (el) {
      el.classList.add('reveal')
      obs.observe(el)
    })
    /* Failsafe: whatever throttling did or did not fire, nothing stays hidden for long. */
    setTimeout(function () {
      bands.forEach(function (el) { el.classList.add('is-revealed') })
      obs.disconnect()
    }, 1500)
  }

  /* ---------- Go ---------------------------------------------------------- */

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  /* Masthead gains a border and a blur once the page has moved. Passive, and rAF-throttled so it
     cannot become the reason scrolling stutters on a mid-range phone. */
  function initHeaderScroll () {
    var header = document.querySelector('.site-header')
    if (!header) return
    var ticking = false
    function update () {
      ticking = false
      if (window.scrollY > 80) header.setAttribute('data-scrolled', '')
      else header.removeAttribute('data-scrolled')
    }
    window.addEventListener('scroll', function () {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }, { passive: true })
    update()
  }

  /* ---------- Reading mode (the lamp) --------------------------------------- */

  function initLamp () {
    var btn = document.querySelector('[data-lamp-toggle]')
    if (!btn) return
    function apply (on) {
      if (on) document.documentElement.setAttribute('data-lamp', '')
      else document.documentElement.removeAttribute('data-lamp')
      btn.setAttribute('aria-pressed', String(on))
      try { localStorage.setItem('rrg-lamp', on ? 'on' : 'off') } catch (e) { }
    }
    var stored
    try { stored = localStorage.getItem('rrg-lamp') } catch (e) { }
    if (stored === 'on') apply(true)
    btn.addEventListener('click', function () {
      apply(!document.documentElement.hasAttribute('data-lamp'))
    })
  }

  /* ---------- Return-visitor greeting ----------------------------------------- */

  function initWelcomeBack () {
    var hasFood, hasHeight
    try {
      hasFood = !!localStorage.getItem('rrg-food')
      hasHeight = !!localStorage.getItem('rrg-height')
    } catch (e) { return }
    if (!hasFood && !hasHeight) return
    try { if (sessionStorage.getItem('rrg-welcomed')) return } catch (e) { }
    var bar = document.createElement('div')
    bar.className = 'welcome-back'
    bar.setAttribute('role', 'status')
    bar.innerHTML = 'Welcome back — your list is still here. <a href="/tools/food-tracker/">Open your tracker</a>'
    var close = document.createElement('button')
    close.className = 'welcome-back__close'
    close.setAttribute('aria-label', 'Dismiss')
    close.textContent = '×'
    close.addEventListener('click', function () { bar.remove() })
    bar.appendChild(close)
    var main = document.querySelector('main')
    if (main && main.parentNode) main.parentNode.insertBefore(bar, main)
    try { sessionStorage.setItem('rrg-welcomed', '1') } catch (e) { }
  }

  /* ---------- Data saver --------------------------------------------------- */

  /* The hero loop is 0.6 MB, but a visitor on a metered plan who asked their browser to save
     data gets the poster and nothing else. The poster already sits beneath the video, so
     removing the element is the whole change — zero video bytes, same first paint. */
  function initDataSaver () {
    var conn = navigator.connection
    if (conn && conn.saveData) {
      var video = document.querySelector('.hero__video')
      if (video) video.parentNode.removeChild(video)
    }
  }

  ready(function () {
    initTheme()
    initNav()
    initHeaderScroll()
    initSortableTables()
    initSearch()
    initConnectivity()
    initLamp()
    initWelcomeBack()
    initDataSaver()
    initReveal()
    initServiceWorker()
  })
})()

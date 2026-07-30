/* =========================================================================
   Park map interactions.
   The SVG is fully useful with no JS at all — every marker is a real <a>, and
   the whole thing prints. This layer only adds pinch/scroll zoom, drag-pan,
   and highlight-on-hover between the map and the land list beside it.
   ========================================================================= */

(function () {
  'use strict'

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    var svg = document.querySelector('svg.parkmap')
    if (!svg) return

    var base = (svg.getAttribute('viewBox') || '0 0 1000 1000').split(/\s+/).map(Number)
    var view = { x: base[0], y: base[1], w: base[2], h: base[3] }
    var MIN_W = base[2] * 0.28
    var MAX_W = base[2]

    function apply () {
      svg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h)
      var zoomed = view.w < MAX_W - 1
      svg.classList.toggle('is-zoomed', zoomed)
      var reset = document.querySelector('[data-map-reset]')
      if (reset) reset.hidden = !zoomed
    }

    function clamp () {
      view.w = Math.max(MIN_W, Math.min(MAX_W, view.w))
      view.h = view.w * (base[3] / base[2])
      view.x = Math.max(base[0] - view.w * 0.1, Math.min(base[0] + base[2] - view.w + view.w * 0.1, view.x))
      view.y = Math.max(base[1] - view.h * 0.1, Math.min(base[1] + base[3] - view.h + view.h * 0.1, view.y))
    }

    function zoomAt (factor, clientX, clientY) {
      var rect = svg.getBoundingClientRect()
      var px = (clientX - rect.left) / rect.width
      var py = (clientY - rect.top) / rect.height
      var focusX = view.x + view.w * px
      var focusY = view.y + view.h * py
      view.w *= factor
      clamp()
      view.x = focusX - view.w * px
      view.y = focusY - view.h * py
      clamp()
      apply()
    }

    svg.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 4) return
      e.preventDefault()
      zoomAt(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY)
    }, { passive: false })

    var dragging = false
    var moved = 0
    var last = null

    svg.addEventListener('pointerdown', function (e) {
      if (view.w >= MAX_W - 1) return
      dragging = true
      moved = 0
      last = { x: e.clientX, y: e.clientY }
      svg.setPointerCapture(e.pointerId)
    })
    svg.addEventListener('pointermove', function (e) {
      if (!dragging || !last) return
      var rect = svg.getBoundingClientRect()
      var dx = (e.clientX - last.x) * (view.w / rect.width)
      var dy = (e.clientY - last.y) * (view.h / rect.height)
      moved += Math.abs(dx) + Math.abs(dy)
      view.x -= dx
      view.y -= dy
      last = { x: e.clientX, y: e.clientY }
      clamp(); apply()
    })
    function endDrag (e) {
      if (!dragging) return
      dragging = false
      last = null
      try { svg.releasePointerCapture(e.pointerId) } catch (err) { /* ignore */ }
    }
    svg.addEventListener('pointerup', endDrag)
    svg.addEventListener('pointercancel', endDrag)
    // Suppress the click that ends a drag so panning never navigates.
    svg.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation() }
      moved = 0
    }, true)

    document.querySelectorAll('[data-map-zoom]').forEach(function (button) {
      button.addEventListener('click', function () {
        var rect = svg.getBoundingClientRect()
        zoomAt(button.getAttribute('data-map-zoom') === 'in' ? 0.8 : 1.25,
          rect.left + rect.width / 2, rect.top + rect.height / 2)
      })
    })

    var reset = document.querySelector('[data-map-reset]')
    if (reset) {
      reset.addEventListener('click', function () {
        view = { x: base[0], y: base[1], w: base[2], h: base[3] }
        apply()
      })
    }

    // Cross-highlighting between the land list and the map polygons.
    document.querySelectorAll('[data-land-link]').forEach(function (link) {
      var slug = link.getAttribute('data-land-link')
      var shape = svg.querySelector('[data-land="' + slug + '"]')
      if (!shape) return
      function on () { shape.style.filter = 'brightness(.9) saturate(1.35)' }
      function off () { shape.style.filter = '' }
      link.addEventListener('mouseenter', on)
      link.addEventListener('mouseleave', off)
      link.addEventListener('focus', on)
      link.addEventListener('blur', off)
    })

    apply()
  })
})()

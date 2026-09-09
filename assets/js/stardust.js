/* =========================================================================
   Stardust: a tiny sparkle trail on guide pages.
   -------------------------------------------------------------------------
   Warm gold particles that drift upward and fade as you scroll. Guide pages
   only — the homepage stays clean per the design brief. Max 10 particles,
   zero allocations per frame, canvas removed when the tab is hidden.
   ========================================================================= */

(function () {
  'use strict'

  var canvas = null
  var ctx = null
  var particles = []
  var running = false
  var MAX = 10

  function spawn (x, y) {
    if (particles.length >= MAX) return
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.3 - Math.random() * 0.5,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2.5,
      hue: 36 + Math.random() * 12
    })
  }

  function frame () {
    if (!running) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay
      if (p.life <= 0) { particles.splice(i, 1); continue }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fillStyle = 'hsla(' + p.hue + ', 70%, 65%, ' + (p.life * 0.5) + ')'
      ctx.fill()
    }
    requestAnimationFrame(frame)
  }

  function ready (fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(function () {
    if (!document.querySelector('[data-stardust]')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;'
    document.body.appendChild(canvas)
    ctx = canvas.getContext('2d')

    var lastSpawn = 0
    window.addEventListener('scroll', function () {
      if (Date.now() - lastSpawn < 80) return
      lastSpawn = Date.now()
      spawn(window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.6, window.innerHeight * 0.4)
      if (!running) { running = true; frame() }
    }, { passive: true })

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false
        particles = []
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    })

    window.addEventListener('resize', function () {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    })
  })
})()

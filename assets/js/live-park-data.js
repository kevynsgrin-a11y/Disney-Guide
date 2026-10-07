// Live park data for the Universal/Hollywood Ride Guide network.
// Reads pre-warmed data from the TrueAPI ingest worker (ingest.oakandmain.dev)
// — no visitor page-load ever triggers an upstream API call (Phase 1 invariant).
//
// Data sources (all CORS-open, KV-only, refreshed on the */7 cron slot):
//   /data/queue-times/parks/<id>/queue_times.json  — current wait times
//   /data/themeparks-wiki/entity/<id>/live         — ride status + closures
//   /data/open-meteo-weather?latitude=..&longitude=.. — park-city weather
//
// Rendering: progressive enhancement. The page renders fully without this
// module; when data arrives, the [data-live-wait] and [data-live-weather]
// targets fill in. No data = the static editorial content stands alone.

(function () {
  'use strict'

  var INGEST = 'https://ingest.oakandmain.dev/data'

  // Park IDs match the ingest's QUEUE_TIMES_PARK_IDS allowlist (feeds.mjs).
  // Universal parks: 334 = Universal Studios Hollywood, 64/65/66 = Orlando.
  var UNIVERSAL_PARKS = {
    334: { name: 'Universal Studios Hollywood', short: 'USH' },
    64: { name: 'Universal Studios Florida', short: 'USF' },
    65: { name: 'Islands of Adventure', short: 'IOA' },
    66: { name: 'Epic Universe', short: 'EU' },
  }

  // Map the site's park slugs to Queue-Times park IDs (same source of truth
  // as the ingest's feeds.mjs QUEUE_TIMES_PARK_IDS — keep both in sync).
  var SLUG_TO_QT_ID = {
    'universal-studios-hollywood': 334,
    'universal-studios-florida': 64,
    'islands-of-adventure': 65,
    'epic-universe': 66,
  }

  // Park-city coordinates for the weather desk (matches OM_WEATHER_CITIES).
  var WEATHER_COORDS = {
    334: { latitude: 34.1, longitude: -118.33 },   // Universal City, CA
    64: { latitude: 28.47, longitude: -81.47 },    // Orlando, FL
    65: { latitude: 28.47, longitude: -81.47 },    // Orlando, FL
    66: { latitude: 28.47, longitude: -81.47 },    // Orlando, FL
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(function (envelope) {
        // The ingest wraps warm payloads: { api, data, fetchedAt, stale, ... }
        return envelope && typeof envelope === 'object' && 'data' in envelope
          ? envelope.data
          : envelope
      })
  }

  function formatWait(minutes) {
    if (minutes == null || isNaN(minutes)) return '—'
    if (minutes === 0) return 'Open'
    if (minutes >= 60) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm'
    return minutes + 'm'
  }

  function renderWaitTimes(container, parkId) {
    var park = UNIVERSAL_PARKS[parkId]
    if (!park) return

    fetchJson(INGEST + '/queue-times/parks/' + parkId + '/queue_times.json')
      .then(function (data) {
        if (!data || !Array.isArray(data.rides)) return

        var open = data.rides.filter(function (r) { return r.wait_time !== null && r.is_active })
        open.sort(function (a, b) { return (b.wait_time || 0) - (a.wait_time || 0) })

        var html = '<div class="live-wait-grid" role="region" aria-label="Current wait times for ' + park.name + '">'
        html += '<h3 class="live-wait-header">' + park.name + ' — Current Waits</h3>'
        html += '<p class="live-wait-meta"><span class="live-indicator" aria-hidden="true"></span>Live from Queue-Times · updates every 5 min</p>'
        html += '<ul class="live-wait-list">'

        open.slice(0, 10).forEach(function (ride) {
          html += '<li class="live-wait-item">'
          html += '<span class="ride-name">' + escapeHtml(ride.name) + '</span>'
          html += '<span class="wait-time wait-' + waitBand(ride.wait_time) + '">' + formatWait(ride.wait_time) + '</span>'
          html += '</li>'
        })

        html += '</ul>'
        html += '<p class="live-wait-footer">' + open.length + ' attractions operating</p>'
        html += '</div>'

        container.innerHTML = html
        container.setAttribute('data-live-status', 'loaded')
      })
      .catch(function (err) {
        container.setAttribute('data-live-status', 'error')
        // Silent: the static editorial content is the fallback
        if (window.console && console.log) console.log('live-wait: ' + err.message)
      })
  }

  function renderWeather(container, parkId) {
    var coords = WEATHER_COORDS[parkId]
    if (!coords) return

    var params = new URLSearchParams({
      latitude: coords.latitude,
      longitude: coords.longitude,
      hourly: 'temperature_2m,precipitation_probability,weathercode',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min',
      forecast_days: 1,
      timezone: 'auto',
    })

    fetchJson(INGEST + '/open-meteo-weather?' + params.toString())
      .then(function (data) {
        if (!data || !data.daily || !data.daily.time) return

        var code = data.daily.weathercode ? data.daily.weathercode[0] : null
        var max = Math.round(data.daily.temperature_2m_max ? data.daily.temperature_2m_max[0] : 0)
        var min = Math.round(data.daily.temperature_2m_min ? data.daily.temperature_2m_min[0] : 0)
        var desc = weatherDescription(code)

        var html = '<div class="live-weather" role="region" aria-label="Today\'s weather at the parks">'
        html += '<span class="weather-icon" aria-hidden="true">' + weatherIcon(code) + '</span>'
        html += '<span class="weather-desc">' + desc + '</span>'
        html += '<span class="weather-range">' + min + '°–' + max + '°</span>'
        html += '</div>'

        container.innerHTML = html
        container.setAttribute('data-live-status', 'loaded')
      })
      .catch(function (err) {
        container.setAttribute('data-live-status', 'error')
      })
  }

  function waitBand(minutes) {
    if (minutes == null) return 'unknown'
    if (minutes <= 20) return 'low'
    if (minutes <= 45) return 'medium'
    return 'high'
  }

  function weatherDescription(code) {
    if (code == null) return 'Weather unavailable'
    if (code === 0) return 'Clear sky'
    if (code <= 3) return 'Partly cloudy'
    if (code <= 48) return 'Foggy'
    if (code <= 67) return 'Rain'
    if (code <= 77) return 'Snow'
    if (code <= 82) return 'Rain showers'
    if (code <= 86) return 'Snow showers'
    return 'Thunderstorm'
  }

  function weatherIcon(code) {
    if (code == null) return '—'
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '🌨️'
    return '⛈️'
  }

  function escapeHtml(s) {
    if (!s) return ''
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  // Progressive enhancement: scan for data-live-wait and data-live-weather
  // targets and fill them. Accepts either a Queue-Times park ID (integer)
  // or a park slug string. No targets = no fetches = zero cost.
  function init() {
    var waitTargets = document.querySelectorAll('[data-live-wait]')
    waitTargets.forEach(function (el) {
      var raw = el.getAttribute('data-live-wait')
      var parkId = parseInt(raw, 10)
      if (!parkId && SLUG_TO_QT_ID[raw]) parkId = SLUG_TO_QT_ID[raw]
      if (UNIVERSAL_PARKS[parkId]) renderWaitTimes(el, parkId)
    })

    var weatherTargets = document.querySelectorAll('[data-live-weather]')
    weatherTargets.forEach(function (el) {
      var raw = el.getAttribute('data-live-weather')
      var parkId = parseInt(raw, 10)
      if (!parkId && SLUG_TO_QT_ID[raw]) parkId = SLUG_TO_QT_ID[raw]
      if (WEATHER_COORDS[parkId]) renderWeather(el, parkId)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()

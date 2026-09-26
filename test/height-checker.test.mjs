import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { loadData } from '../src/lib/data.mjs'
import { heightCheckerPage } from '../src/pages/tools.mjs'

const root = new URL('..', import.meta.url)

test('height checker never treats an unverified minimum as rider eligibility', async () => {
  const data = await loadData('coasterguide')
  const page = heightCheckerPage(data).html
  const payload = JSON.parse(page.match(/<script type="application\/json" id="height-data">([\s\S]*?)<\/script>/)[1])
  const sanDiego = payload.parks.find((park) => park.name === 'SeaWorld San Diego')

  assert.equal(sanDiego.rides.find((ride) => ride.n === 'Manta').h, 48)
  assert.equal(sanDiego.rides.find((ride) => ride.n === 'Journey to Atlantis').h, 42)
  assert.equal(sanDiego.rides.find((ride) => ride.n === 'Arctic Rescue').h, 48)
  assert.equal(sanDiego.rides.find((ride) => ride.n === 'Tidal Twister').h, null)

  const listeners = {}
  const attrs = {}
  const slider = {
    value: '40', min: '28', max: '56',
    addEventListener (name, handler) { listeners[name] = handler },
    getAttribute (name) { return attrs[name] ?? null },
    setAttribute (name, value) { attrs[name] = value },
  }
  const result = { innerHTML: '' }
  const counts = {
    '[data-height-can]': { textContent: '' },
    '[data-height-cant]': { textContent: '' },
    '[data-height-unknown]': { textContent: '' },
    '[data-height-results]': result,
    '[data-height-slider]': slider,
  }
  const document = {
    readyState: 'complete',
    getElementById (id) { return id === 'height-data' ? { textContent: JSON.stringify(payload) } : null },
    querySelector (selector) { return counts[selector] ?? null },
  }
  const storage = { getItem () { return null }, setItem () {} }
  const source = await readFile(new URL('./assets/js/height-checker.js', root), 'utf8')
  new Function('window', 'document', 'localStorage', source)(
    { matchMedia: () => ({ matches: true }) }, document, storage,
  )

  function section () {
    const marker = `<h3><a href="${sanDiego.url}">SeaWorld San Diego</a>`
    const start = result.innerHTML.indexOf(marker)
    assert.ok(start >= 0)
    return result.innerHTML.slice(start, result.innerHTML.indexOf('</section>', start))
  }
  function move (height) {
    slider.value = String(height)
    listeners.input()
  }

  let html = section()
  assert.match(html, /0 verified rideable · 1 height unverified/)
  assert.match(html, /data-blocked data-need="42">Journey to Atlantis/)
  assert.match(html, /data-blocked data-need="48">Manta/)
  assert.match(html, /data-blocked data-need="48">Arctic Rescue/)
  assert.match(html, /data-unverified>Tidal Twister · height unverified/)
  assert.equal(counts['[data-height-unknown]'].textContent > 0, true)

  move(42)
  html = section()
  assert.match(html, /1 verified rideable · 1 height unverified/)
  assert.doesNotMatch(html, /data-blocked[^>]*>Journey to Atlantis/)
  assert.match(html, /data-blocked data-need="48">Manta/)

  move(48)
  html = section()
  assert.match(html, /3 verified rideable · 1 height unverified/)
  assert.doesNotMatch(html, /data-blocked[^>]*>(?:Manta|Arctic Rescue)/)
  assert.match(html, /data-unverified>Tidal Twister · height unverified/)
})

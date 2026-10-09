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
  assert.match(html, /0 height conditions met · 1 need checking/)
  assert.match(html, /data-blocked data-need="42">Journey to Atlantis/)
  assert.match(html, /data-blocked data-need="48">Manta/)
  assert.match(html, /data-blocked data-need="48">Arctic Rescue/)
  assert.match(html, /data-unverified>Tidal Twister · height unverified/)
  assert.equal(counts['[data-height-unknown]'].textContent > 0, true)

  move(42)
  html = section()
  assert.match(html, /0 height conditions met · 2 need checking/)
  assert.match(html, /data-unverified>Journey to Atlantis · check rider restrictions:/)
  assert.doesNotMatch(html, /data-blocked[^>]*>Journey to Atlantis/)
  assert.match(html, /data-blocked data-need="48">Manta/)

  move(48)
  html = section()
  assert.match(html, /0 height conditions met · 4 need checking/)
  assert.match(html, /data-unverified>Manta · check rider restrictions:/)
  assert.match(html, /data-unverified>Arctic Rescue · check rider restrictions:/)
  assert.doesNotMatch(html, /data-blocked[^>]*>(?:Manta|Arctic Rescue)/)
  assert.match(html, /data-unverified>Tidal Twister · height unverified/)
})

test('near-miss labels remove float noise while every positive shortfall remains blocked', async () => {
  const page = heightCheckerPage(await loadData('coasterguide')).html
  const payload = JSON.parse(page.match(/<script type="application\/json" id="height-data">([\s\S]*?)<\/script>/)[1])
  const magicMountain = payload.parks.find((park) => park.name === 'Six Flags Magic Mountain')
  const west = magicMountain.rides.find((ride) => ride.n === 'West Coast Racers')
  const listeners = {}
  const slider = {
    value: '53.9', min: '28', max: '84',
    addEventListener (name, handler) { listeners[name] = handler },
    getAttribute () { return null }, setAttribute () {},
  }
  const result = { innerHTML: '' }
  const cleared = { textContent: '' }
  const elements = { '[data-height-slider]': slider, '[data-height-results]': result, '[data-height-can]': cleared }
  const document = {
    readyState: 'complete',
    getElementById () { return { textContent: JSON.stringify({ parks: [{ ...magicMountain, rides: [west] }] }) } },
    querySelector (selector) { return elements[selector] ?? null },
  }
  let storedHeight
  const source = await readFile(new URL('./assets/js/height-checker.js', root), 'utf8')
  new Function('window', 'document', 'localStorage', source)(
    { matchMedia: () => ({ matches: true }) }, document,
    { getItem () { return null }, setItem (_, value) { storedHeight = value } },
  )
  assert.match(result.innerHTML, /nearmiss__gap">\+0\.1 in<\/span>/)
  assert.doesNotMatch(result.innerHTML, /0\.100000000000/)
  for (const inches of [53.999, 53.99999999999]) {
    slider.value = String(inches)
    listeners.input()
    assert.match(result.innerHTML, /nearmiss__gap">&lt;0\.01 in<\/span>/)
    assert.match(result.innerHTML, /data-blocked data-need="54">West Coast Racers/)
    assert.doesNotMatch(result.innerHTML, /nearmiss__gap">\+0(?: in)?<\/span>/)
    assert.equal(cleared.textContent, '0')
    assert.equal(Number(storedHeight), inches, 'formatting never changes the saved canonical inches')
  }
})

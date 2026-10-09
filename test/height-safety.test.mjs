import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadData } from '../src/lib/data.mjs'
import { height, heightWords } from '../src/lib/format.mjs'
import { isKnownHeight, heightStatus, eligibilityPayload } from '../src/lib/eligibility.mjs'
import { heightCheckerPage, riderDataPayload, careerLadderPage, dayBlueprintPage } from '../src/pages/tools.mjs'

async function engine (file, name) {
  const source = await readFile(new URL(`../assets/js/${file}.js`, import.meta.url), 'utf8')
  const storage = { getItem () { return null }, setItem () {} }
  return new Function('window', 'localStorage', source.replace(/if \(typeof document[\s\S]*$/, `return ${name}`))({}, storage)
}

const riders = await engine('rider-profiles', 'RiderProfiles')
const career = await engine('career-ladder', 'CareerLadder')

test('unknown minima stay unknown; only a verified numerical zero has no minimum', () => {
  for (const minimum of [null, undefined, NaN, Infinity, -1, '', '48']) {
    assert.equal(isKnownHeight(minimum), false)
    assert.equal(heightStatus(54, minimum), 'unknown')
    assert.equal(riders.math.statusFor(54, minimum), 'unknown')
    assert.equal(career._internals.statusFor(54, minimum), 'unknown')
    assert.equal(height(minimum), 'Height unverified')
    assert.equal(heightWords(minimum), 'height unverified')
  }
  assert.equal(heightStatus(24, 0), 'now')
  assert.equal(riders.math.statusFor(24, 0), 'now')
  assert.equal(career._internals.statusFor(24, 0), 'now')
  assert.equal(height(0), 'No minimum height')
  assert.equal(heightStatus(NaN, 48), 'unknown')
  assert.equal(riders.math.projectToHeight(null, 48, { low: 2, high: 3 }).now, false)
})

test('verified maxima, companion requirements, and other rider conditions are independent of the minimum', () => {
  const cases = [
    [{ h: 42, max: 76 }, 76, {}, 'now'],
    [{ h: 42, max: 76 }, 76.5, {}, 'over'],
    [{ h: 42, accompaniedBelow: 48 }, 42, {}, 'companion'],
    [{ h: 42, accompaniedBelow: 48 }, 42, { accompanied: true }, 'now'],
    [{ h: 42, accompaniedBelow: 48 }, 48, {}, 'now'],
    [{ h: 42, accompaniedBelow: 48 }, 41, { accompanied: true }, 'near'],
    [{ h: 42, restrictions: ['Restraint must close correctly'] }, 54, {}, 'review'],
    [{ h: 42, restrictions: ['Restraint must close correctly'] }, 54, { restrictionsConfirmed: true }, 'now'],
    [{ h: 42, s: 'closed' }, 54, { accompanied: true, restrictionsConfirmed: true }, 'closed'],
  ]
  for (const [ride, inches, confirmations, expected] of cases) {
    assert.equal(heightStatus(inches, ride, confirmations), expected)
    assert.equal(riders.math.statusFor(inches, ride, confirmations), expected)
    assert.equal(career._internals.statusFor(inches, ride, confirmations), expected)
  }
  const legacy = { heightIn: 42, heightNote: 'Under 48 inches requires a supervising companion.' }
  assert.equal(heightStatus(54, legacy), 'review', 'legacy prose is reviewed without inferring a numerical rule')
  assert.equal(heightStatus(54, eligibilityPayload(legacy)), 'review')
  assert.deepEqual(eligibilityPayload({ ...legacy, riderRestrictions: [] }).restrictions, [])
})

test('retired credits remain historical while current summaries and ladders exclude them', () => {
  const coasters = [
    { n: 'Current', h: 48, p: 'Park', u: '/park/', s: 'open' },
    { n: 'Unknown', h: null, p: 'Park', u: '/park/' },
    { n: 'Companion', h: 42, accompaniedBelow: 54, p: 'Park', u: '/park/' },
    { n: 'Too tall', h: 42, max: 47, p: 'Park', u: '/park/' },
    { n: 'Retired', h: 48, p: 'Park', u: '/park/', s: 'closed' },
  ]
  const summary = career._internals.summaryFor(48, coasters)
  assert.equal(summary.now, 1)
  assert.equal(summary.current, 4)
  assert.equal(summary.unverified, 1)
  assert.equal(summary.checking, 1)
  assert.equal(summary.over, 1)
  assert.equal(summary.total, 5, 'credit history can include retired attractions')
  const ladder = career._internals.rungsFor(coasters)
  assert.deepEqual(ladder.historical.map((ride) => ride.n), ['Retired'])
  assert.equal(ladder.rungs.flatMap((rung) => rung.items).some((ride) => ride.n === 'Retired'), false)
  const passport = riders._internals.parkSummary({ heightIn: 48 }, { attractions: coasters })[0]
  assert.equal(passport.now, 1)
  assert.equal(passport.over, 1)
  assert.equal(passport.companion, 1)
  assert.equal(passport.unknown, 1)
  assert.equal(riders._internals.nearestMiss({ heightIn: 46 }, [coasters[4]]), null)
  assert.equal(riders._internals.ladderFor({ heightIn: 46 }, { attractions: [coasters[4]] }).length, 0)
  const board = { innerHTML: '' }
  career._internals.renderLadder(board, { coasters, myRidersUrl: '/tools/my-riders/' }, { heightIn: 48 })
  const historyStart = board.innerHTML.indexOf('Historical credits')
  assert.ok(historyStart > 0)
  assert.doesNotMatch(board.innerHTML.slice(0, historyStart), /Retired/)
  assert.match(board.innerHTML.slice(historyStart), /Retired/)
  assert.match(board.innerHTML, /Restraint|supervising companion required below 54 in/)
})

test('saved-rider badges read all independent height conditions and preserve missing data', () => {
  function row (attrs) {
    const cell = { html: '', getAttribute (key) { return attrs[key] ?? null }, insertAdjacentHTML (_, content) { this.html += content } }
    return { cell, querySelector () { return cell }, classList: { remove () {}, add () {} } }
  }
  const rows = [
    row({ 'data-value': '' }),
    row({ 'data-value': '0' }),
    row({ 'data-value': '42', 'data-height-max': '47' }),
    row({ 'data-value': '42', 'data-accompanied-below': '54' }),
    row({ 'data-value': '42', 'data-rider-restrictions': '["Restraint must close correctly"]' }),
    row({ 'data-value': '42', 'data-status': 'closed' }),
  ]
  riders._internals.decorateTable({ querySelectorAll () { return rows } }, { name: 'Maya', heightIn: 48 })
  assert.match(rows[0].cell.html, /Height unverified/)
  assert.match(rows[1].cell.html, /Height conditions met/)
  assert.match(rows[2].cell.html, /Exceeds maximum height/)
  assert.match(rows[3].cell.html, /Supervising companion required/)
  assert.match(rows[4].cell.html, /Check rider restrictions/)
  assert.match(rows[5].cell.html, /Not currently operating/)
})

function payload (page, id) {
  return JSON.parse(page.html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)<\\/script>`))[1])
}

test('corrected Magic Mountain minima and retired exclusions reach every current tool', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  assert.equal(park.attractionBySlug.get('goldrusher').heightIn, 48)
  assert.equal(park.attractionBySlug.get('west-coast-racers').heightIn, 54)
  assert.equal(park.attractionBySlug.get('ninja').heightIn, 42)
  assert.equal(park.attractionBySlug.get('full-throttle').heightIn, 54)
  assert.equal(park.stats.scope, 'operating')
  assert.equal(park.stats.attractionCount, park.attractions.filter((ride) => ride.isOpen).length)
  assert.equal(park.stats.ridesWithHeightRequirements, park.heightAttractions.length)
  for (const collection of [park.heightAttractions, park.headliners, riderDataPayload(data).attractions]) {
    assert.equal(collection.some((ride) => ['x2', 'superman-escape-from-krypton'].includes(ride.slug) || /^(X2|SUPERMAN: Escape from Krypton)$/i.test(ride.n || '')), false)
  }
  const checker = payload(heightCheckerPage(data), 'height-data').parks.find((entry) => entry.name === park.name).rides
  const gold = checker.find((ride) => ride.n === 'Gold Rusher')
  const west = checker.find((ride) => ride.n === 'West Coast Racers')
  assert.equal(heightStatus(47, gold), 'near')
  assert.equal(heightStatus(48, gold), 'review', 'meeting the minimum still requires the official nonheight rule check')
  assert.equal(heightStatus(48, gold, { restrictionsConfirmed: true }), 'now')
  assert.equal(heightStatus(48, west), 'later')
  assert.equal(heightStatus(54, west), 'review')
  assert.equal(heightStatus(54, west, { restrictionsConfirmed: true }), 'now')
  for (const name of ['Gold Rusher', 'West Coast Racers', 'Ninja', 'Full Throttle']) {
    const ride = checker.find((entry) => entry.n === name)
    assert.ok(ride.restrictions.length, `${name} preserves separately sourced rider restrictions`)
    assert.equal(heightStatus(ride.h, ride), 'review')
    assert.equal(heightStatus(ride.h, ride, { restrictionsConfirmed: true }), 'now')
  }
  assert.ok(west.restrictions.some((rule) => /Diabetes/i.test(rule)), 'the guide’s separate warning reaches the tool payload')
  assert.equal(checker.some((ride) => /^(X2|SUPERMAN: Escape from Krypton)$/i.test(ride.n)), false)
  const history = payload(careerLadderPage(data), 'career-data').coasters
  for (const name of ['X2', 'SUPERMAN: Escape from Krypton']) {
    const historical = history.find((ride) => ride.n.toLowerCase() === name.toLowerCase())
    assert.ok(historical, `${name} retains historical credit history`)
    assert.equal(heightStatus(84, historical), 'closed')
  }
  const blueprint = payload(dayBlueprintPage(data), 'blueprint-data').parks.find((entry) => entry.name === park.name)
  assert.doesNotMatch(JSON.stringify(blueprint.plans), /\bX2\b|Superman/i)
  const universal = await loadData('universal')
  const pteranodon = universal.parkBySlug.get('islands-of-adventure').attractionBySlug.get('pteranodon-flyers')
  assert.match(pteranodon.heightNote, /maximum|accompan/i)
  assert.equal(heightStatus(60, eligibilityPayload(pteranodon)), 'review', 'legacy companion and maximum prose cannot clear a rider without checking the condition')
})

test('Height Checker excludes retirement, respects maximum boundaries and never clears unresolved conditions', async () => {
  const rides = [
    { n: 'Unrestricted verified', h: 0 },
    { n: 'Unknown', h: null },
    { n: 'Invalid', h: '0' },
    { n: 'Finite check', h: Infinity },
    { n: 'Maximum', h: 42, max: 48 },
    { n: 'Companion', h: 42, accompaniedBelow: 54 },
    { n: 'Restraint', h: 42, restrictions: ['Restraint must close correctly'] },
    { n: 'Retired', h: 0, s: 'closed' },
  ]
  const listeners = {}
  const attrs = {}
  const slider = {
    value: '48', min: '28', max: '84',
    addEventListener (name, fn) { listeners[name] = fn },
    getAttribute (key) { return attrs[key] ?? null },
    setAttribute (key, value) { attrs[key] = value },
  }
  const result = { innerHTML: '' }
  const counts = {
    '[data-height-slider]': slider, '[data-height-results]': result,
    '[data-height-can]': { textContent: '' }, '[data-height-cant]': { textContent: '' }, '[data-height-unknown]': { textContent: '' },
  }
  const document = {
    readyState: 'complete',
    getElementById () { return { textContent: JSON.stringify({ parks: [{ name: 'Park', url: '/park/', rides }] }) } },
    querySelector (key) { return counts[key] ?? null },
  }
  const source = await readFile(new URL('../assets/js/height-checker.js', import.meta.url), 'utf8')
  new Function('window', 'document', 'localStorage', source)({ matchMedia: () => ({ matches: true }) }, document, { getItem () { return null }, setItem () {} })
  assert.equal(counts['[data-height-can]'].textContent, '2', 'minimum zero and exact maximum boundary qualify for the height screening')
  assert.equal(counts['[data-height-unknown]'].textContent, '5')
  assert.doesNotMatch(result.innerHTML, /Retired|Any height|verified rideable/)
  assert.match(result.innerHTML, /Unknown · height unverified/)
  assert.match(result.innerHTML, /Companion · supervising companion required below 54 in/)
  assert.match(result.innerHTML, /Restraint · check rider restrictions: Restraint must close correctly/)
  slider.value = '49'
  listeners.input()
  assert.equal(counts['[data-height-can]'].textContent, '1')
  assert.equal(counts['[data-height-cant]'].textContent, '1')
  assert.match(result.innerHTML, /Maximum · exceeds 48 in maximum/)
})

test('saving from the metric Height Checker preserves canonical inches in My Riders', async () => {
  const listeners = {}
  const slider = {
    value: '40', min: '28', max: '56',
    addEventListener (name, fn) { listeners[name] = fn },
    getAttribute () { return null }, setAttribute () {},
  }
  const value = { textContent: '' }
  const unit = { addEventListener (_, fn) { listeners.toggle = fn }, setAttribute () {} }
  let save
  const hook = { appendChild (button) { save = button } }
  const elements = {
    '[data-height-slider]': slider, '[data-height-value]': value,
    '[data-height-unit]': unit, '[data-save-rider-hook]': hook,
    '[data-height-results]': { innerHTML: '' },
  }
  const document = {
    readyState: 'complete',
    querySelector (selector) { return elements[selector] ?? null },
    getElementById (id) {
      return id === 'height-data'
        ? { textContent: JSON.stringify({ parks: [{ name: 'Park', url: '/park/', rides: [{ n: 'Unknown', h: null }] }] }) }
        : null
    },
    createElement () { return { addEventListener (_, fn) { listeners.save = fn } } },
  }
  const saved = new Map()
  const storage = { getItem (key) { return saved.get(key) ?? null }, setItem (key, content) { saved.set(key, content) } }
  const window = { matchMedia: () => ({ matches: true }), prompt: () => 'Maya' }
  const checkerSource = await readFile(new URL('../assets/js/height-checker.js', import.meta.url), 'utf8')
  const riderSource = await readFile(new URL('../assets/js/rider-profiles.js', import.meta.url), 'utf8')
  new Function('window', 'document', 'localStorage', checkerSource)(window, document, storage)
  const passport = new Function('window', 'document', 'localStorage', `${riderSource}\nreturn RiderProfiles`)(window, document, storage)
  assert.equal(value.textContent, '40')
  listeners.toggle()
  assert.equal(value.textContent, '102', 'the display switches to centimetres')
  listeners.save()
  assert.equal(passport.store.all()[0].heightIn, 40, 'the saved measurement stays in inches')
  assert.equal(passport.math.statusFor(passport.store.all()[0].heightIn, 48), 'later')
  assert.equal(save.disabled, true)
})

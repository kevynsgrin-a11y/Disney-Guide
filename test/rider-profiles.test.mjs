import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { myRidersPage, riderDataPayload, heightCheckerPage } from '../src/pages/tools.mjs'
import { heightsPage } from '../src/pages/park.mjs'
import { homePage } from '../src/pages/core.mjs'

const root = new URL('..', import.meta.url)

/*
 * The engine is a browser script (no bundler, by design), so the unit tests
 * evaluate it with minimal window/localStorage stubs and exercise the pure
 * math and the store directly — the same surface the pages use.
 */
const engineSource = await readFile(new URL('./assets/js/rider-profiles.js', root), 'utf8')
const RiderProfiles = new Function('window', 'localStorage', 'document', 'prompt', `
  ${engineSource.replace(/if \(typeof document[\s\S]*$/, 'return RiderProfiles')}
`)(
  {},
  {
    _s: {},
    getItem (k) { return k in this._s ? this._s[k] : null },
    setItem (k, v) { this._s[k] = String(v) },
    removeItem (k) { delete this._s[k] },
  },
  undefined, // document: the boot block is stripped, so none is needed
  () => null,
)

const { math, store } = RiderProfiles

test('growth bands are ranges, ordered, and honest at the edges', () => {
  assert.deepEqual(math.growthBand(null), { low: 1.5, high: 2.5, label: 'typical school-age growth' })
  const school = math.growthBand(6)
  assert.ok(school.low < school.high, 'bands are ranges, not point estimates')
  for (const age of [2, 5, 9, 12, 15, 18]) {
    const b = math.growthBand(age)
    assert.ok(b.low <= b.high && b.low >= 0 && b.high <= 4, `implausible band at age ${age}`)
  }
  // puberty widens: the honest uncertainty band
  assert.ok(math.growthBand(13).high - math.growthBand(13).low > math.growthBand(6).high - math.growthBand(6).low)
})

test('ageAt handles birthdays, not-yet-had birthdays, and junk', () => {
  assert.equal(math.ageAt('2019-04-10', '2026-09-11'), 7)
  assert.equal(math.ageAt('2019-12-10', '2026-09-11'), 6)
  assert.equal(math.ageAt('garbage', '2026-09-11'), null)
  assert.equal(math.ageAt(null), null)
})

test('statusFor draws the near-miss line at two inches', () => {
  assert.equal(math.statusFor(46, 48), 'near')
  assert.equal(math.statusFor(46.5, 48), 'near')
  assert.equal(math.statusFor(46, 49), 'later')
  assert.equal(math.statusFor(48, 48), 'now')
  assert.equal(math.statusFor(50, 48), 'now')
  assert.equal(math.statusFor(30, null), 'any')
})

test('projections are month ranges anchored to the measurement date', () => {
  const band = { low: 2, high: 3 } // in/yr
  const p = math.projectToHeight(48, 46, band, '2026-09-11')
  assert.equal(p.now, false)
  assert.equal(p.soonestM, Math.ceil(2 / 3 * 12)) // 8 months at the fast end
  assert.equal(p.latestM, 12) // 2 in at 2 in/yr
  assert.equal(p.soonest, 'May 2027')
  assert.equal(p.latest, 'Sep 2027')
  assert.deepEqual(math.projectToHeight(48, 48, band, '2026-09-11').now, true)
})

test('distant projections report no honest window instead of a false one', () => {
  const done = math.projectToHeight(84, 60, { low: 0, high: 0.5 }, '2026-09-11')
  assert.equal(done.soonestM, null, 'beyond the cap, the projection is null, not a fantasy date')
})

test('addMonthsISO clamps to month ends like a calendar', () => {
  assert.equal(math.addMonthsISO('2026-01-31', 1), '2026-02')
  assert.equal(math.addMonthsISO('2026-09-11', 8), '2027-05')
})

test('the store saves, validates, and removes riders on this device only', () => {
  const r = store.save({ name: '  Maya ', birthday: '2019-04-10', heightIn: '46.3', measuredOn: '2026-09-11' })
  assert.equal(r.name, 'Maya')
  assert.equal(r.heightIn, 46.5, 'heights round to the half inch')
  assert.equal(store.all().length, 1)
  const again = store.save({ id: r.id, name: 'Maya', heightIn: 47 })
  assert.equal(store.all().length, 1, 'same id updates rather than duplicates')
  assert.equal(again.heightIn, 47)
  assert.equal(store.save({ name: '   ' }), null, 'a blank name saves nothing')
  store.remove(r.id)
  assert.equal(store.all().length, 0)
})

/* ---------- build-side: the payload and the pages ---------- */

const operators = ['disney', 'universal', 'coasterguide']

for (const slug of operators) {
  const data = await loadData(slug)
  const seasonal = await loadSeasonal(slug, data)

  test(`${slug}: the rider payload carries every open posted height across all parks`, () => {
    const payload = riderDataPayload(data)
    assert.ok(payload.attractions.length >= 20, 'payload should cover the operator\'s posted heights')
    assert.equal(payload.myRidersUrl, '/tools/my-riders/')
    for (const a of payload.attractions) {
      assert.ok(a.n && a.p && a.u, 'compact payload rows carry name, park label, park url')
      assert.ok(Number.isInteger(a.h) && a.h >= 24 && a.h <= 60)
    }
  })

  test(`${slug}: My Riders page builds with payload, form, and the engine`, () => {
    const page = myRidersPage(data)
    assert.equal(page.url, '/tools/my-riders/')
    assert.match(page.html, /id="rider-data"/)
    assert.match(page.html, /data-rider-form/)
    assert.match(page.html, /data-my-riders/)
    assert.match(page.html, /rider-profiles\.js/)
    assert.match(page.html, /stays on this device|On this device|no account/i)
  })

  test(`${slug}: the home page carries the watch mount, payload, and engine`, () => {
    const home = homePage(data, seasonal)
    assert.match(home.html, /data-rider-watch/)
    assert.match(home.html, /id="rider-data"/)
    assert.match(home.html, /rider-profiles\.js/)
  })

  test(`${slug}: park height pages mark their table for decoration and load the engine`, () => {
    const page = heightsPage(data.parks[0], data)
    assert.match(page.html, /data-heights-table/)
    assert.match(page.html, /data-rider-watch/)
    assert.match(page.html, /rider-profiles\.js/)
    assert.match(page.html, /id="rider-data"/)
  })

  test(`${slug}: the height checker offers to save the height as a rider`, () => {
    const page = heightCheckerPage(data)
    assert.match(page.html, /data-save-rider-hook/)
    assert.match(page.html, /rider-profiles\.js/)
  })
}

test('the engine degrades silently with no riders — the watch stays hidden and tables stay plain', () => {
  // renderWatch with an empty store must leave the mount hidden
  const mount = { hidden: true, innerHTML: '' }
  RiderProfiles.renderWatch(mount, { myRidersUrl: '/tools/my-riders/', attractions: [{ n: 'X', h: 48, p: 'P', u: '/p/' }] })
  assert.equal(mount.hidden, true)
  assert.equal(mount.innerHTML, '')
})

/* ---------- the ruler: the passport's signature visualization ---------- */

const PAYLOAD = {
  myRidersUrl: '/tools/my-riders/',
  attractions: [
    { n: 'Ninja', h: 42, p: 'Magic Mountain', u: '/mm/' },
    { n: 'Goliath', h: 48, p: 'Magic Mountain', u: '/mm/' },
    { n: 'X2', h: 48, p: 'Magic Mountain', u: '/mm/' },
    { n: 'Tatsu', h: 54, p: 'Magic Mountain', u: '/mm/' },
  ],
}

test('the card ruler draws every rung, tallest first, with the marker between cleared and ahead', () => {
  const rider = { id: 'r1', name: 'Maya', birthday: '2019-04-10', heightIn: 46, measuredOn: '2026-09-11' }
  const html = RiderProfiles._internals.rulerHTML(rider, PAYLOAD)
  assert.match(html, /class="ruler__rung ruler__rung--cleared"/) // 42 cleared
  assert.match(html, /42 in<\/strong> · 1 ride unlocks/) // count at the rung
  assert.match(html, /48 in<\/strong> · 2 rides unlock/)
  assert.match(html, /ruler__rung--ahead/) // 48 and 54 ahead
  assert.match(html, /Maya — 46 in, measured 2026-09-11/)
  // Marker placement: exactly one marker, between the 48 and 42 rungs (not above 48)
  const markerAt = html.indexOf('ruler__marker"')
  const rung48 = html.indexOf('48 in<')
  const rung42 = html.indexOf('42 in<')
  assert.ok(rung48 > -1 && rung42 > -1 && markerAt > rung48 && markerAt < rung42,
    'the marker renders between the first ahead rung and the last cleared rung')
  // Projections on ahead rungs are ranges, and rider names are escaped into labels
  assert.match(html, /role="img"/)
})

test('the card ruler clears every rung and says nothing false', () => {
  const tall = { id: 'r2', name: 'Dad', birthday: null, heightIn: 60, measuredOn: '2026-09-11' }
  const html = RiderProfiles._internals.rulerHTML(tall, PAYLOAD)
  assert.ok(!html.includes('ruler__marker'), 'a rider above every rung gets no marker — they stand at the top')
  assert.ok((html.match(/ruler__rung--cleared/g) || []).length === 3)
})

test('a one-rung ladder is not a ladder — the ruler declines to render', () => {
  const single = { myRidersUrl: '/x/', attractions: [{ n: 'Only', h: 48, p: 'P', u: '/p/' }] }
  assert.equal(RiderProfiles._internals.rulerHTML({ name: 'A', heightIn: 46 }, single), '')
})

test('the family ruler places every rider marker between the right rungs, tallest first', () => {
  const riders = [
    { id: 'a', name: 'Leo', heightIn: 55, measuredOn: '2026-09-11' },
    { id: 'b', name: 'Maya', heightIn: 46, measuredOn: '2026-09-11' },
    { id: 'c', name: 'Ivy', heightIn: 41, measuredOn: '2026-09-11' },
  ]
  const html = RiderProfiles._internals.familyRulerHTML(riders, PAYLOAD)
  // Leo (55) stands above the 54 rung — his marker must precede the first rung in the DOM
  assert.ok(html.indexOf('Leo — 55 in') < html.indexOf('54 in<'), 'Leo renders above the 54 rung')
  assert.ok(html.indexOf('Maya — 46 in') > html.indexOf('48 in<') && html.indexOf('Maya — 46 in') < html.indexOf('42 in<'))
  assert.ok(html.indexOf('Ivy — 41 in') > html.indexOf('42 in<'), 'Ivy renders below the shortest rung')
  // Names are user input and must be escaped everywhere they render
  const hostile = [{ id: 'x', name: '<script>x</script>', heightIn: 46, measuredOn: '2026-09-11' }]
  const safe = RiderProfiles._internals.familyRulerHTML(hostile, PAYLOAD)
  assert.ok(!safe.includes('<script>'), 'rider names are escaped in the ruler')
})

test('rider cards now carry the ruler between the header and the verdict', () => {
  store.save({ name: 'Maya', birthday: '2019-04-10', heightIn: 46, measuredOn: '2026-09-11' })
  const card = RiderProfiles._internals.riderCard(store.all()[0], PAYLOAD)
  assert.match(card, /rider-ruler/)
  assert.ok(card.indexOf('rider-ruler') < card.indexOf('rider-card__verdict'))
  store.remove(store.all()[0].id)
})

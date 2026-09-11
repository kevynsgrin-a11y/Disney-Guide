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

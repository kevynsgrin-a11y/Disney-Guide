import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import {
  dayBlueprintPage, roadTripPage, expressRoiPage, hauntPlannerPage,
} from '../src/pages/tools.mjs'

const root = new URL('..', import.meta.url)

/* Browser scripts (no bundler, by design) — evaluate with stubs, test the pure core. */
async function loadEngine (file, varName) {
  const src = await readFile(new URL(`./assets/js/${file}.js`, root), 'utf8')
  const sandbox = { window: {}, localStorage: undefined, document: undefined, prompt: () => null }
  return new Function('window', 'localStorage', 'document', 'prompt',
    `${src.replace(/if \(typeof document[\s\S]*$/, 'return ' + varName)}`)(
    sandbox.window, sandbox.localStorage, sandbox.document, sandbox.prompt)
}

const DayBlueprint = await loadEngine('day-blueprint', 'DayBlueprint')
const RoadTrip = await loadEngine('road-trip', 'RoadTrip')
const ExpressROI = await loadEngine('express-roi', 'ExpressROI')
const HauntPlanner = await loadEngine('haunt-planner', 'HauntPlanner')

/* ---------- Day Blueprint ---------- */

const PLANS = {
  morning: [{ time: 'Rope drop', body: 'Go left.' }],
  midday: [{ time: 'Noon', body: 'Lunch early.' }],
  evening: [{ time: 'Last hour', body: 'Re-ride.' }],
}

test('day blueprint: options adjust the plan and every adjustment is noted', () => {
  const plain = DayBlueprint.buildPlan(PLANS, {})
  assert.equal(plain.steps.length, 3)
  assert.equal(plain.notes.length, 0)

  const full = DayBlueprint.buildPlan(PLANS, { earlyStart: true, middayBreak: true, reRides: true })
  assert.equal(full.steps.length, 6)
  assert.ok(full.steps[0].time === 'Before open')
  assert.ok(full.steps.some((s) => s.time === 'Midday' && /break/i.test(s.body)))
  assert.equal(full.notes.length, 3, 'every generated step explains itself in the notes')
  assert.equal(DayBlueprint.buildPlan(null, {}), null)
})

/* ---------- Road-Trip Combiner ---------- */

const ROAD = {
  clusters: [{
    slug: 'socal-week', name: 'SoCal', parks: ['magic-mountain', 'knotts-berry-farm', 'legoland-california', 'seaworld-san-diego'],
    schoolBand: 'SoCal band.',
    legs: {},
  }],
  legs: {
    'knotts-berry-farm|magic-mountain': 55, 'knotts-berry-farm|legoland-california': 55,
    'legoland-california|seaworld-san-diego': 35, 'magic-mountain|seaworld-san-diego': 105,
  },
  parks: {
    'magic-mountain': { name: 'Magic Mountain', url: '/mm/' },
    'knotts-berry-farm': { name: "Knott's", url: '/kbf/' },
    'legoland-california': { name: 'Legoland CA', url: '/lca/' },
    'seaworld-san-diego': { name: 'SeaWorld SD', url: '/swsd/' },
    'great-adventure': { name: 'Great Adventure', url: '/ga/' },
  },
}

test('road-trip: single-cluster picks keep the authored order and sum real legs', () => {
  // Selection deliberately unordered — the cluster order must win.
  const it = RoadTrip.itineraryFor(['seaworld-san-diego', 'legoland-california', 'knotts-berry-farm', 'magic-mountain'], ROAD)
  assert.deepEqual(it.order, ['magic-mountain', 'knotts-berry-farm', 'legoland-california', 'seaworld-san-diego'])
  assert.equal(it.hops.length, 3)
  assert.equal(it.totalMinutes, 55 + 55 + 35)
  assert.equal(it.missing.length, 0)
  assert.equal(RoadTrip.fmtHrs(245), '4 h 5 min')
})

test('road-trip: unauthored legs are reported, never invented', () => {
  const it = RoadTrip.itineraryFor(['knotts-berry-farm', 'great-adventure'], ROAD)
  assert.equal(it.totalMinutes, null, 'no total when a leg is unauthored')
  assert.equal(it.missing.length, 1)
  assert.equal(it.missing[0][0], 'knotts-berry-farm')
})

test('road-trip: two parks is the floor', () => {
  assert.equal(RoadTrip.itineraryFor(['knotts-berry-farm'], ROAD), null)
})

/* ---------- Express Pass ROI ---------- */

test('express ROI: the arithmetic is checkable by hand', () => {
  const r = ExpressROI.compute({ party: 4, rides: 12, standbyMin: 45, tier: { rangeUsd: [100, 200] } })
  // 45 − 10 = 35 min saved/ride; 12 rides = 420 min = 7 hours
  assert.equal(r.hoursSaved, 7)
  assert.equal(r.costLow, 400)
  assert.equal(r.costHigh, 800)
  assert.equal(r.perHourLow, Math.round(400 / 7))
  assert.equal(r.perHourHigh, Math.round(800 / 7))
  // break-even at $20/hr on the band floor: 400/20 = 20 hours → 20*60/35 = 34.3 → 35 rides
  assert.equal(r.breakEvenRides, 35)
  assert.ok(r.verdict.length > 10)
})

test('express ROI: verdict bands and input clamps hold at the edges', () => {
  const cheap = ExpressROI.compute({ party: 1, rides: 30, standbyMin: 90, tier: { rangeUsd: [80, 120] } })
  assert.ok(cheap.verdict.includes('strong value'), (90 - 10) * 30 / 60 + ' hours at $80-120 should be strong')
  const dear = ExpressROI.compute({ party: 12, rides: 1, standbyMin: 10, tier: { rangeUsd: [300, 350] } })
  assert.ok(dear.verdict.includes('poor value'))
  const clamped = ExpressROI.compute({ party: 99, rides: 999, standbyMin: 999, tier: { rangeUsd: [1, 2] } })
  assert.equal(clamped.party, 12); assert.equal(clamped.rides, 40); assert.equal(clamped.standbyMin, 120)
})

/* ---------- Haunt Planner ---------- */

test('haunt planner: the route follows the wait-curve logic', () => {
  const r = HauntPlanner.buildRoute({ houseCount: 10, nightType: 'weeknight', arrive: 'open' })
  assert.ok(r.steps.length >= 4)
  const first = r.steps[0]
  assert.ok(/marquee/i.test(first.body), 'the first hour goes to the marquees')
  assert.ok(r.steps.some((s) => /final two hours/i.test(s.window)), 'the collapse hour is scheduled')
  assert.ok(!r.steps.some((s) => /line-skip product/i.test(s.body)), 'weeknights do not push the upcharge')
})

test('haunt planner: late arrival inverts the route; peak nights print the queue math', () => {
  const late = HauntPlanner.buildRoute({ houseCount: 10, nightType: 'weeknight', arrive: 'late' })
  assert.ok(/back half first/i.test(late.steps[0].body))
  const peak = HauntPlanner.buildRoute({ houseCount: 10, nightType: 'peak', arrive: 'open' })
  const peakNote = peak.steps.find((s) => /hours of queueing/i.test(s.body))
  assert.ok(peakNote, 'peak nights state the queueing total')
  assert.ok(peakNote.body.includes('11 hours'), '10 houses × (50+13) min = 10.5 h → rounds to ~11 h, printed honestly')
})

/* ---------- build-side: pages exist where their data does, and only there ---------- */

const disney = await loadData('disney')
const universal = await loadData('universal')
const coasterguide = await loadData('coasterguide')
const seasonalU = await loadSeasonal('universal', disney === universal ? universal : universal)

test('every operator builds the Day Blueprint; payloads carry authored plans', () => {
  for (const data of [disney, universal, coasterguide]) {
    const page = dayBlueprintPage(data)
    assert.match(page.html, /id="blueprint-data"/)
    assert.match(page.html, /data-blueprint/)
    assert.match(page.html, /day-blueprint\.js/)
    const payload = JSON.parse(page.html.match(/<script type="application\/json" id="blueprint-data">([\s\S]*?)<\/script>/)[1])
    assert.ok(payload.parks.length >= 4)
    assert.ok(payload.parks.every((p) => p.plans && p.plans.morning && p.plans.morning.length), 'every park contributes its authored morning')
  }
})

test('road-trip builds only where the data lives (CoasterReady) and legs round-trip', () => {
  const page = roadTripPage(coasterguide)
  assert.equal(page.url, '/tools/road-trip/')
  const payload = JSON.parse(page.html.match(/<script type="application\/json" id="roadtrip-data">([\s\S]*?)<\/script>/)[1])
  assert.ok(payload.clusters.length >= 2)
  assert.ok(Object.keys(payload.legs).length >= 25, 'clusters + spare legs merged into one lookup')
  // Knott's is wired into the SoCal cluster — the park this tool must serve
  assert.ok(payload.clusters[0].parks.includes('knotts-berry-farm'))
  assert.ok(payload.legs['knotts-berry-farm|magic-mountain'] > 0)
})

test('express ROI and haunt planner build on the Universal site with their payloads', () => {
  const roi = expressRoiPage(universal)
  assert.equal(roi.url, '/tools/express-pass-roi/')
  const roiPayload = JSON.parse(roi.html.match(/<script type="application\/json" id="roi-data">([\s\S]*?)<\/script>/)[1])
  assert.ok(roiPayload.tiers.length >= 2)
  assert.ok(roiPayload.tiers.every((t) => t.rangeUsd[0] < t.rangeUsd[1]), 'prices stay ranges — a fixed price is a fact-check failure waiting')
  assert.match(roiPayload.asOf, /July 2026/)

  const haunt = hauntPlannerPage(universal, seasonalU)
  assert.equal(haunt.url, '/tools/haunt-planner/')
  const hauntPayload = JSON.parse(haunt.html.match(/<script type="application\/json" id="haunt-data">([\s\S]*?)<\/script>/)[1])
  assert.equal(hauntPayload.events.length, 2)
  assert.ok(hauntPayload.events.every((e) => e.url.includes('/events/')))
})

test('knotts deepening: rapids and pony express landed with the height discipline intact', async () => {
  const doc = JSON.parse(await readFile(new URL('./data/coasterguide/parks/knotts-berry-farm/attractions.json', root), 'utf8'))
  const slugs = doc.attractions.map((a) => a.slug)
  assert.ok(slugs.includes('calico-river-rapids'))
  assert.ok(slugs.includes('pony-express'))
  for (const slug of ['calico-river-rapids', 'pony-express']) {
    const a = doc.attractions.find((x) => x.slug === slug)
    assert.equal(a.heightIn, null, 'unverified heights stay unasserted and point at the park')
    assert.match(a.heightNote, /verify/i)
  }
})

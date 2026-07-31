import { test } from 'node:test'
import assert from 'node:assert/strict'

import { staleness, isStale, compareMonths, confidenceMeta, isMonth, BUILD_MONTH } from '../src/lib/staleness.mjs'
import { bandCovers } from '../src/seasonal/core.mjs'
import { weatherScore } from '../src/seasonal/tools.mjs'

const fresh = (over) => ({ verified: '2026-06', confidence: 'confirmed', reviewBy: over, cycle: 'annual' })

test('month comparison never touches Date', () => {
  assert.equal(compareMonths('2026-01', '2026-02'), -1)
  assert.equal(compareMonths('2026-12', '2027-01'), -1)
  assert.equal(compareMonths('2026-07', '2026-07'), 0)
  assert.equal(compareMonths('2027-01', '2026-12'), 1)
  assert.throws(() => compareMonths('2026-1', '2026-02'), TypeError)
  assert.throws(() => compareMonths('July 2026', '2026-02'), TypeError)
})

test('isMonth rejects the shapes that would silently become NaN', () => {
  assert.equal(isMonth('2026-07'), true)
  assert.equal(isMonth('2026-13'), false)
  assert.equal(isMonth('2026-00'), false)
  assert.equal(isMonth('2026-7'), false)
  assert.equal(isMonth(undefined), false)
  assert.equal(isMonth(null), false)
})

test('a review date in the future is fresh, the build month is due, the past is stale', () => {
  assert.equal(staleness(fresh('2027-01')).state, 'fresh')
  assert.equal(staleness(fresh(BUILD_MONTH)).state, 'due')
  assert.equal(staleness(fresh('2026-01')).state, 'stale')
  assert.equal(staleness(fresh('2026-01')).monthsOverdue, 6)
})

test('overdue arithmetic crosses a year boundary correctly', () => {
  // BUILD_MONTH is 2026-07; a review due in 2025-07 is a full year late, not zero.
  assert.equal(staleness({ ...fresh('2025-07') }).monthsOverdue, 12)
  assert.equal(staleness({ ...fresh('2025-12') }).monthsOverdue, 7)
})

test('a missing or malformed freshness block resolves to stale, never to fresh', () => {
  // This is the whole safety property: an unstamped file must not render as a verified one.
  assert.equal(staleness(undefined).state, 'stale')
  assert.equal(staleness(null).state, 'stale')
  assert.equal(staleness({}).state, 'stale')
  assert.equal(staleness({ verified: '2026-06', confidence: 'confirmed' }).state, 'stale')
  assert.equal(staleness({ reviewBy: 'next year' }).state, 'stale')
  assert.equal(isStale({}), true)
})

test('unknown confidence is its own level rather than the mildest known one', () => {
  assert.equal(confidenceMeta('confirmed').level, 'confirmed')
  assert.equal(confidenceMeta('expected').tone, 'warn')
  assert.equal(confidenceMeta('historical').tone, 'muted')
  assert.equal(confidenceMeta('probably').level, 'unknown')
  assert.equal(confidenceMeta(undefined).tone, 'danger')
})

test('a stale page cannot wear a confirmed ribbon', () => {
  const stale = staleness({ verified: '2025-01', confidence: 'confirmed', reviewBy: '2025-06', cycle: 'annual' })
  assert.equal(stale.confidence, 'confirmed')
  assert.equal(stale.confidenceLabel, 'Confirmed')
  // The label still says what was claimed; the colour refuses to endorse it.
  assert.equal(stale.ribbonTone, 'danger')

  const live = staleness(fresh('2027-01'))
  assert.equal(live.ribbonTone, 'good')
})

test('confidenceMeta returns a copy, so a caller cannot mutate the shared table', () => {
  const a = confidenceMeta('confirmed')
  a.label = 'tampered'
  assert.equal(confidenceMeta('confirmed').label, 'Confirmed')
})

test('calendar bands that wrap the year cover both ends', () => {
  const summer = { startMonth: 6, endMonth: 8 }
  assert.equal(bandCovers(summer, 7), true)
  assert.equal(bandCovers(summer, 5), false)
  assert.equal(bandCovers(summer, 9), false)

  // Holidays at the Disneyland Resort runs November into January. Clamping it to December would
  // have been simpler and would have quietly dropped January.
  const holidays = { startMonth: 11, endMonth: 1 }
  assert.equal(bandCovers(holidays, 11), true)
  assert.equal(bandCovers(holidays, 12), true)
  assert.equal(bandCovers(holidays, 1), true)
  assert.equal(bandCovers(holidays, 2), false)
  assert.equal(bandCovers(holidays, 10), false)

  const single = { startMonth: 3, endMonth: 3 }
  assert.equal(bandCovers(single, 3), true)
  assert.equal(bandCovers(single, 4), false)
})

test('weather score rewards the comfortable band and stays inside 1–5', () => {
  assert.equal(weatherScore({ highF: 76, rainDays: 0 }), 5)
  assert.equal(weatherScore({ highF: 70, rainDays: 0 }), 5)
  assert.equal(weatherScore({ highF: 82, rainDays: 0 }), 5)

  // Orlando in July: hot and wet, and it should score near the floor.
  const julyOrlando = weatherScore({ highF: 92, rainDays: 17 })
  assert.ok(julyOrlando >= 1 && julyOrlando <= 2, `expected a low score, got ${julyOrlando}`)

  // Anaheim in July: warm and dry, and it should beat Orlando comfortably.
  const julyAnaheim = weatherScore({ highF: 84, rainDays: 0 })
  assert.ok(julyAnaheim > julyOrlando)

  // Cold clamps too, and nothing ever falls below 1.
  assert.ok(weatherScore({ highF: 20, rainDays: 20 }) >= 1)
  assert.ok(weatherScore({ highF: 200, rainDays: 0 }) >= 1)
})

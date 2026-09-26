import { test } from 'node:test'
import assert from 'node:assert/strict'

import * as SS from '../src/lib/seasonal-schema.mjs'

const site = {
  brand: { origin: 'https://ridereadyguide.com', locale: 'en-US' },
  author: { name: 'Ride Ready Guide', url: '/about/' },
}

const event = {
  name: "Mickey's Not-So-Scary Halloween Party",
  slug: 'mickeys-not-so-scary-halloween-party',
  category: 'hard-ticket',
  summary: 'A separately ticketed evening at Magic Kingdom.',
  url: '/events/mickeys-not-so-scary-halloween-party/',
  editionUrl: '/events/mickeys-not-so-scary-halloween-party/2026/',
  parkName: 'Magic Kingdom',
  parkUrl: '/walt-disney-world/magic-kingdom/',
  locality: 'Bay Lake, Florida',
  pricing: { model: 'per-night' },
  typicalWindow: { daysOfWeek: ['Sun', 'Tue', 'Thu', 'Fri'] },
}

const continuousEvent = {
  ...event,
  name: 'EPCOT International Food & Wine Festival',
  category: 'festival',
  typicalWindow: { daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
}

const confirmed = {
  year: 2026,
  status: 'announced',
  startDate: '2026-08-14',
  endDate: '2026-10-31',
  priceRangeUsd: [129, 229],
  dates: 'August 14 – October 31, 2026',
}

test('a confirmed continuous edition produces a full Event node', () => {
  const node = SS.event(site, continuousEvent, confirmed, { stale: false })
  assert.ok(node)
  assert.deepEqual(node['@type'], ['Event', 'Festival'])
  assert.equal(node.startDate, '2026-08-14')
  assert.equal(node.endDate, '2026-10-31')
  assert.equal(node.eventStatus, 'https://schema.org/EventScheduled')
  assert.equal(node.location['@type'], 'AmusementPark')
  // The park page is on this same origin now that the two sites merged.
  assert.equal(node.location.url, 'https://ridereadyguide.com/walt-disney-world/magic-kingdom/')
  assert.equal(node.offers.lowPrice, 129)
  assert.equal(node.offers.highPrice, 229)
})

test('an unannounced edition produces no Event node at all', () => {
  // The whole honesty gate: an Event without a startDate is either ignored or filled in with a
  // guess, so the page falls back to Article instead.
  assert.equal(SS.event(site, event, { year: 2027, status: 'expected' }), null)
  assert.equal(SS.event(site, event, { year: 2027, status: 'past' }), null)
  assert.equal(SS.event(site, event, null), null)
  // Announced but with no ISO dates is still not publishable as an Event.
  assert.equal(SS.event(site, event, { year: 2026, status: 'announced' }), null)
})

test('a stale page publishes no price, even when the edition is confirmed', () => {
  const node = SS.event(site, continuousEvent, confirmed, { stale: true })
  assert.ok(node)
  assert.equal(node.startDate, '2026-08-14')
  // A price is the fastest-decaying fact here and the one most likely to be quoted back.
  assert.equal(node.offers, undefined)
})

test('a cancelled edition says so rather than disappearing', () => {
  const node = SS.event(site, event, { ...confirmed, status: 'cancelled' })
  // Cancelled editions are not "announced", so they take the Article path — but if one is ever
  // promoted, the status mapping must not silently claim it is going ahead.
  assert.equal(node, null)
})

test('the category drives the schema type', () => {
  const festival = SS.event(site, continuousEvent, confirmed)
  assert.deepEqual(festival['@type'], ['Event', 'Festival'])
  const overlay = SS.event(site, { ...continuousEvent, category: 'overlay' }, confirmed)
  assert.deepEqual(overlay['@type'], ['Event'])
})

test('an event included with paid park admission is not marked free', () => {
  const node = SS.event(site, { ...continuousEvent, pricing: { model: 'included' } }, confirmed)
  assert.equal(node.isAccessibleForFree, false)
  assert.equal(SS.event(site, continuousEvent, confirmed).isAccessibleForFree, false)
})

test('we never imply we organise anything', () => {
  const node = SS.event(site, continuousEvent, confirmed)
  assert.equal(node.organizer, undefined)
})

test('select-night parties and weekend overlays fall back to Article markup', () => {
  assert.equal(SS.event(site, event, { ...confirmed, dates: 'Select nights August 14 – October 31, 2026' }), null)
  assert.equal(SS.event(site, { ...continuousEvent, typicalWindow: { daysOfWeek: ['Sat', 'Sun'] } }, confirmed), null)
  assert.equal(SS.event(site, continuousEvent, { ...confirmed, dates: 'Select nights August 14 – October 31, 2026' }), null)
})

test('price lists are ranges, and a stale page publishes none', () => {
  const rows = [
    { label: 'Lightning Lane Multi Pass', rangeUsd: [15, 45], asOf: 'July 2026', note: 'Varies by date.' },
    { label: 'Standard parking', rangeUsd: [30, 30] },
    { label: 'Something undated' },
  ]
  const list = SS.priceList(site, { url: '/prices/lightning-lane/', name: 'Lightning Lane', rows })
  assert.equal(list.numberOfItems, 2, 'rows without a range are dropped')
  assert.equal(list.itemListElement[0].item.lowPrice, 15)
  assert.equal(list.itemListElement[0].item['@type'], 'AggregateOffer')

  assert.equal(SS.priceList(site, { url: '/x/', name: 'x', rows }, { stale: true }), null)
  assert.equal(SS.priceList(site, { url: '/x/', name: 'x', rows: [] }), null)
})

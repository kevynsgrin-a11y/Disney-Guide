import { test } from 'node:test'
import assert from 'node:assert/strict'

import * as SS from '../src/lib/seasonal-schema.mjs'

const site = {
  brand: {
    origin: 'https://parkseason.guide',
    locale: 'en-US',
    sisterSite: { name: 'Ride Ready Guide', origin: 'https://rideready.guide', note: 'Evergreen sister site.' },
  },
  author: { name: 'Park Season Guide', url: '/about/' },
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
}

const confirmed = {
  year: 2026,
  status: 'announced',
  startDate: '2026-08-14',
  endDate: '2026-10-31',
  priceRangeUsd: [129, 229],
}

test('a confirmed edition produces a full Event node', () => {
  const node = SS.event(site, event, confirmed, { stale: false })
  assert.ok(node)
  assert.deepEqual(node['@type'], ['Event', 'SocialEvent'])
  assert.equal(node.startDate, '2026-08-14')
  assert.equal(node.endDate, '2026-10-31')
  assert.equal(node.eventStatus, 'https://schema.org/EventScheduled')
  assert.equal(node.location['@type'], 'AmusementPark')
  // The park lives on the other domain, so the node must point at that origin, not ours.
  assert.equal(node.location.url, 'https://rideready.guide/walt-disney-world/magic-kingdom/')
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
  const node = SS.event(site, event, confirmed, { stale: true })
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
  const festival = SS.event(site, { ...event, category: 'festival' }, confirmed)
  assert.deepEqual(festival['@type'], ['Event', 'Festival'])
  const overlay = SS.event(site, { ...event, category: 'overlay' }, confirmed)
  assert.deepEqual(overlay['@type'], ['Event'])
})

test('an included-admission event is marked free to attend', () => {
  const node = SS.event(site, { ...event, pricing: { model: 'included' } }, confirmed)
  assert.equal(node.isAccessibleForFree, true)
  assert.equal(SS.event(site, event, confirmed).isAccessibleForFree, false)
})

test('we never imply we organise anything', () => {
  const node = SS.event(site, event, confirmed)
  assert.equal(node.organizer, undefined)
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

test('the two sites are linked into one entity graph', () => {
  const node = SS.siteRelationship(site)
  assert.equal(node['@id'], 'https://rideready.guide/#website')
  assert.equal(node.publisher['@id'], 'https://parkseason.guide/#organization')
  // Without a sister site declared there is nothing to relate, and we must not invent one.
  assert.equal(SS.siteRelationship({ brand: {} }), null)
})

test('sisterAbs resolves against the sister origin, never ours', () => {
  assert.equal(SS.sisterAbs(site, '/guides/lightning-lane/'), 'https://rideready.guide/guides/lightning-lane/')
})

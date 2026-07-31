import { test } from 'node:test'
import assert from 'node:assert/strict'

import { foodTrackerOrder, PARK_ORDER } from '../src/lib/data.mjs'

/**
 * The Food Tracker encodes saved state as two bits per item at a fixed position in this order, so a
 * share link is only readable against the ordering that produced it. These tests exist because the
 * failure mode is silent: a reordered manifest does not throw, it just decodes every old link into
 * the wrong items.
 */

function fakeData (parkFood) {
  const parks = Object.entries(parkFood).map(([slug, ids]) => ({
    slug,
    food: ids.map((id) => ({ id })),
  }))
  return {
    parkBySlug: new Map(parks.map((p) => [p.slug, p])),
    allFood: parks.flatMap((p) => p.food),
    foodOrder: null,
  }
}

test('first run appends every id and reports the growth', () => {
  const data = fakeData({ 'magic-kingdom': ['mk-b', 'mk-a'], epcot: ['ep-a'] })
  const order = foodTrackerOrder(data)
  assert.deepEqual(order.ids, ['mk-a', 'mk-b', 'ep-a'], 'sorted within a park, parks in canonical order')
  assert.equal(order.changed, true)
  assert.equal(order.appended.length, 3)
  assert.deepEqual(order.tombstones, [])
})

test('an id that sorts first still appends to the end', () => {
  const data = fakeData({ 'magic-kingdom': ['mk-aaa-new', 'mk-a', 'mk-b'] })
  data.foodOrder = { version: 1, ids: ['mk-a', 'mk-b'] }
  const order = foodTrackerOrder(data)
  assert.deepEqual(order.ids, ['mk-a', 'mk-b', 'mk-aaa-new'])
  assert.deepEqual(order.appended, ['mk-aaa-new'])
})

test('every previously assigned position survives any dataset change', () => {
  const before = ['mk-a', 'mk-b', 'ep-a']
  const data = fakeData({
    'magic-kingdom': ['mk-aaa', 'mk-a', 'mk-b', 'mk-zzz'],
    epcot: ['ep-000', 'ep-a'],
  })
  data.foodOrder = { version: 1, ids: before }
  const { ids } = foodTrackerOrder(data)
  before.forEach((id, i) => assert.equal(ids[i], id, `position ${i} must not move`))
})

test('removed ids stay as tombstones so nothing behind them shifts', () => {
  const data = fakeData({ 'magic-kingdom': ['mk-a', 'mk-c'] })
  data.foodOrder = { version: 1, ids: ['mk-a', 'mk-b', 'mk-c'] }
  const order = foodTrackerOrder(data)
  assert.deepEqual(order.ids, ['mk-a', 'mk-b', 'mk-c'], 'mk-b is gone from the data but keeps its slot')
  assert.deepEqual(order.tombstones, ['mk-b'])
  assert.equal(order.changed, false, 'a removal alone does not rewrite the manifest')
})

test('a stable dataset produces no change', () => {
  const data = fakeData({ 'magic-kingdom': ['mk-a', 'mk-b'] })
  data.foodOrder = { version: 1, ids: ['mk-a', 'mk-b'] }
  const order = foodTrackerOrder(data)
  assert.equal(order.changed, false)
  assert.deepEqual(order.appended, [])
})

test('parks are appended in the canonical park order, not discovery order', () => {
  const data = fakeData({ 'california-adventure': ['dca-a'], 'magic-kingdom': ['mk-a'] })
  const order = foodTrackerOrder(data)
  assert.deepEqual(order.ids, ['mk-a', 'dca-a'])
  assert.equal(PARK_ORDER[0], 'magic-kingdom')
})

/* ---- the encoder itself, mirrored from assets/js/food-tracker.js ---- */

const BITS = { want: 1, tried: 2, skip: 3 }
const CODE = { 0: null, 1: 'want', 2: 'tried', 3: 'skip' }

function encode (order, state) {
  const bytes = new Uint8Array(Math.ceil(order.length / 4))
  for (let i = 0; i < order.length; i++) {
    const bit = BITS[state[order[i]]] || 0
    if (bit) bytes[i >> 2] |= bit << ((i & 3) * 2)
  }
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return Buffer.from(binary, 'binary').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode (order, token) {
  let padded = token.replace(/-/g, '+').replace(/_/g, '/')
  while (padded.length % 4) padded += '='
  const binary = Buffer.from(padded, 'base64').toString('binary')
  const state = {}
  for (let i = 0; i < order.length; i++) {
    const byte = (i >> 2) < binary.length ? binary.charCodeAt(i >> 2) : 0
    const status = CODE[(byte >> ((i & 3) * 2)) & 3]
    if (status) state[order[i]] = status
  }
  return state
}

test('share tokens round-trip exactly', () => {
  const order = Array.from({ length: 231 }, (_, i) => `id-${i}`)
  const statuses = ['want', 'tried', 'skip']
  const state = {}
  order.forEach((id, i) => { if (i % 3 !== 1) state[id] = statuses[i % 3] })
  const token = encode(order, state)
  assert.deepEqual(decode(order, token), state)
  assert.ok(token.length < 90, `231 items should encode compactly, got ${token.length} chars`)
})

test('a token stays valid after the order grows', () => {
  const order = ['a', 'b', 'c']
  const state = { a: 'want', c: 'tried' }
  const token = encode(order, state)
  assert.deepEqual(decode([...order, 'd', 'e'], token), state, 'appended ids decode as unset')
})

test('an empty list encodes and decodes to nothing', () => {
  const order = ['a', 'b', 'c']
  assert.deepEqual(decode(order, encode(order, {})), {})
})

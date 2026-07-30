import { test } from 'node:test'
import assert from 'node:assert/strict'

import * as f from '../src/lib/format.mjs'

test('height renders both units and handles no requirement', () => {
  assert.equal(f.height(44), '44in (112cm)')
  assert.equal(f.height(32), '32in (81cm)')
  assert.equal(f.height(48), '48in (122cm)')
  assert.equal(f.height(null), 'Any height')
  assert.equal(f.heightWords(40), '40 inches')
  assert.equal(f.heightWords(null), 'no height requirement')
})

test('price drops trailing zeros on whole dollars', () => {
  assert.equal(f.price(12), '$12')
  assert.equal(f.price(6.49), '$6.49')
  assert.equal(f.price(8.5), '$8.50')
  assert.equal(f.price(null), '—')
  assert.equal(f.price(undefined), '—')
})

test('duration renders fractions as glyphs', () => {
  assert.equal(f.duration(12), '12 min')
  assert.equal(f.duration(2.5), '2½ min')
  assert.equal(f.duration(1.75), '1¾ min')
  assert.equal(f.duration(0.5), '½ min')
  assert.equal(f.duration(null), '—')
})

test('isoDuration emits schema.org durations', () => {
  assert.equal(f.isoDuration(2.5), 'PT2M30S')
  assert.equal(f.isoDuration(9), 'PT9M')
  assert.equal(f.isoDuration(null), undefined)
  assert.equal(f.isoDuration(0), undefined)
})

test('humanDate handles both month and full dates', () => {
  assert.equal(f.humanDate('2026-07'), 'July 2026')
  assert.equal(f.humanDate('1971-10-01'), 'October 1, 1971')
  assert.equal(f.humanDate(''), '')
})

test('list reads as prose', () => {
  assert.equal(f.list(['a']), 'a')
  assert.equal(f.list(['a', 'b']), 'a and b')
  assert.equal(f.list(['a', 'b', 'c']), 'a, b, and c')
  assert.equal(f.list([]), '')
  assert.equal(f.list(['a', 'b'], 'or'), 'a or b')
})

test('enum labels fall back rather than rendering a raw slug', () => {
  assert.equal(f.lightningLaneShort('single-pass'), 'Single Pass')
  assert.equal(f.lightningLaneShort('none'), 'Standby only')
  assert.equal(f.lightningLaneShort(undefined), 'Standby only')
  assert.equal(f.transfer('must-transfer'), 'Must transfer to the ride vehicle')
  assert.equal(f.service('table-service'), 'Table service')
  assert.equal(f.reservations('essential'), 'Reservations essential')
  assert.equal(f.attractionType('roller-coaster'), 'Roller coaster')
  assert.equal(f.attractionType('some-new-type'), 'Some new type', 'unknown enums degrade to sentence case')
})

test('score labels stay inside their range', () => {
  assert.equal(f.intensityLabel(1), 'Very gentle')
  assert.equal(f.intensityLabel(5), 'Extreme')
  assert.equal(f.intensityLabel(undefined), 'Moderate')
  assert.equal(f.scaryLabel(1), 'Not scary')
  assert.equal(f.scaryLabel(5), 'Genuinely frightening')
  assert.equal(f.mustTryLabel(5), 'Do not leave without it')
})

test('slug helpers', () => {
  assert.equal(f.unslug('table-service'), 'Table service')
  assert.equal(f.titleize('date-night'), 'Date Night')
  assert.equal(f.pluralize(1, 'day'), '1 day')
  assert.equal(f.pluralize(3, 'day'), '3 days')
})

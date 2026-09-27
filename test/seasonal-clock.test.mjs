import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'

import { parkTimeZone, latestParkTimeZone } from '../src/lib/park-time-zone.mjs'
import { hauntCard } from '../src/templates/seasonal-components.mjs'

const script = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8')

function card (zone, start, end) {
  const attributes = { 'data-countdown-time-zone': zone, 'data-start': start, 'data-end': end }
  const state = { textContent: 'Confirmed dates' }
  return {
    state,
    getAttribute: (name) => attributes[name] ?? null,
    setAttribute: (name, value) => { attributes[name] = value },
    querySelector: (selector) => selector === '[data-countdown-state]' ? state : null,
  }
}

function expiry (zone, until) {
  const attributes = { 'data-season-time-zone': zone, 'data-season-until': until }
  return {
    removed: false,
    getAttribute: (name) => attributes[name] ?? null,
    remove () { this.removed = true },
  }
}

function renderClock (instant, cards = [], expiries = []) {
  class FixedDate extends Date {
    constructor (...args) { super(...(args.length ? args : [instant])) }
    static now () { return Date.parse(instant) }
  }
  const body = {
    appendChild () {},
    removeAttribute () {},
    setAttribute () {},
  }
  const document = {
    readyState: 'complete', hidden: true, body,
    querySelector: () => null,
    querySelectorAll: (selector) => selector === '[data-countdown]' ? cards
      : selector === '[data-season-until]' ? expiries : [],
    createElement: () => ({ setAttribute () {} }),
  }
  runInNewContext(script, {
    Date: FixedDate,
    Intl,
    document,
    navigator: { onLine: true },
    window: { matchMedia: () => ({ matches: true }) },
    localStorage: { getItem: () => null },
    addEventListener () {},
  })
}

test('the same instant yields each park’s calendar date across US zones', () => {
  const west = card('America/Los_Angeles', '2026-09-26', '2026-10-31')
  const east = card('America/New_York', '2026-09-26', '2026-10-31')
  renderClock('2026-09-26T06:30:00Z', [west, east])
  assert.equal(west.state.textContent, 'Season begins tomorrow')
  assert.equal(east.state.textContent, 'Season underway · check event dates')
})

test('spring daylight saving shift does not shrink a two-calendar-day countdown', () => {
  const west = card('America/Los_Angeles', '2026-03-09', '2026-03-31')
  renderClock('2026-03-08T07:30:00Z', [west])
  assert.equal(west.state.textContent, 'Season begins in 2 days')
})

test('fall daylight saving shift keeps a Los Angeles season live through its final date', () => {
  const west = card('America/Los_Angeles', '2026-09-01', '2026-11-01')
  const section = expiry('America/Los_Angeles', '2026-11-01')
  renderClock('2026-11-02T07:30:00Z', [west], [section])
  assert.equal(west.state.textContent, 'Season ends Nov 1 · check dates')
  assert.equal(section.removed, false)
})

test('cached sections expire after the represented park’s end date, not the viewer’s', () => {
  const west = expiry('America/Los_Angeles', '2026-10-31')
  const east = expiry('America/New_York', '2026-10-31')
  const unknown = expiry('', '2026-10-31')
  renderClock('2026-11-01T06:30:00Z', [], [west, east, unknown])
  assert.equal(west.removed, false)
  assert.equal(east.removed, true)
  assert.equal(unknown.removed, false)
})

test('the rendered countdown carries its resort zone and unknown resorts keep static copy', () => {
  const event = {
    resort: 'disneyland', category: 'halloween', name: 'Halloween Time',
    url: '/seasonal/halloween-time/', editions: [{ status: 'announced', startDate: '2026-08-21', endDate: '2026-10-31', dates: 'Aug 21–Oct 31' }],
  }
  assert.match(hauntCard(event).value, /data-countdown-time-zone="America\/Los_Angeles"/)
  assert.equal(parkTimeZone('unknown-park'), '')
  assert.equal(latestParkTimeZone([{ resort: 'walt-disney-world' }, { resort: 'disneyland' }]), 'America/Los_Angeles')
  const unknown = card('', '2026-09-26', '2026-10-31')
  renderClock('2026-09-26T06:30:00Z', [unknown])
  assert.equal(unknown.state.textContent, 'Confirmed dates')
})

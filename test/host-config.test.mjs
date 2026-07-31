import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildHeaders, buildRedirects } from '../src/build.mjs'

/**
 * These two files are the only part of the build nothing else validates: they are plain text
 * consumed by the host, so a mistake in them cannot break a page render, cannot fail the audit, and
 * shows up only as a 404 or a missing header in production. Both of which happened.
 */

const redirects = buildRedirects()
const headers = buildHeaders()

/** `/from  /to  301` → the set of source paths that have a rule. */
const sources = new Set(
  redirects.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.trim().split(/\s+/)[0])
)

test('every legacy park path redirects in its bare form, not only with a suffix', () => {
  // The bug this pins: `/magic-kingdom/*` matches `/magic-kingdom/anything` and misses
  // `/magic-kingdom`, which is the form people type and link. It 404'd in production.
  for (const path of ['/magic-kingdom', '/epcot', '/hollywood-studios', '/animal-kingdom',
    '/disneyland-park', '/california-adventure']) {
    assert.ok(sources.has(path), `${path} has no bare redirect rule`)
    assert.ok(sources.has(`${path}/*`), `${path} has no wildcard redirect rule`)
  }
})

test('a bare legacy path lands on a real destination, with its trailing slash', () => {
  const line = redirects.split('\n').find((l) => l.startsWith('/magic-kingdom  '))
  assert.ok(line)
  const [, to, status] = line.trim().split(/\s+/)
  assert.equal(to, '/walt-disney-world/magic-kingdom/')
  assert.equal(status, '301')
})

test('convenience paths redirect with and without a trailing slash', () => {
  for (const path of ['/food-tracker', '/height-checker', '/heights', '/best-time-to-visit',
    '/crowd-calendar', '/trip-timing', '/refurbishments', '/lightning-lane-price']) {
    assert.ok(sources.has(path), `${path} (bare) has no rule`)
    assert.ok(sources.has(`${path}/`), `${path}/ (slashed) has no rule`)
  }
})

test('no redirect points at a path that is itself redirected', () => {
  // A chained redirect costs a round trip and, in a loop, costs the page.
  for (const line of redirects.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [from, to] = line.trim().split(/\s+/)
    const target = to.replace('/:splat', '')
    assert.notEqual(target, from, `${from} redirects to itself`)
    assert.ok(!sources.has(target.replace(/\/$/, '')) || target.replace(/\/$/, '') === from.replace(/\/$/, ''),
      `${from} redirects to ${target}, which is itself a redirect source`)
  }
})

test('security headers are on every rule, not only the catch-all', () => {
  // Hosts differ on whether a request collects headers from all matching rules or only the most
  // specific one. Under the second reading, a path with its own cache rule silently loses these.
  const blocks = headers.split('\n\n').filter(Boolean)
  assert.ok(blocks.length >= 5, 'expected a block per cache rule plus the catch-all')
  for (const block of blocks) {
    assert.match(block, /X-Content-Type-Options: nosniff/, `missing nosniff in:\n${block}`)
    assert.match(block, /Referrer-Policy:/, `missing Referrer-Policy in:\n${block}`)
  }
})

test('the catch-all rule exists and carries the security set', () => {
  const catchAll = headers.split('\n\n').find((b) => b.startsWith('/*\n'))
  assert.ok(catchAll, 'no /* rule — HTML documents match nothing else')
  assert.match(catchAll, /X-Content-Type-Options: nosniff/)
})

test('asset caching is immutable and long, since asset URLs are versioned', () => {
  const assets = headers.split('\n\n').find((b) => b.startsWith('/assets/*\n'))
  assert.match(assets, /Cache-Control: public, max-age=31536000, immutable/)
})

test('the service worker is never cached, or a bad one becomes permanent', () => {
  const sw = headers.split('\n\n').find((b) => b.startsWith('/sw.js\n'))
  assert.match(sw, /max-age=0, must-revalidate/)
})

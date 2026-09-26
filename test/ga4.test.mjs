import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildHeaders } from '../src/build.mjs'
import { loadData } from '../src/lib/data.mjs'
import { ga4Ids, ga4LoaderId, ga4Bootstrap } from '../src/lib/ga4.mjs'
import { legalPages } from '../src/pages/legal.mjs'

/**
 * GA4 recorded nothing on any of the three sites because the page asked for a loader and an inline
 * config that the site's own CSP refused. These pin the three halves that have to agree: the IDs
 * each site configures, the markup that loads them, and the policy that lets them run.
 */

const SITES = {
  // operator: [per-site property first, then roll-up(s)]
  disney: ['G-R1M0P37E6X', 'G-7J3HL1X7EX'],
  universal: ['G-FGJR4ZZBG2', 'G-XN1QCDSSGL'],
  coasterguide: ['G-C1F9EFBL3R'], // no per-site property exists; roll-up only
}

const directive = (csp, name) => {
  const d = csp.split(';').map((s) => s.trim()).find((s) => s.split(/\s+/)[0] === name)
  return d ? d.split(/\s+/).slice(1) : null
}

for (const [slug, expected] of Object.entries(SITES)) {
  test(`${slug}: configures exactly its GA4 IDs, loader on the first`, async () => {
    const data = await loadData(slug)
    assert.deepEqual(ga4Ids(data.site), expected)
    assert.equal(ga4LoaderId(data.site), expected[0])

    const js = ga4Bootstrap(data.site)
    const configured = [...js.matchAll(/gtag\("config", "([^"]+)"\)/g)].map((m) => m[1])
    assert.deepEqual(configured, expected)
    assert.match(js, /gtag\("js", new Date\(\)\);/)
  })

  test(`${slug}: every page carries one gtag.js loader and the same-origin bootstrap, no inline config`, async () => {
    const data = await loadData(slug)
    // The privacy page goes through the same layout as every other page, and is the page that
    // must also disclose what the head loads.
    const page = legalPages(data).find((p) => p.url === '/privacy/').html
    const loaders = page.match(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([^"]+)"><\/script>/g) || []
    assert.equal(loaders.length, 1, 'expected exactly one gtag.js loader')
    assert.ok(loaders[0].includes(`id=${expected[0]}"`), `loader is not ${expected[0]}: ${loaders[0]}`)
    assert.match(page, /<script async src="\/ga4\.js\?v=\d+"><\/script>/)
    assert.doesNotMatch(page, /<script>[^<]*gtag\(/, 'inline gtag() would be refused by the CSP')
    assert.match(page, /Google Analytics 4/)
    assert.match(page, /https:\/\/tools\.google\.com\/dlpage\/gaoptout/)
    assert.doesNotMatch(page, /No analytics are loaded on this site/)
  })
}

test('no GA4 ID means no tag, no bootstrap', () => {
  const site = { analytics: { enabled: false } }
  assert.deepEqual(ga4Ids(site), [])
  assert.equal(ga4LoaderId(site), null)
  assert.equal(ga4Bootstrap(site), null)
})

test('anything but a measurement ID is refused, since it is written into a script', () => {
  assert.throws(() => ga4Ids({ analytics: { gtagId: 'G-1");alert(1);//' } }), /not a GA4 measurement ID/)
})

test('the CSP admits GA4 and the Cloudflare beacon by exact origin, and nothing broader', () => {
  const csp = buildHeaders().split('\n').find((l) => l.includes('Content-Security-Policy:')).split(': ').slice(1).join(': ')

  const script = directive(csp, 'script-src')
  for (const host of ['https://www.googletagmanager.com', 'https://static.cloudflareinsights.com']) {
    assert.ok(script.includes(host), `script-src lacks ${host}`)
  }
  const connect = directive(csp, 'connect-src')
  for (const host of ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com',
    'https://*.googletagmanager.com', 'https://cloudflareinsights.com']) {
    assert.ok(connect.includes(host), `connect-src lacks ${host}`)
  }
  const img = directive(csp, 'img-src')
  for (const host of ["'self'", 'https://*.google-analytics.com', 'https://*.googletagmanager.com']) {
    assert.ok(img.includes(host), `img-src lacks ${host}`)
  }

  // The bootstrap is a same-origin file precisely so script-src never needs these.
  assert.ok(!script.includes("'unsafe-inline'") && !script.includes("'unsafe-eval'"), 'script-src was loosened')
  assert.deepEqual(directive(csp, 'default-src'), ["'self'"])
  for (const name of ['script-src', 'connect-src', 'img-src']) {
    for (const source of directive(csp, name)) {
      assert.ok(!['*', 'https:', 'http:', 'data:'].includes(source), `${name} carries the blanket source ${source}`)
    }
  }
})

test('every _headers rule, including the HTML catch-all, serves the same CSP', () => {
  const lines = buildHeaders().split('\n').filter((l) => l.includes('Content-Security-Policy:'))
  assert.ok(lines.length >= 5)
  assert.equal(new Set(lines).size, 1)
  const catchAll = buildHeaders().split('\n\n').find((b) => b.startsWith('/*\n'))
  assert.match(catchAll, /Content-Security-Policy: .*https:\/\/www\.googletagmanager\.com/)
})

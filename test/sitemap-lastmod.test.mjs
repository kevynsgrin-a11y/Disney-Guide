import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSitemap } from '../src/build.mjs'

const site = { brand: { origin: 'https://example.com' }, resorts: [] }
const pages = [
  { url: '/', html: '<html><body>home</body></html>' },
  { url: '/guides/rope-drop/', html: '<html><body>guide</body></html>' },
  { url: '/events/food-festival/', html: '<html><body>event</body></html>' },
  { url: '/events/food-festival-2026-spring/', html: '<meta name="robots" content="noindex,follow">' },
]

test('lastmod is emitted only where a verification month is known', () => {
  const xml = buildSitemap(site, pages, new Set(), new Map([['/events/food-festival/', '2026-08']]))
  assert.match(xml, /<loc>https:\/\/example\.com\/events\/food-festival\/<\/loc>\s*\n\s*<lastmod>2026-08<\/lastmod>/)
  assert.doesNotMatch(xml, /<loc>https:\/\/example\.com\/guides\/rope-drop\/<\/loc>\s*\n\s*<lastmod>/)
  assert.doesNotMatch(xml, /<loc>https:\/\/example\.com\/<\/loc>\s*\n\s*<lastmod>/)
})

test('no URL carries an invented constant lastmod', () => {
  const xml = buildSitemap(site, pages, new Set(), new Map())
  assert.ok(!xml.includes('<lastmod>'), 'sitemap must not fabricate lastmod dates')
})

test('a malformed verification month is dropped, not emitted', () => {
  const xml = buildSitemap(site, pages, new Set(), new Map([['/events/food-festival/', 'August 2026']]))
  assert.ok(!xml.includes('<lastmod>'))
})

test('noindex event editions stay out of the sitemap', () => {
  const xml = buildSitemap(site, pages, new Set(), new Map())
  assert.ok(!xml.includes('food-festival-2026-spring'))
})

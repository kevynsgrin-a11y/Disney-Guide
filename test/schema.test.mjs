import { test } from 'node:test'
import assert from 'node:assert/strict'

import * as S from '../src/lib/schema.mjs'
import { renderParkMap } from '../src/lib/map.mjs'

const site = {
  brand: { name: 'Ride Ready Guide', origin: 'https://example.test', tagline: 'Tagline.', founded: 2026, locale: 'en-US' },
  meta: { defaultDescription: 'Description.' },
  legal: { shortDisclaimer: 'Independent and unofficial.' },
  author: { name: 'Editorial team', url: '/about/' },
}

const parse = (json) => JSON.parse(json.replace(/\\u003c/g, '<'))

test('serialize wraps a single node and a graph differently', () => {
  const one = parse(S.serialize([S.organization(site)]))
  assert.equal(one['@context'], 'https://schema.org')
  assert.equal(one['@type'], 'Organization')

  const many = parse(S.serialize([S.organization(site), S.website(site)]))
  assert.equal(many['@graph'].length, 2)
})

test('serialize escapes < so it cannot close the script element', () => {
  const json = S.serialize([{ '@type': 'Thing', name: '</script><img src=x>' }])
  assert.ok(!json.includes('</script>'))
  assert.ok(json.includes('\\u003c/script'))
})

test('empty values are dropped rather than emitted as null', () => {
  const node = parse(S.serialize([S.article(site, {
    url: '/x/', title: 'T', description: 'D', modified: undefined, section: undefined,
  })]))
  assert.ok(!('dateModified' in node))
  assert.ok(!('articleSection' in node))
})

test('breadcrumbs carry a stable @id that WebPage references', () => {
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Walt Disney World', href: '/walt-disney-world/' },
    { label: 'Magic Kingdom', href: '/walt-disney-world/magic-kingdom/' },
  ]
  const crumbs = S.breadcrumbs(site, trail)
  assert.equal(crumbs['@id'], 'https://example.test/walt-disney-world/magic-kingdom/#breadcrumb')
  assert.equal(crumbs.itemListElement.length, 3)
  assert.equal(crumbs.itemListElement[0].position, 1)
  assert.equal(crumbs.itemListElement[2].item, 'https://example.test/walt-disney-world/magic-kingdom/')

  const page = S.webPage(site, { url: '/walt-disney-world/magic-kingdom/', title: 'T', description: 'D', trail })
  assert.equal(page.breadcrumb['@id'], crumbs['@id'])
})

test('breadcrumbs are omitted for a single-item trail', () => {
  assert.equal(S.breadcrumbs(site, [{ label: 'Home', href: '/' }]), null)
  assert.equal(S.breadcrumbs(site, null), null)
})

test('an attraction emits its height as a typed property', () => {
  const park = { name: 'Magic Kingdom', url: '/walt-disney-world/magic-kingdom/', coordinates: { lat: 1, lng: 2 } }
  const node = S.touristAttraction(site, {
    name: 'Space Mountain', url: '/x/', summary: 'A coaster.', park,
    heightIn: 44, durationMinutes: 2.5, opened: 1975,
  })
  const height = node.additionalProperty.find((p) => p.name === 'Minimum height requirement')
  assert.equal(height.value, '44 inches')
  assert.equal(height.unitCode, 'INH')
  assert.equal(node.containedInPlace.name, 'Magic Kingdom')
})

test('itemList and faqPage return null when there is nothing to list', () => {
  assert.equal(S.itemList(site, { url: '/x/', name: 'n', items: [] }), null)
  assert.equal(S.faqPage(site, { url: '/x/', faqs: [] }), null)
  assert.equal(S.faqPage(site, { url: '/x/', faqs: null }), null)
})

test('faq answers are reduced to plain text', () => {
  const node = S.faqPage(site, { url: '/x/', faqs: [{ q: 'Is **it** scary?', a: 'See [here](/y/).' }] })
  assert.equal(node.mainEntity[0].name, 'Is it scary?')
  assert.equal(node.mainEntity[0].acceptedAnswer.text, 'See here.')
})

test('the map renderer falls back to a labelled diagram when there is no geometry', () => {
  const park = {
    name: 'Test Park',
    map: null,
    lands: [
      { slug: 'a', name: 'Land A' },
      { slug: 'b', name: 'Land B' },
      { slug: 'c', name: 'Land C' },
    ],
    attractionBySlug: new Map(),
    diningBySlug: new Map(),
  }
  const out = renderParkMap(park)
  assert.equal(out.synthetic, true)
  const svg = String(out.svg)
  assert.ok(svg.includes('<svg'))
  assert.ok(svg.includes('Land A') && svg.includes('Land C'))
  assert.ok(svg.includes('Main entrance'))
  assert.ok(svg.includes('role="img"') && svg.includes('aria-label='), 'the map must be announced to screen readers')
})

test('map markers link only to attractions that have their own page', () => {
  const withPage = { name: 'Big One', url: '/x/big-one/', hasPage: true }
  const withoutPage = { name: 'Small One', url: '/x/#small-one', hasPage: false }
  const park = {
    name: 'Test Park',
    lands: [{ slug: 'a', name: 'Land A' }],
    attractionBySlug: new Map([['big-one', withPage], ['small-one', withoutPage]]),
    diningBySlug: new Map(),
    map: {
      viewBox: [0, 0, 100, 100],
      lands: [{ slug: 'a', label: 'Land A', points: [[0, 0], [100, 0], [100, 100], [0, 100]], labelAt: [50, 50] }],
      markers: [
        { slug: 'big-one', kind: 'headliner', at: [25, 25] },
        { slug: 'small-one', kind: 'attraction', at: [75, 75] },
      ],
    },
  }
  const svg = String(renderParkMap(park).svg)
  assert.ok(svg.includes('href="/x/big-one/"'))
  assert.ok(!svg.includes('href="/x/#small-one"'))
  assert.ok(svg.includes('Small One'), 'it still renders, just not as a link')
})

test('map labels escape their text', () => {
  const park = {
    name: 'Test Park',
    lands: [{ slug: 'a', name: 'Land A' }],
    attractionBySlug: new Map(),
    diningBySlug: new Map(),
    map: {
      viewBox: [0, 0, 100, 100],
      lands: [{ slug: 'a', label: '<script>', points: [[0, 0], [100, 0], [50, 100]], labelAt: [50, 50] }],
      markers: [],
    },
  }
  const svg = String(renderParkMap(park).svg)
  assert.ok(!svg.includes('<script>'))
  assert.ok(svg.includes('&lt;script&gt;'))
})

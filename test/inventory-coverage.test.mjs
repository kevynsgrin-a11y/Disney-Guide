import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData, attractionCoverage } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { renderParkMap } from '../src/lib/map.mjs'
import { parkHub, ridesPage, landPage, firstTimerPage, mapPage, attractionPage } from '../src/pages/park.mjs'
import { homePage, parksIndexPage, companyPages, resortPages } from '../src/pages/core.mjs'
import { guidePage } from '../src/pages/docs.mjs'
import { toolsIndex } from '../src/pages/tools.mjs'
import { legalPages } from '../src/pages/legal.mjs'

test('catalog counts distinguish source status from historical records and temporary availability', () => {
  const park = {
    lands: [{}, {}, {}],
    attractions: [
      { status: 'open' },
      { status: 'open', isOpen: false }, // a stale flag or temporary interruption does not retire a catalog record
      { status: 'closed', isOpen: true }, // explicit source status overrides an obsolete derived flag
      { status: 'under-construction' },
      { status: 'seasonal' },
    ],
  }
  assert.deepEqual(attractionCoverage(park), {
    catalogCount: 5, currentCount: 2, nonCurrentCount: 3, closedCount: 1, otherCount: 2, areasCovered: 3,
  })
})

const data = await loadData('coasterguide')
const seasonal = await loadSeasonal('coasterguide', data)
const park = data.parkBySlug.get('magic-mountain')

test('Magic Mountain has twelve catalog records, ten current records and two closed reference records', () => {
  assert.deepEqual(attractionCoverage(park), {
    catalogCount: 12, currentCount: 10, nonCurrentCount: 2, closedCount: 2, otherCount: 0, areasCovered: park.lands.length,
  })
  assert.deepEqual(park.coverage, attractionCoverage(park))
  const directory = ridesPage(park, data).html
  assert.match(directory, /Attractions currently covered by CoasterReady/)
  assert.match(directory, /Catalog records<\/span><span class="hero__meta-value">12/)
  assert.match(directory, /Current attractions covered<\/span><span class="hero__meta-value">10/)
  assert.match(directory, /Non-current records<\/span><span class="hero__meta-value">2/)
  assert.match(directory, /complete official operating inventory/)
  assert.match(directory, /temporary closures and day-of operations are separate/)
  assert.doesNotMatch(directory, /Every attraction at Six Flags Magic Mountain|All 10 operating attractions|all 10<\/title>/)
  const currentSection = directory.split('Closed and non-current catalog records')[0]
  assert.doesNotMatch(currentSection, />X2<|>Superman: Escape from Krypton</)
  const schema = JSON.parse(directory.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
  const list = schema.find((record) => record['@type'] === 'ItemList')
  assert.match(list.name, /covered by this guide/)
  assert.equal(list.numberOfItems, 10)
})

test('hub, land and planning counts describe coverage rather than a complete park or land inventory', () => {
  for (const page of [parkHub(park, data), ridesPage(park, data), landPage(park.lands[0], data)]) {
    assert.match(page.html, /Current attractions covered/)
    assert.match(page.html, /guide’s coverage/)
    assert.match(page.html, /current catalog record does not confirm availability today/i)
  }
  const hub = parkHub(park, data).html
  assert.match(hub, /Areas covered by this guide/)
  assert.doesNotMatch(hub, /\d+ distinct areas|complete list, sortable|full attraction and dining list/)
  assert.match(firstTimerPage(park, data).html, /Current attractions covered/)
})

test('dependent overview pages qualify catalog counts and keep the official inventory separate', () => {
  const pages = [homePage(data, seasonal), parksIndexPage(data), ...companyPages(data, seasonal), ...resortPages(data)]
  for (const page of pages) assert.match(page.html, /Current (?:attractions|coasters) covered/)
  assert.doesNotMatch(homePage(data, seasonal).html, /Every height requirement, every ride worth queueing for/)
  assert.doesNotMatch(parksIndexPage(data).html, /Two resorts, six theme parks/)
  const heightGuide = guidePage(data.guideBySlug.get('height-requirements'), data).html
  assert.match(heightGuide, /current attraction records in this guide/)
  assert.match(heightGuide, /not a complete official inventory or same-day availability report/)
  assert.match(toolsIndex(data).html, /areas covered · printable/)
  const about = legalPages(data, seasonal).find((page) => page.url === '/about/').html
  assert.match(about, /Attractions covered by this guide/)
  assert.doesNotMatch(about, /<strong>Every attraction<\/strong>/)
  const terms = legalPages(data, seasonal).find((page) => page.url === '/terms/').html
  assert.match(terms, /Illustrative coverage diagrams/)
  assert.doesNotMatch(terms, /They are drawn from open geographic data/)
  for (const company of companyPages(data, seasonal)) {
    assert.match(company.html, /Check event admission and haunted-attraction access separately/)
    assert.doesNotMatch(company.html, /Halloween, included with admission/)
  }
})

test('the generated coverage diagram is explicit about unverified positions and links to the official map', () => {
  assert.equal(park.map, null)
  const diagram = renderParkMap(park)
  assert.equal(diagram.synthetic, true)
  assert.match(String(diagram.svg), /Illustrative guide coverage diagram/)
  assert.match(String(diagram.svg), /area positions are not verified geography/)
  assert.doesNotMatch(String(diagram.svg), /relative land positions only/)
  const page = mapPage(park, data).html
  assert.match(page, /guide coverage diagram/)
  assert.match(page, /does not establish their physical positions, walking directions/)
  assert.match(page, /href="https:\/\/www\.sixflags\.com\/magicmountain\/directions"/)
  assert.match(page, /Areas covered/)
  assert.doesNotMatch(page, /drawn from open geographic data including|showing every land/)
})

test('historical rides with an unverified land preserve their URL without inventing a location', () => {
  const historical = { ...park.attractionBySlug.get('x2'), land: null, landInfo: null }
  const page = attractionPage(historical, data)
  assert.equal(page.url, historical.url)
  assert.match(page.html, /Historical location unverified/)
  assert.doesNotMatch(page.html, /Six Flags Magic Mountain · Samurai Summit/)
})

test('coverage wording does not replace sibling operator inventories or map descriptions', async () => {
  const disney = await loadData('disney')
  const disneyPark = disney.parks[0]
  assert.match(ridesPage(disneyPark, disney).html, /Every attraction at/)
  assert.match(parkHub(disneyPark, disney).html, /distinct areas/)
})

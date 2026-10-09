import test from 'node:test'
import assert from 'node:assert/strict'

import { loadData, foodTrackerOrder } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { guidePage, comparePage } from '../src/pages/docs.mjs'
import { companyPages, resortPages } from '../src/pages/core.mjs'
import { pricePage } from '../src/seasonal/reference.mjs'
import { attractionPage, heightsPage, ridesPage, bestRidesPage, firstTimerPage } from '../src/pages/park.mjs'
import { heightCheckerPage, riderDataPayload, careerLadderPage, myRidersPage, dayBlueprintPage } from '../src/pages/tools.mjs'
import { heightBadge, heightRequirementCell } from '../src/templates/components.mjs'

function payload (page, id) {
  const match = page.html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)<\\/script>`))
  assert.ok(match, `missing ${id} payload`)
  return JSON.parse(match[1])
}

function schema (page) {
  return JSON.parse(page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
}

test('unknown height remains unverified in ride pages, badges and directory cells', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const fixture = { ...park.attractions.find((ride) => ride.status === 'open'), heightIn: null, heightNote: null }
  const page = attractionPage(fixture, data)
  assert.match(page.html, /Height unverified/)
  assert.doesNotMatch(page.html, /Any height|No minimum height|Check the null-inch/)
  for (const unknown of [null, undefined, Number.NaN, Infinity, -1, '48']) {
    assert.match(String(heightBadge(unknown)), /Height unverified/)
    assert.match(String(heightRequirementCell({ ...fixture, heightIn: unknown })), /data-value="unverified"/)
  }
})

test('height tools receive verified independent restrictions without admitting closed rides', async () => {
  const original = await loadData('coasterguide')
  const originalPark = original.parkBySlug.get('magic-mountain')
  const base = originalPark.attractions.find((ride) => ride.status === 'open')
  const fixture = {
    ...base, slug: 'rule-fixture', name: 'Rule Fixture', status: 'open', isOpen: true,
    heightIn: 42, heightMaxIn: 76, accompaniedBelowIn: 48, heightNote: 'Verified rider conditions.',
    riderRestrictions: ['Must sit independently'],
  }
  // An obsolete isOpen flag must not override an explicit closed status.
  const closed = { ...fixture, slug: 'retired-fixture', name: 'Retired Fixture', status: 'closed', isOpen: true }
  const unknown = { ...fixture, name: 'Unknown Fixture', heightIn: null }
  const park = { ...originalPark, attractions: [fixture, closed, unknown], heightAttractions: [fixture] }
  const data = { ...original, parks: [park], allHeightAttractions: [fixture] }
  const checker = payload(heightCheckerPage(data), 'height-data')
  assert.deepEqual(checker.parks[0].rides.map((ride) => ride.n), ['Rule Fixture', 'Unknown Fixture'])
  const sources = [
    checker.parks[0].rides[0], riderDataPayload(data).attractions[0],
    payload(careerLadderPage(data), 'career-data').coasters.find((ride) => ride.n === 'Rule Fixture'),
  ]
  for (const ride of sources) {
    assert.equal(ride.h, 42)
    assert.equal(ride.max, 76)
    assert.equal(ride.accompaniedBelow, 48)
    assert.deepEqual(ride.restrictions, ['Must sit independently'])
  }
  const creditHistory = payload(careerLadderPage(data), 'career-data').coasters.find((ride) => ride.n === 'Retired Fixture')
  assert.equal(creditHistory.s, 'closed', 'historical credits retain status rather than becoming current eligibility')
  const heights = heightsPage(park, data).html
  assert.match(heights, /data-height-max="76"/)
  assert.match(heights, /data-accompanied-below="48"/)
  assert.match(heights, /data-rider-restrictions="\[&quot;Must sit independently&quot;\]"/)
  assert.match(heights, /76&quot; maximum/)
  assert.match(heights, /Accompaniment required below 48&quot;/)
})

test('closed detail pages preserve URLs and attribution while disabling active ride advice and access schema', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const base = park.attractions.find((ride) => ride.status === 'open')
  const fixture = {
    ...base, status: 'closed', isOpen: true,
    closedNote: 'Permanently retired. Source: https://www.sixflags.com/blog/retiring-x2-magic-mountain',
    tips: ['Try this fixture tomorrow.'], bestTime: 'Queue at rope drop.', typicalWait: '50 minutes',
    faqs: [{ q: 'When should I queue?', a: 'Try this fixture tomorrow.' }],
  }
  const page = attractionPage(fixture, data)
  assert.equal(page.url, fixture.url)
  assert.match(page.html, /Closed · preserved reference page/)
  assert.match(page.html, /Former minimum height/)
  assert.match(page.html, /https:\/\/www\.sixflags\.com\/blog\/retiring-x2-magic-mountain/)
  assert.doesNotMatch(page.html, /Try this fixture tomorrow|Queue at rope drop|Best time to ride|Check the \d+-inch minimum/)
  const rideSchema = schema(page).find((item) => item['@type'] === 'TouristAttraction')
  assert.equal(rideSchema.publicAccess, false)
  assert.match(rideSchema.description, /^Not currently operating\./)
  assert.ok(rideSchema.additionalProperty.some((property) => property.name === 'Recorded minimum height (not operating)'))
  assert.ok(rideSchema.additionalProperty.some((property) => property.name === 'Operating status'))
})

test('upcoming attractions stay excluded without being described as historical rides', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const base = park.attractions.find((ride) => ride.status === 'open')
  const fixture = { ...base, status: 'under-construction', isOpen: false, closedNote: 'Not yet open.' }
  const page = attractionPage(fixture, data)
  assert.match(page.html, /Recorded minimum height/)
  assert.match(page.html, /Recorded ride facts/)
  assert.doesNotMatch(page.html, /Former minimum height|Historical ride facts|Best time to ride/)
  assert.equal(schema(page).find((item) => item['@type'] === 'TouristAttraction').publicAccess, false)
})

test('current rankings exclude stale entries that point at closed attraction records', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const base = park.attractions.find((ride) => ride.status === 'open')
  const closed = { ...base, slug: 'retired-fixture', name: 'Retired Fixture', status: 'closed', isOpen: true }
  const modified = {
    ...park,
    attractionBySlug: new Map([...park.attractionBySlug, [closed.slug, closed]]),
    bestRides: { ...park.bestRides, ranking: [{ slug: closed.slug, rank: 1, headline: 'Retired Fixture', why: [] }], overrated: [], underrated: [] },
  }
  assert.doesNotMatch(bestRidesPage(modified, data).html, /Retired Fixture/)
})

test('family measurement guidance rejects shoe-gain and no-remeasurement promises', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  for (const page of [heightCheckerPage(data), heightsPage(park, data), myRidersPage(data)]) {
    assert.match(page.html, /Guest Relations/)
    assert.match(page.html, /attraction staff make the final eligibility determination/i)
    assert.match(page.html, /maximum height/i)
    assert.match(page.html, /accompan/i)
    assert.doesNotMatch(page.html, /will not be re-measured|Thick-soled|add the sole thickness|verified rideable/)
  }
})

test('Magic Mountain current height data and authored itineraries agree after the pre-visit corrections', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const checker = payload(heightCheckerPage(data), 'height-data').parks.find((item) => item.name === park.name)
  const minimum = (name) => checker.rides.find((ride) => ride.n === name)?.h
  assert.equal(minimum('Gold Rusher'), 48)
  assert.equal(minimum('West Coast Racers'), 54)
  assert.equal(minimum('Ninja'), 42)
  assert.equal(minimum('Full Throttle'), 54)
  assert.ok(checker.rides.every((ride) => !/^X2$|^Superman:/i.test(ride.n)))
  const heights = heightsPage(park, data).html
  assert.doesNotMatch(heights, />X2<|>Superman: Escape from Krypton</)
  const currentDirectory = ridesPage(park, data).html.split('Closed and non-current catalog records')[0]
  assert.doesNotMatch(currentDirectory, />X2<|>Superman: Escape from Krypton</)
  const plans = payload(dayBlueprintPage(data), 'blueprint-data').parks.find((item) => item.name === park.name).plans
  for (const step of Object.values(plans).flat().filter((step) => /X2|Superman/.test(step.body))) {
    assert.match(step.body, /decommissioned|retired|no longer operating/)
    assert.match(step.body, /not part|unavailable|exclude|do not/i)
  }
  assert.doesNotMatch(firstTimerPage(park, data).html, /X2 first|Tatsu, Superman and Ninja|queue (?:for )?(?:X2|Superman)/i)
})

test('Magic Mountain paid-queue pages preserve current product distinctions and price evidence limits', async () => {
  const data = await loadData('coasterguide')
  const seasonal = await loadSeasonal('coasterguide', data)
  const guide = guidePage(data.guideBySlug.get('line-skip-passes'), data).html
  const price = seasonal.priceBySlug.get('line-skip')
  const prices = pricePage(price, seasonal).html
  for (const page of [guide, prices]) {
    assert.match(page, /Fast Lane Reserve/)
    assert.match(page, /Fast Lane Ultimate/)
    assert.match(page, /one reservation at a time/i)
    assert.match(page, /(?:not a guarantee of immediate boarding|not immediate boarding)/i)
    assert.match(page, /(?:Park admission is not included|Park admission and Fright Fest Haunted Attractions are not included)/)
    assert.match(page, /https:\/\/www\.sixflags\.com\/magicmountain\/fast-lane/)
    assert.doesNotMatch(page, /\[Fright Fest\]\(/)
    assert.doesNotMatch(page, /weekdays never|weekdays.*never buy|on a weekday, buy nothing|the middle tier discounts/i)
  }
  assert.ok(!price.rows.some((row) => /Magic Mountain/i.test(row.label)), 'an unassigned starting price must not become an inferred numerical range')
  assert.match(prices, /starting from \$49/i)
  assert.match(prices, /not a quote for October 15/i)
  assert.match(prices, /Each row keeps its stated observation date/)
  assert.doesNotMatch(prices, /Every figure here is a range|Checked October 2026\. Ranges/)
  const knott = price.rows.find((row) => /Knott.*per person/i.test(row.label))
  assert.deepEqual(knott.rangeUsd, [75, 130])
  assert.equal(knott.asOf, 'September 2026')
})

test('Fastrack pages distinguish separately verified California and Florida products and prices', async () => {
  const data = await loadData('coasterguide')
  const seasonal = await loadSeasonal('coasterguide', data)
  const guide = guidePage(data.guideBySlug.get('line-skip-passes'), data).html
  const price = seasonal.priceBySlug.get('line-skip')
  const prices = pricePage(price, seasonal).html
  for (const page of [guide, prices]) {
    assert.match(page, /LEGOLAND California/)
    assert.match(page, /LEGOLAND Florida/)
    assert.match(page, /Fastrack/)
    assert.match(page, /Galaxy (?:one-shots|One Shots)/)
    assert.match(page, /Gold excluding Galacticoaster|Gold excludes Galacticoaster/)
    assert.match(page, /Platinum including unlimited Galacticoaster|Platinum includes unlimited.*Galacticoaster/)
    assert.match(page, /https:\/\/www\.legoland\.com\/california\/tickets-passes\/extras-experiences\/fastrack\//)
    assert.match(page, /https:\/\/florida-support\.legoland\.com\/hc\/en-us\/articles\/25142420661661/)
    assert.doesNotMatch(page, /neither.*Legoland.*line-skip|Legoland.*sell no comparable product/i)
  }
  assert.match(prices, /\$20.*\$38.*\$89.*\$119/)
  assert.match(prices, /No Florida price is inferred here from California/)
  assert.ok(!price.rows.some((row) => /LEGOLAND/i.test(row.label)), 'starting quotes and an unquoted product must not become modeled ranges')
  for (const slug of ['legoland-california', 'legoland-florida']) {
    const park = data.parkBySlug.get(slug)
    const directory = ridesPage(park, data).html
    assert.doesNotMatch(directory, /Standby only/)
    assert.match(directory, /Check participation/)
  }
  const california = data.parkBySlug.get('legoland-california')
  const coaster = california.attractionBySlug.get('coastersaurus')
  assert.match(attractionPage(coaster, data).html, /Coastersaurus is excluded from Bronze/)
  assert.match(attractionPage(california.attractionBySlug.get('the-dragon'), data).html, /Bronze, Silver, Gold and Platinum/)
  const florida = data.parkBySlug.get('legoland-florida')
  assert.match(attractionPage(florida.attractionBySlug.get('the-dragon'), data).html, /participation unverified/)
})

test('current ownership explains the July 2024 combined parent without replacing distinct park products', async () => {
  const data = await loadData('coasterguide')
  const seasonal = await loadSeasonal('coasterguide', data)
  const pages = [
    guidePage(data.guideBySlug.get('line-skip-passes'), data),
    comparePage(data.compareBySlug.get('coaster-park-rankings'), data),
    ...companyPages(data, seasonal), ...resortPages(data),
    ...['annual-passes', 'park-tickets'].map((slug) => pricePage(seasonal.priceBySlug.get(slug), seasonal)),
  ]
  for (const page of pages) {
    assert.match(page.html, /Six Flags Entertainment Corporation/)
    assert.match(page.html, /July 1, 2024/)
    assert.doesNotMatch(page.html, /four (?:different )?(?:park )?companies|four of the five companies|other three companies/i)
  }
  const sixFlags = companyPages(data, seasonal).find((page) => page.url === '/six-flags/')
  assert.match(sixFlags.html, /Knott[’']s Berry Farm belongs to that combined parent/)
  assert.match(sixFlags.html, /pre-merger-archive\/cedar-fair-lp/)
  assert.match(data.site.legal.disclaimer, /historical corporate or trademark name/)
})

test('the misplaced Fiesta Texas ride and quarry grouping cannot enter SeaWorld tools or inventory', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('seaworld-san-antonio')
  assert.ok(!park.attractionBySlug.has('iron-rattler'))
  assert.ok(!park.landBySlug.has('crackaxle-canyon'))
  assert.ok(!park.diningBySlug.has('canyon-snack-cart'))
  assert.ok(!park.foodById.has('swsa-funnel-cake'))
  assert.ok(foodTrackerOrder(data).ids.includes('swsa-funnel-cake'), 'saved-state bit position survives as a tombstone')
  const rio = park.attractionBySlug.get('rio-loco')
  assert.equal(rio.landInfo, null)
  assert.match(rio.landNote, /has not been verified/)
  const directory = ridesPage(park, data).html
  assert.match(directory, /Location unverified/)
  assert.doesNotMatch(directory, />Iron Rattler<|crackaxle-canyon/)
  assert.doesNotMatch(heightsPage(park, data).html, />Iron Rattler</)
  const checker = payload(heightCheckerPage(data), 'height-data').parks.find((item) => item.name === park.name)
  assert.ok(checker.rides.every((ride) => ride.n !== 'Iron Rattler'))
  assert.ok(riderDataPayload(data).attractions.every((ride) => ride.n !== 'Iron Rattler'))
  assert.ok(payload(careerLadderPage(data), 'career-data').coasters.every((ride) => ride.n !== 'Iron Rattler'))
  const plans = payload(dayBlueprintPage(data), 'blueprint-data').parks.find((item) => item.name === park.name).plans
  assert.doesNotMatch(JSON.stringify(plans), /Iron Rattler|quarry|crackaxle/i)
  assert.doesNotMatch(guidePage(data.guideBySlug.get('height-requirements'), data).html, /Iron Rattler/)
  const rankings = comparePage(data.compareBySlug.get('coaster-park-rankings'), data).html
  assert.match(rankings, /Placement provisional/)
  assert.match(rankings, /https:\/\/www\.sixflags\.com\/fiestatexas\/attractions\/iron-rattler/)
  assert.doesNotMatch(rankings, /Iron Rattler alone justifies|Iron Rattler is the mission/)
})

test('accessibility availability keeps unverified, verified denial and offered services distinct', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const fixture = {
    ...park.attractions.find((ride) => ride.status === 'open'),
    accessibility: { audioDescription: null, handheldCaptioning: false, assistiveListening: true, signLanguage: undefined },
  }
  const page = attractionPage(fixture, data).html
  assert.match(page, /Audio description<\/dt>\s*<dd>Check with Guest Relations/)
  assert.match(page, /Handheld captioning<\/dt>\s*<dd>Not offered/)
  assert.match(page, /Assistive listening<\/dt>\s*<dd>Available/)
  assert.match(page, /Sign language<\/dt>\s*<dd>Check with Guest Relations/)
})

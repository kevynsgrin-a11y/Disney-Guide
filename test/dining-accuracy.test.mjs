import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData, operators } from '../src/lib/data.mjs'
import { diningHub, restaurantPage, snacksPage } from '../src/pages/dining.mjs'
import { parkHub, landPage } from '../src/pages/park.mjs'
import { foodTrackerPage } from '../src/pages/tools.mjs'

function visibleMain (page) {
  const main = page.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)
  assert.ok(main, 'the page must contain a visible main section')
  return main[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

test('Magic Mountain dining labels canonical coverage and preserves unverified legacy identities', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  const hub = visibleMain(diningHub(park, data))
  const listed = park.dining.filter((record) => record.listingStatus === 'listed')
  const legacy = park.dining.filter((record) => record.listingStatus === 'unverified')
  assert.match(hub, new RegExp(`${park.dining.length} dining records covered`))
  assert.match(hub, new RegExp(`${listed.length} source-listed venues and ${legacy.length} unverified legacy records`))
  assert.match(hub, /not the park’s complete dining inventory/)
  assert.doesNotMatch(hub, /All \d+ places to eat|Every dining location in the park|60-day scramble/)
  const primo = park.dining.find((record) => record.slug === 'primos-pizzeria')
  assert.equal(primo.land, 'baja-ridge')
  assert.equal(primo.mobileOrder, false)
  assert.equal(primo.diningPlan, true)
  assert.equal(primo.airConditioned, null)
  assert.equal(primo.indoorSeating, null)
  assert.equal(primo.outdoorSeating, true)
  const factory = park.dining.find((record) => record.slug === 'funnel-cake-factory')
  const oldCart = park.dining.find((record) => record.slug === 'sweet-tooth-cart')
  assert.ok(factory && oldCart, 'the official factory is a separate record from the unverified old cart')
  assert.notEqual(factory.slug, oldCart.slug)
  const jb = park.dining.find((record) => record.slug === 'jbs-smokehouse')
  assert.equal(jb.hasPage, true, 'existing detail URL remains available')
  const page = restaurantPage(jb, data)
  const text = visibleMain(page)
  assert.match(text, /Legacy venue record|legacy catalog record/)
  assert.match(text, /current venue identity|current name|verify that name as a current/)
  assert.match(text, /not a firsthand restaurant review/)
  assert.doesNotMatch(text, /best hot lunch|brisket is genuinely decent|app ordering skips/)
  assert.doesNotMatch(page.html, /"priceRange"|"acceptsReservations"/)
})

test('Magic Mountain food retains tracker IDs while withdrawing unverified prices, ratings and dietary assurances', async () => {
  const data = await loadData('coasterguide')
  const park = data.parkBySlug.get('magic-mountain')
  assert.deepEqual(park.food.map((item) => item.id), ['sfmm-funnel-cake', 'sfmm-brisket-plate', 'sfmm-churro', 'sfmm-turkey-leg'])
  for (const item of park.food) {
    assert.equal(item.price, null)
    assert.equal(item.priceVerified, null, 'unknown prices cannot carry a fabricated verification date')
    assert.deepEqual(item.dietaryTags, [])
    assert.equal(item.mustTry, null, 'an unperformed tasting is not a ranked review')
  }
  for (const page of [snacksPage(park, data), foodTrackerPage(data)]) {
    const cards = page.html.match(/<article class="food-card"[^>]*data-park="magic-mountain"[\s\S]*?<\/article>/g) || []
    assert.equal(cards.length, park.food.length)
    for (const card of cards) {
      assert.match(card, /Price unverified/)
      assert.match(card, /data-price=""/)
      assert.match(card, /data-diet=""/)
      assert.doesNotMatch(card, /\$0\b|data-price="0"|dietary-tags/)
    }
    const legacyCard = cards.find((card) => card.includes('data-food-id="sfmm-brisket-plate"'))
    const printedWhere = legacyCard.match(/<p class="food-card__where">([\s\S]*?)<\/p>/)?.[1]
    assert.match(printedWhere, /Legacy item; current availability unverified/, 'the venue line preserves its legacy qualification when print CSS hides descriptions and verdicts')
    assert.equal((printedWhere.match(/Legacy item; current availability unverified/g) || []).length, 1, 'the availability qualification appears once')
    assert.doesNotMatch(visibleMain(page), /every one with a price we checked|of them, with checked prices/i)
  }
  const text = visibleMain(snacksPage(park, data))
  assert.match(text, /source-based pre-visit descriptions, not firsthand tasting reviews/)
  assert.match(text, /ask staff about the specific item and cross-contact/)
  assert.doesNotMatch(text, /Prices verified|Average price|Cheapest|Do-not-miss/)
  const hub = visibleMain(parkHub(park, data))
  assert.match(hub, new RegExp(`${park.dining.length} dining records covered`))
  assert.doesNotMatch(hub, /4 tracked items with prices/)
  const plaza = park.lands.find((land) => land.slug === 'six-flags-plaza')
  const land = landPage(plaza, data)
  assert.match(visibleMain(land), /Price unverified/)
})

test('a missing snack price has no zero numeric sort key even in a highlighted row', async () => {
  const data = await loadData('coasterguide')
  const original = data.parkBySlug.get('magic-mountain')
  const park = { ...original, topFood: [{ ...original.food[0], mustTry: 4 }] }
  const page = snacksPage(park, data)
  assert.match(visibleMain(page), /Price unverified/)
  assert.doesNotMatch(page.html, /data-value="0"|\$0\b/)
})

test('Disney dining retains its existing table-service reservation advice', async () => {
  const data = await loadData('disney')
  const park = data.parkBySlug.get('magic-kingdom')
  const page = diningHub(park, data)
  assert.match(visibleMain(page), /reservations are worth/)
  assert.doesNotMatch(visibleMain(page), /October 15, 2026 visit|unverified legacy records/)
})

test('canonical dining fragment links resolve to unique venue cards across all operators', async () => {
  const idsIn = (page) => [...page.html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  const uniqueIds = (page) => {
    const ids = idsIn(page)
    assert.equal(new Set(ids).size, ids.length, `${page.url} must not repeat an HTML ID`)
    return ids
  }
  let anchoredVenues = 0
  for (const operator of await operators()) {
    const data = await loadData(operator.slug)
    for (const park of data.parks) {
      const directory = diningHub(park, data)
      const directoryIds = uniqueIds(directory)
      uniqueIds(parkHub(park, data))
      for (const land of park.lands) uniqueIds(landPage(land, data))
      for (const venue of park.dining.filter((record) => !record.hasPage)) {
        const link = new URL(venue.url, data.site.brand.origin)
        assert.equal(link.pathname, directory.url, `${venue.name} uses the existing canonical dining directory`)
        assert.equal(decodeURIComponent(link.hash.slice(1)), venue.slug)
        assert.equal(directoryIds.filter((id) => id === venue.slug).length, 1, `${venue.url} resolves to exactly one venue target`)
        const card = directory.html.match(new RegExp(`<article\\b[^>]*\\bid="${venue.slug}"[^>]*>([\\s\\S]*?)<\\/article>`))
        assert.ok(card, `${venue.name} has a card at its fragment target`)
        assert.ok(card[1].includes(`href="${venue.url}"`), 'the card keeps its canonical link')
        anchoredVenues++
      }
    }
  }
  assert.ok(anchoredVenues > 0, 'the regression checks actual non-standalone venue links')
})

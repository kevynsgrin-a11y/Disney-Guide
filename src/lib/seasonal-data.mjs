/**
 * Loads every JSON file under data/seasonal/ and builds the derived indexes the Site 2 page
 * generators need. Mirrors src/lib/data.mjs, including the rule that this module is the single
 * source of truth for URLs — nothing else may build a path by hand.
 *
 * What it adds over Site 1's loader is cross-site integrity. Site 2's whole strategic purpose is
 * pointing at Site 1 for the permanent facts it refuses to restate, so an event naming a park, an
 * attraction, or a page that does not exist over there is a shipping-stopper. Every unresolved
 * reference is collected onto `data.integrity` instead of being quietly dropped, and
 * `assertIntegrity()` turns that list into a build failure.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT, loadData, urls as evergreenUrls } from './data.mjs'
import { staleness } from './staleness.mjs'

export const SEASONAL_DATA_DIR = join(ROOT, 'data', 'seasonal')
export const SEASONAL_DIST_DIR = join(ROOT, 'dist-seasonal')

export const MONTHS = [
  { month: 1, name: 'January', slug: 'january' },
  { month: 2, name: 'February', slug: 'february' },
  { month: 3, name: 'March', slug: 'march' },
  { month: 4, name: 'April', slug: 'april' },
  { month: 5, name: 'May', slug: 'may' },
  { month: 6, name: 'June', slug: 'june' },
  { month: 7, name: 'July', slug: 'july' },
  { month: 8, name: 'August', slug: 'august' },
  { month: 9, name: 'September', slug: 'september' },
  { month: 10, name: 'October', slug: 'october' },
  { month: 11, name: 'November', slug: 'november' },
  { month: 12, name: 'December', slug: 'december' },
]

async function readJson (path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to read JSON at ${path}: ${err.message}`)
  }
}

async function readJsonDir (dir) {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
  return Promise.all(files.map((f) => readJson(join(dir, f))))
}

/* ------------------------------------------------------------------ *
 * URL builders — the only place Site 2 paths are constructed
 * ------------------------------------------------------------------ */

export const urls = {
  home: () => '/',
  calendar: () => '/calendar/',
  whenToGoIndex: () => '/when-to-go/',
  month: (slug) => `/when-to-go/${slug}/`,
  eventsIndex: () => '/events/',
  event: (slug) => `/events/${slug}/`,
  edition: (slug, year) => `/events/${slug}/${year}/`,
  holidaysIndex: () => '/holidays/',
  holiday: (slug) => `/holidays/${slug}/`,
  pricesIndex: () => '/prices/',
  price: (slug) => `/prices/${slug}/`,
  closuresIndex: () => '/closures/',
  closures: (resortSlug) => `/closures/${resortSlug}/`,
  toolsIndex: () => '/tools/',
  tripTiming: () => '/tools/trip-timing/',
  about: () => '/about/',
  editorial: () => '/editorial-policy/',
  affiliate: () => '/affiliate-disclosure/',
  privacy: () => '/privacy/',
  terms: () => '/terms/',
  contact: () => '/contact/',
}

/* ------------------------------------------------------------------ *
 * Site 1 cross-links
 * ------------------------------------------------------------------ */

/**
 * Site 1's origin, restated here because the builders below are synchronous and get used inside
 * template literals. `loadSite1Urls()` asserts it still matches data/site.json, so the copy cannot
 * drift into pointing a whole site's worth of cross-links at a dead domain.
 */
export const SITE1_ORIGIN = 'https://rideready.guide'

/**
 * Absolute Site 1 URLs, wrapped from Site 1's own builders rather than restated.
 *
 * Deriving them means a route renamed in data.mjs breaks here loudly at build time instead of
 * silently emitting cross-links to a 404 — which is the failure a reader would find first and we
 * would find last.
 */
export const site1 = Object.fromEntries([
  ['origin', SITE1_ORIGIN],
  ['abs', (path) => `${SITE1_ORIGIN}${path}`],
  ...Object.entries(evergreenUrls).map(([name, build]) => [name, (...args) => `${SITE1_ORIGIN}${build(...args)}`]),
])

/**
 * Every URL Site 1 actually publishes, as a Set, in both path (`/guides/`) and absolute
 * (`https://rideready.guide/guides/`) form — the schema shows one and describes the other, and an
 * author will write whichever they had to hand.
 *
 * Built from Site 1's own `urls` builders and its live dataset. Hand-writing the paths here would
 * only prove that this file agrees with itself, which is exactly the check that lets a broken
 * cross-link through.
 */
export async function loadSite1Urls (site1Data) {
  const data = site1Data || await loadData()
  if (data.site.brand.origin !== SITE1_ORIGIN) {
    throw new Error(`SITE1_ORIGIN is ${SITE1_ORIGIN} but data/site.json says ${data.site.brand.origin}. Every cross-link on Site 2 depends on these matching.`)
  }

  const paths = new Set()
  const add = (path) => { if (path) paths.add(path) }

  add(evergreenUrls.home())
  add(evergreenUrls.parksIndex())
  for (const resort of data.site.resorts || []) add(evergreenUrls.resort(resort.slug))

  for (const park of data.parks) {
    add(evergreenUrls.park(park))
    add(evergreenUrls.rides(park))
    if (park.bestRides) add(evergreenUrls.bestRides(park))
    add(evergreenUrls.heights(park))
    add(evergreenUrls.dining(park))
    add(evergreenUrls.snacks(park))
    add(evergreenUrls.map(park))
    add(evergreenUrls.accessibility(park))
    add(evergreenUrls.firstTimer(park))
    for (const land of park.lands) add(evergreenUrls.land(park, land.slug))

    // An attraction or restaurant without its own page lives as an anchor on the list page, and
    // data.mjs has already resolved which is which. `.url` is therefore the only form a cross-link
    // can legitimately use, so it is the form the set has to carry.
    for (const attraction of park.attractions) add(attraction.url)
    for (const restaurant of park.dining) add(restaurant.url)
    for (const item of park.food) add(`${evergreenUrls.snacks(park)}#${item.id}`)
  }

  if (data.guides.length) {
    add(evergreenUrls.guidesIndex())
    for (const guide of data.guides) add(evergreenUrls.guide(guide.slug))
  }
  if (data.compare.length) {
    add(evergreenUrls.compareIndex())
    for (const page of data.compare) add(evergreenUrls.compare(page.slug))
  }

  add(evergreenUrls.toolsIndex())
  add(evergreenUrls.foodTracker())
  add(evergreenUrls.heightChecker())
  add(evergreenUrls.about())
  add(evergreenUrls.editorial())
  add(evergreenUrls.affiliate())
  add(evergreenUrls.privacy())
  add(evergreenUrls.terms())
  add(evergreenUrls.contact())

  return new Set([...paths, ...[...paths].map((p) => `${SITE1_ORIGIN}${p}`)])
}

/* ------------------------------------------------------------------ *
 * Loader
 * ------------------------------------------------------------------ */

export async function loadSeasonal () {
  const site = await readJson(join(SEASONAL_DATA_DIR, 'site.json'))

  const events = (await readJsonDir(join(SEASONAL_DATA_DIR, 'events'))).filter((e) => e && e.slug)
  const months = (await readJsonDir(join(SEASONAL_DATA_DIR, 'months'))).filter((m) => m && m.month)
  const holidays = (await readJsonDir(join(SEASONAL_DATA_DIR, 'holidays'))).filter((h) => h && h.slug)
  const prices = (await readJsonDir(join(SEASONAL_DATA_DIR, 'prices'))).filter((p) => p && p.slug)
  const closures = (await readJsonDir(join(SEASONAL_DATA_DIR, 'closures'))).filter((c) => c && c.resort)

  const calendarPath = join(SEASONAL_DATA_DIR, 'calendar.json')
  const calendar = existsSync(calendarPath) ? await readJson(calendarPath) : { bands: [] }

  // Site 1's dataset is loaded on every seasonal build, not on demand: park slugs, attraction slugs,
  // and cross-link targets all resolve against it, and a check that can be skipped is a check that
  // will be.
  const site1Data = await loadData()
  const site1Urls = await loadSite1Urls(site1Data)

  return index({ site, events, months, holidays, prices, closures, calendar, site1Data, site1Urls })
}

/* ------------------------------------------------------------------ *
 * Derived indexes
 * ------------------------------------------------------------------ */

/** Group into a Map, letting one item land under several keys. */
function group (items, keysOf) {
  const map = new Map()
  for (const item of items) {
    for (const key of keysOf(item)) {
      if (!key) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
  }
  return map
}

function index (data) {
  const { events, months, holidays, prices, closures, calendar, site1Data, site1Urls } = data

  const integrity = []
  data.integrity = integrity
  const flag = (entity, field, value, message) => integrity.push({ entity, field, value, message })

  const home = { label: 'Home', href: urls.home() }
  const resortLabel = (slug) => {
    const resort = site1Data.resortBySlug.get(slug)
    return resort ? resort.shortName : slug
  }

  /**
   * Everything renderable carries a url, a trail, and a computed staleness. The staleness call is
   * unconditional on purpose: an entity with no freshness block resolves to `stale`, so a file that
   * skipped the contract cannot render as though it had met it.
   */
  const decorate = (entity, id, url, trail) => {
    entity.url = url
    entity.breadcrumbTrail = trail
    entity.staleness = staleness(entity.freshness)
    if (!entity.freshness) flag(id, 'freshness', null, 'No freshness block, so the page renders as stale until one is added.')
  }

  const checkCrossLinks = (entity, id) => {
    for (const link of entity.crossLinks || []) {
      link.resolved = site1Urls.has(link.href)
      if (!link.resolved) flag(id, 'crossLinks[].href', link.href, 'Not a URL Site 1 publishes.')
    }
  }

  /* ---------------- Events ---------------- */

  data.eventBySlug = new Map(events.map((e) => [e.slug, e]))

  for (const event of events) {
    const id = `events/${event.slug}`
    decorate(event, id, urls.event(event.slug), [
      home,
      { label: 'Events', href: urls.eventsIndex() },
      { label: event.shortName || event.name, href: urls.event(event.slug) },
    ])

    event.parkInfo = null
    event.parkUrl = null
    if (event.parkSlug) {
      event.parkInfo = site1Data.parkBySlug.get(event.parkSlug) || null
      if (event.parkInfo) event.parkUrl = site1.park(event.parkInfo)
      else flag(id, 'parkSlug', event.parkSlug, 'No park with this slug exists under Site 1 data/parks/.')
    }

    checkCrossLinks(event, id)

    event.editions = (event.editions || []).filter(Boolean)
    for (const edition of event.editions) {
      decorate(edition, `${id}#${edition.year}`, urls.edition(event.slug, edition.year), [
        home,
        { label: 'Events', href: urls.eventsIndex() },
        { label: event.shortName || event.name, href: urls.event(event.slug) },
        { label: String(edition.year), href: urls.edition(event.slug, edition.year) },
      ])
      edition.eventSlug = event.slug
    }
  }

  // Second pass: `related` can point at any event, including one loaded after it.
  for (const event of events) {
    event.relatedEvents = (event.related || [])
      .map((slug) => {
        const related = data.eventBySlug.get(slug)
        // Flagged, then excluded — an unresolved slug must not render as a link to nowhere, but it
        // must not vanish from the report either.
        if (!related) flag(`events/${event.slug}`, 'related[]', slug, 'No event with this slug.')
        return related
      })
      .filter(Boolean)
  }

  // An event marked `both` runs at each resort, so it belongs on each resort's list. Grouping on the
  // literal field value would file it under "both" and hide it from the two pages anyone reads.
  data.eventsByResort = group(events, (e) => (e.resort === 'both' ? ['walt-disney-world', 'disneyland'] : [e.resort]))
  data.eventsBySeason = group(events, (e) => [e.season])
  data.eventsByCategory = group(events, (e) => [e.category])

  /* ---------------- Months ---------------- */

  data.monthBySlug = new Map()
  data.monthByNumber = new Map()

  for (const month of months) {
    const canonical = MONTHS[month.month - 1]
    const id = `months/${String(month.month).padStart(2, '0')}`
    if (!canonical) {
      flag(id, 'month', month.month, 'Month number must be 1–12.')
      continue
    }
    month.name = month.name || canonical.name
    month.slug = month.slug || canonical.slug
    if (month.slug !== canonical.slug) {
      flag(id, 'slug', month.slug, `Month ${month.month} is "${canonical.slug}" — a mismatched slug publishes the page at a URL nothing links to.`)
    }

    decorate(month, id, urls.month(month.slug), [
      home,
      { label: 'When to go', href: urls.whenToGoIndex() },
      { label: month.name, href: urls.month(month.slug) },
    ])

    month.events = (month.whatsOn || [])
      .map((slug) => {
        const event = data.eventBySlug.get(slug)
        if (!event) flag(id, 'whatsOn[]', slug, 'No event with this slug.')
        return event
      })
      .filter(Boolean)

    checkCrossLinks(month, id)

    data.monthBySlug.set(month.slug, month)
    data.monthByNumber.set(month.month, month)
  }

  /* ---------------- Holidays, prices, closures ---------------- */

  data.holidayBySlug = new Map(holidays.map((h) => [h.slug, h]))
  for (const holiday of holidays) {
    const id = `holidays/${holiday.slug}`
    decorate(holiday, id, urls.holiday(holiday.slug), [
      home,
      { label: 'Holidays', href: urls.holidaysIndex() },
      { label: holiday.shortName || holiday.title || holiday.slug, href: urls.holiday(holiday.slug) },
    ])
    checkCrossLinks(holiday, id)
  }

  data.priceBySlug = new Map(prices.map((p) => [p.slug, p]))
  for (const price of prices) {
    const id = `prices/${price.slug}`
    decorate(price, id, urls.price(price.slug), [
      home,
      { label: 'Prices', href: urls.pricesIndex() },
      { label: price.shortName || price.title || price.slug, href: urls.price(price.slug) },
    ])
    checkCrossLinks(price, id)
  }

  data.closuresByResort = new Map(closures.map((c) => [c.resort, c]))
  for (const tracker of closures) {
    const id = `closures/${tracker.resort}`
    tracker.resortInfo = site1Data.resortBySlug.get(tracker.resort) || null
    if (!tracker.resortInfo) flag(id, 'resort', tracker.resort, 'No resort with this slug exists in Site 1 data.')

    decorate(tracker, id, urls.closures(tracker.resort), [
      home,
      { label: 'Closures', href: urls.closuresIndex() },
      { label: resortLabel(tracker.resort), href: urls.closures(tracker.resort) },
    ])

    tracker.items = (tracker.items || []).filter(Boolean)
    for (const item of tracker.items) {
      item.parkInfo = item.parkSlug ? site1Data.parkBySlug.get(item.parkSlug) || null : null
      if (item.parkSlug && !item.parkInfo) flag(id, 'items[].parkSlug', item.parkSlug, 'No park with this slug exists under Site 1 data/parks/.')

      item.attractionInfo = null
      item.attractionUrl = null
      if (item.attractionSlug) {
        item.attractionInfo = item.parkInfo ? item.parkInfo.attractionBySlug.get(item.attractionSlug) || null : null
        // A refurbishment tracker listing rides that do not exist is worse than no tracker, because
        // it is the page a reader checks precisely when they cannot verify it themselves.
        if (item.attractionInfo) item.attractionUrl = site1.abs(item.attractionInfo.url)
        else flag(id, 'items[].attractionSlug', item.attractionSlug, `Not an attraction at ${item.parkSlug || '(no park)'} in Site 1 data.`)
      }
    }
  }

  /* ---------------- Calendar ---------------- */

  data.calendar = calendar
  data.calendarBands = (calendar.bands || []).filter(Boolean)
  for (const band of data.calendarBands) {
    band.event = data.eventBySlug.get(band.eventSlug) || null
    if (!band.event) flag('calendar.json', 'bands[].eventSlug', band.eventSlug, 'No event with this slug.')
  }

  return data
}

/**
 * Throw if any cross-file reference failed to resolve.
 *
 * `loadSeasonal()` collects rather than throws so the validator can report every broken reference in
 * one pass instead of one per run. The build calls this, so nothing unresolved can reach
 * dist-seasonal/ on the argument that it was only a warning.
 */
export function assertIntegrity (data) {
  if (!data.integrity.length) return data
  const lines = data.integrity
    .map((i) => `  ${i.entity} · ${i.field}: ${i.value == null ? '(missing)' : i.value} — ${i.message}`)
    .join('\n')
  throw new Error(`${data.integrity.length} unresolved seasonal reference(s):\n${lines}`)
}

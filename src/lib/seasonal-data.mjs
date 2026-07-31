/**
 * Loads every JSON file under data/seasonal/ and builds the derived indexes the seasonal page
 * generators need.
 *
 * The seasonal data stays in its own tree because it is authored against its own contract
 * (docs/SEASONAL-SCHEMA.md) and decays on its own schedule. It does NOT get its own `urls` — those
 * live in ./data.mjs with every other route, because two URL builders on one origin is the drift
 * this codebase exists to prevent.
 *
 * What this adds over the evergreen loader is referential integrity against that dataset. A
 * seasonal page naming a park, an attraction, or an evergreen page that does not exist is a
 * shipping-stopper: every unresolved reference is collected onto `data.integrity` rather than being
 * quietly dropped, and `assertIntegrity()` turns that list into a build failure.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { ROOT, loadData, urls } from './data.mjs'
import { staleness } from './staleness.mjs'

export const SEASONAL_DATA_DIR = join(ROOT, 'data', 'seasonal')

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

/*
 * Routes come from ./data.mjs. Re-exported so the seasonal page modules keep one import, and so
 * there remains exactly one definition of every path on this site.
 */
export { urls }

/**
 * Every URL the evergreen side of the site publishes, as a Set of paths.
 *
 * Built from the shared `urls` builders and the live dataset. Hand-writing the paths here would
 * only prove that this file agrees with itself, which is exactly the check that lets a broken
 * cross-link through.
 */
export async function evergreenUrlSet (site1Data) {
  const data = site1Data || await loadData()
  const paths = new Set()
  const add = (path) => { if (path) paths.add(path) }

  add(urls.home())
  add(urls.parksIndex())
  for (const resort of data.site.resorts || []) add(urls.resort(resort.slug))

  for (const park of data.parks) {
    add(urls.park(park))
    add(urls.rides(park))
    if (park.bestRides) add(urls.bestRides(park))
    add(urls.heights(park))
    add(urls.dining(park))
    add(urls.snacks(park))
    add(urls.map(park))
    add(urls.accessibility(park))
    add(urls.firstTimer(park))
    for (const land of park.lands) add(urls.land(park, land.slug))

    // An attraction or restaurant without its own page lives as an anchor on the list page, and
    // data.mjs has already resolved which is which. `.url` is therefore the only form a cross-link
    // can legitimately use, so it is the form the set has to carry.
    for (const attraction of park.attractions) add(attraction.url)
    for (const restaurant of park.dining) add(restaurant.url)
    for (const item of park.food) add(`${urls.snacks(park)}#${item.id}`)
  }

  if (data.guides.length) {
    add(urls.guidesIndex())
    for (const guide of data.guides) add(urls.guide(guide.slug))
  }
  if (data.compare.length) {
    add(urls.compareIndex())
    for (const page of data.compare) add(urls.compare(page.slug))
  }

  add(urls.toolsIndex())
  add(urls.foodTracker())
  add(urls.heightChecker())
  add(urls.about())
  add(urls.editorial())
  add(urls.affiliate())
  add(urls.privacy())
  add(urls.terms())
  add(urls.contact())

  return paths
}

/* ------------------------------------------------------------------ *
 * Loader
 * ------------------------------------------------------------------ */

export async function loadSeasonal () {
  const events = (await readJsonDir(join(SEASONAL_DATA_DIR, 'events'))).filter((e) => e && e.slug)
  const months = (await readJsonDir(join(SEASONAL_DATA_DIR, 'months'))).filter((m) => m && m.month)
  const holidays = (await readJsonDir(join(SEASONAL_DATA_DIR, 'holidays'))).filter((h) => h && h.slug)
  const prices = (await readJsonDir(join(SEASONAL_DATA_DIR, 'prices'))).filter((p) => p && p.slug)
  const closures = (await readJsonDir(join(SEASONAL_DATA_DIR, 'closures'))).filter((c) => c && c.resort)

  const calendarPath = join(SEASONAL_DATA_DIR, 'calendar.json')
  const calendar = existsSync(calendarPath) ? await readJson(calendarPath) : { bands: [] }

  // The evergreen dataset is loaded unconditionally: park slugs, attraction slugs, and cross-link
  // targets all resolve against it, and a check that can be skipped is a check that will be.
  const site1Data = await loadData()
  const site1Urls = await evergreenUrlSet(site1Data)

  return index({ site: site1Data.site, events, months, holidays, prices, closures, calendar, site1Data, site1Urls })
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
      if (!link.resolved) flag(id, 'crossLinks[].href', link.href, 'Not a URL this site publishes.')
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
      if (event.parkInfo) event.parkUrl = urls.park(event.parkInfo)
      else flag(id, 'parkSlug', event.parkSlug, 'No park with this slug exists under data/parks/.')
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
    if (!tracker.resortInfo) flag(id, 'resort', tracker.resort, 'No resort with this slug exists in data/site.json.')

    decorate(tracker, id, urls.closures(tracker.resort), [
      home,
      { label: 'Closures', href: urls.closuresIndex() },
      { label: resortLabel(tracker.resort), href: urls.closures(tracker.resort) },
    ])

    tracker.items = (tracker.items || []).filter(Boolean)
    for (const item of tracker.items) {
      item.parkInfo = item.parkSlug ? site1Data.parkBySlug.get(item.parkSlug) || null : null
      if (item.parkSlug && !item.parkInfo) flag(id, 'items[].parkSlug', item.parkSlug, 'No park with this slug exists under data/parks/.')

      item.attractionInfo = null
      item.attractionUrl = null
      if (item.attractionSlug) {
        item.attractionInfo = item.parkInfo ? item.parkInfo.attractionBySlug.get(item.attractionSlug) || null : null
        // A refurbishment tracker listing rides that do not exist is worse than no tracker, because
        // it is the page a reader checks precisely when they cannot verify it themselves.
        if (item.attractionInfo) item.attractionUrl = item.attractionInfo.url
        else flag(id, 'items[].attractionSlug', item.attractionSlug, `Not an attraction at ${item.parkSlug || '(no park)'} in data/parks/.`)
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
 * dist/ on the argument that it was only a warning.
 */
export function assertIntegrity (data) {
  if (!data.integrity.length) return data
  const lines = data.integrity
    .map((i) => `  ${i.entity} · ${i.field}: ${i.value == null ? '(missing)' : i.value} — ${i.message}`)
    .join('\n')
  throw new Error(`${data.integrity.length} unresolved seasonal reference(s):\n${lines}`)
}

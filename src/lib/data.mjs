/**
 * Loads one operator's dataset and builds the derived indexes the page generators need.
 * This module is the single source of truth for URLs — nothing else may build a path by hand.
 *
 * Each operator in data/operators.json is a complete, independently-branded site on its own domain.
 * They share this generator and nothing else, so everything here takes the operator as an argument
 * rather than reaching for a global: two operators must be loadable in one process without one
 * leaking into the other.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DATA_DIR = join(ROOT, 'data')
export const DIST_DIR = join(ROOT, 'dist')
export const ASSETS_DIR = join(ROOT, 'assets')

/**
 * Park order is derived from each site's `resorts[].parks`, never declared twice.
 *
 * It used to be a hardcoded list of six Disney park slugs here. That list and the one in site.json
 * were the same information in two files, which is a drift waiting to happen — and it made a second
 * operator impossible without editing this module.
 */
export function parkOrder (site) {
  return (site.resorts || []).flatMap((resort) => resort.parks || [])
}

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
 * URL builders — the only place paths are constructed
 * ------------------------------------------------------------------ */

export const urls = {
  home: () => '/',
  parksIndex: () => '/parks/',
  resort: (resortSlug) => `/${resortSlug}/`,
  park: (park) => `/${park.resort}/${park.slug}/`,
  rides: (park) => `/${park.resort}/${park.slug}/rides/`,
  bestRides: (park) => `/${park.resort}/${park.slug}/best-rides/`,
  ride: (park, slug) => `/${park.resort}/${park.slug}/rides/${slug}/`,
  land: (park, slug) => `/${park.resort}/${park.slug}/lands/${slug}/`,
  heights: (park) => `/${park.resort}/${park.slug}/height-requirements/`,
  dining: (park) => `/${park.resort}/${park.slug}/dining/`,
  restaurant: (park, slug) => `/${park.resort}/${park.slug}/dining/${slug}/`,
  snacks: (park) => `/${park.resort}/${park.slug}/best-snacks/`,
  map: (park) => `/${park.resort}/${park.slug}/map/`,
  accessibility: (park) => `/${park.resort}/${park.slug}/accessibility/`,
  firstTimer: (park) => `/${park.resort}/${park.slug}/first-timer-guide/`,
  guidesIndex: () => '/guides/',
  guide: (slug) => `/guides/${slug}/`,
  compareIndex: () => '/compare/',
  compare: (slug) => `/compare/${slug}/`,
  toolsIndex: () => '/tools/',
  foodTracker: () => '/tools/food-tracker/',
  heightChecker: () => '/tools/height-checker/',
  tripTiming: () => '/tools/trip-timing/',

  /*
   * Seasonal routes.
   *
   * These began life in a second module for a second domain. They live here now because the two
   * sites merged, and two `urls` objects on one origin is exactly the drift this file exists to
   * prevent — the moment a route is defined twice, one copy starts lying.
   */
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

  about: () => '/about/',
  editorial: () => '/editorial-policy/',
  affiliate: () => '/affiliate-disclosure/',
  privacy: () => '/privacy/',
  terms: () => '/terms/',
  contact: () => '/contact/',
}

/* ------------------------------------------------------------------ *
 * Loader
 * ------------------------------------------------------------------ */

export async function operators () {
  const registry = await readJson(join(DATA_DIR, 'operators.json'))
  return (registry.operators || []).filter((o) => o && o.slug)
}

/**
 * Which operators a command should act on, given what was asked for on the command line.
 *
 * This is the one place `status: "draft"` means anything, and it has to be one place. Five entry
 * points — both validators, both fact checkers, the build and the audit — each pick their own
 * targets, and a rule about which sites are publishable that is implemented five times is a rule
 * that will eventually be implemented four times.
 *
 * Naming an operator explicitly always selects it, draft or not, so a half-built site is fully
 * checkable on demand:
 *
 *   npm run check              → live operators only
 *   node src/build.mjs universal → that one, whatever its status
 *
 * A draft is therefore never gated by default and never built by default, which is what keeps a
 * registered-but-unfinished operator from either reddening the live site's CI or, much worse,
 * shipping to dist/ because someone forgot it was in the registry.
 */
export async function resolveTargets (requested, { label = '' } = {}) {
  const all = await operators()

  if (requested.length) {
    return requested.map((slug) => {
      const found = all.find((o) => o.slug === slug)
      if (!found) throw new Error(`Unknown operator "${slug}". data/operators.json declares: ${all.map((o) => o.slug).join(', ')}`)
      return found
    })
  }

  const live = all.filter((o) => o.status !== 'draft')
  const drafts = all.filter((o) => o.status === 'draft')
  if (drafts.length) {
    // Announced, never silent. A skipped operator that nobody is told about is how a draft stays a
    // draft for a year without anyone noticing it was never finished.
    console.log(`  Skipping ${drafts.length} draft operator${drafts.length === 1 ? '' : 's'}: ${drafts.map((o) => o.slug).join(', ')}${label ? ` (${label} with the slug to include one)` : ''}`)
  }
  return live
}

export async function operatorDir (slug) {
  const found = (await operators()).find((o) => o.slug === slug)
  if (!found) {
    const known = (await operators()).map((o) => o.slug).join(', ')
    throw new Error(`Unknown operator "${slug}". data/operators.json declares: ${known}`)
  }
  return join(DATA_DIR, found.dir || found.slug)
}

export async function loadData (operatorSlug = 'disney') {
  const dataDir = await operatorDir(operatorSlug)
  const site = await readJson(join(dataDir, 'site.json'))
  site.operator = site.operator || operatorSlug

  const parks = []
  for (const slug of parkOrder(site)) {
    const dir = join(dataDir, 'parks', slug)
    if (!existsSync(join(dir, 'park.json'))) continue
    const park = await readJson(join(dir, 'park.json'))
    const attractionsFile = existsSync(join(dir, 'attractions.json'))
      ? await readJson(join(dir, 'attractions.json'))
      : { attractions: [] }
    const diningFile = existsSync(join(dir, 'dining.json'))
      ? await readJson(join(dir, 'dining.json'))
      : { dining: [] }
    const foodFile = existsSync(join(dir, 'food.json'))
      ? await readJson(join(dir, 'food.json'))
      : { items: [] }
    const map = existsSync(join(dir, 'map.json')) ? await readJson(join(dir, 'map.json')) : null
    /*
     * PNG plates are rendered by a separate Playwright step and are a convenience format — the SVG
     * is always generated by the build itself. Offering the download unconditionally means a park
     * whose PNG has not been rendered ships a button that 404s, so the page asks whether the file is
     * actually there.
     */
    const hasMapPng = existsSync(join(ASSETS_DIR, 'img', 'maps', `${slug}-map@2x.png`))
    const bestRides = existsSync(join(dir, 'best-rides.json'))
      ? await readJson(join(dir, 'best-rides.json'))
      : null

    park.attractions = attractionsFile.attractions || []
    park.dining = diningFile.dining || []
    park.food = foodFile.items || []
    park.map = map
    park.hasMapPng = hasMapPng
    park.bestRides = bestRides
    parks.push(park)
  }

  const guides = (await readJsonDir(join(dataDir, 'guides'))).filter((g) => g && g.slug)
  const compare = (await readJsonDir(join(dataDir, 'compare'))).filter((c) => c && c.slug)
  const legalPath = join(dataDir, 'legal.json')
  const legal = existsSync(legalPath) ? await readJson(legalPath) : { pages: [] }
  const orderPath = join(dataDir, 'food-order.json')
  const foodOrder = existsSync(orderPath) ? await readJson(orderPath) : { version: 1, ids: [] }

  return index({ site, parks, guides, compare, legal, foodOrder, dataDir, operator: operatorSlug })
}

/* ------------------------------------------------------------------ *
 * Derived indexes
 * ------------------------------------------------------------------ */

function index (data) {
  const { site, parks } = data

  /*
   * Queue-product labels are resolved here rather than in the templates.
   *
   * The field values are operator-neutral — an attraction is either covered by the paid
   * queue-skipping product or it is not — but the product's NAME is not. Disney sells Lightning
   * Lane, Universal sells Express Pass, and a component that hardcodes either is wrong on the other
   * site. The components stay dumb and render a resolved string.
   */
  const queue = site.queue || {}
  const queueLabels = queue.labels || {}
  const queueShort = queue.short || {}

  data.parkBySlug = new Map(parks.map((p) => [p.slug, p]))
  data.resortBySlug = new Map(site.resorts.map((r) => [r.slug, r]))

  // Attach the parks list to each resort, in canonical order.
  for (const resort of site.resorts) {
    resort.parkList = (resort.parks || [])
      .map((slug) => data.parkBySlug.get(slug))
      .filter(Boolean)
  }

  for (const park of parks) {
    park.resortInfo = data.resortBySlug.get(park.resort) || null
    park.url = urls.park(park)
    // A compact label for titles and table cells. Attraction names repeat across resorts
    // (Space Mountain, Haunted Mansion, Pirates), so titles must disambiguate by park.
    park.shortLabel = (park.shortName || park.name).replace(/^Disney's\s+/, '').replace(/^Disney\s+/, '')

    park.landBySlug = new Map((park.lands || []).map((l) => [l.slug, l]))
    park.attractionBySlug = new Map(park.attractions.map((a) => [a.slug, a]))
    park.diningBySlug = new Map(park.dining.map((d) => [d.slug, d]))
    park.foodById = new Map(park.food.map((f) => [f.id, f]))

    for (const attraction of park.attractions) {
      attraction.park = park
      attraction.landInfo = park.landBySlug.get(attraction.land) || null
      attraction.url = attraction.standalonePage
        ? urls.ride(park, attraction.slug)
        : `${urls.rides(park)}#${attraction.slug}`
      attraction.hasPage = Boolean(attraction.standalonePage)
      attraction.isOpen = (attraction.status || 'open') === 'open'
      attraction.queueLabel = queueLabels[attraction.lightningLane] || 'Standby only'
      attraction.queueLabelShort = queueShort[attraction.lightningLane] || 'Standby'
    }
    for (const restaurant of park.dining) {
      restaurant.park = park
      restaurant.landInfo = park.landBySlug.get(restaurant.land) || null
      restaurant.url = restaurant.standalonePage
        ? urls.restaurant(park, restaurant.slug)
        : `${urls.dining(park)}#${restaurant.slug}`
      restaurant.hasPage = Boolean(restaurant.standalonePage)
    }
    for (const item of park.food) {
      item.parkSlug = park.slug
      item.parkName = park.name
      item.restaurantInfo = item.restaurantSlug ? park.diningBySlug.get(item.restaurantSlug) || null : null
    }

    // Per-land rollups, ordered as the author declared.
    for (const land of park.lands || []) {
      land.park = park
      land.url = urls.land(park, land.slug)
      land.attractions = park.attractions.filter((a) => a.land === land.slug)
      land.dining = park.dining.filter((d) => d.land === land.slug)
      land.food = park.food.filter((f) => f.land === land.slug)
      land.anchorInfo = land.anchorAttraction ? park.attractionBySlug.get(land.anchorAttraction) || null : null
    }
    park.lands = (park.lands || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99))

    // Height rollup: every attraction with a requirement, tallest last.
    park.heightAttractions = park.attractions
      .filter((a) => a.heightIn != null && a.isOpen)
      .sort((a, b) => a.heightIn - b.heightIn || a.name.localeCompare(b.name))
    park.noHeightAttractions = park.attractions
      .filter((a) => a.heightIn == null && a.isOpen)
      .sort((a, b) => a.name.localeCompare(b.name))

    park.headliners = park.attractions
      .filter((a) => a.tier === 'headliner' && a.isOpen)
      .sort((a, b) => a.name.localeCompare(b.name))
    park.pagedAttractions = park.attractions.filter((a) => a.hasPage)
    park.pagedDining = park.dining.filter((d) => d.hasPage)
    park.closedAttractions = park.attractions.filter((a) => (a.status || 'open') !== 'open')

    park.topFood = park.food
      .slice()
      .sort((a, b) => (b.mustTry || 0) - (a.mustTry || 0) || a.name.localeCompare(b.name))

    park.breadcrumbTrail = [
      { label: 'Home', href: urls.home() },
      { label: park.resortInfo ? park.resortInfo.shortName : park.resort, href: urls.resort(park.resort) },
      { label: park.name, href: park.url },
    ]
  }

  // Cross-park indexes.
  data.allAttractions = parks.flatMap((p) => p.attractions)
  data.allFood = parks.flatMap((p) => p.food)
  data.allDining = parks.flatMap((p) => p.dining)
  data.allHeightAttractions = parks.flatMap((p) => p.heightAttractions)

  // Distinct height thresholds across the whole site, ascending.
  data.heightThresholds = [...new Set(data.allHeightAttractions.map((a) => a.heightIn))]
    .sort((a, b) => a - b)

  // The queue product's own name and guide slug, for the pages that reference it in prose.
  data.queue = {
    name: queue.name || 'Lightning Lane',
    guideSlug: queue.guideSlug || 'lightning-lane',
  }

  data.guideBySlug = new Map(data.guides.map((g) => [g.slug, g]))
  data.compareBySlug = new Map(data.compare.map((c) => [c.slug, c]))

  /*
   * Cross-link roles, resolved to hrefs — or to null, which is the important half.
   *
   * A template that wants to link "the rider-switch guide" cannot name a slug, because one operator
   * calls it Rider Switch, another calls it Child Swap, and a third may not have one. Hard-coding a
   * slug in a shared template is how a second operator ends up shipping pages that link to
   * /guides/rider-switch/ and /compare/best-disney-park-for-food/, neither of which it has.
   *
   * Each role resolves against the pages this operator actually built, so a missing or unmapped role
   * becomes null and the link components drop it. A cross-link is a courtesy; a 404 is a defect.
   */
  const roles = site.crossLinks || {}
  const resolve = (map, has, toUrl) => Object.fromEntries(
    Object.entries(map || {}).map(([role, slug]) => [role, slug && has(slug) ? toUrl(slug) : null])
  )
  data.link = {
    ...resolve(roles.guides, (s) => data.guideBySlug.has(s), (s) => urls.guide(s)),
    ...resolve(roles.compare, (s) => data.compareBySlug.has(s), (s) => urls.compare(s)),
  }

  // The same mapping as slugs, for the places that need the document rather than a URL.
  data.roleSlug = {
    ...resolve(roles.guides, (s) => data.guideBySlug.has(s), (s) => s),
    ...resolve(roles.compare, (s) => data.compareBySlug.has(s), (s) => s),
  }

  return data
}

/**
 * Canonical, append-only ordering of every food item id on the site.
 *
 * The Food Tracker encodes saved state as two bits per id over this exact order, so a share link is
 * only readable against the same ordering that produced it. Deriving the order from the current
 * dataset — even sorted deterministically — is NOT append-only: inserting "mk-apple" ahead of
 * "mk-banana" shifts every position after it and silently corrupts every link ever shared.
 *
 * So the order is persisted in data/food-order.json and only ever grows. New ids are appended;
 * removed ids stay as tombstones so nothing behind them moves. `changed` tells the build whether to
 * write the manifest back.
 */
export function foodTrackerOrder (data) {
  const manifest = data.foodOrder && Array.isArray(data.foodOrder.ids) ? data.foodOrder : { version: 1, ids: [] }
  const known = new Set(manifest.ids)
  const ids = manifest.ids.slice()

  const fresh = []
  for (const park of data.parks) {
    for (const id of park.food.map((f) => f.id).sort()) {
      if (!known.has(id)) { fresh.push(id); known.add(id) }
    }
  }
  ids.push(...fresh)

  const live = new Set(data.allFood.map((f) => f.id))
  const tombstones = ids.filter((id) => !live.has(id))

  return { ids, appended: fresh, tombstones, changed: fresh.length > 0 }
}

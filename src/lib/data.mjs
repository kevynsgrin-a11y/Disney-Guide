/**
 * Loads every JSON file under data/ and builds the derived indexes the page generators need.
 * This module is the single source of truth for URLs — nothing else may build a path by hand.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DATA_DIR = join(ROOT, 'data')
export const DIST_DIR = join(ROOT, 'dist')
export const ASSETS_DIR = join(ROOT, 'assets')

export const PARK_ORDER = [
  'magic-kingdom',
  'epcot',
  'hollywood-studios',
  'animal-kingdom',
  'disneyland-park',
  'california-adventure',
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
 * URL builders — the only place paths are constructed
 * ------------------------------------------------------------------ */

export const urls = {
  home: () => '/',
  parksIndex: () => '/parks/',
  resort: (resortSlug) => `/${resortSlug}/`,
  park: (park) => `/${park.resort}/${park.slug}/`,
  rides: (park) => `/${park.resort}/${park.slug}/rides/`,
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

export async function loadData () {
  const site = await readJson(join(DATA_DIR, 'site.json'))

  const parks = []
  for (const slug of PARK_ORDER) {
    const dir = join(DATA_DIR, 'parks', slug)
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

    park.attractions = attractionsFile.attractions || []
    park.dining = diningFile.dining || []
    park.food = foodFile.items || []
    park.map = map
    parks.push(park)
  }

  const guides = (await readJsonDir(join(DATA_DIR, 'guides'))).filter((g) => g && g.slug)
  const compare = (await readJsonDir(join(DATA_DIR, 'compare'))).filter((c) => c && c.slug)
  const legalPath = join(DATA_DIR, 'legal.json')
  const legal = existsSync(legalPath) ? await readJson(legalPath) : { pages: [] }

  return index({ site, parks, guides, compare, legal })
}

/* ------------------------------------------------------------------ *
 * Derived indexes
 * ------------------------------------------------------------------ */

function index (data) {
  const { site, parks } = data

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

  data.guideBySlug = new Map(data.guides.map((g) => [g.slug, g]))
  data.compareBySlug = new Map(data.compare.map((c) => [c.slug, c]))

  return data
}

/**
 * Canonical, append-only ordering of every food item id on the site.
 * The Food Tracker encodes saved state as a bitfield over this exact order, so the order must be
 * derived deterministically and must never be reshuffled by editing content. Sorting by park order
 * then by id guarantees that adding an item only ever appends within its park block; the tracker
 * tolerates unknown ids and treats new ids as unset, so older share links still decode.
 */
export function foodTrackerOrder (data) {
  const out = []
  for (const slug of PARK_ORDER) {
    const park = data.parkBySlug.get(slug)
    if (!park) continue
    out.push(...park.food.map((f) => f.id).sort())
  }
  return out
}

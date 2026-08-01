/**
 * Data validator. Enforces docs/DATA-SCHEMA.md.
 *
 * Runs before every build. Errors fail the build; warnings are printed and do not.
 * Referential integrity across files is the point of this thing — a land slug typo in one file
 * silently produces an orphaned page otherwise.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The park list comes from the operator's own site.json rather than a table here.
 *
 * It used to be six hardcoded Disney rows. That made the validator itself an obstacle to adding a
 * second operator, which is the wrong place for one — a validator should be the last file you have
 * to edit to onboard new data, not the first.
 */
let DATA = join(ROOT, 'data')
let PARKS = []

async function loadParkTable (operatorSlug) {
  const { operatorDir, parkOrder } = await import('../src/lib/data.mjs')
  DATA = await operatorDir(operatorSlug)
  const site = JSON.parse(await readFile(join(DATA, 'site.json'), 'utf8'))
  const byPark = new Map()
  for (const resort of site.resorts || []) {
    for (const slug of resort.parks || []) byPark.set(slug, resort.slug)
  }
  PARKS = []
  for (const slug of parkOrder(site)) {
    const park = JSON.parse(await readFile(join(DATA, 'parks', slug, 'park.json'), 'utf8'))
    if (!park.idPrefix) err(`parks/${slug}/park.json`, 'missing "idPrefix" — food ids are namespaced by it')
    PARKS.push({ slug, resort: byPark.get(slug), prefix: park.idPrefix })
  }
  return site
}

const ATTRACTION_TYPES = new Set(['roller-coaster', 'dark-ride', 'water-ride', 'simulator', 'spinner',
  'show', 'stage-show', 'film', 'parade', 'fireworks', 'walkthrough', 'transportation', 'play-area',
  'character-meet', 'animal-experience', 'interactive-game', 'train', 'boat-ride'])
const TIERS = new Set(['headliner', 'major', 'minor'])
const STATUSES = new Set(['open', 'closed', 'under-construction', 'seasonal'])
const LL = new Set(['multi-pass', 'single-pass', 'none'])
const MOTION = new Set(['none', 'low', 'moderate', 'high'])
const WET = new Set(['none', 'light', 'soaked'])
const INOUT = new Set(['indoor', 'outdoor', 'mixed'])
const TRANSFER = new Set(['wheelchair-accessible', 'ecv-transfer', 'must-transfer'])
const SERVICE = new Set(['table-service', 'quick-service', 'snack-cart', 'lounge', 'bakery', 'food-truck'])
const RESERVATIONS = new Set(['essential', 'recommended', 'walk-up-ok', 'not-accepted'])
const TIERS_PRICE = new Set(['$', '$$', '$$$', '$$$$'])
const FOOD_CATEGORY = new Set(['sweet', 'savory', 'snack', 'drink', 'breakfast', 'treat-cart'])
const CALLOUT_TYPES = new Set(['tip', 'warning', 'note', 'money', 'legal'])

const errors = []
const warnings = []
const err = (where, message) => errors.push(`${where}: ${message}`)
const warn = (where, message) => warnings.push(`${where}: ${message}`)

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

/* ------------------------------------------------------------------ *
 * Field helpers
 * ------------------------------------------------------------------ */

function requireString (obj, key, where, { min = 1, max = Infinity } = {}) {
  const value = obj[key]
  if (typeof value !== 'string' || !value.trim()) { err(where, `missing required string "${key}"`); return false }
  if (value.length < min) err(where, `"${key}" is too short (${value.length} chars, need ${min})`)
  if (value.length > max) warn(where, `"${key}" is long (${value.length} chars, prefer under ${max})`)
  return true
}

function requireArray (obj, key, where, { min = 1, of = 'string' } = {}) {
  const value = obj[key]
  if (!Array.isArray(value)) { err(where, `missing required array "${key}"`); return false }
  if (value.length < min) err(where, `"${key}" needs at least ${min} entr${min === 1 ? 'y' : 'ies'} (has ${value.length})`)
  if (of === 'string') {
    value.forEach((v, i) => {
      if (typeof v !== 'string' || !v.trim()) err(where, `"${key}[${i}]" must be a non-empty string`)
    })
  }
  return true
}

function requireEnum (obj, key, set, where, { optional = false } = {}) {
  const value = obj[key]
  if (value == null) { if (!optional) err(where, `missing required "${key}"`); return }
  if (!set.has(value)) err(where, `"${key}" has invalid value "${value}" (expected one of: ${[...set].join(', ')})`)
}

function requireSlug (obj, key, where) {
  const value = obj[key]
  if (typeof value !== 'string' || !SLUG_RE.test(value)) {
    err(where, `"${key}" must be lowercase kebab-case (got ${JSON.stringify(value)})`)
    return false
  }
  return true
}

function checkVerified (obj, key, where, { optional = false } = {}) {
  const value = obj[key]
  if (value == null) { if (!optional) err(where, `missing "${key}" (expected "YYYY-MM")`); return }
  if (!MONTH_RE.test(value)) err(where, `"${key}" must look like "2026-07" (got ${JSON.stringify(value)})`)
}

function checkFaqs (faqs, where, { min = 0 } = {}) {
  if (faqs == null) { if (min) err(where, `missing "faqs" (need at least ${min})`); return }
  if (!Array.isArray(faqs)) { err(where, '"faqs" must be an array'); return }
  if (faqs.length < min) err(where, `"faqs" needs at least ${min} entries (has ${faqs.length})`)
  faqs.forEach((faq, i) => {
    if (!faq || typeof faq.q !== 'string' || !faq.q.trim()) err(where, `faqs[${i}].q is missing`)
    if (!faq || typeof faq.a !== 'string' || faq.a.trim().length < 20) err(where, `faqs[${i}].a is missing or too short`)
  })
}

function checkSections (sections, where, { min = 1 } = {}) {
  if (!Array.isArray(sections)) { err(where, 'missing "sections" array'); return }
  if (sections.length < min) err(where, `"sections" needs at least ${min} entries (has ${sections.length})`)
  const ids = new Set()
  sections.forEach((section, i) => {
    const at = `${where} sections[${i}]`
    if (!requireSlug(section, 'id', at)) return
    if (ids.has(section.id)) err(at, `duplicate section id "${section.id}"`)
    ids.add(section.id)
    requireString(section, 'heading', at)
    requireArray(section, 'body', at, { min: 1 })
    if (section.list != null) {
      if (!Array.isArray(section.list.items) || !section.list.items.length) err(at, 'list.items must be a non-empty array')
      if (section.list.style && !['bullet', 'number'].includes(section.list.style)) err(at, `list.style "${section.list.style}" is invalid`)
    }
    if (section.table != null) {
      const t = section.table
      if (!Array.isArray(t.columns) || !t.columns.length) err(at, 'table.columns must be a non-empty array')
      if (!Array.isArray(t.rows) || !t.rows.length) err(at, 'table.rows must be a non-empty array')
      else {
        t.rows.forEach((row, r) => {
          if (!Array.isArray(row)) err(at, `table.rows[${r}] must be an array`)
          else if (t.columns && row.length !== t.columns.length) {
            err(at, `table.rows[${r}] has ${row.length} cells but there are ${t.columns.length} columns`)
          }
        })
      }
    }
    if (section.callout != null) {
      if (!CALLOUT_TYPES.has(section.callout.type)) err(at, `callout.type "${section.callout.type}" is invalid`)
      if (typeof section.callout.body !== 'string' || !section.callout.body.trim()) err(at, 'callout.body is missing')
    }
  })
}

/* Catch prose that leaked a template placeholder or the schema's own filler. */
const PLACEHOLDER_RE = /(^|\s)(…|\.\.\.|TODO|TBD|Lorem ipsum|para\b)(\s|$)/i
function checkProse (value, where, key) {
  if (typeof value !== 'string') return
  if (PLACEHOLDER_RE.test(value.trim()) && value.trim().length < 30) {
    err(where, `"${key}" looks like unfilled placeholder text: ${JSON.stringify(value.slice(0, 40))}`)
  }
}

async function readJson (path, where) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    err(where, `could not be parsed as JSON — ${e.message}`)
    return null
  }
}

/* ------------------------------------------------------------------ *
 * Park validation
 * ------------------------------------------------------------------ */

async function validatePark (meta) {
  const dir = join(DATA, 'parks', meta.slug)
  if (!existsSync(dir)) { warn(meta.slug, 'no data directory yet — skipped'); return }

  const parkFile = join(dir, 'park.json')
  if (!existsSync(parkFile)) { err(meta.slug, 'park.json is missing'); return }

  const park = await readJson(parkFile, `${meta.slug}/park.json`)
  const attractionsDoc = existsSync(join(dir, 'attractions.json'))
    ? await readJson(join(dir, 'attractions.json'), `${meta.slug}/attractions.json`) : null
  const diningDoc = existsSync(join(dir, 'dining.json'))
    ? await readJson(join(dir, 'dining.json'), `${meta.slug}/dining.json`) : null
  const foodDoc = existsSync(join(dir, 'food.json'))
    ? await readJson(join(dir, 'food.json'), `${meta.slug}/food.json`) : null

  if (!park) return
  const attractions = (attractionsDoc && attractionsDoc.attractions) || []
  const dining = (diningDoc && diningDoc.dining) || []
  const food = (foodDoc && foodDoc.items) || []

  if (!attractions.length) err(`${meta.slug}/attractions.json`, 'no attractions found')
  if (!dining.length) err(`${meta.slug}/dining.json`, 'no dining locations found')
  if (!food.length) err(`${meta.slug}/food.json`, 'no food items found')

  /* -- park.json -- */
  const P = `${meta.slug}/park.json`
  if (park.slug !== meta.slug) err(P, `slug must be "${meta.slug}" (got "${park.slug}")`)
  if (park.resort !== meta.resort) err(P, `resort must be "${meta.resort}" (got "${park.resort}")`)
  requireString(park, 'name', P)
  requireString(park, 'summary', P, { min: 40 })
  requireString(park, 'tagline', P, { max: 110 })
  requireArray(park, 'intro', P, { min: 3 })
  requireArray(park, 'bestFor', P, { min: 2 })
  requireArray(park, 'lands', P, { min: 1, of: 'object' })
  checkVerified(park, 'lastVerified', P)
  checkFaqs(park.faqs, P, { min: 6 })
  ;(park.intro || []).forEach((p, i) => checkProse(p, P, `intro[${i}]`))

  if (!park.coordinates || typeof park.coordinates.lat !== 'number' || typeof park.coordinates.lng !== 'number') {
    err(P, 'coordinates must be { lat: number, lng: number }')
  }

  const landSlugs = new Set()
  for (const [i, land] of (park.lands || []).entries()) {
    const at = `${P} lands[${i}]`
    if (!requireSlug(land, 'slug', at)) continue
    if (landSlugs.has(land.slug)) err(at, `duplicate land slug "${land.slug}"`)
    landSlugs.add(land.slug)
    requireString(land, 'name', at)
    requireString(land, 'summary', at, { min: 20 })
    requireArray(land, 'description', at, { min: 2 })
    requireArray(land, 'highlights', at, { min: 2 })
    if (typeof land.order !== 'number') warn(at, 'missing numeric "order" — lands will fall back to declaration order')
  }

  /* -- attractions.json -- */
  const A = `${meta.slug}/attractions.json`
  const attractionSlugs = new Set()
  let pagedCount = 0
  for (const [i, a] of attractions.entries()) {
    const at = `${A} [${i}] ${a && a.name ? a.name : '(unnamed)'}`
    if (!a || typeof a !== 'object') { err(at, 'is not an object'); continue }
    if (!requireSlug(a, 'slug', at)) continue
    if (attractionSlugs.has(a.slug)) err(at, `duplicate attraction slug "${a.slug}"`)
    attractionSlugs.add(a.slug)

    requireString(a, 'name', at)
    requireString(a, 'summary', at, { min: 25, max: 200 })
    requireArray(a, 'description', at, { min: 2 })
    requireArray(a, 'tips', at, { min: 3 })
    requireEnum(a, 'type', ATTRACTION_TYPES, at)
    requireEnum(a, 'tier', TIERS, at)
    requireEnum(a, 'lightningLane', LL, at)
    requireEnum(a, 'status', STATUSES, at, { optional: true })
    requireEnum(a, 'motionSickness', MOTION, at, { optional: true })
    requireEnum(a, 'getsWet', WET, at, { optional: true })
    requireEnum(a, 'indoorOutdoor', INOUT, at, { optional: true })
    checkVerified(a, 'lastVerified', at)
    checkProse(a.summary, at, 'summary')

    if (!landSlugs.has(a.land)) err(at, `land "${a.land}" is not declared in park.json`)

    if (a.heightIn != null && (!Number.isInteger(a.heightIn) || a.heightIn < 24 || a.heightIn > 60)) {
      err(at, `heightIn must be an integer between 24 and 60 (got ${JSON.stringify(a.heightIn)})`)
    }
    if (a.intensity != null && (!Number.isInteger(a.intensity) || a.intensity < 1 || a.intensity > 5)) {
      err(at, `intensity must be an integer 1–5 (got ${JSON.stringify(a.intensity)})`)
    }
    if (a.scary) {
      for (const key of ['score', 'darkness', 'drops', 'speed', 'loudness', 'startles']) {
        const v = a.scary[key]
        if (v != null && (!Number.isInteger(v) || v < 1 || v > 5)) err(at, `scary.${key} must be an integer 1–5 (got ${JSON.stringify(v)})`)
      }
    }
    if (a.accessibility) requireEnum(a.accessibility, 'transfer', TRANSFER, `${at} accessibility`, { optional: true })
    if ((a.status || 'open') !== 'open' && !a.closedNote) err(at, `status is "${a.status}" so "closedNote" is required`)
    if (a.virtualQueue === true) {
      warn(at, 'virtualQueue is true — as of mid-2026 no attraction at either resort permanently uses one. Verify this.')
    }

    if (a.standalonePage) {
      pagedCount++
      requireArray(a, 'experience', at, { min: 2 })
      checkFaqs(a.faqs, at, { min: 3 })
      if (!Array.isArray(a.relatedSlugs) || a.relatedSlugs.length < 2) {
        err(at, 'standalonePage attractions need at least 2 relatedSlugs')
      }
    }
  }
  for (const a of attractions) {
    for (const slug of a.relatedSlugs || []) {
      if (!attractionSlugs.has(slug)) err(`${A} ${a.name}`, `relatedSlugs references unknown attraction "${slug}"`)
    }
  }
  if (attractions.length && (pagedCount < 10 || pagedCount > 24)) {
    warn(A, `${pagedCount} standalone attraction pages — the target band is 14–20`)
  }
  if (attractions.length < 30) warn(A, `only ${attractions.length} attractions — the target is 38 or more`)

  /* -- dining.json -- */
  const D = `${meta.slug}/dining.json`
  const diningSlugs = new Set()
  for (const [i, d] of dining.entries()) {
    const at = `${D} [${i}] ${d && d.name ? d.name : '(unnamed)'}`
    if (!d || typeof d !== 'object') { err(at, 'is not an object'); continue }
    if (!requireSlug(d, 'slug', at)) continue
    if (diningSlugs.has(d.slug)) err(at, `duplicate dining slug "${d.slug}"`)
    diningSlugs.add(d.slug)

    requireString(d, 'name', at)
    requireString(d, 'summary', at, { min: 25, max: 200 })
    requireString(d, 'cuisine', at)
    requireString(d, 'verdict', at, { min: 20 })
    requireArray(d, 'description', at, { min: 2 })
    requireEnum(d, 'service', SERVICE, at)
    requireEnum(d, 'reservations', RESERVATIONS, at)
    requireEnum(d, 'priceTier', TIERS_PRICE, at)
    checkVerified(d, 'lastVerified', at)
    if (!landSlugs.has(d.land)) err(at, `land "${d.land}" is not declared in park.json`)
    if (d.priceVerified != null) checkVerified(d, 'priceVerified', at, { optional: true })
  }
  if (dining.length && dining.length < 18) warn(D, `only ${dining.length} dining locations — the target is 22 or more`)

  /* -- food.json -- */
  const F = `${meta.slug}/food.json`
  const foodIds = new Set()
  let mustTryTop = 0
  let dietTagged = 0
  for (const [i, item] of food.entries()) {
    const at = `${F} [${i}] ${item && item.name ? item.name : '(unnamed)'}`
    if (!item || typeof item !== 'object') { err(at, 'is not an object'); continue }
    if (typeof item.id !== 'string' || !SLUG_RE.test(item.id)) { err(at, `id must be kebab-case (got ${JSON.stringify(item.id)})`); continue }
    if (!item.id.startsWith(meta.prefix + '-')) err(at, `id must start with "${meta.prefix}-"`)
    if (foodIds.has(item.id)) err(at, `duplicate food id "${item.id}"`)
    foodIds.add(item.id)

    requireString(item, 'name', at)
    requireString(item, 'restaurant', at)
    requireString(item, 'description', at, { min: 20 })
    requireString(item, 'verdict', at, { min: 15 })
    requireEnum(item, 'category', FOOD_CATEGORY, at)
    checkVerified(item, 'priceVerified', at, { optional: item.price == null })

    if (item.price != null && (typeof item.price !== 'number' || item.price <= 0 || item.price > 200)) {
      err(at, `price must be a positive number under 200 (got ${JSON.stringify(item.price)})`)
    }
    if (item.mustTry != null && (!Number.isInteger(item.mustTry) || item.mustTry < 1 || item.mustTry > 5)) {
      err(at, `mustTry must be an integer 1–5 (got ${JSON.stringify(item.mustTry)})`)
    }
    if (item.mustTry === 5) mustTryTop++
    if ((item.dietaryTags || []).length) dietTagged++
    if (item.seasonal === true) err(at, 'seasonal items belong on the seasonal site, not in this dataset')
    if (item.restaurantSlug != null && !diningSlugs.has(item.restaurantSlug)) {
      err(at, `restaurantSlug "${item.restaurantSlug}" is not a dining slug in this park`)
    }
    if (!landSlugs.has(item.land)) err(at, `land "${item.land}" is not declared in park.json`)
  }
  if (food.length && food.length < 28) warn(F, `only ${food.length} food items — the target is 32 or more`)
  if (food.length && mustTryTop < 3) warn(F, `only ${mustTryTop} items rated mustTry 5 — the target is at least 4`)
  if (food.length && dietTagged < 5) warn(F, `only ${dietTagged} items carry dietary tags — the target is at least 5`)

  /* -- cross-file references from park.json -- */
  for (const land of park.lands || []) {
    const at = `${P} lands["${land.slug}"]`
    if (land.anchorAttraction && !attractionSlugs.has(land.anchorAttraction)) {
      err(at, `anchorAttraction "${land.anchorAttraction}" is not an attraction in this park`)
    }
    for (const slug of land.eatHere || []) {
      if (!diningSlugs.has(slug)) err(at, `eatHere references unknown dining slug "${slug}"`)
    }
    if (!attractions.some((a) => a.land === land.slug)) {
      warn(at, `land "${land.slug}" has no attractions assigned to it`)
    }
  }

  /* -- derived stats -- */
  if (park.stats) {
    const withHeight = attractions.filter((a) => a.heightIn != null)
    const tallest = withHeight.reduce((max, a) => Math.max(max, a.heightIn), 0)
    if (park.stats.attractionCount != null && park.stats.attractionCount !== attractions.length) {
      err(P, `stats.attractionCount is ${park.stats.attractionCount} but attractions.json has ${attractions.length}`)
    }
    if (park.stats.ridesWithHeightRequirements != null && park.stats.ridesWithHeightRequirements !== withHeight.length) {
      err(P, `stats.ridesWithHeightRequirements is ${park.stats.ridesWithHeightRequirements} but ${withHeight.length} attractions have a heightIn`)
    }
    if (tallest && park.stats.tallestRequirement != null && park.stats.tallestRequirement !== tallest) {
      err(P, `stats.tallestRequirement is ${park.stats.tallestRequirement} but the tallest heightIn is ${tallest}`)
    }
  } else {
    warn(P, 'no "stats" block')
  }

  /* -- accessibility + firstTimer completeness -- */
  if (!park.accessibility || !Array.isArray(park.accessibility.intro)) err(P, 'accessibility.intro is missing')
  if (!park.firstTimer) err(P, 'firstTimer block is missing')
  else {
    requireArray(park.firstTimer, 'intro', `${P} firstTimer`, { min: 1 })
    for (const key of ['beforeYouGo', 'morningPlan', 'middayPlan', 'eveningPlan']) {
      const list = park.firstTimer[key]
      if (!Array.isArray(list) || !list.length) { err(`${P} firstTimer`, `"${key}" is missing or empty`); continue }
      list.forEach((item, i) => {
        const label = key === 'beforeYouGo' ? 'title' : 'time'
        if (!item || typeof item[label] !== 'string' || !item[label].trim()) err(`${P} firstTimer.${key}[${i}]`, `missing "${label}"`)
        if (!item || typeof item.body !== 'string' || item.body.trim().length < 20) err(`${P} firstTimer.${key}[${i}]`, 'missing or short "body"')
      })
    }
    requireArray(park.firstTimer, 'rookieMistakes', `${P} firstTimer`, { min: 4 })
    requireArray(park.firstTimer, 'ifYouOnlyHaveOneDay', `${P} firstTimer`, { min: 5 })
  }

  /* -- best-rides.json (optional) -- */
  const bestRidesFile = join(dir, 'best-rides.json')
  if (existsSync(bestRidesFile)) {
    const B = `${meta.slug}/best-rides.json`
    const doc = await readJson(bestRidesFile, B)
    if (doc) {
      requireString(doc, 'criteria', B, { min: 30 })
      requireArray(doc, 'intro', B, { min: 2 })
      checkFaqs(doc.faqs, B, { min: 3 })
      checkVerified(doc, 'lastVerified', B)
      if (!Array.isArray(doc.ranking) || doc.ranking.length < 10) {
        err(B, `ranking needs at least 10 entries (has ${(doc.ranking || []).length})`)
      }
      const ranks = new Set()
      const rankedSlugs = new Set()
      for (const [i, entry] of (doc.ranking || []).entries()) {
        const at = `${B} ranking[${i}]`
        if (typeof entry.rank !== 'number') err(at, 'rank must be a number')
        else if (ranks.has(entry.rank)) err(at, `duplicate rank ${entry.rank}`)
        else ranks.add(entry.rank)
        if (!attractionSlugs.has(entry.slug)) { err(at, `slug "${entry.slug}" is not an attraction in this park`); continue }
        if (rankedSlugs.has(entry.slug)) err(at, `"${entry.slug}" is ranked twice`)
        rankedSlugs.add(entry.slug)
        const attraction = attractions.find((a) => a.slug === entry.slug)
        if (attraction && (attraction.status || 'open') !== 'open') {
          err(at, `"${entry.slug}" is not operating and must not be ranked`)
        }
        requireString(entry, 'headline', at, { max: 130 })
        requireArray(entry, 'why', at, { min: 1 })
      }
      for (const key of ['overrated', 'underrated']) {
        for (const [i, entry] of (doc[key] || []).entries()) {
          const at = `${B} ${key}[${i}]`
          if (!attractionSlugs.has(entry.slug)) err(at, `slug "${entry.slug}" is not an attraction in this park`)
          if (typeof entry.why !== 'string' || entry.why.trim().length < 25) err(at, 'missing or short "why"')
        }
      }
    }
  } else {
    warn(`${meta.slug}/best-rides.json`, 'not authored yet — the "best rides at" page will not be generated')
  }

  /* -- map.json (optional) -- */
  const mapFile = join(dir, 'map.json')
  if (existsSync(mapFile)) {
    const M = `${meta.slug}/map.json`
    const map = await readJson(mapFile, M)
    if (map) {
      if (!Array.isArray(map.viewBox) || map.viewBox.length !== 4) err(M, 'viewBox must be [x, y, w, h]')
      if (!Array.isArray(map.lands) || !map.lands.length) err(M, 'lands must be a non-empty array')
      for (const [i, land] of (map.lands || []).entries()) {
        const at = `${M} lands[${i}]`
        if (land.slug && !landSlugs.has(land.slug)) err(at, `slug "${land.slug}" is not a land in park.json`)
        if (!Array.isArray(land.points) || land.points.length < 3) err(at, 'points must be an array of at least 3 [x, y] pairs')
        else if (land.points.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((n) => typeof n !== 'number'))) {
          err(at, 'every point must be a [number, number] pair')
        }
      }
      for (const [i, marker] of (map.markers || []).entries()) {
        const at = `${M} markers[${i}]`
        if (!Array.isArray(marker.at) || marker.at.length !== 2) err(at, '"at" must be [x, y]')
        if (marker.slug && !attractionSlugs.has(marker.slug) && !diningSlugs.has(marker.slug)) {
          err(at, `slug "${marker.slug}" matches no attraction or dining location in this park`)
        }
        if (!marker.slug && !marker.label) err(at, 'a marker needs either a slug or a label')
      }
    }
  } else {
    warn(`${meta.slug}/map.json`, 'not authored yet — the build will fall back to a generic land diagram')
  }
}

/* ------------------------------------------------------------------ *
 * Guides & comparisons
 * ------------------------------------------------------------------ */

async function validateGuides () {
  const dir = join(DATA, 'guides')
  if (!existsSync(dir)) { warn('data/guides', 'directory missing'); return new Set() }
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'))
  const slugs = new Set()
  const docs = []

  for (const file of files) {
    const where = `guides/${file}`
    const guide = await readJson(join(dir, file), where)
    if (!guide) continue
    docs.push(guide)
    if (!requireSlug(guide, 'slug', where)) continue
    if (guide.slug !== file.replace(/\.json$/, '')) err(where, `slug "${guide.slug}" does not match the filename`)
    if (slugs.has(guide.slug)) err(where, `duplicate guide slug "${guide.slug}"`)
    slugs.add(guide.slug)

    requireString(guide, 'title', where, { max: 70 })
    requireString(guide, 'h1', where)
    requireString(guide, 'metaDescription', where, { min: 80, max: 175 })
    requireString(guide, 'summary', where, { min: 40 })
    requireArray(guide, 'intro', where, { min: 2 })
    requireArray(guide, 'keyPoints', where, { min: 4 })
    checkSections(guide.sections, where, { min: 5 })
    checkFaqs(guide.faqs, where, { min: 4 })
    checkVerified(guide, 'lastVerified', where)

    const tables = (guide.sections || []).filter((s) => s && (s.table || s.list)).length
    if (tables < 2) warn(where, `only ${tables} sections carry a table or list — structured data is what wins snippets`)
  }

  for (const guide of docs) {
    for (const slug of guide.related || []) {
      if (!slugs.has(slug)) err(`guides/${guide.slug}.json`, `related references unknown guide "${slug}"`)
    }
  }
  return slugs
}

async function validateCompare () {
  const dir = join(DATA, 'compare')
  if (!existsSync(dir)) { warn('data/compare', 'directory missing'); return }
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'))
  const slugs = new Set()
  const docs = []

  for (const file of files) {
    const where = `compare/${file}`
    const page = await readJson(join(dir, file), where)
    if (!page) continue
    docs.push(page)
    if (!requireSlug(page, 'slug', where)) continue
    if (page.slug !== file.replace(/\.json$/, '')) err(where, `slug "${page.slug}" does not match the filename`)
    if (slugs.has(page.slug)) err(where, `duplicate comparison slug "${page.slug}"`)
    slugs.add(page.slug)

    requireString(page, 'title', where, { max: 70 })
    requireString(page, 'h1', where)
    requireString(page, 'metaDescription', where, { min: 80, max: 175 })
    requireString(page, 'summary', where, { min: 40 })
    requireArray(page, 'intro', where, { min: 2 })
    checkSections(page.sections, where, { min: 3 })
    checkFaqs(page.faqs, where, { min: 4 })
    checkVerified(page, 'lastVerified', where)

    if (!page.verdict || typeof page.verdict.short !== 'string' || !page.verdict.short.trim()) {
      err(where, 'verdict.short is required — comparison pages must commit to an answer')
    }
    if (!Array.isArray(page.contenders) || page.contenders.length < 2) {
      err(where, 'contenders must contain at least 2 entries')
      continue
    }
    const keys = new Set()
    for (const [i, c] of page.contenders.entries()) {
      const at = `${where} contenders[${i}]`
      if (!requireSlug(c, 'key', at)) continue
      if (keys.has(c.key)) err(at, `duplicate contender key "${c.key}"`)
      keys.add(c.key)
      requireString(c, 'name', at)
    }
    for (const [i, dim] of (page.dimensions || []).entries()) {
      const at = `${where} dimensions[${i}]`
      requireString(dim, 'name', at)
      if (dim.winner && dim.winner !== 'tie' && !keys.has(dim.winner)) err(at, `winner "${dim.winner}" is not a contender key`)
      for (const key of Object.keys(dim.cells || {})) {
        if (!keys.has(key)) err(at, `cells has unknown contender key "${key}"`)
      }
      for (const key of keys) {
        if (!(dim.cells || {})[key]) err(at, `cells is missing an entry for contender "${key}"`)
      }
    }
    for (const [i, entry] of (page.ranking || []).entries()) {
      const at = `${where} ranking[${i}]`
      if (typeof entry.rank !== 'number') err(at, 'rank must be a number')
      if (!keys.has(entry.key)) err(at, `key "${entry.key}" is not a contender key`)
      requireArray(entry, 'body', at, { min: 1 })
    }
    for (const key of Object.keys(page.pickThisIf || {})) {
      if (!keys.has(key)) err(`${where} pickThisIf`, `unknown contender key "${key}"`)
    }
  }

  for (const page of docs) {
    for (const slug of page.related || []) {
      if (!slugs.has(slug)) err(`compare/${page.slug}.json`, `related references unknown comparison "${slug}"`)
    }
  }
}

async function validateSite () {
  const where = 'site.json'
  const site = await readJson(join(DATA, 'site.json'), where)
  if (!site) return
  if (!site.brand || !site.brand.origin || !/^https?:\/\//.test(site.brand.origin)) {
    err(where, 'brand.origin must be an absolute URL')
  }
  // How many resorts an operator has is a fact about that operator, not a rule. Disney has two,
  // Universal has two, a future one-resort operator is not malformed. What matters is that it has
  // at least one and that every park it names actually exists.
  if (!Array.isArray(site.resorts) || site.resorts.length < 1) err(where, 'resorts must contain at least 1 entry')
  for (const resort of site.resorts || []) {
    for (const slug of resort.parks || []) {
      if (!PARKS.some((p) => p.slug === slug)) err(where, `resort "${resort.slug}" lists unknown park "${slug}"`)
    }
  }
  if (!site.legal || !site.legal.disclaimer || site.legal.disclaimer.length < 100) {
    err(where, 'legal.disclaimer is missing or too short — the unaffiliated notice is not optional')
  }
  if (!site.legal.affiliateDisclosure || site.legal.affiliateDisclosure.length < 60) {
    err(where, 'legal.affiliateDisclosure is missing or too short — the FTC requires a clear disclosure')
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function validateOperator (operatorSlug) {
  await loadParkTable(operatorSlug)
  await validateSite()
  for (const park of PARKS) await validatePark(park)
  await validateGuides()
  await validateCompare()
}

async function main () {
  const { resolveTargets } = await import('../src/lib/data.mjs')
  const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const targets = (await resolveTargets(requested, { label: 'node scripts/validate.mjs' })).map((o) => o.slug)

  for (const slug of targets) await validateOperator(slug)

  const quiet = process.argv.includes('--quiet')

  if (warnings.length && !quiet) {
    console.log(`\n  ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`)
    for (const w of warnings.slice(0, 60)) console.log(`    · ${w}`)
    if (warnings.length > 60) console.log(`    … and ${warnings.length - 60} more`)
  }

  if (errors.length) {
    console.error(`\n  ${errors.length} error${errors.length === 1 ? '' : 's'} — build blocked:\n`)
    for (const e of errors.slice(0, 120)) console.error(`    ✗ ${e}`)
    if (errors.length > 120) console.error(`    … and ${errors.length - 120} more`)
    console.error('')
    process.exit(1)
  }

  console.log(`\n  Data valid across ${targets.length} operator${targets.length === 1 ? '' : 's'}${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}.`)
}

main().catch((e) => { console.error(e); process.exit(1) })

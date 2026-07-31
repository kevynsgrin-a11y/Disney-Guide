/**
 * Fact checker for the dated dataset. Asserts it against docs/SEASONAL-SCHEMA.md §7.
 *
 * scripts/validate-seasonal.mjs proves the data is *well-formed*. This proves it is *correct* on the
 * handful of facts that are easiest to get wrong and worst to get wrong: which park each event
 * actually runs in, whether the published window matches the pattern we documented, and whether the
 * price bands are the ones we verified.
 *
 * The reference tables below are hard-coded on purpose. Checking the dataset against itself proves
 * only that it agrees with itself; the point is a second source of truth that has to be edited
 * deliberately, in the same commit, when reality changes.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data', 'seasonal')

const problems = []
const fail = (where, message) => problems.push(`${where}: ${message}`)

/**
 * Apostrophes are dropped rather than normalised, matching scripts/factcheck.mjs — "Mickey's" and
 * "mickeys" must compare equal, and every reference row below is written without one.
 */
const norm = (s) => String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9&: ]+/g, ' ').replace(/\s+/g, ' ').trim()

/* ------------------------------------------------------------------ *
 * §7.1  Event → resort → park → category
 *
 * Wrong park assignment is the single most common error in this content area. Oogie Boogie Bash is
 * at Disney California Adventure, not Disneyland Park; Jollywood Nights is at Hollywood Studios, not
 * EPCOT. Both are hard failures.
 * ------------------------------------------------------------------ */

const EVENTS = {
  'mickeys-not-so-scary-halloween-party': { resort: 'walt-disney-world', park: 'magic-kingdom', category: 'hard-ticket' },
  'mickeys-very-merry-christmas-party': { resort: 'walt-disney-world', park: 'magic-kingdom', category: 'hard-ticket' },
  'disney-jollywood-nights': { resort: 'walt-disney-world', park: 'hollywood-studios', category: 'hard-ticket' },
  'epcot-food-and-wine-festival': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-festival-of-the-arts': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-flower-and-garden-festival': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-festival-of-the-holidays': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'disney-after-hours': { resort: 'walt-disney-world', park: null, category: 'after-hours' },
  'oogie-boogie-bash': { resort: 'disneyland', park: 'california-adventure', category: 'hard-ticket' },
  'halloween-time-at-the-disneyland-resort': { resort: 'disneyland', park: null, category: 'overlay' },
  'holidays-at-the-disneyland-resort': { resort: 'disneyland', park: null, category: 'overlay' },
  'lunar-new-year-at-disney-california-adventure': { resort: 'disneyland', park: 'california-adventure', category: 'festival' },
  'disney-california-adventure-food-and-wine-festival': { resort: 'disneyland', park: 'california-adventure', category: 'festival' },
  'disneyland-after-dark': { resort: 'disneyland', park: null, category: 'after-hours' },
}

/*
 * §7.2  Typical windows.
 *
 * `starts`/`ends` are alternatives — the authored prose must contain at least one. More than one is
 * allowed because a window can be named honestly in more than one way: Very Merry ends "shortly
 * before Christmas", which is better copy than "late December" and describes the same fortnight.
 */
const WINDOWS = {
  'mickeys-not-so-scary-halloween-party': { starts: ['august'], ends: ['november', 'halloween'], nights: [30, 40] },
  'mickeys-very-merry-christmas-party': { starts: ['november'], ends: ['december', 'christmas'], nights: [20, 26] },
  'disney-jollywood-nights': { starts: ['november'], ends: ['december'], nights: [8, 14] },
  'epcot-food-and-wine-festival': { starts: ['ugust', 'july'], ends: ['november'] },
  'epcot-festival-of-the-arts': { starts: ['january'], ends: ['february'] },
  'epcot-flower-and-garden-festival': { starts: ['arch', 'ebruary'], ends: ['july'] },
  'epcot-festival-of-the-holidays': { starts: ['november'], ends: ['december'] },
  'oogie-boogie-bash': { starts: ['august'], ends: ['october', 'halloween'], nights: [25, 30] },
  'halloween-time-at-the-disneyland-resort': { starts: ['august'], ends: ['october', 'halloween'] },
  'holidays-at-the-disneyland-resort': { starts: ['november'], ends: ['january'] },
  'lunar-new-year-at-disney-california-adventure': { starts: ['january'], ends: ['february'] },
  'disney-california-adventure-food-and-wine-festival': { starts: ['ebruary', 'arch'], ends: ['april'] },
}

/* §7.3  Price bands. The authored range must sit inside the verified band, not merely overlap it. */
const PRICE_BANDS = {
  'mickeys-not-so-scary-halloween-party': [119, 219],
  'mickeys-very-merry-christmas-party': [169, 219],
  'disney-jollywood-nights': [159, 209],
  'oogie-boogie-bash': [154, 224],
  'disney-after-hours': [139, 209],
}

/** Per-item festival food prices, by resort. */
const FOOD_BANDS = { 'walt-disney-world': [5, 13], disneyland: [6, 15] }

/* §7.4 rule 5 — the evergreen needle list plus the offenders specific to dated copy. */
const FILLER = [
  'magical', 'immersive', 'unforgettable', 'beloved', 'nestled', 'delve', 'a testament to', 'whimsical',
  'magical memories', 'not to be missed', 'something for everyone', 'a feast for the senses', 'sure to delight',
]
const FILLER_OPENERS = ['whether you', 'in the world of', 'from the moment you', 'looking for']

/** §7.4 rule 6 — the "From X to Y," construction that opens half the travel copy on the internet. */
const FROM_TO_OPENER = /^from\s+[^,]{3,40}\s+to\s+[^,]{3,40},/i

/**
 * Attraction and booth names that genuinely end in an exclamation mark.
 *
 * House style bans exclamation marks in prose, but several of these things are actually called
 * this. Scrubbing the real names before the sweep is the only way to keep the rule strict without
 * forcing an author to misname a ride.
 */
const NAME_EXCLAMATIONS = [
  'Mission: BREAKOUT!',
  'Pop Eats!',
  "L'Chaim! Holiday Kitchen",
  "L'Chaim!",
  'Fantasmic!',
  'Turtle Talk!',
  'Wonderful World of Animation!',
  'The Bar at Pop Eats!',
]

/* ------------------------------------------------------------------ *
 * Prose sweep
 * ------------------------------------------------------------------ */

function collectStrings (value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out)
  else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      // sourceNote explains provenance and legitimately names dates and prior cycles.
      if (key === 'sourceNote') continue
      collectStrings(v, out)
    }
  }
  return out
}

function checkProse (obj, where) {
  for (const text of collectStrings(obj)) {
    const lower = text.toLowerCase()
    for (const needle of FILLER) {
      if (lower.includes(needle)) fail(where, `marketing filler "${needle}" in: "${text.slice(0, 90)}…"`)
    }
    for (const opener of FILLER_OPENERS) {
      if (lower.startsWith(opener)) fail(where, `paragraph opens with "${opener}" — the tell of generated travel copy`)
    }
    if (FROM_TO_OPENER.test(text)) fail(where, `paragraph opens with a "From X to Y," construction: "${text.slice(0, 70)}…"`)
    let scrubbed = text
    for (const name of NAME_EXCLAMATIONS) scrubbed = scrubbed.split(name).join('')
    if (scrubbed.includes('!')) fail(where, `exclamation mark in: "${text.slice(0, 70)}…"`)
  }
}

/* ------------------------------------------------------------------ *
 * Checks
 * ------------------------------------------------------------------ */

async function readJson (path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function checkEvents () {
  const dir = join(DATA, 'events')
  if (!existsSync(dir)) return
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()

  const seen = new Set()
  for (const file of files) {
    const slug = file.replace(/\.json$/, '')
    const where = `events/${slug}`
    seen.add(slug)

    let ev
    try { ev = await readJson(join(dir, file)) } catch (e) { fail(where, `unreadable — ${e.message}`); continue }

    const ref = EVENTS[slug]
    if (!ref) {
      fail(where, 'is not in the §7.1 reference table — add it there deliberately, in this commit, or fix the slug')
      continue
    }

    if (ev.resort !== ref.resort) fail(where, `resort is "${ev.resort}", reference says "${ref.resort}"`)
    if ((ev.parkSlug || null) !== ref.park) {
      fail(where, `parkSlug is ${JSON.stringify(ev.parkSlug || null)}, reference says ${JSON.stringify(ref.park)}`)
    }
    if (ev.category !== ref.category) fail(where, `category is "${ev.category}", reference says "${ref.category}"`)

    const win = WINDOWS[slug]
    if (win && ev.typicalWindow) {
      const starts = norm(ev.typicalWindow.startsAround || '')
      const ends = norm(ev.typicalWindow.endsAround || '')
      if (!win.starts.some((needle) => starts.includes(needle))) {
        fail(where, `typicalWindow.startsAround is "${ev.typicalWindow.startsAround}", reference expects one of: ${win.starts.join(', ')}`)
      }
      if (!win.ends.some((needle) => ends.includes(needle))) {
        fail(where, `typicalWindow.endsAround is "${ev.typicalWindow.endsAround}", reference expects one of: ${win.ends.join(', ')}`)
      }
      if (win.nights && ev.typicalWindow.nightsTypical != null) {
        const n = ev.typicalWindow.nightsTypical
        if (n < win.nights[0] || n > win.nights[1]) {
          fail(where, `nightsTypical is ${n}, reference band is ${win.nights[0]}–${win.nights[1]}`)
        }
      }
    }

    const band = PRICE_BANDS[slug]
    if (band) {
      const range = ev.pricing && ev.pricing.rangeUsd
      if (!Array.isArray(range)) fail(where, 'has a verified price band but publishes no rangeUsd')
      else if (range[0] < band[0] || range[1] > band[1]) {
        fail(where, `pricing.rangeUsd is [${range}], outside the verified band [${band}]`)
      }
      if (ev.pricing && !ev.pricing.asOf) fail(where, 'pricing has no "asOf" cycle')
    }

    if (ev.food && Array.isArray(ev.food.items)) {
      const foodBand = FOOD_BANDS[ref.resort]
      for (const item of ev.food.items) {
        if (typeof item.priceUsd !== 'number') continue
        if (item.priceUsd < foodBand[0] || item.priceUsd > foodBand[1]) {
          fail(where, `food item "${item.name}" is $${item.priceUsd}, outside the verified ${ref.resort} band $${foodBand[0]}–$${foodBand[1]}`)
        }
      }
    }

    checkProse(ev, where)
  }

  for (const slug of Object.keys(EVENTS)) {
    if (!seen.has(slug)) fail('events', `${slug} is in the reference table but has no data file`)
  }
}

async function checkOthers () {
  for (const folder of ['months', 'holidays', 'prices', 'closures']) {
    const dir = join(DATA, folder)
    if (!existsSync(dir)) continue
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()) {
      const where = `${folder}/${file}`
      try { checkProse(await readJson(join(dir, file)), where) } catch (e) { fail(where, `unreadable — ${e.message}`) }
    }
  }
}

/**
 * §7.4 rule 3, from the other direction.
 *
 * scripts/factcheck.mjs refuses dated content on an evergreen page. This refuses permanent content
 * here. Between the two, a topic that drifts onto the wrong site fails a build rather than quietly
 * creating a second owner.
 */
const PERMANENT = [
  /\b\d{2}\s*(?:inches|")\s*(?:tall|minimum|min\b)/i,
  /\bheight requirement\b/i,
  /\bmust be at least \d+\b/i,
  /\bsingle rider line\b/i,
  /\brider switch\b/i,
]

async function checkScope () {
  for (const folder of ['events', 'months', 'holidays', 'prices']) {
    const dir = join(DATA, folder)
    if (!existsSync(dir)) continue
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
      const where = `${folder}/${file}`
      let json
      try { json = await readJson(join(dir, file)) } catch { continue }
      const { crossLinks, ...rest } = json
      const text = JSON.stringify(rest)
      for (const re of PERMANENT) {
        const hit = text.match(re)
        if (hit) fail(where, `restates a permanent fact ("${hit[0]}") that the evergreen dataset owns — link, do not repeat`)
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main () {
  if (!existsSync(DATA)) {
    console.error('\n  data/seasonal/ does not exist. Nothing to check.\n')
    process.exitCode = 1
    return
  }

  await checkEvents()
  await checkOthers()
  await checkScope()

  if (problems.length) {
    console.error(`\n  ${problems.length} fact${problems.length === 1 ? '' : 's'} disagree with the July 2026 seasonal reference tables:\n`)
    for (const p of problems) console.error(`    ✗ ${p}`)
    console.error('\n  Either the data is wrong, or reality moved and docs/SEASONAL-SCHEMA.md §7 needs updating in this same commit.\n')
    process.exitCode = 1
    return
  }

  console.log('\n  Seasonal facts check out against the July 2026 reference tables.\n')
}

main().catch((e) => { console.error('\nFact checker crashed:\n', e); process.exitCode = 1 })

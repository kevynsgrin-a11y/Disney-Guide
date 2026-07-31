/**
 * Deterministic fact check against the verified reference tables in docs/DATA-SCHEMA.md.
 *
 * The schema validator proves the data is *well-formed*. This proves it is *correct* on the facts
 * that matter most and are easiest to get wrong: height requirements, 2026 closures and rethemes,
 * Lightning Lane assignment, virtual queues, snack prices, and evergreen scope.
 *
 * These assertions are deliberately hard-coded rather than read from the dataset. Checking the data
 * against itself proves nothing; the point is an independent source of truth that has to be edited
 * on purpose, in the same commit, when reality changes.
 *
 * Run: npm run factcheck
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Reference tables live in scripts/reference/<operator>.mjs, loaded per run.
 *
 * They stay hard-coded — that is the entire point of a second source of truth — but they are no
 * longer hard-coded *here*, so onboarding an operator means writing its own tables rather than
 * editing everyone else's.
 */
let DATA = join(ROOT, 'data')
let HEIGHTS = {}
let MUST_BE_CLOSED = {}
let MUST_BE_OPEN = {}
let SNACK_PRICES = []
let SEASONAL = []
let PARK_SLUGS = []

async function loadReference (operatorSlug) {
  const { operatorDir, parkOrder } = await import('../src/lib/data.mjs')
  DATA = await operatorDir(operatorSlug)
  const site = JSON.parse(await readFile(join(DATA, 'site.json'), 'utf8'))
  PARK_SLUGS = parkOrder(site)

  const path = join(ROOT, 'scripts', 'reference', `${operatorSlug}.mjs`)
  if (!existsSync(path)) {
    throw new Error(`No reference tables at scripts/reference/${operatorSlug}.mjs. Every operator needs its own — a dataset checked against nothing is not checked.`)
  }
  const ref = await import(pathToFileURL(path).href)
  HEIGHTS = ref.HEIGHTS || {}
  MUST_BE_CLOSED = ref.MUST_BE_CLOSED || {}
  MUST_BE_OPEN = ref.MUST_BE_OPEN || {}
  SNACK_PRICES = ref.SNACK_PRICES || []
  SEASONAL = ref.SEASONAL || []
}

/* ------------------------------------------------------------------ *
 * The reference tables. Verified July 2026. Edit deliberately.
 * ------------------------------------------------------------------ */





/**
 * Words banned as filler. The boolean field `iconic` is exempt; this is about prose.
 * `openers` are only wrong at the start of a paragraph — "whether you can rejoin the queue" is a
 * perfectly good clause, while opening on "Whether you..." is the tell of generated travel copy.
 */
const FILLER = ['magical', 'immersive', 'unforgettable', 'beloved', 'nestled', 'delve', 'a testament to', 'whimsical']
const FILLER_OPENERS = ['whether you', 'in the world of', 'from the moment you']


/* ------------------------------------------------------------------ *
 * Machinery
 * ------------------------------------------------------------------ */

const problems = []
const notes = []
const fail = (where, message) => problems.push(`${where}: ${message}`)
const note = (where, message) => notes.push(`${where}: ${message}`)

// Apostrophes are dropped rather than normalised: "Jumpin' Jellyfish" and "jumpin jellyfish" must
// match, and so must every Goofy's / Luigi's / Tiana's in the reference tables.
const norm = (s) => String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9&: ]+/g, ' ').replace(/\s+/g, ' ').trim()
const matches = (name, needle) => norm(name).includes(norm(needle))

const PARKS = () => PARK_SLUGS

async function readJson (path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

/** Every string reachable in a JSON value, with a path for reporting. */
function * strings (value, path = '') {
  if (typeof value === 'string') { yield [path, value]; return }
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) yield * strings(v, `${path}[${i}]`)
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) yield * strings(v, path ? `${path}.${k}` : k)
  }
}

/* ------------------------------------------------------------------ *
 * Checks
 * ------------------------------------------------------------------ */

async function checkPark (slug) {
  const dir = join(DATA, 'parks', slug)
  if (!existsSync(join(dir, 'attractions.json'))) { note(slug, 'no attractions.json yet — skipped'); return }

  const attractions = (await readJson(join(dir, 'attractions.json'))).attractions || []
  const food = existsSync(join(dir, 'food.json')) ? (await readJson(join(dir, 'food.json'))).items || [] : []

  /* Heights */
  for (const [needle, expected] of Object.entries(HEIGHTS[slug] || {})) {
    const found = attractions.filter((a) => matches(a.name, needle))
    if (!found.length) { fail(slug, `no attraction matching "${needle}" — the reference table expects one at ${expected}in`); continue }
    // Mission: SPACE legitimately splits into two entries at 40 and 44.
    for (const a of found) {
      if (a.heightIn !== expected && !(needle === 'mission' && [40, 44].includes(a.heightIn))) {
        fail(slug, `"${a.name}" has heightIn ${JSON.stringify(a.heightIn)} but the reference table says ${expected}`)
      }
    }
  }

  /* Mission: SPACE is the one attraction with two legitimate heights. */
  if (slug === 'epcot') {
    const mission = attractions.filter((a) => matches(a.name, 'mission: space') || matches(a.name, 'mission space'))
    const heights = new Set(mission.map((a) => a.heightIn))
    if (!mission.length) fail(slug, 'Mission: SPACE is missing')
    else if (!heights.has(40) && !heights.has(44)) {
      fail(slug, `Mission: SPACE heights are ${[...heights].join('/')}, expected 40 (Green) and 44 (Orange)`)
    }
  }

  /* Nothing outside the reference table should carry an implausible height. */
  for (const a of attractions) {
    if (a.heightIn == null) continue
    const known = Object.keys(HEIGHTS[slug] || {}).some((needle) => matches(a.name, needle))
    if (!known && ![32, 35, 38, 40, 42, 44, 46, 48].includes(a.heightIn)) {
      note(slug, `"${a.name}" has an unusual height of ${a.heightIn}in — verify it`)
    }
  }

  /* Closures and reopenings */
  for (const needle of MUST_BE_CLOSED[slug] || []) {
    const found = attractions.filter((a) => matches(a.name, needle))
    if (!found.length) { note(slug, `no entry matching "${needle}" — it closed in 2025/26 and is worth listing`); continue }
    for (const a of found) {
      if ((a.status || 'open') === 'open') fail(slug, `"${a.name}" is marked open but closed permanently in 2025/26`)
      else if (!a.closedNote) fail(slug, `"${a.name}" is closed but has no closedNote`)
    }
  }
  for (const needle of MUST_BE_OPEN[slug] || []) {
    const found = attractions.filter((a) => matches(a.name, needle))
    if (!found.length) { fail(slug, `no attraction matching "${needle}" — it is operating and must be listed`); continue }
    if (!found.some((a) => (a.status || 'open') === 'open')) {
      fail(slug, `every entry matching "${needle}" is marked closed, but it is operating`)
    }
  }

  /* Test Track uses Multi Pass, not Single Pass — a common and specific error. */
  if (slug === 'epcot') {
    for (const a of attractions.filter((x) => matches(x.name, 'test track'))) {
      if (a.lightningLane !== 'multi-pass') {
        fail(slug, `Test Track has lightningLane "${a.lightningLane}" — the 2025 version uses Multi Pass`)
      }
    }
  }

  /* Virtual queues: none are permanent at either resort as of mid-2026. */
  for (const a of attractions.filter((x) => x.virtualQueue === true)) {
    fail(slug, `"${a.name}" claims a virtual queue — no attraction at either resort permanently uses one`)
  }

  /* Ranked pages must not rank a closed attraction. */
  const bestRidesPath = join(dir, 'best-rides.json')
  if (existsSync(bestRidesPath)) {
    const doc = await readJson(bestRidesPath)
    const bySlug = new Map(attractions.map((a) => [a.slug, a]))
    for (const entry of doc.ranking || []) {
      const a = bySlug.get(entry.slug)
      if (a && (a.status || 'open') !== 'open') fail(`${slug}/best-rides.json`, `ranks "${a.name}", which is closed`)
    }
  }

  /* Snack prices */
  for (const ref of SNACK_PRICES) {
    if (!ref.parks.includes(slug)) continue
    for (const item of food.filter((i) => matches(i.name, ref.match))) {
      if (item.price != null && Math.abs(item.price - ref.price) > 0.01) {
        note(slug, `"${item.name}" is $${item.price}; the verified figure is $${ref.price} — fine if this is a different location, otherwise fix it`)
      }
    }
  }
  for (const item of food) {
    if (item.price != null && item.priceVerified == null) fail(slug, `"${item.name}" has a price with no priceVerified month`)
    if (item.seasonal === true) fail(slug, `"${item.name}" is marked seasonal — that belongs under data/seasonal/`)
  }
}

async function checkProse () {
  const files = []
  for (const slug of PARKS()) {
    for (const name of ['park.json', 'attractions.json', 'dining.json', 'food.json', 'best-rides.json']) {
      const path = join(DATA, 'parks', slug, name)
      if (existsSync(path)) files.push([`${slug}/${name}`, path])
    }
  }
  for (const dir of ['guides', 'compare']) {
    const base = join(DATA, dir)
    if (!existsSync(base)) continue
    const { readdir } = await import('node:fs/promises')
    for (const name of await readdir(base)) {
      if (name.endsWith('.json')) files.push([`${dir}/${name}`, join(base, name)])
    }
  }

  for (const [label, path] of files) {
    const doc = await readJson(path)
    const fillerHits = new Map()
    const seasonalHits = new Map()

    for (const [where, value] of strings(doc)) {
      // Skip identifier-ish fields; this is about prose.
      if (/\.(slug|id|image|url|href|restaurantSlug|land|park|resort)$/.test(where)) continue
      const lower = value.toLowerCase()
      for (const word of FILLER) {
        if (lower.includes(word)) fillerHits.set(word, (fillerHits.get(word) || 0) + 1)
      }
      for (const opener of FILLER_OPENERS) {
        if (lower.startsWith(opener)) fillerHits.set(`opens with "${opener}"`, (fillerHits.get(`opens with "${opener}"`) || 0) + 1)
      }
      for (const term of SEASONAL) {
        if (lower.includes(term)) seasonalHits.set(term, (seasonalHits.get(term) || 0) + 1)
      }
    }

    if (fillerHits.size) {
      note(label, `filler words present — ${[...fillerHits].map(([w, n]) => `${w} (${n})`).join(', ')}`)
    }
    if (seasonalHits.size) {
      fail(label, `seasonal content on an evergreen page — ${[...seasonalHits].map(([t, n]) => `${t} (${n})`).join(', ')}`)
    }
  }
}

/**
 * Guide prose that states a count the dataset also computes.
 *
 * The height guide renders a generated appendix from the live data on the same page as its authored
 * prose, so a stale hard-coded number is not merely wrong — it visibly contradicts the table beside
 * it. These are the only counts worth pinning; everything else in that guide is qualitative.
 */
async function checkGuideCounts () {
  const path = join(DATA, 'guides', 'height-requirements.json')
  if (!existsSync(path)) return

  const { readdir } = await import('node:fs/promises')
  let total = 0
  const byHeight = new Map()
  for (const slug of PARKS()) {
    const file = join(DATA, 'parks', slug, 'attractions.json')
    if (!existsSync(file)) return // incomplete dataset — counts would be misleading
    for (const a of (await readJson(file)).attractions || []) {
      if (a.heightIn == null || (a.status || 'open') !== 'open') continue
      total++
      byHeight.set(a.heightIn, (byHeight.get(a.heightIn) || 0) + 1)
    }
  }

  const text = [...strings(await readJson(path))].map(([, v]) => v).join(' ')
  const stated = text.match(/There are (\d+) height-restricted attractions/)
  if (stated && Number(stated[1]) !== total) {
    fail('guides/height-requirements.json',
      `prose says ${stated[1]} height-restricted attractions but the dataset has ${total} — the generated table on the same page will contradict it`)
  }
  const at40 = byHeight.get(40) || 0
  for (const m of text.matchAll(/unlocks (\d+) attractions/g)) {
    if (Number(m[1]) !== at40) {
      fail('guides/height-requirements.json',
        `prose says 40 inches unlocks ${m[1]} attractions but the dataset has ${at40} at exactly 40in`)
    }
  }
}

async function checkLightningLaneClaims () {
  const base = join(DATA, 'guides')
  if (!existsSync(base)) return
  const path = join(base, 'lightning-lane.json')
  if (!existsSync(path)) { note('guides', 'lightning-lane.json is missing'); return }
  const doc = await readJson(path)
  const text = [...strings(doc)].map(([, v]) => v).join(' ').toLowerCase()

  if (!/as of (july )?2026|july 2026/.test(text)) {
    fail('guides/lightning-lane.json', 'no "as of July 2026" framing — dynamic prices must never read as fixed')
  }
  if (!/\$34/.test(text)) {
    note('guides/lightning-lane.json', 'does not mention the $34 Disneyland Multi Pass starting price')
  }
  if (/genie\+/.test(text) && !/replaced|until|formerly|used to/.test(text)) {
    fail('guides/lightning-lane.json', 'refers to Genie+ without noting it was replaced in July 2024')
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const { operators } = await import('../src/lib/data.mjs')
const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = requested.length ? requested : (await operators()).map((o) => o.slug)

for (const operatorSlug of targets) {
  await loadReference(operatorSlug)
  for (const slug of PARKS()) await checkPark(slug)
  await checkProse()
  await checkGuideCounts()
  await checkLightningLaneClaims()
}

if (notes.length) {
  console.log(`\n  ${notes.length} note${notes.length === 1 ? '' : 's'}:`)
  for (const n of notes.slice(0, 60)) console.log(`    · ${n}`)
  if (notes.length > 60) console.log(`    … and ${notes.length - 60} more`)
}

if (problems.length) {
  console.error(`\n  ${problems.length} factual problem${problems.length === 1 ? '' : 's'}:\n`)
  for (const p of problems.slice(0, 100)) console.error(`    ✗ ${p}`)
  if (problems.length > 100) console.error(`    … and ${problems.length - 100} more`)
  console.error('')
  process.exit(1)
}

console.log(`\n  Facts check out against the July 2026 reference tables for ${targets.length} operator${targets.length === 1 ? '' : 's'}${notes.length ? ` (${notes.length} note${notes.length === 1 ? '' : 's'})` : ''}.\n`)

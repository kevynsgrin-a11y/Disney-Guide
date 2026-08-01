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
let PLAUSIBLE_HEIGHTS = []
let DUAL_HEIGHTS = {}
let QUEUE_ASSIGNMENT = {}
let VIRTUAL_QUEUE_ALLOWED = []
let QUEUE_CLAIMS = {}
let PROPER_NAMES = []
let CONFLICTS = []
let conflictsHit = new Set()
let QUEUE = { name: 'Lightning Lane', guideSlug: 'lightning-lane' }

async function loadReference (operatorSlug) {
  const { operatorDir, parkOrder } = await import('../src/lib/data.mjs')
  DATA = await operatorDir(operatorSlug)
  const site = JSON.parse(await readFile(join(DATA, 'site.json'), 'utf8'))
  PARK_SLUGS = parkOrder(site)
  QUEUE = { name: 'Lightning Lane', guideSlug: 'lightning-lane', ...(site.queue || {}) }

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
  PLAUSIBLE_HEIGHTS = ref.PLAUSIBLE_HEIGHTS || []
  DUAL_HEIGHTS = ref.DUAL_HEIGHTS || {}
  QUEUE_ASSIGNMENT = ref.QUEUE_ASSIGNMENT || {}
  VIRTUAL_QUEUE_ALLOWED = ref.VIRTUAL_QUEUE_ALLOWED || []
  QUEUE_CLAIMS = ref.QUEUE_CLAIMS || {}
  PROPER_NAMES = (ref.PROPER_NAMES || []).map((n) => n.toLowerCase())
  CONFLICTS = ref.CONFLICTS || []
  conflictsHit = new Set()
}

/**
 * A recorded disagreement between the reference table and the dataset that a human has not settled.
 *
 * When two independent sources disagree, there are three things you can do. Change the table to
 * match the data — which destroys the check, because the table now says what the data says and
 * agreeing with itself is what it was built to not do. Change the data to match the table — which
 * assumes the table is the more reliable source, and nothing establishes that. Or write down that
 * they disagree, with both values, and send it to someone who can look it up.
 *
 * Only the third is honest, so it is the only one with a mechanism. A conflict downgrades the
 * failure to a loud note and puts the row on the launch checklist. It is never a way to make a
 * disagreement go away: an operator cannot go live with a non-empty CONFLICTS list — see
 * test/operators.test.mjs — and a row that stops matching is reported as stale rather than ignored.
 */
function conflictFor (park, name, field, reference, dataset) {
  const row = CONFLICTS.find((c) =>
    c.park === park && c.field === field && matches(name, c.attraction) &&
    c.reference === reference && c.dataset === dataset)
  if (row) conflictsHit.add(row)
  return row
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
  /*
   * A few attractions legitimately carry two heights, because they are two experiences sharing a
   * name and a queue — Mission: SPACE splits Green at 40 and Orange at 44. DUAL_HEIGHTS names them
   * per operator so the exception is declared in the reference table rather than special-cased here.
   */
  const dual = DUAL_HEIGHTS[slug] || {}
  for (const [needle, expected] of Object.entries(HEIGHTS[slug] || {})) {
    const found = attractions.filter((a) => matches(a.name, needle))
    if (!found.length) { fail(slug, `no attraction matching "${needle}" — the reference table expects one at ${expected}in`); continue }
    const allowed = dual[needle] || [expected]
    for (const a of found) {
      if (allowed.includes(a.heightIn)) continue
      const conflict = conflictFor(slug, a.name, 'heightIn', expected, a.heightIn === undefined ? null : a.heightIn)
      if (conflict) {
        note(slug, `UNRESOLVED — "${a.name}" heightIn: reference says ${JSON.stringify(expected)}, dataset says ${JSON.stringify(a.heightIn ?? null)}. ${conflict.note}`)
      } else {
        fail(slug, `"${a.name}" has heightIn ${JSON.stringify(a.heightIn)} but the reference table says ${allowed.join(' or ')}`)
      }
    }
  }

  for (const [needle, expected] of Object.entries(dual)) {
    const found = attractions.filter((a) => matches(a.name, needle))
    if (!found.length) { fail(slug, `"${needle}" is missing — the reference table expects it at ${expected.join(' and ')}in`); continue }
    const heights = new Set(found.map((a) => a.heightIn))
    if (!expected.some((h) => heights.has(h))) {
      fail(slug, `"${needle}" heights are ${[...heights].join('/')}, expected ${expected.join(' and ')}`)
    }
  }

  /*
   * Nothing outside the reference table should carry an implausible height.
   *
   * The plausible set is per-operator because it is a fact about a specific set of parks, not about
   * theme parks generally: Disney's restrictions cluster at 32–48in, while Universal's coasters run
   * to 51, 52 and 54. A shared list would either miss real typos here or cry wolf there.
   */
  for (const a of attractions) {
    if (a.heightIn == null || !PLAUSIBLE_HEIGHTS.length) continue
    const known = Object.keys(HEIGHTS[slug] || {}).some((needle) => matches(a.name, needle))
    if (!known && !PLAUSIBLE_HEIGHTS.includes(a.heightIn)) {
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

  /*
   * Attractions whose queue-product tier is specifically easy to get wrong — Test Track moved to
   * Multi Pass with its 2025 rebuild and is still widely written up as Single Pass. Declared per
   * operator, since which tier an attraction sits in is exactly the kind of fact that differs.
   */
  for (const [needle, expected] of Object.entries(QUEUE_ASSIGNMENT[slug] || {})) {
    for (const a of attractions.filter((x) => matches(x.name, needle))) {
      if (a.lightningLane !== expected) {
        fail(slug, `"${a.name}" has lightningLane "${a.lightningLane}" but the reference table says "${expected}"`)
      }
    }
  }

  /*
   * Virtual queues.
   *
   * Disney runs none permanently as of mid-2026, so any claim of one is an error. Universal runs
   * several as standing policy. The allow-list is per operator; an empty one means "none", which is
   * an assertion the reference table makes rather than something assumed here.
   */
  for (const a of attractions.filter((x) => x.virtualQueue === true)) {
    if (!VIRTUAL_QUEUE_ALLOWED.some((needle) => matches(a.name, needle))) {
      fail(slug, `"${a.name}" claims a virtual queue, which the reference table does not list as one`)
    }
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

      /*
       * Proper names are scrubbed before the filler sweep, not after.
       *
       * "Magical" is banned as filler and is also the fourth word of Hagrid's Magical Creatures
       * Motorbike Adventure. Without this, one park's file reported thirteen filler hits of which
       * twelve were the ride's actual name — which is worse than not checking, because a check that
       * is mostly false positives is a check everybody learns to scroll past. Same principle as
       * NAME_EXCLAMATIONS in the seasonal checker: keep the rule strict by removing the cases where
       * obeying it would require misnaming something.
       *
       * Deliberately not applied to the SEASONAL sweep below. Halloween Horror Nights is a proper
       * name too, and banning it from evergreen pages is the entire point.
       */
      const prose = PROPER_NAMES.reduce((acc, name) => acc.split(name).join(' '), lower)

      for (const word of FILLER) {
        if (prose.includes(word)) fillerHits.set(word, (fillerHits.get(word) || 0) + 1)
      }
      for (const opener of FILLER_OPENERS) {
        if (prose.startsWith(opener)) fillerHits.set(`opens with "${opener}"`, (fillerHits.get(`opens with "${opener}"`) || 0) + 1)
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

/**
 * The paid queue-skipping guide, whichever product the operator sells.
 *
 * Every operator has one of these pages, it is the most price-sensitive page on the site, and the
 * ways it goes stale are operator-specific: Disney's says Genie+ two years after Genie+ stopped
 * existing, Universal's conflates Express Pass with Express Unlimited. The page is located from
 * site.queue.guideSlug and the claims come from the reference table, so this function knows only
 * that such a page exists — not what it is called or what it should say.
 */
async function checkQueueGuideClaims () {
  const base = join(DATA, 'guides')
  if (!existsSync(base)) return
  const label = `guides/${QUEUE.guideSlug}.json`
  const path = join(base, `${QUEUE.guideSlug}.json`)
  if (!existsSync(path)) { note('guides', `${QUEUE.guideSlug}.json is missing — the ${QUEUE.name} guide is the page prices go stale on first`); return }
  const doc = await readJson(path)
  const text = [...strings(doc)].map(([, v]) => v).join(' ').toLowerCase()

  for (const rule of QUEUE_CLAIMS.require || []) {
    if (!rule.re.test(text)) fail(label, rule.message)
  }
  for (const rule of QUEUE_CLAIMS.expect || []) {
    if (!rule.re.test(text)) note(label, rule.message)
  }
  for (const rule of QUEUE_CLAIMS.forbid || []) {
    if (rule.re.test(text) && !(rule.unless && rule.unless.test(text))) fail(label, rule.message)
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const { resolveTargets } = await import('../src/lib/data.mjs')
const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = (await resolveTargets(requested, { label: 'node scripts/factcheck.mjs' })).map((o) => o.slug)

for (const operatorSlug of targets) {
  await loadReference(operatorSlug)
  for (const slug of PARKS()) await checkPark(slug)
  await checkProse()
  await checkGuideCounts()
  await checkQueueGuideClaims()

  // A conflict row that no longer matches anything means the disagreement was settled and nobody
  // deleted the row. Left alone it is a standing exemption for a check that would now pass, which
  // is how a temporary allowance becomes permanent.
  for (const row of CONFLICTS) {
    if (!conflictsHit.has(row)) {
      fail(`${operatorSlug} reference`, `CONFLICTS row for "${row.attraction}" (${row.field}) no longer matches the dataset — the disagreement is resolved, so delete the row`)
    }
  }
  if (conflictsHit.size) {
    note(`${operatorSlug} reference`, `${conflictsHit.size} unresolved source conflict${conflictsHit.size === 1 ? '' : 's'} — this operator cannot go live until they are settled by a human`)
  }
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

/**
 * Seasonal data validator. Enforces docs/SEASONAL-SCHEMA.md.
 *
 * Runs before every build. Errors fail the build; warnings print and do not.
 *
 * Two checks here do not exist in scripts/validate.mjs and are the reason this is a separate file
 * rather than a flag on that one:
 *
 *   1. **Referential integrity against the evergreen dataset.** Every `crossLinks` href is resolved
 *      against the URL set the evergreen half actually generates. Handing a reader from a dated page
 *      to the permanent version of the same topic is the whole point of carrying both kinds of
 *      content, so a dead link between them is a build failure, not a warning.
 *   2. **The freshness contract.** Confidence, review dates, and the ban on stating exact future
 *      dates at anything below `confirmed` confidence. Everything else on this site is ordinary
 *      travel content; this is the part that has to be mechanical, because "I'll remember to
 *      re-check" is precisely what nobody does.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadData } from '../src/lib/data.mjs'
import { evergreenUrlSet, urls } from '../src/lib/seasonal-data.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
let DATA = join(ROOT, 'data')
let OPERATOR_DIR = join(ROOT, 'data')

const errors = []
const warnings = []
const err = (where, message) => errors.push(`${where}: ${message}`)
const warn = (where, message) => warnings.push(`${where}: ${message}`)

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const CONFIDENCE = new Set(['confirmed', 'expected', 'historical'])
const CYCLE = new Set(['annual', 'rolling', 'one-off'])
const CATEGORY = new Set(['hard-ticket', 'festival', 'overlay', 'after-hours', 'run'])
const SEASON = new Set(['halloween', 'holidays', 'spring', 'summer', 'lunar-new-year', 'year-round'])
const RESORT = new Set(['walt-disney-world', 'disneyland', 'both'])
const EDITION_STATUS = new Set(['announced', 'expected', 'past', 'cancelled'])
const LEVEL = new Set(['low', 'moderate', 'high', 'peak'])
const GRADE = new Set(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'])
const PRICE_MODEL = new Set(['per-night', 'per-day', 'add-on', 'included'])
/**
 * Closure statuses, aligned with the evergreen attraction vocabulary where the two overlap.
 *
 * A bare "closed" is deliberately not a value. The distinction a reader actually needs is whether
 * the thing is coming back, and collapsing "down for six weeks" and "gone forever" into one word is
 * how a tracker becomes useless at exactly the moment someone consults it.
 *
 * "indefinite" exists for the honest middle case: down, no announced return, and no basis for
 * calling it permanent. Without it an author has to pick between asserting work is underway and
 * asserting the thing is gone, and both would be claims we cannot support.
 */
const CLOSURE_STATUS = new Set(['refurbishment', 'indefinite', 'permanently-closed', 'under-construction', 'seasonal', 'reopening'])

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function readJson (path, where) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    err(where, `unreadable or invalid JSON — ${e.message}`)
    return null
  }
}

async function listJson (dir) {
  if (!existsSync(dir)) return []
  return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
}

function str (obj, key, where, { min = 1, max = Infinity } = {}) {
  const value = obj[key]
  if (typeof value !== 'string' || !value.trim()) { err(where, `missing required string "${key}"`); return false }
  if (value.length < min) err(where, `"${key}" is too short (${value.length} chars, need ${min})`)
  if (value.length > max) warn(where, `"${key}" is long (${value.length} chars, prefer under ${max})`)
  return true
}

function arr (obj, key, where, { min = 1 } = {}) {
  const value = obj[key]
  if (!Array.isArray(value)) { err(where, `missing required array "${key}"`); return false }
  if (value.length < min) err(where, `"${key}" needs at least ${min} ${min === 1 ? 'entry' : 'entries'} (has ${value.length})`)
  return value.length >= min
}

function oneOf (obj, key, set, where, { optional = false } = {}) {
  const value = obj[key]
  if (value == null) { if (!optional) err(where, `missing required "${key}"`); return }
  if (!set.has(value)) err(where, `"${key}" is "${value}", expected one of: ${[...set].join(', ')}`)
}

/** 'YYYY-MM' arithmetic without Date, so no timezone can move a month boundary. */
function monthIndex (ym) {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}

/* ------------------------------------------------------------------ *
 * The freshness contract — §3
 * ------------------------------------------------------------------ */

function checkFreshness (obj, where, { requireWindow = false, hasWindow = false } = {}) {
  const fr = obj.freshness
  if (!fr || typeof fr !== 'object') { err(where, 'missing required "freshness" block'); return }

  const scope = `${where} → freshness`
  if (!MONTH_RE.test(fr.verified || '')) err(scope, `"verified" must be YYYY-MM (got ${JSON.stringify(fr.verified)})`)
  if (!MONTH_RE.test(fr.reviewBy || '')) err(scope, `"reviewBy" must be YYYY-MM (got ${JSON.stringify(fr.reviewBy)})`)
  oneOf(fr, 'confidence', CONFIDENCE, scope)
  oneOf(fr, 'cycle', CYCLE, scope)

  if (MONTH_RE.test(fr.verified || '') && MONTH_RE.test(fr.reviewBy || '')) {
    const gap = monthIndex(fr.reviewBy) - monthIndex(fr.verified)
    if (gap <= 0) err(scope, `"reviewBy" (${fr.reviewBy}) must be after "verified" (${fr.verified})`)
    // A fact nobody rechecks for two years is not being maintained, it is being abandoned.
    if (gap > 18) err(scope, `"reviewBy" is ${gap} months after "verified" — the cap is 18`)
  }

  if (fr.confidence === 'confirmed') {
    if (typeof fr.sourceNote !== 'string' || fr.sourceNote.trim().length < 30) {
      err(scope, 'confidence "confirmed" requires a "sourceNote" of at least 30 characters saying what was announced')
    }
  }

  if (requireWindow && fr.cycle === 'annual' && !hasWindow) {
    err(scope, 'cycle "annual" requires a "typicalWindow" — the window is what stays true when the dates do not')
  }
  return fr
}

/**
 * §7.4 rule 1. An exact calendar date is only permissible at `confirmed` confidence.
 *
 * Checked against the serialised value rather than field by field, because the offending date is
 * usually buried in prose ("returns on August 15") rather than sitting in a date field where a
 * type check would find it.
 */
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/
const DAY_MONTH = /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i
const MONTH_DAY = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?!\d)/i

function checkNoExactDates (value, where, confidence) {
  if (confidence === 'confirmed') return
  const text = JSON.stringify(value)
  // "31 October" and "1 November" are the two fixed points of the calendar these events hang off —
  // Halloween and All Saints' Day do not move, so naming them is a statement about the calendar
  // rather than an unannounced claim about a schedule.
  const scrubbed = text
    .replace(/\b31\s+October\b/gi, '')
    .replace(/\b1\s+November\b/gi, '')
    .replace(/\b30\s+December\b/gi, '')
    .replace(/\b31\s+December\b/gi, '')
    .replace(/\b25\s+December\b/gi, '')
    .replace(/\b1\s+January\b/gi, '')
    .replace(/\bDecember\s+25\b/gi, '')
    .replace(/\bOctober\s+31\b/gi, '')
    .replace(/\bJuly\s+4\b/gi, '')

  if (ISO_DATE.test(scrubbed)) {
    err(where, `contains an exact ISO date at confidence "${confidence}" — only "confirmed" entries may state exact dates`)
  }
  const dm = scrubbed.match(DAY_MONTH) || scrubbed.match(MONTH_DAY)
  if (dm) {
    err(where, `contains the exact date "${dm[0]}" at confidence "${confidence}" — use a prose window ("mid-August") instead`)
  }
}

/* ------------------------------------------------------------------ *
 * Cross-site link integrity
 * ------------------------------------------------------------------ */

/**
 * The evergreen half's live URL set, taken from src/lib/seasonal-data.mjs rather than rebuilt here.
 *
 * An independently-derived second list was the obvious thing to write and the wrong thing: it would
 * have drifted from the one the build actually links against, and the validator would then be
 * proving something no page depends on.
 */
async function site1UrlSet (operatorSlug) {
  const data = await loadData(operatorSlug)
  return { set: await evergreenUrlSet(data), data }
}

function checkCrossLinks (obj, where, s1Urls, { min = 1 } = {}) {
  const links = obj.crossLinks
  if (!Array.isArray(links) || links.length < min) {
    err(where, `needs at least ${min} "crossLinks" entry — the evergreen pages own every permanent fact and must be linked`)
    return
  }
  links.forEach((link, i) => {
    const scope = `${where} → crossLinks[${i}]`
    if (!link || typeof link !== 'object') { err(scope, 'must be an object'); return }
    str(link, 'label', scope)
    if (typeof link.href !== 'string') { err(scope, 'missing "href"'); return }
    if (!link.href.startsWith('/')) { err(scope, `"${link.href}" must be a root-relative path`); return }
    if (!s1Urls.has(link.href)) err(scope, `"${link.href}" does not exist on this site`)
  })
}

/**
 * §7.4 rule 3. The evergreen dataset owns permanent facts; restating them here creates two owners
 * and guarantees they drift apart.
 */
const DUPLICATION = [
  /\b\d{2}\s*(?:inches|")\s*(?:tall|minimum|min\b)/i,
  /\bheight requirement\b/i,
  /\bmust be at least \d+\b/i,
]

function checkScope (obj, where) {
  // crossLinks labels legitimately name the evergreen height pages, so they are excluded.
  const { crossLinks, ...rest } = obj
  const text = JSON.stringify(rest)
  for (const re of DUPLICATION) {
    const hit = text.match(re)
    if (hit) err(where, `restates a permanent fact ("${hit[0]}") — link to the evergreen page instead of repeating it`)
  }
}

/* ------------------------------------------------------------------ *
 * Money — §7.4 rule 2
 * ------------------------------------------------------------------ */

function checkRange (value, where, key) {
  if (!Array.isArray(value) || value.length !== 2) {
    err(where, `"${key}" must be a two-element [low, high] range — a fixed price is never correct on this site`)
    return false
  }
  const [low, high] = value
  if (typeof low !== 'number' || typeof high !== 'number') { err(where, `"${key}" values must be numbers`); return false }
  if (!(low < high)) err(where, `"${key}" must have low < high (got ${low}, ${high})`)
  return true
}

/* ------------------------------------------------------------------ *
 * Events — §4
 * ------------------------------------------------------------------ */

async function validateEvents (s1Urls, s1Data) {
  const dir = join(DATA, 'events')
  const files = await listJson(dir)
  if (!files.length) { warn('events', 'no event files found'); return new Set() }

  const slugs = new Set(files.map((f) => f.replace(/\.json$/, '')))
  const parkSlugs = new Set(s1Data.parks.map((p) => p.slug))

  for (const file of files) {
    const where = `events/${file}`
    const ev = await readJson(join(dir, file), where)
    if (!ev) continue

    const expected = file.replace(/\.json$/, '')
    if (ev.slug !== expected) err(where, `"slug" is "${ev.slug}" but the filename says "${expected}"`)
    if (!SLUG_RE.test(ev.slug || '')) err(where, `"slug" is not a valid slug`)

    str(ev, 'name', where)
    str(ev, 'summary', where, { min: 80 })
    str(ev, 'h1', where)
    str(ev, 'title', where, { max: 60 })
    str(ev, 'description', where, { min: 100, max: 170 })
    oneOf(ev, 'resort', RESORT, where)
    oneOf(ev, 'category', CATEGORY, where)
    oneOf(ev, 'season', SEASON, where)

    if (ev.parkSlug != null && !parkSlugs.has(ev.parkSlug)) {
      err(where, `"parkSlug" is "${ev.parkSlug}", which is not a park in data/parks/`)
    }

    const win = ev.typicalWindow
    if (win) {
      str(win, 'startsAround', `${where} → typicalWindow`)
      str(win, 'endsAround', `${where} → typicalWindow`)
      if (win.nightsRange && !checkRange(win.nightsRange, `${where} → typicalWindow`, 'nightsRange')) { /* reported */ }
    }

    const pricing = ev.pricing
    if (!pricing || typeof pricing !== 'object') {
      err(where, 'missing required "pricing" block')
    } else {
      oneOf(pricing, 'model', PRICE_MODEL, `${where} → pricing`)
      if (pricing.model !== 'included') {
        checkRange(pricing.rangeUsd, `${where} → pricing`, 'rangeUsd')
        str(pricing, 'asOf', `${where} → pricing`)
      }
    }

    arr(ev, 'whatYouGet', where, { min: 4 })
    // A page that only lists upsides is an advertisement, so this floor is deliberate.
    arr(ev, 'whatYouDont', where, { min: 2 })
    arr(ev, 'strategy', where, { min: 3 })
    arr(ev, 'faqs', where, { min: 4 })

    const verdict = ev.verdict
    if (!verdict || typeof verdict !== 'object') {
      err(where, 'missing required "verdict" block')
    } else {
      str(verdict, 'short', `${where} → verdict`, { max: 200 })
      arr(verdict, 'worthItIf', `${where} → verdict`, { min: 3 })
      arr(verdict, 'skipIf', `${where} → verdict`, { min: 3 })
    }

    for (const [i, s] of (ev.strategy || []).entries()) {
      const scope = `${where} → strategy[${i}]`
      if (!s || typeof s !== 'object') { err(scope, 'must be an object'); continue }
      str(s, 'heading', scope)
      arr(s, 'body', scope, { min: 1 })
    }

    for (const [i, faq] of (ev.faqs || []).entries()) {
      const scope = `${where} → faqs[${i}]`
      if (!faq || !faq.q || !faq.a) { err(scope, 'needs both "q" and "a"'); continue }
      if (String(faq.a).length < 80) warn(scope, 'answer is very short')
    }

    if (ev.food && Array.isArray(ev.food.items)) {
      for (const [i, item] of ev.food.items.entries()) {
        const scope = `${where} → food.items[${i}]`
        str(item, 'name', scope)
        if (typeof item.priceUsd !== 'number') err(scope, 'needs a numeric "priceUsd"')
      }
    }

    for (const rel of ev.related || []) {
      if (!slugs.has(rel)) err(where, `"related" entry "${rel}" is not an event on this site`)
    }

    const fr = checkFreshness(ev, where, { requireWindow: true, hasWindow: Boolean(win) })
    checkCrossLinks(ev, where, s1Urls, { min: 1 })
    checkScope(ev, where)

    // The pattern page's own prose is checked at its own confidence; each edition at its own.
    const { editions, ...pattern } = ev
    if (fr) checkNoExactDates(pattern, where, fr.confidence)

    for (const [i, ed] of (editions || []).entries()) {
      const scope = `${where} → editions[${i}]`
      if (typeof ed.year !== 'number') err(scope, 'needs a numeric "year"')
      oneOf(ed, 'status', EDITION_STATUS, scope)
      const edFr = checkFreshness(ed, scope)
      if (ed.status === 'announced' && (!edFr || edFr.confidence !== 'confirmed')) {
        err(scope, 'status "announced" requires this edition\'s own freshness.confidence to be "confirmed"')
      }
      if (ed.dates && ed.status !== 'announced') {
        err(scope, `"dates" is only permitted when status is "announced" (status is "${ed.status}")`)
      }
      // startDate/endDate are what turn the page into a real Event node, so they are gated on the
      // same announcement the prose dates are.
      for (const key of ['startDate', 'endDate']) {
        if (ed[key] == null) continue
        if (ed.status !== 'announced') err(scope, `"${key}" is only permitted when status is "announced"`)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ed[key])) err(scope, `"${key}" must be an ISO date (got ${JSON.stringify(ed[key])})`)
      }
      if ((ed.startDate == null) !== (ed.endDate == null)) {
        err(scope, 'startDate and endDate must be given together — a half-dated Event node is worse than none')
      }
      if (ed.priceRangeUsd != null) checkRange(ed.priceRangeUsd, scope, 'priceRangeUsd')
      if (edFr) checkNoExactDates(ed, scope, edFr.confidence)
    }
  }
  return slugs
}

/* ------------------------------------------------------------------ *
 * Months — §5
 * ------------------------------------------------------------------ */

async function validateMonths (s1Urls, eventSlugs) {
  const dir = join(DATA, 'months')
  const files = await listJson(dir)
  if (!files.length) { warn('months', 'no month files found'); return }

  const expectedFiles = MONTH_NAMES.map((_, i) => String(i + 1).padStart(2, '0') + '.json')
  for (const want of expectedFiles) {
    if (!files.includes(want)) err('months', `missing ${want} — all twelve months must exist or the /when-to-go/ index has holes`)
  }

  const grades = []
  for (const file of files) {
    const where = `months/${file}`
    const m = await readJson(join(dir, file), where)
    if (!m) continue

    const num = Number(file.replace(/\.json$/, ''))
    if (m.month !== num) err(where, `"month" is ${m.month} but the filename says ${num}`)
    if (m.name !== MONTH_NAMES[num - 1]) err(where, `"name" is "${m.name}", expected "${MONTH_NAMES[num - 1]}"`)
    if (!SLUG_RE.test(m.slug || '')) err(where, '"slug" is not a valid slug')

    str(m, 'summary', where, { min: 80 })

    const verdict = m.verdict
    if (!verdict || typeof verdict !== 'object') {
      err(where, 'missing required "verdict" block')
    } else {
      oneOf(verdict, 'grade', GRADE, `${where} → verdict`)
      str(verdict, 'short', `${where} → verdict`, { max: 200 })
      arr(verdict, 'bestFor', `${where} → verdict`, { min: 1 })
      arr(verdict, 'worstFor', `${where} → verdict`, { min: 1 })
      if (verdict.grade) grades.push(verdict.grade)
    }

    if (!m.crowds) err(where, 'missing "crowds"')
    else {
      oneOf(m.crowds, 'level', LEVEL, `${where} → crowds`)
      str(m.crowds, 'shape', `${where} → crowds`, { min: 80 })
    }
    if (!m.cost) err(where, 'missing "cost"')
    else oneOf(m.cost, 'level', LEVEL, `${where} → cost`)

    const w = m.weather
    if (!w || !w.wdw || !w.dlr) {
      err(where, 'missing "weather" with both "wdw" and "dlr"')
    } else {
      for (const key of ['wdw', 'dlr']) {
        for (const field of ['highF', 'lowF', 'rainDays']) {
          if (typeof w[key][field] !== 'number') err(`${where} → weather.${key}`, `"${field}" must be a number`)
        }
        if (w[key].highF <= w[key].lowF) err(`${where} → weather.${key}`, 'highF must exceed lowF')
      }
    }

    for (const slug of m.whatsOn || []) {
      if (!eventSlugs.has(slug)) err(where, `"whatsOn" entry "${slug}" is not an event on this site`)
    }

    arr(m, 'planningNotes', where, { min: 2 })
    checkFreshness(m, where)
    checkCrossLinks(m, where, s1Urls, { min: 1 })
    checkScope(m, where)
  }

  // A grade is only information if the grades differ. Twelve B's is a refusal to answer.
  if (grades.length >= 12) {
    const distinct = new Set(grades.map((g) => g.charAt(0)))
    if (distinct.size < 3) {
      err('months', `every month grades within ${distinct.size} letter band(s) (${[...distinct].join(', ')}) — the verdict is not doing any work`)
    }
  }
}

/* ------------------------------------------------------------------ *
 * Holidays, prices, closures, calendar — §6
 * ------------------------------------------------------------------ */

async function validateHolidays (s1Urls, eventSlugs) {
  const dir = join(DATA, 'holidays')
  for (const file of await listJson(dir)) {
    const where = `holidays/${file}`
    const h = await readJson(join(dir, file), where)
    if (!h) continue
    if (h.slug !== file.replace(/\.json$/, '')) err(where, `"slug" does not match the filename`)
    str(h, 'summary', where, { min: 80 })
    str(h, 'h1', where)
    str(h, 'title', where, { max: 60 })
    arr(h, 'sections', where, { min: 2 })
    arr(h, 'faqs', where, { min: 4 })
    for (const [resort, block] of Object.entries(h.byResort || {})) {
      const scope = `${where} → byResort.${resort}`
      if (!RESORT.has(resort)) err(scope, `"${resort}" is not a resort key`)
      for (const slug of (block && block.events) || []) {
        if (!eventSlugs.has(slug)) err(scope, `event "${slug}" does not exist`)
      }
    }
    const fr = checkFreshness(h, where)
    checkCrossLinks(h, where, s1Urls, { min: 1 })
    checkScope(h, where)
    if (fr) checkNoExactDates(h, where, fr.confidence)
  }
}

async function validatePrices (s1Urls) {
  const dir = join(DATA, 'prices')
  for (const file of await listJson(dir)) {
    const where = `prices/${file}`
    const p = await readJson(join(dir, file), where)
    if (!p) continue
    if (p.slug !== file.replace(/\.json$/, '')) err(where, '"slug" does not match the filename')
    str(p, 'summary', where, { min: 80 })
    str(p, 'h1', where)
    arr(p, 'rows', where, { min: 2 })
    for (const [i, row] of (p.rows || []).entries()) {
      const scope = `${where} → rows[${i}]`
      str(row, 'label', scope)
      oneOf(row, 'resort', RESORT, scope)
      checkRange(row.rangeUsd, scope, 'rangeUsd')
      // A figure without an as-of is the single most common way a seasonal page misleads.
      str(row, 'asOf', scope)
    }
    arr(p, 'howToSave', where, { min: 3 })
    checkFreshness(p, where)
    checkCrossLinks(p, where, s1Urls, { min: 1 })
    checkScope(p, where)
  }
}

async function validateClosures (s1Data) {
  const dir = join(DATA, 'closures')
  const byPark = new Map(s1Data.parks.map((p) => [p.slug, new Set(p.attractions.map((a) => a.slug))]))
  for (const file of await listJson(dir)) {
    const where = `closures/${file}`
    const c = await readJson(join(dir, file), where)
    if (!c) continue
    oneOf(c, 'resort', RESORT, where)
    if (!Array.isArray(c.items)) { err(where, 'missing "items" array'); continue }
    for (const [i, item] of c.items.entries()) {
      const scope = `${where} → items[${i}]`
      str(item, 'name', scope)
      oneOf(item, 'status', CLOSURE_STATUS, scope)
      const parkSet = byPark.get(item.parkSlug)
      if (!parkSet) { err(scope, `"parkSlug" is "${item.parkSlug}", which is not a park in data/parks/`); continue }
      // A tracker listing rides that do not exist is worse than no tracker.
      if (item.attractionSlug && !parkSet.has(item.attractionSlug)) {
        err(scope, `"attractionSlug" is "${item.attractionSlug}", which is not an attraction at ${item.parkSlug}`)
      }
      if (item.reopening && item.reopeningConfidence !== 'confirmed') {
        checkNoExactDates({ reopening: item.reopening }, scope, item.reopeningConfidence || 'expected')
      }
    }
    checkFreshness(c, where)
  }
}

async function validateCalendar (eventSlugs) {
  const path = join(DATA, 'calendar.json')
  if (!existsSync(path)) { warn('calendar.json', 'missing — the year-at-a-glance page will not render'); return }
  const cal = await readJson(path, 'calendar.json')
  if (!cal) return
  if (!Array.isArray(cal.bands)) { err('calendar.json', 'missing "bands" array'); return }
  const seen = new Set()
  for (const [i, band] of cal.bands.entries()) {
    const scope = `calendar.json → bands[${i}]`
    if (!eventSlugs.has(band.eventSlug)) err(scope, `"${band.eventSlug}" is not an event on this site`)
    if (seen.has(band.eventSlug)) err(scope, `duplicate band for "${band.eventSlug}"`)
    seen.add(band.eventSlug)
    for (const key of ['startMonth', 'endMonth']) {
      const v = band[key]
      if (!Number.isInteger(v) || v < 1 || v > 12) err(scope, `"${key}" must be an integer 1–12 (got ${JSON.stringify(v)})`)
    }
    oneOf(band, 'resort', RESORT, scope)
    oneOf(band, 'confidence', CONFIDENCE, scope)
  }
  for (const slug of eventSlugs) {
    if (!seen.has(slug)) warn('calendar.json', `no band for "${slug}" — it will be missing from the year view`)
  }
}

/** The dated pages this build will publish, derived from the data rather than from built output. */
async function builtUrlSet (eventSlugs) {
  const set = new Set([
    urls.home(), urls.calendar(), urls.whenToGoIndex(), urls.eventsIndex(), urls.holidaysIndex(),
    urls.pricesIndex(), urls.closuresIndex(), urls.toolsIndex(), urls.tripTiming(),
    urls.about(), urls.editorial(), urls.affiliate(), urls.privacy(), urls.terms(), urls.contact(),
  ])
  for (const slug of eventSlugs) set.add(urls.event(slug))
  for (const file of await listJson(join(DATA, 'months'))) {
    const month = await readJson(join(DATA, 'months', file), `months/${file}`)
    if (month && month.slug) set.add(urls.month(month.slug))
  }
  for (const [folder, build] of [['holidays', urls.holiday], ['prices', urls.price]]) {
    for (const file of await listJson(join(DATA, folder))) set.add(build(file.replace(/\.json$/, '')))
  }
  for (const file of await listJson(join(DATA, 'closures'))) set.add(urls.closures(file.replace(/\.json$/, '')))
  return set
}

/**
 * Every nav href must resolve to a page this site actually builds.
 *
 * The nav is written before the content exists, so its slugs start life as guesses. One that never
 * gets reconciled produces a 404 in the footer of every page on the site — the most visible kind of
 * breakage, and the kind nobody notices because nobody clicks their own footer.
 */
async function validateNav (eventSlugs, evergreen) {
  const where = 'site.json'
  const site = await readJson(join(OPERATOR_DIR, 'site.json'), where)
  if (!site || !site.nav) return

  const built = await builtUrlSet(eventSlugs)
  for (const path of evergreen) built.add(path.split('#')[0])

  const links = [
    ...(site.nav.primary || []),
    ...(site.nav.footer || []).flatMap((column) => column.links || []),
  ]
  for (const link of links) {
    if (!link || typeof link.href !== 'string') { err(`${where} → nav`, 'nav entry with no href'); continue }
    if (!link.href.startsWith('/')) continue
    if (!built.has(link.href)) err(`${where} → nav`, `"${link.label}" links to ${link.href}, which this site does not build`)
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function validateOperator (operatorSlug) {
  const { operatorDir } = await import('../src/lib/data.mjs')
  const { seasonalDir } = await import('../src/lib/seasonal-data.mjs')
  OPERATOR_DIR = await operatorDir(operatorSlug)
  DATA = await seasonalDir(operatorSlug)
  if (!existsSync(DATA)) {
    warn(operatorSlug, 'no seasonal/ directory — nothing dated to validate')
    return { size: 0 }
  }

  const { set: s1Urls, data: s1Data } = await site1UrlSet(operatorSlug)

  const eventSlugs = await validateEvents(s1Urls, s1Data)
  await validateNav(eventSlugs, s1Urls)
  await validateMonths(s1Urls, eventSlugs)
  await validateHolidays(s1Urls, eventSlugs)
  await validatePrices(s1Urls)
  await validateClosures(s1Data)
  await validateCalendar(eventSlugs)
  return { size: eventSlugs.size, urls: s1Urls.size }
}

async function main () {
  const { operators } = await import('../src/lib/data.mjs')
  const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const targets = requested.length ? requested : (await operators()).map((o) => o.slug)

  let events = 0
  let urlCount = 0
  for (const slug of targets) {
    const result = await validateOperator(slug)
    events += result.size
    urlCount += result.urls || 0
  }

  if (warnings.length) {
    console.log(`\n  ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`)
    for (const w of warnings) console.log(`    · ${w}`)
  }

  if (errors.length) {
    console.error(`\n  ${errors.length} error${errors.length === 1 ? '' : 's'}:`)
    for (const e of errors) console.error(`    ✗ ${e}`)
    console.error('')
    process.exitCode = 1
    return
  }

  console.log(`\n  Seasonal data valid. ${events} events across ${targets.length} operator${targets.length === 1 ? '' : 's'}, checked against ${urlCount} live evergreen URLs.\n`)
}

main().catch((e) => { console.error('\nValidator crashed:\n', e); process.exitCode = 1 })

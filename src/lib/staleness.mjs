/**
 * The freshness contract from docs/SEASONAL-SCHEMA.md §3, computed at build time.
 *
 * Every dated claim is stamped by this module rather than by the author. The failure mode
 * of a seasonal site is a page that looks current and is not, and an author who forgot to update the
 * ribbon is precisely the case worth taking out of human hands.
 *
 * Pure functions, no I/O.
 */

import { humanDate } from './format.mjs'

/**
 * The month the site is built for. This is the one place to bump it.
 *
 * Deliberately a constant rather than the system clock: a build that read the real date would change
 * its own output between two runs of the same commit, so a page could go stale in production with no
 * diff, no review, and nothing for the audit to catch.
 */
export const BUILD_MONTH = '2026-07'

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

/** True for a well-formed 'YYYY-MM'. The validator enforces the same shape on authored JSON. */
export function isMonth (value) {
  return typeof value === 'string' && MONTH_PATTERN.test(value)
}

// A typo here would make every month arithmetic below NaN, and NaN compares false against every
// threshold — which reads as "fresh" at exactly the moment nothing is.
if (!isMonth(BUILD_MONTH)) {
  throw new Error(`BUILD_MONTH must be YYYY-MM, got ${JSON.stringify(BUILD_MONTH)}`)
}

/** Months since year zero, so overdue arithmetic never touches Date and never crosses a time zone. */
function ordinal (month) {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1
}

/**
 * -1, 0, or 1 for two 'YYYY-MM' strings, compared as strings because zero-padded months already sort
 * chronologically. Throws on anything else rather than returning NaN: this comparator decides which
 * pages carry a stale banner, and a silent NaN would sort an abandoned page into the fresh band.
 */
export function compareMonths (a, b) {
  if (!isMonth(a) || !isMonth(b)) {
    throw new TypeError(`compareMonths expects two YYYY-MM strings, received ${JSON.stringify(a)} and ${JSON.stringify(b)}`)
  }
  return a < b ? -1 : a > b ? 1 : 0
}

/* ------------------------------------------------------------------ *
 * Confidence
 * ------------------------------------------------------------------ */

const CONFIDENCE = {
  confirmed: {
    level: 'confirmed',
    label: 'Confirmed',
    tone: 'good',
    note: 'Officially announced by the operator. Exact dates and prices are quotable.',
  },
  expected: {
    level: 'expected',
    label: 'Expected — not yet announced',
    tone: 'warn',
    note: 'Not announced, but the pattern is strong enough to plan around. Windows and ranges only, never an exact date.',
  },
  historical: {
    level: 'historical',
    label: 'Last confirmed cycle',
    tone: 'muted',
    note: 'Last cycle’s figures, labeled with their year. This cycle is unannounced or unclear.',
  },
}

/**
 * Anything outside the three contract levels — including a missing one — reads as unverified rather
 * than as the mildest of the three. Guessing downward costs a reader nothing; guessing upward puts a
 * green ribbon over a claim nobody checked, which is the one thing this site sells.
 */
const UNVERIFIED = {
  level: 'unknown',
  label: 'Not verified',
  tone: 'danger',
  note: 'No confidence level was recorded, so treat every figure here as unchecked.',
}

/** `tone` values are CSS modifier suffixes: good | warn | muted | danger. */
export function confidenceMeta (level) {
  return { ...(CONFIDENCE[level] || UNVERIFIED) }
}

/* ------------------------------------------------------------------ *
 * Staleness
 * ------------------------------------------------------------------ */

const STATE_TONE = { fresh: 'good', due: 'warn', stale: 'danger' }

function result (state, label, monthsOverdue, meta) {
  return {
    state,
    label,
    tone: STATE_TONE[state],
    monthsOverdue,
    confidence: meta.level,
    confidenceLabel: meta.label,
    // A page past its review date does not get to wear its confidence color. "Confirmed" in green
    // over a fact nobody has rechecked in a year is exactly the claim this site exists not to make.
    ribbonTone: state === 'stale' ? STATE_TONE.stale : meta.tone,
  }
}

/**
 * Resolve a `freshness` block into everything the page needs to render its ribbon and banner.
 *
 * A missing, malformed, or absent-`reviewBy` block resolves to `stale`, never to `fresh`. Treating
 * "no review date" as "no problem" would let an unstamped file ship looking as trustworthy as a
 * verified one, and unstamped files are the ones most likely to be wrong.
 */
export function staleness (freshness) {
  const meta = confidenceMeta(freshness && freshness.confidence)
  const reviewBy = freshness && freshness.reviewBy
  const verified = freshness && freshness.verified

  if (!isMonth(reviewBy)) return result('stale', 'No review date recorded', null, meta)

  const overdue = ordinal(BUILD_MONTH) - ordinal(reviewBy)
  if (overdue < 0) {
    return result('fresh', isMonth(verified) ? `Verified ${humanDate(verified)}` : `Next review ${humanDate(reviewBy)}`, 0, meta)
  }
  if (overdue === 0) return result('due', `Review due ${humanDate(reviewBy)}`, 0, meta)
  return result('stale', `Review overdue by ${overdue} month${overdue === 1 ? '' : 's'}`, overdue, meta)
}

export function isStale (freshness) {
  return staleness(freshness).state === 'stale'
}

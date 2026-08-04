/**
 * Generates the narration script for a month's audio brief.
 *
 * Run: node scripts/audio-script.mjs disney            → all twelve
 *      node scripts/audio-script.mjs disney 03         → just March
 *      node scripts/audio-script.mjs disney 03 --pron  → plus the pronunciation list
 *
 * WHY THIS IS GENERATED RATHER THAN WRITTEN
 *
 * The audio brief is a new surface saying dated things about crowds, weather and prices — which is
 * exactly the category this site refuses to state without a verification month attached. If the
 * script were written by hand it would be a second, unverified copy of facts the dataset already
 * owns, drifting away from the page the moment either changed.
 *
 * So every sentence below is derived from a field in data/<operator>/seasonal/months/NN.json. There
 * is no sentence in the output whose content is not already on the page, already validated by
 * scripts/validate-seasonal.mjs, and already fact-checked against the reference tables. Regenerating
 * after a data change produces a corrected script for free; not regenerating is caught by the gate.
 *
 * THE FRESHNESS STATEMENT IS NOT OPTIONAL
 *
 * Every page carries the month its facts were checked, in a banner that cannot be switched off. A
 * listener has no banner. So the verification month, the confidence level, and — when the content is
 * past review — the fact that it is overdue are spoken aloud, near the top, before any figure the
 * listener might act on. An audio file is the one format where a stale claim reaches someone with
 * nothing on screen to contradict it, and that has to be answered in the audio itself.
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ------------------------------------------------------------------ *
 * Speech shaping
 * ------------------------------------------------------------------ */

/**
 * Text destined for a speech engine, not a screen.
 *
 * Symbols that read fine to the eye are read badly aloud: "79°F" becomes "seventy-nine degree F",
 * "C+" becomes "C", an em dash becomes nothing at all. Everything is expanded here rather than left
 * for the engine to guess, because the failure is silent — the audio simply sounds wrong and nobody
 * finds out until a listener does.
 */
function speak (s) {
  return String(s)
    .replace(/(\d+)\s*°F\b/g, '$1 degrees')
    .replace(/(\d+)\s*°\b/g, '$1 degrees')
    .replace(/\$(\d+)/g, '$1 dollars')
    .replace(/(\d+)"/g, '$1 inches')
    .replace(/\bWDW\b/g, 'Walt Disney World')
    .replace(/\bDLR\b/g, 'Disneyland Resort')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ' to ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // markdown links: keep the words, drop the target
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** "C+" → "C plus". Grades are the one place a bare letter would be read as an initial. */
function grade (g) {
  if (!g) return ''
  const [letter, mark] = [g[0], g.slice(1)]
  return `${letter}${mark === '+' ? ' plus' : mark === '-' ? ' minus' : ''}`
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function monthName (ym) {
  const [y, m] = String(ym).split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/** Whether the content is past its own review date, measured against BUILD_MONTH, never the clock. */
function isOverdue (reviewBy, buildMonth) {
  if (!reviewBy || !buildMonth) return false
  const idx = (ym) => { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1) }
  return idx(buildMonth) > idx(reviewBy)
}

/* ------------------------------------------------------------------ *
 * The script
 * ------------------------------------------------------------------ */

/** First `n` sentences. The page carries the full argument; the brief carries the shape of it. */
function firstSentences (text, n) {
  if (!text) return ''
  const parts = String(text).split(/(?<=[.!?])\s+/)
  return parts.slice(0, n).join(' ')
}

/** A list entry written for a bullet, re-set as its own sentence so it reads aloud. */
function asSentence (s) {
  if (!s) return ''
  let t = String(s).split(/\s+[—–-]\s+/)[0].trim()   // drop the trailing qualifier clause
  t = t.replace(/[.,;:]+$/, '')
  return t + '.'
}

function buildScript (month, site, buildMonth) {
  const lines = []
  const say = (s) => { const t = speak(s); if (t) lines.push(t) }

  const resorts = site.resorts || []
  const fr = month.freshness || {}

  /*
   * Name the parks, not the publication.
   *
   * The brand shortName is the name of this site — saying "the Ride Ready parks" invents an operator
   * that does not exist, and on a site whose whole argument is that it is unaffiliated, implying
   * ownership of the parks is precisely the wrong error. The resorts name themselves.
   */
  const where = resorts.length
    ? resorts.map((r) => r.shortName || r.name).join(' and ')
    : 'the parks'

  /* --- Open. Name the thing, and grade it, in the first ten seconds. --- */
  say(`${month.name} at ${where}. Your month in about three minutes, from ${site.brand.name}.`)
  if (month.verdict) {
    say(`Our grade for ${month.name} is ${grade(month.verdict.grade)}. ${firstSentences(month.verdict.short, 2)}`)
  }

  /* --- Freshness. Spoken, early, before any actionable figure. --- */
  const confidence = {
    confirmed: 'These dates are confirmed by the parks.',
    expected: 'Nothing here is a forecast for a specific date. These are multi-year patterns we plan against, not a promise.',
    historical: 'This describes what happened last cycle, stated as the past. Treat it as a pattern, not a prediction.',
  }[fr.confidence] || ''
  say(`Everything in this brief was checked in ${monthName(fr.verified)}. ${confidence}`)
  if (isOverdue(fr.reviewBy, buildMonth)) {
    say(`One caution first. This brief is past its review date of ${monthName(fr.reviewBy)}, so it is overdue for a recheck. Confirm anything you plan around against the park directly.`)
  }

  /* --- Crowds. Two sentences of shape, then the two dates that matter. --- */
  if (month.crowds) {
    say(`Crowds. ${month.name} runs ${month.crowds.level}. ${firstSentences(month.crowds.shape, 2)}`)
    const peak = (month.crowds.peakWindows || [])[0]
    const quiet = (month.crowds.quietWindows || [])[0]
    if (peak) say(`The stretch to avoid: ${asSentence(peak).replace(/^./, (c) => c.toLowerCase())}`)
    if (quiet) say(`If you have flexibility: ${asSentence(quiet).replace(/^./, (c) => c.toLowerCase())}`)
  }

  /* --- Weather, one resort at a time. --- */
  const weather = month.weather || {}
  const withWeather = resorts.filter((r) => weather[r.slug])
  if (withWeather.length) {
    say('Weather. Climate normals over a thirty-year reference period, not a forecast.')
    for (const r of withWeather) {
      const w = weather[r.slug]
      say(`${r.shortName || r.name}: highs around ${w.highF} degrees, lows around ${w.lowF}, about ${w.rainDays} days with measurable rain. ${firstSentences(String(w.note || '').replace(/^Climate normals for [^.]+\.\s*/, ''), 2)}`)
    }
  }

  /* --- Cost. --- */
  if (month.cost) {
    say(`Cost. ${month.name} sits in the ${month.cost.level} band. ${firstSentences(month.cost.note, 2)}`)
  }

  /* --- The single most useful planning note. --- */
  const note = (month.planningNotes || [])[0]
  if (note) {
    say(`One thing worth knowing. ${asSentence(note.heading)} ${firstSentences((note.body || [])[0], 2)}`)
  }

  /* --- Who it suits, and who it does not. The unflattering half is the point. --- */
  const best = (month.verdict && month.verdict.bestFor) || []
  const worst = (month.verdict && month.verdict.worstFor) || []
  if (best.length) say(`Who ${month.name} suits. ${asSentence(best[0])}`)
  if (worst.length) say(`Who it does not. ${asSentence(worst[0])}`)

  /* --- Close. Point at the page, which is the thing that stays current. --- */
  say(`That is ${month.name}. The full month page has the crowd calendar, the events running, and every figure with the date we checked it. It is on ${site.brand.domain}, under when to go.`)
  say(site.legal.shortDisclaimer)

  return lines.join('\n\n')
}

/* ------------------------------------------------------------------ *
 * Pronunciation
 * ------------------------------------------------------------------ */

/**
 * Proper nouns a speech engine reliably mangles.
 *
 * Not exhaustive and not automatic — this is the list worth loading into a pronunciation dictionary
 * before synthesising anything, because every one of these appears in park content and every one of
 * them comes out wrong by default.
 */
const PRONUNCIATION = [
  ['EPCOT', 'EP-cot — one word, not spelled out'],
  ['Hagrid', 'HAG-rid'],
  ["Hagrid's", 'HAG-rids'],
  ['Ratatouille', 'rat-a-TOO-ee'],
  ['Na\'vi', 'NAH-vee'],
  ['Pandora', 'pan-DOR-a'],
  ['Tiana', 'tee-AH-na'],
  ['Anaheim', 'ANA-hyme'],
  ['Epic Universe', 'normal — but do not let it become "epic, universe"'],
  ['Velocicoaster', 'vel-OSS-i-coaster'],
  ['Gringotts', 'GRING-otts'],
  ['Hogsmeade', 'HOGS-meed'],
  ['Kilimanjaro', 'kil-i-man-JAR-o'],
  ['Soarin\'', 'SOAR-in'],
  ['Incredicoaster', 'in-CRED-i-coaster'],
]

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main () {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const operatorSlug = args[0] || 'disney'
  const only = args[1] || null
  const wantPron = process.argv.includes('--pron')

  const { operatorDir } = await import('../src/lib/data.mjs')
  const { BUILD_MONTH } = await import('../src/lib/staleness.mjs')
  const dataDir = await operatorDir(operatorSlug)
  const site = JSON.parse(await readFile(join(dataDir, 'site.json'), 'utf8'))
  const monthsDir = join(dataDir, 'seasonal', 'months')

  if (!existsSync(monthsDir)) {
    console.error(`\n  No months under ${monthsDir}. Nothing to script.\n`)
    process.exitCode = 1
    return
  }

  const outDir = join(ROOT, 'build', 'audio-scripts', operatorSlug)
  await mkdir(outDir, { recursive: true })

  const files = (await readdir(monthsDir)).filter((f) => f.endsWith('.json')).sort()
  let written = 0
  for (const file of files) {
    const num = file.replace(/\.json$/, '')
    if (only && num !== only.padStart(2, '0')) continue
    const month = JSON.parse(await readFile(join(monthsDir, file), 'utf8'))
    const script = buildScript(month, site, BUILD_MONTH)
    const words = script.split(/\s+/).length
    const path = join(outDir, `${num}-${month.slug}.txt`)
    await writeFile(path, script + '\n', 'utf8')
    console.log(`  ${num} ${month.name.padEnd(10)} ${String(words).padStart(4)} words  ~${Math.round(words / 155 * 60)}s  → ${path.replace(ROOT + '/', '')}`)
    written++
  }

  if (wantPron) {
    const path = join(outDir, 'pronunciation.txt')
    await writeFile(path, PRONUNCIATION.map(([w, p]) => `${w}\t${p}`).join('\n') + '\n', 'utf8')
    console.log(`\n  Pronunciation list → ${path.replace(ROOT + '/', '')}`)
  }

  console.log(`\n  ${written} script${written === 1 ? '' : 's'} generated from verified month data.`)
  console.log('  Every sentence is derived from a field in that data. Do not hand-edit these —')
  console.log('  edit the month JSON and regenerate, or the audio drifts from the page.\n')
}

main().catch((e) => { console.error(e); process.exitCode = 1 })

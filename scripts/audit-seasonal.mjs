/**
 * Post-build audit of dist-seasonal/.
 *
 * Everything scripts/audit.mjs checks on Site 1 — broken links, duplicate titles, malformed JSON-LD,
 * missing disclaimers — plus the three that only matter on a site whose content expires:
 *
 *   1. Every page carrying a dated claim renders a freshness ribbon.
 *   2. Every page past its review date renders the staleness banner, and the banner text cannot have
 *      been suppressed by data.
 *   3. No page emits an `Event` JSON-LD node without a `startDate`, and no stale page emits `offers`.
 *      Structured data is what an answer engine quotes back, so it is the last place an unconfirmed
 *      date or an expired price should be allowed to survive.
 *
 * Run: npm run audit:seasonal   (after npm run build:seasonal)
 */

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist-seasonal')

if (!existsSync(DIST)) {
  console.error('\n  dist-seasonal/ does not exist. Run `npm run build:seasonal` first.\n')
  process.exit(1)
}

const problems = []
const notes = []
const fail = (page, message) => problems.push(`${page}: ${message}`)
const note = (page, message) => notes.push(`${page}: ${message}`)

async function walk (dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path, out)
    else out.push(path)
  }
  return out
}

const files = await walk(DIST)
const htmlFiles = files.filter((f) => f.endsWith('.html'))

/** Every URL this site actually serves, in the form a page would link to it. */
const served = new Set(['/'])
for (const file of htmlFiles) {
  const rel = '/' + relative(DIST, file).replace(/\\/g, '/')
  served.add(rel === '/index.html' ? '/' : rel.replace(/index\.html$/, ''))
}
for (const file of files.filter((f) => !f.endsWith('.html'))) {
  served.add('/' + relative(DIST, file).replace(/\\/g, '/'))
}

const decode = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")

const pick = (html, re) => { const m = html.match(re); return m ? decode(m[1]) : null }

const titles = new Map()
const descriptions = new Map()

let ribbons = 0
let banners = 0
let eventNodes = 0

const SISTER_ORIGIN = 'https://rideready.guide'

/** Site 1's URL set, so a cross-site link cannot rot unnoticed. */
const { loadData } = await import('../src/lib/data.mjs')
const { loadSite1Urls } = await import('../src/lib/seasonal-data.mjs')
const site1Urls = await loadSite1Urls(await loadData())

const DATED_SECTIONS = ['/events/', '/when-to-go/', '/holidays/', '/prices/', '/closures/']

for (const file of htmlFiles) {
  const rel = '/' + relative(DIST, file).replace(/\\/g, '/')
  const url = rel === '/index.html' ? '/' : rel.replace(/index\.html$/, '')
  const html = await readFile(file, 'utf8')

  /* ---------- Head ---------- */

  const title = pick(html, /<title>([^<]*)<\/title>/)
  if (!title) fail(url, 'no <title>')
  else {
    if (title.length > 65) note(url, `title is ${title.length} chars: "${title}"`)
    if (titles.has(title)) fail(url, `duplicate title, also on ${titles.get(title)}`)
    else titles.set(title, url)
  }

  const description = pick(html, /<meta name="description" content="([^"]*)"/)
  if (!description) fail(url, 'no meta description')
  else if (descriptions.has(description)) fail(url, `duplicate meta description, also on ${descriptions.get(description)}`)
  else descriptions.set(description, url)

  if (!/<link rel="canonical"/.test(html)) fail(url, 'no canonical link')
  if (!/data-site="season"/.test(html)) fail(url, 'missing data-site="season" — the seasonal palette will not apply')

  const h1s = (html.match(/<h1[\s>]/g) || []).length
  if (h1s !== 1) fail(url, `${h1s} <h1> elements, expected exactly 1`)

  /* ---------- Legal ---------- */

  if (!/Not affiliated with/i.test(html)) fail(url, 'missing the unaffiliated disclaimer')

  // The FTC disclosure has to sit above the link, not merely somewhere on the page.
  const affiliateAt = html.indexOf('class="affiliate"')
  if (affiliateAt !== -1) {
    const disclosureAt = html.indexOf('affiliate__disclosure')
    const linkAt = html.indexOf('affiliate__body')
    if (disclosureAt === -1) fail(url, 'affiliate block with no disclosure')
    else if (disclosureAt > linkAt) fail(url, 'affiliate disclosure renders below the link')
  }

  /* ---------- JSON-LD ---------- */

  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
    const json = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
    let parsed
    try { parsed = JSON.parse(json) } catch (e) { fail(url, `malformed JSON-LD — ${e.message}`); continue }

    const nodes = parsed['@graph'] || [parsed]
    for (const node of nodes) {
      const types = [].concat(node['@type'] || [])
      if (!types.includes('Event')) continue
      eventNodes++
      // An Event without a startDate is either ignored or filled in with a guess. We would rather
      // publish no node at all — see src/lib/seasonal-schema.mjs.
      if (!node.startDate) fail(url, 'Event JSON-LD with no startDate — it should have fallen back to Article')
      if (node.offers && /Some details on this page are past their review date/.test(html)) {
        fail(url, 'stale page still publishes an offers block')
      }
    }
  }

  /* ---------- The freshness contract ---------- */

  const isDated = DATED_SECTIONS.some((s) => url.startsWith(s)) && url.split('/').length > 3
  const hasRibbon = /class="freshness /.test(html)
  const hasBanner = /Some details on this page are past their review date/.test(html)

  if (isDated && !hasRibbon) fail(url, 'dated page with no freshness ribbon')
  if (hasRibbon) ribbons++
  if (hasBanner) {
    banners++
    // The banner is computed, so a page carrying it must also carry the overdue tone. If these ever
    // disagree, something is rendering the banner from data rather than from the build month.
    if (!/freshness--danger|freshness--stale/.test(html)) {
      fail(url, 'staleness banner without a stale ribbon — the two are computed from the same call and must agree')
    }
  }

  /* ---------- Links ---------- */

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = decode(m[1])
    if (href.startsWith(SISTER_ORIGIN)) {
      const path = href.slice(SISTER_ORIGIN.length) || '/'
      if (!site1Urls.has(path)) fail(url, `cross-site link to ${path} does not exist on Site 1`)
      continue
    }
    if (!href.startsWith('/') || href.startsWith('//')) continue
    // Asset links carry a cache-busting query and in-page links carry a fragment; neither is part
    // of the path that has to exist on disk.
    const [path] = href.split('#')[0].split('?')
    if (!path) continue
    const clean = path.includes('.') ? path : path.endsWith('/') ? path : `${path}/`
    if (!served.has(clean)) fail(url, `broken internal link: ${href}`)
  }

  /* ---------- Placeholders ---------- */

  if (/\bTODO\b|\bTBD\b|Lorem ipsum|undefined<|>NaN</.test(html)) {
    fail(url, 'contains a placeholder, `undefined`, or `NaN` in rendered output')
  }
}

/* ---------- Site-wide ---------- */

for (const required of ['/sitemap.xml', '/robots.txt', '/llms.txt', '/manifest.webmanifest', '/sw.js', '/search-index.json', '/_headers', '/_redirects']) {
  if (!served.has(required)) fail('site', `missing ${required}`)
}

const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8')
// Strip the origin by parsing rather than by regex: a non-greedy match for the first "/" lands on
// the one in "https://", which silently turns every entry into a phantom failure.
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => { try { return new URL(m[1]).pathname } catch { return m[1] } })
for (const url of sitemapUrls) {
  if (!served.has(url)) fail('sitemap.xml', `lists ${url}, which is not built`)
}

// Contract §3: stale pages stay in the index but lose their crawl priority.
const demoted = [...sitemap.matchAll(/<loc>[^<]*?(\/[^<]*)<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/g)]
  .filter(([, , priority]) => priority === '0.3').length
if (banners && !demoted) fail('sitemap.xml', `${banners} page(s) carry a staleness banner but none were demoted in the sitemap`)

/* ---------- Report ---------- */

if (notes.length) {
  console.log(`\n  ${notes.length} note${notes.length === 1 ? '' : 's'}:`)
  for (const n of notes) console.log(`    · ${n}`)
}

if (problems.length) {
  console.error(`\n  ${problems.length} problem${problems.length === 1 ? '' : 's'} across ${htmlFiles.length} pages:`)
  for (const p of problems) console.error(`    ✗ ${p}`)
  console.error('')
  process.exitCode = 1
} else {
  console.log(`
  No problems found.

    ${htmlFiles.length} pages · ${served.size} served URLs
    ${ribbons} freshness ribbons · ${banners} staleness banner${banners === 1 ? '' : 's'} · ${demoted} sitemap demotion${demoted === 1 ? '' : 's'}
    ${eventNodes} Event JSON-LD node${eventNodes === 1 ? '' : 's'}, all with confirmed dates
`)
}

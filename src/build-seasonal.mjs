/**
 * Site 2 build → dist-seasonal/.
 *
 * Mirrors src/build.mjs and shares its lib and templates. Two differences worth knowing about:
 *
 *   1. `assertIntegrity()` runs before anything renders. The loader collects unresolved cross-file
 *      and cross-site references rather than throwing, so the validator can report all of them at
 *      once; the build's job is to make sure none of them reach dist-seasonal/ on the argument that
 *      they were only warnings.
 *   2. The sitemap demotes stale pages instead of dropping them. A page past its review date is
 *      still the best answer we have for its query — but telling a crawler to prioritise it while a
 *      banner on the page says the figures need rechecking would be talking out of both sides.
 */

import { mkdir, writeFile, readFile, readdir, rm, cp, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { performance } from 'node:perf_hooks'

import { loadSeasonal, assertIntegrity, urls, MONTHS, SEASONAL_DIST_DIR } from './lib/seasonal-data.mjs'
import { ROOT, ASSETS_DIR } from './lib/data.mjs'
import { BUILD_MONTH } from './lib/staleness.mjs'
import { plain } from './lib/html.mjs'
import * as core from './seasonal/core.mjs'
import * as events from './seasonal/events.mjs'
import * as months from './seasonal/months.mjs'
import * as reference from './seasonal/reference.mjs'
import * as tools from './seasonal/tools.mjs'
import { legalPages } from './seasonal/legal.mjs'

const started = performance.now()
const DIST = SEASONAL_DIST_DIR
const BUILD_DATE = `${BUILD_MONTH}-01`

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

function outputPath (url) {
  if (url === '/') return join(DIST, 'index.html')
  if (/\.(html|xml|txt|json|webmanifest)$/.test(url)) return join(DIST, url.replace(/^\//, ''))
  return join(DIST, url.replace(/^\//, '').replace(/\/$/, ''), 'index.html')
}

async function writeOut (url, contents) {
  const path = outputPath(url)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents, 'utf8')
}

/* ------------------------------------------------------------------ *
 * Page graph
 * ------------------------------------------------------------------ */

function buildPages (data) {
  const pages = [core.homePage(data), core.calendarPage(data), core.offlinePage(data)]

  if (data.months.length) {
    pages.push(months.whenToGoIndex(data))
    for (const m of MONTHS) {
      const month = data.monthByNumber.get(m.month)
      if (month) pages.push(months.monthPage(month, data))
    }
  }

  if (data.events.length) {
    pages.push(events.eventsIndex(data))
    for (const event of data.events) {
      pages.push(events.eventPage(event, data))
      for (const edition of event.editions) pages.push(events.editionPage(event, edition, data))
    }
  }

  if (data.holidays.length) {
    pages.push(reference.holidaysIndex(data))
    for (const holiday of data.holidays) pages.push(reference.holidayPage(holiday, data))
  }
  if (data.prices.length) {
    pages.push(reference.pricesIndex(data))
    for (const price of data.prices) pages.push(reference.pricePage(price, data))
  }
  if (data.closures.length) {
    pages.push(reference.closuresIndex(data))
    for (const tracker of data.closures) pages.push(reference.closuresPage(tracker, data))
  }

  pages.push(tools.toolsIndex(data))
  pages.push(tools.tripTimingPage(data))
  pages.push(...legalPages(data))

  return pages
}

/* ------------------------------------------------------------------ *
 * Search index
 * ------------------------------------------------------------------ */

function buildSearchIndex (data) {
  const items = []
  const push = (title, url, context, keywords) => {
    items.push({ t: title, u: url, c: context, k: (keywords || '').toLowerCase().slice(0, 110).trim() })
  }

  for (const event of data.events) {
    push(event.name, event.url, `${event.parkInfo ? event.parkInfo.name : 'Seasonal'} · Event`,
      `${event.category} ${event.season} ${plain(event.summary)}`)
    for (const edition of event.editions) {
      push(`${event.shortName || event.name} ${edition.year}`, edition.url, 'Event edition',
        `${edition.status} dates prices ${edition.year}`)
    }
  }
  for (const m of MONTHS) {
    const month = data.monthByNumber.get(m.month)
    if (!month) continue
    push(`Disney parks in ${month.name}`, month.url, 'When to go',
      `${month.name} crowds cost weather grade ${month.verdict.grade} ${plain(month.verdict.short)}`)
  }
  for (const holiday of data.holidays) push(holiday.h1 || holiday.title, holiday.url, 'Holiday', plain(holiday.summary))
  for (const price of data.prices) push(price.h1 || price.title, price.url, 'Prices', plain(price.summary))
  for (const tracker of data.closures) {
    push(`${tracker.resortInfo ? tracker.resortInfo.shortName : tracker.resort} closures`, tracker.url, 'Closures', 'refurbishment closed reopening')
  }

  push('Trip timing', urls.tripTiming(), 'Tool', 'best month when to go rank crowds cost weather')
  push('Seasonal calendar', urls.calendar(), 'Reference', 'calendar year timeline events months')
  push('Editorial policy', urls.editorial(), 'Site', 'confidence confirmed expected historical freshness')

  return { generated: BUILD_DATE, count: items.length, items }
}

/* ------------------------------------------------------------------ *
 * Sitemap / robots / manifest
 * ------------------------------------------------------------------ */

const STALE_URLS = new Set()

function priorityFor (url) {
  // Contract §3: a stale page keeps its place in the index but loses its claim on crawl priority.
  if (STALE_URLS.has(url)) return '0.3'
  if (url === '/') return '1.0'
  if (url === urls.whenToGoIndex() || url === urls.eventsIndex()) return '0.9'
  if (url.startsWith('/when-to-go/') || url.startsWith('/prices/')) return '0.9'
  if (url.startsWith('/events/') && url.split('/').length === 4) return '0.8'
  if (url === urls.calendar() || url === urls.tripTiming()) return '0.8'
  if (url.startsWith('/holidays/') || url.startsWith('/closures/')) return '0.7'
  return '0.5'
}

function buildSitemap (site, pages) {
  const entries = pages
    .filter((p) => !p.noindex && p.url !== '/offline/' && !/\.(html|xml|txt|json)$/.test(p.url))
    .map((p) => `  <url>
    <loc>${site.brand.origin}${p.url}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${p.url === '/' || p.url === urls.calendar() ? 'weekly' : 'monthly'}</changefreq>
    <priority>${priorityFor(p.url)}</priority>
  </url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
}

function buildRobots (site) {
  return `# ${site.brand.name}
User-agent: *
Allow: /
Disallow: /offline/

Sitemap: ${site.brand.origin}/sitemap.xml

# Evergreen sister site: ${site.brand.sisterSite.origin}
# Plain-text site index for answer engines: ${site.brand.origin}/llms.txt
`
}

function buildManifest (site) {
  return JSON.stringify({
    name: site.brand.name,
    short_name: site.brand.shortName,
    description: site.brand.tagline,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf8f4',
    theme_color: site.brand.themeColor,
    orientation: 'portrait-primary',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/img/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Trip timing', url: urls.tripTiming() },
      { name: 'Calendar', url: urls.calendar() },
    ],
  }, null, 2)
}

/**
 * /llms.txt — the plain-text index for answer engines.
 *
 * Site 1's version argues the site is worth citing. This one has a second job: state the confidence
 * model up front, so a machine reader that lifts a date from here also lifts whether anyone has
 * announced it. An answer engine repeating an unannounced date as fact is the specific harm this
 * site is built to avoid, and it will not read the ribbon.
 */
function buildLlmsTxt (site, data) {
  const abs = (p) => `${site.brand.origin}${p}`
  const L = []
  L.push(`# ${site.brand.name}`)
  L.push('')
  L.push(`> ${site.brand.tagline}`)
  L.push('')
  L.push(site.legal.shortDisclaimer)
  L.push('')
  L.push('## How to read anything on this site')
  L.push('')
  L.push('Every dated claim carries one of three confidence levels. **Do not restate a figure without its level.**')
  L.push('')
  L.push('- **confirmed** — officially announced by the operator. Exact dates and prices are quotable.')
  L.push('- **expected** — not announced; the pattern has held for at least three years. Windows and ranges only. There is no exact date to quote, and inventing one from the window is the specific error this label exists to prevent.')
  L.push('- **historical** — the last confirmed cycle, labelled with its year. Quote it with the year attached or not at all.')
  L.push('')
  L.push(`Every price on this site is a range with an as-of cycle, never a fixed figure. Data was verified in ${MONTHS[Number(BUILD_MONTH.slice(5, 7)) - 1].name} ${BUILD_MONTH.slice(0, 4)}; pages past their review date carry a visible staleness banner.`)
  L.push('')
  L.push(`Permanent facts — height requirements, ride mechanics, accessibility, park maps — are not on this site. They live on ${site.brand.sisterSite.name}: ${site.brand.sisterSite.origin}`)
  L.push('')

  L.push('## Events')
  L.push('')
  for (const event of data.events) {
    L.push(`- [${event.name}](${abs(event.url)}) — ${event.parkInfo ? event.parkInfo.name : event.resort}, ${event.category}. Confidence: ${event.staleness.confidence}. ${plain(event.summary)}`)
    if (event.typicalWindow) {
      L.push(`  - Typical window: ${event.typicalWindow.startsAround} to ${event.typicalWindow.endsAround}${event.typicalWindow.nightsTypical ? `, around ${event.typicalWindow.nightsTypical} nights` : ''}`)
    }
    if (event.pricing && Array.isArray(event.pricing.rangeUsd)) {
      L.push(`  - Price range: $${event.pricing.rangeUsd[0]}–$${event.pricing.rangeUsd[1]} ${event.pricing.model}, as of ${event.pricing.asOf}`)
    }
  }
  L.push('')

  L.push('## When to go')
  L.push('')
  for (const m of MONTHS) {
    const month = data.monthByNumber.get(m.month)
    if (!month) continue
    L.push(`- [${month.name}](${abs(month.url)}) — grade ${month.verdict.grade}. ${plain(month.verdict.short)}`)
  }
  L.push('')

  if (data.prices.length) {
    L.push('## Prices')
    L.push('')
    for (const price of data.prices) {
      L.push(`- [${price.h1 || price.title}](${abs(price.url)}) — confidence: ${price.staleness.confidence}. ${plain(price.summary)}`)
    }
    L.push('')
  }

  L.push('## About')
  L.push('')
  L.push(`- [Editorial policy](${abs(urls.editorial())}) — the confidence model in full, and why we will not publish unannounced dates`)
  L.push(`- [About](${abs(urls.about())}) · [Affiliate disclosure](${abs(urls.affiliate())}) · [Privacy](${abs(urls.privacy())}) · [Terms](${abs(urls.terms())})`)
  L.push('')
  return L.join('\n')
}

/* ------------------------------------------------------------------ *
 * Host configuration
 *
 * Cloudflare Pages format only, and deliberately so: the repository root already carries a
 * vercel.json pinning Site 1's build command and output directory, and Vercel reads exactly one of
 * those per repository. Two sites out of one repo is a clean two-project setup on Pages and a
 * fight on Vercel — see docs/LAUNCH-SEASONAL.md.
 * ------------------------------------------------------------------ */

const CACHE_RULES = [
  { path: '/assets/*', value: 'public, max-age=31536000, immutable' },
  { path: '/sw.js', value: 'public, max-age=0, must-revalidate' },
  { path: '/search-index.json', value: 'public, max-age=3600' },
]

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
}

/** Convenience paths people will type or that earlier drafts of the IA implied. */
const EXACT_REDIRECTS = [
  ['/best-time-to-visit/', '/when-to-go/'],
  ['/crowd-calendar/', '/when-to-go/'],
  ['/trip-timing/', '/tools/trip-timing/'],
  ['/refurbishments/', '/closures/'],
  ['/lightning-lane-price/', '/prices/lightning-lane/'],
]

function buildHeaders () {
  const cache = CACHE_RULES.map((r) => `${r.path}\n  Cache-Control: ${r.value}\n`).join('\n')
  const security = Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`).join('\n')
  return `${cache}\n/*\n${security}\n`
}

function buildRedirects (data) {
  const exact = EXACT_REDIRECTS.map(([from, to]) => `${from}  ${to}  301`).join('\n')
  // Month pages are the most-linked thing on the site and "/january/" is what people type.
  const monthShortcuts = MONTHS
    .filter((m) => data.monthBySlug.has(m.slug))
    .map((m) => `/${m.slug}/  ${urls.month(m.slug)}  301`)
    .join('\n')
  return `# Convenience paths\n${exact}\n\n# Bare month paths\n${monthShortcuts}\n`
}

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#4a1d3f"/>
  <path d="M17 44V20h9.6c5.9 0 9.5 3 9.5 8.1 0 5.1-3.6 8.2-9.5 8.2h-3.8V44H17Zm5.8-12.4h3c2.7 0 4.2-1.3 4.2-3.5s-1.5-3.5-4.2-3.5h-3v7Z" fill="#e9b264"/>
  <path d="M39 44.4c-3.7 0-6.4-1.9-6.9-5.3l5.4-.9c.2 1.4 1 2.1 2.2 2.1 1 0 1.7-.5 1.7-1.3 0-1-.9-1.4-3.2-2-3.7-1-5.6-2.6-5.6-5.6 0-3.6 2.9-6 7-6 3.7 0 6.2 1.8 6.8 5l-5.2.9c-.2-1.2-.8-1.8-1.8-1.8-.9 0-1.5.5-1.5 1.2 0 .9.8 1.3 3 1.9 3.8 1 5.8 2.5 5.8 5.7 0 3.7-3 6.1-7.7 6.1Z" fill="#faf8f4" opacity=".92"/>
</svg>
`

async function copyAssets () {
  await cp(ASSETS_DIR, join(DIST, 'assets'), { recursive: true })
  await rm(join(DIST, 'assets', 'sw.js'), { force: true })
  // Site 1's map plates and its tool scripts are dead weight here.
  await rm(join(DIST, 'assets', 'img', 'maps'), { recursive: true, force: true })
  await rm(join(DIST, 'assets', 'js', 'food-tracker.js'), { force: true })
  await rm(join(DIST, 'assets', 'js', 'height-checker.js'), { force: true })
  await rm(join(DIST, 'assets', 'js', 'map.js'), { force: true })
  await writeFile(join(DIST, 'assets', 'img', 'favicon.svg'), FAVICON, 'utf8')
}

async function buildServiceWorker (data, pages) {
  const template = await readFile(join(ASSETS_DIR, 'sw.js'), 'utf8')
  const precache = [
    '/',
    '/offline/',
    urls.calendar(),
    urls.whenToGoIndex(),
    urls.tripTiming(),
    urls.eventsIndex(),
    '/assets/css/main.css?v=1',
    '/assets/css/print.css?v=1',
    '/assets/js/app.js?v=1',
    '/assets/js/trip-timing.js?v=1',
    '/manifest.webmanifest',
  ].filter((url) => url === '/offline/' || url.startsWith('/assets') || url === '/manifest.webmanifest' ||
    pages.some((p) => p.url === url) || url === '/')

  const output = template
    .replace('__VERSION__', `${BUILD_MONTH}-${pages.length}`)
    .replace('__PRECACHE__', JSON.stringify([...new Set(precache)]))
  await writeFile(join(DIST, 'sw.js'), output, 'utf8')
  return precache.length
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main () {
  const data = await loadSeasonal()

  if (!data.events.length && !data.months.length) {
    console.error('\n  No seasonal data found under data/seasonal/. Nothing to build.\n')
    process.exitCode = 1
    return
  }

  // Collected during load so the validator can report every break in one pass; the build refuses to
  // ship any of them.
  assertIntegrity(data)

  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })

  const pages = buildPages(data)

  for (const entity of [...data.events, ...data.months, ...data.holidays, ...data.prices, ...data.closures]) {
    if (entity.staleness.state === 'stale') STALE_URLS.add(entity.url)
  }

  const seen = new Set()
  for (const page of pages) {
    if (seen.has(page.url)) throw new Error(`Duplicate output URL: ${page.url}`)
    seen.add(page.url)
    await writeOut(page.url, page.html)
  }

  await copyAssets()
  await writeFile(join(DIST, 'sitemap.xml'), buildSitemap(data.site, pages), 'utf8')
  await writeFile(join(DIST, 'robots.txt'), buildRobots(data.site), 'utf8')
  await writeFile(join(DIST, 'llms.txt'), buildLlmsTxt(data.site, data), 'utf8')
  await writeFile(join(DIST, 'manifest.webmanifest'), buildManifest(data.site), 'utf8')
  await writeFile(join(DIST, '_headers'), buildHeaders(), 'utf8')
  await writeFile(join(DIST, '_redirects'), buildRedirects(data), 'utf8')

  const searchIndex = buildSearchIndex(data)
  await writeFile(join(DIST, 'search-index.json'), JSON.stringify(searchIndex), 'utf8')

  const precacheCount = await buildServiceWorker(data, pages)

  let bytes = 0
  async function measure (dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await measure(path)
      else bytes += (await stat(path)).size
    }
  }
  await measure(DIST)

  const byConfidence = { confirmed: 0, expected: 0, historical: 0, unknown: 0 }
  const dated = [...data.events, ...data.months, ...data.holidays, ...data.prices, ...data.closures]
  for (const entity of dated) byConfidence[entity.staleness.confidence] = (byConfidence[entity.staleness.confidence] || 0) + 1

  const editions = data.events.reduce((n, e) => n + e.editions.length, 0)
  const ms = Math.round(performance.now() - started)

  console.log(`
  Built ${pages.length} pages in ${ms}ms  ·  ${(bytes / 1024 / 1024).toFixed(2)} MB in dist-seasonal/

    ${data.events.length} events (${editions} year editions) · ${data.months.length} month pages
    ${data.holidays.length} holiday hubs · ${data.prices.length} price pages · ${data.closures.length} closure trackers
    confidence: ${byConfidence.confirmed} confirmed, ${byConfidence.expected} expected, ${byConfidence.historical} historical${byConfidence.unknown ? `, ${byConfidence.unknown} unverified` : ''}
    ${STALE_URLS.size} page${STALE_URLS.size === 1 ? '' : 's'} past review, demoted in the sitemap
    ${searchIndex.count} search index entries · ${precacheCount} precached URLs
`)
}

main().catch((err) => {
  console.error('\nSeasonal build failed:\n', err.message || err)
  process.exitCode = 1
})

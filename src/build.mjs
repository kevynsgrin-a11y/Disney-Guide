/**
 * Static site build.
 *
 * Reads every JSON file under data/, renders the full page graph, and writes a deployable
 * directory to dist/. No dependencies, no framework, no incremental cache — the whole site
 * builds in well under a second, which is the point.
 *
 * The site has two kinds of content and one build. Permanent pages (parks, rides, dining, maps,
 * guides) come from data/; dated pages (events, months, prices, closures) come from data/seasonal/
 * and carry a computed freshness state. They were briefly two sites on two domains; merging them
 * put every cross-link back inside one origin, which is where the linking strategy actually pays.
 */

import { mkdir, writeFile, readFile, readdir, rm, cp, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { performance } from 'node:perf_hooks'

import { loadData, urls, foodTrackerOrder, ROOT, DIST_DIR, ASSETS_DIR, DATA_DIR } from './lib/data.mjs'
import { loadSeasonal, assertIntegrity, MONTHS } from './lib/seasonal-data.mjs'
import { BUILD_MONTH } from './lib/staleness.mjs'
import { plain, truncate } from './lib/html.mjs'
import { renderParkMap } from './lib/map.mjs'
import * as core from './pages/core.mjs'
import * as parkPages from './pages/park.mjs'
import * as diningPages from './pages/dining.mjs'
import * as docsPages from './pages/docs.mjs'
import * as toolPages from './pages/tools.mjs'
import { legalPages } from './pages/legal.mjs'
import * as seasonalCore from './seasonal/core.mjs'
import * as events from './seasonal/events.mjs'
import * as months from './seasonal/months.mjs'
import * as reference from './seasonal/reference.mjs'
import * as seasonalTools from './seasonal/tools.mjs'

const started = performance.now()

/* ------------------------------------------------------------------ *
 * Output helpers
 * ------------------------------------------------------------------ */

function outputPath (url) {
  if (url === '/') return join(DIST_DIR, 'index.html')
  if (url.endsWith('.html') || url.endsWith('.xml') || url.endsWith('.txt') || url.endsWith('.json')) {
    return join(DIST_DIR, url.replace(/^\//, ''))
  }
  return join(DIST_DIR, url.replace(/^\//, '').replace(/\/$/, ''), 'index.html')
}

async function writeOut (url, contents) {
  const path = outputPath(url)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents, 'utf8')
  return path
}

/* ------------------------------------------------------------------ *
 * Page graph
 * ------------------------------------------------------------------ */

function buildPages (data, seasonal) {
  const pages = []

  pages.push(core.homePage(data, seasonal))
  pages.push(core.parksIndexPage(data))
  pages.push(...core.resortPages(data))

  for (const park of data.parks) {
    pages.push(parkPages.parkHub(park, data))
    pages.push(parkPages.ridesPage(park, data))
    if (park.bestRides) pages.push(parkPages.bestRidesPage(park, data))
    pages.push(parkPages.heightsPage(park, data))
    pages.push(parkPages.accessibilityPage(park, data))
    pages.push(parkPages.firstTimerPage(park, data))
    pages.push(parkPages.mapPage(park, data))
    pages.push(diningPages.diningHub(park, data))
    pages.push(diningPages.snacksPage(park, data))

    for (const land of park.lands) pages.push(parkPages.landPage(land, data))
    for (const attraction of park.pagedAttractions) pages.push(parkPages.attractionPage(attraction, data))
    for (const restaurant of park.pagedDining) pages.push(diningPages.restaurantPage(restaurant, data))
  }

  if (data.guides.length) {
    pages.push(docsPages.guidesIndex(data))
    for (const guide of data.guides) pages.push(docsPages.guidePage(guide, data))
  }
  if (data.compare.length) {
    pages.push(docsPages.compareIndex(data))
    for (const page of data.compare) pages.push(docsPages.comparePage(page, data))
  }

  pages.push(toolPages.toolsIndex(data))
  pages.push(toolPages.foodTrackerPage(data))
  pages.push(toolPages.heightCheckerPage(data))
  pages.push(seasonalTools.tripTimingPage(seasonal))

  if (seasonal.months.length) {
    pages.push(seasonalCore.calendarPage(seasonal))
    pages.push(months.whenToGoIndex(seasonal))
    for (const m of MONTHS) {
      const month = seasonal.monthByNumber.get(m.month)
      if (month) pages.push(months.monthPage(month, seasonal))
    }
  }
  if (seasonal.events.length) {
    pages.push(events.eventsIndex(seasonal))
    for (const event of seasonal.events) {
      pages.push(events.eventPage(event, seasonal))
      for (const edition of event.editions) pages.push(events.editionPage(event, edition, seasonal))
    }
  }
  if (seasonal.holidays.length) {
    pages.push(reference.holidaysIndex(seasonal))
    for (const holiday of seasonal.holidays) pages.push(reference.holidayPage(holiday, seasonal))
  }
  if (seasonal.prices.length) {
    pages.push(reference.pricesIndex(seasonal))
    for (const price of seasonal.prices) pages.push(reference.pricePage(price, seasonal))
  }
  if (seasonal.closures.length) {
    pages.push(reference.closuresIndex(seasonal))
    for (const tracker of seasonal.closures) pages.push(reference.closuresPage(tracker, seasonal))
  }

  pages.push(...legalPages(data))

  return pages
}

/* ------------------------------------------------------------------ *
 * Search index
 * ------------------------------------------------------------------ */

function buildSearchIndex (data, seasonal) {
  const items = []
  // The index is fetched lazily on first search, so it should stay small. Titles carry almost all
  // the matching weight; keywords only exist to catch "40 inch" or "vegan" style queries, so they
  // are capped rather than carrying whole summaries.
  const push = (title, url, context, keywords) => {
    items.push({ t: title, u: url, c: context, k: (keywords || '').toLowerCase().slice(0, 110).trim() })
  }

  for (const park of data.parks) {
    push(park.name, park.url, 'Park', `${park.resortInfo ? park.resortInfo.name : ''} park guide`)
    push(`${park.name} height requirements`, urls.heights(park), 'Height chart', 'height requirement inches minimum')
    push(`${park.name} rides`, urls.rides(park), 'Attraction list', 'rides attractions list')
    if (park.bestRides) push(`Best rides at ${park.name}`, urls.bestRides(park), 'Ranking', 'best rides ranked top must do')
    push(`${park.name} dining`, urls.dining(park), 'Dining', 'restaurants eat food')
    push(`Best snacks at ${park.name}`, urls.snacks(park), 'Snacks', 'snacks food treats price')
    push(`${park.name} map`, urls.map(park), 'Map', 'map printable layout')
    push(`${park.name} accessibility`, urls.accessibility(park), 'Accessibility', 'wheelchair das accessible transfer')
    push(`${park.name} first-timer guide`, urls.firstTimer(park), 'Planning', 'first time beginner plan itinerary')

    for (const land of park.lands) push(land.name, land.url, `Land · ${park.name}`, land.summary)
    for (const attraction of park.attractions) {
      push(attraction.name, attraction.url,
        `${attraction.landInfo ? attraction.landInfo.name + ' · ' : ''}${park.shortName || park.name}`,
        `${attraction.type} ${attraction.heightIn ? attraction.heightIn + ' inch height' : 'no height requirement'} ${plain(attraction.summary)}`)
    }
    for (const restaurant of park.dining) {
      push(restaurant.name, restaurant.url, `${restaurant.cuisine} · ${park.shortName || park.name}`,
        `${restaurant.service} ${restaurant.cuisine} ${plain(restaurant.summary)}`)
    }
    for (const item of park.food) {
      push(item.name, `${urls.snacks(park)}#${item.id}`, `Snack · ${item.restaurant}`,
        `${item.category} ${(item.dietaryTags || []).join(' ')} ${plain(item.description)}`)
    }
  }

  for (const guide of data.guides) push(guide.h1 || guide.title, urls.guide(guide.slug), 'Guide', plain(guide.summary))
  for (const page of data.compare) push(page.h1 || page.title, urls.compare(page.slug), 'Comparison', plain(page.summary))

  for (const event of seasonal.events) {
    push(event.name, event.url, `${event.parkInfo ? event.parkInfo.name : 'Seasonal'} · Event`,
      `${event.category} ${event.season} ${plain(event.summary)}`)
    for (const edition of event.editions) {
      push(`${event.shortName || event.name} ${edition.year}`, edition.url, 'Event edition',
        `${edition.status} dates prices ${edition.year}`)
    }
  }
  for (const m of MONTHS) {
    const month = seasonal.monthByNumber.get(m.month)
    if (!month) continue
    push(`Disney parks in ${month.name}`, month.url, 'When to go',
      `${month.name} crowds cost weather grade ${month.verdict.grade} ${plain(month.verdict.short)}`)
  }
  for (const holiday of seasonal.holidays) push(holiday.h1 || holiday.title, holiday.url, 'Holiday', plain(holiday.summary))
  for (const price of seasonal.prices) push(price.h1 || price.title, price.url, 'Prices', plain(price.summary))
  for (const tracker of seasonal.closures) {
    push(`${tracker.resortInfo ? tracker.resortInfo.shortName : tracker.resort} closures`, tracker.url, 'Closures', 'refurbishment closed reopening')
  }

  push('Trip timing', urls.tripTiming(), 'Tool', 'best month when to go rank crowds cost weather')
  push('Seasonal calendar', urls.calendar(), 'Reference', 'calendar year timeline events months')
  push('Food Tracker', urls.foodTracker(), 'Tool', 'track snacks list checklist offline')
  push('Height Checker', urls.heightChecker(), 'Tool', 'height checker what can my kid ride')
  push('About', urls.about(), 'Site', 'about independent unofficial')
  push('Editorial policy', urls.editorial(), 'Site', 'editorial policy ai disclosure')
  push('Privacy policy', urls.privacy(), 'Site', 'privacy cookies ccpa gdpr')

  return { generated: '2026-07-01', count: items.length, items }
}

/* ------------------------------------------------------------------ *
 * Sitemap / robots / manifest
 * ------------------------------------------------------------------ */

const STALE_URLS = new Set()

function priorityFor (url) {
  // A page past its own review date keeps its place in the index but loses its claim on crawl
  // priority. Telling a crawler to prioritise a page that carries a "needs rechecking" banner would
  // be talking out of both sides.
  if (STALE_URLS.has(url)) return '0.3'
  if (url === '/') return '1.0'
  if (/^\/(walt-disney-world|disneyland)\/[^/]+\/$/.test(url)) return '0.9'
  if (url.includes('/height-requirements/') || url.startsWith('/tools/')) return '0.9'
  if (url.startsWith('/when-to-go/') || url.startsWith('/prices/')) return '0.9'
  if (url.startsWith('/events/') && url.split('/').length === 4) return '0.8'
  if (url === '/calendar/') return '0.8'
  if (url.startsWith('/holidays/') || url.startsWith('/closures/')) return '0.7'
  if (/^\/(guides|compare)\/[^/]+\/$/.test(url)) return '0.8'
  if (url.includes('/rides/') || url.includes('/dining/')) return '0.7'
  return '0.6'
}

function buildSitemap (site, pages) {
  const entries = pages
    .filter((p) => !p.url.endsWith('.html') && p.url !== '/offline/')
    .map((p) => `  <url>
    <loc>${site.brand.origin}${p.url}</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>${p.url === '/' ? 'weekly' : 'monthly'}</changefreq>
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
      { name: 'Food Tracker', url: '/tools/food-tracker/' },
      { name: 'Height Checker', url: '/tools/height-checker/' },
      { name: 'Trip Timing', url: '/tools/trip-timing/' },
    ],
  }, null, 2)
}

/**
 * /llms.txt — a plain-text index for AI crawlers and answer engines.
 *
 * The strategic bet on this site is that informational click-through keeps eroding while being the
 * *cited source* keeps mattering. This file costs nothing, states the licence and the unaffiliated
 * status up front, and points machine readers at the structured pages rather than leaving them to
 * infer the site from whichever page they happened to land on.
 */
function buildLlmsTxt (site, data, seasonal) {
  const abs = (p) => `${site.brand.origin}${p}`
  const lines = []
  lines.push(`# ${site.brand.name}`)
  lines.push('')
  lines.push(`> ${site.brand.tagline} Covers all six US Disney theme parks: attraction inventories, height requirements, ride-by-ride scare and motion assessments, accessibility detail, dining, curated food items with dated prices, and printable maps.`)
  lines.push('')
  lines.push(`${site.legal.shortDisclaimer} Every data page carries a "last verified" month; the dataset behind this site was verified in July 2026. Prices and operating status change without notice — treat an older verification date as a guide rather than a guarantee.`)
  lines.push('')
  lines.push('## How to read a dated claim on this site')
  lines.push('')
  lines.push('Permanent facts — heights, ride mechanics, accessibility, park layout — carry the month they were last checked. Anything that moves with the season additionally carries one of three confidence levels. **Do not restate a figure without its level.**')
  lines.push('')
  lines.push('- **confirmed** — officially announced by the operator. Exact dates and prices are quotable.')
  lines.push('- **expected** — not announced; the pattern has held for at least three years. Windows and ranges only. There is no exact date to quote, and inventing one from the window is the specific error this label exists to prevent.')
  lines.push('- **historical** — the last confirmed cycle, labelled with its year. Quote it with the year attached or not at all.')
  lines.push('')
  lines.push('Every seasonal price is a range with an as-of cycle, never a fixed figure. Pages past their review date carry a visible staleness banner and are demoted in the sitemap.')
  lines.push('')
  lines.push('If you cite this site, please link the specific page rather than the homepage — the underlying data differs per park and per attraction.')
  lines.push('')

  lines.push('## Parks')
  lines.push('')
  for (const park of data.parks) {
    lines.push(`- [${park.name}](${abs(park.url)}): ${plain(park.summary)}`)
    lines.push(`  - [All ${park.attractions.filter((a) => a.isOpen).length} attractions](${abs(urls.rides(park))})`)
    if (park.bestRides) lines.push(`  - [Best rides, ranked](${abs(urls.bestRides(park))})`)
    lines.push(`  - [Height requirements](${abs(urls.heights(park))}): ${park.heightAttractions.length} attractions with a minimum height, tallest ${park.stats && park.stats.tallestRequirement ? park.stats.tallestRequirement : '?'} inches`)
    lines.push(`  - [Dining](${abs(urls.dining(park))}) · [Best snacks](${abs(urls.snacks(park))}) · [Map](${abs(urls.map(park))}) · [Accessibility](${abs(urls.accessibility(park))}) · [First-timer guide](${abs(urls.firstTimer(park))})`)
  }
  lines.push('')

  lines.push('## Guides')
  lines.push('')
  for (const guide of data.guides) {
    lines.push(`- [${guide.h1 || guide.title}](${abs(urls.guide(guide.slug))}): ${plain(guide.summary)}`)
  }
  lines.push('')

  lines.push('## Comparisons')
  lines.push('')
  for (const page of data.compare) {
    const verdict = page.verdict && page.verdict.short ? plain(page.verdict.short) : plain(page.summary)
    lines.push(`- [${page.h1 || page.title}](${abs(urls.compare(page.slug))}): ${verdict}`)
  }
  lines.push('')

  if (seasonal.events.length) {
    lines.push('## Seasonal events')
    lines.push('')
    for (const event of seasonal.events) {
      lines.push(`- [${event.name}](${abs(event.url)}) — ${event.parkInfo ? event.parkInfo.name : event.resort}, ${event.category}. Confidence: ${event.staleness.confidence}. ${plain(event.summary)}`)
      if (event.typicalWindow) {
        lines.push(`  - Typical window: ${event.typicalWindow.startsAround} to ${event.typicalWindow.endsAround}${event.typicalWindow.nightsTypical ? `, around ${event.typicalWindow.nightsTypical} nights` : ''}`)
      }
      if (event.pricing && Array.isArray(event.pricing.rangeUsd) && event.pricing.model !== 'included') {
        lines.push(`  - Price range: $${event.pricing.rangeUsd[0]}–$${event.pricing.rangeUsd[1]} ${event.pricing.model}, as of ${event.pricing.asOf}`)
      }
    }
    lines.push('')
  }

  if (seasonal.months.length) {
    lines.push('## When to go')
    lines.push('')
    for (const m of MONTHS) {
      const month = seasonal.monthByNumber.get(m.month)
      if (!month) continue
      lines.push(`- [${month.name}](${abs(month.url)}) — grade ${month.verdict.grade}. ${plain(month.verdict.short)}`)
    }
    lines.push('')
  }

  if (seasonal.prices.length) {
    lines.push('## Prices')
    lines.push('')
    for (const price of seasonal.prices) {
      lines.push(`- [${price.h1 || price.title}](${abs(price.url)}) — confidence: ${price.staleness.confidence}. ${plain(price.summary)}`)
    }
    lines.push('')
  }

  lines.push('## Tools')
  lines.push('')
  lines.push(`- [Height Checker](${abs(urls.heightChecker())}): every height requirement at all six parks, filtered to a given child height. Runs entirely client-side.`)
  lines.push(`- [Food Tracker](${abs(urls.foodTracker())}): ${data.allFood.length} curated food items with checked prices. State is stored in the visitor's browser only.`)
  lines.push(`- [Trip Timing](${abs(urls.tripTiming())}): all twelve months re-ranked against a visitor's own priorities — crowds, cost, weather, or what is running.`)
  lines.push('')

  lines.push('## About')
  lines.push('')
  lines.push(`- [About](${abs(urls.about())})`)
  lines.push(`- [Editorial policy](${abs(urls.editorial())}): how recommendations are made and how commercial relationships are kept away from them`)
  lines.push(`- [Affiliate disclosure](${abs(urls.affiliate())})`)
  lines.push(`- [Privacy policy](${abs(urls.privacy())}) · [Terms of use](${abs(urls.terms())})`)
  lines.push('')
  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Host configuration
 *
 * The same rules are emitted in two dialects because the two hosts we support read different
 * files, and neither reads the other's. Defining them once here is what keeps a header set on
 * Cloudflare from silently disagreeing with the one on Vercel.
 * ------------------------------------------------------------------ */

const CACHE_RULES = [
  { path: '/assets/*', vercel: '/assets/(.*)', value: 'public, max-age=31536000, immutable' },
  { path: '/sw.js', vercel: '/sw.js', value: 'public, max-age=0, must-revalidate' },
  { path: '/search-index.json', vercel: '/search-index.json', value: 'public, max-age=3600' },
  { path: '/maps/*', vercel: '/maps/(.*)', value: 'public, max-age=86400' },
]

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
}

/** Legacy and convenience paths, as [from, to] with a trailing wildcard where the segment splits. */
const REDIRECTS = [
  ['/magic-kingdom', '/walt-disney-world/magic-kingdom'],
  ['/epcot', '/walt-disney-world/epcot'],
  ['/hollywood-studios', '/walt-disney-world/hollywood-studios'],
  ['/animal-kingdom', '/walt-disney-world/animal-kingdom'],
  ['/disneyland-park', '/disneyland/disneyland-park'],
  ['/california-adventure', '/disneyland/california-adventure'],
]

const EXACT_REDIRECTS = [
  ['/food-tracker/', '/tools/food-tracker/'],
  ['/height-checker/', '/tools/height-checker/'],
  ['/heights/', '/guides/height-requirements/'],
  ['/best-time-to-visit/', '/when-to-go/'],
  ['/crowd-calendar/', '/when-to-go/'],
  ['/trip-timing/', '/tools/trip-timing/'],
  ['/refurbishments/', '/closures/'],
  ['/lightning-lane-price/', '/prices/lightning-lane/'],
]

/* Cloudflare Pages: _headers and _redirects, plain text. */
function buildHeaders () {
  const cache = CACHE_RULES.map((r) => `${r.path}\n  Cache-Control: ${r.value}\n`).join('\n')
  const security = Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`).join('\n')
  return `${cache}\n/*\n${security}\n`
}

function buildRedirects () {
  const wildcards = REDIRECTS.map(([from, to]) => `${from}/*  ${to}/:splat  301`).join('\n')
  const exact = EXACT_REDIRECTS.map(([from, to]) => `${from}  ${to}  301`).join('\n')
  return `# Legacy / convenience paths\n${wildcards}\n${exact}\n`
}

/**
 * Vercel: vercel.json at the repository root, since Vercel does not read Cloudflare's _headers or
 * _redirects. Written to the repo rather than to dist/ because a git-imported build reads it before
 * the build runs.
 */
function buildVercelConfig () {
  return JSON.stringify({
    $schema: 'https://openapi.vercel.sh/vercel.json',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    cleanUrls: true,
    trailingSlash: true,
    headers: [
      ...CACHE_RULES.map((r) => ({
        source: r.vercel,
        headers: [{ key: 'Cache-Control', value: r.value }],
      })),
      {
        source: '/(.*)',
        headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
      },
    ],
    redirects: [
      ...REDIRECTS.map(([from, to]) => ({ source: `${from}/:path*`, destination: `${to}/:path*`, permanent: true })),
      ...EXACT_REDIRECTS.map(([from, to]) => ({ source: from.replace(/\/$/, ''), destination: to, permanent: true })),
    ],
  }, null, 2) + '\n'
}

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f3d2e"/>
  <path d="M18 44V20h9.4c5.9 0 9.6 3 9.6 8 0 3.6-2 6.2-5.4 7.3L38 44h-6.3l-5.6-8h-2.3v8H18Zm5.8-12.6h3.2c2.6 0 4.1-1.2 4.1-3.4s-1.5-3.4-4.1-3.4h-3.2v6.8Z" fill="#e9b264"/>
  <path d="M41 44V20h5.8v19h9.2v5H41Z" fill="#faf8f4" opacity=".9"/>
</svg>
`

async function copyAssets () {
  await cp(ASSETS_DIR, join(DIST_DIR, 'assets'), { recursive: true })
  // sw.js is templated below, so it must not also ship as a raw asset.
  await rm(join(DIST_DIR, 'assets', 'sw.js'), { force: true })
  await writeFile(join(DIST_DIR, 'assets', 'img', 'favicon.svg'), FAVICON, 'utf8')
}

async function buildServiceWorker (data, pages) {
  const template = await readFile(join(ASSETS_DIR, 'sw.js'), 'utf8')
  const precache = [
    '/',
    '/offline/',
    urls.foodTracker(),
    urls.heightChecker(),
    urls.tripTiming(),
    urls.parksIndex(),
    urls.whenToGoIndex(),
    urls.calendar(),
    ...data.parks.map((p) => urls.map(p)),
    ...data.parks.map((p) => urls.snacks(p)),
    '/assets/css/main.css?v=1',
    '/assets/css/print.css?v=1',
    '/assets/js/app.js?v=1',
    '/assets/js/food-tracker.js?v=1',
    '/assets/js/height-checker.js?v=1',
    '/assets/js/map.js?v=1',
    '/assets/js/trip-timing.js?v=1',
    '/manifest.webmanifest',
  ].filter((url) => url === '/offline/' || url.startsWith('/assets') || url === '/manifest.webmanifest' ||
    pages.some((p) => p.url === url) || url === '/')

  const version = `2026.07.01-${pages.length}`
  const output = template
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify([...new Set(precache)]))
  await writeFile(join(DIST_DIR, 'sw.js'), output, 'utf8')
  return precache.length
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main () {
  // loadSeasonal() loads the evergreen dataset too and hands it back, so the site's data is read
  // once rather than twice — the seasonal side has to resolve park and attraction slugs against it.
  const seasonal = await loadSeasonal()
  const data = seasonal.site1Data

  // Collected during load so the validator can report every break in one pass; the build refuses
  // to ship any of them.
  assertIntegrity(seasonal)

  if (!data.parks.length) {
    console.error('\n  No park data found under data/parks/. Nothing to build.\n')
    process.exitCode = 1
    return
  }

  await rm(DIST_DIR, { recursive: true, force: true })
  await mkdir(DIST_DIR, { recursive: true })

  // Persist any newly-added food ids before rendering, so the tracker page and the manifest on
  // disk always encode against the same ordering.
  const order = foodTrackerOrder(data)
  if (order.changed) {
    await writeFile(join(DATA_DIR, 'food-order.json'), JSON.stringify({
      version: 1,
      note: 'Canonical, APPEND-ONLY order for Food Tracker share links. Never reorder or remove an id — share links encode positions in this array. Ids of removed items stay as tombstones on purpose.',
      ids: order.ids,
    }, null, 2) + '\n', 'utf8')
  }

  const pages = buildPages(data, seasonal)

  for (const entity of [...seasonal.events, ...seasonal.months, ...seasonal.holidays, ...seasonal.prices, ...seasonal.closures]) {
    if (entity.staleness.state === 'stale') STALE_URLS.add(entity.url)
  }

  const seen = new Set()
  for (const page of pages) {
    if (seen.has(page.url)) throw new Error(`Duplicate output URL: ${page.url}`)
    seen.add(page.url)
    await writeOut(page.url, page.html)
  }

  await copyAssets()
  await writeFile(join(DIST_DIR, 'sitemap.xml'), buildSitemap(data.site, pages), 'utf8')
  await writeFile(join(DIST_DIR, 'robots.txt'), buildRobots(data.site), 'utf8')
  await writeFile(join(DIST_DIR, 'llms.txt'), buildLlmsTxt(data.site, data, seasonal), 'utf8')
  await writeFile(join(DIST_DIR, 'manifest.webmanifest'), buildManifest(data.site), 'utf8')
  await writeFile(join(DIST_DIR, '_headers'), buildHeaders(), 'utf8')
  await writeFile(join(DIST_DIR, '_redirects'), buildRedirects(), 'utf8')
  await writeFile(join(ROOT, 'vercel.json'), buildVercelConfig(), 'utf8')

  // Standalone, downloadable map plates. A downloaded file has no stylesheet, so the renderer
  // inlines one; everything else is already self-contained by design.
  await mkdir(join(DIST_DIR, 'maps'), { recursive: true })
  let mapCount = 0
  for (const park of data.parks) {
    const rendered = renderParkMap(park, { standalone: true })
    if (!rendered) continue
    await writeFile(
      join(DIST_DIR, 'maps', `${park.slug}-map.svg`),
      `<?xml version="1.0" encoding="UTF-8"?>\n${rendered.svg}\n`,
      'utf8'
    )
    mapCount++
  }

  const searchIndex = buildSearchIndex(data, seasonal)
  await writeFile(join(DIST_DIR, 'search-index.json'), JSON.stringify(searchIndex), 'utf8')

  const precacheCount = await buildServiceWorker(data, pages)

  // Report
  let bytes = 0
  async function measure (dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await measure(path)
      else bytes += (await stat(path)).size
    }
  }
  await measure(DIST_DIR)

  const ms = Math.round(performance.now() - started)
  const counts = {
    parks: data.parks.length,
    attractions: data.allAttractions.length,
    attractionPages: data.parks.reduce((n, p) => n + p.pagedAttractions.length, 0),
    lands: data.parks.reduce((n, p) => n + p.lands.length, 0),
    restaurants: data.allDining.length,
    restaurantPages: data.parks.reduce((n, p) => n + p.pagedDining.length, 0),
    foodItems: data.allFood.length,
    guides: data.guides.length,
    comparisons: data.compare.length,
  }

  const dated = [...seasonal.events, ...seasonal.months, ...seasonal.holidays, ...seasonal.prices, ...seasonal.closures]
  const byConfidence = { confirmed: 0, expected: 0, historical: 0, unknown: 0 }
  for (const entity of dated) byConfidence[entity.staleness.confidence] = (byConfidence[entity.staleness.confidence] || 0) + 1
  const editions = seasonal.events.reduce((n, e) => n + e.editions.length, 0)

  console.log(`
  Built ${pages.length} pages in ${ms}ms  ·  ${(bytes / 1024 / 1024).toFixed(2)} MB in dist/

    ${counts.parks} parks · ${counts.lands} land pages
    ${counts.attractions} attractions documented → ${counts.attractionPages} standalone pages
    ${counts.restaurants} dining locations   → ${counts.restaurantPages} standalone pages
    ${counts.foodItems} tracked food items
    ${counts.guides} guides · ${counts.comparisons} comparisons

    seasonal: ${seasonal.events.length} events (${editions} editions) · ${seasonal.months.length} months · ${seasonal.holidays.length} holidays · ${seasonal.prices.length} price pages · ${seasonal.closures.length} closure trackers
    confidence: ${byConfidence.confirmed} confirmed, ${byConfidence.expected} expected, ${byConfidence.historical} historical${byConfidence.unknown ? `, ${byConfidence.unknown} unverified` : ''}
    ${STALE_URLS.size} page${STALE_URLS.size === 1 ? '' : 's'} past review, demoted in the sitemap

    ${searchIndex.count} search index entries · ${precacheCount} precached URLs
    ${mapCount} downloadable map plates
    food share order: ${order.ids.length} slots${order.appended.length ? `, ${order.appended.length} appended this build` : ''}${order.tombstones.length ? `, ${order.tombstones.length} tombstoned` : ''}
`)
}

main().catch((err) => {
  console.error('\nBuild failed:\n', err)
  process.exitCode = 1
})

/**
 * Static site build.
 *
 * Reads every JSON file under data/, renders the full page graph, and writes a deployable
 * directory to dist/. No dependencies, no framework, no incremental cache — the whole site
 * builds in well under a second, which is the point.
 */

import { mkdir, writeFile, readFile, readdir, rm, cp, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { performance } from 'node:perf_hooks'

import { loadData, urls, foodTrackerOrder, DIST_DIR, ASSETS_DIR, DATA_DIR } from './lib/data.mjs'
import { plain, truncate } from './lib/html.mjs'
import * as core from './pages/core.mjs'
import * as parkPages from './pages/park.mjs'
import * as diningPages from './pages/dining.mjs'
import * as docsPages from './pages/docs.mjs'
import * as toolPages from './pages/tools.mjs'
import { legalPages } from './pages/legal.mjs'

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

function buildPages (data) {
  const pages = []

  pages.push(core.homePage(data))
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

  pages.push(...legalPages(data))

  return pages
}

/* ------------------------------------------------------------------ *
 * Search index
 * ------------------------------------------------------------------ */

function buildSearchIndex (data) {
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

function priorityFor (url) {
  if (url === '/') return '1.0'
  if (/^\/(walt-disney-world|disneyland)\/[^/]+\/$/.test(url)) return '0.9'
  if (url.includes('/height-requirements/') || url.startsWith('/tools/')) return '0.9'
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
    ],
  }, null, 2)
}

/* Cloudflare Pages headers: long-cache immutable assets, short-cache HTML. */
function buildHeaders () {
  return `/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/search-index.json
  Cache-Control: public, max-age=3600

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
`
}

function buildRedirects () {
  return `# Legacy / convenience paths
/magic-kingdom/*            /walt-disney-world/magic-kingdom/:splat  301
/epcot/*                    /walt-disney-world/epcot/:splat          301
/hollywood-studios/*        /walt-disney-world/hollywood-studios/:splat 301
/animal-kingdom/*           /walt-disney-world/animal-kingdom/:splat 301
/disneyland-park/*          /disneyland/disneyland-park/:splat       301
/california-adventure/*     /disneyland/california-adventure/:splat  301
/food-tracker/              /tools/food-tracker/                     301
/height-checker/            /tools/height-checker/                   301
/heights/                   /guides/height-requirements/             301
`
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
    urls.parksIndex(),
    ...data.parks.map((p) => urls.map(p)),
    ...data.parks.map((p) => urls.snacks(p)),
    '/assets/css/main.css?v=1',
    '/assets/css/print.css?v=1',
    '/assets/js/app.js?v=1',
    '/assets/js/food-tracker.js?v=1',
    '/assets/js/height-checker.js?v=1',
    '/assets/js/map.js?v=1',
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
  const data = await loadData()

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

  const pages = buildPages(data)

  const seen = new Set()
  for (const page of pages) {
    if (seen.has(page.url)) throw new Error(`Duplicate output URL: ${page.url}`)
    seen.add(page.url)
    await writeOut(page.url, page.html)
  }

  await copyAssets()
  await writeFile(join(DIST_DIR, 'sitemap.xml'), buildSitemap(data.site, pages), 'utf8')
  await writeFile(join(DIST_DIR, 'robots.txt'), buildRobots(data.site), 'utf8')
  await writeFile(join(DIST_DIR, 'manifest.webmanifest'), buildManifest(data.site), 'utf8')
  await writeFile(join(DIST_DIR, '_headers'), buildHeaders(), 'utf8')
  await writeFile(join(DIST_DIR, '_redirects'), buildRedirects(), 'utf8')

  const searchIndex = buildSearchIndex(data)
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

  console.log(`
  Built ${pages.length} pages in ${ms}ms  ·  ${(bytes / 1024 / 1024).toFixed(2)} MB in dist/

    ${counts.parks} parks · ${counts.lands} land pages
    ${counts.attractions} attractions documented → ${counts.attractionPages} standalone pages
    ${counts.restaurants} dining locations   → ${counts.restaurantPages} standalone pages
    ${counts.foodItems} tracked food items
    ${counts.guides} guides · ${counts.comparisons} comparisons
    ${searchIndex.count} search index entries · ${precacheCount} precached URLs
    food share order: ${order.ids.length} slots${order.appended.length ? `, ${order.appended.length} appended this build` : ''}${order.tombstones.length ? `, ${order.tombstones.length} tombstoned` : ''}
`)
}

main().catch((err) => {
  console.error('\nBuild failed:\n', err)
  process.exitCode = 1
})

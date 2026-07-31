/**
 * Post-build audit of dist/.
 *
 * Catches the things a data validator cannot: broken internal links, duplicate or missing titles
 * and meta descriptions, pages with zero or several H1s, malformed JSON-LD, unclosed placeholders,
 * and pages missing the required legal disclaimer.
 *
 * Run: npm run audit:site   (after npm run build)
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('\n  dist/ does not exist. Run `npm run build` first.\n')
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

/** Every URL the build actually produced, in the form links will reference it. */
const served = new Set()
for (const file of files) {
  const rel = '/' + relative(DIST, file).split('\\').join('/')
  served.add(rel)
  if (rel.endsWith('/index.html')) served.add(rel.slice(0, -'index.html'.length))
}

const titles = new Map()
const descriptions = new Map()
let totalLinks = 0

/** Entities inflate a length check five-fold — measure what a search engine would render. */
const decode = (s) => String(s)
  .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

const pick = (html, re) => { const m = html.match(re); return m ? decode(m[1]) : null }

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const page = '/' + relative(DIST, file).split('\\').join('/').replace(/index\.html$/, '')
  const isUtility = page === '/404.html' || page === '/offline/'

  /* -- head -- */
  const title = pick(html, /<title>([^<]*)<\/title>/)
  if (!title) fail(page, 'no <title>')
  else {
    if (title.length > 75) note(page, `title is ${title.length} chars — likely truncated in results`)
    if (!isUtility) {
      if (titles.has(title)) fail(page, `duplicate <title> — also used by ${titles.get(title)}`)
      else titles.set(title, page)
    }
  }

  const description = pick(html, /<meta name="description" content="([^"]*)"/)
  if (!description) fail(page, 'no meta description')
  else if (!isUtility) {
    if (description.length < 70) note(page, `meta description is short (${description.length} chars)`)
    if (description.length > 170) note(page, `meta description is long (${description.length} chars)`)
    if (descriptions.has(description)) fail(page, `duplicate meta description — also used by ${descriptions.get(description)}`)
    else descriptions.set(description, page)
  }

  if (!/<link rel="canonical"/.test(html)) fail(page, 'no canonical link')

  /* -- headings -- */
  const h1s = html.match(/<h1[\s>]/g) || []
  if (h1s.length === 0) fail(page, 'no <h1>')
  if (h1s.length > 1) fail(page, `${h1s.length} <h1> elements — there must be exactly one`)

  /* -- structured data -- */
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (!ld) fail(page, 'no JSON-LD block')
  else {
    try {
      const parsed = JSON.parse(ld[1].replace(/\\u003c/g, '<'))
      const graph = parsed['@graph'] || [parsed]
      if (!isUtility && !graph.some((n) => n['@type'] === 'BreadcrumbList') && page !== '/') {
        note(page, 'no BreadcrumbList in the JSON-LD graph')
      }
    } catch (e) {
      fail(page, `JSON-LD does not parse — ${e.message}`)
    }
  }

  /* -- legal -- */
  if (!/not affiliated with/i.test(html)) fail(page, 'missing the unaffiliated disclaimer')

  /* -- leaked placeholders -- */
  if (/\bTODO\b|\bTBD\b|Lorem ipsum|\[object Object\]|undefined<\/|>NaN</.test(html)) {
    fail(page, 'contains placeholder or undefined output')
  }
  if (/<p>…<\/p>|>…</.test(html)) note(page, 'contains a bare ellipsis — possible unfilled field')

  /* -- images -- */
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\balt=/.test(img)) fail(page, 'an <img> has no alt attribute')
  }

  /* -- internal links -- */
  for (const m of html.matchAll(/\bhref="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const href = m[1]
    totalLinks++
    if (href.startsWith('/assets/')) {
      if (!served.has(href)) fail(page, `asset link 404: ${href}`)
      continue
    }
    if (!served.has(href) && !served.has(href.endsWith('/') ? href : href + '/')) {
      fail(page, `internal link 404: ${href}`)
    }
  }
}

/* -- required files -- */
for (const required of ['/sitemap.xml', '/robots.txt', '/llms.txt', '/manifest.webmanifest', '/sw.js', '/search-index.json', '/404.html', '/_headers', '/_redirects']) {
  if (!served.has(required)) fail('build', `missing required output ${required}`)
}

/* -- map PNG freshness --
   The PNG plates are rasterised by a separate script rather than by the build, which keeps the site
   dependency-free but means they can silently fall behind the geometry or styling they came from. */
{
  const styleSrc = join(ROOT, 'src', 'lib', 'map-style.mjs')
  const styleTime = existsSync(styleSrc) ? (await stat(styleSrc)).mtimeMs : 0
  for (const svg of files.filter((f) => f.includes('/maps/') && f.endsWith('.svg'))) {
    const slug = svg.split('/').pop().replace('-map.svg', '')
    const png = join(ROOT, 'assets', 'img', 'maps', `${slug}-map.png`)
    const geometry = join(ROOT, 'data', 'parks', slug, 'map.json')
    if (!existsSync(png)) { note('maps', `${slug} has no PNG plate — run \`npm run maps:png\``); continue }
    const pngTime = (await stat(png)).mtimeMs
    const geoTime = existsSync(geometry) ? (await stat(geometry)).mtimeMs : 0
    if (pngTime < Math.max(geoTime, styleTime)) {
      note('maps', `${slug} PNG is older than its geometry or the map styling — run \`npm run maps:png\``)
    }
  }
}

/* -- sitemap sanity -- */
if (served.has('/sitemap.xml')) {
  const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8')
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  for (const loc of locs) {
    const path = new URL(loc).pathname
    if (!served.has(path)) fail('sitemap.xml', `lists a URL that was not built: ${path}`)
  }
  const indexable = htmlFiles.length - 2 // 404 + offline are noindex
  if (locs.length < indexable - 2) note('sitemap.xml', `${locs.length} URLs for ${htmlFiles.length} pages — check the exclusions`)
}

/* -- report -- */
let bytes = 0
for (const file of files) bytes += (await stat(file)).size

console.log(`
  Audited ${htmlFiles.length} pages · ${totalLinks} internal links · ${(bytes / 1024 / 1024).toFixed(2)} MB`)

if (notes.length) {
  console.log(`\n  ${notes.length} note${notes.length === 1 ? '' : 's'}:`)
  for (const n of notes.slice(0, 40)) console.log(`    · ${n}`)
  if (notes.length > 40) console.log(`    … and ${notes.length - 40} more`)
}

if (problems.length) {
  console.error(`\n  ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`)
  const shown = problems.slice(0, 80)
  for (const p of shown) console.error(`    ✗ ${p}`)
  if (problems.length > shown.length) console.error(`    … and ${problems.length - shown.length} more`)
  console.error('')
  process.exit(1)
}

console.log('\n  No problems found.\n')

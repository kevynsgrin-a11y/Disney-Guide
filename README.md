# Theme Park Guide — two sites, one repository

Two static, data-driven guides to the six US Disney parks, sharing one generator, one component
library, and one stylesheet. Every page is produced from JSON. No framework, no dependencies, no
build tooling beyond Node itself.

| | **Site 1 — Ride Ready Guide** | **Site 2 — Park Season Guide** |
|---|---|---|
| Owns | Facts that do not move | Facts with a shelf life |
| | Heights, ride mechanics, accessibility, permanent dining, maps | Parties, festivals, prices, closures, when to go |
| Data | `data/` | `data/seasonal/` |
| Build | `npm run build` → `dist/` | `npm run build:seasonal` → `dist-seasonal/` |
| Contract | `docs/DATA-SCHEMA.md` | `docs/SEASONAL-SCHEMA.md` |
| Launch | `docs/LAUNCH.md` | `docs/LAUNCH-SEASONAL.md` |

They are separate domains on purpose: seasonal churn dilutes an evergreen site's topical authority,
and evergreen stability makes a seasonal site look abandoned. **One canonical owner per topic, in
both directions** — Site 1 links out for anything dated, Site 2 links back for anything permanent,
and both validators fail the build if a topic drifts onto the wrong side.

> **Independent and unofficial.** Not affiliated with, endorsed by, or sponsored by The Walt Disney
> Company. Park, attraction, restaurant, event, and character names are used for identification and
> editorial commentary only.

---

## Quick start

```bash
node --version           # 20 or newer
npm test                 # unit tests (node:test, no dependencies)

npm run build            # Site 1: validate + factcheck, then render dist/
npm run serve            # preview dist/ at http://localhost:4321
npm run dev              # build + serve
npm run audit:site       # post-build QA: links, titles, JSON-LD, disclaimers
npm run check            # test + build + audit, the full gate

npm run build:seasonal   # Site 2: validate + factcheck, then render dist-seasonal/
npm run serve:seasonal   # preview dist-seasonal/
npm run audit:seasonal   # post-build QA, plus the freshness-contract checks
npm run check:seasonal   # the full gate for Site 2

npm run build:all        # both sites
npm run check:all        # both gates
```

There is nothing to `npm install`. `package.json` has no runtime dependencies, on purpose — these
sites have to still build in five years.

---

## What this is

Six parks, ~300 pages, generated from a validated dataset:

| Route | What it is |
|---|---|
| `/` | Network hub |
| `/parks/` | All six parks, sortable |
| `/walt-disney-world/` · `/disneyland/` | Resort hubs |
| `/<resort>/<park>/` | Park hub |
| `/<resort>/<park>/rides/` | Full attraction list + inline detail for every attraction |
| `/<resort>/<park>/best-rides/` | Ranked editorial "best rides at X", with overrated and underrated calls |
| `/<resort>/<park>/rides/<slug>/` | Standalone page for headliners and high-demand rides |
| `/<resort>/<park>/lands/<slug>/` | Land page |
| `/<resort>/<park>/height-requirements/` | Height chart + "what can a 40-inch child ride" bands |
| `/<resort>/<park>/dining/` · `/dining/<slug>/` | Dining hub and restaurant pages |
| `/<resort>/<park>/best-snacks/` | Ranked, priced, trackable snack list |
| `/<resort>/<park>/map/` | Printable schematic map |
| `/<resort>/<park>/accessibility/` | Transfers, rentals, quiet spaces, sensory notes |
| `/<resort>/<park>/first-timer-guide/` | Hour-by-hour first-visit plan |
| `/guides/<slug>/` | Evergreen planning guides |
| `/compare/<slug>/` | Comparison pages that commit to a verdict |
| `/tools/food-tracker/` | localStorage food tracker with share links and print checklist |
| `/tools/height-checker/` | One-slider "what can my kid ride" across all six parks |
| `/about/` `/editorial-policy/` `/affiliate-disclosure/` `/privacy/` `/terms/` `/contact/` | Legal and editorial |

### Deliberately out of scope (Site 2 owns these)

Party nights, festivals, seasonal ride overlays, limited-time menu items, current-day Lightning Lane
prices, refurbishment news, construction updates. Every one of those changes every few weeks; putting
them on an evergreen page just guarantees the page is wrong most of the year. Where a topic straddles
the line, Site 1 owns the permanent version and links out — one canonical owner per topic, contextual
links, never duplicated blocks.

---

## Repository layout

```
data/
  site.json                     brand, resorts, nav, legal text, affiliate partners
  parks/<slug>/park.json        park meta, lands, first-timer guide, accessibility, tips, FAQs
  parks/<slug>/attractions.json every attraction
  parks/<slug>/dining.json      every place to eat
  parks/<slug>/food.json        curated must-try items — drives the Food Tracker
  parks/<slug>/map.json         schematic map geometry
  parks/<slug>/best-rides.json  the park's ranked best-rides page
  guides/<slug>.json            evergreen guides
  compare/<slug>.json           comparison pages
docs/DATA-SCHEMA.md             the binding data contract + verified reference tables
src/
  build.mjs                     orchestrator: renders dist/, sitemap, robots, manifest, sw, search index
  lib/                          html templating, formatters, data loader + URL builders, schema.org, map renderer
  templates/                    page shell and the component library
  pages/                        one module per route family
assets/                         CSS, JS, service worker, icons — copied verbatim to dist/assets
test/                           unit tests for the escaping, formatting, schema, map,
                                and share-link-ordering guarantees
scripts/
  validate.mjs                  enforces docs/DATA-SCHEMA.md; runs before every build
  audit.mjs                     post-build QA
  serve.mjs                     local preview server
  generate-icons.mjs            renders the PWA icon set as real PNGs, no image library
```

**Nothing constructs a URL by hand.** `src/lib/data.mjs` exports `urls`, and every page module uses
it. Change a route in one place and the whole site — including the sitemap, search index, and
service-worker precache list — follows.

---

## The data contract

`docs/DATA-SCHEMA.md` is binding, and `scripts/validate.mjs` enforces it. The validator checks field
types, enum values, slug uniqueness, prose length floors, `lastVerified` format, and — the part that
actually matters — referential integrity across files:

- every `attraction.land` is a land declared in `park.json`
- every `relatedSlugs` entry resolves to an attraction in the same park
- every `food.restaurantSlug` resolves to a dining slug in the same park
- every `land.anchorAttraction` and `land.eatHere` entry resolves
- `park.stats` counts match what is actually in `attractions.json`
- map markers reference real attractions
- guide and comparison `related` arrays resolve

Errors block the build. Warnings (volume targets, missing maps) print and do not.

### Fact checking

`scripts/factcheck.mjs` is a separate, deliberately independent check. The validator proves the data
is *well-formed*; this proves it is *correct* on the facts that are easiest to get wrong and worst
to get wrong: every height requirement, the 2026 closures and rethemes, Test Track's Lightning Lane
tier, the absence of permanent virtual queues, verified snack prices, and evergreen scope.

Its reference tables are hard-coded on purpose. Checking the dataset against itself proves nothing —
the point is a second source of truth that has to be edited deliberately, in the same commit, when
reality changes. It also flags marketing filler and paragraph openers like "Whether you…" that are
the tell of generated travel copy.

### Editing content

Edit the JSON, then `npm run build`. A height correction in `attractions.json` updates the ride page,
the ride list, the park height chart, the resort height table, the cross-park master table, the
height checker payload, and the search index — because they all read the same field.

---

## The two tools

**Food Tracker** (`/tools/food-tracker/`). Three-state tracking (want / tried / skip) over every
curated food item on the site.

- State lives in `localStorage` under `rrg-food` as `{ version: 2, state: { id: status } }`. No
  account, no server copy, nothing transmitted.
- Share links pack the whole list into the URL: two bits per item over a canonical, append-only id
  order, base64url-encoded into the hash. ~230 items encodes to 78 characters.
- Because the canonical order is only ever appended to, **old share links keep working forever**.
  Ids added after a link was created simply decode as unset, and unknown ids are dropped.
- `@media print` produces a grouped, tickable checklist — no nav, no ads, skipped items removed.
- The page and its assets are precached by the service worker, so it works with no signal.

**Height Checker** (`/tools/height-checker/`). One slider against every height requirement on the
site, showing what a child clears, what they miss, and — the useful bit — what they miss by two
inches or less. Falls back to a full sortable table with JavaScript off.

---

## Maps

Maps are our own artwork, rendered as inline SVG from geometry in `data/parks/<slug>/map.json`.

- **No runtime library, no tile server, no network requests.** Prints on one page in black and
  white, works offline, and costs nothing to host.
- Where an attraction physically sits is a fact and is not copyrightable. Nothing is traced from an
  official park map, and no character or logo artwork appears anywhere.
- Geometry derives from open geographic data. Under ODbL, a rendered stylised map is a *Produced
  Work*: attribution is required (it is on every map page) but share-alike does **not** attach to
  the artwork. That only applies if you redistribute the derived database itself.
- A park with no authored `map.json` falls back to a generic hub-and-spoke land diagram, labelled as
  a diagram rather than a map.

Optional later step: MapLibre GL + PMTiles on R2 for pan/zoom tiles. Only worth it if analytics say
so — inline SVG wins on Core Web Vitals, print, and offline, which are the things this audience
actually needs.

---

## SEO decisions, and why

- **BreadcrumbList** on every page. Still an active rich result in 2026 and the highest-ROI markup
  available.
- **ItemList** on ride lists, height charts, dining lists, and snack lists.
- **TouristAttraction / Restaurant / Menu / AmusementPark.** No direct SERP lift, but these are what
  entity extraction and AI answer surfaces actually read.
- **FAQPage** is emitted where FAQs exist, and **nothing is designed around it.** Google retired the
  FAQ rich result in May 2026. The markup remains valid and useful for entity clarity; it will not
  win SERP real estate, so we do not pretend otherwise.
- **HowTo** is retired and never emitted.
- Content is structured for citation: tables, direct answers in the first sentence of a section,
  clear entities. With AI Overviews suppressing informational click-through hard, the durable plays
  are (a) be the cited source, and (b) own interactive tools an AI answer cannot reproduce. That is
  why the food tracker and height checker are first-class products rather than blog embellishments.
- **`/llms.txt`** is generated on every build: a plain-text index for answer engines that states the
  licence, the unaffiliated status, the verification date, and the evergreen/seasonal boundary up
  front, then points machine readers at the structured pages. It costs nothing and it is on-strategy
  for a site whose realistic upside is being cited rather than clicked.

Performance: static output on a CDN, one CSS file, three small JS files, zero third-party requests
at build time, explicit `_headers` for immutable asset caching. Ads are the main future threat to
Core Web Vitals — reserve fixed slot dimensions, lazy-load below the fold, and keep density low on
tool and map pages.

---

## Deployment

The build produces a plain static directory. `dist/_headers` and `dist/_redirects` are written in
Cloudflare Pages format and are ignored harmlessly elsewhere.

**Cloudflare Pages** (recommended)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 or newer |

**Anything else** — Netlify, Vercel, S3, GitHub Pages — serve `dist/` as static files. On a host
without `_redirects` support, port the legacy path rules from `src/build.mjs` to that host's format.

`dist/` is gitignored. It is fully reproducible from source in under a second.

### Before going live

`docs/LAUNCH.md` has the full plan — blockers, deploy steps, what to build next, and the decision
points that should change the plan. The short version:

1. Register the domain and update `data/site.json → brand.domain` and `brand.origin`. Every canonical
   URL, `og:url`, sitemap entry, and JSON-LD `@id` derives from that one value.
2. Have an IP attorney review `/privacy/`, `/terms/`, `/affiliate-disclosure/`, and the image policy.
   The disclaimers here are written carefully but they are not legal advice.
3. Put a real correction route on `/contact/`. A site that promises accuracy with no way to report an
   error is making a promise it cannot keep.
4. Wire a consent management platform before any advertising or analytics ships, and flip
   `site.analytics.enabled` when analytics go live.
5. Replace `assets/img/` icons if you rebrand — `node scripts/generate-icons.mjs` regenerates them.

---

## Brand

`data/site.json → brand` is the single place the site name lives. It ships as **Ride Ready Guide**,
chosen because the flagship content pillar is height requirements and "ride ready" says exactly that
without borrowing anyone's trademark. Alternatives that were checked as non-infringing and remain
available in the same slot: Park Trailhead, Gates Open Guide, The Ride List, Parkday Guide, Theme
Park Compass, Must Ride Guide.

Avoid anything containing *Disney*, *Magic Kingdom*, *Mickey*, *Imagineer*, or a park or character
name in the domain. Verify trademark availability before purchase.

---

## Editorial rules this codebase enforces

- Every price and volatile fact carries a `lastVerified` month, and the UI renders it.
- Closed attractions stay listed with a factual note rather than being deleted — they are
  high-search-volume terms and quietly removing them is how a guide becomes useless.
- Unofficial construction dates are labelled as estimates, because they are.
- Lightning Lane prices are published as ranges with an as-of date, never as a fixed figure.
- The FTC affiliate disclosure renders directly above the first affiliate link on a page, not only in
  the footer. `affiliateBox()` cannot render the link without it.
- The unaffiliated disclaimer is in the footer of every page, and `scripts/audit.mjs` fails the build
  if any page is missing it.

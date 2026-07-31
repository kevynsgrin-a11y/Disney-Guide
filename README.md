# Ride Ready Guide

A static, data-driven guide to the US theme parks, on one domain. Every page is generated from JSON.
No framework, no runtime dependencies, no build tooling beyond Node itself.

The site carries two kinds of content, and the difference is structural:

| | **Permanent** | **Dated** |
|---|---|---|
| Covers | Heights, ride mechanics, accessibility, dining, maps | Events, prices, closures, when to go |
| Lives in | `data/` | `data/seasonal/` |
| Contract | `docs/DATA-SCHEMA.md` | `docs/SEASONAL-SCHEMA.md` |
| Stamped with | The month it was last checked | That, plus a confidence level and a review date |

They were briefly two sites on two domains. Merging them put every cross-link back inside one
origin, which is where the linking actually pays — and gave the search index, the tools, and the
authority profile one place to compound. **One canonical owner per topic** still holds, and both
fact checkers fail the build if a topic drifts across the line: the evergreen one rejects seasonal
needles, the seasonal one rejects permanent facts.

> **Independent and unofficial.** Not affiliated with, endorsed by, or sponsored by The Walt Disney
> Company or any other park operator. Park, attraction, restaurant, event, and character names are
> used for identification and editorial commentary only.

---

## Quick start

```bash
node --version        # 20 or newer
npm test              # unit tests (node:test, no dependencies)
npm run build         # validate both contracts, fact-check both, render dist/
npm run serve         # preview dist/ at http://localhost:4321
npm run dev           # build + serve
npm run validate      # both validators
npm run factcheck     # both reference-table checks
npm run audit:site    # post-build QA: links, titles, JSON-LD, disclaimers, freshness
npm run check         # test + build + audit, the full gate
```

There is nothing to `npm install`. `package.json` has no runtime dependencies, on purpose — this
site has to still build in five years.

---

## What this is

379 pages across six US Disney parks, generated from a validated dataset:

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
| `/when-to-go/` · `/when-to-go/<month>/` | Twelve months graded on crowds, cost, weather, and what is on |
| `/events/<slug>/` · `/events/<slug>/<year>/` | Pattern page per event, with dated editions beneath it |
| `/calendar/` | Year-at-a-glance Gantt across both resorts |
| `/prices/<slug>/` | Tickets, Lightning Lane, parking, dining plans, annual passes — dated ranges |
| `/closures/<resort>/` | Refurbishment and closure trackers |
| `/holidays/<slug>/` | Cross-resort holiday hubs |
| `/tools/trip-timing/` | Re-ranks the twelve months against the reader's own priorities |
| `/about/` `/editorial-policy/` `/affiliate-disclosure/` `/privacy/` `/terms/` `/contact/` | Legal and editorial |

### Deliberately out of scope

Live wait times and day-level crowd predictions. Both need a data feed and are a different product
with different maintenance economics. The month pages state windows, which is what a planner can
actually act on.

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
  seasonal/events/<slug>.json   one per recurring event: the pattern page plus its year editions
  seasonal/months/<01-12>.json  when-to-go, one per month
  seasonal/holidays/<slug>.json cross-resort holiday hubs
  seasonal/prices/<slug>.json   what things cost, as dated ranges
  seasonal/closures/<resort>.json  refurbishment trackers
  seasonal/calendar.json        the year-at-a-glance timeline
docs/DATA-SCHEMA.md             the binding evergreen contract + verified reference tables
docs/SEASONAL-SCHEMA.md         the binding dated contract + the freshness rules
src/
  build.mjs                     orchestrator: renders dist/, sitemap, robots, manifest, sw, search index
  lib/                          html templating, formatters, data loaders + URL builders, schema.org,
                                map renderer, and the staleness contract
  templates/                    page shell and the component library
  pages/                        one module per evergreen route family
  seasonal/                     one module per dated route family
assets/                         CSS, JS, service worker, icons — copied verbatim to dist/assets
test/                           unit tests for the escaping, formatting, schema, map,
                                and share-link-ordering guarantees
scripts/
  validate.mjs                  enforces docs/DATA-SCHEMA.md; runs before every build
  validate-seasonal.mjs         enforces docs/SEASONAL-SCHEMA.md, including cross-link integrity
  factcheck.mjs                 evergreen facts against hard-coded reference tables
  factcheck-seasonal.mjs        dated facts against their own reference tables
  audit.mjs                     post-build QA, including the freshness-contract checks
  serve.mjs                     local preview server
  generate-icons.mjs            renders the PWA icon set as real PNGs, no image library
```

**Nothing constructs a URL by hand.** `src/lib/data.mjs` exports `urls` — every route on the site,
evergreen and dated alike — and every page module uses it. Change a route in one place and the whole site — including the sitemap, search index, and
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

## The freshness contract

Anything that moves with the season carries a `freshness` block: when it was checked, how confident
we are, and when it must be re-checked.

| Level | Means | Allowed to state |
|---|---|---|
| `confirmed` | Officially announced, with the announcement named | Exact dates and prices |
| `expected` | Not announced; the pattern has held three years or more | Windows and ranges. **Never an exact date.** |
| `historical` | Last confirmed cycle | Prior-year figures, labelled with their year |

`src/lib/staleness.mjs` compares each page's review date against `BUILD_MONTH` — a constant, not the
system clock, so a build cannot change its own output between two runs of the same commit. A page
past its review date renders a banner above the content, drops to the bottom of the sitemap's
priority band, and loses its `Event` JSON-LD `offers`.

**There is no JSON field that suppresses the banner.** An author who forgot to re-check is exactly
the case the automation exists for.

Structured data follows the same rule: an `Event` node without a real `startDate` is either ignored
or filled in with a guess, so a page without confirmed dates publishes as `Article` instead. That
costs rich results on about half the event pages for part of each year, and it is the right trade.

---

## The three tools

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

Free tier, unlimited bandwidth, and commercial use is permitted — which matters, because the site
carries affiliate links. Vercel's Hobby plan prohibits commercial use, so Vercel means Pro.

`dist/` is gitignored. It is fully reproducible from source in about a second.

### The one recurring maintenance task

`src/lib/staleness.mjs` exports `BUILD_MONTH`. Bump it, rebuild, and the build reports how many
pages just went stale; the audit lists them. Then re-verify each, move `verified` and `reviewBy`
forward, and promote anything an operator has since announced from `expected` to `confirmed` with a
`sourceNote` naming the announcement. `docs/LAUNCH-SEASONAL.md` has the full routine.

### Before going live

`docs/LAUNCH.md` has the full plan. The short version:

1. Register `ridereadyguide.com` and set `data/site.json → brand.domain` and `brand.origin`. Every
   canonical URL, `og:url`, sitemap entry, and JSON-LD `@id` derives from that one value.
2. Provision `corrections@` and `hello@`. The contact page commits to a three-working-day
   acknowledgement standard, and a correction route that bounces is worse than none.
3. Have an IP attorney review `/privacy/`, `/terms/`, `/affiliate-disclosure/`, and the image policy.
   The disclaimers here are written carefully but they are not legal advice.
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

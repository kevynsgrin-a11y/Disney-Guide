# Image & Content Generation Audit — Hollywood Ride Guide

**Operator:** `universal` · hollywoodrideguide.com · status `draft`
**Build audited:** 251 pages, 45.55 MB, `audit.mjs` exits 0 ("No problems found"), 88/88 tests pass
**Date:** 2026-08-28
**Scope:** what imagery and what written content this site needs, specified precisely enough to generate

---

## How to read this document

Six parts. Part 1 is what is wrong and what is missing. Parts 2–5 are the things you paste into a
generator to fix it. Part 6 is the grade.

| Part | What it is | Use it when |
| --- | --- | --- |
| **1 · Findings** | 91 findings from six independent audit lenses | You want to know why an asset is on the list |
| **2 · Photography** | 23 photographic assets, each with a positive prompt and a separate negative string | You are in Midjourney / Firefly / Flux |
| **3 · Non-photographic visuals** | 34 charts, maps, diagrams and icons | You are writing build-time SVG code, or drawing |
| **4 · Written content** | 24 content prompts, each carrying the verification constraint | You are generating copy or data proposals |
| **5 · Execution sequence** | Dependency order, costs, gates, and a stop-loss list | You are deciding what to do first |
| **6 · Grade** | Fortune-500-calibrated, three-dimensional | You want the verdict |

**Every fenced code block in Parts 2–4 is meant to be pasted verbatim.** Positive prompts and negative
conditioning strings are always in separate blocks, never combined — that separation is load-bearing
and Part 2 explains why.

## Method

Six audit lenses ran in parallel over the repository and the rendered build, each investigating
independently with no visibility into the others' conclusions. Four authoring passes then turned their
findings into paste-ready material. Three graders scored the site separately against a Fortune 500
reference class.

Every finding carries evidence that is a file path, a command output, or a counted figure. Where a
finding was severe enough to be an accusation — a false licence claim, a competitor's brand on a live
surface — it was re-verified by hand before being written down. Three such claims were checked
independently and all three held. One claim produced during scouting did not hold and was discarded:
an early check appeared to show the FTC affiliate disclosure was missing on 210 pages, but the pattern
was matching the disclosure's own link. Re-run correctly, **all 38 pages carrying a sponsored link
place the disclosure above the first one.** That constraint is met.

---

# Part 0 · Executive summary

## The one-sentence version

The site has no images at all, and every branded image it does ship belongs to a different company.

## The ten things that matter

**1. There are zero photographs.** `assets/img/photos/` contains one file: `README.md`. Across 251
rendered pages there are 0 `<img>` and 0 `<picture>` elements. The photo pipeline itself is
production-grade — `photo()` emits a `<picture>` with AVIF/WebP/JPEG sources, `srcset`, explicit
`width`/`height`, `fetchpriority` on the hero and `loading="lazy"` everywhere else, plus LQIP support.
It has simply never been given a file.

**2. But 157 of 251 pages need no code change to accept one.** `hero()` takes an `image` parameter
unconditionally and `.hero--photo` is fully built in CSS, including the scrim, the AA contrast
overrides and reduced-motion handling. Thirty-six page functions call `hero()`; exactly one passes an
image. This is not a component gap. It is an eight-line resolver and a data file.

**3. Every share of every page is a bare text link.** `site.socialImage` resolves to `null` because
the declared social card does not exist, so all 251 pages emit `twitter:card=summary` with no image.
Worse, both operators declare the same filename — `social-card` — into one shared directory, so
whichever card lands first becomes the Open Graph image for *both* sites.

**4. 37 MB of Disney park maps ship inside Hollywood Ride Guide.** That is roughly 81% of the entire
deploy, for Magic Kingdom, EPCOT, Animal Kingdom, Hollywood Studios, Disneyland Park and California
Adventure — referenced by zero Universal pages, and publicly fetchable at
`hollywoodrideguide.com/assets/img/maps/magic-kingdom-map.png`. `copyAssets()` copies the shared asset
tree wholesale with no operator filter. Meanwhile all four Universal parks have no map plate at all.

**5. The browser tab shows a competitor's logo.** The favicon is a hard-coded SVG in `build.mjs:520`
painted `#0f3d2e` — Ride Ready Guide's forest green — spelling that brand's monogram. All four PWA
icons are the same mark. `main.css` is byte-identical between the two operators (md5 `76a1ea57…`) and
its own header still reads "Ride Ready Guide — design system." Hollywood Ride Guide declares
`themeColor #1b3a5c` navy, so the browser chrome and every pixel of the page disagree.

**6. Eighteen pages are titled as Disney pages.** Verified by hand: 18 `<title>` tags, 18 `<h1>`
elements and 23 meta descriptions on hollywoodrideguide.com carry Disney brand tokens — including
`Disney parks in May: Crowds, Weather, Cost | Hollywood Ride Guide`. Two more ship a raw URL slug as
their title: `universal-orlando closures: Refurbishment Tracker`.

**7. Two integrity pages make false statements.** `/terms/` asserts that map data comes from
"OpenStreetMap contributors, which is available under the Open Database License" — but the four
Universal map SVGs contain no geographic data. They are radial wedges computed from `lands.length`,
and Epic Universe's and Universal Studios Hollywood's first polygons are byte-identical (md5
`793213643fa8…`), because both parks happen to have the same land count. `/affiliate-disclosure/` —
the one page whose entire job is material accuracy about a commercial relationship — describes its
partners as resellers of "Walt Disney World and Disneyland Resort tickets." `/about/` says "Coverage
starts with the six US Disney parks." On a site whose product *is* dated verification, these are not
cosmetic.

**8. The content is genuinely good, and thinner than it looks in two places.** Measured page-unique
word counts by family: compare pages median 5,865, guides 4,114, park hubs 3,586, attractions 1,110,
restaurants 745, events 545, closures 244. The attraction and restaurant pages are real hand-written
editorial, not data stubs. But ~15,800 authored words attached to non-standalone records never render
anywhere, four best-snacks pages are 0–2% page-unique, and 40 pages — 16% of the build — are
unreachable from the navigation because `nav.primary` and `nav.footer` declare no route into
`/when-to-go/`, `/calendar/`, `/events/`, `/prices/`, `/holidays/`, `/closures/` or `/tools/trip-timing/`.

**9. The most valuable images here are not photographs.** The site holds a dataset a competitor
cannot copy without redoing the fieldwork: complete five-axis fear profiles on all 107 attractions
resolving to 61 distinct shapes, 157 date-stamped food prices, and a verified height cliff where 39
inches unlocks 9 rides and 40 inches unlocks 20. All of it currently renders as progress bars and
sortable tables. Charts generated deterministically from verified data carry zero IP risk, need no
diffusion model, and are the only assets on this list that a competitor cannot simply commission.

**10. Nothing enforces any of it.** None of the four gates checks a byte budget, an image dimension, a
format, or provenance — the documented 120 KB / 80 KB ceilings exist only in a README. `audit.mjs`
exits 0 while shipping 18 competitor-branded titles. And its map-freshness check probes
`data/parks/<slug>/map.json`, a path that stopped existing when the repo went multi-operator, so that
check has been silently passing on nothing. In a codebase whose entire thesis is that an ungated rule
decays, that is the finding that generalises.

## What is genuinely strong

This is not a weak build, and the grade in Part 6 says so on seven of ten dimensions. The four-layer
gate is real: it verifies 12,628 internal links, catches duplicate titles and unparseable JSON-LD, and
`factcheck.mjs` correctly refuses to bless this operator while two height conflicts remain unresolved.
The structured-data layer beats most shipped consumer properties — 251/251 unique titles and
descriptions with zero duplicates, 248 BreadcrumbList, 153 FAQPage, 62 TouristAttraction, 47
Restaurant, 45 Menu nodes, zero parse failures. A cold home page is 26.8 KB gzipped with no web fonts
and no third parties. And the writing is the best thing on disk.

The problem is not quality. It is that an operator abstraction leaks in precisely the places a
customer looks.

## The shape of the work

| | Assets | What it needs |
| --- | ---: | --- |
| **Photography** (Part 2) | 23 | A diffusion model and IP review per image |
| **Non-photographic** (Part 3) | 34 | Mostly build-time SVG from existing verified data |
| **Written content** (Part 4) | 24 | Generation plus human verification before data entry |
| **Sequence** (Part 5) | 33 | Code changes, gates, and ordering |

**114 specified items.** Part 5 contains a defended "minimum viable 20%" cut and a stop-loss list of
things in this audit that should explicitly *not* be done.

---

# Part 1 · Findings

Ninety-one findings across six independent lenses. Each was investigated separately, against the
repository and the rendered build, with no visibility into the others' conclusions. Every finding
carries evidence that is a file path, a command output, or a counted figure.

Within each lens, findings are ordered by severity.

## 1.1 · Image slot opportunity map

> **157 of 251 universal pages already have a hero that accepts a photograph with zero code change — the site ships 1 image call site because nothing has ever been passed to them, while 79.7% of the build's bytes are Disney map PNGs no universal page links to.**

### BLOCKER: 251 of 251 pages ship no og:image — and the social-card filename collides with the disney operator

**🔴 BLOCKER** · effort: trivial

site.socialImage resolves to null (data.mjs:388-389) because assets/img/photos/social-card-1280.jpg does not exist, so layout.mjs:44-50 takes the fallback branch and every page emits `twitter:card=summary` with no image at all. Every share of every Hollywood Ride Guide URL on X, Facebook, LinkedIn, iMessage, Slack and WhatsApp is a bare text link. The runbook already calls this batch 2 and already argues it is the highest effort-to-return item on the list.

What the runbook does NOT catch: assets/img/photos/ is a SINGLE SHARED DIRECTORY (ASSETS_DIR is repo-root `assets`, data.mjs:19, copied wholesale by build.mjs:528), and BOTH operators declare the identical filename `social-card`. data/disney/site.json photos.social.file = 'social-card' and data/universal/site.json photos.social.file = 'social-card'. Whichever card lands on disk becomes the Open Graph image for BOTH sites. Ride Ready Guide's card would be served as Hollywood Ride Guide's card on all 251 pages, on a domain that is not its own.

The hero avoids this by accident (disney='hero-fireworks', universal='hero-coaster-night'), which shows the fix is a naming convention, not an architecture change.

**Image needed** — 1200x630 (declared 1280x672) social card for Hollywood Ride Guide: flat graphic, not photographic — the wordmark 'Hollywood Ride Guide' set large on the operator's navy (#1b3a5c), with a single restrained graphic device (the measuring-rule motif already used in the PWA icon, redrawn in navy). No park imagery, no readable signage, no photograph. It gets cropped by every platform, so keep everything inside a centred 80% safe area.

**Code change** — Rename the declaration in data/universal/site.json: photos.social.file → 'social-card-universal' (or operator-prefix both). One JSON string. No src/ change — the existsSync gate and the summary fallback already behave correctly.

<sub>Evidence: dist/universal: `grep -rl 'og:image' --include=*.html` = 0 of 251; `grep -rl 'summary_large_image'` = 0; `grep -rl 'twitter:card" content="summary"'` = 251. src/lib/data.mjs:19 (ASSETS_DIR is repo-root, not operator-scoped), src/build.mjs:528 (`cp(ASSETS_DIR, join(dist,'assets'))`). data/disney/site.json photos.social.file === data/universal/site.json photos.social.file === 'social-card'.</sub>

### BLOCKER: universal's hero slot points at an asset that has no prompt, no brief, and no entry in the runbook

**🔴 BLOCKER** · effort: small

data/universal/site.json declares photos.hero.file = 'hero-coaster-night' with the note 'Atmospheric night coaster silhouette'. That string appears exactly once in the entire repository — in that JSON file. docs/ASSET-RUNBOOK.md batch 1 and docs/LOVABLE-VISUAL-OVERHAUL.md both brief 'hero-fireworks' (fireworks over a fairground, Ferris wheel, striped awnings), which is the DISNEY declaration. The runbook's closing line claims 'The hero slot is already live in both operators — the moment the files land, the hero switches from its gradient on its own.' That is true for disney and false for universal: producing every asset in the runbook exactly as written leaves Hollywood Ride Guide with zero images, because nothing named hero-coaster-night is ever generated.

The whole batch-4 asset list is Disney-shaped and partly wrong for this operator regardless: 4a is a castle (Universal's US parks have no castle in the brand vocabulary, and a Moorish-Gothic castle on a Universal-focused site is editorially off), 4c is a traditional carousel (not a Universal signature). Universal's visual grammar is backlot street, studio-lot water tower, steel coaster at night, soundstage facade, neon marquee — none of which the runbook briefs.

**Image needed** — hero-coaster-night, 1920x1080, ≤120 KB AVIF: a steel coaster's lift hill and first drop in hard silhouette against a deep indigo-to-magenta dusk sky, shot from below and slightly off-axis, string lights and a lit backlot-style facade blurred in the lower third so white headline text sits cleanly. No riders' faces legible, no readable signage or wordmarks, no character forms, no three-circle arrangements anywhere in the lights or structure. Photographic, 35mm, film grain.

**Content needed** — A universal-operator section of docs/ASSET-RUNBOOK.md with its own batch 1 and batch 4 prompt set, so the Disney prompts are not run against this site by mistake.

**Code change** — None. This is a docs + asset gap.

<sub>Evidence: `grep -rn 'hero-coaster-night' docs/ data/ scripts/ src/` returns exactly one hit: data/universal/site.json:63. docs/ASSET-RUNBOOK.md batch 1 and docs/LOVABLE-VISUAL-OVERHAUL.md line 218 both specify hero-fireworks. docs/ASSET-RUNBOOK.md line 270: 'The hero slot is already live in both operators'.</sub>

### BLOCKER: 79.7% of the universal build is Disney park map PNGs that no universal page can reach

**🔴 BLOCKER** · effort: small

build.mjs:528 copies the entire repo-root assets/ tree into every operator's dist. assets/img/maps/ contains 12 PNGs — 6 Disney parks at 1x and 2x — totalling 38,067,654 bytes. dist/universal is 47,761,789 bytes; the HTML for all 251 pages is 9,294,002 bytes. So the Universal site's deploy is 80% Magic Kingdom, EPCOT, Animal Kingdom, Hollywood Studios, Disneyland and California Adventure map plates, and not one of them is linked from any of the 251 pages: park.mjs:940 gates the PNG download link on park.hasMapPng, which is false for all four universal parks (data.mjs:186 checks for `<slug>-map@2x.png`, and no universal-*.png exists).

This is not merely waste. The home page's trust strip claims 'Works without signal — the tools keep running on park WiFi' (core.mjs:105-107) and the photo budget in assets/img/photos/README.md fights over 120 KB for the hero. Meanwhile the deploy carries 38 MB of dead weight, and it is another operator's branded artwork sitting on hollywoodrideguide.com's origin.

**Code change** — src/build.mjs copyAssets() (line 527-532): after the cp, prune assets/img/maps to the operator's own park slugs — same shape as the existing `rm(join(dist,'assets','sw.js'))` line right below it. Roughly: read data.parks, remove any maps/*.png whose slug is not in that set. ~5 lines, in-idiom with the existing prune.

<sub>Evidence: `du -cb dist/universal/assets/img/maps/*.png` = 38,067,654 bytes; `du -sb dist/universal` = 47,761,789 bytes (79.7%). All 12 files are disney park slugs (animal-kingdom, california-adventure, disneyland-park, epcot, hollywood-studios, magic-kingdom). src/pages/park.mjs:940; src/lib/data.mjs:186; renderParkMap check confirms hasMapPng=false for all 4 universal parks and true for all 6 disney parks.</sub>

### THE MAP: 36 page-generating functions, 251 pages, exactly 1 image call site — but 157 pages need no code change at all

**🟠 HIGH** · effort: medium

Correction first: the brief says 38 page-generating functions. There are 40 exports across src/pages/*.mjs + src/seasonal/*.mjs, of which 4 are not page producers (BUILD_MONTH_NUMBER, bandCovers, ganttBands in src/seasonal/core.mjs; weatherScore in src/seasonal/tools.mjs). 36 page-producing exports, summing to exactly 251 pages.

The governing fact nobody has written down: hero() takes `image` unconditionally (components.mjs:43), and .hero--photo CSS is fully built (main.css:381-412) including scrim, AA overrides, LQIP and Ken Burns drift. Only ONE of 36 heroes is passed an image (core.mjs:92). The other 35 pass nothing. Of those 35, 12 families use the DEFAULT hero tone and would render a full-bleed photographic hero correctly today; 18 pass tone:'compact', which collides with .hero--photo (see separate finding).

FAMILY TABLE — ranked within tier by pages. [P]=pages, tone D=default (photo-ready now), C=compact (needs CSS variant).

TIER 1 — PHOTO-READY TODAY, 157 pages, no code change, data only:
  attractionPage  park.mjs:292   [62] D  aside=factPanel — WANTS: nothing per-ride (see 'mistake' finding). Best use is a LAND-level image inherited by its rides: 27 lands, 62 pages covered.
  restaurantPage  dining.mjs:121 [47] D  aside=factPanel — WANTS: room-tone, not food. A wide shot of an unbranded counter-service window / a lit dining room at dusk. Generic, reusable per service tier (quick-service, table-service, lounge) = 3 images cover 47 pages.
  monthPage       months.mjs:24  [12] D  aside=gradeBadge — WANTS: weather/season as a place, not an event. Rain on hot asphalt, low winter sun through a Ferris wheel, a packed midsummer midway. 4 seasonal images cover 12 pages.
  eventPage       events.mjs:46   [5] D  — WANTS: night atmosphere, string lights, fog, no costumed anything.
  editionPage     events.mjs:190  [5] D  — inherits event image; add nothing new.
  holidayPage     reference.mjs:26 [5] D — WANTS: crowd density as a subject (a switchback queue at golden hour). Reuses months' set.
  pricePage       reference.mjs:135 [5] D — NO IMAGE (see 'mistake' finding).
  parkHub         park.mjs:15     [4] D  — WANTS: the single strongest 'this park at night' frame per park. Highest per-page reader impact on the site; 4 images, 4 pages.
  closuresPage    reference.mjs:280 [2] D — NO IMAGE. A construction wall photo is decoration on a status table.
  resortPages     core.mjs:314    [2] D  — WANTS: resort-scale establishing shot (parking-to-gate walk, monorail-equivalent transit).
  homePage        core.mjs:29     [1] D  — ALREADY WIRED (data.photo.hero) but the file does not exist.
  eventsIndex/holidaysIndex/pricesIndex/closuresIndex/whenToGoIndex/calendarPage/tripTimingPage [7] D — index pages; one shared 'the whole year' image at most.

TIER 2 — BLOCKED BY tone:'compact', 94 pages, needs ~4 lines of CSS:
  landPage        park.mjs:439   [27] C  — HIGHEST VOLUME OPPORTUNITY ON THE SITE. A land is a place with a look; this is the one entity where an atmospheric image is editorially honest and legally safe (architecture and light, no IP). 27 images → 27 land pages + inherited by 62 attraction pages + 27 land cards on 4 park hubs.
  guidePage       docs.mjs:151   [11] C  — WANTS: the 8 planned section images (4a-4h). This is where 'the drop', 'waiting', 'the end of the day' belong.
  comparePage     docs.mjs:363   [10] C  — NO HERO IMAGE. A verdict page opening on a photo undercuts the verdict.
  ridesPage       park.mjs:178    [4] C  — NO IMAGE (data-dense, 105 KB already).
  heightsPage     park.mjs:520    [4] C  — NO IMAGE (see 'mistake' finding).
  accessibilityPage park.mjs:656  [4] C  — MAYBE: 'the welcome' (4d, unbranded attendant giving directions) is the one image on the site that would do real editorial work here.
  firstTimerPage  park.mjs:772    [4] C  — WANTS: 'the end of the day' (4h). Emotional close to a planning page.
  mapPage         park.mjs:893    [4] C  — the map IS the image; see separate finding.
  bestRidesPage   park.mjs:997    [4] C  — NO HERO IMAGE; ranked entries want per-entry images the site cannot honestly supply.
  diningHub       dining.mjs:14   [4] C  — reuses restaurantPage's service-tier images via diningCard.
  snacksPage      dining.mjs:244  [4] C  — ONE section image ('fair food', 4e) above the grid; NOT per-item.
  legalPages      legal.mjs:65    [8] C  — NO IMAGE, correctly.
  parksIndex/guidesIndex/compareIndex/toolsIndex/foodTracker/heightChecker [6] C — index and tool pages; card images only.

CARD-LEVEL SLOTS (independent of heroes): card() already accepts `image` and renders .card__media (components.mjs:336, main.css:514-519). attractionCard (381), diningCard (402) and eventCard (seasonal-components.mjs:180) all route through card() and would carry images the moment one is passed. monthCard (seasonal-components.mjs:291) is bespoke markup and is the only card that cannot. So the card layer needs ZERO component work — it needs a per-entity photo resolver in data.mjs, which does not exist (data.photo is site-level only, keyed by 'hero'/'social').

What is actually missing is one 8-line resolver, not a component library.

**Content needed** — Alt text and focal point per declared slot, authored in data/universal/site.json photos{} exactly as hero/social already are.

**Code change** — src/lib/data.mjs: add a per-entity resolver beside the existing data.photo block (data.mjs:370-380) — `data.photoFor = (key) => data.photo[key] || null` plus resolution of `entity.photo` string keys on lands/parks/events during normalization (~8 lines, same existsSync gate, same null-means-absent contract). Then pass `image: data.photoFor(land.photo)` at the hero()/card() call sites listed above. No change to hero(), photo() or card() is required.

<sub>Evidence: grep '^export function' src/pages/*.mjs src/seasonal/*.mjs → 40 exports, 36 page-producing; family counts summed = 251 (matches build output). `grep -rn 'C.hero({' src/pages src/seasonal` = 36; `grep -rho "tone: 'compact'" ` = 18, all in src/pages, 0 in src/seasonal. dist/universal: 251 HTML files, `grep -rl '<picture'` = 0, `grep -rl 'hero--photo'` = 0, `grep -rl 'card--media'` = 0. Only data.photo call site: src/pages/core.mjs:92.</sub>

### The map page is the one visual page family on the site, and all four universal maps are the generic fallback donut

**🟠 HIGH** · effort: medium

mapPage (park.mjs:893) renders an inline SVG that IS the image — no photograph needed, no IP risk, and it already exists as a shipped feature. For disney, all 6 parks have an authored data/disney/parks/<slug>/map.json with real polygon geometry, water, paths and markers (magic-kingdom/map.json is 3,874 bytes), and renderParkMap returns synthetic=false. For universal, NO park has a map.json, so all four fall through to syntheticMap() (map.mjs:75-110), which lays the lands out as equal wedges of a circle around a centre point.

The result: Universal Studios Florida, Islands of Adventure, Epic Universe and Universal Studios Hollywood all render the SAME pie-chart diagram, differing only in the number of wedges and the labels. The page's own copy switches to the honest lede for this case ('A schematic showing how the lands sit relative to one another', park.mjs:903-905), so it is not lying — but the tools index promises 'Schematic maps for all 4 parks, drawn by us from open geographic data' (tools.mjs:373), and a radial wedge diagram is not drawn from geographic data.

This is the highest-value image work on the universal site that carries zero IP exposure and zero byte cost: deriving land polygons from OpenStreetMap is explicitly permitted by the constraints, the map plate is already the site's strongest visual asset on disney, and it is 4 hand-authored JSON files of ~4 KB each.

**Content needed** — Four data/universal/parks/<slug>/map.json files matching the disney schema (viewBox, water, paths, lands[].points, markers), with land polygons traced from OpenStreetMap land-use and path geometry — NOT from an official park map. Same 'not to scale, schematic' note the disney files carry.

**Code change** — None — renderParkMap already consumes park.map when present (map.mjs:204). This is pure data.

<sub>Evidence: renderParkMap() returns synthetic=true for all 4 universal parks and synthetic=false for all 6 disney parks (verified by running the loader). `ls data/universal/parks/universal-studios-florida/` → attractions.json, best-rides.json, dining.json, food.json, park.json — no map.json. `ls data/disney/parks/magic-kingdom/` includes map.json (3,874 bytes). src/lib/map.mjs:75-110 (syntheticMap radial wedge layout), src/lib/map.mjs:204.</sub>

### tone:'compact' and .hero--photo are mutually exclusive, which locks 94 pages out of the hero slot for want of 4 lines of CSS

**🟠 HIGH** · effort: trivial

.hero--compact reduces padding-block (main.css:345). .hero--photo sets `min-height: min(78vh, 720px)` with `display: grid; align-items: end` at the ≥ breakpoint (main.css:392-393). Specificity and the min-height mean a compact hero handed an image becomes a full 78vh cinematic hero — the exact opposite of what 'compact' asks for. 18 of the 36 hero call sites pass tone:'compact', covering 94 of 251 pages, including the single highest-volume opportunity (landPage, 27 pages) and the guides (11 pages, the natural home of the 8 planned section images).

This is the smallest change with the largest reach on the whole list, and it is entirely additive — no existing rule changes, the no-photo fallback is untouched, and disney inherits the same capability.

**Code change** — assets/css/main.css, immediately after the .hero--photo block (~line 393): add `.hero--photo.hero--compact { min-height: clamp(240px, 34vh, 400px); }` and, inside the same media query, `.hero--photo.hero--compact .hero__inner { padding-block: clamp(1.5rem, 3vw, 2.5rem); }`. Shared CSS — blast radius is both operators, but purely additive: no page renders differently until an image is actually passed.

<sub>Evidence: assets/css/main.css:345 (.hero--compact), :381-412 (.hero--photo block, min-height at :392). `grep -rho "tone: 'compact'" src/pages src/seasonal | wc -l` = 18 of 36 C.hero( call sites; those 18 families sum to 94 pages (251 total − 157 default-tone).</sub>

### There is no route to place ANY of the 8 planned section images — section() has no image parameter

**🟠 HIGH** · effort: small

docs/ASSET-RUNBOOK.md batch 4 briefs eight 16:9 section images (4a castle, 4b the drop, 4c carousel, 4d the welcome, 4e fair food, 4f waiting, 4g the splash, 4h the end of the day) and files them under 'Blocks: Nothing — pure upside'. That assessment is wrong in one direction: nothing is blocked ON them, but they are blocked BY the templates. section() (components.mjs:75-89) accepts id, title, kicker, intro, children, tone, wide, hide — and no image. photo() exists and works, but the only component that calls it is hero() (line 48) and card() (line 336). There is no band-level image slot anywhere in the template layer.

So all eight assets could be generated, converted, budget-checked and dropped into assets/img/photos/ and the diff to the rendered site would be zero bytes across 251 pages. The 'pure upside' line should read 'blocked on a 6-line component change'.

A band-level slot is also the RIGHT shape for these particular images: they are illustrative-of-an-idea, not evidence-of-a-place, which is exactly what belongs mid-page in a guide and exactly what does not belong in a hero above a factual claim.

**Image needed** — The eight already briefed in docs/ASSET-RUNBOOK.md batch 4 — but re-briefed for this operator: drop 4a (castle) and 4c (carousel) as Disney-shaped, and add a backlot street at dusk, a steel coaster inversion against sky, and a soundstage-facade streetscape. Every one still bound by the three-circle and no-readable-signage checks.

**Code change** — src/templates/components.mjs section(): add `image` to the destructured params and, between the <header> block and ${children}, emit `${image ? html`<div class="band__media">${photo(image, { className: 'band__photo', sizes: '(min-width: 940px) 60rem, 100vw' })}</div>` : ''}`. Then ~5 lines of CSS for .band__media (max-width to the shell, border-radius: var(--radius), margin-block). Renders nothing when image is null, exactly like hero() and card() — same contract, no fallback to design.

<sub>Evidence: src/templates/components.mjs:75-89 — section() signature has no image param. photo() call sites in all of src/: components.mjs:48 (hero) and components.mjs:336 (card) only. docs/ASSET-RUNBOOK.md line 17: '| 4 | Section images ×8 | image generator | Nothing — pure upside |'. dist/universal: 0 of 251 pages contain <picture>.</sub>

### The one existing photo call site has a latent AA contrast failure: .verified renders muted grey directly on the hero photograph

**🟠 HIGH** · effort: trivial

The home page hero passes both `image: data.photo.hero` (core.mjs:92) and an `aside` containing statRow + lastVerified (core.mjs:83-91). .hero--photo overrides colour for .hero__title, .hero__lede, .hero__eyebrow and .hero__meta-label/value (main.css:402-406) — and nothing else. Inside hero__aside: .stat-row li carries `background: var(--surface)` so it survives as an opaque white card, but .verified (main.css:659-662) has `color: var(--muted)` (#64726e) and NO background, no scrim, no override. It is 0.8rem text.

The moment hero-coaster-night lands on disk, the string 'Everything on this site verified July 2026' renders as #64726e text sitting directly on a deep indigo night photograph, at small size, with the Ken Burns drift changing the backdrop underneath it. Against the briefed indigo it is roughly 2:1; against any lighter region of the frame it is worse. AA requires 4.5:1.

This is the site's own freshness claim — the single sentence the entire editorial contract rests on — rendered illegibly, on the only page that has an image. The photo pipeline's stated principle is that the unphotographic form must always work; the inverse has never been tested.

**Code change** — assets/css/main.css, inside the .hero--photo override group (~line 406): `.hero--photo .hero__aside .verified { color: rgba(255,255,255,.82); }` and `.hero--photo .hero__aside .verified svg { color: var(--accent-2); }`. Shared CSS; affects nothing until a hero image exists. Worth auditing the same way for .facts__hint and .small.muted before any other aside-bearing hero (attractionPage:317, restaurantPage:142, monthPage:38, eventPage:70) is given an image.

<sub>Evidence: src/pages/core.mjs:83-92 (aside + image on the same hero). assets/css/main.css:402-406 lists exactly four .hero--photo colour overrides; `grep 'hero--photo .hero__aside\|hero--photo .facts\|hero--photo .stat-row' main.css` = no matches. main.css:659-662 (.verified { color: var(--muted) }, no background). main.css:17 (--muted: #64726e).</sub>

### The universal PWA icon set and favicon are the disney operator's brandmark, hardcoded — on all 251 pages

**🟠 HIGH** · effort: small

Two separate hardcodes, both shared, both wrong for this operator:

1. src/build.mjs:520-525 defines FAVICON as an inline SVG literal with `fill="#0f3d2e"` (Ride Ready Guide's brand green) and #e9b264 amber letterforms, written to dist/<op>/assets/img/favicon.svg for EVERY operator. Hollywood Ride Guide's tab icon is Ride Ready Guide's monogram in Ride Ready Guide's colours.

2. assets/img/icon-{180,192,512,maskable}.png are generated by scripts/generate-icons.mjs with BRAND=[15,61,46] / BRAND_DEEP=[9,42,32] / AMBER=[233,178,100] hardcoded at lines 17-19, and copied unmodified into every dist. The universal manifest (build.mjs:273-275) points at them, and layout.mjs:183 sets them as apple-touch-icon. Installing hollywoodrideguide.com to a home screen produces a dark-green Ride Ready Guide tile.

Universal's declared themeColor is #1b3a5c (navy). layout.mjs also hardcodes the dark-mode theme-color as #0b0f0d, the green-black, for both operators. So the browser chrome, the tab icon and the install icon all disagree with the site they belong to, on every page.

These are the smallest images on the site and the only ones that render on 251 of 251 pages today.

**Image needed** — Hollywood Ride Guide icon set at 180/192/512 plus maskable 512, and a matching favicon.svg — same measuring-rule mark (it says what the site is and reads at 32px), recoloured to #1b3a5c ground with a light accent. Generated by the existing zero-dependency script, not by an image model.

**Code change** — Move the two colour triples and the favicon SVG behind the operator: read brand.themeColor (and two new brand.accent/brand.paper keys) in scripts/generate-icons.mjs and emit into assets/img/<operator>/, then point manifest + layout at the operator path; make FAVICON a function of site.brand rather than a module constant in build.mjs. Blast radius is both operators, but disney's values are the current literals so its output is byte-identical.

<sub>Evidence: src/build.mjs:520-525 (FAVICON literal, fill="#0f3d2e") written unconditionally at build.mjs:531. scripts/generate-icons.mjs:17-19 (BRAND/BRAND_DEEP/AMBER constants) → icon-180/192/512/maskable at lines 154-157. src/build.mjs:273-275 (manifest icons), src/templates/layout.mjs:183 (apple-touch-icon), layout.mjs dark theme-color hardcoded #0b0f0d. data/universal/site.json brand.themeColor = '#1b3a5c'. All four PNGs render as a green plate with an amber measuring rule (read directly).</sub>

### Noticed while enumerating, outside this lens: Disney copy is hardcoded into shared templates and renders on the universal site

**🟠 HIGH** · effort: small

Flagging because it surfaced in every page module I read and it is the kind of thing an image-focused pass would otherwise silently leave for someone else. Not image work; someone should own it.

- src/seasonal/months.mjs:36 — hero title is `${month.name} at the Disney parks`, rendered as the H1 on all 12 universal month pages ('January at the Disney parks' on hollywoodrideguide.com).
- src/templates/layout.mjs:99 — search dialog aria-label is hardcoded 'Search Ride Ready Guide' on all 251 pages.
- src/pages/core.mjs:259 — parks index lede reads 'Two resorts, six theme parks' against an operator with 4 parks (the count is available as data.parks.length two lines above).
- src/pages/docs.mjs — guides index lede hardcodes 'how Lightning Lane works' where data.queue.name resolves to the operator's own term.
- src/pages/legal.mjs — About page body says 'Coverage starts with the six US Disney parks' and description names 'Ride Ready Guide' explicitly.

**Code change** — Each is a template literal that should read from site.brand / data.queue / data.parks.length, all of which are already in scope at every one of these call sites.

<sub>Evidence: src/seasonal/months.mjs:36; src/templates/layout.mjs:99; src/pages/core.mjs:259; src/pages/docs.mjs guidesIndex lede; src/pages/legal.mjs:82 and :106.</sub>

### No image-credit line exists in the footer, and the runbook treats it as non-optional before any generated image ships

**🟡 MEDIUM** · effort: trivial

docs/LOVABLE-VISUAL-OVERHAUL.md line 228 specifies a footer credit reading 'Illustrative imagery, AI-generated', and line 483-484 says it 'goes in whether or not you take the labelling suggestion seriously — it costs one line in the footer and it is the difference between "illustrative imagery" and an accusation of' [passing synthetic imagery off as documentary]. siteFooter (layout.mjs:113-142) has no such line: it renders brand, tagline, accuracyNote, nav columns, disclaimer and copyright.

This matters more on this site than on most, because the entire editorial proposition is 'we checked this ourselves and stamped it with a date' (trustStrip, core.mjs:99-101). A synthetic photograph shipping unlabelled onto a page that carries 'Last verified July 2026' is the specific collision the credit line exists to prevent. It is also a prerequisite, not a follow-up: the credit has to be live BEFORE the first image lands, or there is a window in which the site is showing generated imagery with no disclosure.

Relatedly, assets/img/photos/CREDITS.md — required by assets/img/photos/README.md ('Record provenance for every file... before anything ships') and by docs/ASSET-RUNBOOK.md line 122 — does not exist. assets/img/photos/ contains only README.md.

**Content needed** — One string in data/universal/site.json legal.imageCredit: 'Illustrative imagery, AI-generated. Not photographs of the parks described.' Plus assets/img/photos/CREDITS.md with one provenance line per file (generator + prompt, or licence + source).

**Code change** — src/templates/layout.mjs siteFooter(), in the .site-footer__legal block beside the copyright line: append a conditional credit that renders only when the operator actually has resolved photos — e.g. gate it on site.socialImage or a new site.legal.imageCredit string. Gating it means the line does not appear on a site with no images, which is the current state and would otherwise be a false statement.

<sub>Evidence: src/templates/layout.mjs:113-142 (siteFooter, no imagery credit). docs/LOVABLE-VISUAL-OVERHAUL.md:228 and :483-484. `ls assets/img/photos/` → README.md only; no CREDITS.md. assets/img/photos/README.md line 34-35 requires it.</sub>

### WHERE IMAGES WOULD BE A MISTAKE: four page families, ~85 pages, where a photograph costs bytes and buys nothing — and one where it would be a fabrication

**🟡 MEDIUM** · effort: trivial

Being specific about the no's, since three of them are the highest-traffic families on the site.

1. FOOD CARDS — 158 items, ~85 pages affected. This is the one that will be proposed and must be refused. foodCard (components.mjs:426) has no image slot; adding one would put a thumbnail on 158 items across snacksPage (4), parkHub topFood (4), landPage food (27), restaurantPage linkedFood (47) and foodTrackerPage (1). Two independent reasons not to. (a) BYTES: /tools/food-tracker/ is ALREADY 314,405 bytes of HTML for one page that the home page promises 'keeps working when the park WiFi does not'. 158 thumbnails at even 20 KB each is 3.2 MB on a page whose entire selling point is that it works on no signal. (b) HONESTY, which is the stronger reason: every food card carries a specific name, a specific price, a dated verification and a first-person verdict ('Our take:'). A generated image of a named snack at a stated price is a fabricated record of a real product — it is materially different from an atmospheric hero, and it is the exact failure the site's editorial policy forbids on every other axis. If snacks get imagery it is ONE band-level 'fair food' image on snacksPage (4 pages), clearly illustrative, never keyed to an item.

2. heightsPage — 4 pages. A dense sortable table plus per-threshold prose; the reader arrived with a number in their head and wants a row. A photo above it is pure decoration and pushes the table below the fold on mobile. Same for ridesPage (4 pages, already 105,859 bytes at Universal Studios Florida) and the accessibility transfer-group lists.

3. pricePage / closuresPage — 7 pages. Status and range tables carrying explicit confidence levels. An atmospheric photograph beside a claim labelled 'expected, not confirmed' actively works against the confidence signalling the seasonal system exists to deliver.

4. comparePage / bestRidesPage — 14 pages. These commit to a verdict and defend it. Per-contender images invite the reader to judge on the picture; the pages' whole thesis is that the reasoning is the product. bestRidesPage in particular would want a photo per ranked entry, which reintroduces the fabrication problem from (1) at attraction scale.

5. attractionPage — 62 pages. Not a mistake in principle, but a trap in practice: a per-ride photograph on a Universal site means a photograph of a specific, heavily protected ride exterior or vehicle, which the constraints forbid outright. Any per-attraction image slot will be filled with something generic and then read as a picture of that ride. Better to let attraction pages inherit their LAND image, which is architecture and light rather than IP.

**Code change** — None — the correct action is to NOT add an image param to foodCard(), and to leave heightsPage, ridesPage, pricePage, closuresPage, comparePage and bestRidesPage heroes imageless even after the compact-photo CSS variant lands.

<sub>Evidence: dist/universal/tools/food-tracker/index.html = 314,405 bytes (largest page on the site); universal-studios-florida/rides/index.html = 105,859 bytes; best-snacks pages 89-101 KB. 158 tracked food items (build output). src/templates/components.mjs:426 (foodCard, no image param) with tracker call sites at dining.mjs:204/287, park.mjs:111, landPage:489. core.mjs:105-107 (the park-WiFi claim). assets/img/photos/README.md lines 20-26 (the budget, and the rule that the claim does not lose to a photograph).</sub>

## 1.2 · Content depth and thinness

> **The attraction and dining pages are NOT data stubs — every one carries real hand-written editorial (62 attraction pages median 539 page-unique words, 47 dining median 388) — but 18 pages ship with Disney branding in the title/H1, 15,798 words of already-authored editorial never render on any page, and the site is missing an entire Universal Orlando gate (Volcano Bay), CityWalk, per-hotel pages, and any multi-day itinerary.**

### 18 pages on the Universal site are titled and headlined as Disney pages

**🔴 BLOCKER** · effort: medium

The entire seasonal section renders hard-coded Disney strings in <title>, <h1>, meta description, og:title/og:description and JSON-LD, while the body copy underneath is correct Universal editorial. /when-to-go/october/ ships as <title>Disney parks in October: Crowds, Weather, Cost</title> with <h1>October at the Disney parks</h1> — and then opens with 'October is the busiest and most expensive month Universal runs outside the summer.' Affected: 12 month pages, /when-to-go/, /events/, /prices/, /holidays/, /closures/, /calendar/. All four gates pass clean — validate.mjs reports 8 unrelated warnings, factcheck.mjs 13 unrelated notes, audit.mjs literally prints 'No problems found across 1 site.' Nothing in the four-layer gate tests that an operator's pages are about that operator. Blast radius: src/seasonal/* is shared, so the fix must be operator-parameterised, not string-replaced.

**Content needed** — Operator-neutral title/H1/description strings driven off site.json brand + resort names, e.g. 'October at Universal' / 'Universal parks in October: Crowds, Weather, Cost'. 18 titles, 18 H1s, 18 meta descriptions, plus the matching JSON-LD name fields.

**Code change** — Replace the literal Disney strings in src/seasonal/months.mjs, core.mjs, reference.mjs, events.mjs and src/build.mjs:189 with values resolved from site.json (site.brand.name / site.parks[].name). Add an audit.mjs rule that fails when any rendered title/H1 names an operator other than the one being built.

<sub>Evidence: grep of built HTML: 17 pages with 'Disney' in <title>, 17 with 'Disney' in <h1>, union 18 (excluding the legitimate /compare/universal-vs-disney-orlando/). Sources: src/seasonal/months.mjs:35,141,143,152,182,234; src/seasonal/core.mjs:44,76,78; src/seasonal/reference.mjs:101,120,122,126,218,257,259,263,348,368,370; src/seasonal/events.mjs:331,333,338; src/build.mjs:189</sub>

### /affiliate-disclosure/ makes a false material statement about who the affiliate partners sell for

**🔴 BLOCKER** · effort: small

On hollywoodrideguide.com the FTC disclosure page describes its affiliate partners as 'an authorized reseller of Walt Disney World and Disneyland Resort tickets' and another as offering 'Disneyland Resort tickets and hotel packages'. This is the one page on the site whose entire job is to be materially accurate about the commercial relationship, and it names the wrong parks. /about/ has the same class of problem: 'Coverage starts with the six US Disney parks and is expanding to other operators' — on a site that covers zero Disney parks. These are the site's trust pages; they are the pages a reader checks precisely when they have started to doubt the rest.

**Content needed** — Rewrite the affiliate partner descriptions to state what each partner actually resells for Universal, sourced from site.json affiliates rather than hard-coded. Rewrite the /about/ coverage paragraph for the Universal catalogue (4 parks documented, 107 attractions, 84 dining). Rewrite the 3 /editorial-policy/ passages that use Disney hard-ticket parties and 'September at Walt Disney World' as their worked examples — the Universal equivalent (HHN dates before announcement) is a stronger example and the site already has the data.

**Code change** — src/pages/legal.mjs:106,187,297,333,376 — move partner descriptions and coverage copy into data/<op>/site.json so each operator supplies its own.

<sub>Evidence: dist/universal/affiliate-disclosure/index.html contains 'an authorized reseller of Walt Disney World and Disneyland Resort tickets' and '— Disneyland Resort tickets and hotel packages'; dist/universal/about/index.html contains 'Coverage starts with the six US Disney parks'. Source: src/pages/legal.mjs:376 and src/pages/legal.mjs:106. /editorial-policy/ carries 3 further Disney references (src/pages/legal.mjs:187,297,333).</sub>

### 15,798 words of authored, fact-checked editorial never render on any page

**🟠 HIGH** · effort: medium

82 records (45 attractions, 37 dining) are marked standalonePage:false but were still fully written — summary, description paragraphs, tips, scare notes, accessibility notes. Their copy is only partly surfaced in list rows elsewhere. Measured by normalising every authored string and testing it against the concatenated main-region text of all 251 built pages: attractions lose 8,276 of 15,406 authored words (54%), dining loses 7,522 of 8,320 (90%). Every one of the 62 standalone attraction and 47 standalone dining pages, by contrast, publishes 100% of its authored copy — so this is purely a publishing-surface gap, not an authoring gap. The dining case is the sharper one: all 37 are open locations (13 quick-service, 14 snack carts, 6 lounges, 2 bakeries, 2 food trucks) and include Butterbeer Cart, TODAY Cafe, Louie's Italian Restaurant and The Fountain of Fair Fortune. Butterbeer Cart alone has 257 authored words of which 92% never appear, while the site's own best-snacks page calls Frozen Butterbeer 'the single thing to eat or drink at Universal Orlando if you only do one'. Three of the 45 attractions are legitimately closed (Poseidon's Fury, The Eighth Voyage of Sindbad, The Walking Dead Attraction) and their 897 words are 100% unpublished — arguably the most searched-for 'what happened to' content on the site.

**Content needed** — No new writing required — this is already written. What is needed is a publishing surface: either flip standalonePage to true for the 42 open minor attractions and 37 open dining locations (adds 79 pages at ~200-240 authored words each, which is thin for a standalone page), or better, render the full description/tips/notes inline as expandable entries on the land pages and dining index pages, which currently sit at 449 and 43 page-unique words respectively and would absorb this content well. The 3 closed attractions want a short 'what was here' treatment on their land page instead.

**Code change** — src/pages/park.mjs (land + rides index + dining index renderers) — pass the full record rather than summary-only to the list-row component for non-standalone entries.

<sub>Evidence: Script over data/universal/parks/*/{attractions,dining}.json vs. the main-region text of all 251 built HTML files: attractions standalone 50,822w authored / 50,822w published / 0 unpublished; attractions non-standalone 15,406w / 7,130w / 8,276w unpublished (54%). Dining standalone 19,888w / 19,888w / 0; dining non-standalone 8,320w / 798w / 7,522w unpublished (90%). Worked example: Storm Force Accelatron publishes 158 of 293 authored words.</sub>

### No multi-day itinerary exists anywhere on the site — the single content type Universal Orlando planning most needs

**🟠 HIGH** · effort: large

The word 'itinerary' appears 5 times across 251 pages. Per-park single-day plans do exist and are good (each first-timer-guide has 'If you only have one day, do exactly this' plus morning/middle/evening sections, median 1,700 page-unique words). What is absent is the cross-park sequencing question, which is now the actual trip shape: the site's own site.json copy says 'Epic Universe, which opened in May 2025 on a separate campus a short drive south, is a full-size park' and 'Universal Orlando is now a three-park destination, and that changed the trip.' A reader with a 3-, 4- or 5-day Universal Orlando ticket has no page telling them which park on which day, when to use Early Park Admission on which campus, which day to burn Express Pass on, or how to sequence the two campuses given they are not walkable to each other. This is the highest-value bookmark-not-read-once content type the site is missing, and it requires no unverifiable facts — it is pure sequencing judgment over data the site already holds (attraction inventories, tiers, Express coverage, EPA, park-to-park, crowd shapes per month).

**Content needed** — A new /itineraries/ family: 2-day Universal Orlando (USF+IOA), 3-day (adding Epic Universe), 4-day (adding a Volcano Bay or repeat day), plus a 1-day Universal Hollywood and a 2-day Hollywood+LA. Each ~1,500-2,500 words: day-by-day park assignment with the reasoning stated, an EPA plan per morning, an Express Pass buy/skip call per day, where lunch lands, and a named failure mode ('do not put Epic Universe on your arrival day'). Also variants by party: young children, thrill-seekers, no-Express budget trip. Roughly 6-10 pages.

**Code change** — New data/universal/itineraries/*.json + a new src/pages/itineraries.mjs page generator and nav entry.

<sub>Evidence: grep -roi 'itinerary' dist/universal --include=*.html | wc -l → 5. No /itineraries/ route; find over dist/universal returns no matching path. Per-park day plans confirmed present in the 4 first-timer-guide pages (H2s: 'If you only have one day, do exactly this', 'The morning', 'The middle of the day', 'The evening').</sub>

### Volcano Bay — an entire Universal Orlando gate — has zero pages, while the site's own copy names it

**🟠 HIGH** · effort: large

site.json describes Universal Orlando as 'three theme parks and a water park on two campuses' and 'Roughly 82 [attractions] in total, plus Volcano Bay water park'. Volcano Bay is on the 3-park and 4-park ticket, is priced on the site's own ticket pages, and is repeatedly recommended in the seasonal copy ('Volcano Bay is the day that makes the rest of the week work', 'the highest-value park day in an Orlando June'). It then has no park hub, no attraction list, no height requirements, no dining, no map, no accessibility page. The site tells the reader to spend a day there and gives them nothing to plan it with. This is also a structural inconsistency with the site's own promise: the height-checker tool and /guides/height-requirements/ claim to cover Universal Orlando, and a water park with body slides has height minimums that are exactly the thing that tool exists to answer.

**Content needed** — A Volcano Bay data set matching the existing park schema: park.json (lands/areas, intro), attractions.json (~20 slides and the wave pool, with heightIn, intensity, scary scores, getsWet, accessibility), dining.json (~8 locations), height-requirements, accessibility, first-timer-guide. Roughly 8-10 pages and ~12,000 words at the site's current per-park density. Everything needed is externally verifiable (height sticks, slide types) and fits the existing no-invented-facts discipline.

**Code change** — Add data/universal/parks/volcano-bay/ and register it in site.json parks[0]; existing src/pages/park.mjs generators should handle it, though the map plate and 'attractions' tiering may need a water-park variant.

<sub>Evidence: data/universal/parks/ contains only epic-universe, islands-of-adventure, universal-studios-florida, universal-studios-hollywood. grep -roi 'volcano bay' dist/universal --include=*.html | wc -l → 15, all passing mentions inside compare/, when-to-go/ and prices/express-pass. Quoted phrasing from data/universal/site.json parks[0].summary and intro.</sub>

### Closures pages render the raw URL slug as the reader-facing park name

**🟠 HIGH** · effort: trivial

The RESORT_LABEL lookup at src/seasonal/reference.mjs:18 contains only Disney keys — { 'walt-disney-world', 'disneyland', 'both' } — so for Universal it falls through to the raw slug. The two closure tracker pages ship with <h1>What is closed at universal-orlando</h1> and <title>universal-orlando closures: Refurbishment Tracker</title>. This is the most visibly broken text on the site: lowercase, hyphenated, machine-shaped, in the largest type on the page and in the browser tab and in the search result. The same fallback also feeds the meta description and the JSON-LD headline.

**Code change** — src/seasonal/reference.mjs:18 — resolve resort display names from data/<op>/site.json parks[].name / shortName instead of a hard-coded Disney map. Shared code, so the Disney build must be re-verified. Add a validate/audit rule that fails when a rendered H1 or title matches /^[a-z0-9-]+$/ on any word that is also a known slug.

<sub>Evidence: dist/universal/closures/universal-orlando/index.html: 'What is closed at universal-orlando' and '<title>universal-orlando closures: Refurbishment Tracker</title>'; same pattern in closures/universal-hollywood/. Source: src/seasonal/reference.mjs:18 const RESORT_LABEL = { 'walt-disney-world': 'Walt Disney World', disneyland: 'Disneyland Resort', both: 'Both resorts' }, consumed at reference.mjs:290 and 241.</sub>

### The attraction template flattens importance: a world-class headliner gets 1.15x the words of a minor ride

**🟡 MEDIUM** · effort: medium

Editorial word counts by tier across the 62 standalone attraction pages: headliner (n=22) median 728 words, major (n=38) median 631, minor (n=2) median 675. The template's block counts are functioning as a ceiling rather than a floor — 61 of 62 records have exactly 3 description paragraphs, 52 of 62 have exactly 5 tips, 59 of 62 have exactly 3 relatedSlugs, 41 of 62 have exactly 4 FAQs. The one exception proves nothing structural is stopping more: The World-Famous Studio Tour has 4 description paragraphs and 6 FAQs (1,154 authored words, 873 page-unique) and is by a clear margin the best page on the site. Compared against the weakest, The Untrainable Dragon (617 authored / 388 page-unique), the gap is entirely block count, not block quality — the Dragon's 3 paragraphs are genuinely good writing. So the finding is not 'weak pages exist', it is 'VelociCoaster, Hagrid's, Forbidden Journey and Stardust Racers are being written to the same word budget as Storm Force Accelatron', which mis-signals to the reader which rides actually matter.

**Content needed** — Expand the 22 headliner records toward the Studio Tour shape: a 4th description paragraph (design/history/why it matters), a 4th experience paragraph (the specific seat/row/timing advice that only applies to that ride), and 2 more FAQs drawn from what people actually ask about that ride. ~350 words x 22 records ≈ 7,700 words. Leave the 38 major records where they are — the flatness is the problem, not the floor.

**Code change** — None required; the template already renders variable-length arrays (Studio Tour proves it). Optionally add a validate.mjs rule that warns when a headliner-tier record has fewer blocks than the tier median.

<sub>Evidence: Across data/universal/parks/*/attractions.json standalonePage:true — description paragraph distribution {3:61, 4:1}, tips {4:10, 5:52}, faqs {3:9, 4:41, 5:10, 6:2}, relatedSlugs {3:59, 4:3}. Tier medians: headliner 728w (n=22), major 631w (n=38). Studio Tour blocks {desc:4, exp:4, tips:5, faqs:6, related:4} = 1,154w vs The Untrainable Dragon {desc:3, exp:3, tips:4, faqs:3, related:3} = 617w.</sub>

### Four best-snacks pages are titled as curation and contain 9-50 words of page-specific editorial

**🟡 MEDIUM** · effort: medium

The best-snacks pages render 2,942-3,544 words each but 0-2% of that is unique to the page — every word is the food.json item description and 'Our take' verdict, which also renders on the dining pages and the food tracker. There is no ranking rationale, no top-five narrative, no 'if you eat one thing here', no note on what is seasonal or what has changed since last year. The page is a filter UI over a list with a headline promising editorial judgment. Compare the sibling best-rides pages, which do the opposite: 4,928 median rendered words at 96% page-unique — genuine per-park ranking prose. The snack equivalent simply was not written.

**Content needed** — Per park, ~600-900 words of framing that only exists here: how the list was ranked and what disqualifies an item; a named top five with a sentence each on why it beat the rest; the one overrated item and why; what to eat if you have one snack budget vs. a full day of grazing; which items are walkable vs. need a seat; anything seasonal. The verdicts already in food.json are the raw material — this is the connective judgment between them.

**Code change** — Add a bestSnacks intro/ranking block to data/universal/parks/*/food.json (or a sibling best-snacks.json mirroring the existing best-rides.json pattern) and render it in the best-snacks generator in src/pages/dining.mjs.

<sub>Evidence: Page-unique word counts (units appearing on no other page): /universal-orlando/epic-universe/best-snacks/ 9 unique of 3,240 rendered; /universal-orlando/universal-studios-florida/best-snacks/ 9 of 3,544; /universal-orlando/islands-of-adventure/best-snacks/ 10 of 3,172; /universal-hollywood/universal-studios-hollywood/best-snacks/ 50 of 2,942. Sibling /best-rides/ pages: median 4,597 unique of 4,928 rendered (96%).</sub>

### CityWalk has 154 mentions and zero pages — the dining gap where most guests actually eat dinner

**🟡 MEDIUM** · effort: large

CityWalk is referenced 154 times across the built site, is the transit hub between USF and IOA that every Universal Orlando guest walks through twice a day, and holds roughly 30 restaurants including the resort's main table-service capacity. The site documents 84 in-park dining locations to a high standard and documents CityWalk not at all. The practical consequence: a reader who has used the site to plan every in-park meal has nothing for the dinner they will most likely eat. Same gap at Universal Hollywood's CityWalk. Note that the site's dining schema already fits — CityWalk restaurants have service tier, price tier, reservations, mobile order, dietary flags exactly like in-park ones.

**Content needed** — A CityWalk dining set for both resorts using the existing dining.json schema: ~20 Orlando and ~10 Hollywood locations at the current dining density (median 442 authored words each for standalone, ~239 for list entries), plus a CityWalk hub page covering how it works — that it is free to enter, parking, the walk/boat times to each park, when it gets busy, and which reservations actually need booking.

**Code change** — Add data/universal/citywalk/<resort>.json and either extend src/pages/dining.mjs to accept a non-park dining venue or add a small citywalk page generator.

<sub>Evidence: grep -roi 'citywalk' dist/universal --include=*.html | wc -l → 154. No /citywalk/ route in the 251-page build; CityWalk appears in data/universal/parks/*/park.json and compare/*.json as prose mentions only, never as a dining record.</sub>

### Hotels: the site names the tier decision as trip-defining, then publishes one price table

**🟡 MEDIUM** · effort: medium

/prices/hotels/ opens with 'Universal Orlando's hotel tiers are the rare resort accommodation decision that changes what a park day is like rather than only where you sleep, because three of the hotels include Express Pass for every guest in the room for the whole stay.' That is correct and it is the single largest money decision in a Universal Orlando trip — a deluxe room including Express for a family of four can be cheaper than paying for Express separately. Having stated it, the site publishes a rate-band table and stops. Individual hotels appear only as table cells: Portofino 13 occurrences, Hard Rock 13, Royal Pacific 13, Helios 8, Sapphire Falls 1, Aventura 1, and Cabana Bay / Endless Summer / Terra Luna / Stella Nova 0. There is no page working the arithmetic the site itself says is the point.

**Content needed** — One decision page (~1,500 words): 'Is an Express Pass hotel worth it?' — the arithmetic at 2, 3, 4 and 5 guests across low/shoulder/peak, when it stops paying, and the cases where it clearly does not (short trip, low-crowd weekday, Epic Universe where the Express position is explicitly unverified). Plus short per-hotel pages (~400-500 words each, 8-10 hotels) covering tier, Express inclusion, Early Park Admission, walk vs. boat vs. bus time to each park, and who it suits — all externally verifiable, no invented rates.

**Code change** — Add data/universal/hotels/*.json and a hotels page generator; link from /prices/hotels/ and the first-timer guides.

<sub>Evidence: dist/universal/prices/hotels/index.html quoted lede; whole-site occurrence counts per hotel name from grep across dist/universal --include=*.html: Royal Pacific 13, Portofino 13, Hard Rock Hotel 13, Helios 8, Sapphire Falls 1, Aventura 1, Cabana Bay 0, Endless Summer 0.</sub>

### Zero images across 251 pages, and only one page is even wired to display one

**🟡 MEDIUM** · effort: large

The build emits 0 <img> tags site-wide. site.json declares exactly 2 photos (hero, social), assets/img/photos/ contains only README.md, and there is a single data.photo call site at src/pages/core.mjs:92. The card() component at src/templates/components.mjs:336 already supports an image slot and no page passes one. The design principle that a declared-but-missing photo renders nothing is sound and should not change — but the consequence today is that 62 attraction pages and 47 dining pages, whose entire subject is a physical place, are pure text. For the dining pages especially (median 757 rendered words) a single photograph of the seating area or the signature item would do more for the reader than another paragraph. Note the hard constraints materially shape what is even shootable: no characters, no ride vehicles, no logos, no castle, no Mickey-head shapes including incidental ones in food, no real people — which rules out most of the obvious shots and makes generated imagery a near-certain legal failure mode.

**Image needed** — Per dining location: the dining room or terrace shot showing seating and sightlines, no guests' faces, no branded signage — for Captain America Diner specifically, the lagoon view the page's whole verdict rests on. Per attraction: exterior queue/facade architecture only, never the ride vehicle or any character. All must hold under 80 KB (120 KB for a 1920 AVIF hero) to keep the park-WiFi claim on the home page true.

**Content needed** — Alt text and focal-point declarations for each new photo slot in site.json, plus a caption line per image — the site's voice means a caption should carry information ('the lagoon-side terrace, which is the reason to eat here'), not describe the picture.

**Code change** — Pass an image through to card() from the dining and attraction list renderers in src/pages/dining.mjs and src/pages/park.mjs, and add a photo slot to the attraction/dining detail templates. Blast radius: components.mjs is shared with the Disney build.

<sub>Evidence: grep -roh '<img[^>]*>' dist/universal --include=*.html | wc -l → 0. ls assets/img/photos/ → README.md only. Object.keys(site.photos).length → 2. Single call site: src/pages/core.mjs:92 image: data.photo.hero.</sub>

### Four map pages have zero page-unique words

**🟡 MEDIUM** · effort: small

The per-park map pages render 243-283 words each, all of which appear on at least two other pages — the legal provenance notice, the offline/save-it callout and the land list are shared verbatim across all four. There is no per-park cartographic commentary: nothing on which walks are long, where the shade is, which land-to-land connection is not obvious, where the bottleneck is at park close. The SVG map itself is a genuinely strong asset (drawn from OpenStreetMap, prints on one page, works offline) and the surrounding page adds nothing to it.

**Content needed** — ~400-600 words per park of walking commentary keyed to the map: the longest walk in the park and how long it takes, the two lands people assume connect and do not, where the shade and the indoor air-conditioned refuges are, the best place to regroup, where the exit crush forms at close, and for Universal Orlando the campus-to-campus reality (walk/boat times, and that Epic Universe is a drive not a walk).

**Code change** — Add a per-park map commentary block to data/universal/parks/*/park.json and render it in the map page generator.

<sub>Evidence: Page-unique words = 0 for all four: /universal-hollywood/universal-studios-hollywood/map/ (243 rendered), /universal-orlando/epic-universe/map/ (252), /universal-orlando/islands-of-adventure/map/ (278), /universal-orlando/universal-studios-florida/map/ (283). Median boilerplate 139 words.</sub>

### Rides and dining index pages are 1-4% page-unique with no per-park framing

**🟡 MEDIUM** · effort: small

The 4 rides index pages render a median 7,161 words at 64 page-unique (1%); the 4 dining index pages render 1,645 at 43 unique (4%). As navigation this is correct behaviour and the pages are useful. The gap is that they carry no orientation at all — a reader landing on 'All attractions at Islands of Adventure' from search gets a sorted table and no answer to 'which of these actually matter', 'how many can I realistically do', or 'what is the order'. The best-rides sibling pages do this well (96% unique) but a reader arriving at the index does not know the best-rides page exists. Flagged as medium rather than high because the raw counts are healthy and the fix is small.

**Content needed** — ~250-400 words at the top of each index: how many attractions this park really has vs. how many a normal day fits, the tier breakdown in plain language, the two or three that define the park, what to skip on a first visit, and a pointed hand-off to the best-rides / best-snacks page. Same shape for dining, keyed to service tier and where the good food actually is.

**Code change** — Add an index intro field to data/universal/parks/*/park.json; render in the rides and dining index generators in src/pages/park.mjs and src/pages/dining.mjs.

<sub>Evidence: Page-unique of rendered: rides index — USH 51/5,897, Epic 58/5,178, IOA 64/7,292, USF 73/7,161. Dining index — USH 38/1,223, Epic 42/1,069, IOA 43/1,699, USF 44/1,645. Contrast best-rides median 4,597 unique of 4,928 rendered.</sub>

### Five event-edition pages carry 99-136 page-unique words each

**⚪ LOW** · effort: small

The /events/<slug>/2025/ pages render 367-407 words of which only 99-136 are unique to the page; the rest is the shared 'How the event works' pattern block and cross-links repeated on all five. The thinness is deliberate and defensible — the pages exist to say 'we will not print dates nobody has published' and they say it well. But they are indexable, they are the pages that will rank for 'HHN 2025 dates', and a ~120-unique-word page is a genuine thin-content signal regardless of how principled the reason is. The honest fix is not to invent dates but to publish the retrospective the site already has the standing to write: what the last confirmed cycle actually was.

**Content needed** — Per edition, ~400-600 words of retrospective on the last confirmed cycle, which is verifiable history rather than unannounced future: how the run length and house count moved against prior years, where per-night pricing actually landed, what sold out and when, what the event Express Pass did, and what that pattern implies for planning — explicitly framed as pattern, not schedule. That doubles the page without printing a single unannounced fact.

**Code change** — Extend the edition schema in data/universal/seasonal/events/*.json with a retrospective block and render it in src/seasonal/events.mjs.

<sub>Evidence: Page-unique words: /events/halloween-horror-nights-hollywood/2025/ 99 of 370 rendered; halloween-horror-nights-orlando/2025/ 109 of 386; grinchmas-at-universal-hollywood/2025/ 123 of 380; universal-orlando-mardi-gras/2025/ 131 of 367; holidays-at-universal-orlando/2025/ 136 of 407. Median 123 unique. Median boilerplate 114 words.</sub>

### No glossary, on a site that uses eight pieces of operator jargon thousands of times

**⚪ LOW** · effort: small

There is no glossary page anywhere in the 251-page build. The site leans hard on terms a first-time Universal visitor does not know and that mean different things at different operators: 'single rider' appears 534 times, 'mobile order' 258, 'virtual line' 90, 'Early Park Admission' 77, 'rope drop' 66, plus Express Pass, park-to-park, child swap and Power-Up Band throughout. Each has a dedicated guide page, which is the right depth for someone who already knows they need it — but there is no single page that lets a confused reader decode a sentence. This is cheap, requires zero unverifiable facts, and is a classic bookmark-and-return page.

**Content needed** — A ~1,200-1,500 word /glossary/ page: 25-35 terms, each with a two-to-three sentence definition, an explicit note where Universal's meaning differs from Disney's (Express Pass vs Lightning Lane, Early Park Admission vs Early Entry, virtual line vs boarding group), and a link to the full guide where one exists. Every entry is definitional, so nothing has to be forecast or invented.

**Code change** — New data/universal/glossary.json plus a small generator in src/pages/docs.mjs and a footer nav entry.

<sub>Evidence: grep -ril 'glossary' dist/universal --include=*.html → no results. Whole-site occurrence counts: 'single rider' 534, 'mobile order' 258, 'virtual line' 90, 'Early Park Admission' 77, 'rope drop' 66, 'park hours' 13.</sub>

### No 'what changed' page, despite the site holding the data to build one honestly

**⚪ LOW** · effort: medium

349 records carry a verified date and the build reports 35 freshness ribbons, 24 'expected' and 5 'historical' confidence items, and 0 pages past review. A reference site whose distinguishing claim is dated verification is exactly the kind of site people subscribe to for changes — and there is no page that says what changed. Weakened as a finding by the fact that all 349 records currently carry the identical date 2026-07, so the page would launch with one entry; this is infrastructure for the second update cycle rather than a gap that hurts today. Worth building before the first re-verification pass rather than after, because the data to populate it retroactively will not exist otherwise.

**Content needed** — A /updates/ page generated from verification-date deltas: what was re-checked this cycle, which prices moved and by how much, which confidence levels changed, what was added. Prose is one line per change plus a short editor's note per cycle — no forecasting, entirely a record of work already done.

**Code change** — Requires retaining prior verified values (a checked-in snapshot per cycle) so deltas can be computed; then a generator in src/pages/docs.mjs.

<sub>Evidence: Across data/universal/parks/*/{attractions,dining,food}.json: 349 records carry lastVerified or priceVerified, distinct values = ['2026-07'] only. No /changelog/, /updates/, /whats-new/ or /news/ route in the 251-page build. Build output reports 'confidence: 0 confirmed, 24 expected, 5 historical' and '35 freshness ribbons'.</sub>

## 1.3 · Universal-operator-specific asset and data gaps (data/universal vs data/disney, file by file)

> **All four Universal parks lack map.json and PNG plates, so their map pages render a generic 2-marker wedge diagram against Disney's 115 hand-placed markers — and a 40-page seasonal section that already exists is orphaned because universal's nav declares zero links into it.**

### All four Universal parks lack map.json — map pages fall back to a generic wedge diagram

**🔴 BLOCKER** · effort: large

data/universal/parks/*/map.json does not exist for any of the four parks; data/disney/parks/*/map.json exists for all six. src/lib/data.mjs:179 sets park.map = null, and src/lib/map.mjs:204 falls back to syntheticMap(park) — a hub-and-spoke wedge derived only from the declared land order. The rendered result is honest but nearly empty: each universal map SVG carries 2 marker elements (the synthetic entrance only, src/lib/map.mjs:107) and zero paths and zero water, against Disney's 19-21 markers per park. Disney's six map.json files collectively author 40 land polygons, 115 markers (6 entrances, 51 headliners, 27 dining, 31 attraction), 35 walkway paths and 9 water bodies. Universal needs polygons for 27 declared lands (epic-universe 5, islands-of-adventure 8, universal-studios-florida 9, universal-studios-hollywood 5). A map.json needs: park (slug), viewBox ([0,0,1000,1000]), note (the not-to-scale disclaimer), water[] and paths[] as {points:[[x,y],...]}, lands[] as {slug matching park.json lands, label, points[], labelAt:[x,y]}, and markers[] as {slug matching an attraction or dining slug, kind: entrance|headliner|attraction|dining, at:[x,y]}. Geometry must be derived from OpenStreetMap or aerial imagery, never traced from an official park map (docs/LAUNCH-UNIVERSAL.md:153).

**Content needed** — Four map.json files authoring 27 land polygons plus roughly 19 markers per park (~76 markers total) with viewBox, labelAt, walkway paths and water bodies, geometry sourced from OpenStreetMap/aerial imagery.

**Code change** — None — src/lib/map.mjs already consumes map.json and falls back cleanly. This is pure data authoring.

<sub>Evidence: find data/universal -name map.json → 0 results; find data/disney -name map.json → 6. node scripts/validate.mjs universal warns 4x "map.json: not authored yet — the build will fall back to a generic land diagram". Rendered: dist/universal/*-map.svg markers=2 landshapes=5..9 paths=0 water=0 vs dist/disney/*-map.svg markers=19..21.</sub>

### Zero map PNG plates for Universal — the Download PNG button is absent on all four map pages

**🔴 BLOCKER** · effort: small

assets/img/maps/ holds 12 PNGs covering the six Disney parks (a 1x and a @2x per park, e.g. epcot-map.png plus epcot-map@2x.png, 1.2-5.1 MB each) and a GENERATED.json recording files:6, images:12. There is no universal-* plate. src/lib/data.mjs:186 probes assets/img/maps/<slug>-map@2x.png and sets park.hasMapPng, which src/pages/park.mjs:940 uses to decide whether to offer the PNG download — so all four Universal map pages ship without it while all six Disney pages have it. The PNG plate is a raster convenience export rendered by scripts/render-map-pngs.mjs (Playwright) from the SVG the build already writes to dist/<op>/maps/, so it is strictly downstream of map.json: rendering now would only produce four rasterised generic wedge diagrams.

**Code change** — None. Run `npm run maps:png` (scripts/render-map-pngs.mjs) after map.json exists.

<sub>Evidence: ls assets/img/maps/ → 12 PNGs, all disney slugs, plus GENERATED.json {files:6, images:12}. grep -rl 'Download PNG' dist/universal/ → 0 pages; dist/disney/ → 6 pages. node scripts/audit.mjs universal → 4 notes, one per park: "maps: <slug> has no PNG plate — run npm run maps:png".</sub>

### 40 of 251 Universal pages (the whole seasonal section) are orphaned — nav declares zero links into them

**🟠 HIGH** · effort: trivial

data/universal/site.json builds nav.primary (6 links) and nav.footer (4 groups, 16 links) = 22 nav links, and not one points at /when-to-go/, /calendar/, /events/, /prices/, /holidays/, /closures/ or /tools/trip-timing/. Disney's site.json links all of them (primary carries /when-to-go/, /events/, /prices/; footer carries /when-to-go/, /calendar/, /events/, /prices/, /tools/trip-timing/ and both /closures/<resort>/ pages). The pages are built and identical in kind — universal ships calendar 1, when-to-go 13, events 11, prices 6, holidays 6, closures 3 = 40 pages — but they are reachable only from scattered body cross-links. Universal's footer also omits its two closure trackers and the Trip timing tool, both of which Disney's footer carries.

**Content needed** — Add the seasonal routes to nav.primary and a "Plan your visit" footer group in data/universal/site.json, mirroring data/disney/site.json lines 178-323, plus /closures/universal-orlando/, /closures/universal-hollywood/ and /tools/trip-timing/.

**Code change** — None — data-only change in data/universal/site.json.

<sub>Evidence: Inbound page counts, universal vs disney: /calendar/ 3 vs 379; /when-to-go/ 15 vs 379; /events/ 11 vs 379; /prices/ 6 vs 379; /tools/trip-timing/ 4 vs 379; /holidays/ 5 vs 5; /closures/ 3 vs 3. Nav hrefs dumped from data/universal/site.json nav.primary and nav.footer contain none of these routes.</sub>

### Two unresolved reference CONFLICTS block the operator from leaving draft status

**🟠 HIGH** · effort: trivial

scripts/reference/universal.mjs:223 records two rows where the blind reference table and the dataset disagree, and test/operators.test.mjs refuses to let the operator go live while CONFLICTS is non-empty. Row 1: islands-of-adventure, Skull Island: Reign of Kong, heightIn — table 34, dataset 36 (I confirmed the dataset value is 36). Resolving fact: Universal Orlando's own published minimum height for Skull Island: Reign of Kong, taken from the park's official site or app or the sign at the ride entrance — not an aggregator. Row 2: epic-universe, Yoshi's Adventure, heightIn — table 34, dataset null with a heightNote reading "Any minimum here is low or supervision-based and is not verified for this edition — confirm at the sign by the entrance." Resolving fact: whether Yoshi's Adventure at Epic Universe posts a numeric minimum height at all, and if so what it is, from Universal's official Epic Universe attraction listing. Each row is deleted, not edited, once the real figure is known; the fact checker reports a row that no longer matches as stale.

**Content needed** — Two real-world height figures from Universal's own published source, then delete the corresponding rows from CONFLICTS.

<sub>Evidence: node scripts/factcheck.mjs universal → "universal reference: 2 unresolved source conflicts — this operator cannot go live until they are settled by a human", plus both UNRESOLVED rows printed in full. scripts/reference/universal.mjs:223-240; docs/LAUNCH-UNIVERSAL.md:42-45.</sub>

### Express Pass coverage cannot be counted as confirmed-vs-inferred — the schema has no provenance field, and the launch doc's own figure is wrong

**🟠 HIGH** · effort: medium

The audit asked how many Epic Universe attractions are marked by inference vs confirmed. That distinction is not recorded anywhere in the data: the attraction schema has a lightningLane field with values multi-pass / single-pass / none and no companion confidence, source or verified field, so every value is indistinguishable from every other. The only provenance statement is prose in docs/LAUNCH-UNIVERSAL.md:91, and it is numerically wrong — it says "Epic Universe is the worst case — 15 of its 21 attractions are set multi-pass on inference alone", but the dataset has 13 multi-pass and 8 none across 21 attractions. Site-wide the split is 57 multi-pass and 50 none across 107 attractions (epic-universe 13/8, islands-of-adventure 16/14, universal-studios-florida 15/16, universal-studios-hollywood 13/12). Nothing is marked single-pass anywhere, even though data/universal/site.json:25 defines a single-pass label ("Universal Express Unlimited"), so the site never renders that tier despite selling it as a distinct product in the Express Pass guide. scripts/reference/universal.mjs:117 asserts exactly one queue fact (hagrid → none), so the fact checker is silent on the other 106.

**Content needed** — Universal's published per-park Express Pass attraction list, checked against all 107 values; correct the figure at docs/LAUNCH-UNIVERSAL.md:91; decide whether any attraction belongs in the single-pass tier.

**Code change** — Optional but recommended: add a per-attraction provenance field (e.g. lightningLaneSource: 'confirmed'|'inferred') to the attraction schema in scripts/validate.mjs so the confirmed-vs-inferred split becomes countable rather than living in prose. Shared schema — blast radius covers disney too.

<sub>Evidence: Counted from data/universal/parks/*/attractions.json: epic-universe multi-pass 13 / none 8 of 21; totals 57/50 of 107; single-pass count 0. docs/LAUNCH-UNIVERSAL.md:91 claims 15 of 21. scripts/reference/universal.mjs:117-123 QUEUE_ASSIGNMENT contains one entry.</sub>

### Epic Universe: 14 of 21 attractions carry no height figure, and the fact checker asserts only 4

**🟠 HIGH** · effort: medium

Epic Universe has heightIn set on 7 of 21 attractions (33%). Among its ride-type attractions specifically, Constellation Carousel, Yoshi's Adventure, Dragon Racer's Rally and Fyre Drill all have heightIn null. scripts/reference/universal.mjs:74 asserts only four Epic Universe heights (stardust racers 48, mario kart 40, mine-cart madness 42, yoshi 34) and says so deliberately, which means the fact checker is silent about 17 of the park's 21 attractions. Coverage across the other three parks is better but still partial: islands-of-adventure 14/30, universal-studios-florida 9/31, universal-studios-hollywood 9/25 — 39 of 107 site-wide. This is the highest-stakes gap on the site because Universal's thrill tier starts where Disney's tops out (PLAUSIBLE_HEIGHTS runs to 54in vs Disney's ceiling), and an absent height renders as "not stated".

**Content needed** — Published minimum heights for every Universal attraction, taken from each park's official site or app; heights that cannot be confirmed stay absent rather than guessed, per docs/LAUNCH-UNIVERSAL.md:80.

<sub>Evidence: Counted from data/universal/parks/*/attractions.json: heightIn present epic-universe 7/21, islands-of-adventure 14/30, universal-studios-florida 9/31, universal-studios-hollywood 9/25 = 39/107. scripts/reference/universal.mjs:74-79 lists 4 Epic Universe entries. docs/LAUNCH-UNIVERSAL.md:74-76.</sub>

### Both Universal closure trackers publish zero items while the park data records three permanent closures

**🟡 MEDIUM** · effort: small

data/universal/seasonal/closures/universal-orlando.json and universal-hollywood.json both have items: [] — the pages render an explicitly-reasoned empty tracker ("This tracker is empty as of July 2026..."). Disney's equivalents carry 9 items (walt-disney-world.json) and 6 (disneyland.json) with the schema {name, parkSlug, attractionSlug, status, since, reopening, reopeningConfidence, note}. Meanwhile the Universal park data already knows about three permanently closed attractions, each with an authored closedNote: Poseidon's Fury and The Eighth Voyage of Sindbad Stunt Show (islands-of-adventure) and The Walking Dead Attraction (universal-studios-hollywood). So two files in the same operator disagree about whether anything is closed. scripts/reference/universal.mjs:179 MUST_BE_CLOSED is likewise empty, which docs/LAUNCH-UNIVERSAL.md:116 calls "a hole, not a clean bill of health".

**Content needed** — Populate both trackers from the three closures already documented in the park data plus any 2025/26 refurbishment closures, then fill MUST_BE_CLOSED in scripts/reference/universal.mjs.

<sub>Evidence: data/universal/seasonal/closures/*.json items arrays are both length 0; data/disney/seasonal/closures/walt-disney-world.json has 9 items, disneyland.json has 6. Three attractions with status !== 'open' found in data/universal/parks/*/attractions.json. scripts/reference/universal.mjs:179.</sub>

### Seasonal events: 5 files vs Disney's 14, and two events named in the leak-guard have no page to own them

**🟡 MEDIUM** · effort: medium

data/universal/seasonal/events/ holds 5 files totalling 87,414 bytes; data/disney/seasonal/events/ holds 14 totalling 272,587 bytes — a 3.1x content gap, and the single largest seasonal disparity between the operators (months 12 vs 12, holidays 5 vs 5, prices 5 vs 5 are all at parity). Editions follow: 5 vs 13. Separately, scripts/reference/universal-seasonal.mjs:255 lists SEASONAL leak-guard needles including 'rock the universe' and 'christmas in the wizarding world', but neither has an event file — so evergreen pages are forbidden from mentioning them while no seasonal page exists to be their canonical owner. Note that scripts/reference/universal-seasonal.mjs:22 EVENTS enforces a strict two-way contract (every slug listed must have a data file and vice versa), so adding an event is a deliberate two-file commit.

**Content needed** — Event pages for Rock the Universe and Christmas in the Wizarding World at minimum, each added to both the data directory and the EVENTS/WINDOWS tables in scripts/reference/universal-seasonal.mjs.

<sub>Evidence: ls counts: data/universal/seasonal/events 5 files / 87,414 B vs data/disney/seasonal/events 14 files / 272,587 B. Editions counted from the files: 5 vs 13. scripts/reference/universal-seasonal.mjs:22-28 lists exactly the 5 existing slugs; SEASONAL at line 255 names 8 needles.</sub>

### data/universal/site.json has no podcast block at all

**🟡 MEDIUM** · effort: trivial

data/disney/site.json:356-367 declares a 10-field podcast scaffold: note, title ("Ride Ready Monthly"), description, author, email, category ("Society & Culture"), subcategory ("Places & Travel"), artwork, audioBase, episodes[]. data/universal/site.json has no podcast key whatsoever. The practical difference today is smaller than it looks: src/lib/podcast.mjs:116 returns null unless both audioBase and email are non-empty, and Disney's are empty strings with episodes: [], so neither operator ships a podcast.xml and neither emits the <link rel="alternate"> at src/templates/layout.mjs:53. The gap is therefore the authored editorial scaffold, not a live feed. To reach parity Universal needs the same block with brand-appropriate title, description and author; to actually publish, it additionally needs a real email, an audioBase URL, artwork, and per-episode entries carrying {month, file, bytes, durationSeconds, published:'YYYY-MM-DD'} — src/lib/podcast.mjs:83-88 drops any episode missing a positive byte length or duration, which is the deliberate check that the audio file really exists.

**Content needed** — A podcast block in data/universal/site.json mirroring the Disney scaffold, with Hollywood Ride Guide title/description/author and empty email/audioBase/episodes until audio exists.

<sub>Evidence: data/disney/site.json:356 "podcast" key present with 10 fields; grep for 'podcast' in data/universal/site.json → no match. src/lib/podcast.mjs:116 `if (!config.audioBase || !config.email) return null`. Neither dist/disney/podcast.xml nor dist/universal/podcast.xml is written.</sub>

### Two cross-link roles resolve to null, dropping accessibility and rope-drop links Universal has no guide for

**🟡 MEDIUM** · effort: medium

data/universal/site.json:39,41 set crossLinks.guides.ropeDrop and .accessibility to null because no equivalent guide exists. src/lib/data.mjs:343-350 resolves those to null and the link components drop them, so src/pages/park.mjs:744 ("Accessibility, explained") and src/pages/park.mjs:858 ("Rope drop strategy") render nothing on Universal park pages while rendering on Disney's. Disney's disability-access-service guide is linked from 10 pages and rope-drop-strategy from 29. The accessibility hole is the more serious of the two: Universal ships 4 park-level accessibility pages, and data/universal/site.json:58 warns that Universal's assistance programme "requires advance registration" and that "registering late is the failure mode — it is not something you can arrange at the gate on the day" — but there is no site-wide guide page that owns that advice. Overall guides are 11 vs Disney's 12; Universal has 6 topics Disney lacks (child-swap, express-pass, first-universal-trip, park-to-park-tickets, single-rider, virtual-line) and lacks 3 that map to real Universal equivalents (accessibility/attraction assistance, rope-drop strategy, park etiquette).

**Content needed** — A Universal attraction-assistance guide (the highest value, given the advance-registration warning already in site.json) and a rope-drop/early-entry guide, then point the two null crossLinks roles at them.

<sub>Evidence: data/universal/site.json:39,41 both null. src/pages/park.mjs:744 and :858 consume data.link.accessibility / data.link.ropeDrop. Inbound counts on disney: /guides/disability-access-service/ 10 pages, /guides/rope-drop-strategy/ 29 pages. Guides: 11 universal files vs 12 disney.</sub>

### Epic Universe: singleRider false on all 21 attractions and durationMinutes absent on all 21

**🟡 MEDIUM** · effort: small

Two fields are uniformly blank at Epic Universe in a way they are not at the other three parks. singleRider is false on 21 of 21, set conservatively because none could be verified — against islands-of-adventure 6 true, universal-studios-florida 6 true, universal-studios-hollywood 5 true. docs/LAUNCH-UNIVERSAL.md:93 flags this as blocking and notes that Universal's single-rider lines are one of its genuine advantages over Disney, so a blanket false understates the product and costs readers queue time. Separately durationMinutes is absent on all 21 Epic Universe attractions while the other parks have it on 30/30, 31/31 and 19/25 — the field is in the schema and populated everywhere else, so Epic Universe is the only park where ride length never renders.

**Content needed** — Per-attraction single-rider availability and ride durations for the 21 Epic Universe attractions, from Universal's published listings.

<sub>Evidence: Counted from data/universal/parks/*/attractions.json: epic-universe singleRider true 0 / false 21, durationMinutes present 0/21; islands-of-adventure 6 true and 30/30 durations; universal-studios-florida 6 true and 31/31; universal-studios-hollywood 5 true and 19/25. docs/LAUNCH-UNIVERSAL.md:93-96.</sub>

### Attraction inventories run 45 short of the validator's own target, concentrated at Epic Universe and Hollywood

**🟡 MEDIUM** · effort: large

scripts/validate.mjs:296 sets a target of 38 attractions per park and warns below 30; line 320 targets 22 dining and warns below 18. Universal totals 107 attractions against a 152 target (45 short): epic-universe 21, universal-studios-hollywood 25, islands-of-adventure 30, universal-studios-florida 31. Two trip the warning threshold. Dining is 84 against 88 (epic-universe 15 is 7 short and warns; islands-of-adventure 26, universal-studios-florida 25, universal-studios-hollywood 18). Food is the one category that is over target, 158 against 128. Per-park density against Disney is 26.8 attractions/park vs 46.3 and 21.0 dining/park vs 32.0 — some of that is genuine (Universal's parks are smaller), but Epic Universe at 21 attractions is thin for a full-size park that opened in May 2025. Separately islands-of-adventure declares a "port-of-entry" land with zero attractions assigned, so that land page renders empty.

**Content needed** — Roughly 45 additional attraction records and 7 Epic Universe dining records, plus at least one attraction assigned to islands-of-adventure's port-of-entry land.

<sub>Evidence: node scripts/validate.mjs universal → 8 warnings including "epic-universe/attractions.json: only 21 attractions — the target is 38 or more", "epic-universe/dining.json: only 15 dining locations — the target is 22 or more", "universal-studios-hollywood/attractions.json: only 25 attractions — the target is 38 or more", "islands-of-adventure/park.json lands[\"port-of-entry\"]: land \"port-of-entry\" has no attractions assigned to it". Thresholds at scripts/validate.mjs:296,320,356.</sub>

### Virtual Line is a documented Universal product but zero attractions are marked as using it

**⚪ LOW** · effort: small

Universal genuinely runs a Virtual Line product — data/universal/guides/virtual-line.json is an authored guide, and scripts/reference/universal.mjs:133 sets VIRTUAL_QUEUE_ALLOWED = ['hagrid'] precisely because an empty list would be wrong here (unlike Disney). But virtualQueue is true on 0 of 107 Universal attractions, including Hagrid's, the one the reference table explicitly permits. So the guide describes a product the attraction data never surfaces on any ride page, and the allow-list guards a value nothing sets. docs/LAUNCH-UNIVERSAL.md:141-147 lists establishing the real 2026 Virtual Line policy — especially at Epic Universe — as a blocking gate.

**Content needed** — Universal's standing 2026 Virtual Line attraction list per park, set virtualQueue accordingly, and expand VIRTUAL_QUEUE_ALLOWED to exactly those.

<sub>Evidence: grep -rn '"virtualQueue": true' data/universal/ → 0 matches across 107 attractions. scripts/reference/universal.mjs:133 VIRTUAL_QUEUE_ALLOWED = ['hagrid']. data/universal/guides/virtual-line.json exists. docs/LAUNCH-UNIVERSAL.md:141.</sub>

### meta.twitterSite is empty, so no Universal page emits a twitter:site tag

**⚪ LOW** · effort: trivial

data/universal/site.json:17 sets meta.twitterSite to an empty string; data/disney/site.json:16 sets "@rideready". The consequence is that the twitter:site meta tag is absent from all 251 Universal pages and present on all 379 Disney pages. This is a launch-operational gap of the same class as docs/LAUNCH-UNIVERSAL.md:176 (corrections address must be provisioned and reachable): it needs a real social account to exist for hollywoodrideguide.com before the field can be filled, so it is blocked on an external provisioning step rather than on writing.

**Content needed** — A provisioned social handle for hollywoodrideguide.com, then set meta.twitterSite.

<sub>Evidence: grep -o 'twitter:site[^>]*' dist/universal/index.html → no match; dist/disney/index.html → content="@rideready". data/universal/site.json:17 "twitterSite": "".</sub>

### universal-hollywood resort points at a Disney-named affiliate key, and universal-orlando declares none

**⚪ LOW** · effort: trivial

data/universal/site.json:173 sets the universal-hollywood resort's ticketAffiliate to "packagesDisneyland" — a key copied verbatim from data/disney/site.json:174. It resolves and renders (the affiliates block redefines packagesDisneyland as Get Away Today "Southern California ticket and hotel packages, including Universal Studios Hollywood", and it renders on 3 pages via src/pages/park.mjs:833 and src/pages/core.mjs:393), so this is not broken output — but a key literally named packagesDisneyland inside the Universal operator's data is a maintenance trap, the kind of leftover that survives a rename and later reads as a copy-paste bug. Separately the universal-orlando resort has no ticketAffiliate at all, so it silently falls back to the generic 'tickets' affiliate, meaning the resort carrying three of the four parks gets the less specific offer.

**Code change** — Rename the affiliate key in data/universal/site.json (both the affiliates entry and the resort reference) to something operator-neutral such as packagesSoCal; optionally add a ticketAffiliate to universal-orlando.

<sub>Evidence: data/universal/site.json:173 "ticketAffiliate": "packagesDisneyland"; data/disney/site.json:174 identical key. universal-orlando resort block (data/universal/site.json:94-134) has no ticketAffiliate. grep -rl 'Get Away Today' dist/universal/ → 3 pages. Fallback logic at src/pages/park.mjs:833 and src/pages/core.mjs:393.</sub>

### universal-orlando is the only resort on either site with no "When to go" practical block

**⚪ LOW** · effort: trivial

Both Disney resorts declare four practical entries ending in "When to go", and universal-hollywood does too. universal-orlando instead spends its fourth slot on "Express Pass, and whether to buy it" and has no seasonal timing entry — so the resort covering three of the four parks never tells a reader on its overview page when to visit. This compounds the orphaned-seasonal-section finding: the resort page is exactly where a reader would expect the handoff into /when-to-go/, and neither the practical block nor the nav provides one.

**Content needed** — A "When to go" practical entry for the universal-orlando resort covering Florida seasonality (Halloween Horror Nights season, summer heat, holiday peaks), linking to /when-to-go/.

<sub>Evidence: data/universal/site.json:115-132 universal-orlando practical[] = Getting there, Getting around, How many days, Express Pass. data/universal/site.json:155-172 universal-hollywood practical[] ends with "When to go". data/disney/site.json:115-132 and :156-173 both end with "When to go".</sub>

### Photo declarations are at parity with Disney — the gap is files on disk, and it is shared, not Universal-specific

**⚪ LOW** · effort: medium

Answering the lens question directly: Disney does not declare more photos than Universal. Both site.json files declare exactly two, hero and social, with identical shapes (file, alt, width, height, widths[], focal on hero, note). Disney's hero is hero-fireworks, Universal's is hero-coaster-night, and both social entries are social-card at 1280x672. assets/img/photos/ contains only README.md, so src/lib/data.mjs:370-380 resolves both keys to null for both operators and site.socialImage is null on both — og:image appears on 0 pages of either site and twitter:card falls back to "summary" on both. Neither site renders a single <picture> element. So there is no Universal-specific photo declaration gap; the deficit is the zero image files, and closing it for Universal means two images that must satisfy the hard legal constraints (no Universal characters, ride vehicles, logos or wordmarks; no real people; no incidental three-circle silhouette) and the performance cap (hero 120 KB at 1920 AVIF, everything else 80 KB, since the home page claims the tools work on park WiFi). Worth noting for scope: there is exactly one data.photo call site in all of src/ (src/pages/core.mjs:92, the home hero), so across Universal's 251 pages exactly one page can display a photograph today — that is shared-code behaviour affecting both operators, not a Universal data gap.

**Image needed** — Two Universal-brand images: (1) hero-coaster-night, an atmospheric night silhouette of a generic roller coaster against sky, no licensed property, no characters, no identifiable faces, delivered at 640/1280/1920 in AVIF/WebP/JPG with the 1920 AVIF under 120 KB; (2) social-card at 1280x672 (1.91:1) for Open Graph, under 80 KB. Both must avoid any three-circle silhouette, any castle, any ride vehicle resembling a real Universal attraction, and any wordmark.

<sub>Evidence: data/disney/site.json:60-85 and data/universal/site.json:61-86 each declare exactly 2 photo keys (hero, social). ls assets/img/photos/ → README.md only. grep -c 'og:image' → 0 in both dist/universal/index.html and dist/disney/index.html; twitter:card content="summary" in both; grep -c '<picture' → 0 in both.</sub>

## 1.4 · Social, SEO, and machine-readable surfaces

> **The structured-data layer is genuinely excellent (251/251 unique titles and descriptions, 248 BreadcrumbList, 153 FAQPage, 62 TouristAttraction, 47 Restaurant, 45 Menu), but 19 pages ship a competitor's brand in the title tag, 251 pages ship zero og:image, and the browser-tab icon is the other operator's monogram — all while `node scripts/audit.mjs universal` exits 0 with "No problems found".**

### 19 pages ship a Disney-branded <title> on hollywoodrideguide.com

**🔴 BLOCKER** · effort: medium

Six seasonal page families hard-code the Disney operator's brand into the single highest-value SEO field. The 12 month pages render `<title>Disney parks in May: Crowds, Weather, Cost | Hollywood Ride Guide</title>`; /events/ renders "Seasonal events at the US Disney parks"; /prices/ renders "Disney parks prices: Tickets, Lightning Lane, Parking" (Lightning Lane is a Disney product that does not exist at Universal); /holidays/, /closures/ and /calendar/ are the same shape. The H1s match the titles, so this is not a meta-only slip — the pages are Disney pages wearing a Universal masthead. Twenty-four meta descriptions carry the same defect ("Is May a good time to visit Walt Disney World or Disneyland?"), and the wrong brand propagates into og:title, og:description and the WebPage/Article JSON-LD `name`/`headline` on every one of them. These are ~10% of the site and include /prices/ and /when-to-go/, two of the highest commercial-intent families. Note the legitimate cases are correctly excluded: /compare/universal-vs-disney-orlando/ and the guides that reference Disney comparatively are properly written and should not be touched. Fix requires operator-scoped copy, not a find-and-replace — the month pages need Universal-specific framing, since "Is May a good time to visit Universal Orlando or Universal Studios Hollywood?" is a different editorial claim.

**Content needed** — Universal-voiced replacements for 19 titles and 24 descriptions across /when-to-go/{12 months}/, /events/, /prices/, /holidays/, /closures/, /calendar/, and the 5 legal pages (about, privacy, terms, contact, affiliate-disclosure), plus the matching H1s.

**Code change** — Move the hard-coded title/description strings out of src/seasonal/months.mjs, events.mjs, reference.mjs, core.mjs and src/pages/legal.mjs into data/<operator>/ (or derive them from site.brand/site.resorts), so neither operator can inherit the other's copy. Blast radius: shared code — the Disney build reads correctly today only because these strings happen to be its own.

<sub>Evidence: src/seasonal/months.mjs:141,143,152; src/seasonal/events.mjs:331,338; src/seasonal/reference.mjs:120,257,368; src/seasonal/core.mjs:76; src/pages/legal.mjs:83,352,415,531,607. Counted in dist/universal: 19 wrong-subject <title>, 24 wrong-subject meta description (comparison pages excluded).</sub>

### Closures resort pages emit a raw URL slug as their title, description and Article headline — and contradict their own breadcrumb

**🔴 BLOCKER** · effort: trivial

`RESORT_LABEL` is a hard-coded three-entry Disney lookup (`walt-disney-world`, `disneyland`, `both`). Universal's slugs miss it and fall through to `|| tracker.resort`, so /closures/universal-orlando/ ships `<title>universal-orlando closures: Refurbishment Tracker</title>`, the meta description "Attractions closed for refurbishment at universal-orlando…", a WebPage `name` of "universal-orlando closures" and an Article `headline` of "universal-orlando closures". The same page's BreadcrumbList says "Universal Orlando" correctly, because breadcrumbs are built by a different, operator-agnostic resolver (src/lib/seasonal-data.mjs:170 reads `resortBySlug.get(slug).shortName`). Two JSON-LD nodes on one page disagree about the entity's name. The same map also leaks 37 raw slugs as visible table cells on /prices/ (`<td data-label="Resort">universal-orlando</td>`). The correct resolver already exists in the codebase, so this is a substitution, not new logic.

**Code change** — Delete RESORT_LABEL in src/seasonal/reference.mjs:18 and resolve resort labels through the existing `resortBySlug.get(slug).shortName` path already used by src/lib/seasonal-data.mjs:170. Affects 2 closures pages, /prices/, and /closures/ index. Shared code, but Disney's slugs happen to hit the table so its output is unchanged.

<sub>Evidence: src/seasonal/reference.mjs:18 `const RESORT_LABEL = { 'walt-disney-world': …, disneyland: …, both: … }`, used at :241, :284, :353. Rendered: dist/universal/closures/universal-orlando/index.html WebPage name "universal-orlando closures" vs CRUMBS ['Home','Closures','Universal Orlando']. 24 + 13 raw slugs in dist/universal/prices/index.html.</sub>

### Zero og:image across all 251 pages — every share falls back to a text-only card carrying the wrong brand's favicon

**🟠 HIGH** · effort: small

`site.socialImage` resolves to null (src/lib/data.mjs:389) because `assets/img/photos/` contains only README.md, so layout.mjs:44-50 takes the else branch and every page emits `<meta name="twitter:card" content="summary">` with no og:image, no twitter:image, no og:image:alt. Verified: 0 of 251 pages have og:image; twitter:card is "summary" on 251/251. On X a summary card with no image shows the favicon; on Facebook, LinkedIn and Slack the unfurl is a bare title/description strip. The important consequence: the only image any social platform can currently show for a Hollywood Ride Guide link is /assets/img/favicon.svg — which is the Ride Ready Guide monogram in the Disney palette (see the icon finding). The fallback behaviour itself is correct and should be preserved; what is missing is any real card to fall back from.

**Image needed** — One default 1200x630 brand card for Hollywood Ride Guide: the navy #1b3a5c ground, the 'HR' brandmark or the measuring-stick device recoloured to the Universal palette, the wordmark 'Hollywood Ride Guide', the line 'Independent & unofficial', and the four stat figures the home page already shows (104 attractions / 39 height requirements / 158 snacks / 84 places to eat). Flat colour and type only — no park imagery, no ride vehicles, no characters, no castle. Ships as JPEG or PNG (see the format-trap finding), well under 120 KB.

**Code change** — None required for the default card — dropping `social-card-1280.jpg` (and -640) into assets/img/photos/ activates the existing path. Per-page cards do need code: see the card-system finding.

<sub>Evidence: src/templates/layout.mjs:44-50; src/lib/data.mjs:389; scan of dist/universal: `pages with og:image: 0`, `twitter:card values: {"summary":251}`. assets/img/photos/ contains 1 file (README.md).</sub>

### The social-card resolver accepts AVIF/WebP on disk but always emits a .jpg URL — an AVIF-only card ships a 404 og:image

**🟠 HIGH** · effort: trivial

The photo existence check in src/lib/data.mjs probes `social-card-1280.avif` OR `.webp` OR `.jpg` and marks the photo real if any one exists, but src/lib/data.mjs:389 then hard-codes the URL as `${origin}/assets/img/photos/${social.file}-1280.jpg`. Since the rest of the pipeline is AVIF-first (hero caps are stated in AVIF, and components.mjs:178-179 lists AVIF and WebP sources ahead of the JPEG), the natural way to produce this asset is AVIF — which would pass the existence check, flip every page to `twitter:card=summary_large_image`, and point 251 pages at a file that does not exist. Facebook, X, LinkedIn and Slack scrapers do not accept AVIF regardless, so the JPEG is not optional here. The identical pattern exists in components.mjs:181 for the hero `<img src>`. This is a trap that will fire on the first person who does the obvious thing.

**Code change** — In src/lib/data.mjs, record which extension actually satisfied the existence probe and build the socialImage URL from it — or require a real `.jpg`/`.png` specifically for the `social` key and let the probe reject AVIF-only for that one entry. Also add the note to data/<op>/site.json photos.social. Shared code: affects both operators identically.

<sub>Evidence: src/lib/data.mjs:389 `site.socialImage = social ? \`${site.brand.origin}/assets/img/photos/${social.file}-1280.jpg\` : null`; existence probe accepts .avif/.webp/.jpg at the widest declared width. src/templates/components.mjs:181 has the same `.jpg`-only src.</sub>

### The favicon and all four PWA icons are the Disney operator's brand, shipped verbatim to the Universal site

**🟠 HIGH** · effort: small

`FAVICON` is a hard-coded SVG string in src/build.mjs:520-525 rendering a two-letter monogram in #0f3d2e (Ride Ready green) and #e9b264 (amber) — it is not 'HR', and it is not the navy this site declares. scripts/generate-icons.mjs hard-codes the same palette (`BRAND = [15,61,46]`) and writes to the shared assets/img/, so icon-180/192/512/maskable are all deep green. Rendering icon-512.png confirms it: green plate, amber measuring stick. Meanwhile manifest.webmanifest correctly declares `"theme_color": "#1b3a5c"` and `"background_color": "#faf8f4"`, so an installed PWA shows a navy splash behind a green icon. All four declared icon files do exist on disk and the apple-touch-icon at 180x180 is present and correctly linked, so the manifest is structurally complete — the sizes are right (192 any, 512 any, 512 maskable) and nothing is 404ing. The defect is purely that it is the wrong brand's artwork. The measuring-stick device itself is legally clean and concept-agnostic; only the palette and monogram need to change.

**Image needed** — Re-render the four PNG icons (180/192/512/512-maskable) plus the favicon SVG in the Hollywood Ride Guide palette — navy #1b3a5c ground, amber rule retained, monogram 'HR' if the letterform is kept. Same artwork concept, different colours: no new design work, and no legal exposure since the mark is a measuring stick.

**Code change** — Make scripts/generate-icons.mjs take an operator argument and read BRAND/AMBER/PAPER from data/<op>/site.json, writing to an operator-scoped output path; lift FAVICON out of src/build.mjs:520 into per-operator data or generate it from the same palette. Then namespace assets/img/ per operator or copy the operator's set at build time — currently copyAssets (src/build.mjs:527) copies the shared directory wholesale, so both operators cannot hold different icons.

<sub>Evidence: src/build.mjs:520-525 (favicon fill="#0f3d2e", fill="#e9b264"); scripts/generate-icons.mjs:17 `const BRAND = [15, 61, 46]`, :154-157 writes to assets/img/ (shared, not operator-scoped); dist/universal/manifest.webmanifest declares theme_color #1b3a5c. Visual read of assets/img/icon-512.png confirms green/amber.</sub>

### llms.txt tells answer engines the Universal site covers six Disney parks

**🟠 HIGH** · effort: trivial

Line 3 of dist/universal/llms.txt reads: "Independent, unofficial planning for the four US Universal theme parks. Covers all six US Disney theme parks: attraction inventories, height requirements…". The sentence contradicts itself inside one line, and it is the summary blockquote — the first and most-quoted line of a file whose entire purpose is telling AI answer engines what this site is. The rest of llms.txt is genuinely strong work: 118 lines, an editorial 'How to read a dated claim on this site' section that explains the confirmed/expected/historical confidence ladder and explicitly warns against restating a figure without its level, the unaffiliated statement up front, and a request to cite the specific page. That quality is exactly why the broken line matters — a machine reader that trusts the file will mis-attribute the whole site.

**Content needed** — A Universal-accurate coverage sentence for the llms.txt blockquote (the Disney build needs its own, so this becomes two strings, not one edited string).

**Code change** — Move the coverage clause at src/build.mjs:298 into data/<operator>/site.json (e.g. site.meta.coverageLine) and interpolate it. Shared code; Disney's output is correct today only by coincidence.

<sub>Evidence: src/build.mjs:298 hard-codes the string `Covers all six US Disney theme parks:` into the llms.txt summary. Rendered at dist/universal/llms.txt line 3.</sub>

### llms.txt stops at the hub level — 136 of 249 indexable URLs are absent, including every ride and restaurant page

**🟠 HIGH** · effort: small

llms.txt lists 87 distinct URLs against 249 in sitemap.xml. What is missing is precisely the differentiated data the site exists for: all 62 standalone attraction pages, all 47 restaurant pages, all 27 land pages, 6 holiday pages, 6 event pages and 3 closures pages. The park sections link to the aggregate pages (/rides/, /height-requirements/, /dining/) but never to an individual ride. An answer engine asked "what is the minimum height for Hagrid's Magical Creatures Motorbike Adventure" has no pointer to the page that answers it, and must either crawl the aggregate list or infer. The strategic bet stated in the src/build.mjs comment — that being the cited source is what matters — is undercut by omitting the citable units. The file is currently 22.8 KB; adding the 62 rides with their height figures as annotated one-liners (the summaries already exist in attractions.json) would roughly double it, which is still trivially small for this file's purpose.

**Content needed** — No new writing needed — each attraction and restaurant already carries an authored `summary` and, for rides, `heightIn`. The content decision is the annotation format, e.g. `- [Hagrid's Magical Creatures Motorbike Adventure](url): 48in minimum. A seven-launch story coaster…`, so the height figure travels with the link.

**Code change** — Extend buildLlmsTxt in src/build.mjs to emit per-park nested sections enumerating attractions (name, url, height, one-line summary) and restaurants (name, url, price tier, one-line summary). Shared code, and the Disney build benefits identically.

<sub>Evidence: dist/universal/llms.txt contains 87 unique https://hollywoodrideguide.com URLs; dist/universal/sitemap.xml contains 249 <loc> entries. Missing by family: 62 rides, 47 dining, 27 lands, 6 holidays, 6 events, 3 closures.</sub>

### The four-layer gate reports "No problems found" while every finding above ships

**🟠 HIGH** · effort: small

`node scripts/audit.mjs universal` exits 0 and prints "No problems found across 1 site" with 4 informational notes (all about missing map PNGs). validate exits 0 with 8 warnings, factcheck surfaces 13 data notes and correctly says the operator "cannot go live until [2 source conflicts] are settled by a human" — so the data gate has real teeth. The presentation gate does not: audit.mjs contains zero references to og:image or socialImage, and no check that a page's title belongs to the operator building it. It even counts "0 Event JSON-LD nodes" and prints the figure without judgement. The comment at scripts/audit.mjs:72 shows the team already reasoned about titles per-operator (for uniqueness) without asking whether the title names the right company. For a repo whose defining discipline is a gate that catches what a human would miss, the wrong brand in 19 title tags passing silently is the most important structural finding here.

**Code change** — Add to scripts/audit.mjs: (1) a foreign-brand check — fail if a page's <title>, meta description, og:title/description or JSON-LD name/headline contains another operator's brand tokens (read the other operators' site.json brand.name and park names to build the deny list), with an explicit allowlist for the intentional comparison pages; (2) a slug-shaped-title check — fail on any title/description matching /^[a-z0-9]+(-[a-z0-9]+)+/; (3) an og:image assertion — warn when socialImage is null, fail when it is set but the referenced file is absent from dist.

<sub>Evidence: `node scripts/audit.mjs universal` → exit 0, "No problems found across 1 site." `grep -c "socialImage|og:image" scripts/audit.mjs` → 0. scripts/audit.mjs:72 comment concerns title uniqueness across operators, not title ownership.</sub>

### One social card for 251 pages is the wrong shape for this site — ten generated card templates would cover it, and the renderer already exists

**🟠 HIGH** · effort: large

Even once a default card lands, layout.mjs has no per-page image slot: metaTags reads only `site.socialImage`, so all 251 pages share one card. The families that most deserve their own are the ones people actually send to each other. Ranked: (1) height requirements — 4 park pages plus /guides/height-requirements/, the single most screenshot-and-text-to-your-partner asset on the site; card depicts the height-band chart, inches as large numerals against the measuring-stick device. (2) 62 attraction pages — the ride name plus its minimum height as a giant numeral plus intensity/motion badges; all fields already in attractions.json. (3) 12 when-to-go months — the month's letter grade (A, B+, D-) as the hero, with the crowd/cost/weather triplet; grades already exist in the data. (4) 4 park pages + 2 resort hubs — the park's own schematic map plate, which is drawn from our own geometry and is legally clean. (5) 10 comparison pages — a two-column A-vs-B card ending in the one-line verdict. (6) 5 price pages — the price range with the as-of date stamped into the image, because an undated price screenshot is exactly the artefact this site exists to prevent. (7) 47 restaurant pages — name, price tier, cuisine, signature item. (8) 11 guides — title plus one-line thesis. (9) 16 event/holiday pages — name plus a confidence badge reading "expected" or "historical (2025)", never an invented date. (10) home/brand default. Critically, none of these is a photograph. Under the stated legal constraints a photographic card is close to unsourceable (no characters, no ride vehicles, no logos, no castle, no real people, and diffusion models emit three-circle silhouettes unprompted), while a typographic data card carries zero of that risk, is generated from facts the site already holds and has already fact-checked, and compresses to 20-40 KB — nowhere near the 120 KB hero cap. The machinery is already in the repo: scripts/render-map-pngs.mjs rasterises SVG through headless Chromium and is deliberately kept out of `npm run build`, and scripts/generate-icons.mjs writes real PNGs with nothing but node:zlib. A card generator follows the same out-of-build, commit-the-output pattern.

**Image needed** — Ten SVG card templates at 1200x630 in the Hollywood Ride Guide palette, populated at render time from existing data — height-chart card, attraction/height-numeral card, month letter-grade card, park map-plate card, A-vs-B comparison card, dated price-range card, restaurant card, guide card, confidence-badged event card, and the brand default. Flat colour and type; no photography, no park imagery.

**Content needed** — Per-template copy rules: what the headline field is, what the badge says, and the mandatory as-of date on any card showing a price.

**Code change** — Two changes. (1) src/templates/layout.mjs metaTags: accept `page.socialImage` (absolute URL) falling back to site.socialImage, and emit og:image:width/height from the image's own dimensions rather than the hard-coded 1280/672 at layout.mjs:46-47, plus og:image:alt. (2) A new scripts/render-social-cards.mjs modelled on render-map-pngs.mjs, kept out of `npm run build` for the same zero-dependency reason, with an audit check that the rendered cards are not older than the data they depict — mirroring the mtime check already at scripts/audit.mjs:205-214. Shared code, so both operators gain the slot.

<sub>Evidence: src/templates/layout.mjs:30-55 metaTags takes only (site, page) and reads site.socialImage; no page-level image parameter exists. Page-family counts from dist/universal: 62 attraction, 47 restaurant, 27 land, 12 month, 11 guide, 10 compare, 5 price, 4 park. scripts/render-map-pngs.mjs:1-15 documents the existing SVG→PNG rasteriser.</sub>

### 109 pages declare og:type=article but emit no Article node, so the site's two largest families carry no author or publisher attribution

**🟡 MEDIUM** · effort: small

172 pages set og:type=article; only 63 emit an Article JSON-LD node. The 109-page gap is exactly the 62 attraction pages and the 47 restaurant pages. Those pages do emit rich entity markup (TouristAttraction with height/duration/opened as PropertyValues; Restaurant + Menu + MenuItem with prices and diet URIs) — that part is well done and better than most competitors. What they lack is the `author` and `publisher` linkage that the 63 Article pages carry, which is the attribution an answer engine reads when deciding whom to credit. For a site whose whole strategy is being the cited source, the pages holding its most distinctive data are the ones that never say who wrote them. The cheapest correct fix is not to bolt Article onto a ride: it is to add `mainEntityOfPage`/`author`/`publisher` to the existing WebPage node on those pages, or to reconsider og:type=article for entity pages.

**Code change** — In src/lib/schema.mjs webPage(), accept optional author/publisher and set them on the WebPage node for entity pages; wire from src/pages/park.mjs (attraction pages) and src/pages/dining.mjs (restaurant pages). Alternatively drop ogType:'article' on those two families. Shared code; Disney has the same gap.

<sub>Evidence: dist/universal scan: og:type values {website: 79, article: 172}; JSON-LD node counts across 251 pages: Article 63, TouristAttraction 62, Restaurant 47, Menu 45. Family breakdown confirms attraction (62, og:article, no Article node) and restaurant (47, og:article, no Article node).</sub>

### Article and Organization nodes omit the image and logo fields that AI answer surfaces and Google's publisher signals read

**🟡 MEDIUM** · effort: small

The 63 Article nodes carry headline, description, url, dateModified, articleSection, inLanguage, author and publisher — a clean node — but no `image` and no `datePublished`. The Organization node (emitted on all 251 pages) carries name, url, description, foundingDate and disambiguatingDescription but no `logo`, no `sameAs`, and no `contactPoint` despite a /contact/ page existing. `logo` is the field Google reads for publisher attribution and it is closable today with an existing on-disk file (icon-512.png), pending the icon rebrand. No page emits `primaryImageOfPage` or any ImageObject anywhere on the site — unsurprising given zero images exist, but it means the per-page social cards, once generated, have a second consumer waiting. Worth stating explicitly: I checked and the site is right to omit HowTo (retired) and to emit FAQPage anyway for entity clarity, and the deliberate 'no Event node without a confirmed startDate' policy in src/lib/seasonal-schema.mjs is correct — the audit's '0 Event JSON-LD nodes' reflects 0 confirmed editions, not a bug. Do not recommend adding those.

**Image needed** — A square logo file for Organization.logo — satisfied by the rebranded icon-512.png once the icon finding is addressed; no new artwork needed.

**Content needed** — A `sameAs` list (the site's own social profiles) if any exist — otherwise omit rather than invent.

**Code change** — src/lib/schema.mjs: add `logo` (ImageObject or URL) and optional `sameAs`/`contactPoint` to organization(); add optional `image` and `datePublished` to article(), fed by the per-page social card once that exists. Shared code, benefits both operators.

<sub>Evidence: src/lib/schema.mjs:240-254 article() has no image/datePublished; :47-57 organization() has no logo/sameAs/contactPoint. Sampled dist/universal/guides/express-pass/index.html Article node confirms the emitted field set. 0 ImageObject nodes across 251 pages.</sub>

### 37 MB of Disney park map PNGs ship inside the Universal site while all four Universal plates are missing

**🟡 MEDIUM** · effort: small

assets/img/maps/ is a shared, un-namespaced directory holding twelve Disney raster plates (magic-kingdom, epcot, animal-kingdom, hollywood-studios, disneyland-park, california-adventure, each at 1x and 2x). copyAssets (src/build.mjs:527) copies it wholesale, so dist/universal/assets/img/maps/ contains 37 MB of another park company's maps — roughly 81% of the 45.55 MB build — referenced by exactly zero of the 251 pages. Meanwhile the audit correctly reports that all four Universal parks have no PNG plate, and render-map-pngs.mjs defaults to `OPERATOR = 'disney'` and writes into the same shared directory, so generating Universal's plates would place both operators' files in both sites rather than fixing it. Two consequences for this lens: the Universal map pages offer only an SVG download and have no raster to share or hand to a print dialog, and the park map plate is the most obvious og:image for the park and resort families — legally the safest image the site could possibly publish, since it is drawn from our own geometry rather than traced from an official map.

**Image needed** — Four Universal park map plates (universal-studios-florida, islands-of-adventure, epic-universe, universal-studios-hollywood) at 1x and 2x — produced by running the existing rasteriser against the four SVGs the build already emits at dist/universal/maps/, no new drawing required. Note validate.mjs currently warns that all four map.json files are unauthored and the build is falling back to a generic land diagram, so the underlying maps should be authored before rasterising.

**Code change** — Namespace the map output per operator (assets/img/maps/<operator>/) and have copyAssets copy only the building operator's subtree — or exclude assets/img/maps from the blanket copy and copy the operator's plates explicitly. Shared code; also fixes the reciprocal leak of Universal plates into the Disney build once they exist.

<sub>Evidence: `du -sh dist/universal/assets/img/maps` → 37M; 12 Disney PNGs listed. `grep -o 'assets/img/maps/...' dist/universal/**/*.html` → 0 matches. `node scripts/audit.mjs universal` notes: "maps: epic-universe has no PNG plate" ×4. scripts/render-map-pngs.mjs:23 `const OPERATOR = process.argv[2] || 'disney'`, :25 `OUT = join(ROOT,'assets','img','maps')`.</sub>

### The search dialog on all 251 pages is labelled "Search Ride Ready Guide"

**🟡 MEDIUM** · effort: trivial

src/templates/layout.mjs:99 hard-codes `aria-label="Search Ride Ready Guide"` into the search panel, which renders on every page of both operators. On hollywoodrideguide.com that is 251 accessible names announcing a different company. It sits in the layout that otherwise carefully threads `site.brand.name` through the masthead, footer, og:site_name and JSON-LD, so it reads as a single missed interpolation rather than a design decision. Machine-readable in the strict sense: it is the accessible name exposed to assistive technology and to any crawler reading the accessibility tree.

**Code change** — Pass `site` into searchDialog() and interpolate `${site.brand.name}`. One-line change in src/templates/layout.mjs:96-99 and its call site at :194. Shared code; Disney's output is unchanged.

<sub>Evidence: src/templates/layout.mjs:99 `aria-label="Search Ride Ready Guide"`; searchDialog() takes no arguments (layout.mjs:96) and is called at :194 without site. 251 occurrences in dist/universal.</sub>

### A dormant 'Disney Parks' fallback sits inside the Event schema builder, waiting for the first confirmed Universal edition

**🟡 MEDIUM** · effort: trivial

src/lib/seasonal-schema.mjs:59 sets the Event `location` name to `ev.resortName || 'Disney Parks'` when no park is named. It emits nothing today because the operator holds 0 confirmed editions (24 expected, 5 historical) and event() correctly returns null without a confirmed startDate — the deliberate, well-argued policy documented at the top of that file. But the moment a Universal event edition is confirmed and this fallback path is taken, hollywoodrideguide.com will publish an Event whose Place is named 'Disney Parks'. It is invisible to every current test and to the audit, which counts Event nodes and finds zero. This is exactly the class of latent leak the reference-table discipline exists to catch, and it will surface at the worst moment — when the site finally has a rich result to win.

**Code change** — Replace the literal at src/lib/seasonal-schema.mjs:59 with `site.brand.name`-derived or resort-derived text, or drop the location node entirely when no resort is known rather than guessing. Shared code.

<sub>Evidence: src/lib/seasonal-schema.mjs:59 `name: ev.resortName || 'Disney Parks'`. `node scripts/audit.mjs universal` → "0 Event JSON-LD nodes"; factcheck reports "confidence: 0 confirmed, 24 expected, 5 historical".</sub>

### twitter:site is empty on all 251 Universal pages while the Disney operator has a handle

**🟡 MEDIUM** · effort: trivial

data/universal/site.json sets `meta.twitterSite: ""`, so the conditional at src/templates/layout.mjs:51 emits nothing and no page carries a twitter:site attribution. data/disney/site.json sets `@rideready`, so the mechanism works and is simply unpopulated for this operator. Minor on its own, but it compounds with the missing og:image: a Hollywood Ride Guide link shared on X today has no card image, no site attribution, and a favicon belonging to a different brand. The field is a content decision (a handle must exist) rather than a code gap, and the code correctly omits the tag rather than emitting an empty one.

**Content needed** — An X/Twitter handle for Hollywood Ride Guide, or a decision to leave it blank at launch.

**Code change** — None — the layout already handles both states correctly.

<sub>Evidence: data/universal/site.json meta.twitterSite = "" vs data/disney/site.json = "@rideready"; src/templates/layout.mjs:51 conditional; 0 twitter:site tags in dist/universal.</sub>

### Eight park subpages emit no page-specific schema type, including the four accessibility guides

**⚪ LOW** · effort: trivial

Every page correctly carries Organization + WebSite + WebPage + BreadcrumbList, and most families add a type on top. The exceptions are the 4 accessibility pages and the 4 map pages, which emit only the base four. Accessibility is one of the highest-intent informational queries in this category and one of the best-differentiated bodies of content on the site (wheelchair and ECV rentals, ride transfer requirements, quiet spaces, sensory notes per park) — it is precisely the kind of page an AI answer engine should be able to identify as an authored guide rather than a generic web page. The legal and utility pages (about, privacy, terms, contact, affiliate-disclosure, offline, 404, tools) also emit base-only, which is defensible. Note the three pages without BreadcrumbList — index.html, 404.html and offline/index.html — are correct, since breadcrumbs() properly returns null for a trail shorter than two, and the sitemap correctly carries 249 of 251 URLs, excluding 404 and offline, both of which are marked noindex,follow. That machinery is sound.

**Code change** — Add S.article(...) (or a WebPage with author/publisher) to the accessibility page in src/pages/park.mjs around :755, and consider an ItemList of lands or a CreativeWork for the map page around :980. Shared code.

<sub>Evidence: Family scan of dist/universal: `park/accessibility` 4 pages extra-ld {} ; `park/map` 4 pages extra-ld {}. src/pages/park.mjs:750-765 (accessibility) and :975-992 (map) pass no `schema` array to renderPage.</sub>

### 18 meta descriptions exceed 160 characters and several truncate mid-phrase with an ellipsis

**⚪ LOW** · effort: small

Descriptions are template-derived but interpolated from authored `summary` fields, and the result is genuinely good: 251 of 251 are unique, with zero duplicate groups — better than most hand-authored sites of this size. The distribution is tight (median 151) but 18 run past 160 characters, topping out at 173 (/holidays/new-years-eve/), and the page-level truncate calls at 155/158 sometimes cut mid-phrase, leaving descriptions that end '…and the' before an ellipsis (e.g. /guides/child-swap/, /guides/express-pass/). Google will re-truncate the long ones; the mid-phrase cuts also propagate into the Article JSON-LD `description`, where a fragment ending in an ellipsis reads as damaged data to a machine consumer rather than as a deliberate teaser. Two descriptions are very short: /offline/ at 16 chars and /404.html at 25, both noindex, so both are fine.

**Code change** — Make the truncate helper in src/lib/html.mjs break on a sentence or clause boundary rather than mid-phrase, and lower the page-level caps in src/pages/park.mjs (:160, :278, :421, :506, :1127) and the seasonal modules from 155/158 to a value that leaves room for the appended clauses. Shared code; low risk, affects both operators.

<sub>Evidence: dist/universal scan: 251 unique descriptions, 0 duplicate groups, min/median/max 16/151/173, 18 over 160 chars. Sampled Article node at dist/universal/guides/express-pass/index.html ends `…which three hotels include it, why Hagrid's refuses it, and the…`.</sub>

## 1.5 · Differentiation and traffic

> **The site holds a genuinely uncopyable dataset — 5-axis fear profiles on all 107 attractions, a verified 40-inch height cliff, 157 date-stamped food prices — and renders almost none of it as a distinctive graphic, while its flagship differentiating tool ships with Disney branding and a dead scoring dimension on the Universal domain.**

### Trip Timing — the site's flagship differentiator — is Disney-branded and its weather dimension is dead on the Universal site

**🔴 BLOCKER** · effort: small

The tool asks readers of hollywoodrideguide.com "Which resort? [Walt Disney World] [Disneyland Resort]". Those radio values ('walt-disney-world','disneyland') are used as lookup keys into a payload whose keys are 'universal-orlando' and 'universal-hollywood'. The lookup in assets/js/trip-timing.js:62 is `(month.w && month.w[st.resort]) || 3`, so every month silently falls back to a flat 3. I simulated the shipped payload with the shipped default: selecting only 'Good weather' scores all twelve months 3.0 and ranks them by month number. The real spread in the data is Jan 3.6 / Jun 1.0 / Nov 3.8 — a 2.8-point range, completely discarded. The summary line then reads 'For Walt Disney World, weighing good weather: January, February and March come out on top.' This is the one tool whose premise (re-rank the calendar on what YOU care about) no competitor offers, and on Universal it is both broken and advertising a competitor. Blast radius: src/seasonal/tools.mjs and assets/js/trip-timing.js are shared; on the live Disney site the same code is correct, so this is a Universal-only defect from hardcoding.

**Code change** — Drive the resort radio options from data (site.json `resorts[]` — universal declares universal-orlando / universal-hollywood) instead of the hardcoded literals in src/seasonal/tools.mjs:92-97; replace the ternary in assets/js/trip-timing.js:120 with a label carried in the payload.

<sub>Evidence: src/seasonal/tools.mjs:92-97 hardcodes value="walt-disney-world"/"disneyland"; assets/js/trip-timing.js:45 default resort, :62 fallback `|| 3`, :120 `resortName = ... 'Walt Disney World'`. Shipped payload in dist/universal/tools/trip-timing/index.html contains "w":{"universal-orlando":3.6,"universal-hollywood":3.5}. Simulation output: all 12 months = 3.</sub>

### All four Universal park maps are generic radial pie charts, while three pages claim they are drawn from OpenStreetMap data

**🟠 HIGH** · effort: large

data/universal has zero map.json files (Disney has 6). With no authored geometry, src/lib/map.mjs falls back to syntheticMap(), which lays lands out as equal wedges of a circle computed purely from lands.length. Epic Universe and Universal Studios Hollywood both have 5 lands and therefore emit byte-identical polygon geometry — I diffed the first points= attribute of each and they match exactly. All four maps have water=0, paths=0 and a single 'Main entrance' marker. Disney's magic-kingdom map.json by contrast has 6 authored land polygons, 1 water body, 6 paths and 19 markers. The generator's own docblock calls the fallback 'Honest but generic'. The problem is that the site does not describe it honestly: the home page says 'Clean schematic maps drawn from open geographic data', the tools index says 'drawn by us from open geographic data', and — most seriously — /terms/ makes a formal licence attribution: 'They are drawn from open geographic data, including data © OpenStreetMap contributors, which is available under the Open Database License.' No geographic data was used for any Universal map. Authoring real geometry is explicitly permitted by the constraints (OSM-derived is fine; tracing an official map is not), so this is the single largest untapped differentiator: hand-built accurate schematics are exactly the asset a competitor cannot copy without redoing the work.

**Content needed** — Four hand-authored land-polygon layouts derived from OpenStreetMap. Universal Studios Hollywood especially needs it: the Upper Lot / Lower Lot split is a vertical relationship joined by a long escalator bank, and a radial pie chart actively misrepresents the park's defining layout fact.

**Code change** — Add data/universal/parks/<park>/map.json for all four parks matching the Disney schema (lands[].points, labelAt, water, paths, markers). Until authored, suppress the 'open geographic data'/OSM attribution wording on the three pages when park.map is synthetic.

<sub>Evidence: find data/universal -name map.json → 0. src/lib/map.mjs:75-112 syntheticMap() with `step = (Math.PI*2)/lands.length`. Identical first polygon in dist/universal/maps/epic-universe-map.svg and universal-studios-hollywood-map.svg: points="71.6,-13.6 60.4,-5.6 62,-4 63.6,-2.4". Claims in dist/universal/index.html, dist/universal/tools/index.html, dist/universal/terms/index.html.</sub>

### Zero og:image on all 251 pages — every social share renders as a bare text link

**🟠 HIGH** · effort: medium

site.socialImage resolves to null because data/universal declares a 'social' photo slot pointing at social-card-1280.jpg, and assets/img/photos/ contains only README.md. The layout guards the whole OG image block on that value, so no og:image, og:image:width, og:image:height or twitter:image is emitted anywhere. I confirmed 0 of 251 pages carry either tag. Every share to Facebook, X, Slack, iMessage, Discord, Pinterest or WhatsApp is therefore a titleless grey rectangle, which is the single largest suppressor of referral click-through for a site with no brand recognition yet. This is also the cheapest place to convert the site's data advantage into traffic: a per-page card generated deterministically from data already on disk (park name, attraction count, fear fingerprint, height figure) has zero IP exposure — no characters, no photography, no diffusion model — and cannot be replicated by a competitor who has not done the verification.

**Image needed** — A 1280×672 data card in the site's palette: brandmark, page title, and one verified figure drawn from the page's own data (e.g. 'Fear profile: darkness 1 · drops 4 · speed 5' or '40 inches unlocks 11 attractions'). Typographic and chart-based only — no photography, no characters.

**Code change** — Add a build step generating one SVG→PNG/JPG OG card per page archetype from existing data, and set site.socialImage per page rather than only globally from the photos declaration.

<sub>Evidence: src/lib/data.mjs:389 `site.socialImage = social ? ... : null`; src/templates/layout.mjs:44 guards the block on it. `grep -rl 'og:image' dist/universal --include=*.html | wc -l` → 0 of 251. assets/img/photos/ contains only README.md.</sub>

### The 5-axis fear fingerprint is the site's most defensible asset and it renders as a stack of generic progress bars

**🟠 HIGH** · effort: medium

Every one of the 107 attractions carries a complete scary object: darkness, drops, speed, loudness, startles (each 1–5), plus an overall score and a written note averaging well over 40 characters. Coverage is 107/107 on all five axes with zero nulls. This is genuinely uncopyable — a competitor would have to ride and score everything. And the data proves the editorial point it exists to make: 107 attractions produce 61 distinct fingerprints, and among the 18 rides that all score 3/5 overall there are 16 different shapes. Stardust Racers (darkness 1, drops 4, speed 5) and The Amazing Adventures of Spider-Man (darkness 4, drops 2, startles 4) both score 3/5 — opposite experiences for a child scared of the dark, collapsed into the same number. Today that insight is displayed as six stacked horizontal bars via C.meter() on 62 standalone attraction pages, and as a bare '3/5' in tables. Bar stacks are the most generic chart form on the internet and cannot be compared across rides. A small radar/polygon 'fear fingerprint' would be a distinctive repeating shape, would make two rides comparable side by side, would work as the OG card, and is pure deterministic SVG from data already verified.

**Image needed** — A compact 5-axis radar polygon per attraction, rendered as inline SVG from the existing scary object — no new data, no image files.

**Code change** — Add a fearFingerprint(scary) SVG component to src/templates/components.mjs and call it in src/pages/park.mjs:359 alongside or instead of the meter grid; also surface it in attractionCard() so profiles are comparable in listings.

<sub>Evidence: 107/107 coverage on darkness, drops, speed, loudness, startles (computed across all four parks' attractions.json). 61 distinct 5-tuples; score-3 cohort = 18 rides / 16 shapes. Rendered via src/pages/park.mjs:359-365 as C.meter() bars; components.mjs meter() is a div width percentage.</sub>

### The 40-inch height cliff is verified, striking, and has no graphic anywhere on the site

**🟠 HIGH** · effort: medium

The data supports an unusually sharp story and I verified every figure the height-requirements guide asserts. Across the four parks there are 39 height-restricted attractions. The distribution is heavily clustered: 3 at 34", 5 at 36", 1 at 39", then 11 at exactly 40", 7 at 42", 1 at 44", 7 at 48", 2 at 51", 1 at 52", 1 at 54". A child at 39 inches can ride 9 of the 39; one inch later at 40 inches they can ride 20. That single inch is worth more than any other planning variable, it is the guide's own lead claim, and it is currently communicated only as prose plus a sortable table. The Height Checker tool has a slider and three number readouts but no visual ladder — the step function is invisible. A staircase/cliff chart is deterministic, built entirely from heightIn fields already on disk, is the most linkable and most screenshot-shareable asset the site could own, and is exactly the kind of graphic parenting forums and Facebook groups repost.

**Image needed** — A vertical staircase chart, 34"→54", bar length = cumulative attractions unlocked, with the 40-inch step visually emphasised and a live marker driven by the existing slider.

**Code change** — Add an SVG height-ladder component and render it in heightCheckerPage (src/pages/tools.mjs, in the .hchecker block around line 216) and in the height-requirements guide page.

<sub>Evidence: Computed from the four data/universal/parks/*/attractions.json files: 39 non-null heightIn values; 11 at exactly 40; cumulative 9 at 39" → 20 at 40". Matches the claims in data/universal/guides/height-requirements.json intro and keyPoints. src/pages/tools.mjs:177-270 renders a slider plus C.dataTable, no chart.</sub>

### 37 MB of Disney park maps ship inside the Universal build, referenced by zero Universal pages

**🟡 MEDIUM** · effort: trivial

dist/universal/assets/img/maps/ contains all twelve Disney map PNGs — magic-kingdom-map.png, epcot-map.png, animal-kingdom-map.png and their @2x variants. That is 37 MB of a 48 MB build: 77% of everything deployed to hollywoodrideguide.com is a competitor's park artwork. No Universal HTML page references the directory at all (0 pages match 'img/maps'). Excluding it, the site is 11 MB. Beyond the obvious waste against a home page that explicitly promises the tools work on park WiFi, shipping Disney-branded map art on a Universal domain is a needless brand and rights exposure for assets nothing links to. Related: the audit itself reports all four Universal maps lack PNG plates, so the maps directory holds only the maps the site does not use and none of the ones it does.

**Code change** — Scope the asset copy step so assets/img/maps/ is filtered per operator rather than copied wholesale into every dist/<operator>/.

<sub>Evidence: du -sh dist/universal → 48M; du -sh dist/universal/assets/img/maps → 37M; excluding it → 11M. `grep -rl 'img/maps' dist/universal --include=*.html | wc -l` → 0. `node scripts/audit.mjs universal` reports 4 notes: 'maps: <park> has no PNG plate — run npm run maps:png'.</sub>

### The Universal site has no visual identity of its own — its stylesheet is byte-identical to the Disney site's

**🟡 MEDIUM** · effort: small

Answering the lens question directly: if a reader saw one page with the logo cropped off, nothing would identify it, and nothing would distinguish it from the Disney property either. dist/universal/assets/css/main.css and dist/disney/assets/css/main.css have the same md5 (76a1ea573e47957ab4171111ab480b1a). The file's own header comment reads 'Ride Ready Guide — design system' — the Disney brand — and its token comment says 'Deliberately not Disney-adjacent: forest + amber', a decision made for the other operator. There is no per-operator hook: body renders as `<body class="">` on both sites, and there is no [data-operator] selector anywhere in the 1,430 lines. Typography is the system stack by constraint (no web fonts), so type carries no signature either. The only brand elements are a rounded-square 'HR' monogram and the site name. There is also a live contradiction: site.json declares themeColor #1b3a5c (navy), which is what the browser chrome renders, while every pixel of the page uses --brand #0f3d2e (forest). Since web fonts and photography are both off the table, the palette and the chart language are the only identity levers available — which makes the data graphics in the findings above the identity strategy, not a nice-to-have.

**Content needed** — A distinct palette for Hollywood Ride Guide. The declared navy #1b3a5c is a reasonable starting point and would separate the two properties immediately.

**Code change** — Emit an operator class or data-operator attribute on <body> in src/templates/layout.mjs, then override the brand/accent token block per operator. Reconcile themeColor with the rendered palette.

<sub>Evidence: md5sum match on both built main.css files. assets/css/main.css:2 'Ride Ready Guide — design system'; :10 'Deliberately not Disney-adjacent'. `<body class="">` in both dist/universal/index.html and dist/disney/index.html. data/universal/site.json brand.themeColor '#1b3a5c' vs --brand '#0f3d2e'.</sub>

### 182 of 251 pages carry no graphic of any kind

**🟡 MEDIUM** · effort: medium

Counting every visual device the site has — the fear meter grid, the calendar Gantt, the park map SVG and the trip-timing bars — only 69 of 251 pages carry any of them, and the distribution is lopsided: 62 pages have the fear meters, 4 have a map, 2 have the Gantt, 1 has the timing bars. The pages with nothing include 84 under universal-orlando, 24 under universal-hollywood, 13 when-to-go, 12 guides, 11 events, 11 compare, 6 prices and 6 holidays. The site renders zero <img> and zero <picture> elements across all 251 pages; the 4,306 inline SVGs are UI furniture (1,172 link chevrons, 502 theme-toggle icons, 194 callout icons). The comparison pages are the sharpest miss: data/universal/compare/*.json carries a structured `dimensions` array where each row has an explicit `winner` field ('epic' / 'ioa' / 'tie'), which is a scorecard already in tabular form and rendered as prose cells with no visual tally.

**Code change** — Give compare pages a win-tally strip driven by the existing dimensions[].winner field.

<sub>Evidence: grep across dist/universal: meter-grid 62, gantt__ 2, parkmap 4, timing-result 1 → 69 unique pages of 251. `grep -roh '<img' dist/universal --include=*.html | wc -l` → 0; '<picture' → 0. SVG class census: link-tile__chev 1172, icon-sun/moon 502, callout__icon 194, parkmap 4, tracker-progress__ring 1.</sub>

### 157 date-stamped food prices — a real price dataset — have no visualization

**🟡 MEDIUM** · effort: medium

data/universal/parks/*/food.json holds 158 items, 157 with a numeric price and 158 with a priceVerified month stamp. The range is $3.49 to $85.00 with a median of $13.49, and the structure supports several honest cuts: by park (Epic Universe median $16 and top $85 vs Universal Studios Florida median $11.99 and top $24.99) and by category (savory 80 items $8–$85; drinks 40 items $5.49–$18; sweet 26 items $4.99–$16.99). Every item also carries mustTry 1–5, iconic, shareable, portable and dietaryTags (vegetarian, gluten-free, vegan, dairy-free). A verified, dated price distribution is among the most defensible graphics a park site can publish — it is the question every visitor actually has, it cannot be copied without redoing the pricing survey, and the priceVerified stamps let the chart carry its own credibility. Currently prices appear only as numbers in cards and in the Food Tracker list.

**Image needed** — A price-band chart — a dot strip or histogram of the 157 verified prices, split by park or category, annotated with the median and stamped with the verification month.

**Code change** — Add a price-distribution component and render it on the dining/food index pages and the Food Tracker.

<sub>Evidence: Computed across the four food.json files: 157/158 numeric price; range $3.49–$85; median $13.49; per-park and per-category medians as stated; priceVerified present on 158/158; mustTry present on 158/158.</sub>

### A full 12-month climate, crowd and cost grid exists numerically for both resorts and is never charted

**🟡 MEDIUM** · effort: medium

All twelve month files carry structured, chartable fields: verdict.grade (A- through D-), crowds.level (low/moderate/high/peak), cost.level, and weather split by resort with numeric highF, lowF and rainDays for both universal-orlando and universal-hollywood. src/seasonal/tools.mjs already contains weatherScore(), which reduces those normals to a 1–5 comfort figure at build time — so a numeric series for all 12 months × 2 resorts already exists in code. The divergence between the coasts is a genuine editorial finding the data supports and no graphic shows: July is 93°F in both places, but Orlando has 17 rain days to Hollywood's 0. The site's only true data graphic is calendarGantt, a 5-row × 12-column CSS grid on the single /calendar/ page, and it charts event windows rather than any of this. Because it is CSS divs rather than SVG it also cannot be exported as an image or shared.

**Image needed** — A 12-month strip encoding crowds, cost and weather comfort per resort — ideally paired coasts so the Orlando/Hollywood divergence is the visible point.

**Code change** — Add a 12-month small-multiple grid component and render it on the when-to-go index and each month page, reusing weatherScore().

<sub>Evidence: All 12 of data/universal/seasonal/months/*.json carry verdict.grade, crowds.level, cost.level and weather.{universal-orlando,universal-hollywood}.{highF,lowF,rainDays}. src/seasonal/tools.mjs:32 weatherScore(). July: Orlando highF 93 / rainDays 17; Hollywood highF 93 / rainDays 0. dist/universal/calendar/index.html contains 60 gantt__cell across 5 gantt__row.</sub>

### The Tools index sells five interactive tools as five identical text cards

**⚪ LOW** · effort: small

toolsIndex renders the Height Checker, Food Tracker, Trip Timing, seasonal calendar and park maps as five C.card() calls with tone 'feature' — eyebrow, title and summary text, nothing else. This is the page whose entire job is to convince a reader that the site does something a search result cannot, and it shows none of the four tools doing it. Each tool has a natural thumbnail that is already computable from data on disk: the height ladder, the price strip, the 12-month grid, the map plate. One card on this page also carries the inaccurate map provenance claim covered above.

**Image needed** — Four small SVG thumbnails, each a reduced form of that tool's real output.

**Code change** — Add an optional media slot to card() in src/templates/components.mjs and pass a small deterministic SVG preview for each tool card in src/pages/tools.mjs:343-380.

<sub>Evidence: src/pages/tools.mjs:343-380, five C.card() calls with no image or media field. dist/universal/tools/index.html contains no meter-grid, gantt__, parkmap or timing-result markup.</sub>

### No Event structured data on any page, which forecloses the highest-volume Universal search opportunity

**⚪ LOW** · effort: medium

The build reports 'confidence: 0 confirmed, 24 expected, 5 historical' and the audit reports 0 Event JSON-LD nodes. This is by design and the design is right: src/lib/seasonal-schema.mjs returns null unless an edition has both startDate and endDate, on the stated grounds that Google's Event rich result requires startDate and a fabricated one would be worse than none. Noting it under this lens because of what it costs rather than as a code defect: Halloween Horror Nights is the single highest-volume search term in the Universal ecosystem, the site has five events with five editions written up, and none can win a rich result until dates are confirmed. The gap is verification work, not engineering — and data/operators.json already flags human verification of heights, closures and prices as a launch gate for this operator. Confirming event dates belongs on that same gate.

**Content needed** — Confirmed start and end dates for the five seasonal events, sourced and dated, so the existing schema path emits Event nodes without changing the honesty rule.

<sub>Evidence: `node src/build.mjs universal` → 'confidence: 0 confirmed, 24 expected, 5 historical'; `node scripts/audit.mjs universal` → '0 Event JSON-LD nodes'. src/lib/seasonal-schema.mjs:48 `if (!edition.startDate || !edition.endDate) return null`. data/operators.json marks universal status 'draft' pending human verification.</sub>

## 1.6 · Risk, performance, and accessibility consequences of adding imagery at scale (Universal / Hollywood Ride Guide)

> **A cold Universal home page is 26.8 KB gzipped with zero images and zero web fonts, so the very first 120 KB hero multiplies it 5.5x — and none of the four gates enforce a single byte, dimension, or provenance rule, while 37 MB of unreferenced *Disney* map PNGs already ship inside dist/universal and every image would land under a one-year `immutable` cache with no filename versioning to ever pull it back.**

### 37 MB of unreferenced Disney park map PNGs ship inside dist/universal — cross-operator asset leak with IP exposure

**🔴 BLOCKER** · effort: small

`copyAssets()` does a blanket `cp(ASSETS_DIR, join(dist,'assets'), {recursive:true})` with no per-operator filtering, so every operator dist receives the entire shared assets tree. For Universal that means 12 PNG plates named magic-kingdom, animal-kingdom, disneyland-park, epcot, hollywood-studios and california-adventure — 37 MB, 81% of the 45.55 MB build — published under hollywoodrideguide.com. Zero Universal HTML pages reference them (`grep -rho 'assets/img/maps/' dist/universal --include=*.html` returns nothing). This is the single largest fact about the site's weight today and it must be fixed BEFORE any imagery recommendation, or the audit will be adding photographs to a payload that is already 81% dead Disney freight. Two distinct harms: (a) it makes every 'the site is lightweight' claim unverifiable, and (b) it puts Disney-labelled park cartography on a Universal-branded domain, which is exactly the class of thing a rights complaint attaches to. Universal's own 4 plates are SVG (10.8–13.4 KB each, in /maps/) and are the correct precedent — note that `node scripts/audit.mjs universal` currently emits 4 notes telling you to run `npm run maps:png`, which would generate 4 MORE multi-MB PNGs (the Disney ones run 1.29–5.44 MB each). Do not run it.

**Code change** — Scope copyAssets in src/build.mjs:527 to an operator-aware allowlist (or move assets/img/maps/ under a per-operator path), so dist/universal ships only Universal's own map plates.

<sub>Evidence: src/build.mjs:527-531 `await cp(ASSETS_DIR, join(dist,'assets'), {recursive:true})`; `du -sh dist/universal/assets/img` = 37M; `find dist/universal/assets -printf '%s\t%p\n' | sort -rn | head` shows magic-kingdom-map@2x.png 5,435,756 B, animal-kingdom-map@2x.png 5,094,141 B, disneyland-park-map@2x.png 5,006,309 B; `grep -rlo 'img/maps/' dist/universal --include=*.html` = 0 matches; `node scripts/audit.mjs universal` = '4 notes: maps: <park> has no PNG plate'</sub>

### No byte budget, dimension check, or format check is enforced by any of the four gates — the 120 KB / 80 KB budget is documentation only

**🔴 BLOCKER** · effort: medium

assets/img/photos/README.md states 'Hero: 120 KB maximum in AVIF at 1920. Everything else: 80 KB' and the home page sells 'built to work on park WiFi'. Nothing enforces it. Grepping validate.mjs, factcheck.mjs and audit.mjs for byte/size/KB/avif/webp/photos returns nothing. The ONLY image assertion in the entire gate stack is audit.mjs:181-183, which checks that an `<img>` has an `alt=` attribute at all — a check that passes trivially for `alt=""` and, today, is a no-op because there are zero `<img>` tags across all 251 pages. If the audit recommends adding images at scale, the budget it cites is unenforceable and will drift on the first hurried asset drop. This is the load-bearing gap: this repo's whole design is that a documented rule which isn't gated is a rule that decays, and the photo pipeline is currently the one subsystem with no gate.

**Code change** — Add an image gate to scripts/audit.mjs: for every file in assets/img/photos/, assert bytes <= 120*1024 for the hero slot and <= 80*1024 otherwise, assert the AVIF/WebP/JPEG triple exists at every declared width, and assert the on-disk pixel dimensions match the width/height declared in site.json photos.*.

<sub>Evidence: `grep -rn 'photos|\.avif|\.webp|byteLength|KB|maxBytes|weight' scripts/audit.mjs scripts/validate.mjs` = no output; scripts/audit.mjs:181-183 is the complete image block: `for (const img of html.match(/<img\b[^>]*>/g) || []) { if (!/\balt=/.test(img)) fail(page, 'an <img> has no alt attribute') }`; `grep -rho '<img' dist/universal --include=*.html | wc -l` = 0</sub>

### Images inherit a one-year `immutable` cache with no filename versioning — a rights takedown cannot be propagated to clients that already fetched the image

**🔴 BLOCKER** · effort: small

`/assets/*` is served `Cache-Control: public, max-age=31536000, immutable` in both dist/universal/_headers and vercel.json. photo() builds URLs as `/assets/img/photos/${img.file}-${width}.${ext}` with no hash and no query parameter — compare the CSS and JS, which at least carry a `?v=1` handle. `immutable` specifically instructs the browser not to revalidate even on reload. The README says the null-photo fallback exists so the site can return to its unphotographic form 'the moment an image is pulled for a rights problem' — but deleting the file only fixes the origin. Every device that already cached it keeps serving it for up to 365 days, and the fallback never triggers for them because the HTML still references the path. Given that the imagery being proposed is diffusion-generated against a hard IP constraint list, 'we may need to pull an image fast' is the expected case, not the edge case. The mitigation is cheap and must be decided before the first image ships, because it changes the filename convention documented in the README.

**Code change** — Add a content hash or version segment to the photo filename convention (e.g. `hero-coaster-night.<hash>-1920.avif`) in src/templates/components.mjs:173/181 and src/lib/data.mjs:370-380, and update assets/img/photos/README.md's naming block to match.

<sub>Evidence: dist/universal/_headers: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; vercel.json:9-13 same; src/templates/components.mjs:173 `/assets/img/photos/${img.file}-${w}.${ext}` and :181 `src="/assets/img/photos/${img.file}-${widest}.jpg"` — no version token, versus src/build.mjs:547-553 which append `?v=1` to every CSS/JS precache URL</sub>

### assets/img/photos/CREDITS.md does not exist, and the 'Illustrative imagery, AI-generated' credit line the handoff brief says the footer carries is not in the footer

**🔴 BLOCKER** · effort: small

Two separate provenance failures. (1) CREDITS.md is required by two docs and does not exist — the directory contains only README.md. Its job is to be the answer when a rights question arrives, and it must record, per FILE (not per slot): the exact filename including width and extension; the generator and model version, or the licence and source URL for stock; the verbatim prompt and any negative prompt; the generation date; the name of the human who ran the four IP checks and the date they ran them; and the C2PA/content-credential status if the generator emits one. Per-file rather than per-slot matters because a slot has 9 files (3 formats x 3 widths) and a rights complaint names a URL. Legally, absence matters because a documented, dated, human-signed pre-publication review is the difference between an innocent-infringement posture and a willful one, and because Adobe Firefly's commercial indemnification — which docs/ASSET-RUNBOOK.md:32 recommends relying on — is only claimable if you can prove which generator produced which file. Without CREDITS.md that proof lives in someone's browser history. (2) docs/HANDOFF-UNIVERSAL-BRIEF.md:194 describes the footer as already carrying 'an image-credit line (Illustrative imagery, AI-generated)'. It does not — grepping layout.mjs, components.mjs and site.json for 'Illustrative', 'AI-generated' and 'credit' returns nothing, and the rendered footer confirms it. So the synthetic-media disclosure that the art-direction reasoning depends on is undelivered, and a doc asserts it exists, which is the worst version of the gap.

**Content needed** — Write assets/img/photos/CREDITS.md with one row per FILE recording filename, generator + model version (or licence + source URL), verbatim prompt and negative prompt, generation date, the human reviewer's name and the date they ran the four IP checks, and content-credential/C2PA status. Also write the footer disclosure string (e.g. 'Illustrative imagery, AI-generated') into data/universal/site.json under legal.

**Code change** — Emit the image-credit line in the footer in src/templates/layout.mjs (conditionally, only when at least one data.photo.* slot resolves non-null, so it does not assert AI imagery on a site that currently has none).

<sub>Evidence: `ls assets/img/photos/` = README.md only; docs/ASSET-RUNBOOK.md:121-124 and :451-452 both require CREDITS.md; docs/HANDOFF-UNIVERSAL-BRIEF.md:194 claims the footer has an image-credit line; `grep -n 'Illustrative|AI-generated|credit' src/templates/layout.mjs src/templates/components.mjs data/universal/site.json` = no output; rendered dist/universal/index.html footer ends '© 2026 Hollywood Ride Guide. Independent editorial. How we work · Affiliate disclosure · Privacy'</sub>

### Measured headroom: the cold home page is 26.8 KB gzipped, so the first hero alone is a 5.5x multiplier and a fully-imaged park page is 25-59x

**🟠 HIGH** · effort: medium

These are the numbers the imagery recommendation has to respect. Cold home page today, over the wire: HTML 8,269 B gzip + main.css 15,841 B gzip + app.js 3,327 B gzip = 27,437 B = 26.8 KB. Zero images, zero web fonts (--font-sans is a pure system stack), zero blocking third parties. Adding one 120 KB hero AVIF takes it to 146.8 KB — 5.5x. Adding the hero plus images on the home page's 7 existing card slots at the 80 KB ceiling reaches 706.8 KB (26.4x). The Islands of Adventure park page is 33.8 KB today and carries 23 card slots; hero + 23 card images at the 80 KB ceiling is 1,993.8 KB (59.0x). Two honest caveats that make the real number lower but still large: the card `sizes` attribute is `(min-width: 940px) 33vw, (min-width: 620px) 50vw, 100vw`, so a card actually fetches the 640w or 1280w variant, not the 1920w — at a realistic ~30 KB for a 640w AVIF, the IOA page lands near 844 KB, still 25x. The other caveat is that the 80 KB figure in the README does not say WHICH width it governs, which is itself a defect in the budget. Sitewide there are 405 card slots across 63 pages; giving each a unique image at 3 formats x 3 widths is roughly 180 MB on disk, versus roughly 17.8 MB for a reused pool of 40 images. The reuse-pool number is the only one compatible with this repo.

<sub>Evidence: `gzip -9 -c` per file in dist/universal: index.html 39,083→8,269; assets/css/main.css 76,996→15,841; assets/js/app.js 10,841→3,327; islands-of-adventure/index.html 67,012→15,454. Card counts: `grep -o 'class="card ' <file> | wc -l` = 7 (index.html), 23 (islands-of-adventure), 405 sitewide across 63 pages. Font stack: assets/css/main.css:57-59 `--font-sans: ui-sans-serif, system-ui, ...` (no @font-face anywhere). Card sizes string: src/templates/components.mjs:336</sub>

### The service worker precache is 24 URLs / 1.08 MB raw / 194 KB gzipped and contains zero images — this is where the park-WiFi claim lives and it must stay image-free

**🟠 HIGH** · effort: trivial

The precache list is generated in src/build.mjs:533-560 and contains only HTML pages, 2 CSS files, 5 JS files and the manifest. Measured: 1,132,243 B raw, 193,954 B gzipped. The single heaviest entry by far is /tools/food-tracker/ at 314,405 B raw (37,381 B gzip) — 28% of the raw precache in one page. The site makes the offline claim in three places in copy (src/pages/core.mjs:78 'built to work on park WiFi', :106 'The tools keep running on park WiFi, or on none at all', :135 'keeps working when the park WiFi does not'), and the SW header comment states the scope is 'deliberately narrow'. The risk: the precache filter at src/build.mjs:555 admits any URL starting with `/assets`, so a hero image path added to that array would be accepted silently with no size check. One 120 KB hero pushed into the precache is a 62% increase in the gzipped install payload for a resource that is decorative by declaration. The rule the audit must state: images NEVER enter PRECACHE_URLS. The runtime cache-first handler at the bottom of sw.js already picks images up opportunistically after first view, which is the correct tier for them — the install-time cost stays zero and repeat visits still get the benefit.

**Code change** — Add an explicit guard in src/build.mjs:555 rejecting any URL under /assets/img/photos/ from the precache array, with a comment stating why, so the constraint survives the next person who edits the list.

<sub>Evidence: dist/universal/sw.js PRECACHE_URLS = 24 entries, none matching /assets/img/; measured by summing statSync over the parsed list: raw 1,132,243 B (1.08 MB), gzip level 9 = 193,954 B (0.18 MB); largest entry /tools/food-tracker/ = 314,405 B. Filter admitting any /assets path: src/build.mjs:555 `.filter((url) => url === '/offline/' || url.startsWith('/assets') || ...)`. Runtime cache-first branch: dist/universal/sw.js fetch handler, 'Static assets: cache first, refresh in the background'</sub>

### IP inspection procedure: a per-image checklist a human can run in under a minute, and the failure modes the generator will actually produce

**🟠 HIGH** · effort: small

The prompt is a nudge; the review is the control (docs/ASSET-RUNBOOK.md:66-68 makes this point and it is correct — a diffusion model has no concept of trademark). Crucially, ASSET-RUNBOOK.md:53 also establishes that prose prohibitions BACKFIRE — negation encodes the forbidden token and can raise its odds — so 'no Mickey-shaped pretzel' in a prompt is not a control at all. That means the human pass is the ONLY control, and it currently has no written procedure, no sign-off, and no gate. Concrete per-image procedure, ~50 seconds: (1) THREE-CIRCLE SWEEP, ~15s — view at 100% and again at roughly 10% thumbnail size, because the silhouette resolves at small scale where it is invisible at full size; scan specifically balloons, pretzels, ice cream, waffles, pancakes, topiary, bokeh clusters, wheel hubs, cast shadows and reflections. Any head-and-two-ears arrangement, however incidental, is a reject not a retouch. (2) CASTLE / SKYLINE, ~10s — if any structure has spires, ask whether the silhouette is recognisable at thumbnail size; asymmetric European architecture passes, a symmetric central spire flanked by two towers does not. (3) TEXT AND MARKS, ~10s — zoom to 200% over signage, banners, uniforms, cups, wristbands, ride vehicles; diffusion pseudo-text frequently resolves into something readable and trademark-adjacent, and staff must be in plain unbranded uniforms with no badge or name tag. (4) FACES, ~10s — any face sharp enough to be recognisable as a specific person is a reject; the atmospheric direction already favours silhouettes, motion blur and back-lighting, which is the cheapest structural mitigation. (5) RIDE VEHICLES AND PROPERTY SILHOUETTES, ~5s — no monorail, no recognisable coaster train or ride vehicle from a real park, no Harry Potter / Star Wars / Marvel / Nintendo cues. Record pass/fail and the reviewer's name in CREDITS.md per file. Two additions to what the runbook already says: run check (1) on the LQIP thumbnail too if LQIP is introduced, since that IS a 20px image and the silhouette failure mode is a small-scale one; and re-run the full checklist on the final encoded AVIF rather than the generator's preview, because aggressive AVIF quantisation merges adjacent blobs and can CREATE a three-circle arrangement that was not in the source.

**Content needed** — Write the five-step checklist into assets/img/photos/README.md or a new docs/IMAGE-REVIEW.md, with a per-file sign-off row that CREDITS.md references.

<sub>Evidence: docs/ASSET-RUNBOOK.md:53-56 on negation backfiring; :66-68 'an image model has no concept of trademark, and the only reliable check is a person deciding whether the castle looks like the castle'; :94-104 the four-question self-check block; :133-148 the NEVER-depict list including 'it will produce a Mickey-shaped pretzel or ice cream bar — check every food, balloon and topiary image'; no corresponding check exists in scripts/audit.mjs (image block is :181-183, alt-only)</sub>

### photo() is largely well-built — full audit of what it emits and the three things it lacks

**🟡 MEDIUM** · effort: small

Read in full at src/templates/components.mjs:169-189. WHAT IT DOES CORRECTLY, and the audit should not re-litigate any of this: emits a real `<picture>` with `type="image/avif"` then `type="image/webp"` `<source>` elements and a JPEG `<img>` fallback, in the right order; builds srcset from img.widths (default 640/1280/1920) with correct `w` descriptors; passes a `sizes` attribute through (hero `100vw`, card `(min-width:940px) 33vw, (min-width:620px) 50vw, 100vw`); emits explicit `width` and `height` on the `<img>`; sets `--photo-ratio` from width/height so .photo reserves its box via `aspect-ratio` before any bytes arrive; emits `decoding="async"` always; emits `loading="lazy"` for everything except `priority`, and `fetchpriority="high"` for the priority/LCP hero; applies the authored focal point as `object-position`; returns an empty Raw when img is null so the null-photo fallback is centralised in exactly one place. WHAT IT LACKS: (1) no `srcset`/`sizes` on the `<img>` element itself, so any client that ignores `<picture>` sources always downloads the WIDEST JPEG (1920) regardless of viewport — a phone on park WiFi hitting the fallback path gets the desktop-sized file, and the README budget never states a JPEG ceiling at all, so nothing bounds how big that file is. (2) No `<link rel="preload" as="image" imagesrcset imagesizes>` for the LCP hero anywhere in src/templates/layout.mjs; `fetchpriority="high"` covers most of this on modern Chrome but the image is still only discovered after the HTML parser reaches the hero. (3) The declared width/height are trusted blindly — nothing compares them to the actual pixel dimensions of the file on disk (see the separate CLS finding).

**Code change** — In src/templates/components.mjs:180-186 add `srcset` + `sizes` to the `<img>` itself using the JPEG set, and point `src` at the SMALLEST width rather than the widest as the safe default.

<sub>Evidence: src/templates/components.mjs:169-189 in full; line 181 `src="/assets/img/photos/${img.file}-${widest}.jpg"` with widest = Math.max(...widths); line 185 `${raw(priority ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"')}`; `grep -n 'preload|as="image"' src/templates/layout.mjs` = no output</sub>

### Declared image dimensions are never verified against the file on disk — a mismatch produces guaranteed CLS on every non-hero image

**🟡 MEDIUM** · effort: small

src/lib/data.mjs:370-380 checks only that a file EXISTS (`existsSync` on the widest .avif / .webp / .jpg), then spreads the declared metadata through unchanged. photo() then writes `width="${img.width || 1920}" height="${img.height || 1080}"` and `--photo-ratio: ${img.width} / ${img.height}` from those same declared numbers. If a generator returns 1920x1152 (a common diffusion output ratio) while site.json still says 1080, the reserved box is 16:9, the browser's intrinsic sizing is 5:3, and object-fit:cover silently crops 6% off the frame — including, potentially, off a corner a human just cleared in an IP review. The hero is immune because `.hero__media .photo, .hero__media .photo img { aspect-ratio: auto; height: 100% }` overrides the ratio, but every card image and every future non-hero slot is exposed, and layout shift on a 23-card grid compounds. The whole point of the aspect-ratio + LQIP design (documented in the CSS comment at main.css:40-46: 'the layout is final at first paint') is defeated by a number nobody checks.

**Code change** — Read the actual pixel dimensions from the file header in the new audit image gate (PNG/JPEG/WebP/AVIF headers are parseable in a few dozen lines with zero dependencies) and fail when they disagree with site.json photos.<slot>.width/height.

<sub>Evidence: src/lib/data.mjs:375-377 existence check only; src/templates/components.mjs:174 `const ratio = img.width && img.height ? ... : '16 / 9'` and :183-184 `width="${img.width || 1920}" height="${img.height || 1080}"`; hero override at assets/css/main.css:384; declared values in data/universal/site.json photos.hero = 1920x1080, photos.social = 1280x672</sub>

### LQIP is supported end-to-end by the component and the CSS but nothing generates it — every added image will pop in from a flat slab of --surface-3

**🟡 MEDIUM** · effort: medium

photo() emits `--lqip:url('...')` when `img.lqip` is present (components.mjs:177) and `.photo { background-image: var(--lqip, none); background-size: cover }` consumes it (main.css:361-362). Neither photo slot in data/universal/site.json declares an `lqip` key, and no script in the repo produces one. So the fallback is `background-color: var(--surface-3)` — a flat #1f2926 in dark mode, and its light-mode counterpart — which is precisely the 'image fades into a hole' outcome the CSS comment at main.css:40-46 says the design exists to prevent ('On a slow connection — the one this site claims to work on — that is the whole difference between "loading" and "broken"'). Two consequences for a large image rollout: the stated slow-connection benefit is claimed but not delivered, and adding LQIP later has a per-page byte cost that must be budgeted, because each LQIP is an inline base64 data URI in the HTML (roughly 300-800 B for a 20px-wide WebP) — negligible for one hero, but 23 of them on the Islands of Adventure page is 7-18 KB of uncompressible base64 added to a 15.5 KB gzipped document. Related low-severity note: `--lqip:url('${escapeHtml(img.lqip)}')` escapes `'` to `&#39;`, which the HTML parser decodes back to a literal `'` inside the CSS url(), so a value containing a quote would break out of the CSS string. Base64 never contains one and site.json is author-controlled, so this is latent rather than exploitable — but it argues for generating LQIP in code rather than hand-authoring it.

**Code change** — Generate the LQIP data URI at build time in src/lib/data.mjs alongside the existsSync check, or add an lqip key to each site.json photo slot and budget the inline bytes; either way count LQIP bytes in the new per-page weight gate.

<sub>Evidence: src/templates/components.mjs:177 `${img.lqip ? raw(` style="--lqip:url('${escapeHtml(img.lqip)}');...`) : ...}`; assets/css/main.css:357-363; `node -e` dump of data/universal/site.json photos shows keys file/alt/width/height/widths/focal/note — no lqip on either slot; no generator script exists in scripts/</sub>

### Alt-text rule per image class — the hero's empty alt is correct and must not be copied to card images

**🟡 MEDIUM** · effort: small

The rule, stated so the audit can apply it per slot. (a) HERO / atmospheric backdrop: `alt=""` is CORRECT and must stay. The image sits behind text under two scrim layers and conveys mood, not information; hero() additionally wraps it in `<div class="hero__media" aria-hidden="${image.alt ? 'false' : 'true'}">`, so the whole media layer is removed from the accessibility tree. The existing declaration documents the intent in a `note` field. This is the reference implementation. (b) CARD / thumbnail images where the card ALSO has a title and summary: `alt=""` is correct — the adjacent heading is the accessible name of the link and a descriptive alt duplicates it, producing 'Churro on a paper tray, link, Best snacks at Islands of Adventure' on every one of 23 cards. Note that card() does NOT currently wrap card media in aria-hidden the way hero() does, so an empty alt here is the entire mechanism. (c) Any image that carries INFORMATION not present in adjacent text — a diagram of a queue split, a height-measurement illustration, an annotated land layout — needs real, specific alt text, and if the information is complex it needs a text equivalent in the page body rather than a long alt. (d) Map plates: these are already SVG, not photographs, and are out of scope for the photo pipeline. The failure mode to guard against is a generic rollout that either sets a decorative alt on an informative image or, more likely here, writes flowery marketing alt text on 405 decorative card thumbnails and makes every card grid unusable with a screen reader. The current audit check (`alt=` present) cannot tell these apart and will pass all four cases.

**Content needed** — Per new image slot added to site.json, an explicit alt value plus a `note` field stating which of the four classes it falls into and why — matching the pattern the hero slot already sets.

**Code change** — Optionally mirror hero()'s aria-hidden treatment into card()'s .card__media wrapper in src/templates/components.mjs:336 so decorative card images are removed from the a11y tree rather than relying on alt="" alone.

<sub>Evidence: data/universal/site.json photos.hero.alt = "" with note 'Decorative: alt is empty on purpose'; src/templates/components.mjs:47 `<div class="hero__media" aria-hidden="${image.alt ? 'false' : 'true'}">`; card() at :336 wraps in a plain `<div class="card__media">` with no aria-hidden; scripts/audit.mjs:182 checks only for the presence of `alt=`</sub>

### Dark mode: .photo has no edge treatment, so a bright-edged photograph loses its boundary in light mode and halos in dark mode

**🟡 MEDIUM** · effort: trivial

Images are theme-invariant; their surroundings are not. `.photo` sets only `background-color: var(--surface-3)` and has no border, outline or inset shadow, and `.card__media .photo` explicitly sets `border-radius: 0` and bleeds full-width to the card edge via `margin: 0 calc(var(--space-5) * -1)`. Consequence in DARK mode (--paper #0b0f0e, --surface #121817, --surface-3 #1f2926): a photograph with a bright sky or a firework burst at its top edge — exactly the atmospheric direction docs/ASSET-RUNBOOK.md briefs for — meets a near-black card surface with no transition, reading as a glowing panel bolted onto the page. Consequence in LIGHT mode: the same bright edge against a near-white --paper makes the card's top boundary disappear, so a 23-card grid loses its structure. The HERO is fully solved and is not the problem: main.css:385-398 layers a linear gradient plus a radial vignette, and the comment records the contrast measurement (against a ~#f6e6b8 firework, the .78 floor yields ~#2a2a24 behind the text, ~12.4:1 for white — comfortably past AA), and main.css:401-406 correctly forces light type over photography in BOTH themes since the scrim is always dark. That discipline exists for the hero and for nothing else. Any non-hero image class the audit adds needs its own equivalent decision, and the cheap general answer is a theme-aware hairline: `box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent)` on .photo, which darkens the seam on light surfaces and lightens it on dark ones from one declaration.

**Code change** — Add a theme-aware inset hairline to .photo in assets/css/main.css:357 — this is shared CSS, so it lands on the live Disney site too; verify there before shipping.

<sub>Evidence: assets/css/main.css:357-363 (.photo has background-color and background-image only, no border); :516 `.card__media .photo { aspect-ratio: 16/9; border-radius: 0 }`; :517 `.card__media { margin: 0 calc(var(--space-5) * -1) var(--space-1) }`; hero scrim at :385-398 with the contrast note at :371-378; dark tokens at :80-100 (--paper #0b0f0e, --surface #121817, --surface-3 #1f2926)</sub>

### prefers-reduced-motion: the hero handles it correctly, but the card hover transform escapes the guard and the hero runs an infinite compositor animation

**🟡 MEDIUM** · effort: trivial

Full accounting of image-related motion. CORRECT: `.photo img { animation: photo-in .5s ease both }` (a 0→1 opacity fade) is cancelled by `@media (prefers-reduced-motion: reduce) { .photo img { animation: none } }` at main.css:369. The hero Ken Burns drift — `hero-drift 24s ease-in-out infinite alternate`, scale 1.02→1.09 — is correctly declared INSIDE `@media (prefers-reduced-motion: no-preference)` at :411-413, so it never runs for users who opted out. DEFECT: at :518-520 only the TRANSITION is guarded — `@media (prefers-reduced-motion: no-preference) { .card__photo img { transition: transform .4s ... } }` — while the hover rule itself, `.card--media:hover .card__photo img { transform: scale(1.03) }` at :517, sits OUTSIDE the guard. With reduced motion requested the scale still applies, just instantaneously. The visual result is a hard 3% jump on hover rather than no movement, which is not what the user asked for and is inconsistent with how the same file treats every other motion. This rule is dead today (zero card images exist) and becomes live the moment the audit adds the first one — across up to 405 card slots. SEPARATE PERFORMANCE CONCERN, not an a11y one: hero-drift is an `infinite` transform animation on a full-bleed image, i.e. a permanently active compositor layer that never settles. On the mid-range Android this site is explicitly designed for, that is continuous GPU work and measurable battery drain for the entire time the page is open, on the same page that advertises working on bad park WiFi. Worth an explicit decision rather than inheriting it by default.

**Code change** — Move the `.card--media:hover .card__photo img` transform at assets/css/main.css:517 inside the existing prefers-reduced-motion: no-preference block at :518. Shared CSS — affects the Disney site too.

<sub>Evidence: assets/css/main.css:369 reduce guard for photo-in; :411-414 hero-drift correctly inside no-preference, `@keyframes hero-drift { from { transform: scale(1.02) } to { transform: scale(1.09) } }`; :517 `.card--media:hover .card__photo img { transform: scale(1.03) }` unguarded, versus :518-520 `@media (prefers-reduced-motion: no-preference) { .card__photo img { transition: transform .4s cubic-bezier(.2,.6,.2,1) } }`</sub>

### All 251 Universal pages currently ship twitter:card=summary and no og:image — the social slot is declared, resolves null, and is the highest-return single image on the list

**🟡 MEDIUM** · effort: trivial

`data.photo.social` resolves to null because social-card-1280.jpg is not on disk, so src/lib/data.mjs:388-389 sets site.socialImage = null and the layout's conditional at src/templates/layout.mjs:44-50 emits no og:image, no twitter:image, and falls back to `twitter:card content="summary"`. Measured across the build: 0 occurrences of og:image, 251 occurrences of twitter:card=summary. This behaviour is CORRECT — it declines to advertise an image it cannot deliver — and the audit must not propose changing the fallback. But it is worth stating plainly as the performance-and-risk counterpoint to everything else here: this is one image, at 1280x672, that never loads in a browser, never touches page weight, never enters the precache, is fetched only by social crawlers, and converts every existing and future share of all 251 pages from a bare text card into a picture. ASSET-RUNBOOK.md:25-27 already identifies it as 'the highest ratio of effort to return on this list, and it is one image'. Two format constraints the pipeline must respect and that the existing code already gets right: the URL must be absolute (it is — built from site.brand.origin) and it must be JPEG, not AVIF or WebP, because social crawlers are unreliable on modern formats — line 389 correctly hardcodes `-1280.jpg`. Note the corollary: because it is JPEG-only, the AVIF-oriented 80 KB budget needs an explicit JPEG figure for this file.

**Image needed** — A 1280x672 (1.91:1) JPEG social card for Hollywood Ride Guide — atmospheric, no characters, no logos, no readable text beyond the site's own wordmark if used — saved as assets/img/photos/social-card-1280.jpg.

<sub>Evidence: `grep -rho 'og:image' dist/universal --include=*.html | wc -l` = 0; `grep -rho 'twitter:card" content="[a-z_]*"' dist/universal --include=*.html | sort | uniq -c` = 251 summary; src/lib/data.mjs:388-389 `site.socialImage = social ? ${site.brand.origin}/assets/img/photos/${social.file}-1280.jpg : null`; src/templates/layout.mjs:44-50 conditional block; docs/ASSET-RUNBOOK.md:25-27</sub>

### photo() has zero test coverage despite being the only sanctioned way to render an image

**🟡 MEDIUM** · effort: small

88 tests pass across test/*.test.mjs and none of them exercise photo(). `grep -n 'photo(' test/*.test.mjs` returns nothing; the three files that mention 'image' at all (html, podcast, schema) do so for unrelated reasons. The specific behaviours that are load-bearing and untested: that a null img returns empty output (the entire 'declared is not real' contract), that a missing file on disk resolves the slot to null in data.mjs, that the srcset is built for every declared width in all three formats, that priority images get fetchpriority and non-priority get loading=lazy, and that alt="" round-trips as an empty attribute rather than being dropped. Right now this component is exercised by exactly one call site (src/pages/core.mjs:92) which itself renders nothing, because no file exists. The first real image drop will be the first time any of this executes in anger, across whatever number of new call sites the audit adds.

**Code change** — Add photo() unit tests to test/html.test.mjs covering the null case, the srcset matrix, the priority/lazy split, and alt="" preservation.

<sub>Evidence: `node --test test/*.test.mjs` = 88 pass / 0 fail; `grep -n 'photo(' test/*.test.mjs` = no output; `grep -rn 'image:' src/pages/*.mjs src/seasonal/*.mjs` = exactly one match, src/pages/core.mjs:92 `image: data.photo.hero`</sub>

### Adding images at scale is a 19-call-site change to shared components, not a data-only change — state the blast radius

**🟡 MEDIUM** · effort: large

The audit will likely frame 'add images' as dropping files into assets/img/photos/ and declaring them in site.json. That is true only for the hero and the social card, which are the two slots that already exist. Everything else requires template edits. There are 19 card() call sites across src/pages/*.mjs and src/seasonal/*.mjs and exactly ONE passes an `image` key (core.mjs:92, and that is hero(), not card()) — so every card image the audit proposes is a code change at a specific call site plus a new key in site.json, and there is currently no mechanism at all for per-park or per-attraction photos: data.photo is a flat map built only from site.photos, keyed by slot name, with no per-entity resolution. Note also that card()'s image support and the entire .card--media / .card__media / .card__photo CSS block are already written and shipping in main.css to both operators — 100% dead code today. And the whole of src/templates/components.mjs, src/templates/layout.mjs, assets/css/main.css and assets/js/*.js are shared with the LIVE Disney site, so any change to photo(), card(), .photo or the precache filter lands in production for Ride Ready Guide at the same time. Universal is 'draft'; Disney is not. Every shared-code recommendation needs a Disney regression check attached.

**Code change** — If per-park or per-attraction imagery is recommended, src/lib/data.mjs needs a per-entity photo resolver rather than the flat site.photos map, and each of the 19 card() call sites needs an image key wired to it.

<sub>Evidence: `grep -rn 'C\.card\(|card({' src/pages/*.mjs src/seasonal/*.mjs | wc -l` = 19; `grep -rn 'image:' src/pages/*.mjs src/seasonal/*.mjs` = 1 (core.mjs:92); src/lib/data.mjs:371-381 builds data.photo solely from site.photos with no per-park keying; assets/css/main.css:509-521 .card--media block present and unused; docs/HANDOFF-UNIVERSAL-BRIEF.md:142 separately notes shared chrome 'still renders in Disney's forest-green palette regardless of operator'</sub>

### assets/img/photos/README.md is published to the live document root

**⚪ LOW** · effort: trivial

The blanket recursive copy in copyAssets ships README.md to https://hollywoodrideguide.com/assets/img/photos/README.md (1,589 B). Its contents are internal: the naming convention, the byte budgets, the statement that the null-photo fallback is 'the state it returns to the moment an image is pulled for a rights problem', and a pointer to the internal art-direction doc. None of it is secret, but publishing the sentence about pulling images for rights problems on the public origin is an unforced disclosure, and CREDITS.md — which will contain generator names, verbatim prompts and reviewer names — would be published by the same mechanism the moment it is created. Fix the copy filter before writing CREDITS.md, not after.

**Code change** — Exclude *.md from the assets copy in src/build.mjs:527-531.

<sub>Evidence: `ls dist/universal/assets/img/photos/` = README.md; source at assets/img/photos/README.md, 1,589 B; shipped by the unfiltered `cp` at src/build.mjs:528</sub>

---

# Part 2 · Photography

Photographic assets for a diffusion model. Every prompt is paste-ready; every one carries a separate negative-conditioning string, because negation inside a positive prompt raises the odds of the thing you are excluding rather than lowering them.

*23 items in this batch.*

## Batch P · Photography — Hollywood Ride Guide (universal operator)

Twenty-three generated assets, none of which exist in `docs/ASSET-RUNBOOK.md`. This batch **extends** the runbook; it does not replace it. Everything the runbook already briefs (the fireworks hero, the Disney social card, the firework podcast mark, and section images 4b/4d/4e/4f/4g/4h) stays exactly as written and is reused here rather than re-emitted — see [Reusing the runbook's existing assets](#reusing-the-runbooks-existing-assets).

Two of the runbook's eight section images are dropped for this operator: **4a (the castle)** and **4c (the carousel)**. Universal's US parks have no castle in their brand vocabulary and no carousel signature; both read as Disney-shaped on a Universal masthead, and 4a additionally carries the single highest regeneration-failure rate of anything in the runbook.

---

### Read this before generating anything

#### 1. The one asset that unblocks the site is named in the data and briefed nowhere

`data/universal/site.json` declares `photos.hero.file = "hero-coaster-night"`. That string appears **exactly once in the entire repository** — in that JSON file. The runbook's Batch 1 briefs `hero-fireworks`, which is the *disney* declaration. Generating every asset in the runbook exactly as written leaves Hollywood Ride Guide with zero images. `hero-coaster-night` is asset **P1** below and it is the first thing to make.

#### 2. Negation does not work; two other things do

Writing "no Mickey-shaped pretzel" into a prompt encodes the token and can *raise* the odds of producing one. The runbook already says this and is right. Every prompt below therefore relies on:

- **Positive specificity.** The object is described in enough physical detail that the wrong thing has no room. "A vertical steel lift hill of open lattice track rising to a plain flat crest" leaves no gap for a licensed coaster silhouette.
- **True negative conditioning** through the tool's own parameter — Midjourney `--no`, Firefly's *Exclude* field, an SDXL/SD3 negative-prompt field. These are real mechanisms. A sentence in the prompt is not.

Each asset carries its own **self-contained** negative block. Do not assemble it from fragments; paste the whole thing.

#### 3. How each tool consumes the negative block

Every negative block below has three labelled lines. Copy the one for your tool:

- **Midjourney** — append the `--no …` line verbatim to the end of the prompt, on the same line.
- **Firefly** — paste the bare comma list (no `--no` prefix) into the *Exclude* field. Firefly has no `--no` syntax; a `--no` pasted into the prompt box becomes positive tokens.
- **SDXL / SD3 / Flux / generic** — paste the bare list plus the quality tail into the negative-prompt field.

#### 4. The review is the control, not the prompt

Run the five-step IP check on **every** output, and again on the **final encoded AVIF** rather than the generator's preview — aggressive AVIF quantisation merges adjacent blobs and can *create* a three-circle arrangement that was not in the source. Check the LQIP thumbnail too if you generate one: the head-and-two-ears silhouette is a small-scale failure mode and resolves at 20px where it is invisible at 100%.

| # | Check | ~time | Look at |
|---|---|---|---|
| 1 | Three-circle sweep | 15s | View at 100% **and** at ~10% thumbnail. Balloons, food, topiary, bokeh clusters, wheel hubs, cast shadows, reflections. Any head-and-two-ears arrangement is a reject, not a retouch. |
| 2 | Castle / skyline | 10s | Any spired structure — is the silhouette recognisable at thumbnail size? Symmetric central spire flanked by two towers = reject. |
| 3 | Text and marks | 10s | Zoom to 200% over signage, banners, uniforms, cups, wristbands. Diffusion pseudo-text resolves into trademark-adjacent strings surprisingly often. |
| 4 | Faces | 10s | Any face sharp enough to identify a specific person = reject. |
| 5 | Property silhouettes | 5s | No monorail, no recognisable ride vehicle, no Harry Potter / Star Wars / Marvel / Nintendo / DreamWorks / Simpsons / Jurassic cues. |

Record pass/fail and the reviewer's name per file in `assets/img/photos/CREDITS.md`, which **does not exist yet** and must exist before the first image ships.

#### 5. Two prerequisites that are not images

Both are one-line changes and both must land **before** the first file does.

**The footer image credit.** `docs/HANDOFF-UNIVERSAL-BRIEF.md:194` claims the footer already carries "Illustrative imagery, AI-generated". It does not — `siteFooter()` in `src/templates/layout.mjs:113-142` has no such line. Every asset in this batch is illustrative rather than documentary, and several sit at the top of pages named after a real place. On a site whose entire proposition is "we checked this and stamped it with a date", a synthetic photograph shipping unlabelled is the specific collision this line exists to prevent.

```json
"legal": {
  "imageCredit": "Illustrative imagery, AI-generated. Not photographs of the parks described."
}
```

Gate the render on at least one `data.photo.*` slot resolving non-null, so the line does not assert AI imagery on a site that currently has none.

**The social-card filename collision.** `assets/img/photos/` is a single shared directory (`ASSETS_DIR` is repo-root, `src/lib/data.mjs:19`, copied wholesale at `src/build.mjs:528`) and **both operators declare the identical stem `social-card`**. Whichever card lands on disk becomes the Open Graph image for both sites — Ride Ready Guide's card served as Hollywood Ride Guide's card on all 251 pages, on a domain that is not its own. Asset **P2** below uses the stem `social-card-universal` for exactly this reason. The hero avoids the collision by accident (`hero-fireworks` vs `hero-coaster-night`), which shows the fix is a naming convention rather than an architecture change.

#### 6. Where the files go, and what the widths mean

The pipeline convention is `assets/img/photos/<stem>-<width>.<ext>`, three formats per width, resolved by existence of the **widest** variant (`src/lib/data.mjs:370-380`). Every asset below lists its stem and widths; deliver all three formats at every listed width.

```
assets/img/photos/<stem>-640.avif   <stem>-640.webp   <stem>-640.jpg
assets/img/photos/<stem>-1280.avif  <stem>-1280.webp  <stem>-1280.jpg
assets/img/photos/<stem>-1920.avif  <stem>-1920.webp  <stem>-1920.jpg   ← full-bleed heroes only
```

**One exception, and it is load-bearing:** the social card is delivered as **JPEG only**. `src/lib/data.mjs:389` hard-codes the OG URL as `…-1280.jpg`, but the existence probe accepts `.avif` OR `.webp` OR `.jpg`. Ship an AVIF-only card and you flip all 251 pages to `summary_large_image` pointing at a file that does not exist. Facebook, X, LinkedIn and Slack scrapers do not accept AVIF regardless.

#### 7. Byte ceilings, and the one the budget forgot

`assets/img/photos/README.md` says "Hero: 120 KB maximum in AVIF at 1920. Everything else: 80 KB." It does not say *which width* the 80 KB governs, and it states no JPEG figure at all — which matters because `photo()` emits no `srcset` on the `<img>` itself (`src/templates/components.mjs:181`), so any client falling through to the JPEG downloads the **widest** one regardless of viewport. A phone on park WiFi hitting that path gets the desktop file. The figures below fill both gaps.

| Slot class | AVIF @ widest | AVIF @ 1280 | AVIF @ 640 | JPEG @ widest |
|---|---|---|---|---|
| Full-bleed hero (1920) | **120 KB** | 55 KB | 18 KB | 180 KB |
| Band / card / land (1280) | **80 KB** | — | 25 KB | 110 KB |
| Social card (1280, JPEG only) | — | — | — | **80 KB** |

The 120 KB figure exists because the home page's trust strip claims "The tools keep running on park WiFi, or on none at all" (`src/pages/core.mjs:105-107`). A cold home page today is **26.8 KB gzipped** — HTML 8,269 B + CSS 15,841 B + JS 3,327 B, zero images, zero web fonts. The first hero alone is a 5.5× multiplier. That claim does not lose to a nicer photograph; if an asset misses its ceiling and cannot be squeezed, cut the asset.

**Images never enter `PRECACHE_URLS`.** The precache filter at `src/build.mjs:555` admits any URL starting with `/assets`, so a hero path added to that array is accepted silently with no size check. The precache is currently 24 URLs / 194 KB gzipped; one 120 KB hero is a 62% increase in install payload for a resource that is decorative by declaration. The runtime cache-first handler in `sw.js` picks images up opportunistically after first view, which is the correct tier.

#### 8. Optional but recommended: put a content hash in the stem

`/assets/*` is served `Cache-Control: public, max-age=31536000, immutable` in both `_headers` and `vercel.json`. `immutable` tells the browser not to revalidate even on reload. Deleting a file for a rights problem fixes the origin only — every device that already fetched it keeps serving it for up to a year, and the null-photo fallback never fires for them because the HTML still references the path. Given that this batch is diffusion-generated against a hard IP list, "we may need to pull an image fast" is the expected case.

The fix needs **no code change**: put the hash inside the stem, where the pipeline already interpolates it.

```
assets/img/photos/hero-coaster-night.a1b2c3-1920.avif
```

```json
"file": "hero-coaster-night.a1b2c3"
```

`a1b2c3` is the first six hex characters of the SHA-256 of the 1920 AVIF. Change the image, change the hash, change the URL, and the stale copy is unreachable. The JSON blocks below use the plain stem so they are genuinely paste-ready today; adding the hash is a one-token edit to each `file` value.

#### 9. Every asset needs an LQIP, and nothing generates one

`photo()` emits `--lqip:url('…')` when `img.lqip` is present (`components.mjs:177`) and `.photo` consumes it (`main.css:361-362`). Neither declared slot has an `lqip` key and no script in the repo produces one. Without it, every image pops in from a flat slab of `--surface-3` — `#1f2926` in dark mode — which is precisely the "loading vs broken" outcome the CSS comment at `main.css:40-46` says the design exists to prevent, on the connection this site claims to work on.

Deliver, with each asset, a ~20px-wide WebP encoded as a base64 `data:` URI (300–800 B). **Budget the bytes**: the LQIP is inline in the HTML and uncompressible, so 23 of them on one page is 7–18 KB added to a 15 KB gzipped document. That is fine for one hero and one band image per page; it is not fine for a 23-card grid.

#### 10. Provenance row — write one per FILE, not per slot

A slot has up to nine files and a rights complaint names a URL. Firefly's commercial indemnification is only claimable if you can prove which generator produced which file; without this table that proof lives in someone's browser history. Add to `assets/img/photos/CREDITS.md`:

```
| file | generator + model version (or licence + source URL) | prompt | negative prompt | generated | IP checks 1-5 run by | date | C2PA |
|---|---|---|---|---|---|---|---|
| hero-coaster-night-1920.avif | Adobe Firefly Image 4 | (paste P1 positive verbatim) | (paste P1 negative verbatim) | 2026-08-16 | <name> | 2026-08-16 | present |
```

#### 11. Alt text — four classes, and the one that is not `alt=""`

| Class | Rule | Why |
|---|---|---|
| **Full-bleed hero** | `alt=""` | Sits behind text under two scrim layers; conveys mood, not information. `hero()` additionally sets `aria-hidden` on the media layer when alt is empty (`components.mjs:47`), removing it from the accessibility tree entirely. This is the reference implementation — do not "improve" it. |
| **Card thumbnail** | `alt=""` | The adjacent heading is the accessible name of the link. A descriptive alt produces "Churro on a paper tray, link, Best snacks at Islands of Adventure" on every card in a 23-card grid. `card()` does **not** wrap media in `aria-hidden`, so the empty alt is the entire mechanism here. |
| **Band / section image** | `alt=""` | Illustrative-of-an-idea, not evidence-of-a-place. Carries no information absent from the surrounding prose. |
| **Social card** | **real text** | It becomes `og:image:alt`, which is announced by screen readers on several platforms and read by crawlers. This is the one asset in the batch with non-empty alt. |

Every block below sets `alt` correctly for its class and uses the `note` field to say *why*, matching the pattern the existing hero declaration already sets.

#### 12. Which slots can render today, and which are waiting on code

Generating an asset for a slot that cannot render is wasted work. Three tiers:

| Tier | Families | Blocked on |
|---|---|---|
| **Renders once the resolver lands** (~8 lines in `src/lib/data.mjs` beside the existing `data.photo` block, plus an `image:` key at the call site) | parkHub (4), resortPages (2), monthPage (12), eventPage (5), restaurantPage (47), holidayPage (5) | Nothing else. These pass the **default** hero tone, and `.hero--photo` is fully built (`main.css:381-412`) including scrim, AA overrides, LQIP and Ken Burns drift. |
| **Needs ~4 lines of CSS first** | landPage (27), guidePage (11) | `tone:'compact'` and `.hero--photo` are mutually exclusive: `.hero--photo` sets `min-height: min(78vh, 720px)`, so a compact hero handed an image becomes a full cinematic hero — the opposite of what "compact" asks for. Add `.hero--photo.hero--compact { min-height: clamp(240px, 34vh, 400px); }`. Purely additive; nothing renders differently until an image is passed. |
| **Needs a component change first** | Band/section images | `section()` (`components.mjs:75-89`) has no `image` parameter. `photo()` is called from exactly two places — `hero()` and `card()`. All eight runbook section images could be generated, converted and budget-checked, and the diff to the rendered site would be **zero bytes across 251 pages**. |

**P1, P2 and P3 depend on none of this.** `data.photo.hero` is already wired at `src/pages/core.mjs:92` and `site.socialImage` at `src/lib/data.mjs:388`. Drop the files in and they render.

#### 13. One AA contrast fix that must land with P1

The home page hero passes both `image: data.photo.hero` and an `aside` containing `statRow` + `lastVerified` (`core.mjs:83-91`). `.hero--photo` overrides colour for exactly four selectors — `.hero__title`, `.hero__lede`, `.hero__eyebrow`, `.hero__meta-label/value` (`main.css:402-406`). `.verified` is not among them: it carries `color: var(--muted)` (`#64726e`) with no background and no scrim, at 0.8rem.

The moment `hero-coaster-night` lands, **"Everything on this site verified July 2026"** renders as mid-grey on a deep indigo night photograph, at small size, with Ken Burns drift changing the backdrop underneath it. Against the briefed indigo that is roughly 2:1. AA requires 4.5:1. This is the site's own freshness claim — the sentence the entire editorial contract rests on — rendered illegibly, on the only page that has an image.

```css
.hero--photo .hero__aside .verified { color: rgba(255,255,255,.82); }
.hero--photo .hero__aside .verified svg { color: var(--accent-2); }
```

Shared CSS; affects nothing until a hero image exists. Audit `.facts__hint` and `.small.muted` the same way before any other aside-bearing hero is given an image.

---

## Group P1–P3 · Blockers

### P1 · `hero-coaster-night` — home page hero

The declared, un-briefed asset. **Make this first.**

| | |
|---|---|
| **Stem** | `hero-coaster-night` |
| **Widths** | 640, 1280, 1920 — AVIF + WebP + JPEG at each |
| **Aspect** | 16:9 (1920×1080) |
| **Renders at** | `src/pages/core.mjs:92`, home page hero, `priority: true` (LCP) |
| **Blocked on** | Nothing. Already wired. |

#### `site.json` → `photos` (replaces the existing `hero` entry in place)

```json
"hero": {
  "file": "hero-coaster-night",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 38%",
  "note": "Decorative: alt is empty on purpose and hero() sets aria-hidden on the media layer as a result. Atmospheric night coaster silhouette, generic structure, no licensed property, no ride vehicle resembling a real attraction, no identifiable faces. Focal is high because the lift hill is upper-frame and the lower third must stay dark for the headline scrim."
}
```

#### Prompt

```
A steel roller coaster lift hill and first drop in hard silhouette against a deep indigo dusk sky
graduating to magenta near the horizon. Open lattice steel track, plain vertical support columns, a
straight lift hill rising to a flat crest and a single simple drop — an ordinary, unremarkable
layout with no inversions and no signature shaping. Photographed from ground level, looking up and
slightly off-axis so the structure crosses the upper right two thirds of the frame as a black
graphic form. In the lower third, out of focus at f/1.8: strings of warm tungsten bulbs and the
blurred glow of a low plain-fronted building, all of it deep blue-black with no bright detail and
no legible shape. Empty sky occupies the left third. Full-frame camera, 35mm prime, wide aperture,
natural dusk light, slight film grain, warm highlights and cool shadows, deep shadows that retain
detail. Editorial documentary photography, photorealistic, a magazine photo essay rather than a
brochure. 16:9.
```

#### Negative conditioning

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, cartoon characters, mascot costumes, costumed characters, castle, spires, fairytale towers, monorail, recognisable ride vehicle, riders, faces, crowd, three circles, character-shaped objects, balloons, fireworks, brand marks, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, cartoon characters, mascot costumes, costumed characters, castle, spires, fairytale towers, monorail, recognisable ride vehicle, riders, faces, crowd, three circles, character-shaped objects, balloons, fireworks, brand marks, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, cartoon characters, mascot costumes, costumed characters, castle, spires, fairytale towers, monorail, recognisable ride vehicle, riders, faces, crowd, three circles, character-shaped objects, balloons, fireworks, brand marks, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920. The home page claims the tools run on park WiFi and this is the LCP element on the page making the claim.

**Acceptance check:** Cover the top two thirds with your hand — the remaining lower third must be near-black with no bright detail, because the H1 and lede sit there over a scrim tuned to about 12.4:1. If the string lights are bright enough to read individually, regenerate.

---

### P2 · `social-card-universal` — Open Graph card, all 251 pages

Currently **0 of 251 pages emit `og:image`** and 251 of 251 emit `twitter:card=summary`. Every share of every Hollywood Ride Guide URL on X, Facebook, LinkedIn, iMessage, Slack and WhatsApp is a bare text link — and the only image any platform can currently show is `/assets/img/favicon.svg`, which is the *Ride Ready Guide* monogram in the Disney palette. This is one image that never loads in a browser, never touches page weight, never enters the precache, and is fetched only by crawlers. Highest effort-to-return item in the batch.

**This is a composite, not a single generation.** The card must carry the wordmark "Hollywood Ride Guide", and no generated image may contain readable text — diffusion lettering is unreliable and illegible at feed thumbnail size. So: generate the **backplate** with the prompt below, then set the type over it in the repo or a vector tool. The prompt reserves a dead zone for exactly that.

| | |
|---|---|
| **Stem** | `social-card-universal` (renamed from `social-card` — see the collision note above) |
| **Widths** | 640, 1280 — **JPEG only** |
| **Aspect** | 1.91:1 (1280×672; the platform-canonical 1200×630 crops from this without loss) |
| **Renders at** | `src/lib/data.mjs:389` → `layout.mjs:44-50`, all 251 pages |
| **Blocked on** | Nothing. |

#### `site.json` → `photos` (replaces the existing `social` entry in place)

```json
"social": {
  "file": "social-card-universal",
  "alt": "Hollywood Ride Guide — independent, unofficial planning for the four US Universal theme parks.",
  "width": 1280,
  "height": 672,
  "widths": [640, 1280],
  "note": "Open Graph / Twitter card, 1.91:1. Alt is real text on purpose: it becomes og:image:alt, which is announced by screen readers on several platforms and read by crawlers, so the decorative-alt rule that governs every other slot does not apply here. Stem is operator-suffixed because assets/img/photos/ is shared between operators and both previously declared the bare stem 'social-card'. JPEG only: data.mjs:389 hard-codes the -1280.jpg URL and social crawlers do not accept AVIF."
}
```

#### Prompt — backplate only, no type

```
A deep navy field, hex 1b3a5c, filling the frame, with a single steel roller coaster lift hill in
flat black silhouette entering from the right edge and rising toward the upper right corner. Open
lattice track, plain vertical columns, no inversions, no signature shaping. The left sixty percent
of the frame is empty navy with a very gentle darkening toward the lower left corner and no detail
whatsoever. Along the bottom eighth, a thin band of small out-of-focus warm amber points of light,
low contrast, suggesting distant bulbs. Simple, graphic, high contrast, two colours plus black.
Composed so that cropping to a centred square or to 2:1 loses nothing important. Must read as a
distinct shape at 200 pixels wide in a social feed. Photorealistic silhouette against flat colour,
minimal grain, no vignette. 1.91:1 landscape.
```

#### Negative conditioning

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, typography, signage, logos, wordmarks, watermarks, busy composition, clutter, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, gradients across the whole frame, photographic background detail

FIREFLY — paste into the Exclude field:
text, lettering, typography, signage, logos, wordmarks, watermarks, busy composition, clutter, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, gradients across the whole frame, photographic background detail

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, typography, signage, logos, wordmarks, watermarks, busy composition, clutter, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, gradients across the whole frame, photographic background detail, lowres, jpeg artifacts, oversaturated, hdr halo
```

#### Typesetting pass, after generation

Set over the empty left 60%, inside a centred 80% safe area (every platform crops the outer margin):

- **Hollywood Ride Guide** — the wordmark, large, in `--paper` `#faf8f4`
- **Independent & unofficial** — one line beneath, smaller, in amber `#a9660f` lightened for contrast against navy

Nothing else. No stat figures, no dates, no URL. This card is shown at ~200px wide in a feed and three lines is already the ceiling.

**Ceiling:** 80 KB JPEG @1280, 30 KB @640. Crawler-fetched only, so this never affects page weight — the ceiling exists because several crawlers time out on slow large images and fall back to no card, which is the exact failure this asset is fixing.

**Acceptance check:** Scale the finished composite to 200px wide and look at it on a phone. If the wordmark is not comfortably readable, or the coaster silhouette has become a grey smear, regenerate the backplate darker and set the type larger.

---

### P3 · `podcast-art-universal` — square podcast artwork, 3000×3000

The runbook's Batch 3 briefs a firework mark, which is Ride Ready Guide's motif. `data/universal/site.json` has **no `podcast` block at all** (disney has a 10-field scaffold at `site.json:356-367`), so this is blocked on the config work too — but the artwork is the long-lead item and Apple requires it for directory submission.

Apple requires square, 1400–3000px, JPEG or PNG. It is displayed at roughly **55 px** in a phone list.

| | |
|---|---|
| **Stem** | `podcast-art-universal-3000` (single file, not the width-suffixed pipeline — hosted off-origin) |
| **Delivery** | `3000×3000` JPEG, hosted on R2 or equivalent, referenced by absolute URL in `site.json` `podcast.artwork` |
| **Blocked on** | The `podcast` block in `data/universal/site.json`, plus a provisioned owner email and `audioBase` — `src/lib/podcast.mjs:116` returns null without both. |

**Not in `photos`.** This never enters `assets/img/photos/` and never ships in the site payload. `.git` is 46 MB already.

#### Prompt

```
Album artwork for a travel podcast. A single stylised roller coaster lift hill and drop rendered as
one bold flat black silhouette against a deep navy field, hex 1b3a5c, with a warm amber horizon
glow rising from the lower edge behind it. Flat and graphic rather than photographic: bold shapes,
three colours only, hard edges, no texture and no gradient except the single amber glow. The track
form is centred, occupying the middle sixty percent, with generous even margin on all four sides.
Deliberately simple — it must remain legible and distinctive when reduced to fifty-five pixels
square. No text, no lettering, no characters, no castle, no people. Square 1:1.
```

#### Negative conditioning

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, typography, signage, logos, wordmarks, watermarks, fine detail, texture, photorealism, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, drop shadows, bevels, gloss

FIREFLY — paste into the Exclude field:
text, lettering, typography, signage, logos, wordmarks, watermarks, fine detail, texture, photorealism, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, drop shadows, bevels, gloss

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, typography, signage, logos, wordmarks, watermarks, fine detail, texture, photorealism, crowd, faces, people, castle, spires, cartoon characters, mascot costumes, three circles, character-shaped objects, fireworks, drop shadows, bevels, gloss, lowres, jpeg artifacts, noise, banding
```

**Ceiling:** 500 KB JPEG. Not a page-weight constraint — it is a courtesy ceiling so directory validators do not time out fetching it.

**Acceptance check:** Reduce to 55×55 and put it beside four other podcast tiles. If it reads as a dark square rather than a shape, thicken the silhouette and increase the amber glow. Set the show title typographically in the directory metadata; do not bake words into the art.

---

## Group P4–P9 · Park and resort heroes

Six full-bleed heroes for the four park hubs and two resort hubs. `parkHub` (`src/pages/park.mjs:15`) and `resortPages` (`src/pages/core.mjs:314`) both pass the **default** hero tone, so these render with no CSS work — only the per-entity resolver.

#### The honesty problem, stated plainly

An atmospheric image at the top of a page headlined "Islands of Adventure" will be read as a photograph of Islands of Adventure. It is not one, cannot be one, and the hard constraints forbid the elements that would make it one. Three things make this shippable rather than a quiet fabrication:

1. **The footer credit line must be live first** — "Illustrative imagery, AI-generated. Not photographs of the parks described." Non-negotiable prerequisite, not a follow-up.
2. **The prompts describe environment *types*, not places.** A backlot street at dusk is a real category of built environment that hundreds of studio lots share; it is not a portrait of anyone's.
3. **`alt=""` throughout.** These images make no claim in the accessibility tree, which is where a claim would be machine-readable.

#### The resolver these six depend on

```js
// src/lib/data.mjs, beside the existing data.photo block (~line 380)
data.photoFor = (key) => (key && data.photo[key]) || null
```

…then `image: data.photoFor(park.photo)` at the `hero()` call site, and a `"photo": "hero-park-usf"` string on the park record. Same `existsSync` gate, same null-means-absent contract. No change to `hero()`, `photo()` or `card()`.

---

### P4 · `hero-park-usf` — Universal Studios Florida

| | |
|---|---|
| **Stem** | `hero-park-usf` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-orlando/universal-studios-florida/` (1 page) |
| **Why this archetype** | USF's non-licensed spine is Production Central, New York, San Francisco and Hollywood — a working studio backlot. That is the park's own architectural grammar and the only part of it that can be depicted at all. |

```json
"hero-park-usf": {
  "file": "hero-park-usf",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 42%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative studio-backlot street archetype, not a photograph of Universal Studios Florida. No readable signage, no licensed theming, no identifiable faces. Requires the footer image-credit line to be live."
}
```

```
A studio backlot street at dusk: two rows of tall plain building facades in weathered painted
brick and stucco, cream and dusty red, receding toward a vanishing point left of centre. Blank
signboards and empty fascia panels above the shopfronts, unpainted and bearing nothing. Wet asphalt
reflecting the sky. Overhead, a single row of bare tungsten festoon bulbs strung between the
buildings, just lit. Deep teal-blue sky above with the last warm band of sunset low on the horizon
at the end of the street. Two or three anonymous figures far down the street in near-silhouette,
too distant for any face. The lower third of the frame is deep shadow across the wet road with no
bright detail. Full-frame camera, 35mm prime, f/2, natural dusk light, rich but believable colour,
warm highlights, cool shadows, slight film grain. Editorial documentary photography, photorealistic.
16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, shop names, street signs, logos, wordmarks, watermarks, water tower, cartoon characters, mascot costumes, costumed characters, castle, spires, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, neon lettering, billboards, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, shop names, street signs, logos, wordmarks, watermarks, water tower, cartoon characters, mascot costumes, costumed characters, castle, spires, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, neon lettering, billboards, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, shop names, street signs, logos, wordmarks, watermarks, water tower, cartoon characters, mascot costumes, costumed characters, castle, spires, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, neon lettering, billboards, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Zoom to 200% along every fascia panel and shopfront. Backlot streets are the highest-risk archetype in this batch for pseudo-text — diffusion fills blank signboards unprompted. One legible character anywhere is a regenerate. Second: confirm no tall cylindrical water tower appears on the skyline.

---

### P5 · `hero-park-ioa` — Islands of Adventure

| | |
|---|---|
| **Stem** | `hero-park-ioa` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-orlando/islands-of-adventure/` (1 page) |
| **Why this archetype** | IOA's islands ring a central lagoon. The water and the far-shore structure at dusk is the park's only depictable organising fact; every island itself is licensed. |

```json
"hero-park-ioa": {
  "file": "hero-park-ioa",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 40%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative lagoon-and-far-shore archetype, not a photograph of Islands of Adventure. No licensed theming, no readable signage, no identifiable faces. Requires the footer image-credit line to be live."
}
```

```
A wide still lagoon at blue hour seen from a low waterside path, the far shore a continuous band of
low structures and dense subtropical planting reduced almost to silhouette, their warm window and
path lights doubling as broken reflections across the black water. Palms and live oaks break the
skyline irregularly. One plain open steel structure — simple lattice, no track shaping — rises above
the treeline at the right edge, dark against the sky. Deep indigo overhead grading to a narrow warm
amber band at the horizon. The near foreground is an out-of-focus dark railing and paving occupying
the bottom fifth, with no bright detail anywhere in the lower third. No people in the foreground.
Full-frame camera, 35mm prime, f/1.8, long natural blue-hour exposure, rich but believable colour,
warm highlights, cool shadows, slight film grain. Editorial documentary photography, photorealistic.
16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, castle, spires, fairytale towers, dinosaurs, superheroes, wizards, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, fireworks, neon lettering, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, castle, spires, fairytale towers, dinosaurs, superheroes, wizards, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, fireworks, neon lettering, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, castle, spires, fairytale towers, dinosaurs, superheroes, wizards, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, fireworks, neon lettering, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Look at the far-shore skyline at 10% thumbnail size. If any structure resolves into spires, a castle silhouette, or a recognisable themed form, regenerate — a lagoon with a spired building on the far shore is the single most likely wrong output here.

---

### P6 · `hero-park-epic` — Epic Universe

| | |
|---|---|
| **Stem** | `hero-park-epic` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-orlando/epic-universe/` (1 page) |
| **Why this archetype** | Celestial Park is the park's hub and the only one of its five lands that is not a licensed property. It is a landscaped garden promenade with water features — depictable, and genuinely the park's front door. |

```json
"hero-park-epic": {
  "file": "hero-park-epic",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 45%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative landscaped-promenade archetype, not a photograph of Epic Universe. No licensed theming, no readable signage, no identifiable faces. Requires the footer image-credit line to be live."
}
```

```
A broad landscaped promenade at night: a wide pale stone walkway flanked by clipped hedges and
mature specimen trees, leading to a large circular ornamental fountain whose jets are lit warm gold
from below and caught mid-arc. Low bronze bollard lights line the path at ankle height. Beyond the
fountain, symmetrical low pavilion structures in plain pale stone with tall slender columns and flat
roofs — restrained neoclassical, no ornament, no spires, no domes. Deep navy sky above with a
scattering of stars. Warm gold light pools on wet stone in the foreground; the bottom third of the
frame is dark paving with no bright detail. A handful of distant anonymous figures near the
pavilions, small and unlit. Full-frame camera, 35mm prime, f/1.8, long natural night exposure, rich
but believable colour, warm highlights, cool shadows, slight film grain. Editorial documentary
photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, castle, spires, turrets, domes, fairytale architecture, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, topiary animals, fireworks, neon, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, castle, spires, turrets, domes, fairytale architecture, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, topiary animals, fireworks, neon, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, castle, spires, turrets, domes, fairytale architecture, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, three circles, character-shaped objects, topiary animals, fireworks, neon, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Inspect the hedges and topiary at 10% thumbnail. Clipped hedge masses are a reliable source of accidental three-circle silhouettes. Also confirm the pavilions have flat roofs — the moment a dome or spire appears this becomes a castle problem.

---

### P7 · `hero-park-ush` — Universal Studios Hollywood

| | |
|---|---|
| **Stem** | `hero-park-ush` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-hollywood/universal-studios-hollywood/` (1 page) |
| **Why this archetype** | This park's defining physical fact is that it is built on a hillside in two levels joined by a long escalator bank, above the San Fernando Valley. That is geography, not IP, and no other park on the site has it. |

```json
"hero-park-ush": {
  "file": "hero-park-ush",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 35%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative hillside-terrace archetype, not a photograph of Universal Studios Hollywood. No licensed theming, no readable signage, no identifiable faces. Focal is high because the valley haze band sits upper-frame. Requires the footer image-credit line to be live."
}
```

```
Looking out from a high terrace on a hillside at golden hour, across a wide flat valley of low
buildings dissolving into warm brown haze toward distant dry hills. In the near foreground on the
left, the top of a long covered outdoor escalator bank descending steeply out of frame, its plain
metal balustrades and canopy in dark silhouette against the light. Mature palms and dusty
drought-tolerant planting along the terrace edge. Hard low Californian sun raking across from the
right, lens flare kept minimal, strong warm colour in the haze and cool blue in the shadow side of
every surface. The bottom third is the dark terrace paving and balustrade in shadow with no bright
detail. One or two anonymous figures at the escalator head, backlit to silhouette. Full-frame
camera, 35mm prime, f/2.8, natural late-afternoon light, rich but believable colour, slight film
grain. Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, hollywood sign, water tower, billboards, castle, spires, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, hollywood sign, water tower, billboards, castle, spires, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, hollywood sign, water tower, billboards, castle, spires, cartoon characters, mascot costumes, costumed characters, recognisable ride vehicle, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Scan the far hillside at 200%. A hillside above Los Angeles is the highest-probability location in this entire batch for the model to render large white letterforms unprompted. Any letter-like shape on a hill = regenerate.

---

### P8 · `hero-resort-orlando` — Universal Orlando Resort hub

| | |
|---|---|
| **Stem** | `hero-resort-orlando` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-orlando/` (1 page) |
| **Why this archetype** | A resort hub is about arrival and scale — the walk from the car to the gate, the fact that this is now a two-campus destination. Not a park interior. |

```json
"hero-resort-orlando": {
  "file": "hero-resort-orlando",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 45%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative arrival-walk archetype, not a photograph of Universal Orlando. No licensed theming, no readable signage, no identifiable faces. Requires the footer image-credit line to be live."
}
```

```
Early morning arrival: a long covered pedestrian walkway on a raised concrete deck, plain steel
columns and a flat canopy above, curving gently away to the right toward a distant low entrance
structure. Warm low sun from behind camera throws long parallel column shadows across the deck. A
loose stream of people walking away from camera, all in near-silhouette and none close enough for a
face, carrying backpacks and pushing strollers. Subtropical planting and tall thin palms beyond the
walkway rail on the left. Pale sky with high thin cloud. The bottom third is the deck surface in
shadow, textured concrete, no bright detail. Full-frame camera, 35mm prime, f/2.8, natural early
light, rich but believable colour, warm highlights, cool shadows, slight film grain. Editorial
documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, branded merchandise, character ears, monorail, castle, spires, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, balloons, banners, billboards

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, branded merchandise, character ears, monorail, castle, spires, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, balloons, banners, billboards

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, branded merchandise, character ears, monorail, castle, spires, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, balloons, banners, billboards, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Look at every head in the crowd at 200%. Character-ear headbands are a near-reflexive output for "theme park crowd" and are the single fastest way to put a competitor's trademark on this page. Any headband silhouette = regenerate.

---

### P9 · `hero-resort-hollywood` — Universal Hollywood hub

| | |
|---|---|
| **Stem** | `hero-resort-hollywood` · widths 640/1280/1920 · 16:9 |
| **Covers** | `/universal-hollywood/` (1 page) |
| **Why this archetype** | The Hollywood resort is one gate in a city, reached by freeway and by rail — the opposite arrival to Orlando's. Making the two resort heroes visually different is the point. |

```json
"hero-resort-hollywood": {
  "file": "hero-resort-hollywood",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 40%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative city-arrival archetype, not a photograph of Universal Studios Hollywood or its surroundings. No licensed theming, no readable signage, no identifiable faces. Requires the footer image-credit line to be live."
}
```

```
A wide multi-lane road curving up a dry Californian hillside in the last hour of daylight, mature
palms and eucalyptus along the verge, low pale concrete retaining walls, and beyond it the flat
valley below already in blue shadow while the ridge line still holds warm gold. Traffic reduced to
soft light trails on a long exposure. A plain unmarked pedestrian overpass crosses the road in the
middle distance, flat and utilitarian, in silhouette. Sky graduating from warm apricot at the
horizon to deep blue overhead. The bottom third is the road surface and verge in deep shadow with
no bright detail. No people, no faces. Full-frame camera, 35mm prime, f/2.8, natural golden-hour
light with a long exposure for the traffic, rich but believable colour, warm highlights, cool
shadows, slight film grain. Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, road signs, freeway signs, logos, wordmarks, watermarks, hollywood sign, billboards, water tower, castle, spires, cartoon characters, mascot costumes, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners

FIREFLY — paste into the Exclude field:
text, lettering, signage, road signs, freeway signs, logos, wordmarks, watermarks, hollywood sign, billboards, water tower, castle, spires, cartoon characters, mascot costumes, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, road signs, freeway signs, logos, wordmarks, watermarks, hollywood sign, billboards, water tower, castle, spires, cartoon characters, mascot costumes, close faces, portraits, celebrity likeness, three circles, character-shaped objects, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Roads attract signage. Zoom to 200% on every gantry, verge post and overpass fascia; a single legible glyph is a regenerate. Then re-check the hillside for letterforms, same as P7.

---

## Group P10–P13 · Seasonal — four images, twelve month pages

`monthPage` (`src/seasonal/months.mjs:24`) passes the **default** hero tone and carries a `gradeBadge` aside. These render with the resolver alone.

The editorial cut here comes straight out of the month data, and it is a genuine finding no competitor states: **July is 93°F at both resorts and a completely different day.** Orlando has 17 rain days; Hollywood has 0. Imagery keyed to *weather as a place* rather than to a calendar month therefore covers both resorts honestly with four assets instead of twelve.

| Asset | Months it covers | Data it reflects |
|---|---|---|
| `season-wet-heat` | Jun (D+), Jul (D-), Aug (C-), Sep (A) | Orlando 15–17 rain days, dewpoints in the 70s, lightning closures |
| `season-dry-heat` | Jul, Aug, Sep — Hollywood side | Hollywood 0–1 rain days at the same 93–94°F |
| `season-mild` | Feb (A), Mar (C), Apr (C+), May (B+), Oct (B-), Nov (B+) | The comfortable band at both resorts |
| `season-cold-night` | Dec (C-), Jan (A-) | Orlando lows near 50, Hollywood evenings in the mid-40s, water rides closing |

Also reused by `holidayPage` (5 pages), `/when-to-go/`, `/calendar/` and `/tools/trip-timing/`.

---

### P10 · `season-wet-heat`

| | |
|---|---|
| **Stem** | `season-wet-heat` · widths 640/1280/1920 · 16:9 |

```json
"season-wet-heat": {
  "file": "season-wet-heat",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative weather archetype for the wet-heat months, not a photograph of any park. No licensed theming, no readable signage, no identifiable faces."
}
```

```
Heavy afternoon rain hitting hot asphalt: a wide empty walkway seen at low camera height, the
surface streaming with water and throwing back a broken mirror of a bruised purple-grey storm sky.
Rain visible as hard diagonal streaks against the dark. A single towering cumulonimbus fills the
upper half, lit dull silver at its top edge by sun breaking through behind it. Along both edges of
the walkway, people sheltering under a plain flat canopy in the middle distance, compressed
together, all in shadow and none close enough for a face; a few cheap clear plastic ponchos catching
the light. Steam rising faintly off the asphalt. Saturated but believable colour, very deep shadows
that retain detail, strong contrast between the near-black paving and the silver cloud. Full-frame
camera, 35mm prime, f/2.8, natural storm light, slight film grain. Editorial documentary
photography, photorealistic, honest rather than flattering. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, umbrellas with branding, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, rainbow, sunbeams, cheerful mood

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, umbrellas with branding, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, rainbow, sunbeams, cheerful mood

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, umbrellas with branding, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, rainbow, sunbeams, cheerful mood, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Does it look *unpleasant*? This image sits above a page that grades July D-. If the output reads as a romantic rainy day rather than a miserable one, the site's voice and its imagery are arguing with each other — regenerate darker and flatter.

---

### P11 · `season-dry-heat`

| | |
|---|---|
| **Stem** | `season-dry-heat` · widths 640/1280/1920 · 16:9 |

```json
"season-dry-heat": {
  "file": "season-dry-heat",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative weather archetype for dry-heat months on the California side, not a photograph of any park. No licensed theming, no readable signage, no identifiable faces."
}
```

```
Hard mid-afternoon sun on a bleached concrete plaza, shot into the light: heat shimmer distorting
the far edge of the frame, shadows short and black directly beneath everything, colour drained
toward pale ochre and white. A narrow band of shade cast by a plain flat canopy runs across the
middle distance, and a dozen people are compressed into it, seated on a low wall, in silhouette and
none close enough for a face. Dry drought-tolerant planting and dusty palms along the edges, leaves
hanging still. Cloudless bleached-blue sky with no gradient. Foreground concrete fills the lower
third, blindingly bright with visible aggregate texture. Full-frame camera, 35mm prime, f/8, harsh
natural overhead sun, high contrast, slight film grain. Editorial documentary photography,
photorealistic, honest rather than flattering. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, lush green lawn, blue swimming pool, holiday brochure mood

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, lush green lawn, blue swimming pool, holiday brochure mood

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, lush green lawn, blue swimming pool, holiday brochure mood, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Put it beside P10. If a reader cannot tell within a second that one is wet heat and the other is dry heat, the pair has failed its only job and the weaker one gets regenerated.

---

### P12 · `season-mild`

| | |
|---|---|
| **Stem** | `season-mild` · widths 640/1280/1920 · 16:9 |

```json
"season-mild": {
  "file": "season-mild",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 45%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative weather archetype for the comfortable months, not a photograph of any park. No licensed theming, no readable signage, no identifiable faces."
}
```

```
Clear low-humidity morning light across a wide open walkway: long clean shadows from a low sun,
air visibly clear with no haze, a deep saturated blue sky with one or two small high clouds.
People moving unhurriedly in loose groups across the middle distance, jackets carried rather than
worn, all far enough away that no face is legible. Mature trees along the walkway holding crisp
detail in both highlight and shadow. Plain low buildings with blank fascias at the edges of the
frame. The bottom third is paving in even open shade. Restrained, believable colour — this is the
one image in the seasonal set that is allowed to look genuinely pleasant, without becoming a
brochure. Full-frame camera, 35mm prime, f/2.8, natural morning light, slight film grain. Editorial
documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, balloons, confetti, lens flare, glossy advertising look

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, balloons, confetti, lens flare, glossy advertising look

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, balloons, confetti, lens flare, glossy advertising look, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** This is the batch's highest brochure-gloss risk — "pleasant weather" is what stock photography is *for*. If it could appear unaltered in a resort advertisement, regenerate with harder shadows and less colour.

---

### P13 · `season-cold-night`

| | |
|---|---|
| **Stem** | `season-cold-night` · widths 640/1280/1920 · 16:9 |

```json
"season-cold-night": {
  "file": "season-cold-night",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 45%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative weather archetype for the cold-evening months, not a photograph of any park. No licensed theming, no readable signage, no identifiable faces."
}
```

```
A cold clear evening after dark on a wide walkway: people in coats, hoods up, hands in pockets,
walking briskly away from camera in small groups, all in silhouette against distant warm lamplight
and none close enough for a face. Breath faintly visible. Bare deciduous branches against a deep
navy sky at the frame edges, alongside palms, the mismatch deliberate. Warm sodium and tungsten
lamps pooling on dry paving, everything outside those pools falling to near-black. A closed and
unlit low structure on the right with its shutters down. Strong colour temperature split: amber
light, blue shadow. The bottom third is dark paving with no bright detail. Full-frame camera, 35mm
prime, f/1.8, natural available night light, slight film grain. Editorial documentary photography,
photorealistic, quiet and a little bleak. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, snow, christmas decorations, wreaths, holiday lights, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, fireworks

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, snow, christmas decorations, wreaths, holiday lights, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, fireworks

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, snow, christmas decorations, wreaths, holiday lights, character ears, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, fireworks, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** No snow and no festive decoration. This covers January as much as December, and January at both resorts grades A- precisely *because* it is quiet — a Christmas-looking image would contradict the page it sits on.

---

## Group P14–P15 · Event nights — two images, ten pages

`eventPage` (`src/seasonal/events.mjs:46`, 5 pages) passes the default hero tone; `editionPage` (`events.mjs:190`, 5 pages) inherits its parent event's image and needs nothing new.

**The hard constraint that shapes both of these:** the five universal events are Halloween Horror Nights ×2, Grinchmas, Holidays at Universal Orlando, and Mardi Gras. Their visible content is scare actors in licensed-property costumes, a licensed holiday character, and parade floats. **None of it can be depicted.** What remains — and what is genuinely what these nights feel like — is the light, the fog and the empty street between the crowds.

---

### P14 · `event-night-fog` — Halloween season

Covers `halloween-horror-nights-orlando`, `halloween-horror-nights-hollywood`, and their 2025 editions (4 pages).

| | |
|---|---|
| **Stem** | `event-night-fog` · widths 640/1280/1920 · 16:9 |

```json
"event-night-fog": {
  "file": "event-night-fog",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative night-atmosphere archetype for the autumn event pages. Deliberately contains no performers, no costumes, no props and no scare imagery, because everything an actual event night shows is licensed. No readable signage, no identifiable faces."
}
```

```
A narrow empty street at night, thick with low-lying theatrical fog that swallows everything below
knee height and diffuses every light source into a soft ball. Two rows of plain unlit building
facades in weathered paint recede into the murk; their signboards are blank and empty. A single bare
bulb on a wall bracket, and one shaft of hard white light angling down from an unseen source high
on the left, cutting through the fog as a visible beam. Deep greens and cold blues throughout with
one small pool of dirty amber. Wet cobbles catching the light in the lower third, otherwise near
black. Completely empty of people. Full-frame camera, 35mm prime, f/1.4, available light only,
heavy atmosphere, deep shadows that retain detail, slight film grain. Editorial documentary
photography, photorealistic, tense and quiet rather than gory. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, people, performers, actors, costumes, masks, monsters, zombies, clowns, blood, gore, pumpkins, jack-o-lanterns, skeletons, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, faces

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, people, performers, actors, costumes, masks, monsters, zombies, clowns, blood, gore, pumpkins, jack-o-lanterns, skeletons, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, faces

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, people, performers, actors, costumes, masks, monsters, zombies, clowns, blood, gore, pumpkins, jack-o-lanterns, skeletons, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, faces, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Scan the fog at 200% for emerging figures. Diffusion models resolve ambiguous fog into humanoid silhouettes readily, and a masked figure here is both an IP risk and a tonal one. Any figure at all = regenerate. Also confirm every signboard is genuinely blank.

---

### P15 · `event-night-lights` — holiday and spring events

Covers `grinchmas-at-universal-hollywood`, `holidays-at-universal-orlando`, `universal-orlando-mardi-gras`, and their editions (6 pages).

| | |
|---|---|
| **Stem** | `event-night-lights` · widths 640/1280/1920 · 16:9 |

```json
"event-night-lights": {
  "file": "event-night-lights",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 40%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative night-atmosphere archetype for the holiday and spring event pages. Deliberately contains no characters, no floats, no themed decoration and no readable signage, because everything an actual event night shows is licensed. No identifiable faces."
}
```

```
Looking up a street at night at dense overlapping catenaries of bare warm tungsten festoon bulbs
strung between plain building facades, hundreds of small points of light filling the upper two
thirds of the frame and receding to a soft golden haze at the vanishing point. The buildings
themselves are dark and plain with blank fascias. Below, a crowd rendered only as a dark textured
mass of heads and shoulders in the lower third, heavily out of focus at f/1.4, no face resolvable,
lit only by the bulbs above. Warm amber highlights, deep blue-black shadows, generous bokeh, a
little atmospheric haze catching the light. The bottom fifth is near black. Full-frame camera, 35mm
prime, f/1.4, available light only, slight film grain. Editorial documentary photography,
photorealistic, celebratory but not saccharine. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, christmas trees, wreaths, tinsel, baubles, snowflakes, parade floats, beads, masks, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, coloured fairy lights

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, christmas trees, wreaths, tinsel, baubles, snowflakes, parade floats, beads, masks, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, coloured fairy lights

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, christmas trees, wreaths, tinsel, baubles, snowflakes, parade floats, beads, masks, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, coloured fairy lights, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** This one asset serves both a Christmas event and Mardi Gras, so it must belong to neither. Any bauble, wreath, snowflake or string of purple-green-gold beads makes it season-specific and it stops covering three of the six pages.

---

## Group P16–P18 · Dining service tiers — three images, forty-seven pages

`restaurantPage` (`src/pages/dining.mjs:121`, 47 pages) passes the **default** hero tone with a `factPanel` aside. Renders with the resolver alone.

The 47 standalone dining pages split cleanly by service tier: **quick-service 24, lounge 10, table-service 7, bakery 4, snack-cart 2**. Three room-tone images cover all 47 — bakery and snack-cart ride with the counter image, which is honest because the shot includes a lit food case.

**These are rooms, not plates.** Every food card on this site carries a specific name, a specific price, a dated verification and a first-person verdict. A generated image of a named snack at a stated price is a fabricated record of a real product — materially different from an atmospheric room shot, and the exact failure the site's editorial policy forbids on every other axis. **Do not add an image parameter to `foodCard()`.** Snack imagery, if any, is the single band-level "fair food" image (runbook 4e) on the four best-snacks pages, never keyed to an item.

---

### P16 · `dining-counter` — quick-service, bakery, snack cart (30 pages)

| | |
|---|---|
| **Stem** | `dining-counter` · widths 640/1280/1920 · 16:9 |

```json
"dining-counter": {
  "file": "dining-counter",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative counter-service room-tone archetype shared across quick-service, bakery and snack-cart pages. Not a photograph of any named location and not a depiction of any named menu item. No readable signage, no menu boards, no identifiable faces."
}
```

```
The interior of a counter-service food outlet in late afternoon, shot wide from a customer's
eye level: a long stainless steel and tiled service counter running left to right, a glass-fronted
warming and pastry case at one end lit from within, and above the counter a row of blank unlit
display panels bearing nothing at all. Behind the counter, one staff member in a plain solid
charcoal shirt with no logo, no badge and no name tag, seen from the side and slightly out of focus,
head turned away. Warm practical lighting from above the counter, cooler daylight spilling in from
an unseen opening on the left. Worn tiles, condensation on the case glass, a stack of plain kraft
trays. Rich but believable colour, deep shadows retaining detail. Full-frame camera, 35mm prime,
f/2, available light, slight film grain. Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, menu board, price list, signage, logos, wordmarks, watermarks, brand packaging, cups with logos, name tags, badges, character-shaped food, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, pretzels, ice cream bars

FIREFLY — paste into the Exclude field:
text, lettering, menu board, price list, signage, logos, wordmarks, watermarks, brand packaging, cups with logos, name tags, badges, character-shaped food, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, pretzels, ice cream bars

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, menu board, price list, signage, logos, wordmarks, watermarks, brand packaging, cups with logos, name tags, badges, character-shaped food, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, pretzels, ice cream bars, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Two passes. First, every menu panel must be genuinely blank — a menu board is the single most text-attracting object in this batch. Second, inspect the contents of the pastry case at 200% and at 10%: theme-park food is the canonical three-circle failure, and a case full of ambiguous round pastries is exactly where one appears.

---

### P17 · `dining-room` — table service (7 pages)

| | |
|---|---|
| **Stem** | `dining-room` · widths 640/1280/1920 · 16:9 |

```json
"dining-room": {
  "file": "dining-room",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 48%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative table-service room-tone archetype. Not a photograph of any named restaurant. No readable signage, no branded tableware, no identifiable faces."
}
```

```
A table-service dining room at dusk, shot wide from the doorway: rows of set tables with plain
white linen and simple unbranded glassware, dark timber chairs, a banquette running along the left
wall. Large windows on the right filled with deep blue evening light, warm pendant lamps low over
each table providing the only interior light, so the room reads amber against blue. Two or three
tables occupied by diners rendered small and out of focus in the middle distance, no face
resolvable. Plain unadorned walls with no pictures and no signage. Reflections of the pendants in
the window glass. Rich but believable colour, deep shadows retaining detail, no flash. Full-frame
camera, 35mm prime, f/1.8, available light, slight film grain. Editorial documentary photography,
photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, menu, signage, logos, wordmarks, watermarks, branded tableware, name tags, badges, wall art, framed pictures, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, character-shaped food

FIREFLY — paste into the Exclude field:
text, lettering, menu, signage, logos, wordmarks, watermarks, branded tableware, name tags, badges, wall art, framed pictures, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, character-shaped food

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, menu, signage, logos, wordmarks, watermarks, branded tableware, name tags, badges, wall art, framed pictures, cartoon characters, mascot costumes, costumed characters, close faces, portraits, three circles, character-shaped objects, character-shaped food, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Check every plate and side plate at 200%. A round plate flanked by two smaller round dishes is a three-circle arrangement and will not read as innocent once someone points at it.

---

### P18 · `dining-lounge` — lounges (10 pages)

| | |
|---|---|
| **Stem** | `dining-lounge` · widths 640/1280/1920 · 16:9 |

```json
"dining-lounge": {
  "file": "dining-lounge",
  "alt": "",
  "width": 1920,
  "height": 1080,
  "widths": [640, 1280, 1920],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative lounge room-tone archetype. Not a photograph of any named bar and not a depiction of any named drink. No readable signage, no branded bottles, no identifiable faces."
}
```

```
A small bar interior after dark, shot along the length of the counter: a dark timber bar top
catching a long specular highlight from low warm lighting, a brass foot rail, four empty stools.
Behind the bar, unmarked bottles in plain glass on open shelving, backlit so they read as a wall of
amber and green glow rather than as individual objects, all labels turned away or absent. A bartender
in a plain solid charcoal shirt with no logo and no name tag, mid-motion and motion-blurred, seen
from behind. Two patrons at the far end in near-silhouette. Very low key: most of the frame is deep
brown-black, with the light confined to the bottle wall and the bar top. Rich but believable colour,
deep shadows retaining detail. Full-frame camera, 35mm prime, f/1.4, available light only, slight
film grain. Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, labels, bottle labels, signage, logos, wordmarks, watermarks, brand marks, tap badges, name tags, neon signs, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, novelty glassware, souvenir cups

FIREFLY — paste into the Exclude field:
text, lettering, labels, bottle labels, signage, logos, wordmarks, watermarks, brand marks, tap badges, name tags, neon signs, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, novelty glassware, souvenir cups

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, labels, bottle labels, signage, logos, wordmarks, watermarks, brand marks, tap badges, name tags, neon signs, cartoon characters, mascot costumes, close faces, portraits, three circles, character-shaped objects, novelty glassware, souvenir cups, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 120 KB AVIF @1920 / 180 KB JPEG @1920.

**Acceptance check:** Zoom to 200% across the entire bottle wall. Bottle labels are the densest concentration of pseudo-text and pseudo-trademark the model will produce anywhere in this batch. If a label resolves, regenerate with the bottles further out of focus rather than retouching.

---

## Group P19–P22 · Land archetypes — four images, ten of twenty-seven lands

`landPage` (`src/pages/park.mjs:439`, 27 pages) is the highest-volume hero opportunity on the site, and 62 attraction pages would inherit their land's image. It also needs the `.hero--photo.hero--compact` CSS variant before anything renders.

#### Correcting an assumption from the survey

The image-slot lens described lands as "the one entity where an atmospheric image is editorially honest and legally safe — architecture and light, no IP." That is true at Disney. It is **false for most of Universal's 27 lands**, and the land list is why:

> Ministry of Magic · Hogsmeade · Diagon Alley · Super Nintendo World ×2 · Isle of Berk · Dark Universe · Marvel Super Hero Island · Toon Lagoon · Skull Island · Jurassic Park · Seuss Landing · Minion Land · Springfield ×2 · DreamWorks Land · Wizarding World Hollywood

Seventeen of twenty-seven lands **are** licensed properties. Their architecture is the IP. There is no version of "atmospheric architecture and light" for Hogsmeade that is not a depiction of Hogsmeade, and a generic image placed at the top of a page headlined "The Wizarding World of Harry Potter – Diagon Alley" is worse than none: it either infringes or misrepresents.

**Ten lands can be illustrated.** Four archetypes cover them:

| Archetype | Lands | Pages |
|---|---|---|
| `land-backlot-street` | production-central, new-york, hollywood, upper-lot, world-expo | 5 |
| `land-waterfront-lot` | san-francisco, lower-lot | 2 |
| `land-garden-promenade` | celestial-park | 1 |
| `land-stone-arcade` | port-of-entry, lost-continent | 2 |

The other **17 land pages get no image, deliberately** — set no `photo` key on them and the null contract handles it. Attraction pages inherit their land's image where one exists, which is the right granularity: a per-ride photograph on a Universal site means a photograph of a specific, heavily protected ride exterior or vehicle, and any generic image in that slot gets read as a picture of that ride.

Note `islands-of-adventure`'s `port-of-entry` land currently has **zero attractions assigned** and renders an empty land page (`validate.mjs` warns about it). Fix the data before giving it a hero; an image on an empty page is decoration on a defect.

All four use widths **640/1280** — these render into a compact hero capped at `clamp(240px, 34vh, 400px)`, so 1920 is bytes nobody sees.

---

### P19 · `land-backlot-street`

```json
"land-backlot-street": {
  "file": "land-backlot-street",
  "alt": "",
  "width": 1280,
  "height": 720,
  "widths": [640, 1280],
  "focal": "50% 55%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative studio-backlot archetype shared by five non-licensed lands; not a photograph of any of them. No readable signage, no licensed theming, no identifiable faces. Requires the .hero--photo.hero--compact CSS variant and the footer image-credit line."
}
```

```
A studio backlot street in flat mid-morning overcast light, shot straight down the middle of the
roadway: two facing rows of tall plain building fronts in weathered painted brick, stucco and
clapboard, cream, grey-green and faded red, with blank empty fascia panels above every shopfront and
no lettering anywhere. Fire escapes and downpipes on the left row. Dry asphalt with faint tyre
marks. A few anonymous figures in the middle distance walking away from camera, none close enough
for a face. Soft even shadowless light, muted believable colour, plenty of texture in the paintwork
and the road surface. Full-frame camera, 35mm prime, f/4, natural overcast light, slight film grain.
Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, shop names, street signs, number plates, signage, logos, wordmarks, watermarks, water tower, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, banners, bunting

FIREFLY — paste into the Exclude field:
text, lettering, shop names, street signs, number plates, signage, logos, wordmarks, watermarks, water tower, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, banners, bunting

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, shop names, street signs, number plates, signage, logos, wordmarks, watermarks, water tower, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, close faces, portraits, three circles, character-shaped objects, banners, bunting, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 80 KB AVIF @1280 / 110 KB JPEG @1280.

**Acceptance check:** Every fascia, awning, window decal and vehicle plate at 200%. Nothing legible. Then check it is visually distinct from P4 (`hero-park-usf`) — flat overcast versus dusk — because both may appear within two clicks of each other.

---

### P20 · `land-waterfront-lot`

```json
"land-waterfront-lot": {
  "file": "land-waterfront-lot",
  "alt": "",
  "width": 1280,
  "height": 720,
  "widths": [640, 1280],
  "focal": "50% 55%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative waterfront-backlot archetype shared by two non-licensed lands; not a photograph of either. No readable signage, no licensed theming, no identifiable faces. Requires the .hero--photo.hero--compact CSS variant and the footer image-credit line."
}
```

```
A working waterfront frontage in flat overcast light: a row of low timber and corrugated-iron shed
buildings with plain unpainted board fronts facing a stretch of grey-green water, a concrete quay
edge with iron mooring bollards and coiled rope in the foreground. Weathered pilings standing in
the water, gulls on them. No boats with names. A steep planted bank rises behind the sheds on the
right, dry grass and eucalyptus. Muted colour throughout — grey, rust, bleached timber — with
plenty of surface texture. No people. Full-frame camera, 35mm prime, f/4, natural overcast light,
slight film grain. Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, boat names, signage, logos, wordmarks, watermarks, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, bridges resembling landmarks, close faces, portraits, people, three circles, character-shaped objects, banners

FIREFLY — paste into the Exclude field:
text, lettering, boat names, signage, logos, wordmarks, watermarks, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, bridges resembling landmarks, close faces, portraits, people, three circles, character-shaped objects, banners

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, boat names, signage, logos, wordmarks, watermarks, billboards, neon, cartoon characters, mascot costumes, costumed characters, castle, spires, bridges resembling landmarks, close faces, portraits, people, three circles, character-shaped objects, banners, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 80 KB AVIF @1280 / 110 KB JPEG @1280.

**Acceptance check:** No recognisable landmark bridge on the horizon. "San Francisco waterfront" is a prompt-adjacent concept the model will reach for even though the word is absent from the prompt; a red suspension bridge makes this a picture of a real city rather than a generic quay.

---

### P21 · `land-garden-promenade`

```json
"land-garden-promenade": {
  "file": "land-garden-promenade",
  "alt": "",
  "width": 1280,
  "height": 720,
  "widths": [640, 1280],
  "focal": "50% 50%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative landscaped-promenade archetype for one non-licensed land; not a photograph of it. No readable signage, no licensed theming, no identifiable faces. Requires the .hero--photo.hero--compact CSS variant and the footer image-credit line."
}
```

```
A formal landscaped promenade in soft late-afternoon light: a wide pale stone path between deep
planted borders of ornamental grasses and flowering shrubs, clipped low hedging edging the beds, and
mature specimen trees casting long soft shadows across the paving. A shallow rectangular reflecting
channel runs down the centre of the path with a low sheet of moving water. Bronze bollard lights at
intervals. Plain pale stone benches. Warm sun grazing from the left, cool blue in the shadow sides.
Rich but believable colour, deep shadows retaining detail. Two distant figures on a bench, small and
unlit. Full-frame camera, 35mm prime, f/2.8, natural afternoon light, slight film grain. Editorial
documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, plaques, logos, wordmarks, watermarks, topiary animals, animal-shaped hedges, statues, sculptures, cartoon characters, mascot costumes, costumed characters, castle, spires, domes, close faces, portraits, three circles, character-shaped objects, flower-bed portraits

FIREFLY — paste into the Exclude field:
text, lettering, signage, plaques, logos, wordmarks, watermarks, topiary animals, animal-shaped hedges, statues, sculptures, cartoon characters, mascot costumes, costumed characters, castle, spires, domes, close faces, portraits, three circles, character-shaped objects, flower-bed portraits

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, plaques, logos, wordmarks, watermarks, topiary animals, animal-shaped hedges, statues, sculptures, cartoon characters, mascot costumes, costumed characters, castle, spires, domes, close faces, portraits, three circles, character-shaped objects, flower-bed portraits, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 80 KB AVIF @1280 / 110 KB JPEG @1280.

**Acceptance check:** Clipped hedging and planted beds at 10% thumbnail size. Formal gardens are the second-highest-probability source of an accidental three-circle silhouette after food, and a floral roundel with two smaller ones beside it is the classic failure. Also confirm no figurative topiary of any kind.

---

### P22 · `land-stone-arcade`

```json
"land-stone-arcade": {
  "file": "land-stone-arcade",
  "alt": "",
  "width": 1280,
  "height": 720,
  "widths": [640, 1280],
  "focal": "50% 55%",
  "note": "Decorative: alt empty, hero() sets aria-hidden. Illustrative stone-arcade archetype shared by two non-licensed lands; not a photograph of either. No readable signage, no licensed theming, no identifiable faces. Requires the .hero--photo.hero--compact CSS variant and the footer image-credit line."
}
```

```
A shaded stone arcade in warm afternoon light: a run of rough-cut sandstone arches on square piers
along the right, opening onto a narrow paved lane, with plain canvas awnings in undyed cream and
terracotta stretched between the piers and the opposite wall. Sunlight comes through the gaps
between the awnings in hard bright bars across the worn flagstones. Rough plaster walls, timber
shutters, terracotta pots of dry planting at the bases of the piers. Everything unlettered and
unmarked. Deep warm shadow under the arcade retaining full detail; the bright lane beyond is almost
blown out. Two figures far down the lane in silhouette. Full-frame camera, 35mm prime, f/2.8,
natural hard afternoon light, slight film grain. Editorial documentary photography, photorealistic.
16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, script, calligraphy, signage, market signs, logos, wordmarks, watermarks, hieroglyphs, runes, cartoon characters, mascot costumes, costumed characters, castle, spires, minarets, statues, close faces, portraits, three circles, character-shaped objects, banners, bunting

FIREFLY — paste into the Exclude field:
text, lettering, script, calligraphy, signage, market signs, logos, wordmarks, watermarks, hieroglyphs, runes, cartoon characters, mascot costumes, costumed characters, castle, spires, minarets, statues, close faces, portraits, three circles, character-shaped objects, banners, bunting

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, script, calligraphy, signage, market signs, logos, wordmarks, watermarks, hieroglyphs, runes, cartoon characters, mascot costumes, costumed characters, castle, spires, minarets, statues, close faces, portraits, three circles, character-shaped objects, banners, bunting, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 80 KB AVIF @1280 / 110 KB JPEG @1280.

**Acceptance check:** Stone arcades attract carved inscriptions and decorative script the way menu boards attract menus. Check every lintel, keystone and plaster panel at 200%; carved pseudo-script counts as readable signage.

---

## Group P23 · Section band image

`section()` (`components.mjs:75-89`) has **no `image` parameter**, and `photo()` is called from only `hero()` and `card()`. Until that changes, this asset and all eight runbook section images render as zero bytes across 251 pages. The runbook files section images under "Blocks: Nothing — pure upside"; that line should read "blocked on a six-line component change."

```js
// src/templates/components.mjs, section(), between the <header> block and ${children}
${image ? html`<div class="band__media">${photo(image, { className: 'band__photo', sizes: '(min-width: 940px) 60rem, 100vw' })}</div>` : ''}
```

Plus ~5 lines of CSS for `.band__media`. Renders nothing when `image` is null — same contract as `hero()` and `card()`.

### P23 · `band-coaster-inversion`

The survey's one genuinely new band image for this operator. It belongs mid-page in `is-it-scary`, `motion-sickness` and `height-requirements` — illustrative-of-an-idea, which is exactly what belongs in a band and exactly what does not belong in a hero above a factual claim.

The survey also proposed "a backlot street at dusk" and "a soundstage-facade streetscape" as band images. Both are satisfied by **P19** and **P20** at band scale; generating them twice is duplicated cost for the same picture, so they are not re-emitted here.

```json
"band-coaster-inversion": {
  "file": "band-coaster-inversion",
  "alt": "",
  "width": 1280,
  "height": 720,
  "widths": [640, 1280],
  "focal": "50% 45%",
  "note": "Decorative: alt empty. Band-level illustrative image for the intensity and height guides. Generic coaster geometry — a plain vertical loop, the most common inversion in the world — deliberately not resembling any real attraction's layout. No riders' faces, no ride vehicle detail, no readable signage."
}
```

```
A steel roller coaster track carrying a single plain vertical loop, photographed from directly
below and behind, silhouetted hard against a bright blank overcast white sky. Open lattice track and
plain tubular rails, ordinary and unremarkable geometry, no shaping beyond the single circular loop.
A train is at the top of the loop, small in frame and reduced entirely to silhouette, its riders
indistinguishable dark shapes with no face, no limb detail and no colour. Strong graphic
composition: black structure, white sky, nothing else in frame. Slight motion blur on the train
only. Full-frame camera, 35mm prime, f/5.6, natural flat overcast light, slight film grain.
Editorial documentary photography, photorealistic. 16:9.
```

```
MIDJOURNEY — append verbatim to the end of the prompt:
--no text, lettering, signage, logos, wordmarks, watermarks, recognisable coaster layout, themed ride vehicle, motorbike, close faces, portraits, expressions, raised arms in detail, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, sunset, dramatic clouds

FIREFLY — paste into the Exclude field:
text, lettering, signage, logos, wordmarks, watermarks, recognisable coaster layout, themed ride vehicle, motorbike, close faces, portraits, expressions, raised arms in detail, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, sunset, dramatic clouds

SDXL / SD3 / FLUX — paste into the negative prompt field:
text, lettering, signage, logos, wordmarks, watermarks, recognisable coaster layout, themed ride vehicle, motorbike, close faces, portraits, expressions, raised arms in detail, cartoon characters, mascot costumes, castle, spires, three circles, character-shaped objects, sunset, dramatic clouds, lowres, oversaturated, hdr halo, plastic sheen, stock photo lighting
```

**Ceiling:** 80 KB AVIF @1280 / 110 KB JPEG @1280. A flat white sky compresses extremely well; if this misses 80 KB, the encode is wrong rather than the image.

**Acceptance check:** The loop must be a plain circle. Any zero-g roll, heartline roll, top hat, or a train that resolves into a motorbike or a themed vehicle body makes this a picture of a specific real ride. Second: no rider's face or hand resolves at 200%.

---

## Not photography — routed elsewhere, listed so nothing falls between batches

### PWA icon set and favicon — **not a diffusion job**

Two hardcodes put the *other operator's* brandmark on all 251 Universal pages:

1. `src/build.mjs:520-525` defines `FAVICON` as an inline SVG literal with `fill="#0f3d2e"` (Ride Ready Guide green) and `#e9b264` amber letterforms, written unconditionally for **every** operator. Hollywood Ride Guide's tab icon is Ride Ready Guide's monogram in Ride Ready Guide's colours.
2. `assets/img/icon-{180,192,512,maskable}.png` come from `scripts/generate-icons.mjs` with `BRAND=[15,61,46]` / `BRAND_DEEP=[9,42,32]` / `AMBER=[233,178,100]` hardcoded at lines 17-19, copied unmodified into every dist. Installing hollywoodrideguide.com to a home screen produces a dark-green Ride Ready Guide tile — behind a navy `#1b3a5c` splash screen the manifest correctly declares.

These are the only images that render on 251 of 251 pages today, and **they must not be generated.** The mark is a measuring rule — our own artwork, legally clean, it reads at 32px, and it says what the site is. It is drawn deterministically by a zero-dependency script. Recolour it; do not redraw it.

Palette for the universal operator, derived from the declared `brand.themeColor` `#1b3a5c`:

```js
const BRAND      = [27, 58, 92]     // #1b3a5c  declared themeColor
const BRAND_DEEP = [17, 37, 59]     // #11253b  same hue, ~62% luminance
const AMBER      = [233, 178, 100]  // #e9b264  unchanged — the rule stays amber
const PAPER      = [250, 248, 244]  // #faf8f4  unchanged
```

Move these behind the operator (read from `site.json`), emit to `assets/img/<operator>/`, make `FAVICON` a function of `site.brand` rather than a module constant, and point the manifest and `apple-touch-icon` at the operator path. Disney's values are the current literals, so its output stays byte-identical. Also fix the dark-mode `theme-color`, hardcoded as `#0b0f0d` (the green-black) for both operators in `layout.mjs`.

**Acceptance check:** Render `icon-512.png` and look at it. Navy plate, amber rule. Then install the PWA and confirm the tile and the splash are the same colour family — today they are not.

### Per-page Open Graph data cards — **SVG from data, not photography**

The survey ranked ten card templates (height bands, attraction + height numeral, month letter grade, park map plate, A-vs-B comparison, dated price range, restaurant, guide, confidence-badged event, brand default). **None of these is a photograph, and none belongs in this batch.** Under the hard constraints a photographic per-page card is close to unsourceable, while a typographic data card carries none of that risk, is generated from facts already fact-checked, and compresses to 20–40 KB.

The machinery already exists: `scripts/render-map-pngs.mjs` rasterises SVG through headless Chromium and is deliberately kept out of `npm run build`; `scripts/generate-icons.mjs` writes real PNGs with nothing but `node:zlib`. A card generator follows the same out-of-build, commit-the-output pattern. It also needs `metaTags()` to accept a `page.socialImage` falling back to `site.socialImage`, and to emit `og:image:width`/`height` from the image's own dimensions rather than the hardcoded 1280/672 at `layout.mjs:46-47`.

**P2 is the default card and is unblocked today.** The ten templates are a separate, later batch.

### Park map plates — **data, not imagery**

All four Universal parks lack `map.json`, so `renderParkMap()` falls through to `syntheticMap()` and every park renders the same radial wedge diagram — Epic Universe and Universal Studios Hollywood both have five lands and emit **byte-identical polygon geometry**. Meanwhile `/terms/` makes a formal licence attribution: "They are drawn from open geographic data, including data © OpenStreetMap contributors." No geographic data was used for any Universal map.

This is the highest-value visual work on the site with **zero IP exposure and zero byte cost** — four hand-authored ~4 KB JSON files, geometry derived from OpenStreetMap, never traced from an official map. It also unlocks the park map plate as the safest possible `og:image` for the park and resort families. It is data authoring, not photography, and `renderParkMap()` already consumes `park.map` when present.

**Do not run `npm run maps:png` yet.** It would rasterise four generic wedge diagrams into multi-megabyte PNGs, and `render-map-pngs.mjs` defaults to `OPERATOR = 'disney'` writing into the shared directory.

---

## Reusing the runbook's existing assets

Six of the runbook's eight section images are operator-neutral — a coaster train, an attendant, a flat-lay of fair food, a queue, a log flume, a parent and child. They live in the shared `assets/img/photos/` pool and serve **both** operators from one copy. This halves the generation load and is why they are not re-emitted.

| Runbook asset | Assign to (universal) | Pages | Notes |
|---|---|---|---|
| **4b · The drop** | `is-it-scary`, `motion-sickness` guides | 2 | Band-level. Blocked on the `section()` change. |
| **4d · The welcome** | `accessibilityPage` | 4 | The one image on the site that does real editorial work — an unbranded attendant giving directions, above the assistance-registration warning. |
| **4e · Fair food** | `snacksPage` | 4 | **One** band image above the grid. Never per-item. |
| **4f · Waiting** | `holidayPage`, `express-pass` / `single-rider` / `virtual-line` guides | 8 | Crowd density as a subject. |
| **4g · The splash** | `is-it-scary` guide, `what-to-pack` guide | 2 | Universal's water rides close below ~65°F — this pairs with the cold-month copy. |
| **4h · The end of the day** | `firstTimerPage` | 4 | Emotional close to a planning page. |
| **4a · The castle** | — | 0 | **Dropped.** No castle in Universal's brand vocabulary; also the highest regeneration-failure rate in the runbook. |
| **4c · The carousel** | — | 0 | **Dropped.** Not a Universal signature. |

---

## Where an image is a mistake — do not generate for these

Roughly 85 pages where a photograph costs bytes and buys nothing, and one where it would be a fabrication. Listed because three of them are the highest-traffic families on the site and will be proposed.

| Family | Pages | Why not |
|---|---|---|
| **Food cards** | ~85 affected | The fabrication case. Every food card carries a specific name, a specific price, a dated verification and a first-person "Our take". A generated image of a named snack at a stated price is a fabricated record of a real product. Separately, `/tools/food-tracker/` is **already 314,405 bytes of HTML** for one page the home page promises works with no signal; 158 thumbnails at 20 KB is 3.2 MB. `foodCard()` has no image slot — leave it that way. |
| `heightsPage` | 4 | Dense sortable table. The reader arrived with a number in their head and wants a row; a hero pushes the table below the fold on mobile. |
| `ridesPage` | 4 | Already 105,859 bytes at Universal Studios Florida. |
| `pricePage`, `closuresPage` | 7 | Status and range tables carrying explicit confidence levels. An atmospheric photograph beside a claim labelled "expected, not confirmed" works directly against the confidence signalling the seasonal system exists to deliver. |
| `comparePage`, `bestRidesPage` | 14 | These commit to a verdict and defend it. Per-contender images invite judgement on the picture; the reasoning is the product. `bestRidesPage` would want a photo per ranked entry, which reintroduces the fabrication problem at attraction scale. |
| `attractionPage` (per-ride) | 62 | Not wrong in principle, a trap in practice: a per-ride photograph on a Universal site means a specific, heavily protected ride exterior or vehicle. Let attraction pages **inherit their land image** instead — architecture and light rather than IP. |
| `legalPages` | 8 | Correctly imageless. |

---

## Do this in this order

| | Step | Blocks |
|---|---|---|
| 0 | Footer image-credit line + `assets/img/photos/CREDITS.md` | **Everything.** Do not ship a generated image before the disclosure exists. |
| 0 | Exclude `*.md` from the asset copy (`build.mjs:527-531`) | `README.md` is already published to the live origin; `CREDITS.md` will contain generator names, verbatim prompts and reviewer names and would be published by the same mechanism. |
| 1 | **P2** social card + the `social-card-universal` rename | 251 pages of bare-text shares. One image, no page weight, biggest return in the batch. |
| 2 | **P1** hero + the `.verified` contrast fix | The home page. Ship them together or ship neither. |
| 3 | The `data.photoFor` resolver (~8 lines) | P4–P18. |
| 4 | **P4–P9** park and resort heroes | 6 of the highest per-page-impact pages on the site. |
| 5 | **P16–P18** dining tiers | 47 pages for 3 images — the best ratio in the batch. |
| 6 | **P10–P13** seasonal | 12 month pages + 5 holidays + the indexes. |
| 7 | **P14–P15** event nights | 10 pages. |
| 8 | `.hero--photo.hero--compact` CSS (4 lines) → **P19–P22** | 10 land pages + inherited by attraction pages and land cards. |
| 9 | `section()` image param (6 lines) → **P23** + runbook 4b/4d/4e/4f/4g/4h | 20-odd band placements. |
| — | **P3** podcast artwork | Runs in parallel; blocked on the `podcast` block, an owner email and `audioBase`, none of which are image work. |

**Add an image gate to `scripts/audit.mjs` before step 1.** Right now the entire four-layer gate contains one image assertion — `audit.mjs:181-183` checks that an `<img>` has an `alt=` attribute at all, which passes trivially for `alt=""` and is currently a no-op because there are zero `<img>` tags across 251 pages. The 120 KB / 80 KB budget is documentation only; nothing enforces a single byte, dimension or format. In a repo whose defining discipline is a gate that catches what a human would miss, the photo pipeline is the one subsystem with no gate. It should assert: bytes against the table in §7 per slot class; the AVIF/WebP/JPEG triple present at every declared width; on-disk pixel dimensions matching the declared `width`/`height` (a 1920×1152 file declared as 1080 silently crops 6% off the frame via `object-fit: cover` — including, potentially, off a corner a human just cleared); and no `/assets/img/photos/` path in `PRECACHE_URLS`.

---

# Part 3 · Non-photographic visuals

The highest-value batch. A graphic built from data this site has already verified cannot be copied without redoing the verification, and it carries no IP risk at all. Where an item is generated deterministically from data rather than by a model, it is given as a specification, not a prompt.

*34 items in this batch.*

## Batch: Non-photographic visuals

Data-derived graphics, park maps, icons, and diagrams for Hollywood Ride Guide. Everything in this batch is built from facts the site has already verified, or drawn by hand from open geography. Nothing here goes near a diffusion model except one optional background plate, and I argue against that one too.

This is the batch that pays. A photograph of a Universal ride is legally unavailable and editorially generic; a chart of 39 verified height minimums is neither. A competitor can buy stock photography in an afternoon. They cannot buy the 107 five-axis fear profiles, the 157 date-stamped prices, or four hand-traced land layouts without redoing the work.

**Read this first: this is mostly a code-and-data batch, not a prompt batch.** Of the 34 assets specified below, 32 are deterministic — generated from JSON the repo already holds, by code that must be written. One is hand-authored geometry (the four `map.json` files). Exactly one has a verbatim prompt attached, and it is optional. Writing image-generator prompts for the other 33 would be dressing up engineering as art direction, and would produce worse assets: a model cannot render "40 inches unlocks eleven rides" correctly, and it cannot be made to.

---

### 0. Verification pass — what I confirmed before specifying anything

Every figure below was recomputed from the files, not taken from the survey. Where I disagree with the survey, I say so.

| Claim | Verified | Source |
|---|---|---|
| 107 attractions, 84 dining, 158 food items | ✅ | `data/universal/parks/*/{attractions,dining,food}.json` |
| `scary` complete on all 5 axes, 107/107, zero nulls | ✅ | `attractions.json` → `scary.{darkness,drops,speed,loudness,startles}` |
| 61 distinct 5-tuples across 107 rides | ✅ | computed |
| 39 non-null `heightIn`; 11 of them at exactly 40" | ✅ | computed |
| Cumulative unlock: 9 rides at 39", 20 at 40" | ✅ | `[[34,3],[36,5],[39,1],[40,11],[42,7],[44,1],[48,7],[51,2],[52,1],[54,1]]` |
| 157 numeric prices, $3.49–$85.00, median $13.49 | ✅ | `food.json` → `price`, `priceVerified` all `"2026-07"` |
| All 12 months carry `verdict.grade`, `crowds.level`, `cost.level`, per-resort `highF/lowF/rainDays` | ✅ | `data/universal/seasonal/months/01–12.json` |
| Zero `map.json` for Universal; 6 for Disney | ✅ | `find data/universal -name map.json` → 0 |
| 27 lands across 4 parks | ✅ | 5 + 8 + 9 + 5 |

**Corrections to the survey.**

1. **Savory food items: 80, not 81.** Category counts are `savory 80, drink 40, sweet 26, breakfast 6, snack 3, treat-cart 2` = 157 priced (158 records, one unpriced).
2. **`singleRider: true` is 17 site-wide**, not "6+6+5". Epic Universe is 0 of 21; the other three are 6/6/5. The survey's per-park figures were right, the implied total was never stated.
3. **The map renderer is far more developed than the survey implies.** `src/lib/map-style.mjs` (187 lines) is a full vintage-cartography system — aged paper, `feTurbulence` grain, an inked hairline double frame with corner ticks, an eight-point compass rose drawn from primitives, a ribbon title, ten plate-printed land tints chosen to stay distinguishable in greyscale, and a print stylesheet that strips the filters for a mono printer. The map spec below must land *inside* this system, not invent a new one. The survey called the Universal maps "generic pie charts"; they are generic pie charts rendered on a genuinely beautiful plate.
4. **The height-checker's denominator is 57, not 39** — and this is a trap that will make a new chart contradict the tool on the same page. `heightCheckerPage` (`src/pages/tools.mjs:186–193`) filters to `isOpen` attractions of eight ride types, giving 57 rides, of which 39 carry a height and 18 do not. So a 40-inch child clears **38 of 57** by the tool's arithmetic, and **20 of 39** by the height-restricted-only arithmetic. Both are true; they answer different questions. Any chart placed near the tool must use the tool's set, or state its own denominator in the label.

---

### 1. Rendering approach: inline SVG generated at build time

**The recommendation is inline SVG emitted by the existing template functions, and it is not a close call.** Arguing it properly, because everything downstream depends on it.

**For:**

- **It is the only option that keeps the zero-dependency rule.** SVG is a string. `src/lib/map.mjs` and `src/lib/map-style.mjs` already prove the pattern works at scale in this repo — 281 + 187 lines producing a genuinely handsome map with nothing but `node:` built-ins.
- **It cannot silently go stale.** This is the strongest argument and it is specific to this site. A rasterised chart is a file with a date; a build-time chart is a function of the data. On a site whose entire proposition is "we checked this and stamped it," a graphic that can disagree with the number printed beside it is a liability. `scripts/audit.mjs:205–214` already carries an mtime check for exactly this problem against the map PNGs — proof the team has been bitten by it. Build-time SVG makes that whole class of check unnecessary.
- **It is theme-aware for free, in a way a raster never is.** Inline SVG inherits the CSS cascade, so `fill="var(--brand-2)"` and `stroke="currentColor"` resolve correctly in both light and dark. The site has a full dark palette (`main.css:80–100`) and no other image format can follow it. Note the distinction that matters here: this works for SVG *inline in the document*, and does **not** work for a standalone `.svg` file — which is precisely why `map-style.mjs` carries a `STANDALONE_CSS` block for the downloadable plates. Same distinction applies to everything below.
- **It prints.** `assets/css/print.css:142–152` already handles `.parkmap` for a mono printer. Charts inherit that discipline for a few extra lines.
- **Zero layout shift, zero network, works offline.** A `viewBox` gives intrinsic ratio at parse time. There is no fetch, so the service worker never has to think about it and the park-WiFi claim is untouched.
- **It is accessible in ways a raster is not** — `role="img"` plus `aria-label`, and where the graphic carries real data, a `visually-hidden` text equivalent that a screen reader gets losslessly.

**Against, honestly:**

- **Bytes scale with instance count.** One radar on one page is nothing; thirty on a land page is real. Budget below.
- **It cannot serve `og:image`.** Social crawlers need a raster at an absolute URL. That is the one job that needs the rasteriser.
- **It cannot serve PWA icons or podcast artwork.** PNG/JPEG required by the platforms.

**So: two production paths.**

| Path | Used for | Mechanism | In `npm run build`? |
|---|---|---|---|
| **A — inline SVG** | All in-page charts, diagrams, the map plates | New functions in `src/templates/components.mjs` + `src/lib/` | Yes |
| **B — committed raster** | Social cards, PWA icons, favicon, map PNG/JPEG plates, podcast artwork | `scripts/generate-icons.mjs` (pure Node, no browser) for flat shapes; a new `scripts/render-social-cards.mjs` modelled on `scripts/render-map-pngs.mjs` (Playwright, out-of-build, committed) for anything with text | No — same precedent as `maps:png` |

**Byte budget for path A**, estimated by counting the actual markup each spec produces:

| Graphic | Raw per instance | Instances | Raw total |
|---|---|---|---|
| Fear fingerprint, detail form | ~1.5 KB | 62 | 93 KB |
| Fear fingerprint, card form | ~0.35 KB | ~215 cards | 75 KB |
| Height ladder | ~2.5 KB | 2 | 5 KB |
| Month grid | ~4.5 KB | 13 | 58 KB |
| Price histogram | ~1.8 KB | 9 | 16 KB |
| Compare tally | ~1.0 KB | 10 | 10 KB |
| **Total added, sitewide, raw** | | | **~257 KB** |

Spread over ~120 pages, gzipped (repeated path syntax compresses hard, 85–90%), that is roughly **0.3 KB gzipped per affected page**. For scale: the home page is 26.8 KB gzipped today, one hero photograph is 120 KB, and `magic-kingdom-map@2x.png` — currently shipping inside `dist/universal` and referenced by nothing — is 5,435,756 bytes. The entire chart programme costs less than 0.7% of one dead file.

**Hard rule inherited from the survey and reaffirmed here: nothing in this batch enters `PRECACHE_URLS`.** Inline SVG rides along inside HTML that is already precached, which is free. Raster cards and plates stay out of the precache list entirely, guarded at `src/build.mjs:555`.

---

## Part 1 — Data-derived graphics (deterministic; specifications, not prompts)

### 1.1 The fear fingerprint — 5-axis radar

**Kind:** deterministic, build-time inline SVG.
**Why it exists:** 107 attractions produce 61 distinct fear shapes, and among the 18 rides that all score 3/5 overall there are 16 different profiles. Stardust Racers (`darkness 1, drops 4, speed 5`) and Spider-Man (`darkness 4, drops 2, startles 4`) both score 3/5 and are opposite experiences for a child afraid of the dark. The overall score destroys the site's own best insight; six stacked progress bars display it without making it comparable. A repeating polygon shape is comparable at a glance, and it becomes the site's visual signature — which matters, because the stylesheet is byte-identical to the Disney site's and there are no web fonts, so the chart language is the only identity lever available.

**Data, verified present:**
- File: `data/universal/parks/<park>/attractions.json`
- Fields: `scary.darkness`, `scary.drops`, `scary.speed`, `scary.loudness`, `scary.startles` — integers 1–5, **107/107 coverage, zero nulls**
- Also read: `scary.score` (the overall, for the caption), `scary.notes` (the written explanation, already rendered)

**Geometry.**

- Canvas `viewBox="-64 -64 128 128"`, origin at centre. Radius at value *v* is `r = v / 5 * 46`.
- Five axes at 72° steps, first at −90° (straight up). Axis *i* angle = `-90 + i * 72` degrees.
- **Axis order is a design decision, not arbitrary — fix it and never change it**, because the whole value is that shapes are comparable between rides. Clockwise from top: **drops → speed → loudness → startles → darkness.** This puts the two physical-intensity axes adjacent at the top-right and the two psychological axes adjacent at the bottom-left, with loudness as the hinge. A coaster leans up-and-right; a dark ride leans down-and-left. That single ordering decision is what turns 107 polygons into a readable vocabulary.
- Grid: five pentagon rings at r = 9.2, 18.4, 27.6, 36.8, 46. Pentagons, not circles — they match the data polygon's geometry, so a reader can count rings to read a value.
- Five axis spokes from origin to r = 46.
- Value polygon: the five points joined, `stroke-linejoin="round"`.
- A 2.6 r dot at each vertex.

**Colour, using existing tokens only (no new tokens):**

```
.ff__ring, .ff__axis { stroke: var(--line); stroke-width: .8; fill: none; }
.ff__ring--outer     { stroke: var(--line-strong); stroke-width: 1.1; }
.ff__shape { fill: var(--accent); fill-opacity: .16; stroke: var(--accent); stroke-width: 1.8; }
.ff__dot   { fill: var(--accent); }
.ff__lab   { fill: var(--muted); font-size: 8.5px; font-weight: 650;
             text-anchor: middle; letter-spacing: .04em; text-transform: uppercase; }
```

`--accent` is `#a9660f` in light and `#e9b264` in dark, both already contrast-checked against their own surfaces. Do not hardcode either.

**Two forms.**

| Form | Size | Contents | Where |
|---|---|---|---|
| **Detail** | 132 × 132 | Rings, spokes, five axis labels (DROPS / SPEED / LOUD / STARTLE / DARK), value polygon, vertex dots | Attraction page, beside the existing meter grid — `src/pages/park.mjs:359` |
| **Card** | 56 × 56 | Outer ring + value polygon only. No labels, no inner rings, no dots | `attractionCard()`, `src/templates/components.mjs:381` |

**Accessibility — the important part.** Do **not** replace the meter grid. Render the radar *and* keep `C.meter()` beneath it. The radar earns its place by being comparable; the meters earn theirs by being readable, and they are the text equivalent a screen-reader user would otherwise lose. On the radar itself:

```
role="img" aria-label="Fear profile out of 5 — drops 4, speed 5, loudness 3, startles 2, darkness 1"
```

On the card form, the same label; the card's heading supplies the ride name, so the label must not repeat it.

**Reduced motion:** no animation on this component at all. Do not add a draw-in transition — it would need a guard, and the graphic has nothing to gain from movement.

**Where NOT to put it:** the rides index (`ridesPage`, 4 pages, already 105,859 bytes at USF). That page is a sortable `dataTable` and already carries a scary column; 31 radars would add ~11 KB raw and no information.

**Code:** new `fearFingerprint(scary, { form = 'detail' })` in `src/templates/components.mjs`; call at `src/pages/park.mjs:359` and inside `attractionCard()`. Shared component — Disney inherits it, and Disney's `scary` objects have the same shape, so verify the Disney build renders before shipping.

---

### 1.2 The height cliff — cumulative unlock staircase

**Kind:** deterministic, build-time inline SVG, with ~8 lines of progressive enhancement wired to the existing slider.
**Why it exists:** the distribution has an unusually sharp story and the site currently tells it only in prose. Eleven of the 39 height-restricted attractions sit at exactly 40 inches. One inch — 39" to 40" — is worth more than any other planning variable at Universal, and it is the single most screenshot-and-send-to-your-partner asset the site could own. The Height Checker has a slider, three number readouts and no picture of the step function it exists to explain.

**Data, verified:**
- File: `data/universal/parks/<park>/attractions.json` → `heightIn`, `type`, `status`, `name`
- Distribution: `34:3, 36:5, 39:1, 40:11, 42:7, 44:1, 48:7, 51:2, 52:1, 54:1` — n = 39
- Cumulative: `34→3, 36→8, 39→9, 40→20, 42→27, 44→28, 48→35, 51→37, 52→38, 54→39`

**Denominator rule — non-negotiable.** On the Height Checker page the chart must use the tool's own set: `status === 'open'` and `type` in `['roller-coaster','dark-ride','water-ride','simulator','spinner','train','boat-ride','interactive-game']` = **57 rides**, of which 18 have no height requirement. The y-axis then reads *rides they can ride*, running 18 → 57, and 40 inches reads **38 of 57**. On the `/guides/height-requirements/` page, where the subject is the requirements themselves, use the 39-ride universe and label the axis *height-restricted rides cleared*, 0 → 39. Two charts, two labels, no contradiction. Shipping one chart with the wrong denominator next to the tool is the most likely way to break this.

**Geometry.**

- `viewBox="0 0 640 300"`, plot area x ∈ [52, 612], y ∈ [24, 248].
- x = height in inches, linear, domain **32 → 56** (the tool's slider runs 28–56; clamp the chart to 32 so the empty left third is not drawn).
- y = cumulative count, linear, domain 0 → max, inverted.
- The series is a **step-after path**: `M` at (32, base), then for each threshold `H`: `L(x(H), y(prev))` `L(x(H), y(cum))`, closing down to the baseline. Filled at `fill-opacity: .14`, stroked at 2px.
- **The 40-inch riser is the subject.** Stroke that one vertical segment separately at 3px in `var(--accent)` and label it: a small bracket to the right of the riser reading **`+11 rides`**, and beneath the axis at x(40) a tick label set heavier than its neighbours.
- Axis ticks every 2 inches, labels every 4 (`32"`, `36"`, `40"`, `44"`, `48"`, `52"`, `56"`), `font-variant-numeric: tabular-nums`.
- A dotted horizontal gridline every 10 rides in `var(--line)`.
- Secondary annotation, understated, at the top-left of the plot: `39 height-restricted rides across four parks · verified July 2026`, pulling the month from `lastVerified` rather than a literal.

**Interaction (progressive enhancement, not required for the chart to work).** `assets/js/height-checker.js` already reads `[data-height-slider]`. Add a `<line data-height-marker>` and a `<text data-height-marker-label>` to the SVG and set `x1/x2` and `x` on input. Roughly six lines. With JS off the chart is complete and static; the marker is simply absent.

**Colour:**

```
.hladder__area { fill: var(--brand-2); fill-opacity: .14; }
.hladder__line { stroke: var(--brand-2); stroke-width: 2; fill: none; }
.hladder__cliff{ stroke: var(--accent);  stroke-width: 3; }
.hladder__grid { stroke: var(--line); stroke-dasharray: 2 4; }
.hladder__ax   { fill: var(--muted); font-size: 11px; }
.hladder__mark { stroke: var(--ink); stroke-width: 1.4; stroke-dasharray: 3 3; }
```

**Accessibility:** `role="img"` plus a full `aria-label`, and — because this one carries data a reader genuinely needs — a `visually-hidden` `<table>` immediately after it giving height and cumulative count. The chart is the fast path; the table is the complete one.

**Where:** `heightCheckerPage` (`src/pages/tools.mjs`, inside the `.hchecker` block around line 216) and the `/guides/height-requirements/` page. Two instances. Do **not** put it on the four per-park `heightsPage` files — those are dense tables where a reader arrived with a number in their head, and the chart would push the table below the fold on mobile.

---

### 1.3 The twelve-month grid — crowds, cost, and the coastal weather divergence

**Kind:** deterministic, build-time inline SVG.
**Why it exists:** the site holds a complete, chartable 12-month × 2-resort dataset and renders none of it as a picture. The finding the data supports and no page shows: **July is 93 °F at both resorts — and Orlando has 17 rain days to Hollywood's 0.** That is a genuine editorial point, it is the kind of thing a reader screenshots, and it is invisible in twelve pages of prose.

**Data, verified — all 12 files complete:**
- Files: `data/universal/seasonal/months/01.json` … `12.json`
- `verdict.grade` — `["A-","A","C","C+","B+","D+","D-","C-","A","B-","B+","C-"]`
- `crowds.level` — `low | moderate | high | peak`
- `cost.level` — `low | moderate | high | peak`
- `weather["universal-orlando"].{highF,lowF,rainDays}` and `weather["universal-hollywood"].{highF,lowF,rainDays}`

Note the structural asymmetry to respect: **crowds and cost are single site-wide values; weather is per-resort.** So the grid is one crowd row, one cost row, and two weather rows — not four paired rows.

**Layout.** `viewBox="0 0 720 260"`, twelve columns of 52px starting at x = 96 (a 96px row-label gutter), five rows:

| Row | Height | Encoding |
|---|---|---|
| **Grade** | 34 | The letter itself, `var(--font-display)`, 17px, 800 weight, centred. Colour by band: A → `var(--good)`, B → `var(--brand-2)`, C → `var(--muted)`, D → `var(--danger)`. **The letter is the mark** — do not also draw a bar; the site already grades in letters and a second encoding is noise. |
| **Crowds** | 26 | A four-step bar filling 25/50/75/100% of the cell height, `var(--brand-3)` → `var(--brand)` by level |
| **Cost** | 26 | Same four-step bar, `var(--accent-2)` → `var(--accent)` |
| **Orlando** | 56 | Temperature range bar from `lowF` to `highF` on a fixed 60–100 °F vertical scale, plus a rain gauge |
| **Hollywood** | 56 | Identical scale, identical geometry — **the fixed shared scale is the entire point**; the two rows must be directly comparable by eye |

**The rain gauge** is what makes July land. Under each temperature bar, a horizontal strip 8px tall whose filled width is `rainDays / 20`. Orlando July fills 85%; Hollywood July fills nothing. Set them one above the other and the reader gets it without a caption. Print the number inside the strip when `rainDays >= 10`.

Month initials along the bottom (`J F M A M J J A S O N D`), and the two weather rows labelled in the gutter as `Orlando` and `Hollywood`.

**Where:** `/when-to-go/` index (the full five-row grid), and optionally a single-column extract at the top of each of the 12 month pages showing that month against the year's range. If the month-page extract is skipped, the grid is one instance and costs 4.5 KB.

**Reuse note:** `weatherScore()` already exists at `src/seasonal/tools.mjs:32` and reduces the normals to a 1–5 comfort figure. Do **not** use it here. A derived comfort score hides the fact the chart exists to show — that two identical temperatures are different days. Plot the normals.

**Accessibility:** `role="img"`, `aria-label` summarising the year, plus a `visually-hidden` table of all 12 rows. The month pages already carry every number in prose, so the table is the only addition needed.

---

### 1.4 The price distribution — 157 verified, dated prices

**Kind:** deterministic, build-time inline SVG.
**Why it exists:** a dated price distribution is among the most defensible graphics a park site can publish. It answers the question every visitor actually has, it cannot be copied without redoing the pricing survey, and the `priceVerified` stamps let the chart carry its own credibility on its face.

**Data, verified:**
- File: `data/universal/parks/<park>/food.json` → `price`, `priceVerified`, `category`, `name`, `park`
- 157 numeric prices of 158 records. Range $3.49 – $85.00, median $13.49.
- `priceVerified` is `"2026-07"` on all 158 — a single distinct value, which is what lets the chart carry one honest date stamp rather than a range.
- Categories: `savory 80` ($8–$85, median $17.99) · `drink 40` ($5.49–$18, median $9.99) · `sweet 26` ($4.99–$16.99, median $8.99) · `breakfast 6` · `snack 3` · `treat-cart 2`
- Per park: Epic Universe 41 items, median $16, max $85 · IOA 41, median $13.49 · USF 41, median $11.99 · USH 34, median $14.99

**Scale decision, argued.** A linear axis to $85 crushes 153 of 157 items into the left third. A log or sqrt axis fixes the crowding and quietly misleads about magnitude, which is exactly wrong on this site. A broken axis on a price chart published by a site whose selling point is honesty is worse still.

**So: a histogram to $32 with an explicit, itemised tail.** 153 of 157 items sit at or below $32; the four above it are, verifiably, *Lobster roll $32, Steak frites $38, Whole roasted fish $46, Seafood tower $85* — all at Epic Universe. Four items is fewer than a bar chart deserves and exactly enough to name. Naming them is more informative than any bar, and it makes the Epic Universe pricing point without a word of commentary.

**Geometry.**

- `viewBox="0 0 640 220"`. Fourteen $2 bins from $4 to $32, x ∈ [48, 600].
- Bars in `var(--brand-2)`, `rx="2"`, 3px gutter.
- A vertical median rule at $13.49 in `var(--accent)`, 2px, labelled above the plot: **`median $13.49`**.
- Below the axis, a single line in `var(--muted)`, 11px: `4 items above $32 — lobster roll $32, steak frites $38, whole roasted fish $46, seafood tower $85 (all Epic Universe)`.
- Bottom-right, small: **`157 prices, verified July 2026`** — read from `priceVerified`, never a literal.

**Category variant** for the dining and best-snacks pages: three stacked strip plots (savory / drink / sweet), each a single row of dots on the shared $0–$32 axis with a median tick. Small, ~600 B each, and the three medians ($17.99 / $9.99 / $8.99) tell a reader in one glance what a meal costs versus a drink versus a treat.

**Where:** `/tools/food-tracker/` (histogram — but see the warning below), the four dining index pages (category variant), and the four `best-snacks` pages (category variant).

**Byte warning, specific and important.** `/tools/food-tracker/` is already **314,405 bytes**, the largest page on the site, and it is in `PRECACHE_URLS` — it is 28% of the service worker's raw install payload on a page that exists to prove the site works with no signal. Add the histogram there (~1.8 KB, +0.6%) and nothing else. Do not add per-item dots, do not add a per-park breakdown. This page has no headroom.

---

### 1.5 The comparison tally

**Kind:** deterministic, build-time inline SVG (or CSS grid — either is fine here).
**Why it exists:** the compare pages hold **99 dimensions across 10 files**, every one with an explicit `winner` key, and render them as prose cells with no tally. The page commits to a verdict and then makes the reader count.

**Data, verified across all 10 files in `data/universal/compare/`:**
- `contenders[]` → `{ key, name, subtitle }`
- `dimensions[]` → `{ name, winner, cells{}, note }` where `winner` is a contender `key` or the literal `"tie"`
- Dimension counts: 7, 8, 9, 8, 11, 12, 7, 12, 15, 10. `"tie"` occurs in 5 of the 10 files.

**Spec.** A single horizontal strip immediately under the verdict block. One segment per dimension, in file order, width proportional to `1/n`, height 22px:

- Contender A → `var(--brand-2)`; contender B → `var(--accent)`; tie → `var(--surface-3)` with a 1px `var(--line-strong)` border.
- Above the strip, the tally in display type: **`Islands of Adventure 7 · Epic Universe 4`** (and `· 1 tie` where present).
- Each segment carries a `<title>` with the dimension name, and the whole strip is `role="img"` with an `aria-label` giving the full count.
- **Four-contender pages get four colours** — `var(--brand-2)`, `var(--accent)`, `var(--brand-3)`, `var(--accent-2)` — and a small key beneath. Verify these four hold up in dark mode before shipping; if `--brand-3` and `--accent-2` read too close, drop the four-way strip and render four labelled count chips instead. A tally the reader cannot decode is worse than no tally.

**Editorial guard:** the strip must sit *under* the verdict, never above it. The pages' whole thesis is that the reasoning is the product; a scoreboard at the top invites the reader to skip to the count.

---

### 1.6 The park anatomy bar (small, high leverage)

**Kind:** deterministic, build-time inline SVG.
**Why it exists:** the 4 rides index pages and 4 dining index pages are 1–4% page-unique and carry no orientation at all. One bar answers "how big is this park, really" before the table starts.

**Data, verified:** `attractions.json` → `tier` (`headliner 22, major 38, minor 47` site-wide) and `land`; `park.json` → `lands[]`, `stats.typicalFullDayHours`, `stats.minimumDaysRecommended`.

**Spec.** A single stacked horizontal bar per park, 100% width, 18px tall, segmented by tier — headliner `var(--brand)`, major `var(--brand-3)`, minor `var(--surface-3)` — with counts printed inside each segment where it fits. Under it, one line of derived text: `21 attractions · 3 headliners · a full day is 10–12 hours`.

Land composition variant for the park hub: one bar per land, sorted by attraction count, so the reader sees at a glance that Islands of Adventure's Hogsmeade holds 7 and **Port of Entry holds 0**. That zero is currently a silently empty land page (`validate.mjs` warns about it); a chart that shows it is the honest treatment until the data is filled.

**Where:** top of the 4 rides index pages, 4 park hubs. ~700 B each.

---

### 1.7 What NOT to chart — and one that must wait

**Express Pass coverage: do not chart it yet.** The natural graphic is "57 of 107 attractions carry Express" — and it would be a fabrication of confidence. There is **no provenance field on `lightningLane`**: the schema records `multi-pass | single-pass | none` with no companion `source` or `confidence`, so a confirmed value is indistinguishable from an inferred one, and `scripts/reference/universal.mjs:117` asserts exactly one queue fact across 107 attractions. `docs/LAUNCH-UNIVERSAL.md:91` states the Epic Universe figure as "15 of 21"; the dataset says 13 multi-pass and 8 none. A chart would render that disagreement as a confident block of colour. Add `lightningLaneSource` to the schema, verify against Universal's published lists, then chart it. Not before.

Also explicitly out of scope, for reasons the survey argued and I agree with: no per-item food imagery of any kind; no chart on `pricePage` or `closuresPage` (status tables carrying explicit confidence levels — a graphic beside a claim labelled "expected, not confirmed" fights the confidence signalling); no chart on `heightsPage` or the accessibility transfer lists.

---

## Part 2 — The four park maps

This is the single highest-value item in the batch. It is also the only one that is neither a prompt nor code — it is hand-authored geometry, and there is no shortcut.

### 2.1 The problem, stated precisely

`find data/universal -name map.json` → **0 results**. Disney has 6. With no authored geometry, `src/lib/map.mjs:75` falls back to `syntheticMap()`, which lays lands out as equal wedges of a circle computed purely from `lands.length`. Epic Universe and Universal Studios Hollywood both declare 5 lands and therefore emit **byte-identical polygon geometry**. All four maps carry `water: []`, `paths: []`, and a single synthetic entrance marker — against Magic Kingdom's 6 land polygons, 1 water body, 6 paths and 19 markers.

**The serious part is not the diagram; it is the claim made about it.** `/terms/` carries a formal licence attribution — *"They are drawn from open geographic data, including data © OpenStreetMap contributors, which is available under the Open Database License."* The home page says "drawn from open geographic data." The tools index says "drawn by us from open geographic data." For the four Universal maps, no geographic data was used. Either author the geometry or suppress the attribution wording when `park.map` is synthetic. Authoring it is the better answer by a distance.

For Universal Studios Hollywood the fallback is not merely generic, it is **actively wrong**: the park's defining fact is a vertical Upper Lot / Lower Lot split joined by a long escalator bank, and a radial pie chart asserts a flat ring.

### 2.2 Legal derivation path

**Permitted, and the only permitted route:**
1. OpenStreetMap land-use, building and path geometry, via the standard editors or a raw data export.
2. Public aerial and satellite imagery, traced by hand for footprint and orientation.
3. Direct observation and photography of the site by the author.

**Forbidden, without exception:** tracing, redrawing, measuring against, or deriving proportions from any official park map — printed, in-app, or on a wall. `docs/LAUNCH-UNIVERSAL.md:153` already states this and `src/lib/map.mjs`'s header docblock already makes the legal argument correctly: *where an attraction physically sits is a fact and is not copyrightable*, and the rendered SVG is a Produced Work in ODbL terms, so we credit OpenStreetMap contributors and the artwork itself carries no share-alike obligation. That reasoning holds only if the geometry genuinely comes from OSM. It does not currently.

**Practical consequence:** the person authoring these must be able to say, per park, which OSM ways they worked from. Record that in the `note` field or a sibling comment. If a rights question ever arrives, "we traced it from OSM" is a defence and "someone drew it from memory of the app" is not.

### 2.3 The schema — read from `data/disney/parks/magic-kingdom/map.json`, verified

```json
{
  "park": "epic-universe",
  "viewBox": [0, 0, 1000, 900],
  "note": "Schematic. Relative positions only, not to scale.",
  "water":   [ { "points": [[x, y], ...] } ],
  "paths":   [ { "points": [[x, y], ...] } ],
  "lands": [
    {
      "slug": "celestial-park",
      "label": "Celestial Park",
      "points": [[x, y], ...],
      "labelAt": [x, y]
    }
  ],
  "markers": [
    { "kind": "entrance", "label": "Main entrance", "at": [x, y] },
    { "slug": "stardust-racers", "kind": "headliner", "at": [x, y] },
    { "slug": "atlantic",        "kind": "dining",    "at": [x, y] }
  ]
}
```

Field-by-field, from the renderer:

| Field | Rule |
|---|---|
| `park` | Must equal the directory slug. |
| `viewBox` | `[minX, minY, width, height]`. Disney uses `[0,0,1000,900]`. The renderer pads it: `padTop 92` for the ribbon title, `padBottom 58` for the scale note, `padSide 34`. Author inside the declared box; the frame lives in the padding. |
| `note` | Rendered into `<desc>` and used as the on-page disclaimer. Keep the "not to scale, schematic" language Disney's files carry. |
| `water[].points` | Filled polygons, `WATER #9dbdc9`, soft ink filter. Optional; omit rather than fake. |
| `paths[].points` | Open polylines — walkways. Rendered as `path-line`, not filled. |
| `lands[].slug` | **Must match a `slug` in `park.json` → `lands[]`.** These are: Epic Universe `celestial-park, ministry-of-magic, super-nintendo-world, isle-of-berk, dark-universe`; IOA `port-of-entry, marvel-super-hero-island, toon-lagoon, skull-island, jurassic-park, hogsmeade, lost-continent, seuss-landing`; USF `production-central, minion-land, new-york, san-francisco, diagon-alley, world-expo, springfield, dreamworks-land, hollywood`; USH `upper-lot, springfield, wizarding-world-of-harry-potter, super-nintendo-world, lower-lot`. |
| `lands[].label` | Display text. **Use the short form, not `park.json`'s full name.** "Diagon Alley", not "The Wizarding World of Harry Potter – Diagon Alley" — `wrapLabel()` breaks at 13 characters and the long form will stack five lines deep across a neighbouring land. |
| `lands[].points` | Polygon, absolute coordinates. **Author with deliberate gaps between neighbouring lands** — `groundShape()` computes a convex hull over every vertex and pushes it out 26 units to draw the ground beneath, so the gaps read as walkways and plazas rather than holes. Fighting this by making polygons adjacent will look worse, not better. |
| `lands[].labelAt` | Optional; defaults to centroid. `avoidMarkers()` will nudge it vertically to clear marker captions and will keep it inside its own polygon, so a roughly-right value is fine. |
| `markers[].slug` | Must match an attraction or dining slug in that park; the renderer resolves it via `attractionBySlug` / `diningBySlug` and links it if the entity has a page. **A wrong slug renders a captionless dot** — no error, no warning. |
| `markers[].kind` | `entrance` (r 9) \| `headliner` (r 8) \| `attraction` \| `dining` (r 6). |

**Target density**, matching Disney's 19–21 markers per park: one `entrance`, the park's headliners (Epic 3, IOA ~6, USF ~5, USH ~4 by `tier`), the two or three dining locations a first-timer actually navigates to, and enough `attraction` markers to reach ~18. Roughly **76 markers across four files**, ~4 KB each.

**Port of Entry note:** IOA declares a `port-of-entry` land with **zero attractions assigned**. It still needs a polygon — it is the physical entry corridor and the map is wrong without it — with the entrance marker sitting inside it. Its emptiness is a data gap, not a cartographic one.

**No code change is required.** `renderParkMap()` consumes `park.map` at `src/lib/map.mjs:204` the moment it exists, `data.mjs:179` resolves it, `validate.mjs` already warns for each missing file. This is four JSON files and nothing else.

### 2.4 The raster plate — and a finding about format

**What it is for:** two jobs, and they want different files.

1. **Download and print.** `src/pages/park.mjs:940` gates a "Download PNG" link on `park.hasMapPng`, which `data.mjs:186` sets by probing `assets/img/maps/<slug>-map@2x.png`. All four Universal map pages currently ship without it; all six Disney pages have it.
2. **`og:image` for the park and resort families.** The map plate is, by a distance, the safest image this site could publish — it is our own artwork drawn from our own geometry, with no character, logo, ride vehicle, castle, person, or three-circle anything anywhere in it.

**Finding: PNG is the wrong format for this plate, and the file sizes prove it.** Disney's plates run **1,285,816 – 1,653,413 bytes at 1x** and **4,053,488 – 5,435,756 bytes at 2x**. That is not normal for flat vector artwork. The cause is `map-style.mjs`'s `feTurbulence` grain filter, which rasterises into genuine per-pixel noise across the entire canvas and defeats PNG's row-wise DEFLATE compression completely. PNG is a lossless format optimised for flat colour; the vintage plate is a textured photograph of paper. **JPEG at q82 will produce a visually identical plate at roughly 300–450 KB — an order of magnitude smaller.**

**Recommendation:**

- Generate `<slug>-map.jpg` at 1600px and `<slug>-map@2x.jpg` at 3200px for the download link.
- Generate `<slug>-map-social.jpg` at **1280 × 672**, centre-cropped from the plate, for `og:image` (see §4.2 — match the declared dimensions rather than fighting them).
- **Namespace the output per operator**: `assets/img/maps/<operator>/`. `scripts/render-map-pngs.mjs:25` currently writes to a shared directory and defaults to `OPERATOR = 'disney'`, so generating Universal's plates today would put both operators' files in both sites rather than fixing anything. This is the same blanket-copy problem that is currently shipping 37 MB of Disney maps inside `dist/universal`; fix the namespacing in the same change.
- Keep it out of `npm run build`. The out-of-build, commit-the-output precedent in `render-map-pngs.mjs` is correct and well-argued in its own docblock — do not disturb it.

**Order of operations:** author `map.json` → `npm run build` → `npm run maps:png universal`. Rasterising first produces four beautiful pictures of a pie chart.

---

## Part 3 — Icons, favicon, PWA

**Kind:** deterministic. `scripts/generate-icons.mjs` already draws real PNGs with nothing but `node:zlib` — no prompt is appropriate or needed here.

### 3.1 The problem

Two independent hardcodes put Ride Ready Guide's brandmark on all 251 Hollywood Ride Guide pages:

- `src/build.mjs:520–525` — `FAVICON` is a module constant with `fill="#0f3d2e"` (Ride Ready green) and `#e9b264` letterforms, written unconditionally to every operator's dist at line 531. The monogram is `RL`, not even `HR`.
- `scripts/generate-icons.mjs:17–19` — `BRAND = [15,61,46]`, `BRAND_DEEP = [9,42,32]`, `AMBER = [233,178,100]`, writing to the shared `assets/img/`.

Meanwhile `manifest.webmanifest` correctly declares `theme_color: "#1b3a5c"`, so an installed PWA shows a navy splash behind a green icon.

The measuring-stick mark itself is good and should be kept: it is our own artwork, it says what the site is, it reads at 32px, and it carries no IP exposure. **Only the palette and the monogram change.**

### 3.2 Specification

**Palette for the Universal set**, from `data/universal/site.json` → `brand.themeColor`:

| Role | Value | Notes |
|---|---|---|
| `BRAND` | `#1b3a5c` → `[27, 58, 92]` | Declared navy |
| `BRAND_DEEP` | `#12283f` → `[18, 40, 63]` | Gradient foot, ~30% darker |
| `ACCENT` | `#e9b264` → `[233, 178, 100]` | Keep the amber — it holds against navy at 4.9:1 and keeps the two properties visibly siblings |
| `PAPER` | `#faf8f4` → `[250, 248, 244]` | Unchanged |

**Files:**

| File | Size | Format | Requirements |
|---|---|---|---|
| `favicon.svg` | 64 × 64 viewBox | SVG | `rx="14"` plate, `#1b3a5c`; monogram `HR` in `#e9b264` / `#faf8f4`; no external refs |
| `icon-180.png` | 180 × 180 | PNG, opaque | apple-touch-icon. **Full-bleed square, no transparency, no baked corner radius** — iOS applies its own mask, and rounded transparent corners produce a visible artefact ring |
| `icon-192.png` | 192 × 192 | PNG | `purpose: any`. Rounded plate at 22% is fine here |
| `icon-512.png` | 512 × 512 | PNG | `purpose: any`. Also becomes `Organization.logo` in JSON-LD |
| `icon-maskable.png` | 512 × 512 | PNG, opaque | `purpose: maskable`. **Full-bleed background; all critical content inside the centre circle of radius 40% of the width** |

**Two defects in the existing generator, both verified by reading `drawIcon()` at `scripts/generate-icons.mjs:104`, both shipping to the live Disney site today:**

1. **The maskable icon insets the plate instead of the content.** `const inset = maskable ? size * 0.14 : 0` shrinks the *background* to 72% of the canvas, leaving transparent corners. After the OS applies its mask the icon shows the platform background at the corners rather than the brand plate. The correct form is the inverse: background full-bleed at `inset = 0`, mark scaled to ~0.62 of the canvas and centred, so it sits inside the safe circle whatever mask shape the platform chooses.
2. **`icon-180` is drawn with a `size * 0.22` corner radius and transparent corners.** apple-touch-icon must be an opaque full-bleed square.

Fix both while re-colouring. Blast radius is both operators — but Disney's corrected icons would be a visual improvement rather than a regression, so ship them together and eyeball both.

**Code shape:** make `generate-icons.mjs` take an operator argument, read the palette from `data/<op>/site.json` → `brand`, and write to `assets/img/<operator>/`. Lift `FAVICON` out of `src/build.mjs:520` into a function of `site.brand`. Then point the manifest (`build.mjs:273–275`) and `apple-touch-icon` (`layout.mjs:183`) at the operator path, and stop `copyAssets` from copying the other operator's set. Disney's values become the current literals, so its output stays byte-identical apart from the two corner fixes.

---

## Part 4 — Social cards

**Kind:** deterministic templates, rasterised out-of-build. Not a prompt.

### 4.1 Why typographic and not photographic

Under the constraints in force — no characters, no ride vehicles, no logos, no castle, no real people, no three-circle arrangements even incidentally — a photographic social card is close to unsourceable, and a diffusion model asked for "theme park at night" will emit a three-circle silhouette in the bokeh unprompted. A typographic data card carries none of that risk, is generated from facts the site has already fact-checked, compresses to 20–40 KB, and is the one thing a competitor cannot mint: it shows *our verified numbers*.

Today **0 of 251 pages emit `og:image`**, and every page emits `twitter:card=summary`. The only image any platform can show for a Hollywood Ride Guide link is the favicon — which is currently the other brand's monogram.

### 4.2 Format constraints, verified against the code

- **Dimensions: 1280 × 672.** `data/universal/site.json` already declares `photos.social` at this size and `layout.mjs:46–47` emits those numbers. It is the same 1.91:1 as 1200 × 630. Match the declaration rather than fighting it.
- **Format: JPEG, and only JPEG.** `src/lib/data.mjs:389` hardcodes the URL as `${origin}/assets/img/photos/${social.file}-1280.jpg` while the existence probe accepts `.avif`, `.webp` **or** `.jpg`. **An AVIF-only card would pass the probe, flip all 251 pages to `summary_large_image`, and point every one at a 404.** Social crawlers do not accept AVIF anyway. Ship `.jpg`, and fix the resolver to record which extension satisfied the probe.
- **Filename collision:** both operators declare `photos.social.file = "social-card"` into a single shared directory. Rename Universal's to `social-card-universal` — one JSON string — or whichever card lands on disk becomes the Open Graph image for both sites.
- Keep everything inside a centred **80% safe area**; every platform crops differently.

### 4.3 The ten templates

Ranked by how often the page gets shared. All flat colour and type on `#1b3a5c`, amber accents, no photography.

| # | Template | Pages | Data source | Contents |
|---|---|---|---|---|
| 1 | **Height band** | 5 | `attractions.json` → `heightIn` | The height ladder from §1.2 as the hero, `40"` as a giant numeral, `+11 rides` callout |
| 2 | **Attraction** | 62 | `heightIn`, `intensity`, `scary`, `name` | Ride name, height as a giant numeral, the §1.1 fear polygon at 220px, intensity chip |
| 3 | **Month** | 12 | `verdict.grade`, `crowds.level`, `cost.level` | The letter grade at ~380px as the hero; crowd/cost/weather triplet beneath |
| 4 | **Park map** | 6 | `dist/universal/maps/<slug>-map.svg` | Centre-crop of the plate + park name plate. Legally the safest card on the site |
| 5 | **Comparison** | 10 | `contenders[]`, `verdict.short`, the §1.5 tally | Two-column A-vs-B, tally strip, one-line verdict |
| 6 | **Price** | 5 | price ranges + `priceVerified` | The range, and **the as-of date stamped into the image** — an undated price screenshot is exactly the artefact this site exists to prevent |
| 7 | **Restaurant** | 47 | `dining.json` → `name`, `service`, `cuisine`, `priceTier`, `signatureItems[0]` | Name, tier, cuisine, signature item |
| 8 | **Guide** | 11 | `title`, `keyPoints[0]` | Title + one-line thesis |
| 9 | **Event / holiday** | 16 | edition `confidence` | Name plus a **confidence badge reading "expected" or "historical (2025)"** — never an invented date. This card must inherit `seasonal-schema.mjs`'s honesty rule, not route around it |
| 10 | **Brand default** | all others | `site.brand`, home-page stats | Wordmark, "Independent & unofficial", the four figures (104 attractions / 39 height requirements / 158 snacks / 84 places to eat) |

**Code:** a new `scripts/render-social-cards.mjs` modelled on `render-map-pngs.mjs` — SVG templates → headless Chromium → JPEG, out of `npm run build`, output committed. Plus `layout.mjs` `metaTags()` accepting `page.socialImage` with fallback to `site.socialImage`, emitting `og:image:alt` and taking width/height from the image rather than the hardcoded 1280/672.

**Gate:** mirror the mtime check at `scripts/audit.mjs:205–214` — fail when a rendered card is older than the data it depicts. This is the staleness risk the whole out-of-build pattern trades for, and the repo already knows how to check it.

---

## Part 5 — Podcast artwork

**Kind:** hybrid. The typography must be deterministic. The background *may* be generated — and I recommend it is not.

### 5.1 Status

`data/universal/site.json` has **no `podcast` key at all**. Disney's has a 10-field scaffold with `artwork: ""`, `audioBase: ""`, `email: ""`, `episodes: []`, and `src/lib/podcast.mjs:116` returns null unless `audioBase` and `email` are both non-empty — so neither operator ships a feed today. The artwork is therefore a **pre-requisite asset for a launch that has not been scheduled**, not a blocker. Build it when the feed is real.

### 5.2 Apple Podcasts requirements

| Requirement | Value |
|---|---|
| Dimensions | Square, minimum 1400 × 1400, maximum 3000 × 3000 |
| Recommended | **3000 × 3000** |
| Format | JPEG or PNG, RGB colour space, 72 dpi |
| Legibility | Must read at 55 × 55 px — the size in a subscription list |
| Prohibited | Apple/Spotify marks, "Subscribe", episode numbers, URLs, explicit-content claims |
| Practical | No fine detail, no thin type, high contrast, one idea |

### 5.3 Specification (deterministic)

Ground `#1b3a5c`. The measuring-rule mark from the icon set, scaled to ~44% of the canvas, positioned upper-centre, amber `#e9b264` with `#12283f` ticks. Beneath it, the title in `--font-display` at ~9% of canvas height, `#faf8f4`, tight tracking, two lines maximum. Under that, a single amber rule 3% wide and one line of 3.2%-height type: `Independent · unofficial · dated`.

**Recommended title: "Hollywood Ride Monthly"** — mirroring Disney's "Ride Ready Monthly", and the only remaining slot in `podcast.title`.

At 55px this reduces to a navy square with an amber vertical stroke and a light block — which is exactly what you want, because it is the same silhouette as the app icon, so a listener who has the site installed recognises the podcast without reading it.

**Produce it the same way as the social cards**: an SVG template through `render-social-cards.mjs`, output `assets/img/podcast-artwork-3000.jpg`. Then set `data/universal/site.json` → `podcast.artwork` to the absolute URL.

### 5.4 The optional generated background — and the argument against it

The brief asks for a verbatim prompt, so here is one. **Read the argument first: I do not recommend using it.** The typography and the mark are the artwork; a photographic ground behind them adds an IP review, a rights record in `CREDITS.md`, an AI-disclosure obligation, and a compression problem at 3000px, and it buys a texture. If the flat navy plate reads as too plain, the correct fix is a deterministic subtle gradient plus the existing `feTurbulence` grain from `map-style.mjs` — which is already written, already legally clean, and already in the house visual vocabulary.

If it is generated anyway, this produces an abstract ground only. It must be composited **behind** deterministic type, never asked to render text.

```
Abstract background plate for a square audio-programme cover, upper two
thirds deliberately empty for type. A deep navy field, the colour of a
clear sky forty minutes after sunset, graded from slightly lighter at the
upper edge to near-black at the lower. Across the lowest quarter, a row of
warm amber points of light at varying distances, thrown far out of focus
into soft round bokeh discs of irregular size and irregular spacing, each
disc a plain smooth circle with a slightly brighter rim, arranged in a
loose horizontal scatter that never forms a cluster, a triangle, or any
repeating pattern. Above them a faint warm haze where the light meets the
air. Fine even film grain across the whole frame. Photographic, shot on a
full-frame camera with a 50mm lens at f/1.4, natural light only. The upper
two thirds are plain graded navy sky containing nothing at all: no
structures, no silhouettes, no horizon line, no objects.
```

**Negative conditioning — supply through the tool's own parameter, never as prose in the prompt above.** Prose negation raises the odds of the token appearing; the parameter is the actual control.

- **Midjourney:** `--no text, letters, words, watermark, signature, logo, people, faces, crowds, buildings, architecture, towers, spires, castle, rides, vehicles, machinery, wheels, characters, mascots, balloons, food, circles of equal size, three circles, clustered circles, overlapping circles, symmetry, pattern, tiling`
- **Firefly:** put the same list in the *Exclude* field.
- **SDXL / negative prompt field:** same list, comma-separated.

**Mandatory human review before use** — the checklist below, run at 100% *and* at thumbnail size, because the three-circle failure mode resolves at small scale where it is invisible large. On this image specifically the bokeh row is the exact hazard: any three discs falling into a head-and-two-ears arrangement is a reject, not a retouch. Re-run the check on the final encoded JPEG, not the generator preview — quantisation merges adjacent blobs and can *create* an arrangement that was not in the source. Record generator, model version, verbatim prompt, verbatim negative string, date, and reviewer name in `assets/img/photos/CREDITS.md`, which does not yet exist and must exist before any generated image ships.

---

## Part 6 — Diagrams that carry information a photograph cannot

Four cases where the survey found real information with no visual form. All hand-authored inline SVG — a few dozen lines each, no model involved, no IP surface at all.

### 6.1 The two-campus geography diagram

**Why:** the site's own copy says *"Universal Orlando is now a three-park destination, and that changed the trip"* and *"Epic Universe opened on a separate campus a short drive south."* A reader planning three days has nothing showing that the campuses are **not walkable**. This is the single most common Universal Orlando planning error and it is currently a sentence.

**Spec:** a simple two-node schematic. Upper cluster — USF and IOA joined by a short walk and a boat line, with CityWalk between them as the hub. Lower node — Epic Universe, joined by a long connector explicitly labelled as a drive/shuttle, drawn at a length that reads as *far*. Not to scale, labelled as such, with travel times where the data supports them and omitted where it does not. `--brand-2` for walk, `--accent` for boat, dashed `--muted` for shuttle. One instance on the Universal Orlando resort page, one on `/compare/epic-universe-vs-islands-of-adventure/`.

### 6.2 The Upper Lot / Lower Lot elevation

**Why:** the defining physical fact about Universal Studios Hollywood is that it is on two levels joined by a long escalator bank, and the synthetic radial map asserts a flat ring. This is not decoration — it changes how a day is planned, and no photograph can show it because no vantage point contains both levels.

**Spec:** a side-elevation cutaway. Two horizontal bands with the escalator run drawn between them at its real steepness, the four Upper Lot lands on top, Lower Lot beneath, with attraction counts (Upper 11 + 1 + 4 + 3 = 19, Lower 6, from the verified per-land counts) and a note on the one-way-ness of the descent. Renders on the USH park hub and first-timer guide. **This should exist even after `map.json` is authored** — a plan view still cannot show elevation.

### 6.3 The ride-transfer diagram

**Why:** `accessibility.transfer` is populated on all 107 attractions with three values — `wheelchair-accessible 61`, `must-transfer 43`, `ecv-transfer 3` — and the four accessibility pages render them as prose lists. A reader planning around a mobility aid is doing a triage task, and triage is what a diagram is for.

**Spec:** a three-branch decision figure. Stay in the chair (61) → transfer to an ECV-accessible boarding (3) → full transfer required (43), each branch listing its rides for that park and carrying the `accessibility.notes` string where one exists. `--good` / `--warn` / `--accent` for the three branches. Four instances, one per park. This is also the page family that currently emits no page-specific schema type at all, so it is worth touching once and fixing both.

### 6.4 The Express Pass decision tree — **hold**

The natural fourth diagram is "should you buy Express" for the hotel arithmetic. **Do not build it yet.** It depends on per-attraction Express coverage that carries no provenance field (§1.7), and on hotel rates the site does not hold. A decision tree renders uncertainty as confident geometry, which is precisely the failure this site's confidence ladder exists to prevent. Build it after `lightningLaneSource` lands and the hotel data exists.

---

## Part 7 — Gates that must ship with this batch

The repo's defining discipline is that a documented rule which is not gated decays. This batch adds a large surface with, currently, no checks on it at all — `scripts/audit.mjs:181–183` contains the complete image gate, and it only tests that an `<img>` has an `alt` attribute, which is a no-op across 251 pages with zero `<img>` tags.

Add to `scripts/audit.mjs`:

1. **Map slug integrity** — every `markers[].slug` in every `map.json` resolves to a real attraction or dining slug in that park, and every `lands[].slug` matches a `park.json` land. A wrong slug currently renders a captionless dot with no error anywhere.
2. **Land coverage** — fail when a park has a `map.json` whose `lands[]` does not cover every land declared in `park.json`.
3. **Chart-data agreement** — assert the height ladder's denominator equals the height-checker payload's ride count on the same page. This is the specific way these two will drift apart.
4. **Card freshness** — fail when a rendered social card is older than the JSON it depicts (mirror the mtime check at `audit.mjs:205–214`).
5. **`og:image` assertion** — warn when `socialImage` is null; fail when it is set but the referenced file is absent from `dist`.
6. **SVG budget** — fail when any single page's inline SVG exceeds 25 KB raw. Cheap insurance against someone putting 158 radars on the food tracker.

Add to `scripts/validate.mjs`:

7. Downgrade the four "map.json not authored yet" warnings to **errors** once the first Universal `map.json` lands, so parks three and four cannot be forgotten.

---

## Build order

Ordered by return per unit of work, with the dependencies that actually exist.

| # | Asset | Effort | Blocks | Unblocks |
|---|---|---|---|---|
| 1 | Prune `assets/img/maps` per operator in `copyAssets` | Trivial | — | Every weight claim below becomes true. 37 MB → 11 MB |
| 2 | Icon set + favicon, operator-scoped (5 files) | Small | — | Fixes the brandmark on 251/251 pages today |
| 3 | Fear fingerprint component | Small | — | 62 detail + ~215 card instances; the site's visual signature |
| 4 | Height ladder | Small | — | The most shareable graphic on the site |
| 5 | Compare tally + park anatomy bar | Small | — | 14 pages, existing data, no new fields |
| 6 | Month grid | Medium | — | 1–13 pages; the Orlando/Hollywood divergence finally visible |
| 7 | Price histogram | Small | — | 9 pages |
| 8 | **Four `map.json` files** | **Large** | Hand-authoring from OSM | The largest untapped differentiator; also makes `/terms/` true |
| 9 | Map JPEG plates, operator-namespaced | Small | #8 | Download link on 4 pages + the safest `og:image` on the site |
| 10 | Social card renderer + 10 templates | Large | #2 | 251 pages stop sharing as bare text links |
| 11 | Four diagrams (§6.1–6.3) | Medium | — | Information no photograph can carry |
| 12 | Audit gates | Small | ships with each | Stops all of the above decaying |
| 13 | Podcast artwork | Small | podcast launch | Not urgent — no feed exists |

**Total: 34 assets.** 6 chart components · 4 `map.json` · 4 map plate sets · 10 social card templates · 5 icons · 1 podcast cover · 4 diagrams.

**32 of the 34 are deterministic code and data.** One is hand-authored geometry. One has an optional prompt attached that I recommend against using. That ratio is the point of this batch: none of it can be produced by a competitor without doing the verification work first, and none of it carries a single byte of IP risk.

---

# Part 4 · Written content

Prose, data, and editorial content. Every prompt embeds the freshness and verification constraint in its own text, so a model receiving it cannot emit an unverifiable claim without flagging it.

*24 items in this batch.*

## Batch: Written Content — Hollywood Ride Guide (universal)

Twenty-four paste-ready prompts covering the prose, data, and editorial content the survey found
missing. Every prompt is built to survive `validate.mjs`, `factcheck.mjs` and `audit.mjs` rather
than to read well and fail at the gate.

**Census this batch is written against** (verified by reading `data/universal/` directly, not from
the survey): 4 parks, 27 lands, 107 attractions (22 headliner / 38 major / 47 minor; 62 standalone),
84 dining (47 standalone), 158 food items, 39 height requirements, 11 guides, 10 compare pages,
5 events / 5 editions, 12 months. Current verification month is **2026-07**.

---

### 0. The two output shapes, and why there are only two

A generation prompt on this site cannot ask for "800 words about Epic Universe", because the
fact checker holds a hand-written reference table that the writing model cannot see. So every
prompt below produces exactly one of two shapes, and says which one it is in its first line.

| | Shape | What it may contain | Where it lands |
|---|---|---|---|
| **A** | **Descriptive / experiential** | Judgment, sequencing, atmosphere, reasoning, comparison of things already in the dataset. **Zero new checkable facts.** Numbers may only be reproduced from the INPUTS block. | Straight into `data/universal/…` after a normal editorial read |
| **B** | **Data proposal** | New checkable facts — heights, prices, dates, counts, statuses, Express tiers | `data/universal/_proposals/…`, **never** into `data/` until a human clears every row of its `_unverified` array |

Shape A is the default and covers 18 of the 24 prompts. Reach for Shape B only when the deliverable
genuinely is new dataset (Volcano Bay, CityWalk, hotels, new events).

#### The `_unverified` envelope (Shape B only)

A Shape B prompt emits its facts twice: once in the proposed record, and once in a flat sidecar
array that a human works through line by line.

```jsonc
{
  "_proposal": {
    "operator": "universal",
    "target": "data/universal/parks/volcano-bay/attractions.json",
    "generatedFor": "2026-07",
    "status": "UNVERIFIED — must not be merged into data/ until _unverified is empty"
  },
  "_unverified": [
    {
      "path": "attractions[3].heightIn",
      "proposedValue": 48,
      "claim": "Ko'okiri Body Plunge has a 48-inch minimum height.",
      "howToVerify": "Universal Orlando's own Volcano Bay attraction listing, or the sign at the ride entrance. Not an aggregator, not a fan wiki.",
      "ifUnconfirmed": "Set heightIn to null and write a heightNote saying the minimum is posted at the entrance and was not verified for this edition."
    }
  ],
  "park": "volcano-bay",
  "attractions": [ /* … */ ]
}
```

Three rules make this real rather than decorative:

1. **Every checkable value in the record appears in `_unverified`.** If a number is in the record and
   not in the sidecar, the proposal is malformed and goes back.
2. **`ifUnconfirmed` is mandatory and must be a real fallback**, not "omit". The site's stated
   discipline is that an absent height renders as "not stated", which is honest; a guessed height is
   not. Every row therefore has a defined losing branch.
3. **Recommended gate** (~15 lines in `scripts/validate.mjs`): fail if any file under
   `data/<operator>/` contains a key matching `^_` at the top level. That makes "proposal leaked into
   the dataset" a build failure instead of a code-review hope. Blast radius: both operators, additive.

---

### 1. BLOCK A — the constraint preamble

**This is the load-bearing text of the entire batch.** Every prompt from P1 to P24 is assembled as
`BLOCK A` + the prompt body. Pasting a body without Block A produces content that will fail the gate.

```
CONTEXT — READ THIS BEFORE WRITING ANYTHING

You are writing for Hollywood Ride Guide (hollywoodrideguide.com), an independent, unofficial
planning site covering the four US Universal theme parks: Universal Studios Florida, Islands of
Adventure and Epic Universe (Universal Orlando Resort), and Universal Studios Hollywood
(Universal Hollywood). The site is not affiliated with, endorsed by, or connected to NBCUniversal
or Universal Destinations & Experiences.

THE VERIFICATION FLOOR — THIS OVERRIDES EVERY OTHER INSTRUCTION IN THIS PROMPT

Every checkable claim on this site is cross-checked by an automated fact checker against a
reference table that was written independently of the dataset. You cannot see that table. You are
therefore not permitted to state any of the following as fact:

  - a height requirement, in inches or centimetres
  - a price, a price range, a fee, or a percentage discount
  - a date, a season's start or end, an operating window, or a park opening year
  - a ride duration, a queue length, a wait time, or a capacity figure
  - a count of anything (attractions, houses, slides, hotels, lands, restaurants)
  - an operating status (open, closed, refurbishing, seasonal)
  - whether an attraction is covered by the paid queue product, and at which tier
  - whether an attraction runs a single rider line or a virtual queue

If a sentence you want to write depends on one of those, do ONE of these three things, and never
anything else:

  1. USE THE SUPPLIED VALUE. The INPUTS block below contains values already verified in the
     dataset. Reproduce them exactly, including units and any note attached to them. Do not round,
     convert between inches and centimetres, recalculate, average, or "correct" them. If a supplied
     value looks wrong to you, use it anyway and say so in the NOTES FOR THE EDITOR block at the end.

  2. WRITE AROUND IT. Most good sentences do not need the number. "The tallest requirement in the
     park" is checkable from data we already hold and needs no figure. "It is the longest queue in
     the land at opening" is a judgment, which you are allowed to make. Prefer this option.

  3. ESCALATE IT. If the sentence cannot be written without a fact you were not given, do not write
     the sentence. Emit the claim in the NOTES FOR THE EDITOR block instead, in this form:
       UNVERIFIED: <the claim> | NEEDED FOR: <which section> | SOURCE TO CHECK: <where a human
       should look — Universal's own site, app, or the sign at the entrance; never an aggregator>

Inventing a plausible figure is the worst available outcome and is worse than omitting the section.
A wrong number that reads well passes a human read and then fails a reader standing at a height
stick with a child. If you are ever choosing between a confident sentence and an accurate one,
choose the accurate one and let the sentence be duller.

MONEY, SPECIFICALLY
Never write a single fixed price. Every monetary claim is a range, and carries the month it was
checked. "About $18" is a validation error. "Roughly $15 to $22 as of July 2026" is the house form.
This rule has no exceptions.

THE OTHER OPERATOR
This site's sister publication covers the Disney parks. Their product names, park names and copy
must never appear here. In particular: the paid queue product at Universal is called Express Pass
(tiers: "Universal Express Pass", "Universal Express Unlimited", "Standby only"). Never write
"Lightning Lane", "Genie+", "Disney", "Walt Disney World", "Disneyland", "Magic Kingdom" or
"EPCOT" unless this prompt explicitly tells you the page is a comparison page. A Disney product
name on a Universal page is a factual error about a paid product, not a style slip.

VOICE
- US spelling throughout. Second person, present tense.
- Lead with the answer. The first sentence of every section states the conclusion; the rest
  supports it. Never build to a reveal.
- Commit to verdicts. "It depends" is allowed only when immediately followed by the two or three
  cases it depends on, each answered.
- Say the unflattering thing. A guide that never says "skip this" is an advertisement.
- No exclamation marks. No rhetorical questions as headings. No second-person hype ("you'll love").
- Never claim we attended something, rode something on a given date, or spoke to staff. Write from
  documented fact and stated reasoning.

BANNED WORDS — the fact checker greps for these and reports every hit
  magical, immersive, unforgettable, beloved, nestled, delve, a testament to, whimsical
BANNED PARAGRAPH OPENERS — only banned at the start of a paragraph, fine mid-sentence
  "Whether you…", "In the world of…", "From the moment you…"
Also avoid, as house style: "iconic" in prose, "a must-see", "hidden gem", "something for everyone",
"nothing short of", "boasts", "offers up", "step into", "transport you".

FORMATTING
Prose fields are arrays of plain-text paragraphs. The only markup supported is **bold**, *italic*,
`code`, and [link text](/absolute/path). No headings, no HTML, no bullet lists inside a paragraph,
no emoji, no em-dash-heavy typography. Use a spaced hyphen or a comma where you would reach for an
em dash. Straight apostrophes are fine.

ALWAYS END YOUR OUTPUT WITH THIS BLOCK, even if it is empty:

NOTES FOR THE EDITOR
- UNVERIFIED: …  (one line per escalated claim, in the form given above)
- JUDGMENT CALLS: …  (anything you decided that a human should sanity-check)
- SUPPLIED VALUES I DOUBT: …  (any INPUT that looked wrong; do not act on the doubt, just report it)
```

---

### 2. Thin page families

Word-count targets below are **authored words per record** — the sum of `summary`, `description[]`,
`experience[]`, `tips[]`, `scary.notes`, `accessibility.notes`, `bestTime`, `typicalWait` and
`faqs[]`. Measured on the real dataset, standalone attraction records currently run **741–1,003
authored words (median 847)**; non-standalone run **249–397 (median 336)**.

#### P1 — Headliner depth expansion (22 records, Shape A)

**The problem.** All 22 headliner records sit at 3 description paragraphs / 5 tips, the same budget as
a minor ride. The one exception, `universal-studios-hollywood/studio-tour`, runs 4 description
paragraphs and 6 FAQs and is the strongest page on the site. Nothing structural prevents the rest;
the template already renders variable-length arrays.

**Target.** +300 to +380 authored words per record, taking headliners to ~1,150–1,200. Do not touch
the 38 `major` records — the flatness is the defect, not the floor.

**Sections to add:** one 4th `description` paragraph (design, history, or why it matters in the
park's roster), one 4th `experience` paragraph (the seat/row/timing advice specific to this ride),
and 2 additional `faqs`.

```
[PASTE BLOCK A ABOVE THIS LINE — IT IS NOT OPTIONAL]

TASK — SHAPE A (descriptive/experiential, no new checkable facts)

Expand one existing attraction record. You are adding depth to a record that is already published
and already fact-checked. You are not rewriting it and not correcting it.

INPUTS (every value here is already verified — reproduce exactly, never restate a different number)
  ATTRACTION NAME:        {{NAME}}
  PARK:                   {{PARK_NAME}}
  LAND:                   {{LAND_NAME}}
  TIER:                   {{TIER}}
  RIDE TYPE:              {{TYPE}}
  OPENED:                 {{OPENED}}
  HEIGHT REQUIREMENT:     {{HEIGHT_IN}} inches   (if null: "no height requirement")
  HEIGHT NOTE:            {{HEIGHT_NOTE}}
  DURATION:               {{DURATION_MINUTES}} minutes
  PAID QUEUE TIER:        {{QUEUE_LABEL}}        (one of: Universal Express Pass /
                                                  Universal Express Unlimited / Standby only)
  SINGLE RIDER LINE:      {{SINGLE_RIDER}}
  VIRTUAL LINE:           {{VIRTUAL_QUEUE}}
  INTENSITY (1-5):        {{INTENSITY}}
  FEAR PROFILE (1-5):     darkness {{DARKNESS}}, drops {{DROPS}}, speed {{SPEED}},
                          loudness {{LOUDNESS}}, startles {{STARTLES}}, overall {{SCARY_SCORE}}
  MOTION SICKNESS:        {{MOTION_SICKNESS}}
  GETS WET:               {{GETS_WET}}
  INDOOR/OUTDOOR:         {{INDOOR_OUTDOOR}}
  GOES UPSIDE DOWN:       {{GOES_UPSIDE_DOWN}}
  WHEELCHAIR TRANSFER:    {{ACCESSIBILITY_TRANSFER}}
  EXISTING description[]: {{EXISTING_DESCRIPTION}}
  EXISTING experience[]:  {{EXISTING_EXPERIENCE}}
  EXISTING tips[]:        {{EXISTING_TIPS}}
  EXISTING faqs[]:        {{EXISTING_FAQS}}
  RELATED ATTRACTIONS:    {{RELATED_SLUGS}}

PRODUCE exactly this JSON and nothing else:

{
  "descriptionAppend": "<one paragraph, 110-150 words>",
  "experienceAppend":  "<one paragraph, 110-150 words>",
  "faqsAppend": [
    { "q": "<question>", "a": "<answer, 40-90 words>" },
    { "q": "<question>", "a": "<answer, 40-90 words>" }
  ]
}

WHAT THE NEW description PARAGRAPH IS FOR
Pick whichever of these the existing three paragraphs have NOT already covered, and say so in your
editor notes:
  (a) the ride system and what was hard about building it, in plain language;
  (b) where it sits in the park's roster — what it is the best or only example of here;
  (c) how it has changed since opening, at the level of "the film was replaced" rather than dates.
Do not restate the plot. Do not repeat a sentence already in the existing paragraphs.

WHAT THE NEW experience PARAGRAPH IS FOR
The advice that only applies to this ride and that a reader could not guess. Which row or side is
better and why. Where the drop actually is relative to where people brace for it. What the queue
does to you before you board. What to do with glasses, bags, hats, or a phone. If the ride has a
single rider line, what you give up by using it beyond sitting apart. Be specific enough that
someone who has ridden it would recognize the observation.

WHAT THE TWO NEW FAQs ARE FOR
Questions a real person types before this specific ride. Do not duplicate an existing FAQ, and do
not write a question whose answer is a number you were not given. Strong shapes:
  "Is [NAME] too intense for a nervous adult?"  "Does [NAME] go upside down?"
  "Can I use a single rider line at [NAME] with a child?"
  "What happens if I get stuck on [NAME]?"      "Is the queue worth walking through?"
Answer from the fear profile, the motion-sickness rating, the accessibility transfer value and the
supplied booleans. Every one of those is already verified and safe to reason from.

HARD LIMITS FOR THIS TASK
- Do not state a height, price, date, duration or count that is not in INPUTS above.
- Do not name a competing operator or its products.
- Do not describe an image, photograph or piece of character artwork. You may name characters,
  rides and films factually in prose; you may never describe a picture of one.
- Do not use the banned words or openers listed in Block A.
```

#### P2 — Closed attractions: "what was here" (3 records, Shape A)

Three Universal attractions carry `status !== "open"` with an authored `closedNote`, and 897 words
of their copy render nowhere: `poseidons-fury` and `the-eighth-voyage-of-sindbad`
(islands-of-adventure), `the-walking-dead-attraction` (universal-studios-hollywood). "What happened
to X" is durable search demand and needs no new facts.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write a short retrospective block for an attraction that has closed permanently.
It renders inside its land page, not on its own URL.

INPUTS
  ATTRACTION NAME: {{NAME}}      PARK: {{PARK_NAME}}      LAND: {{LAND_NAME}}
  TYPE: {{TYPE}}                 OPENED: {{OPENED}}       STATUS: {{STATUS}}
  EXISTING closedNote:  {{CLOSED_NOTE}}
  EXISTING description[]: {{EXISTING_DESCRIPTION}}
  WHAT OCCUPIES THE SPACE NOW (may be "unknown"): {{SUCCESSOR}}

PRODUCE:
{
  "wasHere": {
    "heading": "<= 60 chars, e.g. 'What was here'",
    "body": ["<paragraph, 90-130 words>", "<paragraph, 90-130 words>"],
    "note": "<one sentence a reader arriving from search needs first>"
  }
}

FIRST PARAGRAPH: what the attraction was and what it was like, in the past tense, written for
someone who never rode it. SECOND PARAGRAPH: why its closure mattered to the park, and what a
visitor looking for it should do instead - name a currently-operating attraction in the same park
only if one is genuinely comparable, and say plainly if none is.

DATES ARE THE TRAP HERE. You have an opening year in INPUTS. You do NOT have a closing date unless
it appears verbatim in the closedNote. Do not infer one, do not write "closed in 2024", and do not
write "after 25 years". If the closing date matters to a sentence, write the sentence without it or
escalate it as UNVERIFIED. Never write that something "is rumored to" become anything.
```

#### P3 — Best-snacks ranking framing (4 pages, Shape A)

The four `/best-snacks/` pages render 2,942–3,544 words of which **9–50 are unique to the page**.
Everything else is food-item copy that also appears on the dining pages and the Food Tracker. The
sibling `/best-rides/` pages run 96% page-unique. The ranking rationale was simply never written.

**Target.** 600–900 words per park, all page-unique. Add to `data/universal/parks/<park>/food.json`
as a sibling `bestSnacks` block, mirroring the existing `best-rides.json` pattern
(`criteria` / `intro[]` / `ranking[]` / `overrated[]` / `underrated[]` / `faqs[]`).

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the editorial framing for one park's best-snacks page. Every food item,
price and verdict already exists and already renders. You are writing ONLY the connective judgment
that is currently missing: how the list was ranked, and what a reader should actually eat.

INPUTS
  PARK: {{PARK_NAME}}          RESORT: {{RESORT_NAME}}
  FOOD ITEMS (id | name | restaurant | land | price | category | mustTry 1-5 | iconic |
              shareable | portable | dietaryTags | existing verdict):
  {{FOOD_ITEMS_TABLE}}
  PRICES LAST VERIFIED: {{PRICE_VERIFIED}}   (all items in this park share this month)

PRODUCE:
{
  "criteria": "<1-2 sentences: what you ranked on, and what you deliberately ignored>",
  "intro": ["<paragraph 90-130 words>", "<paragraph 90-130 words>"],
  "topFive": [
    { "id": "<food id, exactly as supplied>", "rank": 1,
      "why": "<40-70 words on why it beat the rest>" }
  ],
  "overrated": [ { "id": "<food id>", "why": "<30-60 words>" } ],
  "oneSnackBudget": "<70-110 words: if you eat one thing here, this, and why>",
  "grazingPlan": "<70-110 words: a full day of grazing, in walking order through the park>",
  "seatedVsWalking": "<50-80 words: which items need a table and which you can walk with>",
  "faqs": [ { "q": "…", "a": "<40-90 words>" } ]
}

RANKING RULES
- Rank on how good the thing is to eat, and on whether it is worth the walk and the queue. Do NOT
  rank on price and do NOT rank on how photogenic it is.
- Use the supplied mustTry, iconic, shareable and portable flags as evidence, not as the answer.
  Where your ranking disagrees with mustTry, that is allowed and interesting - say why in `why`.
- topFive must be exactly 5 items. overrated must be 2 to 4 items and must be honest; if the park's
  most famous item is not very good, that is the entry the page exists to carry.
- Every `id` you emit must be copied character-for-character from the supplied table. A food id is a
  permanent share-URL key and must never be invented, corrected or re-slugged.

MONEY
You have a price for each item and the month it was checked. You may compare prices to each other
("roughly double the cost of the churro") and you may describe a price band. You may NOT state a
total for a day of eating, invent a per-person average, or write any figure not in the table. If you
want to say something costs a lot, say it costs a lot relative to a named item in the table.

Do not describe photographs of food. Do not describe any food item as being shaped like a character,
an animal, or a set of circles, and do not mention the shape of any snack at all unless the supplied
description already does.
```

#### P4 — Map page walking commentary (4 pages, Shape A)

All four map pages have **zero page-unique words** — the legal provenance notice, the offline
callout and the land list are shared verbatim. Target 400–600 words per park, into
`data/universal/parks/<park>/park.json` as a `mapCommentary` block.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the walking commentary that sits beside a park's schematic map.

INPUTS
  PARK: {{PARK_NAME}}   RESORT: {{RESORT_NAME}}
  LANDS, in the walking order declared in park.json:
  {{LANDS_TABLE}}   (slug | name | order | vibe | anchorAttraction)
  ANCHOR ATTRACTIONS BY LAND: {{ANCHORS}}
  INDOOR / AIR-CONDITIONED ATTRACTIONS: {{AC_LIST}}
  PARK NOTES: {{PARK_TIPS}}

PRODUCE:
{
  "mapCommentary": {
    "intro": ["<paragraph 80-120 words: the shape of this park in one idea>"],
    "longestWalk": "<60-90 words: the longest walk in the park, described as a route between two
                    named lands, and what it costs you in a day>",
    "notConnected": "<60-90 words: the two lands people assume connect and do not, or the
                     connection that is not obvious from the map>",
    "shadeAndShelter": "<60-90 words: where the shade and the indoor refuges are, by name>",
    "regroupSpot": "<40-70 words: the best place for a split party to meet>",
    "closingCrush": "<50-80 words: where the exit bottleneck forms at park close and what to do>"
  }
}

TIME AND DISTANCE ARE THE TRAP. Do not state a walking time in minutes, a distance in feet or
miles, or an acreage. Describe walks in relative terms a reader can act on: "the longest single
walk in the park", "further than it looks on the map", "you will cross it twice if you plan badly".
If a specific walking time is genuinely needed, escalate it as UNVERIFIED with SOURCE TO CHECK set
to a human walking it with a timer.

Universal Studios Hollywood note, if that is the park you were given: its defining layout fact is
the Upper Lot / Lower Lot split joined by a long escalator bank. That vertical relationship is the
single most important thing this commentary carries. Describe it as a vertical separation and a
one-way commitment; do not state the escalator's length, ride time, or number of flights.

Do not describe the map graphic itself, and do not claim the map is drawn from any particular data
source - the page's own provenance notice handles that.
```

#### P5 / P6 — Rides and dining index intros (8 pages, Shape A)

Rides indexes run 1% page-unique, dining indexes 4%. Both are healthy as navigation and offer zero
orientation. Target 250–400 words each, into `park.json` as `ridesIndexIntro` / `diningIndexIntro`.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the orientation paragraph set that opens a park's full {{RIDES|DINING}}
index. A reader lands here from search and sees a sorted table. Tell them how to read it.

INPUTS
  PARK: {{PARK_NAME}}      RESORT: {{RESORT_NAME}}
  TOTAL ATTRACTIONS IN THIS PARK: {{ATTRACTION_COUNT}}      (supplied; do not recount)
  TIER BREAKDOWN: headliner {{N_HEADLINER}}, major {{N_MAJOR}}, minor {{N_MINOR}}
  HEADLINER NAMES: {{HEADLINER_NAMES}}
  TYPICAL FULL DAY: {{TYPICAL_FULL_DAY_HOURS}}   MINIMUM DAYS: {{MINIMUM_DAYS}}
  [dining variant] SERVICE TIER BREAKDOWN: {{SERVICE_BREAKDOWN}}
  [dining variant] STANDOUT LOCATIONS: {{STANDOUT_DINING}}
  BEST-RIDES PAGE PATH: {{BEST_RIDES_PATH}}
  BEST-SNACKS PAGE PATH: {{BEST_SNACKS_PATH}}

PRODUCE:
{ "indexIntro": ["<para 70-110 words>", "<para 70-110 words>", "<para 60-100 words>"] }

PARAGRAPH 1: how many attractions this park really has versus how many a normal day fits, and what
that means for the reader's expectations. Use the supplied count; never recount from the table.
PARAGRAPH 2: what the tier labels mean in plain language, and the two or three attractions that
define this park.
PARAGRAPH 3: what to skip on a first visit, and an explicit hand-off, as a markdown link, to the
best-rides page (or best-snacks, for the dining variant) - a reader on the index does not know it
exists.

Do not state how many attractions a day "fits" as a number. Say it in terms of the roster: "most
first-time visitors clear the headliners and about half the rest". Do not state opening hours.
```

#### P7 — Event edition retrospectives (5 pages, Shape A)

Edition pages carry 99–136 page-unique words each. The thinness is principled — the site refuses to
print unannounced dates — but a 120-word indexable page is a thin-content signal regardless. The
honest fix is the retrospective the site already has standing to write.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write a retrospective block for one edition of a seasonal event. This is the
single most dangerous prompt in this batch for the fact checker, so read the rules twice.

INPUTS
  EVENT: {{EVENT_NAME}}       RESORT: {{RESORT_NAME}}      PARK: {{PARK_SLUG}}
  EDITION YEAR: {{YEAR}}      EDITION STATUS: {{STATUS}}   (announced | expected | past | cancelled)
  EXISTING changes[]: {{EXISTING_CHANGES}}
  EXISTING freshness: {{EXISTING_FRESHNESS}}   (verified / confidence / sourceNote / reviewBy / cycle)
  PRICE RANGE ON RECORD: {{PRICE_RANGE_USD}}   (a [low, high] pair, or null)
  TYPICAL WINDOW PROSE: {{TYPICAL_WINDOW}}

PRODUCE:
{
  "retrospective": {
    "body": ["<para 100-140 words>", "<para 100-140 words>", "<para 90-130 words>"],
    "patternNote": "<50-80 words>"
  }
}

THE ONE RULE THIS PAGE EXISTS TO ENFORCE
This page's entire editorial value is that it refuses to print dates nobody has published. You are
writing about a cycle that has already happened, using only figures already on the record above.

  - You may restate the supplied price range, as a range, labelled with its year.
  - You may describe run length, house count, or structure ONLY in the words the supplied changes[]
    already uses. If changes[] says "around ten houses", you may write "around ten houses". You may
    not write "ten houses", and you may not write eleven.
  - You may NOT write a start date, an end date, a night count, or a per-night price for any year.
  - You may NOT forecast. No "expect", "likely", "should be", "is expected to open in".
  - `patternNote` describes the SHAPE of past cycles as a planning aid and must contain an explicit
    sentence that this is a pattern and not a schedule.

PARAGRAPH 1: what the last confirmed cycle actually was, in the terms the record already carries.
PARAGRAPH 2: how that cycle moved against the ones before it - longer or shorter run, more or fewer
houses, wider or narrower pricing - using only relative language.
PARAGRAPH 3: what that pattern implies for someone planning, framed as reasoning about a pattern.

Every year you mention must be attached to the figure it belongs to: "the 2025 run", never "the run".
If you cannot write a sentence without an unsupplied number, drop the sentence.

ALSO PRODUCE a proposed freshness block, and set confidence honestly:
  "freshnessProposed": {
    "verified": "2026-07",
    "confidence": "historical",
    "sourceNote": "<>= 30 chars: state exactly what we know, from when, and what we did NOT
                   re-verify. A reader must be able to judge our confidence from this sentence.>",
    "reviewBy": "<YYYY-MM, after 2026-07 and no more than 18 months later>",
    "cycle": "annual"
  }
Use "historical" unless the operator has formally announced the cycle, in which case escalate as
UNVERIFIED rather than setting "confirmed" yourself - "confirmed" requires a human to name the
announcement.
```

---

### 3. Missing content types

#### P8 — Multi-day itineraries (6–10 pages, Shape A)

The word "itinerary" appears 5 times across 251 pages. Per-park single-day plans exist and are good;
the cross-park sequencing question — which is now the actual trip shape, with Epic Universe on a
separate campus — has no page. This is pure sequencing judgment over data the site already holds,
so it needs no new facts. Target 1,500–2,500 words per itinerary. New `data/universal/itineraries/*.json`
plus a `src/pages/itineraries.mjs` generator.

Recommended set: 2-day Universal Orlando (USF + IOA), 3-day (adding Epic Universe), 4-day, 1-day
Universal Hollywood, 2-day Hollywood + LA, and variants for young children, thrill-seekers, and a
no-Express budget trip.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write one multi-day itinerary. Everything you need is judgment over facts the
dataset already holds. You are adding no facts at all.

INPUTS
  ITINERARY: {{TITLE}}        DAYS: {{N_DAYS}}      RESORT: {{RESORT_NAME}}
  PARKS AVAILABLE: {{PARKS}}  (slug | name | campus | attraction count | minimum days recommended)
  PARTY SHAPE: {{PARTY}}      (e.g. "two adults, no children" / "family with a 42-inch five-year-old")
  HEADLINERS BY PARK: {{HEADLINERS_BY_PARK}}
  EXPRESS PASS COVERAGE BY PARK: {{EXPRESS_COVERAGE}}   (counts already in the dataset)
  SINGLE RIDER ATTRACTIONS: {{SINGLE_RIDER_LIST}}
  CAMPUS GEOGRAPHY NOTE: {{CAMPUS_NOTE}}   (from site.json resort intro - reproduce, do not extend)
  RELEVANT GUIDES TO LINK: {{GUIDE_PATHS}}

PRODUCE:
{
  "intro": ["<para>", "<para>"],
  "whoThisIsFor": "<60-90 words>",
  "days": [
    { "day": 1, "park": "<park slug>", "headline": "<= 90 chars",
      "why": "<50-80 words: why this park on this day and not another>",
      "morning": "<80-120 words>", "middle": "<80-120 words>", "evening": "<80-120 words>",
      "earlyEntryPlan": "<40-70 words: what to do with early admission, on which campus>",
      "expressCall": "<40-70 words: buy or skip Express today, and the reasoning>",
      "lunchLands": "<30-60 words>" }
  ],
  "namedFailureMode": "<70-110 words: the specific way this trip goes wrong, stated bluntly>",
  "ifYouLoseADay": "<60-90 words: what to cut first>",
  "faqs": [ { "q": "…", "a": "<40-90 words>" } ]
}

SEQUENCING IS THE PRODUCT. Every day assignment must carry its reason. "Day 2: Islands of
Adventure" is worthless; "Day 2: Islands of Adventure, because it holds the coasters and you want
them on legs that are not already tired" is the page.

TIME AND MONEY LIMITS
- No clock times. Write "at opening", "mid-morning", "the last two hours" - never "9:15am".
- No park hours, no early-entry start times, no shuttle timetables, no travel durations between
  campuses. The campus relationship is supplied; describe it in the supplied terms only.
- No ticket prices, no Express prices. The Express call is a reasoning call ("this is the day it
  pays, because you are trying to clear eight headliners"), never an arithmetic one with figures.
- Do not state how many rides a day fits as a number.

`namedFailureMode` must be genuinely specific and at least mildly unflattering to the plan - e.g.
that putting the newest park on an arrival day wastes the one day everyone has energy for it.
```

#### P9 — Volcano Bay (Shape B — data proposal)

An entire Universal Orlando gate with zero pages, while the site's own copy tells readers to spend a
day there and its height-checker claims to cover Universal Orlando. Water slides have height
minimums, which is precisely what that tool answers.

**This is Shape B and is the largest verification burden in the batch.** ~20 attractions, ~8 dining,
8–10 pages, ~12,000 words at current per-park density.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE B (DATA PROPOSAL). Output goes to data/universal/_proposals/volcano-bay/ and MUST NOT
be merged into data/universal/parks/ until every row of _unverified has been cleared by a human.

You are proposing a park dataset for a water park, matching the existing schema exactly.

INPUTS
  PARK: Universal Volcano Bay        RESORT: universal-orlando
  SCHEMA REFERENCE: {{PASTE park.json + attractions.json SCHEMA FROM docs/DATA-SCHEMA.md}}
  EXISTING SIBLING PARK FILE (for voice and shape only): {{PASTE islands-of-adventure/park.json}}
  ATTRACTION TYPE ENUM: {{TYPE_ENUM}}

PRODUCE three files, each wrapped in the proposal envelope:
  _proposals/volcano-bay/park.json
  _proposals/volcano-bay/attractions.json
  _proposals/volcano-bay/dining.json

THE ENVELOPE, on every file:
{
  "_proposal": { "operator": "universal", "target": "<final path>", "generatedFor": "2026-07",
                 "status": "UNVERIFIED - must not be merged until _unverified is empty" },
  "_unverified": [ { "path": "…", "proposedValue": …, "claim": "…",
                     "howToVerify": "…", "ifUnconfirmed": "…" } ],
  … the real file contents …
}

WHAT GOES IN _unverified — THIS IS THE WHOLE POINT OF THIS PROMPT
Every one of these, for every record, with no exceptions:
  heightIn, heightNote, opened, status, durationMinutes, lightningLane, singleRider, virtualQueue,
  price, priceTier, priceNote, capacity, sizeAcres, stats.*, coordinates, and every count.
If a value is in the record and not in _unverified, you have malformed the proposal.

FOR EVERY heightIn, `howToVerify` must read: "Universal Orlando's own Volcano Bay attraction page or
the Universal Orlando app, or the height stick at the slide entrance. Not an aggregator, not a fan
wiki, not a travel blog." And `ifUnconfirmed` must read: "Set heightIn to null and write a
heightNote saying the minimum is posted at the entrance and was not verified for this edition."

WHAT YOU MAY WRITE FREELY (this is Shape A content inside a Shape B file, and it is most of the words)
  summary, description[], experience[], tips[], verdict, scary{} ratings and notes, intensity,
  accessibility notes, vibe, bestFor, notIdealFor, firstTimer prose, faqs.
These are judgment and description. Write them to the same standard as the rest of the site: what
the slide actually feels like, who it suits, what the queue is like, whether the mat-versus-body
distinction matters, what a nervous adult should know.

WATER-PARK SPECIFICS
- getsWet is "soaked" for essentially everything; say so once in the park intro rather than in
  every record.
- The fear profile axes still apply and are more useful here than elsewhere: a fully enclosed drop
  capsule is a darkness-5, drops-5 experience regardless of speed.
- accessibility.transfer matters enormously at a water park and is frequently must-transfer.
  Where you do not know, propose must-transfer and put it in _unverified.
- Do not describe theming that references a protected property. Describe the physical experience.

DO NOT propose a map.json. Water-park geometry needs OpenStreetMap-derived polygons authored by a
human, and a synthetic wedge diagram would be worse than none.
```

#### P10 — CityWalk dining (Shape B)

154 mentions, zero pages, and it holds the resort's main table-service capacity — the dinner most
readers actually eat. The existing `dining.json` schema fits without modification.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE B (DATA PROPOSAL) for CityWalk dining, plus one Shape A hub page.

Output to data/universal/_proposals/citywalk/<resort>.json using the proposal envelope from P9.
Use the existing dining.json record schema unchanged - service, cuisine, priceTier, priceNote,
priceVerified, mealPeriods, reservations, mobileOrder, dietary, alcohol, indoorSeating,
outdoorSeating, standalonePage, summary, description[], signatureItems[], goodFor[], tips[],
verdict, faqs[].

INPUTS
  RESORT: {{RESORT_NAME}}          CITYWALK LOCATIONS TO COVER: {{LOCATION_LIST}}
  DINING SCHEMA: {{PASTE dining.json SCHEMA}}
  EXISTING IN-PARK DINING FILE (voice reference only): {{PASTE A dining.json}}
  goodFor ENUM: {{GOODFOR_ENUM}}

INTO _unverified, WITHOUT EXCEPTION: priceTier, priceNote, every price, reservations, mobileOrder,
alcohol, diningPlan, dietary flags, and operating status. Every dietary claim is a safety claim and
must be verified before publication - `ifUnconfirmed` for any dietary flag is "remove the flag".

WRITE FREELY: summary, description[], verdict, tips[], goodFor[], signatureItems[] (dish NAMES only,
never copied menu prose).

ALSO PRODUCE a Shape A hub page, ~700-900 words, covering how CityWalk works as a place: that it
sits between the two original parks and you will cross it twice a day, that entry is separate from
park admission, how parking relates to it, when it is busy, and which reservations genuinely need
booking ahead versus which are walk-up. Do NOT state opening hours, parking fees, walk times or
boat times - escalate any of those as UNVERIFIED.
```

#### P11 / P12 — Hotels: the Express arithmetic, and per-hotel pages (Shape A + B)

`/prices/hotels/` opens by naming the tier decision as the trip-defining money call, publishes a
rate-band table, and stops. Cabana Bay, Endless Summer, Terra Luna and Stella Nova have zero
occurrences site-wide.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the decision page "Is an Express Pass hotel worth it?" (~1,500 words).
This page reasons about money without quoting money. Read that sentence again before starting.

INPUTS
  RESORT: {{RESORT_NAME}}
  HOTELS INCLUDING EXPRESS: {{EXPRESS_HOTELS}}    OTHER HOTEL TIERS: {{OTHER_HOTELS}}
  EXISTING RATE-BAND TABLE: {{RATE_BANDS}}   (ranges only, each with its verified month)
  EXPRESS PASS GUIDE PATH: {{EXPRESS_GUIDE_PATH}}
  EPIC UNIVERSE EXPRESS POSITION: {{EPIC_EXPRESS_NOTE}}

PRODUCE sections:
  1. The decision in one paragraph, stated up front as a verdict.
  2. How the arithmetic works - the STRUCTURE of the comparison, not the sums. Name the variables:
     party size, number of park days, whether you would have bought Express anyway, whether your
     days are peak or shoulder, and whether the parks you are visiting are covered.
  3. Party size, worked as reasoning at 2, 3, 4 and 5 guests. Express is per-guest and the room is
     not, so the case strengthens with party size - explain that mechanism without numbers.
  4. When it stops paying: short trips, low-crowd weekdays, and any park where the Express position
     is not confirmed.
  5. When it clearly does not pay.
  6. What you also get and what you do not.

MONEY RULES FOR THIS PAGE, WHICH ARE STRICTER THAN USUAL
- You may reproduce a supplied rate BAND, exactly, with its verified month attached.
- You may NOT compute anything. No totals, no per-person figures, no break-even night counts, no
  "about $X cheaper". Arithmetic performed by you is an invented fact even when the inputs are real.
- Express Pass pricing is dynamic and is NOT supplied. Never state or imply a figure for it.
- The reader does the sum. Your job is to tell them exactly which numbers to put into it and in
  which order. End the page with a short numbered "work it out yourself" list naming the figures to
  look up and where.
Where the Express position at a park is unconfirmed, say so plainly and treat it as a reason to be
cautious, not as a gap to fill.
```

Per-hotel pages (8–10 × 400–500 words) run the same prompt shape with a Shape B envelope for tier,
Express inclusion, early admission eligibility, and transit mode — all four are checkable and all
four go in `_unverified`. Write freely: who the hotel suits, what the walk feels like, what the
trade is against a cheaper tier.

#### P13 — Glossary (1 page, Shape A)

No glossary exists. "Single rider" appears 534 times, "mobile order" 258, "virtual line" 90, "Early
Park Admission" 77, "rope drop" 66. Every entry is definitional, so nothing needs forecasting.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write a glossary of 25-35 terms, 1,200-1,500 words total, for
data/universal/glossary.json.

INPUTS
  TERMS TO COVER: {{TERM_LIST}}
  EXISTING GUIDE PATHS: {{GUIDE_PATHS}}   (map each term to its full guide where one exists)
  OPERATOR QUEUE PRODUCT LABELS: {{QUEUE_LABELS}}

PRODUCE:
{ "terms": [ {
    "term": "…", "slug": "…",
    "definition": "<2-3 sentences>",
    "differsFrom": "<or null: how this differs from the same-sounding thing at another operator>",
    "guidePath": "<or null>"
  } ] }

THE `differsFrom` FIELD IS WHY THIS PAGE EXISTS. A reader arrives confused because a term means
something different at the park they went to last year. Express Pass is not the same product as a
Disney paid queue and is bought differently; Early Park Admission is not the same as Disney's early
entry and is not available to the same guests; a virtual line is not a boarding group. This is the
ONE place on the site where naming the other operator's product is correct and required - it is a
definitional contrast, not a comparison page. Name it precisely, describe the difference in
mechanism, and never state a price or an eligibility rule you were not given.

Definitions are mechanism, not marketing: what the thing is, how you get it, and what it costs you
in a currency other than money (time, sitting together, flexibility). No prices, no eligibility
thresholds, no advance-booking windows in days, no start times.

Sort alphabetically. Keep every slug kebab-case and stable forever.
```

#### P14 / P15 — The two missing guides (Shape A)

`crossLinks.guides.accessibility` and `.ropeDrop` are both `null` in `data/universal/site.json`, so
"Accessibility, explained" (`park.mjs:744`) and "Rope drop strategy" (`park.mjs:858`) render nothing
on all four Universal park pages. Disney's equivalents are linked from 10 and 29 pages respectively.
Writing these two guides fills the holes without touching code — set the two null roles afterward.

The accessibility one is the higher priority: `site.json` already warns that Universal's assistance
programme requires advance registration and that "registering late is the failure mode", and no
site-wide page owns that advice.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write a full guide file matching the existing guide schema:
slug, title, h1, metaDescription, summary, category, readingTimeMinutes, intro[], keyPoints[],
sections[], faqs[], related[], lastVerified.

Sections use: { id (kebab-case, unique), heading, body[], list?{style,items}, table?{columns,rows},
callout?{type,title,body} }. Callout types: tip | warning | note | money | legal.

INPUTS
  GUIDE: {{GUIDE_TITLE}}        SLUG: {{SLUG}}       CATEGORY: {{CATEGORY}}
  TARGET LENGTH: 2,000-2,500 words (readingTimeMinutes 10-12)
  OPERATOR NOTE TO HONOR VERBATIM: {{SITE_NOTE}}
  RELATED GUIDE SLUGS: {{RELATED}}
  EXISTING GUIDE FOR VOICE (do not copy content): {{PASTE data/universal/guides/single-rider.json}}

FOR THE ATTRACTION-ASSISTANCE GUIDE SPECIFICALLY
The supplied operator note is the spine of the page and its warning must appear above the fold, in
the intro, not buried in a section. The page's job is to make a reader register early. But the
process itself has changed more than once, so:
  - Describe the SHAPE of the process (that it exists, that it requires advance registration, that
    late registration is the failure mode, what kind of information is involved) and never the
    steps, the portal name, the lead time in days, or the eligibility criteria.
  - Include a `callout` of type "warning" stating that the process changes and must be confirmed on
    the operator's own accessibility pages before travel.
  - Cover what is checkable from the dataset and genuinely useful: which attractions require a
    transfer from a wheelchair or ECV, which are the loud/dark/strobing ones, where the quiet spaces
    are per park. All of that is already in park.json and attractions.json - use the supplied values.
  - Never state that a particular person will or will not qualify for anything.

FOR THE ROPE DROP / EARLY ADMISSION GUIDE SPECIFICALLY
  - No clock times, no opening times, no "arrive 45 minutes early". Write in relative terms:
    "before posted opening", "the first hour is worth two of any other".
  - Do not state which hotels or ticket types grant early admission unless supplied; escalate as
    UNVERIFIED.
  - Do state, per park, which single attraction is worth the first hour and why - that is judgment
    over the dataset and is the reason to read the page.

metaDescription must be 120-155 characters, must not end mid-phrase, and must name Universal
correctly. Every `related` slug must be one of the supplied RELATED values.
```

#### P16 — Two missing event files (Shape B)

`scripts/reference/universal-seasonal.mjs:255` lists `rock the universe` and `christmas in the
wizarding world` as leak-guard needles, so evergreen pages are forbidden from mentioning them while
no seasonal page exists to own them. Note `universal-seasonal.mjs:22` enforces a two-way contract:
adding an event is a deliberate two-file commit (data file + `EVENTS`/`WINDOWS` table entry).

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE B (DATA PROPOSAL). Propose a seasonal event file.

Schema: slug, name, shortName, resort, parkSlug, category, season, summary, h1, title, titleTail,
description[], typicalWindow, pricing, whatYouGet[], whatYouDont[], verdict, strategy[], faqs[],
crossLinks, related[], editions[], freshness.

INPUTS
  EVENT: {{EVENT_NAME}}     RESORT: {{RESORT_SLUG}}     PARK: {{PARK_SLUG}}
  EXISTING EVENT FILE (shape reference): {{PASTE halloween-horror-nights-orlando.json}}

EVERYTHING DATED OR PRICED GOES IN _unverified. Specifically: typicalWindow, pricing.rangeUsd,
every editions[].year, editions[].status, editions[].priceRangeUsd, and season.

HARD RULES
- pricing.rangeUsd must be [low, high] with low < high. A single fixed price is a validation error
  with no exceptions. If you cannot propose a defensible range, propose null and escalate it.
- typicalWindow is PROSE describing a window ("late summer into early autumn"), never a date pair.
- An edition with status "announced" requires its own freshness.confidence === "confirmed", which
  requires a sourceNote naming the announcement. You cannot supply that, so never propose
  "announced" or "confirmed". Propose "expected" or "historical" and escalate.
- freshness.reviewBy must be after verified (2026-07) and no more than 18 months later.
- whatYouDont[] must be real. An event page with no downside section is an advertisement.

WRITE FREELY: description[], verdict, strategy[], whatYouGet[], whatYouDont[], faqs[] - how the
event works structurally, who it suits, how to approach it, what it costs you in time and queueing.

REMIND THE EDITOR IN YOUR NOTES that this event's slug must also be added to the EVENTS and WINDOWS
tables in scripts/reference/universal-seasonal.mjs in the same commit, or the reference contract
fails both ways.
```

#### P24 — The `/updates/` page (Shape A, build before the next verification cycle)

All 349 dated records currently share `2026-07`, so this page launches with one entry. It is
infrastructure for the second cycle, and it must exist *before* the first re-verification pass —
the deltas it needs cannot be reconstructed afterward.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write one cycle's editor note for the /updates/ page.

INPUTS
  CYCLE: {{CYCLE_MONTH}}       PREVIOUS CYCLE: {{PREV_CYCLE}}
  COMPUTED DELTAS: {{DELTA_TABLE}}   (field | record | old value | new value | change type)
  RECORDS RE-CHECKED: {{RECHECK_COUNT}}   CONFIDENCE CHANGES: {{CONFIDENCE_CHANGES}}

PRODUCE:
{ "cycle": "{{CYCLE_MONTH}}",
  "editorNote": ["<para 80-120 words>", "<para 80-120 words>"],
  "changes": [ { "kind": "price|height|status|confidence|added|removed",
                 "what": "<one line>", "detail": "<one line, from the delta table only>" } ] }

This page is a record of work already done. It contains no forecasts, no "coming soon", and no
claim about what will change next cycle. Every `detail` line must be traceable to a row of the
supplied delta table - if it is not in the table, it did not happen. Do not editorialize a price
increase into a trend on one data point.
The editor note says what was re-checked this cycle and, honestly, what was NOT.
```

---

### 4. Operator-neutral copy — the Disney strings on a Universal site

Nineteen pages ship a Disney-branded `<title>` and `<h1>`; 24 meta descriptions carry wrong-operator
copy; the closures pages render the raw slug `universal-orlando` as the reader-facing name; and
`/affiliate-disclosure/` — the one page whose job is to be materially accurate about the commercial
relationship — describes its partners as resellers of Disney tickets.

**These are the highest-severity content items in the batch.** The affiliate one is a false material
statement on an FTC disclosure page.

#### P17 — Seasonal title / H1 / description set (Shape A)

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Rewrite title, H1 and meta description for seasonal pages that currently carry
another operator's brand. These strings are currently hard-coded in src/seasonal/*.mjs; they are
moving into data so neither operator can inherit the other's copy.

INPUTS
  PAGE FAMILY: {{FAMILY}}   (month | events index | prices index | holidays index | closures index |
                             calendar | when-to-go index | closures resort page)
  MONTH / RESORT: {{SUBJECT}}
  CURRENT (WRONG) TITLE: {{CURRENT_TITLE}}
  CURRENT (WRONG) H1: {{CURRENT_H1}}
  CURRENT (WRONG) DESCRIPTION: {{CURRENT_DESCRIPTION}}
  CORRECT OPERATOR: Hollywood Ride Guide, covering Universal Orlando Resort and Universal Hollywood
  RESORT DISPLAY NAMES: universal-orlando -> "Universal Orlando", universal-hollywood -> "Universal Hollywood"
  BODY COPY ALREADY ON THE PAGE (it is correct - match its claims): {{BODY_EXCERPT}}

PRODUCE:
{ "title": "<= 60 chars before the site suffix>",
  "h1":    "<= 65 chars>",
  "metaDescription": "<120-155 chars, must not end mid-phrase>" }

RULES
- The body copy is already correct Universal editorial. Your strings must agree with it. If the body
  says a month is the busiest Universal runs outside summer, the title must not imply otherwise.
- Never render a slug as a display name. "universal-orlando" is a URL key; "Universal Orlando" is
  the name. Any title matching ^[a-z0-9]+(-[a-z0-9]+)+ is a defect.
- Do not name the other operator or any of its parks or products.
- Do not put a number in the title or description unless it appears in the supplied body copy.
- The description must be a claim the page actually delivers on. It also becomes the og:description
  and the JSON-LD description, so a fragment ending in an ellipsis reads as damaged data to a
  machine consumer, not as a teaser.
```

#### P18 — Legal and trust pages (Shape A, highest severity)

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Rewrite operator-specific copy on the site's trust pages. These are the pages a
reader opens precisely when they have started to doubt the rest of the site, so accuracy here is
worth more than anywhere else.

INPUTS
  PAGE: {{PAGE}}   (about | affiliate-disclosure | editorial-policy)
  CURRENT COPY (contains wrong-operator statements): {{CURRENT_COPY}}
  ACTUAL AFFILIATE PARTNERS AND WHAT THEY SELL: {{AFFILIATE_PARTNERS}}
  ACTUAL COVERAGE: 4 US Universal theme parks, 107 attractions, 84 dining locations,
                   158 tracked food items, across Universal Orlando Resort and Universal Hollywood
  LEGAL DISCLAIMER ON FILE: {{SITE_LEGAL_DISCLAIMER}}

PRODUCE the rewritten copy blocks, as prose arrays.

/affiliate-disclosure/ — THE CRITICAL ONE
The page currently describes partners as resellers of another operator's tickets. That is a false
material statement about a commercial relationship on the page whose entire legal function is to be
materially accurate about that relationship. Describe each partner by what it ACTUALLY resells,
using only the supplied partner data. If a partner's offering is not supplied, do not describe it -
escalate it as UNVERIFIED. Do not state commission rates, and do not soften the disclosure. The FTC
disclosure sentence itself must remain at least as prominent and must continue to appear above the
first affiliate link on the page.

/about/
Rewrite the coverage paragraph for the real catalogue using the supplied figures exactly. Do not
claim a review cadence, a team size, park visits, or credentials. Describe the method: every dated
claim carries the month it was checked, and seasonal claims carry a confidence level.

/editorial-policy/
Three passages use the other operator's events and parks as worked examples. Replace them with
Universal equivalents drawn from this site's own data - the unannounced-event-dates case is a
stronger example than the one it replaces, and the site already holds it. Keep the policy identical
in substance; only the examples change.

Across all three: never name the other operator except where the sentence is explicitly about the
site being independent of any operator. Reproduce the supplied legal disclaimer verbatim - it names
the correct rights holders and must not be paraphrased.
```

---

### 5. Meta descriptions

Descriptions are in good shape structurally — **251 of 251 unique, zero duplicate groups**, median
151 characters. Three defects: 24 carry the wrong operator (P17/P18 above), 18 exceed 160
characters, and the truncate helper cuts mid-phrase so several end `…and the` before an ellipsis,
which then propagates into the Article JSON-LD `description`.

#### The rule that keeps them honest

1. **Derived from the page's own authored `summary`**, never written fresh. A description that
   promises something the page does not deliver is the one SEO lie this site cannot afford.
2. **120–155 characters.** Under 120 wastes the slot; over 155 gets re-truncated by Google and
   trips the audit.
3. **No number that is not already in the page's data.** If the summary says "roughly 20 slides",
   the description may say it; the description may never introduce a count of its own.
4. **No price, ever** — descriptions are cached and re-crawled long after a price moves.
5. **Must break on a clause or sentence boundary.** Never mid-phrase, never a trailing ellipsis.
6. **Must name the operator correctly** and must not contain the other operator's brand, except on
   the comparison pages where the contrast is the subject.

#### P19 — Meta description generator (Shape A)

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write one meta description.

INPUTS
  PAGE TYPE: {{PAGE_TYPE}}      PAGE TITLE: {{TITLE}}      H1: {{H1}}
  AUTHORED SUMMARY FOR THIS PAGE: {{SUMMARY}}
  KEY FACTS ALREADY ON THE PAGE: {{KEY_FACTS}}
  IS THIS A COMPARISON PAGE WHERE THE OTHER OPERATOR IS THE SUBJECT: {{IS_COMPARISON}}

PRODUCE a single line: the description, 120-155 characters inclusive. Nothing else. No quotes
around it, no label, no explanation.

RULES
- Compress the supplied summary. Do not introduce a fact, a number, a price or a claim that is not
  in the summary or in KEY FACTS.
- End on a complete clause. Never end with an ellipsis, a conjunction, a preposition, or a
  half-finished phrase. If the natural sentence will not fit in 155 characters, write a shorter
  sentence rather than truncating a longer one.
- Lead with the answer, matching the page. A description that asks a question the page then answers
  wastes the slot.
- Name the operator correctly. If IS_COMPARISON is false, do not use the words Disney, Walt Disney
  World, Disneyland, Lightning Lane or Genie+ at all.
- No banned words. No "Everything you need to know", no "Ultimate guide", no "We break down".
- Count the characters and state the count on a second line as: LENGTH: <n>
```

---

### 6. Alt text

The photography and diagram batches introduce four distinct image classes and they take **opposite**
alt-text treatments. The current audit check (`audit.mjs:181-183`) only asserts that `alt=` is
present, which passes all four cases including the wrong ones. The realistic failure is not a missing
alt — it is flowery marketing alt text applied uniformly to 405 decorative card thumbnails, which
makes every card grid unusable with a screen reader.

#### Policy

| Class | Example | Treatment | Why |
|---|---|---|---|
| **1. Hero / atmospheric backdrop** | `hero-coaster-night` | **`alt=""`** | It sits behind text under two scrim layers and conveys mood, not information. `hero()` already sets `aria-hidden` on the media wrapper when alt is empty. This is the reference implementation — do not "improve" it. |
| **2. Card / thumbnail beside a title and summary** | land card, dining card | **`alt=""`** | The adjacent heading is the link's accessible name. A descriptive alt produces "Churro on a paper tray, link, Best snacks at Islands of Adventure" on every card. Note `card()` does **not** currently set `aria-hidden` on `.card__media`, so the empty alt is the entire mechanism. |
| **3. Informative graphic** | fear fingerprint, height ladder, price band chart, 12-month grid, compare win-tally | **Real, specific alt** + a text equivalent in the page body when the content is complex | This is data the sighted reader gets from the picture. If it is not also in text, it is not published. |
| **4. Social card** | `social-card-1280.jpg` | **`og:image:alt`**, describing the card's text content | Never rendered in-page; read by crawlers and by platform screen readers. |

Two additions the survey's image lens implies and that belong in the content policy: **an LQIP is a
real 20px image** and must pass the same review as the full frame, and **alt text is authored per
slot in `site.json` alongside a `note` field** stating which of the four classes it falls into and
why — matching the pattern the existing hero slot already sets.

#### P20 — Alt text generator (Shape A)

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the alt text for one image slot.

INPUTS
  IMAGE CLASS: {{CLASS}}   (1 = hero/atmospheric | 2 = card thumbnail beside a heading |
                            3 = informative graphic | 4 = social card)
  SLOT KEY: {{SLOT_KEY}}          FILE: {{FILE}}
  WHAT THE IMAGE SHOWS: {{IMAGE_BRIEF}}
  ADJACENT HEADING (classes 2 and 3): {{ADJACENT_HEADING}}
  ADJACENT SUMMARY (class 2): {{ADJACENT_SUMMARY}}
  DATA THE GRAPHIC ENCODES (class 3 only): {{DATA_SERIES}}
  CARD TEXT (class 4 only): {{CARD_TEXT}}

DECIDE BY CLASS. Do not deviate:

CLASS 1 — return exactly:  { "alt": "", "note": "Decorative: alt is empty on purpose. <one sentence
saying what the image is and confirming it carries no information not already in the page text>" }

CLASS 2 — return exactly:  { "alt": "", "note": "Decorative thumbnail. The adjacent heading
'<ADJACENT_HEADING>' is the link's accessible name; a descriptive alt here would be read as a
duplicate before every card in the grid." }

CLASS 3 — return:  { "alt": "<describes what the graphic SHOWS and what it MEANS, 100-160 chars>",
                     "longDescription": "<40-90 words, to render as visible body text>",
                     "note": "Informative. The long description must render in the page body, not
                              only in alt." }
  The alt states the chart type, what is plotted, and the takeaway - not a list of values. Good:
  "Height ladder for the four Universal parks: the number of attractions unlocked rises sharply at
  the 40-inch mark." Bad: "A chart." Bad: "Chart showing 34 inches 3, 36 inches 5, 39 inches 1…"
  Every number you use must come from DATA_SERIES exactly. Never recompute a total or a percentage.

CLASS 4 — return:  { "alt": "<describes the card's text content, 80-140 chars>",
                     "note": "og:image:alt only; never rendered in-page." }

NEVER, IN ANY CLASS
- "Image of", "Photo of", "Graphic showing", "A picture depicting" - screen readers announce the
  element type already.
- Naming or describing any character, costumed figure, ride vehicle, logo, wordmark or castle. If
  the IMAGE_BRIEF mentions one, stop and report it in your notes as an IP review failure rather
  than writing alt text for it.
- Describing the shape of any object as circular, as three circles, or as a head with two smaller
  circles above it. If the brief describes anything of that shape, flag it and do not proceed.
- Marketing language. Alt text describes; it does not sell.
- A number that is not in DATA_SERIES.
```

---

### 7. Editorial `site.json` and provenance blocks

These are editorial rather than factual, so they are Shape A and unblocked today.

#### P21 — Podcast scaffold

`data/universal/site.json` has no `podcast` key at all; Disney's has a 10-field scaffold. Nothing
ships either way — `src/lib/podcast.mjs:116` returns null unless both `audioBase` and `email` are
non-empty — so the gap is the authored scaffold, not a live feed.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the podcast metadata block for data/universal/site.json.

Mirror this shape exactly: note, title, description, author, email, category, subcategory,
artwork, audioBase, episodes.

Leave email, artwork and audioBase as empty strings and episodes as an empty array. That is not an
oversight - the feed is deliberately suppressed until real audio exists, and an episode without a
real byte length and duration is dropped rather than shipped as a 404 enclosure.

WRITE: title (a show name for Hollywood Ride Guide, not a description), description (2-3 sentences),
author (the brand name), and a `note` explaining the empty fields to the next maintainer.

The description must state that every episode says the month its facts were checked, and that the
show is independent and unofficial. Do not state an episode length, a release cadence with dates, a
host name, or a launch date. Category "Society & Culture", subcategory "Places & Travel".
```

#### P22 — Author identity and editorial-policy language

`site.json` currently carries an `author` block whose `shortBio` is **byte-identical to the Disney
operator's**. That is defensible as a house voice but reads as copy-paste. Write a Universal-specific
bio of the same length that describes the same method.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write the author identity block and the editorial-method language.

PRODUCE:
{ "author": { "name": "<collective name, not a person>", "shortBio": "<25-45 words>", "url": "/about/" },
  "methodStatement": ["<para 70-110 words>", "<para 70-110 words>"] }

RULES THAT MATTER MORE HERE THAN ANYWHERE
- Never invent a person. No named writers, no photographs, no credentials, no years of experience,
  no "our team of former park employees". The site publishes as a collective and must stay that way
  until a real person is willing to be named.
- Do not claim visits, ride counts, meals eaten, or interviews. The site's honesty claim is about
  METHOD - dated verification against an independent reference table - not about presence.
- The methodStatement describes: that every dated claim carries the month it was checked; that
  seasonal claims additionally carry a confidence level of confirmed, expected, or last confirmed
  cycle; and that pages past their review date display a banner that cannot be switched off.
  That is all true of the build today and is the strongest thing the site can say.
- Do not describe the reference table as "independently audited" or "third-party verified".
  It is a second internal source written blind. Say that plainly; it is more impressive true.
```

#### P23 — Image credit line and `CREDITS.md`

Two provenance gaps, both prerequisites rather than follow-ups. `docs/HANDOFF-UNIVERSAL-BRIEF.md:194`
asserts the footer already carries an image-credit line; it does not. And
`assets/img/photos/CREDITS.md` is required by two docs and does not exist.

**The credit must be live before the first image lands**, or there is a window where the site shows
generated imagery with no disclosure. It must also be gated so it does not appear on a site with no
images — otherwise it is a false statement in the other direction.

```
[PASTE BLOCK A ABOVE THIS LINE]

TASK — SHAPE A. Write two provenance artifacts.

(1) The footer image-credit string, for data/universal/site.json under legal.imageCredit.
    One sentence. It must say that imagery is illustrative and AI-generated, and that it is not
    photography of the parks described. It renders beside the copyright line and is gated on at
    least one photo slot resolving to a real file, so it never asserts AI imagery on a site that
    has none. Do not name a specific generator in this string - the generator may change and the
    per-file record in CREDITS.md is where that belongs.

(2) The header and row template for assets/img/photos/CREDITS.md.
    One row PER FILE, not per slot. A slot has up to nine files (three formats x three widths) and
    a rights complaint names a URL, so per-slot records cannot answer one.

    Each row records: filename including width and extension; generator and model version, OR
    licence and source URL for stock; the verbatim prompt; the verbatim negative prompt or exclude
    field; generation date; the name of the human who ran the IP review and the date they ran it;
    and content-credential / C2PA status if the generator emits one.

    Write the file's opening paragraph explaining WHY it is per-file and why it must be filled in
    before publication rather than after: a dated, human-signed pre-publication review is what
    separates an innocent-infringement posture from a willful one, and an indemnification offer
    from a generator is only claimable if you can prove which generator produced which file.

    Add a five-step IP review checklist with a sign-off line: three-circle sweep viewed at both
    100% and thumbnail size; castle and skyline silhouette check; text, signage and uniform check
    at 200%; face recognizability check; ride-vehicle and property-silhouette check. Note that the
    sweep must be re-run on the FINAL ENCODED file rather than the generator preview, because
    aggressive compression merges adjacent blobs and can create a three-circle arrangement that was
    not in the source - and on the LQIP too, since that is itself a 20-pixel image and the
    silhouette failure mode is a small-scale one.

NOTE FOR THE EDITOR TO ACT ON: the assets copy step currently publishes everything in
assets/img/photos/ to the live document root, so README.md is already public and CREDITS.md would
be too - containing prompts and reviewer names. Exclude *.md from the copy BEFORE writing CREDITS.md,
not after.
```

---

### 8. Running order

Ordered by what unblocks what, not by size.

| | Prompt | Why here |
|---|---|---|
| 1 | **P18** legal / affiliate copy | A false material statement on an FTC disclosure page. Nothing else on this list is a legal defect. |
| 2 | **P17** seasonal titles + H1s | 19 pages carrying a competitor's brand in the highest-value SEO field, including `/prices/` and `/when-to-go/`. |
| 3 | **P23** credit line + CREDITS.md | Must be live *before* the first image ships, and the asset-copy `*.md` exclusion must land before CREDITS.md is written. |
| 4 | **P19** meta descriptions | Cheap, mechanical, and feeds `og:description` and JSON-LD everywhere. |
| 5 | **P3–P6** snacks framing, map commentary, index intros | 16 pages at 0–4% page-unique. Highest words-per-hour on the list, no new facts. |
| 6 | **P1** headliner expansion | 22 records, ~7,700 words, and the site's flagship pages currently read like its minor ones. |
| 7 | **P13** glossary, **P14/P15** two guides | Fills the two `null` crossLink roles; the guides are wholly definitional. |
| 8 | **P8** itineraries | Highest-value content type the site lacks, and it needs zero new facts — pure sequencing over data already held. |
| 9 | **P7** edition retrospectives, **P2** closed attractions | Doubles five thin pages and surfaces 897 orphaned words. |
| 10 | **P21/P22** podcast + author | Small, editorial, unblocked. |
| 11 | **P9–P12, P16** Volcano Bay, CityWalk, hotels, events | Shape B. Gated on human verification and correctly last. |
| 12 | **P20** alt text | Runs per image, as images land. |
| 13 | **P24** `/updates/` | Build before the next re-verification pass, not after. |

**Two gate additions this batch depends on**, both small and both additive:

- `validate.mjs`: fail on any top-level key matching `^_` inside `data/<operator>/`, so a Shape B
  proposal cannot be merged with `_unverified` rows outstanding.
- `audit.mjs`: a foreign-brand check — fail when a rendered `<title>`, meta description, `og:title`
  or JSON-LD `name`/`headline` contains another operator's brand tokens, with an explicit allowlist
  for the intentional comparison pages. Plus a slug-shaped-title check (`/^[a-z0-9]+(-[a-z0-9]+)+/`)
  which catches the `universal-orlando closures` defect. The four-layer gate currently reports
  "No problems found" while 19 pages ship a competitor's brand; that is the structural gap this
  batch would otherwise re-open on the next content drop.

---

# Part 5 · Execution sequence

The order to do all of the above in, what each costs, what must be true before it starts, and what to check when it is done — including what to deliberately not do.

*33 items in this batch.*

## Execution sequence

Everything above is a finding. This section is the order to do them in, what each one costs, what has
to be true before it starts, and what to check when it is done.

Three principles govern the ordering, and every edge below traces back to one of them:

1. **A code change that opens an image slot must land before the image is worth generating.** An asset
   dropped into a slot that does not exist is a file nobody sees; an asset dropped into a slot that
   renders it wrong is worse, because someone has to notice.
2. **An irreversible step must be preceded by the thing that makes it reversible.** `/assets/*` is
   served `max-age=31536000, immutable`. The first image published under the current filename
   convention cannot be pulled back from clients for a year. The convention has to change first.
3. **An image amplifies whatever page it is attached to.** Nineteen pages currently ship a
   competitor's brand in the `<title>`. Producing a beautiful social card before fixing that converts
   the image spend into amplified embarrassment. Brand correctness precedes brand assets.

Note the shape this produces: **the first six things on this list are code and copy, and the first
image is typographic.** That is not a hedge. The two assets that render on 251 of 251 pages are the
social card and the favicon, and neither is a photograph.

---

### The dependency graph

```
STAGE 0  Prune the asset copy ──────────┬──> STAGE 2 (byte gate is meaningless at 79.7% freight)
         (maps/, *.md)                  ├──> STAGE 3 (icons need an operator-scoped output path)
                                        └──> STAGE 6 (never rasterise into a shared directory)

STAGE 1  Brand ownership ───────────────┬──> STAGE 3 (a card driving shares to "Disney parks in
         (19 titles, RESORT_LABEL,      │            October" on hollywoodrideguide.com)
          llms.txt, aria-label,         └──> LAUNCH GATE (2 unresolved reference conflicts)
          seasonal-schema fallback)

STAGE 2  Photo plumbing + the gate ─────┬──> STAGE 3 (social filename collides across operators)
         (versioned filenames,          ├──> STAGE 5 (budget unenforceable without the gate)
          .jpg extension bug,           ├──> STAGE 7
          audit image gate,             └──> STAGE 8
          CREDITS.md, footer credit)
              ▲
              └── requires STAGE 0's *.md exclusion, or CREDITS.md publishes prompts and
                  reviewer names to the live document root

STAGE 3  Social card + icon set ────────────> (renders on 251/251 pages; no further deps)

STAGE 4  CSS + component capability ────┬──> STAGE 5 (.verified contrast is on the hero page)
         (compact-photo variant,        ├──> STAGE 7 (section() has no image param at all)
          .verified override,           └──> STAGE 8 (per-entity resolver does not exist)
          section() image, resolver)

STAGE 5  The hero photograph ───────────────> (one image, one page)

STAGE 6  Maps: map.json ×4 → PNG ───────────> (independent of all image work; zero IP risk)

STAGE 7  Section images ×6

STAGE 8  The atmosphere reuse pool ×12
```

Two edges deserve their justification spelled out, because they are the ones most likely to be
skipped:

**Stage 0 → Stage 2.** `copyAssets` at `src/build.mjs:527-532` does a blanket recursive copy, so
`assets/img/photos/README.md` is already published at
`https://hollywoodrideguide.com/assets/img/photos/README.md`. `CREDITS.md` is the file that will
contain generator names, verbatim prompts, and the reviewer's name. Writing it before the copy is
filtered publishes all of that. Filter first, then write the file.

**Stage 2 → Stage 3.** `data/disney/site.json` and `data/universal/site.json` both declare
`photos.social.file = "social-card"` — verified identical. `assets/img/photos/` is a single shared
directory. Whichever card is generated last becomes the Open Graph image for **both** sites. Ride
Ready Guide's card would serve as Hollywood Ride Guide's card on all 251 pages, on a domain that is
not its own. This is a one-string JSON edit and it must precede the file, not follow it.

---

### Stage 0 — Stop the bleeding

No assets. Nothing here is visible to a reader; all of it is prerequisite.

| What | Where | Edit |
|---|---|---|
| Prune foreign map plates | `src/build.mjs:528` | After the `cp`, remove `assets/img/maps/*.png` whose slug is not in `data.parks`. Same shape as the `rm(join(dist,'assets','sw.js'))` on line 530 directly below it. |
| Exclude internal docs | `src/build.mjs:528` | Filter `*.md` out of the asset copy. |

**Measured:** `dist/universal` is 47,761,789 bytes. `dist/universal/assets/img/maps` is 38,067,822 of
them — **79.7%**. All twelve PNGs are Disney park slugs; zero of the 251 pages reference the
directory. Total HTML for the whole site is 9,294,002 bytes. Pruning takes the deploy from 45.55 MB to
roughly 9.2 MB.

**Cost:** 2–4 hours. No tooling spend. *Assumption: one developer already familiar with this repo,
working solo. Every hour figure below carries the same assumption.*

**Gate:**

```
node src/build.mjs universal && node scripts/audit.mjs universal
node src/build.mjs disney    && node scripts/audit.mjs disney
node --test test/*.test.mjs
du -sb dist/universal dist/disney
```

`audit` must stay at "No problems found" for both (universal currently carries 4 map-PNG notes,
disney 1 title-length note — those are the baseline, not regressions). **By eye:** open
`dist/universal/assets/img/` and confirm the only maps present are Universal's, and that no `.md`
file survived anywhere under `dist/*/assets/`.

---

### Stage 1 — Brand ownership

No assets. This is the largest pure-copy stage and the one that most needs a writer rather than a
developer.

Eighteen to nineteen pages ship Disney branding in the `<title>`, `<h1>`, meta description, og tags
and JSON-LD, with correct Universal body copy underneath. The fix is not find-and-replace: *"Is May a
good time to visit Universal Orlando or Universal Studios Hollywood?"* is a different editorial claim
from the Disney sentence it replaces, and the month pages need Universal-specific framing.

| What | Where | Edit |
|---|---|---|
| 12 month pages | `src/seasonal/months.mjs:35, 141, 143, 152, 182, 234` | Resolve title/H1/description from `site.brand` and `data.parks`, not literals. |
| Calendar + when-to-go | `src/seasonal/core.mjs:44, 76, 78` | Same. |
| Holidays / prices / closures | `src/seasonal/reference.mjs:101, 120, 122, 126, 218, 257, 259, 263, 348, 368, 370` | Same. |
| Events index | `src/seasonal/events.mjs:331, 333, 338` | Same. |
| Resort labels | `src/seasonal/reference.mjs:18` | **Delete `RESORT_LABEL` entirely.** The correct resolver already exists: `src/lib/seasonal-data.mjs:171-172` reads `resortBySlug.get(slug).shortName`, and `seasonal-data.mjs:312` already attaches `tracker.resortInfo`. Substitution, not new logic. Consumers at `:241, :284, :353, :357`. |
| Search index | `src/build.mjs:189` | `Disney parks in ${month.name}` → operator-derived. |
| llms.txt coverage line | `src/build.mjs:298` | Hard-codes *"Covers all six US Disney theme parks"*. Move to `site.meta.coverageLine`. |
| Search dialog label | `src/templates/layout.mjs:96, 99` | `aria-label="Search Ride Ready Guide"` on 251/251 pages. Pass `site` into `searchDialog()` (call site `:194`) and interpolate `site.brand.name`. |
| Dormant Event fallback | `src/lib/seasonal-schema.mjs:59` | `ev.resortName \|\| 'Disney Parks'`. Emits nothing today (0 confirmed editions) and fires the moment the first Universal edition is confirmed. |
| Trip Timing resorts | `src/seasonal/tools.mjs:92, 96` + `assets/js/trip-timing.js:45, 62, 120` | Radio values `walt-disney-world`/`disneyland` are lookup keys into a payload keyed `universal-orlando`/`universal-hollywood`. The `\|\| 3` fallback at `trip-timing.js:62` silently flattens the whole weather dimension. Drive options from `site.resorts[]`; carry the label in the payload. |
| Legal pages | `src/pages/legal.mjs:106, 187, 297, 333, 376, 377` | `/affiliate-disclosure/` describes partners as resellers of *Walt Disney World and Disneyland Resort tickets*. This is the one page whose entire job is material accuracy about the commercial relationship. |

#### One defect the survey lens did not catch

`src/seasonal/reference.mjs:357` reads `Full ${RESORT_LABEL[tracker.resort]} tracker →` — **with no
`|| tracker.resort` fallback**, unlike lines 241, 284 and 353. On Universal it renders as a link whose
entire label is the string `Full  tracker →`, twice on `/closures/`. Verified in the build:
`grep -c "Full  tracker" dist/universal/closures/index.html` → 2, against
`Full Walt Disney World tracker` on Disney. The audit's placeholder check at `scripts/audit.mjs:175`
looks for `undefined</` and does not fire, because the tagged template coerces `undefined` to an empty
string. Deleting `RESORT_LABEL` fixes it as a side effect.

**Also in this stage — the launch gate.** `scripts/reference/universal.mjs:223` holds two unresolved
CONFLICTS and `test/operators.test.mjs` refuses to let the operator leave draft while they exist:
Skull Island Reign of Kong `heightIn` (table 34, dataset 36) and Yoshi's Adventure `heightIn` (table
34, dataset null). Each needs one real figure from Universal's own published source, then the row is
**deleted, not edited**. This is external research, not engineering, so start it on day one of this
stage and let it run in parallel.

**Cost:** 12–20 hours, of which roughly 8–14 is writing rather than coding. No tooling spend.
*Assumption: the two height figures are obtainable from Universal's published listings without a park
visit. If they are not, that sub-item stretches indefinitely and should be tracked separately from the
rest of the stage.*

**Gate:**

```
node scripts/validate.mjs universal && node scripts/factcheck.mjs universal
node src/build.mjs universal && node scripts/audit.mjs universal
node scripts/validate.mjs disney && node scripts/factcheck.mjs disney
node src/build.mjs disney && node scripts/audit.mjs disney
node --test test/*.test.mjs
```

Every module touched here is **shared with the live Disney site**, so the Disney gates are not
optional. `factcheck universal` must stop printing *"2 unresolved source conflicts — this operator
cannot go live"*.

**By eye, because no command checks it:** grep the built HTML for the other operator's brand tokens
and read every hit. `/compare/universal-vs-disney-orlando/` and the comparative guides are
*legitimate* and must not be touched — this is exactly why it cannot be automated as a blanket
replace. Then read the twelve month `<h1>`s aloud against their own opening sentences; the body copy
was always correct and the headline was not, so the two now have to agree in voice as well as in
fact.

**Worth adding while you are here:** an `audit.mjs` rule that fails when a rendered title, description
or JSON-LD `name` contains another operator's brand tokens (built from the other operators'
`site.json`), with an explicit allowlist for the comparison pages; and a rule that fails on any title
matching `/^[a-z0-9]+(-[a-z0-9]+)+/`. Both defects above shipped through a gate that printed "No
problems found."

---

### Stage 2 — Photo plumbing and the image gate

No assets. **This is the stage that makes dropping a file safe**, and it is the one most likely to be
skipped because nothing about it is visible.

| What | Where | Edit |
|---|---|---|
| Versioned filenames | `src/templates/components.mjs:173, 181` + `src/lib/data.mjs:370-380` + `assets/img/photos/README.md` | `/assets/*` is `max-age=31536000, immutable` in both `_headers` and `vercel.json`, and photo URLs carry no hash and no `?v=` — unlike the CSS/JS precache entries at `src/build.mjs:547-553`. Deleting a file for a rights problem fixes the origin only; every client that already fetched it keeps serving it for up to a year. Add a content-hash or version segment **before the first file exists**, because changing the convention afterwards means renaming and re-declaring everything. |
| The `.jpg` extension trap | `src/lib/data.mjs:389` | The existence probe at `:375-377` accepts `.avif` OR `.webp` OR `.jpg`, then line 389 hard-codes the URL as `...-1280.jpg`. Producing the card as AVIF — the natural choice, since the pipeline is AVIF-first — passes the probe, flips all 251 pages to `summary_large_image`, and points them at a 404. Social crawlers do not accept AVIF regardless, so the JPEG is mandatory here. Record which extension satisfied the probe and build the URL from it. Same latent bug at `components.mjs:181`. |
| De-collide the social card | `data/universal/site.json` `photos.social.file` | `"social-card"` → `"social-card-universal"`. One JSON string. The hero avoids this by accident (`hero-fireworks` vs `hero-coaster-night`), which proves the fix is a naming convention, not an architecture change. |
| The image gate | `scripts/audit.mjs` (new block near `:180-183`) | The entire current image check is *"does `<img>` have an `alt=` attribute"* — which passes trivially for `alt=""` and is a no-op today because zero `<img>` tags exist. Grepping `validate/factcheck/audit` for byte, size, KB, avif, webp or photos returns nothing. Add: bytes ≤ 120 KB for the hero slot and ≤ 80 KB otherwise; the AVIF/WebP/JPEG triple present at every declared width; and **on-disk pixel dimensions matching the `width`/`height` declared in `site.json`** (headers are parseable in a few dozen lines with no dependencies). Without the last one, a generator returning 1920×1152 against a declared 1080 silently crops 6% off every non-hero image via `object-fit: cover` — possibly the corner a human just cleared in an IP review. |
| Keep images out of precache | `src/build.mjs:555` | The filter admits any URL starting with `/assets`. The precache is 24 URLs, 1.08 MB raw, 194 KB gzipped, and is where the park-WiFi claim lives. Reject `/assets/img/photos/` explicitly, with a comment saying why, so the constraint survives the next edit. The runtime cache-first handler in `sw.js` already picks images up after first view, which is the correct tier. |
| Footer credit line | `src/templates/layout.mjs:136-139` | `docs/HANDOFF-UNIVERSAL-BRIEF.md:194` asserts the footer already carries *"Illustrative imagery, AI-generated"*. It does not — `siteFooter` renders brand, tagline, accuracy note, nav, disclaimer, copyright, and nothing else. Add it **gated on at least one resolved photo**, so it does not assert AI imagery on a site that currently has none. It must be live before the first image, or there is a window where the site shows generated imagery undisclosed. |
| `CREDITS.md` | `assets/img/photos/CREDITS.md` | Required by `assets/img/photos/README.md` and `docs/ASSET-RUNBOOK.md:122`; does not exist. One row **per file, not per slot** — a slot is 9 files and a rights complaint names a URL. Record: filename with width and extension, generator + model version (or licence + source URL), verbatim prompt and negative prompt, generation date, the reviewer's name, the date they ran the IP checks, and C2PA status. Firefly's commercial indemnification is only claimable if you can prove which generator produced which file. |
| The IP review checklist | `docs/IMAGE-REVIEW.md` (new) | `docs/ASSET-RUNBOOK.md:53` establishes that prose prohibitions in prompts *backfire* — negation encodes the forbidden token. That makes the human pass the **only** control, and it currently has no written procedure and no sign-off. See the checklist below. |
| A universal section in the runbook | `docs/ASSET-RUNBOOK.md` | `hero-coaster-night` appears exactly once in the entire repository — in `data/universal/site.json`. Batch 1 and 4 both brief `hero-fireworks`, which is the *Disney* declaration. Running the runbook exactly as written leaves Hollywood Ride Guide with zero images. |
| `photo()` unit tests | `test/html.test.mjs` | 88 tests pass and none exercise `photo()`. Cover: null returns empty (the whole "declared is not real" contract), the srcset matrix, the priority/lazy split, and `alt=""` surviving as an empty attribute. |

#### The IP review checklist — roughly 50 seconds per image, run by a person

Run it on the **final encoded AVIF**, not the generator's preview: aggressive quantisation merges
adjacent blobs and can *create* a three-circle arrangement that was not in the source.

1. **Three-circle sweep (~15s)** — view at 100% *and again at thumbnail size*, because the silhouette
   resolves at small scale where it is invisible at full size. Scan balloons, pretzels, ice cream,
   waffles, topiary, bokeh clusters, wheel hubs, cast shadows, reflections. Any head-and-two-ears
   arrangement, however incidental, is a **reject, not a retouch**.
2. **Castle / skyline (~10s)** — asymmetric European architecture passes; a symmetric central spire
   flanked by two towers does not.
3. **Text and marks (~10s)** — zoom to 200% over signage, banners, uniforms, cups, wristbands.
   Diffusion pseudo-text frequently resolves into something readable and trademark-adjacent. Staff in
   plain unbranded uniforms, no badge, no name tag.
4. **Faces (~10s)** — any face sharp enough to identify a specific person is a reject. Silhouette,
   motion blur and back-lighting are the cheapest structural mitigation, and the atmospheric direction
   already favours them.
5. **Vehicles and property silhouettes (~5s)** — no monorail, no recognisable coaster train, no Harry
   Potter / Star Wars / Marvel / Nintendo cues.

Record pass/fail and the reviewer's name in `CREDITS.md`. If LQIP is ever introduced, run step 1 on
the LQIP too — that *is* a 20px image, and this is a small-scale failure mode.

**Cost:** 8–14 hours. No tooling spend.

**Gate:** all five commands on both operators. `audit` gains new rules, so confirm it still reports
clean on Disney. **By eye:** deliberately drop a deliberately-oversized junk file into
`assets/img/photos/` and confirm the new audit rule *fails the build*. A gate nobody has seen fail is
not a gate.

---

### Stage 3 — The two assets that render on 251 of 251 pages

**5 assets** (1 social card, 4 PNG icons) **+ 1 favicon SVG.** Neither is a photograph. Both are flat
colour and type, which is why they carry essentially zero IP exposure under the constraint list.

**The social card.** `site.socialImage` resolves to null, so `layout.mjs:44-50` takes the fallback
branch and all 251 pages emit `twitter:card=summary` with no image — verified, 0 of 251 have
`og:image`. Every share on X, Facebook, LinkedIn, iMessage, Slack and WhatsApp is a bare text link.
This image never loads in a browser, never touches page weight, never enters the precache, and is
fetched only by crawlers. It is one file, and it converts every existing and future share of every
page. The runbook is right to call it the highest effort-to-return item on the list. Ship it as **JPEG
or PNG** (see the Stage 2 extension trap), 1200×630 or the declared 1280×672, with everything inside a
centred 80% safe area because every platform crops it differently.

**The icon set.** `FAVICON` is a hard-coded SVG literal at `src/build.mjs:520-525` with
`fill="#0f3d2e"` — Ride Ready Guide's forest green — written unconditionally for every operator at
line 531. `scripts/generate-icons.mjs:17-20` hard-codes the same palette (`BRAND = [15,61,46]`) and
writes to the shared `assets/img/` at `:153-157`. Universal declares `themeColor: "#1b3a5c"`, so the
manifest renders a navy splash behind a green icon. These are the smallest images on the site and the
only ones that render on 251 of 251 pages today.

The code change this needs: make `generate-icons.mjs` take an operator argument, read the palette from
`site.json`, and emit to an operator-scoped path; make `FAVICON` a function of `site.brand` rather
than a module constant. Disney's current values become its literals, so **Disney's output should be
byte-identical** — that is the regression test.

**Cost:** 3–6 hours plus $0–30 in generator credits. *Assumption: the measuring-rule mark is retained
and recoloured rather than redesigned. The mark is legally clean — it is a measuring stick — and it
says what the site is at 32px. Commissioning new brand identity is a different project with a
different budget.*

**Gate:** all five commands on both operators, plus:

```
grep -rl 'og:image' dist/universal --include=*.html | wc -l   # expect 251
grep -rho 'twitter:card" content="[a-z_]*"' dist/universal --include=*.html | sort | uniq -c
git diff --stat dist/disney/assets/img/                        # expect no icon changes
```

**By eye, and nothing else can do this:** paste a `hollywoodrideguide.com` URL into X, Slack and
iMessage and look at the unfurl — crop behaviour differs per platform and only a real paste reveals
it. Install the site to a phone home screen and confirm the tile is navy, not green. Open a tab and
confirm the favicon reads at 16px.

---

### Stage 4 — CSS and component capability

No assets. Four small changes that unlock 94 pages and eight planned images, plus two latent bugs that
fire on first contact with a real photograph.

| What | Where | Edit |
|---|---|---|
| Compact photo hero | `assets/css/main.css`, after `:393` | `.hero--compact` reduces padding (`:345`); `.hero--photo` sets `min-height: min(78vh,720px)` at `:392`. A compact hero handed an image becomes a full 78vh cinematic hero — the opposite of what "compact" asks. 18 of 36 hero call sites pass `tone:'compact'`, covering 94 of 251 pages including `landPage` (27, the highest-volume slot on the site) and `guidePage` (11). Add `.hero--photo.hero--compact { min-height: clamp(240px, 34vh, 400px); }` plus a matching `.hero__inner` padding rule inside the same media query. **Four lines, largest reach on the list, entirely additive** — nothing renders differently until an image is passed. |
| `.verified` contrast | `assets/css/main.css`, in the override group at `:402-406` | The one existing photo call site (`src/pages/core.mjs:83-92`) passes both an image and an aside containing `lastVerified`. `.hero--photo` overrides colour for exactly four selectors — title, lede, eyebrow, meta. `.verified` at `:659-662` is `color: var(--muted)` (#64726e), 0.8rem, no background, no scrim. The moment the hero lands, *"Everything on this site verified July 2026"* — the sentence the entire editorial contract rests on — renders at roughly 2:1 on a deep indigo night photograph, with Ken Burns drift moving the backdrop underneath it. AA requires 4.5:1. Add `.hero--photo .hero__aside .verified { color: rgba(255,255,255,.82); }`. Audit `.facts__hint` and `.small.muted` the same way before any other aside-bearing hero gets an image. |
| Card hover reduced-motion | `assets/css/main.css:517` | `.card--media:hover .card__photo img { transform: scale(1.03) }` sits *outside* the `prefers-reduced-motion: no-preference` block at `:518-520` that guards only its transition. With reduced motion requested the scale still applies, instantly. Dead today; live across up to 405 card slots the moment the first card image ships. Move line 517 inside the block. |
| `section()` image slot | `src/templates/components.mjs:75-89` | Signature is `{id, title, kicker, intro, children, tone, wide, hide}` — **no image**. `photo()` has exactly two call sites in all of `src/`: `hero()` at `:48` and `card()` at `:336`. There is no band-level image slot anywhere. All eight runbook section images could be generated, converted, budget-checked and installed, and the diff to the rendered site would be zero bytes. The runbook's *"Blocks: Nothing — pure upside"* should read *"blocked on a six-line component change."* Add `image` to the destructured params and emit a `.band__media` wrapper between `<header>` and `${children}`, plus ~5 lines of CSS. Renders nothing when null, same contract as `hero()` and `card()`. |
| Per-entity photo resolver | `src/lib/data.mjs`, beside `:370-380` | `data.photo` is a flat map built only from `site.photos`, keyed by slot name. There is no mechanism for a per-park, per-land or per-entity photo. Roughly 8 lines: resolve `entity.photo` string keys on lands/parks/events during normalization, same `existsSync` gate, same null-means-absent contract. **`card()`, `attractionCard()`, `diningCard()` and `eventCard()` already route through `card()` and would carry images the moment one is passed** — the card layer needs zero component work. What is missing is the resolver, not a component library. |

**Cost:** 4–7 hours. No tooling spend.

**Gate:** all five commands on both operators. `assets/css/main.css` and `components.mjs` are shared
with the live Disney site, so the Disney build must be re-verified even though nothing should change.
**By eye:** with no images present, diff the rendered Disney and Universal HTML against the previous
build — these changes should be **byte-identical output** until an image exists. That is the whole
safety property, and it is worth confirming rather than assuming.

---

### Stage 5 — The hero

**1 asset.** `hero-coaster-night`, 1920×1080, ≤120 KB AVIF, delivered at 640/1280/1920 across AVIF,
WebP and JPEG.

Depends on Stage 4 for the `.verified` contrast fix (same page), on Stage 2 for the filename
convention and the byte gate, and on the runbook gaining a Universal section — the string
`hero-coaster-night` currently exists nowhere except the JSON that declares it.

**Cost:** 3–6 hours plus $0–30. *Assumption: 20–50 generations to get one that survives the IP
checklist. The three-circle failure mode is described in the runbook as near-certain and unprompted,
so budget for rejects rather than treating the first acceptable composition as done.*

Note the measured consequence: a cold Universal home page today is **26,798 bytes over the wire**
(HTML 8,269 + CSS 15,841 + JS 3,327, all gzip -9, zero web fonts, zero third parties). One 120 KB hero
takes it to roughly 147 KB — a **5.5× multiplier on the site's single most-visited page**. That is
still a fast page and the trade is defensible for one image on one page. It is not defensible
repeated 23 times, which is why Stage 8 is a reuse pool and not a per-entity library.

**Gate:** all five commands, both operators, plus the new byte and dimension rules from Stage 2. **By
eye:** the five-step IP checklist, signed into `CREDITS.md`. Then load the home page on a real phone
at throttled speed and watch the *first* paint — the LQIP is declared end-to-end in the component
(`components.mjs:177`) and the CSS (`main.css:361-362`) but **nothing generates one**, so today the
image arrives over a flat `--surface-3` slab. Confirm that is acceptable, or generate the LQIP. And
confirm the freshness line is legible over the photograph at small sizes while the drift animation
moves beneath it — a static screenshot will not show you this.

---

### Stage 6 — Maps

**8 plates** (4 parks × 1× and 2×), derived from **4 hand-authored `map.json` files**. No image model
involved.

This is the highest-value visual work on the Universal site and it carries **zero IP exposure and zero
generation cost**. Deriving geometry from OpenStreetMap is explicitly permitted; tracing an official
map is not.

Today no Universal park has a `map.json`, so `src/lib/map.mjs:204` falls through to `syntheticMap()`
at `:75-110`, which lays lands out as equal wedges of a circle. Epic Universe and Universal Studios
Hollywood both have 5 lands and therefore emit **byte-identical polygon geometry**. Each map carries 2
markers and zero paths and zero water, against Disney's 19–21 markers, 40 land polygons, 35 walkways
and 9 water bodies across six files.

The page copy switches to an honest lede for the synthetic case, so the map page itself is not lying.
But `/tools/`, the home page and — most seriously — `/terms/` all state the maps are drawn from open
geographic data, with `/terms/` making a formal ODbL attribution to OpenStreetMap contributors. **No
geographic data was used for any Universal map.** That is a claim that has to be either made true or
withdrawn, and there is no third option.

Universal Studios Hollywood is the sharpest case: the Upper Lot / Lower Lot split joined by a long
escalator bank is the park's defining layout fact, and a radial pie chart actively misrepresents it.

**Fork worth naming explicitly:** if Stage 6 is not going to happen soon, **soften the three claims
now**, in Stage 1, gated on `park.map` being synthetic. Do not leave a false ODbL attribution standing
as a placeholder for future work.

**Cost:** 20–40 hours — the largest single stage, and almost all of it careful manual geometry work.
No tooling spend. *Assumption: ~4 KB of authored JSON per park matching the Disney schema (viewBox,
water, paths, `lands[].points`, `labelAt`, markers), roughly 27 land polygons and ~76 markers total,
traced from OSM land-use and path geometry by someone who has looked hard at each park's actual
layout. Someone who has visited will be at the fast end of that range; someone working purely from
aerial imagery will be at the slow end.*

**Gate:** `validate universal` must stop emitting all four *"map.json: not authored yet"* warnings.
Then and **only** then run `npm run maps:png` — and only after Stage 0, so the rasteriser writes to an
operator-scoped path (`scripts/render-map-pngs.mjs` currently defaults `OPERATOR = 'disney'` and writes
to the shared `assets/img/maps`, so running it today would put both operators' plates in both sites).
`audit universal` should lose its 4 map-PNG notes. **By eye:** open each SVG beside the real park on a
satellite view and check that adjacencies are right — which lands actually touch, which connection
people assume exists and does not. A schematic may be not-to-scale, which these declare, but it may
not be *wrong about what is next to what*, and no command can tell the difference.

---

### Stage 7 — Section images

**6 assets**, 16:9, ≤80 KB each, into the `section()` slot built in Stage 4.

Take the runbook's batch 4 and re-brief it for this operator: **drop 4a (castle) and 4c (traditional
carousel)** — Universal's US parks have no castle in the brand vocabulary and a Moorish-Gothic castle
on a Universal site is editorially off. Keep *the drop*, *the welcome*, *fair food*, *waiting*, *the
end of the day*, and add **one backlot street at dusk**. Universal's visual grammar is backlot street,
studio-lot water tower, steel coaster at night, soundstage facade, neon marquee — none of which the
current runbook briefs.

A band-level slot is the *right* shape for these: they are illustrative-of-an-idea, not
evidence-of-a-place. That is exactly what belongs mid-page in a guide and exactly what does not belong
in a hero above a factual claim.

**Cost:** 6–12 hours plus $10–40. **Gate:** all five commands, both operators, plus the IP checklist
and `CREDITS.md` rows per file. **By eye:** confirm each image is placed where its *idea* belongs, not
where there happened to be a gap.

---

### Stage 8 — The atmosphere reuse pool

**12 assets.** This is the stage most likely to be scoped wrong, so the arithmetic matters.

There are **405 card slots across 63 pages**. Giving each a unique image at three formats and three
widths is roughly **180 MB on disk**. A reuse pool of ~40 images is roughly 17.8 MB. **Only the reuse
model is compatible with this repo**, and 12 is the honest starting number:

- **4** park-level night frames — one per park, the single strongest "this park after dark" image.
  Highest per-page reader impact on the site.
- **3** dining service tiers (quick-service window, table-service room at dusk, lounge) — these cover
  all 47 restaurant pages, because what a dining page wants is *room tone*, not food.
- **4** seasonal frames (rain on hot asphalt, low winter sun, packed midsummer midway, golden-hour
  switchback queue) — covering 12 month pages and 5 holiday pages.
- **1** resort establishing shot.

Lands are the highest-volume opportunity (27 pages, inherited by 62 attraction pages and 27 cards on
4 park hubs) and are the one entity where an atmospheric image is both editorially honest and legally
safe — architecture and light, no IP. But 27 unique land images is a Stage 9 conversation, not this
one.

**Cost:** 12–24 hours plus $20–60. **Gate:** all five commands, the byte gate, the checklist per file.
**By eye:** confirm no image reads as a photograph *of the specific thing on the page*. A generic
image next to a named entity gets read as a picture of that entity, and that is the failure mode this
entire pool has to avoid.

---

### Cost summary

| Stage | Hours | Spend | Assets |
|---|---|---|---|
| 0 · Prune the asset copy | 2–4 | — | — |
| 1 · Brand ownership | 12–20 | — | — |
| 2 · Photo plumbing + gate | 8–14 | — | — |
| 3 · Social card + icons | 3–6 | $0–30 | 6 |
| 4 · CSS + component capability | 4–7 | — | — |
| 5 · The hero | 3–6 | $0–30 | 1 |
| 6 · Maps | 20–40 | — | 8 |
| 7 · Section images | 6–12 | $10–40 | 6 |
| 8 · Atmosphere pool | 12–24 | $20–60 | 12 |
| **Total** | **70–133** | **$30–160** | **33** |

These are estimates, and they are the estimates of someone who has read the code but has not made the
changes. The three most likely to be wrong, and the direction they will be wrong in:

- **Stage 6 could double.** Hand-authoring accurate geometry for four parks is open-ended work whose
  end condition is a judgement call, and 40 hours assumes nobody re-litigates a layout.
- **Stage 1 could double** if the two reference-table height figures turn out not to be published
  anywhere and need a park visit or an operator enquiry to settle.
- **Stages 5, 7 and 8 could halve or double** depending entirely on generator reject rate, which
  nobody can predict from here. The runbook's own position is that the three-circle failure mode
  appears unprompted and often.

Nothing here includes the content programs in the other lenses — Volcano Bay, CityWalk, itineraries,
hotels, the glossary. Those are real and they are larger than everything above combined. They are a
different plan.

---

### Minimum viable: if only 20% happens

**Do Stages 0, 1 and 3, plus exactly four items out of Stage 2.** That is roughly **20–32 hours of
70–133 — call it 20–25%** — and it is the difference between a site that cannot go live and a site
that is live and correct.

The four Stage-2 items the cut requires, and nothing else:

1. Rename `photos.social.file` to `social-card-universal` — one JSON string, without which the card
   collides with Disney's.
2. Fix the `.jpg` extension bug at `src/lib/data.mjs:389` — without which an AVIF card points 251
   pages at a 404.
3. Exclude `*.md` from the asset copy — without which internal docs stay published.
4. The footer image-credit line, gated on a resolved photo — without which the first asset ships
   undisclosed.

Skip, in this cut: the versioned filename convention, the full audit image gate, `CREDITS.md`, the
review checklist doc, and the `photo()` tests. **This is a real, named debt**, and it is only
acceptable because the cut ships exactly one image and that image is typographic — no photograph, no
generator, no IP question, minimal reason to ever pull it. **The moment Stage 5 enters scope, the rest
of Stage 2 becomes mandatory again**, and it should be written down as such rather than quietly
inherited.

**What the cut delivers:**

- 45.55 MB → ~9.2 MB, and 38 MB of a competitor's branded cartography stops being served from
  `hollywoodrideguide.com`.
- 19 Disney-branded titles, 24 descriptions, the raw-slug closures titles, the blank `Full  tracker →`
  links, the *"Search Ride Ready Guide"* label on 251 pages, the self-contradicting `llms.txt` line,
  and the dormant `'Disney Parks'` Event fallback all gone.
- Trip Timing — the site's one genuinely uncopyable tool — stops advertising Walt Disney World and
  stops silently flattening its weather dimension to a constant 3.
- `og:image` on 251/251 pages; every share becomes a picture.
- Tab icon and install tile in the site's own navy.
- The two reference conflicts settled, so the operator can leave draft.

**Grade.** Judged on *would a stranger trust this site, and would they share it*: today it is a **C**.
The underlying dataset and structured-data layer are genuinely A-grade work — 251/251 unique titles
and descriptions, 248 BreadcrumbList, 153 FAQPage, a fact-checker with real teeth — and they are
sitting behind a storefront that says a competitor's name in the browser tab, in the title bar of 19
pages, in the search dialog's accessible name, and in the file that tells AI answer engines what the
site is.

The cut lands it at a **B+**: correct, launchable, shareable, and honest about what it has. It reaches
that with **one image**, and that image is not a photograph.

Full sequence gets to **A−**. The gap between B+ and A− is almost entirely Stage 6 — accurate maps are
the one asset a competitor cannot copy without redoing the work, and they are the only thing on this
list that would make someone bookmark the site rather than read it once.

**Why this cut and not the intuitive one.** The intuitive 20% is "generate the hero and the eight
section images, because the site has no pictures." That cut spends the entire image budget on the
lowest-leverage surface — the hero renders on 1 page of 251, and the eight section images render on
**zero** until `section()` gains a parameter it does not have. Meanwhile the two assets that render on
251 of 251 pages are a JPEG no browser ever loads and a recoloured 32px icon, and the largest single
improvement available is deleting 38 MB. **The correct 20% is mostly deletions and string
substitutions**, which is unsatisfying and is the reason it does not get done.

---

### Stop-loss: things in this audit to explicitly not do

Every audit that recommends only additions is lying about tradeoffs. These are refusals, with reasons.

**1. Do not run `npm run maps:png` until Stage 6 and Stage 0 are both done.** The audit prints four
notes telling you to. Following them today rasterises four generic pie charts into a shared directory
that already leaks across operators, adding multi-MB PNGs to the problem you are trying to fix. The
Disney plates run 1.29–5.44 MB each.

**2. Do not add an `image` parameter to `foodCard()`** (`src/templates/components.mjs:426`). This is
the one that will be proposed and must be refused. It would put a thumbnail on 158 items across ~85
pages. Two independent reasons, the second decisive: `/tools/food-tracker/` is **already 314,405 bytes
of HTML for one page** the home page promises works on no signal, and 158 thumbnails is megabytes on
top; and every food card carries a specific name, a specific price, a dated verification and a
first-person verdict, so **a generated image of a named snack at a stated price is a fabricated record
of a real product**. That is materially different from an atmospheric hero and it is the exact failure
the site's editorial policy forbids on every other axis. If snacks get imagery it is *one* band-level
"fair food" image on `snacksPage`, never keyed to an item.

**3. Do not generate per-attraction photography.** 62 pages. On a Universal site a per-ride photograph
means a specific, heavily protected ride exterior or vehicle, which the constraints forbid outright.
Any per-attraction slot gets filled with something generic and then read as a picture of that ride.
Let attraction pages inherit their **land** image — architecture and light rather than IP.

**4. Do not put images in `PRECACHE_URLS`.** One 120 KB hero is a 62% increase in the gzipped install
payload for a resource that is decorative by declaration. The runtime cache-first handler already
picks images up after first view, at zero install cost.

**5. Do not add hero images to `heightsPage`, `ridesPage`, `pricePage`, `closuresPage`, `comparePage`
or `bestRidesPage`** — ~85 pages — even after the compact-photo variant lands. A reader on a height
page arrived with a number in their head and wants a row; a photo pushes the table below the fold. A
price or closure page carries explicit confidence labels, and an atmospheric photograph beside a claim
marked *"expected, not confirmed"* works directly against the signalling the seasonal system exists to
deliver. A comparison page's thesis is that the reasoning is the product; per-contender images invite
judging on the picture.

**6. Do not pursue the 405-slot unique-image rollout.** ~180 MB on disk. The reuse pool is ~17.8 MB
for most of the benefit. This is the recommendation that sounds most like thoroughness and is most
destructive.

**7. Do not "fix" the null-photo fallback.** Every proposal that makes a missing image render a
placeholder breaks the property that lets an image be pulled in one command. It is the design, not an
omission.

**8. Do not rewrite `photo()`.** It is well built — correct format order, real srcset, explicit
width/height, `aspect-ratio` reserved before bytes arrive, `fetchpriority` on the LCP image only,
lazy everywhere else, focal point applied, empty on null. It needs three small additions
(`srcset`/`sizes` on the fallback `<img>`, smallest-width `src` instead of widest, a preload for the
LCP hero) and no restructuring.

**9. Do not add `Event` JSON-LD before dates are confirmed, and do not add `HowTo`.** The audit
reporting *"0 Event JSON-LD nodes"* reflects 0 confirmed editions, not a bug —
`src/lib/seasonal-schema.mjs:48` returns null without both dates, deliberately and correctly. Halloween
Horror Nights is the highest-volume search term in the Universal ecosystem and it still does not
justify a fabricated `startDate`. `HowTo` is retired.

**10. Do not flip the 79 `standalonePage:false` records to `true`.** 15,798 words of authored copy
genuinely do not render anywhere, and that is worth fixing — but as ~200-word standalone pages they
are thin-content signals. Render them inline on the land and dining index pages, which sit at 449 and
43 page-unique words and would absorb the content well.

**11. Do not generate the runbook's 4a (castle) or 4c (traditional carousel) for this operator.**
Disney-shaped, editorially wrong here.

**12. Do not commission or shoot real photography of the parks.** Under the constraint list — no
characters, no ride vehicles, no logos, no wordmarks, no real people, no castle — what survives is
sky, asphalt and unbranded architecture, which is what a generator produces more cheaply and with
clearer provenance.

**13. Do not hand-author LQIP values.** `escapeHtml` converts `'` to `&#39;`, which the HTML parser
decodes back inside the CSS `url()`. Base64 never contains a quote and `site.json` is
author-controlled, so this is latent rather than exploitable — but it argues for generating LQIP in
code. And budget the bytes: each is 300–800 B of uncompressible inline base64, negligible for one hero
and 7–18 KB on a 23-card page whose document is 15.5 KB gzipped.

**14. Do not let the podcast scaffold or the `twitter:site` handle block anything.** Both are
genuine parity gaps with Disney. Neither ships anything today (`src/lib/podcast.mjs:116` returns null
without an email and audioBase, and Disney's are empty too), and `twitter:site` is blocked on an
external account existing. The layout correctly omits the tag rather than emitting an empty one.

**Not stop-loss, but explicitly not now:** Volcano Bay (an entire missing gate the site's own copy
tells readers to spend a day at), CityWalk (154 mentions, zero pages, where most guests eat dinner),
multi-day itineraries, per-hotel pages, and the glossary. These are the largest genuine content gaps
on the site and several are worth more than anything in Stages 5–8. They are excluded here because
this is an asset and presentation sequence, and mixing a 12,000-word park build into it would hide
the fact that Stages 0–3 are cheap, fast, and blocking. **Sequence them after Stage 3 and before
Stage 6**, and give them their own plan.

---

### The single command to run at every gate

```
node scripts/validate.mjs universal && \
node scripts/factcheck.mjs universal && \
node src/build.mjs universal && \
node scripts/audit.mjs universal && \
node scripts/validate.mjs disney && \
node scripts/factcheck.mjs disney && \
node src/build.mjs disney && \
node scripts/audit.mjs disney && \
node --test test/*.test.mjs
```

Baselines to compare against, captured before any of this work:

- `validate universal` — exit 0, **8 warnings** (4 map.json, 2 attraction counts, 1 dining count, 1
  empty port-of-entry land)
- `factcheck universal` — exit 0, **13 notes**, including the blocking line *"2 unresolved source
  conflicts"*
- `audit universal` — **"No problems found"**, 4 map-PNG notes, 251 pages, 12,628 internal links
- `audit disney` — **"No problems found"**, 1 title-length note
- `node --test` — **88 pass, 0 fail**

Run the Disney half at every stage without exception. `src/lib/`, `src/templates/`, `src/seasonal/`,
`assets/css/` and `assets/js/` are shared, **Universal is draft and Disney is in production**, and
almost every code change in this sequence touches shared code. The reason Disney's output reads
correctly today is that these hard-coded strings happen to be its own — which means the very changes
that fix Universal are the ones most likely to break Disney.

And the thing no command checks, at every single stage: **read the page.** The four-layer gate is
excellent at what it was built for and it reported "No problems found" across a site that named a
competitor in 19 title tags, rendered two links whose entire label was `Full  tracker →`, and told AI
answer engines it covered six Disney parks in the same sentence where it said it covered four
Universal ones.

---

# Part 6 · The grade

## The curve

Graded against a Fortune 500 reference class — a shipped consumer web property with a design system
team, an accessibility team, a legal review, a content operations function, and a performance budget
somebody defends in a meeting. Not "a good indie side project."

| | Meaning |
| --- | --- |
| **A** | Would ship as-is under a recognisable brand. Nothing a director would block. |
| **B** | Strong; a launch reviewer signs off with a punch list. |
| **C** | Competent and coherent, but visibly incomplete against the category standard. |
| **D** | Would not pass launch review. |
| **F** | Would not pass an internal demo. |

Three calibration rules were applied deliberately:

- **Engineering rigour does not launder a missing asset.** It is graded on its own dimension, where it
  scores well. It does not rescue the visual grade.
- **A deliberate, well-documented absence is still an absence.** The null-photo fallback is excellent
  engineering and still a missing photograph.
- **Draft status is not itself penalised.** `factcheck.mjs` correctly refuses to let this operator go
  live over two unresolved height conflicts — that is the system working. The build on disk is graded
  as a build.

## Panel

Three graders scored independently, each investigating the repository and the rendered build directly
rather than inheriting the survey's conclusions, and each setting their own dimension weights.

| Grader | Lens | Grade |
| --- | --- | ---: |
| Design Director | Art direction, hierarchy, typography, brand distinctiveness | **D+** (68) |
| Engineering Director | Architecture, performance, accessibility, gates | **C−** (70) |
| Content Director | Editorial value, claim defensibility, disclosure, IP exposure | **C** (74) |

## Result

> # C−
> **70.7 / 100** — weighted mean of three independent gradings.
> Unweighted mean of the thirty dimension scores: 71.6. Both methods land in the same band.

### By dimension

| Dimension | Design | Eng | Content | Mean | |
| --- | ---: | ---: | ---: | ---: | :--- |
| Performance | 84 | 91 | 87 | **87.3** | B+ |
| Technical architecture | 84 | 84 | 87 | **85.0** | B |
| Content depth & editorial value | 80 | 80 | 87 | **82.3** | B− |
| Accessibility | 76 | 88 | 83 | **82.3** | B− |
| Information architecture | 70 | 80 | 77 | **75.7** | C |
| SEO, social & discoverability | 71 | 69 | 73 | **71.0** | C− |
| Visual design & art direction | 68 | 69 | 73 | **70.0** | C− |
| Trust, legal & editorial integrity | 72 | 58 | 73 | **67.7** | D+ |
| **Imagery & asset completeness** | 40 | 35 | 45 | **40.0** | **F** |
| **Brand identity & differentiation** | 58 | 38 | 67 | **54.3** | **F** |

### What the distribution says

This is not an evenly mediocre build, and reading it as a C− average misses the point. Roughly 40% of
the weight scores B− to B+. Roughly 25% scores D+ to F. Those two failing dimensions are not a
question of polish — they are the same defect seen twice: **an operator abstraction that is complete
in the data layer and leaks in every layer a customer looks at.**

The three graders disagreed by six points and agreed completely on where the failure is. All three
named imagery or brand as the weakest dimension. All three named the editorial writing as the
strongest. The Design Director graded hardest (D+) because the failure is most visible from that seat;
the Content Director graded softest (C) because the writing genuinely is B+ work. None of them could
get the site above C.

### Why not higher

Three things kept it out of the C+/B− band, and none of them is a matter of taste:

1. **Nineteen high-intent pages name a competitor in the title tag.** Twelve of them are the month
   pages — the highest-traffic seasonal content on any park site.
2. **Two integrity pages make verifiably false statements.** A formal ODbL licence attribution over
   diagrams containing no geographic data, and an FTC affiliate disclosure naming the wrong company's
   parks. On a property whose entire proposition is dated verification, these are category errors, not
   typos.
3. **The only image any platform can serve for this domain belongs to another brand.** No og:image on
   251 of 251 pages, so the favicon is the fallback — and the favicon is Ride Ready Guide's monogram.

### Why not lower

The floor is held by work that is genuinely above the category standard. Measured, not asserted:
median page 7.3 KB gzipped, cold home page under 27 KB, no web fonts, no third-party requests. Zero
unlabelled inputs, zero buttons without accessible names, zero duplicate IDs, exactly one `<h1>` on
251 of 251 pages. Structured data with zero parse failures across eleven schema types. And a
four-layer gate with real authority — it verifies 12,628 internal links, and it is currently blocking
this operator's own launch over a two-inch height discrepancy, with the reasoning written down.

## What moves the grade

| Target | Work | Rough effort |
| --- | --- | --- |
| **C− → C+** | Purge cross-operator contamination from every shipped surface, and add the two `audit.mjs` rules that stop it recurring. Correct the three false statements. | ~1 week |
| **C+ → B−** | Ship one social card, operator-scope the icon set and favicon, filter `assets/img/maps` per operator, wire the 40 orphaned pages into nav. | +2–3 days |
| **B− → B** | Author the four `map.json` files from OpenStreetMap so the ODbL attribution becomes true, and promote the uncopyable data: fear-fingerprint SVG, height-ladder chart, compare-page win tally. | +1 week |
| **B → B+/A−** | Photography, with a byte and provenance gate behind it. Plus the catalogue holes — Volcano Bay, CityWalk, multi-day itineraries, and the 15,798 authored words that render nowhere. | +2–4 weeks |

**The single highest-leverage item is not an asset.** It is the `audit.mjs` brand-ownership rule. This
codebase's defining discipline is that a rule nobody gates decays — and the category of defect that
dominates this grade is precisely the one the gate cannot currently see. Every other fix on this list
is a one-time correction. That one is the fix that holds.

Note also that `audit.mjs`'s map-freshness check probes `data/parks/<slug>/map.json`, a path that
stopped existing when the repository went multi-operator. It has been silently passing on nothing.
A gate that quietly stops asserting is the exact failure mode this codebase is otherwise built to
prevent, and it is worth fixing on principle regardless of the maps.

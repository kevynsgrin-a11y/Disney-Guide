# Project brief — Hollywood Ride Guide (Universal Destinations operator)

**Read this whole document before touching anything.** It is written to be self-sufficient: everything
a designer/front-end model needs to work safely on this site, with no other conversation history
assumed. It accompanies `HANDOFF-UNIVERSAL-PROMPT.md`, which is the task instruction — this file is
the knowledge the task instruction depends on.

---

## 1. What this is

A network of independent, unofficial theme-park planning websites. Each **operator** (Disney, this
Universal build) is a complete, separately-branded site on its own domain, generated from the same
zero-dependency codebase. They share a generator, a component library, and four verification gates.
They share **no content, no brand identity, and no trademark exposure** with each other.

This document covers the **Universal Destinations operator**, branded **Hollywood Ride Guide**, at
**`hollywoodrideguide.com`**. It covers the four US Universal theme parks:

| Park | Resort | Location |
|---|---|---|
| Universal Studios Florida | Universal Orlando | Orlando, FL |
| Islands of Adventure | Universal Orlando | Orlando, FL |
| Epic Universe | Universal Orlando | Orlando, FL |
| Universal Studios Hollywood | Universal Hollywood | Universal City, CA |

**This operator is currently `status: "draft"` in `data/operators.json`.** It is excluded from the
live site's default build and CI gate on purpose, and is only reachable by naming it explicitly
(`node src/build.mjs universal`). Draft is not a placeholder state — it means the data has not
cleared human verification yet (see §7). Nothing about a visual-polish pass should change that flag;
that decision is the site owner's, gated on content accuracy, not on how the site looks.

**Not affiliated with NBCUniversal or Universal Destinations & Experiences in any way.** The site
exists specifically because it is independent — its entire value proposition to a reader is that
nobody paid for a place in it and every fact is dated. See §4 for what this means for visual and
content work.

---

## 2. The technical architecture — read before proposing any change

**This is not a React/Next/Vue/framework project, and it must not become one.** It is a hand-written,
zero-runtime-dependency static site generator:

```
JSON data (data/universal/**/*.json)
    ↓ validated (scripts/validate.mjs, scripts/validate-seasonal.mjs)
    ↓ fact-checked (scripts/factcheck.mjs, scripts/factcheck-seasonal.mjs)
    ↓ rendered (src/build.mjs → src/pages/*.mjs, src/templates/*.mjs)
    ↓ audited (scripts/audit.mjs — crawls the rendered HTML)
dist/universal/  →  static HTML/CSS/JS, deployed as-is (Cloudflare Pages)
```

- **Templates** are JS tagged-template-literal functions in `src/templates/components.mjs` and
  `src/pages/*.mjs` — plain functions returning HTML strings, no JSX, no virtual DOM.
- **One stylesheet**: `assets/css/main.css`, currently ~1,430 lines. No Tailwind, no CSS-in-JS, no
  build step for CSS. Design tokens are CSS custom properties (§3).
- **Client JS** is four small vanilla files in `assets/js/` (`app.js`, `food-tracker.js`,
  `height-checker.js`, `trip-timing.js`, `map.js`) — no framework, no bundler. Total under 1,000 lines.
- **No `node_modules` runtime dependency.** `package.json` has zero runtime dependencies by design.
  Build tooling only.

**If you have write access to this repository:** work directly in these files, following the existing
conventions exactly. Do not introduce a framework, a bundler, a CSS preprocessor, or a component
library. A change that "modernizes" the stack is not in scope and will not be accepted — the
zero-dependency property is deliberate and load-bearing (see the file header comments throughout the
codebase for why).

**If you do NOT have write access** (a sandboxed design tool that can only emit self-contained
HTML/CSS): produce output that **reuses the exact CSS custom properties and class names** documented
in §3 rather than inventing a parallel design system. Output should be portable enough that someone
can port it into the real templates as a near-mechanical translation, not a rewrite.

### The four gates (do not bypass)

Every content or template change should be checked against all four before being considered done:

```bash
node scripts/validate.mjs universal        # is the data well-formed?
node scripts/factcheck.mjs universal       # does it match the reference tables?
node src/build.mjs universal               # does it render? (fast, <1s)
node scripts/audit.mjs universal           # does the rendered HTML have broken links, bad contrast, etc.?
```

Or all at once for the whole repo: `npm run check` (this builds and gates **both** operators —
Disney is live production, so a change to shared code that breaks Disney is a hard blocker even if
this task is scoped to Universal).

**Universal must be built and audited by name**, since it is a draft and excluded from the default
target set:

```bash
node src/build.mjs universal && node scripts/audit.mjs universal
```

A clean run currently reports: **251 pages, 45.55 MB, 0 problems** (as of this document; regenerate
and compare rather than trusting this number if content has changed since).

---

## 3. The current visual system — the vocabulary any polish work must speak

### Design tokens (`assets/css/main.css`, top of file)

All colors, spacing, radii, shadows and type scale are CSS custom properties on `:root`, with a
parallel dark-mode block. **Never hardcode a color, spacing value, or font size — reference the
token.** This is what keeps light/dark mode and both operators visually consistent without
duplicating rules.

```css
/* Color */
--paper --surface --surface-2 --surface-3      /* backgrounds, lightest to most recessed */
--ink --ink-2 --muted                          /* text, darkest to lightest */
--line --line-strong                           /* borders */
--brand --brand-2 --brand-3 --brand-soft       /* primary brand green (Disney's; see note below) */
--accent --accent-2 --accent-soft              /* amber accent */
--danger --danger-soft --warn --warn-soft --good --good-soft   /* semantic status colors */
--focus                                        /* focus ring color — never remove, only restyle */

/* Shape */
--radius-xs --radius-sm --radius --radius-lg --radius-xl
--shadow-sm --shadow --shadow-lg

/* Space (8pt-ish scale) */
--space-1 through --space-9

/* Layout */
--shell (1180px) --shell-narrow (760px) --shell-wide (1440px) --gutter (fluid)

/* Type */
--font-sans --font-display --font-mono         /* all system font stacks — no web fonts, on purpose */
--step--1 through --step-5                     /* fluid clamp() type scale */
```

**Important brand-specific note:** `--brand` (`#0f3d2e`, forest green) and `--accent` (`#a9660f`,
amber) were chosen for the Disney operator specifically, with a code comment reading *"deliberately
not Disney-adjacent."* Universal's `site.json` declares `themeColor: "#1b3a5c"` (a navy blue), and
that value **is already wired into two narrow, browser-level surfaces** — `<meta name="theme-color">`
in `src/templates/layout.mjs` (the mobile browser address-bar tint) and `theme_color` in the
generated `manifest.webmanifest` (`src/build.mjs`). **It is not wired into the actual CSS design
tokens** (`--brand`, `--accent`, etc.) — every visible UI element (buttons, links, the freshness
ribbon, hero gradients) still renders in Disney's forest-green palette regardless of operator. This
is the known gap. If your task includes brand differentiation for Universal, the correct fix is to
make the token block per-operator (e.g. emit an operator-scoped CSS custom property override at
build time, or a small `data-operator` attribute selector block), **not** to fork the stylesheet, and
not to just change the two places `themeColor` already reaches. Flag this explicitly in your output
if you touch it, since it affects Disney's live site too.

### Component inventory (`src/templates/components.mjs`, ~700 lines)

Reusable render functions. The class names below are load-bearing — CSS is written against them.
Selected components most relevant to visual work:

- **`hero({ eyebrow, title, lede, meta, actions, tone, aside, image })`** — page masthead. When
  `image` is supplied (a resolved photo object), renders `.hero--photo`: full-bleed image behind a
  two-layer scrim (linear gradient + radial vignette), white text regardless of theme. Without
  `image`, renders on a two-radial-gradient background using `--brand-soft`/`--accent-soft`. **Both
  states must always look intentional** — a hero with no photo is not a "broken" state, it is the
  default state, and this site currently ships in it.
- **`photo(img, { className, sizes, priority })`** — the only way an image should ever be rendered.
  Takes a resolved entry from `data.photo.*` (built in `src/lib/data.mjs`, resolved against files on
  disk — see §6). Emits `<picture>` with AVIF → WebP → JPEG sources, three widths, explicit
  width/height, a CSS custom-property-driven LQIP blur placeholder, and `loading="lazy"` on
  everything except `priority` images (the hero). **Never write a bare `<img>` tag for content
  photography** — always route through this function so the fallback behavior stays centralized.
- **`card({ href, eyebrow, title, summary, meta, badges, tone, footer, image })`** — the general
  content card. `image` renders a full-bleed 16:9 photo at the top (`.card--media`); omit it and the
  card still looks complete (most cards on this site have no image).
- **`trustStrip(items)`** — the typographic proof-point band under the home-page hero. Renders
  `.trust-strip` with 4 short claims + inline SVG icons. **Deliberately not a card grid** — the
  reasoning in the code comment is that a card grid would read as marketing on a site whose entire
  positioning is that it doesn't do marketing.
- **Freshness ribbon** (`.freshness`, four state modifiers `--good --warn --muted --danger`) — the
  site's signature element. States are encoded by **color AND shape simultaneously**: solid dot
  (in-date/confirmed), half-filled dot (expected), hollow dot (historical), thick-ring dot (overdue).
  This is an accessibility fix, not decoration — do not revert to color-only. It appears on every
  seasonal/dated page (months, events, prices, closures).
- **Data tables** (`.data-table`, wrapped in `.table-wrap`) — sticky header, tabular numerals
  site-wide (`font-variant-numeric: tabular-nums`), zebra striping, and a **CSS-only scroll-edge
  shadow** (four-layer `background-attachment: local` trick, no JS) that shows when a table is
  cut off horizontally on mobile. This site has a lot of tables (heights, prices, comparisons) —
  respect this pattern rather than inventing a new table style.
- **Height Checker near-miss block** (`.nearmiss`, in `assets/js/height-checker.js`) — an accent-color
  callout showing which rides a child misses by ≤2 inches, sorted nearest-first. This was recently
  promoted from `.small.muted` (barely visible) to a first-class visual element because it is, by the
  team's own analysis, *the single most useful sentence the site can say to a parent*. Do not
  de-emphasize it in any redesign.

### Layout shell (`src/templates/layout.mjs`)

- `.site-header` — sticky, gains `[data-scrolled]` (border + backdrop blur) past 80px of scroll,
  via a passive, rAF-throttled listener in `app.js`.
- `.site-footer` — 4-column link grid (collapses to 2, then 1), unaffiliated disclaimer, copyright,
  and an image-credit line (`Illustrative imagery, AI-generated` — see §5).
- `<head>` conditionally emits `og:image`/`twitter:image` (`summary_large_image`) only when a real
  social-card image exists on disk; otherwise falls back to `twitter:card = summary` rather than
  advertising an image it can't deliver. Same pattern applies to the podcast `<link rel="alternate">`.

---

## 4. Legal / IP constraints — non-negotiable, apply to every visual asset

This is the single most important section for anyone doing visual work. Get any of this wrong and
the deliverable is unusable regardless of how good it looks.

1. **No Disney or Universal characters, logos, wordmarks, ride vehicles, monorails, or costumed
   characters**, in any generated image, icon, or illustration.
2. **No official park maps, traced or otherwise derived.** Maps must be built from OpenStreetMap /
   aerial data or drawn as original schematic diagrams. (Universal's four parks currently have **no
   authored `map.json` and no rendered PNG plates at all** — see §7. Any map work must be original.)
3. **No three-circle ("Mickey head") silhouettes** in any object — balloons, food, topiary, shadows.
   This is a specific, well-documented failure mode of image-generation models when asked for
   "theme park" imagery; check every generated image for it.
4. **No depiction of a castle resembling a real Disney/Universal castle silhouette.** If a castle
   appears in any generated art for this operator, it must be architecturally distinct.
5. **No recognisable real people or celebrity likenesses.**
6. **Character and ride names may be referenced factually in text** ("you'll pass Hagrid's Magical
   Creatures Motorbike Adventure") — this is nominative fair use. **Depicting them visually is not
   covered by the same protection.**
7. **The domain and brand name must never contain an operator trademark.** `hollywoodrideguide.com`
   and "Hollywood Ride Guide" satisfy this; do not propose a rename that reintroduces "Universal,"
   "Islands of Adventure," etc. into the brand identity itself (using park names in page *content* is
   fine and necessary).
8. **The unaffiliated disclaimer must remain visible on every page.** It currently lives in the
   footer (`site.legal.shortDisclaimer`, sourced from `data/universal/site.json`) and is echoed on
   the schematic map page. Do not remove or visually bury it in a redesign.
9. **FTC affiliate disclosure** must stay clear and conspicuous, **above the first affiliate link on
   each page** — not just in a footer. Check `src/templates/components.mjs`'s `affiliateBox()` if
   touching any page with affiliate content.

If your task involves generating any new imagery, the full art-direction brief and exact prompts are
in `docs/ASSET-RUNBOOK.md` — read it before generating anything, it encodes lessons learned from
actually doing this (e.g., why a stored "never depict X" instruction is weaker than positive
specificity for diffusion models).

---

## 5. The honesty architecture — why this site is built the way it is

Understanding this is what prevents a well-intentioned visual change from quietly breaking the
site's actual value proposition.

**Core premise:** every dated fact (crowd levels, prices, closures, event dates) carries a
**confidence level** (`confirmed` / `expected` / `historical`) and a **verification month**, and pages
past their review date show a banner that **cannot be suppressed from data** — it's computed at build
time against a fixed `BUILD_MONTH`, not the visitor's clock. This is why the freshness ribbon (§3)
exists and why its visual states must stay distinguishable by more than color.

**Corollary for this operator specifically:** Universal's content (attractions, heights, prices) was
authored by AI research agents rather than independently sourced the way Disney's was. That is
disclosed, not hidden — `docs/LAUNCH-UNIVERSAL.md` states plainly that *"a green fact check on
Universal is not the same claim as a green fact check on Disney."* Two specific numeric disagreements
between the data and its own (also AI-derived) reference tables are recorded, unresolved, in
`scripts/reference/universal.mjs` (`CONFLICTS` export) rather than silently edited away — because
editing either side to make them agree would destroy the only signal the two-source check produces.
**Do not resolve these as part of a visual task.** They require checking against the operator's
actual published figures, which is outside the scope of a design pass.

**Photography follows the same discipline.** Every photo slot (hero, social card) is declared in
`data/universal/site.json` under `photos`, but **declaring a slot does not make it real** —
`src/lib/data.mjs` checks whether the file actually exists on disk at build time, and resolves to
`null` if not, so the layout falls back gracefully (gradient hero, `summary`-type social card)
instead of a broken image. **Currently no photo files exist on disk for this operator at all** — only
a `README.md` sits in `assets/img/photos/`. This is not a bug to silently route around; it's the
intended degraded state, and any new asset must go through the same "prove it's real" pattern (see
`docs/ASSET-RUNBOOK.md` and `docs/ELEVENLABS-PROMPTS.md` for the parallel pattern applied to podcast
audio).

---

## 6. Content inventory (accurate as of this document)

```
4 parks, 2 resorts (Universal Orlando ×3 parks, Universal Hollywood ×1 park)
107 attractions documented → 62 with standalone pages
84 dining locations → 47 with standalone pages
158 tracked food items (Food Tracker tool)
11 guides, 10 comparison pages
Seasonal: 5 events, 12 months, 5 holidays, 5 price pages, 2 closure trackers
251 total rendered pages, 45.55 MB
0 audit problems (broken links, missing alt text, contrast failures, etc.)
```

Per-park attraction counts: Universal Studios Florida 31, Islands of Adventure 30, Epic Universe 21,
Universal Studios Hollywood 25.

**Tools** (interactive, client-JS, shared across both operators): Height Checker, Food Tracker, Trip
Timing ranker. All three are functional; **the Food Tracker and Trip Timing pages were deliberately
left unstyled during the last visual pass**, pending confirmation of the hero photography direction
(see §7) — they're a natural next target for a visual-polish pass.

**Queue product vocabulary:** the site never hardcodes "Lightning Lane" (that's Disney's product
name). Universal's equivalent is **Express Pass**, with tiers `multi-pass` → "Universal Express Pass,"
`single-pass` → "Universal Express Unlimited," `none` → "Standby only." This is resolved per-operator
in `src/lib/data.mjs` from `site.json`'s `queue` block. If a design surfaces queue-tier language
anywhere, it must go through this resolution, never a literal string.

---

## 7. Known gaps and blocking items — what a visual pass should and shouldn't touch

**In scope for a visual/front-end polish pass:**
- Food Tracker and Trip Timing page styling (deliberately deferred, noted above)
- General visual refinement of existing components, provided it stays within the token/class system
- Responsive/accessibility polish (contrast, focus states, `prefers-reduced-motion` coverage — audit
  these explicitly; the codebase takes them seriously and a regression here is a real defect)
- Placing real photography once supplied (see §5 — the pipeline already exists, files just need to
  land in `assets/img/photos/` at the documented naming convention)

**Not in scope / requires the site owner, not a design pass:**
- Resolving the two `CONFLICTS` entries in `scripts/reference/universal.mjs` (needs real-world
  verification, not visual judgment)
- Flipping `status: "draft"` → `"live"` in `data/operators.json` (a content-accuracy decision)
- Authoring `map.json` for any of the four parks (currently all four render a generic schematic
  fallback, per validator warnings — real map authoring is a data task, though an original,
  non-infringing map *illustration style* could reasonably be proposed as part of a visual brief)
- Generating actual photography or audio (external asset pipelines — see `docs/ASSET-RUNBOOK.md`)
- Rewriting park/attraction/pricing content

**Silent gaps worth knowing about, not necessarily worth fixing in a design pass:**
- No PNG map plates rendered for any of the 4 Universal parks (Playwright rendering step hasn't run)
- No `podcast` block configured in `data/universal/site.json` yet (Disney's podcast plumbing exists
  in code but Universal hasn't been wired to it)
- The brand accent color (`themeColor: "#1b3a5c"`) declared in `site.json` isn't yet reflected in the
  shared stylesheet's token system (see §3 note) — worth flagging even if out of scope to fix

---

## 8. How to verify your own work before calling it done

```bash
# From repo root:
node scripts/validate.mjs universal          # data still well-formed?
node scripts/factcheck.mjs universal          # still matches reference tables? (CONFLICTS notes are OK; new failures are not)
node src/build.mjs universal                  # renders cleanly, no exceptions
node scripts/audit.mjs universal              # crawls rendered HTML: broken links, missing alt, contrast, etc. — must report "No problems found"
node --test test/*.test.mjs                   # 88 tests as of this document — must all still pass

# If you touched anything in src/lib, src/templates, or assets/css/js — these are SHARED with the
# live Disney site. Also run:
node src/build.mjs disney && node scripts/audit.mjs disney
node --test test/*.test.mjs
```

A change is not complete until all of the above pass clean. If you cannot run these yourself (no
shell access), say so explicitly in your handoff and list exactly what a human needs to run before
merging — do not claim verification you didn't perform.

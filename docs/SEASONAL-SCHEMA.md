# Site 2 — Seasonal Data Contract

**Park Season Guide** (`parkseason.guide`) is the sister site to Ride Ready Guide. It owns every
topic Site 1 refuses to carry, for one reason: those topics have a shelf life, and a page that goes
stale silently is worse than no page at all.

This document is binding. `scripts/validate-seasonal.mjs` enforces it and the build fails on a
violation. Read it before authoring a single JSON file.

> **Independent and unofficial.** Not affiliated with, endorsed by, or sponsored by The Walt Disney
> Company. Event, park, and restaurant names are used for identification and editorial commentary
> only. No logos, character art, official artwork, or official maps appear anywhere on either site.

---

## 1. Why this site exists, and what it is allowed to say

Site 1 answers *"how tall must my kid be to ride Space Mountain"* — a fact that will be true in
2031. Site 2 answers *"is Mickey's Not-So-Scary worth $199 this year"* — a fact with a half-life of
about nine months.

Two sites, two domains, because mixing them damages both: seasonal churn dilutes the evergreen
site's topical authority, and evergreen stability makes a seasonal site look abandoned.

### The honesty problem, and the structural answer

A seasonal site is one long temptation to publish dates it has not verified. Every competitor does
it. It is why every result for "Disney World Christmas party dates" is either a stale 2024 page or a
page confidently asserting dates nobody announced.

**We do not guess, and we do not hide that we are not guessing.** Every dated claim carries a
`freshness` block, the confidence level is rendered on the page, and the build computes staleness
rather than trusting the author to remember.

This is the site's actual product. The events are commodity information; *knowing which parts are
confirmed* is not.

### The three confidence levels

| Level | Means | Renders as | Allowed to state |
|---|---|---|---|
| `confirmed` | Officially announced by the operator, with a `sourceNote` naming the announcement | green ribbon, "Confirmed" | Exact dates, exact prices |
| `expected` | Not announced, but the pattern is strong enough to plan around (≥3 consecutive years) | amber ribbon, "Expected — not yet announced" | Windows and ranges only. **Never an exact date.** |
| `historical` | Last cycle's facts, this cycle unannounced or unclear | grey ribbon, "Last confirmed cycle" | Prior-year figures, explicitly labelled with their year |

A `confirmed` entry with no `sourceNote` is a validation error. An `expected` or `historical` entry
carrying an exact single-day date in a price or date field is a validation error — the fact checker
greps for it.

### Scope boundary (mirror of Site 1's)

Site 2 owns: party nights and hard-ticket events, festivals, seasonal overlays and menus,
current pricing (Lightning Lane, tickets, parking, passes), refurbishment and closure trackers,
crowd and weather timing, "when to go" verdicts.

Site 2 does **not** own: height requirements, permanent ride facts, accessibility mechanics,
permanent dining, park maps. Those live on Site 1 and Site 2 links to them. **One canonical owner
per topic, contextual links, never duplicated blocks** — in both directions.

Every Site 2 page that touches a permanent fact must link to the Site 1 page that owns it, via
`crossLinks`. The validator requires at least one on every event and month page.

---

## 2. Repository layout

Site 2 reuses Site 1's `src/lib/` and `src/templates/` **verbatim**. The layout is already
parameterised by a `site` object, so a second brand needs no template fork.

```
data/seasonal/
  site.json                    brand, nav, legal, affiliates for Site 2
  events/<slug>.json           one per recurring event  (the pattern page + its editions)
  months/<month>.json          one per month, 01–12     (when-to-go)
  holidays/<slug>.json         cross-resort holiday hubs
  prices/<slug>.json           what things cost, dated
  closures/<resort>.json       refurbishment tracker per resort
  calendar.json                the year-at-a-glance timeline
src/
  lib/seasonal-data.mjs        loader + derived indexes + urls  (mirrors lib/data.mjs)
  lib/staleness.mjs            the freshness contract, computed at build time
  seasonal/*.mjs               page modules
  build-seasonal.mjs           orchestrator → dist-seasonal/
scripts/
  validate-seasonal.mjs        enforces this document
  factcheck-seasonal.mjs       asserts against the reference tables in §7
  audit-seasonal.mjs           post-build QA
```

Output goes to `dist-seasonal/`. Two Vercel projects, one repo, different build commands — see
`docs/LAUNCH-SEASONAL.md`.

---

## 3. The `freshness` block

Every file that makes a dated claim carries one. There is no default and no optional form.

```jsonc
"freshness": {
  "verified": "2026-07",              // YYYY-MM. When a human last checked. Required.
  "confidence": "expected",           // confirmed | expected | historical. Required.
  "sourceNote": "2025 dates ran 15 Aug – 31 Oct across 38 nights; 2026 dates not announced as of July 2026.",
  "reviewBy": "2026-09",              // YYYY-MM. When this MUST be re-checked. Required.
  "cycle": "annual"                   // annual | rolling | one-off. Required.
}
```

Rules the validator enforces:

- `verified` and `reviewBy` match `^\d{4}-(0[1-9]|1[0-2])$`, and `reviewBy > verified`.
- `confidence: "confirmed"` requires a `sourceNote` of at least 30 characters.
- `reviewBy` may not be more than 18 months after `verified` — a fact nobody rechecks for two years
  is not being maintained, it is being abandoned.
- `cycle: "annual"` requires the event to declare a `typicalWindow` (§4), because the window is what
  stays true when the dates do not.

### Computed staleness

`src/lib/staleness.mjs` compares `reviewBy` against `BUILD_MONTH` and returns one of:

| State | Condition | Page behaviour |
|---|---|---|
| `fresh` | `reviewBy` is in the future | Normal ribbon |
| `due` | `reviewBy` is the current month | Normal ribbon; audit warns |
| `stale` | `reviewBy` has passed | **Automatic banner** above the content: "Some details on this page are past their review date." Page drops out of the sitemap's high-priority band and loses its `Event` JSON-LD `offers` block. |

The banner is not authored and cannot be suppressed from JSON. That is the point: the failure mode
of every seasonal site is a page that looks current and is not, and an author who forgot is exactly
the case the automation exists to catch.

---

## 4. `events/<slug>.json`

The **pattern page** is canonical. Editions are subordinate and optional.

```jsonc
{
  "slug": "mickeys-not-so-scary-halloween-party",
  "name": "Mickey's Not-So-Scary Halloween Party",
  "shortName": "Not-So-Scary",
  "resort": "walt-disney-world",              // walt-disney-world | disneyland | both
  "parkSlug": "magic-kingdom",                // must resolve in Site 1's dataset, or null
  "category": "hard-ticket",                  // hard-ticket | festival | overlay | after-hours | run
  "season": "halloween",                      // halloween | holidays | spring | summer | lunar-new-year | year-round
  "summary": "One-sentence answer, ≥ 80 chars. Leads with the verdict, not the history.",
  "h1": "Mickey's Not-So-Scary Halloween Party: what it is and whether it's worth it",
  "title": "Mickey's Not-So-Scary Halloween Party",
  "titleTail": ": Dates, Prices & Verdict",
  "description": "Meta description, 120–160 chars.",

  "typicalWindow": {
    "startsAround": "mid-August",             // prose, never an exact date
    "endsAround": "1 November",
    "nightsTypical": 38,
    "nightsRange": [30, 40],
    "daysOfWeek": ["Sun", "Tue", "Wed", "Thu", "Fri"],
    "hours": "19:00 – 00:00, with park entry from 16:00"
  },

  "pricing": {
    "model": "per-night",                     // per-night | per-day | add-on | included
    "rangeUsd": [119, 219],                   // ALWAYS a range on this site.
                                              // When model is "included" the event runs on normal
                                              // admission, and this range describes what a visitor
                                              // typically SPENDS inside it (festival food), not what
                                              // it costs to attend. The renderer checks `model`
                                              // before reading the range and labels it accordingly —
                                              // never present an included overlay as ticketed.
    "asOf": "2025 season",                    // the cycle the range describes — required
    "cheapestNights": "Early-season Sunday and Tuesday nights",
    "priciestNights": "The last three Fridays before Halloween",
    "notes": ["Tax additional.", "Annual Passholder and DVC discounts appear on select early nights."]
  },

  "whatYouGet": [ "…" ],                      // ≥ 4 concrete items
  "whatYouDont": [ "…" ],                     // ≥ 2. The bit competitors omit.
  "verdict": {
    "short": "≤ 200 chars. Commit to an answer.",
    "worthItIf": [ "…" ],                     // ≥ 3
    "skipIf": [ "…" ]                         // ≥ 3
  },

  "strategy": [ { "heading": "…", "body": ["…"] } ],   // ≥ 3 sections
  "food": {                                   // optional; festival events should have it
    "note": "…",
    "items": [ { "name": "…", "where": "…", "priceUsd": 7.5, "verdict": "…" } ]
  },
  "faqs": [ { "q": "…", "a": "…" } ],         // ≥ 4

  "crossLinks": [                             // ≥ 1 REQUIRED. Absolute Site 1 URLs.
    { "label": "Magic Kingdom ride list", "href": "/walt-disney-world/magic-kingdom/rides/", "site": 1 }
  ],
  "related": ["mickeys-very-merry-christmas-party"],   // slugs within Site 2

  "editions": [                               // optional, newest first
    {
      "year": 2026,
      "status": "announced",                  // announced | expected | past | cancelled
      "dates": "15 August – 31 October 2026", // prose. Only when status = announced.
      "startDate": "2026-08-15",              // ISO. Only when status = announced. Required for the
      "endDate": "2026-10-31",                //   Event rich result; omit and the page falls back to
                                              //   Article, which is correct rather than a bug.
      "nights": 38,
      "priceRangeUsd": [129, 229],
      "changes": ["What is different this year"],
      "freshness": { … }                      // editions carry their OWN freshness block
    }
  ],

  "freshness": { … }
}
```

**Validator rules**

- `parkSlug`, when non-null, must resolve against Site 1's `data/parks/`. This is the load-bearing
  cross-site integrity check.
- Every `crossLinks[].href` must resolve to a real Site 1 URL. The validator builds Site 1's URL set
  and checks membership — a broken cross-link is a build failure, not a warning, because
  cross-linking is the entire strategic purpose of having two sites.
- `pricing.rangeUsd` must be `[low, high]` with `low < high`. A single fixed price is a validation
  error regardless of confidence — prices vary by night everywhere on this site.
- `editions[].status: "announced"` requires the edition's own `freshness.confidence === "confirmed"`.
- `editions[].dates` is forbidden unless `status === "announced"`.
- `whatYouDont` may not be empty. A page that only lists upsides is marketing.

---

## 5. `months/<month>.json`

Twelve files, `01.json` … `12.json`. One canonical owner per month — there is deliberately **no**
parallel `/calendar/<month>/` tree, because two pages competing for "Disney World in March" is how
a site cannibalises itself.

```jsonc
{
  "month": 3,
  "name": "March",
  "slug": "march",
  "summary": "≥ 80 chars, leads with the verdict.",
  "verdict": {
    "grade": "B-",                            // A+ … F. Committed, not hedged.
    "short": "≤ 200 chars",
    "bestFor": ["…"], "worstFor": ["…"]
  },
  "crowds": {
    "level": "high",                          // low | moderate | high | peak
    "shape": "Spring break staggers by school district, so the whole month runs busy…",
    "peakWindows": ["The two weeks around Easter, wherever it falls"],
    "quietWindows": ["The first full week, before most districts break"]
  },
  "weather": {
    "wdw": { "highF": 79, "lowF": 57, "rainDays": 7, "note": "…" },
    "dlr": { "highF": 70, "lowF": 51, "rainDays": 6, "note": "…" }
  },
  "cost": { "level": "high", "note": "…" },   // low | moderate | high | peak
  "whatsOn": ["event-slug", "…"],             // must resolve to events/<slug>.json
  "planningNotes": [ { "heading": "…", "body": ["…"] } ],   // ≥ 2
  "crossLinks": [ … ],                        // ≥ 1
  "freshness": { … }
}
```

Weather figures are climate normals, not forecasts, and are labelled as such in the UI. They are the
only numbers on Site 2 that do not decay, which is why they carry `cycle: "rolling"` and a long
`reviewBy`.

---

## 6. Other files

### `holidays/<slug>.json`
Cross-resort hubs — `halloween`, `christmas-and-holidays`, `new-years-eve`,
`spring-break-and-easter`, `summer`. Shape: `summary`, `h1`, `sections[]`, `byResort` (WDW/DLR
breakdown, each naming its events), `crossLinks`, `faqs`, `freshness`.

### `prices/<slug>.json`
`lightning-lane`, `park-tickets`, `parking-and-transportation`, `dining-plans`, `annual-passes`.
Every figure is a **range** with an `asOf`. Shape: `rows[]` of
`{ label, resort, rangeUsd, asOf, note }`, plus `sections[]`, `howToSave[]`, `crossLinks`,
`freshness`. Fixed single prices are a validation error, without exception.

### `closures/<resort>.json`
`{ resort, items[] }` where each item is
`{ name, parkSlug, attractionSlug, status, since, reopening, reopeningConfidence, note }`.
`attractionSlug` must resolve in Site 1's dataset for that park — the tracker is worthless if it
lists rides that do not exist. `reopening` is prose ("late 2026"), never a fixed date, unless
`reopeningConfidence === "confirmed"`.

### `calendar.json`
The year-at-a-glance timeline: `{ bands[] }` where each band is
`{ eventSlug, startMonth, endMonth, resort, confidence }`. Every `eventSlug` must resolve. Bands are
rendered as a CSS-grid Gantt, no library.

---

## 7. Verified reference tables — July 2026

`scripts/factcheck-seasonal.mjs` hard-codes these. As on Site 1, the duplication is deliberate:
checking the dataset against itself proves nothing. This table is a second source of truth that has
to be edited deliberately, in the same commit, when reality changes.

### 7.1 Event → park → resort (must match exactly)

| Event | Resort | Park | Category |
|---|---|---|---|
| Mickey's Not-So-Scary Halloween Party | WDW | Magic Kingdom | hard-ticket |
| Mickey's Very Merry Christmas Party | WDW | Magic Kingdom | hard-ticket |
| Disney Jollywood Nights | WDW | Hollywood Studios | hard-ticket |
| EPCOT International Food & Wine Festival | WDW | EPCOT | festival |
| EPCOT International Festival of the Arts | WDW | EPCOT | festival |
| EPCOT International Flower & Garden Festival | WDW | EPCOT | festival |
| EPCOT International Festival of the Holidays | WDW | EPCOT | festival |
| Disney After Hours | WDW | *(varies)* | after-hours |
| Oogie Boogie Bash | DLR | Disney California Adventure | hard-ticket |
| Halloween Time at the Disneyland Resort | DLR | *(both parks)* | overlay |
| Holidays at the Disneyland Resort | DLR | *(both parks)* | overlay |
| Lunar New Year | DLR | Disney California Adventure | festival |
| Disney California Adventure Food & Wine Festival | DLR | Disney California Adventure | festival |
| Disneyland After Dark | DLR | *(varies)* | after-hours |

Wrong park assignment is the single most common error in this content area — Oogie Boogie Bash is
**not** at Disneyland Park, and Jollywood Nights is **not** at EPCOT. Both are hard failures.

### 7.2 Typical windows (pattern, not dates)

| Event | Typical window | Typical nights/days |
|---|---|---|
| Not-So-Scary | mid-August → 1 November | 30–40 nights |
| Very Merry | early November → shortly before Christmas | 20–26 nights |
| Jollywood Nights | mid-November → late December | 8–14 nights |
| Food & Wine (EPCOT) | late July/August → mid-November | ~100+ days |
| Festival of the Arts | mid-January → late February | ~45 days |
| Flower & Garden | late February/early March → early July | ~100 days |
| Festival of the Holidays | mid-November → 30 December | ~45 days |
| Oogie Boogie Bash | early/mid-August → 31 October | 25–30 nights |
| Halloween Time (DLR) | late August → 31 October | daytime, whole window |
| Holidays (DLR) | mid-November → early/mid-January | daytime, whole window |
| Lunar New Year (DCA) | mid-January → mid-February | ~30 days |
| DCA Food & Wine | late February/March → late April | ~60 days |

### 7.3 Price bands (as-of cycle stated on every page)

| Item | Range (USD, pre-tax) | As of |
|---|---|---|
| Not-So-Scary, per night | 119 – 219 | 2025 season |
| Very Merry, per night | 169 – 219 | 2025 season |
| Jollywood Nights, per night | 159 – 209 | 2025 season |
| Oogie Boogie Bash, per night | 154 – 224 | 2025 season |
| Disney After Hours, per night | 139 – 209 | 2025 season |
| Festival food item (EPCOT) | 5 – 13 | July 2026 |
| Festival food item (DCA) | 6 – 15 | July 2026 |
| Lightning Lane Multi Pass, WDW, per day | 15 – 45 | July 2026 |
| Lightning Lane Single Pass, WDW, per ride | 12 – 27 | July 2026 |
| Lightning Lane Multi Pass, DLR, per day | 30 – 45 | July 2026 |
| Standard parking, WDW theme park | 30 | July 2026 |
| Standard parking, DLR | 35 – 40 | July 2026 |

### 7.4 Hard rules the fact checker enforces

1. **No exact future dates.** Any `YYYY-MM-DD`, or a day-and-month pair in a field belonging to an
   entry whose confidence is not `confirmed`, fails. Prose windows ("mid-August") are required
   instead.
2. **No fixed prices.** Every monetary claim is a range with an `asOf`. A lone `$` figure outside a
   `rangeUsd` pair fails, except in `food.items[].priceUsd` where a single verified item price is
   the correct shape.
3. **No Site 1 duplication.** Height requirements, permanent ride facts, and accessibility mechanics
   may not be restated. The checker greps for `inches tall`, `must be \d+"`, `height requirement`
   outside a `crossLinks` label and fails.
4. **Park assignment** must match §7.1.
5. **Marketing filler** — same needle list as Site 1's `scripts/factcheck.mjs`, plus seasonal-
   specific offenders: "magical memories", "not to be missed", "something for everyone",
   "a feast for the senses", "sure to delight".
6. **Paragraph openers** — "Whether you…", "From … to …," and "Looking for…" are rejected as the
   tell of generated travel copy.

---

## 8. Prose standards

Identical to Site 1, restated because it is what separates this from the competition:

- Lead with the answer. The first sentence of every section states the conclusion; the rest
  supports it. Never build to a reveal.
- Commit to verdicts. "It depends" is only acceptable when followed immediately by the two or three
  cases it depends on, each answered.
- Second person, present tense, no exclamation marks, no rhetorical questions as headings.
- Say the unflattering thing. `whatYouDont` and `skipIf` exist because a guide that never says
  "skip this" is an advertisement.
- British-English spelling in prose is **not** used — this is a US-audience site; use US spelling in
  all reader-facing copy. Code comments follow the existing house style.
- Never claim to have attended an event we did not attend. Write from documented fact and stated
  reasoning, and let the freshness ribbon carry the provenance.

---

## 9. What "done" means

A file is done when:

1. `node scripts/validate-seasonal.mjs` passes.
2. `node scripts/factcheck-seasonal.mjs` passes.
3. Every `crossLinks` entry resolves against Site 1's live URL set.
4. The `freshness.confidence` level honestly describes what we actually know, and `sourceNote` says
   what a reader would need to know to judge it themselves.
5. Nothing on the page would embarrass us if the reader also opened the operator's official page in
   the next tab.

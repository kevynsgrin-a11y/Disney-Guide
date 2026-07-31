# Maintenance runbook

Roughly **2–5 hours a week** keeps this site accurate. Most of that is verification, not writing.
The build is designed so that a single correction propagates everywhere it appears, which is what
makes the small time budget realistic.

---

## The weekly loop

| Cadence | Task | Where |
|---|---|---|
| Weekly | Scan the fan trackers for height changes, ride closures, and reopenings | `data/<operator>/parks/*/attractions.json` |
| Weekly | Spot-check 5–10 snack prices against a recent source; re-stamp `priceVerified` | `data/<operator>/parks/*/food.json` |
| Monthly | Re-read the Lightning Lane guide against current mechanics (not prices) | `data/guides/lightning-lane.json` |
| Monthly | Roll `lastVerified` forward on anything actually re-checked — **never on anything you did not** | everywhere |
| Quarterly | Re-read the accessibility guide; DAS policy moves | `data/guides/disability-access-service.json` |
| Quarterly | Re-check construction wording; drop anything that has opened into the live dataset | park intros, land copy |
| On any change | `npm run build && npm run audit:site` | — |

**The one rule that matters:** a `lastVerified` date is a promise that a human checked that field in
that month. Bumping dates without checking is worse than a stale date, because a stale date is
honest and a false one is not.

---

## What triggers an edit

### A height requirement changed
1. Update `heightIn` in the park's `attractions.json` and bump that attraction's `lastVerified`.
2. Update `stats.ridesWithHeightRequirements` and `stats.tallestRequirement` in `park.json` if the
   change moved either. The validator will tell you if you forgot.
3. Update the verified table in `docs/DATA-SCHEMA.md` — it is the reference future edits are checked
   against, so letting it go stale poisons everything downstream.
4. Check `data/guides/height-requirements.json` for a hand-written mention. The generated appendix on
   that page updates itself; the authored prose does not.

That single edit updates the ride page, the ride list, the park height chart, the resort height
table, the cross-park master table, the height checker, and the search index.

### An attraction closed
Do **not** delete it. Closed attractions are high-volume search terms, and removing the page is how
a guide site quietly becomes useless.

```jsonc
"status": "closed",
"closedNote": "Closed February 2, 2026 to make way for Tropical Americas.",
"standalonePage": false   // unless the closure is itself a major search topic
```

Then mention it factually in the land's `description` in `park.json`, and check whether any
comparison page still credits the park with it.

### An attraction opened
1. Add the full entry to `attractions.json` with `status: "open"`.
2. Decide `tier` and `standalonePage`. Headliners always get a page; keep the per-park standalone
   count in the 14–20 band.
3. Add it to `map.json` markers.
4. Update `park.json → stats.attractionCount`.
5. Remove the "under construction" framing from the land copy and the park intro.

### A price moved
Update `price` and `priceVerified` together, in the same edit, every time. A price without a fresh
date is not a correction.

### Lightning Lane mechanics changed
Only the mechanics belong here — tiers, booking windows, what is included, which attractions use
which pass. Live prices do not. Ranges get an explicit "as of [month]" and live figures stay on the
seasonal site.

---

## What does NOT belong on this site

Everything below changes on a scale of weeks. Putting it on an evergreen page means publishing
something that is wrong most of the year:

- Party nights, festivals, and their menus
- Seasonal ride overlays (describe the permanent version, set `hasSeasonalOverlay: true`)
- Today's Lightning Lane price
- Refurbishment schedules and construction progress
- Limited-time menu items and merchandise
- Crowd calendars and park hours

Where a topic straddles the line, this site owns the permanent version and links out. One canonical
owner per topic, contextual links, never a duplicated block — duplicating text across two sites is
how both of them lose.

---

## Sources, ranked by how much they should be trusted

1. **Disney's own site and apps** — `disneyworld.disney.go.com`, `disneyland.disney.go.com`.
   Authoritative for heights, closures, accessibility provisions, and ride mechanics. Note that
   menus show only price tiers, not exact prices, and the pages are JS-rendered.
2. **Independent trackers** — AllEars maintains the most complete independently-verified menu
   database with month-stamped updates; Disney Food Blog and Mickey Visit publish weekly menu-change
   roundups; TouringPlans is good on wait-time behaviour. Use these for prices, and date what you
   take.
3. **Aerial and permit watchers** — useful for construction, but their timelines are inference.
   Anything from here is an estimate and must be worded as one.

Where sources conflict — and on snack prices they routinely do — take the most recently verifiable
figure and stamp the month. Do not average them.

---

## Adding a park or a whole content type

The data contract is in `docs/DATA-SCHEMA.md` and the validator enforces it. To add a park:

1. Add its slug to `PARK_ORDER` in `src/lib/data.mjs` and to `PARKS` in `scripts/validate.mjs`.
2. Add it to the right resort's `parks` array in `data/site.json`.
3. Create `data/<operator>/parks/<slug>/` with the four required files plus `map.json`.
4. `npm run build` — every hub, index, sitemap entry, search entry, and tool payload picks it up
   with no further code changes.

Adding a new guide or comparison page is just a new JSON file in `data/guides/` or `data/compare/`.
Both indexes are generated.

---

## Before you ship a change

```bash
npm run build        # validate + render; fails on any schema or referential error
npm run audit:site   # broken links, duplicate titles, missing H1s, malformed JSON-LD, missing disclaimers
npm run serve        # eyeball it
```

The audit exists because the validator cannot see rendered output. It catches the class of mistake
that only appears once pages exist — a link to a page you renamed, two pages that ended up with the
same title, a JSON-LD block that stopped parsing.

---

## Editorial guardrails the code enforces for you

You cannot render an affiliate link without the FTC disclosure above it — `affiliateBox()` emits
both or neither. The unaffiliated disclaimer is in the global footer and the audit fails the build
if any page loses it. `lastVerified` is required by the validator on every park, attraction,
restaurant, guide, and comparison. Prices without a verification month are rejected.

These are deliberate. They are the promises the site makes on every page, and they should not
depend on anyone remembering to keep them.

# Launching Site 2 — Park Season Guide

Site 1 (Ride Ready Guide) and Site 2 (Park Season Guide) share one repository, one generator, one
component library, and one stylesheet. They are two **separate deployments to two separate domains**,
because mixing evergreen and seasonal content damages both: churn dilutes topical authority, and
stability makes a seasonal site look abandoned.

```bash
npm run build:seasonal      # validate → factcheck → render dist-seasonal/
npm run serve:seasonal      # preview at http://localhost:4321
npm run audit:seasonal      # post-build QA
npm run check:seasonal      # tests + build + audit, the full gate
npm run check:all           # both sites, everything
```

---

## Hosting: the one genuine complication

**`vercel.json` lives at the repository root and Vercel reads exactly one of them per project.** Ours
pins `buildCommand: npm run build` and `outputDirectory: dist` — Site 1. A second Vercel project
importing the same repository would read the same file and build Site 1 again under a second domain.

There are three ways out, in order of preference:

### 1. Site 1 on Vercel, Site 2 on Cloudflare Pages (recommended)

The build already emits `dist-seasonal/_headers` and `dist-seasonal/_redirects` in Cloudflare format.
Nothing conflicts, nothing needs editing, and Pages handles two projects from one repository cleanly.

| Setting | Value |
|---|---|
| Build command | `npm run build:seasonal` |
| Output directory | `dist-seasonal` |
| Node version | 20 or newer |

### 2. Both on Cloudflare Pages

Two projects, same repository, different build commands. `dist/_headers` and `dist/_redirects` are
already emitted for Site 1 too. This is the simplest setup overall.

### 3. Both on Vercel

Delete `buildCommand` and `outputDirectory` from the root `vercel.json` and set them per project in
each project's dashboard instead. The headers and redirects in that file still apply to both, which
is fine — they are identical policies. Note that doing this gives up Site 1's current zero-config
import, so only take this route if you specifically want both sites on Vercel.

Do **not** try to solve this with a second `vercel-seasonal.json`. Vercel will not read it.

---

## Before going live

1. **Register `parkseason.guide`** (or your chosen name) and set `data/seasonal/site.json →
   brand.domain` and `brand.origin`. Every canonical URL, `og:url`, sitemap entry, and JSON-LD `@id`
   derives from that one value.
2. **Set `brand.sisterSite.origin`** to Site 1's real domain, and set Site 1's
   `data/site.json → brand.origin` to match. `src/lib/seasonal-data.mjs` asserts these agree and the
   build fails loudly if they drift — every cross-link on Site 2 depends on it.
3. **Have an IP attorney review** `/privacy/`, `/terms/`, `/affiliate-disclosure/` and the
   nominative-fair-use position. The copy is written carefully and is not legal advice.
4. **Put a real correction route on `/contact/`.** A site whose entire pitch is "we say what we
   actually know" needs a working way to be told it got something wrong.
5. **Wire a consent management platform** before any advertising or analytics ships.
6. **Submit both sitemaps** and verify both properties. Cross-domain internal linking is the whole
   strategy; search needs to see both sides of it.

---

## Bumping the build month — the one recurring maintenance task

`src/lib/staleness.mjs` exports `BUILD_MONTH`. It is a constant, not `new Date()`, deliberately: a
build that read the system clock would change its own output between two runs of the same commit, so
a page could go stale in production with no diff, no review, and nothing for the audit to catch.

The monthly (or quarterly) routine is:

```bash
# 1. Bump the constant
#    src/lib/staleness.mjs → export const BUILD_MONTH = '2026-08'

# 2. See what just went stale
npm run build:seasonal
#    → "N pages past review, demoted in the sitemap"

npm run audit:seasonal
#    → lists every page now carrying a staleness banner
```

Then work the list: re-verify each page's facts, update `freshness.verified` and `freshness.reviewBy`,
and — where an operator has now announced something — promote `confidence` from `expected` to
`confirmed` and add the `sourceNote` naming the announcement.

**The banner cannot be switched off from JSON.** That is the point. An author who forgot to re-check
is exactly the case the automation exists for, so there is no data field that suppresses it.

### Promoting an edition to confirmed

When dates are actually announced:

```jsonc
{
  "year": 2026,
  "status": "announced",
  "dates": "14 August – 31 October 2026",
  "startDate": "2026-08-14",          // ISO, required for the Event rich result
  "endDate": "2026-10-31",
  "nights": 38,
  "priceRangeUsd": [129, 229],
  "freshness": {
    "verified": "2026-08",
    "confidence": "confirmed",         // required for status: "announced"
    "sourceNote": "Dates and pricing published on the operator's own events page, 12 August 2026.",
    "reviewBy": "2026-11",
    "cycle": "annual"
  }
}
```

The validator enforces the pairing: `status: "announced"` without `confidence: "confirmed"` fails,
and `dates` on anything other than an announced edition fails. Only then does the page emit a real
`Event` node with `startDate` — until then it publishes as an `Article` about a recurring event,
which is what it honestly is.

---

## What the two sites owe each other

**One canonical owner per topic, in both directions.** Site 1's `seasonalHandoff()` component links
here; Site 2's `evergreenLinks()` links back. Neither duplicates the other's blocks.

| Topic | Owner |
|---|---|
| Height requirements, ride mechanics, accessibility, park maps, permanent dining | Site 1 |
| Party nights, festivals, overlays, current pricing, closures, when-to-go | Site 2 |
| How Lightning Lane *works* | Site 1 |
| What Lightning Lane *costs* | Site 2 |

Both validators enforce the boundary. Site 1's fact checker fails on seasonal needles; Site 2's fails
on permanent ones. A topic that drifts onto the wrong site breaks a build rather than quietly
creating a second owner that will diverge.

`scripts/validate-seasonal.mjs` resolves every `crossLinks` href against Site 1's live URL set, built
from Site 1's own `urls` builders. A route renamed on Site 1 fails Site 2's build — which is the
correct direction for that failure to travel.

---

## What is deliberately not built yet

- **Per-park event pages.** `/events/<slug>/` covers the event; a `/walt-disney-world/magic-kingdom/`
  seasonal hub would compete with Site 1's park hub for the same query. Revisit only if search data
  says otherwise.
- **A live crowd calendar.** Day-level crowd prediction needs a data feed and is a different product
  with different maintenance economics. The month pages state windows, which is what a planner can
  actually act on.
- **Photography.** Same constraint as Site 1: self-shot, Creative Commons, or licensed only. No
  official artwork, no character art, no logos.
- **Historical archives** (`/events/<slug>/2024/`). Cheap to add once two or three cycles have
  accumulated, and worth it then — a page showing three years of price movement is a genuinely
  defensible asset. Not worth it with one.

# Maintaining the dated half

Most of this site does not move. Heights, ride mechanics, accessibility, and park layout are true
this year and next. The pages under `data/seasonal/` are the exception: events, prices, closures and
month verdicts all decay, and this is the routine that keeps them honest.

The contract they are authored against is `docs/SEASONAL-SCHEMA.md`. This file is the operating
manual for it.

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
npm run build
#    → "N pages past review, demoted in the sitemap"

npm run audit:site
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

---

## One canonical owner per topic

The site carries permanent and dated content, and exactly one of them owns any given fact.

| Topic | Owner |
|---|---|
| Height requirements, ride mechanics, accessibility, park maps, permanent dining | `data/` |
| Party nights, festivals, overlays, current pricing, closures, when-to-go | `data/seasonal/` |
| How Lightning Lane *works* | `data/` |
| What Lightning Lane *costs* | `data/seasonal/` |

Both fact checkers enforce the boundary. `scripts/factcheck.mjs` fails on seasonal needles appearing
on an evergreen page; `scripts/factcheck-seasonal.mjs` fails on permanent facts being restated on a
dated one. A topic that drifts across the line breaks a build rather than quietly creating a second
owner that will diverge from the first.

`scripts/validate-seasonal.mjs` resolves every `crossLinks` href against the URL set the evergreen
half actually generates, and every nav href against the URL set the whole site generates. A route
renamed anywhere fails the build — which is the correct direction for that failure to travel.

---

## What is deliberately not built

- **A live crowd calendar.** Day-level crowd prediction needs a data feed and is a different product
  with different maintenance economics. The month pages state windows, which is what a planner can
  act on.
- **Historical archives** (`/events/<slug>/2024/`). Cheap to add once two or three cycles have
  accumulated, and worth it then — a page showing three years of price movement is a genuinely
  defensible asset. Not worth it with one.
- **Photography.** Self-shot, Creative Commons, or licensed only. No official artwork, no character
  art, no logos.

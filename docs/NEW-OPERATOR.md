# Onboarding a new operator

Each operator in `data/operators.json` is a complete, independently-branded site on its own domain.
They share this repository's generator, component library, tools, and gates — and nothing else.

Adding one is a content exercise. No file under `src/` should need editing; if one does, that is a
generalisation bug worth fixing rather than working around.

---

## The nine steps

### 1. Register it

`data/operators.json`:

```jsonc
{ "slug": "universal", "name": "Universal Destinations", "dir": "universal", "status": "draft" }
```

`slug` is the build target and the `dist/` subdirectory. `dir` is the data subtree, and defaults to
the slug — they only differ if you want them to.

**`status` is load-bearing.** `"draft"` means the operator is never gated by default and never built
by default, but is always selectable by name:

```bash
npm run check                  # live operators only, and it says which drafts it skipped
node src/build.mjs universal   # that one, whatever its status
```

Register the operator as a draft on day one and leave it there. It keeps a half-written site out of
`dist/` and off the live site's CI while you work, and the flag is what you flip — deliberately, once
the launch checklist clears — to say the data is ready to be believed.

### 2. Create the tree

```
data/universal/
  site.json
  parks/<slug>/park.json          + attractions.json, dining.json, food.json, map.json, best-rides.json
  guides/<slug>.json
  compare/<slug>.json
  seasonal/                       events, months, holidays, prices, closures, calendar.json
```

### 3. Write `site.json`

Same shape as `data/disney/site.json`. The load-bearing fields:

| Field | Why it matters |
|---|---|
| `brand.origin` | Every canonical URL, `og:url`, sitemap entry and JSON-LD `@id` derives from it |
| `brand.name` · `logoMark` · `themeColor` | The site's identity — no operator trademark in any of them |
| `resorts[].parks` | **This is the park order.** Nothing else declares it. It also generates the legacy `/park-slug` redirects and the resort keys the seasonal validator accepts |
| `queue` | The paid queue-skipping product. See below — getting this wrong makes the site speak a competitor's vocabulary |
| `nav.primary` · `nav.footer` | Validated against the URL set the site actually builds |
| `legal.*` | Five keys, including `affiliateDisclosure` — `affiliateBox()` renders an empty disclosure without it |
| `affiliates` | Same key set the page modules already pass to `affiliateBox()` |

#### The `queue` block

Every major operator sells a paid line-skipping product and every one of them calls it something
else. The *field values* on an attraction are operator-neutral — it is covered, or it is not — but the
product's name is not, and a component that hardcodes one is wrong on every other site.

```jsonc
"queue": {
  "name": "Express Pass",              // how prose refers to the product
  "guideSlug": "express-pass",         // /guides/<slug>/ — the fact checker locates the page by this
  "labels": {                          // rendered wherever an attraction states its tier
    "multi-pass":  "Universal Express Pass",
    "single-pass": "Universal Express Unlimited",
    "none":        "Standby only"
  },
  "short": {                           // the same thing, for tables and badges
    "multi-pass":  "Express",
    "single-pass": "Express Unlimited",
    "none":        "Standby"
  }
}
```

Labels resolve onto each attraction at load time, so components render a resolved string and stay
ignorant of who sells what. The `multi-pass` / `single-pass` / `none` keys are the schema's enum and
do not change per operator; only what they are *called* does.

`guideSlug` also names a page you must write. It is the most price-sensitive page on the site and the
first one to go stale, which is why the fact checker asserts claims against it.

**The domain must not contain the operator's trademark.** Nominative fair use covers page content and
URL paths; a domain functions as a source identifier and is analysed differently. See the Brand
section of the README.

### 4. Give each park an `idPrefix`

`park.json` carries it, and every food id in that park must start with it (`mk-dole-whip`). The
validator derives its whole park table from `site.json` and these prefixes — there is no list of
parks in any script.

### 5. Write the reference tables

Two files, both required:

```
scripts/reference/universal.mjs            HEIGHTS, PLAUSIBLE_HEIGHTS, DUAL_HEIGHTS, MUST_BE_CLOSED,
                                           MUST_BE_OPEN, QUEUE_ASSIGNMENT, VIRTUAL_QUEUE_ALLOWED,
                                           QUEUE_CLAIMS, SNACK_PRICES, SEASONAL
scripts/reference/universal-seasonal.mjs   EVENTS, WINDOWS, PRICE_BANDS, FOOD_BANDS, NAME_EXCLAMATIONS
```

Copy the shape from `disney.mjs`, then replace every row. **Do not copy the values.** These tables are
the second source of truth the fact checkers assert against; a copied table proves nothing and is
worse than no table, because it reads as verification.

The fact checkers refuse to run without them, on purpose — a dataset checked against nothing is not
checked.

Four of these exports exist specifically because a fact that looks universal usually is not:

| Export | The trap |
|---|---|
| `PLAUSIBLE_HEIGHTS` | A typo detector, not a fact. Disney's restrictions cluster at 32–48in; Universal's coasters run to 54. One shared list would miss real typos on one site and cry wolf on the other |
| `DUAL_HEIGHTS` | Attractions that legitimately carry two minimums because they are two experiences behind one name |
| `VIRTUAL_QUEUE_ALLOWED` | "No attraction permanently uses a virtual queue" is true of Disney and false of Universal. As shared logic that was not a strict check — it was a wrong one. An empty list is a real assertion, and it has to be made rather than assumed |
| `QUEUE_CLAIMS` | What the queue guide must, should, and must not say. Disney's must not call the product Genie+; Universal's must name the Premier hotel tier. Neither fact belongs in a shared checker |

`QUEUE_CLAIMS` takes three lists of `{ re, message }`, matched against the whole page lowercased:
`require` (missing → build fails), `expect` (missing → a note), and `forbid` (present → build fails,
unless an optional `unless` pattern also matches).

**Write the tables before the data, not after.** Written afterwards they are a transcription of what
the dataset already says, and they will agree with it for exactly that reason. Written first they are
a separate draw, and a disagreement is real signal. This matters most when both were produced by the
same process — see the honesty section of `docs/LAUNCH-UNIVERSAL.md` for what a green fact check does
and does not prove in that case.

### 6. Author against the two contracts

`docs/DATA-SCHEMA.md` for the permanent dataset, `docs/SEASONAL-SCHEMA.md` for the dated one. Both
are binding and both are enforced. The prose standards in each are what separate this from the
competition; they are not decoration.

### 7. Build and gate it

```bash
npm run build                  # every live operator
node src/build.mjs universal   # just this one, draft or not
npm run check                  # tests + validators + fact checkers + build + audit
node scripts/audit.mjs universal
```

Every script takes an optional operator slug. With one, it acts on exactly that operator whatever its
status. Without one, it acts on the live operators and prints which drafts it skipped.

While the operator is a draft, run its gate explicitly:

```bash
node scripts/validate.mjs universal && node scripts/factcheck.mjs universal \
  && node src/build.mjs universal && node scripts/audit.mjs universal
```

### 8. Clear the launch gate before flipping `status`

A green fact check means the data is well-formed and does not contradict the reference tables. Whether
that amounts to *verification* depends on where the tables came from, and that is a judgement no
script can make for you. Write the operator's launch document — `docs/LAUNCH-UNIVERSAL.md` is the
worked example — listing what a human must confirm, and say plainly in it what the automated gate does
and does not prove.

Heights first, always. A wrong height is not an inaccuracy; it is a family driving to a park for a
ride their child cannot board. Where one cannot be confirmed, delete it rather than guess: an absent
height renders as "not stated" and sends the reader to the operator, a wrong one sends them to the
park.

### 9. Deploy

One Cloudflare Pages project per operator:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist/<slug>` |
| Node version | 20 or newer |

Free tier, unlimited bandwidth, commercial use permitted. `_headers` and `_redirects` are emitted
into each operator's output already.

---

## What is deliberately not shared between operators

- **Nothing in `data/`.** No shared parks, guides, or reference tables.
- **The food-tracker share order.** Each operator has its own `food-order.json`, append-only within
  that site. Sharing one would mean adding a park to Universal silently corrupting every Disney share
  link ever issued.
- **Search indexes, sitemaps, service workers, manifests.** One per site, per origin.

## What is shared, and must stay shared

`src/lib/`, `src/templates/`, `src/pages/`, `src/seasonal/`, `assets/`, and all four gates. A bug
fixed once is fixed everywhere. The moment a page module needs an `if (operator === …)` branch, the
right move is a data field, not a branch.

## Cross-operator comparison pages

The highest-intent queries in this space compare operators, and with separate domains you have to
decide who owns each one. Each site publishes its own version written from **its own audience's**
angle — a Disney-vs-Universal page on the Disney site is a genuinely different page from the one on
the Universal site, with different framing and a different verdict emphasis.

Written properly that is two legitimate pages. Written lazily it is thin duplicate content across
your own network, which is worse than not having it at all.

Keep inter-site linking light and editorially justified. Contextual links where a reader genuinely
benefits, never reciprocal footer blocks across every domain you own.

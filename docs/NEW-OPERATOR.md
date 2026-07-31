# Onboarding a new operator

Each operator in `data/operators.json` is a complete, independently-branded site on its own domain.
They share this repository's generator, component library, tools, and gates — and nothing else.

Adding one is a content exercise. No file under `src/` should need editing; if one does, that is a
generalisation bug worth fixing rather than working around.

---

## The eight steps

### 1. Register it

`data/operators.json`:

```jsonc
{ "slug": "universal", "name": "Universal Destinations", "dir": "universal", "status": "draft" }
```

`slug` is the build target and the `dist/` subdirectory. `dir` is the data subtree, and defaults to
the slug — they only differ if you want them to.

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
| `resorts[].parks` | **This is the park order.** Nothing else declares it |
| `nav.primary` · `nav.footer` | Validated against the URL set the site actually builds |
| `legal.*` | Five keys, including `affiliateDisclosure` — `affiliateBox()` renders an empty disclosure without it |
| `affiliates` | Same key set the page modules already pass to `affiliateBox()` |

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
scripts/reference/universal.mjs            HEIGHTS, MUST_BE_CLOSED, MUST_BE_OPEN, SNACK_PRICES, SEASONAL
scripts/reference/universal-seasonal.mjs   EVENTS, WINDOWS, PRICE_BANDS, FOOD_BANDS, NAME_EXCLAMATIONS
```

Copy the shape from `disney.mjs`, then replace every row. **Do not copy the values.** These tables are
the second source of truth the fact checkers assert against; a copied table proves nothing and is
worse than no table, because it reads as verification.

The fact checkers refuse to run without them, on purpose — a dataset checked against nothing is not
checked.

### 6. Author against the two contracts

`docs/DATA-SCHEMA.md` for the permanent dataset, `docs/SEASONAL-SCHEMA.md` for the dated one. Both
are binding and both are enforced. The prose standards in each are what separate this from the
competition; they are not decoration.

### 7. Build and gate it

```bash
npm run build              # every operator
node src/build.mjs universal   # just this one
npm run check              # tests + build + audit across everything
node scripts/audit.mjs universal
```

Every script takes an optional operator slug and defaults to all of them.

### 8. Deploy

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

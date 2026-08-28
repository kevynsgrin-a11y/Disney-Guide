# Remediation — round 1

What was fixed from the audit, how each was verified, and two places the audit itself was wrong.

Every issue below was **reproduced before it was touched**: the failing state was demonstrated first,
then the fix, then the same check re-run. Issue numbers refer to Document 2.

---

## Fixed

| # | Issue | Verified by |
|---|---|---|
| 1 | No `Content-Security-Policy` | Absent from the generated `_headers` before; present after. Then served locally **with the header actually applied** and loaded in Chromium across 11 page types (home, park hub, ride detail, map, all three tools, month, legal, event, 404): no CSP violations, no console errors, no failed requests. The hashed inline theme script still executes — a dark-theme reload resolves `data-theme="dark"`, so the hash is accepted rather than silently blocked. |
| 2 | No `Strict-Transport-Security` | Absent before, present after, at a deliberately conservative `max-age=15552000`. **Still open:** the Cloudflare zone-level HSTS toggle is a dashboard setting outside this repository and has not been confirmed. |
| 4 | 13 noindexed URLs listed in `sitemap.xml` | Enumerated all 13 before. Sitemap went 377 → 364 URLs, the 13 are gone, and the pages themselves still build, still carry `noindex,follow`, and are still internally linked. |
| 6 | 5 titles over the site's own 66-character budget | 5 before, 0 after, measured on decoded text. The audit's duplicate-title gate still passes, so shortening did not collide two titles. |
| 10 | Service-worker background revalidation never bypassed the HTTP cache | `cache: 'reload'` now on the runtime fetch, matching what the install path already did. |
| 12 | Six "stale" map plates | **See corrections below — this was a false positive.** The detection was fixed instead. |
| 13 | Light-theme `--accent` failed WCAG AA | 4.31:1 before, 5.60:1 after, computed with the relative-luminance formula. Homepage re-screenshotted: unchanged but for the darker eyebrow. |
| 14 | Height Checker silent to screen readers | No live region before. Now announces, debounced, and observed in a real browser: moving the slider to 44" produced *"44 inches: 106 of 110 rides they can do, 4 still too short."* The ride list deliberately stays **out** of the live region — announcing a hundred-odd items per slider tick would be unusable. |
| 16 | Search results had no `aria-activedescendant` | Absent before. Observed in a real browser: ArrowDown sets it to `search-result-0`, resolving to "Space Mountain". Cleared on re-render and on close. |
| 22 | Nothing regression-tested the FTC disclosure pairing | Added to `scripts/audit.mjs`, then **negative-tested**: breaking the disclosure on a page carrying a sponsored link makes the audit fail with `sponsored link with no affiliate disclosure block`; restoring it passes. |

Two further defects surfaced while fixing the above and were fixed with them:

- **`audit.mjs` sitemap check was unfalsifiable.** It assumed exactly two noindex pages (404, offline)
  and allowed two more of slack — which is precisely why thirteen noindexed editions sat in the
  sitemap without complaint. It now counts noindex pages and compares exactly.
- **`audit.mjs` looked for map geometry at the wrong path** (`data/parks/<slug>/` rather than
  `data/<operator>/parks/<slug>/`), so `existsSync` was always false and the geometry half of the
  freshness comparison never ran.

## Corrections to the audit

1. **The map plates were never stale (#12).** Regenerating produced **byte-identical** PNGs — the
   37 MB of binaries did not change at all. The check compared file mtimes, and git does not preserve
   mtimes, so on any fresh clone (every CI run) all six plates report as stale regardless of content.
   The real defect was the detection, not the images. It now compares a content hash of the rendered
   SVG — which covers both geometry and styling, since the SVG derives from both — recorded in
   `GENERATED.json`. Negative-tested: corrupting a recorded hash fires the note, restoring it clears.
2. **The contrast failure was wider than reported (#13).** `--accent` also failed against its own
   `--accent-soft` background (4.05:1), used for height pills, tracker buttons and search highlights.
   The new value clears both (5.60:1 and 5.26:1).

## Deferred, with reasons

- **#11 (HTML `Cache-Control`) — deliberately not applied.** The fix as written adds `Cache-Control`
  to the `/*` block. Hosts disagree on whether a request collects headers from every matching rule or
  only the most specific one, and `src/build.mjs` says so in a comment explaining why the security
  headers are duplicated onto every rule rather than left to `/*`. Under a merging host, a
  `Cache-Control` on `/*` would land on `/assets/*` alongside its `immutable` one-year rule — two
  conflicting values on the asset paths whose caching currently works. Trading a working asset cache
  for an unset HTML default is the wrong side of that bet without being able to test the live edge.
- **#3 / #27 (photography, and the `og:image` gap it causes)** needs actual image assets and a rights
  decision. Still the highest-leverage item in the audit.
- **#31 (Search Console / Bing submission)** cannot be done or verified from here.
- **#5, #7, #8, #9, #15, #17** are the Longer-term engineering items and were left for a scoped pass.
- **#18–#21, #23–#26, #28–#30** are legal, editorial, or commercial decisions rather than defects.

## Gate

`npm run check` passes end to end: 88/88 unit tests, both validators, both fact checkers, 379 pages
built, `0 problems` from the site audit, and the CI audio-script drift check reports no diff.

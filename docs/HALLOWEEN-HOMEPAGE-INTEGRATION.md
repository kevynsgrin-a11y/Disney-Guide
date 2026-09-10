# Halloween homepage integration

## Implementation summary

The September 2026 homepage now includes a data-driven Halloween spotlight after the park-selection section. The plate carries the configured headline, lede, three dated event links, confirmation pills, and two editorial calls to action. Its content lives in `data/disney/site.json` under `seasonSpotlight`, rather than in a page template, so the next seasonal program can replace the content and expiry date without changing renderer code.

The spotlight retires automatically when `BUILD_MONTH` moves beyond the configured `until` month. The three featured cards are explicitly ordered in the configuration: Halloween Time, Not-So-Scary, and Oogie Boogie Bash. Each card is linked to its existing event page, and its confirmation label is derived from the site’s seasonal freshness data.

## Visual and motion treatment

The seasonal illustration is inline SVG and CSS only. It uses a deep plum scene, a crescent moon, generic bats, amber and violet string lights, a low fence, and non-branded carved pumpkins. Candle-flicker and bat-drift effects run only when the browser does not request reduced motion.

A separate fixed, pointer-inert landing overlay introduces five generic bat silhouettes on a full home-page load. They move around the viewport for roughly three seconds, then expand outward along individual `translate3d` paths to create the near-screen exit. A short amber bolt and radial flash occur only during the exit. The overlay is `aria-hidden`, receives no pointer events or focus, is removed from the DOM after 3.4 seconds, and is not rendered for visitors requesting reduced motion or higher contrast. It is decorative only and does not delay, cover, or disable navigation.

## Dark-only system

The layout is now genuinely dark-only: there is one warm charcoal and dark-green token system, no theme bootstrap, no theme preference storage, and no light-mode or lamp-mode override. The retained forest-green and amber identity was warmed for late-evening reading, and all body, secondary, link, CTA, confirmation, and status pairings were contrast-checked above WCAG AA thresholds.

## Validation record

On 2026-09-09, the production build generated 393 pages successfully. The full test suite passed with 91 tests, and the static home page was inspected in a 885-pixel-wide browser viewport. The spotlight appeared beneath the unchanged park grid with the intended plum plate, three green `CONFIRMED` pills, legible amber CTA, restrained generic night illustration, and all correct destination links. The generated page contains neither `data-theme` markup nor a light/dark theme selector.

# Social card sources

The per-operator Open Graph / Twitter card artwork (1280×672, 1.91:1) lives in
`assets/img/photos/social-card-<brand>-1280.png` and is referenced from each
operator's `site.json → photos.social` (`"ext": "png"`).

These two HTML files are the source of that artwork. They use the operator's
real palette tokens and the site's real display fonts (`../../assets/fonts/`),
so a re-render after a rebrand matches the site exactly.

To regenerate: serve the repo root (e.g. `node scripts/serve.mjs dist/universal`
will not do — the HTML needs the repo root for fonts; any static server at the
repo root works), open a card at a 1280×672 viewport, screenshot, and save as
`assets/img/photos/social-card-<brand>-1280.png`. Then rebuild.

Why per-operator cards: the shared `social-card-1280.jpg` in the same folder is
Ride Ready Guide artwork. Shipping it as the `og:image` on hollywoodrideguide.com
or coasterready.com put the wrong brand in every link preview — fixed 2026-09-19.

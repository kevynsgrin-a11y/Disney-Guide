# Photo credits and provenance

Every file in this directory is recorded here before it ships, per the rights rules in
`README.md` and `docs/ASSET-RUNBOOK.md`.

## hero-fireworks, scene-carousel, scene-coaster, social-card

- **Provenance:** generated in-repo. `scripts/generate-artwork.mjs` draws each scene as SVG
  from geometric primitives (seeded, deterministic) and renders it through headless Chromium;
  `scripts/convert-artwork.py` writes the AVIF/WebP/JPEG sets within the size budgets.
- **Licence:** ours — work for hire produced by this repository's own tooling, first published
  here. No external source material is incorporated.
- **IP position:** the scenes depict generic fairground iconography — a ferris wheel, a striped
  carousel canopy, coaster hills, string lights, food stalls, fireworks — drawn from primitives.
  Nothing is traced from, measured against, or styled after any park operator's artwork, mapping,
  or marketing. No real venue, building, silhouette, character, costume, logo, or ride vehicle
  appears; there is no text or signage in the imagery. The brand lockup on `social-card` uses this
  site's own name and wordmark only.
- **Illustrative, not documentary:** these are atmospheric illustrations, not photographs of any
  real place. They are decorative by construction (empty alt text), and the about page states
  that site imagery is illustrative.
- **Regenerate:** `node scripts/generate-artwork.mjs && python scripts/convert-artwork.py`
  reproduces every file from the seeds in the script. The SVG source is byte-deterministic; the
  Chromium render step is visually identical but not byte-identical across runs (encoder metadata),
  so expect binary churn without visual change when re-rendering.

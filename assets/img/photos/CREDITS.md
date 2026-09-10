# Photo credits and provenance

Every file in this directory is recorded here before it ships, per the rights rules in
`README.md` and `docs/ASSET-RUNBOOK.md`.

## hero-fireworks, scene-carousel, scene-coaster, scene-castle, scene-drop, scene-splash, day-end, social-card, podcast-cover

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

## hero-fairground-fireworks-loop and hero-fairground-fireworks-poster

- **Provenance:** generated for this repository on 2026-09-09 with Manus built-in image generation
  (the named poster) and Veo 3.1 (the motion source). The loop source used that poster as both the
  first and final keyframe, then was retimed to six seconds and encoded as a silent H.264 MP4.
- **Licence:** generated for Ride Ready Guide; no external image, footage, or reference material was
  supplied or incorporated.
- **IP position:** the prompt specifies a generic travelling fairground, a conventional Ferris wheel,
  low unbranded rooflines, string lights, and one restrained gold-and-magenta firework. It excludes
  park-operator characters, logos, wordmarks, ride vehicles, monorails, costumed characters, real
  castles, recognizable architecture, recognizable people, text, watermarks, and three-circle
  arrangements.
- **Use:** the video is decorative and silent. Its named poster supplies first paint and the
  `prefers-reduced-motion` fallback. See `docs/HERO-VIDEO-LOOP.md` for the implementation and loop
  construction details.
- **Re-encode:** the delivered 3,506 KB file was re-encoded in-repo (ffmpeg libx264 CRF 32)
  to 635 KB at identical resolution and frame rate; no generative step was involved or needed.

## halloween-mansion, halloween-costume-night, halloween-treats, halloween-pumpkin-patch

- **Provenance:** generated 2026-09-09 with Google Gemini (Ultra daily quota), from the four
  verbatim briefs in the Halloween launch package's Gemini batch. Converted, sized, and
  measured in-repo; AVIF and WebP land inside the section-scene byte budgets.
- **Licence:** generated for Ride Ready Guide; no external image or reference material
  incorporated. AI-generated media is treated as uncopyrightable and recorded as such.
- **IP position:** each image was inspected against the full guardrail checklist before
  shipping — no park-operator characters, logos, or wordmarks; no licensed costumes; no
  three-circle arrangements in any object; the mansion is a generic storybook Victorian that
  deliberately resembles no real venue; jack-o-lantern faces are conventional triangle
  carvings; all figures anonymous with no identifiable faces; no readable text or branding.
  Inspection verdicts recorded in the September 2026 launch notes: all four PASS.
- **Use:** decorative section imagery for the Halloween season pages.

## universal-studio-backlot, universal-express-lane, universal-food-flatlay, universal-resort-lagoon

- **Provenance:** generated 2026-09-09 with Google Gemini (Ultra daily quota), from the four
  verbatim briefs in the Hollywood Ride Guide launch package's Gemini batch. Converted, sized,
  and measured in-repo; AVIF variants land inside the section-scene byte budgets.
- **Licence:** generated for Hollywood Ride Guide; no external image or reference material
  incorporated. AI-generated media is treated as uncopyrightable and recorded as such.
- **IP position:** each image was generated from generic subject briefs (studio backlot,
  express lane, food flat-lay, resort lagoon) with no reference to any real venue, attraction,
  or licensed property. No park-operator characters, logos, wordmarks, ride vehicles, or
  recognizable architecture. All food shapes conventional. No readable text or branding.
- **Use:** decorative section imagery for the Universal (Hollywood Ride Guide) pages.

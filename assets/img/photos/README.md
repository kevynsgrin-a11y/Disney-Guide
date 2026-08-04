# Photography

Drop generated images here as `<name>-<width>.<ext>`, e.g.:

```
hero-fireworks-640.avif   hero-fireworks-640.webp   hero-fireworks-640.jpg
hero-fireworks-1280.avif  hero-fireworks-1280.webp  hero-fireworks-1280.jpg
hero-fireworks-1920.avif  hero-fireworks-1920.webp  hero-fireworks-1920.jpg
```

The slot is declared in the operator's `site.json` under `photos`, where the alt text and focal
point live — those are editorial decisions and belong with the other authored content.

**Declaring a photo does not make it real.** `src/lib/data.mjs` checks the widest variant against
this directory; if nothing is there, the slot resolves to `null`, the component renders nothing, and
the layout falls back to its unphotographic form. That fallback is deliberate and must stay working:
it is the state the site is in today, and the state it returns to the moment an image is pulled for
a rights problem.

## Budget

- Hero: **120 KB maximum** in AVIF at 1920.
- Everything else: 80 KB.

The home page claims the tools are built to work on park WiFi. A heavy hero makes that claim false,
and the claim does not lose to a nicer photograph.

## Rights

Nothing traced from, or derived from, an official park map or any character. No three-circle
silhouettes in balloons, pretzels, ice cream or topiary. No castle resembling a real park's. See
`docs/LOVABLE-VISUAL-OVERHAUL.md` for the full art-direction brief and the generation prompts.

Record provenance for every file — generator and prompt, or licence and source — in `CREDITS.md`
beside this file before anything ships.

# Hero video loop

## Delivered media

The home-page hero uses `assets/video/hero-fairground-fireworks-loop.mp4`, a **six-second**, **1920 × 1080**, silent H.264 MP4. Its named poster frame is `assets/img/photos/hero-fairground-fireworks-poster.jpg`, also **1920 × 1080**. Both assets depict an original, generic night fairground rather than a real park or venue.

| Asset | Role | Technical details |
| --- | --- | --- |
| `hero-fairground-fireworks-loop.mp4` | Autoplaying decorative hero background | 6.0 seconds; 1920 × 1080; H.264/yuv420p; 30 fps; no audio; MP4 fast-start metadata; **635 KB** after the budget re-encode below |
| `hero-fairground-fireworks-poster.jpg` | First-paint, reduced-motion, and unsupported-video fallback | 1920 × 1080 JPEG; same locked-off composition as the video keyframes |

## How the loop was made seamless

The video was generated from the named poster frame as **both its first and last keyframe**. The direction required a locked camera, unchanged fairground skyline, steady string lights, and a Ferris wheel that moves only imperceptibly. The single gold-and-magenta firework begins in a low-intensity fading state, blooms slowly, and returns to that same fading state at the end. Because the endpoint uses the identical poster composition, the 0:06 → 0:00 cut returns to a closely matching visual state rather than introducing a scene change.

The video generator requires an eight-second source for 1080p keyframe-controlled output. The resulting clip was retimed uniformly to six seconds, with no frame interpolation beyond the constant speed change, then encoded as an H.264 MP4 with fast-start metadata for web delivery. The source carries no audio.

## Website behavior and accessibility

The shared hero component layers the poster beneath the video. The video is decorative, muted, looped, inline, and does not expose playback controls. Under `prefers-reduced-motion: reduce`, the video is hidden and the poster remains visible; the same poster also provides a stable first paint and fallback if video playback is unavailable. The component preserves the dark lower third and the existing contrast scrim for readable hero copy.

## Rights and visual guardrails

The visual was generated specifically for Ride Ready Guide. It intentionally depicts only generic fairground forms: a conventional Ferris wheel, low canvas rooflines, string lights, a deep indigo sky, and one slow firework. It contains no park-operator characters, logos, wordmarks, ride vehicles, monorails, costumed characters, recognizable real people, castles, recognizable architecture, text, watermarks, or three-circle arrangements. The detailed provenance record is in `assets/img/photos/CREDITS.md`.

## Validation record

On 2026-09-09, the generated production file was verified with `ffprobe` as a 6.0-second, 1920 × 1080, 30 fps H.264/yuv420p video with no audio stream. The named poster was verified as a 1920 × 1080 JPEG. A local rendered home-page review confirmed that the hero holds its dark lower-third copy area, the poster and video source paths are emitted, and the readable foreground content remains independent from the decorative media. The site test suite passed 88 of 88 tests, and the full data validation, fact checks, static build, and self-hosted media CSP check completed successfully.

## Budget re-encode (2026-09-09, same day)

The as-delivered file was 3,506 KB — encoded at 4,670 kb/s, far more than dark ambient
content needs, and 2.3× the 1.5 MB ceiling the site's performance promise implies. It was
re-encoded in-repo (ffmpeg, libx264 CRF 32, `preset slower`, full 1920 × 1080, fast-start)
to **635 KB — 5.5× smaller at the same resolution and frame rate**. Frame-level comparison
of the two encodes found no additional banding or artifacting; the re-encode is the shipped
file and the original is preserved nowhere (any CRF 32 re-run of a future loop should
target ≤ 1.5 MB before it is committed).

A data-saver guard was added in the same change: when the browser reports
`navigator.connection.saveData`, the video element is removed and the poster carries the
hero, so a metered connection downloads zero video bytes.

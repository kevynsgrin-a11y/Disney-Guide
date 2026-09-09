# Halloween hero video loop

## Delivered media

The seasonal hero package contains a silent, decorative six-second **1920 × 1080** MP4 loop and a matched **1920 × 1080** JPEG poster frame. The composition is an original generic fairground at Halloween: low amber jack-o-lanterns along a fence, sparse amber and soft-violet string lights, a deep plum-indigo sky, a distant conventional Ferris wheel silhouette, and a small number of distant bats. The lower third remains intentionally dark and quiet for hero copy.

| Asset | Repository path | Role | Technical details |
| --- | --- | --- | --- |
| Video loop | `assets/video/seasonal/hero-halloween-fairground-loop.mp4` | Silent decorative seasonal background for a future Halloween hero state. | 6.0 seconds; 1920 × 1080; H.264/yuv420p; 24 fps; no audio stream; fast-start MP4 metadata. |
| Poster frame | `assets/img/photos/hero-halloween-fairground-poster.jpg` | First-paint, reduced-motion, and unsupported-video fallback for that state. | 1920 × 1080 JPEG. |

## Loop method

The poster composition is used as **both the first and last keyframe** of the video generation. The camera, fence, pumpkin positions, string-light layout, horizon, and Ferris wheel silhouette are locked throughout. The bat movement is specified as one slow, shallow pass that begins and ends offscreen; all lights retain a stable low-intensity glow. The source returns to the identical poster state at its end, so the 0:06 → 0:00 transition does not introduce a framing, object, or lighting discontinuity.

The video provider requires an eight-second source for keyframe-controlled 1080p output. That source is uniformly retimed to six seconds, then encoded as a fast-start, silent H.264 MP4. The poster is resized to the same 1920 × 1080 delivery geometry.

## Visual and IP controls

The prompt permits only generic triangle-eye jack-o-lantern carving and ordinary fairground forms. It prohibits Disney or Universal characters, logos, wordmarks, branded ride vehicles, monorails, operator costuming, real park castles, mansions, recognizable venues, recognizable architecture, text, watermarks, identifiable people, and three-circle arrangements. Any figures remain anonymous distant silhouettes.

## Intended integration

This package is an **asset-only seasonal variant**. It does not replace the currently deployed default fireworks hero or change home-page behavior. If the site later adds a Halloween seasonal state, use the same decorative-video pattern as the existing hero: layer the poster beneath a muted looping `<video>`, hide the video under `prefers-reduced-motion: reduce`, preserve the existing dark copy scrim, and keep the hero image decorative (`alt=""`, media wrapper `aria-hidden="true"`).

## Validation record

On 2026-09-09, `ffprobe` verified the final loop as a 6.0-second, 1920 × 1080, 24 fps H.264/yuv420p MP4 with no audio stream. The named poster was verified as a 1920 × 1080 JPEG. The delivery package contains no source video or source poster intermediates.

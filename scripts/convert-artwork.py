"""Convert the rendered artwork PNGs to the AVIF/WebP/JPEG sets the photo pipeline expects.

Budgets from assets/img/photos/README.md: hero <= 120 KB in AVIF at 1920, everything
else <= 80 KB. Quality knobs step down automatically until the budget is met.

Run: python scripts/convert-artwork.py
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "artwork"
DEST = ROOT / "assets" / "img" / "photos"

# name -> {width: budget_bytes for the avif at that width}
BUDGETS = {
    "hero-fireworks": {1920: 120 * 1024, 1280: 80 * 1024, 640: 40 * 1024},
    "scene-carousel": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
    "scene-coaster": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
    "social-card": {1280: 60 * 1024, 640: 32 * 1024},
    # Apple's podcast artwork ceiling is 500 KB at 1400-3000px square.
    "podcast-cover": {1440: 300 * 1024},
    # Section scenes (runbook batch 4) — same budget band as the park scenes.
    "scene-castle": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
    "scene-drop": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
    "scene-splash": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
    "day-end": {1920: 80 * 1024, 1280: 60 * 1024, 640: 32 * 1024},
}

FORMATS = (
    # ext, Pillow format, starting quality, floor quality
    ("avif", "AVIF", 60, 18),
    ("webp", "WEBP", 78, 30),
    ("jpg", "JPEG", 86, 45),
)


def save_within_budget(img: Image.Image, out: Path, fmt: str, start_q: int, floor_q: int, budget: int) -> Path:
    q = start_q
    while True:
        kwargs = {"quality": q, "optimize": True}
        if fmt == "JPEG":
            kwargs["progressive"] = True
        img.save(out, fmt, **kwargs)
        if out.stat().st_size <= budget or q <= floor_q:
            return out
        q -= 8


def main() -> int:
    DEST.mkdir(parents=True, exist_ok=True)
    failures = []
    for name, widths in BUDGETS.items():
        for width, budget in widths.items():
            src = SRC / f"{name}-{width}.png"
            if not src.exists():
                failures.append(f"missing render: {src}")
                continue
            img = Image.open(src).convert("RGB")
            for ext, fmt, start_q, floor_q in FORMATS:
                out = DEST / f"{name}-{width}.{ext}"
                save_within_budget(img, out, fmt, start_q, floor_q, budget)
                kb = out.stat().st_size / 1024
                flag = "" if out.stat().st_size <= budget else "  OVER BUDGET"
                print(f"{out.name:36s} {kb:8.1f} KB{flag}")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

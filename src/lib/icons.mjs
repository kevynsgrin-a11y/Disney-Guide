/**
 * Per-operator icon generation, at build time, with no dependencies.
 *
 * The house favicon is a hand-drawn SVG mark. It is Disney's brand — forest green, amber R — and
 * copying assets/ wholesale into every operator's dist ships that mark onto every sister domain,
 * which is a brand leak in both directions: a reader who adds hollywoodrideguide.com to a home
 * screen gets another site's logo. An operator that declares a brand.palette gets its own set
 * generated here: the SVG favicon plus the three PNG sizes the manifest and apple-touch-icon
 * reference, drawn from the palette so the icon and the stylesheet can never drift apart.
 *
 * PNGs are encoded by hand (IHDR/IDAT/IEND, one zlib stream, per-row filter 0) because the
 * codebase has no runtime dependencies on purpose. Letterforms are rasterized as stroked
 * segments and an arc — the same shapes the SVG mark draws — under 2x supersampling, which is
 * what keeps the 512px diagonal leg smooth without an anti-aliasing pass.
 */

import { deflateSync } from 'node:zlib'

/** The house mark, unchanged. Disney's favicon and touch icons stay exactly as shipped. */
export const HOUSE_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f3d2e"/>
  <path d="M18 44V20h9.4c5.9 0 9.6 3 9.6 8 0 3.6-2 6.2-5.4 7.3L38 44h-6.3l-5.6-8h-2.3v8H18Zm5.8-12.6h3.2c2.6 0 4.1-1.2 4.1-3.4s-1.5-3.4-4.1-3.4h-3.2v6.8Z" fill="#e9b264"/>
  <path d="M41 44V20h5.8v19h9.2v5H41Z" fill="#faf8f4" opacity=".9"/>
</svg>
`

/**
 * Letterform geometry, on a shared design grid so any two-letter logoMark composes consistently.
 * Each glyph is drawn in a 0–44 × 0–56 local box; the mark places glyphs left to right with a
 * 10-unit gap. Segments carry round caps; bowls are partial arcs. Stroke width is chosen so the
 * mark still resolves at 16px favicon size. A logoMark using a letter not in the alphabet fails
 * the build loudly rather than rendering half a mark.
 */
const GLYPHS = {
  H: { segments: [[10, 0, 10, 56], [34, 0, 34, 56], [10, 28, 34, 28]] },
  R: {
    segments: [[10, 0, 10, 56], [26, 24, 36, 56]],
    arcs: [{ cx: 19, cy: 13, r: 13, a0: -Math.PI / 2, a1: Math.PI / 2 }],
  },
  C: { arcs: [{ cx: 22, cy: 28, r: 17, a0: 0.55, a1: Math.PI * 2 - 0.55 }] },
  G: {
    segments: [[26, 28, 39, 28], [39, 28, 39, 40]],
    arcs: [{ cx: 22, cy: 28, r: 17, a0: -0.35, a1: Math.PI * 2 - 0.55 }],
  },
}
const GLYPH_W = 44
const GLYPH_GAP = 10
const MARK = {
  stroke: 11,
  /** Compose a logoMark ("HR", "CG") into placed segments and arcs on the 128 grid. */
  for (logoMark) {
    const letters = [...(logoMark || '')].filter((ch) => GLYPHS[ch])
    if (logoMark && letters.length !== logoMark.length) {
      throw new Error(`logoMark "${logoMark}" uses a letter with no icon glyph — add it to GLYPHS in src/lib/icons.mjs`)
    }
    if (!letters.length) throw new Error('logoMark is empty — no icon can be drawn')
    const total = letters.length * GLYPH_W + (letters.length - 1) * GLYPH_GAP
    const x0 = (128 - total) / 2
    const y0 = (128 - 56) / 2
    const place = (x, y) => [x0 + x, y0 + y]
    const segments = []
    const arcs = []
    letters.forEach((ch, i) => {
      const ox = i * (GLYPH_W + GLYPH_GAP)
      const glyph = GLYPHS[ch]
      for (const [x1, y1, x2, y2] of glyph.segments || []) {
        segments.push([...place(x1 + ox, y1), ...place(x2 + ox, y2)])
      }
      for (const { cx, cy, r, a0, a1 } of glyph.arcs || []) {
        const [px, py] = place(cx + ox, cy)
        arcs.push({ cx: px, cy: py, r, a0, a1 })
      }
    })
    return { segments, arcs }
  },
}

function strokePath ([x1, y1, x2, y2]) {
  return `M${x1} ${y1}L${x2} ${y2}`
}

function arcPath ({ cx, cy, r, a0, a1 }) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  // large-arc flag: sweep the long way round when the arc exceeds half a circle.
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

export function faviconSvg (site) {
  if (!site?.brand?.palette) return HOUSE_FAVICON
  const { themeColor, palette, logoMark } = site.brand
  const mark = MARK.for(logoMark)
  const paths = mark.segments.map(strokePath).join('')
  const arcs = mark.arcs.map(arcPath).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${themeColor}"/>
  <path d="${paths}${arcs}" fill="none" stroke="${palette.accent2}" stroke-width="${MARK.stroke}" stroke-linecap="round"/>
</svg>
`
}

/* ------------------------------------------------------------------ *
 * PNG encoding
 * ------------------------------------------------------------------ */

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32 (bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk (type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng (size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ *
 * Rasterizer
 * ------------------------------------------------------------------ */

function hexToRgb (hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * Distance from point to segment, and to the bowl arc (only within its angle sweep).
 * A pixel is "on" when its distance to the stroke path is under half the stroke width.
 */
function distanceToSegment (px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function distanceToArc (px, py, { cx, cy, r, a0, a1 }) {
  const d = Math.hypot(px - cx, py - cy)
  if (d === 0) return Infinity
  let a = Math.atan2(py - cy, px - cx)
  // The bowl sweeps the right half-circle; atan2 range and sweep direction differ, so test
  // angular containment with a half-open tolerance rather than a naive min/max.
  const norm = (x) => ((x - a0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const inSweep = norm(a) <= norm(a1)
  return inSweep ? Math.abs(d - r) : Math.min(Math.hypot(px - (cx + r * Math.cos(a0)), py - (cy + r * Math.sin(a0))), Math.hypot(px - (cx + r * Math.cos(a1)), py - (cy + r * Math.sin(a1))))
}

/**
 * The { size, purpose } icons the manifest and apple-touch-icon reference.
 * 'maskable' fills the full square and shrinks the mark into the 80% safe zone, because launchers
 * crop to their own mask; 'any' rounds the field like the SVG favicon does.
 */
export function iconPngs (site) {
  if (!site?.brand?.palette) return []
  const { themeColor, palette, logoMark } = site.brand
  const [fr, fg, fb] = hexToRgb(themeColor)
  const [lr, lg, lb] = hexToRgb(palette.accent2)
  const half = MARK.stroke / 2
  const mark = MARK.for(logoMark)

  return [
    { name: 'icon-180.png', size: 180, purpose: 'any' },
    { name: 'icon-192.png', size: 192, purpose: 'any' },
    { name: 'icon-512.png', size: 512, purpose: 'any' },
    { name: 'icon-maskable.png', size: 512, purpose: 'maskable' },
  ].map(({ name, size, purpose }) => {
    const ss = 2 // supersample factor for smooth diagonals
    const big = size * ss
    const rgba = Buffer.alloc(size * size * 4)
    // Design-grid scale: mark occupies 60% of the canvas for 'any', 46% for maskable safe zone.
    const span = purpose === 'maskable' ? 0.46 : 0.60
    const scale = (big * span) / 128
    const ox = (big - 128 * scale) / 2
    const oy = (big - 128 * scale) / 2
    const radius = purpose === 'maskable' ? 0 : 28 * scale
    const onMark = (x, y) => {
      const gx = (x - ox) / scale, gy = (y - oy) / scale
      if (mark.segments.some((s) => distanceToSegment(gx, gy, s) <= half)) return true
      return mark.arcs.some((a) => distanceToArc(gx, gy, a) <= half)
    }
    const inField = (x, y) => {
      if (!radius) return true
      const cx = Math.min(Math.max(x, radius), big - radius)
      const cy = Math.min(Math.max(y, radius), big - radius)
      return Math.hypot(x - cx, y - cy) <= radius
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let fieldHits = 0, markHits = 0
        for (let sy = 0; sy < ss; sy++) {
          for (let sx = 0; sx < ss; sx++) {
            const px = x * ss + sx + 0.5, py = y * ss + sy + 0.5
            if (inField(px, py)) {
              fieldHits++
              if (onMark(px, py)) markHits++
            }
          }
        }
        const fa = fieldHits / (ss * ss)
        const ma = markHits / (ss * ss)
        const i = (y * size + x) * 4
        if (fa === 0) continue // transparent outside the (rounded) field
        // Source-over: opaque field at coverage fa, then opaque mark at coverage ma on top.
        const outA = ma + fa * (1 - ma)
        rgba[i] = Math.round((lr * ma + fr * fa * (1 - ma)) / outA)
        rgba[i + 1] = Math.round((lg * ma + fg * fa * (1 - ma)) / outA)
        rgba[i + 2] = Math.round((lb * ma + fb * fa * (1 - ma)) / outA)
        rgba[i + 3] = Math.round(outA * 255)
      }
    }
    return { name, buffer: encodePng(size, rgba) }
  })
}

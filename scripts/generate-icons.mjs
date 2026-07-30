/**
 * Generates the PWA icon set as real PNGs, with no image library.
 *
 * The mark is a measuring stick: a vertical amber rule with tick marks against the brand green.
 * It is our own artwork, it reads at 32px, and it says what the site is about.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { deflateSync } from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'img')

const BRAND = [15, 61, 46]
const BRAND_DEEP = [9, 42, 32]
const AMBER = [233, 178, 100]
const PAPER = [250, 248, 244]

/* ---------- PNG encoding ---------- */

function crc32 (buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk (type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function encodePng (width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8    // bit depth
  ihdr[9] = 6    // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------- Drawing ---------- */

function canvas (size) {
  const buf = Buffer.alloc(size * size * 4)
  return {
    size,
    buf,
    px (x, y, [r, g, b], alpha = 1) {
      if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) return
      const i = (y * size + x) * 4
      const a = Math.min(1, alpha)
      buf[i] = Math.round(buf[i] * (1 - a) + r * a)
      buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a)
      buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a)
      buf[i + 3] = Math.max(buf[i + 3], Math.round(255 * a))
    },
  }
}

/** Anti-aliased rounded rectangle via a signed-distance field. */
function roundedRect (c, x0, y0, w, h, radius, color, alpha = 1) {
  const cx = x0 + w / 2
  const cy = y0 + h / 2
  const hw = w / 2 - radius
  const hh = h / 2 - radius
  for (let y = Math.floor(y0) - 2; y < Math.ceil(y0 + h) + 2; y++) {
    for (let x = Math.floor(x0) - 2; x < Math.ceil(x0 + w) + 2; x++) {
      const dx = Math.max(Math.abs(x + 0.5 - cx) - hw, 0)
      const dy = Math.max(Math.abs(y + 0.5 - cy) - hh, 0)
      const dist = Math.hypot(dx, dy) - radius
      const coverage = Math.max(0, Math.min(1, 0.5 - dist))
      if (coverage > 0) c.px(x, y, color, coverage * alpha)
    }
  }
}

function drawIcon (size, { maskable = false } = {}) {
  const c = canvas(size)
  const s = size / 512 // design at 512, scale down
  const inset = maskable ? size * 0.14 : 0
  const plate = size - inset * 2

  // Background plate with a subtle vertical gradient.
  roundedRect(c, inset, inset, plate, plate, maskable ? plate / 2.6 : size * 0.22, BRAND_DEEP)
  for (let y = 0; y < size; y++) {
    const t = Math.max(0, Math.min(1, (y - inset) / plate))
    const blend = [
      Math.round(BRAND[0] + (BRAND_DEEP[0] - BRAND[0]) * t),
      Math.round(BRAND[1] + (BRAND_DEEP[1] - BRAND[1]) * t),
      Math.round(BRAND[2] + (BRAND_DEEP[2] - BRAND[2]) * t),
    ]
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (c.buf[i + 3] > 0) { c.buf[i] = blend[0]; c.buf[i + 1] = blend[1]; c.buf[i + 2] = blend[2] }
    }
  }

  // The measuring stick: an amber vertical rule.
  const stickW = 84 * s
  const stickX = size / 2 - stickW / 2 - 34 * s
  const stickY = inset + plate * 0.16
  const stickH = plate * 0.68
  roundedRect(c, stickX, stickY, stickW, stickH, 14 * s, AMBER)

  // Tick marks cut into the rule, alternating length — reads as a height chart at any size.
  const ticks = 7
  for (let i = 1; i < ticks; i++) {
    const y = stickY + (stickH / ticks) * i
    const long = i % 2 === 0
    const w = long ? stickW * 0.62 : stickW * 0.38
    roundedRect(c, stickX + stickW - w, y - 5 * s, w, 10 * s, 5 * s, BRAND_DEEP)
  }

  // A paper-coloured bar to the right: the person standing against the stick.
  const barW = 62 * s
  const barX = stickX + stickW + 30 * s
  const barTop = stickY + stickH * 0.34
  roundedRect(c, barX, barTop, barW, stickY + stickH - barTop, 16 * s, PAPER, 0.94)
  // Head.
  roundedRect(c, barX + barW * 0.08, barTop - 62 * s, barW * 0.84, barW * 0.84, barW * 0.42, PAPER, 0.94)

  return encodePng(size, size, c.buf)
}

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'icon-192.png'), drawIcon(192))
await writeFile(join(OUT, 'icon-512.png'), drawIcon(512))
await writeFile(join(OUT, 'icon-180.png'), drawIcon(180))
await writeFile(join(OUT, 'icon-maskable.png'), drawIcon(512, { maskable: true }))
console.log('  Wrote icon-192, icon-512, icon-180, icon-maskable to assets/img/')

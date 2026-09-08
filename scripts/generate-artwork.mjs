/**
 * Generates the photographic-layer artwork (hero, park scenes, social card) as SVG,
 * renders it to PNG with the system Chrome via playwright-core, and leaves conversion
 * to AVIF/WebP/JPEG to scripts/convert-artwork.py.
 *
 * Everything is drawn from SVG primitives: generic fairground iconography — a ferris
 * wheel, a striped carousel canopy, coaster hills, string lights. Nothing is traced
 * from or styled after any real park's artwork; no building, silhouette, or shape
 * resembles a real venue; there are no characters, logos, or third-party marks of any
 * kind. The scenes are intentionally generic-by-construction, which is the strongest
 * IP position available: there is nothing here to resemble.
 *
 * Deterministic by seed: two runs on the same commit produce byte-identical SVGs.
 *
 * Run: node scripts/generate-artwork.mjs          (writes build/artwork/*.png)
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'build', 'artwork')

/* ---------- deterministic RNG (mulberry32) -------------------------------- */

function rng (seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- palette -------------------------------------------------------- */

const SKY_TOP = '#060d0b'
const SKY_MID = '#0d211a'
const SKY_LOW = '#1d3a2a'
const HORIZON = '#8a5a1c'
const AMBER = '#e8a13c'
const AMBER_DEEP = '#b06a14'
const CREAM = '#f6e9c9'
const WARM_WHITE = '#fff3d6'
const GREEN = '#1c6b47'
const SILHOUETTE = '#040806'

/* ---------- scene pieces --------------------------------------------------- */

/** A firework burst: bright warm core, radial streaks, sparks, falling trails. */
function burst (x, y, scale, colorA, colorB, rand, opts = {}) {
  const rays = Math.round((opts.rays || 30) * 1)
  const inner = []
  const sparks = []
  const trails = []
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + rand() * 0.06
    const len = (0.62 + rand() * 0.38) * 150 * scale
    const x1 = x + Math.cos(angle) * 14 * scale
    const y1 = y + Math.sin(angle) * 14 * scale
    const x2 = x + Math.cos(angle) * len
    const y2 = y + Math.sin(angle) * len
    const color = rand() > 0.72 ? colorB : colorA
    const width = (1.2 + rand() * 1.9) * scale
    inner.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${width.toFixed(1)}" stroke-linecap="round" opacity="${(0.55 + rand() * 0.45).toFixed(2)}"/>`)
    if (rand() > 0.5) {
      // Gravity droop: sparks that have left the streak and are falling out of it.
      const droop = (14 + rand() * 26) * scale
      trails.push(`<line x1="${x2.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${(x2 + Math.cos(angle) * 6 * scale).toFixed(1)}" y2="${(y2 + droop).toFixed(1)}" stroke="${color}" stroke-width="${(0.9 * scale).toFixed(1)}" stroke-linecap="round" opacity="${(0.25 + rand() * 0.25).toFixed(2)}"/>`)
    }
    if (rand() > 0.55) {
      const t = 0.85 + rand() * 0.25
      sparks.push(`<circle cx="${(x + Math.cos(angle) * len * t).toFixed(1)}" cy="${(y + Math.sin(angle) * len * t).toFixed(1)}" r="${(1.1 + rand() * 1.6) * scale}" fill="${rand() > 0.6 ? WARM_WHITE : colorA}" opacity="${(0.6 + rand() * 0.4).toFixed(2)}"/>`)
    }
  }
  const r = 150 * scale
  return `
  <g>
    <circle cx="${x}" cy="${y}" r="${(r * 1.3).toFixed(0)}" fill="url(#halo-${colorA.slice(1)})" opacity="0.55"/>
    ${inner.join('\n    ')}
    ${trails.join('\n    ')}
    ${sparks.join('\n    ')}
    <circle cx="${x}" cy="${y}" r="${(10 * scale).toFixed(1)}" fill="${WARM_WHITE}"/>
    <circle cx="${x}" cy="${y}" r="${(26 * scale).toFixed(1)}" fill="url(#core)" opacity="0.95"/>
  </g>`
}

/** A ferris wheel silhouette with spokes, cabins, and an A-frame. */
function ferrisWheel (cx, cy, r, rand) {
  const parts = []
  const spokes = 12
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * r).toFixed(1)}" y2="${(cy + Math.sin(a) * r).toFixed(1)}" stroke="${SILHOUETTE}" stroke-width="3"/>`)
  }
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    parts.push(`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py + 14).toFixed(1)}" stroke="${SILHOUETTE}" stroke-width="2.5"/>`)
    parts.push(`<rect x="${(px - 7).toFixed(1)}" y="${(py + 13).toFixed(1)}" width="14" height="11" rx="2.5" fill="${SILHOUETTE}"/>`)
    parts.push(`<circle cx="${px.toFixed(1)}" cy="${(py + 18).toFixed(1)}" r="1.6" fill="${AMBER}" opacity="${(0.5 + rand() * 0.4).toFixed(2)}"/>`)
  }
  const legSpread = r * 0.42
  parts.push(`<path d="M ${(cx - legSpread).toFixed(1)} ${cy + r * 1.35} L ${cx} ${cy} L ${(cx + legSpread).toFixed(1)} ${cy + r * 1.35}" fill="none" stroke="${SILHOUETTE}" stroke-width="7"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${(r * 0.09).toFixed(1)}" fill="${SILHOUETTE}"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="${AMBER}" opacity="0.85"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${SILHOUETTE}" stroke-width="6"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="none" stroke="${SILHOUETTE}" stroke-width="2.5"/>`)
  // A warm rim catching the show light — the arc that makes the circle read as a wheel at a glance.
  parts.push(`<path d="M ${(cx - r * 0.92).toFixed(1)} ${cy - r * 0.38} A ${r} ${r} 0 0 1 ${(cx + r * 0.92).toFixed(1)} ${cy - r * 0.38}" fill="none" stroke="${AMBER}" stroke-width="2.2" opacity="0.4"/>`)
  return parts.join('\n  ')
}

/** Coaster track: a double-ruled hill silhouette with support columns. */
function coaster (baseY, span, rand) {
  const x0 = span[0]
  const x1 = span[1]
  const lift = baseY - 260 - rand() * 60
  const track = `M ${x0} ${baseY}
    C ${x0 + 40} ${baseY}, ${x0 + 55} ${lift + 60}, ${x0 + 90} ${lift}
    C ${x0 + 125} ${lift + 60}, ${x0 + 150} ${baseY - 40}, ${x0 + 210} ${baseY - 20}
    C ${x0 + 265} ${baseY - 5}, ${x0 + 300} ${baseY - 110}, ${x0 + 355} ${baseY - 115}
    C ${x0 + 410} ${baseY - 118}, ${x0 + 440} ${baseY - 20}, ${x0 + 500} ${baseY - 10}
    C ${x0 + 560} ${baseY - 2}, ${x0 + 620} ${baseY - 150}, ${x0 + 680} ${baseY - 145}
    C ${x0 + 735} ${baseY - 140}, ${x0 + 760} ${baseY - 30}, ${x1} ${baseY - 8}`
  const cols = []
  for (let x = x0 + 70; x < x1 - 30; x += 60) {
    const approx = baseY - 40 - Math.abs(Math.sin((x - x0) / 210)) * 150
    cols.push(`<line x1="${x.toFixed(0)}" y1="${approx.toFixed(0)}" x2="${x.toFixed(0)}" y2="${baseY}" stroke="${SILHOUETTE}" stroke-width="3" opacity="0.9"/>`)
  }
  return `${cols.join('\n  ')}
  <path d="${track}" fill="none" stroke="${SILHOUETTE}" stroke-width="9"/>
  <path d="${track}" fill="none" stroke="${SILHOUETTE}" stroke-width="3" opacity="0.6"/>`
}

/** Carousel silhouette: scalloped canopy with a lit trim, flag, poles. */
function carousel (cx, baseY, w, rand) {
  const h = 250
  const top = baseY - h
  const roof = `M ${cx - w} ${top + 90} Q ${cx - w * 0.7} ${top + 20} ${cx} ${top} Q ${cx + w * 0.7} ${top + 20} ${cx + w} ${top + 90}`
  const scallops = []
  const trims = []
  const n = 7
  for (let i = 0; i < n; i++) {
    const sx = cx - w + ((i + 0.5) * (2 * w)) / n
    scallops.push(`<path d="M ${(sx - w / n / 2).toFixed(0)} ${top + 90} q ${(w / n / 2).toFixed(0)} 16 ${(w / n).toFixed(0)} 0" fill="none" stroke="${SILHOUETTE}" stroke-width="3"/>`)
    trims.push(`<path d="M ${(sx - w / n / 2).toFixed(0)} ${top + 90} q ${(w / n / 2).toFixed(0)} 16 ${(w / n).toFixed(0)} 0" fill="none" stroke="${AMBER}" stroke-width="1.4" opacity="0.55"/>`)
  }
  const poles = []
  for (let i = -2; i <= 2; i++) {
    const px = cx + i * (w / 3)
    poles.push(`<line x1="${px.toFixed(0)}" y1="${top + 96}" x2="${px.toFixed(0)}" y2="${baseY}" stroke="${SILHOUETTE}" stroke-width="3.5"/>`)
    poles.push(`<circle cx="${px.toFixed(0)}" cy="${(baseY - 40 - rand() * 30).toFixed(0)}" r="6" fill="${SILHOUETTE}"/>`)
    poles.push(`<circle cx="${px.toFixed(0)}" cy="${(baseY - 40 - rand() * 30).toFixed(0)}" r="2" fill="${AMBER}" opacity="${(0.3 + rand() * 0.35).toFixed(2)}"/>`)
  }
  return `<path d="${roof}" fill="${SILHOUETTE}"/>
  <path d="${roof}" fill="none" stroke="${AMBER}" stroke-width="1.6" opacity="0.4"/>
  <line x1="${cx}" y1="${top}" x2="${cx}" y2="${top - 34}" stroke="${SILHOUETTE}" stroke-width="3.5"/>
  <path d="M ${cx} ${top - 34} l 26 8 l -26 8 z" fill="${SILHOUETTE}"/>
  ${scallops.join('\n  ')}
  ${trims.join('\n  ')}
  ${poles.join('\n  ')}
  <rect x="${cx - w - 8}" y="${top + 88}" width="${2 * w + 16}" height="10" rx="4" fill="${SILHOUETTE}"/>`
}

/** A food-stall silhouette: box body with a scalloped awning, lit counter line. */
function stall (x, baseY, w, h) {
  const awning = []
  const n = 5
  for (let i = 0; i < n; i++) {
    const sx = x + (i * w) / n
    awning.push(`<path d="M ${sx.toFixed(0)} ${baseY - h + 26} q ${(w / n / 2).toFixed(0)} 14 ${(w / n).toFixed(0)} 0" fill="none" stroke="${SILHOUETTE}" stroke-width="4"/>`)
  }
  return `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}" rx="3" fill="${SILHOUETTE}"/>
  <rect x="${x}" y="${baseY - h + 26}" width="${w}" height="7" fill="${SILHOUETTE}"/>
  ${awning.join('')}
  <rect x="${x + w * 0.18}" y="${baseY - h * 0.45}" width="${w * 0.64}" height="4" rx="2" fill="${AMBER}" opacity="0.5"/>
  <line x1="${x - 2}" y1="${baseY - h - 22}" x2="${x + 6}" y2="${baseY - h + 26}" stroke="${SILHOUETTE}" stroke-width="3"/>
  <line x1="${x + w + 2}" y1="${baseY - h - 22}" x2="${x + w - 6}" y2="${baseY - h + 26}" stroke="${SILHOUETTE}" stroke-width="3"/>`
}

/** Tree blobs for the treeline; `tone` picks the far (lighter) or near layer. */
function treeline (baseY, from, to, rand, tone = SILHOUETTE) {
  const parts = []
  for (let x = from; x < to; x += 34 + rand() * 30) {
    const h = 55 + rand() * 70
    const w = 26 + rand() * 22
    parts.push(`<path d="M ${x.toFixed(0)} ${baseY} q ${(-w).toFixed(0)} ${(-h * 0.55).toFixed(0)} 0 ${(-h).toFixed(0)} q ${w.toFixed(0)} ${(h * 0.45).toFixed(0)} 0 ${h.toFixed(0)} z" fill="${tone}"/>`)
  }
  return parts.join('\n  ')
}

/** A catenary string of lights. */
function stringLights (x1, y1, x2, y2, sag, rand) {
  const mx = (x1 + x2) / 2
  const my = Math.max(y1, y2) + sag
  const dots = []
  const n = 14
  for (let i = 1; i < n; i++) {
    const t = i / n
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2
    dots.push(`<circle cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${(2.1 + rand() * 1.1).toFixed(1)}" fill="${rand() > 0.25 ? AMBER : WARM_WHITE}" opacity="${(0.6 + rand() * 0.35).toFixed(2)}"/>`)
  }
  return `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${SILHOUETTE}" stroke-width="1.6" opacity="0.9"/>${dots.join('')}`
}

function stars (w, h, rand, count = 130) {
  const out = []
  for (let i = 0; i < count; i++) {
    const x = rand() * w
    // Sparse over the left third, where hero headline text will sit.
    if (x < w * 0.35 && rand() < 0.65) continue
    const y = rand() * h * 0.62
    out.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.5 + rand() * 1.1).toFixed(2)}" fill="${WARM_WHITE}" opacity="${(0.12 + rand() * 0.5).toFixed(2)}"/>`)
  }
  return out.join('')
}

function skyDefs () {
  return `
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${SKY_TOP}"/>
    <stop offset="0.55" stop-color="${SKY_MID}"/>
    <stop offset="0.82" stop-color="${SKY_LOW}"/>
    <stop offset="1" stop-color="${HORIZON}" stop-opacity="0.55"/>
  </linearGradient>
  <radialGradient id="horizonGlow" cx="0.5" cy="1" r="0.75">
    <stop offset="0" stop-color="${AMBER_DEEP}" stop-opacity="0.5"/>
    <stop offset="0.45" stop-color="${AMBER_DEEP}" stop-opacity="0.14"/>
    <stop offset="1" stop-color="${AMBER_DEEP}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="core">
    <stop offset="0" stop-color="${WARM_WHITE}" stop-opacity="0.95"/>
    <stop offset="0.4" stop-color="${WARM_WHITE}" stop-opacity="0.35"/>
    <stop offset="1" stop-color="${WARM_WHITE}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="halo-e8a13c" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${AMBER}" stop-opacity="0.4"/>
    <stop offset="1" stop-color="${AMBER}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="halo-fff3d6" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${WARM_WHITE}" stop-opacity="0.35"/>
    <stop offset="1" stop-color="${WARM_WHITE}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="halo-1c6b47" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${GREEN}" stop-opacity="0.5"/>
    <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.72">
    <stop offset="0.62" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
  </radialGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="7"/>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0"/>
  </filter>`
}

function page (w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1920 1080">
  <defs>${skyDefs()}</defs>
  ${body}
  <rect width="1920" height="1080" fill="url(#vignette)"/>
  <rect width="1920" height="1080" filter="url(#grain)" opacity="0.045"/>
</svg>`
}

/* ---------- scenes --------------------------------------------------------- */

function sceneHero () {
  const rand = rng(20260908)
  const ground = 930
  const back = 892
  const body = `
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#horizonGlow)"/>
  ${stars(1920, 1080, rand)}
  ${burst(590, 290, 1.05, '#e8a13c', '#fff3d6', rand)}
  ${burst(1330, 200, 0.8, '#fff3d6', '#e8a13c', rand)}
  ${burst(1000, 452, 0.55, '#e8a13c', '#1c6b47', rand)}
  ${stringLights(0, 700, 640, 660, 60, rand)}
  ${stringLights(640, 660, 1280, 672, 54, rand)}
  ${stringLights(1280, 672, 1920, 648, 62, rand)}
  ${treeline(back, 0, 1920, rand, '#0b1712')}
  ${ferrisWheel(1600, 596, 235, rand)}
  ${carousel(430, ground, 185, rand)}
  ${stall(60, ground, 200, 130)}
  ${coaster(ground, [640, 1240], rand)}
  ${treeline(ground, 0, 1920, rand)}
  <rect x="0" y="${ground - 6}" width="1920" height="${1080 - ground + 6}" fill="${SILHOUETTE}"/>
  <ellipse cx="590" cy="290" rx="430" ry="310" fill="url(#halo-e8a13c)" opacity="0.2" filter="url(#soft)"/>`
  return page(1920, 1080, body)
}

function sceneCarousel () {
  const rand = rng(4213)
  const ground = 940
  const back = 900
  const body = `
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#horizonGlow)"/>
  ${stars(1920, 1080, rand, 80)}
  <circle cx="960" cy="1010" r="330" fill="url(#halo-e8a13c)" opacity="0.5" filter="url(#soft)"/>
  ${burst(1600, 240, 0.5, '#fff3d6', '#e8a13c', rand)}
  ${stringLights(60, 560, 940, 600, 50, rand)}
  ${stringLights(980, 600, 1880, 555, 48, rand)}
  ${treeline(back, 0, 1920, rand, '#0b1712')}
  ${ferrisWheel(230, 640, 165, rand)}
  ${carousel(980, ground, 265, rand)}
  ${stall(1620, ground, 210, 140)}
  ${treeline(ground, 0, 1920, rand)}
  <rect x="0" y="${ground - 6}" width="1920" height="${1080 - ground + 6}" fill="${SILHOUETTE}"/>`
  return page(1920, 1080, body)
}

function sceneCoaster () {
  const rand = rng(7719)
  const ground = 955
  const back = 915
  const body = `
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#horizonGlow)"/>
  ${stars(1920, 1080, rand, 90)}
  <circle cx="400" cy="330" r="95" fill="${WARM_WHITE}" opacity="0.85"/>
  <circle cx="400" cy="330" r="150" fill="url(#halo-fff3d6)" opacity="0.5"/>
  ${burst(1500, 250, 0.65, '#e8a13c', '#fff3d6', rand)}
  ${stringLights(0, 690, 700, 640, 46, rand)}
  ${stringLights(1240, 640, 1920, 700, 46, rand)}
  ${treeline(back, 0, 1920, rand, '#0b1712')}
  ${ferrisWheel(1750, 660, 155, rand)}
  ${stall(80, ground, 190, 125)}
  ${coaster(ground, [200, 1520], rand)}
  <path d="M 830 ${ground - 78} l 34 0 l -6 26 l -22 0 z" fill="${SILHOUETTE}"/>
  <line x1="845" y1="${ground - 78}" x2="845" y2="${ground - 150}" stroke="${SILHOUETTE}" stroke-width="2.5"/>
  ${treeline(ground, 0, 1920, rand)}
  <rect x="0" y="${ground - 6}" width="1920" height="${1080 - ground + 6}" fill="${SILHOUETTE}"/>`
  return page(1920, 1080, body)
}

/** Social card: same night language, brand lockup. 1280x672 canvas of its own. */
function sceneSocial () {
  const rand = rng(99117)
  const body = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="672" viewBox="0 0 1280 672">
    <defs>${skyDefs()}</defs>
    <rect width="1280" height="672" fill="url(#sky)"/>
    <rect width="1280" height="672" fill="url(#horizonGlow)"/>
    ${stars(1280, 672, rand, 60)}
    ${burst(1010, 190, 0.85, '#e8a13c', '#fff3d6', rand)}
    ${burst(1150, 400, 0.45, '#fff3d6', '#e8a13c', rand)}
    ${stringLights(0, 560, 620, 520, 34, rand)}
    ${stringLights(660, 522, 1280, 548, 34, rand)}
    ${ferrisWheel(1120, 470, 130, rand)}
    <rect x="0" y="614" width="1280" height="58" fill="${SILHOUETTE}"/>
    ${treeline(616, 0, 1280, rand)}
    <rect x="72" y="196" width="96" height="96" rx="18" fill="#0f3d2e"/>
    <text x="120" y="262" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#f6e9c9" text-anchor="middle" letter-spacing="1">RR</text>
    <text x="196" y="248" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" fill="#faf8f4">Ride Ready Guide</text>
    <text x="198" y="300" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="27" fill="#cfc6b4">Every height, price, and crowd pattern — checked.</text>
    <text x="198" y="345" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="19" fill="#8f9b95" letter-spacing="2">INDEPENDENT &amp; UNOFFICIAL · RIDEREADYGUIDE.COM</text>
    <rect width="1280" height="672" fill="url(#vignette)" opacity="0.8"/>
  </svg>`
  return body
}

/* ---------- render --------------------------------------------------------- */

const SCENES = [
  { name: 'hero-fireworks', svg: sceneHero(), widths: [1920, 1280, 640], ratio: 1080 / 1920 },
  { name: 'scene-carousel', svg: sceneCarousel(), widths: [1920, 1280, 640], ratio: 1080 / 1920 },
  { name: 'scene-coaster', svg: sceneCoaster(), widths: [1920, 1280, 640], ratio: 1080 / 1920 },
  { name: 'social-card', svg: sceneSocial(), widths: [1280, 640], ratio: 672 / 1280 },
]

async function main () {
  await mkdir(OUT, { recursive: true })
  const { chromium } = await import('playwright-core')

  let browser
  try {
    browser = await chromium.launch({ channel: 'chrome' })
  } catch {
    browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
  }

  const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 })
  for (const scene of SCENES) {
    await page.setContent(scene.svg, { waitUntil: 'load' })
    for (const w of scene.widths) {
      const h = Math.round(w * scene.ratio)
      await page.setViewportSize({ width: w, height: h })
      await page.evaluate(() => document.body.setAttribute('style', 'margin:0;overflow:hidden'))
      await page.screenshot({ path: join(OUT, `${scene.name}-${w}.png`), clip: { x: 0, y: 0, width: w, height: h } })
      console.log(`rendered ${scene.name}-${w}.png`)
    }
  }
  await browser.close()
  console.log(`\nPNGs in ${OUT} — now run: python scripts/convert-artwork.py`)
}

main().catch((e) => { console.error(e); process.exit(1) })

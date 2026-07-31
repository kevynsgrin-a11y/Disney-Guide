/**
 * Vintage cartographic styling for the park maps.
 *
 * The look is mid-century illustrated-map convention — aged paper, an inked hairline frame, a
 * compass rose, a ribbon title, warm plate-printed land tints. Every one of those is a generic
 * cartographic device that predates any theme park by a century, drawn here from primitives. None
 * of it is traced from, measured against, or styled after anyone's official park map, and no logo,
 * character, or trademarked venue name appears anywhere in it.
 *
 * Everything is inline SVG: no external assets, no webfonts, no network. It prints, and the print
 * stylesheet drops the filters so a black-and-white printer produces clean flat shapes.
 */

/* Plate-printed land tints: warm, desaturated, and distinguishable in greyscale. */
export const VINTAGE_LAND_COLORS = [
  '#a8c09c', '#dcbe80', '#9fb3cf', '#cfa08c', '#93bcbe',
  '#b9a8c8', '#bccb92', '#d9b58f', '#94b1c9', '#c6a5b6',
]

export const PAPER = '#f2e6cd'
export const PAPER_DEEP = '#e6d5b3'
export const INK = '#3d2f1c'
export const INK_SOFT = '#6b5636'
export const WATER = '#9dbdc9'

/**
 * Filter and gradient definitions. `id` is namespaced per park so several maps can coexist on one
 * page without their filters colliding.
 */
export function vintageDefs (id) {
  return `
    <defs>
      <filter id="${id}-grain" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="11" result="n"/>
        <feColorMatrix in="n" type="saturate" values="0"/>
        <feComponentTransfer result="grain"><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feComposite operator="in" in="grain" in2="SourceGraphic"/>
      </filter>

      <filter id="${id}-ink" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="warp"/>
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>

      <filter id="${id}-ink-soft" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="warp"/>
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>

      <radialGradient id="${id}-vignette" cx="50%" cy="46%" r="72%">
        <stop offset="62%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#5c4526" stop-opacity="0.2"/>
      </radialGradient>

      <pattern id="${id}-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="0.7" opacity="0.16"/>
      </pattern>
    </defs>
  `
}

/** Aged paper: base tone, plate grain, and a vignette that darkens toward the edges. */
export function paperBase (id, vx, vy, vw, vh) {
  return `
    <g class="vmap-paper" aria-hidden="true">
      <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${PAPER}"/>
      <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${PAPER_DEEP}"
            filter="url(#${id}-grain)" opacity="0.38"/>
      <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="url(#${id}-vignette)"/>
    </g>
  `
}

/** Double-ruled frame, inset from the edge, with corner ticks. Pure decoration. */
export function frame (vx, vy, vw, vh) {
  const o = 16
  const i = 26
  const corner = (x, y, dx, dy) => `
    <path d="M${x + dx * 9} ${y} L${x} ${y} L${x} ${y + dy * 9}"
          fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="square"/>`
  return `
    <g class="vmap-frame" aria-hidden="true">
      <rect x="${vx + o}" y="${vy + o}" width="${vw - o * 2}" height="${vh - o * 2}"
            fill="none" stroke="${INK}" stroke-width="2.2"/>
      <rect x="${vx + i}" y="${vy + i}" width="${vw - i * 2}" height="${vh - i * 2}"
            fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.65"/>
      ${corner(vx + i, vy + i, 1, 1)}
      ${corner(vx + vw - i, vy + i, -1, 1)}
      ${corner(vx + i, vy + vh - i, 1, -1)}
      ${corner(vx + vw - i, vy + vh - i, -1, -1)}
    </g>
  `
}

/** Eight-point compass rose. Drawn from primitives, as every printed map since the 1500s has been. */
export function compassRose (cx, cy, r) {
  const pt = (a, len) => {
    const rad = (a - 90) * Math.PI / 180
    return [cx + Math.cos(rad) * len, cy + Math.sin(rad) * len]
  }
  const spike = (a, len, w) => {
    const [tx, ty] = pt(a, len)
    const [lx, ly] = pt(a - 90, w)
    const [rx, ry] = pt(a + 90, w)
    return `${tx.toFixed(1)},${ty.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${cx},${cy} ${rx.toFixed(1)},${ry.toFixed(1)}`
  }
  const minor = [45, 135, 225, 315]
    .map((a) => `<polygon points="${spike(a, r * 0.62, r * 0.1)}" fill="${INK_SOFT}" opacity="0.75"/>`)
    .join('')
  const major = [0, 90, 180, 270]
    .map((a, i) => `<polygon points="${spike(a, r, r * 0.13)}" fill="${i === 0 ? INK : INK_SOFT}"/>`)
    .join('')
  return `
    <g class="vmap-compass" aria-hidden="true">
      <circle cx="${cx}" cy="${cy}" r="${r * 1.28}" fill="${PAPER}" opacity="0.72"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 1.28}" fill="none" stroke="${INK}" stroke-width="1.6"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 1.05}" fill="none" stroke="${INK}" stroke-width="0.6" opacity="0.6"/>
      ${minor}${major}
      <circle cx="${cx}" cy="${cy}" r="${r * 0.09}" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>
      <text class="vmap-compass-letter" x="${cx}" y="${cy - r * 1.28 - 6}">N</text>
      <text class="vmap-compass-letter" x="${cx}" y="${cy + r * 1.28 + 15}">S</text>
      <text class="vmap-compass-letter" x="${cx + r * 1.28 + 10}" y="${cy + 5}">E</text>
      <text class="vmap-compass-letter" x="${cx - r * 1.28 - 10}" y="${cy + 5}">W</text>
    </g>
  `
}

/** Ribbon banner carrying the park name, with tail notches at both ends. */
export function titleRibbon (title, cx, y, width) {
  const h = 46
  const half = width / 2
  const tail = 26
  const x0 = cx - half
  const x1 = cx + half
  const body = `M${x0} ${y} L${x1} ${y} L${x1} ${y + h} L${x0} ${y + h} Z`
  const left = `M${x0} ${y + 5} L${x0 - tail} ${y + 1} L${x0 - tail + 9} ${y + h / 2} L${x0 - tail} ${y + h - 1} L${x0} ${y + h - 5} Z`
  const right = `M${x1} ${y + 5} L${x1 + tail} ${y + 1} L${x1 + tail - 9} ${y + h / 2} L${x1 + tail} ${y + h - 1} L${x1} ${y + h - 5} Z`
  return `
    <g class="vmap-ribbon" aria-hidden="true">
      <path d="${left}" fill="${PAPER_DEEP}" stroke="${INK}" stroke-width="1.4"/>
      <path d="${right}" fill="${PAPER_DEEP}" stroke="${INK}" stroke-width="1.4"/>
      <path d="${body}" fill="${PAPER}" stroke="${INK}" stroke-width="1.8"/>
      <line x1="${x0 + 7}" y1="${y + 6}" x2="${x1 - 7}" y2="${y + 6}" stroke="${INK}" stroke-width="0.7" opacity="0.5"/>
      <line x1="${x0 + 7}" y1="${y + h - 6}" x2="${x1 - 7}" y2="${y + h - 6}" stroke="${INK}" stroke-width="0.7" opacity="0.5"/>
      <text class="vmap-title" x="${cx}" y="${y + h / 2 + 8}">${title}</text>
    </g>
  `
}

/** Small cartouche for the not-to-scale note, bottom-right. */
export function scaleNote (text, x, y, width) {
  return `
    <g class="vmap-note" aria-hidden="true">
      <rect x="${x}" y="${y}" width="${width}" height="30" rx="2"
            fill="${PAPER}" stroke="${INK}" stroke-width="1.2" opacity="0.94"/>
      <text class="vmap-note-text" x="${x + width / 2}" y="${y + 19}">${text}</text>
    </g>
  `
}

/**
 * Styles for the standalone downloadable SVG. The page-embedded map inherits the same rules from
 * main.css; a downloaded file has no stylesheet, so it carries its own.
 */
export const STANDALONE_CSS = `
  .vmap-title { font: 700 30px Georgia, 'Iowan Old Style', 'Times New Roman', serif; fill: #7c2d16;
                text-anchor: middle; letter-spacing: 0.04em; }
  .vmap-compass-letter { font: 700 13px Georgia, serif; fill: #3d2f1c; text-anchor: middle; }
  .vmap-note-text { font: italic 12px Georgia, serif; fill: #6b5636; text-anchor: middle; }
  .land-label { font: 700 20px Georgia, 'Iowan Old Style', 'Times New Roman', serif; fill: #4a3218;
                text-anchor: middle; letter-spacing: 0.08em; font-variant: small-caps;
                paint-order: stroke; stroke: #f2e6cd; stroke-width: 6px; }
  .marker text { font: 600 11px Georgia, serif; fill: #2f2413; text-anchor: middle;
                 paint-order: stroke; stroke: #f2e6cd; stroke-width: 4px; }
  .marker circle { fill: #f2e6cd; stroke: #3d2f1c; stroke-width: 1.8; }
  .marker--headliner circle { fill: #b5722a; stroke: #3d2f1c; }
  .marker--dining circle { fill: #4f7350; stroke: #3d2f1c; }
  .marker--entrance circle { fill: #7c2d16; stroke: #3d2f1c; }
  /* A .marker circle rule outranks .marker-hit on specificity, so fill:none alone would lose and
     the 22-unit hit target would paint over its own caption. opacity is not overridden by it. */
  .marker circle.marker-hit { fill: none; stroke: none; opacity: 0; }
  .ground { fill: #e9dcc0; stroke: #a08a63; stroke-width: 1.6; }
  .land-shape { stroke: #f2e6cd; stroke-width: 2.6; opacity: 0.9; }
  .water { fill: #9dbdc9; opacity: 0.72; }
  .path-line { stroke: #a08a63; stroke-width: 4; fill: none; opacity: 0.6;
               stroke-linecap: round; stroke-dasharray: 1 7; }
`

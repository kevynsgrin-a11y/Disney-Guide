/**
 * Schematic park map renderer.
 *
 * Maps are our own artwork. Geometry is authored from open geographic data and public aerial
 * imagery — where an attraction physically sits is a fact and is not copyrightable. Nothing here
 * is traced from, derived from, or styled after any official park map, and no character or logo
 * artwork appears. The rendered SVG is a "Produced Work" in ODbL terms: we credit OpenStreetMap
 * contributors, and the artwork itself carries no share-alike obligation.
 *
 * Output is plain inline SVG: no runtime library, no tile server, no network requests, prints
 * cleanly in black and white, and works with the network off.
 */

import { html, raw, escapeHtml } from './html.mjs'
import * as V from './map-style.mjs'

/* Warm plate-printed land tints, distinguishable in greyscale so the map survives a mono printer. */
const LAND_COLORS = V.VINTAGE_LAND_COLORS

const pointsAttr = (points) => points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
const round = (n) => Math.round(Number(n) * 10) / 10

function pathD (points) {
  if (!points || points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p[0])} ${round(p[1])}`).join(' ')
}

function centroid (points) {
  let x = 0
  let y = 0
  for (const p of points) { x += p[0]; y += p[1] }
  return [x / points.length, y / points.length]
}

/**
 * Convex hull (Andrew's monotone chain) over every land vertex, pushed outward from its centre.
 *
 * Land polygons are authored with gaps between them so each shape reads as distinct. Against a
 * white page those gaps look like holes in the park; against a ground shape they read as the
 * walkways and plazas they actually are. The hull is derived, not authored, so it stays correct
 * whatever geometry a park supplies.
 */
function groundShape (lands, pad = 26) {
  const pts = lands.flatMap((l) => l.points || [])
  if (pts.length < 3) return null

  const sorted = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (input) => {
    const out = []
    for (const p of input) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  const hull = [...half(sorted), ...half(sorted.slice().reverse())]
  if (hull.length < 3) return null

  const [cx, cy] = centroid(hull)
  return hull.map(([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    return [x + (dx / len) * pad, y + (dy / len) * pad]
  })
}

/**
 * Fallback geometry: a hub-and-spoke schematic derived from the park's declared land order.
 * Honest but generic — used only when a park has no authored map.json yet, and labelled as a
 * layout diagram rather than a map.
 */
function syntheticMap (park) {
  const lands = park.lands || []
  if (!lands.length) return null
  const W = 1000
  const H = 820
  const cx = W / 2
  const cy = H / 2 - 20
  const inner = 120
  const outer = 330
  const step = (Math.PI * 2) / lands.length
  const start = -Math.PI / 2 - step / 2

  const wedge = (i) => {
    const a0 = start + step * i
    const a1 = a0 + step * 0.94
    const pts = []
    for (let t = 0; t <= 1.001; t += 0.125) pts.push([cx + Math.cos(a0 + (a1 - a0) * t) * outer, cy + Math.sin(a0 + (a1 - a0) * t) * outer])
    for (let t = 1; t >= -0.001; t -= 0.25) pts.push([cx + Math.cos(a0 + (a1 - a0) * t) * inner, cy + Math.sin(a0 + (a1 - a0) * t) * inner])
    return pts
  }

  return {
    synthetic: true,
    viewBox: [0, 0, W, H],
    note: 'Layout diagram — relative land positions only, not to scale.',
    lands: lands.map((land, i) => {
      const mid = start + step * i + step / 2
      return {
        slug: land.slug,
        label: land.name,
        points: wedge(i),
        labelAt: [cx + Math.cos(mid) * ((inner + outer) / 2), cy + Math.sin(mid) * ((inner + outer) / 2)],
      }
    }),
    markers: [{ kind: 'entrance', at: [cx, cy + outer + 55], label: 'Main entrance' }],
    paths: [],
    water: [],
  }
}

/** Ray-casting point-in-polygon. Used to keep nudged labels inside their own land. */
function inPolygon ([x, y], points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * Nudge a land label clear of any marker sitting on top of it.
 *
 * Authored `labelAt` coordinates do not know where the markers ended up, so a label and a marker
 * caption occasionally land in the same place. Rather than hand-patching coordinates per park —
 * which only fixes the maps that exist today — the label steps away along whichever vertical
 * direction stays inside its own polygon.
 */
function avoidMarkers (at, land, markers, lineCount) {
  const CLEAR_X = 70
  const span = (lineCount - 1) * 20

  // A multi-line label is drawn from `at.y - span` downward, and each marker carries a caption
  // below its dot. Testing the anchor alone misses the common case where a marker sits between two
  // lines of a wrapped label, so both are treated as bands.
  const hits = (p) => markers.some((m) => {
    if (Math.abs(m.at[0] - p[0]) >= CLEAR_X) return false
    const labelTop = p[1] - span - 16
    const labelBottom = p[1] + 8
    const markerTop = m.at[1] - 10
    const markerBottom = m.at[1] + 34
    return labelTop < markerBottom && markerTop < labelBottom
  })

  if (!hits(at)) return at
  for (const step of [36, -40, 54, -58, 72, -76, 92, -96]) {
    const candidate = [at[0], at[1] + step]
    if (hits(candidate)) continue
    // Both the first and last line have to stay on the land.
    if (!inPolygon([candidate[0], candidate[1] - span], land.points)) continue
    if (!inPolygon(candidate, land.points)) continue
    return candidate
  }
  return at
}

function wrapLabel (text, max = 16) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > max && line) { lines.push(line); line = word }
    else line = (line + ' ' + word).trim()
  }
  if (line) lines.push(line)
  return lines
}

function renderMarker (marker, park, standalone = false) {
  const [x, y] = marker.at
  const kind = marker.kind || 'attraction'
  const radius = kind === 'entrance' ? 9 : kind === 'headliner' ? 8 : 6
  const target = marker.slug
    ? (park.attractionBySlug.get(marker.slug) || park.diningBySlug.get(marker.slug) || null)
    : null
  const label = marker.label || (target ? target.name : '')
  const lines = wrapLabel(label, kind === 'entrance' ? 22 : 18)
  const classes = `marker marker--${kind}`

  const glyph = html`
    <g class="${classes}">
      <circle cx="${round(x)}" cy="${round(y)}" r="${radius}"/>
      ${lines.map((line, i) => html`<text x="${round(x)}" y="${round(y + radius + 12 + i * 11)}">${line}</text>`)}
      ${standalone ? '' : html`<circle class="marker-hit" cx="${round(x)}" cy="${round(y)}" r="22"/>`}
    </g>
  `

  if (target && target.hasPage) {
    return html`<a href="${target.url}" aria-label="${label}">${glyph}</a>`
  }
  return glyph
}

/**
 * @param {object} park  a park record from loadData()
 * @returns {{svg: import('./html.mjs').Raw, synthetic: boolean, note: string}|null}
 */
export function renderParkMap (park, { standalone = false } = {}) {
  const map = park.map || syntheticMap(park)
  if (!map) return null

  const [vx, vy, vw, vh] = map.viewBox || [0, 0, 1000, 820]
  const lands = map.lands || []
  const id = `m-${park.slug}`

  // The vintage plate needs headroom for the ribbon title and footroom for the scale note, so the
  // drawing sits inside a taller canvas than the authored geometry declares.
  const padTop = 92
  const padBottom = 58
  const padSide = 34
  const cx = vx + vw / 2
  const canvas = [vx - padSide, vy - padTop, vw + padSide * 2, vh + padTop + padBottom]

  const svg = html`
    <svg class="parkmap parkmap--vintage" viewBox="${canvas.join(' ')}" role="img"
         aria-label="Illustrated map of ${park.name} showing each land and its main attractions"
         xmlns="http://www.w3.org/2000/svg">
      <title>${park.name} — illustrated park map</title>
      <desc>${map.note || 'Schematic layout of each land and its major attractions. Not to scale.'}</desc>
      ${raw(V.vintageDefs(id))}
      ${standalone ? raw(`<style>${V.STANDALONE_CSS}</style>`) : ''}
      ${raw(V.paperBase(id, canvas[0], canvas[1], canvas[2], canvas[3]))}
      ${raw(V.frame(canvas[0], canvas[1], canvas[2], canvas[3]))}
      ${raw(V.titleRibbon(escapeHtml(park.name), cx, vy - padTop + 30, Math.min(vw * 0.62, 460)))}
      ${raw(V.compassRose(vx + 62, vy - 4, 22))}
      ${raw(V.scaleNote('Not to scale', vx + vw - 132, vy + vh + 14, 132))}

      ${(() => {
        const ground = groundShape(lands)
        return ground ? html`<polygon class="ground" points="${pointsAttr(ground)}" filter="url(#${id}-ink-soft)"/>` : ''
      })()}

      <g class="lands">
        ${lands.map((land, i) => html`
          <polygon class="land-shape" data-land="${land.slug || ''}"
                   points="${pointsAttr(land.points)}"
                   fill="${land.color || LAND_COLORS[i % LAND_COLORS.length]}"
                   filter="url(#${id}-ink)"/>
        `)}
      </g>

      ${(map.water || []).length ? html`
        <g class="waters">
          ${(map.water || []).map((w) => html`<polygon class="water" points="${pointsAttr(w.points)}" filter="url(#${id}-ink-soft)"/>`)}
        </g>` : ''}

      ${(map.paths || []).length ? html`
        <g class="paths">
          ${(map.paths || []).map((p) => html`<path class="path-line" d="${pathD(p.points)}"/>`)}
        </g>` : ''}

      <g class="land-labels">
        ${lands.map((land) => {
          const anchorPoint = land.labelAt || centroid(land.points)
          // Small-caps at 20px is wide, and several lands are narrow. Wrapping early keeps the
          // label inside its own polygon instead of bleeding over a neighbour.
          const lines = wrapLabel(land.label, 13)
          const at = avoidMarkers(anchorPoint, land, map.markers || [], lines.length)
          return html`
            <text class="land-label" x="${round(at[0])}" y="${round(at[1] - (lines.length - 1) * 10)}">
              ${lines.map((line, i) => html`<tspan x="${round(at[0])}" dy="${i === 0 ? 0 : 20}">${line}</tspan>`)}
            </text>
          `
        })}
      </g>

      <g class="markers">
        ${(map.markers || []).map((m) => renderMarker(m, park, standalone))}
      </g>
    </svg>
  `

  return { svg, synthetic: Boolean(map.synthetic), note: map.note || '' }
}

export { LAND_COLORS }
